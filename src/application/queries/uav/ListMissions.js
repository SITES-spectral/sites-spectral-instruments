/**
 * List Missions Query
 *
 * Application layer query for listing missions with filtering and pagination.
 *
 * @module application/queries/uav/ListMissions
 */

/**
 * List Missions Query
 */
export class ListMissions {
  /**
   * @param {Object} dependencies
   */
  constructor({ missionRepository }) {
    this.missionRepository = missionRepository;
  }

  /**
   * Execute the list missions query
   *
   * @param {Object} options
   * @param {number} [options.page=1] - Page number
   * @param {number} [options.limit=25] - Items per page
   * @param {number} [options.stationId] - Filter by station
   * @param {string} [options.status] - Filter by status
   * @param {string} [options.sortBy='planned_date'] - Sort field
   * @param {string} [options.sortOrder='desc'] - Sort order
   * @returns {Promise<{items: Mission[], pagination: Object}>}
   */
  async execute(options = {}) {
    const {
      page = 1,
      limit = 25,
      stationId,
      status,
      sortBy = 'planned_date',
      sortOrder = 'desc'
    } = options;

    const offset = (page - 1) * limit;

    const result = await this.missionRepository.findAll({
      limit,
      offset,
      stationId,
      status,
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
