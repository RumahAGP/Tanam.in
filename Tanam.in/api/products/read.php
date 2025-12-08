<?php
/**
 * Read Products API
 * GET api/products/read.php
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

header("Access-Control-Allow-Methods: GET");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

// Optional filters
$category_id = isset($_GET['category_id']) ? (int)$_GET['category_id'] : null;
$product_id = isset($_GET['product_id']) ? $_GET['product_id'] : null; // Keep as string
$is_active = isset($_GET['is_active']) ? (int)$_GET['is_active'] : 1;
$search = isset($_GET['search']) ? $_GET['search'] : null;

try {
    $query = "SELECT 
        p.product_id,
        p.name,
        p.description,
        p.price,
        p.stock,
        p.image_url,
        p.is_active,
        c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.category_id
    WHERE p.is_active = :is_active";
    
    if($category_id) {
        $query .= " AND p.category_id = :category_id";
    }
    
    if($product_id) {
        $query .= " AND p.product_id = :product_id";
    }
    
    if($search) {
        $query .= " AND (p.name LIKE :search OR p.description LIKE :search)";
    }
    
    $query .= " ORDER BY p.name ASC";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(":is_active", $is_active, PDO::PARAM_INT);
    
    if($category_id) {
        $stmt->bindParam(":category_id", $category_id, PDO::PARAM_INT);
    }
    
    if($product_id) {
        $stmt->bindParam(":product_id", $product_id); // Allow string ID
    }
    
    if($search) {
        $search_param = "%{$search}%";
        $stmt->bindParam(":search", $search_param);
    }
    
    $stmt->execute();
    
    $products = [];
    while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $products[] = [
            'id' => $row['product_id'],
            'nama' => $row['name'],
            'deskripsi' => $row['description'],
            'harga' => 'Rp' . number_format($row['price'], 0, ',', '.'),
            'harga_raw' => (float)$row['price'],
            'stok' => (int)$row['stock'],
            'gambar' => $row['image_url'],
            'kategori' => $row['category_name']
        ];
    }
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'count' => count($products),
        'data' => $products
    ]);
    
} catch(Exception $e) {
    http_response_code(503);
    echo json_encode([
        'success' => false,
        'message' => 'Unable to read products: ' . $e->getMessage()
    ]);
}
?>
