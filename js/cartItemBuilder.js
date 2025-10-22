/**
 * cartItemBuilder.js
 * Handles multi-step process of building cart items
 * Tracks current item being configured before adding to cart
 */

const CartItemBuilder = {
    // Current item being built
    currentItem: null,

    // Whether we're in cart building mode
    isBuilding: false,

    /**
     * Start building a new cart item for a consulta (specialty)
     * @param {Object} especialidad - Specialty object
     * @param {Object} precios - Price object {particular, clubMedical, esClubMedical, selected}
     * @returns {boolean} Success status
     */
    startConsulta(especialidad, precios) {
        this.currentItem = {
            type: 'consulta',
            especialidadId: especialidad.idEspecialidad,
            name: especialidad.descEspecialidad,
            price: precios.selected,
            priceType: precios.esClubMedical ? 'club' : 'particular',
            // To be filled in next steps
            doctorId: null,
            doctorName: null,
            date: null,
            time: null,
            turnoId: null
        };

        this.isBuilding = true;

        console.log('Started building consulta item:', this.currentItem);
        return true;
    },

    /**
     * Start building a cart item for an exam/service
     * @param {Object} item - Exam/service object
     * @param {number} precio - Selected price
     * @param {string} tipo - Price type ('particular' or 'club')
     * @returns {boolean} Success status
     */
    startExam(item, precio, tipo) {
        const itemName = item.descripcion_visible || item.descripcion || item.servicio;

        this.currentItem = {
            type: 'examen',
            examId: item.id || item.idTipoExamenLab,
            name: itemName,
            price: precio,
            priceType: tipo,
            // Exams don't need doctor/date/time selection
            // They go directly to cart
        };

        this.isBuilding = false; // Exams are complete immediately

        console.log('Created exam item:', this.currentItem);
        return true;
    },

    /**
     * Add doctor selection to current item
     * @param {Object} doctor - Doctor object
     * @returns {boolean} Success status
     */
    setDoctor(doctor) {
        if (!this.currentItem || this.currentItem.type !== 'consulta') {
            console.error('Cannot set doctor: no consulta item being built');
            return false;
        }

        this.currentItem.doctorId = doctor.idMedico;
        this.currentItem.doctorName = doctor.nombre;

        console.log('Doctor set:', this.currentItem);
        return true;
    },

    /**
     * Add date selection to current item
     * @param {string} date - Selected date (YYYY-MM-DD format)
     * @returns {boolean} Success status
     */
    setDate(date) {
        if (!this.currentItem || this.currentItem.type !== 'consulta') {
            console.error('Cannot set date: no consulta item being built');
            return false;
        }

        this.currentItem.date = date;

        console.log('Date set:', this.currentItem);
        return true;
    },

    /**
     * Add time selection to current item
     * @param {string} time - Selected time
     * @param {number} turnoId - Turno ID
     * @returns {boolean} Success status
     */
    setTime(time, turnoId) {
        if (!this.currentItem || this.currentItem.type !== 'consulta') {
            console.error('Cannot set time: no consulta item being built');
            return false;
        }

        this.currentItem.time = time;
        this.currentItem.turnoId = turnoId;

        console.log('Time set:', this.currentItem);
        return true;
    },

    /**
     * Check if current item is complete and ready to add to cart
     * @returns {boolean} True if complete
     */
    isComplete() {
        if (!this.currentItem) return false;

        if (this.currentItem.type === 'examen') {
            // Exams are always complete
            return true;
        }

        if (this.currentItem.type === 'consulta') {
            // Consultas need doctor, date, and time
            return !!(this.currentItem.doctorId && this.currentItem.date && this.currentItem.time);
        }

        return false;
    },

    /**
     * Add current item to cart and reset builder
     * @returns {boolean} Success status
     */
    addToCart() {
        if (!this.currentItem) {
            console.error('No item to add to cart');
            return false;
        }

        if (this.currentItem.type === 'consulta' && !this.isComplete()) {
            console.error('Cannot add incomplete consulta to cart');
            if (typeof ToastNotification !== 'undefined') {
                ToastNotification.error('Completa todos los pasos: médico, fecha y hora');
            }
            return false;
        }

        // Add to cart
        if (typeof CartManager !== 'undefined') {
            const success = CartManager.addItem(this.currentItem);

            if (success) {
                // Reset builder
                this.reset();
                return true;
            }
        }

        return false;
    },

    /**
     * Cancel current item being built
     */
    cancel() {
        if (this.currentItem) {
            console.log('Cancelled building item:', this.currentItem);

            if (typeof ToastNotification !== 'undefined') {
                ToastNotification.info('Selección cancelada');
            }
        }

        this.reset();
    },

    /**
     * Reset builder state
     */
    reset() {
        this.currentItem = null;
        this.isBuilding = false;
    },

    /**
     * Get current item being built
     * @returns {Object|null} Current item
     */
    getCurrentItem() {
        return this.currentItem;
    },

    /**
     * Check if builder is currently building an item
     * @returns {boolean} True if building
     */
    isBuildingItem() {
        return this.isBuilding;
    },

    /**
     * Get missing fields for current item
     * @returns {Array} Array of missing field names
     */
    getMissingFields() {
        if (!this.currentItem) return [];

        if (this.currentItem.type === 'consulta') {
            const missing = [];
            if (!this.currentItem.doctorId) missing.push('médico');
            if (!this.currentItem.date) missing.push('fecha');
            if (!this.currentItem.time) missing.push('hora');
            return missing;
        }

        return [];
    },

    /**
     * Get progress percentage (0-100)
     * @returns {number} Progress percentage
     */
    getProgress() {
        if (!this.currentItem) return 0;

        if (this.currentItem.type === 'examen') {
            return 100;
        }

        if (this.currentItem.type === 'consulta') {
            let completed = 0;
            let total = 3; // doctor, date, time

            if (this.currentItem.doctorId) completed++;
            if (this.currentItem.date) completed++;
            if (this.currentItem.time) completed++;

            return Math.round((completed / total) * 100);
        }

        return 0;
    },

    /**
     * Show current item progress in UI
     */
    showProgress() {
        if (!this.currentItem || this.currentItem.type !== 'consulta') return;

        const missing = this.getMissingFields();
        const progress = this.getProgress();

        console.log(`Progress: ${progress}% - Missing: ${missing.join(', ')}`);

        // Update breadcrumb or show progress indicator
        // This could be enhanced with a visual progress bar
    }
};

// Make globally available
window.CartItemBuilder = CartItemBuilder;
