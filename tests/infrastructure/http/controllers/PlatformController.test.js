/**
 * @vitest-environment node
 *
 * PlatformController Unit Tests
 *
 * Tests HTTP request handling, authentication, response formatting.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlatformController } from '../../../../src/infrastructure/http/controllers/PlatformController.js';

describe('PlatformController', () => {
  let controller;
  let mockContainer;
  let mockEnv;

  const createMockPlatform = (id, normalizedName, stationId = 1) => ({
    id,
    normalizedName,
    stationId,
    platformType: 'fixed',
    toJSON: () => ({ id, normalized_name: normalizedName, station_id: stationId })
  });

  const createMockRequest = (options = {}) => ({
    method: options.method || 'GET',
    headers: new Map([
      ['Authorization', options.token ? `Bearer ${options.token}` : '']
    ]),
    json: vi.fn().mockResolvedValue(options.body || {})
  });

  beforeEach(() => {
    mockContainer = {
      queries: {
        listPlatforms: {
          execute: vi.fn(),
          byStationId: vi.fn()
        },
        getPlatform: {
          byId: vi.fn(),
          byNormalizedName: vi.fn()
        },
        getStation: {
          byAcronym: vi.fn()
        }
      },
      commands: {
        createPlatform: { execute: vi.fn() },
        updatePlatform: { execute: vi.fn() },
        deletePlatform: { execute: vi.fn() }
      }
    };

    mockEnv = {
      JWT_SECRET: 'test-secret'
    };

    controller = new PlatformController(mockContainer, mockEnv);

    // Mock auth middleware to bypass auth for most tests
    controller.auth = {
      authenticateAndAuthorize: vi.fn().mockResolvedValue({ user: { id: 1 }, response: null })
    };
  });

  describe('list', () => {
    it('should return paginated platforms', async () => {
      const mockPlatforms = [
        createMockPlatform(1, 'SVB_FOR_TWR01'),
        createMockPlatform(2, 'SVB_AGR_TWR01')
      ];

      mockContainer.queries.listPlatforms.execute.mockResolvedValue({
        items: mockPlatforms,
        pagination: { page: 1, limit: 25, total: 2, totalPages: 1 }
      });

      const request = createMockRequest();
      const url = {
        searchParams: {
          get: () => null
        }
      };

      const response = await controller.list(request, url);
      const body = await response.json();

      expect(body.data).toHaveLength(2);
      expect(body.meta.total).toBe(2);
    });

    it('should filter by station acronym', async () => {
      const mockStation = { id: 5, acronym: 'SVB' };
      mockContainer.queries.getStation.byAcronym.mockResolvedValue(mockStation);
      mockContainer.queries.listPlatforms.execute.mockResolvedValue({
        items: [],
        pagination: {}
      });

      const request = createMockRequest();
      const url = {
        searchParams: {
          get: (key) => (key === 'station' ? 'SVB' : null)
        }
      };

      await controller.list(request, url);

      expect(mockContainer.queries.getStation.byAcronym).toHaveBeenCalledWith('SVB');
      expect(mockContainer.queries.listPlatforms.execute).toHaveBeenCalledWith(
        expect.objectContaining({ stationId: 5 })
      );
    });

    it('should filter by platform_type', async () => {
      mockContainer.queries.listPlatforms.execute.mockResolvedValue({
        items: [],
        pagination: {}
      });

      const request = createMockRequest();
      const url = {
        searchParams: {
          get: (key) => (key === 'platform_type' ? 'uav' : null)
        }
      };

      await controller.list(request, url);

      expect(mockContainer.queries.listPlatforms.execute).toHaveBeenCalledWith(
        expect.objectContaining({ platformType: 'uav' })
      );
    });

    it('should enforce max limit of 100', async () => {
      mockContainer.queries.listPlatforms.execute.mockResolvedValue({
        items: [],
        pagination: {}
      });

      const request = createMockRequest();
      const url = {
        searchParams: {
          get: (key) => (key === 'limit' ? '500' : null)
        }
      };

      await controller.list(request, url);

      expect(mockContainer.queries.listPlatforms.execute).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 100 })
      );
    });
  });

  describe('get', () => {
    it('should return platform by numeric ID', async () => {
      const mockPlatform = createMockPlatform(1, 'SVB_FOR_TWR01');
      mockContainer.queries.getPlatform.byId.mockResolvedValue(mockPlatform);

      const request = createMockRequest();

      const response = await controller.get(request, '1');
      const body = await response.json();

      expect(body.data.normalized_name).toBe('SVB_FOR_TWR01');
      expect(mockContainer.queries.getPlatform.byId).toHaveBeenCalledWith(1);
    });

    it('should return platform by normalized name', async () => {
      const mockPlatform = createMockPlatform(1, 'SVB_FOR_TWR01');
      mockContainer.queries.getPlatform.byNormalizedName.mockResolvedValue(mockPlatform);

      const request = createMockRequest();

      const response = await controller.get(request, 'SVB_FOR_TWR01');
      const body = await response.json();

      expect(body.data.normalized_name).toBe('SVB_FOR_TWR01');
      expect(mockContainer.queries.getPlatform.byNormalizedName).toHaveBeenCalledWith('SVB_FOR_TWR01');
    });

    it('should uppercase normalized name lookup', async () => {
      mockContainer.queries.getPlatform.byNormalizedName.mockResolvedValue(null);

      const request = createMockRequest();

      await controller.get(request, 'svb_for_twr01');

      expect(mockContainer.queries.getPlatform.byNormalizedName).toHaveBeenCalledWith('SVB_FOR_TWR01');
    });

    it('should return 404 when platform not found', async () => {
      mockContainer.queries.getPlatform.byId.mockResolvedValue(null);

      const request = createMockRequest();

      const response = await controller.get(request, '999');

      expect(response.status).toBe(404);
    });
  });

  describe('byStation', () => {
    it('should return platforms by station ID', async () => {
      const mockPlatforms = [
        createMockPlatform(1, 'SVB_FOR_TWR01'),
        createMockPlatform(2, 'SVB_AGR_TWR01')
      ];
      mockContainer.queries.listPlatforms.byStationId.mockResolvedValue(mockPlatforms);

      const request = createMockRequest();

      const response = await controller.byStation(request, '1');
      const body = await response.json();

      expect(body.data).toHaveLength(2);
      expect(mockContainer.queries.listPlatforms.byStationId).toHaveBeenCalledWith(1);
    });
  });

  describe('byType', () => {
    it('should return platforms by type', async () => {
      const mockPlatforms = [createMockPlatform(1, 'SVB_DJI_M3M_UAV01')];
      mockContainer.queries.listPlatforms.execute.mockResolvedValue({
        items: mockPlatforms,
        pagination: {}
      });

      const request = createMockRequest();
      const url = {
        searchParams: {
          get: () => null
        }
      };

      const response = await controller.byType(request, 'uav', url);
      const body = await response.json();

      expect(body.data).toHaveLength(1);
      expect(mockContainer.queries.listPlatforms.execute).toHaveBeenCalledWith(
        expect.objectContaining({ platformType: 'uav' })
      );
    });
  });

  describe('create', () => {
    it('should create fixed platform with valid data', async () => {
      const mockPlatform = createMockPlatform(1, 'SVB_FOR_TWR01');
      mockContainer.commands.createPlatform.execute.mockResolvedValue({
        platform: mockPlatform,
        instruments: []
      });

      const request = createMockRequest({
        method: 'POST',
        body: {
          station_id: 1,
          platform_type: 'fixed',
          ecosystem_code: 'FOR'
        }
      });

      const response = await controller.create(request);
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.data.platform.normalized_name).toBe('SVB_FOR_TWR01');
    });

    it('should create UAV platform with auto-instruments', async () => {
      const mockPlatform = createMockPlatform(1, 'SVB_DJI_M3M_UAV01');
      const mockInstruments = [
        { id: 1, toJSON: () => ({ id: 1, instrument_type: 'Multispectral' }) }
      ];
      mockContainer.commands.createPlatform.execute.mockResolvedValue({
        platform: mockPlatform,
        instruments: mockInstruments
      });

      const request = createMockRequest({
        method: 'POST',
        body: {
          station_id: 1,
          platform_type: 'uav',
          vendor: 'DJI',
          model: 'M3M'
        }
      });

      const response = await controller.create(request);
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.data.instruments).toHaveLength(1);
    });

    it('should return 400 for invalid JSON', async () => {
      const request = createMockRequest({ method: 'POST' });
      request.json.mockRejectedValue(new Error('Invalid JSON'));

      const response = await controller.create(request);

      expect(response.status).toBe(400);
    });

    it('should authorize with station context', async () => {
      mockContainer.commands.createPlatform.execute.mockResolvedValue({
        platform: createMockPlatform(1, 'SVB_FOR_TWR01'),
        instruments: []
      });

      const request = createMockRequest({
        method: 'POST',
        body: { station_id: 5, platform_type: 'fixed' }
      });

      await controller.create(request);

      expect(controller.auth.authenticateAndAuthorize).toHaveBeenCalledWith(
        request, 'platforms', 'write', { stationId: 5 }
      );
    });
  });

  describe('update', () => {
    it('should update platform', async () => {
      const mockPlatform = createMockPlatform(1, 'SVB_FOR_TWR01');
      mockContainer.queries.getPlatform.byId.mockResolvedValue(mockPlatform);
      mockContainer.commands.updatePlatform.execute.mockResolvedValue(mockPlatform);

      const request = createMockRequest({
        method: 'PUT',
        body: { display_name: 'Updated Platform' }
      });

      const response = await controller.update(request, '1');

      expect(response.status).toBe(200);
    });

    it('should return 404 when platform not found before update', async () => {
      mockContainer.queries.getPlatform.byId.mockResolvedValue(null);

      const request = createMockRequest({
        method: 'PUT',
        body: {}
      });

      const response = await controller.update(request, '999');

      expect(response.status).toBe(404);
    });
  });

  describe('delete', () => {
    it('should delete platform', async () => {
      const mockPlatform = createMockPlatform(1, 'SVB_FOR_TWR01');
      mockContainer.queries.getPlatform.byId.mockResolvedValue(mockPlatform);
      mockContainer.commands.deletePlatform.execute.mockResolvedValue(true);

      const request = createMockRequest({ method: 'DELETE' });

      const response = await controller.delete(request, '1');
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.deleted).toBe(true);
    });

    it('should return 404 when platform not found before delete', async () => {
      mockContainer.queries.getPlatform.byId.mockResolvedValue(null);

      const request = createMockRequest({ method: 'DELETE' });

      const response = await controller.delete(request, '999');

      expect(response.status).toBe(404);
    });

    it('should return 409 when platform has instruments', async () => {
      const mockPlatform = createMockPlatform(1, 'SVB_FOR_TWR01');
      mockContainer.queries.getPlatform.byId.mockResolvedValue(mockPlatform);
      mockContainer.commands.deletePlatform.execute.mockRejectedValue(
        new Error("Cannot delete platform 'SVB_FOR_TWR01': 2 instrument(s) still exist")
      );

      const request = createMockRequest({ method: 'DELETE' });

      const response = await controller.delete(request, '1');

      expect(response.status).toBe(409);
    });
  });

  describe('handle - routing', () => {
    it('should route GET /platforms to list', async () => {
      mockContainer.queries.listPlatforms.execute.mockResolvedValue({
        items: [],
        pagination: {}
      });

      const request = createMockRequest();
      const url = { searchParams: { get: () => null } };

      await controller.handle(request, [], url);

      expect(mockContainer.queries.listPlatforms.execute).toHaveBeenCalled();
    });

    it('should route GET /platforms/station/:stationId to byStation', async () => {
      mockContainer.queries.listPlatforms.byStationId.mockResolvedValue([]);

      const request = createMockRequest();

      await controller.handle(request, ['station', '1'], {});

      expect(mockContainer.queries.listPlatforms.byStationId).toHaveBeenCalledWith(1);
    });

    it('should route GET /platforms/type/:type to byType', async () => {
      mockContainer.queries.listPlatforms.execute.mockResolvedValue({
        items: [],
        pagination: {}
      });

      const request = createMockRequest();
      const url = { searchParams: { get: () => null } };

      await controller.handle(request, ['type', 'uav'], url);

      expect(mockContainer.queries.listPlatforms.execute).toHaveBeenCalledWith(
        expect.objectContaining({ platformType: 'uav' })
      );
    });

    it('should route GET /platforms/:id to get', async () => {
      mockContainer.queries.getPlatform.byId.mockResolvedValue(createMockPlatform(1, 'SVB_FOR_TWR01'));

      const request = createMockRequest();

      await controller.handle(request, ['1'], {});

      expect(mockContainer.queries.getPlatform.byId).toHaveBeenCalledWith(1);
    });

    it('should route POST /platforms to create', async () => {
      mockContainer.commands.createPlatform.execute.mockResolvedValue({
        platform: createMockPlatform(1, 'NEW'),
        instruments: []
      });

      const request = createMockRequest({
        method: 'POST',
        body: { station_id: 1 }
      });

      await controller.handle(request, [], {});

      expect(mockContainer.commands.createPlatform.execute).toHaveBeenCalled();
    });

    it('should return 404 for unknown routes', async () => {
      const request = createMockRequest({ method: 'PATCH' });

      const response = await controller.handle(request, [], {});

      expect(response.status).toBe(404);
    });
  });
});
