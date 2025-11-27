/**
 * Field Validators
 *
 * Reusable validation functions for form fields.
 * Returns user-friendly error messages.
 *
 * @module utils/validators
 * @version 8.0.0
 */

(function(global) {
    'use strict';

    /**
     * Validation result
     * @typedef {Object} ValidationResult
     * @property {boolean} valid - Whether validation passed
     * @property {string} [error] - Error message if validation failed
     */

    /**
     * Validators object
     */
    const Validators = {
        /**
         * Check if field is required
         * @param {*} value - Field value
         * @param {string} [fieldName] - Field name for error message
         * @returns {ValidationResult}
         */
        required(value, fieldName = 'This field') {
            const isEmpty = value === null ||
                           value === undefined ||
                           (typeof value === 'string' && value.trim() === '') ||
                           (Array.isArray(value) && value.length === 0);

            return {
                valid: !isEmpty,
                error: isEmpty ? `${fieldName} is required.` : undefined
            };
        },

        /**
         * Validate number
         * @param {*} value - Field value
         * @param {Object} options - Validation options
         * @param {number} [options.min] - Minimum value
         * @param {number} [options.max] - Maximum value
         * @param {boolean} [options.integer] - Must be integer
         * @param {string} [options.fieldName] - Field name for error message
         * @returns {ValidationResult}
         */
        number(value, options = {}) {
            const { min, max, integer, fieldName = 'This field' } = options;

            if (value === null || value === undefined || value === '') {
                return { valid: true }; // Allow empty (use required validator if needed)
            }

            const num = Number(value);

            if (isNaN(num)) {
                return {
                    valid: false,
                    error: `${fieldName} must be a valid number.`
                };
            }

            if (integer && !Number.isInteger(num)) {
                return {
                    valid: false,
                    error: `${fieldName} must be a whole number.`
                };
            }

            if (min !== undefined && num < min) {
                return {
                    valid: false,
                    error: `${fieldName} must be at least ${min}.`
                };
            }

            if (max !== undefined && num > max) {
                return {
                    valid: false,
                    error: `${fieldName} must be at most ${max}.`
                };
            }

            return { valid: true };
        },

        /**
         * Validate number range
         * @param {*} value - Field value
         * @param {number} min - Minimum value
         * @param {number} max - Maximum value
         * @param {string} [fieldName] - Field name for error message
         * @returns {ValidationResult}
         */
        range(value, min, max, fieldName = 'This field') {
            return this.number(value, { min, max, fieldName });
        },

        /**
         * Validate latitude
         * @param {*} value - Latitude value
         * @returns {ValidationResult}
         */
        latitude(value) {
            if (value === null || value === undefined || value === '') {
                return { valid: true };
            }

            const lat = Number(value);

            if (isNaN(lat)) {
                return {
                    valid: false,
                    error: 'Latitude must be a valid number.'
                };
            }

            if (lat < -90 || lat > 90) {
                return {
                    valid: false,
                    error: 'Latitude must be between -90 and 90.'
                };
            }

            return { valid: true };
        },

        /**
         * Validate longitude
         * @param {*} value - Longitude value
         * @returns {ValidationResult}
         */
        longitude(value) {
            if (value === null || value === undefined || value === '') {
                return { valid: true };
            }

            const lon = Number(value);

            if (isNaN(lon)) {
                return {
                    valid: false,
                    error: 'Longitude must be a valid number.'
                };
            }

            if (lon < -180 || lon > 180) {
                return {
                    valid: false,
                    error: 'Longitude must be between -180 and 180.'
                };
            }

            return { valid: true };
        },

        /**
         * Validate email
         * @param {string} value - Email value
         * @returns {ValidationResult}
         */
        email(value) {
            if (!value || value.trim() === '') {
                return { valid: true };
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailRegex.test(value)) {
                return {
                    valid: false,
                    error: 'Please enter a valid email address.'
                };
            }

            return { valid: true };
        },

        /**
         * Validate URL
         * @param {string} value - URL value
         * @returns {ValidationResult}
         */
        url(value) {
            if (!value || value.trim() === '') {
                return { valid: true };
            }

            try {
                new URL(value);
                return { valid: true };
            } catch (error) {
                return {
                    valid: false,
                    error: 'Please enter a valid URL.'
                };
            }
        },

        /**
         * Validate date
         * @param {*} value - Date value
         * @param {Object} options - Validation options
         * @param {Date|string} [options.min] - Minimum date
         * @param {Date|string} [options.max] - Maximum date
         * @returns {ValidationResult}
         */
        date(value, options = {}) {
            if (!value || value === '') {
                return { valid: true };
            }

            const date = new Date(value);

            if (isNaN(date.getTime())) {
                return {
                    valid: false,
                    error: 'Please enter a valid date.'
                };
            }

            if (options.min) {
                const minDate = new Date(options.min);
                if (date < minDate) {
                    return {
                        valid: false,
                        error: `Date must be after ${minDate.toLocaleDateString()}.`
                    };
                }
            }

            if (options.max) {
                const maxDate = new Date(options.max);
                if (date > maxDate) {
                    return {
                        valid: false,
                        error: `Date must be before ${maxDate.toLocaleDateString()}.`
                    };
                }
            }

            return { valid: true };
        },

        /**
         * Validate pattern
         * @param {string} value - Field value
         * @param {RegExp|string} pattern - Regex pattern
         * @param {string} [message] - Error message
         * @returns {ValidationResult}
         */
        pattern(value, pattern, message = 'Invalid format.') {
            if (!value || value.trim() === '') {
                return { valid: true };
            }

            const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

            if (!regex.test(value)) {
                return {
                    valid: false,
                    error: message
                };
            }

            return { valid: true };
        },

        /**
         * Validate minimum length
         * @param {string} value - Field value
         * @param {number} minLength - Minimum length
         * @param {string} [fieldName] - Field name for error message
         * @returns {ValidationResult}
         */
        minLength(value, minLength, fieldName = 'This field') {
            if (!value || value === '') {
                return { valid: true };
            }

            if (value.length < minLength) {
                return {
                    valid: false,
                    error: `${fieldName} must be at least ${minLength} characters.`
                };
            }

            return { valid: true };
        },

        /**
         * Validate maximum length
         * @param {string} value - Field value
         * @param {number} maxLength - Maximum length
         * @param {string} [fieldName] - Field name for error message
         * @returns {ValidationResult}
         */
        maxLength(value, maxLength, fieldName = 'This field') {
            if (!value || value === '') {
                return { valid: true };
            }

            if (value.length > maxLength) {
                return {
                    valid: false,
                    error: `${fieldName} must be at most ${maxLength} characters.`
                };
            }

            return { valid: true };
        },

        /**
         * Validate wavelength (nanometers)
         * @param {*} value - Wavelength value
         * @returns {ValidationResult}
         */
        wavelength(value) {
            if (value === null || value === undefined || value === '') {
                return { valid: true };
            }

            const wl = Number(value);

            if (isNaN(wl)) {
                return {
                    valid: false,
                    error: 'Wavelength must be a valid number.'
                };
            }

            if (wl < 280 || wl > 2500) {
                return {
                    valid: false,
                    error: 'Wavelength must be between 280 and 2500 nm.'
                };
            }

            return { valid: true };
        },

        /**
         * Validate resolution (e.g., "1920x1080")
         * @param {string} value - Resolution value
         * @returns {ValidationResult}
         */
        resolution(value) {
            if (!value || value.trim() === '') {
                return { valid: true };
            }

            const resolutionRegex = /^\d+x\d+$/i;

            if (!resolutionRegex.test(value)) {
                return {
                    valid: false,
                    error: 'Resolution must be in format WIDTHxHEIGHT (e.g., 1920x1080).'
                };
            }

            return { valid: true };
        },

        /**
         * Validate ROI name (ROI_XX format)
         * @param {string} value - ROI name
         * @returns {ValidationResult}
         */
        roiName(value) {
            if (!value || value.trim() === '') {
                return { valid: true };
            }

            const roiRegex = /^ROI_\d{2}$/;

            if (!roiRegex.test(value)) {
                return {
                    valid: false,
                    error: 'ROI name must be in format ROI_XX (e.g., ROI_01).'
                };
            }

            return { valid: true };
        },

        /**
         * Validate instrument normalized ID
         * @param {string} value - Normalized ID
         * @returns {ValidationResult}
         */
        instrumentId(value) {
            if (!value || value.trim() === '') {
                return { valid: true };
            }

            // Format: STATION_ECOSYSTEM_PLXX_TYPEXX
            const idRegex = /^[A-Z]{3}_[A-Z]{3}_PL\d{2}_[A-Z]{2,4}\d{2}$/;

            if (!idRegex.test(value)) {
                return {
                    valid: false,
                    error: 'Invalid instrument ID format (e.g., SVB_FOR_PL01_PHE01).'
                };
            }

            return { valid: true };
        },

        /**
         * Validate platform normalized name
         * @param {string} value - Normalized name
         * @returns {ValidationResult}
         */
        platformId(value) {
            if (!value || value.trim() === '') {
                return { valid: true };
            }

            // Format: STATION_ECOSYSTEM_PLXX
            const idRegex = /^[A-Z]{3}_[A-Z]{3}_PL\d{2}$/;

            if (!idRegex.test(value)) {
                return {
                    valid: false,
                    error: 'Invalid platform ID format (e.g., SVB_FOR_PL01).'
                };
            }

            return { valid: true };
        },

        /**
         * Combine multiple validators
         * @param {*} value - Field value
         * @param {Function[]} validators - Array of validator functions
         * @returns {ValidationResult}
         */
        combine(value, validators) {
            for (const validator of validators) {
                const result = validator(value);
                if (!result.valid) {
                    return result;
                }
            }

            return { valid: true };
        },

        /**
         * Validate all fields in a form
         * @param {Object} fields - Field definitions { fieldName: { value, validators: [] } }
         * @returns {Object} Validation results { valid: boolean, errors: {} }
         */
        validateForm(fields) {
            const errors = {};
            let isValid = true;

            for (const [fieldName, fieldConfig] of Object.entries(fields)) {
                const { value, validators } = fieldConfig;

                for (const validator of validators) {
                    const result = validator(value);
                    if (!result.valid) {
                        errors[fieldName] = result.error;
                        isValid = false;
                        break; // Stop at first error for this field
                    }
                }
            }

            return { valid: isValid, errors };
        }
    };

    // Export for ES6 modules
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Validators;
    }

    // Export for browser global
    global.Validators = Validators;

})(typeof window !== 'undefined' ? window : global);
