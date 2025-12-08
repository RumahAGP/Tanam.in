<?php
/**
 * User Logout API
 * POST api/auth/logout.php
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

// Start session
session_start();

// Selective Logout
$logout_admin = isset($_GET['role']) && $_GET['role'] === 'admin';

if ($logout_admin) {
    // Logout Admin only
    unset($_SESSION['admin_user_id']);
    unset($_SESSION['admin_email']);
    unset($_SESSION['admin_role']);
} else {
    // Logout Customer only
    unset($_SESSION['user_id']);
    unset($_SESSION['user_email']);
    unset($_SESSION['role']);
}

// Only destroy complete session if both are gone
if (!isset($_SESSION['admin_user_id']) && !isset($_SESSION['user_id'])) {
    session_destroy();
    
    // Clear session cookie
    if (isset($_COOKIE[session_name()])) {
        setcookie(session_name(), '', time()-3600, '/');
    }
}

http_response_code(200);
echo json_encode([
    'success' => true,
    'message' => 'Logout berhasil'
]);
?>
