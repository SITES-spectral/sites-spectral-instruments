// SITES Spectral - Utility Functions
// Common utility functions used across the application

class Utils {
    /**
     * Format date to readable string
     * @param {Date|string} date - Date to format
     * @param {Object} options - Intl.DateTimeFormat options
     * @returns {string} Formatted date string
     */
    static formatDate(date, options = {}) {
        if (!date) return '-';
        
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };
        
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return dateObj.toLocaleDateString('en-US', { ...defaultOptions, ...options });
    }

    /**
     * Format date and time to readable string
     * @param {Date|string} date - Date to format
     * @returns {string} Formatted datetime string
     */
    static formatDateTime(date) {
        if (!date) return '-';
        
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Debounce function calls
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    static debounce(func, wait) {
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

    /**
     * Throttle function calls
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     * @returns {Function} Throttled function
     */
    static throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Show toast notification
     * @param {string} message - Message to display
     * @param {string} type - Type of toast (success, error, warning, info)
     * @param {number} duration - Duration in milliseconds
     */
    static showToast(message, type = 'info', duration = 5000) {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = this.getToastIcon(type);
        toast.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        toastContainer.appendChild(toast);

        // Auto remove after duration
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, duration);
    }

    /**
     * Get appropriate icon for toast type
     * @param {string} type - Toast type
     * @returns {string} Font Awesome icon class
     */
    static getToastIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    /**
     * Sanitize HTML string to prevent XSS
     * @param {string} str - String to sanitize
     * @returns {string} Sanitized string
     */
    static sanitizeHtml(str) {
        if (!str) return '';
        
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Generate a UUID v4
     * @returns {string} UUID string
     */
    static generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * Format coordinate to readable string
     * @param {number} coord - Coordinate value
     * @param {string} type - Type ('lat' or 'lon')
     * @returns {string} Formatted coordinate
     */
    static formatCoordinate(coord, type) {
        if (coord === null || coord === undefined) return '-';
        
        const direction = type === 'lat' 
            ? (coord >= 0 ? 'N' : 'S')
            : (coord >= 0 ? 'E' : 'W');
            
        return `${Math.abs(coord).toFixed(6)}° ${direction}`;
    }

    /**
     * Get status badge HTML
     * @param {string} status - Status value
     * @returns {string} HTML for status badge
     */
    static getStatusBadge(status) {
        const statusClasses = {
            'Active': 'badge-success',
            'Inactive': 'badge-secondary',
            'Maintenance': 'badge-warning',
            'Removed': 'badge-danger',
            'Planned': 'badge-info',
            'Unknown': 'badge-secondary'
        };
        
        const className = statusClasses[status] || 'badge-secondary';
        return `<span class="badge ${className}">${status}</span>`;
    }

    /**
     * Validate form data
     * @param {Object} data - Form data to validate
     * @param {Object} rules - Validation rules
     * @returns {Object} Validation result with errors array
     */
    static validateForm(data, rules) {
        const errors = [];
        
        for (const field in rules) {
            const value = data[field];
            const rule = rules[field];
            
            // Required field validation
            if (rule.required && (!value || value.trim() === '')) {
                errors.push(`${rule.label || field} is required`);
                continue;
            }
            
            // Skip other validations if field is empty and not required
            if (!value || value.trim() === '') continue;
            
            // Type validation
            if (rule.type === 'email' && !this.isValidEmail(value)) {
                errors.push(`${rule.label || field} must be a valid email`);
            }
            
            if (rule.type === 'number' && isNaN(value)) {
                errors.push(`${rule.label || field} must be a number`);
            }
            
            if (rule.type === 'url' && !this.isValidUrl(value)) {
                errors.push(`${rule.label || field} must be a valid URL`);
            }
            
            // Length validation
            if (rule.minLength && value.length < rule.minLength) {
                errors.push(`${rule.label || field} must be at least ${rule.minLength} characters`);
            }
            
            if (rule.maxLength && value.length > rule.maxLength) {
                errors.push(`${rule.label || field} must not exceed ${rule.maxLength} characters`);
            }
            
            // Range validation for numbers
            if (rule.min !== undefined && parseFloat(value) < rule.min) {
                errors.push(`${rule.label || field} must be at least ${rule.min}`);
            }
            
            if (rule.max !== undefined && parseFloat(value) > rule.max) {
                errors.push(`${rule.label || field} must not exceed ${rule.max}`);
            }
            
            // Custom validation function
            if (rule.validate && typeof rule.validate === 'function') {
                const customResult = rule.validate(value);
                if (customResult !== true) {
                    errors.push(customResult || `${rule.label || field} is invalid`);
                }
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Check if email is valid
     * @param {string} email - Email to validate
     * @returns {boolean} True if valid
     */
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Check if URL is valid
     * @param {string} url - URL to validate
     * @returns {boolean} True if valid
     */
    static isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Convert object to query string
     * @param {Object} params - Parameters object
     * @returns {string} Query string
     */
    static objectToQueryString(params) {
        const queryString = Object.keys(params)
            .filter(key => params[key] !== null && params[key] !== undefined && params[key] !== '')
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
            .join('&');
        return queryString ? `?${queryString}` : '';
    }

    /**
     * Parse query string to object
     * @param {string} queryString - Query string to parse
     * @returns {Object} Parsed parameters
     */
    static parseQueryString(queryString) {
        const params = {};
        const urlParams = new URLSearchParams(queryString);
        
        for (const [key, value] of urlParams.entries()) {
            params[key] = value;
        }
        
        return params;
    }

    /**
     * Deep clone an object
     * @param {*} obj - Object to clone
     * @returns {*} Cloned object
     */
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        
        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }
        
        if (obj instanceof Array) {
            return obj.map(item => this.deepClone(item));
        }
        
        if (typeof obj === 'object') {
            const cloned = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    cloned[key] = this.deepClone(obj[key]);
                }
            }
            return cloned;
        }
        
        return obj;
    }

    /**
     * Capitalize first letter of string
     * @param {string} str - String to capitalize
     * @returns {string} Capitalized string
     */
    static capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Format file size in human readable format
     * @param {number} bytes - Size in bytes
     * @returns {string} Formatted size string
     */
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Get current timestamp in ISO format
     * @returns {string} ISO timestamp
     */
    static getCurrentTimestamp() {
        return new Date().toISOString();
    }

    /**
     * Check if device is mobile
     * @returns {boolean} True if mobile device
     */
    static isMobile() {
        return window.innerWidth <= 768;
    }

    /**
     * Scroll to element smoothly
     * @param {string|HTMLElement} element - Element selector or element
     * @param {number} offset - Offset from top in pixels
     */
    static scrollToElement(element, offset = 0) {
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        if (!el) return;
        
        const elementPosition = el.offsetTop - offset;
        window.scrollTo({
            top: elementPosition,
            behavior: 'smooth'
        });
    }
}

// Export for use in other modules
window.Utils = Utils;