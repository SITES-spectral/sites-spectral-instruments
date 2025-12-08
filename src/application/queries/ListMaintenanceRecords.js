/**
 * List Maintenance Records Query
 *
 * Lists maintenance records with filtering options.
 *
 * @module application/queries/ListMaintenanceRecords
 */

export class ListMaintenanceRecords {
  constructor({ maintenanceRepository }) {
    this.maintenanceRepository = maintenanceRepository;
  }

  async execute(filters = {}) {
    const {
      stationId,
      platformId,
      instrumentId,
      entityType,
      type,
      status,
      priority,
      startDate,
      endDate,
      limit = 50,
      offset = 0
    } = filters;

    // Build query based on provided filters
    if (platformId) {
      return await this.maintenanceRepository.findByPlatformId(platformId);
    }

    if (instrumentId) {
      return await this.maintenanceRepository.findByInstrumentId(instrumentId);
    }

    if (stationId) {
      return await this.maintenanceRepository.findByStationId(stationId);
    }

    // For more complex filtering, use a general find method
    return await this.maintenanceRepository.findAll({
      entityType,
      type,
      status,
      priority,
      startDate,
      endDate,
      limit,
      offset
    });
  }
}
