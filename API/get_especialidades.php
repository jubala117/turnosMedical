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
    // Estructura mejorada: idEspecialidad => ['opciones' => array de opciones o null si es simple]
    // Cada opción puede tener: 'nombre', 'particular', 'club', 'tabla'
    // 'tabla' puede ser 'servicio' (tipoServicio) o 'examen' (tipoExamenLab)
    $servicioIdMapping = [
        // ID: 2 - MEDICINA GENERAL
        2 => ['particular' => 560, 'club' => 668, 'tabla' => 'servicio'],

        // ID: 8 - PEDIATRÍA
        8 => ['particular' => 1417, 'club' => 669, 'tabla' => 'examen'], // 1417 está en tipoExamenLab

        // ID: 11 - GINECOLOGÍA - CON OPCIONES
        11 => [
            'opciones' => [
                [
                    'nombre' => 'Consulta Ginecológica',
                    'particular' => 675,
                    'club' => 670,
                    'tabla' => 'servicio'
                ],
                [
                    'nombre' => 'Consulta Ginecológica + PAP',
                    'particular' => 698,
                    'club' => 699,
                    'tabla' => 'servicio'
                ]
            ]
        ],

        // ID: 15 - RAYOS X
        15 => null,

        // ID: 16 - OPTOMETRÍA
        16 => [
            'particular' => null,
            'club' => null,
            'tabla' => 'servicio',
            'precioFijo' => ['particular' => 5, 'club' => 0]  // $5 particular, Gratis para club
        ],

        // ID: 21 - LABORATORIO
        21 => null,
        // ID: 23 - IMAGEN
        23 => null,

        // ID: 26 - OBSTETRICIA
        26 => ['particular' => 585, 'club' => 692, 'tabla' => 'servicio'],

        // ID: 27 - TRAUMATOLOGÍA
        27 => ['particular' => 665, 'club' => 671, 'tabla' => 'servicio'],

        // ID: 66 - TERAPIA DEL LENGUAJE - CON OPCIONES
        66 => [
            'opciones' => [
                [
                    'nombre' => 'Primera Sesión',
                    'particular' => 797,
                    'club' => 865,
                    'tabla' => 'servicio'
                ],
                [
                    'nombre' => 'Siguientes Sesiones',
                    'particular' => 682,
                    'club' => 672,
                    'tabla' => 'servicio'
                ]
            ]
        ],

        // ID: 67 - PSICOLOGÍA INFANTIL Y PSICORREHABILITADORA - CON OPCIONES
        67 => [
            'opciones' => [
                [
                    'nombre' => 'Una Hora',
                    'particular' => 679,
                    'club' => 673,
                    'tabla' => 'servicio'
                ],
                [
                    'nombre' => 'Media Hora',
                    'particular' => null, // No definido aún
                    'club' => 919,
                    'tabla' => 'servicio'
                ]
            ]
        ],

        // ID: 68 - TERAPIA OCUPACIONAL Y MULTISENSORIAL - CON OPCIONES
        68 => [
            'opciones' => [
                [
                    'nombre' => 'Primera Sesión',
                    'particular' => null, // Se usará precio fijo $20
                    'club' => null, // Se usará precio fijo $28
                    'tabla' => 'servicio',
                    'precioFijo' => ['particular' => 20, 'club' => 28]
                ],
                [
                    'nombre' => 'Siguientes Sesiones',
                    'particular' => 683,
                    'club' => 700,
                    'tabla' => 'servicio'
                ]
            ]
        ],

        // ID: 74 - ODONTOLOGÍA
        74 => ['particular' => 826, 'club' => 826, 'tabla' => 'servicio'],

        // ID: 76 - TERAPIA FÍSICA
        76 => ['particular' => 622, 'club' => 702, 'tabla' => 'servicio'],

        // ID: 82 - PSICOLOGÍA CLINICA - CON OPCIONES
        82 => [
            'opciones' => [
                [
                    'nombre' => 'Una Hora',
                    'particular' => 866,
                    'club' => 859,
                    'tabla' => 'servicio'
                ],
                [
                    'nombre' => 'Media Hora',
                    'particular' => 680,
                    'club' => 676,
                    'tabla' => 'servicio'
                ]
            ]
        ],

        // ID: 91 - NUTRICION - CON OPCIONES
        91 => [
            'opciones' => [
                [
                    'nombre' => 'Primera Sesión',
                    'particular' => 796,
                    'club' => 748,
                    'tabla' => 'servicio'
                ],
                [
                    'nombre' => 'Seguimiento',
                    'particular' => 867,
                    'club' => 868,
                    'tabla' => 'servicio'
                ]
            ]
        ],

        // ID: 92 - MÉDICO FAMILIAR
        92 => ['particular' => 803, 'club' => 771, 'tabla' => 'servicio'],

        // ID: 99 - REUMATOLOGIA
        99 => ['particular' => 869, 'club' => 870, 'tabla' => 'servicio'],
    ];

    // 3. OPTIMIZACIÓN: Obtener todos los IDs necesarios del mapeo, separados por tabla
    $serviceIds = []; // IDs de tipoServicio
    $examenIds = [];  // IDs de tipoExamenLab

    foreach ($servicioIdMapping as $map) {
        if ($map === null) continue;

        // Si tiene opciones múltiples
        if (isset($map['opciones'])) {
            foreach ($map['opciones'] as $opcion) {
                $tabla = $opcion['tabla'] ?? 'servicio';

                if ($tabla === 'examen') {
                    if ($opcion['particular']) $examenIds[] = $opcion['particular'];
                    if ($opcion['club']) $examenIds[] = $opcion['club'];
                } else {
                    if ($opcion['particular']) $serviceIds[] = $opcion['particular'];
                    if ($opcion['club']) $serviceIds[] = $opcion['club'];
                }
            }
        }
        // Si es simple (un solo precio)
        else {
            $tabla = $map['tabla'] ?? 'servicio';

            if ($tabla === 'examen') {
                if ($map['particular']) $examenIds[] = $map['particular'];
                if ($map['club']) $examenIds[] = $map['club'];
            } else {
                if ($map['particular']) $serviceIds[] = $map['particular'];
                if ($map['club']) $serviceIds[] = $map['club'];
            }
        }
    }

    $serviceIds = array_unique(array_filter($serviceIds));
    $examenIds = array_unique(array_filter($examenIds));

    // 4. OPTIMIZACIÓN: Ejecutar consultas para obtener todos los precios de ambas tablas
    $pricesById = [];

    // 4.1. Consulta para tipoServicio
    if (!empty($serviceIds)) {
        $placeholders = implode(',', array_fill(0, count($serviceIds), '?'));
        $sqlPrecios = "SELECT ts.idTipoServicio AS id, ts.descripcion AS servicio,
                              COALESCE(se.precioUnitario, ts.precioReferencial) AS precio,
                              'servicio' AS tipo_tabla
                       FROM tipoServicio ts
                       LEFT JOIN servicioEmpresa se ON se.idTipoServicio = ts.idTipoServicio AND se.idBioEmpresa = 1
                       WHERE ts.idTipoServicio IN ($placeholders)";

        $stmtPrecios = $conn->prepare($sqlPrecios);
        $stmtPrecios->execute(array_values($serviceIds));
        $priceResults = $stmtPrecios->fetchAll(PDO::FETCH_ASSOC);

        foreach ($priceResults as $row) {
            $pricesById[$row['id']] = $row;
        }
    }

    // 4.2. Consulta para tipoExamenLab
    if (!empty($examenIds)) {
        $placeholders = implode(',', array_fill(0, count($examenIds), '?'));
        $sqlExamenes = "SELECT idTipoExamenLab AS id, descTipoExamen AS servicio,
                               precioUnitario AS precio,
                               'examen' AS tipo_tabla
                        FROM tipoExamenLab
                        WHERE idTipoExamenLab IN ($placeholders)";

        $stmtExamenes = $conn->prepare($sqlExamenes);
        $stmtExamenes->execute(array_values($examenIds));
        $examenResults = $stmtExamenes->fetchAll(PDO::FETCH_ASSOC);

        foreach ($examenResults as $row) {
            $pricesById[$row['id']] = $row;
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

        // Verificar si esta especialidad tiene mapeo
        if (!isset($servicioIdMapping[$idEspecialidad]) || $servicioIdMapping[$idEspecialidad] === null) {
            $especialidad['precios'] = [
                'particular' => null,
                'clubMedical' => null,
                'esClubMedical' => $esClubMedical,
                'tieneOpciones' => false
            ];
            continue;
        }

        $mapConfig = $servicioIdMapping[$idEspecialidad];

        // CASO 1: Especialidad con OPCIONES MÚLTIPLES
        if (isset($mapConfig['opciones'])) {
            $especialidad['tieneOpciones'] = true;
            $especialidad['opciones'] = [];

            foreach ($mapConfig['opciones'] as $opcionConfig) {
                $opcion = [
                    'nombre' => $opcionConfig['nombre'],
                    'esClubMedical' => $esClubMedical
                ];

                // Manejar precios fijos si existen
                if (isset($opcionConfig['precioFijo'])) {
                    $opcion['particular'] = floatval($opcionConfig['precioFijo']['particular']);
                    $opcion['clubMedical'] = floatval($opcionConfig['precioFijo']['club']);
                    $opcion['idTipoServicioRegular'] = null;
                    $opcion['idTipoServicioClub'] = null;
                } else {
                    // Buscar precios en la BD
                    $precioRegularInfo = null;
                    $precioClubInfo = null;

                    if ($opcionConfig['particular'] && isset($pricesById[$opcionConfig['particular']])) {
                        $precioRegularInfo = $pricesById[$opcionConfig['particular']];
                    }
                    if ($opcionConfig['club'] && isset($pricesById[$opcionConfig['club']])) {
                        $precioClubInfo = $pricesById[$opcionConfig['club']];
                    }

                    $opcion['particular'] = $precioRegularInfo ? floatval($precioRegularInfo['precio']) : null;
                    $opcion['clubMedical'] = $precioClubInfo ? floatval($precioClubInfo['precio']) : null;
                    $opcion['idTipoServicioRegular'] = $precioRegularInfo ? $precioRegularInfo['id'] : null;
                    $opcion['idTipoServicioClub'] = $precioClubInfo ? $precioClubInfo['id'] : null;
                }

                $especialidad['opciones'][] = $opcion;
            }

            // Para compatibilidad, también incluir precios simples (de la primera opción)
            $primeraOpcion = $especialidad['opciones'][0] ?? null;
            $especialidad['precios'] = [
                'particular' => $primeraOpcion ? $primeraOpcion['particular'] : null,
                'clubMedical' => $primeraOpcion ? $primeraOpcion['clubMedical'] : null,
                'esClubMedical' => $esClubMedical,
                'tieneOpciones' => true
            ];
        }
        // CASO 2: Especialidad SIMPLE (sin opciones)
        else {
            // Verificar si tiene precios fijos (para casos como Optometría)
            if (isset($mapConfig['precioFijo'])) {
                $especialidad['precios'] = [
                    'particular' => floatval($mapConfig['precioFijo']['particular']),
                    'clubMedical' => floatval($mapConfig['precioFijo']['club']),
                    'esClubMedical' => $esClubMedical,
                    'idTipoServicioRegular' => null,
                    'idTipoServicioClub' => null,
                    'servicioRegular' => null,
                    'servicioClub' => null,
                    'tieneOpciones' => false
                ];
            } else {
                // Buscar precios en la BD normalmente
                $precioRegularInfo = null;
                $precioClubInfo = null;

                if ($mapConfig['particular'] && isset($pricesById[$mapConfig['particular']])) {
                    $precioRegularInfo = $pricesById[$mapConfig['particular']];
                }
                if ($mapConfig['club'] && isset($pricesById[$mapConfig['club']])) {
                    $precioClubInfo = $pricesById[$mapConfig['club']];
                }

                $especialidad['precios'] = [
                    'particular' => $precioRegularInfo ? floatval($precioRegularInfo['precio']) : null,
                    'clubMedical' => $precioClubInfo ? floatval($precioClubInfo['precio']) : null,
                    'esClubMedical' => $esClubMedical,
                    'idTipoServicioRegular' => $precioRegularInfo ? $precioRegularInfo['id'] : null,
                    'idTipoServicioClub' => $precioClubInfo ? $precioClubInfo['id'] : null,
                    'servicioRegular' => $precioRegularInfo ? $precioRegularInfo['servicio'] : null,
                    'servicioClub' => $precioClubInfo ? $precioClubInfo['servicio'] : null,
                    'tieneOpciones' => false
                ];
            }
        }
    }

    echo json_encode($especialidades);

} catch (PDOException $e) {
    http_response_code(500);
    error_log("Error en get_especialidades.php: " . $e->getMessage());
    echo json_encode(["error" => "Error en la consulta: " . $e->getMessage()]);
}
?>
