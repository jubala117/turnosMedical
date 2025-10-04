<?php
require_once('db_connect.inc.php');

try {
    echo "=== VERIFICANDO TABLA tipopaciente ===\n\n";
    
    // Verificar si la tabla existe
    $stmt = $conn->query("SHOW TABLES LIKE 'tipopaciente'");
    $tableExists = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$tableExists) {
        echo "❌ ERROR: La tabla 'tipopaciente' NO existe\n";
        exit();
    }
    
    echo "✅ La tabla 'tipopaciente' existe\n\n";
    
    // Verificar estructura de la tabla
    echo "=== ESTRUCTURA DE LA TABLA ===\n";
    $stmt = $conn->query("DESCRIBE tipopaciente");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($columns as $column) {
        echo "{$column['Field']} - {$column['Type']} - {$column['Null']} - {$column['Key']}\n";
    }
    
    echo "\n=== DATOS DE EJEMPLO ===\n";
    $stmt = $conn->query("SELECT * FROM tipopaciente LIMIT 5");
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($data as $row) {
        print_r($row);
    }
    
    echo "\n=== VERIFICANDO PACIENTE ISSFA ===\n";
    // Verificar si el paciente 0502417025 es ISSFA
    $sql = "SELECT 
                p.idPersona, 
                CONCAT(p.nombres, ' ', p.apellidos) AS nombreCompleto,
                p.idTipoPaciente,
                tp.idTipoPaciente,
                tp.pacienteISSFA
            FROM persona p
            LEFT JOIN tipopaciente tp ON p.idTipoPaciente = tp.idTipoPaciente
            WHERE p.cedula = '0502417025'";
    
    $stmt = $conn->query($sql);
    $paciente = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($paciente) {
        echo "Paciente encontrado:\n";
        print_r($paciente);
        echo "\n¿Es ISSFA? " . ($paciente['pacienteISSFA'] ? 'SÍ' : 'NO') . "\n";
    } else {
        echo "❌ Paciente no encontrado\n";
    }
    
} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
