/**
 * User Repository Port V2 (Interface)
 *
 * Version 2 of the User Repository port.
 * Extends V1 with additional search and permission methods.
 *
 * ## Version History
 * - V1 (13.5.0): Initial version with basic CRUD operations
 * - V2 (13.5.0): Added email lookup, permission checks, activity tracking
 *
 * ## Breaking Changes from V1
 * None - V2 is fully backward compatible with V1.
 *
 * ## New Features in V2
 * - findByEmail(): Look up users by email
 * - findByStationWithPermissions(): Get users with permission details
 * - updateLastLogin(): Track user login activity
 * - hasPermission(): Check specific permissions
 *
 * @module domain/user/UserRepositoryV2
 * @version 13.5.0
 */

import { PortVersion, portRegistry } from '../shared/versioning/PortVersion.js';
import { UserRepositoryV1 } from './UserRepositoryV1.js';

/**
 * User Repository V2 Interface
 *
 * Extends V1 with email lookup, permissions, and activity tracking.
 */
export class UserRepositoryV2 extends UserRepositoryV1 {
  static portName = 'UserRepository';
  static version = new PortVersion(2, 0, 'stable');

  // ============================================
  // V2 NEW METHODS
  // ============================================

  /**
   * Find user by email address
   * @param {string} email - Email address
   * @returns {Promise<User|null>}
   */
  async findByEmail(email) {
    throw new Error('UserRepositoryV2.findByEmail() must be implemented');
  }

  /**
   * Find users by station with their permissions
   * @param {number} stationId - Station ID
   * @returns {Promise<Array<{user: User, permissions: string[]}>>}
   */
  async findByStationWithPermissions(stationId) {
    throw new Error('UserRepositoryV2.findByStationWithPermissions() must be implemented');
  }

  /**
   * Update user's last login timestamp
   * @param {number} userId - User ID
   * @param {Date} [timestamp=new Date()] - Login timestamp
   * @returns {Promise<boolean>} True if updated
   */
  async updateLastLogin(userId, timestamp = new Date()) {
    throw new Error('UserRepositoryV2.updateLastLogin() must be implemented');
  }

  /**
   * Check if user has a specific permission
   * @param {number} userId - User ID
   * @param {string} permission - Permission to check
   * @param {Object} [context] - Permission context (e.g., stationId)
   * @returns {Promise<boolean>}
   */
  async hasPermission(userId, permission, context = {}) {
    throw new Error('UserRepositoryV2.hasPermission() must be implemented');
  }

  /**
   * Find users with specific permission
   * @param {string} permission - Permission to search for
   * @param {Object} [context] - Permission context
   * @returns {Promise<User[]>}
   */
  async findByPermission(permission, context = {}) {
    throw new Error('UserRepositoryV2.findByPermission() must be implemented');
  }

  /**
   * Get user activity summary
   * @param {number} userId - User ID
   * @param {Object} [options] - Query options
   * @param {Date} [options.since] - Activity since date
   * @param {number} [options.limit=10] - Max records to return
   * @returns {Promise<Array<{action: string, timestamp: Date, details: Object}>>}
   */
  async getActivitySummary(userId, options = {}) {
    throw new Error('UserRepositoryV2.getActivitySummary() must be implemented');
  }

  /**
   * Bulk check permissions for multiple users
   * @param {number[]} userIds - User IDs
   * @param {string} permission - Permission to check
   * @param {Object} [context] - Permission context
   * @returns {Promise<Map<number, boolean>>} Map of userId -> hasPermission
   */
  async bulkCheckPermission(userIds, permission, context = {}) {
    throw new Error('UserRepositoryV2.bulkCheckPermission() must be implemented');
  }
}

// Register with port registry
portRegistry.register(UserRepositoryV2);
