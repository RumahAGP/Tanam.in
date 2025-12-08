<?php
// Konfigurasi Database InfinityFree (PDO)
$host = "sql308.infinityfree.com";
$db   = "if0_40617966_benihku";
$user = "if0_40617966";
$pass = "PyMkZtTcuSl"; // Password VPanel kamu

// Data Source Name (DSN)
$dsn = "mysql:host=$host;dbname=$db;charset=utf8mb4";

try {
    // Membuat koneksi PDO
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    
    // Koneksi berhasil dibuat. 
    // Jika kamu ingin menguji, uncomment baris di bawah ini:
    // echo "Koneksi ke database BenihKu berhasil!";
    
} catch (PDOException $e) {
    // Jika koneksi gagal, hentikan script dan tampilkan pesan
    die("Koneksi gagal: " . $e->getMessage());
}
?>
