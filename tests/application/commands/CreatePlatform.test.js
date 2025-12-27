/**
 * @vitest-environment node
 *
 * CreatePlatform Command Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreatePlatform } from '../../../src/application/commands/CreatePlatform.js';

describe('CreatePlatform Command', () => {
  let command;
  let mockStationRepository;
  let mockPlatformRepository;
  let mockInstrumentRepository;

  const createMockStation = (id, acronym) => ({
    id,
    acronym,
    latitude: 64.256,
    longitude: 19.774,
    toJSON: () => ({ id, acronym, latitude: 64.256, longitude: 19.774 })
  });

  const createMockPlatform = (id, data) => ({
    id,
    ...data,
    toJSON: () => ({ id, ...data })
  });

  const validFixedInput = {
    stationId: 1,
    platformType: 'fixed',
    ecosystemCode: 'FOR',
    displayName: 'Test Platform'
  };

  const validUAVInput = {
    stationId: 1,
    platformType: 'uav',
    vendor: 'DJI',
    model: 'M3M',
    displayName: 'Test UAV'
  };

  beforeEach(() => {
    mockStationRepository = {
      findById: vi.fn()
    };

    mockPlatformRepository = {
      findByNormalizedName: vi.fn(),
      getNextMountTypeCode: vi.fn(),
      save: vi.fn()
    };

    mockInstrumentRepository = {
      save: vi.fn()
    };

    command = new CreatePlatform({
      stationRepository: mockStationRepository,
      platformRepository: mockPlatformRepository,
      instrumentRepository: mockInstrumentRepository
    });
  });

  describe('execute - fixed platform', () => {
    it('should create fixed platform with valid input', async () => {
      mockStationRepository.findById.mockResolvedValue(
        createMockStation(1, 'SVB')
      );
      mockPlatformRepository.getNextMountTypeCode.mockResolvedValue('TWR01');
      mockPlatformRepository.findByNormalizedName.mockResolvedValue(null);
      mockPlatformRepository.save.mockImplementation(platform =>
        Promise.resolve(createMockPlatform(1, {
          normalizedName: platform.normalizedName,
          platformType: platform.platformType,
          ecosystemCode: platform.ecosystemCode,
          mountTypeCode: platform.mountTypeCode
        }))
      );

      const result = await command.execute(validFixedInput);

      expect(result.platform).toBeDefined();
      expect(result.platform.id).toBe(1);
      expect(result.instruments).toEqual([]);
    });

    it('should throw error if station not found', async () => {
      mockStationRepository.findById.mockResolvedValue(null);

      await expect(command.execute(validFixedInput))
        .rejects.toThrow("Station with ID '1' not found");
    });

    it('should throw error if platform already exists', async () => {
      mockStationRepository.findById.mockResolvedValue(
        createMockStation(1, 'SVB')
      );
      mockPlatformRepository.getNextMountTypeCode.mockResolvedValue('TWR01');
      mockPlatformRepository.findByNormalizedName.mockResolvedValue(
        createMockPlatform(1, { normalizedName: 'SVB_FOR_TWR01' })
      );

      await expect(command.execute(validFixedInput))
        .rejects.toThrow("already exists");
    });

    it('should require ecosystem code for fixed platform', async () => {
      mockStationRepository.findById.mockResolvedValue(
        createMockStation(1, 'SVB')
      );

      await expect(command.execute({
        stationId: 1,
        platformType: 'fixed'
        // Missing ecosystemCode
      })).rejects.toThrow();
    });

    it('should use provided mount type code', async () => {
      mockStationRepository.findById.mockResolvedValue(
        createMockStation(1, 'SVB')
      );
      mockPlatformRepository.findByNormalizedName.mockResolvedValue(null);
      mockPlatformRepository.save.mockImplementation(platform =>
        Promise.resolve(createMockPlatform(1, {
          normalizedName: platform.normalizedName,
          mountTypeCode: platform.mountTypeCode
        }))
      );

      await command.execute({
        ...validFixedInput,
        mountTypeCode: 'BLD01'
      });

      expect(mockPlatformRepository.getNextMountTypeCode).not.toHaveBeenCalled();
    });

    it('should inherit station coordinates if not provided', async () => {
      mockStationRepository.findById.mockResolvedValue(
        createMockStation(1, 'SVB')
      );
      mockPlatformRepository.getNextMountTypeCode.mockResolvedValue('TWR01');
      mockPlatformRepository.findByNormalizedName.mockResolvedValue(null);

      let savedPlatform;
      mockPlatformRepository.save.mockImplementation(platform => {
        savedPlatform = platform;
        return Promise.resolve(createMockPlatform(1, {
          normalizedName: platform.normalizedName,
          latitude: platform.latitude,
          longitude: platform.longitude
        }));
      });

      await command.execute(validFixedInput);

      expect(savedPlatform.latitude).toBe(64.256);
      expect(savedPlatform.longitude).toBe(19.774);
    });
  });

  describe('execute - UAV platform', () => {
    it('should create UAV platform with auto-instruments', async () => {
      mockStationRepository.findById.mockResolvedValue(
        createMockStation(1, 'SVB')
      );
      mockPlatformRepository.getNextMountTypeCode.mockResolvedValue('UAV01');
      mockPlatformRepository.findByNormalizedName.mockResolvedValue(null);
      mockPlatformRepository.save.mockImplementation(platform =>
        Promise.resolve(createMockPlatform(1, {
          normalizedName: platform.normalizedName,
          platformType: platform.platformType,
          vendor: platform.vendor,
          model: platform.model
        }))
      );
      mockInstrumentRepository.save.mockImplementation(instrument =>
        Promise.resolve({ id: 1, ...instrument })
      );

      const result = await command.execute(validUAVInput);

      expect(result.platform).toBeDefined();
      expect(result.platform.id).toBe(1);
      // UAV platforms auto-create instruments
      expect(mockInstrumentRepository.save).toHaveBeenCalled();
    });

    it('should require vendor for UAV platform', async () => {
      mockStationRepository.findById.mockResolvedValue(
        createMockStation(1, 'SVB')
      );

      await expect(command.execute({
        stationId: 1,
        platformType: 'uav',
        model: 'M3M'
        // Missing vendor
      })).rejects.toThrow();
    });

    it('should require model for UAV platform', async () => {
      mockStationRepository.findById.mockResolvedValue(
        createMockStation(1, 'SVB')
      );

      await expect(command.execute({
        stationId: 1,
        platformType: 'uav',
        vendor: 'DJI'
        // Missing model
      })).rejects.toThrow();
    });
  });

  describe('_getMountTypePrefix', () => {
    it('should return correct prefixes for all platform types', async () => {
      // Access private method through instance
      expect(command._getMountTypePrefix('fixed')).toBe('TWR');
      expect(command._getMountTypePrefix('uav')).toBe('UAV');
      expect(command._getMountTypePrefix('satellite')).toBe('SAT');
      expect(command._getMountTypePrefix('mobile')).toBe('MOB');
      expect(command._getMountTypePrefix('usv')).toBe('USV');
      expect(command._getMountTypePrefix('uuv')).toBe('UUV');
    });

    it('should default to TWR for unknown types', async () => {
      expect(command._getMountTypePrefix('unknown')).toBe('TWR');
    });
  });
});
