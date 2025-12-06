/**
 * HTTP Router (v10 Architecture)
 *
 * Routes requests to controllers using the new Hexagonal Architecture.
 * Can be used alongside legacy handlers during migration.
 *
 * @module infrastructure/http/router
 */

import { createContainer } from '../../container.js';
import {
  StationController,
  PlatformController,
  InstrumentController,
  AdminController
} from './controllers/index.js';
import { createNotFoundResponse, createInternalServerErrorResponse } from '../../utils/responses.js';

/**
 * Create router with all controllers
 *
 * @param {Object} env - Cloudflare Worker environment
 * @returns {Object} Router with handle method
 */
export function createRouter(env) {
  // Create dependency injection container
  const container = createContainer(env);

  // Initialize controllers
  const controllers = {
    stations: new StationController(container),
    platforms: new PlatformController(container),
    instruments: new InstrumentController(container),
    admin: new AdminController(container)
  };

  return {
    container,
    controllers,

    /**
     * Handle API request using new architecture
     *
     * @param {Request} request - HTTP request
     * @param {string[]} pathSegments - URL path segments (after /api/v10/)
     * @param {URL} url - Parsed URL
     * @returns {Promise<Response>}
     */
    async handle(request, pathSegments, url) {
      const resource = pathSegments[0];
      const resourcePath = pathSegments.slice(1);

      try {
        switch (resource) {
          case 'stations':
            return await controllers.stations.handle(request, resourcePath, url);

          case 'platforms':
            return await controllers.platforms.handle(request, resourcePath, url);

          case 'instruments':
            return await controllers.instruments.handle(request, resourcePath, url);

          case 'admin':
            return await handleAdmin(request, resourcePath, url, controllers.admin);

          case 'health':
            return await handleHealth(env, container);

          case 'info':
            return handleInfo();

          default:
            return createNotFoundResponse(`Unknown resource: ${resource}`);
        }
      } catch (error) {
        console.error('Router error:', error);
        return createInternalServerErrorResponse(error);
      }
    }
  };
}

/**
 * Admin routes handler
 */
async function handleAdmin(request, resourcePath, url, adminController) {
  const method = request.method;
  const subResource = resourcePath[0];

  if (method !== 'GET') {
    return createNotFoundResponse('Method not allowed');
  }

  switch (subResource) {
    case 'activity-logs':
      return await adminController.getActivityLogs(request, url);

    case 'user-sessions':
      return await adminController.getUserSessions(request, url);

    case 'station-stats':
      return await adminController.getStationStats(request, url);

    case 'health':
      return await adminController.getHealth(request);

    case 'summary':
      return await adminController.getSummary(request, url);

    default:
      return createNotFoundResponse(`Unknown admin resource: ${subResource}`);
  }
}

/**
 * Health check endpoint
 */
async function handleHealth(env, container) {
  try {
    // Test database via repository
    const stations = await container.queries.listStations.execute({ limit: 1 });

    return new Response(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '10.0.0-alpha.6',
      architecture: 'hexagonal',
      database: 'connected',
      stats: {
        stations: stations.pagination.total
      },
      features: [
        'hexagonal-architecture',
        'cqrs-pattern',
        'dependency-injection',
        'domain-driven-design',
        'mount-type-codes',
        'admin-analytics'
      ]
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Health check error:', error);
    return new Response(JSON.stringify({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '10.0.0-alpha.6',
      architecture: 'hexagonal',
      database: 'disconnected',
      error: error.message
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * API information endpoint
 */
function handleInfo() {
  return new Response(JSON.stringify({
    name: 'SITES Spectral Instruments API',
    version: '10.0.0-alpha.6',
    architecture: 'hexagonal',
    description: 'Hexagonal Architecture API for managing research station instruments',
    patterns: [
      'Hexagonal (Ports & Adapters)',
      'CQRS (Command Query Responsibility Segregation)',
      'Dependency Injection',
      'Domain-Driven Design',
      'Strategy Pattern (Platform Types)',
      'Registry Pattern (Instrument Types)'
    ],
    endpoints: {
      stations: {
        list: 'GET /api/v10/stations',
        get: 'GET /api/v10/stations/:id',
        dashboard: 'GET /api/v10/stations/:acronym/dashboard',
        create: 'POST /api/v10/stations',
        update: 'PUT /api/v10/stations/:id',
        delete: 'DELETE /api/v10/stations/:id'
      },
      platforms: {
        list: 'GET /api/v10/platforms',
        get: 'GET /api/v10/platforms/:id',
        byStation: 'GET /api/v10/platforms/station/:stationId',
        byType: 'GET /api/v10/platforms/type/:type',
        create: 'POST /api/v10/platforms',
        update: 'PUT /api/v10/platforms/:id',
        delete: 'DELETE /api/v10/platforms/:id'
      },
      instruments: {
        list: 'GET /api/v10/instruments',
        get: 'GET /api/v10/instruments/:id',
        details: 'GET /api/v10/instruments/:id/details',
        byPlatform: 'GET /api/v10/instruments/platform/:platformId',
        byStation: 'GET /api/v10/instruments/station/:stationId',
        create: 'POST /api/v10/instruments',
        update: 'PUT /api/v10/instruments/:id',
        delete: 'DELETE /api/v10/instruments/:id'
      },
      admin: {
        activityLogs: 'GET /api/v10/admin/activity-logs',
        userSessions: 'GET /api/v10/admin/user-sessions',
        stationStats: 'GET /api/v10/admin/station-stats',
        health: 'GET /api/v10/admin/health',
        summary: 'GET /api/v10/admin/summary'
      }
    },
    mountTypeCodes: {
      PL: 'Pole/Tower/Mast (>1.5m)',
      BL: 'Building (rooftop/facade)',
      GL: 'Ground Level (<1.5m)',
      UAV: 'UAV Position',
      SAT: 'Satellite',
      MOB: 'Mobile',
      USV: 'Surface Vehicle',
      UUV: 'Underwater Vehicle'
    }
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
