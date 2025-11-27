/**
 * Global State Management
 *
 * Centralized state management for SITES Spectral application.
 * Implements event emitter pattern for reactive updates.
 *
 * @module core/state
 * @version 8.0.0
 */

(function(global) {
    'use strict';

    /**
     * Application State Manager
     */
    class AppState {
        constructor() {
            /** @private */
            this.state = {
                // User state
                user: null,
                role: null,
                isAuthenticated: false,
                permissions: [],

                // Station state
                currentStation: null,
                stationData: null,

                // Platform state
                platforms: [],
                selectedPlatform: null,

                // Instrument state
                instruments: [],
                selectedInstrument: null,

                // ROI state
                rois: [],
                selectedROI: null,

                // UI state
                activeModal: null,
                isLoading: false,
                loadingMessage: null,
                sidebarCollapsed: false,
                activeTab: null,

                // Map state
                mapCenter: null,
                mapZoom: null,
                mapBounds: null,

                // Filter state
                filters: {
                    instrumentType: null,
                    ecosystem: null,
                    status: null,
                    measurementStatus: null
                },

                // Configuration state
                configs: new Map(),
                configsLoaded: false
            };

            /** @private */
            this.listeners = new Map();

            /** @private */
            this.history = [];

            /** @private */
            this.maxHistorySize = 50;
        }

        /**
         * Get state value
         * @param {string} path - State path (e.g., 'user.role')
         * @returns {*} State value
         */
        get(path) {
            const keys = path.split('.');
            let value = this.state;

            for (const key of keys) {
                if (value === null || value === undefined) {
                    return undefined;
                }
                value = value[key];
            }

            return value;
        }

        /**
         * Set state value
         * @param {string} path - State path
         * @param {*} value - New value
         * @param {boolean} silent - If true, don't emit change event
         */
        set(path, value, silent = false) {
            const keys = path.split('.');
            const lastKey = keys.pop();
            let target = this.state;

            // Navigate to parent object
            for (const key of keys) {
                if (!(key in target)) {
                    target[key] = {};
                }
                target = target[key];
            }

            // Store old value for history
            const oldValue = target[lastKey];

            // Set new value
            target[lastKey] = value;

            // Add to history
            this._addToHistory(path, oldValue, value);

            // Emit change event
            if (!silent) {
                this._emit('change', { path, value, oldValue });
                this._emit(`change:${path}`, { value, oldValue });
            }
        }

        /**
         * Update state (merge with existing)
         * @param {string} path - State path
         * @param {Object} updates - Updates to merge
         * @param {boolean} silent - If true, don't emit change event
         */
        update(path, updates, silent = false) {
            const current = this.get(path);
            if (typeof current === 'object' && current !== null) {
                const merged = { ...current, ...updates };
                this.set(path, merged, silent);
            } else {
                this.set(path, updates, silent);
            }
        }

        /**
         * Delete state value
         * @param {string} path - State path
         */
        delete(path) {
            const keys = path.split('.');
            const lastKey = keys.pop();
            let target = this.state;

            for (const key of keys) {
                if (!(key in target)) {
                    return;
                }
                target = target[key];
            }

            const oldValue = target[lastKey];
            delete target[lastKey];

            this._emit('change', { path, value: undefined, oldValue });
            this._emit(`change:${path}`, { value: undefined, oldValue });
        }

        /**
         * Reset state to initial values
         */
        reset() {
            const oldState = { ...this.state };

            this.state = {
                user: null,
                role: null,
                isAuthenticated: false,
                permissions: [],
                currentStation: null,
                stationData: null,
                platforms: [],
                selectedPlatform: null,
                instruments: [],
                selectedInstrument: null,
                rois: [],
                selectedROI: null,
                activeModal: null,
                isLoading: false,
                loadingMessage: null,
                sidebarCollapsed: false,
                activeTab: null,
                mapCenter: null,
                mapZoom: null,
                mapBounds: null,
                filters: {
                    instrumentType: null,
                    ecosystem: null,
                    status: null,
                    measurementStatus: null
                },
                configs: new Map(),
                configsLoaded: false
            };

            this._emit('reset', { oldState });
        }

        /**
         * Subscribe to state changes
         * @param {string} event - Event name (e.g., 'change', 'change:user')
         * @param {Function} callback - Callback function
         * @returns {Function} Unsubscribe function
         */
        on(event, callback) {
            if (!this.listeners.has(event)) {
                this.listeners.set(event, []);
            }

            this.listeners.get(event).push(callback);

            // Return unsubscribe function
            return () => this.off(event, callback);
        }

        /**
         * Unsubscribe from state changes
         * @param {string} event - Event name
         * @param {Function} callback - Callback function
         */
        off(event, callback) {
            if (!this.listeners.has(event)) {
                return;
            }

            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);

            if (index !== -1) {
                callbacks.splice(index, 1);
            }
        }

        /**
         * Subscribe to one-time event
         * @param {string} event - Event name
         * @param {Function} callback - Callback function
         */
        once(event, callback) {
            const wrapper = (data) => {
                callback(data);
                this.off(event, wrapper);
            };
            this.on(event, wrapper);
        }

        /**
         * Emit event
         * @private
         * @param {string} event - Event name
         * @param {*} data - Event data
         */
        _emit(event, data) {
            if (!this.listeners.has(event)) {
                return;
            }

            const callbacks = this.listeners.get(event);
            for (const callback of callbacks) {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in state listener for ${event}:`, error);
                }
            }
        }

        /**
         * Add change to history
         * @private
         * @param {string} path - State path
         * @param {*} oldValue - Old value
         * @param {*} newValue - New value
         */
        _addToHistory(path, oldValue, newValue) {
            this.history.push({
                timestamp: Date.now(),
                path,
                oldValue,
                newValue
            });

            // Limit history size
            if (this.history.length > this.maxHistorySize) {
                this.history.shift();
            }
        }

        /**
         * Get state history
         * @returns {Array} History entries
         */
        getHistory() {
            return [...this.history];
        }

        /**
         * Get entire state (for debugging)
         * @returns {Object} Current state
         */
        getState() {
            return JSON.parse(JSON.stringify(this.state));
        }

        /**
         * Check if user has permission
         * @param {string} permission - Permission to check
         * @returns {boolean}
         */
        hasPermission(permission) {
            const permissions = this.get('permissions') || [];
            return permissions.includes(permission);
        }

        /**
         * Check if user is admin
         * @returns {boolean}
         */
        isAdmin() {
            return this.get('role') === 'admin';
        }

        /**
         * Check if user is station user
         * @returns {boolean}
         */
        isStationUser() {
            return this.get('role') === 'station';
        }

        /**
         * Check if user is readonly
         * @returns {boolean}
         */
        isReadOnly() {
            return this.get('role') === 'readonly' || !this.get('isAuthenticated');
        }
    }

    // Create singleton instance
    const appState = new AppState();

    // Export for ES6 modules
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = appState;
    }

    // Export for browser global
    global.AppState = appState;

})(typeof window !== 'undefined' ? window : global);
