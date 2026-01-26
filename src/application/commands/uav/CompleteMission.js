/**
 * Complete Mission Command
 *
 * Application layer command for completing a UAV mission.
 *
 * @module application/commands/uav/CompleteMission
 */

/**
 * Complete Mission Command
 */
export class CompleteMission {
  /**
   * @param {Object} dependencies
   */
  constructor({ missionRepository }) {
    this.missionRepository = missionRepository;
  }

  /**
   * Execute the complete mission command
   *
   * @param {Object} input
   * @param {number} input.missionId - Mission ID
   * @param {number} [input.data_collected_gb] - Data collected in GB
   * @param {number} [input.images_captured] - Number of images captured
   * @param {number} [input.coverage_achieved_percent] - Coverage percentage
   * @param {number} [input.quality_score] - Quality score (0-100)
   * @returns {Promise<Mission>} Completed mission
   * @throws {Error} If mission not found or cannot be completed
   */
  async execute(input) {
    const mission = await this.missionRepository.findById(input.missionId);
    if (!mission) {
      throw new Error(`Mission ${input.missionId} not found`);
    }

    // Domain entity handles validation and state transition
    mission.complete({
      data_collected_gb: input.data_collected_gb,
      images_captured: input.images_captured,
      coverage_achieved_percent: input.coverage_achieved_percent,
      quality_score: input.quality_score
    });

    return await this.missionRepository.save(mission);
  }
}
