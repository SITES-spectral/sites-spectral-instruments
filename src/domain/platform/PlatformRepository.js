/**
 * Platform Repository Port (Interface)
 *
 * This is a PORT in Hexagonal Architecture - it defines the contract
 * for platform persistence without any implementation details.
 *
 * Implementations (ADAPTERS) live in infrastructure/persistence/
 *
 * @module domain/platform/PlatformRepository
 */

import { PLATFORM_TYPES, ECOSYSTEM_CODES } from './Platform.js';

/**
 * @typedef {Object} PlatformFilters
 * @property {number} [stationId] - Filter by station
 * @property {string} [platformType] - Filter by type ('fixed', 'uav', 'satellite')
 * @property {string} [ecosystemCode] - Filter by ecosystem
 * @property {string} [status] - Filter by status
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
 * Platform Repository Interface
 *
 * @interface PlatformRepository
 */
export class PlatformRepository {
  /**
   * Find platform by ID
   * @param {number} id - Platform ID
   * @returns {Promise<Platform|null>}
   */
  async findById(id) {
    throw new Error('PlatformRepository.findById() must be implemented');
  }

  /**
   * Find platform by normalized name
   * @param {string} normalizedName - Normalized name (e.g., 'SVB_FOR_PL01')
   * @returns {Promise<Platform|null>}
   */
  async findByNormalizedName(normalizedName) {
    throw new Error('PlatformRepository.findByNormalizedName() must be implemented');
  }

  /**
   * Find all platforms for a station
   * @param {number} stationId - Station ID
   * @param {PlatformFilters} [filters] - Additional filters
   * @returns {Promise<Platform[]>}
   */
  async findByStationId(stationId, filters = {}) {
    throw new Error('PlatformRepository.findByStationId() must be implemented');
  }

  /**
   * Find all platforms by type
   * @param {string} platformType - Platform type ('fixed', 'uav', 'satellite')
   * @param {PaginationOptions} [pagination] - Pagination options
   * @returns {Promise<{platforms: Platform[], total: number}>}
   */
  async findByType(platformType, pagination = {}) {
    throw new Error('PlatformRepository.findByType() must be implemented');
  }

  /**
   * Find all platforms with optional filtering and pagination
   * @param {PlatformFilters} [filters] - Filter options
   * @param {PaginationOptions} [pagination] - Pagination options
   * @returns {Promise<{platforms: Platform[], total: number}>}
   */
  async findAll(filters = {}, pagination = {}) {
    throw new Error('PlatformRepository.findAll() must be implemented');
  }

  /**
   * Save a platform (insert or update)
   * @param {Platform} platform - Platform entity
   * @returns {Promise<Platform>} Saved platform with ID
   */
  async save(platform) {
    throw new Error('PlatformRepository.save() must be implemented');
  }

  /**
   * Delete a platform by ID
   * @param {number} id - Platform ID
   * @returns {Promise<boolean>} True if deleted
   */
  async delete(id) {
    throw new Error('PlatformRepository.delete() must be implemented');
  }

  /**
   * Check if platform has dependent instruments
   * @param {number} id - Platform ID
   * @returns {Promise<number>} Count of dependent instruments
   */
  async getInstrumentCount(id) {
    throw new Error('PlatformRepository.getInstrumentCount() must be implemented');
  }

  /**
   * Check if normalized name exists
   * @param {string} normalizedName - Normalized name
   * @param {number} [excludeId] - ID to exclude (for updates)
   * @returns {Promise<boolean>}
   */
  async normalizedNameExists(normalizedName, excludeId = null) {
    throw new Error('PlatformRepository.normalizedNameExists() must be implemented');
  }

  /**
   * Get next available mount type code for a station/platform type combination
   * @param {number} stationId - Station ID
   * @param {string} mountTypePrefix - Mount type prefix (PL, BL, GL, UAV, SAT, etc.)
   * @param {string} [ecosystemCode] - Ecosystem code (for fixed platforms)
   * @returns {Promise<string>} Next mount type code (e.g., 'PL01', 'BL02', 'UAV01')
   */
  async getNextMountTypeCode(stationId, mountTypePrefix, ecosystemCode = null) {
    throw new Error('PlatformRepository.getNextMountTypeCode() must be implemented');
  }

  /**
   * Find platform with full details including instruments
   * @param {number} id - Platform ID
   * @returns {Promise<{platform: Platform, instruments: Instrument[]}|null>}
   */
  async findWithInstruments(id) {
    throw new Error('PlatformRepository.findWithInstruments() must be implemented');
  }
}
