/**
 * Assign Pilot To Mission Command
 *
 * Application layer command for assigning a pilot to a mission.
 *
 * @module application/commands/uav/AssignPilotToMission
 */

/**
 * Assign Pilot To Mission Command
 */
export class AssignPilotToMission {
  /**
   * @param {Object} dependencies
   */
  constructor({ missionRepository, pilotRepository }) {
    this.missionRepository = missionRepository;
    this.pilotRepository = pilotRepository;
  }

  /**
   * Execute the assign pilot command
   *
   * @param {Object} input
   * @param {number} input.missionId - Mission ID
   * @param {number} input.pilotId - Pilot ID
   * @param {string} [input.role='pilot'] - Role in mission
   * @param {number} [input.assignedByUserId] - User assigning the pilot
   * @returns {Promise<boolean>} True if assigned
   * @throws {Error} If mission or pilot not found
   */
  async execute(input) {
    const { missionId, pilotId, role = 'pilot', assignedByUserId } = input;

    // Verify mission exists
    const mission = await this.missionRepository.findById(missionId);
    if (!mission) {
      throw new Error(`Mission ${missionId} not found`);
    }

    // Verify pilot exists and can fly
    const pilot = await this.pilotRepository.findById(pilotId);
    if (!pilot) {
      throw new Error(`Pilot ${pilotId} not found`);
    }

    // Check if pilot can fly
    if (!pilot.canFly()) {
      throw new Error(`Pilot ${pilot.full_name} cannot fly - check certificate and insurance status`);
    }

    // Check if pilot is authorized for the station
    if (!pilot.isAuthorizedForStation(mission.station_id)) {
      throw new Error(`Pilot ${pilot.full_name} is not authorized to fly at station ${mission.station_id}`);
    }

    // Assign pilot to mission
    const assigned = await this.missionRepository.addPilotToMission(
      missionId,
      pilotId,
      role,
      assignedByUserId
    );

    if (!assigned) {
      throw new Error(`Pilot ${pilotId} is already assigned to mission ${missionId}`);
    }

    return true;
  }
}
