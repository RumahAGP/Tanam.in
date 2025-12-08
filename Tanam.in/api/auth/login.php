<?php
/**
 * User Login API
 * POST api/auth/login.php
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
if(!empty($data->email) && !empty($data->password)) {
    
    try {
        // Get user by email
        $query = "SELECT user_id, email, password, name, phone, address, role 
                  FROM users 
                  WHERE email = :email AND is_active = 1 
                  LIMIT 1";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(":email", $data->email);
        $stmt->execute();
        
        if($stmt->rowCount() > 0) {
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Verify password
            if(password_verify($data->password, $user['password'])) {
                
                // Update last login
                $update_query = "UPDATE users SET last_login = NOW() WHERE user_id = :user_id";
                $update_stmt = $db->prepare($update_query);
                $update_stmt->bindParam(":user_id", $user['user_id']);
                $update_stmt->execute();
                
                // Set session based on role to allow simultaneous login
                if ($user['role'] === 'admin') {
                    $_SESSION['admin_user_id'] = $user['user_id'];
                    $_SESSION['admin_email'] = $user['email'];
                    $_SESSION['admin_role'] = 'admin';
                } else {
                    $_SESSION['user_id'] = $user['user_id'];
                    $_SESSION['user_email'] = $user['email'];
                    $_SESSION['role'] = 'customer';
                }
                
                // Return user data (without password)
                unset($user['password']);
                
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Login berhasil',
                    'user' => $user
                ]);
            } else {
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'message' => 'Email atau password salah'
                ]);
            }
        }
        
    } catch(Exception $e) {
        http_response_code(503);
        echo json_encode([
            'success' => false,
            'message' => 'Gagal login: ' . $e->getMessage()
        ]);
    }
    
} else {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Email dan password wajib diisi'
    ]);
}
?>
