<?php
/**
 * API REST para gestionar exámenes en el kiosco
 * Permite CRUD completo de exámenes de laboratorio e imagenología
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once(__DIR__ . '/../../db_connect.inc.php');

// Obtener método HTTP
$method = $_SERVER['REQUEST_METHOD'];

// Manejar OPTIONS para CORS
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
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

/**
 * GET - Obtener lista de exámenes
 */
function handleGet($conn) {
    $tipo = isset($_GET['tipo']) ? $_GET['tipo'] : 'todos'; // laboratorio, imagen, todos
    $id = isset($_GET['id']) ? filter_var($_GET['id'], FILTER_VALIDATE_INT) : null;

    if ($id) {
        // Obtener un examen específico
        getExamenById($conn, $id);
    } else {
        // Obtener todos los exámenes
        getAllExamenes($conn, $tipo);
    }
}

function getAllExamenes($conn, $tipo) {
    // Determinar id_config según el tipo
    $idConfig = null;
    if ($tipo === 'laboratorio') {
        $idConfig = 21;
    } elseif ($tipo === 'imagen') {
        $idConfig = 23;
    }

    // Obtener categorías
    $sqlCategorias = "SELECT id, nombre_categoria, orden, activo
                      FROM kiosk_categoria_examenes
                      WHERE id_config = (SELECT id FROM kiosk_especialidad_config WHERE id_especialidad = ?)
                      ORDER BY orden, nombre_categoria";

    $stmtCat = $conn->prepare($sqlCategorias);
    $stmtCat->execute([$idConfig]);
    $categorias = $stmtCat->fetchAll(PDO::FETCH_ASSOC);

    // Obtener exámenes
    $sqlExamenes = "SELECT id, id_categoria, nombre, descripcion, precio_particular, precio_club, orden, activo, fecha_actualizacion
                    FROM kiosk_item_examen
                    WHERE id_config = (SELECT id FROM kiosk_especialidad_config WHERE id_especialidad = ?)
                    ORDER BY id_categoria, orden, nombre";

    $stmtExam = $conn->prepare($sqlExamenes);
    $stmtExam->execute([$idConfig]);
    $examenes = $stmtExam->fetchAll(PDO::FETCH_ASSOC);

    // Agrupar exámenes por categoría
    $categoriasConExamenes = [];
    foreach ($categorias as $categoria) {
        $examenesDeCategoria = array_filter($examenes, function($examen) use ($categoria) {
            return $examen['id_categoria'] == $categoria['id'];
        });

        $categoriasConExamenes[] = [
            'id' => $categoria['id'],
            'nombre' => $categoria['nombre_categoria'],
            'orden' => $categoria['orden'],
            'activo' => $categoria['activo'],
            'examenes' => array_values($examenesDeCategoria)
        ];
    }

    echo json_encode([
        'success' => true,
        'categorias' => $categoriasConExamenes,
        'id_config' => $idConfig
    ]);
}

function getExamenById($conn, $id) {
    $sql = "SELECT
                kie.*,
                kce.nombre_categoria,
                kec.tipo_seccion
            FROM kiosk_item_examen kie
            LEFT JOIN kiosk_categoria_examenes kce ON kce.id = kie.id_categoria
            LEFT JOIN kiosk_especialidad_config kec ON kec.id = kie.id_config
            WHERE kie.id = ?";

    $stmt = $conn->prepare($sql);
    $stmt->execute([$id]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($result) {
        echo json_encode([
            'success' => true,
            'data' => $result
        ]);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Examen no encontrado']);
    }
}

/**
 * POST - Crear nuevo examen
 */
function handlePost($conn) {
    $data = json_decode(file_get_contents("php://input"), true);

    // Validar campos requeridos
    if (!isset($data['nombre']) || empty(trim($data['nombre']))) {
        http_response_code(400);
        echo json_encode(['error' => 'El nombre del examen es requerido']);
        return;
    }

    if (!isset($data['id_config'])) {
        http_response_code(400);
        echo json_encode(['error' => 'El id_config es requerido (21 para Laboratorio, 23 para Imagen)']);
        return;
    }

    try {
        $sql = "INSERT INTO kiosk_item_examen
                (id_config, id_categoria, nombre, descripcion, precio_particular, precio_club, orden, activo)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            $data['id_config'],
            $data['id_categoria'] ?? null,
            trim($data['nombre']),
            $data['descripcion'] ?? null,
            $data['precio_particular'] ?? 0,
            $data['precio_club'] ?? 0,
            $data['orden'] ?? 0,
            $data['activo'] ?? 1
        ]);

        $examenId = $conn->lastInsertId();

        echo json_encode([
            'success' => true,
            'message' => 'Examen creado exitosamente',
            'id' => $examenId
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error al crear examen: ' . $e->getMessage()]);
    }
}

/**
 * PUT - Actualizar examen
 */
function handlePut($conn) {
    $data = json_decode(file_get_contents("php://input"), true);

    if (!isset($data['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'ID es requerido']);
        return;
    }

    try {
        $sql = "UPDATE kiosk_item_examen
                SET nombre = ?,
                    descripcion = ?,
                    precio_particular = ?,
                    precio_club = ?,
                    orden = ?,
                    activo = ?,
                    id_categoria = ?
                WHERE id = ?";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            trim($data['nombre']),
            $data['descripcion'] ?? null,
            $data['precio_particular'] ?? 0,
            $data['precio_club'] ?? 0,
            $data['orden'] ?? 0,
            $data['activo'] ?? 1,
            $data['id_categoria'] ?? null,
            $data['id']
        ]);

        echo json_encode([
            'success' => true,
            'message' => 'Examen actualizado exitosamente'
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error al actualizar examen: ' . $e->getMessage()]);
    }
}

/**
 * DELETE - Eliminar examen
 */
function handleDelete($conn) {
    $id = isset($_GET['id']) ? filter_var($_GET['id'], FILTER_VALIDATE_INT) : null;

    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID es requerido']);
        return;
    }

    try {
        $sql = "DELETE FROM kiosk_item_examen WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->execute([$id]);

        echo json_encode([
            'success' => true,
            'message' => 'Examen eliminado exitosamente'
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error al eliminar examen: ' . $e->getMessage()]);
    }
}
?>
