/**
 * Get Pilot Statistics Query
 *
 * Application layer query for retrieving flight statistics for a pilot.
 *
 * @module application/queries/uav/GetPilotStatistics
 */

/**
 * Get Pilot Statistics Query
 */
export class GetPilotStatistics {
  /**
   * @param {Object} dependencies
   */
  constructor({ flightLogRepository }) {
    this.flightLogRepository = flightLogRepository;
  }

  /**
   * Execute the query
   *
   * @param {number} pilotId - Pilot ID
   * @returns {Promise<Object>} Pilot statistics
   */
  async execute(pilotId) {
    return await this.flightLogRepository.getPilotStatistics(pilotId);
  }
}
