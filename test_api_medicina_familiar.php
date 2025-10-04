<?php
$url = "http://localhost/turnosMedical/API/get_especialidades.php";
$response = file_get_contents($url);
$especialidades = json_decode($response, true);

if ($especialidades) {
    echo "=== RESPUESTA COMPLETA DE LA API ===\n\n";
    
    foreach ($especialidades as $esp) {
        if (strpos(strtoupper($esp['descEspecialidad']), 'MEDICINA FAMILIAR') !== false || 
            strpos(strtoupper($esp['descEspecialidad']), 'MEDICO FAMILIAR') !== false) {
            echo "Especialidad: " . $esp['descEspecialidad'] . "\n";
            echo "ID Especialidad: " . $esp['idEspecialidad'] . "\n";
            echo "Precios: " . json_encode($esp['precios'], JSON_PRETTY_PRINT) . "\n";
            echo "---\n";
        }
    }
    
    // También mostrar todas las especialidades para verificar
    echo "\n=== TODAS LAS ESPECIALIDADES ===\n";
    foreach ($especialidades as $esp) {
        echo $esp['descEspecialidad'] . " - ";
        if ($esp['precios']['particular']) {
            echo "Particular: " . $esp['precios']['particular'] . ", Club: " . $esp['precios']['clubMedical'] . "\n";
        } else {
            echo "Precios no disponibles\n";
        }
    }
} else {
    echo "❌ No se pudo obtener respuesta de la API\n";
}
?>
