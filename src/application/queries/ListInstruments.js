/**
 * List Instruments Query
 *
 * Application layer query for listing instruments with pagination and filtering.
 *
 * @module application/queries/ListInstruments
 */

/**
 * @typedef {Object} ListInstrumentsInput
 * @property {number} [platformId] - Filter by platform ID
 * @property {number} [stationId] - Filter by station ID
 * @property {string} [instrumentType] - Filter by instrument type
 * @property {string} [status] - Filter by status
 * @property {number} [page=1] - Page number (1-indexed)
 * @property {number} [limit=20] - Items per page
 * @property {string} [sortBy='normalized_name'] - Sort field
 * @property {string} [sortOrder='asc'] - Sort order
 */

/**
 * List Instruments Query
 */
export class ListInstruments {
  /**
   * @param {Object} dependencies
   * @param {import('../../domain/instrument/InstrumentRepository.js').InstrumentRepository} dependencies.instrumentRepository
   */
  constructor({ instrumentRepository }) {
    this.instrumentRepository = instrumentRepository;
  }

  /**
   * Execute the list instruments query
   *
   * @param {ListInstrumentsInput} [input={}] - Query options
   * @returns {Promise<{items: Array, pagination: Object}>}
   */
  async execute(input = {}) {
    const {
      platformId,
      stationId,
      instrumentType,
      status,
      page = 1,
      limit = 20,
      sortBy = 'normalized_name',
      sortOrder = 'asc'
    } = input;

    // Build filter
    const filter = {};
    if (platformId) filter.platformId = platformId;
    if (stationId) filter.stationId = stationId;
    if (instrumentType) filter.instrumentType = instrumentType;
    if (status) filter.status = status;

    // Get total count with filter
    const total = await this.instrumentRepository.count(filter);

    // Calculate pagination
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    // Get paginated instruments
    const instruments = await this.instrumentRepository.findAll({
      ...filter,
      limit,
      offset,
      sortBy,
      sortOrder
    });

    return {
      items: instruments,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }

  /**
   * Get instruments by platform ID (convenience method)
   *
   * @param {number} platformId - Platform ID
   * @returns {Promise<Array>}
   */
  async byPlatformId(platformId) {
    return await this.instrumentRepository.findByPlatformId(platformId);
  }

  /**
   * Get instruments by station ID (convenience method)
   *
   * @param {number} stationId - Station ID
   * @returns {Promise<Array>}
   */
  async byStationId(stationId) {
    return await this.instrumentRepository.findByStationId(stationId);
  }
}
