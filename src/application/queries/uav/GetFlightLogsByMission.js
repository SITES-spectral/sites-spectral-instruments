/**
 * Get Flight Logs By Mission Query
 *
 * Application layer query for retrieving flight logs for a specific mission.
 *
 * @module application/queries/uav/GetFlightLogsByMission
 */

/**
 * Get Flight Logs By Mission Query
 */
export class GetFlightLogsByMission {
  /**
   * @param {Object} dependencies
   */
  constructor({ flightLogRepository }) {
    this.flightLogRepository = flightLogRepository;
  }

  /**
   * Execute the query
   *
   * @param {number} missionId - Mission ID
   * @returns {Promise<FlightLog[]>}
   */
  async execute(missionId) {
    return await this.flightLogRepository.findByMissionId(missionId);
  }
}
