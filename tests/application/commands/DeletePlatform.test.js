/**
 * @vitest-environment node
 *
 * DeletePlatform Command Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeletePlatform } from '../../../src/application/commands/DeletePlatform.js';

describe('DeletePlatform Command', () => {
  let command;
  let mockPlatformRepository;
  let mockInstrumentRepository;

  const createMockPlatform = (id, normalizedName) => ({
    id,
    normalizedName,
    toJSON: () => ({ id, normalized_name: normalizedName })
  });

  const createMockInstrument = (id, platformId, name) => ({
    id,
    platformId,
    normalizedName: name,
    toJSON: () => ({ id, platform_id: platformId, normalized_name: name })
  });

  beforeEach(() => {
    mockPlatformRepository = {
      findById: vi.fn(),
      delete: vi.fn()
    };

    mockInstrumentRepository = {
      findByPlatformId: vi.fn()
    };

    command = new DeletePlatform({
      platformRepository: mockPlatformRepository,
      instrumentRepository: mockInstrumentRepository
    });
  });

  describe('execute', () => {
    it('should delete platform with no instruments', async () => {
      mockPlatformRepository.findById.mockResolvedValue(
        createMockPlatform(1, 'SVB_FOR_TWR01')
      );
      mockInstrumentRepository.findByPlatformId.mockResolvedValue([]);
      mockPlatformRepository.delete.mockResolvedValue(true);

      const result = await command.execute(1);

      expect(mockPlatformRepository.findById).toHaveBeenCalledWith(1);
      expect(mockInstrumentRepository.findByPlatformId).toHaveBeenCalledWith(1);
      expect(mockPlatformRepository.delete).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });

    it('should throw error if platform not found', async () => {
      mockPlatformRepository.findById.mockResolvedValue(null);

      await expect(command.execute(999))
        .rejects.toThrow("Platform with ID '999' not found");

      expect(mockInstrumentRepository.findByPlatformId).not.toHaveBeenCalled();
      expect(mockPlatformRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw error if platform has instruments', async () => {
      mockPlatformRepository.findById.mockResolvedValue(
        createMockPlatform(1, 'SVB_FOR_TWR01')
      );
      mockInstrumentRepository.findByPlatformId.mockResolvedValue([
        createMockInstrument(1, 1, 'SVB_FOR_TWR01_PHE01'),
        createMockInstrument(2, 1, 'SVB_FOR_TWR01_PHE02')
      ]);

      await expect(command.execute(1))
        .rejects.toThrow("Cannot delete platform 'SVB_FOR_TWR01': 2 instrument(s) still exist");

      expect(mockPlatformRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw error if platform has one instrument', async () => {
      mockPlatformRepository.findById.mockResolvedValue(
        createMockPlatform(1, 'ANS_FOR_TWR01')
      );
      mockInstrumentRepository.findByPlatformId.mockResolvedValue([
        createMockInstrument(1, 1, 'ANS_FOR_TWR01_PHE01')
      ]);

      await expect(command.execute(1))
        .rejects.toThrow("Cannot delete platform 'ANS_FOR_TWR01': 1 instrument(s) still exist");
    });

    it('should check instruments before attempting delete', async () => {
      mockPlatformRepository.findById.mockResolvedValue(
        createMockPlatform(1, 'TEST_FOR_TWR01')
      );
      mockInstrumentRepository.findByPlatformId.mockResolvedValue([]);
      mockPlatformRepository.delete.mockResolvedValue(true);

      await command.execute(1);

      // Verify order of operations
      expect(mockPlatformRepository.findById.mock.invocationCallOrder[0])
        .toBeLessThan(mockInstrumentRepository.findByPlatformId.mock.invocationCallOrder[0]);
      expect(mockInstrumentRepository.findByPlatformId.mock.invocationCallOrder[0])
        .toBeLessThan(mockPlatformRepository.delete.mock.invocationCallOrder[0]);
    });
  });
});
