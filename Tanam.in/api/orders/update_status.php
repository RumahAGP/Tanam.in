<?php
/**
 * Update Order Status API
 * PUT api/orders/update_status.php
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: PUT");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

// Get posted data
$data = json_decode(file_get_contents("php://input"));

// Validate
if(!empty($data->order_number) && !empty($data->status)) {
    
    // Validate status
    $valid_statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if(!in_array($data->status, $valid_statuses)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid status. Valid statuses: ' . implode(', ', $valid_statuses)
        ]);
        exit;
    }
    
    try {
        // Start transaction
        $db->beginTransaction();
        
        // Get current order
        $query = "SELECT order_id, status FROM orders WHERE order_number = :order_number";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":order_number", $data->order_number);
        $stmt->execute();
        $order = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if(!$order) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Order not found'
            ]);
            exit;
        }
        
        $old_status = $order['status'];
        $order_id = $order['order_id'];
        
        // Update status
        $update_query = "UPDATE orders SET 
            status = :status,
            updated_at = NOW()";
        
        // If delivered, set delivered_at
        if($data->status === 'delivered') {
            $update_query .= ", delivered_at = NOW()";
        }
        
        $update_query .= " WHERE order_id = :order_id";
        
        $update_stmt = $db->prepare($update_query);
        $update_stmt->bindParam(":status", $data->status);
        $update_stmt->bindParam(":order_id", $order_id);
        
        if($update_stmt->execute()) {
            // Log to history
            $history_query = "INSERT INTO order_status_history 
                (order_id, old_status, new_status, changed_by, notes, created_at) 
                VALUES (:order_id, :old_status, :new_status, :changed_by, :notes, NOW())";
            
            $history_stmt = $db->prepare($history_query);
            $history_stmt->bindParam(":order_id", $order_id);
            $history_stmt->bindParam(":old_status", $old_status);
            $history_stmt->bindParam(":new_status", $data->status);
            
            $changed_by = isset($data->changed_by) ? $data->changed_by : 'System';
            $notes = isset($data->notes) ? $data->notes : null;
            
            $history_stmt->bindParam(":changed_by", $changed_by);
            $history_stmt->bindParam(":notes", $notes);
            $history_stmt->execute();
            
            // Commit
            $db->commit();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Order status updated successfully',
                'old_status' => $old_status,
                'new_status' => $data->status
            ]);
        } else {
            throw new Exception('Failed to update status');
        }
        
    } catch(Exception $e) {
        $db->rollBack();
        
        http_response_code(503);
        echo json_encode([
            'success' => false,
            'message' => 'Unable to update status: ' . $e->getMessage()
        ]);
    }
    
} else {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Missing required data (order_number and status)'
    ]);
}
?>
