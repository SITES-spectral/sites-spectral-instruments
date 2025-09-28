// SITES Spectral API Handler v5.0.0
// Modular architecture with clean separation of concerns

import { handleAuth } from './auth/authentication.js';
import { handleStations } from './handlers/stations.js';
import { handlePlatforms } from './handlers/platforms.js';
import { handleInstruments } from './handlers/instruments.js';
import { handleROIs } from './handlers/rois.js';
import { handleExport } from './handlers/export.js';
import { handleAdmin } from './admin/admin-router.js';
import { handleResearchPrograms, getResearchProgramsValues } from './handlers/research-programs.js';
import { handlePhenocamROIs } from './handlers/phenocam-rois.js';
import { handleEcosystems, getEcosystemDropdownValues } from './handlers/ecosystems.js';
import { handleStatusCodes, getStatusDropdownValues } from './handlers/status-codes.js';
import { logApiRequest } from './utils/logging.js';
import {
  createErrorResponse,
  createNotFoundResponse,
  createInternalServerErrorResponse
} from './utils/responses.js';

/**
 * Main API request handler with modular routing
 * @param {Request} request - The incoming request
 * @param {Object} env - Environment variables and bindings
 * @param {Object} ctx - Request context
 * @returns {Response} API response
 */
export async function handleApiRequest(request, env, ctx) {
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/').filter(segment => segment);

  // Remove 'api' from path segments
  if (pathSegments[0] === 'api') {
    pathSegments.shift();
  }

  const method = request.method;
  const resource = pathSegments[0];
  const id = pathSegments[1];

  // Log API request for audit trail
  await logApiRequest(request, env, ctx);

  try {
    switch (resource) {
      case 'auth':
        return await handleAuth(method, pathSegments, request, env);

      case 'admin':
        return await handleAdmin(method, pathSegments, request, env);

      case 'stations':
        return await handleStations(method, id, request, env);

      case 'platforms':
        return await handlePlatforms(method, id, request, env);

      case 'instruments':
        return await handleInstruments(method, id, request, env);

      case 'rois':
        return await handleROIs(method, id, request, env);

      case 'phenocam-rois':
        return await handlePhenocamROIs(method, pathSegments, request, env);

      case 'export':
        return await handleExport(method, pathSegments, request, env);

      case 'research-programs':
        return await handleResearchPrograms(method, id, request, env);

      case 'ecosystems':
        return await handleEcosystems(method, id, request, env);

      case 'status-codes':
        return await handleStatusCodes(method, id, request, env);

      case 'values':
        // Special endpoint for dropdown/multiselect values
        if (pathSegments[1] === 'research-programs') {
          return await getResearchProgramsValues(request, env);
        }
        if (pathSegments[1] === 'ecosystems') {
          return await getEcosystemDropdownValues(request, env);
        }
        if (pathSegments[1] === 'status-codes') {
          return await getStatusDropdownValues(request, env);
        }
        return createNotFoundResponse();

      case 'health':
        return await handleHealth(env);

      default:
        return createNotFoundResponse();
    }
  } catch (error) {
    console.error('API Error:', error);
    return createInternalServerErrorResponse(error);
  }
}

/**
 * Health check endpoint
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Health status response
 */
async function handleHealth(env) {
  try {
    // Test database connectivity
    const dbTest = await env.DB.prepare('SELECT 1 as test').first();

    return new Response(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '5.0.0',
      database: dbTest ? 'connected' : 'disconnected',
      architecture: 'modular'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return new Response(JSON.stringify({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '5.0.0',
      error: error.message,
      database: 'disconnected',
      architecture: 'modular'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}