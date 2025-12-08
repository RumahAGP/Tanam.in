# BenihKu API Documentation

## API Endpoints yang Tersedia

Base URL: `http://localhost/BenihKu/Tanam.in/api/`

---

## 📦 Orders API

### 1. Create Order
**Endpoint:** `POST /api/orders/create.php`

**Request Body:**
```json
{
    "orderNumber": "ORD-20251206-123",
    "items": [
        {
            "product_id": 1,
            "nama": "Benih Cabai Rawit",
            "harga": 5000,
            "jumlah": 2,
            "catatan": "Bungkus rapi"
        }
    ],
    "address": {
        "name": "Galih Setiawan",
        "phone": "08123456789",
        "address": "Jl. Pamulang No.10",
        "landmark": "Dekat Warung Seblak",
        "latitude": -6.346286,
        "longitude": 106.691763
    },
    "subtotal": 100000,
    "shipping": {
        "method": "express",
        "cost": 11000
    },
    "discount": 10000,
    "voucherCode": "BENIH10",
    "total": 101000,
    "distance": 5.2,
    "paymentMethod": "cod"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Order created successfully",
    "order_id": 1,
    "order_number": "ORD-20251206-123"
}
```

---

### 2. Read Orders
**Endpoint:** `GET /api/orders/read.php`

**Query Parameters:**
- `customer_name` (optional): Filter by customer name
- `status` (optional): Filter by status (pending/processing/shipped/delivered/cancelled)
- `limit` (optional): Limit results (default: 100)
- `offset` (optional): Offset for pagination (default: 0)

**Example:**
```
GET /api/orders/read.php?status=pending&limit=10
```

**Response:**
```json
{
    "success": true,
    "count": 5,
    "data": [
        {
            "orderNumber": "ORD-20251206-123",
            "date": "2025-12-06 17:30:00",
            "items": [...],
            "subtotal": 100000,
            "shipping": {...},
            "total": 101000,
            "status": "pending"
        }
    ]
}
```

---

### 3. Read Single Order
**Endpoint:** `GET /api/orders/read_single.php?order_number=ORD-20251206-123`

**Response:**
```json
{
    "success": true,
    "data": {
        "orderNumber": "ORD-20251206-123",
        "date": "2025-12-06 17:30:00",
        "items": [...],
        "status": "pending"
    }
}
```

---

### 4. Update Order Status
**Endpoint:** `PUT /api/orders/update_status.php`

**Request Body:**
```json
{
    "order_number": "ORD-20251206-123",
    "status": "processing",
    "changed_by": "Admin",
    "notes": "Pesanan sedang dikemas"
}
```

**Valid Statuses:**
- `pending` - Menunggu
- `processing` - Diproses
- `shipped` - Dikirim
- `delivered` - Selesai
- `cancelled` - Dibatalkan

**Response:**
```json
{
    "success": true,
    "message": "Order status updated successfully",
    "old_status": "pending",
    "new_status": "processing"
}
```

---

## 📦 Products API

### Read Products
**Endpoint:** `GET /api/products/read.php`

**Query Parameters:**
- `category_id` (optional): Filter by category
- `search` (optional): Search by name or description
- `is_active` (optional): 0 or 1 (default: 1)

**Example:**
```
GET /api/products/read.php?category_id=1&search=cabai
```

**Response:**
```json
{
    "success": true,
    "count": 3,
    "data": [
        {
            "id": 1,
            "nama": "Benih Cabai Rawit",
            "harga": "Rp5.000",
            "harga_raw": 5000,
            "stok": 100,
            "gambar": "assets/img/products/cabai.jpg",
            "kategori": "Benih Sayuran"
        }
    ]
}
```

---

## 🎟️ Vouchers API

### Validate Voucher
**Endpoint:** `POST /api/vouchers/validate.php`

**Request Body:**
```json
{
    "code": "BENIH10",
    "subtotal": 100000,
    "shipping_cost": 11000
}
```

**Response:**
```json
{
    "success": true,
    "valid": true,
    "voucher": {
        "code": "BENIH10",
        "type": "percentage",
        "value": 10,
        "description": "Diskon 10%",
        "discount": 10000
    }
}
```

---

## 🧪 Testing dengan Postman/Insomnia

### 1. Test Create Order
```
POST http://localhost/BenihKu/Tanam.in/api/orders/create.php
Content-Type: application/json

{
    "orderNumber": "ORD-20251206-001",
    "items": [...],
    ...
}
```

### 2. Test Read Orders
```
GET http://localhost/BenihKu/Tanam.in/api/orders/read.php
```

### 3. Test Update Status
```
PUT http://localhost/BenihKu/Tanam.in/api/orders/update_status.php
Content-Type: application/json

{
    "order_number": "ORD-20251206-001",
    "status": "processing"
}
```

---

## ⚙️ Setup Instructions

### 1. Import Database
```bash
mysql -u root -p < database/benihku_schema.sql
```

### 2. Update Database Credentials
Edit `api/config/database.php`:
```php
private $host = "localhost";
private $db_name = "benihku";
private $username = "root";
private $password = ""; // ganti dengan password MySQL Anda
```

### 3. Start Local Server
Ensure XAMPP/WAMP/LAMP is running with:
- ✅ Apache
- ✅ MySQL

### 4. Test API
Open browser: `http://localhost/BenihKu/Tanam.in/api/products/read.php`

---

## 🔒 Security Notes

- ✅ All inputs use PDO prepared statements (SQL injection protection)
- ✅ CORS headers configured for API access
- ✅ Input validation on all endpoints
- ✅ Transaction support for critical operations
- ⚠️ For production: Add authentication/authorization
- ⚠️ For production: Use environment variables for credentials

---

## 📝 Error Handling

All APIs return consistent error format:
```json
{
    "success": false,
    "message": "Error description here"
}
```

HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (missing/invalid data)
- `404` - Not Found
- `503` - Service Unavailable (database error)
