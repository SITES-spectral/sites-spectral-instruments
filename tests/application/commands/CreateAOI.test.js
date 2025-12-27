/**
 * @vitest-environment node
 *
 * CreateAOI Command Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateAOI } from '../../../src/application/commands/CreateAOI.js';

describe('CreateAOI Command', () => {
  let command;
  let mockAOIRepository;

  const createMockAOI = (id, data) => ({
    id,
    ...data,
    toJSON: () => ({ id, ...data })
  });

  const validInput = {
    name: 'Test AOI',
    description: 'A test area of interest',
    geometry: {
      type: 'Polygon',
      coordinates: [[[19.5, 64.0], [19.6, 64.0], [19.6, 64.1], [19.5, 64.1], [19.5, 64.0]]]
    },
    geometryType: 'polygon',
    stationId: 1,
    ecosystemCode: 'FOR'
  };

  beforeEach(() => {
    mockAOIRepository = {
      save: vi.fn()
    };

    command = new CreateAOI({
      aoiRepository: mockAOIRepository
    });
  });

  describe('execute', () => {
    it('should create AOI with valid input', async () => {
      mockAOIRepository.save.mockImplementation(aoi =>
        Promise.resolve(createMockAOI(1, {
          name: aoi.name,
          geometryType: aoi.geometryType,
          stationId: aoi.stationId
        }))
      );

      const result = await command.execute(validInput);

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.name).toBe('Test AOI');
    });

    it('should set default mission type', async () => {
      let savedAOI;
      mockAOIRepository.save.mockImplementation(aoi => {
        savedAOI = aoi;
        return Promise.resolve(createMockAOI(1, {}));
      });

      await command.execute(validInput);

      expect(savedAOI.missionType).toBe('monitoring');
    });

    it('should set default recurrence', async () => {
      let savedAOI;
      mockAOIRepository.save.mockImplementation(aoi => {
        savedAOI = aoi;
        return Promise.resolve(createMockAOI(1, {}));
      });

      await command.execute(validInput);

      expect(savedAOI.missionRecurrence).toBe('one_time');
    });

    it('should set default source format', async () => {
      let savedAOI;
      mockAOIRepository.save.mockImplementation(aoi => {
        savedAOI = aoi;
        return Promise.resolve(createMockAOI(1, {}));
      });

      await command.execute(validInput);

      expect(savedAOI.sourceFormat).toBe('manual');
    });

    it('should use provided mission type', async () => {
      let savedAOI;
      mockAOIRepository.save.mockImplementation(aoi => {
        savedAOI = aoi;
        return Promise.resolve(createMockAOI(1, {}));
      });

      await command.execute({
        ...validInput,
        missionType: 'survey'
      });

      expect(savedAOI.missionType).toBe('survey');
    });

    it('should include platform association', async () => {
      let savedAOI;
      mockAOIRepository.save.mockImplementation(aoi => {
        savedAOI = aoi;
        return Promise.resolve(createMockAOI(1, {}));
      });

      await command.execute({
        ...validInput,
        platformId: 5
      });

      expect(savedAOI.platformId).toBe(5);
    });

    it('should include metadata', async () => {
      let savedAOI;
      mockAOIRepository.save.mockImplementation(aoi => {
        savedAOI = aoi;
        return Promise.resolve(createMockAOI(1, {}));
      });

      await command.execute({
        ...validInput,
        metadata: { source: 'field survey', surveyor: 'J. Smith' }
      });

      expect(savedAOI.metadata).toEqual({ source: 'field survey', surveyor: 'J. Smith' });
    });
  });
});
