<?php
/**
 * Create Product API
 * POST api/products/create.php
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

session_start();

include_once '../config/database.php';

// Check if user is admin
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
            'message' => 'Akses ditolak. Hanya admin yang boleh menambah produk.'
        ]);
        exit;
    }
}

$database = new Database();
$db = $database->getConnection();

// Check if image file is actual image or fake image
if(isset($_POST["submit"])) {
    // This part is handled below
}

$response = ['success' => false, 'message' => ''];

try {
    // Validate inputs
    if(
        empty($_POST['name']) || 
        empty($_POST['price']) || 
        empty($_POST['category_id'])
    ) {
        throw new Exception("Nama, harga, dan kategori wajib diisi.");
    }

    $name = $_POST['name'];
    $description = isset($_POST['description']) ? $_POST['description'] : '';
    $price = $_POST['price'];
    $stock = isset($_POST['stock']) ? $_POST['stock'] : 0;
    $category_id = $_POST['category_id'];
    
    $image_url = 'assets/img/products/default.jpg'; // Default image

    // Handle Image Upload
    if(isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $target_dir = "../../assets/img/products/";
        
        // Create dir if not exists
        if (!file_exists($target_dir)) {
            mkdir($target_dir, 0777, true);
        }

        $file_extension = strtolower(pathinfo($_FILES["image"]["name"], PATHINFO_EXTENSION));
        $new_filename = uniqid() . '.' . $file_extension;
        $target_file = $target_dir . $new_filename;
        
        // Check file type
        $allowed_types = ['jpg', 'jpeg', 'png', 'webp'];
        if(!in_array($file_extension, $allowed_types)) {
            throw new Exception("Hanya file JPG, JPEG, PNG, & WEBP yang diperbolehkan.");
        }

        // Upload
        if (move_uploaded_file($_FILES["image"]["tmp_name"], $target_file)) {
            $image_url = 'assets/img/products/' . $new_filename;
        } else {
            throw new Exception("Gagal mengupload gambar.");
        }
    }

    // Insert to DB
    $query = "INSERT INTO products SET
        name = :name,
        description = :description,
        price = :price,
        stock = :stock,
        category_id = :category_id,
        image_url = :image_url,
        created_at = NOW()";

    $stmt = $db->prepare($query);

    $stmt->bindParam(":name", $name);
    $stmt->bindParam(":description", $description);
    $stmt->bindParam(":price", $price);
    $stmt->bindParam(":stock", $stock);
    $stmt->bindParam(":category_id", $category_id);
    $stmt->bindParam(":image_url", $image_url);

    if($stmt->execute()) {
        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Produk berhasil ditambahkan.',
            'data' => [
                'id' => $db->lastInsertId(),
                'name' => $name,
                'image_url' => $image_url
            ]
        ]);
    } else {
        throw new Exception("Gagal menyimpan ke database.");
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
