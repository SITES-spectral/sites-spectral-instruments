/**
 * List Flight Logs Query
 *
 * Application layer query for listing flight logs with filtering and pagination.
 *
 * @module application/queries/uav/ListFlightLogs
 */

/**
 * List Flight Logs Query
 */
export class ListFlightLogs {
  /**
   * @param {Object} dependencies
   */
  constructor({ flightLogRepository }) {
    this.flightLogRepository = flightLogRepository;
  }

  /**
   * Execute the list flight logs query
   *
   * @param {Object} options
   * @param {number} [options.page=1] - Page number
   * @param {number} [options.limit=25] - Items per page
   * @param {number} [options.missionId] - Filter by mission
   * @param {number} [options.pilotId] - Filter by pilot
   * @param {number} [options.platformId] - Filter by platform
   * @param {string} [options.sortBy='takeoff_time'] - Sort field
   * @param {string} [options.sortOrder='desc'] - Sort order
   * @returns {Promise<{items: FlightLog[], pagination: Object}>}
   */
  async execute(options = {}) {
    const {
      page = 1,
      limit = 25,
      missionId,
      pilotId,
      platformId,
      sortBy = 'takeoff_time',
      sortOrder = 'desc'
    } = options;

    const offset = (page - 1) * limit;

    const result = await this.flightLogRepository.findAll({
      limit,
      offset,
      missionId,
      pilotId,
      platformId,
      sortBy,
      sortOrder
    });

    return {
      items: result.items,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit)
      }
    };
  }
}
