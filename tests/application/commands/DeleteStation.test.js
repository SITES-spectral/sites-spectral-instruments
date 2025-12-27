/**
 * @vitest-environment node
 *
 * DeleteStation Command Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteStation } from '../../../src/application/commands/DeleteStation.js';

describe('DeleteStation Command', () => {
  let command;
  let mockStationRepository;
  let mockPlatformRepository;

  const createMockStation = (id, acronym) => ({
    id,
    acronym,
    displayName: `${acronym} Station`,
    toJSON: () => ({ id, acronym })
  });

  const createMockPlatform = (id, stationId, name) => ({
    id,
    stationId,
    normalizedName: name,
    toJSON: () => ({ id, station_id: stationId, normalized_name: name })
  });

  beforeEach(() => {
    mockStationRepository = {
      findById: vi.fn(),
      delete: vi.fn()
    };

    mockPlatformRepository = {
      findByStationId: vi.fn()
    };

    command = new DeleteStation({
      stationRepository: mockStationRepository,
      platformRepository: mockPlatformRepository
    });
  });

  describe('execute', () => {
    it('should delete station with no platforms', async () => {
      mockStationRepository.findById.mockResolvedValue(
        createMockStation(1, 'TEST')
      );
      mockPlatformRepository.findByStationId.mockResolvedValue([]);
      mockStationRepository.delete.mockResolvedValue(true);

      const result = await command.execute(1);

      expect(mockStationRepository.findById).toHaveBeenCalledWith(1);
      expect(mockPlatformRepository.findByStationId).toHaveBeenCalledWith(1);
      expect(mockStationRepository.delete).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });

    it('should throw error if station not found', async () => {
      mockStationRepository.findById.mockResolvedValue(null);

      await expect(command.execute(999))
        .rejects.toThrow("Station with ID '999' not found");

      expect(mockPlatformRepository.findByStationId).not.toHaveBeenCalled();
      expect(mockStationRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw error if station has platforms', async () => {
      mockStationRepository.findById.mockResolvedValue(
        createMockStation(1, 'SVB')
      );
      mockPlatformRepository.findByStationId.mockResolvedValue([
        createMockPlatform(1, 1, 'SVB_FOR_TWR01'),
        createMockPlatform(2, 1, 'SVB_FOR_TWR02')
      ]);

      await expect(command.execute(1))
        .rejects.toThrow("Cannot delete station 'SVB': 2 platform(s) still exist");

      expect(mockStationRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw error if station has one platform', async () => {
      mockStationRepository.findById.mockResolvedValue(
        createMockStation(1, 'ANS')
      );
      mockPlatformRepository.findByStationId.mockResolvedValue([
        createMockPlatform(1, 1, 'ANS_FOR_TWR01')
      ]);

      await expect(command.execute(1))
        .rejects.toThrow("Cannot delete station 'ANS': 1 platform(s) still exist");
    });

    it('should check platforms before attempting delete', async () => {
      mockStationRepository.findById.mockResolvedValue(
        createMockStation(1, 'TEST')
      );
      mockPlatformRepository.findByStationId.mockResolvedValue([]);
      mockStationRepository.delete.mockResolvedValue(true);

      await command.execute(1);

      // Verify order of operations
      expect(mockStationRepository.findById.mock.invocationCallOrder[0])
        .toBeLessThan(mockPlatformRepository.findByStationId.mock.invocationCallOrder[0]);
      expect(mockPlatformRepository.findByStationId.mock.invocationCallOrder[0])
        .toBeLessThan(mockStationRepository.delete.mock.invocationCallOrder[0]);
    });
  });
});
