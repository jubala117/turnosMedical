<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once(__DIR__ . '/../db_connect.inc.php');

$idMedico = isset($_GET['idMedico']) ? filter_var($_GET['idMedico'], FILTER_VALIDATE_INT) : null;

if (!$idMedico) {
    http_response_code(400);
    echo json_encode(["error" => "No se proporcionó un ID de médico válido."]);
    exit();
}

try {
    // Lógica adaptada de `responseWA.php` (función getMedicos)
    // Busca fechas únicas para un médico específico que tengan turnos disponibles (hm.idEstado = 1)
    // en los próximos 14 días.
    $sql = "SELECT DISTINCT 
                h.fechaHorario
            FROM horarioMedico hm
            JOIN horario h ON hm.idHorario = h.idHorario
            WHERE hm.idMedico = ?
              AND hm.idEstado = 1
              AND h.fechaHorario BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 14 DAY)
            ORDER BY h.fechaHorario";

    $stmt = $conn->prepare($sql);
    $stmt->bindParam(1, $idMedico, PDO::PARAM_INT);
    $stmt->execute();

    $fechas = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($fechas);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error en la consulta: " . $e->getMessage()]);
}
?>
