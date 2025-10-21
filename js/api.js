// Módulo para manejo de APIs HTTP
// Refactorizado para eliminar duplicación y agregar optimizaciones

class ApiService {
    // Cache y gestión de requests pendientes
    static cache = new Map();
    static pendingRequests = new Map();

    /**
     * Método genérico para hacer requests HTTP con optimizaciones
     * @param {string} endpoint - Nombre del archivo PHP
     * @param {string} errorMessage - Mensaje de error personalizado
     * @param {Object} params - Parámetros query string
     * @param {Object} options - Opciones adicionales (timeout, cache, etc.)
     * @returns {Promise} - Datos JSON de la respuesta
     */
    static async request(endpoint, errorMessage, params = {}, options = {}) {
        const {
            timeout = 10000,
            useCache = false,
            cacheTTL = 60000
        } = options;

        // Construir URL con query params
        const url = new URL(`${CONFIG.API_BASE_URL}/${endpoint}`);
        Object.entries(params).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                url.searchParams.append(key, value);
            }
        });

        const urlString = url.toString();

        // Verificar caché
        if (useCache) {
            const cached = this.cache.get(urlString);
            if (cached && Date.now() - cached.timestamp < cacheTTL) {
                Logger?.debug?.('Cache hit:', urlString);
                return cached.data;
            }
        }

        // Deduplicar requests concurrentes
        if (this.pendingRequests.has(urlString)) {
            Logger?.debug?.('Request already pending, reusing:', urlString);
            return this.pendingRequests.get(urlString);
        }

        // Crear request con timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const requestPromise = (async () => {
            try {
                const response = await fetch(urlString, {
                    signal: controller.signal
                });

                // Validar respuesta HTTP
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();

                // Guardar en caché si está habilitado
                if (useCache) {
                    this.cache.set(urlString, {
                        data,
                        timestamp: Date.now()
                    });

                    // Limitar tamaño del caché (máximo 50 entradas)
                    if (this.cache.size > 50) {
                        const firstKey = this.cache.keys().next().value;
                        this.cache.delete(firstKey);
                    }
                }

                return data;

            } catch (error) {
                // Diferenciar tipos de error
                if (error.name === 'AbortError') {
                    const timeoutError = new Error(`Timeout: La solicitud tardó más de ${timeout}ms`);
                    Logger?.error?.(errorMessage, timeoutError);
                    throw timeoutError;
                }

                Logger?.error?.(errorMessage, error);
                throw new Error(errorMessage);

            } finally {
                clearTimeout(timeoutId);
                this.pendingRequests.delete(urlString);
            }
        })();

        // Guardar promesa de request pendiente
        this.pendingRequests.set(urlString, requestPromise);

        return requestPromise;
    }

    // ===== MÉTODOS ESPECÍFICOS (Simplificados usando request genérico) =====

    static async verificarPaciente(cedula) {
        return this.request('verificar_paciente.php', 'Error al verificar paciente', { cedula });
    }

    static async obtenerEspecialidades(idPersona = null) {
        const params = idPersona ? { idPersona } : {};
        return this.request('get_especialidades.php', 'Error al cargar especialidades', params, {
            useCache: true,
            cacheTTL: 300000 // 5 minutos
        });
    }

    static async obtenerDoctores(idEspecialidad) {
        return this.request('get_doctores.php', 'Error al cargar doctores', { idEspecialidad });
    }

    static async obtenerFechas(idMedico) {
        return this.request('get_fechas.php', 'Error al cargar fechas', { idMedico });
    }

    static async obtenerHoras(idMedico, fecha) {
        return this.request('get_horas.php', 'Error al cargar horas', { idMedico, fecha });
    }

    static async obtenerExamenesLaboratorio() {
        return this.request('get_examenes_laboratorio.php', 'Error al cargar exámenes de laboratorio', {}, {
            useCache: true,
            cacheTTL: 600000 // 10 minutos
        });
    }

    static async obtenerExamenesImagen() {
        return this.request('get_examenes_eco.php', 'Error al cargar exámenes de imagen', {}, {
            useCache: true,
            cacheTTL: 600000
        });
    }

    static async obtenerRayosX() {
        return this.request('get_rayos_x.php', 'Error al cargar rayos X', {}, {
            useCache: true,
            cacheTTL: 600000
        });
    }

    static async obtenerServiciosOdontologia() {
        return this.request('get_servicios_odontologia.php', 'Error al cargar servicios odontológicos', {}, {
            useCache: true,
            cacheTTL: 600000
        });
    }

    static async obtenerPrecioPorId(idTipoServicio) {
        try {
            const data = await this.request('get_especialidades.php', 'Error al obtener precio', {
                servicioId: idTipoServicio
            });
            return data.precio || 'N/A';
        } catch (error) {
            return 'N/A';
        }
    }

    /**
     * Limpiar caché manualmente
     */
    static clearCache() {
        this.cache.clear();
        Logger?.info?.('API cache cleared');
    }

    /**
     * Obtener estadísticas de caché
     */
    static getCacheStats() {
        return {
            size: this.cache.size,
            pending: this.pendingRequests.size,
            entries: Array.from(this.cache.keys())
        };
    }
}

// Exportar para uso global
window.ApiService = ApiService;
