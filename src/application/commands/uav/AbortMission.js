/**
 * Abort Mission Command
 *
 * Application layer command for aborting a UAV mission.
 *
 * @module application/commands/uav/AbortMission
 */

/**
 * Abort Mission Command
 */
export class AbortMission {
  /**
   * @param {Object} dependencies
   */
  constructor({ missionRepository }) {
    this.missionRepository = missionRepository;
  }

  /**
   * Execute the abort mission command
   *
   * @param {Object} input
   * @param {number} input.missionId - Mission ID
   * @param {string} input.reason - Reason for aborting
   * @returns {Promise<Mission>} Aborted mission
   * @throws {Error} If mission not found or cannot be aborted
   */
  async execute(input) {
    const mission = await this.missionRepository.findById(input.missionId);
    if (!mission) {
      throw new Error(`Mission ${input.missionId} not found`);
    }

    // Domain entity handles validation and state transition
    mission.abort(input.reason);

    return await this.missionRepository.save(mission);
  }
}
