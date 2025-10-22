<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once(__DIR__ . '/../db_connect.inc.php');

// El ID del dispensario de Quitumbe es 2
$idDispensario = 2;

// Obtener ID del paciente si está disponible
$idPersona = isset($_GET['idPersona']) ? filter_var($_GET['idPersona'], FILTER_VALIDATE_INT) : null;

// Función para verificar membresía Club Medical
function verificarMembresiaClubMedical($conn, $idPersona) {
    if (!$idPersona) {
        return false;
    }

    try {
        // Se usa idTipoPlan = 15, que según la documentación es el de Club Medical a $10.
        $idTipoPlanClub = 7;

        // Consulta unificada y CORREGIDA para verificar membresía como titular O integrante familiar
        $sql = "SELECT (
                  EXISTS(
                    SELECT 1
                    FROM personaPlan pp
                    WHERE pp.idPersona = :idPersona
                      AND pp.idGrupoPlan = :idPlanClub
                      AND COALESCE(pp.idEstadoPlan, 1) = 1
                      AND (pp.fechaInicio IS NULL OR pp.fechaInicio <= CURDATE())
                      AND (pp.fechaFinalizacion IS NULL OR pp.fechaFinalizacion >= CURDATE())
                  )
                  OR EXISTS(
                    SELECT 1
                    FROM perPlanIntegrante ppi
                    JOIN personaPlan pp ON pp.idPersonaPlan = ppi.idPersonaPlan
                    WHERE ppi.idPersona = :idPersona
                      AND pp.idGrupoPlan = :idPlanClub
                      AND COALESCE(pp.idEstadoPlan, 1) = 1
                      AND COALESCE(ppi.idEstado, 1) = 1
                      AND (pp.fechaInicio IS NULL OR pp.fechaInicio <= CURDATE())
                      AND (pp.fechaFinalizacion IS NULL OR pp.fechaFinalizacion >= CURDATE())
                  )
                ) AS es_miembro_club";

        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':idPersona', $idPersona, PDO::PARAM_INT);
        $stmt->bindParam(':idPlanClub', $idTipoPlanClub, PDO::PARAM_INT);
        $stmt->execute();

        $resultado = $stmt->fetch(PDO::FETCH_ASSOC);

        // El resultado de la consulta será 1 si es miembro, 0 si no lo es.
        return $resultado && $resultado['es_miembro_club'] == 1;

    } catch (PDOException $e) {
        error_log("Error verificando membresía Club Medical: " . $e->getMessage());
        return false;
    }
}

// Función precisa para obtener precio por ID de servicio
function obtenerPrecioPorId($conn, $idTipoServicio) {
    if (!$idTipoServicio) {
        return null;
    }
    try {
        $sql = "SELECT ts.idTipoServicio, ts.descripcion AS servicio,
                       COALESCE(se.precioUnitario, ts.precioReferencial) AS precio
                FROM tipoServicio ts
                LEFT JOIN servicioEmpresa se ON se.idTipoServicio = ts.idTipoServicio AND se.idBioEmpresa = 1
                WHERE ts.idTipoServicio = ?";
        
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(1, $idTipoServicio, PDO::PARAM_INT);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        return $result ? [
            'idTipoServicio' => $result['idTipoServicio'],
            'servicio' => $result['servicio'],
            'precio' => floatval($result['precio'])
        ] : null;

    } catch (PDOException $e) {
        error_log("Error obteniendo precio por ID: " . $e->getMessage());
        return null;
    }
}

try {
    // Verificar membresía Club Medical
    $esClubMedical = verificarMembresiaClubMedical($conn, $idPersona);

    // 1. Función para normalizar strings (a mayúsculas y sin acentos)
    function normalizeString($str) {
        $str = strtoupper(trim($str));
        $unwanted_array = ['Á' => 'A', 'É' => 'E', 'Í' => 'I', 'Ó' => 'O', 'Ú' => 'U'];
        return strtr($str, $unwanted_array);
    }

    // 2. Definir el mapeo de IDs de servicio por ID de especialidad
    // Basado en el archivo mapeo_consultas_medicas.php
    // Estructura: idEspecialidad => ['particular' => idTipoServicio, 'club' => idTipoServicio]
    $servicioIdMapping = [
        // ID: 2 - MEDICINA GENERAL
        2 => ['particular' => 560, 'club' => 668],
        // ID: 8 - PEDIATRÍA
        8 => ['particular' => 1417, 'club' => 669], //Club medica revisar precio, dice $15 cuando es $25
        // ID: 11 - GINECOLOGÍA
        11 => ['particular' => 675, 'club' => 670],
        // ID: 15 - RAYOS X
        15 => null,
        // ID: 16 - OPTOMETRÍA
        16 => null,
        // ID: 21 - LABORATORIO
        21 => null,
        // ID: 23 - IMAGEN
        23 => null,
        // ID: 26 - OBSTETRICIA
        26 => ['particular' => 585, 'club' => 692],
        // ID: 27 - TRAUMATOLOGÍA
        27 => ['particular' => 665, 'club' => 671],
        // ID: 66 - TERAPIA DEL LENGUAJE
        66 => ['particular' => 682, 'club' => 672],
        // ID: 67 - PSICOLOGÍA INFANTIL Y PSICORREHABILITADORA
        67 => ['particular' => 677, 'club' => 673],
        // ID: 68 - TERAPIA OCUPACIONAL Y MULTISENSORIAL
        68 => ['particular' => 683, 'club' => 700],
        // ID: 74 - ODONTOLOGÍA
        74 => ['particular' => 826, 'club' => 826], // Usamos el mismo ID para ambos, el precio se maneja en el mapeo
        // ID: 76 - TERAPIA FÍSICA
        76 => ['particular' => 622, 'club' => 702],
        // ID: 82 - PSICOLOGÍA CLINICA
        82 => ['particular' => 680, 'club' => 676],
        // ID: 91 - NUTRICION
        91 => ['particular' => 796, 'club' => 748],
        // ID: 92 - MÉDICO FAMILIAR
        92 => ['particular' => 803, 'club' => 771],
        // ID: 99 - REUMATOLOGIA
        99 => ['particular' => 869, 'club' => 870],
    ];

    // 3. OPTIMIZACIÓN: Obtener todos los IDs de servicio necesarios del mapeo
    $allServiceIds = [];
    foreach ($servicioIdMapping as $map) {
        if ($map !== null) {
            $allServiceIds[] = $map['particular'];
            $allServiceIds[] = $map['club'];
        }
    }
    $uniqueServiceIds = array_unique($allServiceIds);

    // 4. OPTIMIZACIÓN: Ejecutar UNA SOLA consulta para obtener todos los precios
    $pricesById = [];
    if (!empty($uniqueServiceIds)) {
        $placeholders = implode(',', array_fill(0, count($uniqueServiceIds), '?'));
        $sqlPrecios = "SELECT ts.idTipoServicio, ts.descripcion AS servicio,
                              COALESCE(se.precioUnitario, ts.precioReferencial) AS precio
                       FROM tipoServicio ts
                       LEFT JOIN servicioEmpresa se ON se.idTipoServicio = ts.idTipoServicio AND se.idBioEmpresa = 1
                       WHERE ts.idTipoServicio IN ($placeholders)";
        
        $stmtPrecios = $conn->prepare($sqlPrecios);
        $stmtPrecios->execute(array_values($uniqueServiceIds));
        $priceResults = $stmtPrecios->fetchAll(PDO::FETCH_ASSOC);

        foreach ($priceResults as $row) {
            $pricesById[$row['idTipoServicio']] = $row;
        }
    }

    // 5. Obtener todas las especialidades
    $sql = "SELECT idEspecialidad, descEspecialidad
            FROM especialidad
            WHERE idDispensario = ? AND idEstado = 1
            ORDER BY descEspecialidad";

    $stmt = $conn->prepare($sql);
    $stmt->bindParam(1, $idDispensario, PDO::PARAM_INT);
    $stmt->execute();
    $especialidades = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 6. Iterar y asignar precios usando los datos pre-cargados (sin más consultas)
    foreach ($especialidades as &$especialidad) {
        $idEspecialidad = $especialidad['idEspecialidad'];
        
        $precioRegularInfo = null;
        $precioClubInfo = null;

        // Buscar directamente por ID de especialidad, sin importar el nombre
        if (isset($servicioIdMapping[$idEspecialidad]) && $servicioIdMapping[$idEspecialidad] !== null) {
            $ids = $servicioIdMapping[$idEspecialidad];
            
            if (isset($pricesById[$ids['particular']])) {
                $precioRegularInfo = $pricesById[$ids['particular']];
            }
            if (isset($pricesById[$ids['club']])) {
                $precioClubInfo = $pricesById[$ids['club']];
            }
        }

        $especialidad['precios'] = [
            'particular' => $precioRegularInfo ? floatval($precioRegularInfo['precio']) : null,
            'clubMedical' => $precioClubInfo ? floatval($precioClubInfo['precio']) : null,
            'esClubMedical' => $esClubMedical,
            'idTipoServicioRegular' => $precioRegularInfo ? $precioRegularInfo['idTipoServicio'] : null,
            'idTipoServicioClub' => $precioClubInfo ? $precioClubInfo['idTipoServicio'] : null,
            'servicioRegular' => $precioRegularInfo ? $precioRegularInfo['servicio'] : null,
            'servicioClub' => $precioClubInfo ? $precioClubInfo['servicio'] : null
        ];
    }

    echo json_encode($especialidades);

} catch (PDOException $e) {
    http_response_code(500);
    error_log("Error en get_especialidades.php: " . $e->getMessage());
    echo json_encode(["error" => "Error en la consulta: " . $e->getMessage()]);
}
?>
