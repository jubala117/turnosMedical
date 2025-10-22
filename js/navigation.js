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
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => NavigationManager.init());
} else {
    NavigationManager.init();
}
