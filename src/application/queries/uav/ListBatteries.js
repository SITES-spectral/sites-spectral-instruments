/**
 * List Batteries Query
 *
 * Application layer query for listing batteries with filtering and pagination.
 *
 * @module application/queries/uav/ListBatteries
 */

/**
 * List Batteries Query
 */
export class ListBatteries {
  /**
   * @param {Object} dependencies
   */
  constructor({ batteryRepository }) {
    this.batteryRepository = batteryRepository;
  }

  /**
   * Execute the list batteries query
   *
   * @param {Object} options
   * @param {number} [options.page=1] - Page number
   * @param {number} [options.limit=25] - Items per page
   * @param {number} [options.stationId] - Filter by station
   * @param {string} [options.status] - Filter by status
   * @param {string} [options.sortBy='serial_number'] - Sort field
   * @param {string} [options.sortOrder='asc'] - Sort order
   * @returns {Promise<{items: Battery[], pagination: Object}>}
   */
  async execute(options = {}) {
    const {
      page = 1,
      limit = 25,
      stationId,
      status,
      sortBy = 'serial_number',
      sortOrder = 'asc'
    } = options;

    const offset = (page - 1) * limit;

    const result = await this.batteryRepository.findAll({
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
