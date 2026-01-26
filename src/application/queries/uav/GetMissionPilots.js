/**
 * Get Mission Pilots Query
 *
 * Application layer query for retrieving pilots assigned to a mission.
 *
 * @module application/queries/uav/GetMissionPilots
 */

/**
 * Get Mission Pilots Query
 */
export class GetMissionPilots {
  /**
   * @param {Object} dependencies
   */
  constructor({ missionRepository }) {
    this.missionRepository = missionRepository;
  }

  /**
   * Execute the query
   *
   * @param {number} missionId - Mission ID
   * @returns {Promise<Array>} Array of pilot assignments
   */
  async execute(missionId) {
    return await this.missionRepository.getMissionPilots(missionId);
  }
}
