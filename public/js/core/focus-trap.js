/**
 * Focus Trap Utility
 * SITES Spectral v13.19.0
 *
 * WCAG 2.4.3 Compliant Focus Management for Modals
 * Implements circular Tab/Shift+Tab navigation within containers.
 *
 * @module core/focus-trap
 * @version 13.19.0
 */

(function(global) {
    'use strict';

    /**
     * Focusable element selector
     * Matches all interactive elements that can receive focus
     */
    const FOCUSABLE_SELECTOR = [
        'button:not([disabled]):not([tabindex="-1"])',
        'a[href]:not([tabindex="-1"])',
        'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"])',
        'select:not([disabled]):not([tabindex="-1"])',
        'textarea:not([disabled]):not([tabindex="-1"])',
        '[tabindex]:not([tabindex="-1"]):not([disabled])'
    ].join(', ');

    /**
     * FocusTrap class
     * Manages focus within a container element
     */
    class FocusTrap {
        /**
         * Create a focus trap
         * @param {HTMLElement} container - The container to trap focus within
         * @param {Object} options - Configuration options
         * @param {boolean} options.autoFocus - Focus first element on activate (default: true)
         * @param {boolean} options.returnFocus - Return focus on deactivate (default: true)
         */
        constructor(container, options = {}) {
            this.container = container;
            this.options = {
                autoFocus: true,
                returnFocus: true,
                ...options
            };

            this._active = false;
            this._previouslyFocused = null;
            this._handleKeyDown = this._handleKeyDown.bind(this);
        }

        /**
         * Activate the focus trap
         * @returns {FocusTrap} This instance for chaining
         */
        activate() {
            if (this._active) return this;

            // Save currently focused element
            if (this.options.returnFocus) {
                this._previouslyFocused = document.activeElement;
            }

            // Add keydown listener
            document.addEventListener('keydown', this._handleKeyDown);

            // Focus first element
            if (this.options.autoFocus) {
                const elements = this._getFocusableElements();
                if (elements.length > 0) {
                    // Use setTimeout to ensure modal is visible
                    setTimeout(() => elements[0].focus(), 50);
                }
            }

            this._active = true;
            return this;
        }

        /**
         * Deactivate the focus trap
         * @returns {FocusTrap} This instance for chaining
         */
        deactivate() {
            if (!this._active) return this;

            // Remove keydown listener
            document.removeEventListener('keydown', this._handleKeyDown);

            // Restore focus
            if (this.options.returnFocus && this._previouslyFocused) {
                if (typeof this._previouslyFocused.focus === 'function') {
                    this._previouslyFocused.focus();
                }
                this._previouslyFocused = null;
            }

            this._active = false;
            return this;
        }

        /**
         * Check if trap is active
         * @returns {boolean}
         */
        isActive() {
            return this._active;
        }

        /**
         * Handle keydown events for Tab trapping
         * @private
         */
        _handleKeyDown(event) {
            if (event.key !== 'Tab') return;

            const focusable = this._getFocusableElements();
            if (focusable.length === 0) {
                event.preventDefault();
                return;
            }

            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            const active = document.activeElement;

            if (event.shiftKey) {
                // Shift+Tab: wrap from first to last
                if (active === first || !this.container.contains(active)) {
                    event.preventDefault();
                    last.focus();
                }
            } else {
                // Tab: wrap from last to first
                if (active === last || !this.container.contains(active)) {
                    event.preventDefault();
                    first.focus();
                }
            }
        }

        /**
         * Get all visible focusable elements within container
         * @private
         * @returns {HTMLElement[]}
         */
        _getFocusableElements() {
            const elements = Array.from(this.container.querySelectorAll(FOCUSABLE_SELECTOR));

            return elements.filter(el => {
                // Check visibility
                const style = window.getComputedStyle(el);
                if (style.display === 'none' || style.visibility === 'hidden') {
                    return false;
                }
                // Check if in visible layout
                return el.offsetParent !== null;
            });
        }

        /**
         * Destroy the focus trap and cleanup
         */
        destroy() {
            this.deactivate();
            this.container = null;
            this._previouslyFocused = null;
        }
    }

    /**
     * Create and activate a focus trap
     * @param {HTMLElement} container - Container element
     * @param {Object} options - Options passed to FocusTrap
     * @returns {FocusTrap} Active focus trap instance
     */
    function createFocusTrap(container, options = {}) {
        const trap = new FocusTrap(container, options);
        return trap.activate();
    }

    // Export
    global.FocusTrap = FocusTrap;
    global.createFocusTrap = createFocusTrap;

    // Also export under SitesFocusTrap namespace for consistency
    global.SitesFocusTrap = {
        FocusTrap,
        createFocusTrap,
        FOCUSABLE_SELECTOR
    };

})(typeof window !== 'undefined' ? window : this);
