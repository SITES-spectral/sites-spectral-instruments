/**
 * Calibration Service
 *
 * Domain service for calibration record business logic.
 * Handles validation, expiration management, and coefficient operations.
 * Enforces that only multispectral sensors can have calibration records.
 *
 * @module domain/calibration/CalibrationService
 */

import { CalibrationRecord } from './CalibrationRecord.js';

/**
 * Calibration Service
 */
export class CalibrationService {
  /**
   * Validate instrument type for calibration
   * @param {string} instrumentType
   * @returns {{ valid: boolean, error: string|null }}
   */
  validateInstrumentType(instrumentType) {
    if (!CalibrationRecord.isCalibratableInstrument(instrumentType)) {
      return {
        valid: false,
        error: `Calibration is only supported for multispectral/hyperspectral sensors. Instrument type '${instrumentType}' is not supported.`
      };
    }
    return { valid: true, error: null };
  }

  /**
   * Create a new calibration record
   * @param {Object} data - Calibration data
   * @returns {{ record: CalibrationRecord, errors: string[] }}
   */
  createRecord(data) {
    const errors = [];

    // Validate instrument type first
    const typeValidation = this.validateInstrumentType(data.instrumentType);
    if (!typeValidation.valid) {
      errors.push(typeValidation.error);
      return { record: null, errors };
    }

    const record = new CalibrationRecord({
      instrumentId: data.instrumentId,
      instrumentType: data.instrumentType,
      stationId: data.stationId,
      calibrationType: data.calibrationType,
      status: data.status || CalibrationRecord.STATUS.VALID,
      calibrationDate: data.calibrationDate,
      validFrom: data.validFrom || data.calibrationDate,
      validUntil: data.validUntil,
      performedBy: data.performedBy,
      performedByUserId: data.performedByUserId,
      laboratory: data.laboratory,
      certificateNumber: data.certificateNumber,
      certificateUrl: data.certificateUrl,
      coefficients: data.coefficients || {},
      referencePanel: data.referencePanel,
      referenceStandard: data.referenceStandard,
      temperature: data.temperature,
      humidity: data.humidity,
      uncertainty: data.uncertainty,
      rmse: data.rmse,
      r2: data.r2,
      description: data.description,
      methodology: data.methodology,
      notes: data.notes,
      attachments: data.attachments || [],
      metadata: data.metadata || {},
      createdAt: new Date().toISOString()
    });

    const validation = record.validate();
    return {
      record: validation.valid ? record : null,
      errors: validation.errors
    };
  }

  /**
   * Create factory calibration record
   * @param {Object} data
   * @returns {{ record: CalibrationRecord, errors: string[] }}
   */
  createFactoryCalibration(data) {
    return this.createRecord({
      ...data,
      calibrationType: CalibrationRecord.TYPES.FACTORY
    });
  }

  /**
   * Create field calibration record
   * @param {Object} data
   * @returns {{ record: CalibrationRecord, errors: string[] }}
   */
  createFieldCalibration(data) {
    return this.createRecord({
      ...data,
      calibrationType: CalibrationRecord.TYPES.FIELD
    });
  }

  /**
   * Create laboratory calibration record
   * @param {Object} data
   * @returns {{ record: CalibrationRecord, errors: string[] }}
   */
  createLaboratoryCalibration(data) {
    return this.createRecord({
      ...data,
      calibrationType: CalibrationRecord.TYPES.LABORATORY
    });
  }

  /**
   * Create cross-calibration record
   * @param {Object} data
   * @param {number} referenceInstrumentId
   * @returns {{ record: CalibrationRecord, errors: string[] }}
   */
  createCrossCalibration(data, referenceInstrumentId) {
    return this.createRecord({
      ...data,
      calibrationType: CalibrationRecord.TYPES.CROSS_CALIBRATION,
      metadata: {
        ...data.metadata,
        referenceInstrumentId
      }
    });
  }

  /**
   * Update calibration record
   * @param {CalibrationRecord} record
   * @param {Object} updates
   * @returns {{ record: CalibrationRecord, errors: string[] }}
   */
  updateRecord(record, updates) {
    // Apply updates
    if (updates.validUntil !== undefined) record.validUntil = updates.validUntil;
    if (updates.performedBy !== undefined) record.performedBy = updates.performedBy;
    if (updates.laboratory !== undefined) record.laboratory = updates.laboratory;
    if (updates.certificateNumber !== undefined) record.certificateNumber = updates.certificateNumber;
    if (updates.certificateUrl !== undefined) record.certificateUrl = updates.certificateUrl;
    if (updates.coefficients !== undefined) record.coefficients = updates.coefficients;
    if (updates.referencePanel !== undefined) record.referencePanel = updates.referencePanel;
    if (updates.referenceStandard !== undefined) record.referenceStandard = updates.referenceStandard;
    if (updates.temperature !== undefined) record.temperature = updates.temperature;
    if (updates.humidity !== undefined) record.humidity = updates.humidity;
    if (updates.uncertainty !== undefined) record.uncertainty = updates.uncertainty;
    if (updates.rmse !== undefined) record.rmse = updates.rmse;
    if (updates.r2 !== undefined) record.r2 = updates.r2;
    if (updates.description !== undefined) record.description = updates.description;
    if (updates.methodology !== undefined) record.methodology = updates.methodology;
    if (updates.notes !== undefined) record.notes = updates.notes;
    if (updates.attachments !== undefined) record.attachments = updates.attachments;
    if (updates.metadata !== undefined) record.metadata = { ...record.metadata, ...updates.metadata };

    record.updatedAt = new Date().toISOString();

    const validation = record.validate();
    return {
      record: validation.valid ? record : null,
      errors: validation.errors
    };
  }

  /**
   * Set calibration coefficients for all channels
   * @param {CalibrationRecord} record
   * @param {Object} coefficients - { channel: { gain, offset, ... } }
   * @returns {{ record: CalibrationRecord, errors: string[] }}
   */
  setCoefficients(record, coefficients) {
    const errors = [];

    // Validate coefficient structure
    for (const [channel, coeffs] of Object.entries(coefficients)) {
      if (typeof coeffs !== 'object') {
        errors.push(`Invalid coefficients for channel ${channel}`);
        continue;
      }

      // Validate gain and offset if present
      if (coeffs.gain !== undefined && typeof coeffs.gain !== 'number') {
        errors.push(`Gain for channel ${channel} must be a number`);
      }
      if (coeffs.offset !== undefined && typeof coeffs.offset !== 'number') {
        errors.push(`Offset for channel ${channel} must be a number`);
      }
    }

    if (errors.length > 0) {
      return { record: null, errors };
    }

    record.coefficients = coefficients;
    record.updatedAt = new Date().toISOString();

    return { record, errors: [] };
  }

  /**
   * Expire a calibration record
   * @param {CalibrationRecord} record
   * @returns {CalibrationRecord}
   */
  expireCalibration(record) {
    record.expire();
    return record;
  }

  /**
   * Mark calibration as superseded
   * @param {CalibrationRecord} record
   * @param {number} newCalibrationId
   * @returns {CalibrationRecord}
   */
  supersedeCalibration(record, newCalibrationId) {
    record.supersede(newCalibrationId);
    return record;
  }

  /**
   * Calculate days since last calibration
   * @param {CalibrationRecord} lastRecord
   * @returns {number|null}
   */
  daysSinceLastCalibration(lastRecord) {
    if (!lastRecord || !lastRecord.calibrationDate) {
      return null;
    }

    const calibrationDate = new Date(lastRecord.calibrationDate);
    const now = new Date();
    const diffTime = Math.abs(now - calibrationDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get calibration summary for an instrument
   * @param {CalibrationRecord[]} records
   * @returns {Object}
   */
  getSummary(records) {
    const valid = records.filter(r => r.isCurrentlyValid());
    const expired = records.filter(r => r.isExpired());
    const superseded = records.filter(r => r.status === CalibrationRecord.STATUS.SUPERSEDED);

    const currentCalibration = valid.length > 0 ? valid[0] : null;
    const lastCalibration = records.length > 0 ? records[0] : null;

    const typeBreakdown = {};
    for (const record of records) {
      typeBreakdown[record.calibrationType] = (typeBreakdown[record.calibrationType] || 0) + 1;
    }

    return {
      total: records.length,
      valid: valid.length,
      expired: expired.length,
      superseded: superseded.length,
      typeBreakdown,
      currentCalibration,
      lastCalibration,
      daysSinceLastCalibration: this.daysSinceLastCalibration(lastCalibration),
      daysUntilExpiration: currentCalibration ? currentCalibration.daysUntilExpiration() : null,
      isCurrentlyCalibrated: currentCalibration !== null
    };
  }

  /**
   * Check if instrument needs recalibration
   * @param {CalibrationRecord} currentCalibration
   * @param {number} warningDays - Days before expiration to warn
   * @returns {{ needsRecalibration: boolean, reason: string|null }}
   */
  needsRecalibration(currentCalibration, warningDays = 30) {
    if (!currentCalibration) {
      return {
        needsRecalibration: true,
        reason: 'No valid calibration found'
      };
    }

    if (currentCalibration.isExpired()) {
      return {
        needsRecalibration: true,
        reason: 'Calibration has expired'
      };
    }

    const daysUntil = currentCalibration.daysUntilExpiration();
    if (daysUntil !== null && daysUntil <= warningDays) {
      return {
        needsRecalibration: true,
        reason: `Calibration expires in ${daysUntil} days`
      };
    }

    return {
      needsRecalibration: false,
      reason: null
    };
  }

  /**
   * Get supported calibration types
   * @returns {Object}
   */
  getCalibrationTypes() {
    return CalibrationRecord.TYPES;
  }

  /**
   * Get supported instrument types for calibration
   * @returns {string[]}
   */
  getSupportedInstrumentTypes() {
    return CalibrationRecord.SUPPORTED_INSTRUMENT_TYPES;
  }

  /**
   * Apply calibration coefficients to raw values
   * @param {Object} coefficients - { gain, offset }
   * @param {number} rawValue
   * @returns {number}
   */
  applyCalibration(coefficients, rawValue) {
    const { gain = 1, offset = 0 } = coefficients;
    return rawValue * gain + offset;
  }

  /**
   * Apply calibration to multiple channels
   * @param {CalibrationRecord} calibration
   * @param {Object} rawValues - { channel: value }
   * @returns {Object} - { channel: calibratedValue }
   */
  applyCalibratedValues(calibration, rawValues) {
    const calibratedValues = {};

    for (const [channel, rawValue] of Object.entries(rawValues)) {
      const coeffs = calibration.getChannelCoefficients(channel);
      if (coeffs) {
        calibratedValues[channel] = this.applyCalibration(coeffs, rawValue);
      } else {
        calibratedValues[channel] = rawValue; // No calibration, return raw
      }
    }

    return calibratedValues;
  }
}
