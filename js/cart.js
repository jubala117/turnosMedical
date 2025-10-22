/**
 * cart.js
 * Shopping cart state management for multi-service selection
 * Handles adding, removing, and managing appointments in the cart
 */

const CartManager = {
    // Cart items array
    items: [],

    // Cart listeners for updates
    listeners: [],

    /**
     * Initialize cart manager
     */
    init() {
        this.renderCart();
        this.setupCheckoutButton();
        console.log('CartManager initialized');
    },

    /**
     * Setup checkout button handler
     */
    setupCheckoutButton() {
        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn) {
            addManagedListener(checkoutBtn, 'click', () => {
                this.proceedToCheckout();
            });
        }
    },

    /**
     * Proceed to checkout
     */
    proceedToCheckout() {
        // Validate cart
        const validation = this.validateForCheckout();

        if (!validation.valid) {
            if (typeof ToastNotification !== 'undefined') {
                ToastNotification.error(validation.errors[0]);
            } else {
                alert(validation.errors.join('\n'));
            }
            return;
        }

        // Show confirmation
        console.log('Proceeding to checkout:', this.exportForCheckout());

        if (typeof ToastNotification !== 'undefined') {
            ToastNotification.success('Procesando agendamiento...');
        }

        // Navigate to payment screen
        if (typeof showScreen === 'function') {
            showScreen('screen-pago');
        }
    },

    /**
     * Add item to cart
     * @param {Object} item - Cart item object
     * @returns {boolean} Success status
     */
    addItem(item) {
        // Validate required fields
        if (!item.type || !item.name || !item.price) {
            console.error('Invalid cart item:', item);
            return false;
        }

        // Generate unique ID if not provided
        if (!item.id) {
            item.id = this.generateItemId();
        }

        // Add timestamp
        item.addedAt = new Date().toISOString();

        // Add to cart
        this.items.push(item);

        // Update UI
        this.renderCart();
        this.notifyListeners('add', item);

        // Show success toast
        if (typeof ToastNotification !== 'undefined') {
            ToastNotification.success(`${item.name} agregado al carrito`);
        }

        console.log('Item added to cart:', item);
        return true;
    },

    /**
     * Remove item from cart by ID
     * @param {string} itemId - Item ID to remove
     * @returns {boolean} Success status
     */
    removeItem(itemId) {
        const index = this.items.findIndex(item => item.id === itemId);

        if (index === -1) {
            console.error('Item not found in cart:', itemId);
            return false;
        }

        const removedItem = this.items[index];
        this.items.splice(index, 1);

        // Update UI
        this.renderCart();
        this.notifyListeners('remove', removedItem);

        // Show toast
        if (typeof ToastNotification !== 'undefined') {
            ToastNotification.info(`${removedItem.name} eliminado del carrito`);
        }

        console.log('Item removed from cart:', removedItem);
        return true;
    },

    /**
     * Update item in cart
     * @param {string} itemId - Item ID to update
     * @param {Object} updates - Fields to update
     * @returns {boolean} Success status
     */
    updateItem(itemId, updates) {
        const index = this.items.findIndex(item => item.id === itemId);

        if (index === -1) {
            console.error('Item not found in cart:', itemId);
            return false;
        }

        // Update item
        this.items[index] = { ...this.items[index], ...updates };

        // Update UI
        this.renderCart();
        this.notifyListeners('update', this.items[index]);

        console.log('Item updated in cart:', this.items[index]);
        return true;
    },

    /**
     * Clear all items from cart
     */
    clearCart() {
        const itemCount = this.items.length;
        this.items = [];

        // Update UI
        this.renderCart();
        this.notifyListeners('clear', null);

        // Show toast
        if (typeof ToastNotification !== 'undefined') {
            ToastNotification.info(`Carrito vaciado (${itemCount} ${itemCount === 1 ? 'item' : 'items'})`);
        }

        console.log('Cart cleared');
    },

    /**
     * Get all cart items
     * @returns {Array} Cart items
     */
    getItems() {
        return [...this.items];
    },

    /**
     * Get cart item count
     * @returns {number} Number of items
     */
    getItemCount() {
        return this.items.length;
    },

    /**
     * Calculate cart total
     * @returns {number} Total price
     */
    getTotal() {
        return this.items.reduce((total, item) => total + (parseFloat(item.price) || 0), 0);
    },

    /**
     * Check if cart is empty
     * @returns {boolean} True if empty
     */
    isEmpty() {
        return this.items.length === 0;
    },

    /**
     * Generate unique item ID
     * @returns {string} Unique ID
     */
    generateItemId() {
        return `cart-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    },

    /**
     * Render cart UI in sidebar
     */
    renderCart() {
        const cartItemsContainer = document.getElementById('sidebar-cart-items');
        const cartEmptyMessage = document.getElementById('cart-empty-message');
        const cartItemCount = document.getElementById('cart-item-count');
        const cartTotalAmount = document.getElementById('cart-total-amount');
        const checkoutBtn = document.getElementById('checkout-btn');

        if (!cartItemsContainer) {
            console.error('Cart container not found');
            return;
        }

        // Update item count
        if (cartItemCount) {
            cartItemCount.textContent = this.getItemCount();
        }

        // Update total
        if (cartTotalAmount) {
            const total = this.getTotal();
            cartTotalAmount.textContent = `$${total.toFixed(2)}`;
        }

        // Update checkout button state
        if (checkoutBtn) {
            checkoutBtn.disabled = this.isEmpty();
        }

        // Clear container
        cartItemsContainer.innerHTML = '';

        // Show empty state or items
        if (this.isEmpty()) {
            if (cartEmptyMessage) {
                cartEmptyMessage.style.display = 'block';
            }
        } else {
            if (cartEmptyMessage) {
                cartEmptyMessage.style.display = 'none';
            }

            // Render each item
            this.items.forEach(item => {
                const itemElement = this.createCartItemElement(item);
                cartItemsContainer.appendChild(itemElement);
            });
        }
    },

    /**
     * Create cart item DOM element
     * @param {Object} item - Cart item
     * @returns {HTMLElement} Cart item element
     */
    createCartItemElement(item) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'sidebar-cart-item';
        itemDiv.setAttribute('data-item-id', item.id);

        // Item name
        const nameDiv = document.createElement('div');
        nameDiv.className = 'sidebar-cart-item-name';
        nameDiv.textContent = item.name;

        // Item details
        const detailsDiv = document.createElement('div');
        detailsDiv.className = 'sidebar-cart-item-details';
        const details = [];

        if (item.doctorName) {
            details.push(`Dr. ${item.doctorName}`);
        }
        if (item.date) {
            details.push(item.date);
        }
        if (item.time) {
            details.push(item.time);
        }
        if (item.priceType) {
            const typeLabel = item.priceType === 'club' ? 'Club Medical' : 'Particular';
            details.push(typeLabel);
        }

        detailsDiv.textContent = details.join(' • ');

        // Price and remove button container
        const actionDiv = document.createElement('div');
        actionDiv.style.display = 'flex';
        actionDiv.style.justifyContent = 'space-between';
        actionDiv.style.alignItems = 'center';
        actionDiv.style.marginTop = '0.5rem';

        // Item price
        const priceDiv = document.createElement('div');
        priceDiv.className = 'sidebar-cart-item-price';
        priceDiv.textContent = `$${parseFloat(item.price).toFixed(2)}`;

        // Remove button
        const removeBtn = document.createElement('button');
        removeBtn.className = 'text-red-600 hover:text-red-800 text-xs font-semibold';
        removeBtn.innerHTML = '<i class="fas fa-trash" aria-hidden="true"></i> Eliminar';
        removeBtn.setAttribute('aria-label', `Eliminar ${item.name} del carrito`);

        addManagedListener(removeBtn, 'click', (e) => {
            e.stopPropagation();
            this.removeItem(item.id);
        });

        actionDiv.appendChild(priceDiv);
        actionDiv.appendChild(removeBtn);

        // Assemble item
        itemDiv.appendChild(nameDiv);
        if (details.length > 0) {
            itemDiv.appendChild(detailsDiv);
        }
        itemDiv.appendChild(actionDiv);

        return itemDiv;
    },

    /**
     * Add listener for cart changes
     * @param {Function} callback - Callback function (action, item)
     */
    addListener(callback) {
        if (typeof callback === 'function') {
            this.listeners.push(callback);
        }
    },

    /**
     * Remove listener
     * @param {Function} callback - Callback to remove
     */
    removeListener(callback) {
        const index = this.listeners.indexOf(callback);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    },

    /**
     * Notify all listeners of cart change
     * @param {string} action - Action type (add, remove, update, clear)
     * @param {Object} item - Affected item
     */
    notifyListeners(action, item) {
        this.listeners.forEach(callback => {
            try {
                callback(action, item, this.getItems());
            } catch (error) {
                console.error('Error in cart listener:', error);
            }
        });
    },

    /**
     * Export cart data for checkout
     * @returns {Object} Cart export data
     */
    exportForCheckout() {
        return {
            items: this.getItems(),
            itemCount: this.getItemCount(),
            total: this.getTotal(),
            exportedAt: new Date().toISOString()
        };
    },

    /**
     * Validate cart for checkout
     * @returns {Object} Validation result {valid: boolean, errors: Array}
     */
    validateForCheckout() {
        const errors = [];

        if (this.isEmpty()) {
            errors.push('El carrito está vacío');
        }

        // Check if all items have required details
        this.items.forEach((item, index) => {
            if (item.type === 'consulta') {
                if (!item.doctorId) {
                    errors.push(`Item ${index + 1} (${item.name}): Falta seleccionar médico`);
                }
                if (!item.date) {
                    errors.push(`Item ${index + 1} (${item.name}): Falta seleccionar fecha`);
                }
                if (!item.time) {
                    errors.push(`Item ${index + 1} (${item.name}): Falta seleccionar hora`);
                }
            }
        });

        return {
            valid: errors.length === 0,
            errors: errors
        };
    },

    /**
     * Reset cart state
     */
    reset() {
        this.items = [];
        this.listeners = [];
        this.renderCart();
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => CartManager.init());
} else {
    CartManager.init();
}
