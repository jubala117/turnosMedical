<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once(__DIR__ . '/../db_connect.inc.php');

$idMedico = isset($_GET['idMedico']) ? filter_var($_GET['idMedico'], FILTER_VALIDATE_INT) : null;
$fecha = isset($_GET['fecha']) ? $_GET['fecha'] : null;

// Validamos que la fecha tenga un formato YYYY-MM-DD
if (!$idMedico || !$fecha || !preg_match("/^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$/", $fecha)) {
    http_response_code(400);
    echo json_encode(["error" => "No se proporcionaron un ID de médico o una fecha válidos."]);
    exit();
}

try {
    // Lógica adaptada de `responseWA.php` (función getFechas)
    $sql = "SELECT 
                hm.idHorarioMedico, 
                SUBSTR(h.hora, 1, 5) AS hora
            FROM horarioMedico hm
            JOIN horario h ON hm.idHorario = h.idHorario
            WHERE hm.idMedico = ?
              AND h.fechaHorario = ?
              AND hm.idEstado = 1
            ORDER BY h.hora";

    $stmt = $conn->prepare($sql);
    $stmt->bindParam(1, $idMedico, PDO::PARAM_INT);
    $stmt->bindParam(2, $fecha, PDO::PARAM_STR);
    $stmt->execute();

    $horas = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($horas);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error en la consulta: " . $e->getMessage()]);
}
?>
