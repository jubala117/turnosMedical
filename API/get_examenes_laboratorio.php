<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once(__DIR__ . '/../db_connect.inc.php');

try {
    // Mapeo de nombres de exámenes de laboratorio a IDs de servicioEmpresa
    $mapeo_laboratorio = [
        'ELEMENTAL Y MICROSCOPICO DE ORINA' => [2441,3696],
        'EMO' => [2375,2341],
        'GRAM DE SEDIMENTO' => [2452,3702],
        'GRAM GOTA FRESCA' => [2453,3698],
        'PROTEINA EN ORINA PARCIAL' => [2473,3700],
        'PRUEBA DE EMBARAZO' => [2475,4042],
        'UROCULTIVO' => [1066,3704],
        'COPROCULTIVO HECES' => [2437,3730],
        'COPROPARASITARIO' => [2376,3718],
        'COPROPARASITARIO POR CONCENTRACION' => [1069,3722],
        'COPROPARASITARIO SERIADO' => [3309,3720],
        'HELICOBACTER PYLORI EN HECES' => [2456,3734],
        'INVEST. DE POLIMORFONUCLEARES' => [1070,3724],
        'ROTAVIRUS' => [2480,3728],
        'SANGRE OCULTA EN HECES' => [2483,3726],
        'SUDAM III' => [3502,3731],
        'BIOMETRIA HEMATICA' => [2363,3738],
        'HEMATOCRITO Y HEMOGLOBINA' => [2393,3740],
        'SEDIMENTACION' => [2484,3744],
        'PLAQUETAS' => [2469,3746],
        'GRUPO SANGUINEO' => [2403,3748],
        'RETICULOCITOS' => [2479,3750],
        'HEMATOZOARIO' => [494,3752],
        'CONTAJE  DE PLAQUETAS' => [2436,3756],
        'TGO (TRANSAMINASA)' => [2371,3758],
        'TGP (TRANSAMINASA)' => [2372,3760],
        'FOSFATASA ALCALINA' => [2404,3762],
        'FOSFATASA ACIDA PROSTATICA' => [2447,3764],
        'FOSFATASA ACIDA TOTAL' => [2448,3766],
        'AMILASA' => [2388,3768],
        'LIPASA' => [2465,3770],
        'DIMERO D' => [1086,3796],
        'FIBRINOGENO' => [2446,3790],
        'INR' => [1085,3788],
        'TIEMPO DE CUAGULACION' => [2494,3794],
        'TIEMPO DE HEMORRAGIA' => [2495,3792],
        'TIEMPO DE PROTROMBINA +INR' => [2496,3780],
        'TP.' => [1083,3784],
        'TROMBOPLASTINA PARCIAL' => [2505,3782],
        'TTP' => [2508,3786],
        'ACIDO URICO' => [2373,3812],
        'ALBUMINA' => [2426,3830],
        'BILIRRUBINAS (T-D-I)' => [2391,3826],
        'BILIRRUBINAS TOTALES Y PARCIALES' => [2390,3828],
        'BUN' => [680,3808],
        'C,K,M,B' => [3529,3836],
        'C,P,K' => [3512,3772],
        'CALCIO  (CA)' => [1091,3846],
        'CALCIO IONICO' => [2428,3852],
        'CALCIO TOTAL' => [2429,3854],
        'CLORO (CL)' => [1122,3844],
        'COLESTEROL' => [2433,3814],
        'COLINESTERASA ERITROCITARIA' => [2434,3866],
        'COLINESTERESA SERICA' => [2435,3868],
        'CREATININA' => [2396,3810],
        'CURVA DE TOLERANCIA A LA GLU (5 HORAS)' => [2440,3804],
        'FERRETINA' => [2445,3876],
        'FOSFORO (P)' => [1117,3860],
        'GAMA GT' => [3515,3778],
        'GLOBULINA' => [2451,3834],
        'GLUCOSA EN AYUNAS' => [426,3798],
        'GLUCOSA POSTPANDRIAL' => [1087,3800],
        'HDL COLESTEROL' => [2455,4038],
        'HEMOGLOBINA GLICOSILADA' => [2398,3838],
        'HIERRO SERICO' => [1450,3874],
        'INDICES HEMATICOS' => [3621,3864],
        'L,D,H DESHIDROGENASA LACTICA' => [1441,3774],
        'LDL COLESTEROL' => [2369,4040],
        'LIPIDOS TOTALES' => [2466,3824],
        'MAGNESIO (MG)' => [1118,3862],
        'NITROGENO UREICO (BUM)' => [1449,3872],
        'POTASIO (K)' => [1090,3842],
        'PRUEBA DE EMBARAZO EN SANGRE' => [2476,3848],
        'PSA LIBRE' => [2477,3858],
        'PSA TOTAL' => [2478,3856],
        'SODIO (NA)' => [1120,3840],
        'SODIO, POTASIO, CLORO (LOS TRES JUNTOS)' => [2486,3850],
        'TEST DE SULIVAN' => [2492,3869],
        'TRIGLICERIDOS' => [2370,3816],
        'UREA' => [2395,3806],
        'VLDL' => [2510,3820],
        'AGLUTINACIONES FEBRILES' => [2402,3886],
        'ASTO CUANTITATIVO' => [490,3880],
        'FACTOR REUMATOIDE' => [2444,3890],
        'H,I,V, 1&2' => [2454,3888],
        'LATEX CUANTITATIVO' => [1101,3882],
        'PCR CUANTITATIVO' => [2468,3884],
        'VDRL' => [2374,3878],
        'ESTRADIOL (ESTROGENOS)' => [2248,3916],
        'ESTROGENOS' => [2443,3920],
        'FSH' => [2450,3904],
        'HORMONA DE CRECIMIENTO' => [1116,3922],
        'LH' => [1110,3902],
        'PEPTIDO C' => [3624,3918],
        'PROGESTERONA' => [2471,3906],
        'PROLACTINA' => [2472,3910],
        'T3 LIBRE' => [2487,3924],
        'T3 TOTAL' => [2488,3894],
        'T3, T4, TSH' => [2489,3892],
        'T4 LIBRE' => [2490,3926],
        'T4 TOTAL' => [2491,3896],
        'TESTOSTERONA TOTAL' => [2493,3912],
        'TIROGLOBULINA' => [2499,3900],
        'TRIPANOZOMA (CHAGAS)' => [3623,3908],
        'TSH' => [2507,3898],
        'BETA HCG CUALITATIVA' => [492,3934],
        'BETA HCG CUANTITATIVA' => [2394,3936],
        'CORTISOL AM' => [1454,3928],
        'CORTISOL PM' => [1455,4037],
        'INSULINA' => [1456,3932],
        'ANTI TPO' => [1836,3940],
        'ANTIGENO PROSTATICO LIBRE PSA LIBRE' => [491,3963],
        'ANTIGENO PROSTATICP ESPECIFICO PSA TOTAL' => [4155,3961],
        'B12' => [4156,4146],
        'BILI DIR' => [489,3946],
        'BILI TOTAL' => [2387,3944],
        'CELULA L,E' => [1135,3665],
        'ERITROSEDIMENTACION' => [2442,3950],
        'HIERRO' => [1121,3942],
        'LITIO' => [1119,3938],
        'PROTEINAS PARCIALES' => [2326,3948],
        'PROTEINAS TOTALES' => [2474,3822],
        'TIMEMPO DE PROTROMBINA TP' => [2497,3954],
        'TIPIFICACION' => [2498,3952],
        'TROMBOOLASTILINA TTP' => [2504,3956],
        'TROPONINA T' => [2506,3776],
        'VELOCIDAD DE SEDIMENTACION' => [2509,3959],
        'VITAMINA D' => [2676,3967],
        'AC. ANTI MITOCONDRIAL' => [2256,4018],
        'CITOMEGALOVIRUS   IGG' => [2430,3990],
        'CITOMEGALOVIRUS   IGM' => [2431,3988],
        'COVID 19 CUALITATIVA' => [2438,4016],
        'COVID 19 CUANTITATIVA' => [2439,4014],
        'CULTIVO ANTIBIOGRAMA SECRECION VAGINAL' => [4046,4024],
        'FTA - ABS (SIFILIS)' => [3626,4020],
        'HELICOBACTER PYLORI IGM' => [2457,3976],
        'HELICOBACTERPYLORI' => [1145,3671],
        'HEPATITIS A IGM' => [2458,4010],
        'HEPATITIS B' => [2459,4008],
        'HEPATITIS C' => [2460,4012],
        'HERPES   I  IGG' => [2461,3993],
        'HERPES   II IGG' => [2462,3998],
        'HERPES  I   IGM' => [2463,3992],
        'HERPES  II   IGM' => [2464,3996],
        'HIV SIDA' => [2397,3685],
        'INMUNOGLOBULINA E' => [1475,4004],
        'RUBEOLO IGG' => [2481,3986],
        'RUBEOLO IGM' => [2482,3984],
        'TORCH IGG' => [2500,4002],
        'TORCH IGM' => [2501,4000],
        'TOXOPLASMA IGG' => [2502,3982],
        'TOXOPLASMA IGM' => [2503,3980],
        'TUBERCULOSIS TOTAL AC SERICOS' => [3627,4022],
    ];

    // Extraer todos los IDs únicos para la consulta
    $todosLosIDs = [];
    foreach ($mapeo_laboratorio as $ids) {
        $todosLosIDs = array_merge($todosLosIDs, $ids);
    }
    $todosLosIDs = array_unique($todosLosIDs);

    // Consulta para obtener todos los precios
    $placeholders = str_repeat('?,', count($todosLosIDs) - 1) . '?';
    $sql = "SELECT idTipoExamenLab, precioUnitario 
            FROM tipoexamenlab 
            WHERE idTipoExamenLab IN ($placeholders)";
    
    $stmt = $conn->prepare($sql);
    $stmt->execute(array_values($todosLosIDs));
    $resultados = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Crear un array indexado por ID para búsqueda rápida
    $preciosPorID = [];
    foreach ($resultados as $row) {
        $preciosPorID[$row['idTipoExamenLab']] = floatval($row['precioUnitario']);
    }

    $examenes_resultado = [];

    foreach ($mapeo_laboratorio as $nombre_examen => $ids) {
        $precio_particular = isset($preciosPorID[$ids[0]]) ? $preciosPorID[$ids[0]] : 0;
        $precio_club = isset($preciosPorID[$ids[1]]) ? $preciosPorID[$ids[1]] : 0;
        
        // Crear descripción visible amigable
        $descripcion_visible = $nombre_examen;
        if ($nombre_examen === 'H,I,V, 1&2') {
            $descripcion_visible = 'HIV 1&2';
        }
        
        $examenes_resultado[] = [
            'descripcion' => $nombre_examen, // Original para búsqueda
            'descripcion_visible' => $descripcion_visible, // Amigable para mostrar
            'precio_particular' => $precio_particular,
            'precio_club' => $precio_club,
            'fuente' => ($precio_particular > 0 || $precio_club > 0) ? 'bd' : 'no_encontrado'
        ];
    }

    echo json_encode($examenes_resultado);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error en la consulta: " . $e->getMessage()]);
}
?>
