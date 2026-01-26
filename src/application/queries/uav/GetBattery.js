/**
 * Get Battery Query
 *
 * Application layer query for retrieving a single battery.
 *
 * @module application/queries/uav/GetBattery
 */

/**
 * Get Battery Query
 */
export class GetBattery {
  /**
   * @param {Object} dependencies
   */
  constructor({ batteryRepository }) {
    this.batteryRepository = batteryRepository;
  }

  /**
   * Get battery by ID
   * @param {number} id - Battery ID
   * @returns {Promise<Battery|null>}
   */
  async byId(id) {
    return await this.batteryRepository.findById(id);
  }

  /**
   * Get battery by serial number
   * @param {string} serialNumber - Battery serial number
   * @returns {Promise<Battery|null>}
   */
  async bySerialNumber(serialNumber) {
    return await this.batteryRepository.findBySerialNumber(serialNumber);
  }
}
