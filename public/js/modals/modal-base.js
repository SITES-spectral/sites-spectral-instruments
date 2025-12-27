/**
 * Modal Base Class
 * SITES Spectral v8.0.0-alpha.2
 *
 * Base modal class that all modals extend. Provides common modal functionality:
 * - Show/hide animations
 * - Title and content management
 * - Footer with custom buttons
 * - Event handlers for save/cancel
 * - Accessibility support
 */

class ModalBase {
    /**
     * Create a new modal
     * @param {HTMLElement|string} container - Container element or selector
     * @param {Object} options - Modal configuration options
     */
    constructor(container, options = {}) {
        this.container = typeof container === 'string'
            ? document.querySelector(container)
            : container;

        if (!this.container) {
            throw new Error('Modal container not found');
        }

        this.options = {
            closeOnEscape: true,
            closeOnBackdrop: true,
            showCloseButton: true,
            ...options
        };

        this.isVisible = false;
        this.saveCallback = null;
        this.cancelCallback = null;
        this._previouslyFocusedElement = null;

        this._init();
    }

    /**
     * Initialize modal structure
     * @private
     */
    _init() {
        // Add modal class if not present
        if (!this.container.classList.contains('modal')) {
            this.container.classList.add('modal');
        }

        // Set ARIA attributes
        this.container.setAttribute('role', 'dialog');
        this.container.setAttribute('aria-modal', 'true');
        this.container.setAttribute('aria-hidden', 'true');

        // Bind event listeners
        if (this.options.closeOnEscape) {
            this._handleEscape = this._handleEscape.bind(this);
        }

        // Bind focus trap handler for WCAG 2.4.3 compliance
        this._handleTabKey = this._handleTabKey.bind(this);

        if (this.options.closeOnBackdrop) {
            this.container.addEventListener('click', (e) => {
                if (e.target === this.container) {
                    this.hide();
                }
            });
        }
    }

    /**
     * Show the modal
     * @param {Object} animationOptions - Animation configuration
     */
    show(animationOptions = {}) {
        const {
            duration = 300,
            onComplete = null
        } = animationOptions;

        // Save currently focused element for restoration on close (WCAG 2.4.3)
        this._previouslyFocusedElement = document.activeElement;

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        // Show modal
        this.container.style.display = 'flex';
        this.container.setAttribute('aria-hidden', 'false');

        // Trigger reflow for animation
        this.container.offsetHeight;

        // Add active class for fade-in
        this.container.classList.add('modal-active');

        // Set focus to first focusable element
        setTimeout(() => {
            const focusableElements = this._getFocusableElements();
            if (focusableElements.length > 0) {
                focusableElements[0].focus();
            }
        }, duration);

        // Bind escape key
        if (this.options.closeOnEscape) {
            document.addEventListener('keydown', this._handleEscape);
        }

        // Bind focus trap for Tab/Shift+Tab (WCAG 2.4.3)
        document.addEventListener('keydown', this._handleTabKey);

        this.isVisible = true;

        if (onComplete) {
            setTimeout(onComplete, duration);
        }

        return this;
    }

    /**
     * Hide the modal
     * @param {Object} animationOptions - Animation configuration
     */
    hide(animationOptions = {}) {
        const {
            duration = 300,
            onComplete = null
        } = animationOptions;

        // Remove active class for fade-out
        this.container.classList.remove('modal-active');

        // Hide after animation
        setTimeout(() => {
            this.container.style.display = 'none';
            this.container.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';

            // Restore focus to previously focused element (WCAG 2.4.3)
            if (this._previouslyFocusedElement && typeof this._previouslyFocusedElement.focus === 'function') {
                this._previouslyFocusedElement.focus();
            }

            if (onComplete) {
                onComplete();
            }
        }, duration);

        // Unbind escape key
        if (this.options.closeOnEscape) {
            document.removeEventListener('keydown', this._handleEscape);
        }

        // Unbind focus trap
        document.removeEventListener('keydown', this._handleTabKey);

        this.isVisible = false;

        return this;
    }

    /**
     * Toggle modal visibility
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
        return this;
    }

    /**
     * Set modal title
     * @param {string} title - Title text
     * @param {string} icon - FontAwesome icon class (without 'fa-')
     */
    setTitle(title, icon = null) {
        const titleElement = this.container.querySelector('.modal-title');
        if (!titleElement) return this;

        let titleHTML = '';
        if (icon) {
            titleHTML += `<i class="fas fa-${icon}" aria-hidden="true"></i> `;
        }
        titleHTML += this._escapeHtml(title);

        titleElement.innerHTML = titleHTML;

        return this;
    }

    /**
     * Set modal content
     * @param {string|HTMLElement} content - HTML content or element
     */
    setContent(content) {
        const contentElement = this.container.querySelector('.modal-body');
        if (!contentElement) return this;

        if (typeof content === 'string') {
            contentElement.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            contentElement.innerHTML = '';
            contentElement.appendChild(content);
        }

        return this;
    }

    /**
     * Set modal footer with custom buttons
     * @param {Array} buttons - Array of button configurations
     *
     * Button config:
     * {
     *   text: 'Button Text',
     *   icon: 'save',  // FontAwesome icon (optional)
     *   className: 'btn-primary',
     *   onClick: function() {},
     *   attributes: { type: 'submit', ... }
     * }
     */
    setFooter(buttons = []) {
        const footerElement = this.container.querySelector('.modal-footer');
        if (!footerElement) return this;

        footerElement.innerHTML = '';

        buttons.forEach(btnConfig => {
            const button = document.createElement('button');
            button.type = btnConfig.attributes?.type || 'button';
            button.className = btnConfig.className || 'btn';

            // Add icon if provided
            let buttonHTML = '';
            if (btnConfig.icon) {
                buttonHTML += `<i class="fas fa-${btnConfig.icon}" aria-hidden="true"></i> `;
            }
            buttonHTML += this._escapeHtml(btnConfig.text);
            button.innerHTML = buttonHTML;

            // Add custom attributes
            if (btnConfig.attributes) {
                Object.keys(btnConfig.attributes).forEach(attr => {
                    if (attr !== 'type') {
                        button.setAttribute(attr, btnConfig.attributes[attr]);
                    }
                });
            }

            // Add click handler
            if (btnConfig.onClick) {
                button.addEventListener('click', btnConfig.onClick);
            }

            footerElement.appendChild(button);
        });

        return this;
    }

    /**
     * Register save callback
     * @param {Function} callback - Function to call on save
     */
    onSave(callback) {
        this.saveCallback = callback;
        return this;
    }

    /**
     * Register cancel callback
     * @param {Function} callback - Function to call on cancel
     */
    onCancel(callback) {
        this.cancelCallback = callback;
        return this;
    }

    /**
     * Trigger save action
     * @param {*} data - Data to pass to save callback
     */
    save(data) {
        if (this.saveCallback) {
            const result = this.saveCallback(data);
            // If callback returns false, don't close modal
            if (result !== false) {
                this.hide();
            }
            return result;
        }
        this.hide();
        return true;
    }

    /**
     * Trigger cancel action
     */
    cancel() {
        if (this.cancelCallback) {
            this.cancelCallback();
        }
        this.hide();
        return this;
    }

    /**
     * Handle escape key press
     * @private
     */
    _handleEscape(event) {
        if (event.key === 'Escape' && this.isVisible) {
            this.cancel();
        }
    }

    /**
     * Handle Tab key for focus trap (WCAG 2.4.3)
     * Implements circular Tab/Shift+Tab navigation within modal
     * @private
     */
    _handleTabKey(event) {
        if (event.key !== 'Tab' || !this.isVisible) {
            return;
        }

        const focusableElements = this._getFocusableElements();
        if (focusableElements.length === 0) {
            // No focusable elements, prevent Tab from leaving modal
            event.preventDefault();
            return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        const activeElement = document.activeElement;

        if (event.shiftKey) {
            // Shift+Tab: if on first element, wrap to last
            if (activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
            }
        } else {
            // Tab: if on last element, wrap to first
            if (activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
            }
        }
    }

    /**
     * Get all focusable elements within the modal
     * @private
     * @returns {Array<HTMLElement>} Array of focusable elements
     */
    _getFocusableElements() {
        const focusableSelector = [
            'button:not([disabled]):not([tabindex="-1"])',
            'a[href]:not([tabindex="-1"])',
            'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"])',
            'select:not([disabled]):not([tabindex="-1"])',
            'textarea:not([disabled]):not([tabindex="-1"])',
            '[tabindex]:not([tabindex="-1"]):not([disabled])'
        ].join(', ');

        // Filter to only visible elements
        const elements = Array.from(this.container.querySelectorAll(focusableSelector));
        return elements.filter(el => {
            // Check if element is visible
            const style = window.getComputedStyle(el);
            return style.display !== 'none' &&
                   style.visibility !== 'hidden' &&
                   el.offsetParent !== null;
        });
    }

    /**
     * Escape HTML to prevent XSS
     * @private
     * @see core/security.js - Delegates to central implementation
     */
    _escapeHtml(str) {
        return window.SitesSecurity?.escapeHtml?.(str) ?? (str ? String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'})[m]) : '');
    }

    /**
     * Destroy modal and cleanup
     */
    destroy() {
        if (this.options.closeOnEscape) {
            document.removeEventListener('keydown', this._handleEscape);
        }
        // Remove focus trap handler
        document.removeEventListener('keydown', this._handleTabKey);
        // Clear container content safely
        while (this.container.firstChild) {
            this.container.removeChild(this.container.firstChild);
        }
        this.container = null;
        this.saveCallback = null;
        this.cancelCallback = null;
        this._previouslyFocusedElement = null;
    }
}

// Export for module systems and make globally available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModalBase;
}
if (typeof window !== 'undefined') {
    window.ModalBase = ModalBase;
}
