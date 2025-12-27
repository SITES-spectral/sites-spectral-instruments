/**
 * @vitest-environment node
 *
 * D1StationRepository Unit Tests
 *
 * Tests database adapter methods for station persistence.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { D1StationRepository } from '../../../../src/infrastructure/persistence/d1/D1StationRepository.js';

// Mock the domain import
vi.mock('../../../../src/domain/index.js', () => ({
  Station: {
    fromDatabase: vi.fn((data) => ({
      id: data.id,
      acronym: data.acronym,
      displayName: data.display_name,
      toJSON: () => ({
        id: data.id,
        acronym: data.acronym,
        display_name: data.display_name,
        description: data.description,
        latitude: data.latitude,
        longitude: data.longitude,
        website_url: data.website_url,
        contact_email: data.contact_email
      })
    }))
  }
}));

describe('D1StationRepository', () => {
  let repository;
  let mockDb;

  /**
   * Create a chainable D1 mock
   */
  const createMockChain = (result) => {
    const chain = {
      bind: vi.fn(() => chain),
      first: vi.fn().mockResolvedValue(result),
      all: vi.fn().mockResolvedValue({ results: Array.isArray(result) ? result : [result] }),
      run: vi.fn().mockResolvedValue({ meta: { changes: 1, last_row_id: 1 } })
    };
    return chain;
  };

  beforeEach(() => {
    mockDb = {
      prepare: vi.fn()
    };
    repository = new D1StationRepository(mockDb);
  });

  describe('findById', () => {
    it('should return station when found', async () => {
      const mockStation = { id: 1, acronym: 'SVB', display_name: 'Svartberget' };
      const chain = createMockChain(mockStation);
      mockDb.prepare.mockReturnValue(chain);

      const result = await repository.findById(1);

      expect(mockDb.prepare).toHaveBeenCalledWith('SELECT * FROM stations WHERE id = ?');
      expect(chain.bind).toHaveBeenCalledWith(1);
      expect(result.acronym).toBe('SVB');
    });

    it('should return null when station not found', async () => {
      const chain = createMockChain(null);
      mockDb.prepare.mockReturnValue(chain);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByAcronym', () => {
    it('should return station when found', async () => {
      const mockStation = { id: 1, acronym: 'ANS', display_name: 'Asa' };
      const chain = createMockChain(mockStation);
      mockDb.prepare.mockReturnValue(chain);

      const result = await repository.findByAcronym('ANS');

      expect(chain.bind).toHaveBeenCalledWith('ANS');
      expect(result.acronym).toBe('ANS');
    });

    it('should uppercase the acronym for lookup', async () => {
      const chain = createMockChain(null);
      mockDb.prepare.mockReturnValue(chain);

      await repository.findByAcronym('svb');

      expect(chain.bind).toHaveBeenCalledWith('SVB');
    });

    it('should return null for invalid acronym input', async () => {
      const result = await repository.findByAcronym(null);
      expect(result).toBeNull();

      const result2 = await repository.findByAcronym(123);
      expect(result2).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all stations with default options', async () => {
      const mockStations = [
        { id: 1, acronym: 'ANS', display_name: 'Asa' },
        { id: 2, acronym: 'SVB', display_name: 'Svartberget' }
      ];
      const chain = createMockChain(mockStations);
      mockDb.prepare.mockReturnValue(chain);

      const result = await repository.findAll();

      expect(chain.bind).toHaveBeenCalledWith(100, 0);
      expect(result).toHaveLength(2);
    });

    it('should apply pagination parameters', async () => {
      const chain = createMockChain([]);
      mockDb.prepare.mockReturnValue(chain);

      await repository.findAll({ limit: 10, offset: 20 });

      expect(chain.bind).toHaveBeenCalledWith(10, 20);
    });

    it('should apply safe sort column whitelist', async () => {
      const chain = createMockChain([]);
      mockDb.prepare.mockReturnValue(chain);

      await repository.findAll({ sortBy: 'display_name', sortOrder: 'desc' });

      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('ORDER BY display_name DESC'));
    });

    it('should fallback to acronym for invalid sort column', async () => {
      const chain = createMockChain([]);
      mockDb.prepare.mockReturnValue(chain);

      await repository.findAll({ sortBy: 'invalid_column' });

      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('ORDER BY acronym'));
    });

    it('should include platform and instrument counts', async () => {
      const chain = createMockChain([]);
      mockDb.prepare.mockReturnValue(chain);

      await repository.findAll();

      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('platform_count'));
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('instrument_count'));
    });
  });

  describe('count', () => {
    it('should return total station count', async () => {
      const chain = createMockChain({ count: 5 });
      mockDb.prepare.mockReturnValue(chain);

      const result = await repository.count();

      expect(mockDb.prepare).toHaveBeenCalledWith('SELECT COUNT(*) as count FROM stations');
      expect(result).toBe(5);
    });

    it('should return 0 when no count result', async () => {
      const chain = createMockChain(null);
      mockDb.prepare.mockReturnValue(chain);

      const result = await repository.count();

      expect(result).toBe(0);
    });
  });

  describe('save', () => {
    it('should insert new station', async () => {
      const chain = createMockChain({ id: 1, acronym: 'NEW', display_name: 'New Station' });
      mockDb.prepare.mockReturnValue(chain);

      const newStation = {
        id: null,
        toJSON: () => ({
          acronym: 'NEW',
          display_name: 'New Station',
          description: null,
          latitude: 64.0,
          longitude: 19.0,
          website_url: null,
          contact_email: null
        })
      };

      await repository.save(newStation);

      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO stations'));
    });

    it('should update existing station', async () => {
      const chain = createMockChain({ id: 1, acronym: 'SVB', display_name: 'Updated' });
      mockDb.prepare.mockReturnValue(chain);

      const existingStation = {
        id: 1,
        toJSON: () => ({
          display_name: 'Updated',
          description: 'New description',
          latitude: 64.0,
          longitude: 19.0,
          website_url: null,
          contact_email: null
        })
      };

      await repository.save(existingStation);

      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('UPDATE stations SET'));
    });

    it('should return saved station', async () => {
      const savedData = { id: 1, acronym: 'NEW', display_name: 'New Station' };
      const insertChain = createMockChain(null);
      insertChain.run.mockResolvedValue({ meta: { last_row_id: 1 } });
      const selectChain = createMockChain(savedData);

      mockDb.prepare.mockReturnValueOnce(insertChain).mockReturnValueOnce(selectChain);

      const newStation = {
        id: null,
        toJSON: () => ({
          acronym: 'NEW',
          display_name: 'New Station'
        })
      };

      const result = await repository.save(newStation);

      expect(result.acronym).toBe('NEW');
    });
  });

  describe('delete', () => {
    it('should delete station by ID', async () => {
      const chain = createMockChain(null);
      chain.run.mockResolvedValue({ meta: { changes: 1 } });
      mockDb.prepare.mockReturnValue(chain);

      const result = await repository.delete(1);

      expect(mockDb.prepare).toHaveBeenCalledWith('DELETE FROM stations WHERE id = ?');
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
