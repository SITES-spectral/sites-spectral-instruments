/**
 * Magic Links Handler Tests
 * Comprehensive unit tests for token-based authentication via magic links
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleMagicLinks } from '../../src/handlers/magic-links.js';

// Mock dependencies
vi.mock('../../src/auth/authentication.js', () => ({
  getUserFromRequest: vi.fn()
}));

vi.mock('../../src/utils/responses.js', () => ({
  createErrorResponse: vi.fn((message, status = 400) =>
    new Response(JSON.stringify({ error: message }), { status, headers: { 'Content-Type': 'application/json' } })
  ),
  createUnauthorizedResponse: vi.fn(() =>
    new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  ),
  createForbiddenResponse: vi.fn((message) =>
    new Response(JSON.stringify({ error: message }), { status: 403, headers: { 'Content-Type': 'application/json' } })
  )
}));

vi.mock('../../src/utils/logging.js', () => ({
  logSecurityEvent: vi.fn()
}));

vi.mock('../../src/auth/cookie-utils.js', () => ({
  createAuthCookie: vi.fn(() => 'auth=mock-jwt; HttpOnly; Secure')
}));

// Mock rate limiting middleware (ML-001 tests)
vi.mock('../../src/middleware/auth-rate-limiter.js', () => ({
  authRateLimitMiddleware: vi.fn().mockResolvedValue(null), // Allow all requests by default
  recordAuthAttempt: vi.fn()
}));

import { getUserFromRequest } from '../../src/auth/authentication.js';
import { authRateLimitMiddleware } from '../../src/middleware/auth-rate-limiter.js';
import { logSecurityEvent } from '../../src/utils/logging.js';

// Mock user data
const mockAdminUser = {
  id: 1,
  username: 'admin',
  role: 'admin',
  station_id: null,
  station_acronym: null
};

const mockSitesAdmin = {
  id: 2,
  username: 'sites-admin',
  role: 'sites-admin',
  station_id: null,
  station_acronym: null
};

const mockStationAdmin = {
  id: 3,
  username: 'svb-admin',
  role: 'station-admin',
  station_id: 1,
  station_acronym: 'SVB'
};

const mockStationUser = {
  id: 4,
  username: 'svb-user',
  role: 'station',
  station_id: 1,
  station_acronym: 'SVB'
};

const mockReadonlyUser = {
  id: 5,
  username: 'readonly',
  role: 'readonly',
  station_id: null,
  station_acronym: null
};

// Helper to create mock request
function createMockRequest(options = {}) {
  const {
    method = 'GET',
    url = 'https://sites.jobelab.com/api/v11/magic-links',
    body = null,
    headers = {}
  } = options;

  const defaultHeaders = {
    'CF-Connecting-IP': '192.168.1.1',
    'User-Agent': 'Mozilla/5.0 Test',
    ...headers
  };

  return {
    method,
    url,
    headers: {
      get: (name) => defaultHeaders[name] || null
    },
    json: async () => body
  };
}

// Helper to create mock environment
function createMockEnv() {
  const mockDb = {
    prepare: vi.fn(),
    exec: vi.fn()
  };

  // Chain methods for D1 prepare().bind().run()
  const mockRun = vi.fn().mockResolvedValue({
    success: true,
    results: [],
    lastRowId: 1
  });

  const mockFirst = vi.fn().mockResolvedValue(null);
  const mockAll = vi.fn().mockResolvedValue({ results: [] });

  const mockBind = vi.fn(() => ({
    run: mockRun,
    first: mockFirst,
    all: mockAll
  }));

  mockDb.prepare.mockReturnValue({
    bind: mockBind,
    run: mockRun,
    first: mockFirst,
    all: mockAll
  });

  return {
    DB: mockDb,
    JWT_SECRET: 'test-jwt-secret-for-testing-only-32chars!',
    _mockHelpers: {
      mockRun,
      mockFirst,
      mockAll,
      mockBind
    }
  };
}

describe('Magic Links Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Route Handler', () => {
    it('should route to create endpoint for POST /create', async () => {
      getUserFromRequest.mockResolvedValue(mockAdminUser);
      const env = createMockEnv();
      env._mockHelpers.mockFirst.mockResolvedValue({ acronym: 'SVB' });

      const request = createMockRequest({
        method: 'POST',
        url: 'https://sites.jobelab.com/api/v11/magic-links/create',
        body: { station_id: 1, label: 'Test Link' }
      });

      const response = await handleMagicLinks('POST', ['create'], request, env);

      expect(response.status).toBe(201);
    });

    it('should route to validate endpoint for GET /validate', async () => {
      const env = createMockEnv();
      const request = createMockRequest({
        method: 'GET',
        url: 'https://sites.jobelab.com/api/v11/magic-links/validate?token=abc123'
      });

      // Mock token not found scenario
      env._mockHelpers.mockFirst.mockResolvedValue(null);

      const response = await handleMagicLinks('GET', ['validate'], request, env);

      expect(response.status).toBe(401);
    });

    it('should route to revoke endpoint for POST /revoke', async () => {
      getUserFromRequest.mockResolvedValue(mockAdminUser);
      const env = createMockEnv();
      env._mockHelpers.mockFirst.mockResolvedValue({ id: 1, station_id: 1 });

      const request = createMockRequest({
        method: 'POST',
        url: 'https://sites.jobelab.com/api/v11/magic-links/revoke',
        body: { token_id: 1 }
      });

      const response = await handleMagicLinks('POST', ['revoke'], request, env);

      expect(response.status).toBe(200);
    });

    it('should route to list endpoint for GET /list', async () => {
      getUserFromRequest.mockResolvedValue(mockAdminUser);
      const env = createMockEnv();

      const request = createMockRequest({
        method: 'GET',
        url: 'https://sites.jobelab.com/api/v11/magic-links/list'
      });

      const response = await handleMagicLinks('GET', ['list'], request, env);

      expect(response.status).toBe(200);
    });

    it('should return 404 for unknown endpoint', async () => {
      const env = createMockEnv();
      const request = createMockRequest({
        url: 'https://sites.jobelab.com/api/v11/magic-links/unknown'
      });

      const response = await handleMagicLinks('GET', ['unknown'], request, env);

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error).toContain('not found');
    });

    it('should return 405 for wrong HTTP method', async () => {
      const env = createMockEnv();
      const request = createMockRequest({
        method: 'GET',
        url: 'https://sites.jobelab.com/api/v11/magic-links/create'
      });

      const response = await handleMagicLinks('GET', ['create'], request, env);

      expect(response.status).toBe(405);
    });
  });

  describe('Token Generation - POST /create', () => {
    it('should create magic link for admin user', async () => {
      getUserFromRequest.mockResolvedValue(mockAdminUser);
      const env = createMockEnv();
      env._mockHelpers.mockFirst.mockResolvedValue({ acronym: 'SVB' });

      const request = createMockRequest({
        method: 'POST',
        body: {
          station_id: 1,
          label: 'Test Link',
          description: 'For testing',
          expires_in_days: 7,
          single_use: false,
          role: 'readonly'
        }
      });

      const response = await handleMagicLinks('POST', ['create'], request, env);

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.magic_link.token).toBeDefined();
      expect(body.magic_link.url).toContain('svb.sitesspectral.work');
      expect(body.magic_link.station_id).toBe(1);
      expect(logSecurityEvent).toHaveBeenCalledWith(
        'MAGIC_LINK_CREATED',
        expect.objectContaining({
          creator_id: 1,
          station_id: 1
        }),
        expect.anything(),
        expect.anything()
      );
    });

    it('should create magic link for sites-admin user', async () => {
      getUserFromRequest.mockResolvedValue(mockSitesAdmin);
      const env = createMockEnv();
      env._mockHelpers.mockFirst.mockResolvedValue({ acronym: 'ANS' });

      const request = createMockRequest({
        method: 'POST',
        body: {
          station_id: 2,
          label: 'Sites Admin Link'
        }
      });

      const response = await handleMagicLinks('POST', ['create'], request, env);

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.success).toBe(true);
    });

    it('should create magic link for station-admin for their station', async () => {
      getUserFromRequest.mockResolvedValue(mockStationAdmin);
      const env = createMockEnv();
      env._mockHelpers.mockFirst.mockResolvedValue({ acronym: 'SVB' });

      const request = createMockRequest({
        method: 'POST',
        body: {
          station_id: 1, // Same as station-admin's station
          label: 'Station Admin Link'
        }
      });

      const response = await handleMagicLinks('POST', ['create'], request, env);

      expect(response.status).toBe(201);
    });

    it('should reject creation by station-admin for different station', async () => {
      getUserFromRequest.mockResolvedValue(mockStationAdmin);
      const env = createMockEnv();

      const request = createMockRequest({
        method: 'POST',
        body: {
          station_id: 2, // Different station
          label: 'Invalid Link'
        }
      });

      const response = await handleMagicLinks('POST', ['create'], request, env);

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error).toContain('your own station');
    });

    it('should reject creation by station user (non-admin)', async () => {
      getUserFromRequest.mockResolvedValue(mockStationUser);
      const env = createMockEnv();

      const request = createMockRequest({
        method: 'POST',
        body: {
          station_id: 1,
          label: 'Unauthorized Link'
        }
      });

      const response = await handleMagicLinks('POST', ['create'], request, env);

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error).toContain('Only admins can create');
    });

    it('should reject creation by readonly user', async () => {
      getUserFromRequest.mockResolvedValue(mockReadonlyUser);
      const env = createMockEnv();

      const request = createMockRequest({
        method: 'POST',
        body: {
          station_id: 1,
          label: 'Readonly Link'
        }
      });

      const response = await handleMagicLinks('POST', ['create'], request, env);

      expect(response.status).toBe(403);
    });

    it('should reject creation without authentication', async () => {
      getUserFromRequest.mockResolvedValue(null);
      const env = createMockEnv();

      const request = createMockRequest({
        method: 'POST',
        body: {
          station_id: 1,
          label: 'Unauthenticated Link'
        }
      });

      const response = await handleMagicLinks('POST', ['create'], request, env);

      expect(response.status).toBe(401);
    });

    it('should reject creation without station_id', async () => {
      getUserFromRequest.mockResolvedValue(mockAdminUser);
      const env = createMockEnv();

      const request = createMockRequest({
        method: 'POST',
        body: {
          label: 'Missing Station'
        }
      });

      const response = await handleMagicLinks('POST', ['create'], request, env);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('station_id is required');
    });

    it('should reject invalid role', async () => {
      getUserFromRequest.mockResolvedValue(mockAdminUser);
      const env = createMockEnv();

      const request = createMockRequest({
        method: 'POST',
        body: {
          station_id: 1,
          role: 'admin' // Not allowed for magic links
        }
      });

      const response = await handleMagicLinks('POST', ['create'], request, env);

      expect(response.status).toBe(400);
      const body = await response.json();
      // ML-002: Updated error message format from input validation
      expect(body.error).toMatch(/role must be|Invalid role/);
    });

    it('should accept valid roles', async () => {
      getUserFromRequest.mockResolvedValue(mockAdminUser);
      const env = createMockEnv();
      env._mockHelpers.mockFirst.mockResolvedValue({ acronym: 'SVB' });

      // Test readonly role
      let request = createMockRequest({
        method: 'POST',
        body: {
          station_id: 1,
          role: 'readonly'
        }
      });

      let response = await handleMagicLinks('POST', ['create'], request, env);
      expect(response.status).toBe(201);

      // Test station-internal role
      request = createMockRequest({
        method: 'POST',
        body: {
          station_id: 1,
          role: 'station-internal'
        }
      });

      response = await handleMagicLinks('POST', ['create'], request, env);
      expect(response.status).toBe(201);
    });

    it('should use custom expiry duration', async () => {
      getUserFromRequest.mockResolvedValue(mockAdminUser);
      const env = createMockEnv();
      env._mockHelpers.mockFirst.mockResolvedValue({ acronym: 'SVB' });

      const request = createMockRequest({
        method: 'POST',
        body: {
          station_id: 1,
          expires_in_days: 30
        }
      });

      const response = await handleMagicLinks('POST', ['create'], request, env);

      expect(response.status).toBe(201);
      const body = await response.json();

      // Check that expiry is approximately 30 days in the future
      const expiresAt = new Date(body.magic_link.expires_at);
      const expectedExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const timeDiff = Math.abs(expiresAt - expectedExpiry);

      expect(timeDiff).toBeLessThan(5000); // Within 5 seconds
    });

    it('should create single-use magic link', async () => {
      getUserFromRequest.mockResolvedValue(mockAdminUser);
      const env = createMockEnv();
      env._mockHelpers.mockFirst.mockResolvedValue({ acronym: 'SVB' });

      const request = createMockRequest({
        method: 'POST',
        body: {
          station_id: 1,
          single_use: true
        }
      });

      const response = await handleMagicLinks('POST', ['create'], request, env);

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.magic_link.single_use).toBe(true);
    });

    it('should store hashed token in database', async () => {
      getUserFromRequest.mockResolvedValue(mockAdminUser);
      const env = createMockEnv();
      env._mockHelpers.mockFirst.mockResolvedValue({ acronym: 'SVB' });

      const request = createMockRequest({
        method: 'POST',
        body: {
          station_id: 1,
          label: 'Hash Test'
        }
      });

      await handleMagicLinks('POST', ['create'], request, env);

      // Verify prepare was called with INSERT statement
      const prepareCall = env.DB.prepare.mock.calls.find(call =>
        call[0].includes('INSERT INTO magic_link_tokens')
      );
      expect(prepareCall).toBeDefined();

      // Verify bind was called with token hash (not full token)
      const bindCall = env._mockHelpers.mockBind.mock.calls[0];
      expect(bindCall[0]).toMatch(/^[0-9a-f]{8}\.\.\./); // Truncated token
      expect(bindCall[1]).toMatch(/^[0-9a-f]{64}$/); // Full SHA-256 hash
    });

    it('should handle database errors gracefully', async () => {
      getUserFromRequest.mockResolvedValue(mockAdminUser);
      const env = createMockEnv();
      env._mockHelpers.mockRun.mockRejectedValue(new Error('Database error'));

      const request = createMockRequest({
        method: 'POST',
        body: {
          station_id: 1,
          label: 'DB Error Test'
        }
      });

      const response = await handleMagicLinks('POST', ['create'], request, env);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toContain('Failed to create');
    });
  });

  describe('Token Validation - GET /validate', () => {
    const validToken = 'a'.repeat(64); // Mock 64-char hex token
    const validTokenHash = '0'.repeat(64); // Mock hash

    it('should validate and issue session for valid token', async () => {
      const env = createMockEnv();
      const mockMagicLink = {
        id: 1,
        station_id: 1,
        station_acronym: 'SVB',
        station_normalized_name: 'svartberget',
        role: 'readonly',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        single_use: 0,
        used_at: null,
        revoked_at: null
      };

      env._mockHelpers.mockFirst.mockResolvedValue(mockMagicLink);

      const request = createMockRequest({
        method: 'GET',
        url: `https://sites.jobelab.com/api/v11/magic-links/validate?token=${validToken}`
      });

      const response = await handleMagicLinks('GET', ['validate'], request, env);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.user.username).toContain('magic_svb');
      expect(body.user.role).toBe('readonly');
      expect(body.user.auth_provider).toBe('magic_link');
      expect(body.redirect).toContain('station-dashboard.html?station=SVB');

      // Verify Set-Cookie header
      expect(response.headers.get('Set-Cookie')).toContain('auth=');

      // Verify token was marked as used
      const updateCall = env.DB.prepare.mock.calls.find(call =>
        call[0].includes('UPDATE magic_link_tokens') && call[0].includes('used_at')
      );
      expect(updateCall).toBeDefined();

      // Verify security logging
      expect(logSecurityEvent).toHaveBeenCalledWith(
        'MAGIC_LINK_USED',
        expect.objectContaining({
          token_id: 1,
          station_id: 1
        }),
        expect.anything(),
        expect.anything()
      );
    });

    it('should reject missing token', async () => {
      const env = createMockEnv();

      const request = createMockRequest({
        method: 'GET',
        url: 'https://sites.jobelab.com/api/v11/magic-links/validate'
      });

      const response = await handleMagicLinks('GET', ['validate'], request, env);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('Token is required');
    });

    it('should reject non-existent token', async () => {
      const env = createMockEnv();
      env._mockHelpers.mockFirst.mockResolvedValue(null);

      const request = createMockRequest({
        method: 'GET',
        url: `https://sites.jobelab.com/api/v11/magic-links/validate?token=${validToken}`
      });

      const response = await handleMagicLinks('GET', ['validate'], request, env);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized');

      expect(logSecurityEvent).toHaveBeenCalledWith(
        'MAGIC_LINK_INVALID',
        expect.anything(),
        expect.anything(),
        expect.anything()
      );
    });

    it('should reject expired token', async () => {
      const env = createMockEnv();
      const expiredMagicLink = {
        id: 1,
        station_id: 1,
        station_acronym: 'SVB',
        role: 'readonly',
        expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Expired yesterday
        single_use: 0,
        used_at: null,
        revoked_at: null
      };

      env._mockHelpers.mockFirst.mockResolvedValue(expiredMagicLink);

      const request = createMockRequest({
        method: 'GET',
        url: `https://sites.jobelab.com/api/v11/magic-links/validate?token=${validToken}`
      });

      const response = await handleMagicLinks('GET', ['validate'], request, env);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized');

      expect(logSecurityEvent).toHaveBeenCalledWith(
        'MAGIC_LINK_EXPIRED_USE_ATTEMPT',
        expect.objectContaining({ token_id: 1 }),
        expect.anything(),
        expect.anything()
      );
    });

    it('should reject revoked token', async () => {
      const env = createMockEnv();
      const revokedMagicLink = {
        id: 1,
        station_id: 1,
        station_acronym: 'SVB',
        role: 'readonly',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        single_use: 0,
        used_at: null,
        revoked_at: new Date().toISOString() // Revoked
      };

      env._mockHelpers.mockFirst.mockResolvedValue(revokedMagicLink);

      const request = createMockRequest({
        method: 'GET',
        url: `https://sites.jobelab.com/api/v11/magic-links/validate?token=${validToken}`
      });

      const response = await handleMagicLinks('GET', ['validate'], request, env);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized');

      expect(logSecurityEvent).toHaveBeenCalledWith(
        'MAGIC_LINK_REVOKED_USE_ATTEMPT',
        expect.objectContaining({ token_id: 1 }),
        expect.anything(),
        expect.anything()
      );
    });

    it('should reject already-used single-use token', async () => {
      const env = createMockEnv();
      const usedMagicLink = {
        id: 1,
        station_id: 1,
        station_acronym: 'SVB',
        role: 'readonly',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        single_use: 1,
        used_at: new Date().toISOString(), // Already used
        revoked_at: null
      };

      env._mockHelpers.mockFirst.mockResolvedValue(usedMagicLink);

      const request = createMockRequest({
        method: 'GET',
        url: `https://sites.jobelab.com/api/v11/magic-links/validate?token=${validToken}`
      });

      const response = await handleMagicLinks('GET', ['validate'], request, env);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized');

      expect(logSecurityEvent).toHaveBeenCalledWith(
        'MAGIC_LINK_REUSE_ATTEMPT',
        expect.objectContaining({ token_id: 1 }),
        expect.anything(),
        expect.anything()
      );
    });

    it('should allow multi-use token to be used multiple times', async () => {
      const env = createMockEnv();
      const multiUseMagicLink = {
        id: 1,
        station_id: 1,
        station_acronym: 'SVB',
        station_normalized_name: 'svartberget',
        role: 'readonly',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        single_use: 0,
        used_at: new Date().toISOString(), // Already used but multi-use
        revoked_at: null
      };

      env._mockHelpers.mockFirst.mockResolvedValue(multiUseMagicLink);

      const request = createMockRequest({
        method: 'GET',
        url: `https://sites.jobelab.com/api/v11/magic-links/validate?token=${validToken}`
      });

      const response = await handleMagicLinks('GET', ['validate'], request, env);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
    });

    it('should record IP and user agent on use', async () => {
      const env = createMockEnv();
      const mockMagicLink = {
        id: 1,
        station_id: 1,
        station_acronym: 'SVB',
        station_normalized_name: 'svartberget',
        role: 'readonly',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        single_use: 0,
        used_at: null,
        revoked_at: null
      };

      env._mockHelpers.mockFirst.mockResolvedValue(mockMagicLink);

      const request = createMockRequest({
        method: 'GET',
        url: `https://sites.jobelab.com/api/v11/magic-links/validate?token=${validToken}`,
        headers: {
          'CF-Connecting-IP': '203.0.113.42',
          'User-Agent': 'CustomBrowser/1.0'
        }
      });

      await handleMagicLinks('GET', ['validate'], request, env);

      // Verify UPDATE statement includes IP and user agent
      const bindCall = env._mockHelpers.mockBind.mock.calls.find(call =>
        call.includes('203.0.113.42') && call.includes('CustomBrowser/1.0')
      );
      expect(bindCall).toBeDefined();
    });

    it('should handle database errors during validation', async () => {
      const env = createMockEnv();
      env._mockHelpers.mockFirst.mockRejectedValue(new Error('Database error'));

      const request = createMockRequest({
        method: 'GET',
        url: `https://sites.jobelab.com/api/v11/magic-links/validate?token=${validToken}`
      });

      const response = await handleMagicLinks('GET', ['validate'], request, env);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toContain('Failed to validate');
    });
  });

  describe('Token Revocation - POST /revoke', () => {
    it('should allow admin to revoke any token', async () => {
      getUserFromRequest.mockResolvedValue(mockAdminUser);
      const env = createMockEnv();
      env._mockHelpers.mockFirst.mockResolvedValue({
        id: 1,
        station_id: 2 // Different station
      });

      const request = createMockRequest({
        method: 'POST',
        body: {
          token_id: 1,
          reason: 'Security audit'
        }
      });

      const response = await handleMagicLinks('POST', ['revoke'], request, env);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);

      // Verify UPDATE statement
      const updateCall = env.DB.prepare.mock.calls.find(call =>
        call[0].includes('UPDATE magic_link_tokens') && call[0].includes('revoked_at')
      );
      expect(updateCall).toBeDefined();

      expect(logSecurityEvent).toHaveBeenCalledWith(
        'MAGIC_LINK_REVOKED',
        expect.objectContaining({
          revoker_id: 1,
          token_id: 1,
          reason: 'Security audit'
        }),
        expect.anything(),
        expect.anything()
      );
    });

    it('should allow sites-admin to revoke tokens', async () => {
      getUserFromRequest.mockResolvedValue(mockSitesAdmin);
      const env = createMockEnv();
      env._mockHelpers.mockFirst.mockResolvedValue({
        id: 1,
        station_id: 1
      });

      const request = createMockRequest({
        method: 'POST',
        body: {
          token_id: 1
        }
      });

      const response = await handleMagicLinks('POST', ['revoke'], request, env);

      expect(response.status).toBe(200);
    });

    it('should allow station-admin to revoke their station tokens', async () => {
      getUserFromRequest.mockResolvedValue(mockStationAdmin);
      const env = createMockEnv();
      env._mockHelpers.mockFirst.mockResolvedValue({
        id: 1,
        station_id: 1 // Same as station-admin's station
      });

      const request = createMockRequest({
        method: 'POST',
        body: {
          token_id: 1,
          reason: 'Link expired early'
        }
      });

      const response = await handleMagicLinks('POST', ['revoke'], request, env);

      expect(response.status).toBe(200);
    });

    it('should reject station-admin revoking other station tokens', async () => {
      getUserFromRequest.mockResolvedValue(mockStationAdmin);
      const env = createMockEnv();
      env._mockHelpers.mockFirst.mockResolvedValue({
        id: 1,
        station_id: 2 // Different station
      });

      const request = createMockRequest({
        method: 'POST',
        body: {
          token_id: 1
        }
      });

      const response = await handleMagicLinks('POST', ['revoke'], request, env);

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error).toContain('your own station');
    });

    it('should reject revocation by station user', async () => {
      getUserFromRequest.mockResolvedValue(mockStationUser);
      const env = createMockEnv();

      const request = createMockRequest({
        method: 'POST',
        body: {
          token_id: 1
        }
      });

      const response = await handleMagicLinks('POST', ['revoke'], request, env);

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error).toContain('Only admins can revoke');
    });

    it('should reject revocation without authentication', async () => {
      getUserFromRequest.mockResolvedValue(null);
      const env = createMockEnv();

      const request = createMockRequest({
        method: 'POST',
        body: {
          token_id: 1
        }
      });

      const response = await handleMagicLinks('POST', ['revoke'], request, env);

      expect(response.status).toBe(401);
    });

    it('should reject revocation without token_id', async () => {
      getUserFromRequest.mockResolvedValue(mockAdminUser);
      const env = createMockEnv();

      const request = createMockRequest({
        method: 'POST',
        body: {}
      });

      const response = await handleMagicLinks('POST', ['revoke'], request, env);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('token_id is required');
    });

    it('should handle non-existent token gracefully', async () => {
      getUserFromRequest.mockResolvedValue(mockAdminUser);
      const env = createMockEnv();
      env._mockHelpers.mockFirst.mockResolvedValue(null);

      const request = createMockRequest({
        method: 'POST',
        body: {
          token_id: 999
        }
      });

      const response = await handleMagicLinks('POST', ['revoke'], request, env);

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error).toContain('not found');
    });

    it('should allow revocation with optional reason', async () => {
      getUserFromRequest.mockResolvedValue(mockAdminUser);
      const env = createMockEnv();
      env._mockHelpers.mockFirst.mockResolvedValue({
        id: 1,
        station_id: 1
      });

      const request = createMockRequest({
        method: 'POST',
        body: {
          token_id: 1
          // No reason provided
        }
      });

      const response = await handleMagicLinks('POST', ['revoke'], request, env);

      expect(response.status).toBe(200);
    });

    it('should handle database errors during revocation', async () => {
      getUserFromRequest.mockResolvedValue(mockAdminUser);
      const env = createMockEnv();
      env._mockHelpers.mockFirst.mockResolvedValue({
        id: 1,
        station_id: 1
      });
      env._mockHelpers.mockRun.mockRejectedValue(new Error('Database error'));

      const request = createMockRequest({
        method: 'POST',
        body: {
          token_id: 1
        }
      });

      const response = await handleMagicLinks('POST', ['revoke'], request, env);

      expect(response.status).toBe(500);
    });
  });

  describe('Token Listing - GET /list', () => {
    it('should allow admin to list all tokens', async () => {
      getUserFromRequest.mockResolvedValue(mockAdminUser);
      const env = createMockEnv();

      const mockTokens = [
        {
          id: 1,
          label: 'Test 1',
          station_id: 1,
          station_acronym: 'SVB',
          role: 'readonly',
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          single_use: 0,
          used_at: null,
          revoked_at: null,
          created_at: new Date().toISOString(),
          created_by_username: 'admin'
        },
        {
          id: 2,
          label: 'Test 2',
          station_id: 2,
          station_acronym: 'ANS',
          role: 'station-internal',
          expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          single_use: 1,
          used_at: null,
          revoked_at: null,
          created_at: new Date().toISOString(),
          created_by_username: 'sites-admin'
        }
      ];

      env._mockHelpers.mockAll.mockResolvedValue({ results: mockTokens });

      const request = createMockRequest({
        method: 'GET',
        url: 'https://sites.jobelab.com/api/v11/magic-links/list'
      });

      const response = await handleMagicLinks('GET', ['list'], request, env);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.magic_links).toHaveLength(2);
      expect(body.magic_links[0].is_expired).toBe(false);
      expect(body.magic_links[0].is_revoked).toBe(false);
      expect(body.magic_links[0].is_used).toBe(false);
    });

    it('should allow station-admin to list only their station tokens', async () => {
      getUserFromRequest.mockResolvedValue(mockStationAdmin);
      const env = createMockEnv();

      const mockTokens = [
        {
          id: 1,
          label: 'SVB Token',
          station_id: 1,
          station_acronym: 'SVB',
          role: 'readonly',
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          single_use: 0,
          used_at: null,
          revoked_at: null,
          created_at: new Date().toISOString(),
          created_by_username: 'svb-admin'
        }
      ];

      env._mockHelpers.mockAll.mockResolvedValue({ results: mockTokens });

      const request = createMockRequest({
        method: 'GET',
        url: 'https://sites.jobelab.com/api/v11/magic-links/list'
      });

      const response = await handleMagicLinks('GET', ['list'], request, env);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.magic_links).toHaveLength(1);
      expect(body.magic_links[0].station_id).toBe(1);

      // Verify WHERE clause includes station_id filter
      const prepareCall = env.DB.prepare.mock.calls.find(call =>
        call[0].includes('WHERE 1=1') && call[0].includes('ml.station_id')
      );
      expect(prepareCall).toBeDefined();
    });

    it('should reject listing by station user', async () => {
      getUserFromRequest.mockResolvedValue(mockStationUser);
      const env = createMockEnv();

      const request = createMockRequest({
        method: 'GET',
        url: 'https://sites.jobelab.com/api/v11/magic-links/list'
      });

      const response = await handleMagicLinks('GET', ['list'], request, env);

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error).toContain('Only admins can list');
    });

    it('should reject listing without authentication', async () => {
      getUserFromRequest.mockResolvedValue(null);
      const env = createMockEnv();

      const request = createMockRequest({
        method: 'GET',
        url: 'https://sites.jobelab.com/api/v11/magic-links/list'
      });

      const response = await handleMagicLinks('GET', ['list'], request, env);

      expect(response.status).toBe(401);
    });

    it('should filter by station_id for admin', async () => {
      getUserFromRequest.mockResolvedValue(mockAdminUser);
      const env = createMockEnv();
      env._mockHelpers.mockAll.mockResolvedValue({ results: [] });

      const request = createMockRequest({
        method: 'GET',
        url: 'https://sites.jobelab.com/api/v11/magic-links/list?station_id=2'
      });

      const response = await handleMagicLinks('GET', ['list'], request, env);

      expect(response.status).toBe(200);

      // Verify station_id was used in bind - check if 2 appears in any bind call
      const bindCalls = env._mockHelpers.mockBind.mock.calls;
      const hasStationId = bindCalls.some(call => call[0] === 2 || call[0] === '2');
      expect(hasStationId).toBe(true);
    });

    it('should exclude revoked tokens by default', async () => {
      getUserFromRequest.mockResolvedValue(mockAdminUser);
      const env = createMockEnv();
      env._mockHelpers.mockAll.mockResolvedValue({ results: [] });

      const request = createMockRequest({
        method: 'GET',
        url: 'https://sites.jobelab.com/api/v11/magic-links/list'
      });

      await handleMagicLinks('GET', ['list'], request, env);

      // Verify WHERE clause excludes revoked
      const prepareCall = env.DB.prepare.mock.calls.find(call =>
        call[0].includes('revoked_at IS NULL')
      );
      expect(prepareCall).toBeDefined();
    });

    it('should include revoked tokens when requested', async () => {
      getUserFromRequest.mockResolvedValue(mockAdminUser);
      const env = createMockEnv();

      const mockTokens = [
        {
          id: 1,
          label: 'Active',
          station_id: 1,
          station_acronym: 'SVB',
          role: 'readonly',
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          single_use: 0,
          used_at: null,
          revoked_at: null,
          created_at: new Date().toISOString(),
          created_by_username: 'admin'
        },
        {
          id: 2,
          label: 'Revoked',
          station_id: 1,
          station_acronym: 'SVB',
          role: 'readonly',
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          single_use: 0,
          used_at: null,
          revoked_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          created_by_username: 'admin'
        }
      ];

      env._mockHelpers.mockAll.mockResolvedValue({ results: mockTokens });

      const request = createMockRequest({
        method: 'GET',
        url: 'https://sites.jobelab.com/api/v11/magic-links/list?include_revoked=true'
      });

      const response = await handleMagicLinks('GET', ['list'], request, env);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.magic_links).toHaveLength(2);
      expect(body.magic_links[0].is_revoked).toBe(false);
      expect(body.magic_links[1].is_revoked).toBe(true);
    });

    it('should exclude expired tokens by default', async () => {
      getUserFromRequest.mockResolvedValue(mockAdminUser);
      const env = createMockEnv();
      env._mockHelpers.mockAll.mockResolvedValue({ results: [] });

      const request = createMockRequest({
        method: 'GET',
        url: 'https://sites.jobelab.com/api/v11/magic-links/list'
      });

      await handleMagicLinks('GET', ['list'], request, env);

      // Verify WHERE clause excludes expired
      const prepareCall = env.DB.prepare.mock.calls.find(call =>
        call[0].includes('expires_at > CURRENT_TIMESTAMP')
      );
      expect(prepareCall).toBeDefined();
    });

    it('should include expired tokens when requested', async () => {
      getUserFromRequest.mockResolvedValue(mockAdminUser);
      const env = createMockEnv();

      const mockTokens = [
        {
          id: 1,
          label: 'Active',
          station_id: 1,
          station_acronym: 'SVB',
          role: 'readonly',
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          single_use: 0,
          used_at: null,
          revoked_at: null,
          created_at: new Date().toISOString(),
          created_by_username: 'admin'
        },
        {
          id: 2,
          label: 'Expired',
          station_id: 1,
          station_acronym: 'SVB',
          role: 'readonly',
          expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          single_use: 0,
          used_at: null,
          revoked_at: null,
          created_at: new Date().toISOString(),
          created_by_username: 'admin'
        }
      ];

      env._mockHelpers.mockAll.mockResolvedValue({ results: mockTokens });

      const request = createMockRequest({
        method: 'GET',
        url: 'https://sites.jobelab.com/api/v11/magic-links/list?include_expired=true'
      });

      const response = await handleMagicLinks('GET', ['list'], request, env);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.magic_links).toHaveLength(2);
      expect(body.magic_links[0].is_expired).toBe(false);
      expect(body.magic_links[1].is_expired).toBe(true);
    });

    it('should handle database errors during listing', async () => {
      getUserFromRequest.mockResolvedValue(mockAdminUser);
      const env = createMockEnv();
      env._mockHelpers.mockAll.mockRejectedValue(new Error('Database error'));

      const request = createMockRequest({
        method: 'GET',
        url: 'https://sites.jobelab.com/api/v11/magic-links/list'
      });

      const response = await handleMagicLinks('GET', ['list'], request, env);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toContain('Failed to list');
    });
  });

  describe('Security Tests', () => {
    it('should generate unique tokens for each creation', async () => {
      getUserFromRequest.mockResolvedValue(mockAdminUser);
      const env = createMockEnv();
      env._mockHelpers.mockFirst.mockResolvedValue({ acronym: 'SVB' });

      const tokens = new Set();

      for (let i = 0; i < 10; i++) {
        const request = createMockRequest({
          method: 'POST',
          body: {
            station_id: 1,
            label: `Test ${i}`
          }
        });

        const response = await handleMagicLinks('POST', ['create'], request, env);
        const body = await response.json();
        tokens.add(body.magic_link.token);
      }

      // All tokens should be unique
      expect(tokens.size).toBe(10);
    });

    it('should use SHA-256 for token hashing', async () => {
      getUserFromRequest.mockResolvedValue(mockAdminUser);
      const env = createMockEnv();
      env._mockHelpers.mockFirst.mockResolvedValue({ acronym: 'SVB' });

      const request = createMockRequest({
        method: 'POST',
        body: {
          station_id: 1,
          label: 'Hash Test'
        }
      });

      await handleMagicLinks('POST', ['create'], request, env);

      // Verify hash is 64 hex characters (SHA-256)
      const bindCall = env._mockHelpers.mockBind.mock.calls[0];
      const tokenHash = bindCall[1];
      expect(tokenHash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should never store full token in database', async () => {
      getUserFromRequest.mockResolvedValue(mockAdminUser);
      const env = createMockEnv();
      env._mockHelpers.mockFirst.mockResolvedValue({ acronym: 'SVB' });

      const request = createMockRequest({
        method: 'POST',
        body: {
          station_id: 1,
          label: 'Storage Test'
        }
      });

      const response = await handleMagicLinks('POST', ['create'], request, env);
      const body = await response.json();
      const fullToken = body.magic_link.token;

      // Verify token column only has truncated version
      const bindCall = env._mockHelpers.mockBind.mock.calls[0];
      const storedToken = bindCall[0];
      expect(storedToken).not.toBe(fullToken);
      expect(storedToken).toMatch(/^[0-9a-f]{8}\.\.\.$/);
    });

    it('should only return full token once at creation', async () => {
      getUserFromRequest.mockResolvedValue(mockAdminUser);
      const env = createMockEnv();
      env._mockHelpers.mockFirst.mockResolvedValue({ acronym: 'SVB' });

      const request = createMockRequest({
        method: 'POST',
        body: {
          station_id: 1,
          label: 'One-time Token'
        }
      });

      const response = await handleMagicLinks('POST', ['create'], request, env);
      const body = await response.json();

      expect(body.magic_link.token).toBeDefined();
      expect(body.magic_link.token).toMatch(/^[0-9a-f]{64}$/);
      expect(body.message).toContain('cannot be retrieved again');
    });

    it('should enforce role-based access control', async () => {
      const testCases = [
        { user: mockAdminUser, expectedStatus: 201, description: 'admin can create' },
        { user: mockSitesAdmin, expectedStatus: 201, description: 'sites-admin can create' },
        { user: mockStationAdmin, expectedStatus: 201, description: 'station-admin can create for their station' },
        { user: mockStationUser, expectedStatus: 403, description: 'station user cannot create' },
        { user: mockReadonlyUser, expectedStatus: 403, description: 'readonly user cannot create' },
        { user: null, expectedStatus: 401, description: 'unauthenticated cannot create' }
      ];

      for (const { user, expectedStatus, description } of testCases) {
        getUserFromRequest.mockResolvedValue(user);
        const env = createMockEnv();
        env._mockHelpers.mockFirst.mockResolvedValue({ acronym: 'SVB' });

        const request = createMockRequest({
          method: 'POST',
          body: {
            station_id: user?.station_id || 1,
            label: description
          }
        });

        const response = await handleMagicLinks('POST', ['create'], request, env);

        expect(response.status).toBe(expectedStatus);
      }
    });

    it('should prevent token enumeration attacks', async () => {
      const env = createMockEnv();
      env._mockHelpers.mockFirst.mockResolvedValue(null);

      const invalidTokens = [
        { token: 'invalid-token', expectedStatus: 401 },
        { token: '0'.repeat(64), expectedStatus: 401 },
        { token: 'a'.repeat(63), expectedStatus: 401 }, // Wrong length
        { token: 'x'.repeat(64), expectedStatus: 401 }, // Invalid hex
        { token: '', expectedStatus: 400 } // Empty token returns 400 (bad request)
      ];

      for (const { token, expectedStatus } of invalidTokens) {
        const request = createMockRequest({
          method: 'GET',
          url: `https://sites.jobelab.com/api/v11/magic-links/validate?token=${token}`
        });

        const response = await handleMagicLinks('GET', ['validate'], request, env);

        // Invalid tokens should get appropriate error status
        expect(response.status).toBe(expectedStatus);
        const body = await response.json();
        expect(body.error).toBeDefined(); // Generic message from mock
      }
    });
  });
});
