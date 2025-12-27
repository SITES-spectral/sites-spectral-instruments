/**
 * @vitest-environment node
 *
 * D1PlatformRepository Unit Tests
 *
 * Tests database adapter methods for platform persistence.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { D1PlatformRepository } from '../../../../src/infrastructure/persistence/d1/D1PlatformRepository.js';

// Mock the domain import
vi.mock('../../../../src/domain/index.js', () => ({
  Platform: {
    fromDatabase: vi.fn((data) => ({
      id: data.id,
      stationId: data.station_id,
      normalizedName: data.normalized_name,
      displayName: data.display_name,
      platformType: data.platform_type,
      ecosystemCode: data.ecosystem_code,
      mountTypeCode: data.mount_type_code,
      instrumentCount: data.instrument_count || 0,
      toJSON: () => ({
        id: data.id,
        station_id: data.station_id,
        normalized_name: data.normalized_name,
        display_name: data.display_name,
        platform_type: data.platform_type,
        ecosystem_code: data.ecosystem_code,
        mount_type_code: data.mount_type_code,
        latitude: data.latitude,
        longitude: data.longitude,
        status: data.status
      })
    }))
  }
}));

describe('D1PlatformRepository', () => {
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
    repository = new D1PlatformRepository(mockDb);
  });

  describe('findById', () => {
    it('should return platform with instrument count', async () => {
      const mockPlatform = {
        id: 1,
        station_id: 1,
        normalized_name: 'SVB_FOR_TWR01',
        platform_type: 'fixed',
        instrument_count: 3
      };
      const chain = createMockChain(mockPlatform);
      mockDb.prepare.mockReturnValue(chain);

      const result = await repository.findById(1);

      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('instrument_count'));
      expect(result.normalizedName).toBe('SVB_FOR_TWR01');
      expect(result.instrumentCount).toBe(3);
    });

    it('should return null when platform not found', async () => {
      const chain = createMockChain(null);
      mockDb.prepare.mockReturnValue(chain);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByNormalizedName', () => {
    it('should return platform when found', async () => {
      const mockPlatform = { id: 1, normalized_name: 'ANS_FOR_TWR01' };
      const chain = createMockChain(mockPlatform);
      mockDb.prepare.mockReturnValue(chain);

      const result = await repository.findByNormalizedName('ANS_FOR_TWR01');

      expect(chain.bind).toHaveBeenCalledWith('ANS_FOR_TWR01');
      expect(result.normalizedName).toBe('ANS_FOR_TWR01');
    });

    it('should uppercase the normalized name for lookup', async () => {
      const chain = createMockChain(null);
      mockDb.prepare.mockReturnValue(chain);

      await repository.findByNormalizedName('svb_for_twr01');

      expect(chain.bind).toHaveBeenCalledWith('SVB_FOR_TWR01');
    });

    it('should return null for invalid input', async () => {
      const result = await repository.findByNormalizedName(null);
      expect(result).toBeNull();

      const result2 = await repository.findByNormalizedName(123);
      expect(result2).toBeNull();
    });
  });

  describe('findByStationId', () => {
    it('should return platforms for station', async () => {
      const mockPlatforms = [
        { id: 1, normalized_name: 'SVB_FOR_TWR01', station_id: 1 },
        { id: 2, normalized_name: 'SVB_AGR_TWR01', station_id: 1 }
      ];
      const chain = createMockChain(mockPlatforms);
      mockDb.prepare.mockReturnValue(chain);

      const result = await repository.findByStationId(1);

      expect(chain.bind).toHaveBeenCalledWith(1);
      expect(result).toHaveLength(2);
    });

    it('should order by normalized_name', async () => {
      const chain = createMockChain([]);
      mockDb.prepare.mockReturnValue(chain);

      await repository.findByStationId(1);

      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('ORDER BY p.normalized_name'));
    });
  });

  describe('findAll', () => {
    it('should return all platforms with default options', async () => {
      const mockPlatforms = [
        { id: 1, normalized_name: 'SVB_FOR_TWR01' }
      ];
      const chain = createMockChain(mockPlatforms);
      mockDb.prepare.mockReturnValue(chain);

      const result = await repository.findAll();

      expect(result).toHaveLength(1);
    });

    it('should filter by station ID', async () => {
      const chain = createMockChain([]);
      mockDb.prepare.mockReturnValue(chain);

      await repository.findAll({ stationId: 5 });

      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('p.station_id = ?'));
    });

    it('should filter by platform type', async () => {
      const chain = createMockChain([]);
      mockDb.prepare.mockReturnValue(chain);

      await repository.findAll({ platformType: 'uav' });

      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('p.platform_type = ?'));
    });

    it('should filter by ecosystem code', async () => {
      const chain = createMockChain([]);
      mockDb.prepare.mockReturnValue(chain);

      await repository.findAll({ ecosystemCode: 'FOR' });

      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('p.ecosystem_code = ?'));
    });

    it('should apply pagination', async () => {
      const chain = createMockChain([]);
      mockDb.prepare.mockReturnValue(chain);

      await repository.findAll({ limit: 25, offset: 50 });

      // bind called with limit and offset as last two params
      expect(chain.bind).toHaveBeenCalled();
      const lastCall = chain.bind.mock.calls[0];
      expect(lastCall[lastCall.length - 2]).toBe(25);
      expect(lastCall[lastCall.length - 1]).toBe(50);
    });

    it('should apply safe sort column whitelist', async () => {
      const chain = createMockChain([]);
      mockDb.prepare.mockReturnValue(chain);

      await repository.findAll({ sortBy: 'display_name', sortOrder: 'desc' });

      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('ORDER BY display_name DESC'));
    });

    it('should fallback to normalized_name for invalid sort column', async () => {
      const chain = createMockChain([]);
      mockDb.prepare.mockReturnValue(chain);

      await repository.findAll({ sortBy: 'invalid_column' });

      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('ORDER BY normalized_name'));
    });
  });

  describe('count', () => {
    it('should return total platform count', async () => {
      const chain = createMockChain({ count: 10 });
      mockDb.prepare.mockReturnValue(chain);

      const result = await repository.count();

      expect(result).toBe(10);
    });

    it('should filter count by station ID', async () => {
      const chain = createMockChain({ count: 3 });
      mockDb.prepare.mockReturnValue(chain);

      await repository.count({ stationId: 1 });

      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('station_id = ?'));
    });

    it('should filter count by platform type', async () => {
      const chain = createMockChain({ count: 5 });
      mockDb.prepare.mockReturnValue(chain);

      await repository.count({ platformType: 'uav' });

      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('platform_type = ?'));
    });

    it('should return 0 when no count result', async () => {
      const chain = createMockChain(null);
      mockDb.prepare.mockReturnValue(chain);

      const result = await repository.count();

      expect(result).toBe(0);
    });
  });

  describe('getNextMountTypeCode', () => {
    it('should return TWR01 when no existing platforms', async () => {
      const chain = createMockChain([]);
      mockDb.prepare.mockReturnValue(chain);

      const result = await repository.getNextMountTypeCode(1, 'TWR');

      expect(result).toBe('TWR01');
    });

    it('should return next sequential code', async () => {
      const existingCodes = [
        { mount_type_code: 'TWR01' },
        { mount_type_code: 'TWR02' },
        { mount_type_code: 'TWR03' }
      ];
      const chain = createMockChain(existingCodes);
      mockDb.prepare.mockReturnValue(chain);

      const result = await repository.getNextMountTypeCode(1, 'TWR');

      expect(result).toBe('TWR04');
    });

    it('should handle gaps in sequence', async () => {
      const existingCodes = [
        { mount_type_code: 'UAV01' },
        { mount_type_code: 'UAV05' }
      ];
      const chain = createMockChain(existingCodes);
      mockDb.prepare.mockReturnValue(chain);

      const result = await repository.getNextMountTypeCode(1, 'UAV');

      expect(result).toBe('UAV06');
    });

    it('should filter by ecosystem code when provided', async () => {
      const chain = createMockChain([]);
      mockDb.prepare.mockReturnValue(chain);

      await repository.getNextMountTypeCode(1, 'TWR', 'FOR');

      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('AND ecosystem_code = ?'));
    });
  });

  describe('save', () => {
    it('should insert new platform', async () => {
      const savedData = { id: 1, normalized_name: 'SVB_FOR_TWR01' };
      const insertChain = createMockChain(null);
      insertChain.run.mockResolvedValue({ meta: { last_row_id: 1 } });
      const selectChain = createMockChain(savedData);

      mockDb.prepare.mockReturnValueOnce(insertChain).mockReturnValueOnce(selectChain);

      const newPlatform = {
        id: null,
        toJSON: () => ({
          station_id: 1,
          normalized_name: 'SVB_FOR_TWR01',
          display_name: 'Forest Tower 1',
          description: null,
          platform_type: 'fixed',
          ecosystem_code: 'FOR',
          mount_type_code: 'TWR01',
          latitude: 64.0,
          longitude: 19.0,
          status: 'Active'
        })
      };

      const result = await repository.save(newPlatform);

      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO platforms'));
      expect(result.normalizedName).toBe('SVB_FOR_TWR01');
    });

    it('should update existing platform', async () => {
      const savedData = { id: 1, normalized_name: 'SVB_FOR_TWR01', display_name: 'Updated' };
      const updateChain = createMockChain(null);
      const selectChain = createMockChain(savedData);

      mockDb.prepare.mockReturnValueOnce(updateChain).mockReturnValueOnce(selectChain);

      const existingPlatform = {
        id: 1,
        toJSON: () => ({
          display_name: 'Updated',
          description: null,
          platform_type: 'fixed',
          ecosystem_code: 'FOR',
          mount_type_code: 'TWR01',
          latitude: 64.0,
          longitude: 19.0,
          status: 'Active'
        })
      };

      await repository.save(existingPlatform);

      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('UPDATE platforms SET'));
    });

    it('should handle legacy location_code field', async () => {
      const insertChain = createMockChain(null);
      insertChain.run.mockResolvedValue({ meta: { last_row_id: 1 } });
      const selectChain = createMockChain({ id: 1, normalized_name: 'SVB_FOR_TWR01' });

      mockDb.prepare.mockReturnValueOnce(insertChain).mockReturnValueOnce(selectChain);

      const platformWithLegacyCode = {
        id: null,
        toJSON: () => ({
          station_id: 1,
          normalized_name: 'SVB_FOR_TWR01',
          location_code: 'TWR01' // legacy field
        })
      };

      await repository.save(platformWithLegacyCode);

      expect(mockDb.prepare).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete platform by ID', async () => {
      const chain = createMockChain(null);
      chain.run.mockResolvedValue({ meta: { changes: 1 } });
      mockDb.prepare.mockReturnValue(chain);

      const result = await repository.delete(1);

      expect(mockDb.prepare).toHaveBeenCalledWith('DELETE FROM platforms WHERE id = ?');
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
  });
});
