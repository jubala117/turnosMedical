<?php
// Script para probar directamente la API de verificación de pacientes
header("Content-Type: text/plain");

echo "=== PRUEBA DIRECTA DE LA API verificar_paciente.php ===\n\n";

// Simular una llamada GET a la API
$cedula = '0502417025'; // La cédula que sabemos que existe
$url = "http://localhost/turnosMedical/API/verificar_paciente.php?cedula=" . $cedula;

echo "URL de prueba: " . $url . "\n\n";

// Usar file_get_contents para hacer la petición
$context = stream_context_create([
    'http' => [
        'method' => 'GET',
        'header' => 'Content-Type: application/json'
    ]
]);

try {
    $response = file_get_contents($url, false, $context);
    
    if ($response === FALSE) {
        echo "ERROR: No se pudo conectar a la API\n";
        echo "Error: " . error_get_last()['message'] . "\n";
    } else {
        echo "Respuesta de la API:\n";
        echo $response . "\n";
        
        // Decodificar JSON para análisis
        $data = json_decode($response, true);
        echo "\nAnálisis de la respuesta:\n";
        print_r($data);
    }
} catch (Exception $e) {
    echo "EXCEPCIÓN: " . $e->getMessage() . "\n";
}

echo "\n=== FIN DE LA PRUEBA ===\n";
?>
