/**
 * CSRF Protection Tests
 * Tests for Cross-Site Request Forgery protection utilities
 */

import { describe, it, expect } from 'vitest';
import {
  validateRequestOrigin,
  generateCSRFToken,
  validateCSRFToken,
  requiresCSRFProtection,
  csrfProtect,
  createCSRFErrorResponse,
  addCSRFTokenToResponse
} from '../../src/utils/csrf.js';

// Helper to create mock request
function createMockRequest(options = {}) {
  const {
    method = 'GET',
    origin = null,
    referer = null,
    contentType = 'application/json',
    csrfToken = null,
    url = 'https://sites.jobelab.com/api/stations'
  } = options;

  return {
    method,
    url,
    headers: {
      get: (name) => {
        switch (name.toLowerCase()) {
          case 'origin': return origin;
          case 'referer': return referer;
          case 'content-type': return contentType;
          case 'x-csrf-token': return csrfToken;
          default: return null;
        }
      }
    }
  };
}

describe('CSRF Protection', () => {
  describe('validateRequestOrigin', () => {
    it('should validate allowed production origin', () => {
      const request = createMockRequest({ origin: 'https://sites.jobelab.com' });
      const result = validateRequestOrigin(request);

      expect(result.isValid).toBe(true);
      expect(result.origin).toBe('https://sites.jobelab.com');
      expect(result.source).toBe('origin');
    });

    it('should validate allowed workers.dev origin', () => {
      const request = createMockRequest({
        origin: 'https://sites-spectral-instruments.jose-e5f.workers.dev'
      });
      const result = validateRequestOrigin(request);

      expect(result.isValid).toBe(true);
    });

    it('should validate localhost development origin', () => {
      const request = createMockRequest({ origin: 'http://localhost:8787' });
      const result = validateRequestOrigin(request);

      expect(result.isValid).toBe(true);
    });

    it('should validate 127.0.0.1 development origin', () => {
      const request = createMockRequest({ origin: 'http://127.0.0.1:8787' });
      const result = validateRequestOrigin(request);

      expect(result.isValid).toBe(true);
    });

    it('should reject malicious origin', () => {
      const request = createMockRequest({ origin: 'https://evil-site.com' });
      const result = validateRequestOrigin(request);

      expect(result.isValid).toBe(false);
      expect(result.origin).toBe('https://evil-site.com');
    });

    it('should reject subdomain spoofing attempt', () => {
      const request = createMockRequest({
        origin: 'https://sites.jobelab.com.attacker.com'
      });
      const result = validateRequestOrigin(request);

      expect(result.isValid).toBe(false);
    });

    it('should fall back to referer when no origin header', () => {
      const request = createMockRequest({
        referer: 'https://sites.jobelab.com/dashboard'
      });
      const result = validateRequestOrigin(request);

      expect(result.isValid).toBe(true);
      expect(result.source).toBe('referer');
    });

    it('should reject invalid referer', () => {
      const request = createMockRequest({
        referer: 'https://malicious.com/page'
      });
      const result = validateRequestOrigin(request);

      expect(result.isValid).toBe(false);
    });

    it('should handle missing origin and referer gracefully', () => {
      const request = createMockRequest({});
      const result = validateRequestOrigin(request);

      // Lenient for same-origin requests
      expect(result.isValid).toBe(true);
      expect(result.source).toBe('none');
      expect(result.warning).toBe('No origin or referer header');
    });

    it('should handle malformed referer URL', () => {
      const request = createMockRequest({ referer: 'not-a-valid-url' });
      const result = validateRequestOrigin(request);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid referer URL');
    });
  });

  describe('generateCSRFToken', () => {
    it('should generate a 64-character hex string', () => {
      const token = generateCSRFToken();

      expect(token).toHaveLength(64);
      expect(token).toMatch(/^[0-9a-f]+$/);
    });

    it('should generate unique tokens', () => {
      const token1 = generateCSRFToken();
      const token2 = generateCSRFToken();

      expect(token1).not.toBe(token2);
    });

    it('should generate cryptographically random tokens', () => {
      // Generate multiple tokens and check for sufficient randomness
      const tokens = new Set();
      for (let i = 0; i < 100; i++) {
        tokens.add(generateCSRFToken());
      }

      // All tokens should be unique
      expect(tokens.size).toBe(100);
    });
  });

  describe('validateCSRFToken', () => {
    const expectedToken = 'valid-csrf-token-12345';

    it('should validate token from X-CSRF-Token header', () => {
      const request = createMockRequest({ csrfToken: expectedToken });

      expect(validateCSRFToken(request, expectedToken)).toBe(true);
    });

    it('should reject mismatched token', () => {
      const request = createMockRequest({ csrfToken: 'wrong-token' });

      expect(validateCSRFToken(request, expectedToken)).toBe(false);
    });

    it('should reject missing token', () => {
      const request = createMockRequest({});

      expect(validateCSRFToken(request, expectedToken)).toBe(false);
    });

    it('should reject when expected token is empty', () => {
      const request = createMockRequest({ csrfToken: 'some-token' });

      expect(validateCSRFToken(request, '')).toBe(false);
      expect(validateCSRFToken(request, null)).toBe(false);
    });

    it('should validate token from query parameter', () => {
      const request = {
        url: `https://sites.jobelab.com/api/test?_csrf=${expectedToken}`,
        headers: { get: () => null }
      };

      expect(validateCSRFToken(request, expectedToken)).toBe(true);
    });
  });

  describe('requiresCSRFProtection', () => {
    it('should require protection for POST', () => {
      expect(requiresCSRFProtection('POST')).toBe(true);
    });

    it('should require protection for PUT', () => {
      expect(requiresCSRFProtection('PUT')).toBe(true);
    });

    it('should require protection for PATCH', () => {
      expect(requiresCSRFProtection('PATCH')).toBe(true);
    });

    it('should require protection for DELETE', () => {
      expect(requiresCSRFProtection('DELETE')).toBe(true);
    });

    it('should NOT require protection for GET', () => {
      expect(requiresCSRFProtection('GET')).toBe(false);
    });

    it('should NOT require protection for HEAD', () => {
      expect(requiresCSRFProtection('HEAD')).toBe(false);
    });

    it('should NOT require protection for OPTIONS', () => {
      expect(requiresCSRFProtection('OPTIONS')).toBe(false);
    });

    it('should handle lowercase methods', () => {
      expect(requiresCSRFProtection('post')).toBe(true);
      expect(requiresCSRFProtection('get')).toBe(false);
    });
  });

  describe('csrfProtect', () => {
    describe('Safe methods', () => {
      it('should allow GET requests without origin check', () => {
        const request = createMockRequest({ method: 'GET' });
        const result = csrfProtect(request);

        expect(result.isValid).toBe(true);
      });

      it('should allow OPTIONS requests without origin check', () => {
        const request = createMockRequest({ method: 'OPTIONS' });
        const result = csrfProtect(request);

        expect(result.isValid).toBe(true);
      });
    });

    describe('State-changing methods', () => {
      it('should allow POST with valid origin', () => {
        const request = createMockRequest({
          method: 'POST',
          origin: 'https://sites.jobelab.com'
        });
        const result = csrfProtect(request);

        expect(result.isValid).toBe(true);
      });

      it('should block POST with invalid origin', () => {
        const request = createMockRequest({
          method: 'POST',
          origin: 'https://evil.com'
        });
        const result = csrfProtect(request);

        expect(result.isValid).toBe(false);
        expect(result.status).toBe(403);
        expect(result.error).toContain('Invalid origin');
      });

      it('should allow DELETE with valid origin', () => {
        const request = createMockRequest({
          method: 'DELETE',
          origin: 'https://sites.jobelab.com'
        });
        const result = csrfProtect(request);

        expect(result.isValid).toBe(true);
      });
    });

    describe('Form submission protection', () => {
      it('should block form-urlencoded without origin', () => {
        const request = createMockRequest({
          method: 'POST',
          contentType: 'application/x-www-form-urlencoded'
          // No origin header
        });
        const result = csrfProtect(request);

        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Form submissions require Origin header');
      });

      it('should block multipart/form-data without origin', () => {
        const request = createMockRequest({
          method: 'POST',
          contentType: 'multipart/form-data; boundary=----'
          // No origin header
        });
        const result = csrfProtect(request);

        expect(result.isValid).toBe(false);
      });

      it('should allow form submission with valid origin', () => {
        const request = createMockRequest({
          method: 'POST',
          origin: 'https://sites.jobelab.com',
          contentType: 'application/x-www-form-urlencoded'
        });
        const result = csrfProtect(request);

        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('createCSRFErrorResponse', () => {
    it('should return 403 status', () => {
      const response = createCSRFErrorResponse();

      expect(response.status).toBe(403);
    });

    it('should return JSON error', async () => {
      const response = createCSRFErrorResponse('Custom error message');
      const body = await response.json();

      expect(body.error).toBe('Custom error message');
      expect(body.code).toBe('CSRF_VALIDATION_FAILED');
    });

    it('should set JSON content type', () => {
      const response = createCSRFErrorResponse();

      expect(response.headers.get('Content-Type')).toBe('application/json');
    });
  });

  describe('addCSRFTokenToResponse', () => {
    it('should add X-CSRF-Token header to response', () => {
      const originalResponse = new Response('test', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });

      const newResponse = addCSRFTokenToResponse(originalResponse, 'new-csrf-token');

      expect(newResponse.headers.get('X-CSRF-Token')).toBe('new-csrf-token');
    });

    it('should preserve original response status', () => {
      const originalResponse = new Response('test', { status: 201 });

      const newResponse = addCSRFTokenToResponse(originalResponse, 'token');

      expect(newResponse.status).toBe(201);
    });

    it('should preserve original headers', () => {
      const originalResponse = new Response('test', {
        headers: { 'X-Custom-Header': 'custom-value' }
      });

      const newResponse = addCSRFTokenToResponse(originalResponse, 'token');

      expect(newResponse.headers.get('X-Custom-Header')).toBe('custom-value');
    });
  });

  describe('Security Scenarios', () => {
    it('should protect against cross-site POST attack', () => {
      const request = createMockRequest({
        method: 'POST',
        origin: 'https://attacker-controlled-site.com',
        contentType: 'application/json'
      });
      const result = csrfProtect(request);

      expect(result.isValid).toBe(false);
    });

    it('should protect against form-based CSRF attack', () => {
      const request = createMockRequest({
        method: 'POST',
        // Attacker submits form from their site
        origin: 'https://attacker.com',
        contentType: 'application/x-www-form-urlencoded'
      });
      const result = csrfProtect(request);

      expect(result.isValid).toBe(false);
    });

    it('should protect against DELETE attack from different origin', () => {
      const request = createMockRequest({
        method: 'DELETE',
        origin: 'https://delete-your-data.com'
      });
      const result = csrfProtect(request);

      expect(result.isValid).toBe(false);
    });

    it('should allow legitimate API calls from frontend', () => {
      const request = createMockRequest({
        method: 'POST',
        origin: 'https://sites.jobelab.com',
        contentType: 'application/json'
      });
      const result = csrfProtect(request);

      expect(result.isValid).toBe(true);
    });
  });
});
