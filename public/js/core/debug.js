/**
 * Debug Utility for SITES Spectral
 *
 * Provides environment-aware logging that only outputs in development mode.
 * In production, debug statements are silently ignored.
 *
 * @module core/debug
 * @version 8.5.5
 */

(function(global) {
    'use strict';

    /**
     * Check if we're in development mode
     * Development: localhost, 127.0.0.1, or explicitly set DEBUG flag
     */
    const isDevelopment = () => {
        // Check for explicit debug flag
        if (global.SITES_DEBUG === true) return true;
        if (global.SITES_DEBUG === false) return false;

        // Check URL for development indicators
        const hostname = global.location?.hostname || '';
        return hostname === 'localhost' ||
               hostname === '127.0.0.1' ||
               hostname.includes('.local') ||
               hostname.includes('dev.');
    };

    /**
     * Debug logger that only outputs in development mode
     */
    const Debug = {
        /**
         * Check if debug mode is enabled
         * @returns {boolean}
         */
        isEnabled() {
            return isDevelopment();
        },

        /**
         * Log debug message (only in development)
         * @param {...any} args - Arguments to log
         */
        log(...args) {
            if (isDevelopment()) {
                console.log('[DEBUG]', ...args);
            }
        },

        /**
         * Log info message (only in development)
         * @param {...any} args - Arguments to log
         */
        info(...args) {
            if (isDevelopment()) {
                console.info('[INFO]', ...args);
            }
        },

        /**
         * Log warning (always - warnings are important)
         * @param {...any} args - Arguments to log
         */
        warn(...args) {
            console.warn('[WARN]', ...args);
        },

        /**
         * Log error (always - errors are important)
         * @param {...any} args - Arguments to log
         */
        error(...args) {
            console.error('[ERROR]', ...args);
        },

        /**
         * Log with a specific category/module name
         * @param {string} category - Category/module name
         * @returns {Object} - Logger with category prefix
         */
        withCategory(category) {
            return {
                log: (...args) => {
                    if (isDevelopment()) {
                        console.log(`[${category}]`, ...args);
                    }
                },
                info: (...args) => {
                    if (isDevelopment()) {
                        console.info(`[${category}]`, ...args);
                    }
                },
                warn: (...args) => console.warn(`[${category}]`, ...args),
                error: (...args) => console.error(`[${category}]`, ...args)
            };
        },

        /**
         * Time a function execution (only in development)
         * @param {string} label - Timer label
         * @param {Function} fn - Function to time
         * @returns {any} - Result of the function
         */
        async time(label, fn) {
            if (!isDevelopment()) {
                return await fn();
            }
            console.time(label);
            try {
                return await fn();
            } finally {
                console.timeEnd(label);
            }
        },

        /**
         * Assert a condition (only logs in development)
         * @param {boolean} condition - Condition to assert
         * @param {string} message - Message if assertion fails
         */
        assert(condition, message) {
            if (isDevelopment() && !condition) {
                console.error('[ASSERT FAILED]', message);
            }
        }
    };

    // Export for ES6 modules
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Debug;
    }

    // Export for browser global
    global.Debug = Debug;

})(typeof window !== 'undefined' ? window : global);
