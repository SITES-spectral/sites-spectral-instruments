/**
 * Update Calibration Record Command
 *
 * Updates an existing calibration record.
 *
 * @module application/commands/UpdateCalibrationRecord
 */

import { CalibrationService } from '../../domain/index.js';

export class UpdateCalibrationRecord {
  constructor({ calibrationRepository }) {
    this.calibrationRepository = calibrationRepository;
    this.calibrationService = new CalibrationService();
  }

  async execute(data) {
    const record = await this.calibrationRepository.findById(data.id);
    if (!record) {
      throw new Error(`Calibration record with ID ${data.id} not found`);
    }

    const { record: updated, errors } = this.calibrationService.updateRecord(record, data);

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    return await this.calibrationRepository.save(updated);
  }
}
