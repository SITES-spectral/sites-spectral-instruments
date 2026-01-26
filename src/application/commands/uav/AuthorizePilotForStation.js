/**
 * Authorize Pilot For Station Command
 *
 * Application layer command for authorizing a pilot to fly at a station.
 *
 * @module application/commands/uav/AuthorizePilotForStation
 */

/**
 * Authorize Pilot For Station Command
 */
export class AuthorizePilotForStation {
  /**
   * @param {Object} dependencies
   */
  constructor({ pilotRepository, stationRepository }) {
    this.pilotRepository = pilotRepository;
    this.stationRepository = stationRepository;
  }

  /**
   * Execute the authorize pilot command
   *
   * @param {Object} input
   * @param {number} input.pilotId - Pilot ID
   * @param {number} input.stationId - Station ID to authorize
   * @returns {Promise<Pilot>} Updated pilot
   * @throws {Error} If pilot or station not found
   */
  async execute(input) {
    const { pilotId, stationId } = input;

    // Verify station exists
    const station = await this.stationRepository.findById(stationId);
    if (!station) {
      throw new Error(`Station ${stationId} not found`);
    }

    // Authorize pilot (repository handles existing check)
    return await this.pilotRepository.authorizeForStation(pilotId, stationId);
  }
}
