/**
 * Notifications Composable
 *
 * Provides toast notification functionality using daisyUI alerts.
 *
 * @module composables/useNotifications
 */

import { ref } from 'vue';

// Global notification state
const notifications = ref([]);
let notificationId = 0;

/**
 * Notification types with their styling
 */
const NOTIFICATION_STYLES = {
  success: 'alert-success',
  error: 'alert-error',
  warning: 'alert-warning',
  info: 'alert-info'
};

/**
 * Use notifications composable
 * @returns {Object} Notification methods and state
 */
export function useNotifications() {
  /**
   * Add a notification
   * @param {string} message - Notification message
   * @param {string} type - Notification type (success, error, warning, info)
   * @param {number} duration - Duration in ms (0 for persistent)
   * @returns {number} Notification ID
   */
  function notify(message, type = 'info', duration = 5000) {
    const id = ++notificationId;

    notifications.value.push({
      id,
      message,
      type,
      style: NOTIFICATION_STYLES[type] || NOTIFICATION_STYLES.info
    });

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        remove(id);
      }, duration);
    }

    return id;
  }

  /**
   * Show success notification
   * @param {string} message - Success message
   * @param {number} duration - Duration in ms
   */
  function success(message, duration = 5000) {
    return notify(message, 'success', duration);
  }

  /**
   * Show error notification
   * @param {string} message - Error message
   * @param {number} duration - Duration in ms
   */
  function error(message, duration = 8000) {
    return notify(message, 'error', duration);
  }

  /**
   * Show warning notification
   * @param {string} message - Warning message
   * @param {number} duration - Duration in ms
   */
  function warning(message, duration = 6000) {
    return notify(message, 'warning', duration);
  }

  /**
   * Show info notification
   * @param {string} message - Info message
   * @param {number} duration - Duration in ms
   */
  function info(message, duration = 5000) {
    return notify(message, 'info', duration);
  }

  /**
   * Remove a notification
   * @param {number} id - Notification ID
   */
  function remove(id) {
    const index = notifications.value.findIndex(n => n.id === id);
    if (index !== -1) {
      notifications.value.splice(index, 1);
    }
  }

  /**
   * Clear all notifications
   */
  function clearAll() {
    notifications.value = [];
  }

  return {
    notifications,
    notify,
    success,
    error,
    warning,
    info,
    remove,
    clearAll
  };
}

export default useNotifications;
