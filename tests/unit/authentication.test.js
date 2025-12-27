/**
 * JWT Authentication Tests
 * Tests for JWT token generation, validation, and user authentication
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SignJWT, jwtVerify } from 'jose';

// Note: We test the authentication logic patterns without importing the full module
// due to environment dependencies (Cloudflare Workers, D1 database)

// Mock user data for testing
const mockAdminUser = {
  username: 'admin',
  role: 'admin',
  station_acronym: null,
  station_normalized_name: null,
  station_id: null,
  edit_privileges: true,
  permissions: ['read', 'write', 'edit', 'delete', 'admin']
};

const mockStationUser = {
  username: 'svartberget',
  role: 'station',
  station_acronym: 'SVB',
  station_normalized_name: 'svartberget',
  station_id: 1,
  edit_privileges: false,
  permissions: ['read']
};

const mockStationAdmin = {
  username: 'svartberget-admin',
  role: 'station-admin',
  station_acronym: 'SVB',
  station_normalized_name: 'svartberget',
  station_id: 1,
  edit_privileges: true,
  permissions: ['read', 'write', 'edit', 'delete']
};

// Test JWT secret (for testing only - never use in production)
const TEST_JWT_SECRET = new TextEncoder().encode('test-jwt-secret-for-testing-only-32chars!');

describe('JWT Authentication', () => {
  describe('JWT Token Generation', () => {
    it('should generate valid JWT with HMAC-SHA256 algorithm', async () => {
      const jwt = await new SignJWT({
        username: mockAdminUser.username,
        role: mockAdminUser.role,
        permissions: mockAdminUser.permissions
      })
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .setIssuer('sites-spectral')
        .setSubject(mockAdminUser.username)
        .sign(TEST_JWT_SECRET);

      expect(jwt).toBeDefined();
      expect(typeof jwt).toBe('string');
      expect(jwt.split('.')).toHaveLength(3); // Header.Payload.Signature
    });

    it('should include all required user claims in token', async () => {
      const jwt = await new SignJWT({
        username: mockStationUser.username,
        role: mockStationUser.role,
        station_acronym: mockStationUser.station_acronym,
        station_normalized_name: mockStationUser.station_normalized_name,
        station_id: mockStationUser.station_id,
        edit_privileges: mockStationUser.edit_privileges,
        permissions: mockStationUser.permissions
      })
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .setIssuer('sites-spectral')
        .setSubject(mockStationUser.username)
        .sign(TEST_JWT_SECRET);

      const { payload } = await jwtVerify(jwt, TEST_JWT_SECRET, {
        issuer: 'sites-spectral'
      });

      expect(payload.username).toBe('svartberget');
      expect(payload.role).toBe('station');
      expect(payload.station_acronym).toBe('SVB');
      expect(payload.station_normalized_name).toBe('svartberget');
      expect(payload.station_id).toBe(1);
      expect(payload.edit_privileges).toBe(false);
      expect(payload.permissions).toEqual(['read']);
    });

    it('should set 24-hour expiration time', async () => {
      const jwt = await new SignJWT({
        username: mockAdminUser.username,
        role: mockAdminUser.role
      })
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .setIssuer('sites-spectral')
        .setSubject(mockAdminUser.username)
        .sign(TEST_JWT_SECRET);

      const { payload } = await jwtVerify(jwt, TEST_JWT_SECRET);

      // Check expiration is approximately 24 hours in the future
      const now = Math.floor(Date.now() / 1000);
      const expectedExp = now + (24 * 60 * 60);

      expect(payload.exp).toBeGreaterThan(now);
      expect(payload.exp).toBeLessThanOrEqual(expectedExp + 5); // 5 second tolerance
    });

    it('should set correct issuer claim', async () => {
      const jwt = await new SignJWT({
        username: mockAdminUser.username,
        role: mockAdminUser.role
      })
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .setIssuer('sites-spectral')
        .setSubject(mockAdminUser.username)
        .sign(TEST_JWT_SECRET);

      const { payload } = await jwtVerify(jwt, TEST_JWT_SECRET, {
        issuer: 'sites-spectral'
      });

      expect(payload.iss).toBe('sites-spectral');
    });

    it('should set subject to username', async () => {
      const jwt = await new SignJWT({
        username: mockStationAdmin.username,
        role: mockStationAdmin.role
      })
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .setIssuer('sites-spectral')
        .setSubject(mockStationAdmin.username)
        .sign(TEST_JWT_SECRET);

      const { payload } = await jwtVerify(jwt, TEST_JWT_SECRET);

      expect(payload.sub).toBe('svartberget-admin');
    });
  });

  describe('JWT Token Validation', () => {
    it('should validate token with correct secret', async () => {
      const jwt = await new SignJWT({
        username: mockAdminUser.username,
        role: mockAdminUser.role
      })
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .setIssuer('sites-spectral')
        .setSubject(mockAdminUser.username)
        .sign(TEST_JWT_SECRET);

      const { payload } = await jwtVerify(jwt, TEST_JWT_SECRET, {
        issuer: 'sites-spectral'
      });

      expect(payload.username).toBe(mockAdminUser.username);
    });

    it('should reject token with wrong secret', async () => {
      const jwt = await new SignJWT({
        username: mockAdminUser.username,
        role: mockAdminUser.role
      })
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .setIssuer('sites-spectral')
        .sign(TEST_JWT_SECRET);

      const wrongSecret = new TextEncoder().encode('wrong-secret-key-different-from-original');

      await expect(jwtVerify(jwt, wrongSecret, { issuer: 'sites-spectral' }))
        .rejects.toThrow();
    });

    it('should reject token with wrong issuer', async () => {
      const jwt = await new SignJWT({
        username: mockAdminUser.username,
        role: mockAdminUser.role
      })
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .setIssuer('wrong-issuer')
        .sign(TEST_JWT_SECRET);

      await expect(jwtVerify(jwt, TEST_JWT_SECRET, { issuer: 'sites-spectral' }))
        .rejects.toThrow();
    });

    it('should reject expired token', async () => {
      const jwt = await new SignJWT({
        username: mockAdminUser.username,
        role: mockAdminUser.role
      })
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setIssuedAt()
        .setExpirationTime('-1h') // Already expired
        .setIssuer('sites-spectral')
        .sign(TEST_JWT_SECRET);

      await expect(jwtVerify(jwt, TEST_JWT_SECRET, { issuer: 'sites-spectral' }))
        .rejects.toThrow();
    });

    it('should reject tampered token', async () => {
      const jwt = await new SignJWT({
        username: mockAdminUser.username,
        role: mockAdminUser.role
      })
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .setIssuer('sites-spectral')
        .sign(TEST_JWT_SECRET);

      // Tamper with the payload
      const parts = jwt.split('.');
      const tamperedPayload = btoa(JSON.stringify({
        username: 'hacker',
        role: 'admin', // Trying to escalate privileges
        exp: Math.floor(Date.now() / 1000) + 86400
      }));
      const tamperedJwt = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

      await expect(jwtVerify(tamperedJwt, TEST_JWT_SECRET, { issuer: 'sites-spectral' }))
        .rejects.toThrow();
    });

    it('should reject malformed token', async () => {
      await expect(jwtVerify('not-a-valid-jwt', TEST_JWT_SECRET))
        .rejects.toThrow();
    });

    it('should reject empty token', async () => {
      await expect(jwtVerify('', TEST_JWT_SECRET))
        .rejects.toThrow();
    });
  });

  describe('User Role Claims', () => {
    it('should correctly encode admin user claims', async () => {
      const jwt = await new SignJWT({
        ...mockAdminUser
      })
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .setIssuer('sites-spectral')
        .setSubject(mockAdminUser.username)
        .sign(TEST_JWT_SECRET);

      const { payload } = await jwtVerify(jwt, TEST_JWT_SECRET);

      expect(payload.role).toBe('admin');
      expect(payload.edit_privileges).toBe(true);
      expect(payload.station_id).toBeNull();
      expect(payload.permissions).toContain('admin');
    });

    it('should correctly encode station user claims', async () => {
      const jwt = await new SignJWT({
        ...mockStationUser
      })
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .setIssuer('sites-spectral')
        .setSubject(mockStationUser.username)
        .sign(TEST_JWT_SECRET);

      const { payload } = await jwtVerify(jwt, TEST_JWT_SECRET);

      expect(payload.role).toBe('station');
      expect(payload.edit_privileges).toBe(false);
      expect(payload.station_id).toBe(1);
      expect(payload.station_acronym).toBe('SVB');
      expect(payload.permissions).toEqual(['read']);
      expect(payload.permissions).not.toContain('admin');
    });

    it('should correctly encode station-admin claims', async () => {
      const jwt = await new SignJWT({
        ...mockStationAdmin
      })
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .setIssuer('sites-spectral')
        .setSubject(mockStationAdmin.username)
        .sign(TEST_JWT_SECRET);

      const { payload } = await jwtVerify(jwt, TEST_JWT_SECRET);

      expect(payload.role).toBe('station-admin');
      expect(payload.edit_privileges).toBe(true);
      expect(payload.station_id).toBe(1);
      expect(payload.station_acronym).toBe('SVB');
      expect(payload.permissions).toContain('write');
      expect(payload.permissions).toContain('delete');
      expect(payload.permissions).not.toContain('admin');
    });
  });

  describe('Security Best Practices', () => {
    it('should use HS256 algorithm (not weaker algorithms)', async () => {
      const jwt = await new SignJWT({
        username: mockAdminUser.username
      })
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(TEST_JWT_SECRET);

      // Decode header to verify algorithm
      const [headerB64] = jwt.split('.');
      const header = JSON.parse(atob(headerB64));

      expect(header.alg).toBe('HS256');
      expect(header.alg).not.toBe('none');
      expect(header.alg).not.toBe('HS384');
      expect(header.alg).not.toBe('HS512');
    });

    it('should always include expiration claim', async () => {
      const jwt = await new SignJWT({
        username: mockAdminUser.username
      })
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .setIssuer('sites-spectral')
        .sign(TEST_JWT_SECRET);

      const { payload } = await jwtVerify(jwt, TEST_JWT_SECRET);

      expect(payload.exp).toBeDefined();
      expect(typeof payload.exp).toBe('number');
    });

    it('should always include issued-at claim', async () => {
      const jwt = await new SignJWT({
        username: mockAdminUser.username
      })
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .setIssuer('sites-spectral')
        .sign(TEST_JWT_SECRET);

      const { payload } = await jwtVerify(jwt, TEST_JWT_SECRET);

      expect(payload.iat).toBeDefined();
      expect(typeof payload.iat).toBe('number');
    });

    it('should not include sensitive data in token', async () => {
      // Ensure password or other sensitive data is not in the token
      const jwt = await new SignJWT({
        username: mockAdminUser.username,
        role: mockAdminUser.role,
        // password: 'secret' // This should NEVER be included
      })
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(TEST_JWT_SECRET);

      const { payload } = await jwtVerify(jwt, TEST_JWT_SECRET);

      expect(payload.password).toBeUndefined();
      expect(payload.password_hash).toBeUndefined();
      expect(payload.secret).toBeUndefined();
    });
  });

  describe('Token Extraction Patterns', () => {
    // Test the Authorization header extraction pattern
    it('should extract token from Bearer Authorization header format', () => {
      const authHeader = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature';

      const token = authHeader.startsWith('Bearer ')
        ? authHeader.substring(7)
        : null;

      expect(token).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature');
    });

    it('should return null for non-Bearer auth header', () => {
      const authHeader = 'Basic dXNlcm5hbWU6cGFzc3dvcmQ=';

      const token = authHeader.startsWith('Bearer ')
        ? authHeader.substring(7)
        : null;

      expect(token).toBeNull();
    });

    it('should handle missing auth header', () => {
      const authHeader = null;

      const token = authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.substring(7)
        : null;

      expect(token).toBeNull();
    });
  });
});
