/**
 * Calibration Record Entity
 *
 * Represents a calibration event for multispectral sensors.
 * Supports timeline tracking for calibration history.
 *
 * @module domain/calibration/CalibrationRecord
 */

/**
 * Calibration Record Entity
 */
export class CalibrationRecord {
  /**
   * Supported instrument types for calibration
   * Only multispectral sensors can have calibration records
   */
  static SUPPORTED_INSTRUMENT_TYPES = [
    'multispectral',
    'Multispectral',
    'MS',
    'multispectral_sensor',
    'hyperspectral',
    'Hyperspectral',
    'HYP'
  ];

  /**
   * Calibration types
   */
  static TYPES = {
    FACTORY: 'factory',              // Factory/manufacturer calibration
    FIELD: 'field',                  // Field calibration
    LABORATORY: 'laboratory',        // Laboratory calibration
    CROSS_CALIBRATION: 'cross_calibration', // Cross-calibration with reference
    VICARIOUS: 'vicarious',          // Vicarious calibration (using ground targets)
    RADIOMETRIC: 'radiometric',      // Radiometric calibration
    SPECTRAL: 'spectral',            // Spectral calibration
    GEOMETRIC: 'geometric',          // Geometric calibration
    DARK_CURRENT: 'dark_current',    // Dark current calibration
    FLAT_FIELD: 'flat_field'         // Flat field calibration
  };

  /**
   * Calibration status
   */
  static STATUS = {
    VALID: 'valid',                  // Calibration is currently valid
    EXPIRED: 'expired',              // Calibration has expired
    SUPERSEDED: 'superseded',        // Replaced by newer calibration
    PENDING_REVIEW: 'pending_review' // Awaiting validation
  };

  /**
   * @param {Object} props - Calibration record properties
   */
  constructor({
    id = null,
    instrumentId,
    instrumentType = null,
    stationId = null,
    calibrationType,
    status = CalibrationRecord.STATUS.VALID,
    calibrationDate,
    validFrom = null,
    validUntil = null,
    performedBy = null,
    performedByUserId = null,
    laboratory = null,
    certificateNumber = null,
    certificateUrl = null,
    // Calibration coefficients per channel
    coefficients = {},
    // Reference data
    referencePanel = null,
    referenceStandard = null,
    // Environmental conditions during calibration
    temperature = null,
    humidity = null,
    // Quality metrics
    uncertainty = null,
    rmse = null,
    r2 = null,
    // Documentation
    description = null,
    methodology = null,
    notes = null,
    attachments = [],
    metadata = {},
    createdAt = null,
    updatedAt = null
  }) {
    this.id = id;
    this.instrumentId = instrumentId;
    this.instrumentType = instrumentType;
    this.stationId = stationId;
    this.calibrationType = calibrationType;
    this.status = status;
    this.calibrationDate = calibrationDate;
    this.validFrom = validFrom || calibrationDate;
    this.validUntil = validUntil;
    this.performedBy = performedBy;
    this.performedByUserId = performedByUserId;
    this.laboratory = laboratory;
    this.certificateNumber = certificateNumber;
    this.certificateUrl = certificateUrl;
    this.coefficients = coefficients;
    this.referencePanel = referencePanel;
    this.referenceStandard = referenceStandard;
    this.temperature = temperature;
    this.humidity = humidity;
    this.uncertainty = uncertainty;
    this.rmse = rmse;
    this.r2 = r2;
    this.description = description;
    this.methodology = methodology;
    this.notes = notes;
    this.attachments = attachments;
    this.metadata = metadata;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Check if instrument type supports calibration
   * @param {string} instrumentType
   * @returns {boolean}
   */
  static isCalibratableInstrument(instrumentType) {
    if (!instrumentType) return false;
    const normalizedType = instrumentType.toLowerCase();
    return CalibrationRecord.SUPPORTED_INSTRUMENT_TYPES.some(
      type => type.toLowerCase() === normalizedType ||
              normalizedType.includes('multispectral') ||
              normalizedType.includes('hyperspectral')
    );
  }

  /**
   * Validate the calibration record
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validate() {
    const errors = [];

    // Required fields
    if (!this.instrumentId) {
      errors.push('Instrument ID is required');
    }

    if (!this.calibrationType) {
      errors.push('Calibration type is required');
    } else if (!Object.values(CalibrationRecord.TYPES).includes(this.calibrationType)) {
      errors.push(`Invalid calibration type: ${this.calibrationType}`);
    }

    if (!this.calibrationDate) {
      errors.push('Calibration date is required');
    }

    if (this.status && !Object.values(CalibrationRecord.STATUS).includes(this.status)) {
      errors.push(`Invalid status: ${this.status}`);
    }

    // Instrument type validation (must be multispectral)
    if (this.instrumentType && !CalibrationRecord.isCalibratableInstrument(this.instrumentType)) {
      errors.push(`Calibration records are only supported for multispectral/hyperspectral instruments, not: ${this.instrumentType}`);
    }

    // Date validations
    if (this.validFrom && this.validUntil) {
      const from = new Date(this.validFrom);
      const until = new Date(this.validUntil);
      if (until <= from) {
        errors.push('Valid until must be after valid from');
      }
    }

    // Quality metrics validation
    if (this.r2 !== null && (this.r2 < 0 || this.r2 > 1)) {
      errors.push('R² must be between 0 and 1');
    }

    if (this.uncertainty !== null && this.uncertainty < 0) {
      errors.push('Uncertainty cannot be negative');
    }

    if (this.rmse !== null && this.rmse < 0) {
      errors.push('RMSE cannot be negative');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if calibration is currently valid
   * @returns {boolean}
   */
  isCurrentlyValid() {
    if (this.status !== CalibrationRecord.STATUS.VALID) {
      return false;
    }

    const now = new Date();

    if (this.validFrom && new Date(this.validFrom) > now) {
      return false;
    }

    if (this.validUntil && new Date(this.validUntil) < now) {
      return false;
    }

    return true;
  }

  /**
   * Check if calibration has expired
   * @returns {boolean}
   */
  isExpired() {
    if (!this.validUntil) {
      return false;
    }
    return new Date(this.validUntil) < new Date();
  }

  /**
   * Get days until expiration
   * @returns {number|null}
   */
  daysUntilExpiration() {
    if (!this.validUntil) {
      return null;
    }
    const until = new Date(this.validUntil);
    const now = new Date();
    const diffTime = until - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Mark calibration as expired
   */
  expire() {
    this.status = CalibrationRecord.STATUS.EXPIRED;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Mark calibration as superseded by a newer one
   * @param {number} newCalibrationId
   */
  supersede(newCalibrationId) {
    this.status = CalibrationRecord.STATUS.SUPERSEDED;
    this.metadata = {
      ...this.metadata,
      supersededBy: newCalibrationId,
      supersededAt: new Date().toISOString()
    };
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Get coefficient for a specific channel
   * @param {string|number} channel - Channel name or number
   * @returns {Object|null}
   */
  getChannelCoefficients(channel) {
    return this.coefficients[channel] || null;
  }

  /**
   * Set coefficients for a channel
   * @param {string|number} channel
   * @param {Object} coeffs - { gain, offset, ... }
   */
  setChannelCoefficients(channel, coeffs) {
    this.coefficients[channel] = coeffs;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Get all channel names
   * @returns {string[]}
   */
  getChannels() {
    return Object.keys(this.coefficients);
  }

  /**
   * Convert to JSON representation
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      instrument_id: this.instrumentId,
      instrument_type: this.instrumentType,
      station_id: this.stationId,
      calibration_type: this.calibrationType,
      status: this.status,
      calibration_date: this.calibrationDate,
      valid_from: this.validFrom,
      valid_until: this.validUntil,
      performed_by: this.performedBy,
      performed_by_user_id: this.performedByUserId,
      laboratory: this.laboratory,
      certificate_number: this.certificateNumber,
      certificate_url: this.certificateUrl,
      coefficients: this.coefficients,
      reference_panel: this.referencePanel,
      reference_standard: this.referenceStandard,
      temperature: this.temperature,
      humidity: this.humidity,
      uncertainty: this.uncertainty,
      rmse: this.rmse,
      r2: this.r2,
      description: this.description,
      methodology: this.methodology,
      notes: this.notes,
      attachments: this.attachments,
      metadata: this.metadata,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
      // Computed properties
      is_currently_valid: this.isCurrentlyValid(),
      is_expired: this.isExpired(),
      days_until_expiration: this.daysUntilExpiration(),
      channels: this.getChannels()
    };
  }

  /**
   * Create from database row
   * @param {Object} row - Database row
   * @returns {CalibrationRecord}
   */
  static fromRow(row) {
    return new CalibrationRecord({
      id: row.id,
      instrumentId: row.instrument_id,
      instrumentType: row.instrument_type,
      stationId: row.station_id,
      calibrationType: row.calibration_type,
      status: row.status,
      calibrationDate: row.calibration_date,
      validFrom: row.valid_from,
      validUntil: row.valid_until,
      performedBy: row.performed_by,
      performedByUserId: row.performed_by_user_id,
      laboratory: row.laboratory,
      certificateNumber: row.certificate_number,
      certificateUrl: row.certificate_url,
      coefficients: row.coefficients_json ? JSON.parse(row.coefficients_json) : {},
      referencePanel: row.reference_panel,
      referenceStandard: row.reference_standard,
      temperature: row.temperature,
      humidity: row.humidity,
      uncertainty: row.uncertainty,
      rmse: row.rmse,
      r2: row.r2,
      description: row.description,
      methodology: row.methodology,
      notes: row.notes,
      attachments: row.attachments_json ? JSON.parse(row.attachments_json) : [],
      metadata: row.metadata_json ? JSON.parse(row.metadata_json) : {},
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }
}
