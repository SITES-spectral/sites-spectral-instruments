/**
 * List Platforms Query
 *
 * Application layer query for listing platforms with pagination and filtering.
 *
 * @module application/queries/ListPlatforms
 */

/**
 * @typedef {Object} ListPlatformsInput
 * @property {number} [stationId] - Filter by station ID
 * @property {string} [platformType] - Filter by platform type
 * @property {string} [ecosystemCode] - Filter by ecosystem code
 * @property {number} [page=1] - Page number (1-indexed)
 * @property {number} [limit=20] - Items per page
 * @property {string} [sortBy='normalized_name'] - Sort field
 * @property {string} [sortOrder='asc'] - Sort order
 */

/**
 * List Platforms Query
 */
export class ListPlatforms {
  /**
   * @param {Object} dependencies
   * @param {import('../../domain/platform/PlatformRepository.js').PlatformRepository} dependencies.platformRepository
   */
  constructor({ platformRepository }) {
    this.platformRepository = platformRepository;
  }

  /**
   * Execute the list platforms query
   *
   * @param {ListPlatformsInput} [input={}] - Query options
   * @returns {Promise<{items: Array, pagination: Object}>}
   */
  async execute(input = {}) {
    const {
      stationId,
      platformType,
      ecosystemCode,
      page = 1,
      limit = 20,
      sortBy = 'normalized_name',
      sortOrder = 'asc'
    } = input;

    // Build filter
    const filter = {};
    if (stationId) filter.stationId = stationId;
    if (platformType) filter.platformType = platformType;
    if (ecosystemCode) filter.ecosystemCode = ecosystemCode;

    // Get total count with filter
    const total = await this.platformRepository.count(filter);

    // Calculate pagination
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    // Get paginated platforms
    const platforms = await this.platformRepository.findAll({
      ...filter,
      limit,
      offset,
      sortBy,
      sortOrder
    });

    return {
      items: platforms,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }

  /**
   * Get platforms by station ID (convenience method)
   *
   * @param {number} stationId - Station ID
   * @returns {Promise<Array>}
   */
  async byStationId(stationId) {
    return await this.platformRepository.findByStationId(stationId);
  }
}
