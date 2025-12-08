-- ============================================
-- Database Schema untuk BenihKu E-Commerce
-- ============================================

-- Buat Database
-- CREATE DATABASE IF NOT EXISTS benihku CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE benihku;

-- ============================================
-- Table: users (Authentication for Admin & Customers)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    landmark VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    role ENUM('admin', 'customer') DEFAULT 'customer',
    is_active BOOLEAN DEFAULT TRUE,
    last_login DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: customers
-- ============================================
CREATE TABLE customers (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: categories
-- ============================================
CREATE TABLE categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: products
-- ============================================
CREATE TABLE products (
    product_id VARCHAR(50) PRIMARY KEY,
    category_id INT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock INT DEFAULT 0,
    image_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL,
    INDEX idx_category (category_id),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: vouchers
-- ============================================
CREATE TABLE vouchers (
    voucher_id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    type ENUM('percentage', 'fixed', 'free_shipping', 'info') NOT NULL,
    value DECIMAL(10, 2) NOT NULL,
    min_purchase DECIMAL(10, 2) DEFAULT 0,
    description VARCHAR(255),
    start_date DATE,
    end_date DATE,
    max_usage INT DEFAULT NULL,
    usage_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: orders
-- ============================================
CREATE TABLE orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INT,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20),
    customer_email VARCHAR(100),
    
    -- Address
    shipping_address TEXT NOT NULL,
    landmark VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    distance_km DECIMAL(6, 2),
    
    -- Pricing
    subtotal DECIMAL(10, 2) NOT NULL,
    shipping_method ENUM('hemat', 'express', 'instant') NOT NULL,
    shipping_cost DECIMAL(10, 2) NOT NULL,
    discount DECIMAL(10, 2) DEFAULT 0,
    voucher_code VARCHAR(20),
    total DECIMAL(10, 2) NOT NULL,
    
    -- Payment
    payment_method ENUM('cod', 'transfer', 'ewallet') NOT NULL,
    payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
    
    -- Order Status
    status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    
    -- Notes
    notes TEXT,
    admin_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP NULL,
    
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE SET NULL,
    INDEX idx_order_number (order_number),
    INDEX idx_customer (customer_id),
    INDEX idx_status (status),
    INDEX idx_payment_status (payment_status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: order_items
-- ============================================
CREATE TABLE order_items (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id VARCHAR(50),
    product_name VARCHAR(100) NOT NULL,
    product_price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE SET NULL,
    INDEX idx_order (order_id),
    INDEX idx_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: order_status_history
-- ============================================
CREATE TABLE order_status_history (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    old_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    changed_by VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    INDEX idx_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: cart (optional - untuk persistent cart)
-- ============================================
CREATE TABLE cart (
    cart_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT,
    product_id VARCHAR(50) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    UNIQUE KEY unique_cart_item (customer_id, product_id),
    INDEX idx_customer (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SAMPLE DATA
-- ============================================

-- Categories
INSERT INTO categories (name, description) VALUES
('Benih Sayuran', 'Benih untuk tanaman sayuran'),
('Benih Buah', 'Benih untuk tanaman buah'),
('Pupuk', 'Pupuk organik dan anorganik'),
('Alat Pertanian', 'Peralatan berkebun');

-- Products
INSERT INTO products (product_id, category_id, name, price, description, image_url) VALUES
('cabai', 1, 'Benih Cabai', 500, 'Benih cabai berkualitas tinggi dengan daya tumbuh di atas 90% cocok untuk ditanam di dataran rendah maupun tinggi, tahan penyakit, dan menghasilkan buah pedas aromatik.', 'assets/img/chili.jpg'),
('bayem', 1, 'Benih Bayam', 250, 'Benih bayam berkualitas tinggi dengan daya tumbuh di atas 90% cocok untuk ditanam di dataran rendah maupun tinggi, tahan penyakit, dan menghasilkan daun bayam hijau yang berkualitas.', 'assets/img/bayem cover yang ini aja.jpeg'),
('jagung', 1, 'Benih Jagung', 500, 'Benih Jagung berkualitas tinggi dengan daya tumbuh di atas 90% tahan penyakit, dan menghasilkan jagung yang berkualitas.', 'assets/img/jagung.jpeg'),
('sawi', 1, 'Benih Sawi', 1500, 'Bibit Sawi unggul dengan daya tumbuh di atas 90%, tahan terhadap hama dan penyakit, serta menghasilkan daun yang hijau segar, tebal, dan bernutrisi tinggi.', 'assets/img/sawi.jpeg'),
('pare', 1, 'Benih Pare', 1500, 'Bibit pare unggul dengan daya tumbuh di atas 90%, tahan terhadap hama dan penyakit, serta menghasilkan buah yang berkualitas.', 'assets/img/cover pare.jpeg'),
('kangkung', 1, 'Benih Kangkung', 500, 'Bibit Kangkung unggul dengan daya tumbuh tinggi di atas 90%, tahan terhadap hama dan cuaca ekstrem, serta menghasilkan daun yang hijau segar dan lebat.', 'assets/img/kangkung.jpeg'),
('tomat', 1, 'Benih Tomat', 1000, 'Benih tomat unggul yang cepat tumbuh, tahan penyakit, dan menghasilkan buah merah segar dengan rasa manis alami.', 'assets/img/tomat cover.jpeg'),
('terong', 1, 'Benih Terong', 1000, 'Benih terong unggul dengan daya tumbuh tinggi, tahan cuaca ekstrem, dan menghasilkan buah besar serta mengkilap.', 'assets/img/cover terong.jpeg'),
('mentimun', 1, 'Benih Mentimun', 800, 'Benih mentimun unggul dengan hasil panen tinggi, tahan penyakit, dan menghasilkan buah renyah serta segar.', 'assets/img/cover mentimun.jpeg'),
('kacangpanjang', 1, 'Benih Kacang Panjang', 1000, 'Benih kacang panjang unggul dengan daya tumbuh tinggi, tahan penyakit, dan menghasilkan polong panjang serta renyah.', 'assets/img/cover kacang.jpeg');

-- Vouchers
INSERT INTO vouchers (code, type, value, min_purchase, description, start_date, end_date, is_active) VALUES
('BENIH10', 'percentage', 10, 0, 'Diskon 10%', '2025-01-01', '2025-12-31', TRUE),
('ONGKIRFREE', 'free_shipping', 0, 100000, 'Gratis Ongkir min 100rb', '2025-01-01', '2025-12-31', TRUE),
('CASHBACK15', 'percentage', 15, 0, 'Cashback 15%', '2025-01-01', '2025-12-31', TRUE),
('BENIH20', 'percentage', 20, 200000, 'Diskon 20% min 200rb', '2025-01-01', '2025-12-31', TRUE),
('MEMBER25', 'percentage', 25, 0, 'Diskon Member 25%', '2025-01-01', '2025-12-31', TRUE),
('HBD50K', 'fixed', 50000, 0, 'Potongan 50rb', '2025-01-01', '2025-12-31', TRUE),
('FLASH40', 'percentage', 40, 0, 'Flash Sale 40%', '2025-01-01', '2025-12-31', TRUE),
('WEEKEND30', 'percentage', 30, 0, 'Weekend 30%', '2025-01-01', '2025-12-31', TRUE),
('NEWUSER20', 'percentage', 20, 0, 'New User 20%', '2025-01-01', '2025-12-31', TRUE),
('B2G1BENIH', 'info', 0, 0, 'Beli 2 Gratis 1 (manual)', '2025-01-01', '2025-12-31', TRUE);

-- Sample Customer
INSERT INTO customers (name, email, phone, address, latitude, longitude) VALUES
('Galih Setiawan', 'galih@example.com', '08123456789', 'Jl. Pamulang No.10, RT 01/RW 02', -6.346286, 106.691763),
('Siti Aminah', 'siti@example.com', '08987654321', 'Jl. Raya Puspitek', -6.351234, 106.696542);

-- Sample Users (Admin & Customer)
-- Admin password: admin123
-- Customer password: customer123
INSERT INTO users (name, email, password, phone, address, role, is_active) VALUES
('Administrator', 'admin@benihku.com', '$2y$10$b4iRggLNQDV4DDwVffhHru7a6YnNjCfEMpCzcOP1acD12I5E6Ww/a', '08111111111', 'Kantor BenihKu', 'admin', TRUE),
('Demo Customer', 'customer@benihku.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '08222222222', 'Jl. Customer No.1', 'customer', TRUE);

-- ============================================
-- VIEWS (Optional - untuk reporting)
-- ============================================

-- View: Order Summary
-- CREATE OR REPLACE VIEW v_order_summary AS
-- SELECT 
--     o.order_id,
--     o.order_number,
--     o.customer_name,
--     o.created_at as order_date,
--     o.status,
--     o.payment_status,
--     o.payment_method,
--     COUNT(oi.order_item_id) as total_items,
--     o.total,
--     o.shipping_method
-- FROM orders o
-- LEFT JOIN order_items oi ON o.order_id = oi.order_id
-- GROUP BY o.order_id;

-- View: Product Sales
-- CREATE OR REPLACE VIEW v_product_sales AS
-- SELECT 
--     p.product_id,
--     p.name,
--     p.category_id,
--     c.name as category_name,
--     COUNT(oi.order_item_id) as times_ordered,
--     SUM(oi.quantity) as total_quantity_sold,
--     SUM(oi.subtotal) as total_revenue
-- FROM products p
-- LEFT JOIN order_items oi ON p.product_id = oi.product_id
-- LEFT JOIN categories c ON p.category_id = c.category_id
-- GROUP BY p.product_id;

-- ============================================
-- STORED PROCEDURES (Optional)
-- ============================================

-- DELIMITER //

-- Procedure: Create Order
-- CREATE PROCEDURE sp_create_order(
--     IN p_order_number VARCHAR(50),
--     IN p_customer_name VARCHAR(100),
--     IN p_customer_phone VARCHAR(20),
--     IN p_shipping_address TEXT,
--     IN p_landmark VARCHAR(255),
--     IN p_latitude DECIMAL(10,8),
--     IN p_longitude DECIMAL(11,8),
--     IN p_distance_km DECIMAL(6,2),
--     IN p_subtotal DECIMAL(10,2),
--     IN p_shipping_method VARCHAR(20),
--     IN p_shipping_cost DECIMAL(10,2),
--     IN p_discount DECIMAL(10,2),
--     IN p_voucher_code VARCHAR(20),
--     IN p_total DECIMAL(10,2),
--     IN p_payment_method VARCHAR(20),
--     OUT p_order_id INT
-- )
-- BEGIN
--     INSERT INTO orders (
--         order_number, customer_name, customer_phone,
--         shipping_address, landmark, latitude, longitude, distance_km,
--         subtotal, shipping_method, shipping_cost, discount, voucher_code, total,
--         payment_method, status
--     ) VALUES (
--         p_order_number, p_customer_name, p_customer_phone,
--         p_shipping_address, p_landmark, p_latitude, p_longitude, p_distance_km,
--         p_subtotal, p_shipping_method, p_shipping_cost, p_discount, p_voucher_code, p_total,
--         p_payment_method, 'pending'
--     );
    
--     SET p_order_id = LAST_INSERT_ID();
-- END //

-- Procedure: Update Order Status
-- CREATE PROCEDURE sp_update_order_status(
--     IN p_order_id INT,
--     IN p_new_status VARCHAR(20),
--     IN p_changed_by VARCHAR(100),
--     IN p_notes TEXT
-- )
-- BEGIN
--     DECLARE v_old_status VARCHAR(20);
    
--     -- Get current status
--     SELECT status INTO v_old_status FROM orders WHERE order_id = p_order_id;
    
--     -- Update order status
--     UPDATE orders SET status = p_new_status WHERE order_id = p_order_id;
    
--     -- Log to history
--     INSERT INTO order_status_history (order_id, old_status, new_status, changed_by, notes)
--     VALUES (p_order_id, v_old_status, p_new_status, p_changed_by, p_notes);
    
--     -- If delivered, set delivered_at
--     IF p_new_status = 'delivered' THEN
--         UPDATE orders SET delivered_at = NOW() WHERE order_id = p_order_id;
--     END IF;
-- END //


-- ============================================
-- Table: product_images (Multi-image support)
-- ============================================
CREATE TABLE IF NOT EXISTS product_images (
    image_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id VARCHAR(50) NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    INDEX idx_product (product_id),
    INDEX idx_primary (is_primary)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
