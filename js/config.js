// Configuración global de la aplicación
const CONFIG = {
    API_BASE_URL: 'http://localhost/turnosMedical/API',
    SEARCH_THRESHOLD: 0.7,
    CATEGORIES: {
        LABORATORIO: ['ORINA', 'HECES', 'HEMATOLOGÍA', 'BIOQUÍMICA', 'INMUNOLOGÍA', 'HORMONAS', 'OTROS'],
        ODONTOLOGIA: ['CONSULTAS Y PREVENCIÓN', 'RESTAURACIONES', 'ENDODONCIA', 'EXTRACCIONES', 'ORTODONCIA', 'OTROS SERVICIOS']
    },
    ESPECIALIDADES_CON_OPCIONES: [
        'PSICOLOGIA CLINICA',
        'PSICOLOGIA INFANTIL AND PSICORREHABILITADORA',
        'TERAPIA OCUPACIONAL AND MULTISENSORIAL',
        'TERAPIA DEL LENGUAJE',
        'NUTRICION'
    ]
};

// Diccionario de sinónimos médicos
const SINONIMOS_MEDICOS = {
    // Para C,P,K y variaciones
    "c p k": ["c,p,k", "cpk", "kpc", "pck", "c k p", "p c k", "k c p", "p k c", "k p c",
              "calcio fosforo potasio", "calcio fósforo potasio", "calcium phosphorus potassium",
              "calcio phosphorus potassium", "calcio p k", "ca p k", "c p k", "c p k"],
    "c,p,k": ["c p k", "cpk", "kpc", "pck", "calcio fosforo potasio", "calcio", "fosforo", "potasio"],
    "calcio": ["c", "ca", "calcium", "c p k", "cpk", "calcio fosforo", "calcio potasio"],
    "fosforo": ["p", "fósforo", "phosphorus", "fosfor", "c p k", "cpk", "fosforo calcio", "fosforo potasio"],
    "potasio": ["k", "potassium", "potasio", "c p k", "cpk", "potasio calcio", "potasio fosforo"],
    
    // Para HIV/SIDA
    "hiv": ["vih", "sida", "aids", "virus inmunodeficiencia humana", "virus de inmunodeficiencia humana",
            "h,i,v, 1&2", "hiv 1&2", "hiv sida", "vih sida"],
    "sida": ["hiv", "vih", "aids", "síndrome inmunodeficiencia adquirida", "sindrome inmunodeficiencia adquirida",
             "hiv sida", "vih sida", "h,i,v, 1&2", "hiv 1&2"],
    "vih": ["hiv", "sida", "aids", "virus inmunodeficiencia humana", "h,i,v, 1&2", "hiv 1&2", "hiv sida"],
    
    // Para T3, T4, TSH
    "t3 t4 tsh": ["t3,t4,tsh", "tsh t3 t4", "t3 t4", "t4 t3", "tsh t3", "tsh t4",
                  "hormonas tiroideas", "tiroides", "hormonas tiroides", "t3 t4 tsh"],
    "t3": ["triyodotironina", "triiodothyronine", "t3 t4", "t3 tsh", "hormona t3"],
    "t4": ["tiroxina", "thyroxine", "t3 t4", "t4 tsh", "hormona t4"],
    "tsh": ["hormona estimulante tiroides", "thyroid stimulating hormone", "tsh t3", "tsh t4", "hormona tsh"],
    
    // Exámenes comunes
    "glucosa": ["azúcar", "azucar", "sugar", "glucose", "azucar en sangre", "glucosa en ayunas"],
    "colesterol": ["cholesterol", "colesterol total", "colesterol hdl", "colesterol ldl"],
    "trigliceridos": ["triglicéridos", "triglycerides", "trigliceridos en sangre"],
    "hemoglobina": ["hb", "hgb", "hemoglobin", "hemoglobina glicosilada", "hemoglobina glucosilada"],
    
    // Sinónimos odontológicos
    "limpieza": ["profilaxis", "limpieza dental", "limpieza bucal", "limpieza oral", "limpieza de dientes", "limpieza dental completa"],
    "profilaxis": ["limpieza", "limpieza dental", "limpieza bucal", "limpieza oral", "limpieza de dientes"],
    "extraccion": ["exodoncia", "extraer diente", "sacar diente", "extracción dental", "extraer muela", "sacar muela"],
    "endodoncia": ["tratamiento de conducto", "conducto", "tratamiento endodóntico", "endodoncia dental"],
    "restauracion": ["empaste", "calza", "obturación", "restauración dental", "empaste dental", "calza dental"]
};
