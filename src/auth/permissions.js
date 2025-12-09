// Permissions Module
// Role-based access control and permission validation

import { createForbiddenResponse, createUnauthorizedResponse } from '../utils/responses.js';

/**
 * Validate admin permission for user
 * @param {Object} user - User object from token
 * @returns {boolean} True if user has admin permissions
 */
export function validateAdminPermission(user) {
  if (!user) {
    return false;
  }

  return user.role === 'admin';
}

/**
 * Validate station access for user
 * @param {Object} user - User object from token
 * @param {string} stationId - Station ID or normalized name to access
 * @returns {boolean} True if user can access the station
 */
export function validateStationAccess(user, stationId) {
  if (!user) {
    return false;
  }

  // Admin users can access all stations
  if (user.role === 'admin') {
    return true;
  }

  // Station-admin users can only access their own station (with full edit/delete)
  if (user.role === 'station-admin') {
    // Check multiple formats: integer ID, string acronym, and normalized name
    return user.station_id === stationId ||
           user.station_id === parseInt(stationId, 10) ||
           user.station_acronym === stationId ||
           user.station_normalized_name === stationId;
  }

  // Station users can only access their own station
  if (user.role === 'station') {
    // Check multiple formats: integer ID, string acronym, and normalized name
    return user.station_id === stationId ||
           user.station_id === parseInt(stationId, 10) ||
           user.station_acronym === stationId ||
           user.station_normalized_name === stationId;
  }

  // Read-only users can access all stations (for viewing only)
  if (user.role === 'readonly') {
    return true;
  }

  return false;
}

/**
 * Check user permissions for a specific resource and action
 * @param {Object} user - User object from token
 * @param {string} resource - Resource type (stations, platforms, instruments, rois)
 * @param {string} action - Action type (read, write, delete, admin)
 * @returns {Object} Permission result with allowed status and reason
 */
export function checkUserPermissions(user, resource, action) {
  if (!user) {
    return { allowed: false, reason: 'No user provided' };
  }

  // Define permission matrix
  const permissions = {
    admin: {
      stations: ['read', 'write', 'delete', 'admin'],
      platforms: ['read', 'write', 'delete', 'admin'],
      instruments: ['read', 'write', 'delete', 'admin'],
      rois: ['read', 'write', 'delete', 'admin'],
      aois: ['read', 'write', 'delete', 'admin'],
      campaigns: ['read', 'write', 'delete', 'admin'],
      products: ['read', 'write', 'delete', 'admin'],
      export: ['read']
    },
    'station-admin': {
      stations: ['read'],
      platforms: ['read', 'write', 'delete'],
      instruments: ['read', 'write', 'delete'],
      rois: ['read', 'write', 'delete'],
      aois: ['read', 'write', 'delete'],
      campaigns: ['read', 'write', 'delete'],
      products: ['read', 'write', 'delete'],
      export: ['read']
    },
    station: {
      stations: ['read'],
      platforms: ['read', 'write'],
      instruments: ['read', 'write'],
      rois: ['read', 'write'],
      aois: ['read', 'write'],
      campaigns: ['read', 'write'],
      products: ['read', 'write'],
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
      export: ['read']
    }
  };

  const userPermissions = permissions[user.role];
  if (!userPermissions) {
    return { allowed: false, reason: `Unknown user role: ${user.role}` };
  }

  const resourcePermissions = userPermissions[resource];
  if (!resourcePermissions) {
    return { allowed: false, reason: `No permissions defined for resource: ${resource}` };
  }

  const allowed = resourcePermissions.includes(action);
  return {
    allowed,
    reason: allowed ? 'Permission granted' : `Action '${action}' not allowed for role '${user.role}' on resource '${resource}'`
  };
}

/**
 * Middleware function to require authentication
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Object|Response} User object or error response
 */
export async function requireAuthentication(request, env) {
  const { getUserFromRequest } = await import('./authentication.js');

  const user = await getUserFromRequest(request, env);
  if (!user) {
    return createUnauthorizedResponse();
  }

  return user;
}

/**
 * Middleware function to require admin privileges
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Object|Response} User object or error response
 */
export async function requireAdminPermission(request, env) {
  const user = await requireAuthentication(request, env);
  if (user instanceof Response) {
    return user; // Return error response
  }

  if (!validateAdminPermission(user)) {
    return createForbiddenResponse();
  }

  return user;
}

/**
 * Middleware function to require station access
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @param {string} stationId - Station ID to validate access for
 * @returns {Object|Response} User object or error response
 */
export async function requireStationAccess(request, env, stationId) {
  const user = await requireAuthentication(request, env);
  if (user instanceof Response) {
    return user; // Return error response
  }

  if (!validateStationAccess(user, stationId)) {
    return createForbiddenResponse();
  }

  return user;
}

/**
 * Filter data based on user permissions
 * @param {Object} user - User object from token
 * @param {Array} data - Array of data objects (stations, platforms, etc.)
 * @param {string} stationIdField - Field name that contains station ID
 * @returns {Array} Filtered data array
 */
export function filterDataByPermissions(user, data, stationIdField = 'station_id') {
  if (!user || !Array.isArray(data)) {
    return [];
  }

  // Admin users see all data
  if (user.role === 'admin') {
    return data;
  }

  // Station-admin users see only their station's data
  if (user.role === 'station-admin' && user.station_id) {
    return data.filter(item =>
      item[stationIdField] === user.station_id ||
      item.station_normalized_name === user.station_normalized_name ||
      item.station_acronym === user.station_acronym ||
      item.id === user.station_id
    );
  }

  // Station users see only their station's data
  if (user.role === 'station' && user.station_id) {
    return data.filter(item =>
      item[stationIdField] === user.station_id ||
      item.station_normalized_name === user.station_normalized_name ||
      item.station_acronym === user.station_acronym ||
      item.id === user.station_id
    );
  }

  // Read-only users see all data (for viewing)
  if (user.role === 'readonly') {
    return data;
  }

  return [];
}