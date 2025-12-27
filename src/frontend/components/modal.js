/**
 * SITES Spectral - Modal Component (ES6 Module)
 *
 * Modal dialog system with focus trap for accessibility.
 *
 * @module components/modal
 * @version 13.15.0
 */

import { createElement } from '@core/security.js';

/**
 * Active modals stack
 */
const activeModals = [];

/**
 * Focusable elements selector
 */
const FOCUSABLE_SELECTOR = [
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])'
].join(', ');

/**
 * Modal class for creating and managing modal dialogs
 */
export class Modal {
    /**
     * Create a new modal
     * @param {Object} options - Modal options
     * @param {string} options.id - Modal ID
     * @param {string} options.title - Modal title
     * @param {string} options.size - Modal size: 'sm', 'md', 'lg', 'xl'
     * @param {boolean} options.closeOnEscape - Close on Escape key
     * @param {boolean} options.closeOnBackdrop - Close on backdrop click
     * @param {Function} options.onClose - Close callback
     */
    constructor(options = {}) {
        this.id = options.id || `modal-${Date.now()}`;
        this.title = options.title || '';
        this.size = options.size || 'md';
        this.closeOnEscape = options.closeOnEscape !== false;
        this.closeOnBackdrop = options.closeOnBackdrop !== false;
        this.onClose = options.onClose || null;

        this.element = null;
        this.previouslyFocusedElement = null;
        this.boundHandleKeydown = this.handleKeydown.bind(this);
    }

    /**
     * Create the modal DOM structure
     * @returns {HTMLElement} Modal element
     */
    create() {
        // Backdrop
        this.element = createElement('div', {
            id: this.id,
            className: `modal modal--${this.size}`,
            role: 'dialog',
            'aria-modal': 'true',
            'aria-hidden': 'true',
            'aria-labelledby': `${this.id}-title`
        });

        // Content wrapper
        const content = createElement('div', {
            className: 'modal__content'
        });

        // Header
        const header = createElement('div', {
            className: 'modal__header'
        });

        const title = createElement('h2', {
            id: `${this.id}-title`,
            className: 'modal__title'
        }, this.title);

        const closeBtn = createElement('button', {
            className: 'modal__close',
            type: 'button',
            'aria-label': 'Close modal'
        });
        const closeIcon = createElement('i', {
            className: 'fas fa-times'
        });
        closeBtn.appendChild(closeIcon);
        closeBtn.addEventListener('click', () => this.close());

        header.appendChild(title);
        header.appendChild(closeBtn);

        // Body
        this.body = createElement('div', {
            className: 'modal__body'
        });

        // Footer
        this.footer = createElement('div', {
            className: 'modal__footer'
        });

        // Assemble
        content.appendChild(header);
        content.appendChild(this.body);
        content.appendChild(this.footer);
        this.element.appendChild(content);

        // Backdrop click handler
        if (this.closeOnBackdrop) {
            this.element.addEventListener('click', (e) => {
                if (e.target === this.element) {
                    this.close();
                }
            });
        }

        return this.element;
    }

    /**
     * Set modal body content
     * @param {HTMLElement|string} content - Content to set
     */
    setBody(content) {
        if (!this.body) return;

        // Clear existing content
        while (this.body.firstChild) {
            this.body.removeChild(this.body.firstChild);
        }

        if (typeof content === 'string') {
            this.body.textContent = content;
        } else if (content instanceof HTMLElement) {
            this.body.appendChild(content);
        }
    }

    /**
     * Set modal footer content
     * @param {HTMLElement|HTMLElement[]} content - Footer content
     */
    setFooter(content) {
        if (!this.footer) return;

        // Clear existing content
        while (this.footer.firstChild) {
            this.footer.removeChild(this.footer.firstChild);
        }

        if (Array.isArray(content)) {
            content.forEach(el => this.footer.appendChild(el));
        } else if (content instanceof HTMLElement) {
            this.footer.appendChild(content);
        }
    }

    /**
     * Open the modal
     */
    open() {
        if (!this.element) {
            this.create();
            document.body.appendChild(this.element);
        }

        // Store focused element
        this.previouslyFocusedElement = document.activeElement;

        // Show modal
        this.element.setAttribute('aria-hidden', 'false');
        this.element.classList.add('modal--visible');
        document.body.classList.add('modal-open');

        // Add to stack
        activeModals.push(this);

        // Bind keyboard handler
        if (this.closeOnEscape) {
            document.addEventListener('keydown', this.boundHandleKeydown);
        }

        // Focus first focusable element
        requestAnimationFrame(() => {
            const focusable = this.element.querySelectorAll(FOCUSABLE_SELECTOR);
            if (focusable.length > 0) {
                focusable[0].focus();
            }
        });
    }

    /**
     * Close the modal
     */
    close() {
        if (!this.element) return;

        // Hide modal
        this.element.setAttribute('aria-hidden', 'true');
        this.element.classList.remove('modal--visible');

        // Remove from stack
        const index = activeModals.indexOf(this);
        if (index > -1) {
            activeModals.splice(index, 1);
        }

        // Remove body class if no more modals
        if (activeModals.length === 0) {
            document.body.classList.remove('modal-open');
        }

        // Unbind keyboard handler
        document.removeEventListener('keydown', this.boundHandleKeydown);

        // Restore focus
        if (this.previouslyFocusedElement && this.previouslyFocusedElement.focus) {
            this.previouslyFocusedElement.focus();
        }

        // Callback
        if (this.onClose) {
            this.onClose();
        }
    }

    /**
     * Destroy the modal
     */
    destroy() {
        this.close();
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
    }

    /**
     * Handle keydown events
     * @param {KeyboardEvent} event
     */
    handleKeydown(event) {
        // Only handle if this is the top modal
        if (activeModals[activeModals.length - 1] !== this) return;

        if (event.key === 'Escape' && this.closeOnEscape) {
            event.preventDefault();
            this.close();
            return;
        }

        // Focus trap
        if (event.key === 'Tab') {
            this.trapFocus(event);
        }
    }

    /**
     * Trap focus within modal
     * @param {KeyboardEvent} event
     */
    trapFocus(event) {
        const focusable = this.element.querySelectorAll(FOCUSABLE_SELECTOR);
        if (focusable.length === 0) {
            event.preventDefault();
            return;
        }

        const firstFocusable = focusable[0];
        const lastFocusable = focusable[focusable.length - 1];

        if (event.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstFocusable) {
                event.preventDefault();
                lastFocusable.focus();
            }
        } else {
            // Tab
            if (document.activeElement === lastFocusable) {
                event.preventDefault();
                firstFocusable.focus();
            }
        }
    }
}

/**
 * Create and show a confirmation modal
 * @param {Object} options - Options
 * @param {string} options.title - Modal title
 * @param {string} options.message - Confirmation message
 * @param {string} options.confirmText - Confirm button text
 * @param {string} options.cancelText - Cancel button text
 * @param {string} options.confirmClass - Confirm button class
 * @returns {Promise<boolean>} Resolves true if confirmed, false if cancelled
 */
export function confirm(options = {}) {
    return new Promise((resolve) => {
        const modal = new Modal({
            title: options.title || 'Confirm',
            size: 'sm',
            onClose: () => resolve(false)
        });

        modal.create();

        // Message
        const message = createElement('p', {
            className: 'modal__message'
        }, options.message || 'Are you sure?');
        modal.setBody(message);

        // Buttons
        const cancelBtn = createElement('button', {
            className: 'btn btn--secondary',
            type: 'button'
        }, options.cancelText || 'Cancel');
        cancelBtn.addEventListener('click', () => {
            modal.destroy();
            resolve(false);
        });

        const confirmBtn = createElement('button', {
            className: options.confirmClass || 'btn btn--primary',
            type: 'button'
        }, options.confirmText || 'Confirm');
        confirmBtn.addEventListener('click', () => {
            modal.destroy();
            resolve(true);
        });

        modal.setFooter([cancelBtn, confirmBtn]);
        modal.open();
    });
}

/**
 * Create and show an alert modal
 * @param {Object} options - Options
 * @param {string} options.title - Modal title
 * @param {string} options.message - Alert message
 * @param {string} options.buttonText - Button text
 * @returns {Promise<void>} Resolves when closed
 */
export function alert(options = {}) {
    return new Promise((resolve) => {
        const modal = new Modal({
            title: options.title || 'Alert',
            size: 'sm',
            onClose: () => resolve()
        });

        modal.create();

        // Message
        const message = createElement('p', {
            className: 'modal__message'
        }, options.message || '');
        modal.setBody(message);

        // Button
        const okBtn = createElement('button', {
            className: 'btn btn--primary',
            type: 'button'
        }, options.buttonText || 'OK');
        okBtn.addEventListener('click', () => {
            modal.destroy();
            resolve();
        });

        modal.setFooter([okBtn]);
        modal.open();
    });
}

/**
 * Close all open modals
 */
export function closeAll() {
    [...activeModals].reverse().forEach(modal => modal.close());
}

/**
 * Get the currently active modal
 * @returns {Modal|null}
 */
export function getActiveModal() {
    return activeModals.length > 0 ? activeModals[activeModals.length - 1] : null;
}

export default Modal;
