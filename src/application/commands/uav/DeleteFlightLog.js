/**
 * Delete Flight Log Command
 *
 * Application layer command for deleting a flight log.
 *
 * @module application/commands/uav/DeleteFlightLog
 */

/**
 * Delete Flight Log Command
 */
export class DeleteFlightLog {
  /**
   * @param {Object} dependencies
   */
  constructor({ flightLogRepository }) {
    this.flightLogRepository = flightLogRepository;
  }

  /**
   * Execute the delete flight log command
   *
   * @param {number} id - Flight log ID
   * @returns {Promise<boolean>} True if deleted
   * @throws {Error} If flight log not found
   */
  async execute(id) {
    const existing = await this.flightLogRepository.findById(id);
    if (!existing) {
      throw new Error(`Flight log ${id} not found`);
    }

    return await this.flightLogRepository.delete(id);
  }
}
