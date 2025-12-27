/**
 * @vitest-environment node
 *
 * D1InstrumentRepository Unit Tests
 *
 * Tests database adapter methods for instrument persistence.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { D1InstrumentRepository } from '../../../../src/infrastructure/persistence/d1/D1InstrumentRepository.js';

// Mock the domain import
vi.mock('../../../../src/domain/index.js', () => ({
  Instrument: {
    fromDatabase: vi.fn((data) => ({
      id: data.id,
      platformId: data.platform_id,
      normalizedName: data.normalized_name,
      displayName: data.display_name,
      instrumentType: data.instrument_type,
      status: data.status,
      measurementStatus: data.measurement_status,
      specifications: typeof data.specifications === 'string'
        ? JSON.parse(data.specifications)
        : data.specifications,
      toJSON: () => ({
        id: data.id,
        platform_id: data.platform_id,
        normalized_name: data.normalized_name,
        display_name: data.display_name,
        description: data.description,
        instrument_type: data.instrument_type,
        status: data.status,
        measurement_status: data.measurement_status,
        specifications: typeof data.specifications === 'string'
          ? JSON.parse(data.specifications)
          : data.specifications
      })
    }))
  }
}));

describe('D1InstrumentRepository', () => {
  let repository;
  let mockDb;

  const createMockChain = (result) => {
    const chain = {
      bind: vi.fn((...args) => chain),
      first: vi.fn().mockResolvedValue(result),
      all: vi.fn().mockResolvedValue({ results: Array.isArray(result) ? result : (result ? [result] : []) }),
      run: vi.fn().mockResolvedValue({ meta: { changes: 1, last_row_id: 1 } })
    };
    return chain;
  };

  beforeEach(() => {
    mockDb = {
      prepare: vi.fn()
    };
    repository = new D1InstrumentRepository(mockDb);
  });

  describe('findById', () => {
    it('should return instrument when found', async () => {
      const mockInstrument = {
        id: 1,
        platform_id: 1,
        normalized_name: 'SVB_FOR_TWR01_PHE01',
        instrument_type: 'Phenocam',
        specifications: '{}'
      };
      const chain = createMockChain(mockInstrument);
      mockDb.prepare.mockReturnValue(chain);

      const result = await repository.findById(1);

      expect(mockDb.prepare).toHaveBeenCalledWith('SELECT * FROM instruments WHERE id = ?');
      expect(result.normalizedName).toBe('SVB_FOR_TWR01_PHE01');
    });

    it('should return null when instrument not found', async () => {
      const chain = createMockChain(null);
      mockDb.prepare.mockReturnValue(chain);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByIdWithDetails', () => {
    it('should return instrument with platform and station details', async () => {
      const mockResult = {
        id: 1,
        normalized_name: 'SVB_FOR_TWR01_PHE01',
        platform_name: 'SVB_FOR_TWR01',
        platform_display_name: 'Forest Tower 1',
        platform_type: 'fixed',
        ecosystem_code: 'FOR',
        station_acronym: 'SVB',
        station_display_name: 'Svartberget',
        specifications: '{}'
      };
      const chain = createMockChain(mockResult);
      mockDb.prepare.mockReturnValue(chain);

      const result = await repository.findByIdWithDetails(1);

      expect(result.platform.normalized_name).toBe('SVB_FOR_TWR01');
      expect(result.station.acronym).toBe('SVB');
    });

    it('should return null when not found', async () => {
      const chain = createMockChain(null);
      mockDb.prepare.mockReturnValue(chain);

      const result = await repository.findByIdWithDetails(999);

      expect(result).toBeNull();
    });

    it('should include JOIN with platforms and stations', async () => {
      const chain = createMockChain(null);
      mockDb.prepare.mockReturnValue(chain);

      await repository.findByIdWithDetails(1);

      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('JOIN platforms p ON'));
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('JOIN stations s ON'));
    });
  });

  describe('findByNormalizedName', () => {
    it('should return instrument when found', async () => {
      const mockInstrument = {
        id: 1,
        normalized_name: 'ANS_FOR_TWR01_PHE01',
        specifications: '{}'
      };
      const chain = createMockChain(mockInstrument);
      mockDb.prepare.mockReturnValue(chain);

      const result = await repository.findByNormalizedName('ANS_FOR_TWR01_PHE01');

      expect(chain.bind).toHaveBeenCalledWith('ANS_FOR_TWR01_PHE01');
      expect(result.normalizedName).toBe('ANS_FOR_TWR01_PHE01');
    });

    it('should uppercase the normalized name for lookup', async () => {
      const chain = createMockChain(null);
      mockDb.prepare.mockReturnValue(chain);

      await repository.findByNormalizedName('svb_for_twr01_phe01');

      expect(chain.bind).toHaveBeenCalledWith('SVB_FOR_TWR01_PHE01');
    });
  });

  describe('findByPlatformId', () => {
    it('should return instruments for platform', async () => {
      const mockInstruments = [
        { id: 1, normalized_name: 'SVB_FOR_TWR01_PHE01', specifications: '{}' },
        { id: 2, normalized_name: 'SVB_FOR_TWR01_MS01', specifications: '{}' }
      ];
      const chain = createMockChain(mockInstruments);
      mockDb.prepare.mockReturnValue(chain);

      const result = await repository.findByPlatformId(1);

      expect(chain.bind).toHaveBeenCalledWith(1);
      expect(result).toHaveLength(2);
    });

    it('should order by normalized_name', async () => {
      const chain = createMockChain([]);
      mockDb.prepare.mockReturnValue(chain);

      await repository.findByPlatformId(1);

      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('ORDER BY normalized_name'));
    });
  });

  describe('findByStationId', () => {
    it('should return instruments for station via platform join', async () => {
      const mockInstruments = [
        { id: 1, normalized_name: 'SVB_FOR_TWR01_PHE01', specifications: '{}' }
      ];
      const chain = createMockChain(mockInstruments);
      mockDb.prepare.mockReturnValue(chain);

      const result = await repository.findByStationId(1);

      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('JOIN platforms p ON'));
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('p.station_id = ?'));
      expect(result).toHaveLength(1);
    });
  });

  describe('findAll', () => {
    it('should return all instruments with default options', async () => {
      const mockInstruments = [
        { id: 1, normalized_name: 'SVB_FOR_TWR01_PHE01', specifications: '{}' }
      ];
      const chain = createMockChain(mockInstruments);
      mockDb.prepare.mockReturnValue(chain);

      const result = await repository.findAll();

      expect(result).toHaveLength(1);
    });

    it('should filter by platform ID', async () => {
      const chain = createMockChain([]);
      mockDb.prepare.mockReturnValue(chain);

      await repository.findAll({ platformId: 5 });

      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('i.platform_id = ?'));
    });

    it('should filter by station ID with join', async () => {
      const chain = createMockChain([]);
      mockDb.prepare.mockReturnValue(chain);

      await repository.findAll({ stationId: 1 });

      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('JOIN platforms p ON'));
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('p.station_id = ?'));
    });

    it('should filter by instrument type', async () => {
      const chain = createMockChain([]);
      mockDb.prepare.mockReturnValue(chain);

      await repository.findAll({ instrumentType: 'Phenocam' });

      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('i.instrument_type = ?'));
    });

    it('should filter by status', async () => {
      const chain = createMockChain([]);
      mockDb.prepare.mockReturnValue(chain);

      await repository.findAll({ status: 'Active' });

      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('i.status = ?'));
    });

    it('should apply pagination', async () => {
      const chain = createMockChain([]);
      mockDb.prepare.mockReturnValue(chain);

      await repository.findAll({ limit: 10, offset: 20 });

      const lastCall = chain.bind.mock.calls[0];
      expect(lastCall[lastCall.length - 2]).toBe(10);
      expect(lastCall[lastCall.length - 1]).toBe(20);
    });

    it('should apply safe sort column whitelist', async () => {
      const chain = createMockChain([]);
      mockDb.prepare.mockReturnValue(chain);

      await repository.findAll({ sortBy: 'instrument_type', sortOrder: 'desc' });

      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('ORDER BY i.instrument_type DESC'));
    });

    it('should fallback to normalized_name for invalid sort column', async () => {
      const chain = createMockChain([]);
      mockDb.prepare.mockReturnValue(chain);

      await repository.findAll({ sortBy: 'invalid_column' });

      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('ORDER BY i.normalized_name'));
    });
  });

  describe('count', () => {
    it('should return total instrument count', async () => {
      const chain = createMockChain({ count: 25 });
      mockDb.prepare.mockReturnValue(chain);

      const result = await repository.count();

      expect(result).toBe(25);
    });

    it('should filter count by platform ID', async () => {
      const chain = createMockChain({ count: 3 });
      mockDb.prepare.mockReturnValue(chain);

      await repository.count({ platformId: 1 });

      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('i.platform_id = ?'));
    });

    it('should filter count by station ID with join', async () => {
      const chain = createMockChain({ count: 10 });
      mockDb.prepare.mockReturnValue(chain);

      await repository.count({ stationId: 1 });

      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('JOIN platforms p ON'));
    });

    it('should filter count by instrument type', async () => {
      const chain = createMockChain({ count: 5 });
      mockDb.prepare.mockReturnValue(chain);

      await repository.count({ instrumentType: 'Phenocam' });

      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('i.instrument_type = ?'));
    });

    it('should return 0 when no count result', async () => {
      const chain = createMockChain(null);
      mockDb.prepare.mockReturnValue(chain);

      const result = await repository.count();

      expect(result).toBe(0);
    });
  });

  describe('getNextInstrumentNumber', () => {
    it('should return 1 when no existing instruments', async () => {
      const chain = createMockChain([]);
      mockDb.prepare.mockReturnValue(chain);

      const result = await repository.getNextInstrumentNumber(1, 'PHE');

      expect(result).toBe(1);
    });

    it('should return next sequential number', async () => {
      const existingInstruments = [
        { normalized_name: 'SVB_FOR_TWR01_PHE01' },
        { normalized_name: 'SVB_FOR_TWR01_PHE02' }
      ];
      const chain = createMockChain(existingInstruments);
      mockDb.prepare.mockReturnValue(chain);

      const result = await repository.getNextInstrumentNumber(1, 'PHE');

      expect(result).toBe(3);
    });

    it('should handle gaps in sequence', async () => {
      const existingInstruments = [
        { normalized_name: 'SVB_FOR_TWR01_MS01' },
        { normalized_name: 'SVB_FOR_TWR01_MS05' }
      ];
      const chain = createMockChain(existingInstruments);
      mockDb.prepare.mockReturnValue(chain);

      const result = await repository.getNextInstrumentNumber(1, 'MS');

      expect(result).toBe(6);
    });

    it('should use LIKE pattern for type code', async () => {
      const chain = createMockChain([]);
      mockDb.prepare.mockReturnValue(chain);

      await repository.getNextInstrumentNumber(1, 'PHE');

      expect(chain.bind).toHaveBeenCalledWith(1, '%_PHE%');
    });
  });

  describe('hasROIs', () => {
    it('should return true when instrument has ROIs', async () => {
      const chain = createMockChain({ count: 3 });
      mockDb.prepare.mockReturnValue(chain);

      const result = await repository.hasROIs(1);

      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('instrument_rois'));
      expect(result).toBe(true);
    });

    it('should return false when instrument has no ROIs', async () => {
      const chain = createMockChain({ count: 0 });
      mockDb.prepare.mockReturnValue(chain);

      const result = await repository.hasROIs(1);

      expect(result).toBe(false);
    });

    it('should return false when count is null', async () => {
      const chain = createMockChain(null);
      mockDb.prepare.mockReturnValue(chain);

      const result = await repository.hasROIs(1);

      expect(result).toBe(false);
    });
  });

  describe('save', () => {
    it('should insert new instrument', async () => {
      const savedData = { id: 1, normalized_name: 'SVB_FOR_TWR01_PHE01', specifications: '{}' };
      const insertChain = createMockChain(null);
      insertChain.run.mockResolvedValue({ meta: { last_row_id: 1 } });
      const selectChain = createMockChain(savedData);

      mockDb.prepare.mockReturnValueOnce(insertChain).mockReturnValueOnce(selectChain);

      const newInstrument = {
        id: null,
        toJSON: () => ({
          platform_id: 1,
          normalized_name: 'SVB_FOR_TWR01_PHE01',
          display_name: 'Phenocam 1',
          description: null,
          instrument_type: 'Phenocam',
          status: 'Active',
          measurement_status: 'active',
          specifications: { camera_brand: 'Stardot' }
        })
      };

      const result = await repository.save(newInstrument);

      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO instruments'));
      expect(result.normalizedName).toBe('SVB_FOR_TWR01_PHE01');
    });

    it('should update existing instrument', async () => {
      const savedData = { id: 1, normalized_name: 'SVB_FOR_TWR01_PHE01', display_name: 'Updated', specifications: '{}' };
      const updateChain = createMockChain(null);
      const selectChain = createMockChain(savedData);

      mockDb.prepare.mockReturnValueOnce(updateChain).mockReturnValueOnce(selectChain);

      const existingInstrument = {
        id: 1,
        toJSON: () => ({
          display_name: 'Updated',
          description: 'New description',
          instrument_type: 'Phenocam',
          status: 'Active',
          measurement_status: 'active',
          specifications: {}
        })
      };

      await repository.save(existingInstrument);

      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('UPDATE instruments SET'));
    });

    it('should serialize specifications to JSON', async () => {
      const insertChain = createMockChain(null);
      insertChain.run.mockResolvedValue({ meta: { last_row_id: 1 } });
      const selectChain = createMockChain({ id: 1, specifications: '{}' });

      mockDb.prepare.mockReturnValueOnce(insertChain).mockReturnValueOnce(selectChain);

      const newInstrument = {
        id: null,
        toJSON: () => ({
          platform_id: 1,
          normalized_name: 'SVB_FOR_TWR01_PHE01',
          specifications: { camera_brand: 'Stardot', resolution: '5MP' }
        })
      };

      await repository.save(newInstrument);

      // Check that bind was called with a JSON string for specifications
      const bindCall = insertChain.bind.mock.calls[0];
      const specsArg = bindCall.find(arg => typeof arg === 'string' && arg.includes('camera_brand'));
      expect(specsArg).toBeDefined();
      expect(() => JSON.parse(specsArg)).not.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete instrument by ID', async () => {
      const chain = createMockChain(null);
      chain.run.mockResolvedValue({ meta: { changes: 1 } });
      mockDb.prepare.mockReturnValue(chain);

      const result = await repository.delete(1);

      expect(mockDb.prepare).toHaveBeenCalledWith('DELETE FROM instruments WHERE id = ?');
      expect(chain.bind).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });

    it('should return false when no rows deleted', async () => {
      const chain = createMockChain(null);
      chain.run.mockResolvedValue({ meta: { changes: 0 } });
      mockDb.prepare.mockReturnValue(chain);

      const result = await repository.delete(999);

      expect(result).toBe(false);
    });

    it('should cascade delete ROIs when cascade=true', async () => {
      const deleteRoisChain = createMockChain(null);
      const deleteInstrumentChain = createMockChain(null);
      deleteInstrumentChain.run.mockResolvedValue({ meta: { changes: 1 } });

      mockDb.prepare
        .mockReturnValueOnce(deleteRoisChain)
        .mockReturnValueOnce(deleteInstrumentChain);

      await repository.delete(1, true);

      expect(mockDb.prepare).toHaveBeenCalledWith('DELETE FROM instrument_rois WHERE instrument_id = ?');
      expect(mockDb.prepare).toHaveBeenCalledWith('DELETE FROM instruments WHERE id = ?');
    });

    it('should not cascade delete ROIs when cascade=false', async () => {
      const chain = createMockChain(null);
      chain.run.mockResolvedValue({ meta: { changes: 1 } });
      mockDb.prepare.mockReturnValue(chain);

      await repository.delete(1, false);

      expect(mockDb.prepare).not.toHaveBeenCalledWith(expect.stringContaining('instrument_rois'));
    });
  });
});
