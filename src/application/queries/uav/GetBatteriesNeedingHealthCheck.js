/**
 * Get Batteries Needing Health Check Query
 *
 * Application layer query for finding batteries that need a health check.
 *
 * @module application/queries/uav/GetBatteriesNeedingHealthCheck
 */

/**
 * Get Batteries Needing Health Check Query
 */
export class GetBatteriesNeedingHealthCheck {
  /**
   * @param {Object} dependencies
   */
  constructor({ batteryRepository }) {
    this.batteryRepository = batteryRepository;
  }

  /**
   * Execute the query
   *
   * @param {Object} options
   * @param {number} [options.days=30] - Days since last health check
   * @returns {Promise<Battery[]>}
   */
  async execute(options = {}) {
    const { days = 30 } = options;
    return await this.batteryRepository.findNeedingHealthCheck(days);
  }
}
