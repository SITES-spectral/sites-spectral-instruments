/**
 * @vitest-environment node
 *
 * CreateInstrument Command Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateInstrument } from '../../../src/application/commands/CreateInstrument.js';

describe('CreateInstrument Command', () => {
  let command;
  let mockPlatformRepository;
  let mockInstrumentRepository;

  const createMockPlatform = (id, normalizedName, platformType = 'fixed') => ({
    id,
    normalizedName,
    platformType,
    toJSON: () => ({ id, normalized_name: normalizedName, platform_type: platformType })
  });

  const createMockInstrument = (id, data) => ({
    id,
    ...data,
    toJSON: () => ({ id, ...data })
  });

  const validInput = {
    platformId: 1,
    instrumentType: 'Phenocam',
    displayName: 'Test Phenocam',
    description: 'A test phenocam',
    specifications: {
      cameraBrand: 'Canon',
      cameraModel: 'EOS 5D'
    }
  };

  beforeEach(() => {
    mockPlatformRepository = {
      findById: vi.fn()
    };

    mockInstrumentRepository = {
      findByNormalizedName: vi.fn(),
      getNextInstrumentNumber: vi.fn(),
      save: vi.fn()
    };

    command = new CreateInstrument({
      platformRepository: mockPlatformRepository,
      instrumentRepository: mockInstrumentRepository
    });
  });

  describe('execute', () => {
    it('should create instrument with valid input', async () => {
      mockPlatformRepository.findById.mockResolvedValue(
        createMockPlatform(1, 'SVB_FOR_TWR01')
      );
      mockInstrumentRepository.getNextInstrumentNumber.mockResolvedValue(1);
      mockInstrumentRepository.findByNormalizedName.mockResolvedValue(null);
      mockInstrumentRepository.save.mockImplementation(instrument =>
        Promise.resolve(createMockInstrument(1, {
          normalizedName: instrument.normalizedName,
          instrumentType: instrument.instrumentType,
          displayName: instrument.displayName
        }))
      );

      const result = await command.execute(validInput);

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(mockPlatformRepository.findById).toHaveBeenCalledWith(1);
    });

    it('should throw error if platform not found', async () => {
      mockPlatformRepository.findById.mockResolvedValue(null);

      await expect(command.execute(validInput))
        .rejects.toThrow("Platform with ID '1' not found");
    });

    it('should throw error for unknown instrument type', async () => {
      mockPlatformRepository.findById.mockResolvedValue(
        createMockPlatform(1, 'SVB_FOR_TWR01')
      );

      await expect(command.execute({
        ...validInput,
        instrumentType: 'UnknownType'
      })).rejects.toThrow('Unknown instrument type');
    });

    it('should throw error if instrument already exists', async () => {
      mockPlatformRepository.findById.mockResolvedValue(
        createMockPlatform(1, 'SVB_FOR_TWR01')
      );
      mockInstrumentRepository.getNextInstrumentNumber.mockResolvedValue(1);
      mockInstrumentRepository.findByNormalizedName.mockResolvedValue(
        createMockInstrument(1, { normalizedName: 'SVB_FOR_TWR01_PHE01' })
      );

      await expect(command.execute(validInput))
        .rejects.toThrow('already exists');
    });

    it('should generate normalized name if not provided', async () => {
      mockPlatformRepository.findById.mockResolvedValue(
        createMockPlatform(1, 'SVB_FOR_TWR01')
      );
      mockInstrumentRepository.getNextInstrumentNumber.mockResolvedValue(3);
      mockInstrumentRepository.findByNormalizedName.mockResolvedValue(null);

      let savedInstrument;
      mockInstrumentRepository.save.mockImplementation(instrument => {
        savedInstrument = instrument;
        return Promise.resolve(createMockInstrument(1, {
          normalizedName: instrument.normalizedName
        }));
      });

      await command.execute(validInput);

      expect(mockInstrumentRepository.getNextInstrumentNumber).toHaveBeenCalledWith(1, 'PHE');
      expect(savedInstrument.normalizedName).toBe('SVB_FOR_TWR01_PHE03');
    });

    it('should use provided normalized name', async () => {
      mockPlatformRepository.findById.mockResolvedValue(
        createMockPlatform(1, 'SVB_FOR_TWR01')
      );
      mockInstrumentRepository.findByNormalizedName.mockResolvedValue(null);

      let savedInstrument;
      mockInstrumentRepository.save.mockImplementation(instrument => {
        savedInstrument = instrument;
        return Promise.resolve(createMockInstrument(1, {
          normalizedName: instrument.normalizedName
        }));
      });

      await command.execute({
        ...validInput,
        normalizedName: 'CUSTOM_NAME_PHE01'
      });

      expect(mockInstrumentRepository.getNextInstrumentNumber).not.toHaveBeenCalled();
      expect(savedInstrument.normalizedName).toBe('CUSTOM_NAME_PHE01');
    });

    it('should default status to Active', async () => {
      mockPlatformRepository.findById.mockResolvedValue(
        createMockPlatform(1, 'SVB_FOR_TWR01')
      );
      mockInstrumentRepository.getNextInstrumentNumber.mockResolvedValue(1);
      mockInstrumentRepository.findByNormalizedName.mockResolvedValue(null);

      let savedInstrument;
      mockInstrumentRepository.save.mockImplementation(instrument => {
        savedInstrument = instrument;
        return Promise.resolve(createMockInstrument(1, {
          status: instrument.status
        }));
      });

      const inputWithoutStatus = { ...validInput };
      delete inputWithoutStatus.status;

      await command.execute(inputWithoutStatus);

      expect(savedInstrument.status).toBe('Active');
    });

    it('should pass specifications to factory', async () => {
      mockPlatformRepository.findById.mockResolvedValue(
        createMockPlatform(1, 'SVB_FOR_TWR01')
      );
      mockInstrumentRepository.getNextInstrumentNumber.mockResolvedValue(1);
      mockInstrumentRepository.findByNormalizedName.mockResolvedValue(null);

      let savedInstrument;
      mockInstrumentRepository.save.mockImplementation(instrument => {
        savedInstrument = instrument;
        return Promise.resolve(createMockInstrument(1, {
          specifications: instrument.specifications
        }));
      });

      await command.execute(validInput);

      expect(savedInstrument.specifications).toEqual({
        cameraBrand: 'Canon',
        cameraModel: 'EOS 5D'
      });
    });
  });

  describe('platform compatibility', () => {
    it('should allow Phenocam on fixed platform', async () => {
      mockPlatformRepository.findById.mockResolvedValue(
        createMockPlatform(1, 'SVB_FOR_TWR01', 'fixed')
      );
      mockInstrumentRepository.getNextInstrumentNumber.mockResolvedValue(1);
      mockInstrumentRepository.findByNormalizedName.mockResolvedValue(null);
      mockInstrumentRepository.save.mockImplementation(instrument =>
        Promise.resolve(createMockInstrument(1, {}))
      );

      await expect(command.execute({
        ...validInput,
        instrumentType: 'Phenocam'
      })).resolves.toBeDefined();
    });

    it('should allow Multispectral on UAV platform', async () => {
      mockPlatformRepository.findById.mockResolvedValue(
        createMockPlatform(1, 'SVB_DJI_M3M_UAV01', 'uav')
      );
      mockInstrumentRepository.getNextInstrumentNumber.mockResolvedValue(1);
      mockInstrumentRepository.findByNormalizedName.mockResolvedValue(null);
      mockInstrumentRepository.save.mockImplementation(instrument =>
        Promise.resolve(createMockInstrument(1, {}))
      );

      await expect(command.execute({
        ...validInput,
        instrumentType: 'Multispectral'
      })).resolves.toBeDefined();
    });
  });
});
