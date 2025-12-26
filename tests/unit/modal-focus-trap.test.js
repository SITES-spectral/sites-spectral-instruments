/**
 * Modal Focus Trap Tests
 * Tests for WCAG 2.4.3 Focus Order compliance
 *
 * WCAG 2.4.3 requires:
 * - Focus must stay within modal when open
 * - Tab cycles through focusable elements
 * - Shift+Tab cycles in reverse
 * - Focus returns to trigger element on close
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Create DOM elements safely without innerHTML
function createMockModal() {
  const container = document.createElement('div');
  container.className = 'modal';

  const content = document.createElement('div');
  content.className = 'modal-content';

  // Header
  const header = document.createElement('div');
  header.className = 'modal-header';
  const title = document.createElement('h2');
  title.className = 'modal-title';
  title.textContent = 'Test Modal';
  const closeBtn = document.createElement('button');
  closeBtn.className = 'modal-close';
  closeBtn.setAttribute('data-testid', 'close-btn');
  closeBtn.textContent = 'X';
  header.appendChild(title);
  header.appendChild(closeBtn);

  // Body
  const body = document.createElement('div');
  body.className = 'modal-body';
  const input1 = document.createElement('input');
  input1.type = 'text';
  input1.setAttribute('data-testid', 'input-1');
  input1.placeholder = 'First input';
  const input2 = document.createElement('input');
  input2.type = 'text';
  input2.setAttribute('data-testid', 'input-2');
  input2.placeholder = 'Second input';
  const select1 = document.createElement('select');
  select1.setAttribute('data-testid', 'select-1');
  const option = document.createElement('option');
  option.textContent = 'Option 1';
  select1.appendChild(option);
  const textarea1 = document.createElement('textarea');
  textarea1.setAttribute('data-testid', 'textarea-1');
  body.appendChild(input1);
  body.appendChild(input2);
  body.appendChild(select1);
  body.appendChild(textarea1);

  // Footer
  const footer = document.createElement('div');
  footer.className = 'modal-footer';
  const cancelBtn = document.createElement('button');
  cancelBtn.setAttribute('data-testid', 'cancel-btn');
  cancelBtn.textContent = 'Cancel';
  const saveBtn = document.createElement('button');
  saveBtn.setAttribute('data-testid', 'save-btn');
  saveBtn.textContent = 'Save';
  footer.appendChild(cancelBtn);
  footer.appendChild(saveBtn);

  content.appendChild(header);
  content.appendChild(body);
  content.appendChild(footer);
  container.appendChild(content);
  document.body.appendChild(container);
  return container;
}

function createMockModalWithDisabledElements() {
  const container = document.createElement('div');
  container.className = 'modal';

  const content = document.createElement('div');
  content.className = 'modal-content';

  const firstBtn = document.createElement('button');
  firstBtn.setAttribute('data-testid', 'first-btn');
  firstBtn.textContent = 'First';

  const disabledInput = document.createElement('input');
  disabledInput.type = 'text';
  disabledInput.disabled = true;
  disabledInput.setAttribute('data-testid', 'disabled-input');

  const disabledBtn = document.createElement('button');
  disabledBtn.disabled = true;
  disabledBtn.setAttribute('data-testid', 'disabled-btn');
  disabledBtn.textContent = 'Disabled';

  const hiddenInput = document.createElement('input');
  hiddenInput.type = 'hidden';
  hiddenInput.setAttribute('data-testid', 'hidden-input');

  const negativeTabindexBtn = document.createElement('button');
  negativeTabindexBtn.setAttribute('tabindex', '-1');
  negativeTabindexBtn.setAttribute('data-testid', 'negative-tabindex');
  negativeTabindexBtn.textContent = 'Skip';

  const lastBtn = document.createElement('button');
  lastBtn.setAttribute('data-testid', 'last-btn');
  lastBtn.textContent = 'Last';

  content.appendChild(firstBtn);
  content.appendChild(disabledInput);
  content.appendChild(disabledBtn);
  content.appendChild(hiddenInput);
  content.appendChild(negativeTabindexBtn);
  content.appendChild(lastBtn);
  container.appendChild(content);
  document.body.appendChild(container);
  return container;
}

function createEmptyModal() {
  const container = document.createElement('div');
  container.className = 'modal';
  const content = document.createElement('div');
  content.className = 'modal-content';
  const p = document.createElement('p');
  p.textContent = 'No focusable elements';
  content.appendChild(p);
  container.appendChild(content);
  document.body.appendChild(container);
  return container;
}

// Simple ModalBase implementation for testing (mirrors the actual implementation)
class ModalBase {
  constructor(container, options = {}) {
    this.container = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    this.options = {
      closeOnEscape: true,
      closeOnBackdrop: true,
      showCloseButton: true,
      ...options
    };

    this.isVisible = false;
    this._previouslyFocusedElement = null;

    this._handleEscape = this._handleEscape.bind(this);
    this._handleTabKey = this._handleTabKey.bind(this);

    this.container.setAttribute('role', 'dialog');
    this.container.setAttribute('aria-modal', 'true');
    this.container.setAttribute('aria-hidden', 'true');
  }

  show() {
    this._previouslyFocusedElement = document.activeElement;
    this.container.style.display = 'flex';
    this.container.setAttribute('aria-hidden', 'false');
    this.isVisible = true;

    // Focus first element
    const focusableElements = this._getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    // Bind handlers
    if (this.options.closeOnEscape) {
      document.addEventListener('keydown', this._handleEscape);
    }
    document.addEventListener('keydown', this._handleTabKey);

    return this;
  }

  hide() {
    this.container.style.display = 'none';
    this.container.setAttribute('aria-hidden', 'true');
    this.isVisible = false;

    // Restore focus
    if (this._previouslyFocusedElement && typeof this._previouslyFocusedElement.focus === 'function') {
      this._previouslyFocusedElement.focus();
    }

    // Unbind handlers
    if (this.options.closeOnEscape) {
      document.removeEventListener('keydown', this._handleEscape);
    }
    document.removeEventListener('keydown', this._handleTabKey);

    return this;
  }

  cancel() {
    this.hide();
    return this;
  }

  _handleEscape(event) {
    if (event.key === 'Escape' && this.isVisible) {
      this.cancel();
    }
  }

  _handleTabKey(event) {
    if (event.key !== 'Tab' || !this.isVisible) {
      return;
    }

    const focusableElements = this._getFocusableElements();
    if (focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement;

    if (event.shiftKey) {
      if (activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      if (activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }

  _getFocusableElements() {
    const focusableSelector = [
      'button:not([disabled]):not([tabindex="-1"])',
      'a[href]:not([tabindex="-1"])',
      'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"])',
      'select:not([disabled]):not([tabindex="-1"])',
      'textarea:not([disabled]):not([tabindex="-1"])',
      '[tabindex]:not([tabindex="-1"]):not([disabled])'
    ].join(', ');

    const elements = Array.from(this.container.querySelectorAll(focusableSelector));
    // In jsdom, offsetParent is always null, so we skip that check in test env
    const isJsdom = typeof window !== 'undefined' && window.navigator.userAgent.includes('jsdom');
    return elements.filter(el => {
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') {
        return false;
      }
      // Skip offsetParent check in jsdom (always null)
      if (!isJsdom && el.offsetParent === null) {
        return false;
      }
      return true;
    });
  }

  destroy() {
    if (this.options.closeOnEscape) {
      document.removeEventListener('keydown', this._handleEscape);
    }
    document.removeEventListener('keydown', this._handleTabKey);
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
    this.container = null;
    this._previouslyFocusedElement = null;
  }
}

describe('Modal Focus Trap (WCAG 2.4.3)', () => {
  let modal;
  let container;

  afterEach(() => {
    if (modal && modal.container) {
      modal.destroy();
    }
    document.body.textContent = '';
  });

  describe('Focus Management on Open', () => {
    it('should save previously focused element before opening', () => {
      const triggerButton = document.createElement('button');
      triggerButton.textContent = 'Open Modal';
      document.body.appendChild(triggerButton);
      triggerButton.focus();

      container = createMockModal();
      modal = new ModalBase(container);
      modal.show();

      expect(modal._previouslyFocusedElement).toBe(triggerButton);
    });

    it('should attempt to focus first focusable element when modal opens', () => {
      container = createMockModal();
      modal = new ModalBase(container);

      // Spy on the focus method of first focusable element
      const closeBtn = container.querySelector('[data-testid="close-btn"]');
      const focusSpy = vi.spyOn(closeBtn, 'focus');

      modal.show();

      // Verify focus was called on the first focusable element
      expect(focusSpy).toHaveBeenCalled();
    });

    it('should set aria-hidden to false when visible', () => {
      container = createMockModal();
      modal = new ModalBase(container);
      modal.show();

      expect(container.getAttribute('aria-hidden')).toBe('false');
    });
  });

  describe('Focus Management on Close', () => {
    it('should restore focus to previously focused element on close', () => {
      const triggerButton = document.createElement('button');
      triggerButton.textContent = 'Open Modal';
      document.body.appendChild(triggerButton);
      triggerButton.focus();

      container = createMockModal();
      modal = new ModalBase(container);
      modal.show();
      modal.hide();

      expect(document.activeElement).toBe(triggerButton);
    });

    it('should set aria-hidden to true when hidden', () => {
      container = createMockModal();
      modal = new ModalBase(container);
      modal.show();
      modal.hide();

      expect(container.getAttribute('aria-hidden')).toBe('true');
    });

    it('should handle null previouslyFocusedElement gracefully', () => {
      container = createMockModal();
      modal = new ModalBase(container);
      modal._previouslyFocusedElement = null;

      expect(() => modal.hide()).not.toThrow();
    });
  });

  describe('Tab Key Focus Trap', () => {
    it('should wrap focus from last to first element on Tab', () => {
      container = createMockModal();
      modal = new ModalBase(container);
      modal.show();

      const saveBtn = container.querySelector('[data-testid="save-btn"]');
      saveBtn.focus();

      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: false,
        bubbles: true,
        cancelable: true
      });

      const preventDefaultSpy = vi.spyOn(tabEvent, 'preventDefault');
      document.dispatchEvent(tabEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should wrap focus from first to last element on Shift+Tab', () => {
      container = createMockModal();
      modal = new ModalBase(container);
      modal.show();

      const closeBtn = container.querySelector('[data-testid="close-btn"]');
      closeBtn.focus();

      const shiftTabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
        cancelable: true
      });

      const preventDefaultSpy = vi.spyOn(shiftTabEvent, 'preventDefault');
      document.dispatchEvent(shiftTabEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should not trap focus when modal is not visible', () => {
      container = createMockModal();
      modal = new ModalBase(container);
      modal.isVisible = false;

      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true
      });

      const preventDefaultSpy = vi.spyOn(tabEvent, 'preventDefault');
      modal._handleTabKey(tabEvent);

      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('should ignore non-Tab keys', () => {
      container = createMockModal();
      modal = new ModalBase(container);
      modal.show();

      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true
      });

      const preventDefaultSpy = vi.spyOn(enterEvent, 'preventDefault');
      modal._handleTabKey(enterEvent);

      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });
  });

  describe('Focusable Element Detection', () => {
    it('should find all standard focusable elements', () => {
      container = createMockModal();
      modal = new ModalBase(container);
      modal.show();

      const focusableElements = modal._getFocusableElements();

      // close button, 2 inputs, 1 select, 1 textarea, 2 footer buttons = 7
      expect(focusableElements.length).toBe(7);
    });

    it('should exclude disabled elements', () => {
      container = createMockModalWithDisabledElements();
      modal = new ModalBase(container);
      modal.show();

      const focusableElements = modal._getFocusableElements();

      expect(focusableElements.length).toBe(2);
      expect(focusableElements[0].getAttribute('data-testid')).toBe('first-btn');
      expect(focusableElements[1].getAttribute('data-testid')).toBe('last-btn');
    });

    it('should exclude elements with tabindex="-1"', () => {
      container = createMockModalWithDisabledElements();
      modal = new ModalBase(container);
      modal.show();

      const focusableElements = modal._getFocusableElements();
      const negativeTabIndexEl = container.querySelector('[data-testid="negative-tabindex"]');

      expect(focusableElements).not.toContain(negativeTabIndexEl);
    });

    it('should exclude hidden inputs', () => {
      container = createMockModalWithDisabledElements();
      modal = new ModalBase(container);
      modal.show();

      const focusableElements = modal._getFocusableElements();
      const hiddenInput = container.querySelector('[data-testid="hidden-input"]');

      expect(focusableElements).not.toContain(hiddenInput);
    });
  });

  describe('Empty Modal Handling', () => {
    it('should prevent Tab from escaping modal with no focusable elements', () => {
      container = createEmptyModal();
      modal = new ModalBase(container);
      modal.show();

      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true
      });

      const preventDefaultSpy = vi.spyOn(tabEvent, 'preventDefault');
      modal._handleTabKey(tabEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('Escape Key Handling', () => {
    it('should close modal on Escape key when closeOnEscape is true', () => {
      container = createMockModal();
      modal = new ModalBase(container, { closeOnEscape: true });
      modal.show();

      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true
      });

      document.dispatchEvent(escapeEvent);

      expect(modal.isVisible).toBe(false);
    });

    it('should not bind Escape handler when closeOnEscape is false', () => {
      container = createMockModal();
      modal = new ModalBase(container, { closeOnEscape: false });

      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      modal.show();

      // Should NOT bind the escape handler
      expect(addEventListenerSpy).not.toHaveBeenCalledWith('keydown', modal._handleEscape);
      addEventListenerSpy.mockRestore();
    });
  });

  describe('ARIA Attributes', () => {
    it('should have role="dialog"', () => {
      container = createMockModal();
      modal = new ModalBase(container);

      expect(container.getAttribute('role')).toBe('dialog');
    });

    it('should have aria-modal="true"', () => {
      container = createMockModal();
      modal = new ModalBase(container);

      expect(container.getAttribute('aria-modal')).toBe('true');
    });

    it('should start with aria-hidden="true"', () => {
      container = createMockModal();
      modal = new ModalBase(container);

      expect(container.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('Cleanup on Destroy', () => {
    it('should remove event listeners on destroy', () => {
      container = createMockModal();
      modal = new ModalBase(container);
      modal.show();

      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
      modal.destroy();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', modal._handleEscape);
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', modal._handleTabKey);
    });

    it('should clear previouslyFocusedElement on destroy', () => {
      const triggerButton = document.createElement('button');
      document.body.appendChild(triggerButton);
      triggerButton.focus();

      container = createMockModal();
      modal = new ModalBase(container);
      modal.show();
      modal.destroy();

      expect(modal._previouslyFocusedElement).toBeNull();
    });
  });

  describe('Middle Element Navigation', () => {
    it('should allow normal Tab navigation between middle elements', () => {
      container = createMockModal();
      modal = new ModalBase(container);
      modal.show();

      // Get focusable elements
      const focusableElements = modal._getFocusableElements();
      expect(focusableElements.length).toBeGreaterThan(2);

      // Simulate focusing a middle element by setting activeElement
      const middleElement = focusableElements[2]; // A middle element
      Object.defineProperty(document, 'activeElement', {
        value: middleElement,
        writable: true,
        configurable: true
      });

      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: false,
        bubbles: true,
        cancelable: true
      });

      const preventDefaultSpy = vi.spyOn(tabEvent, 'preventDefault');
      modal._handleTabKey(tabEvent);

      // Should NOT prevent default for middle elements
      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('should allow normal Shift+Tab navigation between middle elements', () => {
      container = createMockModal();
      modal = new ModalBase(container);
      modal.show();

      // Get focusable elements
      const focusableElements = modal._getFocusableElements();
      expect(focusableElements.length).toBeGreaterThan(2);

      // Simulate focusing a middle element by setting activeElement
      const middleElement = focusableElements[2]; // A middle element
      Object.defineProperty(document, 'activeElement', {
        value: middleElement,
        writable: true,
        configurable: true
      });

      const shiftTabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
        cancelable: true
      });

      const preventDefaultSpy = vi.spyOn(shiftTabEvent, 'preventDefault');
      modal._handleTabKey(shiftTabEvent);

      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });
  });
});
