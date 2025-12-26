/**
 * Promise Utilities
 *
 * Utilities for safe Promise handling with proper error management.
 * Addresses Phase 6.1 - Promise rejection handlers.
 *
 * @module core/promise-utils
 * @version 12.0.7
 */

(function(global) {
    'use strict';

    /**
     * Promise Utilities
     */
    const PromiseUtils = {
        /**
         * Execute promises in parallel, returning results for successful ones.
         * Failed promises are logged but don't prevent others from completing.
         *
         * @param {Promise[]} promises - Array of promises to execute
         * @param {Object} options - Options
         * @param {boolean} options.logErrors - Whether to log errors (default: true)
         * @param {string} options.context - Context for error logging
         * @returns {Promise<Array>} Array of successful results (nulls for failures)
         *
         * @example
         * const [stations, platforms] = await PromiseUtils.allSettledValues([
         *     fetchStations(),
         *     fetchPlatforms()
         * ], { context: 'Dashboard load' });
         */
        async allSettledValues(promises, options = {}) {
            const { logErrors = true, context = 'Promise' } = options;

            const results = await Promise.allSettled(promises);

            return results.map((result, index) => {
                if (result.status === 'fulfilled') {
                    return result.value;
                } else {
                    if (logErrors) {
                        console.error(`[${context}] Promise ${index} failed:`, result.reason);
                    }
                    return null;
                }
            });
        },

        /**
         * Execute promises in parallel, throwing only if ALL fail.
         * Returns partial results if some succeed.
         *
         * @param {Promise[]} promises - Array of promises
         * @param {Object} options - Options
         * @param {boolean} options.requireAll - If true, throws if any fail (default: false)
         * @param {string} options.context - Context for error logging
         * @returns {Promise<Object>} Object with results and errors
         *
         * @example
         * const { results, errors, hasErrors } = await PromiseUtils.safeAll([
         *     loadPlatforms(),
         *     loadInstruments()
         * ]);
         */
        async safeAll(promises, options = {}) {
            const { requireAll = false, context = 'Promise' } = options;

            const settled = await Promise.allSettled(promises);

            const results = [];
            const errors = [];

            settled.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    results.push(result.value);
                } else {
                    errors.push({
                        index,
                        error: result.reason,
                        message: result.reason?.message || 'Unknown error'
                    });
                    results.push(null);
                }
            });

            const hasErrors = errors.length > 0;
            const allFailed = errors.length === promises.length;

            // Log errors
            if (hasErrors) {
                errors.forEach(err => {
                    console.error(`[${context}] Promise ${err.index} failed:`, err.error);
                });
            }

            // Throw only if requireAll and there are errors, or if all failed
            if (allFailed) {
                throw new Error(`[${context}] All ${promises.length} promises failed`);
            }

            if (requireAll && hasErrors) {
                throw new Error(`[${context}] ${errors.length}/${promises.length} promises failed`);
            }

            return { results, errors, hasErrors, allSucceeded: !hasErrors };
        },

        /**
         * Wrap an async function with error handling.
         * Returns null on error instead of throwing.
         *
         * @param {Function} fn - Async function to wrap
         * @param {Object} options - Options
         * @param {*} options.defaultValue - Value to return on error (default: null)
         * @param {boolean} options.logError - Whether to log errors (default: true)
         * @param {string} options.context - Context for logging
         * @returns {Function} Wrapped function that won't throw
         *
         * @example
         * const safeFetch = PromiseUtils.safe(fetchData, { defaultValue: [] });
         * const data = await safeFetch(); // Returns [] on error
         */
        safe(fn, options = {}) {
            const { defaultValue = null, logError = true, context = fn.name || 'async' } = options;

            return async (...args) => {
                try {
                    return await fn(...args);
                } catch (error) {
                    if (logError) {
                        console.error(`[${context}] Error:`, error);
                    }
                    return defaultValue;
                }
            };
        },

        /**
         * Execute an async operation with timeout.
         *
         * @param {Promise} promise - Promise to execute
         * @param {number} timeoutMs - Timeout in milliseconds
         * @param {string} message - Timeout error message
         * @returns {Promise} Promise that rejects on timeout
         *
         * @example
         * await PromiseUtils.withTimeout(fetchData(), 5000, 'Data fetch timed out');
         */
        async withTimeout(promise, timeoutMs, message = 'Operation timed out') {
            let timeoutId;

            const timeoutPromise = new Promise((_, reject) => {
                timeoutId = setTimeout(() => {
                    reject(new Error(message));
                }, timeoutMs);
            });

            try {
                const result = await Promise.race([promise, timeoutPromise]);
                clearTimeout(timeoutId);
                return result;
            } catch (error) {
                clearTimeout(timeoutId);
                throw error;
            }
        },

        /**
         * Retry an async operation with exponential backoff.
         *
         * @param {Function} fn - Async function to retry
         * @param {Object} options - Retry options
         * @param {number} options.maxRetries - Maximum retry attempts (default: 3)
         * @param {number} options.initialDelay - Initial delay in ms (default: 1000)
         * @param {number} options.maxDelay - Maximum delay in ms (default: 10000)
         * @param {Function} options.shouldRetry - Function to determine if should retry
         * @returns {Promise} Result of the function
         *
         * @example
         * await PromiseUtils.retry(
         *     () => fetchWithRetry(),
         *     { maxRetries: 3, initialDelay: 1000 }
         * );
         */
        async retry(fn, options = {}) {
            const {
                maxRetries = 3,
                initialDelay = 1000,
                maxDelay = 10000,
                shouldRetry = () => true
            } = options;

            let lastError;
            let delay = initialDelay;

            for (let attempt = 0; attempt <= maxRetries; attempt++) {
                try {
                    return await fn();
                } catch (error) {
                    lastError = error;

                    if (attempt === maxRetries || !shouldRetry(error, attempt)) {
                        throw error;
                    }

                    console.warn(`Attempt ${attempt + 1}/${maxRetries + 1} failed, retrying in ${delay}ms...`);

                    await new Promise(resolve => setTimeout(resolve, delay));
                    delay = Math.min(delay * 2, maxDelay);
                }
            }

            throw lastError;
        },

        /**
         * Execute promises sequentially (one after another).
         *
         * @param {Array<Function>} promiseFns - Array of functions that return promises
         * @returns {Promise<Array>} Array of results in order
         *
         * @example
         * const results = await PromiseUtils.sequence([
         *     () => fetch('/api/1'),
         *     () => fetch('/api/2'),
         *     () => fetch('/api/3')
         * ]);
         */
        async sequence(promiseFns) {
            const results = [];

            for (const fn of promiseFns) {
                const result = await fn();
                results.push(result);
            }

            return results;
        },

        /**
         * Execute promises with concurrency limit.
         *
         * @param {Array<Function>} promiseFns - Array of functions that return promises
         * @param {number} concurrency - Maximum concurrent promises
         * @returns {Promise<Array>} Array of results
         *
         * @example
         * const results = await PromiseUtils.pool(
         *     items.map(item => () => processItem(item)),
         *     5 // Max 5 concurrent
         * );
         */
        async pool(promiseFns, concurrency = 5) {
            const results = new Array(promiseFns.length);
            let currentIndex = 0;

            async function worker() {
                while (currentIndex < promiseFns.length) {
                    const index = currentIndex++;
                    results[index] = await promiseFns[index]();
                }
            }

            const workers = [];
            for (let i = 0; i < Math.min(concurrency, promiseFns.length); i++) {
                workers.push(worker());
            }

            await Promise.all(workers);
            return results;
        }
    };

    // Export for ES6 modules
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = PromiseUtils;
    }

    // Export for browser global
    global.PromiseUtils = PromiseUtils;

})(typeof window !== 'undefined' ? window : global);
