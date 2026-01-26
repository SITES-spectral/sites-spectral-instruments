/**
 * Get Pilot Query
 *
 * Application layer query for retrieving a single pilot.
 *
 * @module application/queries/uav/GetPilot
 */

/**
 * Get Pilot Query
 */
export class GetPilot {
  /**
   * @param {Object} dependencies
   */
  constructor({ pilotRepository }) {
    this.pilotRepository = pilotRepository;
  }

  /**
   * Get pilot by ID
   * @param {number} id - Pilot ID
   * @returns {Promise<Pilot|null>}
   */
  async byId(id) {
    return await this.pilotRepository.findById(id);
  }

  /**
   * Get pilot by email
   * @param {string} email - Pilot email
   * @returns {Promise<Pilot|null>}
   */
  async byEmail(email) {
    return await this.pilotRepository.findByEmail(email);
  }

  /**
   * Get pilot by user ID
   * @param {number} userId - User ID
   * @returns {Promise<Pilot|null>}
   */
  async byUserId(userId) {
    return await this.pilotRepository.findByUserId(userId);
  }
}
