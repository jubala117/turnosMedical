<?php
// Activar la visualización de todos los errores de PHP
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "<pre>";
echo "--- INICIANDO SCRIPT DE DIAGNÓSTICO ---\n\n";

// 1. Incluir la conexión y verificarla
echo "Paso 1: Conectando a la base de datos...\n";
require_once('db_connect.inc.php');
if ($conn) {
    echo "Resultado: ¡Conexión exitosa!\n";
} else {
    echo "Resultado: ¡ERROR! No se pudo conectar a la base de datos. Revisa tus credenciales en db_connect.inc.php\n";
    exit;
}
echo "\n<hr>\n";

// 2. Buscar la persona por la cédula problemática
$cedula_a_buscar = '0502417025';
echo "Paso 2: Buscando a la persona con cédula: " . $cedula_a_buscar . "\n";
try {
    $sql_persona = "SELECT * FROM persona WHERE cedula = ?";
    $stmt_persona = $conn->prepare($sql_persona);
    $stmt_persona->execute([$cedula_a_buscar]);
    $paciente = $stmt_persona->fetch(PDO::FETCH_ASSOC);

    if ($paciente) {
        echo "Resultado: ¡Persona encontrada!\n";
        print_r($paciente);
        $idPersona_encontrado = $paciente['idPersona'];
    } else {
        echo "Resultado: ¡ERROR! No se encontró ninguna persona con la cédula " . $cedula_a_buscar . ".\n";
        echo "Causa probable: Los datos del archivo 'medicalCare_clubMedical_20250925215535.sql' no han sido importados en la base de datos local.\n";
        $idPersona_encontrado = null;
    }
} catch (PDOException $e) {
    echo "Resultado: ¡ERROR EN LA CONSULTA! " . $e->getMessage() . "\n";
}
echo "\n<hr>\n";

// 3. Si se encontró la persona, verificar su plan
if ($idPersona_encontrado) {
    echo "Paso 3: Verificando el plan para idPersona: " . $idPersona_encontrado . "\n";
    try {
        $sql_plan = "SELECT * FROM personaPlan WHERE idPersona = ? AND idGrupoPlan = 7";
        $stmt_plan = $conn->prepare($sql_plan);
        $stmt_plan->execute([$idPersona_encontrado]);
        $plan = $stmt_plan->fetch(PDO::FETCH_ASSOC);

        if ($plan) {
            echo "Resultado: ¡Plan Club Medical encontrado para esta persona!\n";
            print_r($plan);
            echo "\nConclusión: Los datos en la BD son correctos. El problema no está en la base de datos.\n";
        } else {
            echo "Resultado: ¡ERROR! Esta persona existe, pero no tiene un registro de Club Medical (idGrupoPlan=7) en la tabla personaPlan.\n";
        }
    } catch (PDOException $e) {
        echo "Resultado: ¡ERROR EN LA CONSULTA DEL PLAN! " . $e->getMessage() . "\n";
    }
}

echo "\n--- FIN DEL SCRIPT DE DIAGNÓSTICO ---\n";
echo "</pre>";
?>