<?php
/**
 * Database Connection Class
 * BenihKu E-Commerce
 */

// Headers removed to prevent "headers already sent" errors when included
// Headers should be set by the API endpoints themselves

class Database {
    // Database credentials
    private $host = "sql308.infinityfree.com";
    private $db_name = "if0_40617966_benihku";
    private $username = "if0_40617966";
    private $password = "PyMkZtTcuSl";
    public $conn;

    /**
     * Get database connection
     * @return PDO|null
     */
    public function getConnection() {
        $this->conn = null;

        // Smart Configuration: Auto-detect Localhost vs Hosting
        // Fixes timeout issues when running on XAMPP or CLI
        $is_localhost = false;
        
        // Check if running in CLI or if HTTP_HOST is localhost/127.0.0.1
        if (php_sapi_name() === 'cli' || 
            (isset($_SERVER['HTTP_HOST']) && ($_SERVER['HTTP_HOST'] === 'localhost' || $_SERVER['HTTP_HOST'] === '127.0.0.1'))) {
            $is_localhost = true;
        }

        if ($is_localhost) {
            $this->host = "localhost";
            $this->db_name = "benihku";
            $this->username = "root";
            $this->password = "";
        } else {
            $this->host = "sql308.infinityfree.com";
            $this->db_name = "if0_40617966_benihku";
            $this->username = "if0_40617966";
            $this->password = "PyMkZtTcuSl";
        }

        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name,
                $this->username,
                $this->password
            );
            $this->conn->exec("set names utf8mb4");
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch(PDOException $exception) {
            echo json_encode([
                'success' => false,
                'message' => 'Connection error: ' . $exception->getMessage()
            ]);
            exit;
        }

        return $this->conn;
    }
}
?>
