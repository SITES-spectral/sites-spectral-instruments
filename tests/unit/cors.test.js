/**
 * CORS Origin Validation Tests
 * Tests for the security fix that restricts CORS to allowed origins only
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createCors,
  validateCorsOrigin,
  createCorsErrorResponse,
  ALLOWED_ORIGINS,
  isAllowedOrigin,
  getAllowedOrigin
} from '../../src/cors.js';

describe('CORS Origin Validation', () => {
  describe('ALLOWED_ORIGINS', () => {
    it('should include production URL', () => {
      expect(ALLOWED_ORIGINS).toContain('https://sites.jobelab.com');
    });

    it('should include Cloudflare Workers URL', () => {
      expect(ALLOWED_ORIGINS).toContain('https://sites-spectral-instruments.jose-e5f.workers.dev');
    });

    it('should include localhost development URLs', () => {
      expect(ALLOWED_ORIGINS).toContain('http://localhost:8787');
      expect(ALLOWED_ORIGINS).toContain('http://127.0.0.1:8787');
    });

    it('should NOT include wildcard', () => {
      expect(ALLOWED_ORIGINS).not.toContain('*');
    });
  });

  describe('isAllowedOrigin', () => {
    it('should return true for allowed production origin', () => {
      expect(isAllowedOrigin('https://sites.jobelab.com')).toBe(true);
    });

    it('should return true for allowed localhost origin', () => {
      expect(isAllowedOrigin('http://localhost:8787')).toBe(true);
    });

    it('should return false for unauthorized origin', () => {
      expect(isAllowedOrigin('https://malicious-site.com')).toBe(false);
    });

    it('should return false for similar but not exact match', () => {
      expect(isAllowedOrigin('https://sites.jobelab.com.evil.com')).toBe(false);
    });

    it('should return true for null origin (same-origin or server-to-server)', () => {
      expect(isAllowedOrigin(null)).toBe(true);
    });

    it('should return true for undefined origin', () => {
      expect(isAllowedOrigin(undefined)).toBe(true);
    });
  });

  describe('getAllowedOrigin', () => {
    it('should return the origin if it is allowed', () => {
      expect(getAllowedOrigin('https://sites.jobelab.com')).toBe('https://sites.jobelab.com');
    });

    it('should return first allowed origin for unauthorized origin', () => {
      expect(getAllowedOrigin('https://malicious-site.com')).toBe(ALLOWED_ORIGINS[0]);
    });

    it('should return first allowed origin for null origin', () => {
      expect(getAllowedOrigin(null)).toBe(ALLOWED_ORIGINS[0]);
    });
  });

  describe('createCors', () => {
    it('should return correct origin for allowed origin request', () => {
      const mockRequest = {
        headers: {
          get: (name) => name === 'Origin' ? 'https://sites.jobelab.com' : null
        }
      };
      const { corsHeaders } = createCors(mockRequest);
      expect(corsHeaders['Access-Control-Allow-Origin']).toBe('https://sites.jobelab.com');
    });

    it('should return first allowed origin for unauthorized origin', () => {
      const mockRequest = {
        headers: {
          get: (name) => name === 'Origin' ? 'https://malicious-site.com' : null
        }
      };
      const { corsHeaders } = createCors(mockRequest);
      expect(corsHeaders['Access-Control-Allow-Origin']).toBe(ALLOWED_ORIGINS[0]);
    });

    it('should include Vary: Origin header', () => {
      const mockRequest = {
        headers: {
          get: () => 'https://sites.jobelab.com'
        }
      };
      const { corsHeaders } = createCors(mockRequest);
      expect(corsHeaders['Vary']).toBe('Origin');
    });

    it('should include Access-Control-Allow-Credentials', () => {
      const mockRequest = {
        headers: {
          get: () => 'https://sites.jobelab.com'
        }
      };
      const { corsHeaders } = createCors(mockRequest);
      expect(corsHeaders['Access-Control-Allow-Credentials']).toBe('true');
    });

    it('should NOT return wildcard (*) origin', () => {
      const mockRequest = {
        headers: {
          get: () => 'https://sites.jobelab.com'
        }
      };
      const { corsHeaders } = createCors(mockRequest);
      expect(corsHeaders['Access-Control-Allow-Origin']).not.toBe('*');
    });

    it('should handle null request gracefully', () => {
      const { corsHeaders } = createCors(null);
      expect(corsHeaders['Access-Control-Allow-Origin']).toBe(ALLOWED_ORIGINS[0]);
    });
  });

  describe('validateCorsOrigin', () => {
    it('should return true for allowed origin', () => {
      const mockRequest = {
        headers: {
          get: (name) => name === 'Origin' ? 'https://sites.jobelab.com' : null
        }
      };
      expect(validateCorsOrigin(mockRequest)).toBe(true);
    });

    it('should return false for unauthorized origin', () => {
      const mockRequest = {
        headers: {
          get: (name) => name === 'Origin' ? 'https://evil.com' : null
        }
      };
      expect(validateCorsOrigin(mockRequest)).toBe(false);
    });

    it('should return true for no origin header (same-origin)', () => {
      const mockRequest = {
        headers: {
          get: () => null
        }
      };
      expect(validateCorsOrigin(mockRequest)).toBe(true);
    });
  });

  describe('createCorsErrorResponse', () => {
    it('should return 403 status', () => {
      const response = createCorsErrorResponse('https://evil.com');
      expect(response.status).toBe(403);
    });

    it('should return JSON error message', async () => {
      const response = createCorsErrorResponse('https://evil.com');
      const body = await response.json();
      expect(body.error).toBe('CORS Error');
      expect(body.message).toBe('Origin not allowed');
      expect(body.origin).toBe('https://evil.com');
    });
  });

  describe('Security Scenarios', () => {
    it('should block request from competitor domain', () => {
      expect(isAllowedOrigin('https://competitor-phenocams.com')).toBe(false);
    });

    it('should block request from subdomain spoof', () => {
      expect(isAllowedOrigin('https://sites.jobelab.com.attacker.com')).toBe(false);
    });

    it('should block request from protocol downgrade attempt', () => {
      // Our list only has https for production
      expect(isAllowedOrigin('http://sites.jobelab.com')).toBe(false);
    });

    it('should block request with null string (not null value)', () => {
      expect(isAllowedOrigin('null')).toBe(false);
    });
  });
});
