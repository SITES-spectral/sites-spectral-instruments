/**
 * User Repository Port V1 (Interface)
 *
 * Version 1 of the User Repository port.
 * This defines the original contract for user persistence.
 *
 * ## Version History
 * - V1 (13.5.0): Initial version with basic CRUD operations
 *
 * @module domain/user/UserRepositoryV1
 * @version 13.5.0
 */

import { VersionedPort, PortVersion, portRegistry } from '../shared/versioning/PortVersion.js';

/**
 * User Repository V1 Interface
 *
 * Basic user operations: find, save, delete.
 */
export class UserRepositoryV1 extends VersionedPort {
  static portName = 'UserRepository';
  static version = new PortVersion(1, 0, 'stable');

  /**
   * Find user by ID
   * @param {number} id - User ID
   * @returns {Promise<User|null>}
   */
  async findById(id) {
    throw new Error('UserRepositoryV1.findById() must be implemented');
  }

  /**
   * Find user by username
   * @param {string} username - Username
   * @returns {Promise<User|null>}
   */
  async findByUsername(username) {
    throw new Error('UserRepositoryV1.findByUsername() must be implemented');
  }

  /**
   * Find all users with optional filtering
   * @param {Object} [filters] - Filter options
   * @param {string} [filters.role] - Filter by role
   * @param {number} [filters.stationId] - Filter by station
   * @returns {Promise<User[]>}
   */
  async findAll(filters = {}) {
    throw new Error('UserRepositoryV1.findAll() must be implemented');
  }

  /**
   * Save a user (insert or update)
   * @param {User} user - User entity
   * @returns {Promise<User>} Saved user with ID
   */
  async save(user) {
    throw new Error('UserRepositoryV1.save() must be implemented');
  }

  /**
   * Delete a user by ID
   * @param {number} id - User ID
   * @returns {Promise<boolean>} True if deleted
   */
  async delete(id) {
    throw new Error('UserRepositoryV1.delete() must be implemented');
  }

  /**
   * Check if username exists
   * @param {string} username - Username to check
   * @param {number} [excludeId] - ID to exclude (for updates)
   * @returns {Promise<boolean>}
   */
  async usernameExists(username, excludeId = null) {
    throw new Error('UserRepositoryV1.usernameExists() must be implemented');
  }
}

// Register with port registry
portRegistry.register(UserRepositoryV1);
