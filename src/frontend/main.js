/**
 * SITES Spectral - Main Entry Point (ES6 Module)
 *
 * Primary entry point for the main application.
 * Imports and initializes all core modules.
 *
 * @module main
 * @version 13.15.0
 */

// Core modules
import { Security, escapeHtml, sanitizeUrl, createElement } from '@core/security.js';
import { Utils, debounce, throttle, formatDate, formatDateTime } from '@core/utils.js';
import { Config, APP_VERSION, getApiUrl, getPlatformType, getInstrumentType, getStatusConfig } from '@core/config.js';

// Components
import { Toast, showToast, success as toastSuccess, error as toastError, warning as toastWarning, info as toastInfo } from '@components/toast.js';
import { Modal, confirm, alert as alertModal, closeAll as closeAllModals } from '@components/modal.js';
import { Skeleton } from '@components/skeleton.js';

// API
import { API, isAuthenticated, getAuthHeaders, setAuthToken, clearAuthToken } from '@api/client.js';

/**
 * Initialize application
 */
function initializeApp() {
    // Set up global error handler for images
    window.addEventListener('error', (event) => {
        if (event.target?.tagName === 'IMG' && event.target.dataset.fallback === 'true') {
            event.target.parentElement?.classList.add('no-image');
            event.target.style.display = 'none';
        }
    }, true);

    // Log initialization
    console.log(`SITES Spectral v${APP_VERSION} initialized`);
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Export for use in other modules
export {
    // Core
    Security,
    escapeHtml,
    sanitizeUrl,
    createElement,
    Utils,
    debounce,
    throttle,
    formatDate,
    formatDateTime,
    Config,
    APP_VERSION,
    getApiUrl,
    getPlatformType,
    getInstrumentType,
    getStatusConfig,

    // Components
    Toast,
    showToast,
    toastSuccess,
    toastError,
    toastWarning,
    toastInfo,
    Modal,
    confirm,
    alertModal,
    closeAllModals,
    Skeleton,

    // API
    API,
    isAuthenticated,
    getAuthHeaders,
    setAuthToken,
    clearAuthToken,
};

// Create global namespace for backward compatibility during migration
window.SitesSpectral = {
    // Core
    Security,
    Utils,
    Config,
    APP_VERSION,

    // Components
    Toast,
    Modal,
    Skeleton,

    // API
    API,
    isAuthenticated,
    getAuthHeaders,
    setAuthToken,
    clearAuthToken,

    // Helpers
    escapeHtml,
    sanitizeUrl,
    createElement,
    debounce,
    throttle,
    formatDate,
    formatDateTime,
    getApiUrl,
    getPlatformType,
    getInstrumentType,
    getStatusConfig,
    showToast,
    confirm,
};
