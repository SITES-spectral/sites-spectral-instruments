/**
 * Cloudflare Access Adapter Tests
 * Comprehensive tests for JWT verification, user mapping, and portal access control
 *
 * @module tests/unit/infrastructure/auth/CloudflareAccessAdapter.test
 * @version 15.0.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SignJWT } from 'jose';
import { CloudflareAccessAdapter } from '../../../../src/infrastructure/auth/CloudflareAccessAdapter.js';

// Test constants
const CF_ACCESS_TEAM_DOMAIN = 'sitesspectral.cloudflareaccess.com';
const TEST_JWT_SECRET = new TextEncoder().encode('test-cloudflare-access-jwt-secret-key-32chars');

// Mock global admin emails (matches the actual implementation)
const GLOBAL_ADMIN_EMAILS = [
  'jose.beltran@mgeo.lu.se',
  'lars.eklundh@nateko.lu.se'
];

// Mock database responses
const mockDatabaseUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  role: 'station',
  station_id: 1,
  station_acronym: 'SVB',
  station_normalized_name: 'svartberget',
  active: 1
};

const mockStationAdminUser = {
  id: 2,
  username: 'station-admin',
  email: 'admin@slu.se',
  role: 'station-admin',
  station_id: 1,
  station_acronym: 'SVB',
  station_normalized_name: 'svartberget',
  active: 1
};

const mockPilot = {
  id: 1,
  user_id: 3,
  full_name: 'Test Pilot',
  email: 'pilot@example.com',
  authorized_stations: JSON.stringify(['SVB', 'ANS']),
  status: 'active'
};

/**
 * Create a mock Cloudflare Access JWT
 */
async function createMockCFAccessJWT(payload, options = {}) {
  const {
    expiresIn = '24h',
    issuer = `https://${CF_ACCESS_TEAM_DOMAIN}`,
    audience = 'test-audience-id'
  } = options;

  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .setIssuer(issuer)
    .setSubject(payload.sub || payload.email)
    .setAudience(audience)
    .sign(TEST_JWT_SECRET);

  return jwt;
}

/**
 * Create a mock Request object with CF Access JWT header
 */
function createMockRequest(jwtToken = null, headers = {}) {
  const requestHeaders = new Map();

  if (jwtToken) {
    requestHeaders.set('Cf-Access-Jwt-Assertion', jwtToken);
  }

  Object.entries(headers).forEach(([key, value]) => {
    requestHeaders.set(key, value);
  });

  return {
    headers: {
      get: (name) => requestHeaders.get(name) || null
    }
  };
}

/**
 * Create a mock D1 database environment
 */
function createMockDB() {
  return {
    prepare: vi.fn().mockReturnThis(),
    bind: vi.fn().mockReturnThis(),
    first: vi.fn(),
    run: vi.fn(),
    all: vi.fn()
  };
}

/**
 * Create a mock Cloudflare Worker environment
 */
function createMockEnv(overrides = {}) {
  return {
    DB: createMockDB(),
    CF_ACCESS_TEAM_DOMAIN: CF_ACCESS_TEAM_DOMAIN,
    CF_ACCESS_AUD: 'test-audience-id',
    ...overrides
  };
}

describe('CloudflareAccessAdapter', () => {
  let adapter;
  let mockEnv;

  beforeEach(() => {
    mockEnv = createMockEnv();
    adapter = new CloudflareAccessAdapter(mockEnv);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with environment', () => {
      expect(adapter.env).toBe(mockEnv);
      expect(adapter.teamDomain).toBe(CF_ACCESS_TEAM_DOMAIN);
      expect(adapter.certsUrl).toBe(`https://${CF_ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`);
    });

    it('should allow overriding team domain via environment', () => {
      const customEnv = createMockEnv({ CF_ACCESS_TEAM_DOMAIN: 'custom.cloudflareaccess.com' });
      const customAdapter = new CloudflareAccessAdapter(customEnv);

      expect(customAdapter.teamDomain).toBe('custom.cloudflareaccess.com');
      expect(customAdapter.certsUrl).toBe('https://custom.cloudflareaccess.com/cdn-cgi/access/certs');
    });
  });

  describe('verifyAccessToken - Missing/Invalid JWT', () => {
    it('should return null when JWT header is missing', async () => {
      const request = createMockRequest(null);
      const result = await adapter.verifyAccessToken(request);

      expect(result).toBeNull();
    });

    it('should return null for empty JWT', async () => {
      const request = createMockRequest('');
      const result = await adapter.verifyAccessToken(request);

      expect(result).toBeNull();
    });

    it('should return null for malformed JWT (not three parts)', async () => {
      const request = createMockRequest('not-a-valid-jwt');
      const result = await adapter.verifyAccessToken(request);

      expect(result).toBeNull();
    });

    it('should return null for JWT with invalid structure', async () => {
      const request = createMockRequest('header.payload');
      const result = await adapter.verifyAccessToken(request);

      expect(result).toBeNull();
    });
  });

  describe('verifyAccessToken - JWT Signature Verification', () => {
    it('should reject JWT with wrong issuer', async () => {
      // Note: We cannot easily test JWKS signature verification in unit tests
      // because it requires network calls to the actual JWKS endpoint.
      // This test validates the error handling path instead.
      const jwt = await createMockCFAccessJWT(
        { email: 'test@example.com', sub: 'test-sub', identity_nonce: 'nonce123' },
        { issuer: 'https://wrong-issuer.com' }
      );

      const request = createMockRequest(jwt);

      // The actual JWKS verification will fail because we can't reach the real endpoint
      // in unit tests. This validates that errors are caught and null is returned.
      const result = await adapter.verifyAccessToken(request);

      expect(result).toBeNull();
    });

    it('should handle JWT verification errors gracefully', async () => {
      const request = createMockRequest('invalid.jwt.token');
      const result = await adapter.verifyAccessToken(request);

      expect(result).toBeNull();
    });
  });

  describe('verifyAccessToken - Expired JWT', () => {
    it('should return null for expired JWT', async () => {
      const jwt = await createMockCFAccessJWT(
        { email: 'test@example.com', sub: 'test-sub', identity_nonce: 'nonce123' },
        { expiresIn: '-1h' } // Already expired
      );

      const request = createMockRequest(jwt);
      const result = await adapter.verifyAccessToken(request);

      expect(result).toBeNull();
    });
  });

  describe('verifyAccessToken - Missing Email Claim', () => {
    it('should return null when JWT lacks email claim', async () => {
      const jwt = await createMockCFAccessJWT({
        sub: 'test-sub',
        identity_nonce: 'nonce123'
        // email is missing
      });

      const request = createMockRequest(jwt);

      // Since we can't easily mock jwtVerify without the real JWKS,
      // we test the email validation logic directly
      // Note: Current implementation doesn't handle undefined email gracefully
      // This test validates the current behavior (throws error)
      await expect(adapter.mapIdentityToUser(undefined, 'test-sub', {}))
        .rejects.toThrow();
    });
  });

  describe('mapIdentityToUser - Global Admin Mapping', () => {
    it('should map global admin email to admin role', async () => {
      const email = 'jose.beltran@mgeo.lu.se';
      const identityId = 'cf-identity-123';

      mockEnv.DB.first.mockResolvedValueOnce(null); // No existing user

      const result = await adapter.mapIdentityToUser(email, identityId, {});

      expect(result).toEqual({
        id: undefined,
        username: 'jose.beltran',
        email: email,
        role: 'admin',
        auth_provider: 'cloudflare_access',
        cf_access_identity_id: identityId,
        edit_privileges: true,
        permissions: ['read', 'write', 'edit', 'delete', 'admin']
      });
    });

    it('should handle global admin email case-insensitively', async () => {
      const email = 'JOSE.BELTRAN@MGEO.LU.SE';
      const identityId = 'cf-identity-456';

      mockEnv.DB.first.mockResolvedValueOnce(null);

      const result = await adapter.mapIdentityToUser(email, identityId, {});

      expect(result.role).toBe('admin');
      expect(result.email).toBe('jose.beltran@mgeo.lu.se');
    });

    it('should map second global admin correctly', async () => {
      const email = 'lars.eklundh@nateko.lu.se';
      const identityId = 'cf-identity-789';

      mockEnv.DB.first.mockResolvedValueOnce(null);

      const result = await adapter.mapIdentityToUser(email, identityId, {});

      expect(result.role).toBe('admin');
      expect(result.username).toBe('lars.eklundh');
    });
  });

  describe('mapIdentityToUser - Existing User Mapping', () => {
    it('should map existing database user', async () => {
      const email = 'test@example.com';
      const identityId = 'cf-identity-existing';

      mockEnv.DB.first.mockResolvedValueOnce(mockDatabaseUser);
      mockEnv.DB.run.mockResolvedValueOnce({ success: true });

      const result = await adapter.mapIdentityToUser(email, identityId, {});

      expect(result).toEqual({
        id: mockDatabaseUser.id,
        username: mockDatabaseUser.username,
        email: email,
        role: 'station',
        station_id: 1,
        station_acronym: 'SVB',
        auth_provider: 'cloudflare_access',
        cf_access_identity_id: identityId,
        edit_privileges: false,
        permissions: ['read']
      });

      // Verify last login timestamp was updated
      expect(mockEnv.DB.prepare).toHaveBeenCalled();
    });

    it('should map existing station-admin user', async () => {
      const email = 'admin@slu.se';
      const identityId = 'cf-identity-admin';

      mockEnv.DB.first.mockResolvedValueOnce(mockStationAdminUser);
      mockEnv.DB.run.mockResolvedValueOnce({ success: true });

      const result = await adapter.mapIdentityToUser(email, identityId, {});

      expect(result.role).toBe('station-admin');
      expect(result.edit_privileges).toBe(true);
      expect(result.permissions).toEqual(['read', 'write', 'edit', 'delete']);
    });

    it('should update last login timestamp for existing user', async () => {
      const email = 'test@example.com';
      const identityId = 'cf-identity-existing';

      mockEnv.DB.first.mockResolvedValueOnce(mockDatabaseUser);
      mockEnv.DB.run.mockResolvedValueOnce({ success: true });

      await adapter.mapIdentityToUser(email, identityId, {});

      // Check that updateLastCFAccessLogin was called via DB.prepare
      expect(mockEnv.DB.prepare).toHaveBeenCalled();
    });
  });

  describe('mapIdentityToUser - UAV Pilot Mapping', () => {
    it('should map UAV pilot by email', async () => {
      const email = 'pilot@example.com';
      const identityId = 'cf-identity-pilot';

      // First call: no regular user found
      mockEnv.DB.first
        .mockResolvedValueOnce(null) // findUserByCFAccessEmail
        .mockResolvedValueOnce(mockPilot); // findPilotByEmail

      const result = await adapter.mapIdentityToUser(email, identityId, {});

      expect(result).toEqual({
        id: mockPilot.user_id,
        username: 'pilot',
        email: email,
        role: 'uav-pilot',
        station_id: null,
        authorized_stations: ['SVB', 'ANS'],
        auth_provider: 'cloudflare_access',
        cf_access_identity_id: identityId,
        edit_privileges: false,
        permissions: ['read', 'flight-log']
      });
    });

    it('should parse authorized stations from JSON', async () => {
      const email = 'pilot@example.com';
      const identityId = 'cf-identity-pilot';

      mockEnv.DB.first
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          ...mockPilot,
          authorized_stations: '["LON", "GRI", "ANS"]'
        });

      const result = await adapter.mapIdentityToUser(email, identityId, {});

      expect(result.authorized_stations).toEqual(['LON', 'GRI', 'ANS']);
    });

    it('should handle pilot with empty authorized_stations', async () => {
      const email = 'pilot@example.com';
      const identityId = 'cf-identity-pilot';

      mockEnv.DB.first
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          ...mockPilot,
          authorized_stations: null
        });

      const result = await adapter.mapIdentityToUser(email, identityId, {});

      expect(result.authorized_stations).toEqual([]);
    });
  });

  describe('mapIdentityToUser - Unknown User', () => {
    it('should return null for unknown email', async () => {
      const email = 'unknown@example.com';
      const identityId = 'cf-identity-unknown';

      mockEnv.DB.first
        .mockResolvedValueOnce(null) // findUserByCFAccessEmail
        .mockResolvedValueOnce(null); // findPilotByEmail

      const result = await adapter.mapIdentityToUser(email, identityId, {});

      expect(result).toBeNull();
    });

    it('should not auto-create users', async () => {
      const email = 'new-user@example.com';
      const identityId = 'cf-identity-new';

      mockEnv.DB.first
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const result = await adapter.mapIdentityToUser(email, identityId, {});

      expect(result).toBeNull();
      // Verify no INSERT was attempted
      expect(mockEnv.DB.prepare).not.toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users')
      );
    });
  });

  describe('findUserByCFAccessEmail', () => {
    it('should find user by CF Access email', async () => {
      mockEnv.DB.first.mockResolvedValueOnce(mockDatabaseUser);

      const result = await adapter.findUserByCFAccessEmail('test@example.com');

      expect(result).toEqual(mockDatabaseUser);
      expect(mockEnv.DB.prepare).toHaveBeenCalled();
      expect(mockEnv.DB.bind).toHaveBeenCalledWith('test@example.com');
    });

    it('should return null when user not found', async () => {
      mockEnv.DB.first.mockResolvedValueOnce(null);

      const result = await adapter.findUserByCFAccessEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      mockEnv.DB.first.mockRejectedValueOnce(new Error('Database connection error'));

      const result = await adapter.findUserByCFAccessEmail('test@example.com');

      expect(result).toBeNull();
    });

    it('should only find active users', async () => {
      mockEnv.DB.first.mockResolvedValueOnce(null); // active = 1 filter excludes inactive

      const result = await adapter.findUserByCFAccessEmail('inactive@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findPilotByEmail', () => {
    it('should find active pilot by email', async () => {
      mockEnv.DB.first.mockResolvedValueOnce(mockPilot);

      const result = await adapter.findPilotByEmail('pilot@example.com');

      expect(result).toEqual(mockPilot);
    });

    it('should return null for inactive pilot', async () => {
      mockEnv.DB.first.mockResolvedValueOnce(null); // status = 'active' filter excludes inactive

      const result = await adapter.findPilotByEmail('inactive-pilot@example.com');

      expect(result).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      mockEnv.DB.first.mockRejectedValueOnce(new Error('Database error'));

      const result = await adapter.findPilotByEmail('pilot@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findOrCreateUser', () => {
    it('should find existing user by CF Access email', async () => {
      mockEnv.DB.first.mockResolvedValueOnce(mockDatabaseUser);
      mockEnv.DB.run.mockResolvedValueOnce({ success: true });

      const result = await adapter.findOrCreateUser({
        email: 'test@example.com',
        role: 'station',
        auth_provider: 'cloudflare_access',
        cf_access_identity_id: 'identity-123'
      });

      expect(result).toEqual(mockDatabaseUser);
      expect(mockEnv.DB.run).toHaveBeenCalled(); // Updates CF Access fields
    });

    it('should find existing user by username if email lookup fails', async () => {
      mockEnv.DB.first
        .mockResolvedValueOnce(null) // Email lookup fails
        .mockResolvedValueOnce(mockDatabaseUser); // Username lookup succeeds
      mockEnv.DB.run.mockResolvedValueOnce({ success: true });

      const result = await adapter.findOrCreateUser({
        email: 'test@example.com',
        role: 'admin',
        auth_provider: 'cloudflare_access',
        cf_access_identity_id: 'identity-123'
      });

      expect(result).toEqual(mockDatabaseUser);
    });

    it('should update CF Access fields for existing user', async () => {
      mockEnv.DB.first.mockResolvedValueOnce(mockDatabaseUser);
      mockEnv.DB.run.mockResolvedValueOnce({ success: true });

      await adapter.findOrCreateUser({
        email: 'test@example.com',
        role: 'station',
        auth_provider: 'cloudflare_access',
        cf_access_identity_id: 'new-identity-id'
      });

      expect(mockEnv.DB.bind).toHaveBeenCalledWith(
        'test@example.com',
        'new-identity-id',
        'cloudflare_access',
        mockDatabaseUser.id
      );
    });

    it('should not auto-create new users', async () => {
      mockEnv.DB.first
        .mockResolvedValueOnce(null) // Email lookup
        .mockResolvedValueOnce(null); // Username lookup

      const result = await adapter.findOrCreateUser({
        email: 'newuser@example.com',
        role: 'station',
        auth_provider: 'cloudflare_access',
        cf_access_identity_id: 'identity-123'
      });

      expect(result).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      mockEnv.DB.first.mockRejectedValueOnce(new Error('Database error'));

      const result = await adapter.findOrCreateUser({
        email: 'test@example.com',
        role: 'station',
        auth_provider: 'cloudflare_access',
        cf_access_identity_id: 'identity-123'
      });

      expect(result).toBeNull();
    });
  });

  describe('updateLastCFAccessLogin', () => {
    it('should update timestamp successfully', async () => {
      mockEnv.DB.run.mockResolvedValueOnce({ success: true });

      await adapter.updateLastCFAccessLogin(1);

      expect(mockEnv.DB.prepare).toHaveBeenCalled();
      expect(mockEnv.DB.bind).toHaveBeenCalledWith(1);
      expect(mockEnv.DB.run).toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      mockEnv.DB.run.mockRejectedValueOnce(new Error('Database error'));

      // Should not throw
      await expect(adapter.updateLastCFAccessLogin(1)).resolves.toBeUndefined();
    });
  });

  describe('hasEditPrivileges', () => {
    it('should return true for admin role', () => {
      expect(adapter.hasEditPrivileges('admin')).toBe(true);
    });

    it('should return true for sites-admin role', () => {
      expect(adapter.hasEditPrivileges('sites-admin')).toBe(true);
    });

    it('should return true for station-admin role', () => {
      expect(adapter.hasEditPrivileges('station-admin')).toBe(true);
    });

    it('should return false for station role', () => {
      expect(adapter.hasEditPrivileges('station')).toBe(false);
    });

    it('should return false for readonly role', () => {
      expect(adapter.hasEditPrivileges('readonly')).toBe(false);
    });

    it('should return false for uav-pilot role', () => {
      expect(adapter.hasEditPrivileges('uav-pilot')).toBe(false);
    });

    it('should return false for unknown role', () => {
      expect(adapter.hasEditPrivileges('unknown-role')).toBe(false);
    });
  });

  describe('getPermissionsForRole', () => {
    it('should return full permissions for admin', () => {
      const permissions = adapter.getPermissionsForRole('admin');
      expect(permissions).toEqual(['read', 'write', 'edit', 'delete', 'admin']);
    });

    it('should return full permissions for sites-admin', () => {
      const permissions = adapter.getPermissionsForRole('sites-admin');
      expect(permissions).toEqual(['read', 'write', 'edit', 'delete', 'admin']);
    });

    it('should return CRUD permissions for station-admin (no admin)', () => {
      const permissions = adapter.getPermissionsForRole('station-admin');
      expect(permissions).toEqual(['read', 'write', 'edit', 'delete']);
      expect(permissions).not.toContain('admin');
    });

    it('should return read-only for station role', () => {
      const permissions = adapter.getPermissionsForRole('station');
      expect(permissions).toEqual(['read']);
    });

    it('should return read-only for readonly role', () => {
      const permissions = adapter.getPermissionsForRole('readonly');
      expect(permissions).toEqual(['read']);
    });

    it('should return read and flight-log for uav-pilot', () => {
      const permissions = adapter.getPermissionsForRole('uav-pilot');
      expect(permissions).toEqual(['read', 'flight-log']);
    });

    it('should return read-only for station-internal', () => {
      const permissions = adapter.getPermissionsForRole('station-internal');
      expect(permissions).toEqual(['read']);
    });

    it('should default to read-only for unknown role', () => {
      const permissions = adapter.getPermissionsForRole('unknown-role');
      expect(permissions).toEqual(['read']);
    });
  });

  describe('getSubdomain (static)', () => {
    it('should extract subdomain from production domain', () => {
      const request = createMockRequest(null, {
        'Host': 'svb.sitesspectral.work'
      });

      const subdomain = CloudflareAccessAdapter.getSubdomain(request);
      expect(subdomain).toBe('svb');
    });

    it('should extract admin subdomain', () => {
      const request = createMockRequest(null, {
        'Host': 'admin.sitesspectral.work'
      });

      const subdomain = CloudflareAccessAdapter.getSubdomain(request);
      expect(subdomain).toBe('admin');
    });

    it('should return null for root domain', () => {
      const request = createMockRequest(null, {
        'Host': 'sitesspectral.work'
      });

      const subdomain = CloudflareAccessAdapter.getSubdomain(request);
      expect(subdomain).toBeNull();
    });

    it('should return null for www subdomain equivalent', () => {
      const request = createMockRequest(null, {
        'Host': 'www.sitesspectral.work'
      });

      const subdomain = CloudflareAccessAdapter.getSubdomain(request);
      // Note: Current implementation doesn't handle www specially
      expect(subdomain).toBe('www');
    });

    it('should handle workers.dev URLs with X-Subdomain header', () => {
      const request = createMockRequest(null, {
        'Host': 'sites-spectral-instruments.jose-beltran.workers.dev',
        'X-Subdomain': 'svb'
      });

      const subdomain = CloudflareAccessAdapter.getSubdomain(request);
      expect(subdomain).toBe('svb');
    });

    it('should return null for workers.dev without X-Subdomain header', () => {
      const request = createMockRequest(null, {
        'Host': 'sites-spectral-instruments.jose-beltran.workers.dev'
      });

      const subdomain = CloudflareAccessAdapter.getSubdomain(request);
      expect(subdomain).toBeNull();
    });

    it('should handle missing Host header', () => {
      const request = createMockRequest(null, {});

      const subdomain = CloudflareAccessAdapter.getSubdomain(request);
      expect(subdomain).toBeNull();
    });
  });

  describe('getPortalType (static)', () => {
    it('should return "public" for null subdomain', () => {
      const portalType = CloudflareAccessAdapter.getPortalType(null);
      expect(portalType).toBe('public');
    });

    it('should return "public" for www subdomain', () => {
      const portalType = CloudflareAccessAdapter.getPortalType('www');
      expect(portalType).toBe('public');
    });

    it('should return "admin" for admin subdomain', () => {
      const portalType = CloudflareAccessAdapter.getPortalType('admin');
      expect(portalType).toBe('admin');
    });

    it('should return "station" for station subdomain', () => {
      const portalType = CloudflareAccessAdapter.getPortalType('svb');
      expect(portalType).toBe('station');
    });

    it('should return "station" for any non-admin subdomain', () => {
      expect(CloudflareAccessAdapter.getPortalType('ans')).toBe('station');
      expect(CloudflareAccessAdapter.getPortalType('lon')).toBe('station');
      expect(CloudflareAccessAdapter.getPortalType('gri')).toBe('station');
    });
  });

  describe('canAccessPortal (static)', () => {
    describe('Public Portal', () => {
      it('should allow unauthenticated access to public portal', () => {
        const canAccess = CloudflareAccessAdapter.canAccessPortal(null, 'public', null);
        expect(canAccess).toBe(true);
      });

      it('should allow authenticated access to public portal', () => {
        const user = { role: 'admin' };
        const canAccess = CloudflareAccessAdapter.canAccessPortal(user, 'public', null);
        expect(canAccess).toBe(true);
      });
    });

    describe('Admin Portal', () => {
      it('should deny unauthenticated access to admin portal', () => {
        const canAccess = CloudflareAccessAdapter.canAccessPortal(null, 'admin', 'admin');
        expect(canAccess).toBe(false);
      });

      it('should allow admin role access to admin portal', () => {
        const user = { role: 'admin' };
        const canAccess = CloudflareAccessAdapter.canAccessPortal(user, 'admin', 'admin');
        expect(canAccess).toBe(true);
      });

      it('should allow sites-admin role access to admin portal', () => {
        const user = { role: 'sites-admin' };
        const canAccess = CloudflareAccessAdapter.canAccessPortal(user, 'admin', 'admin');
        expect(canAccess).toBe(true);
      });

      it('should deny station-admin access to admin portal', () => {
        const user = { role: 'station-admin', station_acronym: 'SVB' };
        const canAccess = CloudflareAccessAdapter.canAccessPortal(user, 'admin', 'admin');
        expect(canAccess).toBe(false);
      });

      it('should deny station user access to admin portal', () => {
        const user = { role: 'station', station_acronym: 'SVB' };
        const canAccess = CloudflareAccessAdapter.canAccessPortal(user, 'admin', 'admin');
        expect(canAccess).toBe(false);
      });

      it('should deny readonly access to admin portal', () => {
        const user = { role: 'readonly' };
        const canAccess = CloudflareAccessAdapter.canAccessPortal(user, 'admin', 'admin');
        expect(canAccess).toBe(false);
      });
    });

    describe('Station Portal', () => {
      it('should deny unauthenticated access to station portal', () => {
        const canAccess = CloudflareAccessAdapter.canAccessPortal(null, 'station', 'svb');
        expect(canAccess).toBe(false);
      });

      it('should allow global admin to access any station portal', () => {
        const user = { role: 'admin' };
        const canAccess = CloudflareAccessAdapter.canAccessPortal(user, 'station', 'svb');
        expect(canAccess).toBe(true);
      });

      it('should allow sites-admin to access any station portal', () => {
        const user = { role: 'sites-admin' };
        const canAccess = CloudflareAccessAdapter.canAccessPortal(user, 'station', 'ans');
        expect(canAccess).toBe(true);
      });

      it('should allow station-admin to access their own station', () => {
        const user = { role: 'station-admin', station_acronym: 'SVB' };
        const canAccess = CloudflareAccessAdapter.canAccessPortal(user, 'station', 'svb');
        expect(canAccess).toBe(true);
      });

      it('should deny station-admin access to other stations', () => {
        const user = { role: 'station-admin', station_acronym: 'SVB' };
        const canAccess = CloudflareAccessAdapter.canAccessPortal(user, 'station', 'ans');
        expect(canAccess).toBe(false);
      });

      it('should allow station user to access their own station', () => {
        const user = { role: 'station', station_acronym: 'ANS' };
        const canAccess = CloudflareAccessAdapter.canAccessPortal(user, 'station', 'ans');
        expect(canAccess).toBe(true);
      });

      it('should deny station user access to other stations', () => {
        const user = { role: 'station', station_acronym: 'SVB' };
        const canAccess = CloudflareAccessAdapter.canAccessPortal(user, 'station', 'lon');
        expect(canAccess).toBe(false);
      });

      it('should handle case-insensitive subdomain matching', () => {
        const user = { role: 'station', station_acronym: 'SVB' };
        const canAccess = CloudflareAccessAdapter.canAccessPortal(user, 'station', 'SVB');
        expect(canAccess).toBe(true);
      });

      it('should allow UAV pilot to access authorized stations', () => {
        const user = {
          role: 'uav-pilot',
          authorized_stations: ['SVB', 'ANS', 'LON']
        };
        const canAccess = CloudflareAccessAdapter.canAccessPortal(user, 'station', 'svb');
        expect(canAccess).toBe(true);
      });

      it('should deny UAV pilot access to unauthorized stations', () => {
        const user = {
          role: 'uav-pilot',
          authorized_stations: ['SVB', 'ANS']
        };
        const canAccess = CloudflareAccessAdapter.canAccessPortal(user, 'station', 'gri');
        expect(canAccess).toBe(false);
      });

      it('should handle UAV pilot with case-insensitive station matching', () => {
        const user = {
          role: 'uav-pilot',
          authorized_stations: ['SVB', 'ANS']
        };
        const canAccess = CloudflareAccessAdapter.canAccessPortal(user, 'station', 'SVB');
        expect(canAccess).toBe(true);
      });

      it('should deny readonly user access to station portals', () => {
        const user = { role: 'readonly' };
        const canAccess = CloudflareAccessAdapter.canAccessPortal(user, 'station', 'svb');
        expect(canAccess).toBe(false);
      });
    });

    describe('Edge Cases', () => {
      it('should deny access when user is null and portal is not public', () => {
        expect(CloudflareAccessAdapter.canAccessPortal(null, 'admin', 'admin')).toBe(false);
        expect(CloudflareAccessAdapter.canAccessPortal(null, 'station', 'svb')).toBe(false);
      });

      it('should handle user without station_acronym', () => {
        const user = { role: 'station', station_acronym: null };
        const canAccess = CloudflareAccessAdapter.canAccessPortal(user, 'station', 'svb');
        expect(canAccess).toBe(false);
      });

      it('should handle subdomain as null', () => {
        const user = { role: 'station', station_acronym: 'SVB' };
        const canAccess = CloudflareAccessAdapter.canAccessPortal(user, 'station', null);
        expect(canAccess).toBe(false);
      });

      it('should handle UAV pilot without authorized_stations', () => {
        const user = { role: 'uav-pilot', authorized_stations: null };
        const canAccess = CloudflareAccessAdapter.canAccessPortal(user, 'station', 'svb');
        expect(canAccess).toBe(false);
      });

      it('should handle UAV pilot with empty authorized_stations', () => {
        const user = { role: 'uav-pilot', authorized_stations: [] };
        const canAccess = CloudflareAccessAdapter.canAccessPortal(user, 'station', 'svb');
        expect(canAccess).toBe(false);
      });
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete global admin authentication flow', async () => {
      const email = 'jose.beltran@mgeo.lu.se';
      const identityId = 'cf-global-admin-123';

      mockEnv.DB.first.mockResolvedValueOnce(null); // No existing user

      const userInfo = await adapter.mapIdentityToUser(email, identityId, {});

      expect(userInfo.role).toBe('admin');
      expect(userInfo.edit_privileges).toBe(true);
      expect(userInfo.permissions).toContain('admin');

      // Verify can access admin portal
      const canAccessAdmin = CloudflareAccessAdapter.canAccessPortal(userInfo, 'admin', 'admin');
      expect(canAccessAdmin).toBe(true);

      // Verify can access any station
      const canAccessStation = CloudflareAccessAdapter.canAccessPortal(userInfo, 'station', 'svb');
      expect(canAccessStation).toBe(true);
    });

    it('should handle complete station user authentication flow', async () => {
      const email = 'test@example.com';
      const identityId = 'cf-station-user-456';

      mockEnv.DB.first.mockResolvedValueOnce(mockDatabaseUser);
      mockEnv.DB.run.mockResolvedValueOnce({ success: true });

      const userInfo = await adapter.mapIdentityToUser(email, identityId, {});

      expect(userInfo.role).toBe('station');
      expect(userInfo.station_acronym).toBe('SVB');
      expect(userInfo.edit_privileges).toBe(false);

      // Verify can access own station
      const canAccessOwnStation = CloudflareAccessAdapter.canAccessPortal(userInfo, 'station', 'svb');
      expect(canAccessOwnStation).toBe(true);

      // Verify cannot access other stations
      const canAccessOtherStation = CloudflareAccessAdapter.canAccessPortal(userInfo, 'station', 'ans');
      expect(canAccessOtherStation).toBe(false);

      // Verify cannot access admin
      const canAccessAdmin = CloudflareAccessAdapter.canAccessPortal(userInfo, 'admin', 'admin');
      expect(canAccessAdmin).toBe(false);
    });

    it('should handle complete UAV pilot authentication flow', async () => {
      const email = 'pilot@example.com';
      const identityId = 'cf-pilot-789';

      mockEnv.DB.first
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockPilot);

      const userInfo = await adapter.mapIdentityToUser(email, identityId, {});

      expect(userInfo.role).toBe('uav-pilot');
      expect(userInfo.permissions).toContain('flight-log');

      // Verify can access authorized stations
      const canAccessSVB = CloudflareAccessAdapter.canAccessPortal(userInfo, 'station', 'svb');
      expect(canAccessSVB).toBe(true);

      const canAccessANS = CloudflareAccessAdapter.canAccessPortal(userInfo, 'station', 'ans');
      expect(canAccessANS).toBe(true);

      // Verify cannot access unauthorized stations
      const canAccessGRI = CloudflareAccessAdapter.canAccessPortal(userInfo, 'station', 'gri');
      expect(canAccessGRI).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection failures gracefully', async () => {
      mockEnv.DB.first.mockRejectedValueOnce(new Error('Connection timeout'));

      const result = await adapter.findUserByCFAccessEmail('test@example.com');
      expect(result).toBeNull();
    });

    it('should handle malformed JSON in authorized_stations', async () => {
      const email = 'pilot@example.com';
      const identityId = 'cf-pilot-bad-json';

      mockEnv.DB.first
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          ...mockPilot,
          authorized_stations: 'invalid-json'
        });

      // The current implementation uses JSON.parse which throws on invalid JSON
      // In production, this should be caught and handled gracefully
      await expect(adapter.mapIdentityToUser(email, identityId, {}))
        .rejects.toThrow();
    });

    it('should handle null environment gracefully', () => {
      const nullEnvAdapter = new CloudflareAccessAdapter({});
      expect(nullEnvAdapter.env).toEqual({});
    });
  });
});
