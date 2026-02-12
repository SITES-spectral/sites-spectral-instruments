/**
 * @vitest-environment node
 *
 * StationController Unit Tests
 *
 * Tests HTTP request handling, authentication, response formatting.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StationController } from '../../../../src/infrastructure/http/controllers/StationController.js';

describe('StationController', () => {
  let controller;
  let mockContainer;
  let mockEnv;

  const createMockStation = (id, acronym) => ({
    id,
    acronym,
    displayName: `${acronym} Station`,
    toJSON: () => ({ id, acronym, display_name: `${acronym} Station` })
  });

  const createMockRequest = (options = {}) => ({
    method: options.method || 'GET',
    headers: new Map([
      ['Authorization', options.token ? `Bearer ${options.token}` : '']
    ]),
    json: vi.fn().mockResolvedValue(options.body || {})
  });

  const createMockUrl = (params = {}) => ({
    searchParams: new Map(Object.entries(params))
  });

  beforeEach(() => {
    mockContainer = {
      queries: {
        listStations: { execute: vi.fn() },
        getStation: { byId: vi.fn(), byAcronym: vi.fn() },
        getStationDashboard: { execute: vi.fn() }
      },
      commands: {
        createStation: { execute: vi.fn() },
        updateStation: { execute: vi.fn() },
        deleteStation: { execute: vi.fn() }
      }
    };

    mockEnv = {
      JWT_SECRET: 'test-secret'
    };

    controller = new StationController(mockContainer, mockEnv);

    // Mock auth middleware to bypass auth for most tests
    controller.auth = {
      authenticateAndAuthorize: vi.fn().mockResolvedValue({ user: { id: 1 }, response: null })
    };
  });

  describe('list', () => {
    it('should return paginated stations', async () => {
      const mockStations = [
        createMockStation(1, 'ANS'),
        createMockStation(2, 'SVB')
      ];

      mockContainer.queries.listStations.execute.mockResolvedValue({
        items: mockStations,
        pagination: { page: 1, limit: 25, total: 2, totalPages: 1 }
      });

      const request = createMockRequest();
      const url = createMockUrl();

      const response = await controller.list(request, url);
      const body = await response.json();

      expect(body.data).toHaveLength(2);
      expect(body.meta.total).toBe(2);
    });

    it('should pass pagination parameters to query', async () => {
      mockContainer.queries.listStations.execute.mockResolvedValue({
        items: [],
        pagination: { page: 2, limit: 10, total: 0, totalPages: 0 }
      });

      const request = createMockRequest();
      const url = {
        searchParams: {
          get: (key) => {
            // Use valid snake_case sort fields per API validation
            const params = { page: '2', limit: '10', sort_by: 'display_name', sort_order: 'desc' };
            return params[key];
          }
        }
      };

      await controller.list(request, url);

      expect(mockContainer.queries.listStations.execute).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        sortBy: 'display_name',
        sortOrder: 'desc'
      });
    });

    it('should enforce max limit of 100', async () => {
      mockContainer.queries.listStations.execute.mockResolvedValue({
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

      expect(mockContainer.queries.listStations.execute).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 100 })
      );
    });

    it('should return 401 if authentication fails', async () => {
      controller.auth.authenticateAndAuthorize.mockResolvedValue({
        user: null,
        response: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
      });

      const request = createMockRequest();
      const url = createMockUrl();

      const response = await controller.list(request, url);

      expect(response.status).toBe(401);
    });
  });

  describe('get', () => {
    it('should return station by numeric ID', async () => {
      const mockStation = createMockStation(1, 'SVB');
      mockContainer.queries.getStation.byId.mockResolvedValue(mockStation);

      const request = createMockRequest();

      const response = await controller.get(request, '1');
      const body = await response.json();

      expect(body.data.acronym).toBe('SVB');
      expect(mockContainer.queries.getStation.byId).toHaveBeenCalledWith(1);
    });

    it('should return station by acronym', async () => {
      const mockStation = createMockStation(1, 'SVB');
      mockContainer.queries.getStation.byAcronym.mockResolvedValue(mockStation);

      const request = createMockRequest();

      const response = await controller.get(request, 'SVB');
      const body = await response.json();

      expect(body.data.acronym).toBe('SVB');
      expect(mockContainer.queries.getStation.byAcronym).toHaveBeenCalledWith('SVB');
    });

    it('should uppercase acronym lookup', async () => {
      mockContainer.queries.getStation.byAcronym.mockResolvedValue(null);

      const request = createMockRequest();

      await controller.get(request, 'svb');

      expect(mockContainer.queries.getStation.byAcronym).toHaveBeenCalledWith('SVB');
    });

    it('should return 404 when station not found', async () => {
      mockContainer.queries.getStation.byId.mockResolvedValue(null);

      const request = createMockRequest();

      const response = await controller.get(request, '999');

      expect(response.status).toBe(404);
    });
  });

  describe('dashboard', () => {
    it('should return station dashboard', async () => {
      const mockDashboard = {
        station: { id: 1, acronym: 'SVB' },
        platforms: [],
        stats: { platformCount: 0 }
      };
      mockContainer.queries.getStationDashboard.execute.mockResolvedValue(mockDashboard);

      const request = createMockRequest();

      const response = await controller.dashboard(request, 'SVB');
      const body = await response.json();

      expect(body.data.station.acronym).toBe('SVB');
    });

    it('should uppercase acronym', async () => {
      mockContainer.queries.getStationDashboard.execute.mockResolvedValue(null);

      const request = createMockRequest();

      await controller.dashboard(request, 'svb');

      expect(mockContainer.queries.getStationDashboard.execute).toHaveBeenCalledWith('SVB');
    });

    it('should return 404 when station not found', async () => {
      mockContainer.queries.getStationDashboard.execute.mockResolvedValue(null);

      const request = createMockRequest();

      const response = await controller.dashboard(request, 'UNKNOWN');

      expect(response.status).toBe(404);
    });
  });

  describe('create', () => {
    it('should create station with valid data', async () => {
      const mockStation = createMockStation(1, 'NEW');
      mockContainer.commands.createStation.execute.mockResolvedValue(mockStation);

      const request = createMockRequest({
        method: 'POST',
        body: {
          acronym: 'NEW',
          display_name: 'New Station',
          latitude: 64.0,
          longitude: 19.0
        }
      });

      const response = await controller.create(request);
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.data.acronym).toBe('NEW');
    });

    it('should support both snake_case and camelCase fields', async () => {
      const mockStation = createMockStation(1, 'NEW');
      mockContainer.commands.createStation.execute.mockResolvedValue(mockStation);

      const request = createMockRequest({
        method: 'POST',
        body: {
          acronym: 'NEW',
          displayName: 'New Station', // camelCase
          websiteUrl: 'https://example.com' // camelCase
        }
      });

      await controller.create(request);

      expect(mockContainer.commands.createStation.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          displayName: 'New Station',
          websiteUrl: 'https://example.com'
        })
      );
    });

    it('should return 400 for invalid JSON', async () => {
      const request = createMockRequest({ method: 'POST' });
      request.json.mockRejectedValue(new Error('Invalid JSON'));

      const response = await controller.create(request);

      expect(response.status).toBe(400);
    });

    it('should return 400 for validation errors', async () => {
      mockContainer.commands.createStation.execute.mockRejectedValue(
        new Error('Acronym must be 2-10 uppercase letters')
      );

      const request = createMockRequest({
        method: 'POST',
        body: { acronym: 'invalid!' }
      });

      const response = await controller.create(request);

      expect(response.status).toBe(400);
    });
  });

  describe('update', () => {
    it('should update station', async () => {
      const mockStation = createMockStation(1, 'SVB');
      mockStation.displayName = 'Updated Name';
      mockContainer.commands.updateStation.execute.mockResolvedValue(mockStation);

      const request = createMockRequest({
        method: 'PUT',
        body: { display_name: 'Updated Name' }
      });

      const response = await controller.update(request, '1');
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(mockContainer.commands.updateStation.execute).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1 })
      );
    });

    it('should return 404 when station not found', async () => {
      mockContainer.commands.updateStation.execute.mockRejectedValue(
        new Error("Station with ID '999' not found")
      );

      const request = createMockRequest({
        method: 'PUT',
        body: { display_name: 'Updated' }
      });

      const response = await controller.update(request, '999');

      expect(response.status).toBe(404);
    });
  });

  describe('delete', () => {
    it('should delete station', async () => {
      mockContainer.commands.deleteStation.execute.mockResolvedValue(true);

      const request = createMockRequest({ method: 'DELETE' });

      const response = await controller.delete(request, '1');
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.deleted).toBe(true);
    });

    it('should return 404 when station not found', async () => {
      mockContainer.commands.deleteStation.execute.mockRejectedValue(
        new Error("Station with ID '999' not found")
      );

      const request = createMockRequest({ method: 'DELETE' });

      const response = await controller.delete(request, '999');

      expect(response.status).toBe(404);
    });

    it('should return 409 when station has platforms', async () => {
      mockContainer.commands.deleteStation.execute.mockRejectedValue(
        new Error("Cannot delete station 'SVB': 2 platform(s) still exist")
      );

      const request = createMockRequest({ method: 'DELETE' });

      const response = await controller.delete(request, '1');

      expect(response.status).toBe(409);
    });
  });

  describe('handle - routing', () => {
    it('should route GET /stations to list', async () => {
      mockContainer.queries.listStations.execute.mockResolvedValue({
        items: [],
        pagination: {}
      });

      const request = createMockRequest();
      const url = createMockUrl();

      await controller.handle(request, [], url);

      expect(mockContainer.queries.listStations.execute).toHaveBeenCalled();
    });

    it('should route GET /stations/:id to get', async () => {
      mockContainer.queries.getStation.byId.mockResolvedValue(createMockStation(1, 'SVB'));

      const request = createMockRequest();

      await controller.handle(request, ['1'], {});

      expect(mockContainer.queries.getStation.byId).toHaveBeenCalledWith(1);
    });

    it('should route GET /stations/:acronym/dashboard to dashboard', async () => {
      mockContainer.queries.getStationDashboard.execute.mockResolvedValue({});

      const request = createMockRequest();

      await controller.handle(request, ['SVB', 'dashboard'], {});

      expect(mockContainer.queries.getStationDashboard.execute).toHaveBeenCalledWith('SVB');
    });

    it('should route POST /stations to create', async () => {
      mockContainer.commands.createStation.execute.mockResolvedValue(createMockStation(1, 'NEW'));

      const request = createMockRequest({
        method: 'POST',
        body: { acronym: 'NEW' }
      });

      await controller.handle(request, [], {});

      expect(mockContainer.commands.createStation.execute).toHaveBeenCalled();
    });

    it('should route PUT /stations/:id to update', async () => {
      mockContainer.commands.updateStation.execute.mockResolvedValue(createMockStation(1, 'SVB'));

      const request = createMockRequest({
        method: 'PUT',
        body: {}
      });

      await controller.handle(request, ['1'], {});

      expect(mockContainer.commands.updateStation.execute).toHaveBeenCalled();
    });

    it('should route DELETE /stations/:id to delete', async () => {
      mockContainer.commands.deleteStation.execute.mockResolvedValue(true);

      const request = createMockRequest({ method: 'DELETE' });

      await controller.handle(request, ['1'], {});

      expect(mockContainer.commands.deleteStation.execute).toHaveBeenCalled();
    });

    it('should return 404 for unknown routes', async () => {
      const request = createMockRequest({ method: 'PATCH' });

      const response = await controller.handle(request, [], {});

      expect(response.status).toBe(404);
    });
  });
});
