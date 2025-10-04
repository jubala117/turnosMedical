<?php
// Script para verificar la estructura de las tablas tipoServicio y servicioEmpresa
header("Content-Type: text/plain");

echo "=== VERIFICACIÓN DE TABLAS DE SERVICIOS ===\n\n";

require_once('db_connect.inc.php');

try {
    // 1. Verificar si la tabla tipoServicio existe
    echo "1. VERIFICANDO TABLA 'tipoServicio':\n";
    $tables_stmt = $conn->query("SHOW TABLES LIKE 'tipoServicio'");
    $tipoServicio_table = $tables_stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($tipoServicio_table) {
        echo "   ✅ Tabla 'tipoServicio' existe\n";
        
        // Verificar estructura de tipoServicio
        echo "\n   ESTRUCTURA DE 'tipoServicio':\n";
        $structure_stmt = $conn->query("DESCRIBE tipoServicio");
        $tipoServicio_structure = $structure_stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($tipoServicio_structure as $column) {
            echo "   - {$column['Field']} ({$column['Type']})\n";
        }
        
        // Verificar algunos registros de ecografías
        echo "\n   REGISTROS DE ECOGRAFÍAS EN 'tipoServicio':\n";
        $ecos_stmt = $conn->query("SELECT idTipoServicio, descripcion FROM tipoServicio WHERE descripcion LIKE '%ECO%' OR idTipoServicio IN (1152,1153,1154,1155,1156,1157,1158,1159,1160,1481,1482,1163,1164,1165,1166,1167,1168,1169,1170,1171,1172,1173,1174,1175,1176,1177) LIMIT 10");
        $ecos = $ecos_stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if ($ecos) {
            foreach ($ecos as $eco) {
                echo "   - ID {$eco['idTipoServicio']}: {$eco['descripcion']}\n";
            }
        } else {
            echo "   ❌ No se encontraron registros de ecografías\n";
        }
    } else {
        echo "   ❌ Tabla 'tipoServicio' NO existe\n";
    }

    // 2. Verificar si la tabla servicioEmpresa existe
    echo "\n2. VERIFICANDO TABLA 'servicioEmpresa':\n";
    $tables_stmt = $conn->query("SHOW TABLES LIKE 'servicioEmpresa'");
    $servicioEmpresa_table = $tables_stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($servicioEmpresa_table) {
        echo "   ✅ Tabla 'servicioEmpresa' existe\n";
        
        // Verificar estructura de servicioEmpresa
        echo "\n   ESTRUCTURA DE 'servicioEmpresa':\n";
        $structure_stmt = $conn->query("DESCRIBE servicioEmpresa");
        $servicioEmpresa_structure = $structure_stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($servicioEmpresa_structure as $column) {
            echo "   - {$column['Field']} ({$column['Type']})\n";
        }
        
        // Verificar si hay precios Club Medical
        echo "\n   PRECIOS CLUB MEDICAL EN 'servicioEmpresa':\n";
        $precios_stmt = $conn->query("SELECT COUNT(*) as total FROM servicioEmpresa WHERE idBioEmpresa = 1");
        $precios_count = $precios_stmt->fetch(PDO::FETCH_ASSOC);
        echo "   - Total de registros para idBioEmpresa = 1: " . ($precios_count['total'] ?? 0) . "\n";
        
        // Verificar algunos precios específicos
        $precios_ejemplo = $conn->query("SELECT ts.idTipoServicio, ts.descripcion, se.precioUnitario 
                                        FROM tipoServicio ts 
                                        LEFT JOIN servicioEmpresa se ON ts.idTipoServicio = se.idTipoServicio AND se.idBioEmpresa = 1
                                        WHERE ts.descripcion LIKE '%ECO%' 
                                        LIMIT 5");
        $precios_ejemplo_data = $precios_ejemplo->fetchAll(PDO::FETCH_ASSOC);
        
        if ($precios_ejemplo_data) {
            echo "\n   EJEMPLOS DE PRECIOS:\n";
            foreach ($precios_ejemplo_data as $precio) {
                echo "   - {$precio['descripcion']}: {$precio['precioUnitario']}\n";
            }
        }
    } else {
        echo "   ❌ Tabla 'servicioEmpresa' NO existe\n";
    }

    // 3. Probar consulta combinada
    echo "\n3. PRUEBA DE CONSULTA COMBINADA:\n";
    $consulta_ejemplo = "SELECT ts.idTipoServicio, ts.descripcion, 
                        ts.precioReferencial as precio_particular,
                        se.precioUnitario as precio_club_medical
                        FROM tipoServicio ts 
                        LEFT JOIN servicioEmpresa se ON ts.idTipoServicio = se.idTipoServicio AND se.idBioEmpresa = 1
                        WHERE ts.descripcion LIKE '%ECO%' 
                        LIMIT 3";
    
    try {
        $resultado = $conn->query($consulta_ejemplo);
        $datos = $resultado->fetchAll(PDO::FETCH_ASSOC);
        
        if ($datos) {
            echo "   ✅ Consulta funciona correctamente\n";
            foreach ($datos as $dato) {
                echo "   - {$dato['descripcion']}: Particular={$dato['precio_particular']}, Club={$dato['precio_club_medical']}\n";
            }
        } else {
            echo "   ⚠️ Consulta funciona pero no devuelve resultados\n";
        }
    } catch (Exception $e) {
        echo "   ❌ Error en consulta: " . $e->getMessage() . "\n";
    }

} catch (PDOException $e) {
    echo "ERROR GENERAL: " . $e->getMessage() . "\n";
}

echo "\n=== FIN DEL DIAGNÓSTICO ===\n";
?>
