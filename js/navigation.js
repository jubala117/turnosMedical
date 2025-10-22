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
     * Cancel all and return to start
     */
    cancelAll() {
        // Reset history
        this.history = ['screen-cedula'];

        // Clear patient info
        this.currentPatient = null;

        // Update UI
        this.updateUI('screen-cedula');

        // Go to first screen
        showScreen('screen-cedula');

        // Show toast
        if (typeof ToastNotification !== 'undefined') {
            ToastNotification.info('Proceso cancelado. Puedes comenzar de nuevo.');
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
        // Show sidebar on all screens except first (cedula)
        if (screenId === 'screen-cedula') {
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
        const continueBtn = document.getElementById('footer-continue-btn');

        if (!backBtn || !continueBtn) return;

        // Back button: show on all screens except first
        if (screenId === 'screen-cedula') {
            backBtn.classList.add('hidden');
        } else {
            backBtn.classList.remove('hidden');
        }

        // Continue button: hide on first and last screen, show on others
        if (screenId === 'screen-cedula' || screenId === 'screen-pago') {
            continueBtn.classList.add('hidden');
        } else {
            // Show but keep disabled until selection is made
            continueBtn.classList.remove('hidden');
            // Will be enabled by individual screen logic when selection is made
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

    /**
     * Enable/disable continue button
     * @param {boolean} enabled - Whether button should be enabled
     */
    setContinueEnabled(enabled) {
        const continueBtn = document.getElementById('footer-continue-btn');
        if (!continueBtn) return;

        if (enabled) {
            continueBtn.disabled = false;
        } else {
            continueBtn.disabled = true;
        }
    },

    /**
     * Set click handler for continue button
     * @param {Function} handler - Click handler function
     */
    setContinueHandler(handler) {
        const continueBtn = document.getElementById('footer-continue-btn');
        if (!continueBtn) return;

        // Remove existing handler
        const newBtn = continueBtn.cloneNode(true);
        continueBtn.parentNode.replaceChild(newBtn, continueBtn);

        // Add new handler
        if (handler) {
            addManagedListener(newBtn, 'click', handler);
        }
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
