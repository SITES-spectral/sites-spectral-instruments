/**
 * Instrument Repository Port (Interface)
 *
 * This is a PORT in Hexagonal Architecture - it defines the contract
 * for instrument persistence without any implementation details.
 *
 * Implementations (ADAPTERS) live in infrastructure/persistence/
 *
 * @module domain/instrument/InstrumentRepository
 */

/**
 * @typedef {Object} InstrumentFilters
 * @property {number} [platformId] - Filter by platform
 * @property {number} [stationId] - Filter by station (via platform)
 * @property {string} [instrumentType] - Filter by type
 * @property {string} [status] - Filter by status
 * @property {string} [measurementStatus] - Filter by measurement status
 * @property {string} [search] - Search in name
 */

/**
 * @typedef {Object} PaginationOptions
 * @property {number} [page=1] - Page number
 * @property {number} [limit=20] - Items per page
 * @property {string} [sortBy='display_name'] - Sort field
 * @property {string} [sortOrder='ASC'] - Sort order
 */

/**
 * Instrument Repository Interface
 *
 * @interface InstrumentRepository
 */
export class InstrumentRepository {
  /**
   * Find instrument by ID
   * @param {number} id - Instrument ID
   * @returns {Promise<Instrument|null>}
   */
  async findById(id) {
    throw new Error('InstrumentRepository.findById() must be implemented');
  }

  /**
   * Find instrument by normalized name
   * @param {string} normalizedName - Normalized name (e.g., 'SVB_FOR_PL01_PHE01')
   * @returns {Promise<Instrument|null>}
   */
  async findByNormalizedName(normalizedName) {
    throw new Error('InstrumentRepository.findByNormalizedName() must be implemented');
  }

  /**
   * Find all instruments for a platform
   * @param {number} platformId - Platform ID
   * @param {InstrumentFilters} [filters] - Additional filters
   * @returns {Promise<Instrument[]>}
   */
  async findByPlatformId(platformId, filters = {}) {
    throw new Error('InstrumentRepository.findByPlatformId() must be implemented');
  }

  /**
   * Find all instruments for a station (across all platforms)
   * @param {number} stationId - Station ID
   * @param {InstrumentFilters} [filters] - Additional filters
   * @returns {Promise<Instrument[]>}
   */
  async findByStationId(stationId, filters = {}) {
    throw new Error('InstrumentRepository.findByStationId() must be implemented');
  }

  /**
   * Find all instruments by type
   * @param {string} instrumentType - Instrument type
   * @param {PaginationOptions} [pagination] - Pagination options
   * @returns {Promise<{instruments: Instrument[], total: number}>}
   */
  async findByType(instrumentType, pagination = {}) {
    throw new Error('InstrumentRepository.findByType() must be implemented');
  }

  /**
   * Find all instruments with optional filtering and pagination
   * @param {InstrumentFilters} [filters] - Filter options
   * @param {PaginationOptions} [pagination] - Pagination options
   * @returns {Promise<{instruments: Instrument[], total: number}>}
   */
  async findAll(filters = {}, pagination = {}) {
    throw new Error('InstrumentRepository.findAll() must be implemented');
  }

  /**
   * Save an instrument (insert or update)
   * @param {Instrument} instrument - Instrument entity
   * @returns {Promise<Instrument>} Saved instrument with ID
   */
  async save(instrument) {
    throw new Error('InstrumentRepository.save() must be implemented');
  }

  /**
   * Delete an instrument by ID
   * @param {number} id - Instrument ID
   * @returns {Promise<boolean>} True if deleted
   */
  async delete(id) {
    throw new Error('InstrumentRepository.delete() must be implemented');
  }

  /**
   * Check if instrument has dependent ROIs
   * @param {number} id - Instrument ID
   * @returns {Promise<number>} Count of dependent ROIs
   */
  async getROICount(id) {
    throw new Error('InstrumentRepository.getROICount() must be implemented');
  }

  /**
   * Check if normalized name exists
   * @param {string} normalizedName - Normalized name
   * @param {number} [excludeId] - ID to exclude (for updates)
   * @returns {Promise<boolean>}
   */
  async normalizedNameExists(normalizedName, excludeId = null) {
    throw new Error('InstrumentRepository.normalizedNameExists() must be implemented');
  }

  /**
   * Get next available instrument number for a platform/type combination
   * @param {number} platformId - Platform ID
   * @param {string} typeCode - Instrument type code (PHE, MS, PAR, etc.)
   * @returns {Promise<number>} Next number (1, 2, 3, etc.)
   */
  async getNextInstrumentNumber(platformId, typeCode) {
    throw new Error('InstrumentRepository.getNextInstrumentNumber() must be implemented');
  }

  /**
   * Find instrument with full details including ROIs
   * @param {number} id - Instrument ID
   * @returns {Promise<{instrument: Instrument, rois: ROI[]}|null>}
   */
  async findWithROIs(id) {
    throw new Error('InstrumentRepository.findWithROIs() must be implemented');
  }

  /**
   * Update instrument specifications
   * @param {number} id - Instrument ID
   * @param {Object} specifications - New specifications
   * @returns {Promise<Instrument>}
   */
  async updateSpecifications(id, specifications) {
    throw new Error('InstrumentRepository.updateSpecifications() must be implemented');
  }
}
