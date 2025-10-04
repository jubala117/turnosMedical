<?php
require_once('db_connect.inc.php');

try {
    echo "=== VERIFICANDO TABLA personaplan ===\n\n";
    
    // Verificar estructura de la tabla
    echo "=== ESTRUCTURA DE LA TABLA ===\n";
    $stmt = $conn->query("DESCRIBE personaplan");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($columns as $column) {
        echo "{$column['Field']} - {$column['Type']} - {$column['Null']} - {$column['Key']}\n";
    }
    
    echo "\n=== DATOS DE EJEMPLO ===\n";
    $stmt = $conn->query("SELECT * FROM personaplan LIMIT 5");
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($data as $row) {
        print_r($row);
    }
    
} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
