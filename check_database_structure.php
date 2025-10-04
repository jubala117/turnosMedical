<?php
// Script para verificar la estructura de la base de datos
require_once('db_connect.inc.php');

echo "=== VERIFICACIÓN DE ESTRUCTURA DE BASE DE DATOS ===\n\n";

try {
    // 1. Verificar tablas existentes
    echo "1. TABLAS EXISTENTES EN LA BASE DE DATOS:\n";
    $tables_stmt = $conn->query("SHOW TABLES");
    $tables = $tables_stmt->fetchAll(PDO::FETCH_COLUMN);
    
    foreach ($tables as $table) {
        echo "   - $table\n";
    }
    echo "\n";

    // 2. Verificar estructura de la tabla persona
    echo "2. ESTRUCTURA DE LA TABLA 'persona':\n";
    $persona_stmt = $conn->query("DESCRIBE persona");
    $persona_structure = $persona_stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($persona_structure as $column) {
        echo "   - {$column['Field']} ({$column['Type']})\n";
    }
    echo "\n";

    // 3. Verificar si existe algún campo relacionado con tipo de paciente
    echo "3. BUSCANDO CAMPOS RELACIONADOS CON TIPO DE PACIENTE:\n";
    $fields_stmt = $conn->query("SHOW COLUMNS FROM persona LIKE '%tipo%'");
    $tipo_fields = $fields_stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($tipo_fields) > 0) {
        foreach ($tipo_fields as $field) {
            echo "   - {$field['Field']} ({$field['Type']})\n";
        }
    } else {
        echo "   - No se encontraron campos relacionados con 'tipo'\n";
    }
    echo "\n";

    // 4. Verificar algunos registros de ejemplo
    echo "4. REGISTROS DE EJEMPLO DE LA TABLA 'persona':\n";
    $sample_stmt = $conn->query("SELECT idPersona, cedula, nombres, apellidos FROM persona LIMIT 5");
    $sample_records = $sample_stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($sample_records as $record) {
        echo "   - {$record['cedula']}: {$record['nombres']} {$record['apellidos']}\n";
    }

} catch (PDOException $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
?>
