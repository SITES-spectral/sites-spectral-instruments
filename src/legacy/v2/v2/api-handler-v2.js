// SITES Spectral API Handler v2.0.0
// Enhanced API with pagination, validation, and rate limiting

import { handleAuth } from '../auth/authentication.js';
import { handleStationsV2 } from './handlers/stations-v2.js';
import { handlePlatformsV2 } from './handlers/platforms-v2.js';
import { handleInstrumentsV2 } from './handlers/instruments-v2.js';
import { handleROIsV2 } from './handlers/rois-v2.js';
import { logApiRequest } from '../utils/logging.js';
import {
  createErrorResponse,
  createNotFoundResponse,
  createInternalServerErrorResponse
} from '../utils/responses.js';
import { validateContentType } from '../middleware/validation.js';

/**
 * V2 API request handler with pagination and enhanced validation
 * @param {Request} request - The incoming request
 * @param {Object} env - Environment variables and bindings
 * @param {Object} ctx - Request context
 * @returns {Response} API response
 */
export async function handleApiV2Request(request, env, ctx) {
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/').filter(segment => segment);

  // Remove 'api' and 'v2' from path segments
  if (pathSegments[0] === 'api') {
    pathSegments.shift();
  }
  if (pathSegments[0] === 'v2') {
    pathSegments.shift();
  }

  const method = request.method;
  const resource = pathSegments[0];
  const id = pathSegments[1];

  // Log API request for audit trail
  await logApiRequest(request, env, ctx);

  // Validate Content-Type for write operations
  const contentTypeError = validateContentType(request);
  if (contentTypeError) {
    return contentTypeError;
  }

  try {
    switch (resource) {
      case 'auth':
        // Auth remains the same as v1
        return await handleAuth(method, pathSegments, request, env);

      case 'stations':
        return await handleStationsV2(method, id, request, env);

      case 'platforms':
        return await handlePlatformsV2(method, id, request, env);

      case 'instruments':
        return await handleInstrumentsV2(method, pathSegments, request, env);

      case 'rois':
        return await handleROIsV2(method, id, request, env);

      case 'health':
        return await handleHealthV2(env);

      default:
        return createNotFoundResponse();
    }
  } catch (error) {
    console.error('API V2 Error:', error);
    return createInternalServerErrorResponse(error);
  }
}

/**
 * Health check endpoint for V2 API
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Health status response
 */
async function handleHealthV2(env) {
  try {
    const dbTest = await env.DB.prepare('SELECT 1 as test').first();

    return new Response(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '7.0.0',
      apiVersion: 'v2',
      database: dbTest ? 'connected' : 'disconnected',
      features: {
        pagination: true,
        validation: true,
        rateLimiting: true
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return new Response(JSON.stringify({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '7.0.0',
      apiVersion: 'v2',
      error: error.message,
      database: 'disconnected'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
