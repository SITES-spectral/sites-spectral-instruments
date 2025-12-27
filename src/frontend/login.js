/**
 * SITES Spectral - Login Entry Point (ES6 Module)
 *
 * Entry point for the login page.
 * Minimal bundle with only authentication functionality.
 *
 * @module login
 * @version 13.15.0
 */

import { escapeHtml, sanitizeUrl } from '@core/security.js';
import { APP_VERSION } from '@core/config.js';
import { Toast, showToast, error as toastError } from '@components/toast.js';
import { setAuthToken, clearAuthToken } from '@api/client.js';

/**
 * Login form handler
 */
class LoginHandler {
    constructor() {
        this.form = null;
        this.submitButton = null;
        this.errorContainer = null;
        this.isSubmitting = false;
    }

    /**
     * Initialize login handler
     */
    init() {
        this.form = document.getElementById('login-form');
        this.submitButton = document.getElementById('login-submit');
        this.errorContainer = document.getElementById('login-error');

        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // Check for existing token
        this.checkExistingAuth();
    }

    /**
     * Check if user is already authenticated
     */
    checkExistingAuth() {
        const token = localStorage.getItem('sites_auth_token');
        if (token) {
            // Redirect to dashboard
            window.location.href = '/sites-dashboard.html';
        }
    }

    /**
     * Handle form submission
     * @param {Event} e - Submit event
     */
    async handleSubmit(e) {
        e.preventDefault();

        if (this.isSubmitting) return;

        this.isSubmitting = true;
        this.clearError();
        this.setLoading(true);

        const formData = new FormData(this.form);
        const username = formData.get('username')?.trim();
        const password = formData.get('password');

        if (!username || !password) {
            this.showError('Please enter both username and password');
            this.setLoading(false);
            this.isSubmitting = false;
            return;
        }

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            if (data.token) {
                setAuthToken(data.token);
                window.location.href = '/sites-dashboard.html';
            } else {
                throw new Error('No token received');
            }
        } catch (error) {
            this.showError(error.message || 'Login failed. Please try again.');
            toastError(error.message || 'Login failed');
        } finally {
            this.setLoading(false);
            this.isSubmitting = false;
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        if (this.errorContainer) {
            this.errorContainer.textContent = message;
            this.errorContainer.style.display = 'block';
        }
    }

    /**
     * Clear error message
     */
    clearError() {
        if (this.errorContainer) {
            this.errorContainer.textContent = '';
            this.errorContainer.style.display = 'none';
        }
    }

    /**
     * Set loading state
     * @param {boolean} loading - Loading state
     */
    setLoading(loading) {
        if (this.submitButton) {
            this.submitButton.disabled = loading;
            this.submitButton.textContent = loading ? 'Signing in...' : 'Sign In';
        }
    }
}

// Initialize on DOM ready
const loginHandler = new LoginHandler();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => loginHandler.init());
} else {
    loginHandler.init();
}

// Export for use in other modules
export {
    LoginHandler,
    escapeHtml,
    sanitizeUrl,
    APP_VERSION,
    Toast,
    showToast,
    toastError,
    setAuthToken,
    clearAuthToken,
};

// Global namespace for backward compatibility
window.SitesLogin = {
    handler: loginHandler,
    setAuthToken,
    clearAuthToken,
};
