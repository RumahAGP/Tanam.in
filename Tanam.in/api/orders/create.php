<?php
/**
 * Create Order API
 * POST api/orders/create.php
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';

// Get database connection
$database = new Database();
$db = $database->getConnection();

// Get posted data
$data = json_decode(file_get_contents("php://input"));

// DEBUG: Log incoming order
$log_file = "../debug_orders.log";
$log_msg = "[" . date('Y-m-d H:i:s') . "] Incoming Order: " . json_encode($data) . "\n";
file_put_contents($log_file, $log_msg, FILE_APPEND);

// Validate required fields
if(
    !empty($data->orderNumber) &&
    !empty($data->items) &&
    !empty($data->address->name) &&
    !empty($data->address->address) &&
    !empty($data->shipping->method) &&
    isset($data->total)
) {
    try {
        // Prevent negative total
        if ($data->total < 0) {
            $data->total = 0;
        }

        // Start transaction
        $db->beginTransaction();
        
        // Insert order
        $query = "INSERT INTO orders SET
            order_number = :order_number,
            customer_name = :customer_name,
            customer_phone = :customer_phone,
            shipping_address = :shipping_address,
            landmark = :landmark,
            latitude = :latitude,
            longitude = :longitude,
            distance_km = :distance_km,
            subtotal = :subtotal,
            shipping_method = :shipping_method,
            shipping_cost = :shipping_cost,
            discount = :discount,
            voucher_code = :voucher_code,
            total = :total,
            payment_method = :payment_method,
            status = 'pending',
            created_at = NOW()";
        
        $stmt = $db->prepare($query);
        
        // Bind values
        $stmt->bindParam(":order_number", $data->orderNumber);
        $stmt->bindParam(":customer_name", $data->address->name);
        $stmt->bindParam(":customer_phone", $data->address->phone);
        $stmt->bindParam(":shipping_address", $data->address->address);
        $stmt->bindParam(":landmark", $data->address->landmark);
        $stmt->bindParam(":latitude", $data->address->latitude);
        $stmt->bindParam(":longitude", $data->address->longitude);
        $stmt->bindParam(":distance_km", $data->distance);
        $stmt->bindParam(":subtotal", $data->subtotal);
        $stmt->bindParam(":shipping_method", $data->shipping->method);
        $stmt->bindParam(":shipping_cost", $data->shipping->cost);
        $stmt->bindParam(":discount", $data->discount);
        $stmt->bindParam(":voucher_code", $data->voucherCode);
        $stmt->bindParam(":total", $data->total);
        $stmt->bindParam(":payment_method", $data->paymentMethod);
        
        // Execute order insert
        if($stmt->execute()) {
            $order_id = $db->lastInsertId();
            
            // Insert order items
            $item_query = "INSERT INTO order_items 
                (order_id, product_id, product_name, product_price, quantity, subtotal, notes) 
                VALUES (:order_id, :product_id, :product_name, :product_price, :quantity, :subtotal, :notes)";
            
            $item_stmt = $db->prepare($item_query);
            
            foreach($data->items as $item) {
                // Ensure product_id is not null if possible, or handle checking exists
                $item_stmt->bindParam(":order_id", $order_id);
                $item_stmt->bindParam(":product_id", $item->product_id);
                $item_stmt->bindParam(":product_name", $item->nama);
                $item_stmt->bindParam(":product_price", $item->harga);
                $item_stmt->bindParam(":quantity", $item->jumlah);
                
                $item_subtotal = $item->harga * $item->jumlah;
                $item_stmt->bindParam(":subtotal", $item_subtotal);
                $item_stmt->bindParam(":notes", $item->catatan);
                
                $item_stmt->execute();
            }
            
            // Update voucher usage if applicable
            if(!empty($data->voucherCode)) {
                $voucher_query = "UPDATE vouchers SET usage_count = usage_count + 1 WHERE code = :code";
                $voucher_stmt = $db->prepare($voucher_query);
                $voucher_stmt->bindParam(":code", $data->voucherCode);
                $voucher_stmt->execute();
            }
            
            // Commit transaction
            $db->commit();
            
            $log_msg = "[" . date('Y-m-d H:i:s') . "] Order CREATED: " . $data->orderNumber . "\n";
            file_put_contents($log_file, $log_msg, FILE_APPEND);
            
            // Return success
            http_response_code(201);
            echo json_encode([
                'success' => true,
                'message' => 'Order created successfully',
                'order_id' => $order_id,
                'order_number' => $data->orderNumber
            ]);
        } else {
            throw new Exception('Failed to create order');
        }
        
    } catch(Exception $e) {
        // Rollback on error
        if ($db->inTransaction()) $db->rollBack();
        
        $error_msg = "[" . date('Y-m-d H:i:s') . "] Error creating order: " . $e->getMessage() . "\n";
        file_put_contents($log_file, $error_msg, FILE_APPEND);
        
        http_response_code(503);
        echo json_encode([
            'success' => false,
            'message' => 'Unable to create order: ' . $e->getMessage()
        ]);
    }
    
} else {
    // Missing required fields
    $log_msg = "[" . date('Y-m-d H:i:s') . "] Missing required fields\n";
    file_put_contents($log_file, $log_msg, FILE_APPEND);
    
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Unable to create order. Missing required data.'
    ]);
}
?>
