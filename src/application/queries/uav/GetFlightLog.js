/**
 * Get Flight Log Query
 *
 * Application layer query for retrieving a single flight log.
 *
 * @module application/queries/uav/GetFlightLog
 */

/**
 * Get Flight Log Query
 */
export class GetFlightLog {
  /**
   * @param {Object} dependencies
   */
  constructor({ flightLogRepository }) {
    this.flightLogRepository = flightLogRepository;
  }

  /**
   * Get flight log by ID
   * @param {number} id - Flight log ID
   * @returns {Promise<FlightLog|null>}
   */
  async byId(id) {
    return await this.flightLogRepository.findById(id);
  }
}
