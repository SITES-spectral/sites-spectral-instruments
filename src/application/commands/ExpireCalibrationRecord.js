/**
 * Expire Calibration Record Command
 *
 * Marks a calibration record as expired when validity period ends
 * or when superseded by a new calibration.
 *
 * @module application/commands/ExpireCalibrationRecord
 */

import { CalibrationService } from '../../domain/index.js';

export class ExpireCalibrationRecord {
  constructor({ calibrationRepository }) {
    this.calibrationRepository = calibrationRepository;
    this.calibrationService = new CalibrationService();
  }

  async execute({ id, reason = 'expired' }) {
    const record = await this.calibrationRepository.findById(id);
    if (!record) {
      throw new Error(`Calibration record with ID ${id} not found`);
    }

    if (record.status === 'expired' || record.status === 'superseded') {
      throw new Error(`Calibration record is already ${record.status}`);
    }

    const { record: expired, errors } = this.calibrationService.expireCalibration(record, reason);

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    return await this.calibrationRepository.save(expired);
  }
}
