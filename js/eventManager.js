// Sistema de gestión de event listeners para prevenir memory leaks
// Auto-limpieza de listeners cuando se re-renderizan componentes

class EventManager {
    static listeners = new Map(); // Mapa de elementos -> array de listeners
    static globalListeners = []; // Listeners globales (window, document)

    /**
     * Agregar event listener con auto-tracking para limpieza posterior
     * @param {HTMLElement|Window|Document} element - Elemento al que agregar el listener
     * @param {string} event - Nombre del evento
     * @param {Function} handler - Manejador del evento
     * @param {Object} options - Opciones del evento
     * @returns {Function} - Función para remover el listener
     */
    static addEventListener(element, event, handler, options = {}) {
        if (!element) {
            console.warn('EventManager: Intentando agregar listener a elemento nulo');
            return () => {};
        }

        // Agregar el listener
        element.addEventListener(event, handler, options);

        // Guardar referencia para limpieza posterior
        const listenerInfo = { element, event, handler, options };

        if (element === window || element === document) {
            this.globalListeners.push(listenerInfo);
        } else {
            if (!this.listeners.has(element)) {
                this.listeners.set(element, []);
            }
            this.listeners.get(element).push(listenerInfo);
        }

        // Retornar función de limpieza
        return () => this.removeEventListener(element, event, handler);
    }

    /**
     * Remover un event listener específico
     * @param {HTMLElement|Window|Document} element - Elemento del que remover el listener
     * @param {string} event - Nombre del evento
     * @param {Function} handler - Manejador del evento
     */
    static removeEventListener(element, event, handler) {
        if (!element) return;

        element.removeEventListener(event, handler);

        // Remover de tracking
        if (element === window || element === document) {
            this.globalListeners = this.globalListeners.filter(
                l => !(l.element === element && l.event === event && l.handler === handler)
            );
        } else {
            const listeners = this.listeners.get(element);
            if (listeners) {
                const filtered = listeners.filter(
                    l => !(l.event === event && l.handler === handler)
                );
                if (filtered.length > 0) {
                    this.listeners.set(element, filtered);
                } else {
                    this.listeners.delete(element);
                }
            }
        }
    }

    /**
     * Limpiar todos los listeners de un elemento
     * @param {HTMLElement} element - Elemento a limpiar
     */
    static clearElement(element) {
        if (!element) return;

        const listeners = this.listeners.get(element);
        if (listeners) {
            listeners.forEach(({ event, handler, options }) => {
                element.removeEventListener(event, handler, options);
            });
            this.listeners.delete(element);
        }
    }

    /**
     * Limpiar todos los listeners de un contenedor y sus hijos
     * @param {HTMLElement} container - Contenedor a limpiar
     */
    static clearContainer(container) {
        if (!container) return;

        // Limpiar el contenedor mismo
        this.clearElement(container);

        // Limpiar todos los elementos trackeados que sean descendientes
        for (const [element, listeners] of this.listeners.entries()) {
            if (container.contains(element)) {
                listeners.forEach(({ event, handler, options }) => {
                    element.removeEventListener(event, handler, options);
                });
                this.listeners.delete(element);
            }
        }
    }

    /**
     * Limpiar listeners globales (window, document)
     */
    static clearGlobalListeners() {
        this.globalListeners.forEach(({ element, event, handler, options }) => {
            element.removeEventListener(event, handler, options);
        });
        this.globalListeners = [];
    }

    /**
     * Limpiar TODOS los listeners (usar con cuidado)
     */
    static clearAll() {
        // Limpiar listeners de elementos
        for (const [element, listeners] of this.listeners.entries()) {
            listeners.forEach(({ event, handler, options }) => {
                element.removeEventListener(event, handler, options);
            });
        }
        this.listeners.clear();

        // Limpiar listeners globales
        this.clearGlobalListeners();

        console.log('EventManager: Todos los listeners limpiados');
    }

    /**
     * Obtener estadísticas de listeners
     */
    static getStats() {
        const elementListeners = Array.from(this.listeners.values()).reduce(
            (sum, listeners) => sum + listeners.length,
            0
        );

        return {
            totalElements: this.listeners.size,
            totalElementListeners: elementListeners,
            totalGlobalListeners: this.globalListeners.length,
            total: elementListeners + this.globalListeners.length
        };
    }

    /**
     * Verificar si hay memory leaks potenciales
     * @param {number} threshold - Umbral de listeners para considerar leak
     */
    static detectPotentialLeaks(threshold = 100) {
        const stats = this.getStats();

        if (stats.total > threshold) {
            console.warn(`⚠️ EventManager: Posible memory leak detectado!`, {
                ...stats,
                threshold,
                message: `Hay ${stats.total} listeners activos (umbral: ${threshold})`
            });
            return true;
        }

        return false;
    }

    /**
     * Delegación de eventos (event delegation)
     * Útil para elementos dinámicos que se agregan/remueven
     * @param {HTMLElement} container - Contenedor padre
     * @param {string} event - Tipo de evento
     * @param {string} selector - Selector CSS para delegar
     * @param {Function} handler - Manejador del evento
     */
    static delegate(container, event, selector, handler) {
        const delegateHandler = (e) => {
            const target = e.target.closest(selector);
            if (target && container.contains(target)) {
                handler.call(target, e);
            }
        };

        return this.addEventListener(container, event, delegateHandler);
    }
}

// Integrar con UIManager si está disponible
if (typeof UIManager !== 'undefined') {
    // Guardar método original
    UIManager._originalRenderizarEspecialidades = UIManager.renderizarEspecialidades;

    // Sobrescribir con auto-limpieza
    UIManager.renderizarEspecialidades = function(especialidades) {
        // Limpiar listeners antiguos antes de re-renderizar
        const grid = document.getElementById('specialties-grid');
        if (grid) {
            EventManager.clearContainer(grid);
        }

        // Llamar al método original
        return UIManager._originalRenderizarEspecialidades.call(this, especialidades);
    };

    // Método para limpiar listeners al cambiar de pantalla
    UIManager.cleanupCurrentScreen = function() {
        const activeScreen = document.querySelector('.screen.active');
        if (activeScreen) {
            EventManager.clearContainer(activeScreen);
        }
    };
}

// Helper global para agregar listeners de forma segura
window.addManagedListener = (element, event, handler, options) => {
    return EventManager.addEventListener(element, event, handler, options);
};

// Limpiar todo al salir de la página (prevenir leaks en navegación)
window.addEventListener('beforeunload', () => {
    EventManager.clearAll();
});

// Monitoreo periódico de memory leaks en desarrollo
if (CONFIG?.DEBUG_MODE) {
    setInterval(() => {
        EventManager.detectPotentialLeaks(200);
    }, 30000); // Cada 30 segundos
}

// Exportar para uso global
window.EventManager = EventManager;
