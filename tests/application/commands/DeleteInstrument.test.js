/**
 * @vitest-environment node
 *
 * DeleteInstrument Command Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteInstrument } from '../../../src/application/commands/DeleteInstrument.js';

describe('DeleteInstrument Command', () => {
  let command;
  let mockInstrumentRepository;

  const createMockInstrument = (id, normalizedName) => ({
    id,
    normalizedName,
    toJSON: () => ({ id, normalized_name: normalizedName })
  });

  beforeEach(() => {
    mockInstrumentRepository = {
      findById: vi.fn(),
      hasROIs: vi.fn(),
      delete: vi.fn()
    };

    command = new DeleteInstrument({
      instrumentRepository: mockInstrumentRepository
    });
  });

  describe('execute', () => {
    it('should delete instrument with no ROIs', async () => {
      mockInstrumentRepository.findById.mockResolvedValue(
        createMockInstrument(1, 'SVB_FOR_TWR01_PHE01')
      );
      mockInstrumentRepository.hasROIs.mockResolvedValue(false);
      mockInstrumentRepository.delete.mockResolvedValue(true);

      const result = await command.execute(1);

      expect(mockInstrumentRepository.findById).toHaveBeenCalledWith(1);
      expect(mockInstrumentRepository.hasROIs).toHaveBeenCalledWith(1);
      expect(mockInstrumentRepository.delete).toHaveBeenCalledWith(1, false);
      expect(result).toBe(true);
    });

    it('should throw error if instrument not found', async () => {
      mockInstrumentRepository.findById.mockResolvedValue(null);

      await expect(command.execute(999))
        .rejects.toThrow("Instrument with ID '999' not found");

      expect(mockInstrumentRepository.hasROIs).not.toHaveBeenCalled();
      expect(mockInstrumentRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw error if instrument has ROIs and cascade is false', async () => {
      mockInstrumentRepository.findById.mockResolvedValue(
        createMockInstrument(1, 'SVB_FOR_TWR01_PHE01')
      );
      mockInstrumentRepository.hasROIs.mockResolvedValue(true);

      await expect(command.execute(1))
        .rejects.toThrow("Cannot delete instrument 'SVB_FOR_TWR01_PHE01': ROIs still exist");

      expect(mockInstrumentRepository.delete).not.toHaveBeenCalled();
    });

    it('should delete instrument with ROIs when cascade is true', async () => {
      mockInstrumentRepository.findById.mockResolvedValue(
        createMockInstrument(1, 'SVB_FOR_TWR01_PHE01')
      );
      mockInstrumentRepository.delete.mockResolvedValue(true);

      const result = await command.execute(1, { cascade: true });

      expect(mockInstrumentRepository.hasROIs).not.toHaveBeenCalled();
      expect(mockInstrumentRepository.delete).toHaveBeenCalledWith(1, true);
      expect(result).toBe(true);
    });

    it('should check ROIs before attempting delete', async () => {
      mockInstrumentRepository.findById.mockResolvedValue(
        createMockInstrument(1, 'TEST_PHE01')
      );
      mockInstrumentRepository.hasROIs.mockResolvedValue(false);
      mockInstrumentRepository.delete.mockResolvedValue(true);

      await command.execute(1);

      // Verify order of operations
      expect(mockInstrumentRepository.findById.mock.invocationCallOrder[0])
        .toBeLessThan(mockInstrumentRepository.hasROIs.mock.invocationCallOrder[0]);
      expect(mockInstrumentRepository.hasROIs.mock.invocationCallOrder[0])
        .toBeLessThan(mockInstrumentRepository.delete.mock.invocationCallOrder[0]);
    });

    it('should pass cascade option to repository delete', async () => {
      mockInstrumentRepository.findById.mockResolvedValue(
        createMockInstrument(1, 'SVB_FOR_TWR01_PHE01')
      );
      mockInstrumentRepository.delete.mockResolvedValue(true);

      await command.execute(1, { cascade: true });

      expect(mockInstrumentRepository.delete).toHaveBeenCalledWith(1, true);
    });
  });
});
