/**
 * Start Mission Command
 *
 * Application layer command for starting a UAV mission.
 *
 * @module application/commands/uav/StartMission
 */

/**
 * Start Mission Command
 */
export class StartMission {
  /**
   * @param {Object} dependencies
   */
  constructor({ missionRepository }) {
    this.missionRepository = missionRepository;
  }

  /**
   * Execute the start mission command
   *
   * @param {number} missionId - Mission ID
   * @returns {Promise<Mission>} Started mission
   * @throws {Error} If mission not found or cannot be started
   */
  async execute(missionId) {
    const mission = await this.missionRepository.findById(missionId);
    if (!mission) {
      throw new Error(`Mission ${missionId} not found`);
    }

    // Domain entity handles validation and state transition
    mission.start();

    return await this.missionRepository.save(mission);
  }
}
