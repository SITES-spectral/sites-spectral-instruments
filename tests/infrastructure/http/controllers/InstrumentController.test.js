/**
 * @vitest-environment node
 *
 * InstrumentController Unit Tests
 *
 * Tests HTTP request handling, authentication, response formatting.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InstrumentController } from '../../../../src/infrastructure/http/controllers/InstrumentController.js';

describe('InstrumentController', () => {
  let controller;
  let mockContainer;
  let mockEnv;

  const createMockInstrument = (id, normalizedName, platformId = 1) => ({
    id,
    normalizedName,
    platformId,
    instrumentType: 'Phenocam',
    status: 'Active',
    toJSON: () => ({
      id,
      normalized_name: normalizedName,
      platform_id: platformId,
      instrument_type: 'Phenocam',
      status: 'Active'
    })
  });

  const createMockPlatform = (id, stationId) => ({
    id,
    stationId,
    toJSON: () => ({ id, station_id: stationId })
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
        listInstruments: {
          execute: vi.fn(),
          byPlatformId: vi.fn(),
          byStationId: vi.fn()
        },
        getInstrument: {
          byId: vi.fn(),
          byNormalizedName: vi.fn(),
          withDetails: vi.fn()
        },
        getPlatform: {
          byId: vi.fn()
        },
        getStation: {
          byAcronym: vi.fn()
        }
      },
      commands: {
        createInstrument: { execute: vi.fn() },
        updateInstrument: { execute: vi.fn() },
        deleteInstrument: { execute: vi.fn() }
      }
    };

    mockEnv = {
      JWT_SECRET: 'test-secret'
    };

    controller = new InstrumentController(mockContainer, mockEnv);

    // Mock auth middleware to bypass auth for most tests
    controller.auth = {
      authenticateAndAuthorize: vi.fn().mockResolvedValue({ user: { id: 1 }, response: null })
    };
  });

  describe('list', () => {
    it('should return paginated instruments', async () => {
      const mockInstruments = [
        createMockInstrument(1, 'SVB_FOR_TWR01_PHE01'),
        createMockInstrument(2, 'SVB_FOR_TWR01_PHE02')
      ];

      mockContainer.queries.listInstruments.execute.mockResolvedValue({
        items: mockInstruments,
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

    it('should filter by platform_id', async () => {
      mockContainer.queries.listInstruments.execute.mockResolvedValue({
        items: [],
        pagination: {}
      });

      const request = createMockRequest();
      const url = {
        searchParams: {
          get: (key) => (key === 'platform_id' ? '5' : null)
        }
      };

      await controller.list(request, url);

      expect(mockContainer.queries.listInstruments.execute).toHaveBeenCalledWith(
        expect.objectContaining({ platformId: 5 })
      );
    });

    it('should filter by instrument_type', async () => {
      mockContainer.queries.listInstruments.execute.mockResolvedValue({
        items: [],
        pagination: {}
      });

      const request = createMockRequest();
      const url = {
        searchParams: {
          get: (key) => (key === 'instrument_type' ? 'Phenocam' : null)
        }
      };

      await controller.list(request, url);

      expect(mockContainer.queries.listInstruments.execute).toHaveBeenCalledWith(
        expect.objectContaining({ instrumentType: 'Phenocam' })
      );
    });

    it('should filter by status', async () => {
      mockContainer.queries.listInstruments.execute.mockResolvedValue({
        items: [],
        pagination: {}
      });

      const request = createMockRequest();
      const url = {
        searchParams: {
          get: (key) => (key === 'status' ? 'Active' : null)
        }
      };

      await controller.list(request, url);

      expect(mockContainer.queries.listInstruments.execute).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'Active' })
      );
    });

    it('should resolve station acronym to ID', async () => {
      const mockStation = { id: 5, acronym: 'SVB' };
      mockContainer.queries.getStation.byAcronym.mockResolvedValue(mockStation);
      mockContainer.queries.listInstruments.execute.mockResolvedValue({
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
      expect(mockContainer.queries.listInstruments.execute).toHaveBeenCalledWith(
        expect.objectContaining({ stationId: 5 })
      );
    });
  });

  describe('get', () => {
    it('should return instrument by numeric ID', async () => {
      const mockInstrument = createMockInstrument(1, 'SVB_FOR_TWR01_PHE01');
      mockContainer.queries.getInstrument.byId.mockResolvedValue(mockInstrument);

      const request = createMockRequest();

      const response = await controller.get(request, '1');
      const body = await response.json();

      expect(body.data.normalized_name).toBe('SVB_FOR_TWR01_PHE01');
      expect(mockContainer.queries.getInstrument.byId).toHaveBeenCalledWith(1);
    });

    it('should return instrument by normalized name', async () => {
      const mockInstrument = createMockInstrument(1, 'SVB_FOR_TWR01_PHE01');
      mockContainer.queries.getInstrument.byNormalizedName.mockResolvedValue(mockInstrument);

      const request = createMockRequest();

      const response = await controller.get(request, 'SVB_FOR_TWR01_PHE01');
      const body = await response.json();

      expect(body.data.normalized_name).toBe('SVB_FOR_TWR01_PHE01');
    });

    it('should uppercase normalized name lookup', async () => {
      mockContainer.queries.getInstrument.byNormalizedName.mockResolvedValue(null);

      const request = createMockRequest();

      await controller.get(request, 'svb_for_twr01_phe01');

      expect(mockContainer.queries.getInstrument.byNormalizedName).toHaveBeenCalledWith('SVB_FOR_TWR01_PHE01');
    });

    it('should return 404 when instrument not found', async () => {
      mockContainer.queries.getInstrument.byId.mockResolvedValue(null);

      const request = createMockRequest();

      const response = await controller.get(request, '999');

      expect(response.status).toBe(404);
    });

    it('should return instrument with details when withDetails=true', async () => {
      const mockDetails = {
        id: 1,
        normalized_name: 'SVB_FOR_TWR01_PHE01',
        platform: { id: 1, normalized_name: 'SVB_FOR_TWR01' },
        rois: []
      };
      mockContainer.queries.getInstrument.withDetails.mockResolvedValue(mockDetails);

      const request = createMockRequest();

      const response = await controller.get(request, '1', true);
      const body = await response.json();

      expect(mockContainer.queries.getInstrument.withDetails).toHaveBeenCalledWith(1);
      expect(body.data.platform).toBeDefined();
    });
  });

  describe('byPlatform', () => {
    it('should return instruments by platform ID', async () => {
      const mockInstruments = [
        createMockInstrument(1, 'SVB_FOR_TWR01_PHE01'),
        createMockInstrument(2, 'SVB_FOR_TWR01_MS01')
      ];
      mockContainer.queries.listInstruments.byPlatformId.mockResolvedValue(mockInstruments);

      const request = createMockRequest();

      const response = await controller.byPlatform(request, '1');
      const body = await response.json();

      expect(body.data).toHaveLength(2);
      expect(mockContainer.queries.listInstruments.byPlatformId).toHaveBeenCalledWith(1);
    });
  });

  describe('byStation', () => {
    it('should return instruments by station ID', async () => {
      const mockInstruments = [createMockInstrument(1, 'SVB_FOR_TWR01_PHE01')];
      mockContainer.queries.listInstruments.byStationId.mockResolvedValue(mockInstruments);

      const request = createMockRequest();

      const response = await controller.byStation(request, '1');
      const body = await response.json();

      expect(body.data).toHaveLength(1);
      expect(mockContainer.queries.listInstruments.byStationId).toHaveBeenCalledWith(1);
    });
  });

  describe('create', () => {
    it('should create instrument with valid data', async () => {
      const mockInstrument = createMockInstrument(1, 'SVB_FOR_TWR01_PHE01');
      const mockPlatform = createMockPlatform(1, 5);
      mockContainer.queries.getPlatform.byId.mockResolvedValue(mockPlatform);
      mockContainer.commands.createInstrument.execute.mockResolvedValue(mockInstrument);

      const request = createMockRequest({
        method: 'POST',
        body: {
          platform_id: 1,
          instrument_type: 'Phenocam'
        }
      });

      const response = await controller.create(request);
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.data.normalized_name).toBe('SVB_FOR_TWR01_PHE01');
    });

    it('should authorize with station context from platform', async () => {
      const mockPlatform = createMockPlatform(1, 5);
      mockContainer.queries.getPlatform.byId.mockResolvedValue(mockPlatform);
      mockContainer.commands.createInstrument.execute.mockResolvedValue(
        createMockInstrument(1, 'TEST')
      );

      const request = createMockRequest({
        method: 'POST',
        body: { platform_id: 1 }
      });

      await controller.create(request);

      expect(controller.auth.authenticateAndAuthorize).toHaveBeenCalledWith(
        request, 'instruments', 'write', { stationId: 5 }
      );
    });

    it('should return 400 for invalid JSON', async () => {
      const request = createMockRequest({ method: 'POST' });
      request.json.mockRejectedValue(new Error('Invalid JSON'));

      const response = await controller.create(request);

      expect(response.status).toBe(400);
    });

    it('should return 400 for validation errors', async () => {
      mockContainer.queries.getPlatform.byId.mockResolvedValue(createMockPlatform(1, 1));
      mockContainer.commands.createInstrument.execute.mockRejectedValue(
        new Error('Unknown instrument type')
      );

      const request = createMockRequest({
        method: 'POST',
        body: { platform_id: 1, instrument_type: 'Invalid' }
      });

      const response = await controller.create(request);

      expect(response.status).toBe(400);
    });
  });

  describe('update', () => {
    it('should update instrument', async () => {
      const mockInstrument = createMockInstrument(1, 'SVB_FOR_TWR01_PHE01');
      const mockPlatform = createMockPlatform(1, 5);
      mockContainer.queries.getInstrument.byId.mockResolvedValue(mockInstrument);
      mockContainer.queries.getPlatform.byId.mockResolvedValue(mockPlatform);
      mockContainer.commands.updateInstrument.execute.mockResolvedValue(mockInstrument);

      const request = createMockRequest({
        method: 'PUT',
        body: { display_name: 'Updated Phenocam' }
      });

      const response = await controller.update(request, '1');

      expect(response.status).toBe(200);
    });

    it('should return 404 when instrument not found before update', async () => {
      mockContainer.queries.getInstrument.byId.mockResolvedValue(null);

      const request = createMockRequest({
        method: 'PUT',
        body: {}
      });

      const response = await controller.update(request, '999');

      expect(response.status).toBe(404);
    });
  });

  describe('delete', () => {
    it('should delete instrument', async () => {
      const mockInstrument = createMockInstrument(1, 'SVB_FOR_TWR01_PHE01');
      const mockPlatform = createMockPlatform(1, 5);
      mockContainer.queries.getInstrument.byId.mockResolvedValue(mockInstrument);
      mockContainer.queries.getPlatform.byId.mockResolvedValue(mockPlatform);
      mockContainer.commands.deleteInstrument.execute.mockResolvedValue(true);

      const request = createMockRequest({ method: 'DELETE' });
      const url = { searchParams: { get: () => null } };

      const response = await controller.delete(request, '1', url);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.deleted).toBe(true);
    });

    it('should return 404 when instrument not found before delete', async () => {
      mockContainer.queries.getInstrument.byId.mockResolvedValue(null);

      const request = createMockRequest({ method: 'DELETE' });
      const url = { searchParams: { get: () => null } };

      const response = await controller.delete(request, '999', url);

      expect(response.status).toBe(404);
    });

    it('should pass cascade option from query parameter', async () => {
      const mockInstrument = createMockInstrument(1, 'SVB_FOR_TWR01_PHE01');
      const mockPlatform = createMockPlatform(1, 5);
      mockContainer.queries.getInstrument.byId.mockResolvedValue(mockInstrument);
      mockContainer.queries.getPlatform.byId.mockResolvedValue(mockPlatform);
      mockContainer.commands.deleteInstrument.execute.mockResolvedValue(true);

      const request = createMockRequest({ method: 'DELETE' });
      const url = {
        searchParams: {
          get: (key) => (key === 'cascade' ? 'true' : null)
        }
      };

      await controller.delete(request, '1', url);

      expect(mockContainer.commands.deleteInstrument.execute).toHaveBeenCalledWith(
        1, { cascade: true }
      );
    });

    it('should return 409 when instrument has ROIs', async () => {
      const mockInstrument = createMockInstrument(1, 'SVB_FOR_TWR01_PHE01');
      const mockPlatform = createMockPlatform(1, 5);
      mockContainer.queries.getInstrument.byId.mockResolvedValue(mockInstrument);
      mockContainer.queries.getPlatform.byId.mockResolvedValue(mockPlatform);
      mockContainer.commands.deleteInstrument.execute.mockRejectedValue(
        new Error("Cannot delete instrument: ROIs still exist")
      );

      const request = createMockRequest({ method: 'DELETE' });
      const url = { searchParams: { get: () => null } };

      const response = await controller.delete(request, '1', url);

      expect(response.status).toBe(409);
    });
  });

  describe('handle - routing', () => {
    it('should route GET /instruments to list', async () => {
      mockContainer.queries.listInstruments.execute.mockResolvedValue({
        items: [],
        pagination: {}
      });

      const request = createMockRequest();
      const url = { searchParams: { get: () => null } };

      await controller.handle(request, [], url);

      expect(mockContainer.queries.listInstruments.execute).toHaveBeenCalled();
    });

    it('should route GET /instruments/platform/:platformId to byPlatform', async () => {
      mockContainer.queries.listInstruments.byPlatformId.mockResolvedValue([]);

      const request = createMockRequest();

      await controller.handle(request, ['platform', '1'], {});

      expect(mockContainer.queries.listInstruments.byPlatformId).toHaveBeenCalledWith(1);
    });

    it('should route GET /instruments/station/:stationId to byStation', async () => {
      mockContainer.queries.listInstruments.byStationId.mockResolvedValue([]);

      const request = createMockRequest();

      await controller.handle(request, ['station', '1'], {});

      expect(mockContainer.queries.listInstruments.byStationId).toHaveBeenCalledWith(1);
    });

    it('should route GET /instruments/:id/details to get with details', async () => {
      mockContainer.queries.getInstrument.withDetails.mockResolvedValue({
        id: 1,
        normalized_name: 'TEST'
      });

      const request = createMockRequest();

      await controller.handle(request, ['1', 'details'], {});

      expect(mockContainer.queries.getInstrument.withDetails).toHaveBeenCalledWith(1);
    });

    it('should route GET /instruments/:id to get', async () => {
      mockContainer.queries.getInstrument.byId.mockResolvedValue(
        createMockInstrument(1, 'SVB_FOR_TWR01_PHE01')
      );

      const request = createMockRequest();

      await controller.handle(request, ['1'], {});

      expect(mockContainer.queries.getInstrument.byId).toHaveBeenCalledWith(1);
    });

    it('should route POST /instruments to create', async () => {
      mockContainer.queries.getPlatform.byId.mockResolvedValue(createMockPlatform(1, 1));
      mockContainer.commands.createInstrument.execute.mockResolvedValue(
        createMockInstrument(1, 'NEW')
      );

      const request = createMockRequest({
        method: 'POST',
        body: { platform_id: 1 }
      });

      await controller.handle(request, [], {});

      expect(mockContainer.commands.createInstrument.execute).toHaveBeenCalled();
    });

    it('should return 404 for unknown routes', async () => {
      const request = createMockRequest({ method: 'PATCH' });

      const response = await controller.handle(request, [], {});

      expect(response.status).toBe(404);
    });
  });
});
