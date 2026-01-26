/**
 * Retire Battery Command
 *
 * Application layer command for retiring a UAV battery.
 *
 * @module application/commands/uav/RetireBattery
 */

/**
 * Retire Battery Command
 */
export class RetireBattery {
  /**
   * @param {Object} dependencies
   */
  constructor({ batteryRepository }) {
    this.batteryRepository = batteryRepository;
  }

  /**
   * Execute the retire battery command
   *
   * @param {Object} input
   * @param {number} input.batteryId - Battery ID
   * @param {string} [input.reason] - Reason for retirement
   * @returns {Promise<Battery>} Retired battery
   * @throws {Error} If battery not found
   */
  async execute(input) {
    return await this.batteryRepository.retire(input.batteryId, input.reason);
  }
}
