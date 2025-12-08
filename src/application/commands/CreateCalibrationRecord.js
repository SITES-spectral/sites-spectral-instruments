/**
 * Create Calibration Record Command
 *
 * Creates a new calibration record for a multispectral/hyperspectral instrument.
 * Validates that the instrument type supports calibration.
 *
 * @module application/commands/CreateCalibrationRecord
 */

import { CalibrationService, CalibrationRecord } from '../../domain/index.js';

export class CreateCalibrationRecord {
  constructor({ calibrationRepository, instrumentRepository }) {
    this.calibrationRepository = calibrationRepository;
    this.instrumentRepository = instrumentRepository;
    this.calibrationService = new CalibrationService();
  }

  async execute(data) {
    // Validate instrument exists
    const instrument = await this.instrumentRepository.findById(data.instrumentId);
    if (!instrument) {
      throw new Error(`Instrument with ID ${data.instrumentId} not found`);
    }

    // Validate instrument type supports calibration (multispectral/hyperspectral only)
    if (!CalibrationRecord.isCalibratableInstrument(instrument.instrumentType)) {
      throw new Error(
        `Calibration is only supported for multispectral and hyperspectral sensors. ` +
        `Instrument type '${instrument.instrumentType}' is not calibratable.`
      );
    }

    // Create record with instrument context
    const { record, errors } = this.calibrationService.createRecord({
      ...data,
      instrumentType: instrument.instrumentType
    });

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    // If this calibration is marked as current, expire previous valid calibrations
    if (record.status === 'valid') {
      await this.expirePreviousCalibrations(data.instrumentId, record.channelId);
    }

    return await this.calibrationRepository.save(record);
  }

  async expirePreviousCalibrations(instrumentId, channelId) {
    const current = await this.calibrationRepository.findCurrentValid(
      instrumentId,
      channelId
    );

    if (current) {
      current.status = 'superseded';
      current.updatedAt = new Date().toISOString();
      await this.calibrationRepository.save(current);
    }
  }
}
