/**
 * Get Mission Query
 *
 * Application layer query for retrieving a single mission.
 *
 * @module application/queries/uav/GetMission
 */

/**
 * Get Mission Query
 */
export class GetMission {
  /**
   * @param {Object} dependencies
   */
  constructor({ missionRepository }) {
    this.missionRepository = missionRepository;
  }

  /**
   * Get mission by ID
   * @param {number} id - Mission ID
   * @returns {Promise<Mission|null>}
   */
  async byId(id) {
    return await this.missionRepository.findById(id);
  }

  /**
   * Get mission by mission code
   * @param {string} missionCode - Mission code
   * @returns {Promise<Mission|null>}
   */
  async byMissionCode(missionCode) {
    return await this.missionRepository.findByMissionCode(missionCode);
  }
}
