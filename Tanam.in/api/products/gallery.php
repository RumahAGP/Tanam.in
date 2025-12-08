<?php
/**
 * Product Gallery API
 * Manage multiple images per product
 * 
 * GET: Retrieve all images for a product
 * POST: Upload new images
 * DELETE: Remove an image
 * PUT: Set image as primary
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, DELETE, PUT");

include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

// GET: Retrieve product images
if ($method === 'GET') {
    $product_id = $_GET['product_id'] ?? null;
    
    if (!$product_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Product ID diperlukan']);
        exit;
    }
    
    try {
        $query = "SELECT * FROM product_images 
                  WHERE product_id = :id 
                  ORDER BY is_primary DESC, sort_order ASC, created_at ASC";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $product_id);
        $stmt->execute();
        
        $images = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'count' => count($images),
            'data' => $images
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

// POST: Upload new images
elseif ($method === 'POST') {
    session_start();
    
    if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Admin only']);
        exit;
    }
    
    $product_id = $_POST['product_id'] ?? null;
    
    if (!$product_id || !isset($_FILES['images'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Data tidak lengkap']);
        exit;
    }
    
    try {
        $uploadDir = '../../assets/img/products/';
        if (!file_exists($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }
        
        $uploaded = [];
        $errors = [];
        
        // ⭐ Check existing photo count - MAX 7 photos per product
        $checkStmt = $db->prepare("SELECT COUNT(*) as count FROM product_images WHERE product_id = :id");
        $checkStmt->execute([':id' => $product_id]);
        $currentCount = $checkStmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        $maxPhotos = 5;
        $remainingSlots = $maxPhotos - $currentCount;
        
        if ($remainingSlots <= 0) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => "Maksimal $maxPhotos foto per produk. Hapus foto lama dulu jika ingin upload baru."
            ]);
            exit;
        }
        
        $isPrimary = ($currentCount == 0); // First photo is primary
        
        foreach ($_FILES['images']['tmp_name'] as $key => $tmp_name) {
            // Check if we've hit the limit
            if (count($uploaded) >= $remainingSlots) {
                $errors[] = "Limit tercapai: maksimal $maxPhotos foto per produk";
                break;
            }
            
            if ($_FILES['images']['error'][$key] === UPLOAD_ERR_OK) {
                $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
                $ext = strtolower(pathinfo($_FILES['images']['name'][$key], PATHINFO_EXTENSION));
                
                if (!in_array($ext, $allowed)) {
                    $errors[] = $_FILES['images']['name'][$key] . ' - format tidak didukung';
                    continue;
                }
                
                $filename = $product_id . '_' . time() . '_' . uniqid() . '.' . $ext;
                $path = $uploadDir . $filename;
                
                if (move_uploaded_file($tmp_name, $path)) {
                    // Standard Gallery Insert
                    // Only set as primary if it's the very first image for this product
                    $isFirst = ($db->query("SELECT count(*) FROM product_images WHERE product_id = '$product_id'")->fetchColumn() == 0);
                    
                    $query = "INSERT INTO product_images (product_id, image_url, is_primary, sort_order) 
                             VALUES (:id, :url, :primary, :order)";
                    $stmt = $db->prepare($query);
                    $stmt->execute([
                        ':id' => $product_id,
                        ':url' => 'assets/img/products/' . $filename,
                        ':primary' => ($isFirst && $key == 0) ? 1 : 0,
                        ':order' => $key
                    ]);
                    
                    $uploaded[] = $filename;
                }
            }
        }
        
        if (count($uploaded) > 0) {
            echo json_encode([
                'success' => true,
                'message' => count($uploaded) . ' foto berhasil diupload',
                'uploaded' => $uploaded,
                'errors' => $errors
            ]);
        } else {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Tidak ada foto yang berhasil diupload',
                'errors' => $errors
            ]);
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

// DELETE: Remove an image
elseif ($method === 'DELETE') {
    session_start();
    
    if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Admin only']);
        exit;
    }
    
    $image_id = $_GET['image_id'] ?? null;
    
    if (!$image_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Image ID diperlukan']);
        exit;
    }
    
    try {
        // Get image info
        $query = "SELECT * FROM product_images WHERE image_id = :id";
        $stmt = $db->prepare($query);
        $stmt->execute([':id' => $image_id]);
        $image = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$image) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Foto tidak ditemukan']);
            exit;
        }
        
        // Delete from DB
        $query = "DELETE FROM product_images WHERE image_id = :id";
        $stmt = $db->prepare($query);
        $stmt->execute([':id' => $image_id]);
        
        // Delete file
        $filePath = '../../' . $image['image_url'];
        if (file_exists($filePath)) {
            @unlink($filePath);
        }
        
        // If this was primary, set another image as primary
        if ($image['is_primary']) {
            $query = "UPDATE product_images 
                     SET is_primary = TRUE 
                     WHERE product_id = :pid 
                     ORDER BY sort_order ASC 
                     LIMIT 1";
            $stmt = $db->prepare($query);
            $stmt->execute([':pid' => $image['product_id']]);
        }
        
        echo json_encode(['success' => true, 'message' => 'Foto berhasil dihapus']);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

// PUT: Set image as primary
elseif ($method === 'PUT') {
    session_start();
    
    if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Admin only']);
        exit;
    }
    
    parse_str(file_get_contents("php://input"), $data);
    $image_id = $data['image_id'] ?? null;
    
    if (!$image_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Image ID diperlukan']);
        exit;
    }
    
    try {
        // Get product_id
        $query = "SELECT product_id FROM product_images WHERE image_id = :id";
        $stmt = $db->prepare($query);
        $stmt->execute([':id' => $image_id]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$result) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Foto tidak ditemukan']);
            exit;
        }
        
        $product_id = $result['product_id'];
        
        // Unset all primary
        $query = "UPDATE product_images SET is_primary = FALSE WHERE product_id = :pid";
        $stmt = $db->prepare($query);
        $stmt->execute([':pid' => $product_id]);
        
        // Set new primary
        $query = "UPDATE product_images SET is_primary = TRUE WHERE image_id = :id";
        $stmt = $db->prepare($query);
        $stmt->execute([':id' => $image_id]);
        
        // ⭐ SYNC TO MAIN PRODUCT TABLE ⭐
        // Get the new primary image URL
        $query = "SELECT image_url FROM product_images WHERE image_id = :id";
        $stmt = $db->prepare($query);
        $stmt->execute([':id' => $image_id]);
        $image = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($image) {
            $updateQuery = "UPDATE products SET image_url = :url WHERE product_id = :pid";
            $updateStmt = $db->prepare($updateQuery);
            $updateStmt->execute([
                ':url' => $image['image_url'], // e.g. assets/img/products/file.jpg
                ':pid' => $product_id
            ]);
        }
        
        echo json_encode(['success' => true, 'message' => 'Foto utama berhasil diubah']);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?>
