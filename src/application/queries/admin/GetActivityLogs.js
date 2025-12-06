/**
 * Get Activity Logs Query
 *
 * Retrieves activity logs with filtering and pagination.
 *
 * @module application/queries/admin/GetActivityLogs
 */

export class GetActivityLogs {
  /**
   * @param {AdminRepository} adminRepository
   */
  constructor(adminRepository) {
    this.adminRepository = adminRepository;
  }

  /**
   * Execute the query
   *
   * @param {Object} options - Query options
   * @param {number} [options.stationId] - Filter by station ID
   * @param {number} [options.userId] - Filter by user ID
   * @param {string} [options.action] - Filter by action type
   * @param {string} [options.entityType] - Filter by entity type
   * @param {string} [options.startDate] - ISO date string for start filter
   * @param {string} [options.endDate] - ISO date string for end filter
   * @param {number} [options.limit=100] - Maximum records
   * @param {number} [options.offset=0] - Pagination offset
   * @returns {Promise<{items: Object[], total: number, pagination: Object}>}
   */
  async execute(options = {}) {
    const {
      stationId,
      userId,
      action,
      entityType,
      startDate,
      endDate,
      limit = 100,
      offset = 0
    } = options;

    // Validate and parse dates
    const parsedStartDate = startDate ? new Date(startDate) : null;
    const parsedEndDate = endDate ? new Date(endDate) : null;

    // Validate limit
    const safeLimit = Math.min(Math.max(1, limit), 1000);

    const result = await this.adminRepository.getActivityLogs({
      stationId,
      userId,
      action,
      entityType,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      limit: safeLimit,
      offset: Math.max(0, offset)
    });

    return {
      items: result.items.map(item => item.toJSON()),
      total: result.total,
      pagination: {
        limit: safeLimit,
        offset,
        hasMore: offset + result.items.length < result.total
      }
    };
  }
}
