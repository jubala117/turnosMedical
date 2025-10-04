<?php
// Script para probar la API get_doctores.php y diagnosticar problemas
header("Content-Type: text/plain");

echo "=== PRUEBA DE DIAGNÓSTICO PARA get_doctores.php ===\n\n";

require_once('db_connect.inc.php');

// ID de especialidad para Medicina General (suponiendo que es 1)
$idEspecialidad = 1;
$idDispensario = 2;

echo "Parámetros de prueba:\n";
echo "- ID Especialidad: $idEspecialidad\n";
echo "- ID Dispensario: $idDispensario\n\n";

try {
    // 1. Verificar si la tabla medico existe
    echo "1. VERIFICANDO TABLAS:\n";
    $tables_stmt = $conn->query("SHOW TABLES LIKE 'medico'");
    $medico_table = $tables_stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($medico_table) {
        echo "   ✅ Tabla 'medico' existe\n";
    } else {
        echo "   ❌ Tabla 'medico' NO existe\n";
    }

    // Verificar otras tablas necesarias
    $required_tables = ['usuario', 'persona', 'usuarioDispensario', 'horarioMedico', 'horario'];
    foreach ($required_tables as $table) {
        $table_stmt = $conn->query("SHOW TABLES LIKE '$table'");
        $table_exists = $table_stmt->fetch(PDO::FETCH_ASSOC);
        echo "   " . ($table_exists ? "✅" : "❌") . " Tabla '$table' " . ($table_exists ? "existe" : "NO existe") . "\n";
    }

    echo "\n2. VERIFICANDO ESTRUCTURA DE TABLA 'medico':\n";
    $structure_stmt = $conn->query("DESCRIBE medico");
    $medico_structure = $structure_stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if ($medico_structure) {
        foreach ($medico_structure as $column) {
            echo "   - {$column['Field']} ({$column['Type']})\n";
        }
    } else {
        echo "   ❌ No se puede describir la tabla 'medico'\n";
    }

    echo "\n3. VERIFICANDO MÉDICOS EXISTENTES:\n";
    $doctors_stmt = $conn->query("SELECT COUNT(*) as total FROM medico");
    $doctors_count = $doctors_stmt->fetch(PDO::FETCH_ASSOC);
    echo "   Total de médicos en la BD: " . ($doctors_count['total'] ?? 0) . "\n";

    echo "\n4. VERIFICANDO ESPECIALIDADES:\n";
    $specialties_stmt = $conn->query("SELECT idEspecialidad, descEspecialidad FROM especialidad LIMIT 5");
    $specialties = $specialties_stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($specialties as $specialty) {
        echo "   - ID {$specialty['idEspecialidad']}: {$specialty['descEspecialidad']}\n";
    }

    echo "\n5. PROBANDO CONSULTA SIMPLIFICADA:\n";
    // Consulta simplificada sin las tablas que podrían no existir
    $simple_sql = "SELECT m.idMedico, p.nombres, p.apellidos 
                   FROM medico m 
                   INNER JOIN persona p ON m.idPersona = p.idPersona 
                   LIMIT 5";
    
    try {
        $simple_stmt = $conn->query($simple_sql);
        $simple_doctors = $simple_stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if ($simple_doctors) {
            echo "   ✅ Consulta simplificada funciona\n";
            foreach ($simple_doctors as $doctor) {
                echo "   - ID {$doctor['idMedico']}: {$doctor['nombres']} {$doctor['apellidos']}\n";
            }
        } else {
            echo "   ❌ Consulta simplificada no devuelve resultados\n";
        }
    } catch (Exception $e) {
        echo "   ❌ Error en consulta simplificada: " . $e->getMessage() . "\n";
    }

} catch (PDOException $e) {
    echo "ERROR GENERAL: " . $e->getMessage() . "\n";
}

echo "\n=== FIN DEL DIAGNÓSTICO ===\n";
?>
