/**
 * Admin Repository Port (Interface)
 *
 * Defines the contract for admin data access.
 * Implementations must be provided by infrastructure layer.
 *
 * @module domain/admin/AdminRepository
 */

/**
 * Admin Repository Interface
 *
 * @interface AdminRepository
 */
export class AdminRepository {
  /**
   * Get activity logs with filtering and pagination
   *
   * @param {Object} options - Query options
   * @param {number} [options.stationId] - Filter by station ID
   * @param {number} [options.userId] - Filter by user ID
   * @param {string} [options.action] - Filter by action type
   * @param {string} [options.entityType] - Filter by entity type
   * @param {Date} [options.startDate] - Filter from date
   * @param {Date} [options.endDate] - Filter to date
   * @param {number} [options.limit=100] - Maximum records to return
   * @param {number} [options.offset=0] - Offset for pagination
   * @returns {Promise<{items: ActivityLog[], total: number}>}
   */
  async getActivityLogs(options) {
    throw new Error('AdminRepository.getActivityLogs must be implemented');
  }

  /**
   * Get user session summaries (login history)
   *
   * @param {Object} options - Query options
   * @param {boolean} [options.includeInactive=false] - Include inactive users
   * @returns {Promise<UserSessionSummary[]>}
   */
  async getUserSessions(options) {
    throw new Error('AdminRepository.getUserSessions must be implemented');
  }

  /**
   * Get station activity statistics
   *
   * @param {Object} options - Query options
   * @param {Date} [options.startDate] - Filter from date
   * @param {Date} [options.endDate] - Filter to date
   * @returns {Promise<StationActivityStats[]>}
   */
  async getStationStats(options) {
    throw new Error('AdminRepository.getStationStats must be implemented');
  }

  /**
   * Log an activity
   *
   * @param {Object} data - Activity data
   * @param {number} [data.userId] - User ID
   * @param {string} [data.username] - Username
   * @param {string} data.action - Action type
   * @param {string} data.entityType - Entity type
   * @param {number} [data.entityId] - Entity ID
   * @param {string} [data.entityName] - Entity name
   * @param {Object} [data.details] - Additional details
   * @param {string} [data.ipAddress] - Client IP
   * @param {string} [data.userAgent] - Client user agent
   * @returns {Promise<ActivityLog>}
   */
  async logActivity(data) {
    throw new Error('AdminRepository.logActivity must be implemented');
  }

  /**
   * Get system health metrics
   *
   * @returns {Promise<Object>}
   */
  async getSystemHealth() {
    throw new Error('AdminRepository.getSystemHealth must be implemented');
  }
}
