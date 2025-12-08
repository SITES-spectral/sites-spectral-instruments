/**
 * List Calibration Records Query
 *
 * Lists calibration records with filtering options.
 * Only returns records for multispectral/hyperspectral instruments.
 *
 * @module application/queries/ListCalibrationRecords
 */

export class ListCalibrationRecords {
  constructor({ calibrationRepository }) {
    this.calibrationRepository = calibrationRepository;
  }

  async execute(filters = {}) {
    const {
      instrumentId,
      channelId,
      type,
      status,
      startDate,
      endDate,
      limit = 50,
      offset = 0
    } = filters;

    // If instrument ID is provided, get all calibrations for that instrument
    if (instrumentId) {
      return await this.calibrationRepository.findByInstrumentId(instrumentId);
    }

    // General listing with filters
    return await this.calibrationRepository.findAll({
      channelId,
      type,
      status,
      startDate,
      endDate,
      limit,
      offset
    });
  }
}
