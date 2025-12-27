/**
 * @vitest-environment node
 *
 * GetStation Query Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetStation } from '../../../src/application/queries/GetStation.js';

describe('GetStation Query', () => {
  let query;
  let mockStationRepository;

  const createMockStation = (id, acronym) => ({
    id,
    acronym,
    displayName: `${acronym} Station`,
    latitude: 64.256,
    longitude: 19.774,
    toJSON: () => ({ id, acronym, display_name: `${acronym} Station` })
  });

  beforeEach(() => {
    mockStationRepository = {
      findById: vi.fn(),
      findByAcronym: vi.fn()
    };

    query = new GetStation({
      stationRepository: mockStationRepository
    });
  });

  describe('byId', () => {
    it('should return station when found', async () => {
      const mockStation = createMockStation(1, 'SVB');
      mockStationRepository.findById.mockResolvedValue(mockStation);

      const result = await query.byId(1);

      expect(result).toBe(mockStation);
      expect(mockStationRepository.findById).toHaveBeenCalledWith(1);
    });

    it('should return null when not found', async () => {
      mockStationRepository.findById.mockResolvedValue(null);

      const result = await query.byId(999);

      expect(result).toBeNull();
    });
  });

  describe('byAcronym', () => {
    it('should return station when found', async () => {
      const mockStation = createMockStation(1, 'SVB');
      mockStationRepository.findByAcronym.mockResolvedValue(mockStation);

      const result = await query.byAcronym('SVB');

      expect(result).toBe(mockStation);
      expect(mockStationRepository.findByAcronym).toHaveBeenCalledWith('SVB');
    });

    it('should return null when not found', async () => {
      mockStationRepository.findByAcronym.mockResolvedValue(null);

      const result = await query.byAcronym('UNKNOWN');

      expect(result).toBeNull();
    });
  });
});
