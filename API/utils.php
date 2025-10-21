<?php
/**
 * Utilidades compartidas para APIs
 * Centraliza funciones comunes para evitar duplicación de código
 */

/**
 * Maneja errores de manera estandarizada
 * No expone detalles técnicos al cliente, pero registra en logs
 *
 * @param Exception $e La excepción capturada
 * @param string $context Contexto del error (ej: 'get_especialidades')
 * @param int $httpCode Código HTTP a retornar (default: 500)
 */
function handleError($e, $context = 'API', $httpCode = 500) {
    // Registrar error completo en logs del servidor (con detalles técnicos)
    error_log("[$context] Error: " . $e->getMessage() . " | File: " . $e->getFile() . " | Line: " . $e->getLine());

    // Retornar respuesta genérica al cliente (sin exponer detalles internos)
    http_response_code($httpCode);
    echo json_encode([
        "error" => "Error al procesar la solicitud",
        "message" => "Por favor, intente nuevamente. Si el problema persiste, contacte al administrador.",
        "code" => $httpCode
    ]);
}

/**
 * Envía una respuesta exitosa en formato JSON
 *
 * @param mixed $data Datos a retornar
 * @param int $httpCode Código HTTP (default: 200)
 */
function sendSuccess($data, $httpCode = 200) {
    http_response_code($httpCode);
    echo json_encode($data);
}

/**
 * Valida que un parámetro exista y sea válido
 *
 * @param mixed $value Valor a validar
 * @param string $paramName Nombre del parámetro (para mensajes de error)
 * @param string $type Tipo esperado: 'int', 'string', 'email'
 * @return mixed Valor validado o null si es inválido
 */
function validateParam($value, $paramName, $type = 'string') {
    if ($value === null || $value === '') {
        return null;
    }

    switch ($type) {
        case 'int':
            $validated = filter_var($value, FILTER_VALIDATE_INT, ["options" => ["min_range" => 1]]);
            return $validated !== false ? $validated : null;

        case 'email':
            return filter_var($value, FILTER_VALIDATE_EMAIL) ?: null;

        case 'string':
            return trim(htmlspecialchars($value, ENT_QUOTES, 'UTF-8'));

        default:
            return $value;
    }
}

/**
 * Calcula precio Club Medical según las reglas de negocio
 *
 * @param float $precioParticular Precio particular/normal
 * @return float Precio con descuento Club Medical
 */
function calcularPrecioClub($precioParticular) {
    if ($precioParticular < 120) {
        // Descuento fijo de $5 para precios < 120
        return max(0, $precioParticular - 5);
    } else {
        // Descuento fijo de $10 para precios >= 120
        return max(0, $precioParticular - 10);
    }
}

/**
 * Valida y retorna error 400 si el parámetro es inválido
 *
 * @param mixed $value Valor a validar
 * @param string $paramName Nombre del parámetro
 * @param string $type Tipo esperado
 * @return mixed Valor validado
 */
function requireParam($value, $paramName, $type = 'string') {
    $validated = validateParam($value, $paramName, $type);

    if ($validated === null) {
        http_response_code(400);
        echo json_encode([
            "error" => "Parámetro inválido",
            "message" => "El parámetro '$paramName' es requerido y debe ser de tipo $type",
            "code" => 400
        ]);
        exit();
    }

    return $validated;
}
?>
