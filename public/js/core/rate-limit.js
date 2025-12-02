/**
 * Rate Limiting and Debouncing Utilities
 *
 * Provides utilities to prevent rapid/repeated API calls and form submissions.
 * Helps protect against accidental double-clicks and potential abuse.
 *
 * @module core/rate-limit
 * @version 8.5.7
 */

(function(global) {
    'use strict';

    /**
     * Simple debounce function
     * @param {Function} fn - Function to debounce
     * @param {number} delay - Delay in milliseconds
     * @returns {Function} Debounced function
     */
    function debounce(fn, delay = 300) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    /**
     * Throttle function - allows max one call per interval
     * @param {Function} fn - Function to throttle
     * @param {number} interval - Minimum interval between calls in ms
     * @returns {Function} Throttled function
     */
    function throttle(fn, interval = 1000) {
        let lastCall = 0;
        return function(...args) {
            const now = Date.now();
            if (now - lastCall >= interval) {
                lastCall = now;
                return fn.apply(this, args);
            }
        };
    }

    /**
     * Rate limiter for form submissions
     * Prevents double-clicks and rapid repeated submissions
     */
    class SubmissionGuard {
        constructor() {
            this.pendingSubmissions = new Map();
            this.cooldownPeriod = 2000; // 2 seconds between submissions
        }

        /**
         * Check if a submission is allowed
         * @param {string} formId - Identifier for the form/action
         * @returns {boolean} Whether submission is allowed
         */
        canSubmit(formId) {
            const lastSubmission = this.pendingSubmissions.get(formId);
            const now = Date.now();

            if (lastSubmission) {
                // Check if still in cooldown
                if (now - lastSubmission.timestamp < this.cooldownPeriod) {
                    return false;
                }
                // Check if previous submission still pending
                if (lastSubmission.pending) {
                    return false;
                }
            }

            return true;
        }

        /**
         * Mark a submission as started
         * @param {string} formId - Identifier for the form/action
         */
        startSubmission(formId) {
            this.pendingSubmissions.set(formId, {
                timestamp: Date.now(),
                pending: true
            });
        }

        /**
         * Mark a submission as completed
         * @param {string} formId - Identifier for the form/action
         */
        endSubmission(formId) {
            const submission = this.pendingSubmissions.get(formId);
            if (submission) {
                submission.pending = false;
            }
        }

        /**
         * Wrapper to guard a form submission function
         * @param {string} formId - Identifier for the form/action
         * @param {Function} submitFn - The submission function
         * @param {string} [message] - Optional message to show when rate limited
         * @returns {Function} Guarded submission function
         */
        guard(formId, submitFn, message = 'Please wait before submitting again') {
            return async (...args) => {
                if (!this.canSubmit(formId)) {
                    if (typeof showNotification === 'function') {
                        showNotification(message, 'warning');
                    }
                    return;
                }

                this.startSubmission(formId);
                try {
                    return await submitFn.apply(this, args);
                } finally {
                    this.endSubmission(formId);
                }
            };
        }

        /**
         * Reset all submission states
         */
        reset() {
            this.pendingSubmissions.clear();
        }
    }

    // Create singleton instance
    const submissionGuard = new SubmissionGuard();

    // Export
    global.RateLimit = {
        debounce,
        throttle,
        submissionGuard
    };

    // Also export individual functions for convenience
    global.debounce = debounce;
    global.throttle = throttle;

})(typeof window !== 'undefined' ? window : global);
