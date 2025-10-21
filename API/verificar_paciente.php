<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once(__DIR__ . '/../db_connect.inc.php');
require_once(__DIR__ . '/utils.php');

$cedula = isset($_GET['cedula']) ? $_GET['cedula'] : null;

// Validar cédula usando utilidad compartida
$cedula = requireParam($cedula, 'cedula', 'string');

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
        // Log solo en modo debug (opcional)
        if (getenv('DEBUG_MODE') === 'true') {
            error_log("Paciente encontrado: " . $paciente['nombreCompleto'] .
                     " (ID: " . $paciente['idPersona'] . ")");
        }

        sendSuccess([
            "existe" => true,
            "idPersona" => (int)$paciente['idPersona'],
            "nombre" => $paciente['nombreCompleto'],
            "issfa" => (bool)$paciente['esISSFA'],
            "clubMedical" => (bool)$paciente['esClubMedical']
        ]);
    } else {
        sendSuccess(["existe" => false, "error" => "Paciente no encontrado."]);
    }

} catch (PDOException $e) {
    handleError($e, 'verificar_paciente');
}
?>
