/**
 * SITES Spectral - Toast Notifications (ES6 Module)
 *
 * Toast notification system for user feedback.
 * Uses safe DOM methods only - no innerHTML.
 *
 * @module components/toast
 * @version 13.15.0
 */

import { createElement } from '@core/security.js';

/**
 * Toast container element ID
 */
const TOAST_CONTAINER_ID = 'toast-container';

/**
 * Toast type icons
 */
const TOAST_ICONS = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle',
};

/**
 * Get or create toast container
 * @returns {HTMLElement} Toast container element
 */
function getContainer() {
    let container = document.getElementById(TOAST_CONTAINER_ID);
    if (!container) {
        container = createElement('div', {
            id: TOAST_CONTAINER_ID,
            className: 'toast-container'
        });
        document.body.appendChild(container);
    }
    return container;
}

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Duration in milliseconds (0 for persistent)
 * @returns {HTMLElement} Toast element
 */
export function showToast(message, type = 'info', duration = 5000) {
    const container = getContainer();

    // Create toast element
    const toast = createElement('div', {
        className: `toast toast--${type}`,
        role: 'alert',
        'aria-live': 'polite'
    });

    // Icon
    const icon = createElement('i', {
        className: `fas ${TOAST_ICONS[type] || TOAST_ICONS.info} toast__icon`
    });

    // Message
    const messageSpan = createElement('span', {
        className: 'toast__message'
    }, message);

    // Close button with icon created via DOM
    const closeBtn = createElement('button', {
        className: 'toast__close',
        type: 'button',
        'aria-label': 'Close notification'
    });
    const closeIcon = createElement('i', {
        className: 'fas fa-times'
    });
    closeBtn.appendChild(closeIcon);
    closeBtn.addEventListener('click', () => removeToast(toast));

    // Assemble toast
    toast.appendChild(icon);
    toast.appendChild(messageSpan);
    toast.appendChild(closeBtn);

    // Add to container
    container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
        toast.classList.add('toast--visible');
    });

    // Auto-remove after duration
    if (duration > 0) {
        setTimeout(() => removeToast(toast), duration);
    }

    return toast;
}

/**
 * Remove a toast notification
 * @param {HTMLElement} toast - Toast element to remove
 */
export function removeToast(toast) {
    if (!toast || !toast.parentNode) return;

    toast.classList.remove('toast--visible');
    toast.classList.add('toast--hiding');

    // Remove after animation
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 300);
}

/**
 * Clear all toast notifications
 */
export function clearAllToasts() {
    const container = document.getElementById(TOAST_CONTAINER_ID);
    if (container) {
        const toasts = container.querySelectorAll('.toast');
        toasts.forEach(toast => removeToast(toast));
    }
}

/**
 * Show success toast
 * @param {string} message - Message to display
 * @param {number} duration - Duration in milliseconds
 */
export function success(message, duration = 5000) {
    return showToast(message, 'success', duration);
}

/**
 * Show error toast
 * @param {string} message - Message to display
 * @param {number} duration - Duration in milliseconds
 */
export function error(message, duration = 8000) {
    return showToast(message, 'error', duration);
}

/**
 * Show warning toast
 * @param {string} message - Message to display
 * @param {number} duration - Duration in milliseconds
 */
export function warning(message, duration = 6000) {
    return showToast(message, 'warning', duration);
}

/**
 * Show info toast
 * @param {string} message - Message to display
 * @param {number} duration - Duration in milliseconds
 */
export function info(message, duration = 5000) {
    return showToast(message, 'info', duration);
}

/**
 * Toast namespace export
 */
export const Toast = {
    show: showToast,
    remove: removeToast,
    clearAll: clearAllToasts,
    success,
    error,
    warning,
    info,
};

export default Toast;
