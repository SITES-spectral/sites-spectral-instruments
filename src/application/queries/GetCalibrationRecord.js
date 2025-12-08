/**
 * Get Calibration Record Query
 *
 * Retrieves a single calibration record by ID.
 *
 * @module application/queries/GetCalibrationRecord
 */

export class GetCalibrationRecord {
  constructor({ calibrationRepository }) {
    this.calibrationRepository = calibrationRepository;
  }

  async execute(id) {
    const record = await this.calibrationRepository.findById(id);
    if (!record) {
      throw new Error(`Calibration record with ID ${id} not found`);
    }
    return record;
  }
}
