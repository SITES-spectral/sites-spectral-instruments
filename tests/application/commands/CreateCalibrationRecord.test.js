/**
 * @vitest-environment node
 *
 * CreateCalibrationRecord Command Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateCalibrationRecord } from '../../../src/application/commands/CreateCalibrationRecord.js';

describe('CreateCalibrationRecord Command', () => {
  let command;
  let mockCalibrationRepository;
  let mockInstrumentRepository;

  const createMockInstrument = (id, type) => ({
    id,
    instrumentType: type,
    normalizedName: `SVB_FOR_TWR01_${type.toUpperCase().substring(0, 3)}01`,
    toJSON: () => ({ id, instrument_type: type })
  });

  const createMockRecord = (id, data) => ({
    id,
    ...data,
    toJSON: () => ({ id, ...data })
  });

  beforeEach(() => {
    mockCalibrationRepository = {
      save: vi.fn(),
      findCurrentValid: vi.fn()
    };

    mockInstrumentRepository = {
      findById: vi.fn()
    };

    command = new CreateCalibrationRecord({
      calibrationRepository: mockCalibrationRepository,
      instrumentRepository: mockInstrumentRepository
    });
  });

  describe('execute', () => {
    it('should create calibration record for multispectral sensor', async () => {
      mockInstrumentRepository.findById.mockResolvedValue(
        createMockInstrument(1, 'Multispectral')
      );
      mockCalibrationRepository.findCurrentValid.mockResolvedValue(null);
      mockCalibrationRepository.save.mockImplementation(record =>
        Promise.resolve(createMockRecord(1, {
          instrumentId: record.instrumentId
        }))
      );

      const result = await command.execute({
        instrumentId: 1,
        channelId: 'RED',
        calibrationDate: '2025-01-15',
        calibrationType: 'radiometric'
      });

      expect(result).toBeDefined();
      expect(mockInstrumentRepository.findById).toHaveBeenCalledWith(1);
    });

    it('should throw error if instrument not found', async () => {
      mockInstrumentRepository.findById.mockResolvedValue(null);

      await expect(command.execute({
        instrumentId: 999,
        channelId: 'RED'
      })).rejects.toThrow('Instrument with ID 999 not found');
    });

    it('should throw error for non-calibratable instrument type', async () => {
      mockInstrumentRepository.findById.mockResolvedValue(
        createMockInstrument(1, 'Phenocam')
      );

      await expect(command.execute({
        instrumentId: 1,
        channelId: 'RGB'
      })).rejects.toThrow('Calibration is only supported for multispectral and hyperspectral sensors');
    });

    it('should allow calibration for hyperspectral sensor', async () => {
      mockInstrumentRepository.findById.mockResolvedValue(
        createMockInstrument(1, 'Hyperspectral')
      );
      mockCalibrationRepository.findCurrentValid.mockResolvedValue(null);
      mockCalibrationRepository.save.mockImplementation(record =>
        Promise.resolve(createMockRecord(1, {}))
      );

      const result = await command.execute({
        instrumentId: 1,
        channelId: 'VNIR',
        calibrationDate: '2025-01-15',
        calibrationType: 'spectral'
      });

      expect(result).toBeDefined();
    });

    it('should expire previous calibration when new valid calibration is created', async () => {
      const existingCalibration = createMockRecord(1, {
        status: 'valid',
        instrumentId: 1,
        channelId: 'RED'
      });

      mockInstrumentRepository.findById.mockResolvedValue(
        createMockInstrument(1, 'Multispectral')
      );
      mockCalibrationRepository.findCurrentValid.mockResolvedValue(existingCalibration);
      mockCalibrationRepository.save.mockResolvedValue(createMockRecord(2, {}));

      await command.execute({
        instrumentId: 1,
        channelId: 'RED',
        calibrationDate: '2025-01-15',
        calibrationType: 'radiometric',
        status: 'valid'
      });

      // First save is for expiring old, second is for new record
      expect(mockCalibrationRepository.save).toHaveBeenCalledTimes(2);
      expect(existingCalibration.status).toBe('superseded');
    });
  });
});
