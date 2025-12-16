/**
 * ROI Repository Port (Interface)
 *
 * Defines the contract for ROI persistence operations.
 * Implementations should be in infrastructure layer.
 *
 * @module domain/roi/ROIRepository
 * @version 11.0.0
 */

/**
 * @interface ROIRepository
 */
export class ROIRepository {
  /**
   * Find ROI by ID
   * @param {number} id - ROI ID
   * @returns {Promise<ROI|null>}
   */
  async findById(id) {
    throw new Error('Method not implemented');
  }

  /**
   * Find all ROIs for an instrument
   * @param {number} instrumentId - Instrument ID
   * @param {Object} [options] - Query options
   * @param {boolean} [options.includeLegacy=false] - Include legacy ROIs
   * @returns {Promise<ROI[]>}
   */
  async findByInstrumentId(instrumentId, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Find all ROIs for a station (via instruments)
   * @param {number} stationId - Station ID
   * @param {Object} [options] - Query options
   * @param {boolean} [options.includeLegacy=false] - Include legacy ROIs
   * @returns {Promise<ROI[]>}
   */
  async findByStationId(stationId, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Find all ROIs with filtering and pagination
   * @param {Object} filters - Filter criteria
   * @param {number} [filters.instrumentId] - Filter by instrument
   * @param {number} [filters.stationId] - Filter by station
   * @param {boolean} [filters.includeLegacy] - Include legacy ROIs
   * @param {string} [filters.status] - Filter by status
   * @param {Object} pagination - Pagination options
   * @param {number} [pagination.page=1] - Page number
   * @param {number} [pagination.limit=50] - Items per page
   * @returns {Promise<{rois: ROI[], total: number, page: number, limit: number}>}
   */
  async findAll(filters = {}, pagination = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Save ROI (create or update)
   * @param {ROI} roi - ROI entity to save
   * @returns {Promise<ROI>} Saved ROI with ID
   */
  async save(roi) {
    throw new Error('Method not implemented');
  }

  /**
   * Delete ROI by ID
   * @param {number} id - ROI ID
   * @returns {Promise<boolean>} True if deleted
   */
  async delete(id) {
    throw new Error('Method not implemented');
  }

  /**
   * Mark ROI as legacy
   * @param {number} id - ROI ID
   * @param {string} reason - Legacy reason
   * @param {number} [replacementId] - Replacement ROI ID
   * @returns {Promise<ROI>} Updated ROI
   */
  async markAsLegacy(id, reason, replacementId = null) {
    throw new Error('Method not implemented');
  }

  /**
   * Get next available ROI name for instrument
   * @param {number} instrumentId - Instrument ID
   * @returns {Promise<string>} Next ROI name (e.g., 'ROI_03')
   */
  async getNextROIName(instrumentId) {
    throw new Error('Method not implemented');
  }

  /**
   * Count ROIs for an instrument
   * @param {number} instrumentId - Instrument ID
   * @param {Object} [options] - Count options
   * @param {boolean} [options.includeLegacy=false] - Include legacy ROIs
   * @returns {Promise<number>}
   */
  async countByInstrument(instrumentId, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Find ROI with its replacement chain
   * @param {number} id - ROI ID
   * @returns {Promise<{current: ROI, legacy: ROI[], replacement: ROI|null}>}
   */
  async findWithReplacementChain(id) {
    throw new Error('Method not implemented');
  }

  /**
   * Check if ROI name exists for instrument
   * @param {number} instrumentId - Instrument ID
   * @param {string} roiName - ROI name to check
   * @param {number} [excludeId] - ROI ID to exclude from check
   * @returns {Promise<boolean>}
   */
  async existsByName(instrumentId, roiName, excludeId = null) {
    throw new Error('Method not implemented');
  }

  /**
   * Get instrument info for ROI (for authorization checks)
   * @param {number} roiId - ROI ID
   * @returns {Promise<{instrumentId: number, platformId: number, stationId: number}|null>}
   */
  async getInstrumentInfo(roiId) {
    throw new Error('Method not implemented');
  }
}
