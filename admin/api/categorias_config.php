<?php
/**
 * API para gestionar categorías de exámenes
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type");

require_once(__DIR__ . '/../../db_connect.inc.php');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    switch ($method) {
        case 'GET':
            handleGet($conn);
            break;
        case 'POST':
            handlePost($conn);
            break;
        case 'PUT':
            handlePut($conn);
            break;
        case 'DELETE':
            handleDelete($conn);
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Método no permitido']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

/**
 * GET - Obtener categorías
 */
function handleGet($conn) {
    $tipo = isset($_GET['tipo']) ? $_GET['tipo'] : 'laboratorio';
    $idConfig = $tipo === 'laboratorio' ? 21 : 23;

    $sql = "SELECT * FROM kiosk_categoria_examenes
            WHERE id_config = (SELECT id FROM kiosk_especialidad_config WHERE id_especialidad = ?)
            ORDER BY orden, nombre_categoria";

    $stmt = $conn->prepare($sql);
    $stmt->execute([$idConfig]);
    $categorias = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => $categorias
    ]);
}

/**
 * PUT - Actualizar categoría
 */
function handlePut($conn) {
    $data = json_decode(file_get_contents("php://input"), true);

    if (!isset($data['id']) || !isset($data['nombre'])) {
        http_response_code(400);
        echo json_encode(['error' => 'ID y nombre son requeridos']);
        return;
    }

    try {
        $sql = "UPDATE kiosk_categoria_examenes
                SET nombre_categoria = ?
                WHERE id = ?";

        $stmt = $conn->prepare($sql);
        $stmt->execute([trim($data['nombre']), $data['id']]);

        echo json_encode([
            'success' => true,
            'message' => 'Categoría actualizada'
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error al actualizar: ' . $e->getMessage()]);
    }
}

/**
 * DELETE - Eliminar categoría y sus exámenes
 */
function handleDelete($conn) {
    $id = isset($_GET['id']) ? filter_var($_GET['id'], FILTER_VALIDATE_INT) : null;

    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID es requerido']);
        return;
    }

    try {
        // Los exámenes se eliminan automáticamente por ON DELETE CASCADE
        $sql = "DELETE FROM kiosk_categoria_examenes WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->execute([$id]);

        echo json_encode([
            'success' => true,
            'message' => 'Categoría eliminada'
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error al eliminar: ' . $e->getMessage()]);
    }
}
?>
