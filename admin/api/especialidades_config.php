<?php
/**
 * API REST para gestionar configuración de especialidades en el kiosco
 * Permite CRUD completo sin necesidad de tocar código
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
 * GET - Obtener lista de especialidades configuradas
 */
function handleGet($conn) {
    $id = isset($_GET['id']) ? filter_var($_GET['id'], FILTER_VALIDATE_INT) : null;

    if ($id) {
        // Obtener una especialidad específica
        getEspecialidadById($conn, $id);
    } else {
        // Obtener todas las especialidades
        getAllEspecialidades($conn);
    }
}

function getAllEspecialidades($conn) {
    $sql = "SELECT * FROM v_kiosk_especialidades ORDER BY orden, nombre_especialidad";
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Para cada especialidad, obtener sus opciones si tiene
    foreach ($result as &$esp) {
        if ($esp['tiene_opciones']) {
            $esp['opciones'] = getOpciones($conn, $esp['id']);
        }
    }

    echo json_encode([
        'success' => true,
        'data' => $result
    ]);
}

function getEspecialidadById($conn, $id) {
    $sql = "SELECT * FROM v_kiosk_especialidades WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->execute([$id]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($result) {
        if ($result['tiene_opciones']) {
            $result['opciones'] = getOpciones($conn, $id);
        }

        echo json_encode([
            'success' => true,
            'data' => $result
        ]);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Especialidad no encontrada']);
    }
}

function getOpciones($conn, $idConfig) {
    $sql = "SELECT * FROM kiosk_precio_opciones WHERE id_config = ? AND activo = 1 ORDER BY orden";
    $stmt = $conn->prepare($sql);
    $stmt->execute([$idConfig]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

/**
 * POST - Crear nueva configuración de especialidad
 */
function handlePost($conn) {
    $data = json_decode(file_get_contents("php://input"), true);

    // Validar que se envió el nombre de la especialidad
    if (!isset($data['nombre_especialidad']) || empty(trim($data['nombre_especialidad']))) {
        http_response_code(400);
        echo json_encode(['error' => 'El nombre de la especialidad es requerido']);
        return;
    }

    try {
        $conn->beginTransaction();

        // Crear o buscar la especialidad en la tabla 'especialidad'
        $idDispensario = 2; // Quitumbe
        $nombreEspecialidad = trim($data['nombre_especialidad']);

        // Verificar si ya existe una especialidad con ese nombre
        $sqlCheck = "SELECT idEspecialidad FROM especialidad WHERE descEspecialidad = ? AND idDispensario = ?";
        $stmtCheck = $conn->prepare($sqlCheck);
        $stmtCheck->execute([$nombreEspecialidad, $idDispensario]);
        $existente = $stmtCheck->fetch(PDO::FETCH_ASSOC);

        if ($existente) {
            $idEspecialidad = $existente['idEspecialidad'];
        } else {
            // Crear nueva especialidad
            $sqlInsertEsp = "INSERT INTO especialidad (descEspecialidad, idDispensario, idEstado) VALUES (?, ?, 1)";
            $stmtInsertEsp = $conn->prepare($sqlInsertEsp);
            $stmtInsertEsp->execute([$nombreEspecialidad, $idDispensario]);
            $idEspecialidad = $conn->lastInsertId();
        }

        // Insertar configuración principal
        $sql = "INSERT INTO kiosk_especialidad_config
                (id_especialidad, activo, orden, tiene_opciones, tipo_seccion, imagen_personalizada, mostrar_en_kiosco)
                VALUES (?, ?, ?, ?, ?, ?, ?)";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            $idEspecialidad,
            $data['activo'] ?? 1,
            $data['orden'] ?? 0,
            $data['tiene_opciones'] ?? 0,
            $data['tipo_seccion'] ?? 'consulta',
            $data['imagen_personalizada'] ?? null,
            $data['mostrar_en_kiosco'] ?? 1
        ]);

        $configId = $conn->lastInsertId();

        // Si no tiene opciones, insertar configuración de precio simple
        if (!($data['tiene_opciones'] ?? false)) {
            $sqlPrecio = "INSERT INTO kiosk_precio_config
                         (id_config, tipo_precio, id_servicio_particular, id_servicio_club,
                          precio_particular_fijo, precio_club_fijo, tabla_origen)
                         VALUES (?, ?, ?, ?, ?, ?, ?)";

            $stmtPrecio = $conn->prepare($sqlPrecio);
            $stmtPrecio->execute([
                $configId,
                $data['tipo_precio'] ?? 'id_bd',
                $data['id_servicio_particular'] ?? null,
                $data['id_servicio_club'] ?? null,
                $data['precio_particular_fijo'] ?? null,
                $data['precio_club_fijo'] ?? null,
                $data['tabla_origen'] ?? 'servicio'
            ]);
        }
        // Si tiene opciones, insertar las opciones
        else if (isset($data['opciones']) && is_array($data['opciones'])) {
            insertOpciones($conn, $configId, $data['opciones']);
        }

        $conn->commit();

        echo json_encode([
            'success' => true,
            'message' => 'Especialidad creada exitosamente',
            'id' => $configId
        ]);

    } catch (PDOException $e) {
        $conn->rollBack();
        http_response_code(500);
        echo json_encode(['error' => 'Error al crear especialidad: ' . $e->getMessage()]);
    }
}

/**
 * PUT - Actualizar configuración de especialidad
 */
function handlePut($conn) {
    $data = json_decode(file_get_contents("php://input"), true);

    // Caso especial: reordenamiento masivo
    if (isset($data['action']) && $data['action'] === 'reorder') {
        handleReorder($conn, $data);
        return;
    }

    if (!isset($data['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'ID es requerido']);
        return;
    }

    try {
        $conn->beginTransaction();

        // Si se envió un nuevo nombre, actualizar la tabla especialidad
        if (isset($data['nombre_especialidad']) && !empty(trim($data['nombre_especialidad']))) {
            // Obtener id_especialidad actual
            $sqlGetId = "SELECT id_especialidad FROM kiosk_especialidad_config WHERE id = ?";
            $stmtGetId = $conn->prepare($sqlGetId);
            $stmtGetId->execute([$data['id']]);
            $result = $stmtGetId->fetch(PDO::FETCH_ASSOC);

            if ($result) {
                $idEspecialidad = $result['id_especialidad'];
                $nombreEspecialidad = trim($data['nombre_especialidad']);

                // Actualizar nombre en tabla especialidad
                $sqlUpdateName = "UPDATE especialidad SET descEspecialidad = ? WHERE idEspecialidad = ?";
                $stmtUpdateName = $conn->prepare($sqlUpdateName);
                $stmtUpdateName->execute([$nombreEspecialidad, $idEspecialidad]);
            }
        }

        // Actualizar configuración principal
        $sql = "UPDATE kiosk_especialidad_config
                SET activo = ?,
                    orden = ?,
                    tiene_opciones = ?,
                    tipo_seccion = ?,
                    imagen_personalizada = ?,
                    mostrar_en_kiosco = ?
                WHERE id = ?";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            $data['activo'] ?? 1,
            $data['orden'] ?? 0,
            $data['tiene_opciones'] ?? 0,
            $data['tipo_seccion'] ?? 'consulta',
            $data['imagen_personalizada'] ?? null,
            $data['mostrar_en_kiosco'] ?? 1,
            $data['id']
        ]);

        // Actualizar precio si no tiene opciones
        if (!($data['tiene_opciones'] ?? false)) {
            // Eliminar opciones viejas si existían
            $sqlDeleteOpciones = "DELETE FROM kiosk_precio_opciones WHERE id_config = ?";
            $stmtDeleteOpciones = $conn->prepare($sqlDeleteOpciones);
            $stmtDeleteOpciones->execute([$data['id']]);

            $sqlPrecio = "UPDATE kiosk_precio_config
                         SET tipo_precio = ?,
                             id_servicio_particular = ?,
                             id_servicio_club = ?,
                             precio_particular_fijo = ?,
                             precio_club_fijo = ?,
                             tabla_origen = ?
                         WHERE id_config = ?";

            $stmtPrecio = $conn->prepare($sqlPrecio);
            $stmtPrecio->execute([
                $data['tipo_precio'] ?? 'id_bd',
                $data['id_servicio_particular'] ?? null,
                $data['id_servicio_club'] ?? null,
                $data['precio_particular_fijo'] ?? null,
                $data['precio_club_fijo'] ?? null,
                $data['tabla_origen'] ?? 'servicio',
                $data['id']
            ]);
        } else {
            // Si tiene opciones, eliminar las viejas e insertar las nuevas
            $sqlDeleteOpciones = "DELETE FROM kiosk_precio_opciones WHERE id_config = ?";
            $stmtDeleteOpciones = $conn->prepare($sqlDeleteOpciones);
            $stmtDeleteOpciones->execute([$data['id']]);

            if (isset($data['opciones']) && is_array($data['opciones'])) {
                insertOpciones($conn, $data['id'], $data['opciones']);
            }
        }

        $conn->commit();

        echo json_encode([
            'success' => true,
            'message' => 'Especialidad actualizada exitosamente'
        ]);

    } catch (PDOException $e) {
        $conn->rollBack();
        http_response_code(500);
        echo json_encode(['error' => 'Error al actualizar especialidad: ' . $e->getMessage()]);
    }
}

/**
 * PUT - Reordenar especialidades (acción masiva)
 */
function handleReorder($conn, $data) {
    if (!isset($data['order']) || !is_array($data['order'])) {
        http_response_code(400);
        echo json_encode(['error' => 'El array "order" es requerido']);
        return;
    }

    try {
        $conn->beginTransaction();

        $sql = "UPDATE kiosk_especialidad_config SET orden = ? WHERE id = ?";
        $stmt = $conn->prepare($sql);

        foreach ($data['order'] as $item) {
            if (!isset($item['id']) || !isset($item['orden'])) {
                $conn->rollBack();
                http_response_code(400);
                echo json_encode(['error' => 'Cada elemento debe tener "id" y "orden"']);
                return;
            }

            $stmt->execute([
                $item['orden'],
                $item['id']
            ]);
        }

        $conn->commit();

        echo json_encode([
            'success' => true,
            'message' => 'Orden actualizado exitosamente'
        ]);

    } catch (PDOException $e) {
        $conn->rollBack();
        http_response_code(500);
        echo json_encode(['error' => 'Error al actualizar orden: ' . $e->getMessage()]);
    }
}

/**
 * DELETE - Eliminar configuración de especialidad
 */
function handleDelete($conn) {
    $id = isset($_GET['id']) ? filter_var($_GET['id'], FILTER_VALIDATE_INT) : null;

    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID es requerido']);
        return;
    }

    try {
        $sql = "DELETE FROM kiosk_especialidad_config WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->execute([$id]);

        echo json_encode([
            'success' => true,
            'message' => 'Especialidad eliminada exitosamente'
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error al eliminar especialidad: ' . $e->getMessage()]);
    }
}

/**
 * Helper: Insertar opciones múltiples
 */
function insertOpciones($conn, $configId, $opciones) {
    $sql = "INSERT INTO kiosk_precio_opciones
            (id_config, nombre_opcion, orden, tipo_precio, id_servicio_particular,
             id_servicio_club, precio_particular_fijo, precio_club_fijo, tabla_origen)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

    $stmt = $conn->prepare($sql);

    foreach ($opciones as $index => $opcion) {
        $stmt->execute([
            $configId,
            $opcion['nombre_opcion'],
            $opcion['orden'] ?? $index,
            $opcion['tipo_precio'] ?? 'id_bd',
            $opcion['id_servicio_particular'] ?? null,
            $opcion['id_servicio_club'] ?? null,
            $opcion['precio_particular_fijo'] ?? null,
            $opcion['precio_club_fijo'] ?? null,
            $opcion['tabla_origen'] ?? 'servicio'
        ]);
    }
}
?>
