/**
 * SITES Spectral V3 API Products Tests
 * Tests for /api/v3/products endpoints
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
import { generateProduct } from '../fixtures/mock-data.js';

// Get mock environment
const env = getMockEnv();

describe('V3 Products - Read Operations', () => {
  beforeAll(async () => {
    await initializeTestDatabase(env.DB);
    await seedTestDatabase(env.DB);
  });

  describe('GET /api/v3/products', () => {
    it('should require authentication', async () => {
      const request = createMockRequest(apiUrl('/api/v3/products'));
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);

      expect(response.status).toBe(401);
    });

    it('should return paginated products', async () => {
      const token = generateTestToken({ role: 'admin' });
      const request = createMockRequest(apiUrl('/api/v3/products'), {
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
      const request = createMockRequest(apiUrl('/api/v3/products?station=SVB'), {
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      json.data.forEach((product) => {
        expect(product.station_id).toBe(1);
      });
    });

    it('should filter by product type', async () => {
      const token = generateTestToken({ role: 'admin' });
      const request = createMockRequest(apiUrl('/api/v3/products?type=ndvi'), {
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      json.data.forEach((product) => {
        expect(product.product_type).toBe('ndvi');
      });
    });

    it('should filter by platform type', async () => {
      const token = generateTestToken({ role: 'admin' });
      const request = createMockRequest(apiUrl('/api/v3/products?platform_type=uav'), {
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      json.data.forEach((product) => {
        expect(product.source_platform_type).toBe('uav');
      });
    });

    it('should filter by processing level', async () => {
      const token = generateTestToken({ role: 'admin' });
      const request = createMockRequest(apiUrl('/api/v3/products?processing_level=L2'), {
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      json.data.forEach((product) => {
        expect(product.processing_level).toBe('L2');
      });
    });

    it('should filter by date range', async () => {
      const token = generateTestToken({ role: 'admin' });
      const request = createMockRequest(
        apiUrl('/api/v3/products?start_date=2024-01-01&end_date=2024-12-31'),
        { authToken: token }
      );
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
    });

    it('should filter by quality flag', async () => {
      const token = generateTestToken({ role: 'admin' });
      const request = createMockRequest(apiUrl('/api/v3/products?quality=good'), {
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      json.data.forEach((product) => {
        expect(product.quality_flag).toBe('good');
      });
    });
  });

  describe('GET /api/v3/products/:id', () => {
    it('should return a single product', async () => {
      const token = generateTestToken({ role: 'admin' });
      const request = createMockRequest(apiUrl('/api/v3/products/1'), {
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(json.id).toBe(1);
      expect(json.product_name).toBeDefined();
      expect(json.product_type).toBeDefined();
    });

    it('should return 404 for non-existent product', async () => {
      const token = generateTestToken({ role: 'admin' });
      const request = createMockRequest(apiUrl('/api/v3/products/99999'), {
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/v3/products/type/:type', () => {
    it('should return products by type', async () => {
      const token = generateTestToken({ role: 'admin' });
      const request = createMockRequest(apiUrl('/api/v3/products/type/orthomosaic'), {
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      json.data.forEach((product) => {
        expect(product.product_type).toBe('orthomosaic');
      });
    });
  });

  describe('GET /api/v3/products/types', () => {
    it('should return available product types', async () => {
      const token = generateTestToken({ role: 'admin' });
      const request = createMockRequest(apiUrl('/api/v3/products/types'), {
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(Array.isArray(json)).toBe(true);
    });
  });
});

describe('V3 Products - Spatial Queries', () => {
  beforeAll(async () => {
    await resetTestDatabase(env.DB);
  });

  describe('GET /api/v3/products/spatial/bbox', () => {
    it('should return products within bounding box', async () => {
      const token = generateTestToken({ role: 'admin' });
      const bbox = 'minLon=19.5&minLat=64.0&maxLon=20.0&maxLat=65.0';
      const request = createMockRequest(apiUrl(`/api/v3/products/spatial/bbox?${bbox}`), {
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(json.data).toBeDefined();
    });

    it('should validate bbox parameters', async () => {
      const token = generateTestToken({ role: 'admin' });
      const request = createMockRequest(apiUrl('/api/v3/products/spatial/bbox?minLon=invalid'), {
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v3/products/spatial/point', () => {
    it('should return products covering a point', async () => {
      const token = generateTestToken({ role: 'admin' });
      const request = createMockRequest(apiUrl('/api/v3/products/spatial/point?lon=19.775&lat=64.255'), {
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(json.data).toBeDefined();
    });
  });
});

describe('V3 Products - Write Operations', () => {
  beforeEach(async () => {
    await resetTestDatabase(env.DB);
  });

  describe('POST /api/v3/products', () => {
    it('should create a new product', async () => {
      const token = generateTestToken({ role: 'admin' });
      const newProduct = generateProduct();

      const request = createMockRequest(apiUrl('/api/v3/products'), {
        method: 'POST',
        authToken: token,
        body: newProduct,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(201);
      expect(json.id).toBeDefined();
      expect(json.product_name).toBe(newProduct.product_name);
    });

    it('should validate required fields', async () => {
      const token = generateTestToken({ role: 'admin' });
      const invalidProduct = { description: 'Missing required fields' };

      const request = createMockRequest(apiUrl('/api/v3/products'), {
        method: 'POST',
        authToken: token,
        body: invalidProduct,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);

      expect(response.status).toBe(400);
    });

    it('should reject creation with readonly user', async () => {
      const token = generateTestToken({ role: 'readonly' });
      const newProduct = generateProduct();

      const request = createMockRequest(apiUrl('/api/v3/products'), {
        method: 'POST',
        authToken: token,
        body: newProduct,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/v3/products/:id', () => {
    it('should update product metadata', async () => {
      const token = generateTestToken({ role: 'admin' });
      const updates = {
        description: 'Updated description',
        quality_flag: 'moderate',
      };

      const request = createMockRequest(apiUrl('/api/v3/products/1'), {
        method: 'PUT',
        authToken: token,
        body: updates,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(json.description).toBe('Updated description');
    });

    it('should update product statistics', async () => {
      const token = generateTestToken({ role: 'admin' });
      const updates = {
        min_value: -0.5,
        max_value: 0.9,
        mean_value: 0.4,
        std_value: 0.2,
      };

      const request = createMockRequest(apiUrl('/api/v3/products/2'), {
        method: 'PUT',
        authToken: token,
        body: updates,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(json.min_value).toBe(-0.5);
    });
  });

  describe('PUT /api/v3/products/:id/archive', () => {
    it('should archive a product', async () => {
      const token = generateTestToken({ role: 'admin' });

      const request = createMockRequest(apiUrl('/api/v3/products/1/archive'), {
        method: 'PUT',
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(json.status).toBe('archived');
    });
  });

  describe('DELETE /api/v3/products/:id', () => {
    it('should delete a product', async () => {
      const token = generateTestToken({ role: 'admin' });

      const request = createMockRequest(apiUrl('/api/v3/products/1'), {
        method: 'DELETE',
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);

      expect(response.status).toBe(200);
    });

    it('should reject deletion with readonly user', async () => {
      const token = generateTestToken({ role: 'readonly' });

      const request = createMockRequest(apiUrl('/api/v3/products/1'), {
        method: 'DELETE',
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);

      expect(response.status).toBe(403);
    });
  });
});

describe('V3 Products - Statistics and Aggregation', () => {
  beforeAll(async () => {
    await resetTestDatabase(env.DB);
  });

  describe('GET /api/v3/products/stats', () => {
    it('should return product statistics', async () => {
      const token = generateTestToken({ role: 'admin' });
      const request = createMockRequest(apiUrl('/api/v3/products/stats'), {
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(json.total_products).toBeDefined();
      expect(json.by_type).toBeDefined();
      expect(json.by_platform_type).toBeDefined();
    });

    it('should filter stats by station', async () => {
      const token = generateTestToken({ role: 'admin' });
      const request = createMockRequest(apiUrl('/api/v3/products/stats?station=SVB'), {
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/v3/products/timeline', () => {
    it('should return products in timeline format', async () => {
      const token = generateTestToken({ role: 'admin' });
      const request = createMockRequest(apiUrl('/api/v3/products/timeline?station=SVB'), {
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
    });
  });
});
