// Instruments Handler Module - Main Router
// Modular architecture with clean separation of concerns
// v7.0.0 - Split into: get.js, mutate.js, subresources.js, utils.js

import { requireAuthentication } from '../../auth/permissions.js';
import {
  createErrorResponse,
  createMethodNotAllowedResponse
} from '../../utils/responses.js';

// Import modular handlers
import { getInstrumentById, getInstrumentsList } from './get.js';
import { createInstrument, updateInstrument, deleteInstrument } from './mutate.js';
import { getLatestImage, getInstrumentROIs } from './subresources.js';

/**
 * Handle instrument requests
 * Routes to appropriate handler based on method and path
 *
 * @param {string} method - HTTP method
 * @param {Array} pathSegments - Path segments from URL (e.g., ['instruments', '42', 'latest-image'])
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Instrument response
 */
export async function handleInstruments(method, pathSegments, request, env) {
  if (!['GET', 'POST', 'PUT', 'DELETE'].includes(method)) {
    return createMethodNotAllowedResponse();
  }

  // Authentication required for all instrument operations
  const user = await requireAuthentication(request, env);
  if (user instanceof Response) {
    return user; // Return error response
  }

  // Extract ID and sub-resource from path segments
  // pathSegments[0] = 'instruments'
  // pathSegments[1] = instrument ID (optional)
  // pathSegments[2] = sub-resource (e.g., 'latest-image', 'rois')
  const id = pathSegments[1];
  const subResource = pathSegments[2];

  try {
    switch (method) {
      case 'GET':
        // Handle sub-resources first
        if (id && subResource === 'latest-image') {
          return await getLatestImage(id, user, env);
        }
        if (id && subResource === 'rois') {
          return await getInstrumentROIs(id, user, env);
        }
        // Regular instrument requests
        if (id) {
          return await getInstrumentById(id, user, env);
        } else {
          return await getInstrumentsList(user, request, env);
        }

      case 'POST':
        return await createInstrument(user, request, env);

      case 'PUT':
        if (!id) {
          return createErrorResponse('Instrument ID required for update', 400);
        }
        return await updateInstrument(id, user, request, env);

      case 'DELETE':
        if (!id) {
          return createErrorResponse('Instrument ID required for deletion', 400);
        }
        return await deleteInstrument(id, user, env);

      default:
        return createMethodNotAllowedResponse();
    }
  } catch (error) {
    console.error('Instrument handler error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

// Re-export utility functions for use by other modules
export {
  getInstrumentTypeCode,
  extractBrandAcronym,
  getNextInstrumentNumber,
  getInstrumentForUser,
  roundCoordinate
} from './utils.js';
