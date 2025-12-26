/**
 * @vitest-environment node
 *
 * GetStationDashboard Query Unit Tests
 *
 * Tests the N+1 query fix - should use single query for all instruments
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetStationDashboard } from '../../src/application/queries/GetStationDashboard.js';

describe('GetStationDashboard', () => {
  let query;
  let mockStationRepository;
  let mockPlatformRepository;
  let mockInstrumentRepository;

  const createMockStation = (id, acronym) => ({
    id,
    acronym,
    toJSON: () => ({ id, acronym, display_name: acronym })
  });

  const createMockPlatform = (id, stationId, name) => ({
    id,
    stationId,
    normalized_name: name,
    platform_type: 'fixed',
    ecosystem_code: 'FOR',
    toJSON: () => ({
      id,
      station_id: stationId,
      normalized_name: name,
      platform_type: 'fixed',
      ecosystem_code: 'FOR'
    })
  });

  const createMockInstrument = (id, platformId, name, status = 'Active') => ({
    id,
    platformId,
    normalized_name: name,
    instrument_type: 'Phenocam',
    status,
    toJSON: () => ({
      id,
      platform_id: platformId,
      normalized_name: name,
      instrument_type: 'Phenocam',
      status
    })
  });

  beforeEach(() => {
    mockStationRepository = {
      findByAcronym: vi.fn(),
      findById: vi.fn()
    };

    mockPlatformRepository = {
      findByStationId: vi.fn()
    };

    mockInstrumentRepository = {
      findByStationId: vi.fn(),
      findByPlatformId: vi.fn() // Should NOT be called after N+1 fix
    };

    query = new GetStationDashboard({
      stationRepository: mockStationRepository,
      platformRepository: mockPlatformRepository,
      instrumentRepository: mockInstrumentRepository
    });
  });

  describe('execute', () => {
    it('should return null when station not found', async () => {
      mockStationRepository.findByAcronym.mockResolvedValue(null);

      const result = await query.execute('XXX');

      expect(result).toBeNull();
      expect(mockStationRepository.findByAcronym).toHaveBeenCalledWith('XXX');
    });

    it('should return station dashboard with platforms and instruments', async () => {
      const station = createMockStation(1, 'SVB');
      const platforms = [
        createMockPlatform(10, 1, 'SVB_FOR_TWR01'),
        createMockPlatform(11, 1, 'SVB_FOR_TWR02')
      ];
      const instruments = [
        createMockInstrument(100, 10, 'SVB_FOR_TWR01_PHE01'),
        createMockInstrument(101, 10, 'SVB_FOR_TWR01_PHE02'),
        createMockInstrument(102, 11, 'SVB_FOR_TWR02_PHE01')
      ];

      mockStationRepository.findByAcronym.mockResolvedValue(station);
      mockPlatformRepository.findByStationId.mockResolvedValue(platforms);
      mockInstrumentRepository.findByStationId.mockResolvedValue(instruments);

      const result = await query.execute('SVB');

      expect(result).not.toBeNull();
      expect(result.station.acronym).toBe('SVB');
      expect(result.platforms).toHaveLength(2);
      expect(result.platforms[0].instruments).toHaveLength(2);
      expect(result.platforms[1].instruments).toHaveLength(1);
    });

    it('should NOT call findByPlatformId (N+1 fix verification)', async () => {
      const station = createMockStation(1, 'SVB');
      const platforms = [
        createMockPlatform(10, 1, 'SVB_FOR_TWR01'),
        createMockPlatform(11, 1, 'SVB_FOR_TWR02'),
        createMockPlatform(12, 1, 'SVB_FOR_TWR03')
      ];
      const instruments = [
        createMockInstrument(100, 10, 'SVB_FOR_TWR01_PHE01'),
        createMockInstrument(101, 11, 'SVB_FOR_TWR02_PHE01'),
        createMockInstrument(102, 12, 'SVB_FOR_TWR03_PHE01')
      ];

      mockStationRepository.findByAcronym.mockResolvedValue(station);
      mockPlatformRepository.findByStationId.mockResolvedValue(platforms);
      mockInstrumentRepository.findByStationId.mockResolvedValue(instruments);

      await query.execute('SVB');

      // This is the key assertion - findByPlatformId should NEVER be called
      expect(mockInstrumentRepository.findByPlatformId).not.toHaveBeenCalled();
      // findByStationId should be called exactly once
      expect(mockInstrumentRepository.findByStationId).toHaveBeenCalledTimes(1);
      expect(mockInstrumentRepository.findByStationId).toHaveBeenCalledWith(1);
    });

    it('should handle platforms with no instruments', async () => {
      const station = createMockStation(1, 'SVB');
      const platforms = [
        createMockPlatform(10, 1, 'SVB_FOR_TWR01'),
        createMockPlatform(11, 1, 'SVB_FOR_TWR02')
      ];
      const instruments = [
        createMockInstrument(100, 10, 'SVB_FOR_TWR01_PHE01')
      ];

      mockStationRepository.findByAcronym.mockResolvedValue(station);
      mockPlatformRepository.findByStationId.mockResolvedValue(platforms);
      mockInstrumentRepository.findByStationId.mockResolvedValue(instruments);

      const result = await query.execute('SVB');

      expect(result.platforms[0].instruments).toHaveLength(1);
      expect(result.platforms[1].instruments).toHaveLength(0);
    });

    it('should handle station with no platforms', async () => {
      const station = createMockStation(1, 'NEW');

      mockStationRepository.findByAcronym.mockResolvedValue(station);
      mockPlatformRepository.findByStationId.mockResolvedValue([]);
      mockInstrumentRepository.findByStationId.mockResolvedValue([]);

      const result = await query.execute('NEW');

      expect(result.platforms).toHaveLength(0);
      expect(result.stats.platformCount).toBe(0);
      expect(result.stats.instrumentCount).toBe(0);
    });

    it('should calculate correct statistics', async () => {
      const station = createMockStation(1, 'SVB');
      const platforms = [
        createMockPlatform(10, 1, 'SVB_FOR_TWR01'),
        createMockPlatform(11, 1, 'SVB_MIR_TWR01')
      ];
      // Update platform ecosystem codes
      platforms[1].ecosystem_code = 'MIR';
      platforms[1].toJSON = () => ({
        id: 11,
        station_id: 1,
        normalized_name: 'SVB_MIR_TWR01',
        platform_type: 'fixed',
        ecosystem_code: 'MIR'
      });

      const instruments = [
        createMockInstrument(100, 10, 'SVB_FOR_TWR01_PHE01', 'Active'),
        createMockInstrument(101, 10, 'SVB_FOR_TWR01_PHE02', 'Inactive'),
        createMockInstrument(102, 11, 'SVB_MIR_TWR01_PAR01', 'Active')
      ];
      // Set different instrument type for one
      instruments[2].instrument_type = 'PAR Sensor';
      instruments[2].toJSON = () => ({
        id: 102,
        platform_id: 11,
        normalized_name: 'SVB_MIR_TWR01_PAR01',
        instrument_type: 'PAR Sensor',
        status: 'Active'
      });

      mockStationRepository.findByAcronym.mockResolvedValue(station);
      mockPlatformRepository.findByStationId.mockResolvedValue(platforms);
      mockInstrumentRepository.findByStationId.mockResolvedValue(instruments);

      const result = await query.execute('SVB');

      expect(result.stats.platformCount).toBe(2);
      expect(result.stats.instrumentCount).toBe(3);
      expect(result.stats.activeInstruments).toBe(2);
      expect(result.stats.inactiveInstruments).toBe(1);
      expect(result.stats.ecosystems).toContain('FOR');
      expect(result.stats.ecosystems).toContain('MIR');
      expect(result.stats.instrumentTypes['Phenocam']).toBe(2);
      expect(result.stats.instrumentTypes['PAR Sensor']).toBe(1);
    });
  });

  describe('byId', () => {
    it('should return null when station not found by ID', async () => {
      mockStationRepository.findById.mockResolvedValue(null);

      const result = await query.byId(999);

      expect(result).toBeNull();
    });

    it('should call execute with station acronym', async () => {
      const station = createMockStation(1, 'SVB');

      mockStationRepository.findById.mockResolvedValue(station);
      mockStationRepository.findByAcronym.mockResolvedValue(station);
      mockPlatformRepository.findByStationId.mockResolvedValue([]);
      mockInstrumentRepository.findByStationId.mockResolvedValue([]);

      const result = await query.byId(1);

      expect(mockStationRepository.findById).toHaveBeenCalledWith(1);
      expect(mockStationRepository.findByAcronym).toHaveBeenCalledWith('SVB');
      expect(result).not.toBeNull();
    });
  });

  describe('N+1 query performance', () => {
    it('should make exactly 3 database queries regardless of platform count', async () => {
      const station = createMockStation(1, 'SVB');
      const platforms = [];
      const instruments = [];

      // Create 10 platforms with 5 instruments each
      for (let i = 0; i < 10; i++) {
        platforms.push(createMockPlatform(i + 10, 1, `SVB_FOR_TWR${String(i + 1).padStart(2, '0')}`));
        for (let j = 0; j < 5; j++) {
          instruments.push(createMockInstrument(
            i * 10 + j + 100,
            i + 10,
            `SVB_FOR_TWR${String(i + 1).padStart(2, '0')}_PHE${String(j + 1).padStart(2, '0')}`
          ));
        }
      }

      mockStationRepository.findByAcronym.mockResolvedValue(station);
      mockPlatformRepository.findByStationId.mockResolvedValue(platforms);
      mockInstrumentRepository.findByStationId.mockResolvedValue(instruments);

      await query.execute('SVB');

      // Before fix: 1 + 1 + 10 = 12 queries
      // After fix: 1 + 1 + 1 = 3 queries
      expect(mockStationRepository.findByAcronym).toHaveBeenCalledTimes(1);
      expect(mockPlatformRepository.findByStationId).toHaveBeenCalledTimes(1);
      expect(mockInstrumentRepository.findByStationId).toHaveBeenCalledTimes(1);
      expect(mockInstrumentRepository.findByPlatformId).not.toHaveBeenCalled();
    });

    it('should correctly group 50 instruments across 10 platforms', async () => {
      const station = createMockStation(1, 'SVB');
      const platforms = [];
      const instruments = [];

      // Create 10 platforms with 5 instruments each
      for (let i = 0; i < 10; i++) {
        platforms.push(createMockPlatform(i + 10, 1, `SVB_FOR_TWR${String(i + 1).padStart(2, '0')}`));
        for (let j = 0; j < 5; j++) {
          instruments.push(createMockInstrument(
            i * 10 + j + 100,
            i + 10,
            `SVB_FOR_TWR${String(i + 1).padStart(2, '0')}_PHE${String(j + 1).padStart(2, '0')}`
          ));
        }
      }

      mockStationRepository.findByAcronym.mockResolvedValue(station);
      mockPlatformRepository.findByStationId.mockResolvedValue(platforms);
      mockInstrumentRepository.findByStationId.mockResolvedValue(instruments);

      const result = await query.execute('SVB');

      expect(result.platforms).toHaveLength(10);
      expect(result.stats.instrumentCount).toBe(50);

      // Verify each platform has exactly 5 instruments
      for (const platform of result.platforms) {
        expect(platform.instruments).toHaveLength(5);
      }
    });
  });
});
