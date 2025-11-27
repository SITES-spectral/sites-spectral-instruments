/**
 * Application Controller
 *
 * Main application controller for SITES Spectral.
 * Handles initialization, configuration loading, and routing.
 *
 * @module core/app
 * @version 8.0.0
 */

(function(global) {
    'use strict';

    /**
     * Application Controller Class
     */
    class App {
        constructor() {
            /** @private */
            this.initialized = false;

            /** @private */
            this.configsToPreload = [
                'platforms/platform-types',
                'platforms/ecosystems',
                'instruments/phenocam',
                'instruments/multispectral',
                'instruments/par-sensor',
                'instruments/ndvi-sensor',
                'instruments/pri-sensor',
                'instruments/hyperspectral',
                'instruments/instrument-types',
                'stations/statuses',
                'stations/measurement-statuses',
                'general/power-sources',
                'general/data-transmission',
                'general/orientations'
            ];

            /** @private */
            this.initCallbacks = [];
        }

        /**
         * Initialize application
         * @returns {Promise<void>}
         */
        async init() {
            if (this.initialized) {
                console.warn('App already initialized');
                return;
            }

            try {
                // Show loading state
                AppState.set('isLoading', true);
                AppState.set('loadingMessage', 'Loading application...');

                // Initialize API client
                this._initializeAPIClient();

                // Load authentication state
                await this._loadAuthState();

                // Preload configurations
                await this._loadConfigs();

                // Setup global error handlers
                this._setupErrorHandlers();

                // Setup API interceptors
                this._setupAPIInterceptors();

                // Mark as initialized
                this.initialized = true;
                AppState.set('isLoading', false);
                AppState.set('loadingMessage', null);

                // Run initialization callbacks
                for (const callback of this.initCallbacks) {
                    try {
                        await callback();
                    } catch (error) {
                        console.error('Init callback error:', error);
                    }
                }

                console.log('SITES Spectral v8.0.0 initialized');

            } catch (error) {
                console.error('Failed to initialize app:', error);
                AppState.set('isLoading', false);
                AppState.set('loadingMessage', null);
                Toast.error(
                    formatMessage(ErrorMessages.UNKNOWN_ERROR),
                    { title: 'Initialization Error' }
                );
                throw error;
            }
        }

        /**
         * Initialize API client
         * @private
         */
        _initializeAPIClient() {
            // API base URL is already set from meta tag or origin in APIClient
            // Just verify it's available
            if (!APIClient) {
                throw new Error('APIClient not loaded');
            }
        }

        /**
         * Load authentication state
         * @private
         * @returns {Promise<void>}
         */
        async _loadAuthState() {
            const token = APIClient.getAuthToken();

            if (!token) {
                AppState.set('isAuthenticated', false);
                AppState.set('user', null);
                AppState.set('role', null);
                return;
            }

            try {
                // Verify token and get user info
                const userInfo = await APIClient.get('/api/auth/verify');

                AppState.set('isAuthenticated', true);
                AppState.set('user', userInfo.user);
                AppState.set('role', userInfo.user.role);
                AppState.set('permissions', userInfo.permissions || []);

            } catch (error) {
                console.warn('Failed to verify auth token:', error);
                // Clear invalid token
                APIClient.clearAuthToken();
                AppState.set('isAuthenticated', false);
                AppState.set('user', null);
                AppState.set('role', null);
            }
        }

        /**
         * Load configurations
         * @private
         * @returns {Promise<void>}
         */
        async _loadConfigs() {
            try {
                // Preload common configurations
                await ConfigLoader.preload(this.configsToPreload);

                // Store in state
                AppState.set('configsLoaded', true);

                console.log('Configurations loaded:', ConfigLoader.getLoadedConfigs());

            } catch (error) {
                console.error('Failed to load configurations:', error);
                Toast.warning(
                    'Some configurations failed to load. Some features may be limited.',
                    { title: 'Configuration Warning' }
                );
                // Don't throw - allow app to continue with partial configs
            }
        }

        /**
         * Setup global error handlers
         * @private
         */
        _setupErrorHandlers() {
            // Handle unhandled promise rejections
            window.addEventListener('unhandledrejection', (event) => {
                console.error('Unhandled promise rejection:', event.reason);
                Toast.error(
                    'An unexpected error occurred. Please try again.',
                    { title: 'Error' }
                );
            });

            // Handle global errors
            window.addEventListener('error', (event) => {
                console.error('Global error:', event.error);
            });
        }

        /**
         * Setup API interceptors
         * @private
         */
        _setupAPIInterceptors() {
            // Request interceptor - add loading state
            APIClient.addRequestInterceptor(async (config) => {
                // Could add loading indicator here
                return config;
            });

            // Response interceptor - handle common responses
            APIClient.addResponseInterceptor(async (response) => {
                return response;
            });

            // Error interceptor - handle common errors
            APIClient.addErrorInterceptor(async (error) => {
                // Handle authentication errors
                if (error.status === 401) {
                    APIClient.clearAuthToken();
                    AppState.set('isAuthenticated', false);
                    AppState.set('user', null);
                    AppState.set('role', null);

                    // Redirect to login if not already there
                    if (!window.location.pathname.includes('/login.html')) {
                        Toast.error(
                            ErrorMessages.AUTH_EXPIRED,
                            { title: 'Session Expired' }
                        );
                        setTimeout(() => {
                            window.location.href = '/login.html';
                        }, 2000);
                    }
                }

                // Handle forbidden errors
                if (error.status === 403) {
                    Toast.error(
                        ErrorMessages.AUTH_FORBIDDEN,
                        { title: 'Access Denied' }
                    );
                }

                // Handle not found errors
                if (error.status === 404) {
                    Toast.error(
                        ErrorMessages.NOT_FOUND.replace('{entity}', 'Resource'),
                        { title: 'Not Found' }
                    );
                }

                // Handle server errors
                if (error.status >= 500) {
                    Toast.error(
                        ErrorMessages.SERVER_ERROR,
                        { title: 'Server Error' }
                    );
                }

                // Handle network errors
                if (!error.status) {
                    Toast.error(
                        ErrorMessages.NETWORK_ERROR,
                        { title: 'Connection Error' }
                    );
                }

                return error;
            });
        }

        /**
         * Register initialization callback
         * @param {Function} callback - Callback to run after initialization
         */
        onInit(callback) {
            if (this.initialized) {
                // Already initialized, run immediately
                callback();
            } else {
                this.initCallbacks.push(callback);
            }
        }

        /**
         * Check if app is initialized
         * @returns {boolean}
         */
        isInitialized() {
            return this.initialized;
        }

        /**
         * Get configuration
         * @param {string} name - Configuration name
         * @returns {Promise<Object>}
         */
        async getConfig(name) {
            return await ConfigLoader.get(name);
        }

        /**
         * Navigate to URL
         * @param {string} url - URL to navigate to
         */
        navigate(url) {
            window.location.href = url;
        }

        /**
         * Reload current page
         */
        reload() {
            window.location.reload();
        }

        /**
         * Logout user
         */
        async logout() {
            try {
                // Call logout endpoint
                await APIClient.post('/api/auth/logout');
            } catch (error) {
                console.warn('Logout API call failed:', error);
            }

            // Clear local state
            APIClient.clearAuthToken();
            AppState.reset();

            // Show success message
            Toast.success(SuccessMessages.LOGOUT_SUCCESS);

            // Redirect to login
            setTimeout(() => {
                this.navigate('/login.html');
            }, 1000);
        }

        /**
         * Get current user
         * @returns {Object|null}
         */
        getCurrentUser() {
            return AppState.get('user');
        }

        /**
         * Get current station
         * @returns {Object|null}
         */
        getCurrentStation() {
            return AppState.get('currentStation');
        }

        /**
         * Check if user is authenticated
         * @returns {boolean}
         */
        isAuthenticated() {
            return AppState.get('isAuthenticated') === true;
        }

        /**
         * Check if user is admin
         * @returns {boolean}
         */
        isAdmin() {
            return AppState.isAdmin();
        }

        /**
         * Check if user can edit
         * @returns {boolean}
         */
        canEdit() {
            return !AppState.isReadOnly();
        }
    }

    // Create singleton instance
    const app = new App();

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            app.init().catch(console.error);
        });
    } else {
        // DOM already loaded
        app.init().catch(console.error);
    }

    // Export for ES6 modules
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = app;
    }

    // Export for browser global
    global.SitesApp = app;

})(typeof window !== 'undefined' ? window : global);
