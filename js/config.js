// Configuración global de la aplicación
const CONFIG = {
    // API Configuration
    API_BASE_URL: 'http://localhost/turnosMedical/API',
    
    // Search Configuration
    SEARCH_THRESHOLD: 0.7,
    SEARCH_MIN_LENGTH: 2,
    SEARCH_DEBOUNCE_MS: 300,
    
    // Search Score Thresholds by Area
    SEARCH_THRESHOLDS: {
        laboratorio: 50,
        ecografia: 750,
        rayosx: 750,  // Same threshold as ecografia for precise filtering
        odontologia: 0  // Uses specialized search
    },
    
    // Search Scoring System
    SEARCH_SCORES: {
        EXACT_MATCH: 1000,
        SUBSTRING_ORIGINAL: 800,
        SUBSTRING_VISIBLE: 750,
        INVERSE_MATCH: 700,
        COMPONENT_MATCH: 100,
        ALL_COMPONENTS_BONUS: 200,
        SYNONYM_MATCH: 150,
        FUZZY_MATCH_ORIGINAL: 120,
        FUZZY_MATCH_VISIBLE: 110
    },
    
    // Logging Configuration
    DEBUG_MODE: true,  // Set to false in production
    LOG_SEARCH_DETAILS: true,  // Detailed search logs
    LOG_API_CALLS: false,  // API call logs
    
    // Categories
    CATEGORIES: {
        LABORATORIO: ['ORINA', 'HECES', 'HEMATOLOGÍA', 'BIOQUÍMICA', 'INMUNOLOGÍA', 'HORMONAS', 'OTROS'],
        ODONTOLOGIA: ['CONSULTAS Y PREVENCIÓN', 'RESTAURACIONES', 'ENDODONCIA', 'EXTRACCIONES', 'ORTODONCIA', 'OTROS SERVICIOS']
    },
    
    // Especialidades con opciones múltiples
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

// Sistema de Logging Configurable
class Logger {
    static log(message, data = null, type = 'info') {
        if (!CONFIG.DEBUG_MODE) return;
        
        const emoji = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌',
            search: '🔍',
            api: '🌐',
            data: '📊'
        };
        
        const prefix = emoji[type] || 'ℹ️';
        
        if (data) {
            console.log(`${prefix} ${message}`, data);
        } else {
            console.log(`${prefix} ${message}`);
        }
    }
    
    static search(message, data = null) {
        if (!CONFIG.LOG_SEARCH_DETAILS) return;
        this.log(message, data, 'search');
    }
    
    static api(message, data = null) {
        if (!CONFIG.LOG_API_CALLS) return;
        this.log(message, data, 'api');
    }
    
    static error(message, error = null) {
        // Errors always log, even in production
        const prefix = '❌';
        if (error) {
            console.error(`${prefix} ${message}`, error);
        } else {
            console.error(`${prefix} ${message}`);
        }
    }
    
    static success(message, data = null) {
        this.log(message, data, 'success');
    }
    
    static warning(message, data = null) {
        this.log(message, data, 'warning');
    }
    
    static data(message, data = null) {
        this.log(message, data, 'data');
    }
}

// Sistema de Manejo de Errores Centralizado
class ErrorHandler {
    // Tipos de errores
    static ERROR_TYPES = {
        NETWORK: 'network',
        VALIDATION: 'validation',
        API: 'api',
        SYSTEM: 'system'
    };

    // Manejar error de manera centralizada
    static handle(error, context = '', showToUser = true) {
        const errorInfo = ErrorHandler.parseError(error);
        
        // Log del error
        Logger.error(`Error en ${context}:`, errorInfo);
        
        // Mostrar al usuario si es necesario
        if (showToUser && typeof Utils !== 'undefined') {
            Utils.mostrarError(errorInfo.userMessage);
        }
        
        return errorInfo;
    }

    // Parsear error para obtener información útil
    static parseError(error) {
        let type = ErrorHandler.ERROR_TYPES.SYSTEM;
        let userMessage = 'Ha ocurrido un error inesperado. Por favor, intenta nuevamente.';
        let technicalMessage = error.message || 'Unknown error';
        
        // Detectar tipo de error
        if (error.message && error.message.includes('fetch')) {
            type = ErrorHandler.ERROR_TYPES.NETWORK;
            userMessage = 'Error de conexión. Verifica tu conexión a internet.';
        } else if (error.message && error.message.includes('API')) {
            type = ErrorHandler.ERROR_TYPES.API;
            userMessage = 'Error al comunicarse con el servidor. Intenta más tarde.';
        } else if (error.name === 'ValidationError') {
            type = ErrorHandler.ERROR_TYPES.VALIDATION;
            userMessage = error.message;
        }
        
        return {
            type,
            userMessage,
            technicalMessage,
            originalError: error
        };
    }

    // Crear error de validación
    static validationError(message) {
        const error = new Error(message);
        error.name = 'ValidationError';
        return error;
    }
}

// Sistema de Validación de Datos
class DataValidator {
    // Validar cédula ecuatoriana
    static validarCedula(cedula) {
        if (!cedula || typeof cedula !== 'string') {
            return { valid: false, message: 'La cédula es requerida' };
        }
        
        const cedulaLimpia = cedula.trim();
        
        if (cedulaLimpia.length !== 10) {
            return { valid: false, message: 'La cédula debe tener 10 dígitos' };
        }
        
        if (!/^\d+$/.test(cedulaLimpia)) {
            return { valid: false, message: 'La cédula solo debe contener números' };
        }
        
        return { valid: true, value: cedulaLimpia };
    }

    // Validar que un valor no esté vacío
    static required(value, fieldName = 'Campo') {
        if (value === null || value === undefined || value === '') {
            return { valid: false, message: `${fieldName} es requerido` };
        }
        return { valid: true, value };
    }

    // Validar número
    static isNumber(value, fieldName = 'Valor') {
        const num = Number(value);
        if (isNaN(num)) {
            return { valid: false, message: `${fieldName} debe ser un número válido` };
        }
        return { valid: true, value: num };
    }

    // Validar rango numérico
    static inRange(value, min, max, fieldName = 'Valor') {
        const numValidation = DataValidator.isNumber(value, fieldName);
        if (!numValidation.valid) return numValidation;
        
        const num = numValidation.value;
        if (num < min || num > max) {
            return { valid: false, message: `${fieldName} debe estar entre ${min} y ${max}` };
        }
        return { valid: true, value: num };
    }

    // Validar respuesta de API
    static validateApiResponse(response, requiredFields = []) {
        if (!response) {
            throw ErrorHandler.validationError('Respuesta de API vacía');
        }
        
        for (const field of requiredFields) {
            if (!(field in response)) {
                throw ErrorHandler.validationError(`Campo requerido '${field}' no encontrado en respuesta de API`);
            }
        }
        
        return true;
    }

    // Validar array no vacío
    static notEmptyArray(value, fieldName = 'Lista') {
        if (!Array.isArray(value)) {
            return { valid: false, message: `${fieldName} debe ser una lista` };
        }
        if (value.length === 0) {
            return { valid: false, message: `${fieldName} no puede estar vacía` };
        }
        return { valid: true, value };
    }
}

// Exportar para uso global
window.Logger = Logger;
window.ErrorHandler = ErrorHandler;
window.DataValidator = DataValidator;
