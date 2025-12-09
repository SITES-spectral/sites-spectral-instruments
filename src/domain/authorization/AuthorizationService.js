/**
 * Authorization Service
 * Domain service for authorization decisions
 *
 * Uses Strategy pattern to delegate to appropriate policy based on user role
 *
 * @module domain/authorization/AuthorizationService
 * @version 11.0.0-alpha.30
 */

import { User } from './User.js';

/**
 * Permission matrix defining allowed actions per resource per role type
 */
const PERMISSION_MATRIX = {
  globalAdmin: {
    stations: ['read', 'write', 'delete', 'admin'],
    platforms: ['read', 'write', 'delete', 'admin'],
    instruments: ['read', 'write', 'delete', 'admin'],
    rois: ['read', 'write', 'delete', 'admin'],
    aois: ['read', 'write', 'delete', 'admin'],
    campaigns: ['read', 'write', 'delete', 'admin'],
    products: ['read', 'write', 'delete', 'admin'],
    users: ['read', 'write', 'delete', 'admin'],
    admin: ['read', 'write', 'delete', 'admin'],
    export: ['read']
  },
  stationAdmin: {
    stations: ['read'],  // Can only read station info, not modify
    platforms: ['read', 'write', 'delete'],
    instruments: ['read', 'write', 'delete'],
    rois: ['read', 'write', 'delete'],
    aois: ['read', 'write', 'delete'],
    campaigns: ['read', 'write', 'delete'],
    products: ['read', 'write', 'delete'],
    users: [],  // No user management
    admin: [],  // No admin panel access
    export: ['read']
  },
  stationUser: {
    stations: ['read'],
    platforms: ['read', 'write'],
    instruments: ['read', 'write'],
    rois: ['read', 'write'],
    aois: ['read', 'write'],
    campaigns: ['read', 'write'],
    products: ['read', 'write'],
    users: [],
    admin: [],
    export: ['read']
  },
  readonly: {
    stations: ['read'],
    platforms: ['read'],
    instruments: ['read'],
    rois: ['read'],
    aois: ['read'],
    campaigns: ['read'],
    products: ['read'],
    users: [],
    admin: [],
    export: ['read']
  }
};

export class AuthorizationService {
  /**
   * Create User entity from raw JWT payload
   * @param {Object} payload - Raw user payload from JWT
   * @returns {User}
   */
  createUser(payload) {
    return new User(payload);
  }

  /**
   * Get the permission set type for a user
   * @param {User} user - User entity
   * @returns {string} Permission set key
   * @private
   */
  #getPermissionSetKey(user) {
    if (user.isGlobalAdmin()) {
      return 'globalAdmin';
    }
    if (user.isStationAdmin()) {
      return 'stationAdmin';
    }
    if (user.isStationUser()) {
      return 'stationUser';
    }
    return 'readonly';
  }

  /**
   * Authorize user action on resource
   * @param {User} user - User entity
   * @param {string} resource - Resource type (stations, platforms, instruments, etc.)
   * @param {string} action - Action type (read, write, delete, admin)
   * @param {Object} context - Additional context
   * @param {string|number} [context.stationId] - Station ID for station-scoped resources
   * @returns {Object} { allowed: boolean, reason: string }
   */
  authorize(user, resource, action, context = {}) {
    // Get permission set for user's role type
    const permissionSetKey = this.#getPermissionSetKey(user);
    const permissionSet = PERMISSION_MATRIX[permissionSetKey];

    if (!permissionSet) {
      return {
        allowed: false,
        reason: `Unknown permission set for user type: ${permissionSetKey}`
      };
    }

    const resourcePermissions = permissionSet[resource];
    if (!resourcePermissions) {
      return {
        allowed: false,
        reason: `No permissions defined for resource: ${resource}`
      };
    }

    // Check if action is in permission list
    if (!resourcePermissions.includes(action)) {
      return {
        allowed: false,
        reason: `Action '${action}' not allowed for ${permissionSetKey} on resource '${resource}'`
      };
    }

    // For non-global admins, check station ownership for write/delete actions
    if (!user.isGlobalAdmin() && ['write', 'delete'].includes(action)) {
      if (context.stationId && !user.hasAccessToStation(context.stationId)) {
        return {
          allowed: false,
          reason: `User ${user.username} does not have access to station ${context.stationId}. Assigned station: ${user.stationAcronym || user.stationNormalizedName || 'none'}`
        };
      }
    }

    return {
      allowed: true,
      reason: 'Permission granted'
    };
  }

  /**
   * Check if user can access a specific station
   * @param {User} user - User entity
   * @param {string|number} stationId - Station identifier
   * @returns {boolean}
   */
  canAccessStation(user, stationId) {
    return user.hasAccessToStation(stationId);
  }

  /**
   * Check if user can edit resources at a station
   * @param {User} user - User entity
   * @param {string|number} stationId - Station identifier
   * @returns {boolean}
   */
  canEditStation(user, stationId) {
    return user.canEditStation(stationId);
  }

  /**
   * Check if user can delete resources at a station
   * @param {User} user - User entity
   * @param {string|number} stationId - Station identifier
   * @returns {boolean}
   */
  canDeleteAtStation(user, stationId) {
    return user.canDeleteAtStation(stationId);
  }

  /**
   * Check if user is a global admin
   * @param {User} user - User entity
   * @returns {boolean}
   */
  isGlobalAdmin(user) {
    return user.isGlobalAdmin();
  }

  /**
   * Filter data based on user permissions
   * @param {User} user - User entity
   * @param {Array} data - Array of data objects
   * @param {string} stationIdField - Field name containing station ID
   * @returns {Array} Filtered data array
   */
  filterByPermissions(user, data, stationIdField = 'station_id') {
    if (!Array.isArray(data)) {
      return [];
    }

    // Global admins and readonly users see all data
    if (user.isGlobalAdmin() || user.isReadOnly()) {
      return data;
    }

    // Station users/admins see only their station's data
    return data.filter(item =>
      user.hasAccessToStation(item[stationIdField]) ||
      user.hasAccessToStation(item.station_normalized_name) ||
      user.hasAccessToStation(item.station_acronym) ||
      user.hasAccessToStation(item.id)
    );
  }
}

// Singleton instance for convenience
export const authorizationService = new AuthorizationService();
