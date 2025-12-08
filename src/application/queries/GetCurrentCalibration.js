/**
 * Get Current Calibration Query
 *
 * Retrieves the current valid calibration for an instrument (and optionally a specific channel).
 * This is the calibration that should be used for data processing.
 *
 * @module application/queries/GetCurrentCalibration
 */

import { CalibrationRecord } from '../../domain/index.js';

export class GetCurrentCalibration {
  constructor({ calibrationRepository, instrumentRepository }) {
    this.calibrationRepository = calibrationRepository;
    this.instrumentRepository = instrumentRepository;
  }

  async execute({ instrumentId, channelId = null }) {
    if (!instrumentId) {
      throw new Error('Instrument ID is required');
    }

    // Validate instrument exists and is calibratable
    const instrument = await this.instrumentRepository.findById(instrumentId);
    if (!instrument) {
      throw new Error(`Instrument with ID ${instrumentId} not found`);
    }

    if (!CalibrationRecord.isCalibratableInstrument(instrument.instrumentType)) {
      throw new Error(
        `Calibration is only available for multispectral and hyperspectral sensors. ` +
        `Instrument type '${instrument.instrumentType}' is not calibratable.`
      );
    }

    // Get current valid calibration
    const current = await this.calibrationRepository.findCurrentValid(
      instrumentId,
      channelId
    );

    if (!current) {
      return {
        instrumentId,
        channelId,
        hasValidCalibration: false,
        calibration: null,
        warning: 'No valid calibration found for this instrument'
      };
    }

    // Check if calibration is approaching expiry
    const expiryWarning = this.checkExpiryWarning(current);

    return {
      instrumentId,
      channelId,
      hasValidCalibration: true,
      calibration: current,
      coefficients: current.coefficients,
      warning: expiryWarning
    };
  }

  checkExpiryWarning(calibration) {
    if (!calibration.validUntil) {
      return null;
    }

    const now = new Date();
    const expiry = new Date(calibration.validUntil);
    const daysUntilExpiry = Math.floor((expiry - now) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return `Calibration expired ${Math.abs(daysUntilExpiry)} days ago`;
    } else if (daysUntilExpiry <= 30) {
      return `Calibration expires in ${daysUntilExpiry} days`;
    } else if (daysUntilExpiry <= 90) {
      return `Calibration expires in ${Math.floor(daysUntilExpiry / 30)} months`;
    }

    return null;
  }
}
