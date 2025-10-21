<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once(__DIR__ . '/../db_connect.inc.php');

try {
    // Mapeo de procedimientos de Rayos X a IDs de tipoexamenlab
    // Formato: 'NOMBRE_PROCEDIMIENTO' => [id_particular, id_club_medical],
    $mapeo_rx = [
        // ==========================================
        // CRANEO
        // ==========================================
        'CRANEO AP - LAT' => [1020, 4056],
        'WATERS' => [1021, 4057],
        'SENOS PARANASALES 2 POSCIONES' => [1052, 4058],
        'SENOS PARANASALES 3 POSCIONES' => [1022, 4059],
        'ORBITAS' => [1023, 4060],
        'ARTICULACION TEMPOROMANDIBULAR UNILATERAL' => [1024, 4061],
        'ARTICULACION TEMPOROMANDIBULAR BILATERAL' => [1025, 4062],
        'MAXILAR INFERIOR' => [1026, 4063],
        'HUESOS PROPIOS DE LA NARIZ' => [1027, 4064],
        'CAVUN' => [1028, 4065],
        
        // ==========================================
        // EXTREMIDADES SUPERIORES
        // ==========================================
        'HOMBRO AP UNILATERAL' => [4050, 4066],
        'HOMBRO AP BILATERAL' => [1761, 4067],
        'HOMBRO AP-AXIAL UNILATERAL' => [4051, 4068],
        'HOMBRO AP-AXIAL BILATERAL' => [1760, 4069],
        'BRAZO (HUMERO) AP-LAT' => [4052, 4070],
        'CODO AP-LAT' => [1034, 4071],
        'ANTEBRAZO AP-LAT' => [1035, 4072],
        'MUÑECA AP-LAT' => [1036, 4076],
        'MANO AP-LAT' => [1037, 4078],
        'DEDOS AP-LAT' => [1038, 4081],
        'PLACA ADICIONAL' => [1039, 4082],
        
        // ==========================================
        // EXTREMIDADES INFERIORES
        // ==========================================
        'FEMUR (MUSLO) AP-LAT' => [4083, 4084],
        'RODILLA AP-LAT' => [1041, 4085],
        'PIERNA AP-LAT' => [1042, 4088],
        'TOBILLO AP-LAT' => [1043, 4089],
        'PIE AP-LAT' => [1044, 4091],
        'CALCANEOS' => [1045, 4093],
        
        // ==========================================
        // TORAX
        // ==========================================
        'TORAX ESTÁNDAR PA' => [1048, 2542],
        'TORAX ESTANDAR PA. LATERAL' => [441, 2543],
        'TELERADIOGRAFIA PA' => [1048, 4094],
        'TORAX OSEO PA- OBLICUA' => [1049, 4095],
        
        // ==========================================
        // ABDOMEN
        // ==========================================
        'ABDOMEN SIMPLE 1 POSC' => [1050, 4096],
        'ABDOMEN SIMPLE 2 POSC' => [1051, 4097],
        
        // ==========================================
        // PELVIS
        // ==========================================
        'PELVIS NIÑO AP' => [1367, 4098],
        'PELVIS NIÑO AP-AXL' => [1055, 4099],
        'PELVIS ADULTO AP' => [1274, 4100],
        'CADERA 1 POSICION' => [1626, 4101],
        'CADERA 2 POSICIONES' => [1627, 4102],
        'PELVIS ADULTO AP-AXL' => [1054, 4103],
        
        // ==========================================
        // COLUMNA VERTEBRAL
        // ==========================================
        'CERVICAL AP-LAT' => [1056, 4104],
        'DORSAL AP-LAT' => [1057, 2518],
        'LUMBAR AP-LAT' => [440, 2527],
        'DORSO LUMBAR AP Y LAT' => [1059, 4105],
        'SACRO-COXIS' => [1060, 4106],
        'COLUMNA LUMBO-SACRA' => [1061, 4107],
        
        // ==========================================
        // ESTUDIOS CONTRASTADOS
        // ==========================================
        'COLON POR ENEMA' => [4053, 4108],
        'TRANSITO INTESTINAL' => [4054, 4109],
        'ESOFAGOGRAMA' => [4055, 4110],
    ];

    // Extraer todos los IDs únicos para la consulta
    $todosLosIDs = [];
    foreach ($mapeo_rx as $ids) {
        $todosLosIDs = array_merge($todosLosIDs, $ids);
    }
    $todosLosIDs = array_unique($todosLosIDs);

    // Consulta para obtener todos los precios
    $placeholders = str_repeat('?,', count($todosLosIDs) - 1) . '?';
    $sql = "SELECT idTipoExamenLab, descTipoExamen, precioUnitario 
            FROM tipoexamenlab 
            WHERE idTipoExamenLab IN ($placeholders)";
    
    $stmt = $conn->prepare($sql);
    $stmt->execute(array_values($todosLosIDs));
    $resultados = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Crear un array indexado por ID para búsqueda rápida
    $preciosPorID = [];
    $descripcionesPorID = [];
    foreach ($resultados as $row) {
        $preciosPorID[$row['idTipoExamenLab']] = floatval($row['precioUnitario']);
        $descripcionesPorID[$row['idTipoExamenLab']] = $row['descTipoExamen'];
    }

    $procedimientos_resultado = [];

    foreach ($mapeo_rx as $nombre_procedimiento => $ids) {
        $precio_particular = isset($preciosPorID[$ids[0]]) ? $preciosPorID[$ids[0]] : 0;
        $precio_club = isset($preciosPorID[$ids[1]]) ? $preciosPorID[$ids[1]] : 0;
        
        // Obtener descripciones reales de la base de datos si están disponibles
        $descripcion_particular = isset($descripcionesPorID[$ids[0]]) ? $descripcionesPorID[$ids[0]] : $nombre_procedimiento;
        $descripcion_club = isset($descripcionesPorID[$ids[1]]) ? $descripcionesPorID[$ids[1]] : $nombre_procedimiento;
        
        $procedimientos_resultado[] = [
            'descripcion' => $nombre_procedimiento,
            'descripcion_particular' => $descripcion_particular,
            'descripcion_club' => $descripcion_club,
            'precio_particular' => $precio_particular,
            'precio_club' => $precio_club,
            'id_particular' => $ids[0],
            'id_club' => $ids[1],
            'fuente' => ($precio_particular > 0 || $precio_club > 0) ? 'bd' : 'no_encontrado'
        ];
    }

    echo json_encode($procedimientos_resultado);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error en la consulta: " . $e->getMessage()]);
}
?>
