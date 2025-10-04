<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once('../db_connect.inc.php');

$cedula = isset($_GET['cedula']) ? trim($_GET['cedula']) : null;

// Log para debugging
error_log("API verificar_paciente.php llamada con cédula: " . ($cedula ?: 'NULL'));

if (empty($cedula)) {
    http_response_code(400);
    echo json_encode(["existe" => false, "error" => "No se proporcionó un número de cédula."]);
    exit();
}

try {
    // Consulta mejorada - detectar ISSFA y Club Medical
    $sql = "SELECT 
                p.idPersona, 
                CONCAT(p.nombres, ' ', p.apellidos) AS nombreCompleto,
                CASE 
                    WHEN tp.pacienteISSFA = 'S' THEN 1 
                    ELSE 0 
                END AS esISSFA,
                CASE 
                    WHEN pp.idPersonaPlan IS NOT NULL 
                         AND gp.idGrupoPlan = 7 
                         AND pp.fechaInicio <= NOW() 
                         AND (pp.fechaFinalizacion IS NULL OR pp.fechaFinalizacion >= NOW())
                    THEN 1 ELSE 0 
                END AS esClubMedical
            FROM persona p
            LEFT JOIN tipopaciente tp ON p.idTipoPaciente = tp.idTipoPaciente
            LEFT JOIN personaplan pp ON p.idPersona = pp.idPersona
            LEFT JOIN grupoplan gp ON pp.idGrupoPlan = gp.idGrupoPlan
            WHERE p.cedula = ?";
    
    $stmt = $conn->prepare($sql);
    $stmt->execute([$cedula]);
    $paciente = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($paciente) {
        error_log("Paciente encontrado: " . $paciente['nombreCompleto'] . 
                 " (ID: " . $paciente['idPersona'] . 
                 ", ISSFA: " . $paciente['esISSFA'] . 
                 ", Club Medical: " . $paciente['esClubMedical'] . ")");
        
        echo json_encode([
            "existe" => true,
            "idPersona" => (int)$paciente['idPersona'],
            "nombre" => $paciente['nombreCompleto'],
            "issfa" => (bool)$paciente['esISSFA'],
            "clubMedical" => (bool)$paciente['esClubMedical']
        ]);
    } else {
        error_log("Paciente NO encontrado para cédula: " . $cedula);
        echo json_encode(["existe" => false, "error" => "Paciente no encontrado."]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    error_log("Error en verificar_paciente.php: " . $e->getMessage());
    echo json_encode(["existe" => false, "error" => "Error en la base de datos."]);
}
?>
