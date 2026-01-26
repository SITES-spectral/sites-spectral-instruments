/**
 * Record Battery Health Check Command
 *
 * Application layer command for recording a battery health check.
 *
 * @module application/commands/uav/RecordBatteryHealthCheck
 */

/**
 * Record Battery Health Check Command
 */
export class RecordBatteryHealthCheck {
  /**
   * @param {Object} dependencies
   */
  constructor({ batteryRepository }) {
    this.batteryRepository = batteryRepository;
  }

  /**
   * Execute the record health check command
   *
   * @param {Object} input
   * @param {number} input.batteryId - Battery ID
   * @param {number} input.healthPercent - Health percentage (0-100)
   * @param {number} [input.internalResistance] - Internal resistance in milliohms
   * @returns {Promise<Battery>} Updated battery
   * @throws {Error} If battery not found
   */
  async execute(input) {
    return await this.batteryRepository.recordHealthCheck(
      input.batteryId,
      input.healthPercent,
      input.internalResistance
    );
  }
}
