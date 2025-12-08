<?php
/**
 * Delete Product API
 * DELETE api/products/delete.php
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: DELETE, GET");
header("Access-Control-Allow-Headers: Content-Type");

session_start();

include_once '../config/database.php';

// Check admin authentication
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
            'message' => 'Akses ditolak. Hanya admin yang bisa menghapus produk.'
        ]);
        exit();
    }
}

$database = new Database();
$db = $database->getConnection();

try {
    // Get product_id
    $product_id = isset($_GET['product_id']) ? $_GET['product_id'] : null;
    
    if (empty($product_id)) {
        throw new Exception('Product ID wajib diisi');
    }
    
    // Get product details first (for image deletion)
    $selectQuery = "SELECT image_url FROM products WHERE product_id = :product_id";
    $selectStmt = $db->prepare($selectQuery);
    $selectStmt->bindParam(':product_id', $product_id);
    $selectStmt->execute();
    
    if ($selectStmt->rowCount() == 0) {
        throw new Exception('Produk tidak ditemukan');
    }
    
    $product = $selectStmt->fetch(PDO::FETCH_ASSOC);
    
    // Soft delete: set is_active to FALSE instead of deleting
    $deleteQuery = "UPDATE products SET is_active = FALSE WHERE product_id = :product_id";
    $deleteStmt = $db->prepare($deleteQuery);
    $deleteStmt->bindParam(':product_id', $product_id);
    
    if ($deleteStmt->execute()) {
        // Optionally delete image file (commented out for safety)
        /*
        if (!empty($product['image_url']) && 
            file_exists('../../' . $product['image_url']) &&
            strpos($product['image_url'], 'products/') !== false) {
            @unlink('../../' . $product['image_url']);
        }
        */
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Produk berhasil dihapus'
        ]);
    } else {
        throw new Exception('Gagal menghapus produk');
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
