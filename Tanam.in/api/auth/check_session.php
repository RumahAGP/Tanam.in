<?php
/**
 * Check Session API
 * GET api/auth/check_session.php
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

// Start session
session_start();

// Check role parameter
$is_checking_admin = isset($_GET['role']) && $_GET['role'] === 'admin';

// Determine which session key to check
$session_id_key = $is_checking_admin ? 'admin_user_id' : 'user_id';
$session_email_key = $is_checking_admin ? 'admin_email' : 'user_email';

// Check if user is logged in
if(isset($_SESSION[$session_id_key])) {
    
    include_once '../config/database.php';
    
    $database = new Database();
    $db = $database->getConnection();
    
    try {
        // Get fresh user data
        $query = "SELECT user_id, email, name, phone, address, role 
                  FROM users 
                  WHERE user_id = :user_id AND is_active = 1 
                  LIMIT 1";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(":user_id", $_SESSION[$session_id_key]);
        $stmt->execute();
        
        if($stmt->rowCount() > 0) {
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // STRICT ROLE CHECK (Fixes "Admin appears on Customer page" issue)
            if ($is_checking_admin && $user['role'] !== 'admin') {
                // We expected Admin, but got something else. Invalid.
                unset($_SESSION['admin_user_id']);
                http_response_code(200);
                echo json_encode(['success' => true, 'logged_in' => false, 'user' => null]);
                exit();
            }
            
            if (!$is_checking_admin && $user['role'] !== 'customer') {
                // We expected Customer, but got (likely) Admin data in user_id slot. Invalid.
                unset($_SESSION['user_id']);
                http_response_code(200);
                echo json_encode(['success' => true, 'logged_in' => false, 'user' => null]);
                exit();
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'logged_in' => true,
                'user' => $user
            ]);
        } else {
            // User not found or deactivated - clear specific session
            if ($is_checking_admin) {
                unset($_SESSION['admin_user_id']);
                unset($_SESSION['admin_email']);
                unset($_SESSION['admin_role']);
            } else {
                unset($_SESSION['user_id']);
                unset($_SESSION['user_email']);
                unset($_SESSION['role']);
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'logged_in' => false,
                'user' => null
            ]);
        }
        
    } catch(Exception $e) {
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'logged_in' => false,
            'user' => null
        ]);
    }
    
} else {
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'logged_in' => false,
        'user' => null
    ]);
}
?>
