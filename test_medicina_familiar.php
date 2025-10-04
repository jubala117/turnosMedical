<?php
require_once('db_connect.inc.php');

try {
    echo "=== DIAGNÓSTICO MEDICINA FAMILIAR ===\n\n";
    
    // Verificar si los IDs existen en la base de datos
    $ids = [803, 771]; // IDs para Medicina Familiar
    
    foreach ($ids as $id) {
        echo "Verificando ID: $id\n";
        
        $sql = "SELECT ts.idTipoServicio, ts.descripcion, 
                       COALESCE(se.precioUnitario, ts.precioReferencial) AS precio
                FROM tipoServicio ts
                LEFT JOIN servicioEmpresa se ON se.idTipoServicio = ts.idTipoServicio AND se.idBioEmpresa = 1
                WHERE ts.idTipoServicio = ?";
        
        $stmt = $conn->prepare($sql);
        $stmt->execute([$id]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result) {
            echo "✅ ID $id encontrado:\n";
            echo "   Descripción: " . $result['descripcion'] . "\n";
            echo "   Precio: " . $result['precio'] . "\n";
        } else {
            echo "❌ ID $id NO encontrado en la base de datos\n";
        }
        echo "\n";
    }
    
    // Probar la API directamente
    echo "=== PRUEBA DE LA API ===\n";
    $url = "http://localhost/turnosMedical/API/get_especialidades.php";
    $response = file_get_contents($url);
    $especialidades = json_decode($response, true);
    
    if ($especialidades) {
        foreach ($especialidades as $esp) {
            if (strpos(strtoupper($esp['descEspecialidad']), 'MEDICINA FAMILIAR') !== false || 
                strpos(strtoupper($esp['descEspecialidad']), 'MEDICO FAMILIAR') !== false) {
                echo "Especialidad encontrada: " . $esp['descEspecialidad'] . "\n";
                echo "Precios: " . print_r($esp['precios'], true) . "\n";
                echo "\n";
            }
        }
    } else {
        echo "❌ No se pudo obtener respuesta de la API\n";
    }
    
} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
