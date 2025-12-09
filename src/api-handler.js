// SITES Spectral API Handler v11.0.0-alpha.32
// V11 API (Hexagonal Architecture) - Primary API with full feature support
// Supports semantic aliases: /api/latest, /api/stable, /api/current
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

// V11 API Handler - Hexagonal Architecture (PRIMARY)
import { createRouter } from './infrastructure/http/router.js';

// API Version Resolver (supports /api/latest, /api/stable, etc.)
import {
  resolveAPIVersion,
  addVersionHeaders,
  createUnsupportedVersionResponse,
  getVersionInfo
} from './infrastructure/api/version-resolver.js';

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

  // V11 API - Hexagonal Architecture with Version Resolution (PRIMARY)
  // Supports: /api/v11, /api/v10, /api/latest, /api/stable, /api/current
  const versionedPaths = ['v10', 'v11', 'latest', 'stable', 'current', 'legacy'];

  if (versionedPaths.includes(pathSegments[0])) {
    // Resolve version (handles aliases like /api/latest → v11)
    const versionInfo = resolveAPIVersion(request);

    // Check for unsupported version
    if (versionInfo.error) {
      return createUnsupportedVersionResponse(versionInfo);
    }

    // Log deprecated version usage
    if (versionInfo.status === 'legacy' || versionInfo.status === 'deprecated') {
      console.warn(`Deprecated API version used: ${versionInfo.resolved} (requested: ${versionInfo.requested})`);
    }

    pathSegments.shift(); // Remove version prefix
    const router = createRouter(env);

    // Add version info to request for downstream handlers
    request.apiVersion = versionInfo;

    // Get response from router
    const response = await router.handle(request, pathSegments, url);

    // Add version headers to response
    return addVersionHeaders(response, versionInfo);
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
  const versionInfo = getVersionInfo();

  try {
    // Test database connectivity
    const dbTest = await env.DB.prepare('SELECT 1 as test').first();

    return new Response(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: versionInfo.current.versionNumber,
      database: dbTest ? 'connected' : 'disconnected',
      architecture: 'hexagonal',
      api: {
        current: versionInfo.current.version,
        aliases: versionInfo.aliases,
        supported: versionInfo.supported.map(v => v.version),
        recommendation: 'Use /api/latest for production'
      },
      features: [
        'hexagonal-architecture',
        'cqrs-pattern',
        'dependency-injection',
        'domain-driven-design',
        'api-version-aliases',
        'maintenance-timeline',
        'calibration-workflow',
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
      headers: {
        'Content-Type': 'application/json',
        'X-API-Version': versionInfo.current.version,
        'X-API-Latest-Version': versionInfo.aliases.latest
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return new Response(JSON.stringify({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: versionInfo.current.versionNumber,
      error: error.message,
      database: 'disconnected',
      architecture: 'hexagonal',
      api: {
        current: versionInfo.current.version,
        recommendation: 'Use /api/latest for production'
      }
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}