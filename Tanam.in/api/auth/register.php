<?php
/**
 * User Registration API
 * POST api/auth/register.php
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

// Start session
session_start();

include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

// Get posted data
$data = json_decode(file_get_contents("php://input"));

// Validate required fields
if(
    !empty($data->email) &&
    !empty($data->password) &&
    !empty($data->name)
) {
    // Validate email format
    if(!filter_var($data->email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Format email tidak valid'
        ]);
        exit;
    }
    
    // Check if email already exists
    $check_query = "SELECT user_id FROM users WHERE email = :email LIMIT 1";
    $check_stmt = $db->prepare($check_query);
    $check_stmt->bindParam(":email", $data->email);
    $check_stmt->execute();
    
    if($check_stmt->rowCount() > 0) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Email sudah terdaftar'
        ]);
        exit;
    }
    
    try {
        // Hash password
        $password_hash = password_hash($data->password, PASSWORD_BCRYPT);
        
        // Insert user
        $query = "INSERT INTO users SET
            email = :email,
            password = :password,
            name = :name,
            phone = :phone,
            address = :address,
            role = 'customer',
            created_at = NOW()";
        
        $stmt = $db->prepare($query);
        
        $stmt->bindParam(":email", $data->email);
        $stmt->bindParam(":password", $password_hash);
        $stmt->bindParam(":name", $data->name);
        
        $phone = isset($data->phone) ? $data->phone : null;
        $address = isset($data->address) ? $data->address : null;
        
        $stmt->bindParam(":phone", $phone);
        $stmt->bindParam(":address", $address);
        
        if($stmt->execute()) {
            $user_id = $db->lastInsertId();
            
            // Auto-login: Set session
            $_SESSION['user_id'] = $user_id;
            $_SESSION['user_email'] = $data->email;
            $_SESSION['role'] = 'customer';
            
            http_response_code(201);
            echo json_encode([
                'success' => true,
                'message' => 'Registrasi berhasil',
                'user' => [
                    'user_id' => $user_id,
                    'email' => $data->email,
                    'name' => $data->name,
                    'phone' => $phone,
                    'role' => 'customer'
                ]
            ]);
        } else {
            throw new Exception('Gagal membuat akun');
        }
        
    } catch(Exception $e) {
        http_response_code(503);
        echo json_encode([
            'success' => false,
            'message' => 'Gagal membuat akun: ' . $e->getMessage()
        ]);
    }
    
} else {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Data tidak lengkap. Email, password, dan nama wajib diisi.'
    ]);
}
?>
