/**
 * Get User Sessions Query
 *
 * Retrieves user session summaries (login history).
 *
 * @module application/queries/admin/GetUserSessions
 */

export class GetUserSessions {
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
   * @param {boolean} [options.includeInactive=false] - Include inactive users
   * @returns {Promise<Object[]>}
   */
  async execute(options = {}) {
    const { includeInactive = false } = options;

    const sessions = await this.adminRepository.getUserSessions({
      includeInactive
    });

    return sessions.map(session => session.toJSON());
  }
}
