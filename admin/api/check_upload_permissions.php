<?php
/**
 * Script para verificar permisos de upload
 * Acceder desde: admin/api/check_upload_permissions.php
 */

header("Content-Type: application/json; charset=UTF-8");

$uploadDir = __DIR__ . '/../uploads/especialidades/';
$results = [];

// Verificar si el directorio existe
$results['dir_exists'] = is_dir($uploadDir);
$results['dir_path'] = $uploadDir;
$results['dir_absolute'] = realpath($uploadDir);

// Verificar permisos
if (is_dir($uploadDir)) {
    $results['is_readable'] = is_readable($uploadDir);
    $results['is_writable'] = is_writable($uploadDir);
    $results['permissions'] = substr(sprintf('%o', fileperms($uploadDir)), -4);

    // Intentar crear un archivo de prueba
    $testFile = $uploadDir . 'test_' . time() . '.txt';
    try {
        $written = file_put_contents($testFile, 'test');
        if ($written !== false) {
            $results['can_write'] = true;
            $results['test_file'] = $testFile;
            // Eliminar archivo de prueba
            unlink($testFile);
        } else {
            $results['can_write'] = false;
            $results['error'] = 'file_put_contents returned false';
        }
    } catch (Exception $e) {
        $results['can_write'] = false;
        $results['error'] = $e->getMessage();
    }
} else {
    $results['error'] = 'Directory does not exist';
}

// Info del servidor
$results['server_user'] = get_current_user();
$results['php_version'] = PHP_VERSION;
$results['upload_max_filesize'] = ini_get('upload_max_filesize');
$results['post_max_size'] = ini_get('post_max_size');

echo json_encode($results, JSON_PRETTY_PRINT);
?>
