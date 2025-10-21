<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once(__DIR__ . '/../db_connect.inc.php');
require_once(__DIR__ . '/utils.php');

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

    // OPTIMIZACIÓN: Recolectar todos los IDs primero para hacer una sola query
    $todosLosIDs = [];
    foreach ($mapeo_examenes as $ids) {
        $todosLosIDs = array_merge($todosLosIDs, $ids);
    }
    $todosLosIDs = array_unique($todosLosIDs);

    // Ejecutar UNA SOLA query para todos los exámenes (en vez de 26 queries)
    $placeholders = str_repeat('?,', count($todosLosIDs) - 1) . '?';
    $sql = "SELECT idTipoExamenLab, descTipoExamen, precioUnitario
            FROM tipoexamenlab
            WHERE idTipoExamenLab IN ($placeholders)";

    $stmt = $conn->prepare($sql);
    $stmt->execute(array_values($todosLosIDs));
    $resultadosDB = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Indexar resultados por ID para búsqueda O(1)
    $preciosPorID = [];
    foreach ($resultadosDB as $row) {
        $preciosPorID[$row['idTipoExamenLab']] = $row;
    }

    // Ahora construir el resultado final sin hacer queries adicionales
    $examenes_resultado = [];
    foreach ($mapeo_examenes as $nombre_examen => $ids) {
        // Buscar el precio en el índice (sin query, solo lookup)
        $idExamen = $ids[0]; // Usar el primer ID del mapeo

        if (isset($preciosPorID[$idExamen])) {
            $resultado = $preciosPorID[$idExamen];
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

    sendSuccess($examenes_resultado);

} catch (PDOException $e) {
    handleError($e, 'get_examenes_eco');
}
?>
