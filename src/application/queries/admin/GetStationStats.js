/**
 * Get Station Stats Query
 *
 * Retrieves station activity statistics.
 *
 * @module application/queries/admin/GetStationStats
 */

export class GetStationStats {
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
   * @param {string} [options.startDate] - ISO date string for start filter
   * @param {string} [options.endDate] - ISO date string for end filter
   * @returns {Promise<Object[]>}
   */
  async execute(options = {}) {
    const { startDate, endDate } = options;

    // Validate and parse dates
    const parsedStartDate = startDate ? new Date(startDate) : null;
    const parsedEndDate = endDate ? new Date(endDate) : null;

    const stats = await this.adminRepository.getStationStats({
      startDate: parsedStartDate,
      endDate: parsedEndDate
    });

    return stats.map(stat => stat.toJSON());
  }
}
