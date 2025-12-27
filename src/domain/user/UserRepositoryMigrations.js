/**
 * User Repository Migration Factory
 *
 * Provides migration paths between User Repository versions.
 * Enables gradual migration from V1 to V2 without rewriting adapters.
 *
 * ## Usage
 *
 * ```javascript
 * import { userRepositoryMigrations } from './UserRepositoryMigrations.js';
 *
 * // Wrap a V1 adapter to implement V2 interface
 * const v1Adapter = new D1UserRepositoryV1(db);
 * const v2Adapter = userRepositoryMigrations.migrate(v1Adapter, 'V1', 'V2');
 *
 * // Now v2Adapter supports all V2 methods
 * const user = await v2Adapter.findByEmail('user@example.com');
 * ```
 *
 * @module domain/user/UserRepositoryMigrations
 * @version 13.5.0
 */

import { AdapterMigrationFactory, adaptMethod } from '../shared/versioning/VersionedPortAdapter.js';

/**
 * Create V1 -> V2 migration extensions
 *
 * Implements V2 methods using V1 methods where possible,
 * or provides reasonable defaults/stubs for new functionality.
 *
 * @param {Object} v1Adapter - The V1 adapter to extend
 * @returns {Object} Extension methods for V2
 */
function createV1ToV2Extensions(v1Adapter) {
  return {
    /**
     * findByEmail - Implement using findAll with filter
     * Note: Less efficient than native implementation
     */
    async findByEmail(email) {
      // V1 doesn't have email lookup, so we search all users
      // In production, this should be implemented natively in V2 adapter
      const users = await v1Adapter.findAll({});

      // Linear search - inefficient but works for migration
      for (const user of users) {
        if (user.email === email) {
          return user;
        }
      }
      return null;
    },

    /**
     * findByStationWithPermissions - Implement using findAll
     */
    async findByStationWithPermissions(stationId) {
      const users = await v1Adapter.findAll({ stationId });

      // V1 doesn't have separate permissions table, extract from user
      return users.map(user => ({
        user,
        permissions: user.permissions || ['read']
      }));
    },

    /**
     * updateLastLogin - V1 doesn't track this, return true (no-op)
     */
    async updateLastLogin(userId, timestamp = new Date()) {
      // V1 doesn't support last login tracking
      // Log warning in development
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `[UserRepositoryV1->V2] updateLastLogin not available in V1, ` +
          `upgrade to native V2 adapter for full functionality`
        );
      }
      return true;
    },

    /**
     * hasPermission - Implement by loading user and checking permissions
     */
    async hasPermission(userId, permission, context = {}) {
      const user = await v1Adapter.findById(userId);
      if (!user) return false;

      const permissions = user.permissions || [];

      // Admin has all permissions
      if (user.role === 'admin') return true;

      // Check direct permission
      if (permissions.includes(permission)) return true;

      // Check station-specific context
      if (context.stationId && user.station_id) {
        if (user.station_id === context.stationId) {
          return permissions.includes(permission);
        }
        return false; // Different station
      }

      return false;
    },

    /**
     * findByPermission - Filter users by permission
     */
    async findByPermission(permission, context = {}) {
      const allUsers = await v1Adapter.findAll({});

      return allUsers.filter(user => {
        const permissions = user.permissions || [];

        if (user.role === 'admin') return true;
        if (!permissions.includes(permission)) return false;

        if (context.stationId && user.station_id) {
          return user.station_id === context.stationId;
        }

        return true;
      });
    },

    /**
     * getActivitySummary - V1 doesn't track activity, return empty
     */
    async getActivitySummary(userId, options = {}) {
      // V1 doesn't have activity tracking
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `[UserRepositoryV1->V2] getActivitySummary not available in V1, ` +
          `upgrade to native V2 adapter for full functionality`
        );
      }
      return [];
    },

    /**
     * bulkCheckPermission - Check permissions for multiple users
     */
    async bulkCheckPermission(userIds, permission, context = {}) {
      const results = new Map();

      // Load all users in parallel
      const userPromises = userIds.map(id => v1Adapter.findById(id));
      const users = await Promise.all(userPromises);

      for (let i = 0; i < userIds.length; i++) {
        const user = users[i];
        if (!user) {
          results.set(userIds[i], false);
          continue;
        }

        const permissions = user.permissions || [];

        if (user.role === 'admin') {
          results.set(userIds[i], true);
        } else if (permissions.includes(permission)) {
          if (context.stationId && user.station_id) {
            results.set(userIds[i], user.station_id === context.stationId);
          } else {
            results.set(userIds[i], true);
          }
        } else {
          results.set(userIds[i], false);
        }
      }

      return results;
    }
  };
}

/**
 * User Repository Migration Factory
 *
 * Pre-configured with V1 -> V2 migration path.
 */
export const userRepositoryMigrations = new AdapterMigrationFactory({
  'V1 -> V2': createV1ToV2Extensions
});

/**
 * Convenience function to migrate V1 adapter to V2
 *
 * @param {Object} v1Adapter - V1 adapter instance
 * @param {Object} [options] - Additional options
 * @returns {Object} V2-compatible adapter
 */
export function migrateUserRepositoryV1ToV2(v1Adapter, options = {}) {
  return userRepositoryMigrations.migrate(v1Adapter, 'V1', 'V2', options);
}

/**
 * Check if an adapter implements V2 natively
 *
 * @param {Object} adapter - Adapter to check
 * @returns {boolean} True if native V2
 */
export function isNativeV2Adapter(adapter) {
  // Native V2 adapters have these methods without shims
  const v2Methods = [
    'findByEmail',
    'findByStationWithPermissions',
    'updateLastLogin',
    'hasPermission',
    'findByPermission',
    'getActivitySummary',
    'bulkCheckPermission'
  ];

  // Check if adapter has all V2 methods and is not a wrapped adapter
  const hasAllMethods = v2Methods.every(method => typeof adapter[method] === 'function');
  const isNotWrapped = !adapter._baseAdapter;

  return hasAllMethods && isNotWrapped;
}
