// Sistema de notificaciones toast (reemplaza alerts bloqueantes)
// Proporciona feedback visual no intrusivo para el usuario

class ToastNotification {
    static container = null;
    static activeToasts = [];

    // Tipos de toast
    static TYPES = {
        SUCCESS: 'success',
        ERROR: 'error',
        WARNING: 'warning',
        INFO: 'info'
    };

    // Configuración por defecto
    static DEFAULT_DURATION = 3000; // 3 segundos
    static MAX_TOASTS = 3;

    /**
     * Inicializar el contenedor de toasts
     */
    static init() {
        if (this.container) return; // Ya inicializado

        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        this.container.className = 'toast-container';
        this.container.setAttribute('aria-live', 'polite');
        this.container.setAttribute('aria-atomic', 'true');
        document.body.appendChild(this.container);
    }

    /**
     * Mostrar un toast
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo de toast (success, error, warning, info)
     * @param {number} duration - Duración en ms (0 = permanente hasta que se cierre)
     */
    static show(message, type = this.TYPES.INFO, duration = this.DEFAULT_DURATION) {
        this.init();

        // Limitar cantidad de toasts simultáneos
        if (this.activeToasts.length >= this.MAX_TOASTS) {
            const oldest = this.activeToasts.shift();
            this.removeToast(oldest);
        }

        const toast = this.createToast(message, type);
        this.container.appendChild(toast);
        this.activeToasts.push(toast);

        // Animación de entrada
        setTimeout(() => toast.classList.add('show'), 10);

        // Auto-cerrar si tiene duración
        if (duration > 0) {
            setTimeout(() => this.hide(toast), duration);
        }

        return toast;
    }

    /**
     * Crear elemento toast
     */
    static createToast(message, type) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.setAttribute('role', 'alert');

        const icon = this.getIcon(type);
        const closeBtn = document.createElement('button');
        closeBtn.className = 'toast-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.setAttribute('aria-label', 'Cerrar notificación');
        closeBtn.onclick = () => this.hide(toast);

        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-message">${this.escapeHTML(message)}</div>
        `;
        toast.appendChild(closeBtn);

        return toast;
    }

    /**
     * Obtener icono según tipo
     */
    static getIcon(type) {
        const icons = {
            success: '<i class="fas fa-check-circle"></i>',
            error: '<i class="fas fa-exclamation-circle"></i>',
            warning: '<i class="fas fa-exclamation-triangle"></i>',
            info: '<i class="fas fa-info-circle"></i>'
        };
        return icons[type] || icons.info;
    }

    /**
     * Ocultar toast
     */
    static hide(toast) {
        toast.classList.remove('show');
        setTimeout(() => this.removeToast(toast), 300); // Esperar animación
    }

    /**
     * Eliminar toast del DOM
     */
    static removeToast(toast) {
        if (toast && toast.parentNode) {
            toast.parentNode.removeChild(toast);
            this.activeToasts = this.activeToasts.filter(t => t !== toast);
        }
    }

    /**
     * Métodos de conveniencia
     */
    static success(message, duration) {
        return this.show(message, this.TYPES.SUCCESS, duration);
    }

    static error(message, duration) {
        return this.show(message, this.TYPES.ERROR, duration);
    }

    static warning(message, duration) {
        return this.show(message, this.TYPES.WARNING, duration);
    }

    static info(message, duration) {
        return this.show(message, this.TYPES.INFO, duration);
    }

    /**
     * Limpiar todos los toasts
     */
    static clearAll() {
        this.activeToasts.forEach(toast => this.removeToast(toast));
        this.activeToasts = [];
    }

    /**
     * Escapar HTML para prevenir XSS
     */
    static escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}

// Reemplazar funciones globales de Utils que usan alert()
if (typeof Utils !== 'undefined') {
    // Guardar originales por si se necesitan
    Utils._originalMostrarError = Utils.mostrarError;
    Utils._originalMostrarExito = Utils.mostrarExito;

    // Reemplazar con toasts
    Utils.mostrarError = function(mensaje) {
        Logger?.error?.('Error:', mensaje);
        ToastNotification.error(mensaje, 5000); // 5 segundos para errores
    };

    Utils.mostrarExito = function(mensaje) {
        Logger?.info?.('Éxito:', mensaje);
        ToastNotification.success(mensaje, 3000);
    };

    // Agregar nuevas funciones
    Utils.mostrarAdvertencia = function(mensaje) {
        ToastNotification.warning(mensaje, 4000);
    };

    Utils.mostrarInfo = function(mensaje) {
        ToastNotification.info(mensaje, 3000);
    };
}

// Exportar para uso global
window.ToastNotification = ToastNotification;
