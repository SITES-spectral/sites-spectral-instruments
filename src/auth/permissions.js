// Permissions Module
// Role-based access control and permission validation
// v11.0.0-alpha.30: Refactored to use domain authorization service

import { createForbiddenResponse, createUnauthorizedResponse } from '../utils/responses.js';
import { User, AuthorizationService, authorizationService } from '../domain/authorization/index.js';

/**
 * Convert raw JWT payload to User entity
 * @param {Object} payload - Raw user payload from JWT
 * @returns {User|null} User entity or null
 */
function createUserEntity(payload) {
  if (!payload) return null;
  try {
    return new User(payload);
  } catch (error) {
    console.warn('Failed to create User entity:', error.message);
    return null;
  }
}

/**
 * Validate admin permission for user
 * Only global admins (admin, sites-admin usernames) have admin permissions
 *
 * @param {Object} user - User object from token
 * @returns {boolean} True if user has global admin permissions
 */
export function validateAdminPermission(user) {
  if (!user) {
    return false;
  }

  const userEntity = createUserEntity(user);
  if (!userEntity) return false;

  return userEntity.isGlobalAdmin();
}

/**
 * Validate station access for user
 * Uses domain User entity for consistent authorization logic
 *
 * @param {Object} user - User object from token
 * @param {string} stationId - Station ID or normalized name to access
 * @returns {boolean} True if user can access the station
 */
export function validateStationAccess(user, stationId) {
  if (!user) {
    return false;
  }

  const userEntity = createUserEntity(user);
  if (!userEntity) return false;

  return userEntity.hasAccessToStation(stationId);
}

/**
 * Validate station edit access for user
 * Checks if user can modify resources at a specific station
 *
 * @param {Object} user - User object from token
 * @param {string} stationId - Station ID or normalized name
 * @returns {boolean} True if user can edit at the station
 */
export function validateStationEditAccess(user, stationId) {
  if (!user) {
    return false;
  }

  const userEntity = createUserEntity(user);
  if (!userEntity) return false;

  return userEntity.canEditStation(stationId);
}

/**
 * Validate station delete access for user
 * Checks if user can delete resources at a specific station
 *
 * @param {Object} user - User object from token
 * @param {string} stationId - Station ID or normalized name
 * @returns {boolean} True if user can delete at the station
 */
export function validateStationDeleteAccess(user, stationId) {
  if (!user) {
    return false;
  }

  const userEntity = createUserEntity(user);
  if (!userEntity) return false;

  return userEntity.canDeleteAtStation(stationId);
}

/**
 * Check user permissions for a specific resource and action
 * Uses domain AuthorizationService for consistent authorization logic
 *
 * @param {Object} user - User object from token
 * @param {string} resource - Resource type (stations, platforms, instruments, rois)
 * @param {string} action - Action type (read, write, delete, admin)
 * @param {Object} context - Additional context (stationId, etc.)
 * @returns {Object} Permission result with allowed status and reason
 */
export function checkUserPermissions(user, resource, action, context = {}) {
  if (!user) {
    return { allowed: false, reason: 'No user provided' };
  }

  const userEntity = createUserEntity(user);
  if (!userEntity) {
    return { allowed: false, reason: 'Invalid user data' };
  }

  return authorizationService.authorize(userEntity, resource, action, context);
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
 * Uses domain AuthorizationService for consistent filtering
 *
 * @param {Object} user - User object from token
 * @param {Array} data - Array of data objects (stations, platforms, etc.)
 * @param {string} stationIdField - Field name that contains station ID
 * @returns {Array} Filtered data array
 */
export function filterDataByPermissions(user, data, stationIdField = 'station_id') {
  if (!user || !Array.isArray(data)) {
    return [];
  }

  const userEntity = createUserEntity(user);
  if (!userEntity) {
    return [];
  }

  return authorizationService.filterByPermissions(userEntity, data, stationIdField);
}

/**
 * Middleware function to require station edit access
 * For write operations at a specific station
 *
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @param {string} stationId - Station ID to validate edit access for
 * @returns {Object|Response} User object or error response
 */
export async function requireStationEditAccess(request, env, stationId) {
  const user = await requireAuthentication(request, env);
  if (user instanceof Response) {
    return user; // Return error response
  }

  if (!validateStationEditAccess(user, stationId)) {
    return createForbiddenResponse(`You do not have edit access to station ${stationId}`);
  }

  return user;
}

/**
 * Middleware function to require station delete access
 * For delete operations at a specific station
 *
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @param {string} stationId - Station ID to validate delete access for
 * @returns {Object|Response} User object or error response
 */
export async function requireStationDeleteAccess(request, env, stationId) {
  const user = await requireAuthentication(request, env);
  if (user instanceof Response) {
    return user; // Return error response
  }

  if (!validateStationDeleteAccess(user, stationId)) {
    return createForbiddenResponse(`You do not have delete access to station ${stationId}`);
  }

  return user;
}

/**
 * Middleware function to require global admin access
 * For system-wide admin operations
 *
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Object|Response} User object or error response
 */
export async function requireGlobalAdmin(request, env) {
  const user = await requireAuthentication(request, env);
  if (user instanceof Response) {
    return user; // Return error response
  }

  if (!validateAdminPermission(user)) {
    return createForbiddenResponse('Global admin privileges required. Station admins cannot access this endpoint.');
  }

  return user;
}