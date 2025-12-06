/**
 * Tests for useNotifications composable
 *
 * Tests notification creation, removal, and auto-dismiss.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useNotifications } from '@composables/useNotifications';

describe('useNotifications', () => {
  let notifications;

  beforeEach(() => {
    // Get fresh composable instance
    notifications = useNotifications();
    // Clear any existing notifications
    notifications.clearAll();
    // Use fake timers
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('notify', () => {
    it('should add a notification', () => {
      const id = notifications.notify('Test message', 'info', 0);
      expect(id).toBeGreaterThan(0);
      expect(notifications.notifications.value).toHaveLength(1);
      expect(notifications.notifications.value[0].message).toBe('Test message');
    });

    it('should set correct type and style', () => {
      notifications.notify('Test', 'success', 0);
      const notification = notifications.notifications.value[0];
      expect(notification.type).toBe('success');
      expect(notification.style).toBe('alert-success');
    });

    it('should auto-remove after duration', () => {
      notifications.notify('Auto remove', 'info', 1000);
      expect(notifications.notifications.value).toHaveLength(1);

      vi.advanceTimersByTime(1000);
      expect(notifications.notifications.value).toHaveLength(0);
    });

    it('should not auto-remove with duration 0', () => {
      notifications.notify('Persistent', 'info', 0);
      expect(notifications.notifications.value).toHaveLength(1);

      vi.advanceTimersByTime(10000);
      expect(notifications.notifications.value).toHaveLength(1);
    });
  });

  describe('success', () => {
    it('should create success notification', () => {
      notifications.success('Success!', 0);
      const notification = notifications.notifications.value[0];
      expect(notification.type).toBe('success');
      expect(notification.style).toBe('alert-success');
      expect(notification.message).toBe('Success!');
    });

    it('should auto-remove after 5 seconds by default', () => {
      notifications.success('Success!');
      expect(notifications.notifications.value).toHaveLength(1);

      vi.advanceTimersByTime(5000);
      expect(notifications.notifications.value).toHaveLength(0);
    });
  });

  describe('error', () => {
    it('should create error notification', () => {
      notifications.error('Error!', 0);
      const notification = notifications.notifications.value[0];
      expect(notification.type).toBe('error');
      expect(notification.style).toBe('alert-error');
    });

    it('should auto-remove after 8 seconds by default', () => {
      notifications.error('Error!');
      expect(notifications.notifications.value).toHaveLength(1);

      vi.advanceTimersByTime(8000);
      expect(notifications.notifications.value).toHaveLength(0);
    });
  });

  describe('warning', () => {
    it('should create warning notification', () => {
      notifications.warning('Warning!', 0);
      const notification = notifications.notifications.value[0];
      expect(notification.type).toBe('warning');
      expect(notification.style).toBe('alert-warning');
    });
  });

  describe('info', () => {
    it('should create info notification', () => {
      notifications.info('Info!', 0);
      const notification = notifications.notifications.value[0];
      expect(notification.type).toBe('info');
      expect(notification.style).toBe('alert-info');
    });
  });

  describe('remove', () => {
    it('should remove notification by id', () => {
      const id1 = notifications.notify('First', 'info', 0);
      const id2 = notifications.notify('Second', 'info', 0);
      expect(notifications.notifications.value).toHaveLength(2);

      notifications.remove(id1);
      expect(notifications.notifications.value).toHaveLength(1);
      expect(notifications.notifications.value[0].id).toBe(id2);
    });

    it('should handle removing non-existent id', () => {
      notifications.notify('Test', 'info', 0);
      expect(notifications.notifications.value).toHaveLength(1);

      notifications.remove(999);
      expect(notifications.notifications.value).toHaveLength(1);
    });
  });

  describe('clearAll', () => {
    it('should remove all notifications', () => {
      notifications.notify('First', 'info', 0);
      notifications.notify('Second', 'info', 0);
      notifications.notify('Third', 'info', 0);
      expect(notifications.notifications.value).toHaveLength(3);

      notifications.clearAll();
      expect(notifications.notifications.value).toHaveLength(0);
    });
  });

  describe('multiple notifications', () => {
    it('should handle multiple concurrent notifications', () => {
      notifications.success('Success', 0);
      notifications.error('Error', 0);
      notifications.warning('Warning', 0);
      notifications.info('Info', 0);

      expect(notifications.notifications.value).toHaveLength(4);

      const types = notifications.notifications.value.map(n => n.type);
      expect(types).toContain('success');
      expect(types).toContain('error');
      expect(types).toContain('warning');
      expect(types).toContain('info');
    });

    it('should assign unique IDs', () => {
      const id1 = notifications.notify('First', 'info', 0);
      const id2 = notifications.notify('Second', 'info', 0);
      const id3 = notifications.notify('Third', 'info', 0);

      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });
  });
});
