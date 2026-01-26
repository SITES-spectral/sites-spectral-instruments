/**
 * Delete Battery Command
 *
 * Application layer command for deleting a UAV battery.
 *
 * @module application/commands/uav/DeleteBattery
 */

/**
 * Delete Battery Command
 */
export class DeleteBattery {
  /**
   * @param {Object} dependencies
   */
  constructor({ batteryRepository }) {
    this.batteryRepository = batteryRepository;
  }

  /**
   * Execute the delete battery command
   *
   * @param {number} id - Battery ID
   * @returns {Promise<boolean>} True if deleted
   * @throws {Error} If battery not found
   */
  async execute(id) {
    const existing = await this.batteryRepository.findById(id);
    if (!existing) {
      throw new Error(`Battery ${id} not found`);
    }

    return await this.batteryRepository.delete(id);
  }
}
