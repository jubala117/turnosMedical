/**
 * inactivityTimer.js
 * Handles inactivity timeout for kiosk mode
 * Warns user after period of inactivity and resets session
 */

const InactivityTimer = {
    // Timer settings (in seconds)
    warningTime: 90, // Show warning after 90 seconds
    resetTime: 120, // Reset after 120 seconds total

    // Timer IDs
    warningTimerId: null,
    resetTimerId: null,

    // Warning modal reference
    warningModal: null,

    // Countdown interval
    countdownInterval: null,

    // Is timer enabled?
    enabled: false,

    /**
     * Initialize inactivity timer
     * @param {boolean} enable - Whether to enable the timer (default: true)
     */
    init(enable = true) {
        this.enabled = enable;

        if (this.enabled) {
            this.setupEventListeners();
            this.startTimer();
            console.log('InactivityTimer initialized:', {
                warningTime: this.warningTime + 's',
                resetTime: this.resetTime + 's'
            });
        }
    },

    /**
     * Setup event listeners for user activity
     */
    setupEventListeners() {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

        const resetHandler = () => {
            this.resetTimer();
        };

        events.forEach(event => {
            document.addEventListener(event, resetHandler, true);
        });
    },

    /**
     * Start or restart the inactivity timer
     */
    startTimer() {
        if (!this.enabled) return;

        // Clear existing timers
        this.clearTimers();

        // Start warning timer
        this.warningTimerId = setTimeout(() => {
            this.showWarning();
        }, this.warningTime * 1000);

        // Start reset timer
        this.resetTimerId = setTimeout(() => {
            this.resetSession();
        }, this.resetTime * 1000);
    },

    /**
     * Reset the timer (called on user activity)
     */
    resetTimer() {
        if (!this.enabled) return;

        // If warning is showing, hide it
        if (this.warningModal && !this.warningModal.classList.contains('hidden')) {
            this.hideWarning();
        }

        // Restart timer
        this.startTimer();
    },

    /**
     * Clear all timers
     */
    clearTimers() {
        if (this.warningTimerId) {
            clearTimeout(this.warningTimerId);
            this.warningTimerId = null;
        }

        if (this.resetTimerId) {
            clearTimeout(this.resetTimerId);
            this.resetTimerId = null;
        }

        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
    },

    /**
     * Show warning modal
     */
    showWarning() {
        // Create modal if it doesn't exist
        if (!this.warningModal) {
            this.warningModal = this.createWarningModal();
            document.body.appendChild(this.warningModal);
        }

        // Show modal
        this.warningModal.classList.remove('hidden');

        // Start countdown
        const remainingTime = this.resetTime - this.warningTime;
        this.startCountdown(remainingTime);

        console.log('Inactivity warning shown');
    },

    /**
     * Hide warning modal
     */
    hideWarning() {
        if (this.warningModal) {
            this.warningModal.classList.add('hidden');
        }

        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }

        console.log('Inactivity warning hidden');
    },

    /**
     * Create warning modal DOM element
     * @returns {HTMLElement} Warning modal
     */
    createWarningModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-70 z-[200] flex items-center justify-center p-4 hidden';
        modal.id = 'inactivity-warning-modal';

        modal.innerHTML = `
            <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center" onclick="event.stopPropagation()">
                <div class="mb-6">
                    <i class="fas fa-clock text-7xl text-yellow-500 mb-4" aria-hidden="true"></i>
                    <h2 class="text-3xl font-bold text-gray-800 mb-4">¿Sigues ahí?</h2>
                    <p class="text-xl text-gray-600 mb-2">
                        No hemos detectado actividad por un tiempo
                    </p>
                    <p class="text-lg text-gray-500">
                        La sesión se cerrará en:
                    </p>
                </div>

                <div class="bg-yellow-50 rounded-xl p-6 mb-6">
                    <div class="text-6xl font-bold text-yellow-600" id="inactivity-countdown">
                        30
                    </div>
                    <div class="text-sm text-gray-600 mt-2">segundos</div>
                </div>

                <button
                    type="button"
                    id="continue-session-btn"
                    class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl text-xl transition-colors">
                    <i class="fas fa-hand-pointer mr-2" aria-hidden="true"></i>
                    Continuar Usando
                </button>
            </div>
        `;

        // Add click handler to continue button
        const continueBtn = modal.querySelector('#continue-session-btn');
        if (continueBtn) {
            continueBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('Continue button clicked');
                this.hideWarning();
                this.startTimer();
            });
        }

        // Also close on modal background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                console.log('Modal background clicked');
                this.hideWarning();
                this.startTimer();
            }
        });

        return modal;
    },

    /**
     * Start countdown display
     * @param {number} seconds - Seconds to count down from
     */
    startCountdown(seconds) {
        const countdownEl = document.getElementById('inactivity-countdown');
        if (!countdownEl) return;

        let remaining = seconds;
        countdownEl.textContent = remaining;

        this.countdownInterval = setInterval(() => {
            remaining--;
            countdownEl.textContent = remaining;

            if (remaining <= 0) {
                clearInterval(this.countdownInterval);
            }
        }, 1000);
    },

    /**
     * Reset session - return to start screen
     */
    resetSession() {
        console.log('Session reset due to inactivity');

        // Hide warning
        this.hideWarning();

        // Clear timers
        this.clearTimers();

        // Clear cart
        if (typeof CartManager !== 'undefined') {
            CartManager.clearCart();
        }

        // Clear cart item builder
        if (typeof CartItemBuilder !== 'undefined') {
            CartItemBuilder.reset();
        }

        // Clear navigation
        if (typeof NavigationManager !== 'undefined') {
            NavigationManager.reset();
            NavigationManager.clearPatientInfo();
        }

        // Show notification
        if (typeof ToastNotification !== 'undefined') {
            ToastNotification.warning('Sesión cerrada por inactividad');
        }

        // Return to first screen
        if (typeof showScreen === 'function') {
            showScreen('screen-cedula');
        }

        // Restart timer
        this.startTimer();
    },

    /**
     * Disable inactivity timer
     */
    disable() {
        this.enabled = false;
        this.clearTimers();
        this.hideWarning();
        console.log('InactivityTimer disabled');
    },

    /**
     * Enable inactivity timer
     */
    enable() {
        this.enabled = true;
        this.startTimer();
        console.log('InactivityTimer enabled');
    }
};

// Initialize when DOM is ready (enabled by default for kiosk mode)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => InactivityTimer.init(true));
} else {
    InactivityTimer.init(true);
}

// Make globally available
window.InactivityTimer = InactivityTimer;
