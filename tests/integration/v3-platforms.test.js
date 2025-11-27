/**
 * SITES Spectral V3 API Platforms Tests
 * Tests for /api/v3/platforms endpoints
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import {
  createMockRequest,
  createMockCtx,
  apiUrl,
  parseJsonResponse,
  generateTestToken,
} from '../utils/test-helpers.js';
import { initializeTestDatabase, seedTestDatabase, resetTestDatabase } from '../utils/db-setup.js';
import { handleApiV3Request } from '../../src/v3/api-handler-v3.js';
import { generatePlatform } from '../fixtures/mock-data.js';

describe('V3 Platforms - Read Operations', () => {
  beforeAll(async () => {
    await initializeTestDatabase(env.DB);
    await seedTestDatabase(env.DB);
  });

  describe('GET /api/v3/platforms', () => {
    it('should require authentication', async () => {
      const request = createMockRequest(apiUrl('/api/v3/platforms'));
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);

      expect(response.status).toBe(401);
    });

    it('should return paginated platforms with valid token', async () => {
      const token = generateTestToken({ role: 'admin' });
      const request = createMockRequest(apiUrl('/api/v3/platforms'), {
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(json.data).toBeDefined();
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.meta).toBeDefined();
      expect(json.meta.total).toBeGreaterThan(0);
      expect(json.meta.page).toBe(1);
    });

    it('should support pagination parameters', async () => {
      const token = generateTestToken({ role: 'admin' });
      const request = createMockRequest(apiUrl('/api/v3/platforms?page=1&limit=2'), {
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(json.data.length).toBeLessThanOrEqual(2);
      expect(json.meta.limit).toBe(2);
    });

    it('should filter by station', async () => {
      const token = generateTestToken({ role: 'admin' });
      const request = createMockRequest(apiUrl('/api/v3/platforms?station=SVB'), {
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      // All platforms should be from SVB station
      json.data.forEach((platform) => {
        expect(platform.station_id).toBe(1); // SVB has id 1
      });
    });

    it('should filter by platform type', async () => {
      const token = generateTestToken({ role: 'admin' });
      const request = createMockRequest(apiUrl('/api/v3/platforms?type=fixed'), {
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      json.data.forEach((platform) => {
        expect(platform.platform_type).toBe('fixed');
      });
    });
  });

  describe('GET /api/v3/platforms/:id', () => {
    it('should return a single platform by ID', async () => {
      const token = generateTestToken({ role: 'admin' });
      const request = createMockRequest(apiUrl('/api/v3/platforms/1'), {
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(json.id).toBe(1);
      expect(json.normalized_name).toBeDefined();
    });

    it('should return 404 for non-existent platform', async () => {
      const token = generateTestToken({ role: 'admin' });
      const request = createMockRequest(apiUrl('/api/v3/platforms/99999'), {
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/v3/platforms/type/:type', () => {
    it('should return platforms filtered by type', async () => {
      const token = generateTestToken({ role: 'admin' });
      const request = createMockRequest(apiUrl('/api/v3/platforms/type/uav'), {
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(json.data).toBeDefined();
      json.data.forEach((platform) => {
        expect(platform.platform_type).toBe('uav');
      });
    });

    it('should return 400 for invalid platform type', async () => {
      const token = generateTestToken({ role: 'admin' });
      const request = createMockRequest(apiUrl('/api/v3/platforms/type/invalid'), {
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);

      expect(response.status).toBe(400);
    });
  });
});

describe('V3 Platforms - Write Operations', () => {
  beforeEach(async () => {
    await resetTestDatabase(env.DB);
  });

  describe('POST /api/v3/platforms', () => {
    it('should create a new platform with admin token', async () => {
      const token = generateTestToken({ role: 'admin' });
      const newPlatform = generatePlatform();

      const request = createMockRequest(apiUrl('/api/v3/platforms'), {
        method: 'POST',
        authToken: token,
        body: newPlatform,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(201);
      expect(json.id).toBeDefined();
      expect(json.normalized_name).toBe(newPlatform.normalized_name);
    });

    it('should reject creation with station user for different station', async () => {
      const token = generateTestToken({
        role: 'station',
        station_id: 2, // ANS
        station_acronym: 'ANS',
      });
      const newPlatform = generatePlatform({ station_id: 1 }); // SVB

      const request = createMockRequest(apiUrl('/api/v3/platforms'), {
        method: 'POST',
        authToken: token,
        body: newPlatform,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);

      expect(response.status).toBe(403);
    });

    it('should reject creation with readonly user', async () => {
      const token = generateTestToken({ role: 'readonly' });
      const newPlatform = generatePlatform();

      const request = createMockRequest(apiUrl('/api/v3/platforms'), {
        method: 'POST',
        authToken: token,
        body: newPlatform,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);

      expect(response.status).toBe(403);
    });

    it('should validate required fields', async () => {
      const token = generateTestToken({ role: 'admin' });
      const invalidPlatform = { display_name: 'Missing Required Fields' };

      const request = createMockRequest(apiUrl('/api/v3/platforms'), {
        method: 'POST',
        authToken: token,
        body: invalidPlatform,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/v3/platforms/:id', () => {
    it('should update an existing platform', async () => {
      const token = generateTestToken({ role: 'admin' });
      const updates = { display_name: 'Updated Platform Name' };

      const request = createMockRequest(apiUrl('/api/v3/platforms/1'), {
        method: 'PUT',
        authToken: token,
        body: updates,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(json.display_name).toBe('Updated Platform Name');
    });

    it('should return 404 for non-existent platform', async () => {
      const token = generateTestToken({ role: 'admin' });
      const updates = { display_name: 'Does Not Exist' };

      const request = createMockRequest(apiUrl('/api/v3/platforms/99999'), {
        method: 'PUT',
        authToken: token,
        body: updates,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/v3/platforms/:id', () => {
    it('should delete an existing platform', async () => {
      const token = generateTestToken({ role: 'admin' });

      const request = createMockRequest(apiUrl('/api/v3/platforms/1'), {
        method: 'DELETE',
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);

      expect(response.status).toBe(200);
    });

    it('should reject deletion with readonly user', async () => {
      const token = generateTestToken({ role: 'readonly' });

      const request = createMockRequest(apiUrl('/api/v3/platforms/1'), {
        method: 'DELETE',
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);

      expect(response.status).toBe(403);
    });
  });
});

describe('V3 Platforms - UAV Extension', () => {
  beforeAll(async () => {
    await resetTestDatabase(env.DB);
  });

  describe('GET /api/v3/platforms/:id/uav', () => {
    it('should return UAV extension data for UAV platform', async () => {
      const token = generateTestToken({ role: 'admin' });
      // Platform 3 is the UAV platform in mock data
      const request = createMockRequest(apiUrl('/api/v3/platforms/3/uav'), {
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(json.uav_model).toBeDefined();
      expect(json.manufacturer).toBeDefined();
    });
  });
});

describe('V3 Platforms - Sorting and Filtering', () => {
  beforeAll(async () => {
    await resetTestDatabase(env.DB);
  });

  it('should support sorting by name ASC', async () => {
    const token = generateTestToken({ role: 'admin' });
    const request = createMockRequest(apiUrl('/api/v3/platforms?sort_by=normalized_name&sort_order=ASC'), {
      authToken: token,
    });
    const ctx = createMockCtx();

    const response = await handleApiV3Request(request, env, ctx);
    const json = await parseJsonResponse(response);

    expect(response.status).toBe(200);
    // Check that data is sorted
    if (json.data.length > 1) {
      for (let i = 1; i < json.data.length; i++) {
        expect(json.data[i].normalized_name >= json.data[i - 1].normalized_name).toBe(true);
      }
    }
  });

  it('should support filtering by ecosystem', async () => {
    const token = generateTestToken({ role: 'admin' });
    const request = createMockRequest(apiUrl('/api/v3/platforms?ecosystem=FOR'), {
      authToken: token,
    });
    const ctx = createMockCtx();

    const response = await handleApiV3Request(request, env, ctx);
    const json = await parseJsonResponse(response);

    expect(response.status).toBe(200);
    json.data.forEach((platform) => {
      expect(platform.ecosystem_code).toBe('FOR');
    });
  });

  it('should support filtering by status', async () => {
    const token = generateTestToken({ role: 'admin' });
    const request = createMockRequest(apiUrl('/api/v3/platforms?status=active'), {
      authToken: token,
    });
    const ctx = createMockCtx();

    const response = await handleApiV3Request(request, env, ctx);
    const json = await parseJsonResponse(response);

    expect(response.status).toBe(200);
    json.data.forEach((platform) => {
      expect(platform.status).toBe('active');
    });
  });
});
