/**
 * Remove Pilot From Mission Command
 *
 * Application layer command for removing a pilot from a mission.
 *
 * @module application/commands/uav/RemovePilotFromMission
 */

/**
 * Remove Pilot From Mission Command
 */
export class RemovePilotFromMission {
  /**
   * @param {Object} dependencies
   */
  constructor({ missionRepository, pilotRepository }) {
    this.missionRepository = missionRepository;
    this.pilotRepository = pilotRepository;
  }

  /**
   * Execute the remove pilot command
   *
   * @param {Object} input
   * @param {number} input.missionId - Mission ID
   * @param {number} input.pilotId - Pilot ID
   * @returns {Promise<boolean>} True if removed
   * @throws {Error} If mission or pilot not found, or pilot not assigned
   */
  async execute(input) {
    const { missionId, pilotId } = input;

    // Verify mission exists
    const mission = await this.missionRepository.findById(missionId);
    if (!mission) {
      throw new Error(`Mission ${missionId} not found`);
    }

    // Verify pilot exists
    const pilot = await this.pilotRepository.findById(pilotId);
    if (!pilot) {
      throw new Error(`Pilot ${pilotId} not found`);
    }

    // Remove pilot from mission
    const removed = await this.missionRepository.removePilotFromMission(missionId, pilotId);

    if (!removed) {
      throw new Error(`Pilot ${pilotId} is not assigned to mission ${missionId}`);
    }

    return true;
  }
}
