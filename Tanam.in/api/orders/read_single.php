<?php
/**
 * Read Single Order API
 * GET api/orders/read_single.php?order_number=ORD-20251206-001
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

// Get order number from URL
$order_number = isset($_GET['order_number']) ? $_GET['order_number'] : null;

if(!$order_number) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Order number is required'
    ]);
    exit;
}

try {
    // Get order
    $query = "SELECT * FROM orders WHERE order_number = :order_number LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":order_number", $order_number);
    $stmt->execute();
    
    $order = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if($order) {
        // Get order items
        $items_query = "SELECT * FROM order_items WHERE order_id = :order_id";
        $items_stmt = $db->prepare($items_query);
        $items_stmt->bindParam(":order_id", $order['order_id']);
        $items_stmt->execute();
        
        $items = [];
        while($item = $items_stmt->fetch(PDO::FETCH_ASSOC)) {
            $items[] = [
                'nama' => $item['product_name'],
                'harga' => (float)$item['product_price'],
                'jumlah' => (int)$item['quantity'],
                'catatan' => $item['notes']
            ];
        }
        
        $result = [
            'orderNumber' => $order['order_number'],
            'date' => $order['created_at'],
            'items' => $items,
            'subtotal' => (float)$order['subtotal'],
            'shipping' => [
                'method' => $order['shipping_method'],
                'cost' => (float)$order['shipping_cost']
            ],
            'discount' => (float)$order['discount'],
            'total' => (float)$order['total'],
            'address' => [
                'name' => $order['customer_name'],
                'phone' => $order['customer_phone'],
                'address' => $order['shipping_address'],
                'landmark' => $order['landmark']
            ],
            'distance' => (float)$order['distance_km'],
            'status' => $order['status'],
            'payment_method' => $order['payment_method'],
            'payment_status' => $order['payment_status']
        ];
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => $result
        ]);
    } else {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Order not found'
        ]);
    }
    
} catch(Exception $e) {
    http_response_code(503);
    echo json_encode([
        'success' => false,
        'message' => 'Unable to read order: ' . $e->getMessage()
    ]);
}
?>
