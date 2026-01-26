/**
 * Delete Pilot Command
 *
 * Application layer command for deleting a UAV pilot.
 *
 * @module application/commands/uav/DeletePilot
 */

/**
 * Delete Pilot Command
 */
export class DeletePilot {
  /**
   * @param {Object} dependencies
   * @param {import('../../../infrastructure/persistence/d1/D1PilotRepository.js').D1PilotRepository} dependencies.pilotRepository
   */
  constructor({ pilotRepository }) {
    this.pilotRepository = pilotRepository;
  }

  /**
   * Execute the delete pilot command
   *
   * @param {number} id - Pilot ID
   * @returns {Promise<boolean>} True if deleted
   * @throws {Error} If pilot not found
   */
  async execute(id) {
    const existing = await this.pilotRepository.findById(id);
    if (!existing) {
      throw new Error(`Pilot ${id} not found`);
    }

    return await this.pilotRepository.delete(id);
  }
}
