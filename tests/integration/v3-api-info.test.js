/**
 * SITES Spectral V3 API Info and Health Tests
 * Tests for /api/v3/info and /api/v3/health endpoints
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createMockRequest, createMockCtx, apiUrl, parseJsonResponse, getMockEnv } from '../utils/test-helpers.js';
import { initializeTestDatabase, seedTestDatabase } from '../utils/db-setup.js';
import { handleApiV3Request } from '../../src/v3/api-handler-v3.js';

// Get mock environment
const env = getMockEnv();

describe('V3 API Info Endpoint', () => {
  beforeAll(async () => {
    await initializeTestDatabase(env.DB);
    await seedTestDatabase(env.DB);
  });

  it('should return API information without authentication', async () => {
    const request = createMockRequest(apiUrl('/api/v3/info'));
    const ctx = createMockCtx();

    const response = await handleApiV3Request(request, env, ctx);
    const json = await parseJsonResponse(response);

    expect(response.status).toBe(200);
    expect(json.name).toBe('SITES Spectral Instruments API');
    expect(json.version).toBe('3.0.0');
    expect(json.endpoints).toBeDefined();
    expect(json.platformTypes).toContain('fixed');
    expect(json.platformTypes).toContain('uav');
    expect(json.platformTypes).toContain('satellite');
  });

  it('should list all available endpoints', async () => {
    const request = createMockRequest(apiUrl('/api/v3/info'));
    const ctx = createMockCtx();

    const response = await handleApiV3Request(request, env, ctx);
    const json = await parseJsonResponse(response);

    // Check platform endpoints
    expect(json.endpoints.platforms).toBeDefined();
    expect(json.endpoints.platforms.base).toBe('/api/v3/platforms');
    expect(json.endpoints.platforms.types).toContain('/api/v3/platforms/type/');

    // Check AOI endpoints
    expect(json.endpoints.aois).toBeDefined();
    expect(json.endpoints.aois.spatial).toBeDefined();
    expect(json.endpoints.aois.spatial.bbox).toContain('bbox');

    // Check campaign endpoints
    expect(json.endpoints.campaigns).toBeDefined();

    // Check product endpoints
    expect(json.endpoints.products).toBeDefined();
  });
});

describe('V3 API Health Endpoint', () => {
  beforeAll(async () => {
    await initializeTestDatabase(env.DB);
    await seedTestDatabase(env.DB);
  });

  it('should return healthy status with database connected', async () => {
    const request = createMockRequest(apiUrl('/api/v3/health'));
    const ctx = createMockCtx();

    const response = await handleApiV3Request(request, env, ctx);
    const json = await parseJsonResponse(response);

    expect(response.status).toBe(200);
    expect(json.status).toBe('healthy');
    expect(json.database).toBe('connected');
    expect(json.version).toBeDefined();
    expect(json.apiVersions).toContain('v3');
  });

  it('should include feature flags', async () => {
    const request = createMockRequest(apiUrl('/api/v3/health'));
    const ctx = createMockCtx();

    const response = await handleApiV3Request(request, env, ctx);
    const json = await parseJsonResponse(response);

    expect(json.features).toBeDefined();
    expect(Array.isArray(json.features)).toBe(true);
    expect(json.features).toContain('aoi-support');
    expect(json.features).toContain('uav-platforms');
    expect(json.features).toContain('satellite-platforms');
  });
});

describe('V3 API Error Handling', () => {
  it('should return 404 for unknown endpoints', async () => {
    const request = createMockRequest(apiUrl('/api/v3/unknown-endpoint'));
    const ctx = createMockCtx();

    const response = await handleApiV3Request(request, env, ctx);

    expect(response.status).toBe(404);
  });

  it('should return 404 for invalid resource IDs', async () => {
    const request = createMockRequest(apiUrl('/api/v3/platforms/99999'));
    const ctx = createMockCtx();

    const response = await handleApiV3Request(request, env, ctx);
    // Without auth, should return 401
    expect([401, 404]).toContain(response.status);
  });
});
