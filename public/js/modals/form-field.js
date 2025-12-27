/**
 * Form Field Generator
 * SITES Spectral v8.0.0-alpha.2
 *
 * Creates consistent, accessible form fields with:
 * - Proper labels and ARIA attributes
 * - Validation feedback areas
 * - Help text
 * - Real-time validation
 * - Consistent styling
 */

class FormField {
    /**
     * Create a text input field
     * @param {Object} config - Field configuration
     * @returns {string} HTML string
     */
    static text(config) {
        const {
            id,
            label,
            value = '',
            placeholder = '',
            required = false,
            readonly = false,
            maxlength = null,
            pattern = null,
            helpText = '',
            validation = null,
            attributes = {}
        } = config;

        return FormField._buildField({
            id,
            label,
            required,
            readonly,
            helpText,
            fieldHTML: `
                <input
                    type="text"
                    id="${id}"
                    name="${id}"
                    class="form-control ${readonly ? 'field-readonly' : ''}"
                    value="${FormField._escapeHtml(value)}"
                    ${placeholder ? `placeholder="${FormField._escapeHtml(placeholder)}"` : ''}
                    ${required ? 'required' : ''}
                    ${readonly ? 'readonly tabindex="-1"' : ''}
                    ${maxlength ? `maxlength="${maxlength}"` : ''}
                    ${pattern ? `pattern="${pattern}"` : ''}
                    ${FormField._buildAttributes(attributes)}
                    aria-label="${FormField._escapeHtml(label)}"
                    ${helpText ? `aria-describedby="${id}-help"` : ''}
                    ${validation ? `oninput="FormFieldValidation.validate('${id}', ${JSON.stringify(validation).replace(/"/g, '&quot;')})"` : ''}
                >
            `
        });
    }

    /**
     * Create a number input field
     * @param {Object} config - Field configuration
     * @returns {string} HTML string
     */
    static number(config) {
        const {
            id,
            label,
            value = '',
            placeholder = '',
            required = false,
            readonly = false,
            min = null,
            max = null,
            step = null,
            helpText = '',
            validation = null,
            attributes = {}
        } = config;

        return FormField._buildField({
            id,
            label,
            required,
            readonly,
            helpText,
            fieldHTML: `
                <input
                    type="number"
                    id="${id}"
                    name="${id}"
                    class="form-control ${readonly ? 'field-readonly' : ''}"
                    value="${value}"
                    ${placeholder ? `placeholder="${FormField._escapeHtml(placeholder)}"` : ''}
                    ${required ? 'required' : ''}
                    ${readonly ? 'readonly tabindex="-1"' : ''}
                    ${min !== null ? `min="${min}"` : ''}
                    ${max !== null ? `max="${max}"` : ''}
                    ${step !== null ? `step="${step}"` : ''}
                    ${FormField._buildAttributes(attributes)}
                    aria-label="${FormField._escapeHtml(label)}"
                    ${helpText ? `aria-describedby="${id}-help"` : ''}
                    ${validation ? `oninput="FormFieldValidation.validate('${id}', ${JSON.stringify(validation).replace(/"/g, '&quot;')})"` : ''}
                >
            `
        });
    }

    /**
     * Create a select dropdown field
     * @param {Object} config - Field configuration
     * @returns {string} HTML string
     */
    static select(config) {
        const {
            id,
            label,
            value = '',
            options = [],
            required = false,
            readonly = false,
            helpText = '',
            onChange = null,
            attributes = {}
        } = config;

        const optionsHTML = FormField._buildOptions(options, value);

        return FormField._buildField({
            id,
            label,
            required,
            readonly,
            helpText,
            fieldHTML: `
                <select
                    id="${id}"
                    name="${id}"
                    class="form-control ${readonly ? 'field-readonly' : ''}"
                    ${required ? 'required' : ''}
                    ${readonly ? 'disabled' : ''}
                    ${onChange ? `onchange="${onChange}"` : ''}
                    ${FormField._buildAttributes(attributes)}
                    aria-label="${FormField._escapeHtml(label)}"
                    ${helpText ? `aria-describedby="${id}-help"` : ''}
                >
                    ${optionsHTML}
                </select>
            `
        });
    }

    /**
     * Create a date input field
     * @param {Object} config - Field configuration
     * @returns {string} HTML string
     */
    static date(config) {
        const {
            id,
            label,
            value = '',
            required = false,
            readonly = false,
            min = null,
            max = null,
            helpText = '',
            onChange = null,
            attributes = {}
        } = config;

        return FormField._buildField({
            id,
            label,
            required,
            readonly,
            helpText,
            fieldHTML: `
                <input
                    type="date"
                    id="${id}"
                    name="${id}"
                    class="form-control ${readonly ? 'field-readonly' : ''}"
                    value="${value}"
                    ${required ? 'required' : ''}
                    ${readonly ? 'readonly tabindex="-1"' : ''}
                    ${min ? `min="${min}"` : ''}
                    ${max ? `max="${max}"` : ''}
                    ${onChange ? `onchange="${onChange}"` : ''}
                    ${FormField._buildAttributes(attributes)}
                    aria-label="${FormField._escapeHtml(label)}"
                    ${helpText ? `aria-describedby="${id}-help"` : ''}
                >
            `
        });
    }

    /**
     * Create a textarea field
     * @param {Object} config - Field configuration
     * @returns {string} HTML string
     */
    static textarea(config) {
        const {
            id,
            label,
            value = '',
            placeholder = '',
            required = false,
            readonly = false,
            rows = 3,
            maxlength = 1000,
            showCharCount = true,
            helpText = '',
            attributes = {}
        } = config;

        const charCountHTML = showCharCount ? `
            <div id="${id}-char-count" class="char-counter" aria-live="polite">
                ${(value || '').length}/${maxlength}
            </div>
        ` : '';

        return FormField._buildField({
            id,
            label,
            required,
            readonly,
            helpText,
            fieldHTML: `
                <textarea
                    id="${id}"
                    name="${id}"
                    class="form-control ${readonly ? 'field-readonly' : ''}"
                    rows="${rows}"
                    ${placeholder ? `placeholder="${FormField._escapeHtml(placeholder)}"` : ''}
                    ${required ? 'required' : ''}
                    ${readonly ? 'readonly tabindex="-1"' : ''}
                    ${maxlength ? `maxlength="${maxlength}"` : ''}
                    ${showCharCount ? `oninput="updateCharCount(this, '${id}-char-count')"` : ''}
                    ${FormField._buildAttributes(attributes)}
                    aria-label="${FormField._escapeHtml(label)}"
                    ${helpText ? `aria-describedby="${id}-help ${showCharCount ? id + '-char-count' : ''}"` : ''}
                >${FormField._escapeHtml(value)}</textarea>
                ${charCountHTML}
            `
        });
    }

    /**
     * Create coordinate input fields (lat/lon pair)
     * @param {Object} config - Field configuration
     * @returns {string} HTML string
     */
    static coordinates(config) {
        const {
            idPrefix,
            latValue = '',
            lonValue = '',
            required = false,
            readonly = false,
            helpText = 'Decimal degrees (WGS84), rounded to 6 decimal places',
            showMap = true
        } = config;

        const latField = FormField.number({
            id: `${idPrefix}-latitude`,
            label: 'Latitude',
            value: latValue,
            min: -90,
            max: 90,
            step: 'any',
            placeholder: 'Decimal degrees',
            required,
            readonly,
            helpText: '',
            validation: { type: 'latitude' },
            attributes: showMap ? { 'data-coord-type': 'lat' } : {}
        });

        const lonField = FormField.number({
            id: `${idPrefix}-longitude`,
            label: 'Longitude',
            value: lonValue,
            min: -180,
            max: 180,
            step: 'any',
            placeholder: 'Decimal degrees',
            required,
            readonly,
            helpText: '',
            validation: { type: 'longitude' },
            attributes: showMap ? { 'data-coord-type': 'lon' } : {}
        });

        const mapPreview = showMap ? `
            <div id="${idPrefix}-map-preview" class="coordinate-map-preview" style="display: none;">
                <div id="${idPrefix}-map" class="coordinate-map"></div>
            </div>
        ` : '';

        return `
            <div class="form-group-row">
                ${latField}
                ${lonField}
            </div>
            ${helpText ? `<small class="form-text">${FormField._escapeHtml(helpText)}</small>` : ''}
            ${mapPreview}
        `;
    }

    /**
     * Create a toggle switch field
     * @param {Object} config - Field configuration
     * @returns {string} HTML string
     */
    static toggle(config) {
        const {
            id,
            label,
            checked = false,
            readonly = false,
            helpText = '',
            onChange = null,
            attributes = {}
        } = config;

        return `
            <div class="form-group">
                <label id="${id}-label">${FormField._escapeHtml(label)}</label>
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <label class="toggle-switch">
                        <input
                            type="checkbox"
                            id="${id}"
                            name="${id}"
                            ${checked ? 'checked' : ''}
                            ${readonly ? 'disabled' : ''}
                            ${onChange ? `onchange="${onChange}"` : ''}
                            ${FormField._buildAttributes(attributes)}
                            aria-labelledby="${id}-label"
                        >
                        <span class="toggle-slider"></span>
                    </label>
                    <span id="${id}-status">${checked ? 'Enabled' : 'Disabled'}</span>
                </div>
                ${helpText ? `<small class="form-text" id="${id}-help">${FormField._escapeHtml(helpText)}</small>` : ''}
            </div>
        `;
    }

    /**
     * Create a range slider field
     * @param {Object} config - Field configuration
     * @returns {string} HTML string
     */
    static range(config) {
        const {
            id,
            label,
            value = 50,
            min = 0,
            max = 100,
            step = 1,
            helpText = '',
            showValue = true,
            valueFormatter = null,
            onChange = null,
            attributes = {}
        } = config;

        const displayValue = valueFormatter ? valueFormatter(value) : value;

        return FormField._buildField({
            id,
            label,
            required: false,
            readonly: false,
            helpText,
            fieldHTML: `
                <div class="range-slider-container">
                    <input
                        type="range"
                        id="${id}"
                        name="${id}"
                        class="range-slider"
                        value="${value}"
                        min="${min}"
                        max="${max}"
                        step="${step}"
                        ${onChange ? `oninput="${onChange}"` : ''}
                        ${FormField._buildAttributes(attributes)}
                        aria-label="${FormField._escapeHtml(label)}"
                        aria-valuemin="${min}"
                        aria-valuemax="${max}"
                        aria-valuenow="${value}"
                    >
                    ${showValue ? `
                        <div class="range-value-display">
                            <span id="${id}-value">${displayValue}</span>
                        </div>
                    ` : ''}
                </div>
            `
        });
    }

    /**
     * Build complete field HTML with wrapper
     * @private
     */
    static _buildField({ id, label, required, readonly, helpText, fieldHTML }) {
        return `
            <div class="form-group ${readonly ? 'form-group-readonly' : ''}">
                <label for="${id}">
                    ${FormField._escapeHtml(label)}
                    ${required ? '<span class="required-indicator" aria-label="required">*</span>' : ''}
                </label>
                ${fieldHTML}
                ${helpText ? `<small class="form-text" id="${id}-help">${FormField._escapeHtml(helpText)}</small>` : ''}
                <div id="${id}-validation-feedback" class="validation-feedback" aria-live="polite"></div>
            </div>
        `;
    }

    /**
     * Build select options HTML
     * @private
     */
    static _buildOptions(options, selectedValue) {
        return options.map(opt => {
            // Handle option groups
            if (opt.group) {
                const groupOptions = opt.options.map(o =>
                    `<option value="${FormField._escapeHtml(o.value)}" ${o.value === selectedValue ? 'selected' : ''}>
                        ${FormField._escapeHtml(o.label)}
                    </option>`
                ).join('');
                return `<optgroup label="${FormField._escapeHtml(opt.group)}">${groupOptions}</optgroup>`;
            }
            // Regular option
            return `<option value="${FormField._escapeHtml(opt.value)}" ${opt.value === selectedValue ? 'selected' : ''}>
                ${FormField._escapeHtml(opt.label)}
            </option>`;
        }).join('');
    }

    /**
     * Build custom HTML attributes
     * @private
     */
    static _buildAttributes(attributes) {
        return Object.keys(attributes || {})
            .map(key => `${key}="${FormField._escapeHtml(String(attributes[key]))}"`)
            .join(' ');
    }

    /**
     * Escape HTML to prevent XSS
     * @private
     * @see core/security.js - Delegates to central implementation
     */
    static _escapeHtml(str) {
        return window.SitesSecurity?.escapeHtml?.(str) ?? (str != null ? String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'})[m]) : '');
    }
}

/**
 * Form Field Validation Helper
 */
class FormFieldValidation {
    static validate(fieldId, rules) {
        const field = document.getElementById(fieldId);
        const feedback = document.getElementById(`${fieldId}-validation-feedback`);

        if (!field || !feedback) return true;

        const value = field.value;
        let isValid = true;
        let message = '';

        // Required validation
        if (rules.required && !value) {
            isValid = false;
            message = 'This field is required';
        }

        // Type-specific validation
        if (value && rules.type) {
            switch (rules.type) {
                case 'latitude':
                    const lat = parseFloat(value);
                    if (isNaN(lat) || lat < -90 || lat > 90) {
                        isValid = false;
                        message = 'Latitude must be between -90 and 90';
                    }
                    break;
                case 'longitude':
                    const lon = parseFloat(value);
                    if (isNaN(lon) || lon < -180 || lon > 180) {
                        isValid = false;
                        message = 'Longitude must be between -180 and 180';
                    }
                    break;
                case 'email':
                    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                        isValid = false;
                        message = 'Invalid email format';
                    }
                    break;
                case 'url':
                    try {
                        new URL(value);
                    } catch {
                        isValid = false;
                        message = 'Invalid URL format';
                    }
                    break;
            }
        }

        // Custom validation function
        if (value && rules.custom && typeof rules.custom === 'function') {
            const customResult = rules.custom(value);
            if (customResult !== true) {
                isValid = false;
                message = customResult || 'Invalid value';
            }
        }

        // Update UI
        if (isValid) {
            field.classList.remove('is-invalid');
            field.classList.add('is-valid');
            feedback.textContent = '';
            feedback.className = 'validation-feedback';
        } else {
            field.classList.remove('is-valid');
            field.classList.add('is-invalid');
            feedback.textContent = message;
            feedback.className = 'validation-feedback validation-error';
        }

        return isValid;
    }
}

// Export for module systems and make globally available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FormField, FormFieldValidation };
}
if (typeof window !== 'undefined') {
    window.FormField = FormField;
    window.FormFieldValidation = FormFieldValidation;
}
