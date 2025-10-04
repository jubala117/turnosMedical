<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once(__DIR__ . '/../db_connect.inc.php');

// Obtenemos el idEspecialidad de la URL, con validación básica
$idEspecialidad = isset($_GET['idEspecialidad']) ? filter_var($_GET['idEspecialidad'], FILTER_VALIDATE_INT) : null;

if (!$idEspecialidad) {
    http_response_code(400); // Bad Request
    echo json_encode(["error" => "No se proporcionó un ID de especialidad válido."]);
    exit();
}

// El ID del dispensario de Quitumbe es 2
$idDispensario = 2;

try {
    // Esta consulta optimizada busca médicos disponibles con horarios en los próximos 14 días
    // Se han realizado las siguientes optimizaciones:
    // 1. Simplificación de joins innecesarios
    // 2. Uso de EXISTS para verificar horarios disponibles
    // 3. Mejora en el filtrado de fechas
    $sql = "SELECT 
                m.idMedico, 
                CONCAT_WS(' ', p.nombres, p.apellidos) AS nombreCompleto
            FROM medico m
            INNER JOIN usuario u ON m.idUsuario = u.idUsuario
            INNER JOIN persona p ON u.idPersona = p.idPersona
            INNER JOIN usuarioDispensario ud ON u.idUsuario = ud.idUsuario
            WHERE u.idEstado = 1
              AND ud.idDispensario = ?
              AND ud.idEspecialidad = ?
              AND EXISTS (
                SELECT 1
                FROM horarioMedico hm
                INNER JOIN horario h ON hm.idHorario = h.idHorario
                WHERE hm.idMedico = m.idMedico
                  AND hm.idEstado = 1
                  AND h.fechaHorario BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 14 DAY)
              )
            ORDER BY nombreCompleto";

    $stmt = $conn->prepare($sql);
    $stmt->bindParam(1, $idDispensario, PDO::PARAM_INT);
    $stmt->bindParam(2, $idEspecialidad, PDO::PARAM_INT);
    $stmt->execute();

    $doctores = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($doctores);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error en la consulta: " . $e->getMessage()]);
}
?>
