<?php
/**
 * Read Orders API
 * GET api/orders/read.php
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

// Optional filters
$customer_name = isset($_GET['customer_name']) ? $_GET['customer_name'] : null;
$status = isset($_GET['status']) ? $_GET['status'] : null;
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
$offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

try {
    // Build query
    $query = "SELECT 
        o.order_id,
        o.order_number,
        o.customer_name,
        o.customer_phone,
        o.shipping_address,
        o.landmark,
        o.distance_km,
        o.subtotal,
        o.shipping_method,
        o.shipping_cost,
        o.discount,
        o.voucher_code,
        o.total,
        o.payment_method,
        o.payment_status,
        o.status,
        o.created_at,
        o.updated_at,
        COUNT(oi.order_item_id) as total_items
    FROM orders o
    LEFT JOIN order_items oi ON o.order_id = oi.order_id
    WHERE 1=1";
    
    // Add filters
    if($customer_name) {
        $query .= " AND o.customer_name LIKE :customer_name";
    }
    if($status) {
        $query .= " AND o.status = :status";
    }
    
    $query .= " GROUP BY o.order_id ORDER BY o.created_at DESC LIMIT :limit OFFSET :offset";
    
    $stmt = $db->prepare($query);
    
    // Bind parameters
    if($customer_name) {
        $customer_name_param = "%{$customer_name}%";
        $stmt->bindParam(":customer_name", $customer_name_param);
    }
    if($status) {
        $stmt->bindParam(":status", $status);
    }
    $stmt->bindParam(":limit", $limit, PDO::PARAM_INT);
    $stmt->bindParam(":offset", $offset, PDO::PARAM_INT);
    
    $stmt->execute();
    
    $orders = [];
    while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        // Get order items
        $items_query = "SELECT * FROM order_items WHERE order_id = :order_id";
        $items_stmt = $db->prepare($items_query);
        $items_stmt->bindParam(":order_id", $row['order_id']);
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
        
        $orders[] = [
            'orderNumber' => $row['order_number'],
            'date' => $row['created_at'],
            'items' => $items,
            'subtotal' => (float)$row['subtotal'],
            'shipping' => [
                'method' => $row['shipping_method'],
                'cost' => (float)$row['shipping_cost']
            ],
            'discount' => (float)$row['discount'],
            'total' => (float)$row['total'],
            'address' => [
                'name' => $row['customer_name'],
                'phone' => $row['customer_phone'],
                'address' => $row['shipping_address'],
                'landmark' => $row['landmark']
            ],
            'distance' => (float)$row['distance_km'],
            'status' => $row['status'],
            'payment_method' => $row['payment_method'],
            'payment_status' => $row['payment_status']
        ];
    }
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'count' => count($orders),
        'data' => $orders
    ]);
    
} catch(Exception $e) {
    http_response_code(503);
    echo json_encode([
        'success' => false,
        'message' => 'Unable to read orders: ' . $e->getMessage()
    ]);
}
?>
