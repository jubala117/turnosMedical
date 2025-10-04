<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once(__DIR__ . '/../db_connect.inc.php');

// Función para calcular precio Club Medical según las nuevas reglas
function calcularPrecioClub($precioParticular) {
    if ($precioParticular < 120) {
        // Descuento fijo de $5 para precios < 120
        return $precioParticular - 5;
    } else {
        // Descuento fijo de $10 para precios >= 120
        return $precioParticular - 10;
    }
}

try {
    // Mapeo de nombres de exámenes a IDs de tipoexamenlab
    $mapeo_examenes = [
        'ECO ABDOMEN SUPERIOR' => [2545],
        'ECO HIGADO Y V. BILIARES' => [2546],
        'ECO RENAL BILATERAL' => [2547],
        'ECO PELVICO (MUJER)' => [2548],
        'ECO TRANSVAGINAL' => [2549],
        'ECO OBSTETRICO NORMAL' => [2550],
        'ECO OBSTETRICO MARCADORES CROMOSOMICOS (9 A 14 SEMANAS, DESCARTAR MALFORMACIONES)' => [2551],
        'ECO OBSTETRICO ANATOMICO O MORFOGENETICO (19 A 24 SEMANAS)' => [2552],
        'ECO PERFIL BIOFISICO FETAL' => [2553],
        'ECO PROSTATICO: TRASVESICAL' => [2554],
        'ECO PROSTATICO: TRANSRECTAL' => [2555],
        'ECO CUELLO' => [2556],
        'ECO DE TIROIDES CON DOPPLER' => [2557],
        'ECO PARED ABDOMINAL' => [2558],
        'ECO MAMARIO BILATERAL' => [2559],
        'ECO TESTICULAR' => [2560],
        'ECO TALLA VESICAL' => [2561],
        'ECO MUSCULO ESQUELETICO' => [2562],
        'ECO TRANSFONTANELAR' => [2563],
        'ECO DE CADERA PEDIATRICA' => [2564],
        'ECO DOPPLER CAROTIDEO Y VERTEBRAL' => [4128],
        'ECO DOPPLER RENAL' => [4129],
        'ECO DOPPLER MIEMBRO UNILATERAL (ART O VENOSO)' => [4130],
        'ECO DOPPLER MIEMBROS BILATERAL (ART O VENOSO)' => [4131],
        'ECO DOPPLER SISTEMA PORTA' => [4132],
        'ECO DOPPLER TESTICULAR' => [4133]
    ];

    $examenes_resultado = [];

    foreach ($mapeo_examenes as $nombre_examen => $ids) {
        // Construir la consulta para buscar en tipoexamenlab
        $placeholders = str_repeat('?,', count($ids) - 1) . '?';
        $sql = "SELECT idTipoExamenLab, descTipoExamen, precioUnitario
                FROM tipoexamenlab 
                WHERE idTipoExamenLab IN ($placeholders)";
        
        $stmt = $conn->prepare($sql);
        $stmt->execute($ids);
        $resultados = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if ($resultados && count($resultados) > 0) {
            // Usar el primer resultado encontrado
            $resultado = $resultados[0];
            $precio_particular = floatval($resultado['precioUnitario']);
            
            // Calcular precio Club Medical automáticamente
            $precio_club = calcularPrecioClub($precio_particular);
            
            $examenes_resultado[] = [
                'descripcion' => $nombre_examen,
                'precio_particular' => $precio_particular,
                'precio_club' => $precio_club,
                'fuente' => 'bd'
            ];
        } else {
            // Si no se encuentra el examen en la base de datos
            $examenes_resultado[] = [
                'descripcion' => $nombre_examen,
                'precio_particular' => 0,
                'precio_club' => 0,
                'fuente' => 'no_encontrado',
                'error' => 'Examen no encontrado en la base de datos'
            ];
        }
    }

    echo json_encode($examenes_resultado);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error en la consulta: " . $e->getMessage()]);
}
?>
