/**
 * Maintenance Repository Port (Interface)
 *
 * Defines the contract for maintenance record persistence.
 * Infrastructure layer implements this interface.
 *
 * @module domain/maintenance/MaintenanceRepository
 */

/**
 * Maintenance Repository Interface
 * @interface
 */
export class MaintenanceRepository {
  /**
   * Find maintenance record by ID
   * @param {number} id
   * @returns {Promise<MaintenanceRecord|null>}
   */
  async findById(id) {
    throw new Error('Not implemented');
  }

  /**
   * Find all maintenance records for a platform
   * @param {number} platformId
   * @returns {Promise<MaintenanceRecord[]>}
   */
  async findByPlatformId(platformId) {
    throw new Error('Not implemented');
  }

  /**
   * Find all maintenance records for an instrument
   * @param {number} instrumentId
   * @returns {Promise<MaintenanceRecord[]>}
   */
  async findByInstrumentId(instrumentId) {
    throw new Error('Not implemented');
  }

  /**
   * Find all maintenance records for a station
   * @param {number} stationId
   * @returns {Promise<MaintenanceRecord[]>}
   */
  async findByStationId(stationId) {
    throw new Error('Not implemented');
  }

  /**
   * Find maintenance records by entity (platform or instrument)
   * @param {string} entityType - 'platform' or 'instrument'
   * @param {number} entityId
   * @returns {Promise<MaintenanceRecord[]>}
   */
  async findByEntity(entityType, entityId) {
    throw new Error('Not implemented');
  }

  /**
   * Find maintenance records by status
   * @param {string} status
   * @returns {Promise<MaintenanceRecord[]>}
   */
  async findByStatus(status) {
    throw new Error('Not implemented');
  }

  /**
   * Find maintenance records by type
   * @param {string} maintenanceType
   * @returns {Promise<MaintenanceRecord[]>}
   */
  async findByType(maintenanceType) {
    throw new Error('Not implemented');
  }

  /**
   * Find scheduled maintenance records
   * @returns {Promise<MaintenanceRecord[]>}
   */
  async findScheduled() {
    throw new Error('Not implemented');
  }

  /**
   * Find overdue maintenance records
   * @returns {Promise<MaintenanceRecord[]>}
   */
  async findOverdue() {
    throw new Error('Not implemented');
  }

  /**
   * Find maintenance records within date range
   * @param {string} startDate
   * @param {string} endDate
   * @returns {Promise<MaintenanceRecord[]>}
   */
  async findByDateRange(startDate, endDate) {
    throw new Error('Not implemented');
  }

  /**
   * Find maintenance timeline for an entity
   * @param {string} entityType
   * @param {number} entityId
   * @param {Object} options - { limit, offset, startDate, endDate }
   * @returns {Promise<{ records: MaintenanceRecord[], total: number }>}
   */
  async findTimeline(entityType, entityId, options = {}) {
    throw new Error('Not implemented');
  }

  /**
   * Find upcoming maintenance (next scheduled)
   * @param {string} entityType
   * @param {number} entityId
   * @returns {Promise<MaintenanceRecord|null>}
   */
  async findNextScheduled(entityType, entityId) {
    throw new Error('Not implemented');
  }

  /**
   * Find last completed maintenance
   * @param {string} entityType
   * @param {number} entityId
   * @returns {Promise<MaintenanceRecord|null>}
   */
  async findLastCompleted(entityType, entityId) {
    throw new Error('Not implemented');
  }

  /**
   * Find all maintenance records
   * @param {Object} options - { page, limit, sortBy, sortOrder }
   * @returns {Promise<{ items: MaintenanceRecord[], pagination: Object }>}
   */
  async findAll(options = {}) {
    throw new Error('Not implemented');
  }

  /**
   * Save maintenance record (create or update)
   * @param {MaintenanceRecord} record
   * @returns {Promise<MaintenanceRecord>}
   */
  async save(record) {
    throw new Error('Not implemented');
  }

  /**
   * Delete maintenance record
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  async deleteById(id) {
    throw new Error('Not implemented');
  }

  /**
   * Count maintenance records for an entity
   * @param {string} entityType
   * @param {number} entityId
   * @returns {Promise<number>}
   */
  async countByEntity(entityType, entityId) {
    throw new Error('Not implemented');
  }

  /**
   * Check if maintenance record exists
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  async existsById(id) {
    throw new Error('Not implemented');
  }

  /**
   * Get maintenance statistics for an entity
   * @param {string} entityType
   * @param {number} entityId
   * @returns {Promise<Object>}
   */
  async getStatistics(entityType, entityId) {
    throw new Error('Not implemented');
  }
}
