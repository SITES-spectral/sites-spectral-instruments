/**
 * @vitest-environment node
 *
 * CreateMaintenanceRecord Command Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateMaintenanceRecord } from '../../../src/application/commands/CreateMaintenanceRecord.js';

describe('CreateMaintenanceRecord Command', () => {
  let command;
  let mockMaintenanceRepository;
  let mockPlatformRepository;
  let mockInstrumentRepository;

  const createMockPlatform = (id, stationId) => ({
    id,
    stationId,
    normalizedName: `SVB_FOR_TWR0${id}`,
    toJSON: () => ({ id, station_id: stationId })
  });

  const createMockInstrument = (id, platformId) => ({
    id,
    platformId,
    normalizedName: `SVB_FOR_TWR01_PHE0${id}`,
    toJSON: () => ({ id, platform_id: platformId })
  });

  const createMockRecord = (id, data) => ({
    id,
    ...data,
    toJSON: () => ({ id, ...data })
  });

  beforeEach(() => {
    mockMaintenanceRepository = {
      save: vi.fn()
    };

    mockPlatformRepository = {
      findById: vi.fn()
    };

    mockInstrumentRepository = {
      findById: vi.fn()
    };

    command = new CreateMaintenanceRecord({
      maintenanceRepository: mockMaintenanceRepository,
      platformRepository: mockPlatformRepository,
      instrumentRepository: mockInstrumentRepository
    });
  });

  describe('execute', () => {
    it('should create maintenance record for platform', async () => {
      mockPlatformRepository.findById.mockResolvedValue(
        createMockPlatform(1, 5)
      );
      mockMaintenanceRepository.save.mockImplementation(record =>
        Promise.resolve(createMockRecord(1, {
          entityType: record.entityType,
          entityId: record.entityId,
          stationId: record.stationId
        }))
      );

      const result = await command.execute({
        entityType: 'platform',
        entityId: 1,
        maintenanceType: 'preventive',
        description: 'Quarterly inspection'
      });

      expect(result).toBeDefined();
      expect(mockPlatformRepository.findById).toHaveBeenCalledWith(1);
    });

    it('should create maintenance record for instrument', async () => {
      mockInstrumentRepository.findById.mockResolvedValue(
        createMockInstrument(1, 2)
      );
      mockPlatformRepository.findById.mockResolvedValue(
        createMockPlatform(2, 5)
      );
      mockMaintenanceRepository.save.mockImplementation(record =>
        Promise.resolve(createMockRecord(1, {}))
      );

      const result = await command.execute({
        entityType: 'instrument',
        entityId: 1,
        maintenanceType: 'cleaning',
        description: 'Lens cleaning'
      });

      expect(result).toBeDefined();
      expect(mockInstrumentRepository.findById).toHaveBeenCalledWith(1);
      expect(mockPlatformRepository.findById).toHaveBeenCalledWith(2);
    });

    it('should throw error if platform not found', async () => {
      mockPlatformRepository.findById.mockResolvedValue(null);

      await expect(command.execute({
        entityType: 'platform',
        entityId: 999,
        maintenanceType: 'routine'
      })).rejects.toThrow('Platform with ID 999 not found');
    });

    it('should throw error if instrument not found', async () => {
      mockInstrumentRepository.findById.mockResolvedValue(null);

      await expect(command.execute({
        entityType: 'instrument',
        entityId: 999,
        maintenanceType: 'cleaning'
      })).rejects.toThrow('Instrument with ID 999 not found');
    });

    it('should throw error for invalid entity type', async () => {
      await expect(command.execute({
        entityType: 'invalid',
        entityId: 1,
        maintenanceType: 'routine'
      })).rejects.toThrow('Invalid entity type: invalid');
    });

    it('should get station ID from platform', async () => {
      mockPlatformRepository.findById.mockResolvedValue(
        createMockPlatform(1, 5)
      );

      let savedRecord;
      mockMaintenanceRepository.save.mockImplementation(record => {
        savedRecord = record;
        return Promise.resolve(createMockRecord(1, {}));
      });

      await command.execute({
        entityType: 'platform',
        entityId: 1,
        maintenanceType: 'preventive'
      });

      // Station ID should be inherited from platform
      expect(mockPlatformRepository.findById).toHaveBeenCalledWith(1);
    });

    it('should get station ID through instrument platform', async () => {
      mockInstrumentRepository.findById.mockResolvedValue(
        createMockInstrument(1, 2)
      );
      mockPlatformRepository.findById.mockResolvedValue(
        createMockPlatform(2, 5)
      );

      mockMaintenanceRepository.save.mockImplementation(record =>
        Promise.resolve(createMockRecord(1, {}))
      );

      await command.execute({
        entityType: 'instrument',
        entityId: 1,
        maintenanceType: 'cleaning'
      });

      // Should fetch instrument, then its platform
      expect(mockInstrumentRepository.findById).toHaveBeenCalledWith(1);
      expect(mockPlatformRepository.findById).toHaveBeenCalledWith(2);
    });
  });
});
