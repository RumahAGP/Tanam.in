<?php
/**
 * Update Product API
 * PUT/POST api/products/update.php
 * Supports: description update, image upload, and gallery uploads
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, PUT");
header("Access-Control-Allow-Headers: Content-Type");

session_start();

include_once '../config/database.php';

// Check admin authentication
if (!isset($_SESSION['admin_user_id']) || 
    (!isset($_SESSION['admin_role']) && !isset($_SESSION['role'])) || 
    (isset($_SESSION['admin_role']) && $_SESSION['admin_role'] !== 'admin')) {
    
    // Fallback: Check if it's the old session style (just in case)
    $isAdmin = (isset($_SESSION['role']) && $_SESSION['role'] === 'admin');
    
    if (!$isAdmin) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'message' => 'Akses ditolak. Hanya admin yang bisa mengupdate produk.'
        ]);
        exit();
    }
}

$database = new Database();
$db = $database->getConnection();

try {
    // Get product_id from POST or query string
    $product_id = isset($_POST['product_id']) ? $_POST['product_id'] : (isset($_GET['product_id']) ? $_GET['product_id'] : null);
    
    if (empty($product_id)) {
        throw new Exception('Product ID wajib diisi');
    }
    
    // Check if product exists
    $checkQuery = "SELECT * FROM products WHERE product_id = :product_id";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':product_id', $product_id);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() == 0) {
        throw new Exception('Produk tidak ditemukan');
    }
    
    $existingProduct = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    // Build update query dynamically based on provided fields
    $updateFields = [];
    $params = [':product_id' => $product_id];
    
    // Name
    if (isset($_POST['name']) && !empty($_POST['name'])) {
        $updateFields[] = "name = :name";
        $params[':name'] = trim($_POST['name']);
    }
    
    // Description
    if (isset($_POST['description'])) {
        $updateFields[] = "description = :description";
        $params[':description'] = trim($_POST['description']);
    }
    
    // Category
    if (isset($_POST['category_id']) && !empty($_POST['category_id'])) {
        $updateFields[] = "category_id = :category_id";
        $params[':category_id'] = intval($_POST['category_id']);
    }
    
    // Price
    if (isset($_POST['price']) && !empty($_POST['price'])) {
        $updateFields[] = "price = :price";
        $params[':price'] = floatval($_POST['price']);
    }
    
    // Stock
    if (isset($_POST['stock'])) {
        $updateFields[] = "stock = :stock";
        $params[':stock'] = intval($_POST['stock']);
    }
    
    // Handle image upload (Main Cover)
    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        $filename = $_FILES['image']['name'];
        $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        
        if (!in_array($ext, $allowed)) {
            throw new Exception('Format gambar tidak didukung. Gunakan: jpg, jpeg, png, gif, webp');
        }
        
        // Create uploads directory if not exists
        $uploadDir = '../../assets/img/products/';
        if (!file_exists($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }
        
        // Generate unique filename
        $newFilename = $product_id . '_' . time() . '.' . $ext;
        $uploadPath = $uploadDir . $newFilename;
        
        if (move_uploaded_file($_FILES['image']['tmp_name'], $uploadPath)) {
            // Delete old image if exists and not default
            if (!empty($existingProduct['image_url']) && 
                file_exists('../../' . $existingProduct['image_url']) &&
                strpos($existingProduct['image_url'], 'products/') !== false) {
                @unlink('../../' . $existingProduct['image_url']);
            }
            
            $updateFields[] = "image_url = :image_url";
            $params[':image_url'] = 'assets/img/products/' . $newFilename;
        } else {
            throw new Exception('Gagal mengupload gambar');
        }
    }

    // ⭐ Handle Gallery Images Upload (Multi-file)
    if (isset($_FILES['images'])) {
        $uploadDir = '../../assets/img/products/';
        if (!file_exists($uploadDir)) mkdir($uploadDir, 0777, true);
        
        foreach ($_FILES['images']['tmp_name'] as $key => $tmp_name) {
            if ($_FILES['images']['error'][$key] === UPLOAD_ERR_OK) {
                $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
                $chkName = $_FILES['images']['name'][$key];
                $ext = strtolower(pathinfo($chkName, PATHINFO_EXTENSION));
                
                if (in_array($ext, $allowed)) {
                    $filename = $product_id . '_' . time() . '_' . uniqid() . '.' . $ext;
                    $path = $uploadDir . $filename;
                    
                    if (move_uploaded_file($tmp_name, $path)) {
                        // Insert into product_images
                        $galQuery = "INSERT INTO product_images (product_id, image_url, sort_order) VALUES (:pid, :url, :order)";
                        $galStmt = $db->prepare($galQuery);
                        $galStmt->execute([
                            ':pid' => $product_id,
                            ':url' => 'assets/img/products/' . $filename,
                            ':order' => $key
                        ]);
                    }
                }
            }
        }
    }
    
    // Add updated_at
    $updateFields[] = "updated_at = NOW()";
    
    if (empty($updateFields) && !isset($_FILES['images'])) {
        // If only updating images there might be no fields, which is okay if images were processed
    } elseif (empty($updateFields)) {
         // throw new Exception('Tidak ada data yang diupdate');
         // Use dummy update to update timestamp
         $updateFields[] = "updated_at = NOW()";
    }
    
    // Execute update if there are fields (Main Product Table)
    if (!empty($updateFields)) {
        $updateQuery = "UPDATE products SET " . implode(', ', $updateFields) . " WHERE product_id = :product_id";
        $updateStmt = $db->prepare($updateQuery);
        
        foreach ($params as $key => $value) {
            $updateStmt->bindValue($key, $value);
        }
        
        $updateStmt->execute();
    }

    // Get updated product
    $selectQuery = "SELECT p.*, c.name as category_name 
                   FROM products p 
                   LEFT JOIN categories c ON p.category_id = c.category_id 
                   WHERE p.product_id = :product_id";
    $selectStmt = $db->prepare($selectQuery);
    $selectStmt->bindParam(':product_id', $product_id);
    $selectStmt->execute();
    
    $updatedProduct = $selectStmt->fetch(PDO::FETCH_ASSOC);
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Produk berhasil diupdate',
        'data' => $updatedProduct
    ]);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
