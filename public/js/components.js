// SITES Spectral Instruments - UI Components Module
// Reusable UI components, modals, notifications, and form handlers

class SitesComponents {
    constructor() {
        this.activeModals = new Set();
        this.notificationQueue = [];
        this.toastContainer = null;
        this.init();
    }

    init() {
        // Initialize toast container
        this.toastContainer = document.getElementById('toast-container') || this.createToastContainer();

        // Setup global event listeners
        this.setupGlobalEventListeners();
    }

    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
        `;
        document.body.appendChild(container);
        return container;
    }

    setupGlobalEventListeners() {
        // Close modals on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeTopModal();
            }
        });

        // Close modals on backdrop click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-backdrop')) {
                this.closeModal(e.target.closest('.modal'));
            }
        });
    }

    // Notification system
    showNotification(message, type = 'info', duration = 5000) {
        const notification = this.createNotification(message, type);
        this.toastContainer.appendChild(notification);

        // Trigger animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                this.removeNotification(notification);
            }, duration);
        }

        return notification;
    }

    createNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `toast toast-${type}`;

        const icon = this.getNotificationIcon(type);

        notification.innerHTML = `
            <div class="toast-content">
                <i class="fas ${icon}" style="margin-right: 8px;"></i>
                <span class="toast-message">${message}</span>
                <button class="toast-close" onclick="sitesComponents.removeNotification(this.closest('.toast'))">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        notification.style.cssText = `
            margin-bottom: 10px;
            padding: 12px 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            background: white;
            border-left: 4px solid ${this.getNotificationColor(type)};
            transform: translateX(100%);
            opacity: 0;
            transition: all 0.3s ease;
        `;

        return notification;
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    getNotificationColor(type) {
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        return colors[type] || colors.info;
    }

    removeNotification(notification) {
        if (notification && notification.parentNode) {
            notification.style.transform = 'translateX(100%)';
            notification.style.opacity = '0';

            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }

    // Modal system
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            this.activeModals.add(modal);
            document.body.style.overflow = 'hidden';

            // Focus management
            const firstFocusable = modal.querySelector('input, select, textarea, button');
            if (firstFocusable) {
                setTimeout(() => firstFocusable.focus(), 100);
            }
        }
    }

    closeModal(modal) {
        if (typeof modal === 'string') {
            modal = document.getElementById(modal);
        }

        if (modal) {
            modal.classList.remove('show');
            this.activeModals.delete(modal);

            if (this.activeModals.size === 0) {
                document.body.style.overflow = '';
            }
        }
    }

    closeTopModal() {
        if (this.activeModals.size > 0) {
            const modals = Array.from(this.activeModals);
            this.closeModal(modals[modals.length - 1]);
        }
    }

    closeAllModals() {
        this.activeModals.forEach(modal => {
            modal.classList.remove('show');
        });
        this.activeModals.clear();
        document.body.style.overflow = '';
    }

    // Loading states
    showLoading(element, text = 'Loading...') {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }

        if (element) {
            element.innerHTML = `
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin" style="margin-right: 8px;"></i>
                    ${text}
                </div>
            `;
            element.style.opacity = '0.7';
        }
    }

    hideLoading(element) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }

        if (element) {
            element.style.opacity = '';
            const spinner = element.querySelector('.loading-spinner');
            if (spinner) {
                spinner.remove();
            }
        }
    }

    // Form validation
    validateForm(formElement, rules = {}) {
        const errors = [];
        const formData = new FormData(formElement);

        for (const [fieldName, rule] of Object.entries(rules)) {
            const value = formData.get(fieldName);
            const fieldErrors = this.validateField(value, rule, fieldName);
            errors.push(...fieldErrors);
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    validateField(value, rule, fieldName) {
        const errors = [];

        if (rule.required && (!value || value.trim() === '')) {
            errors.push(`${fieldName} is required`);
        }

        if (value && rule.minLength && value.length < rule.minLength) {
            errors.push(`${fieldName} must be at least ${rule.minLength} characters`);
        }

        if (value && rule.maxLength && value.length > rule.maxLength) {
            errors.push(`${fieldName} must be no more than ${rule.maxLength} characters`);
        }

        if (value && rule.pattern && !rule.pattern.test(value)) {
            errors.push(rule.message || `${fieldName} format is invalid`);
        }

        if (value && rule.custom && typeof rule.custom === 'function') {
            const customResult = rule.custom(value);
            if (customResult !== true) {
                errors.push(customResult || `${fieldName} is invalid`);
            }
        }

        return errors;
    }

    // Form helpers
    resetForm(formElement) {
        if (typeof formElement === 'string') {
            formElement = document.getElementById(formElement);
        }

        if (formElement) {
            formElement.reset();
            this.clearFormErrors(formElement);
        }
    }

    clearFormErrors(formElement) {
        const errorElements = formElement.querySelectorAll('.error-message');
        errorElements.forEach(el => el.remove());

        const errorFields = formElement.querySelectorAll('.error');
        errorFields.forEach(el => el.classList.remove('error'));
    }

    showFormErrors(formElement, errors) {
        this.clearFormErrors(formElement);

        errors.forEach(error => {
            const fieldName = error.field || error.split(' ')[0].toLowerCase();
            const field = formElement.querySelector(`[name="${fieldName}"]`);

            if (field) {
                field.classList.add('error');

                const errorElement = document.createElement('div');
                errorElement.className = 'error-message';
                errorElement.textContent = error.message || error;
                errorElement.style.cssText = 'color: #ef4444; font-size: 0.875rem; margin-top: 4px;';

                field.parentNode.appendChild(errorElement);
            }
        });
    }

    // Confirmation dialog
    showConfirmDialog(message, onConfirm, onCancel = null) {
        const dialog = document.createElement('div');
        dialog.className = 'modal confirmation-modal';
        dialog.innerHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Confirm Action</h3>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary cancel-btn">Cancel</button>
                    <button class="btn btn-danger confirm-btn">Confirm</button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        const confirmBtn = dialog.querySelector('.confirm-btn');
        const cancelBtn = dialog.querySelector('.cancel-btn');

        const cleanup = () => {
            this.closeModal(dialog);
            setTimeout(() => document.body.removeChild(dialog), 300);
        };

        confirmBtn.addEventListener('click', () => {
            cleanup();
            if (onConfirm) onConfirm();
        });

        cancelBtn.addEventListener('click', () => {
            cleanup();
            if (onCancel) onCancel();
        });

        this.showModal(dialog);
        return dialog;
    }

    // Utility functions
    formatDate(date, format = 'YYYY-MM-DD') {
        if (!date) return '';

        const d = new Date(date);
        if (isNaN(d.getTime())) return '';

        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');

        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day);
    }

    formatNumber(number, decimals = 2) {
        if (typeof number !== 'number') return '';
        return number.toFixed(decimals);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

// Global instance
window.sitesComponents = new SitesComponents();

// Global convenience functions
function showNotification(message, type = 'info', duration = 5000) {
    return window.sitesComponents.showNotification(message, type, duration);
}

function showModal(modalId) {
    return window.sitesComponents.showModal(modalId);
}

function closeModal(modal) {
    return window.sitesComponents.closeModal(modal);
}

function showError(message) {
    return window.sitesComponents.showNotification(message, 'error');
}

function showSuccess(message) {
    return window.sitesComponents.showNotification(message, 'success');
}

function showConfirmDialog(message, onConfirm, onCancel) {
    return window.sitesComponents.showConfirmDialog(message, onConfirm, onCancel);
}