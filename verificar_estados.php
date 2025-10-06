<?php
// Script para verificar valores válidos para idEstado
require_once 'db_connect.inc.php';

echo "🔍 Verificando valores válidos para idEstado:\n";

try {
    // Verificar qué valores se usan actualmente en horariomedico
    echo "🔍 Valores actuales de idEstado en horariomedico:\n";
    $estadosUsados = $conn->query("SELECT DISTINCT idEstado FROM horariomedico")->fetchAll(PDO::FETCH_COLUMN);
    foreach ($estadosUsados as $estadoId) {
        echo "   - ID: $estadoId\n";
    }
    
    // Verificar si existe la tabla estadoplan que podría tener los estados
    echo "\n🔍 Verificando tabla estadoplan:\n";
    $estadosPlan = $conn->query("SELECT idEstado, descripcion FROM estadoplan")->fetchAll();
    foreach ($estadosPlan as $estado) {
        echo "   - ID: {$estado['idEstado']}, Descripción: {$estado['descripcion']}\n";
    }
    
} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
