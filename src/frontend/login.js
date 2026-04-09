/**
 * SITES Spectral - Login Entry Point (ES6 Module)
 *
 * Entry point for the login page.
 * Uses httpOnly cookie authentication (credentials: 'include').
 *
 * @module login
 * @version 15.10.0
 */

import { escapeHtml, sanitizeUrl } from '@core/security.js';
import { APP_VERSION } from '@core/config.js';
import { Toast, showToast, error as toastError } from '@components/toast.js';
import { setAuthUser, clearAuth } from '@api/client.js';

/**
 * Login form handler — httpOnly cookie based
 */
class LoginHandler {
    constructor() {
        this.form = null;
        this.submitButton = null;
        this.errorContainer = null;
        this.isSubmitting = false;
    }

    init() {
        this.form = document.getElementById('login-form');
        this.submitButton = document.getElementById('login-submit');
        this.errorContainer = document.getElementById('login-error');

        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // Check existing session via httpOnly cookie
        this.checkExistingSession();
    }

    /**
     * Check if user already has a valid session cookie
     */
    async checkExistingSession() {
        try {
            const response = await fetch('/api/auth/verify', {
                method: 'GET',
                credentials: 'include'
            });
            if (!response.ok) return;

            const data = await response.json();
            if (data.valid && data.user) {
                setAuthUser(data.user);
                this.redirectUser(data.user);
            }
        } catch {
            // No valid session, stay on login page
        }
    }

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
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            if (data.success && data.user) {
                // Token is in httpOnly cookie, store user for UI display
                setAuthUser(data.user);
                showToast('Login successful!', 'success');

                setTimeout(() => this.redirectUser(data.user), 500);
            } else {
                throw new Error('Login failed');
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
     * Redirect user based on role
     * @param {Object} user - Authenticated user
     */
    redirectUser(user) {
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect');

        const isValidRedirect = redirect &&
            redirect.startsWith('/') &&
            !redirect.startsWith('//') &&
            !redirect.toLowerCase().includes('javascript:') &&
            !redirect.toLowerCase().includes('data:');

        if (isValidRedirect) {
            window.location.href = redirect;
            return;
        }

        if (user.role === 'admin' || user.role === 'sites-admin') {
            window.location.href = '/sites-dashboard.html';
        } else if (user.station_acronym) {
            window.location.href = `/station-dashboard.html?station=${user.station_acronym}`;
        } else {
            window.location.href = '/sites-dashboard.html';
        }
    }

    showError(message) {
        if (this.errorContainer) {
            this.errorContainer.textContent = message;
            this.errorContainer.style.display = 'block';
        }
    }

    clearError() {
        if (this.errorContainer) {
            this.errorContainer.textContent = '';
            this.errorContainer.style.display = 'none';
        }
    }

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

export {
    LoginHandler,
    escapeHtml,
    sanitizeUrl,
    APP_VERSION,
    Toast,
    showToast,
    toastError,
};

// Global namespace
window.SitesLogin = {
    handler: loginHandler,
};
