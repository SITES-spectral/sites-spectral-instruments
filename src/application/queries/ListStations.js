/**
 * List Stations Query
 *
 * Application layer query for listing stations with pagination.
 *
 * @module application/queries/ListStations
 */

/**
 * @typedef {Object} ListStationsInput
 * @property {number} [page=1] - Page number (1-indexed)
 * @property {number} [limit=20] - Items per page
 * @property {string} [sortBy='acronym'] - Sort field
 * @property {string} [sortOrder='asc'] - Sort order ('asc' or 'desc')
 */

/**
 * @typedef {Object} PaginatedResult
 * @property {Array} items - Station items
 * @property {Object} pagination - Pagination metadata
 * @property {number} pagination.page - Current page
 * @property {number} pagination.limit - Items per page
 * @property {number} pagination.total - Total items
 * @property {number} pagination.totalPages - Total pages
 */

/**
 * List Stations Query
 */
export class ListStations {
  /**
   * @param {Object} dependencies
   * @param {import('../../domain/station/StationRepository.js').StationRepository} dependencies.stationRepository
   */
  constructor({ stationRepository }) {
    this.stationRepository = stationRepository;
  }

  /**
   * Execute the list stations query
   *
   * @param {ListStationsInput} [input={}] - Query options
   * @returns {Promise<PaginatedResult>}
   */
  async execute(input = {}) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'acronym',
      sortOrder = 'asc'
    } = input;

    // Get total count
    const total = await this.stationRepository.count();

    // Calculate pagination
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    // Get paginated stations
    const stations = await this.stationRepository.findAll({
      limit,
      offset,
      sortBy,
      sortOrder
    });

    return {
      items: stations,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }
}
