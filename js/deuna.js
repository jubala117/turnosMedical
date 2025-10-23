/**
 * deuna.js
 * Integración con deUna - Sistema de pagos del Banco Pichincha
 * https://docs.deuna.com/
 */

const DeunaPayment = {
    // Configuración
    config: {
        // TODO: Configurar con tus credenciales reales
        publicKey: 'YOUR_PUBLIC_KEY', // Reemplazar con tu Public Key de deUna
        environment: 'sandbox', // 'sandbox' o 'production'
        closeOnComplete: true,
        closeOnError: false
    },

    // Estado de pago
    currentPayment: null,

    /**
     * Initialize deUna integration
     */
    init() {
        console.log('deUna Payment integration initialized');
    },

    /**
     * Process payment for cart items
     * @param {Object} cartData - Cart export data from CartManager
     * @param {Object} customerData - Customer information
     */
    async processPayment(cartData, customerData) {
        try {
            console.log('Processing payment with deUna:', {
                items: cartData.items,
                total: cartData.total,
                customer: customerData
            });

            // Preparar datos del pedido para deUna
            const orderData = this.prepareOrderData(cartData, customerData);

            // TODO: Implementar integración con deUna
            // Opción 1: Botón de Pago
            // this.createPaymentButton(orderData);

            // Opción 2: Código QR
            // this.generateQRCode(orderData);

            // Por ahora, mostrar modal de confirmación
            this.showPaymentModal(orderData);

        } catch (error) {
            console.error('Error processing payment:', error);
            if (typeof ToastNotification !== 'undefined') {
                ToastNotification.error('Error al procesar el pago. Intenta nuevamente.');
            }
        }
    },

    /**
     * Prepare order data for deUna
     * @param {Object} cartData - Cart data
     * @param {Object} customerData - Customer data
     * @returns {Object} Order data
     */
    prepareOrderData(cartData, customerData) {
        return {
            order_id: this.generateOrderId(),
            amount: cartData.total,
            currency: 'USD',
            customer: {
                id: customerData.idPersona,
                name: customerData.nombre,
                email: customerData.email || '',
                phone: customerData.telefono || ''
            },
            items: cartData.items.map(item => ({
                name: item.name,
                quantity: 1,
                unit_price: item.price,
                category: item.type === 'consulta' ? 'medical_consultation' : 'medical_exam'
            })),
            metadata: {
                patient_id: customerData.idPersona,
                appointment_count: cartData.itemCount,
                created_at: new Date().toISOString()
            }
        };
    },

    /**
     * Generate unique order ID
     * @returns {string} Order ID
     */
    generateOrderId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 9);
        return `MC-${timestamp}-${random}`.toUpperCase();
    },

    /**
     * Create payment button (deUna Button API)
     * @param {Object} orderData - Order data
     */
    createPaymentButton(orderData) {
        // TODO: Implementar con deUna Button API
        // Documentación: https://docs.deuna.com/docs/button-api

        console.log('Creating payment button:', orderData);

        /*
        // Ejemplo de implementación:
        window.deunaButton = new DeunaButton({
            publicKey: this.config.publicKey,
            environment: this.config.environment,
            orderData: orderData,
            onSuccess: (response) => this.handlePaymentSuccess(response),
            onError: (error) => this.handlePaymentError(error),
            onClose: () => this.handlePaymentClose()
        });

        window.deunaButton.render('#deuna-button-container');
        */
    },

    /**
     * Generate QR code for payment (deUna QR API)
     * @param {Object} orderData - Order data
     */
    async generateQRCode(orderData) {
        // TODO: Implementar con deUna QR API
        // Documentación: https://docs.deuna.com/docs/qr-api

        console.log('Generating QR code:', orderData);

        /*
        // Ejemplo de implementación:
        try {
            const response = await fetch('https://api.deuna.com/v1/payments/qr', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.publicKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });

            const data = await response.json();

            if (data.qr_code_url) {
                this.displayQRCode(data.qr_code_url);
            }
        } catch (error) {
            console.error('Error generating QR:', error);
        }
        */
    },

    /**
     * Show payment modal (placeholder hasta implementar deUna)
     * @param {Object} orderData - Order data
     */
    showPaymentModal(orderData) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-70 z-[200] flex items-center justify-center p-4';
        modal.id = 'deuna-payment-modal';

        modal.innerHTML = `
            <div class="bg-white rounded-2xl shadow-2xl w-full" style="max-width: 500px; max-height: 85vh; display: flex; flex-direction: column;">
                <!-- Header Section (Fixed) -->
                <div class="p-6 text-center" style="flex-shrink: 0;">
                    <i class="fas fa-credit-card text-5xl text-blue-600 mb-3" aria-hidden="true"></i>
                    <h2 class="text-2xl font-bold text-gray-800 mb-2">Pago con deUna</h2>
                    <p class="text-lg text-gray-600 mb-1">Total a pagar:</p>
                    <div class="text-4xl font-bold text-blue-600 mb-2">
                        $${orderData.amount.toFixed(2)}
                    </div>
                    <p class="text-xs text-gray-500">Pedido: ${orderData.order_id}</p>
                </div>

                <!-- Scrollable Content Section -->
                <div class="px-6 py-2" style="flex: 1 1 auto; overflow-y: auto; min-height: 0;">
                    <div class="bg-blue-50 rounded-xl p-4 mb-3 text-left">
                        <h3 class="font-bold text-gray-800 mb-2 text-sm">Detalles del pedido:</h3>
                        <ul class="space-y-1 text-xs text-gray-600">
                            ${orderData.items.map(item =>
                                `<li>• ${item.name} - $${item.unit_price.toFixed(2)}</li>`
                            ).join('')}
                        </ul>
                    </div>

                    <p class="text-xs text-gray-600 mb-3">
                        <strong>NOTA:</strong> La integración con deUna será configurada con tus credenciales.
                    </p>
                </div>

                <!-- Footer Section (Fixed) -->
                <div class="p-6 pt-4 flex gap-4 border-t border-gray-200" style="flex-shrink: 0;">
                    <button
                        type="button"
                        class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-xl text-base transition-colors"
                        onclick="document.getElementById('deuna-payment-modal').remove()">
                        Cancelar
                    </button>
                    <button
                        type="button"
                        class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl text-base transition-colors"
                        onclick="DeunaPayment.simulatePayment('${orderData.order_id}')">
                        <i class="fas fa-lock mr-2" aria-hidden="true"></i>
                        Simular Pago
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    },

    /**
     * Simulate payment (for testing - remove in production)
     * @param {string} orderId - Order ID
     */
    simulatePayment(orderId) {
        console.log('Simulating payment for order:', orderId);

        // Cerrar modal
        const modal = document.getElementById('deuna-payment-modal');
        if (modal) modal.remove();

        // Simular éxito
        setTimeout(() => {
            this.handlePaymentSuccess({
                order_id: orderId,
                status: 'approved',
                transaction_id: 'SIMULATED-' + Date.now()
            });
        }, 1000);
    },

    /**
     * Handle successful payment
     * @param {Object} response - Payment response from deUna
     */
    handlePaymentSuccess(response) {
        console.log('Payment successful:', response);

        if (typeof ToastNotification !== 'undefined') {
            ToastNotification.success('¡Pago procesado exitosamente!');
        }

        // Limpiar carrito
        if (typeof CartManager !== 'undefined') {
            CartManager.clearCart();
        }

        // Mostrar pantalla de confirmación
        this.showSuccessScreen(response);
    },

    /**
     * Handle payment error
     * @param {Object} error - Error from deUna
     */
    handlePaymentError(error) {
        console.error('Payment error:', error);

        if (typeof ToastNotification !== 'undefined') {
            ToastNotification.error('Error al procesar el pago. Por favor intenta nuevamente.');
        }
    },

    /**
     * Handle payment modal close
     */
    handlePaymentClose() {
        console.log('Payment modal closed by user');
    },

    /**
     * Show success screen
     * @param {Object} paymentData - Payment response data
     */
    showSuccessScreen(paymentData) {
        // Crear pantalla de éxito
        const successDiv = document.createElement('div');
        successDiv.className = 'fixed inset-0 bg-white z-[300] flex items-center justify-center p-8';

        successDiv.innerHTML = `
            <div class="text-center max-w-2xl">
                <div class="mb-8">
                    <i class="fas fa-check-circle text-9xl text-green-500 mb-6" aria-hidden="true"></i>
                    <h1 class="text-5xl font-bold text-gray-800 mb-4">¡Pago Exitoso!</h1>
                    <p class="text-2xl text-gray-600 mb-6">
                        Tu cita ha sido agendada correctamente
                    </p>
                    <div class="bg-green-50 border-2 border-green-200 rounded-xl p-6 mb-6">
                        <p class="text-lg text-gray-700">
                            Pedido: <strong>${paymentData.order_id}</strong>
                        </p>
                        <p class="text-sm text-gray-600 mt-2">
                            Recibirás un correo de confirmación con los detalles
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    class="btn-primary"
                    onclick="location.reload()">
                    <i class="fas fa-home mr-2" aria-hidden="true"></i>
                    Volver al Inicio
                </button>
            </div>
        `;

        document.body.appendChild(successDiv);

        // Auto-redirect después de 10 segundos
        setTimeout(() => {
            location.reload();
        }, 10000);
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => DeunaPayment.init());
} else {
    DeunaPayment.init();
}

// Make globally available
window.DeunaPayment = DeunaPayment;
