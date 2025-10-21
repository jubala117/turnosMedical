// Módulo para manejo de APIs HTTP

class ApiService {
    // Verificar paciente por cédula
    static async verificarPaciente(cedula) {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/verificar_paciente.php?cedula=${cedula}`);
            return await response.json();
        } catch (error) {
            console.error('Error al verificar paciente:', error);
            throw new Error('Error de conexión con el servidor');
        }
    }

    // Obtener especialidades
    static async obtenerEspecialidades(idPersona = null) {
        try {
            const url = idPersona 
                ? `${CONFIG.API_BASE_URL}/get_especialidades.php?idPersona=${idPersona}`
                : `${CONFIG.API_BASE_URL}/get_especialidades.php`;
            
            const response = await fetch(url);
            return await response.json();
        } catch (error) {
            console.error('Error al obtener especialidades:', error);
            throw new Error('Error al cargar las especialidades');
        }
    }

    // Obtener doctores por especialidad
    static async obtenerDoctores(idEspecialidad) {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/get_doctores.php?idEspecialidad=${idEspecialidad}`);
            return await response.json();
        } catch (error) {
            console.error('Error al obtener doctores:', error);
            throw new Error('Error al cargar los doctores');
        }
    }

    // Obtener fechas disponibles por médico
    static async obtenerFechas(idMedico) {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/get_fechas.php?idMedico=${idMedico}`);
            return await response.json();
        } catch (error) {
            console.error('Error al obtener fechas:', error);
            throw new Error('Error al cargar las fechas');
        }
    }

    // Obtener horas disponibles por médico y fecha
    static async obtenerHoras(idMedico, fecha) {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/get_horas.php?idMedico=${idMedico}&fecha=${fecha}`);
            return await response.json();
        } catch (error) {
            console.error('Error al obtener horas:', error);
            throw new Error('Error al cargar las horas');
        }
    }

    // Obtener exámenes de laboratorio
    static async obtenerExamenesLaboratorio() {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/get_examenes_laboratorio.php`);
            return await response.json();
        } catch (error) {
            console.error('Error al obtener exámenes de laboratorio:', error);
            throw new Error('Error al cargar los exámenes de laboratorio');
        }
    }

    // Obtener exámenes de imagenología (ecografía)
    static async obtenerExamenesImagen() {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/get_examenes_eco.php`);
            return await response.json();
        } catch (error) {
            console.error('Error al obtener exámenes de imagen:', error);
            throw new Error('Error al cargar los exámenes de imagen');
        }
    }

    // Obtener procedimientos de rayos X
    static async obtenerRayosX() {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/get_rayos_x.php`);
            return await response.json();
        } catch (error) {
            console.error('Error al obtener procedimientos de rayos X:', error);
            throw new Error('Error al cargar los procedimientos de rayos X');
        }
    }

    // Obtener servicios odontológicos
    static async obtenerServiciosOdontologia() {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/get_servicios_odontologia.php`);
            return await response.json();
        } catch (error) {
            console.error('Error al obtener servicios odontológicos:', error);
            throw new Error('Error al cargar los servicios odontológicos');
        }
    }

    // Obtener precio por ID de servicio
    static async obtenerPrecioPorId(idTipoServicio) {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/get_especialidades.php?servicioId=${idTipoServicio}`);
            const data = await response.json();
            return data.precio || 'N/A';
        } catch (error) {
            console.error('Error al obtener precio por ID:', error);
            return 'N/A';
        }
    }

    // Función genérica para llamadas API con manejo de errores
    static async fetchWithErrorHandling(url, options = {}) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error en llamada API:', error);
            throw error;
        }
    }

    // Verificar si el paciente es Club Medical
    static async verificarClubMedical(idPersona) {
        try {
            // Esta función debería implementarse según la lógica de negocio
            // Por ahora, retornamos false como placeholder
            return false;
        } catch (error) {
            console.error('Error al verificar Club Medical:', error);
            return false;
        }
    }
}

// Exportar para uso global
window.ApiService = ApiService;
