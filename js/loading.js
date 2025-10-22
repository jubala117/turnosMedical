// Sistema de estados de carga (Loading States)
// Proporciona feedback visual durante operaciones asíncronas

class LoadingState {
    static overlay = null;
    static activeLoaders = new Set();

    /**
     * Inicializar el overlay de loading
     */
    static init() {
        if (this.overlay) return;

        this.overlay = document.createElement('div');
        this.overlay.id = 'loading-overlay';
        this.overlay.className = 'loading-overlay hidden';
        this.overlay.setAttribute('role', 'status');
        this.overlay.setAttribute('aria-live', 'polite');
        this.overlay.setAttribute('aria-label', 'Cargando');

        this.overlay.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p class="loading-text">Cargando...</p>
            </div>
        `;

        document.body.appendChild(this.overlay);
    }

    /**
     * Mostrar loading global
     * @param {string} message - Mensaje opcional a mostrar
     * @returns {string} - ID único del loader
     */
    static show(message = 'Cargando...') {
        this.init();

        const loaderId = `loader-${Date.now()}-${Math.random()}`;
        this.activeLoaders.add(loaderId);

        const textElement = this.overlay.querySelector('.loading-text');
        if (textElement) {
            textElement.textContent = message;
        }

        this.overlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Prevenir scroll

        return loaderId;
    }

    /**
     * Ocultar loading específico
     * @param {string} loaderId - ID del loader a ocultar
     */
    static hide(loaderId) {
        this.activeLoaders.delete(loaderId);

        // Solo ocultar si no hay otros loaders activos
        if (this.activeLoaders.size === 0 && this.overlay) {
            this.overlay.classList.add('hidden');
            document.body.style.overflow = ''; // Restaurar scroll
        }
    }

    /**
     * Ocultar todos los loaders
     */
    static hideAll() {
        this.activeLoaders.clear();
        if (this.overlay) {
            this.overlay.classList.add('hidden');
            document.body.style.overflow = '';
        }
    }

    /**
     * Wrapper para ejecutar función con loading automático
     * @param {Function} asyncFn - Función asíncrona a ejecutar
     * @param {string} message - Mensaje de loading
     * @returns {Promise} - Resultado de la función
     */
    static async withLoading(asyncFn, message = 'Cargando...') {
        const loaderId = this.show(message);
        try {
            const result = await asyncFn();
            return result;
        } finally {
            this.hide(loaderId);
        }
    }

    /**
     * Mostrar loading en un elemento específico (no global)
     * @param {HTMLElement} element - Elemento donde mostrar el loading
     * @param {string} size - Tamaño: 'small', 'medium', 'large'
     */
    static showInElement(element, size = 'medium') {
        if (!element) return null;

        const sizeClasses = {
            small: 'w-4 h-4',
            medium: 'w-8 h-8',
            large: 'w-12 h-12'
        };

        const loader = document.createElement('div');
        loader.className = 'inline-loading';
        loader.innerHTML = `
            <div class="inline-spinner ${sizeClasses[size]}">
                <div class="spinner-border"></div>
            </div>
        `;

        // Guardar contenido original
        loader.dataset.originalContent = element.innerHTML;
        element.innerHTML = '';
        element.appendChild(loader);

        return loader;
    }

    /**
     * Ocultar loading de elemento específico
     * @param {HTMLElement} element - Elemento con loading
     */
    static hideInElement(element) {
        if (!element) return;

        const loader = element.querySelector('.inline-loading');
        if (loader && loader.dataset.originalContent) {
            element.innerHTML = loader.dataset.originalContent;
        }
    }
}

// Integrar con ApiService para loading automático
if (typeof ApiService !== 'undefined') {
    // Guardar método original
    ApiService._originalRequest = ApiService.request;

    // Sobrescribir con loading automático
    ApiService.request = async function(endpoint, errorMessage, params = {}, options = {}) {
        const {
            showLoading = false,
            loadingMessage = 'Cargando...',
            ...otherOptions
        } = options;

        if (showLoading) {
            return LoadingState.withLoading(
                () => ApiService._originalRequest(endpoint, errorMessage, params, otherOptions),
                loadingMessage
            );
        } else {
            return ApiService._originalRequest(endpoint, errorMessage, params, otherOptions);
        }
    };

    // Actualizar métodos específicos para usar loading
    ApiService.obtenerEspecialidades = async function(idPersona = null) {
        const params = idPersona ? { idPersona } : {};
        return this.request('get_especialidades.php', 'Error al cargar especialidades', params, {
            useCache: true,
            cacheTTL: 300000,
            showLoading: true,
            loadingMessage: 'Cargando especialidades...'
        });
    };

    ApiService.obtenerDoctores = async function(idEspecialidad) {
        return this.request('get_doctores.php', 'Error al cargar doctores', { idEspecialidad }, {
            showLoading: true,
            loadingMessage: 'Cargando médicos disponibles...'
        });
    };

    ApiService.obtenerExamenesLaboratorio = async function() {
        return this.request('get_examenes_laboratorio.php', 'Error al cargar exámenes de laboratorio', {}, {
            useCache: true,
            cacheTTL: 600000,
            showLoading: true,
            loadingMessage: 'Cargando exámenes...'
        });
    };

    ApiService.obtenerExamenesImagen = async function() {
        return this.request('get_examenes_eco.php', 'Error al cargar exámenes de imagen', {}, {
            useCache: true,
            cacheTTL: 600000,
            showLoading: true,
            loadingMessage: 'Cargando exámenes de imagen...'
        });
    };

    ApiService.obtenerRayosX = async function() {
        return this.request('get_rayos_x.php', 'Error al cargar rayos X', {}, {
            useCache: true,
            cacheTTL: 600000,
            showLoading: true,
            loadingMessage: 'Cargando procedimientos...'
        });
    };

    ApiService.obtenerServiciosOdontologia = async function() {
        return this.request('get_servicios_odontologia.php', 'Error al cargar servicios odontológicos', {}, {
            useCache: true,
            cacheTTL: 600000,
            showLoading: true,
            loadingMessage: 'Cargando servicios odontológicos...'
        });
    };
}

// Exportar para uso global
window.LoadingState = LoadingState;
