/**
 * SITES Spectral V3 API AOIs Tests
 * Tests for /api/v3/aois endpoints including spatial queries
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import {
  createMockRequest,
  createMockCtx,
  apiUrl,
  parseJsonResponse,
  generateTestToken,
  getMockEnv,
} from '../utils/test-helpers.js';
import { initializeTestDatabase, seedTestDatabase, resetTestDatabase } from '../utils/db-setup.js';
import { handleApiV3Request } from '../../src/v3/api-handler-v3.js';
import { generateAOI } from '../fixtures/mock-data.js';

// Get mock environment
const env = getMockEnv();

describe('V3 AOIs - Basic CRUD Operations', () => {
  beforeAll(async () => {
    await initializeTestDatabase(env.DB);
    await seedTestDatabase(env.DB);
  });

  describe('GET /api/v3/aois', () => {
    it('should require authentication', async () => {
      const request = createMockRequest(apiUrl('/api/v3/aois'));
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);

      expect(response.status).toBe(401);
    });

    it('should return paginated AOIs with valid token', async () => {
      const token = generateTestToken({ role: 'admin' });
      const request = createMockRequest(apiUrl('/api/v3/aois'), {
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(json.data).toBeDefined();
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.meta).toBeDefined();
    });

    it('should filter by station', async () => {
      const token = generateTestToken({ role: 'admin' });
      const request = createMockRequest(apiUrl('/api/v3/aois?station=SVB'), {
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      json.data.forEach((aoi) => {
        expect(aoi.station_id).toBe(1); // SVB
      });
    });

    it('should filter by AOI type', async () => {
      const token = generateTestToken({ role: 'admin' });
      const request = createMockRequest(apiUrl('/api/v3/aois?aoi_type=flight_area'), {
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      json.data.forEach((aoi) => {
        expect(aoi.aoi_type).toBe('flight_area');
      });
    });

    it('should filter by ecosystem', async () => {
      const token = generateTestToken({ role: 'admin' });
      const request = createMockRequest(apiUrl('/api/v3/aois?ecosystem=FOR'), {
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      json.data.forEach((aoi) => {
        expect(aoi.ecosystem_code).toBe('FOR');
      });
    });
  });

  describe('GET /api/v3/aois/:id', () => {
    it('should return a single AOI by ID', async () => {
      const token = generateTestToken({ role: 'admin' });
      const request = createMockRequest(apiUrl('/api/v3/aois/1'), {
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(json.id).toBe(1);
      expect(json.name).toBeDefined();
      expect(json.geometry_json).toBeDefined();
    });

    it('should return 404 for non-existent AOI', async () => {
      const token = generateTestToken({ role: 'admin' });
      const request = createMockRequest(apiUrl('/api/v3/aois/99999'), {
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/v3/aois', () => {
    beforeEach(async () => {
      await resetTestDatabase(env.DB);
    });

    it('should create a new AOI', async () => {
      const token = generateTestToken({ role: 'admin' });
      const newAOI = generateAOI();

      const request = createMockRequest(apiUrl('/api/v3/aois'), {
        method: 'POST',
        authToken: token,
        body: newAOI,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(201);
      expect(json.id).toBeDefined();
      expect(json.name).toBe(newAOI.name);
    });

    it('should validate required fields', async () => {
      const token = generateTestToken({ role: 'admin' });
      const invalidAOI = { name: 'Missing Fields' };

      const request = createMockRequest(apiUrl('/api/v3/aois'), {
        method: 'POST',
        authToken: token,
        body: invalidAOI,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);

      expect(response.status).toBe(400);
    });

    it('should validate geometry JSON', async () => {
      const token = generateTestToken({ role: 'admin' });
      const invalidAOI = generateAOI({
        geometry_json: 'invalid-json',
      });

      const request = createMockRequest(apiUrl('/api/v3/aois'), {
        method: 'POST',
        authToken: token,
        body: invalidAOI,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/v3/aois/:id', () => {
    beforeEach(async () => {
      await resetTestDatabase(env.DB);
    });

    it('should update an existing AOI', async () => {
      const token = generateTestToken({ role: 'admin' });
      const updates = {
        name: 'Updated AOI Name',
        description: 'Updated description',
      };

      const request = createMockRequest(apiUrl('/api/v3/aois/1'), {
        method: 'PUT',
        authToken: token,
        body: updates,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(json.name).toBe('Updated AOI Name');
    });
  });

  describe('DELETE /api/v3/aois/:id', () => {
    beforeEach(async () => {
      await resetTestDatabase(env.DB);
    });

    it('should delete an existing AOI', async () => {
      const token = generateTestToken({ role: 'admin' });

      const request = createMockRequest(apiUrl('/api/v3/aois/1'), {
        method: 'DELETE',
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);

      expect(response.status).toBe(200);
    });
  });
});

describe('V3 AOIs - Spatial Queries', () => {
  beforeAll(async () => {
    await resetTestDatabase(env.DB);
  });

  describe('GET /api/v3/aois/spatial/bbox', () => {
    it('should return AOIs within bounding box', async () => {
      const token = generateTestToken({ role: 'admin' });
      // Bounding box around Svartberget
      const bbox = 'minLon=19.5&minLat=64.0&maxLon=20.0&maxLat=65.0';
      const request = createMockRequest(apiUrl(`/api/v3/aois/spatial/bbox?${bbox}`), {
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(json.data).toBeDefined();
      // Should find AOIs in the SVB area
    });

    it('should return empty array for bbox with no AOIs', async () => {
      const token = generateTestToken({ role: 'admin' });
      // Bounding box in the middle of nowhere
      const bbox = 'minLon=0&minLat=0&maxLon=1&maxLat=1';
      const request = createMockRequest(apiUrl(`/api/v3/aois/spatial/bbox?${bbox}`), {
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(json.data).toBeDefined();
      expect(json.data.length).toBe(0);
    });

    it('should validate bbox parameters', async () => {
      const token = generateTestToken({ role: 'admin' });
      const request = createMockRequest(apiUrl('/api/v3/aois/spatial/bbox?minLon=invalid'), {
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v3/aois/spatial/point', () => {
    it('should return AOIs containing a point', async () => {
      const token = generateTestToken({ role: 'admin' });
      // Point inside SVB Forest Survey Area
      const request = createMockRequest(apiUrl('/api/v3/aois/spatial/point?lon=19.775&lat=64.255'), {
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(json.data).toBeDefined();
    });

    it('should return empty array for point outside all AOIs', async () => {
      const token = generateTestToken({ role: 'admin' });
      const request = createMockRequest(apiUrl('/api/v3/aois/spatial/point?lon=0&lat=0'), {
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(json.data.length).toBe(0);
    });

    it('should validate point parameters', async () => {
      const token = generateTestToken({ role: 'admin' });
      const request = createMockRequest(apiUrl('/api/v3/aois/spatial/point?lon=invalid'), {
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v3/aois/spatial/nearest', () => {
    it('should return nearest AOIs to a point', async () => {
      const token = generateTestToken({ role: 'admin' });
      const request = createMockRequest(apiUrl('/api/v3/aois/spatial/nearest?lon=19.775&lat=64.255&limit=5'), {
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(json.data).toBeDefined();
      // Results should be ordered by distance
      if (json.data.length > 1) {
        for (let i = 1; i < json.data.length; i++) {
          expect(json.data[i].distance_km >= json.data[i - 1].distance_km).toBe(true);
        }
      }
    });

    it('should respect limit parameter', async () => {
      const token = generateTestToken({ role: 'admin' });
      const request = createMockRequest(apiUrl('/api/v3/aois/spatial/nearest?lon=19.775&lat=64.255&limit=1'), {
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(json.data.length).toBeLessThanOrEqual(1);
    });
  });

  describe('POST /api/v3/aois/spatial/intersects', () => {
    it('should return AOIs intersecting with provided geometry', async () => {
      const token = generateTestToken({ role: 'admin' });
      const searchGeometry = {
        type: 'Polygon',
        coordinates: [
          [
            [19.7, 64.2],
            [19.8, 64.2],
            [19.8, 64.3],
            [19.7, 64.3],
            [19.7, 64.2],
          ],
        ],
      };

      const request = createMockRequest(apiUrl('/api/v3/aois/spatial/intersects'), {
        method: 'POST',
        authToken: token,
        body: { geometry: searchGeometry },
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(json.data).toBeDefined();
    });

    it('should validate geometry in request body', async () => {
      const token = generateTestToken({ role: 'admin' });

      const request = createMockRequest(apiUrl('/api/v3/aois/spatial/intersects'), {
        method: 'POST',
        authToken: token,
        body: { geometry: 'invalid' },
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v3/aois/spatial/within', () => {
    it('should return AOIs completely within provided geometry', async () => {
      const token = generateTestToken({ role: 'admin' });
      const searchGeometry = {
        type: 'Polygon',
        coordinates: [
          [
            [19.0, 64.0],
            [20.5, 64.0],
            [20.5, 65.0],
            [19.0, 65.0],
            [19.0, 64.0],
          ],
        ],
      };

      const request = createMockRequest(apiUrl('/api/v3/aois/spatial/within'), {
        method: 'POST',
        authToken: token,
        body: { geometry: searchGeometry },
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(json.data).toBeDefined();
    });
  });
});

describe('V3 AOIs - GeoJSON Export', () => {
  beforeAll(async () => {
    await resetTestDatabase(env.DB);
  });

  describe('GET /api/v3/aois/geojson', () => {
    it('should return AOIs as GeoJSON FeatureCollection', async () => {
      const token = generateTestToken({ role: 'admin' });
      const request = createMockRequest(apiUrl('/api/v3/aois/geojson'), {
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(json.type).toBe('FeatureCollection');
      expect(json.features).toBeDefined();
      expect(Array.isArray(json.features)).toBe(true);
    });

    it('should include geometry and properties for each feature', async () => {
      const token = generateTestToken({ role: 'admin' });
      const request = createMockRequest(apiUrl('/api/v3/aois/geojson'), {
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      if (json.features.length > 0) {
        const feature = json.features[0];
        expect(feature.type).toBe('Feature');
        expect(feature.geometry).toBeDefined();
        expect(feature.properties).toBeDefined();
        expect(feature.properties.id).toBeDefined();
        expect(feature.properties.name).toBeDefined();
      }
    });

    it('should filter GeoJSON by station', async () => {
      const token = generateTestToken({ role: 'admin' });
      const request = createMockRequest(apiUrl('/api/v3/aois/geojson?station=SVB'), {
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      json.features.forEach((feature) => {
        expect(feature.properties.station_id).toBe(1); // SVB
      });
    });
  });
});
