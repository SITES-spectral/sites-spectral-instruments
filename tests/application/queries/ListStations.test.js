/**
 * @vitest-environment node
 *
 * ListStations Query Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ListStations } from '../../../src/application/queries/ListStations.js';

describe('ListStations Query', () => {
  let query;
  let mockStationRepository;

  const createMockStation = (id, acronym) => ({
    id,
    acronym,
    displayName: `${acronym} Station`,
    toJSON: () => ({ id, acronym })
  });

  beforeEach(() => {
    mockStationRepository = {
      count: vi.fn(),
      findAll: vi.fn()
    };

    query = new ListStations({
      stationRepository: mockStationRepository
    });
  });

  describe('execute', () => {
    it('should return paginated stations with default parameters', async () => {
      const mockStations = [
        createMockStation(1, 'ANS'),
        createMockStation(2, 'SVB')
      ];

      mockStationRepository.count.mockResolvedValue(2);
      mockStationRepository.findAll.mockResolvedValue(mockStations);

      const result = await query.execute();

      expect(result.items).toEqual(mockStations);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1
      });
    });

    it('should pass pagination parameters to repository', async () => {
      mockStationRepository.count.mockResolvedValue(100);
      mockStationRepository.findAll.mockResolvedValue([]);

      await query.execute({
        page: 2,
        limit: 10,
        sortBy: 'displayName',
        sortOrder: 'desc'
      });

      expect(mockStationRepository.findAll).toHaveBeenCalledWith({
        limit: 10,
        offset: 10, // (page 2 - 1) * limit 10
        sortBy: 'displayName',
        sortOrder: 'desc'
      });
    });

    it('should calculate correct pagination metadata', async () => {
      mockStationRepository.count.mockResolvedValue(25);
      mockStationRepository.findAll.mockResolvedValue([]);

      const result = await query.execute({ page: 2, limit: 10 });

      expect(result.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3
      });
    });

    it('should handle empty results', async () => {
      mockStationRepository.count.mockResolvedValue(0);
      mockStationRepository.findAll.mockResolvedValue([]);

      const result = await query.execute();

      expect(result.items).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });

    it('should default sortBy to acronym', async () => {
      mockStationRepository.count.mockResolvedValue(0);
      mockStationRepository.findAll.mockResolvedValue([]);

      await query.execute();

      expect(mockStationRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'acronym',
          sortOrder: 'asc'
        })
      );
    });
  });
});
