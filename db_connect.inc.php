<?php

// SEGURIDAD: Cargar credenciales desde variables de entorno
// Si no existen, usar valores por defecto (desarrollo local)
$gestor = getenv('DB_DRIVER') ?: 'mysql';
$dbname = getenv('DB_NAME') ?: 'medicalcare';
$usuario = getenv('DB_USER') ?: 'root';
$pwd = getenv('DB_PASSWORD') ?: '';
$host = getenv('DB_HOST') ?: 'localhost';
$persistent = filter_var(getenv('DB_PERSISTENT') ?: 'true', FILTER_VALIDATE_BOOLEAN);
$charset = getenv('DB_CHARSET') ?: 'utf8';

$dsn = $gestor.':dbname='.$dbname.';host='.$host;

try {
    // Configuración de conexión persistente para connection pooling
    $options = array(
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_PERSISTENT => $persistent,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES " . $charset
    );

    $conn = new PDO($dsn, $usuario, $pwd, $options);
} catch (PDOException $e) {
    // SEGURIDAD: No exponer detalles de la conexión en producción
    error_log("Database connection failed: " . $e->getMessage());
    http_response_code(500);
    die(json_encode(["error" => "Service temporarily unavailable"]));
}

?>
