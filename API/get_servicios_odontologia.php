<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once(__DIR__ . '/../db_connect.inc.php');

try {
    // Incluir el mapeo generado por los agentes
    require_once(__DIR__ . '/../agentic_dev/mapeo_odontologia_empresa.php');

    // Extraer todos los IDs únicos para la consulta
    $todosLosIDs = [];
    foreach ($mapeo_odontologia as $servicio => $opciones) {
        foreach ($opciones as $opcion) {
            if (!empty($opcion)) {
                $todosLosIDs[] = $opcion[0]; // ID del servicio
            }
        }
    }
    $todosLosIDs = array_unique($todosLosIDs);

    // Consulta para obtener todos los precios de los servicios
    $preciosPorID = [];
    if (!empty($todosLosIDs)) {
        $placeholders = str_repeat('?,', count($todosLosIDs) - 1) . '?';
        $sql = "SELECT ts.idTipoServicio, ts.descripcion AS servicio,
                       COALESCE(se.precioUnitario, ts.precioReferencial) AS precio
                FROM tipoServicio ts
                LEFT JOIN servicioEmpresa se ON se.idTipoServicio = ts.idTipoServicio AND se.idBioEmpresa = 1
                WHERE ts.idTipoServicio IN ($placeholders)";
        
        $stmt = $conn->prepare($sql);
        $stmt->execute(array_values($todosLosIDs));
        $resultados = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Crear un array indexado por ID para búsqueda rápida
        foreach ($resultados as $row) {
            $preciosPorID[$row['idTipoServicio']] = [
                'precio' => floatval($row['precio']),
                'descripcion' => $row['servicio']
            ];
        }
    }

    $servicios_resultado = [];

    foreach ($mapeo_odontologia as $nombre_servicio => $opciones) {
        $opciones_con_precios = [];
        
        foreach ($opciones as $opcion) {
            if (!empty($opcion)) {
                $id_servicio = $opcion[0];
                $precio_club = $opcion[1];
                
                $precio_particular = isset($preciosPorID[$id_servicio]) ? 
                    $preciosPorID[$id_servicio]['precio'] : 0;
                
                $descripcion_bd = isset($preciosPorID[$id_servicio]) ? 
                    $preciosPorID[$id_servicio]['descripcion'] : 'Servicio no encontrado';
                
                $opciones_con_precios[] = [
                    'id_servicio' => $id_servicio,
                    'descripcion_bd' => $descripcion_bd,
                    'precio_particular' => $precio_particular,
                    'precio_club' => $precio_club
                ];
            }
        }

        // Determinar si el servicio fue encontrado
        $encontrado = !empty($opciones_con_precios);
        
        $servicios_resultado[] = [
            'servicio' => $nombre_servicio,
            'encontrado' => $encontrado,
            'opciones' => $opciones_con_precios,
            'total_opciones' => count($opciones_con_precios),
            'precio_particular_min' => $encontrado ? min(array_column($opciones_con_precios, 'precio_particular')) : 0,
            'precio_club_min' => $encontrado ? min(array_column($opciones_con_precios, 'precio_club')) : 0
        ];
    }

    echo json_encode($servicios_resultado);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error en la consulta: " . $e->getMessage()]);
}
?>
