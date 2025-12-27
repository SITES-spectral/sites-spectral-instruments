// SITES Spectral Instruments - UI Components Module
// Reusable UI components, modals, notifications, and form handlers
// WCAG 2.4.3 Compliant with focus trap support

class SitesComponents {
    constructor() {
        this.activeModals = new Set();
        this.notificationQueue = [];
        this.toastContainer = null;
        // Focus traps for WCAG 2.4.3 compliance
        this._focusTraps = new Map();
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

    /**
     * Create ecosystem codes dropdown component
     * @param {string} containerId - Container element ID
     * @param {string} selectedValue - Currently selected ecosystem code
     * @param {Object} options - Configuration options
     * @returns {Promise<void>}
     */
    async createEcosystemDropdown(containerId, selectedValue = '', options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container with ID '${containerId}' not found`);
            return;
        }

        try {
            // Fetch ecosystem codes from API
            const response = await fetch('/api/values/ecosystems');
            if (!response.ok) {
                throw new Error(`Failed to fetch ecosystem codes: ${response.status}`);
            }

            const result = await response.json();
            const ecosystems = result.data || [];

            // Group ecosystems by category
            const categories = {};
            ecosystems.forEach(eco => {
                if (!categories[eco.category]) {
                    categories[eco.category] = [];
                }
                categories[eco.category].push(eco);
            });

            // Build dropdown HTML
            let optionsHtml = '<option value="">Select ecosystem...</option>';

            Object.keys(categories).forEach(category => {
                optionsHtml += `<optgroup label="${category}">`;
                categories[category].forEach(eco => {
                    const isSelected = eco.value === selectedValue ? 'selected' : '';
                    optionsHtml += `
                        <option value="${eco.value}" ${isSelected} title="${eco.description}">
                            ${eco.label}
                        </option>
                    `;
                });
                optionsHtml += '</optgroup>';
            });

            // Create dropdown HTML
            const dropdownHtml = `
                <select class="form-control ecosystem-dropdown" id="${containerId}-select"
                        ${options.required ? 'required' : ''}>
                    ${optionsHtml}
                </select>
                ${options.showDescription ? `<div class="field-description" id="${containerId}-description">Select the ecosystem type for this instrument</div>` : ''}
            `;

            container.innerHTML = dropdownHtml;

            // Add change event listener to show description
            if (options.showDescription) {
                const select = container.querySelector('select');
                const descDiv = container.querySelector('.field-description');

                select.addEventListener('change', (e) => {
                    const selectedEco = ecosystems.find(eco => eco.value === e.target.value);
                    if (selectedEco) {
                        descDiv.textContent = selectedEco.description;
                        descDiv.style.color = '#10B981';
                    } else {
                        descDiv.textContent = 'Select the ecosystem type for this instrument';
                        descDiv.style.color = '#6B7280';
                    }
                });
            }

        } catch (error) {
            console.error('Error creating ecosystem dropdown:', error);
            container.innerHTML = `
                <select class="form-control" disabled>
                    <option>Error loading ecosystem codes</option>
                </select>
            `;
        }
    }

    /**
     * Create status codes dropdown component
     * @param {string} containerId - Container element ID
     * @param {string} selectedValue - Currently selected status code
     * @param {Object} options - Configuration options
     * @returns {Promise<void>}
     */
    async createStatusDropdown(containerId, selectedValue = '', options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container with ID '${containerId}' not found`);
            return;
        }

        try {
            // Fetch status codes from API
            const response = await fetch('/api/values/status-codes');
            if (!response.ok) {
                throw new Error(`Failed to fetch status codes: ${response.status}`);
            }

            const result = await response.json();
            const statusCodes = result.data || [];

            // Group status codes by category
            const categories = {};
            statusCodes.forEach(status => {
                if (!categories[status.category]) {
                    categories[status.category] = [];
                }
                categories[status.category].push(status);
            });

            // Build dropdown HTML
            let optionsHtml = '<option value="">Select status...</option>';

            Object.keys(categories).forEach(category => {
                optionsHtml += `<optgroup label="${category}">`;
                categories[category].forEach(status => {
                    const isSelected = status.value === selectedValue ? 'selected' : '';
                    optionsHtml += `
                        <option value="${status.value}" ${isSelected}
                                title="${status.description}"
                                data-color="${status.color}">
                            ${status.label}
                        </option>
                    `;
                });
                optionsHtml += '</optgroup>';
            });

            // Create dropdown HTML
            const dropdownHtml = `
                <select class="form-control status-dropdown" id="${containerId}-select"
                        ${options.required ? 'required' : ''}>
                    ${optionsHtml}
                </select>
                ${options.showDescription ? `<div class="field-description" id="${containerId}-description">Select the operational status</div>` : ''}
            `;

            container.innerHTML = dropdownHtml;

            // Add change event listener to show description and color
            if (options.showDescription) {
                const select = container.querySelector('select');
                const descDiv = container.querySelector('.field-description');

                select.addEventListener('change', (e) => {
                    const selectedStatus = statusCodes.find(status => status.value === e.target.value);
                    if (selectedStatus) {
                        descDiv.textContent = selectedStatus.description;
                        descDiv.style.color = selectedStatus.color;
                    } else {
                        descDiv.textContent = 'Select the operational status';
                        descDiv.style.color = '#6B7280';
                    }
                });

                // Set initial description if there's a selected value
                if (selectedValue) {
                    const selectedStatus = statusCodes.find(status => status.value === selectedValue);
                    if (selectedStatus) {
                        descDiv.textContent = selectedStatus.description;
                        descDiv.style.color = selectedStatus.color;
                    }
                }
            }

        } catch (error) {
            console.error('Error creating status dropdown:', error);
            container.innerHTML = `
                <select class="form-control" disabled>
                    <option>Error loading status codes</option>
                </select>
            `;
        }
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

        // WCAG 4.1.3: Add ARIA attributes for screen reader announcements
        if (type === 'error' || type === 'warning') {
            notification.setAttribute('role', 'alert');
            notification.setAttribute('aria-live', 'assertive');
        } else {
            notification.setAttribute('role', 'status');
            notification.setAttribute('aria-live', 'polite');
        }

        const icon = this.getNotificationIcon(type);

        notification.innerHTML = `
            <div class="toast-content">
                <i class="fas ${icon}" style="margin-right: 8px;"></i>
                <span class="toast-message">${this.escapeHtml(message)}</span>
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

    // Modal system with WCAG 2.4.3 focus trap
    showModal(modalOrId) {
        // Accept both string ID and element object (like closeModal does)
        const modal = typeof modalOrId === 'string'
            ? document.getElementById(modalOrId)
            : modalOrId;

        if (modal) {
            modal.classList.add('show');
            this.activeModals.add(modal);
            document.body.style.overflow = 'hidden';

            // WCAG 2.4.3: Activate focus trap
            const content = modal.querySelector('.modal-content, .modal-dialog') || modal;
            if (window.FocusTrap) {
                const trap = new window.FocusTrap(content, {
                    autoFocus: true,
                    returnFocus: true
                });
                trap.activate();
                this._focusTraps.set(modal, trap);
            } else {
                // Fallback: basic focus management
                const firstFocusable = modal.querySelector('input, select, textarea, button');
                if (firstFocusable) {
                    setTimeout(() => firstFocusable.focus(), 100);
                }
            }
        }
    }

    closeModal(modal) {
        if (typeof modal === 'string') {
            modal = document.getElementById(modal);
        }

        if (modal) {
            // WCAG 2.4.3: Deactivate focus trap
            const trap = this._focusTraps.get(modal);
            if (trap) {
                trap.deactivate();
                this._focusTraps.delete(modal);
            }

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
        // WCAG 2.4.3: Deactivate all focus traps
        this._focusTraps.forEach(trap => trap.deactivate());
        this._focusTraps.clear();

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
                    ${this.escapeHtml(text)}
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
                    <p>${this.escapeHtml(message)}</p>
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
        // Delegate to central security module
        return window.SitesSecurity?.escapeHtml?.(text) ?? (text ? String(text).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'})[m]) : '');
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