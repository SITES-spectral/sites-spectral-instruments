/**
 * @vitest-environment node
 *
 * UpdateInstrument Command Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateInstrument } from '../../../src/application/commands/UpdateInstrument.js';

describe('UpdateInstrument Command', () => {
  let command;
  let mockInstrumentRepository;

  const createMockInstrument = (id, data) => ({
    id,
    ...data,
    updateStatus: vi.fn(function(status) { this.status = status; }),
    updateMeasurementStatus: vi.fn(function(status) { this.measurementStatus = status; }),
    toJSON: () => ({ id, ...data })
  });

  beforeEach(() => {
    mockInstrumentRepository = {
      findById: vi.fn(),
      save: vi.fn()
    };

    command = new UpdateInstrument({
      instrumentRepository: mockInstrumentRepository
    });
  });

  describe('execute', () => {
    it('should update instrument display name', async () => {
      const existingInstrument = createMockInstrument(1, {
        normalizedName: 'SVB_FOR_TWR01_PHE01',
        displayName: 'Old Name',
        instrumentType: 'Phenocam',
        status: 'Active',
        specifications: { cameraBrand: 'Canon' }
      });

      mockInstrumentRepository.findById.mockResolvedValue(existingInstrument);
      mockInstrumentRepository.save.mockImplementation(instrument =>
        Promise.resolve(instrument)
      );

      const result = await command.execute({
        id: 1,
        displayName: 'New Name'
      });

      expect(result.displayName).toBe('New Name');
      expect(result.specifications.cameraBrand).toBe('Canon'); // unchanged
    });

    it('should update description', async () => {
      const existingInstrument = createMockInstrument(1, {
        normalizedName: 'SVB_FOR_TWR01_PHE01',
        displayName: 'Name',
        description: 'Old description'
      });

      mockInstrumentRepository.findById.mockResolvedValue(existingInstrument);
      mockInstrumentRepository.save.mockImplementation(instrument =>
        Promise.resolve(instrument)
      );

      const result = await command.execute({
        id: 1,
        description: 'New description'
      });

      expect(result.description).toBe('New description');
    });

    it('should throw error if instrument not found', async () => {
      mockInstrumentRepository.findById.mockResolvedValue(null);

      await expect(command.execute({
        id: 999,
        displayName: 'New Name'
      })).rejects.toThrow("Instrument with ID '999' not found");
    });

    it('should update status via domain method', async () => {
      const existingInstrument = createMockInstrument(1, {
        normalizedName: 'SVB_FOR_TWR01_PHE01',
        status: 'Active'
      });

      mockInstrumentRepository.findById.mockResolvedValue(existingInstrument);
      mockInstrumentRepository.save.mockImplementation(instrument =>
        Promise.resolve(instrument)
      );

      await command.execute({
        id: 1,
        status: 'Inactive'
      });

      expect(existingInstrument.updateStatus).toHaveBeenCalledWith('Inactive');
    });

    it('should update measurement status via domain method', async () => {
      const existingInstrument = createMockInstrument(1, {
        normalizedName: 'SVB_FOR_TWR01_PHE01',
        measurementStatus: 'Operational'
      });

      mockInstrumentRepository.findById.mockResolvedValue(existingInstrument);
      mockInstrumentRepository.save.mockImplementation(instrument =>
        Promise.resolve(instrument)
      );

      await command.execute({
        id: 1,
        measurementStatus: 'Under Maintenance'
      });

      expect(existingInstrument.updateMeasurementStatus).toHaveBeenCalledWith('Under Maintenance');
    });

    it('should merge specifications', async () => {
      const existingInstrument = createMockInstrument(1, {
        normalizedName: 'SVB_FOR_TWR01_PHE01',
        specifications: {
          cameraBrand: 'Canon',
          cameraModel: 'EOS 5D'
        }
      });

      mockInstrumentRepository.findById.mockResolvedValue(existingInstrument);
      mockInstrumentRepository.save.mockImplementation(instrument =>
        Promise.resolve(instrument)
      );

      const result = await command.execute({
        id: 1,
        specifications: {
          resolution: '4K',
          cameraModel: 'EOS R5' // override
        }
      });

      expect(result.specifications).toEqual({
        cameraBrand: 'Canon', // preserved
        cameraModel: 'EOS R5', // overridden
        resolution: '4K' // added
      });
    });

    it('should update timestamp', async () => {
      const existingInstrument = createMockInstrument(1, {
        normalizedName: 'SVB_FOR_TWR01_PHE01',
        updatedAt: '2024-01-01T00:00:00.000Z'
      });

      mockInstrumentRepository.findById.mockResolvedValue(existingInstrument);
      mockInstrumentRepository.save.mockImplementation(instrument =>
        Promise.resolve(instrument)
      );

      const result = await command.execute({
        id: 1,
        displayName: 'Updated'
      });

      expect(result.updatedAt).not.toBe('2024-01-01T00:00:00.000Z');
    });
  });
});
