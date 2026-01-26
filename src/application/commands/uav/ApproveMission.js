/**
 * Approve Mission Command
 *
 * Application layer command for approving a UAV mission.
 *
 * @module application/commands/uav/ApproveMission
 */

/**
 * Approve Mission Command
 */
export class ApproveMission {
  /**
   * @param {Object} dependencies
   */
  constructor({ missionRepository }) {
    this.missionRepository = missionRepository;
  }

  /**
   * Execute the approve mission command
   *
   * @param {Object} input
   * @param {number} input.missionId - Mission ID
   * @param {number} input.approvedByUserId - Approving user ID
   * @param {string} [input.approvalNotes] - Approval notes
   * @returns {Promise<Mission>} Approved mission
   * @throws {Error} If mission not found or cannot be approved
   */
  async execute(input) {
    const mission = await this.missionRepository.findById(input.missionId);
    if (!mission) {
      throw new Error(`Mission ${input.missionId} not found`);
    }

    // Domain entity handles validation and state transition
    mission.approve(input.approvedByUserId, input.approvalNotes);

    return await this.missionRepository.save(mission);
  }
}
