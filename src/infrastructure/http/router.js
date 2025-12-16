/**
 * HTTP Router (V11 Architecture)
 *
 * Routes requests to controllers using Hexagonal Architecture.
 * V11: Full support for AOI, Campaign, Product domains.
 *
 * @module infrastructure/http/router
 */

import { createContainer } from '../../container.js';
import {
  StationController,
  PlatformController,
  InstrumentController,
  AdminController,
  AOIController,
  CampaignController,
  ProductController,
  MaintenanceController,
  CalibrationController,
  ROIController,
  UserController
} from './controllers/index.js';
import { createNotFoundResponse, createInternalServerErrorResponse } from '../../utils/responses.js';
import { handleAuth } from '../../auth/authentication.js';

/**
 * Create router with all controllers
 *
 * @param {Object} env - Cloudflare Worker environment
 * @returns {Object} Router with handle method
 */
export function createRouter(env) {
  // Create dependency injection container
  const container = createContainer(env);

  // Initialize controllers (V11 Architecture)
  // Pass env to controllers for authentication middleware (v11.0.0-alpha.34)
  const controllers = {
    // Core entities
    stations: new StationController(container, env),
    platforms: new PlatformController(container, env),
    instruments: new InstrumentController(container, env),
    // Admin
    admin: new AdminController(container, env),
    // V11 domains
    aois: new AOIController(container, env),
    campaigns: new CampaignController(container, env),
    products: new ProductController(container, env),
    maintenance: new MaintenanceController(container, env),
    calibrations: new CalibrationController(container, env),
    rois: new ROIController(env.DB, env),
    users: new UserController(env, container.repositories?.stations)
  };

  return {
    container,
    controllers,

    /**
     * Handle API request using new architecture
     *
     * @param {Request} request - HTTP request
     * @param {string[]} pathSegments - URL path segments (after /api/v11/ or /api/latest/)
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

          case 'aois':
            return await controllers.aois.handle(request, resourcePath, url);

          case 'campaigns':
            return await controllers.campaigns.handle(request, resourcePath, url);

          case 'products':
            return await controllers.products.handle(request, resourcePath, url);

          case 'maintenance':
            return await handleMaintenance(request, resourcePath, url, controllers.maintenance);

          case 'calibrations':
            return await handleCalibrations(request, resourcePath, url, controllers.calibrations);

          case 'admin':
            return await handleAdmin(request, resourcePath, url, controllers.admin);

          case 'health':
            return await handleHealth(env, container);

          case 'info':
            return handleInfo();

          case 'auth':
            // Auth routes - forward to auth handler
            // pathSegments: ['auth', 'login'] or ['auth', 'me'] or ['auth', 'verify']
            return await handleAuth(request.method, ['auth', ...resourcePath], request, env);

          case 'rois':
            // ROIs routes - V11 hexagonal architecture (v11.0.0-alpha.41)
            return await controllers.rois.handle(request, resourcePath, url);

          case 'users':
            // User management - V11 hexagonal architecture (v11.0.0-alpha.41)
            return await controllers.users.handle(request, resourcePath, url);

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
 * Maintenance routes handler
 */
async function handleMaintenance(request, resourcePath, url, maintenanceController) {
  const method = request.method;
  const id = resourcePath[0];
  const subAction = resourcePath[1];

  // Special routes
  if (id === 'timeline' && method === 'GET') {
    return await maintenanceController.timeline(request);
  }
  if (id === 'pending' && method === 'GET') {
    return await maintenanceController.pending(request);
  }
  if (id === 'overdue' && method === 'GET') {
    return await maintenanceController.overdue(request);
  }

  // CRUD routes
  if (!id) {
    if (method === 'GET') return await maintenanceController.list(request);
    if (method === 'POST') return await maintenanceController.create(request);
    return createNotFoundResponse('Method not allowed');
  }

  // ID-specific routes
  if (subAction === 'complete' && method === 'POST') {
    return await maintenanceController.complete(request, id);
  }

  if (method === 'GET') return await maintenanceController.get(request, id);
  if (method === 'PUT') return await maintenanceController.update(request, id);
  if (method === 'DELETE') return await maintenanceController.delete(request, id);

  return createNotFoundResponse(`Unknown maintenance action: ${subAction}`);
}

/**
 * Calibrations routes handler
 */
async function handleCalibrations(request, resourcePath, url, calibrationController) {
  const method = request.method;
  const id = resourcePath[0];
  const subAction = resourcePath[1];

  // Special routes
  if (id === 'timeline' && method === 'GET') {
    return await calibrationController.timeline(request);
  }
  if (id === 'current' && method === 'GET') {
    return await calibrationController.current(request);
  }
  if (id === 'expired' && method === 'GET') {
    return await calibrationController.expired(request);
  }
  if (id === 'expiring' && method === 'GET') {
    return await calibrationController.expiring(request);
  }

  // CRUD routes
  if (!id) {
    if (method === 'GET') return await calibrationController.list(request);
    if (method === 'POST') return await calibrationController.create(request);
    return createNotFoundResponse('Method not allowed');
  }

  // ID-specific routes
  if (subAction === 'expire' && method === 'POST') {
    return await calibrationController.expire(request, id);
  }

  if (method === 'GET') return await calibrationController.get(request, id);
  if (method === 'PUT') return await calibrationController.update(request, id);
  if (method === 'DELETE') return await calibrationController.delete(request, id);

  return createNotFoundResponse(`Unknown calibration action: ${subAction}`);
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
      version: '11.0.0-alpha.1',
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
        'admin-analytics',
        'aoi-geospatial',
        'campaigns',
        'products',
        'maintenance-timeline',
        'calibration-timeline',
        'darwin-core-vocabulary',
        'icos-station-types',
        'copernicus-processing-levels'
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
      version: '11.0.0-alpha.1',
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
    version: '11.0.0-alpha.1',
    architecture: 'hexagonal',
    description: 'V11 Hexagonal Architecture API with Darwin Core, ICOS, Copernicus vocabulary alignment',
    patterns: [
      'Hexagonal (Ports & Adapters)',
      'CQRS (Command Query Responsibility Segregation)',
      'Dependency Injection',
      'Domain-Driven Design',
      'Strategy Pattern (Platform Types)',
      'Registry Pattern (Instrument Types)'
    ],
    standards: {
      darwinCore: ['dwc_locationID', 'dwc_geodeticDatum', 'decimalLatitude', 'decimalLongitude'],
      icos: ['TER (Terrestrial)', 'ATM (Atmospheric)', 'AQA (Aquatic)', 'INT (Integrated)'],
      copernicus: ['L0', 'L1', 'L2', 'L3', 'L4'],
      licenses: ['CC-BY-4.0', 'CC-BY-SA-4.0', 'ODC-BY']
    },
    endpoints: {
      stations: {
        list: 'GET /api/v11/stations',
        get: 'GET /api/v11/stations/:id',
        dashboard: 'GET /api/v11/stations/:acronym/dashboard',
        create: 'POST /api/v11/stations',
        update: 'PUT /api/v11/stations/:id',
        delete: 'DELETE /api/v11/stations/:id'
      },
      platforms: {
        list: 'GET /api/v11/platforms',
        get: 'GET /api/v11/platforms/:id',
        byStation: 'GET /api/v11/platforms/station/:stationId',
        byType: 'GET /api/v11/platforms/type/:type',
        create: 'POST /api/v11/platforms',
        update: 'PUT /api/v11/platforms/:id',
        delete: 'DELETE /api/v11/platforms/:id'
      },
      instruments: {
        list: 'GET /api/v11/instruments',
        get: 'GET /api/v11/instruments/:id',
        details: 'GET /api/v11/instruments/:id/details',
        byPlatform: 'GET /api/v11/instruments/platform/:platformId',
        byStation: 'GET /api/v11/instruments/station/:stationId',
        create: 'POST /api/v11/instruments',
        update: 'PUT /api/v11/instruments/:id',
        delete: 'DELETE /api/v11/instruments/:id'
      },
      aois: {
        list: 'GET /api/v11/aois',
        get: 'GET /api/v11/aois/:id',
        byStation: 'GET /api/v11/aois/station/:stationId',
        exportGeoJSON: 'GET /api/v11/aois/export/geojson',
        create: 'POST /api/v11/aois',
        importGeoJSON: 'POST /api/v11/aois/import/geojson',
        importKML: 'POST /api/v11/aois/import/kml',
        update: 'PUT /api/v11/aois/:id',
        delete: 'DELETE /api/v11/aois/:id'
      },
      campaigns: {
        list: 'GET /api/v11/campaigns',
        get: 'GET /api/v11/campaigns/:id',
        byStation: 'GET /api/v11/campaigns/station/:stationId',
        active: 'GET /api/v11/campaigns/active',
        create: 'POST /api/v11/campaigns',
        start: 'POST /api/v11/campaigns/:id/start',
        complete: 'POST /api/v11/campaigns/:id/complete',
        update: 'PUT /api/v11/campaigns/:id',
        delete: 'DELETE /api/v11/campaigns/:id'
      },
      products: {
        list: 'GET /api/v11/products',
        get: 'GET /api/v11/products/:id',
        byDOI: 'GET /api/v11/products/doi/:doi',
        byInstrument: 'GET /api/v11/products/instrument/:instrumentId',
        byCampaign: 'GET /api/v11/products/campaign/:campaignId',
        byProcessingLevel: 'GET /api/v11/products/processing-level/:level',
        create: 'POST /api/v11/products',
        setQualityScore: 'POST /api/v11/products/:id/quality-score',
        promoteQuality: 'POST /api/v11/products/:id/promote-quality',
        update: 'PUT /api/v11/products/:id',
        delete: 'DELETE /api/v11/products/:id'
      },
      admin: {
        activityLogs: 'GET /api/v11/admin/activity-logs',
        userSessions: 'GET /api/v11/admin/user-sessions',
        stationStats: 'GET /api/v11/admin/station-stats',
        health: 'GET /api/v11/admin/health',
        summary: 'GET /api/v11/admin/summary'
      },
      maintenance: {
        list: 'GET /api/v11/maintenance',
        get: 'GET /api/v11/maintenance/:id',
        timeline: 'GET /api/v11/maintenance/timeline?entity_type=platform&entity_id=:id',
        pending: 'GET /api/v11/maintenance/pending',
        overdue: 'GET /api/v11/maintenance/overdue',
        create: 'POST /api/v11/maintenance',
        complete: 'POST /api/v11/maintenance/:id/complete',
        update: 'PUT /api/v11/maintenance/:id',
        delete: 'DELETE /api/v11/maintenance/:id'
      },
      calibrations: {
        list: 'GET /api/v11/calibrations',
        get: 'GET /api/v11/calibrations/:id',
        current: 'GET /api/v11/calibrations/current?instrument_id=:id',
        timeline: 'GET /api/v11/calibrations/timeline?instrument_id=:id',
        expired: 'GET /api/v11/calibrations/expired',
        expiring: 'GET /api/v11/calibrations/expiring?days=30',
        create: 'POST /api/v11/calibrations (multispectral/hyperspectral only)',
        expire: 'POST /api/v11/calibrations/:id/expire',
        update: 'PUT /api/v11/calibrations/:id',
        delete: 'DELETE /api/v11/calibrations/:id'
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
    },
    processingLevels: {
      L0: 'Raw data',
      L1: 'Georeferenced/registered',
      L2: 'Atmospherically corrected',
      L3: 'Composites/aggregated',
      L4: 'Derived products'
    },
    qualityControlLevels: {
      raw: 'No QC applied',
      quality_controlled: 'Automated QC passed',
      validated: 'Expert validated'
    }
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
