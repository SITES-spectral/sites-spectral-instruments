/**
 * Toast Notification System
 *
 * Simple, accessible toast notifications for user feedback.
 *
 * @module utils/toast
 * @version 8.0.0
 */

(function(global) {
    'use strict';

    /**
     * Toast configuration
     */
    const DEFAULT_CONFIG = {
        duration: 5000,        // Auto-dismiss after 5 seconds
        position: 'top-right', // top-left, top-right, bottom-left, bottom-right, top-center, bottom-center
        maxToasts: 5,          // Maximum number of toasts visible at once
        closeButton: true,     // Show close button
        progressBar: true      // Show progress bar
    };

    /**
     * Toast types
     */
    const TOAST_TYPES = {
        SUCCESS: 'success',
        ERROR: 'error',
        WARNING: 'warning',
        INFO: 'info'
    };

    /**
     * Toast icons (using Unicode symbols)
     */
    const TOAST_ICONS = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };

    /**
     * Toast Manager Class
     */
    class ToastManager {
        constructor() {
            /** @private */
            this.config = { ...DEFAULT_CONFIG };

            /** @private */
            this.toasts = [];

            /** @private */
            this.container = null;

            /** @private */
            this.initialized = false;
        }

        /**
         * Initialize toast system
         */
        init() {
            if (this.initialized) {
                return;
            }

            this._createContainer();
            this._injectStyles();
            this.initialized = true;
        }

        /**
         * Create toast container
         * @private
         */
        _createContainer() {
            this.container = document.createElement('div');
            this.container.className = `toast-container toast-${this.config.position}`;
            this.container.setAttribute('role', 'region');
            this.container.setAttribute('aria-label', 'Notifications');
            document.body.appendChild(this.container);
        }

        /**
         * Inject CSS styles
         * @private
         */
        _injectStyles() {
            if (document.getElementById('toast-styles')) {
                return;
            }

            const style = document.createElement('style');
            style.id = 'toast-styles';
            style.textContent = `
                .toast-container {
                    position: fixed;
                    z-index: 9999;
                    pointer-events: none;
                }

                .toast-container.toast-top-right {
                    top: 20px;
                    right: 20px;
                }

                .toast-container.toast-top-left {
                    top: 20px;
                    left: 20px;
                }

                .toast-container.toast-bottom-right {
                    bottom: 20px;
                    right: 20px;
                }

                .toast-container.toast-bottom-left {
                    bottom: 20px;
                    left: 20px;
                }

                .toast-container.toast-top-center {
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                }

                .toast-container.toast-bottom-center {
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                }

                .toast {
                    pointer-events: auto;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    margin-bottom: 10px;
                    min-width: 300px;
                    max-width: 500px;
                    overflow: hidden;
                    animation: toastSlideIn 0.3s ease-out;
                    position: relative;
                }

                .toast.toast-removing {
                    animation: toastSlideOut 0.3s ease-out forwards;
                }

                @keyframes toastSlideIn {
                    from {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }

                @keyframes toastSlideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                }

                .toast-content {
                    display: flex;
                    align-items: flex-start;
                    padding: 16px;
                }

                .toast-icon {
                    flex-shrink: 0;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    margin-right: 12px;
                    font-size: 14px;
                }

                .toast-success .toast-icon {
                    background: #10b981;
                    color: white;
                }

                .toast-error .toast-icon {
                    background: #ef4444;
                    color: white;
                }

                .toast-warning .toast-icon {
                    background: #f59e0b;
                    color: white;
                }

                .toast-info .toast-icon {
                    background: #3b82f6;
                    color: white;
                }

                .toast-body {
                    flex: 1;
                    min-width: 0;
                }

                .toast-title {
                    font-weight: 600;
                    font-size: 14px;
                    color: #1f2937;
                    margin: 0 0 4px 0;
                }

                .toast-message {
                    font-size: 14px;
                    color: #6b7280;
                    margin: 0;
                    word-wrap: break-word;
                }

                .toast-close {
                    flex-shrink: 0;
                    background: none;
                    border: none;
                    color: #9ca3af;
                    cursor: pointer;
                    padding: 4px;
                    margin-left: 8px;
                    font-size: 18px;
                    line-height: 1;
                    transition: color 0.2s;
                }

                .toast-close:hover {
                    color: #4b5563;
                }

                .toast-progress {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    height: 3px;
                    background: currentColor;
                    opacity: 0.3;
                    animation: toastProgress linear forwards;
                }

                .toast-success .toast-progress {
                    color: #10b981;
                }

                .toast-error .toast-progress {
                    color: #ef4444;
                }

                .toast-warning .toast-progress {
                    color: #f59e0b;
                }

                .toast-info .toast-progress {
                    color: #3b82f6;
                }

                @keyframes toastProgress {
                    from {
                        width: 100%;
                    }
                    to {
                        width: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        /**
         * Show toast notification
         * @param {string} message - Toast message
         * @param {Object} options - Toast options
         * @returns {string} Toast ID
         */
        show(message, options = {}) {
            this.init();

            const type = options.type || TOAST_TYPES.INFO;
            const title = options.title || null;
            const duration = options.duration !== undefined ? options.duration : this.config.duration;

            // Generate unique ID
            const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            // Create toast element
            const toast = this._createToast(id, type, title, message, duration);

            // Add to container
            this.container.appendChild(toast);

            // Track toast
            this.toasts.push({ id, element: toast, type });

            // Remove oldest if exceeding max
            if (this.toasts.length > this.config.maxToasts) {
                this.remove(this.toasts[0].id);
            }

            // Auto-dismiss
            if (duration > 0) {
                setTimeout(() => {
                    this.remove(id);
                }, duration);
            }

            return id;
        }

        /**
         * Create toast element
         * @private
         */
        _createToast(id, type, title, message, duration) {
            const toast = document.createElement('div');
            toast.id = id;
            toast.className = `toast toast-${type}`;
            toast.setAttribute('role', 'alert');
            toast.setAttribute('aria-live', 'polite');

            const icon = TOAST_ICONS[type] || TOAST_ICONS.info;

            let html = `
                <div class="toast-content">
                    <div class="toast-icon">${icon}</div>
                    <div class="toast-body">
            `;

            if (title) {
                html += `<div class="toast-title">${this._escapeHtml(title)}</div>`;
            }

            html += `
                        <div class="toast-message">${this._escapeHtml(message)}</div>
                    </div>
            `;

            if (this.config.closeButton) {
                html += `<button class="toast-close" aria-label="Close">&times;</button>`;
            }

            html += `</div>`;

            if (this.config.progressBar && duration > 0) {
                html += `<div class="toast-progress" style="animation-duration: ${duration}ms;"></div>`;
            }

            toast.innerHTML = html;

            // Add close button listener
            if (this.config.closeButton) {
                const closeBtn = toast.querySelector('.toast-close');
                closeBtn.addEventListener('click', () => {
                    this.remove(id);
                });
            }

            return toast;
        }

        /**
         * Remove toast
         * @param {string} id - Toast ID
         */
        remove(id) {
            const toastIndex = this.toasts.findIndex(t => t.id === id);
            if (toastIndex === -1) {
                return;
            }

            const toast = this.toasts[toastIndex];
            toast.element.classList.add('toast-removing');

            setTimeout(() => {
                if (toast.element.parentNode) {
                    toast.element.parentNode.removeChild(toast.element);
                }
                this.toasts.splice(toastIndex, 1);
            }, 300);
        }

        /**
         * Show success toast
         * @param {string} message - Toast message
         * @param {Object} options - Toast options
         * @returns {string} Toast ID
         */
        success(message, options = {}) {
            return this.show(message, { ...options, type: TOAST_TYPES.SUCCESS });
        }

        /**
         * Show error toast
         * @param {string} message - Toast message
         * @param {Object} options - Toast options
         * @returns {string} Toast ID
         */
        error(message, options = {}) {
            return this.show(message, {
                ...options,
                type: TOAST_TYPES.ERROR,
                duration: options.duration !== undefined ? options.duration : 0 // Don't auto-dismiss errors
            });
        }

        /**
         * Show warning toast
         * @param {string} message - Toast message
         * @param {Object} options - Toast options
         * @returns {string} Toast ID
         */
        warning(message, options = {}) {
            return this.show(message, { ...options, type: TOAST_TYPES.WARNING });
        }

        /**
         * Show info toast
         * @param {string} message - Toast message
         * @param {Object} options - Toast options
         * @returns {string} Toast ID
         */
        info(message, options = {}) {
            return this.show(message, { ...options, type: TOAST_TYPES.INFO });
        }

        /**
         * Clear all toasts
         */
        clearAll() {
            const toastIds = this.toasts.map(t => t.id);
            toastIds.forEach(id => this.remove(id));
        }

        /**
         * Configure toast system
         * @param {Object} config - Configuration options
         */
        configure(config) {
            this.config = { ...this.config, ...config };
        }

        /**
         * Escape HTML to prevent XSS
         * @private
         * @param {string} text - Text to escape
         * @returns {string} Escaped text
         * @see core/security.js - Delegates to central implementation
         */
        _escapeHtml(text) {
            return window.SitesSecurity?.escapeHtml?.(text) ?? (text ? String(text).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'})[m]) : '');
        }
    }

    // Create singleton instance
    const toast = new ToastManager();

    // Export for ES6 modules
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = toast;
    }

    // Export for browser global
    global.Toast = toast;

})(typeof window !== 'undefined' ? window : global);
