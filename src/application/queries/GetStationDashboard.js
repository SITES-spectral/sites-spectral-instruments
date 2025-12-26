/**
 * Get Station Dashboard Query
 *
 * Composite query that returns a station with all its platforms and instruments.
 * Optimized for dashboard rendering.
 *
 * @module application/queries/GetStationDashboard
 */

/**
 * @typedef {Object} StationDashboard
 * @property {Object} station - Station entity
 * @property {Array} platforms - Platforms with nested instruments
 * @property {Object} stats - Dashboard statistics
 */

/**
 * Get Station Dashboard Query
 */
export class GetStationDashboard {
  /**
   * @param {Object} dependencies
   * @param {import('../../domain/station/StationRepository.js').StationRepository} dependencies.stationRepository
   * @param {import('../../domain/platform/PlatformRepository.js').PlatformRepository} dependencies.platformRepository
   * @param {import('../../domain/instrument/InstrumentRepository.js').InstrumentRepository} dependencies.instrumentRepository
   */
  constructor({ stationRepository, platformRepository, instrumentRepository }) {
    this.stationRepository = stationRepository;
    this.platformRepository = platformRepository;
    this.instrumentRepository = instrumentRepository;
  }

  /**
   * Execute the get station dashboard query
   *
   * @param {string} acronym - Station acronym
   * @returns {Promise<StationDashboard|null>}
   */
  async execute(acronym) {
    // Get station
    const station = await this.stationRepository.findByAcronym(acronym);
    if (!station) {
      return null;
    }

    // Get all platforms for this station
    const platforms = await this.platformRepository.findByStationId(station.id);

    // Get all instruments for this station in a single query (N+1 fix)
    const allInstruments = await this.instrumentRepository.findByStationId(station.id);

    // Group instruments by platform_id in memory
    const instrumentsByPlatform = new Map();
    for (const instrument of allInstruments) {
      const platformId = instrument.platformId;
      if (!instrumentsByPlatform.has(platformId)) {
        instrumentsByPlatform.set(platformId, []);
      }
      instrumentsByPlatform.get(platformId).push(instrument.toJSON());
    }

    // Attach instruments to their platforms
    const platformsWithInstruments = platforms.map((platform) => ({
      ...platform.toJSON(),
      instruments: instrumentsByPlatform.get(platform.id) || []
    }));

    // Calculate statistics
    const stats = this._calculateStats(platformsWithInstruments);

    return {
      station: station.toJSON(),
      platforms: platformsWithInstruments,
      stats
    };
  }

  /**
   * Execute by station ID
   *
   * @param {number} id - Station ID
   * @returns {Promise<StationDashboard|null>}
   */
  async byId(id) {
    const station = await this.stationRepository.findById(id);
    if (!station) {
      return null;
    }
    return this.execute(station.acronym);
  }

  /**
   * Calculate dashboard statistics
   * @private
   */
  _calculateStats(platformsWithInstruments) {
    const stats = {
      platformCount: platformsWithInstruments.length,
      instrumentCount: 0,
      activeInstruments: 0,
      inactiveInstruments: 0,
      platformTypes: {},
      instrumentTypes: {},
      ecosystems: new Set()
    };

    for (const platform of platformsWithInstruments) {
      // Count platform types
      const pType = platform.platform_type || 'fixed';
      stats.platformTypes[pType] = (stats.platformTypes[pType] || 0) + 1;

      // Track ecosystems
      if (platform.ecosystem_code) {
        stats.ecosystems.add(platform.ecosystem_code);
      }

      // Count instruments
      for (const instrument of platform.instruments) {
        stats.instrumentCount++;

        // Count by status
        if (instrument.status === 'Active') {
          stats.activeInstruments++;
        } else {
          stats.inactiveInstruments++;
        }

        // Count by type
        const iType = instrument.instrument_type || 'Unknown';
        stats.instrumentTypes[iType] = (stats.instrumentTypes[iType] || 0) + 1;
      }
    }

    // Convert Set to array
    stats.ecosystems = Array.from(stats.ecosystems);

    return stats;
  }
}
