<?php
/**
 * Validate Voucher API
 * POST api/vouchers/validate.php
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

// Get posted data
$data = json_decode(file_get_contents("php://input"));

if(!empty($data->code) && !empty($data->subtotal)) {
    
    try {
        $query = "SELECT * FROM vouchers 
            WHERE code = :code 
            AND is_active = 1 
            AND (start_date IS NULL OR start_date <= CURDATE())
            AND (end_date IS NULL OR end_date >= CURDATE())
            AND (max_usage IS NULL OR usage_count < max_usage)
            LIMIT 1";
        
        $stmt = $db->prepare($query);
        $code = strtoupper($data->code);
        $stmt->bindParam(":code", $code);
        $stmt->execute();
        
        $voucher = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if($voucher) {
            // Check minimum purchase
            if($data->subtotal < $voucher['min_purchase']) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Minimal belanja Rp' . number_format($voucher['min_purchase'], 0, ',', '.') . ' untuk voucher ini'
                ]);
                exit;
            }
            
            // Calculate discount
            $discount = 0;
            
            if($voucher['type'] === 'percentage') {
                $discount = floor($data->subtotal * $voucher['value'] / 100);
            } else if($voucher['type'] === 'fixed') {
                $discount = $voucher['value'];
            } else if($voucher['type'] === 'free_shipping') {
                $discount = isset($data->shipping_cost) ? $data->shipping_cost : 0;
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'valid' => true,
                'voucher' => [
                    'code' => $voucher['code'],
                    'type' => $voucher['type'],
                    'value' => (float)$voucher['value'],
                    'description' => $voucher['description'],
                    'discount' => $discount
                ]
            ]);
        } else {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'valid' => false,
                'message' => 'Kode voucher tidak valid atau sudah kadaluarsa'
            ]);
        }
        
    } catch(Exception $e) {
        http_response_code(503);
        echo json_encode([
            'success' => false,
            'message' => 'Unable to validate voucher: ' . $e->getMessage()
        ]);
    }
    
} else {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Missing required data (code and subtotal)'
    ]);
}
?>
