// SITES Spectral v13.19.0 - Enhanced Modal System
// Unified modal component architecture for admin CRUD operations and improved UX
// WCAG 2.4.3 Compliant with focus trap support
// Uses core/focus-trap.js for accessible keyboard navigation

class BaseModal {
    constructor(config) {
        this.id = config.id;
        this.title = config.title;
        this.size = config.size || 'md'; // sm, md, lg, xl
        this.type = config.type || 'standard'; // standard, admin, danger
        this.requiredPermissions = config.requiredPermissions || [];
        this.onOpen = config.onOpen || null;
        this.onClose = config.onClose || null;
        this.destroyOnClose = config.destroyOnClose || false;

        // Swedish research context
        this.swedishContext = config.swedishContext || false;
        this.ecosystemCodes = config.ecosystemCodes || [];

        this.modal = null;
        this.isOpen = false;

        // Focus trap for WCAG 2.4.3 compliance
        this._focusTrap = null;
    }

    // Check if user has required permissions
    hasPermission() {
        if (this.requiredPermissions.length === 0) return true;

        const user = window.currentUser;
        if (!user) return false;

        return this.requiredPermissions.every(permission => {
            if (permission === 'admin') return user.role === 'admin';
            if (permission === 'station') return user.role === 'station' || user.role === 'admin';
            return true;
        });
    }

    // Create modal HTML structure
    createModal() {
        const modal = document.createElement('div');
        modal.id = this.id;
        modal.className = `sites-modal sites-modal-${this.size} sites-modal-${this.type}`;

        // Generate unique IDs for ARIA references
        const titleId = `${this.id}-title`;

        modal.innerHTML = `
            <div class="sites-modal-backdrop" aria-hidden="true"></div>
            <div class="sites-modal-content" role="dialog" aria-modal="true" aria-labelledby="${titleId}">
                <div class="sites-modal-header">
                    <h3 class="sites-modal-title" id="${titleId}">${this.title}</h3>
                    <button class="sites-modal-close" type="button" aria-label="Close modal">
                        <i class="fas fa-times" aria-hidden="true"></i>
                    </button>
                </div>
                <div class="sites-modal-body">
                    ${this.getBodyContent()}
                </div>
                <div class="sites-modal-footer">
                    ${this.getFooterContent()}
                </div>
            </div>
        `;

        // Event listeners
        modal.querySelector('.sites-modal-close').addEventListener('click', () => this.close());
        modal.querySelector('.sites-modal-backdrop').addEventListener('click', () => this.close());

        return modal;
    }

    // Override in subclasses
    getBodyContent() {
        return '<p>Modal content goes here</p>';
    }

    // Override in subclasses
    getFooterContent() {
        return `
            <button type="button" class="btn btn-secondary" onclick="this.closest('.sites-modal').modalInstance.close()">
                Cancel
            </button>
        `;
    }

    // Open modal
    open() {
        if (!this.hasPermission()) {
            showError('You do not have permission to access this feature');
            return false;
        }

        if (!this.modal) {
            this.modal = this.createModal();
            document.body.appendChild(this.modal);
            this.modal.modalInstance = this; // Reference for event handlers
        }

        this.modal.classList.add('show');
        this.isOpen = true;
        document.body.style.overflow = 'hidden';

        // WCAG 2.4.3: Activate focus trap
        const content = this.modal.querySelector('.sites-modal-content') || this.modal;
        if (window.FocusTrap) {
            this._focusTrap = new window.FocusTrap(content, {
                autoFocus: true,
                returnFocus: true
            });
            this._focusTrap.activate();
        } else {
            // Fallback: basic focus management
            const firstInput = this.modal.querySelector('input, select, textarea, button');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }

        if (this.onOpen) {
            this.onOpen();
        }

        return true;
    }

    // Close modal
    close() {
        if (!this.modal) return;

        // WCAG 2.4.3: Deactivate focus trap
        if (this._focusTrap) {
            this._focusTrap.deactivate();
            this._focusTrap = null;
        }

        this.modal.classList.remove('show');
        this.isOpen = false;
        document.body.style.overflow = '';

        if (this.onClose) {
            this.onClose();
        }

        if (this.destroyOnClose) {
            setTimeout(() => {
                this.modal.remove();
                this.modal = null;
            }, 300); // Wait for animation
        }
    }

    // Show loading state
    showLoading(message = 'Loading...') {
        const body = this.modal?.querySelector('.sites-modal-body');
        if (body) {
            body.innerHTML = `
                <div class="sites-modal-loading">
                    <div class="spinner"></div>
                    <p>${message}</p>
                </div>
            `;
        }
    }

    // Show error state
    showError(message, details = null) {
        const body = this.modal?.querySelector('.sites-modal-body');
        if (body) {
            body.innerHTML = `
                <div class="sites-modal-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h4>Error</h4>
                    <p>${message}</p>
                    ${details ? `<details><summary>Technical Details</summary><pre>${details}</pre></details>` : ''}
                    <button type="button" class="btn btn-primary" onclick="this.closest('.sites-modal').modalInstance.close()">
                        Close
                    </button>
                </div>
            `;
        }
    }
}

// Enhanced form modal for CRUD operations
class FormModal extends BaseModal {
    constructor(config) {
        super(config);
        this.formData = config.formData || {};
        this.fields = config.fields || [];
        this.onSubmit = config.onSubmit || null;
        this.validation = config.validation || {};
        this.isSubmitting = false;
    }

    getBodyContent() {
        return `
            <form class="sites-modal-form" data-modal-form>
                ${this.generateFormFields()}
            </form>
        `;
    }

    getFooterContent() {
        return `
            <button type="button" class="btn btn-secondary" onclick="this.closest('.sites-modal').modalInstance.close()">
                Cancel
            </button>
            <button type="submit" class="btn btn-primary" data-submit-btn>
                ${this.getSubmitButtonText()}
            </button>
        `;
    }

    getSubmitButtonText() {
        return 'Save';
    }

    generateFormFields() {
        return this.fields.map(field => this.generateField(field)).join('');
    }

    generateField(field) {
        const value = this.formData[field.name] || field.defaultValue || '';
        const required = field.required ? 'required' : '';
        const disabled = field.disabled ? 'disabled' : '';

        switch (field.type) {
            case 'text':
            case 'email':
            case 'number':
                return `
                    <div class="form-group">
                        <label for="${field.name}">${field.label} ${field.required ? '*' : ''}</label>
                        <input type="${field.type}"
                               id="${field.name}"
                               name="${field.name}"
                               value="${value}"
                               placeholder="${field.placeholder || ''}"
                               ${required} ${disabled}>
                        ${field.hint ? `<small class="form-hint">${field.hint}</small>` : ''}
                        <div class="field-error" style="display: none;"></div>
                    </div>
                `;

            case 'textarea':
                return `
                    <div class="form-group">
                        <label for="${field.name}">${field.label} ${field.required ? '*' : ''}</label>
                        <textarea id="${field.name}"
                                  name="${field.name}"
                                  placeholder="${field.placeholder || ''}"
                                  rows="${field.rows || 3}"
                                  ${required} ${disabled}>${value}</textarea>
                        ${field.hint ? `<small class="form-hint">${field.hint}</small>` : ''}
                        <div class="field-error" style="display: none;"></div>
                    </div>
                `;

            case 'select':
                const options = field.options.map(opt =>
                    `<option value="${opt.value}" ${opt.value === value ? 'selected' : ''}>${opt.label}</option>`
                ).join('');
                return `
                    <div class="form-group">
                        <label for="${field.name}">${field.label} ${field.required ? '*' : ''}</label>
                        <select id="${field.name}" name="${field.name}" ${required} ${disabled}>
                            <option value="">Select ${field.label}</option>
                            ${options}
                        </select>
                        ${field.hint ? `<small class="form-hint">${field.hint}</small>` : ''}
                        <div class="field-error" style="display: none;"></div>
                    </div>
                `;

            case 'coordinate':
                return `
                    <div class="form-group coordinate-group">
                        <label>${field.label} ${field.required ? '*' : ''}</label>
                        <div class="coordinate-inputs">
                            <div class="coordinate-input">
                                <label for="${field.name}_lat">Latitude</label>
                                <input type="number"
                                       id="${field.name}_lat"
                                       name="${field.name}_lat"
                                       step="0.000001"
                                       placeholder="59.123456"
                                       value="${this.formData[field.name + '_lat'] || ''}"
                                       ${required} ${disabled}>
                            </div>
                            <div class="coordinate-input">
                                <label for="${field.name}_lng">Longitude</label>
                                <input type="number"
                                       id="${field.name}_lng"
                                       name="${field.name}_lng"
                                       step="0.000001"
                                       placeholder="18.123456"
                                       value="${this.formData[field.name + '_lng'] || ''}"
                                       ${required} ${disabled}>
                            </div>
                        </div>
                        <small class="form-hint">SWEREF 99 coordinate system</small>
                        <div class="field-error" style="display: none;"></div>
                    </div>
                `;

            default:
                return `<div class="form-group">Unsupported field type: ${field.type}</div>`;
        }
    }

    open() {
        const opened = super.open();
        if (opened) {
            this.setupFormHandlers();
        }
        return opened;
    }

    setupFormHandlers() {
        const form = this.modal.querySelector('[data-modal-form]');
        const submitBtn = this.modal.querySelector('[data-submit-btn]');

        if (form && submitBtn) {
            submitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleSubmit();
            });

            // Real-time validation
            form.addEventListener('input', (e) => {
                this.validateField(e.target);
            });
        }
    }

    validateField(field) {
        const fieldName = field.name;
        const fieldConfig = this.fields.find(f => f.name === fieldName || f.name === fieldName.replace(/_lat|_lng/, ''));
        const errorDiv = field.closest('.form-group').querySelector('.field-error');

        if (!fieldConfig) return true;

        let isValid = true;
        let errorMessage = '';

        // Required validation
        if (fieldConfig.required && !field.value.trim()) {
            isValid = false;
            errorMessage = `${fieldConfig.label} is required`;
        }

        // Custom validation
        if (isValid && fieldConfig.validation) {
            const validationResult = fieldConfig.validation(field.value);
            if (validationResult !== true) {
                isValid = false;
                errorMessage = validationResult;
            }
        }

        // Show/hide error
        if (isValid) {
            errorDiv.style.display = 'none';
            field.classList.remove('error');
        } else {
            errorDiv.textContent = errorMessage;
            errorDiv.style.display = 'block';
            field.classList.add('error');
        }

        return isValid;
    }

    async handleSubmit() {
        if (this.isSubmitting) return;

        const form = this.modal.querySelector('[data-modal-form]');
        const submitBtn = this.modal.querySelector('[data-submit-btn]');

        // Validate all fields
        const fields = form.querySelectorAll('input, select, textarea');
        let isFormValid = true;

        fields.forEach(field => {
            if (!this.validateField(field)) {
                isFormValid = false;
            }
        });

        if (!isFormValid) {
            showError('Please correct the errors before submitting');
            return;
        }

        // Collect form data
        const formData = new FormData(form);
        const data = {};

        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }

        // Handle coordinate fields
        this.fields.forEach(field => {
            if (field.type === 'coordinate') {
                const lat = data[field.name + '_lat'];
                const lng = data[field.name + '_lng'];
                if (lat && lng) {
                    data[field.name] = { latitude: parseFloat(lat), longitude: parseFloat(lng) };
                }
                delete data[field.name + '_lat'];
                delete data[field.name + '_lng'];
            }
        });

        this.isSubmitting = true;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-sm"></span> Saving...';

        try {
            if (this.onSubmit) {
                await this.onSubmit(data);
            }
            this.close();
        } catch (error) {
            console.error('Form submission error:', error);
            showError('Failed to save: ' + error.message);
        } finally {
            this.isSubmitting = false;
            submitBtn.disabled = false;
            submitBtn.innerHTML = this.getSubmitButtonText();
        }
    }
}

// Global modal manager
class ModalManager {
    constructor() {
        this.activeModals = new Map();
        this.modalStack = [];
        this.setupGlobalHandlers();
    }

    setupGlobalHandlers() {
        // Escape key handler
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modalStack.length > 0) {
                const topModal = this.modalStack[this.modalStack.length - 1];
                topModal.close();
            }
        });
    }

    register(modal) {
        this.activeModals.set(modal.id, modal);
    }

    unregister(modalId) {
        this.activeModals.delete(modalId);
        this.modalStack = this.modalStack.filter(m => m.id !== modalId);
    }

    open(modalId, config = {}) {
        let modal = this.activeModals.get(modalId);

        if (!modal) {
            // Create modal on demand
            modal = this.createModal(modalId, config);
            this.register(modal);
        }

        const opened = modal.open();
        if (opened) {
            this.modalStack.push(modal);
        }

        return modal;
    }

    close(modalId) {
        const modal = this.activeModals.get(modalId);
        if (modal) {
            modal.close();
            this.modalStack = this.modalStack.filter(m => m.id !== modalId);
        }
    }

    closeAll() {
        this.modalStack.forEach(modal => modal.close());
        this.modalStack = [];
    }

    createModal(modalId, config) {
        // Factory method for creating specific modal types
        switch (modalId) {
            case 'admin-create-station':
                return new AdminStationCreateModal(config);
            case 'admin-edit-station':
                return new AdminStationEditModal(config);
            case 'admin-delete-station':
                return new AdminStationDeleteModal(config);
            case 'admin-create-platform':
                return new AdminPlatformCreateModal(config);
            case 'admin-edit-platform':
                return new AdminPlatformEditModal(config);
            case 'admin-delete-platform':
                return new AdminPlatformDeleteModal(config);
            default:
                return new BaseModal({ id: modalId, title: 'Modal', ...config });
        }
    }
}

// Initialize global modal manager
window.modalManager = new ModalManager();

// Global convenience functions
window.openModal = (modalId, config) => window.modalManager.open(modalId, config);
window.closeModal = (modalId) => window.modalManager.close(modalId);
window.closeAllModals = () => window.modalManager.closeAll();