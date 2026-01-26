/**
 * List Pilots Query
 *
 * Application layer query for listing pilots with filtering and pagination.
 *
 * @module application/queries/uav/ListPilots
 */

/**
 * List Pilots Query
 */
export class ListPilots {
  /**
   * @param {Object} dependencies
   */
  constructor({ pilotRepository }) {
    this.pilotRepository = pilotRepository;
  }

  /**
   * Execute the list pilots query
   *
   * @param {Object} options
   * @param {number} [options.page=1] - Page number
   * @param {number} [options.limit=25] - Items per page
   * @param {string} [options.status] - Filter by status
   * @param {number} [options.stationId] - Filter by station authorization
   * @param {string} [options.sortBy='full_name'] - Sort field
   * @param {string} [options.sortOrder='asc'] - Sort order
   * @returns {Promise<{items: Pilot[], pagination: Object}>}
   */
  async execute(options = {}) {
    const {
      page = 1,
      limit = 25,
      status,
      stationId,
      sortBy = 'full_name',
      sortOrder = 'asc'
    } = options;

    const offset = (page - 1) * limit;

    // If filtering by station, use station-specific method
    if (stationId) {
      const pilots = await this.pilotRepository.findByStationAuthorization(stationId);
      const filteredPilots = status
        ? pilots.filter(p => p.status === status)
        : pilots;

      return {
        items: filteredPilots.slice(offset, offset + limit),
        pagination: {
          page,
          limit,
          total: filteredPilots.length,
          totalPages: Math.ceil(filteredPilots.length / limit)
        }
      };
    }

    // General listing
    const result = await this.pilotRepository.findAll({
      limit,
      offset,
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
