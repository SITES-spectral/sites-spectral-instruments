/**
 * SITES Spectral - Security Utilities
 *
 * Centralized security utilities for XSS prevention and safe DOM manipulation.
 * This module consolidates duplicate escapeHtml functions across the codebase.
 *
 * @module core/security
 * @version 12.0.9
 */

(function(global) {
    'use strict';

    /**
     * Escape HTML to prevent XSS attacks
     * Uses textContent/innerHTML trick for proper escaping of all HTML entities.
     *
     * @param {string} text - Text to escape
     * @returns {string} Escaped text safe for HTML insertion
     * @example
     * escapeHtml('<script>alert("xss")</script>')
     * // Returns: '&lt;script&gt;alert("xss")&lt;/script&gt;'
     */
    function escapeHtml(text) {
        if (text === null || text === undefined) return '';
        if (typeof text !== 'string') text = String(text);
        if (!text) return '';

        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Sanitize URL to prevent javascript: protocol injection
     * Only allows http://, https://, and relative paths.
     *
     * @param {string} url - URL to sanitize
     * @returns {string} Sanitized URL or '/' if invalid
     * @example
     * sanitizeUrl('javascript:alert(1)') // Returns '/'
     * sanitizeUrl('/dashboard') // Returns '/dashboard'
     * sanitizeUrl('https://example.com') // Returns 'https://example.com'
     */
    function sanitizeUrl(url) {
        if (!url || typeof url !== 'string') return '/';

        const trimmed = url.trim();

        // Allow relative paths
        if (trimmed.startsWith('/')) {
            return trimmed;
        }

        // Allow http and https
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
            return trimmed;
        }

        // Reject everything else (javascript:, data:, etc.)
        return '/';
    }

    /**
     * Create a safe DOM element with textContent (XSS-safe)
     * Prevents XSS by using textContent instead of innerHTML for user content.
     *
     * @param {string} tag - HTML tag name
     * @param {Object} [attributes={}] - Element attributes
     * @param {string} [textContent=null] - Text content (safely escaped)
     * @returns {HTMLElement} Created element
     * @example
     * const div = createElement('div', { className: 'card' }, 'Hello World');
     */
    function createElement(tag, attributes = {}, textContent = null) {
        const el = document.createElement(tag);

        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                el.className = value;
            } else if (key === 'dataset') {
                Object.entries(value).forEach(([dataKey, dataValue]) => {
                    el.dataset[dataKey] = dataValue;
                });
            } else if (key.startsWith('on') && typeof value === 'function') {
                // Event handlers - use addEventListener
                el.addEventListener(key.slice(2).toLowerCase(), value);
            } else if (key === 'style' && typeof value === 'object') {
                // Style object
                Object.assign(el.style, value);
            } else {
                el.setAttribute(key, value);
            }
        });

        if (textContent !== null) {
            el.textContent = textContent; // Safe - auto-escapes
        }

        return el;
    }

    /**
     * Set element text content safely
     * Use this instead of innerHTML when displaying user content.
     *
     * @param {HTMLElement} element - Target element
     * @param {string} text - Text to set
     */
    function setTextContent(element, text) {
        if (element && typeof element.textContent !== 'undefined') {
            element.textContent = text || '';
        }
    }

    /**
     * Append text node to element (XSS-safe)
     *
     * @param {HTMLElement} parent - Parent element
     * @param {string} text - Text to append
     */
    function appendText(parent, text) {
        if (parent) {
            parent.appendChild(document.createTextNode(text || ''));
        }
    }

    /**
     * Create safe anchor element
     *
     * @param {string} href - URL (will be sanitized)
     * @param {string} text - Link text
     * @param {Object} [attributes={}] - Additional attributes
     * @returns {HTMLAnchorElement}
     */
    function createLink(href, text, attributes = {}) {
        const link = createElement('a', {
            href: sanitizeUrl(href),
            ...attributes
        }, text);
        return link;
    }

    // Export to global scope
    global.SitesSecurity = {
        escapeHtml,
        sanitizeUrl,
        createElement,
        setTextContent,
        appendText,
        createLink
    };

    // Also export individual functions for convenience
    global.escapeHtml = escapeHtml;
    global.sanitizeUrl = sanitizeUrl;
    global.safeCreateElement = createElement;

})(typeof window !== 'undefined' ? window : this);
