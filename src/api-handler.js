// SITES Spectral API Handler v10.0.0
// V10 API (Hexagonal Architecture) - New default for core entities
// V3 API - Domain-based routing, spatial queries, campaigns, products
// Legacy V1 handlers maintained for backward compatibility (deprecated)
// SECURITY: CSRF protection, input sanitization, JWT HMAC-SHA256

import { handleAuth, getUserFromRequest } from './auth/authentication.js';
import { logApiRequest } from './utils/logging.js';
import { csrfProtect, createCSRFErrorResponse } from './utils/csrf.js';
import {
  createErrorResponse,
  createNotFoundResponse,
  createInternalServerErrorResponse,
  createUnauthorizedResponse
} from './utils/responses.js';

// V10 API Handler - Hexagonal Architecture (new)
import { createRouter } from './infrastructure/http/router.js';

// V3 API Handler - PRIMARY (default)
import { handleApiV3Request } from './v3/api-handler-v3.js';

// Legacy V1 handlers (deprecated - will be removed in v10.0.0)
import { handleStations } from './handlers/stations.js';
import { handlePlatforms } from './handlers/platforms.js';
import { handleInstruments } from './handlers/instruments.js';
import { handleROIs } from './handlers/rois.js';
import { handleAOIs, getAOIsByPlatformType, getAOIsGeoJSON } from './handlers/aois.js';
import { handleExport } from './handlers/export.js';
import { handleAdmin } from './admin/admin-router.js';
import { handleResearchPrograms, getResearchProgramsValues } from './handlers/research-programs.js';
import { handlePhenocamROIs } from './handlers/phenocam-rois.js';
import { handleEcosystems, getEcosystemDropdownValues } from './handlers/ecosystems.js';
import { handleStatusCodes, getStatusDropdownValues } from './handlers/status-codes.js';
import { handleUsers } from './handlers/users.js';
import { handleAnalytics } from './handlers/analytics.js';
import { handleChannels } from './handlers/channels.js';
import { handleSensorModels } from './handlers/sensor-models.js';
import { handleDocumentation } from './handlers/documentation.js';
import { handleMaintenance } from './handlers/maintenance.js';
import { handleCalibration } from './handlers/calibration.js';

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

  // SECURITY: CSRF Protection for state-changing requests
  // Skip CSRF check for auth endpoints (login needs to work without existing session)
  // and health checks (read-only)
  if (resource !== 'auth' && resource !== 'health') {
    const csrfResult = csrfProtect(request);
    if (!csrfResult.isValid) {
      return createCSRFErrorResponse(csrfResult.error);
    }
  }

  // V10 API - Hexagonal Architecture (new)
  // Route /api/v10/* requests to the new architecture
  if (pathSegments[0] === 'v10') {
    pathSegments.shift(); // Remove 'v10' prefix
    const router = createRouter(env);
    return await router.handle(request, pathSegments, url);
  }

  // V3 API is the default - route explicitly versioned requests
  if (pathSegments[0] === 'v3') {
    return await handleApiV3Request(request, env, ctx);
  }

  // Legacy V1 routes (deprecated) - keep for backward compatibility
  // These will be removed in v10.0.0
  if (pathSegments[0] === 'v1') {
    pathSegments.shift(); // Remove 'v1' prefix and continue to legacy handlers
  }

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
        return await handleInstruments(method, pathSegments, request, env);

      case 'rois':
        // Handle sub-actions for ROI legacy system (v10.0.0-alpha.17)
        // POST /api/rois/{id}/legacy - Mark ROI as legacy
        // PUT /api/rois/{id}/override - Admin override edit
        // GET /api/rois/{id}/edit-mode - Get edit mode info
        const roiSubAction = pathSegments[2] || null;
        return await handleROIs(method, id, request, env, roiSubAction);

      case 'aois':
        // Special sub-routes for AOIs - require authentication
        if (pathSegments[1] === 'geojson' && pathSegments[2]) {
          const user = await getUserFromRequest(request, env);
          if (!user) {
            return createUnauthorizedResponse();
          }
          return await getAOIsGeoJSON(pathSegments[2], user, env);
        }
        if (pathSegments[1] === 'by-platform-type' && pathSegments[2]) {
          const user = await getUserFromRequest(request, env);
          if (!user) {
            return createUnauthorizedResponse();
          }
          return await getAOIsByPlatformType(pathSegments[2], user, env);
        }
        return await handleAOIs(method, id, request, env);

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

      case 'users':
        return await handleUsers(method, pathSegments, request, env);

      case 'analytics':
        return await handleAnalytics(method, pathSegments, request, env);

      case 'channels':
        return await handleChannels(method, pathSegments, request, env);

      case 'sensor-models':
        return await handleSensorModels(method, pathSegments, request, env);

      case 'documentation':
        return await handleDocumentation(method, pathSegments, request, env);

      case 'maintenance':
        return await handleMaintenance(method, pathSegments, request, env);

      case 'calibration':
        return await handleCalibration(method, pathSegments, request, env);

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
      version: '10.0.0-alpha.3',
      database: dbTest ? 'connected' : 'disconnected',
      architecture: 'hexagonal',
      apiVersions: ['v10', 'v3', 'v1-legacy'],
      defaultApiVersion: 'v3',
      features: [
        'hexagonal-architecture',
        'cqrs-pattern',
        'dependency-injection',
        'mount-type-codes',
        'v3-api-default',
        'campaigns',
        'products',
        'spatial-queries',
        'pagination',
        'aoi-support',
        'uav-platforms',
        'satellite-platforms',
        'mobile-platforms',
        'csrf-protection',
        'input-sanitization',
        'jwt-hmac-sha256'
      ]
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return new Response(JSON.stringify({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '10.0.0-alpha.3',
      error: error.message,
      database: 'disconnected',
      architecture: 'hexagonal',
      apiVersions: ['v10', 'v3', 'v1-legacy'],
      defaultApiVersion: 'v3'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}