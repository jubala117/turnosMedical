/**
 * navigation.js
 * Manages fixed header/footer navigation, breadcrumbs, and navigation history
 * for the kiosk interface
 */

const NavigationManager = {
    // Navigation history stack
    history: ['screen-cedula'],

    // Current patient info
    currentPatient: null,

    // Breadcrumb configurations for each screen
    breadcrumbConfig: {
        'screen-cedula': {
            label: 'Identificación',
            icon: 'fa-id-card'
        },
        'screen-especialidad': {
            label: 'Especialidad',
            icon: 'fa-stethoscope'
        },
        'screen-doctores': {
            label: 'Médico',
            icon: 'fa-user-doctor'
        },
        'screen-fechas': {
            label: 'Fecha',
            icon: 'fa-calendar-days'
        },
        'screen-horas': {
            label: 'Hora',
            icon: 'fa-clock'
        },
        'screen-examenes': {
            label: 'Exámenes',
            icon: 'fa-flask'
        },
        'screen-pago': {
            label: 'Confirmación',
            icon: 'fa-check-circle'
        }
    },

    /**
     * Initialize navigation manager
     */
    init() {
        this.setupEventListeners();
        this.updateUI('screen-cedula');
        this.setupSidebar();
    },

    /**
     * Setup event listeners for navigation buttons
     */
    setupEventListeners() {
        // Footer back button
        const backBtn = document.getElementById('footer-back-btn');
        if (backBtn) {
            addManagedListener(backBtn, 'click', () => this.goBack());
        }

        // Footer clear cart button
        const clearCartBtn = document.getElementById('footer-clear-cart-btn');
        if (clearCartBtn) {
            addManagedListener(clearCartBtn, 'click', () => this.clearCart());
        }

        // Header cancel all button
        const cancelBtn = document.getElementById('header-cancel-all');
        if (cancelBtn) {
            addManagedListener(cancelBtn, 'click', () => this.cancelAll());
        }
    },

    /**
     * Navigate to a screen and update navigation state
     * @param {string} screenId - ID of the screen to navigate to
     * @param {boolean} addToHistory - Whether to add to history (default: true)
     */
    navigateTo(screenId, addToHistory = true) {
        // Add to history if requested
        if (addToHistory && this.history[this.history.length - 1] !== screenId) {
            this.history.push(screenId);
        }

        // Update UI
        this.updateUI(screenId);

        // Show the screen (existing showScreen function will be called separately)
        console.log(`Navigating to: ${screenId}, History:`, this.history);
    },

    /**
     * Go back to previous screen
     */
    goBack() {
        const currentScreen = this.history[this.history.length - 1];

        // Check if there's a deUna payment modal open
        const deunaModal = document.getElementById('deuna-payment-modal');
        if (deunaModal) {
            // Close the modal and stay on screen-pago
            deunaModal.remove();
            console.log('Closed deUna payment modal');
            return;
        }

        // Special cases for navigation logic
        // From checkout (screen-pago), always go to screen-especialidad
        if (currentScreen === 'screen-pago') {
            this.history.pop(); // Remove screen-pago
            this.history = ['screen-cedula', 'screen-especialidad']; // Reset to especialidad
            this.updateUI('screen-especialidad');
            showScreen('screen-especialidad');
            return;
        }

        // From especialidad, do nothing (it's the main screen after login)
        if (currentScreen === 'screen-especialidad') {
            console.log('Already at especialidad screen, no back action');
            return;
        }

        // From examenes/laboratorio/odontologia/rayos screens, go back to especialidad
        if (currentScreen === 'screen-examenes') {
            this.history.pop();
            this.history = ['screen-cedula', 'screen-especialidad'];
            this.updateUI('screen-especialidad');
            showScreen('screen-especialidad');
            return;
        }

        // For other screens (doctores, fechas, horas), normal back navigation
        if (this.history.length > 1) {
            // Remove current screen
            this.history.pop();

            // Get previous screen
            const previousScreen = this.history[this.history.length - 1];

            // Navigate without adding to history
            this.updateUI(previousScreen);

            // Trigger screen change
            showScreen(previousScreen);
        }
    },

    /**
     * Clear shopping cart with confirmation
     */
    clearCart() {
        if (typeof CartManager === 'undefined' || CartManager.isEmpty()) {
            return;
        }

        const confirmed = confirm(
            '¿Estás seguro de que deseas limpiar el carrito?\n\n' +
            `Se eliminarán ${CartManager.getItemCount()} servicio(s).`
        );

        if (confirmed) {
            CartManager.clearCart();
            if (typeof ToastNotification !== 'undefined') {
                ToastNotification.info('Carrito limpiado correctamente');
            }
        }
    },

    /**
     * Cancel all and return to start (Cerrar Sesión)
     */
    cancelAll() {
        // 🔥 NUEVO: Confirmación para acción crítica
        if (typeof CartManager !== 'undefined' && !CartManager.isEmpty()) {
            const confirmed = confirm(
                '¿Estás seguro de que deseas cancelar?\n\n' +
                `Tienes ${CartManager.getItemCount()} servicio(s) en el carrito que se perderán.`
            );

            if (!confirmed) {
                return; // User cancelled the cancellation
            }
        }

        // Clear cart
        if (typeof CartManager !== 'undefined') {
            CartManager.clearCart();
        }

        // Clear cart item builder
        if (typeof CartItemBuilder !== 'undefined') {
            CartItemBuilder.cancel();
        }

        // Reset history
        this.history = ['screen-cedula'];

        // Clear patient info
        this.currentPatient = null;
        this.clearPatientInfo();

        // Clear cedula input field
        const cedulaInput = document.getElementById('cedula-input');
        if (cedulaInput) {
            cedulaInput.value = '';
        }

        // Clear UIManager estado if available
        if (typeof UIManager !== 'undefined' && UIManager.estado) {
            UIManager.estado.currentPatientId = null;
            UIManager.estado.currentPatientName = null;
        }

        // Disable inactivity timer (will be re-enabled on next login)
        if (typeof InactivityTimer !== 'undefined') {
            InactivityTimer.disable();
        }

        // Update UI
        this.updateUI('screen-cedula');

        // Go to first screen
        showScreen('screen-cedula');

        // Show toast
        if (typeof ToastNotification !== 'undefined') {
            ToastNotification.info('Sesión cerrada. Puedes comenzar de nuevo.');
        }
    },

    /**
     * Update navigation UI based on current screen
     * @param {string} screenId - Current screen ID
     */
    updateUI(screenId) {
        this.updateBreadcrumbs(screenId);
        this.updateFooterButtons(screenId);
        this.updateHeaderButtons(screenId);
        this.updateSidebarVisibility(screenId);
    },

    /**
     * Update sidebar visibility based on current screen
     * @param {string} screenId - Current screen ID
     */
    updateSidebarVisibility(screenId) {
        // Hide sidebar on cedula screen and checkout screen (screen-pago)
        if (screenId === 'screen-cedula' || screenId === 'screen-pago') {
            this.hideSidebar();
        } else if (this.currentPatient !== null) {
            // Only show sidebar if patient is verified
            this.showSidebar();
        }
    },

    /**
     * Update breadcrumb navigation
     * @param {string} currentScreenId - Current screen ID
     */
    updateBreadcrumbs(currentScreenId) {
        const breadcrumbNav = document.getElementById('breadcrumb-nav');
        if (!breadcrumbNav) return;

        // Get path to current screen from history
        const path = this.getPathToScreen(currentScreenId);

        // Build breadcrumb HTML
        const breadcrumbItems = path.map((screenId, index) => {
            const config = this.breadcrumbConfig[screenId];
            if (!config) return '';

            const isActive = screenId === currentScreenId;
            const separator = index < path.length - 1
                ? '<i class="fas fa-chevron-right breadcrumb-separator" aria-hidden="true"></i>'
                : '';

            return `
                <li class="breadcrumb-item ${isActive ? 'active' : ''}">
                    <i class="fas ${config.icon}" aria-hidden="true"></i>
                    <span>${config.label}</span>
                </li>
                ${separator}
            `;
        }).join('');

        breadcrumbNav.innerHTML = breadcrumbItems;
    },

    /**
     * Get logical path to a screen (for breadcrumbs)
     * @param {string} targetScreenId - Target screen ID
     * @returns {Array} Array of screen IDs representing the path
     */
    getPathToScreen(targetScreenId) {
        // Define the standard flow order
        const flowOrder = [
            'screen-cedula',
            'screen-especialidad',
            'screen-doctores',
            'screen-fechas',
            'screen-horas',
            'screen-pago'
        ];

        // Special case: exámenes branches off from especialidad
        if (targetScreenId === 'screen-examenes') {
            return ['screen-cedula', 'screen-especialidad', 'screen-examenes'];
        }

        // Get index of target screen in flow
        const targetIndex = flowOrder.indexOf(targetScreenId);
        if (targetIndex === -1) return [targetScreenId];

        // Return all screens up to and including target
        return flowOrder.slice(0, targetIndex + 1);
    },

    /**
     * Update footer button visibility and state
     * @param {string} screenId - Current screen ID
     */
    updateFooterButtons(screenId) {
        const backBtn = document.getElementById('footer-back-btn');
        const clearCartBtn = document.getElementById('footer-clear-cart-btn');

        if (!backBtn) return;

        // Back button: show on all screens except first
        if (screenId === 'screen-cedula') {
            backBtn.classList.add('hidden');
        } else {
            backBtn.classList.remove('hidden');
        }

        // Clear cart button: show only on specialty/exam screens when cart has items
        if (clearCartBtn) {
            const showClearCart = (screenId === 'screen-especialidad' || screenId === 'screen-examenes') &&
                                  typeof CartManager !== 'undefined' &&
                                  !CartManager.isEmpty();

            if (showClearCart) {
                clearCartBtn.classList.remove('hidden');
            } else {
                clearCartBtn.classList.add('hidden');
            }
        }
    },

    /**
     * Update header button visibility
     * @param {string} screenId - Current screen ID
     */
    updateHeaderButtons(screenId) {
        const cancelAllBtn = document.getElementById('header-cancel-all');
        if (!cancelAllBtn) return;

        // Show cancel button on all screens except first
        if (screenId === 'screen-cedula') {
            cancelAllBtn.classList.add('hidden');
        } else {
            cancelAllBtn.classList.remove('hidden');
        }
    },

    /**
     * Set patient information in header
     * @param {Object} patient - Patient object with name and cedula
     */
    setPatientInfo(patient) {
        this.currentPatient = patient;

        const nameElement = document.getElementById('header-patient-name');
        const cedulaElement = document.getElementById('header-patient-cedula');

        if (nameElement && patient.nombre) {
            nameElement.textContent = patient.nombre;
        }

        if (cedulaElement && patient.cedula) {
            cedulaElement.textContent = `CI: ${patient.cedula}`;
        }
    },

    /**
     * Clear patient information from header
     */
    clearPatientInfo() {
        this.currentPatient = null;

        const nameElement = document.getElementById('header-patient-name');
        const cedulaElement = document.getElementById('header-patient-cedula');

        if (nameElement) nameElement.textContent = '';
        if (cedulaElement) cedulaElement.textContent = '';

        // Hide sidebar when patient info is cleared
        this.hideSidebar();
    },

    // Continue button methods removed - using cart flow now

    /**
     * Reset navigation history to current patient (after adding to cart)
     */
    resetHistory() {
        // Keep only cedula and especialidad in history
        this.history = ['screen-cedula', 'screen-especialidad'];
        console.log('Navigation history reset to:', this.history);
    },

    /**
     * Reset navigation state
     */
    reset() {
        this.history = ['screen-cedula'];
        this.currentPatient = null;
        this.updateUI('screen-cedula');
        this.hideSidebar();
    },

    /**
     * Setup sidebar interactions
     */
    setupSidebar() {
        // Sidebar specialty navigation
        const sidebarSpecialties = document.querySelectorAll('.sidebar-specialty');
        sidebarSpecialties.forEach(specialty => {
            addManagedListener(specialty, 'click', () => {
                const category = specialty.getAttribute('data-category');
                this.handleSidebarCategoryClick(category);
            });
        });
    },

    /**
     * Handle sidebar category click
     * @param {string} category - Category identifier
     */
    handleSidebarCategoryClick(category) {
        console.log('Sidebar category clicked:', category);

        // Update active state
        document.querySelectorAll('.sidebar-specialty').forEach(item => {
            item.classList.remove('active');
        });
        const clickedItem = document.querySelector(`[data-category="${category}"]`);
        if (clickedItem) {
            clickedItem.classList.add('active');
        }

        // Navigate based on category
        switch (category) {
            case 'consultas':
                if (typeof AppController !== 'undefined') {
                    showScreen('screen-especialidad');
                }
                break;
            case 'examenes':
                if (typeof AppController !== 'undefined') {
                    AppController.cargarExamenesImagen();
                }
                break;
            case 'odontologia':
                if (typeof AppController !== 'undefined') {
                    AppController.cargarServiciosOdontologia();
                }
                break;
            case 'rayosx':
                if (typeof AppController !== 'undefined') {
                    AppController.cargarRayosX();
                }
                break;
        }
    },

    /**
     * Show sidebar
     */
    showSidebar() {
        const sidebar = document.getElementById('kiosk-sidebar');
        const body = document.body;

        if (sidebar) {
            sidebar.classList.add('active');
        }

        if (body) {
            body.classList.add('sidebar-active');
        }
    },

    /**
     * Hide sidebar
     */
    hideSidebar() {
        const sidebar = document.getElementById('kiosk-sidebar');
        const body = document.body;

        if (sidebar) {
            sidebar.classList.remove('active');
        }

        if (body) {
            body.classList.remove('sidebar-active');
        }
    },

    /**
     * Update sidebar based on loaded specialties
     * @param {Array} especialidades - Array of specialty objects
     */
    updateSidebarWithSpecialties(especialidades) {
        const sidebarList = document.getElementById('sidebar-specialties-list');
        if (!sidebarList) return;

        // Clear existing items except static categories
        // For now, keep static categories. In future, could populate dynamically
        console.log('Sidebar: Loaded', especialidades.length, 'specialties');
    },

    /**
     * Load specialties into sidebar
     * @param {Array} especialidades - Array of specialty objects
     */
    loadSidebarSpecialties(especialidades) {
        const sidebarList = document.getElementById('sidebar-specialties-list');
        if (!sidebarList) return;

        // Clear existing
        sidebarList.innerHTML = '';

        // Group specialties by category (could be enhanced later)
        // For now, create a "Todas las Especialidades" expandable list
        const consultasDiv = document.createElement('div');
        consultasDiv.className = 'sidebar-specialty';
        consultasDiv.setAttribute('data-category', 'consultas');
        consultasDiv.innerHTML = `
            <i class="fas fa-stethoscope sidebar-specialty-icon" aria-hidden="true"></i>
            <span class="sidebar-specialty-name">Consultas Médicas</span>
        `;
        addManagedListener(consultasDiv, 'click', () => {
            this.handleSidebarCategoryClick('consultas');
        });
        sidebarList.appendChild(consultasDiv);

        // Exámenes
        const examenesDiv = document.createElement('div');
        examenesDiv.className = 'sidebar-specialty';
        examenesDiv.setAttribute('data-category', 'examenes');
        examenesDiv.innerHTML = `
            <i class="fas fa-flask sidebar-specialty-icon" aria-hidden="true"></i>
            <span class="sidebar-specialty-name">Exámenes</span>
        `;
        addManagedListener(examenesDiv, 'click', () => {
            this.handleSidebarCategoryClick('examenes');
        });
        sidebarList.appendChild(examenesDiv);

        // Odontología
        const odontologiaDiv = document.createElement('div');
        odontologiaDiv.className = 'sidebar-specialty';
        odontologiaDiv.setAttribute('data-category', 'odontologia');
        odontologiaDiv.innerHTML = `
            <i class="fas fa-tooth sidebar-specialty-icon" aria-hidden="true"></i>
            <span class="sidebar-specialty-name">Odontología</span>
        `;
        addManagedListener(odontologiaDiv, 'click', () => {
            this.handleSidebarCategoryClick('odontologia');
        });
        sidebarList.appendChild(odontologiaDiv);

        // Rayos X
        const rayosDiv = document.createElement('div');
        rayosDiv.className = 'sidebar-specialty';
        rayosDiv.setAttribute('data-category', 'rayosx');
        rayosDiv.innerHTML = `
            <i class="fas fa-x-ray sidebar-specialty-icon" aria-hidden="true"></i>
            <span class="sidebar-specialty-name">Rayos X</span>
        `;
        addManagedListener(rayosDiv, 'click', () => {
            this.handleSidebarCategoryClick('rayosx');
        });
        sidebarList.appendChild(rayosDiv);
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => NavigationManager.init());
} else {
    NavigationManager.init();
}
