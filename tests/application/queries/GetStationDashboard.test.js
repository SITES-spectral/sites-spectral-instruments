/**
 * @vitest-environment node
 *
 * GetStationDashboard Query Unit Tests
 *
 * Tests the composite dashboard query that returns station with all platforms and instruments.
 * Verifies the N+1 fix (single query for instruments instead of per-platform).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetStationDashboard } from '../../../src/application/queries/GetStationDashboard.js';

describe('GetStationDashboard Query', () => {
  let query;
  let mockStationRepository;
  let mockPlatformRepository;
  let mockInstrumentRepository;

  const createMockStation = (id, acronym) => ({
    id,
    acronym,
    displayName: `${acronym} Station`,
    toJSON: () => ({ id, acronym, display_name: `${acronym} Station` })
  });

  const createMockPlatform = (id, stationId, normalizedName, platformType = 'fixed', ecosystemCode = 'FOR') => ({
    id,
    stationId,
    normalizedName,
    platformType,
    ecosystemCode,
    toJSON: () => ({
      id,
      station_id: stationId,
      normalized_name: normalizedName,
      platform_type: platformType,
      ecosystem_code: ecosystemCode
    })
  });

  const createMockInstrument = (id, platformId, normalizedName, type = 'Phenocam', status = 'Active') => ({
    id,
    platformId,
    normalizedName,
    instrumentType: type,
    status,
    toJSON: () => ({
      id,
      platform_id: platformId,
      normalized_name: normalizedName,
      instrument_type: type,
      status
    })
  });

  beforeEach(() => {
    mockStationRepository = {
      findById: vi.fn(),
      findByAcronym: vi.fn()
    };

    mockPlatformRepository = {
      findByStationId: vi.fn()
    };

    mockInstrumentRepository = {
      findByStationId: vi.fn()
    };

    query = new GetStationDashboard({
      stationRepository: mockStationRepository,
      platformRepository: mockPlatformRepository,
      instrumentRepository: mockInstrumentRepository
    });
  });

  describe('execute', () => {
    it('should return null if station not found', async () => {
      mockStationRepository.findByAcronym.mockResolvedValue(null);

      const result = await query.execute('UNKNOWN');

      expect(result).toBeNull();
    });

    it('should return station with platforms and instruments', async () => {
      const station = createMockStation(1, 'SVB');
      const platform = createMockPlatform(1, 1, 'SVB_FOR_TWR01');
      const instrument = createMockInstrument(1, 1, 'SVB_FOR_TWR01_PHE01');

      mockStationRepository.findByAcronym.mockResolvedValue(station);
      mockPlatformRepository.findByStationId.mockResolvedValue([platform]);
      mockInstrumentRepository.findByStationId.mockResolvedValue([instrument]);

      const result = await query.execute('SVB');

      expect(result.station).toBeDefined();
      expect(result.platforms).toHaveLength(1);
      expect(result.platforms[0].instruments).toHaveLength(1);
    });

    it('should use single query for all instruments (N+1 fix)', async () => {
      const station = createMockStation(1, 'SVB');
      const platforms = [
        createMockPlatform(1, 1, 'SVB_FOR_TWR01'),
        createMockPlatform(2, 1, 'SVB_AGR_TWR01'),
        createMockPlatform(3, 1, 'SVB_MIR_TWR01')
      ];
      const instruments = [
        createMockInstrument(1, 1, 'SVB_FOR_TWR01_PHE01'),
        createMockInstrument(2, 1, 'SVB_FOR_TWR01_PHE02'),
        createMockInstrument(3, 2, 'SVB_AGR_TWR01_PHE01')
      ];

      mockStationRepository.findByAcronym.mockResolvedValue(station);
      mockPlatformRepository.findByStationId.mockResolvedValue(platforms);
      mockInstrumentRepository.findByStationId.mockResolvedValue(instruments);

      await query.execute('SVB');

      // Key assertion: findByStationId called ONCE for all instruments (N+1 fix)
      expect(mockInstrumentRepository.findByStationId).toHaveBeenCalledTimes(1);
      expect(mockInstrumentRepository.findByStationId).toHaveBeenCalledWith(1);
    });

    it('should group instruments by platform correctly', async () => {
      const station = createMockStation(1, 'SVB');
      const platforms = [
        createMockPlatform(1, 1, 'SVB_FOR_TWR01'),
        createMockPlatform(2, 1, 'SVB_AGR_TWR01')
      ];
      const instruments = [
        createMockInstrument(1, 1, 'SVB_FOR_TWR01_PHE01'),
        createMockInstrument(2, 1, 'SVB_FOR_TWR01_PHE02'),
        createMockInstrument(3, 2, 'SVB_AGR_TWR01_PHE01')
      ];

      mockStationRepository.findByAcronym.mockResolvedValue(station);
      mockPlatformRepository.findByStationId.mockResolvedValue(platforms);
      mockInstrumentRepository.findByStationId.mockResolvedValue(instruments);

      const result = await query.execute('SVB');

      // Platform 1 should have 2 instruments
      expect(result.platforms[0].instruments).toHaveLength(2);
      // Platform 2 should have 1 instrument
      expect(result.platforms[1].instruments).toHaveLength(1);
    });

    it('should calculate statistics correctly', async () => {
      const station = createMockStation(1, 'SVB');
      const platforms = [
        createMockPlatform(1, 1, 'SVB_FOR_TWR01', 'fixed', 'FOR'),
        createMockPlatform(2, 1, 'SVB_DJI_M3M_UAV01', 'uav', null)
      ];
      const instruments = [
        createMockInstrument(1, 1, 'SVB_FOR_TWR01_PHE01', 'Phenocam', 'Active'),
        createMockInstrument(2, 1, 'SVB_FOR_TWR01_MS01', 'Multispectral', 'Active'),
        createMockInstrument(3, 2, 'SVB_DJI_M3M_UAV01_RGB01', 'RGB', 'Inactive')
      ];

      mockStationRepository.findByAcronym.mockResolvedValue(station);
      mockPlatformRepository.findByStationId.mockResolvedValue(platforms);
      mockInstrumentRepository.findByStationId.mockResolvedValue(instruments);

      const result = await query.execute('SVB');

      expect(result.stats.platformCount).toBe(2);
      expect(result.stats.instrumentCount).toBe(3);
      expect(result.stats.activeInstruments).toBe(2);
      expect(result.stats.inactiveInstruments).toBe(1);
      expect(result.stats.platformTypes.fixed).toBe(1);
      expect(result.stats.platformTypes.uav).toBe(1);
      expect(result.stats.instrumentTypes.Phenocam).toBe(1);
      expect(result.stats.instrumentTypes.Multispectral).toBe(1);
      expect(result.stats.instrumentTypes.RGB).toBe(1);
      expect(result.stats.ecosystems).toContain('FOR');
    });

    it('should handle platform with no instruments', async () => {
      const station = createMockStation(1, 'SVB');
      const platforms = [createMockPlatform(1, 1, 'SVB_FOR_TWR01')];

      mockStationRepository.findByAcronym.mockResolvedValue(station);
      mockPlatformRepository.findByStationId.mockResolvedValue(platforms);
      mockInstrumentRepository.findByStationId.mockResolvedValue([]);

      const result = await query.execute('SVB');

      expect(result.platforms[0].instruments).toEqual([]);
    });

    it('should handle station with no platforms', async () => {
      const station = createMockStation(1, 'SVB');

      mockStationRepository.findByAcronym.mockResolvedValue(station);
      mockPlatformRepository.findByStationId.mockResolvedValue([]);
      mockInstrumentRepository.findByStationId.mockResolvedValue([]);

      const result = await query.execute('SVB');

      expect(result.platforms).toEqual([]);
      expect(result.stats.platformCount).toBe(0);
    });
  });

  describe('byId', () => {
    it('should return null if station not found', async () => {
      mockStationRepository.findById.mockResolvedValue(null);

      const result = await query.byId(999);

      expect(result).toBeNull();
    });

    it('should execute query with station acronym', async () => {
      const station = createMockStation(1, 'SVB');

      mockStationRepository.findById.mockResolvedValue(station);
      mockStationRepository.findByAcronym.mockResolvedValue(station);
      mockPlatformRepository.findByStationId.mockResolvedValue([]);
      mockInstrumentRepository.findByStationId.mockResolvedValue([]);

      const result = await query.byId(1);

      expect(result).toBeDefined();
      expect(mockStationRepository.findByAcronym).toHaveBeenCalledWith('SVB');
    });
  });
});
