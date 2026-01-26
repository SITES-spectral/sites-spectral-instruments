/**
 * Get Pending Missions Query
 *
 * Application layer query for retrieving missions pending approval.
 *
 * @module application/queries/uav/GetPendingMissions
 */

/**
 * Get Pending Missions Query
 */
export class GetPendingMissions {
  /**
   * @param {Object} dependencies
   */
  constructor({ missionRepository }) {
    this.missionRepository = missionRepository;
  }

  /**
   * Execute the query
   *
   * @returns {Promise<Mission[]>} Missions pending approval
   */
  async execute() {
    return await this.missionRepository.findPendingApproval();
  }
}
