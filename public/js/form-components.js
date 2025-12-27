/**
 * Enhanced Form Components Library for SITES Spectral
 * Version: 5.2.35
 * Purpose: Reusable form components with better UX and validation feedback
 */

// XSS Prevention: Use centralized escapeHtml with inline fallback
const _escapeHtml = (text) => {
    if (window.SitesSecurity?.escapeHtml) return window.SitesSecurity.escapeHtml(text);
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
};

/**
 * Enhanced Multiselect Component with Visual Tag Display
 * Provides better UX for selecting multiple options from a list
 */
class EnhancedMultiselect {
  constructor(containerId, options, selectedValues = []) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`Container ${containerId} not found`);
      return;
    }

    this.options = options || [];
    this.selectedValues = Array.isArray(selectedValues) ? selectedValues : [];
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="enhanced-multiselect">
        <div class="multiselect-dropdown">
          <select multiple class="form-control" style="height: 150px;">
            ${this.options.map(opt => `
              <option value="${_escapeHtml(opt.value || opt)}" ${this.selectedValues.includes(opt.value || opt) ? 'selected' : ''}>
                ${_escapeHtml(opt.label || opt)}
              </option>
            `).join('')}
          </select>
        </div>
        <div class="multiselect-tags" style="margin-top: 0.5rem;"></div>
      </div>
    `;

    const select = this.container.querySelector('select');
    select.addEventListener('change', () => this.updateTags());
    this.updateTags();
  }

  updateTags() {
    const select = this.container.querySelector('select');
    const tagsContainer = this.container.querySelector('.multiselect-tags');
    const selected = Array.from(select.selectedOptions).map(opt => opt.value);

    tagsContainer.innerHTML = selected.map(value => {
      const option = this.options.find(o => (o.value || o) === value);
      const label = option ? (option.label || option) : value;

      return `
        <span class="multiselect-tag">
          ${_escapeHtml(label)}
          <button type="button" class="tag-remove" data-value="${_escapeHtml(value)}" style="margin-left: 0.5rem; background: none; border: none; color: white; cursor: pointer;">
            ×
          </button>
        </span>
      `;
    }).join('');

    // Add remove handlers
    tagsContainer.querySelectorAll('.tag-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const value = e.target.getAttribute('data-value');
        const option = select.querySelector(`option[value="${value}"]`);
        if (option) option.selected = false;
        this.updateTags();
      });
    });
  }

  getValues() {
    const select = this.container.querySelector('select');
    return Array.from(select.selectedOptions).map(opt => opt.value);
  }

  setValues(values) {
    this.selectedValues = values;
    this.render();
  }
}

/**
 * Form Field Validation Helper
 * Provides visual feedback for form validation
 */
class FormValidator {
  static markValid(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;

    field.classList.remove('is-invalid');
    field.classList.add('is-valid');

    const feedback = field.parentElement.querySelector('.invalid-feedback');
    if (feedback) feedback.remove();
  }

  static markInvalid(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;

    field.classList.remove('is-valid');
    field.classList.add('is-invalid');

    let feedback = field.parentElement.querySelector('.invalid-feedback');
    if (!feedback) {
      feedback = document.createElement('div');
      feedback.className = 'invalid-feedback';
      field.parentElement.appendChild(feedback);
    }
    feedback.textContent = message;
    feedback.style.display = 'block';
  }

  static clearValidation(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;

    field.classList.remove('is-valid', 'is-invalid');
    const feedback = field.parentElement.querySelector('.invalid-feedback');
    if (feedback) feedback.remove();
  }

  static validateRequired(fieldId, fieldName) {
    const field = document.getElementById(fieldId);
    if (!field) return false;

    const value = field.value.trim();
    if (!value) {
      this.markInvalid(fieldId, `${fieldName} is required`);
      return false;
    }

    this.markValid(fieldId);
    return true;
  }

  static validateCoordinate(fieldId, fieldName) {
    const field = document.getElementById(fieldId);
    if (!field) return true;

    const value = field.value.trim();
    if (!value) return true; // Optional field

    const num = parseFloat(value);
    if (isNaN(num)) {
      this.markInvalid(fieldId, `${fieldName} must be a valid number`);
      return false;
    }

    // Note: Coordinates with >6 decimals will be rounded server-side
    this.markValid(fieldId);
    return true;
  }
}

/**
 * Loading Overlay Helper
 * Shows/hides loading state on modals
 */
class LoadingOverlay {
  static show(modalId, message = 'Saving...') {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    let overlay = modal.querySelector('.modal-loading');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'modal-loading';
      overlay.innerHTML = `
        <div style="text-align: center;">
          <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #059669;"></i>
          <p style="margin-top: 1rem; color: #6b7280; font-weight: 500;">${_escapeHtml(message)}</p>
        </div>
      `;
      modal.querySelector('.modal-content').appendChild(overlay);
    }
    overlay.style.display = 'flex';
  }

  static hide(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    const overlay = modal.querySelector('.modal-loading');
    if (overlay) overlay.style.display = 'none';
  }
}

/**
 * Enhanced Notification System
 * Improved notifications with field-level details
 */
class EnhancedNotification {
  static show(message, type = 'success', duration = 5000) {
    // Use existing showNotification if available
    if (typeof showNotification === 'function') {
      showNotification(message, type);
      return;
    }

    // Fallback implementation
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${_escapeHtml(message)}</span>
      </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, duration);
  }

  static showFieldsSaved(fieldCount, entityType = 'data') {
    this.show(
      `✅ ${entityType} updated successfully! ${fieldCount} field${fieldCount !== 1 ? 's' : ''} saved.`,
      'success',
      4000
    );
  }

  static showFieldError(fieldName, error) {
    this.show(
      `❌ Error saving ${fieldName}: ${error}`,
      'error',
      6000
    );
  }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.EnhancedMultiselect = EnhancedMultiselect;
  window.FormValidator = FormValidator;
  window.LoadingOverlay = LoadingOverlay;
  window.EnhancedNotification = EnhancedNotification;
}
