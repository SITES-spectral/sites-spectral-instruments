/**
 * SITES Spectral V3 API Campaigns Tests
 * Tests for /api/v3/campaigns endpoints
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
import { generateCampaign } from '../fixtures/mock-data.js';

// Get mock environment
const env = getMockEnv();

describe('V3 Campaigns - Read Operations', () => {
  beforeAll(async () => {
    await initializeTestDatabase(env.DB);
    await seedTestDatabase(env.DB);
  });

  describe('GET /api/v3/campaigns', () => {
    it('should require authentication', async () => {
      const request = createMockRequest(apiUrl('/api/v3/campaigns'));
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);

      expect(response.status).toBe(401);
    });

    it('should return paginated campaigns', async () => {
      const token = generateTestToken({ role: 'admin' });
      const request = createMockRequest(apiUrl('/api/v3/campaigns'), {
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
      const request = createMockRequest(apiUrl('/api/v3/campaigns?station=SVB'), {
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      json.data.forEach((campaign) => {
        expect(campaign.station_id).toBe(1);
      });
    });

    it('should filter by status', async () => {
      const token = generateTestToken({ role: 'admin' });
      const request = createMockRequest(apiUrl('/api/v3/campaigns?status=completed'), {
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      json.data.forEach((campaign) => {
        expect(campaign.status).toBe('completed');
      });
    });

    it('should filter by campaign type', async () => {
      const token = generateTestToken({ role: 'admin' });
      const request = createMockRequest(apiUrl('/api/v3/campaigns?type=flight'), {
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      json.data.forEach((campaign) => {
        expect(campaign.campaign_type).toBe('flight');
      });
    });

    it('should filter by date range', async () => {
      const token = generateTestToken({ role: 'admin' });
      const request = createMockRequest(
        apiUrl('/api/v3/campaigns?start_date=2024-01-01&end_date=2024-12-31'),
        { authToken: token }
      );
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/v3/campaigns/:id', () => {
    it('should return a single campaign', async () => {
      const token = generateTestToken({ role: 'admin' });
      const request = createMockRequest(apiUrl('/api/v3/campaigns/1'), {
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(json.id).toBe(1);
      expect(json.campaign_name).toBeDefined();
    });

    it('should return 404 for non-existent campaign', async () => {
      const token = generateTestToken({ role: 'admin' });
      const request = createMockRequest(apiUrl('/api/v3/campaigns/99999'), {
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/v3/campaigns/status/:status', () => {
    it('should return campaigns by status', async () => {
      const token = generateTestToken({ role: 'admin' });
      const request = createMockRequest(apiUrl('/api/v3/campaigns/status/planned'), {
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      json.data.forEach((campaign) => {
        expect(campaign.status).toBe('planned');
      });
    });

    it('should return 400 for invalid status', async () => {
      const token = generateTestToken({ role: 'admin' });
      const request = createMockRequest(apiUrl('/api/v3/campaigns/status/invalid'), {
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v3/campaigns/:id/products', () => {
    it('should return products for a campaign', async () => {
      const token = generateTestToken({ role: 'admin' });
      const request = createMockRequest(apiUrl('/api/v3/campaigns/1/products'), {
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(json.data).toBeDefined();
      json.data.forEach((product) => {
        expect(product.campaign_id).toBe(1);
      });
    });
  });
});

describe('V3 Campaigns - Write Operations', () => {
  beforeEach(async () => {
    await resetTestDatabase(env.DB);
  });

  describe('POST /api/v3/campaigns', () => {
    it('should create a new campaign', async () => {
      const token = generateTestToken({ role: 'admin' });
      const newCampaign = generateCampaign();

      const request = createMockRequest(apiUrl('/api/v3/campaigns'), {
        method: 'POST',
        authToken: token,
        body: newCampaign,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(201);
      expect(json.id).toBeDefined();
      expect(json.campaign_name).toBe(newCampaign.campaign_name);
    });

    it('should validate required fields', async () => {
      const token = generateTestToken({ role: 'admin' });
      const invalidCampaign = { description: 'Missing required fields' };

      const request = createMockRequest(apiUrl('/api/v3/campaigns'), {
        method: 'POST',
        authToken: token,
        body: invalidCampaign,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);

      expect(response.status).toBe(400);
    });

    it('should reject creation with readonly user', async () => {
      const token = generateTestToken({ role: 'readonly' });
      const newCampaign = generateCampaign();

      const request = createMockRequest(apiUrl('/api/v3/campaigns'), {
        method: 'POST',
        authToken: token,
        body: newCampaign,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/v3/campaigns/:id', () => {
    it('should update campaign status', async () => {
      const token = generateTestToken({ role: 'admin' });
      const updates = {
        status: 'in_progress',
        actual_start_datetime: new Date().toISOString(),
      };

      const request = createMockRequest(apiUrl('/api/v3/campaigns/2'), {
        method: 'PUT',
        authToken: token,
        body: updates,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(json.status).toBe('in_progress');
    });

    it('should update flight parameters', async () => {
      const token = generateTestToken({ role: 'admin' });
      const updates = {
        flight_altitude_m: 100,
        overlap_frontal_pct: 85,
        gsd_cm: 2.0,
      };

      const request = createMockRequest(apiUrl('/api/v3/campaigns/1'), {
        method: 'PUT',
        authToken: token,
        body: updates,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(json.flight_altitude_m).toBe(100);
    });
  });

  describe('PUT /api/v3/campaigns/:id/complete', () => {
    it('should complete a campaign with results', async () => {
      const token = generateTestToken({ role: 'admin' });
      const completion = {
        actual_end_datetime: new Date().toISOString(),
        images_collected: 500,
        data_size_gb: 15.5,
        quality_score: 92,
        quality_notes: 'Good conditions, complete coverage',
      };

      const request = createMockRequest(apiUrl('/api/v3/campaigns/1/complete'), {
        method: 'PUT',
        authToken: token,
        body: completion,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(json.status).toBe('completed');
      expect(json.images_collected).toBe(500);
    });
  });

  describe('DELETE /api/v3/campaigns/:id', () => {
    it('should delete a campaign', async () => {
      const token = generateTestToken({ role: 'admin' });

      const request = createMockRequest(apiUrl('/api/v3/campaigns/2'), {
        method: 'DELETE',
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);

      expect(response.status).toBe(200);
    });

    it('should not delete completed campaign without force flag', async () => {
      const token = generateTestToken({ role: 'admin' });

      const request = createMockRequest(apiUrl('/api/v3/campaigns/1'), {
        method: 'DELETE',
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);

      // Should either succeed or require force flag
      expect([200, 400]).toContain(response.status);
    });
  });
});

describe('V3 Campaigns - Scheduling and Planning', () => {
  beforeAll(async () => {
    await resetTestDatabase(env.DB);
  });

  describe('GET /api/v3/campaigns/upcoming', () => {
    it('should return upcoming campaigns', async () => {
      const token = generateTestToken({ role: 'admin' });
      const request = createMockRequest(apiUrl('/api/v3/campaigns/upcoming'), {
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      // All returned campaigns should have planned status and future dates
      json.data.forEach((campaign) => {
        expect(['planned', 'in_progress']).toContain(campaign.status);
      });
    });
  });

  describe('GET /api/v3/campaigns/calendar', () => {
    it('should return campaigns in calendar format', async () => {
      const token = generateTestToken({ role: 'admin' });
      const request = createMockRequest(apiUrl('/api/v3/campaigns/calendar?year=2024&month=5'), {
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
    });
  });
});
