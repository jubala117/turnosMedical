<?php
/**
 * Script para limpiar exámenes duplicados
 * Elimina todas las entradas duplicadas dejando solo la primera
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once(__DIR__ . '/../../db_connect.inc.php');

try {
    // Contar duplicados antes
    $sqlCount = "SELECT COUNT(*) FROM kiosk_item_examen WHERE id_config = 21";
    $stmtCount = $conn->prepare($sqlCount);
    $stmtCount->execute();
    $totalAntes = $stmtCount->fetchColumn();

    // Eliminar todos los exámenes de laboratorio primero
    $sqlDelete = "DELETE FROM kiosk_item_examen WHERE id_config = 21";
    $stmtDelete = $conn->prepare($sqlDelete);
    $stmtDelete->execute();

    // Eliminar todas las categorías de laboratorio
    $sqlDeleteCat = "DELETE FROM kiosk_categoria_examenes WHERE id_config = (SELECT id FROM kiosk_especialidad_config WHERE id_especialidad = 21)";
    $stmtDeleteCat = $conn->prepare($sqlDeleteCat);
    $stmtDeleteCat->execute();

    echo json_encode([
        'success' => true,
        'message' => 'Datos limpiados correctamente',
        'total_eliminados' => $totalAntes
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error al limpiar: ' . $e->getMessage()
    ]);
}
?>
