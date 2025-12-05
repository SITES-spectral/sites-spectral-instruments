/**
 * Station Repository Port (Interface)
 *
 * This is a PORT in Hexagonal Architecture - it defines the contract
 * for station persistence without any implementation details.
 *
 * Implementations (ADAPTERS) live in infrastructure/persistence/
 *
 * @module domain/station/StationRepository
 */

/**
 * @typedef {Object} StationFilters
 * @property {string} [status] - Filter by status
 * @property {string} [search] - Search in name/acronym
 */

/**
 * @typedef {Object} PaginationOptions
 * @property {number} [page=1] - Page number
 * @property {number} [limit=20] - Items per page
 * @property {string} [sortBy='display_name'] - Sort field
 * @property {string} [sortOrder='ASC'] - Sort order
 */

/**
 * Station Repository Interface
 *
 * All methods return Promises. Implementations must handle
 * database-specific details (D1, PostgreSQL, etc.)
 *
 * @interface StationRepository
 */
export class StationRepository {
  /**
   * Find station by ID
   * @param {number} id - Station ID
   * @returns {Promise<Station|null>}
   */
  async findById(id) {
    throw new Error('StationRepository.findById() must be implemented');
  }

  /**
   * Find station by acronym
   * @param {string} acronym - Station acronym (e.g., 'SVB')
   * @returns {Promise<Station|null>}
   */
  async findByAcronym(acronym) {
    throw new Error('StationRepository.findByAcronym() must be implemented');
  }

  /**
   * Find station by normalized name
   * @param {string} normalizedName - Normalized name
   * @returns {Promise<Station|null>}
   */
  async findByNormalizedName(normalizedName) {
    throw new Error('StationRepository.findByNormalizedName() must be implemented');
  }

  /**
   * Find all stations with optional filtering and pagination
   * @param {StationFilters} [filters] - Filter options
   * @param {PaginationOptions} [pagination] - Pagination options
   * @returns {Promise<{stations: Station[], total: number}>}
   */
  async findAll(filters = {}, pagination = {}) {
    throw new Error('StationRepository.findAll() must be implemented');
  }

  /**
   * Save a station (insert or update)
   * @param {Station} station - Station entity
   * @returns {Promise<Station>} Saved station with ID
   */
  async save(station) {
    throw new Error('StationRepository.save() must be implemented');
  }

  /**
   * Delete a station by ID
   * @param {number} id - Station ID
   * @returns {Promise<boolean>} True if deleted
   */
  async delete(id) {
    throw new Error('StationRepository.delete() must be implemented');
  }

  /**
   * Check if station acronym exists
   * @param {string} acronym - Station acronym
   * @param {number} [excludeId] - ID to exclude (for updates)
   * @returns {Promise<boolean>}
   */
  async acronymExists(acronym, excludeId = null) {
    throw new Error('StationRepository.acronymExists() must be implemented');
  }

  /**
   * Get station with platform count
   * @param {number} id - Station ID
   * @returns {Promise<{station: Station, platformCount: number}|null>}
   */
  async findWithPlatformCount(id) {
    throw new Error('StationRepository.findWithPlatformCount() must be implemented');
  }
}
