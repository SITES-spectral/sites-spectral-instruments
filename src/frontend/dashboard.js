/**
 * SITES Spectral - Dashboard Entry Point (ES6 Module)
 *
 * Entry point for the station dashboard.
 * Full bundle with all dashboard functionality.
 *
 * @module dashboard
 * @version 13.15.0
 */

// Core modules
import { Security, escapeHtml, sanitizeUrl, createElement } from '@core/security.js';
import { Utils, debounce, throttle, formatDate, formatDateTime, formatRelativeTime } from '@core/utils.js';
import { Config, APP_VERSION, getApiUrl, getPlatformType, getInstrumentType, getStatusConfig, getEcosystemName, PLATFORM_TYPES, INSTRUMENT_TYPES, STATUS_CONFIG, ECOSYSTEM_CODES } from '@core/config.js';

// Components
import { Toast, showToast, success as toastSuccess, error as toastError, warning as toastWarning, info as toastInfo, clearAllToasts } from '@components/toast.js';
import { Modal, confirm, alert as alertModal, closeAll as closeAllModals, getActiveModal } from '@components/modal.js';
import { Skeleton } from '@components/skeleton.js';

// API
import { API, V3Response, isAuthenticated, getAuthHeaders, setAuthToken, clearAuthToken } from '@api/client.js';

/**
 * Dashboard state management
 */
const DashboardState = {
    currentStation: null,
    currentPlatform: null,
    platforms: [],
    instruments: [],
    isLoading: false,
    error: null,
};

/**
 * Initialize dashboard
 */
async function initializeDashboard() {
    // Check authentication
    if (!isAuthenticated()) {
        window.location.href = '/login.html';
        return;
    }

    // Set up global error handler for images
    window.addEventListener('error', (event) => {
        if (event.target?.tagName === 'IMG' && event.target.dataset.fallback === 'true') {
            event.target.parentElement?.classList.add('no-image');
            event.target.style.display = 'none';
        }
    }, true);

    // Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const stationId = urlParams.get('station');

    if (stationId) {
        await loadStation(stationId);
    }

    console.log(`SITES Spectral Dashboard v${APP_VERSION} initialized`);
}

/**
 * Load station data
 * @param {string} stationId - Station ID or acronym
 */
async function loadStation(stationId) {
    try {
        DashboardState.isLoading = true;
        DashboardState.error = null;

        const response = await API.getStation(stationId);
        DashboardState.currentStation = response.data;

        // Load platforms for the station
        const platformsResponse = await API.getPlatforms({ station: stationId });
        DashboardState.platforms = platformsResponse.data;

    } catch (error) {
        DashboardState.error = error.message;
        toastError(`Failed to load station: ${error.message}`);
    } finally {
        DashboardState.isLoading = false;
    }
}

/**
 * Load platform data
 * @param {number} platformId - Platform ID
 */
async function loadPlatform(platformId) {
    try {
        DashboardState.isLoading = true;

        const response = await API.getPlatform(platformId);
        DashboardState.currentPlatform = response.data;

        // Load instruments for the platform
        const instrumentsResponse = await API.getInstruments({ platform: platformId });
        DashboardState.instruments = instrumentsResponse.data;

    } catch (error) {
        toastError(`Failed to load platform: ${error.message}`);
    } finally {
        DashboardState.isLoading = false;
    }
}

/**
 * Logout handler
 */
function logout() {
    clearAuthToken();
    window.location.href = '/login.html';
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDashboard);
} else {
    initializeDashboard();
}

// Export for use in other modules
export {
    // State
    DashboardState,

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
    formatRelativeTime,
    Config,
    APP_VERSION,
    getApiUrl,
    getPlatformType,
    getInstrumentType,
    getStatusConfig,
    getEcosystemName,
    PLATFORM_TYPES,
    INSTRUMENT_TYPES,
    STATUS_CONFIG,
    ECOSYSTEM_CODES,

    // Components
    Toast,
    showToast,
    toastSuccess,
    toastError,
    toastWarning,
    toastInfo,
    clearAllToasts,
    Modal,
    confirm,
    alertModal,
    closeAllModals,
    getActiveModal,
    Skeleton,

    // API
    API,
    V3Response,
    isAuthenticated,
    getAuthHeaders,
    setAuthToken,
    clearAuthToken,

    // Dashboard functions
    loadStation,
    loadPlatform,
    logout,
};

// Global namespace for backward compatibility
window.SitesDashboard = {
    // State
    state: DashboardState,

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
    formatRelativeTime,
    getApiUrl,
    getPlatformType,
    getInstrumentType,
    getStatusConfig,
    getEcosystemName,
    showToast,
    confirm,

    // Dashboard functions
    loadStation,
    loadPlatform,
    logout,
};
