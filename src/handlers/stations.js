// Stations Handler Module
// Regular station operations (non-admin CRUD)

import { requireAuthentication, validateStationAccess } from '../auth/permissions.js';
import { getStationData, getStationsData } from '../utils/database.js';
import {
  createSuccessResponse,
  createErrorResponse,
  createNotFoundResponse,
  createForbiddenResponse,
  createMethodNotAllowedResponse
} from '../utils/responses.js';

/**
 * Handle station requests
 * @param {string} method - HTTP method
 * @param {string} id - Station identifier (optional)
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Station response
 */
export async function handleStations(method, id, request, env) {
  if (!['GET', 'POST', 'PUT', 'DELETE'].includes(method)) {
    return createMethodNotAllowedResponse();
  }

  // Authentication required for all station operations
  const user = await requireAuthentication(request, env);
  if (user instanceof Response) {
    return user; // Return error response
  }

  try {
    switch (method) {
      case 'GET':
        if (id) {
          return await getStationById(id, user, env);
        } else {
          return await getStationsList(user, env);
        }

      case 'POST':
        // Station creation is admin-only, redirect to admin handler
        return createForbiddenResponse();

      case 'PUT':
        // Station updates are admin-only, redirect to admin handler
        return createForbiddenResponse();

      case 'DELETE':
        // Station deletion is admin-only, redirect to admin handler
        return createForbiddenResponse();

      default:
        return createMethodNotAllowedResponse();
    }
  } catch (error) {
    console.error('Station handler error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

/**
 * Get specific station by ID or identifier
 * @param {string} id - Station identifier (normalized name, acronym, or ID)
 * @param {Object} user - Authenticated user
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Station data response
 */
async function getStationById(id, user, env) {
  const station = await getStationData(id, env);
  if (!station) {
    return createNotFoundResponse();
  }

  // Check access permission
  if (!canAccessStation(user, station)) {
    return createForbiddenResponse();
  }

  return createSuccessResponse(station);
}

/**
 * Get list of stations filtered by user permissions
 * @param {Object} user - Authenticated user
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Stations list response
 */
async function getStationsList(user, env) {
  const stations = await getStationsData(user, env);
  return createSuccessResponse({ stations });
}

/**
 * Check if user can access a specific station
 * @param {Object} user - User object from token
 * @param {Object} station - Station data
 * @returns {boolean} True if user can access the station
 */
function canAccessStation(user, station) {
  if (user.role === 'admin') {
    return true;
  }

  if (user.role === 'station') {
    // Check both normalized name and acronym for station access
    return user.station_normalized_name === station.normalized_name ||
           user.station_acronym === station.acronym ||
           user.station_acronym === station.normalized_name ||
           user.station_id === station.id;
  }

  // readonly users can access all stations for viewing
  return user.role === 'readonly';
}