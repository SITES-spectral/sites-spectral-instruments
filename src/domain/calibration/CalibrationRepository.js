/**
 * Calibration Repository Port (Interface)
 *
 * Defines the contract for calibration record persistence.
 * Infrastructure layer implements this interface.
 *
 * @module domain/calibration/CalibrationRepository
 */

/**
 * Calibration Repository Interface
 * @interface
 */
export class CalibrationRepository {
  /**
   * Find calibration record by ID
   * @param {number} id
   * @returns {Promise<CalibrationRecord|null>}
   */
  async findById(id) {
    throw new Error('Not implemented');
  }

  /**
   * Find all calibration records for an instrument
   * @param {number} instrumentId
   * @returns {Promise<CalibrationRecord[]>}
   */
  async findByInstrumentId(instrumentId) {
    throw new Error('Not implemented');
  }

  /**
   * Find calibration records for a station
   * @param {number} stationId
   * @returns {Promise<CalibrationRecord[]>}
   */
  async findByStationId(stationId) {
    throw new Error('Not implemented');
  }

  /**
   * Find current valid calibration for an instrument
   * @param {number} instrumentId
   * @returns {Promise<CalibrationRecord|null>}
   */
  async findCurrentValid(instrumentId) {
    throw new Error('Not implemented');
  }

  /**
   * Find calibration records by type
   * @param {string} calibrationType
   * @returns {Promise<CalibrationRecord[]>}
   */
  async findByType(calibrationType) {
    throw new Error('Not implemented');
  }

  /**
   * Find calibration records by status
   * @param {string} status
   * @returns {Promise<CalibrationRecord[]>}
   */
  async findByStatus(status) {
    throw new Error('Not implemented');
  }

  /**
   * Find expired calibrations
   * @returns {Promise<CalibrationRecord[]>}
   */
  async findExpired() {
    throw new Error('Not implemented');
  }

  /**
   * Find calibrations expiring soon
   * @param {number} daysUntilExpiration
   * @returns {Promise<CalibrationRecord[]>}
   */
  async findExpiringSoon(daysUntilExpiration = 30) {
    throw new Error('Not implemented');
  }

  /**
   * Find calibrations within date range
   * @param {string} startDate
   * @param {string} endDate
   * @returns {Promise<CalibrationRecord[]>}
   */
  async findByDateRange(startDate, endDate) {
    throw new Error('Not implemented');
  }

  /**
   * Find calibration timeline for an instrument
   * @param {number} instrumentId
   * @param {Object} options - { limit, offset, startDate, endDate }
   * @returns {Promise<{ records: CalibrationRecord[], total: number }>}
   */
  async findTimeline(instrumentId, options = {}) {
    throw new Error('Not implemented');
  }

  /**
   * Find calibrations by laboratory
   * @param {string} laboratory
   * @returns {Promise<CalibrationRecord[]>}
   */
  async findByLaboratory(laboratory) {
    throw new Error('Not implemented');
  }

  /**
   * Find calibrations by certificate number
   * @param {string} certificateNumber
   * @returns {Promise<CalibrationRecord|null>}
   */
  async findByCertificateNumber(certificateNumber) {
    throw new Error('Not implemented');
  }

  /**
   * Find last calibration for an instrument
   * @param {number} instrumentId
   * @returns {Promise<CalibrationRecord|null>}
   */
  async findLastCalibration(instrumentId) {
    throw new Error('Not implemented');
  }

  /**
   * Find all calibration records
   * @param {Object} options - { page, limit, sortBy, sortOrder }
   * @returns {Promise<{ items: CalibrationRecord[], pagination: Object }>}
   */
  async findAll(options = {}) {
    throw new Error('Not implemented');
  }

  /**
   * Save calibration record (create or update)
   * @param {CalibrationRecord} record
   * @returns {Promise<CalibrationRecord>}
   */
  async save(record) {
    throw new Error('Not implemented');
  }

  /**
   * Delete calibration record
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  async deleteById(id) {
    throw new Error('Not implemented');
  }

  /**
   * Count calibrations for an instrument
   * @param {number} instrumentId
   * @returns {Promise<number>}
   */
  async countByInstrumentId(instrumentId) {
    throw new Error('Not implemented');
  }

  /**
   * Check if calibration record exists
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  async existsById(id) {
    throw new Error('Not implemented');
  }

  /**
   * Mark old calibrations as superseded when new one is added
   * @param {number} instrumentId
   * @param {number} newCalibrationId
   * @returns {Promise<number>} Number of records updated
   */
  async supersedeOldCalibrations(instrumentId, newCalibrationId) {
    throw new Error('Not implemented');
  }

  /**
   * Get calibration statistics for an instrument
   * @param {number} instrumentId
   * @returns {Promise<Object>}
   */
  async getStatistics(instrumentId) {
    throw new Error('Not implemented');
  }
}
