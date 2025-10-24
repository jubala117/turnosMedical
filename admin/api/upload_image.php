<?php
/**
 * API para upload de imágenes personalizadas de especialidades
 * Maneja validación, redimensionamiento y almacenamiento
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Manejar OPTIONS para CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Solo permitir POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit();
}

// Configuración
$uploadDir = __DIR__ . '/../uploads/especialidades/';
$maxFileSize = 5 * 1024 * 1024; // 5MB
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
$allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

// Crear directorio si no existe
if (!is_dir($uploadDir)) {
    if (!mkdir($uploadDir, 0777, true)) {
        throw new Exception('No se pudo crear el directorio de uploads. Verifica permisos del servidor.');
    }
}

// Verificar permisos de escritura
if (!is_writable($uploadDir)) {
    throw new Exception('El directorio de uploads no tiene permisos de escritura. Path: ' . $uploadDir);
}

try {
    // Validar que se envió un archivo
    if (!isset($_FILES['image']) || $_FILES['image']['error'] === UPLOAD_ERR_NO_FILE) {
        throw new Exception('No se envió ningún archivo');
    }

    $file = $_FILES['image'];

    // Validar errores de upload
    if ($file['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('Error al subir archivo: ' . getUploadErrorMessage($file['error']));
    }

    // Validar tamaño
    if ($file['size'] > $maxFileSize) {
        throw new Exception('El archivo es demasiado grande. Máximo 5MB');
    }

    // Validar tipo MIME
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    if (!in_array($mimeType, $allowedTypes)) {
        throw new Exception('Tipo de archivo no permitido. Solo se permiten imágenes JPG, PNG, GIF y WebP');
    }

    // Validar extensión
    $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($extension, $allowedExtensions)) {
        throw new Exception('Extensión de archivo no válida');
    }

    // Generar nombre único
    $filename = uniqid('esp_') . '_' . time() . '.' . $extension;
    $filepath = $uploadDir . $filename;
    $relativePath = 'admin/uploads/especialidades/' . $filename;

    // Mover archivo
    if (!move_uploaded_file($file['tmp_name'], $filepath)) {
        throw new Exception('Error al guardar el archivo');
    }

    // Opcional: Redimensionar imagen para optimización
    // DESHABILITADO: Requiere extensión GD de PHP
    // Para habilitar: Activa extension=gd en php.ini y reinicia Apache
    /*
    try {
        resizeImage($filepath, 400, 400);
    } catch (Exception $e) {
        // Si falla el redimensionamiento, continuar con la imagen original
        error_log('Error al redimensionar: ' . $e->getMessage());
    }
    */

    echo json_encode([
        'success' => true,
        'filename' => $filename,
        'path' => $relativePath,
        'url' => '../' . $relativePath,
        'size' => filesize($filepath)
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

/**
 * Obtener mensaje de error de upload
 */
function getUploadErrorMessage($code) {
    $errors = [
        UPLOAD_ERR_INI_SIZE => 'El archivo excede el tamaño máximo permitido',
        UPLOAD_ERR_FORM_SIZE => 'El archivo excede el tamaño máximo del formulario',
        UPLOAD_ERR_PARTIAL => 'El archivo se subió parcialmente',
        UPLOAD_ERR_NO_FILE => 'No se subió ningún archivo',
        UPLOAD_ERR_NO_TMP_DIR => 'Falta la carpeta temporal',
        UPLOAD_ERR_CANT_WRITE => 'Error al escribir el archivo',
        UPLOAD_ERR_EXTENSION => 'Una extensión de PHP detuvo la subida'
    ];
    return $errors[$code] ?? 'Error desconocido';
}

/**
 * Redimensionar imagen manteniendo proporción
 */
function resizeImage($filepath, $maxWidth, $maxHeight) {
    $info = getimagesize($filepath);
    if (!$info) {
        throw new Exception('No se pudo leer la imagen');
    }

    list($width, $height, $type) = $info;

    // Si la imagen ya es pequeña, no redimensionar
    if ($width <= $maxWidth && $height <= $maxHeight) {
        return;
    }

    // Calcular nuevas dimensiones manteniendo proporción
    $ratio = min($maxWidth / $width, $maxHeight / $height);
    $newWidth = round($width * $ratio);
    $newHeight = round($height * $ratio);

    // Crear imagen según tipo
    switch ($type) {
        case IMAGETYPE_JPEG:
            $src = imagecreatefromjpeg($filepath);
            break;
        case IMAGETYPE_PNG:
            $src = imagecreatefrompng($filepath);
            break;
        case IMAGETYPE_GIF:
            $src = imagecreatefromgif($filepath);
            break;
        case IMAGETYPE_WEBP:
            $src = imagecreatefromwebp($filepath);
            break;
        default:
            throw new Exception('Tipo de imagen no soportado para redimensionar');
    }

    if (!$src) {
        throw new Exception('Error al crear imagen fuente');
    }

    // Crear imagen de destino
    $dst = imagecreatetruecolor($newWidth, $newHeight);

    // Preservar transparencia para PNG y GIF
    if ($type === IMAGETYPE_PNG || $type === IMAGETYPE_GIF) {
        imagealphablending($dst, false);
        imagesavealpha($dst, true);
        $transparent = imagecolorallocatealpha($dst, 255, 255, 255, 127);
        imagefilledrectangle($dst, 0, 0, $newWidth, $newHeight, $transparent);
    }

    // Redimensionar
    imagecopyresampled($dst, $src, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);

    // Guardar según tipo
    switch ($type) {
        case IMAGETYPE_JPEG:
            imagejpeg($dst, $filepath, 90);
            break;
        case IMAGETYPE_PNG:
            imagepng($dst, $filepath, 9);
            break;
        case IMAGETYPE_GIF:
            imagegif($dst, $filepath);
            break;
        case IMAGETYPE_WEBP:
            imagewebp($dst, $filepath, 90);
            break;
    }

    // Liberar memoria
    imagedestroy($src);
    imagedestroy($dst);
}
?>
