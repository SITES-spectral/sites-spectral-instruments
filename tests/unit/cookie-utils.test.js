/**
 * Cookie Utilities Tests
 * Tests for httpOnly cookie handling in JWT authentication
 */

import { describe, it, expect } from 'vitest';
import {
  createAuthCookie,
  createLogoutCookie,
  getTokenFromCookie,
  getCookieName
} from '../../src/auth/cookie-utils.js';

// Helper to create mock request
function createMockRequest(options = {}) {
  const { hostname = 'localhost', protocol = 'http:', cookies = '' } = options;
  return {
    url: `${protocol}//${hostname}/api/auth/login`,
    headers: {
      get: (name) => {
        if (name === 'Cookie') return cookies;
        return null;
      }
    }
  };
}

describe('Cookie Utilities', () => {
  describe('getCookieName', () => {
    it('should return the expected cookie name', () => {
      expect(getCookieName()).toBe('sites_spectral_auth');
    });
  });

  describe('createAuthCookie', () => {
    it('should create cookie with httpOnly flag', () => {
      const request = createMockRequest();
      const cookie = createAuthCookie('test-token', request);

      expect(cookie).toContain('HttpOnly');
    });

    it('should create cookie with SameSite=Lax for cross-subdomain auth', () => {
      // v15.0.0: Changed from Strict to Lax to support cross-subdomain authentication
      // (e.g., admin.sitesspectral.work, svartberget.sitesspectral.work)
      const request = createMockRequest();
      const cookie = createAuthCookie('test-token', request);

      expect(cookie).toContain('SameSite=Lax');
    });

    it('should create cookie with Path=/', () => {
      const request = createMockRequest();
      const cookie = createAuthCookie('test-token', request);

      expect(cookie).toContain('Path=/');
    });

    it('should create cookie with Max-Age=86400 (24 hours)', () => {
      const request = createMockRequest();
      const cookie = createAuthCookie('test-token', request);

      expect(cookie).toContain('Max-Age=86400');
    });

    it('should include token in cookie value', () => {
      const request = createMockRequest();
      const cookie = createAuthCookie('my-jwt-token-123', request);

      expect(cookie).toContain('sites_spectral_auth=my-jwt-token-123');
    });

    it('should NOT include Secure flag for localhost', () => {
      const request = createMockRequest({ hostname: 'localhost' });
      const cookie = createAuthCookie('test-token', request);

      expect(cookie).not.toContain('Secure');
    });

    it('should NOT include Secure flag for 127.0.0.1', () => {
      const request = createMockRequest({ hostname: '127.0.0.1' });
      const cookie = createAuthCookie('test-token', request);

      expect(cookie).not.toContain('Secure');
    });

    it('should include Secure flag for production domain', () => {
      const request = createMockRequest({ hostname: 'sites.jobelab.com', protocol: 'https:' });
      const cookie = createAuthCookie('test-token', request);

      expect(cookie).toContain('Secure');
    });

    it('should include Secure flag for workers.dev domain', () => {
      const request = createMockRequest({
        hostname: 'sites-spectral-instruments.jose-e5f.workers.dev',
        protocol: 'https:'
      });
      const cookie = createAuthCookie('test-token', request);

      expect(cookie).toContain('Secure');
    });
  });

  describe('createLogoutCookie', () => {
    it('should create cookie with empty value', () => {
      const request = createMockRequest();
      const cookie = createLogoutCookie(request);

      expect(cookie).toContain('sites_spectral_auth=');
      expect(cookie).not.toContain('sites_spectral_auth=test');
    });

    it('should create cookie with Max-Age=0', () => {
      const request = createMockRequest();
      const cookie = createLogoutCookie(request);

      expect(cookie).toContain('Max-Age=0');
    });

    it('should create cookie with Expires in the past', () => {
      const request = createMockRequest();
      const cookie = createLogoutCookie(request);

      expect(cookie).toContain('Expires=Thu, 01 Jan 1970 00:00:00 GMT');
    });

    it('should include httpOnly flag', () => {
      const request = createMockRequest();
      const cookie = createLogoutCookie(request);

      expect(cookie).toContain('HttpOnly');
    });

    it('should include SameSite=Lax for cross-subdomain auth', () => {
      // v15.0.0: Changed from Strict to Lax to support cross-subdomain authentication
      const request = createMockRequest();
      const cookie = createLogoutCookie(request);

      expect(cookie).toContain('SameSite=Lax');
    });
  });

  describe('getTokenFromCookie', () => {
    it('should return null when no Cookie header', () => {
      const request = createMockRequest();
      const token = getTokenFromCookie(request);

      expect(token).toBeNull();
    });

    it('should return null when cookie header is empty', () => {
      const request = createMockRequest({ cookies: '' });
      const token = getTokenFromCookie(request);

      expect(token).toBeNull();
    });

    it('should extract token from cookie header', () => {
      const request = createMockRequest({
        cookies: 'sites_spectral_auth=my-jwt-token'
      });
      const token = getTokenFromCookie(request);

      expect(token).toBe('my-jwt-token');
    });

    it('should extract token when multiple cookies present', () => {
      const request = createMockRequest({
        cookies: 'other_cookie=value; sites_spectral_auth=my-jwt-token; another=test'
      });
      const token = getTokenFromCookie(request);

      expect(token).toBe('my-jwt-token');
    });

    it('should return null when auth cookie not present', () => {
      const request = createMockRequest({
        cookies: 'other_cookie=value; another=test'
      });
      const token = getTokenFromCookie(request);

      expect(token).toBeNull();
    });

    it('should handle cookies with equals in value', () => {
      // JWTs contain = characters
      const jwtLikeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      const request = createMockRequest({
        cookies: `sites_spectral_auth=${jwtLikeToken}`
      });
      const token = getTokenFromCookie(request);

      expect(token).toBe(jwtLikeToken);
    });

    it('should handle whitespace in cookie string', () => {
      const request = createMockRequest({
        cookies: '  sites_spectral_auth=token-value  ; other=value  '
      });
      const token = getTokenFromCookie(request);

      expect(token).toBe('token-value');
    });
  });

  describe('Security Properties', () => {
    it('should never expose token in non-httpOnly cookie', () => {
      const request = createMockRequest();
      const cookie = createAuthCookie('secret-token', request);

      // HttpOnly must be present - no exceptions
      expect(cookie).toContain('HttpOnly');
    });

    it('should use SameSite=Lax for cross-subdomain CSRF protection', () => {
      // v15.0.0: SameSite=Lax is required for cross-subdomain authentication
      // CSRF protection is maintained via Origin/Referer header validation
      // in src/utils/csrf.js (SEC-001 audit compliance)
      const request = createMockRequest();
      const cookie = createAuthCookie('token', request);

      // Must be Lax for cross-subdomain auth, not Strict or None
      expect(cookie).toContain('SameSite=Lax');
      expect(cookie).not.toContain('SameSite=Strict');
      expect(cookie).not.toContain('SameSite=None');
    });

    it('should set appropriate Max-Age (24 hours)', () => {
      const request = createMockRequest();
      const cookie = createAuthCookie('token', request);

      // 86400 seconds = 24 hours
      expect(cookie).toContain('Max-Age=86400');
    });
  });
});
