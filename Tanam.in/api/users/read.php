<?php
/**
 * Read Users API
 * GET api/users/read.php
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

session_start();

// Check if user is admin
if(!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'Akses ditolak. Hanya admin yang boleh melihat data pelanggan.'
    ]);
    exit;
}

include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

try {
    $query = "SELECT user_id, name, email, phone, address, role, is_active, created_at, last_login 
              FROM users 
              ORDER BY created_at DESC";
    
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    $users = [];
    while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $users[] = $row;
    }
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'count' => count($users),
        'data' => $users
    ]);
    
} catch(Exception $e) {
    http_response_code(503);
    echo json_encode([
        'success' => false,
        'message' => 'Gagal mengambil data user: ' . $e->getMessage()
    ]);
}
?>
