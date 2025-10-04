<?php
// Script simple para probar la API directamente
require_once('db_connect.inc.php');

$cedula = '0502417025';

try {
    // Consulta para verificar el paciente
    $sql = "SELECT 
                p.idPersona, 
                CONCAT(p.nombres, ' ', p.apellidos) AS nombreCompleto,
                tp.pacienteISSFA
            FROM persona p
            LEFT JOIN tipoPaciente tp ON p.idTipoPaciente = tp.idTipoPaciente
            WHERE p.cedula = ?";
    
    $stmt = $conn->prepare($sql);
    $stmt->execute([$cedula]);
    $paciente = $stmt->fetch(PDO::FETCH_ASSOC);

    echo "Resultado de la consulta:\n";
    print_r($paciente);
    
    if ($paciente) {
        echo "\nJSON que debería devolver:\n";
        echo json_encode([
            "existe" => true,
            "idPersona" => (int)$paciente['idPersona'],
            "nombre" => $paciente['nombreCompleto'],
            "issfa" => ($paciente['pacienteISSFA'] === 'S')
        ], JSON_PRETTY_PRINT);
    } else {
        echo "\nPaciente no encontrado\n";
    }

} catch (PDOException $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
?>
