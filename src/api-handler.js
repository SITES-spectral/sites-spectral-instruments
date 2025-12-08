// SITES Spectral API Handler v11.0.0
// V10/V11 API (Hexagonal Architecture) - Primary API with full feature support
// Legacy V1 handlers maintained for specialized endpoints (auth, export, ROIs, values)
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

// V10/V11 API Handler - Hexagonal Architecture (PRIMARY)
import { createRouter } from './infrastructure/http/router.js';

// Specialized handlers (kept for specific functionality)
import { handleROIs } from './handlers/rois.js';
import { handleExport } from './handlers/export.js';
import { handleAdmin } from './admin/admin-router.js';
import { handleUsers } from './handlers/users.js';
import { handleAnalytics } from './handlers/analytics.js';

// Lookup table handlers (for dropdown values)
import { handleResearchPrograms, getResearchProgramsValues } from './handlers/research-programs.js';
import { handleEcosystems, getEcosystemDropdownValues } from './handlers/ecosystems.js';
import { handleStatusCodes, getStatusDropdownValues } from './handlers/status-codes.js';

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

  // V10/V11 API - Hexagonal Architecture (PRIMARY)
  // Route /api/v10/* requests to the hexagonal architecture router
  if (pathSegments[0] === 'v10' || pathSegments[0] === 'v11') {
    pathSegments.shift(); // Remove version prefix
    const router = createRouter(env);
    return await router.handle(request, pathSegments, url);
  }

  const id = pathSegments[1];

  // Log API request for audit trail
  await logApiRequest(request, env, ctx);

  try {
    switch (resource) {
      // === AUTHENTICATION ===
      case 'auth':
        return await handleAuth(method, pathSegments, request, env);

      // === ADMIN PANEL ===
      case 'admin':
        return await handleAdmin(method, pathSegments, request, env);

      // === CORE ENTITIES - Route to V10 Router ===
      case 'stations':
      case 'platforms':
      case 'instruments':
      case 'aois':
      case 'campaigns':
      case 'products': {
        // Forward unversioned core entity requests to V10 router
        const router = createRouter(env);
        return await router.handle(request, pathSegments, url);
      }

      // === SPECIALIZED HANDLERS ===
      case 'rois':
        // ROI management with legacy system support
        const roiSubAction = pathSegments[2] || null;
        return await handleROIs(method, id, request, env, roiSubAction);

      case 'export':
        return await handleExport(method, pathSegments, request, env);

      case 'users':
        return await handleUsers(method, pathSegments, request, env);

      case 'analytics':
        return await handleAnalytics(method, pathSegments, request, env);

      // === LOOKUP TABLES (Dropdown Values) ===
      case 'research-programs':
        return await handleResearchPrograms(method, id, request, env);

      case 'ecosystems':
        return await handleEcosystems(method, id, request, env);

      case 'status-codes':
        return await handleStatusCodes(method, id, request, env);

      case 'values':
        // Aggregated dropdown values endpoint
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

      // === HEALTH CHECK ===
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
      version: '11.0.0-alpha.1',
      database: dbTest ? 'connected' : 'disconnected',
      architecture: 'hexagonal',
      apiVersion: 'v10/v11',
      features: [
        'hexagonal-architecture',
        'cqrs-pattern',
        'dependency-injection',
        'domain-driven-design',
        'aoi-geospatial',
        'campaigns',
        'products',
        'geojson-kml-import',
        'darwin-core-vocabulary',
        'icos-station-types',
        'copernicus-processing-levels',
        'cc-by-4-license',
        'csrf-protection',
        'input-sanitization',
        'jwt-hmac-sha256',
        'roi-drawing-canvas',
        'roi-legacy-system'
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
      version: '11.0.0-alpha.1',
      error: error.message,
      database: 'disconnected',
      architecture: 'hexagonal',
      apiVersion: 'v10/v11'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}