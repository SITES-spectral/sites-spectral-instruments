/**
 * Delete Calibration Record Command
 *
 * Deletes a calibration record.
 *
 * @module application/commands/DeleteCalibrationRecord
 */

export class DeleteCalibrationRecord {
  constructor({ calibrationRepository }) {
    this.calibrationRepository = calibrationRepository;
  }

  async execute(id) {
    const record = await this.calibrationRepository.findById(id);
    if (!record) {
      throw new Error(`Calibration record with ID ${id} not found`);
    }

    return await this.calibrationRepository.deleteById(id);
  }
}
