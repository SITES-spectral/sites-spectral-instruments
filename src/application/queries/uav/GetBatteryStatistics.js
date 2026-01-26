/**
 * Get Battery Statistics Query
 *
 * Application layer query for retrieving battery statistics for a station.
 *
 * @module application/queries/uav/GetBatteryStatistics
 */

/**
 * Get Battery Statistics Query
 */
export class GetBatteryStatistics {
  /**
   * @param {Object} dependencies
   */
  constructor({ batteryRepository }) {
    this.batteryRepository = batteryRepository;
  }

  /**
   * Execute the query
   *
   * @param {number} stationId - Station ID
   * @returns {Promise<Object>} Battery statistics
   */
  async execute(stationId) {
    return await this.batteryRepository.getStationStatistics(stationId);
  }
}
