// SITES Spectral API Handler v3.0.0
// Domain-based routing with enhanced features for UAV, Satellite, and AOI support
// Version: 8.0.0

import { handleAuth } from '../auth/authentication.js';
import { logApiRequest } from '../utils/logging.js';
import {
  createErrorResponse,
  createNotFoundResponse,
  createSuccessResponse,
  createInternalServerErrorResponse
} from '../utils/responses.js';
import { validateContentType } from '../middleware/validation.js';

// V3 Domain Handlers
import { handlePlatformsV3 } from './handlers/platforms-v3.js';
import { handleAOIsV3 } from './handlers/aois-v3.js';
import { handleCampaignsV3 } from './handlers/campaigns-v3.js';
import { handleProductsV3 } from './handlers/products-v3.js';
import { handleUAVPlatformsV3 } from './handlers/uav-platforms-v3.js';
import { handleSatellitePlatformsV3 } from './handlers/satellite-platforms-v3.js';
import { handleStationsV3 } from './handlers/stations-v3.js';
import { handleInstrumentsV3 } from './handlers/instruments-v3.js';

/**
 * V3 API Configuration
 * Defines pagination defaults, feature flags, and response formatting
 */
const V3_CONFIG = {
  version: '3.0.0',
  pagination: {
    defaultLimit: 25,
    maxLimit: 100
  },
  features: {
    spatialQueries: true,
    geoJsonResponse: true,
    campaignManagement: true,
    productCatalog: true,
    platformTypes: ['fixed', 'uav', 'satellite', 'mobile']
  },
  cors: {
    allowedOrigins: ['*'],
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  }
};

/**
 * Parse pagination parameters from request URL
 * @param {URL} url - The request URL
 * @returns {Object} Pagination parameters { limit, offset, page }
 */
export function parsePaginationParams(url) {
  const limit = Math.min(
    parseInt(url.searchParams.get('limit') || V3_CONFIG.pagination.defaultLimit, 10),
    V3_CONFIG.pagination.maxLimit
  );
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const offset = (page - 1) * limit;

  return { limit, offset, page };
}

/**
 * Parse sorting parameters from request URL
 * @param {URL} url - The request URL
 * @param {string[]} allowedFields - Fields that can be sorted
 * @returns {Object} Sorting parameters { sortBy, sortOrder }
 */
export function parseSortParams(url, allowedFields = ['created_at', 'name', 'id']) {
  let sortBy = url.searchParams.get('sort_by') || 'created_at';
  const sortOrder = url.searchParams.get('sort_order')?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  // Validate sort field
  if (!allowedFields.includes(sortBy)) {
    sortBy = 'created_at';
  }

  return { sortBy, sortOrder };
}

/**
 * Create a paginated response with metadata
 * @param {Array} data - Array of result items
 * @param {number} totalCount - Total number of items
 * @param {Object} pagination - Pagination parameters
 * @param {string} baseUrl - Base URL for navigation links
 * @returns {Object} Paginated response object
 */
export function createPaginatedResponse(data, totalCount, pagination, baseUrl) {
  const { limit, page } = pagination;
  const totalPages = Math.ceil(totalCount / limit);

  return {
    data,
    meta: {
      total: totalCount,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    },
    links: {
      self: `${baseUrl}?page=${page}&limit=${limit}`,
      first: `${baseUrl}?page=1&limit=${limit}`,
      last: `${baseUrl}?page=${totalPages}&limit=${limit}`,
      next: page < totalPages ? `${baseUrl}?page=${page + 1}&limit=${limit}` : null,
      prev: page > 1 ? `${baseUrl}?page=${page - 1}&limit=${limit}` : null
    }
  };
}

/**
 * Create a GeoJSON FeatureCollection response
 * @param {Array} features - Array of GeoJSON features
 * @param {Object} properties - Collection-level properties
 * @returns {Object} GeoJSON FeatureCollection
 */
export function createGeoJSONResponse(features, properties = {}) {
  return {
    type: 'FeatureCollection',
    features,
    properties: {
      generated_at: new Date().toISOString(),
      api_version: V3_CONFIG.version,
      ...properties
    }
  };
}

/**
 * V3 API Request Handler
 * Main router for all V3 API endpoints with domain-based routing
 *
 * Endpoint Structure:
 * - /api/v3/platforms/:type       - Platform management by type
 * - /api/v3/platforms/:id/uav     - UAV-specific platform data
 * - /api/v3/platforms/:id/satellite - Satellite-specific platform data
 * - /api/v3/aois                  - Areas of Interest CRUD
 * - /api/v3/aois/spatial          - Spatial queries (bbox, intersects, within)
 * - /api/v3/aois/:id/geojson      - Single AOI as GeoJSON
 * - /api/v3/campaigns             - Campaign management
 * - /api/v3/campaigns/:id/products - Products from a campaign
 * - /api/v3/products              - Product catalog
 * - /api/v3/products/spatial      - Products by spatial extent
 *
 * @param {Request} request - The incoming request
 * @param {Object} env - Environment variables and bindings
 * @param {Object} ctx - Request context
 * @returns {Response} API response
 */
export async function handleApiV3Request(request, env, ctx) {
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/').filter(segment => segment);

  // Remove 'api' and 'v3' from path segments
  if (pathSegments[0] === 'api') {
    pathSegments.shift();
  }
  if (pathSegments[0] === 'v3') {
    pathSegments.shift();
  }

  const method = request.method;
  const resource = pathSegments[0];
  const resourceId = pathSegments[1];
  const subResource = pathSegments[2];

  // Log API request for audit trail
  await logApiRequest(request, env, ctx);

  // Validate Content-Type for write operations
  const contentTypeError = validateContentType(request);
  if (contentTypeError) {
    return contentTypeError;
  }

  try {
    // Route based on primary resource
    switch (resource) {
      // Authentication (shared with other versions)
      case 'auth':
        return await handleAuth(method, pathSegments, request, env);

      // Platform management with type-specific routing
      case 'platforms':
        return await routePlatformsV3(method, pathSegments, request, env, url);

      // UAV-specific endpoints (shortcut)
      case 'uav':
        return await handleUAVPlatformsV3(method, pathSegments.slice(1), request, env, url);

      // Satellite-specific endpoints (shortcut)
      case 'satellite':
        return await handleSatellitePlatformsV3(method, pathSegments.slice(1), request, env, url);

      // Areas of Interest with spatial queries
      case 'aois':
        return await routeAOIsV3(method, pathSegments, request, env, url);

      // Campaign management
      case 'campaigns':
        return await routeCampaignsV3(method, pathSegments, request, env, url);

      // Product catalog
      case 'products':
        return await routeProductsV3(method, pathSegments, request, env, url);

      // Stations (V3 with pagination)
      case 'stations':
        return await handleStationsV3(request, env, ctx, pathSegments.slice(1));

      // Instruments (V3 with pagination)
      case 'instruments':
        return await handleInstrumentsV3(request, env, ctx, pathSegments.slice(1));

      // Health check
      case 'health':
        return await handleHealthV3(env);

      // API information
      case 'info':
        return handleApiInfo();

      default:
        return createNotFoundResponse();
    }
  } catch (error) {
    console.error('API V3 Error:', error);
    return createInternalServerErrorResponse(error);
  }
}

/**
 * Route platform requests with type-specific handling
 *
 * Endpoints:
 * - GET    /api/v3/platforms                   - List all platforms (paginated)
 * - GET    /api/v3/platforms/:id               - Get platform by ID
 * - GET    /api/v3/platforms/type/:type        - Get platforms by type (uav, satellite, fixed)
 * - GET    /api/v3/platforms/:id/uav           - Get UAV extension data
 * - GET    /api/v3/platforms/:id/satellite     - Get satellite extension data
 * - POST   /api/v3/platforms                   - Create platform
 * - PUT    /api/v3/platforms/:id               - Update platform
 * - DELETE /api/v3/platforms/:id               - Delete platform
 */
async function routePlatformsV3(method, pathSegments, request, env, url) {
  const resourceId = pathSegments[1];
  const subResource = pathSegments[2];
  const subResourceId = pathSegments[3];

  // Handle /platforms/type/:type - Get platforms by type
  if (resourceId === 'type' && subResource) {
    const platformType = subResource;
    if (!V3_CONFIG.features.platformTypes.includes(platformType)) {
      return createErrorResponse(`Invalid platform type: ${platformType}. Valid types: ${V3_CONFIG.features.platformTypes.join(', ')}`, 400);
    }
    return await handlePlatformsV3(method, { type: platformType }, request, env, url);
  }

  // Handle /platforms/:id/uav - UAV extension data
  if (resourceId && subResource === 'uav') {
    return await handleUAVPlatformsV3(method, [resourceId], request, env, url);
  }

  // Handle /platforms/:id/satellite - Satellite extension data
  if (resourceId && subResource === 'satellite') {
    return await handleSatellitePlatformsV3(method, [resourceId], request, env, url);
  }

  // Handle /platforms/:id/campaigns - Campaigns for platform
  if (resourceId && subResource === 'campaigns') {
    return await handleCampaignsV3(method, { platformId: resourceId }, request, env, url);
  }

  // Handle /platforms/:id/products - Products for platform
  if (resourceId && subResource === 'products') {
    return await handleProductsV3(method, { platformId: resourceId }, request, env, url);
  }

  // Handle /platforms/:id/aois - AOIs for platform
  if (resourceId && subResource === 'aois') {
    return await handleAOIsV3(method, { platformId: resourceId }, request, env, url);
  }

  // Standard platform CRUD
  return await handlePlatformsV3(method, { id: resourceId }, request, env, url);
}

/**
 * Route AOI requests with spatial query support
 *
 * Endpoints:
 * - GET    /api/v3/aois                        - List all AOIs (paginated)
 * - GET    /api/v3/aois/:id                    - Get AOI by ID
 * - GET    /api/v3/aois/:id/geojson            - Get AOI as GeoJSON Feature
 * - GET    /api/v3/aois/spatial/bbox           - Query AOIs within bounding box
 * - GET    /api/v3/aois/spatial/point          - Query AOIs containing a point
 * - GET    /api/v3/aois/spatial/intersects     - Query AOIs intersecting geometry
 * - GET    /api/v3/aois/geojson                - Get all AOIs as FeatureCollection
 * - POST   /api/v3/aois                        - Create AOI
 * - PUT    /api/v3/aois/:id                    - Update AOI
 * - DELETE /api/v3/aois/:id                    - Delete AOI
 */
async function routeAOIsV3(method, pathSegments, request, env, url) {
  const resourceId = pathSegments[1];
  const subResource = pathSegments[2];

  // Handle spatial queries: /aois/spatial/:queryType
  if (resourceId === 'spatial' && subResource) {
    return await handleAOIsV3(method, { spatialQuery: subResource }, request, env, url);
  }

  // Handle /aois/geojson - All AOIs as FeatureCollection
  if (resourceId === 'geojson') {
    return await handleAOIsV3(method, { format: 'geojson' }, request, env, url);
  }

  // Handle /aois/station/:stationId - AOIs for a station
  if (resourceId === 'station' && subResource) {
    return await handleAOIsV3(method, { stationId: subResource }, request, env, url);
  }

  // Handle /aois/:id/geojson - Single AOI as GeoJSON
  if (resourceId && subResource === 'geojson') {
    return await handleAOIsV3(method, { id: resourceId, format: 'geojson' }, request, env, url);
  }

  // Handle /aois/:id/campaigns - Campaigns for AOI
  if (resourceId && subResource === 'campaigns') {
    return await handleCampaignsV3(method, { aoiId: resourceId }, request, env, url);
  }

  // Standard AOI CRUD
  return await handleAOIsV3(method, { id: resourceId }, request, env, url);
}

/**
 * Route campaign requests
 *
 * Endpoints:
 * - GET    /api/v3/campaigns                   - List all campaigns (paginated)
 * - GET    /api/v3/campaigns/:id               - Get campaign by ID
 * - GET    /api/v3/campaigns/:id/products      - Get products from campaign
 * - GET    /api/v3/campaigns/status/:status    - Get campaigns by status
 * - GET    /api/v3/campaigns/station/:id       - Get campaigns for station
 * - GET    /api/v3/campaigns/upcoming          - Get upcoming campaigns
 * - GET    /api/v3/campaigns/calendar          - Get campaigns in calendar format
 * - POST   /api/v3/campaigns                   - Create campaign
 * - PUT    /api/v3/campaigns/:id               - Update campaign
 * - PUT    /api/v3/campaigns/:id/status        - Update campaign status
 * - PUT    /api/v3/campaigns/:id/complete      - Complete a campaign
 * - DELETE /api/v3/campaigns/:id               - Delete campaign
 */
async function routeCampaignsV3(method, pathSegments, request, env, url) {
  const resourceId = pathSegments[1];
  const subResource = pathSegments[2];

  // Handle /campaigns/status/:status - Filter by status
  if (resourceId === 'status' && subResource) {
    return await handleCampaignsV3(method, { status: subResource }, request, env, url);
  }

  // Handle /campaigns/upcoming - Upcoming campaigns
  if (resourceId === 'upcoming') {
    return await handleCampaignsV3(method, { upcoming: true }, request, env, url);
  }

  // Handle /campaigns/calendar - Calendar format
  if (resourceId === 'calendar') {
    return await handleCampaignsV3(method, { calendar: true }, request, env, url);
  }

  // Handle /campaigns/station/:stationId - Filter by station
  if (resourceId === 'station' && subResource) {
    return await handleCampaignsV3(method, { stationId: subResource }, request, env, url);
  }

  // Handle /campaigns/platform/:platformId - Filter by platform
  if (resourceId === 'platform' && subResource) {
    return await handleCampaignsV3(method, { platformId: subResource }, request, env, url);
  }

  // Handle /campaigns/:id/products - Products for campaign
  if (resourceId && subResource === 'products') {
    return await handleProductsV3(method, { campaignId: resourceId }, request, env, url);
  }

  // Handle /campaigns/:id/status - Update status only
  if (resourceId && subResource === 'status' && method === 'PUT') {
    return await handleCampaignsV3(method, { id: resourceId, updateStatus: true }, request, env, url);
  }

  // Handle /campaigns/:id/complete - Complete campaign
  if (resourceId && subResource === 'complete' && method === 'PUT') {
    return await handleCampaignsV3(method, { id: resourceId, complete: true }, request, env, url);
  }

  // Standard campaign CRUD
  return await handleCampaignsV3(method, { id: resourceId }, request, env, url);
}

/**
 * Route product requests
 *
 * Endpoints:
 * - GET    /api/v3/products                    - List all products (paginated)
 * - GET    /api/v3/products/:id                - Get product by ID
 * - GET    /api/v3/products/type/:type         - Get products by type (ndvi, orthomosaic, etc.)
 * - GET    /api/v3/products/spatial/bbox       - Query products within bounding box
 * - GET    /api/v3/products/station/:id        - Get products for station
 * - GET    /api/v3/products/date/:date         - Get products for date
 * - POST   /api/v3/products                    - Create product record
 * - PUT    /api/v3/products/:id                - Update product
 * - DELETE /api/v3/products/:id                - Delete product record
 */
async function routeProductsV3(method, pathSegments, request, env, url) {
  const resourceId = pathSegments[1];
  const subResource = pathSegments[2];

  // Handle /products/types - List available product types
  if (resourceId === 'types') {
    return await handleProductsV3(method, { listTypes: true }, request, env, url);
  }

  // Handle /products/stats - Product statistics
  if (resourceId === 'stats') {
    return await handleProductsV3(method, { stats: true }, request, env, url);
  }

  // Handle /products/timeline - Timeline format
  if (resourceId === 'timeline') {
    return await handleProductsV3(method, { timeline: true }, request, env, url);
  }

  // Handle /products/type/:productType - Filter by type
  if (resourceId === 'type' && subResource) {
    return await handleProductsV3(method, { productType: subResource }, request, env, url);
  }

  // Handle /products/spatial/:queryType - Spatial queries
  if (resourceId === 'spatial' && subResource) {
    return await handleProductsV3(method, { spatialQuery: subResource }, request, env, url);
  }

  // Handle /products/station/:stationId - Filter by station
  if (resourceId === 'station' && subResource) {
    return await handleProductsV3(method, { stationId: subResource }, request, env, url);
  }

  // Handle /products/platform/:platformId - Filter by platform
  if (resourceId === 'platform' && subResource) {
    return await handleProductsV3(method, { platformId: subResource }, request, env, url);
  }

  // Handle /products/date/:date - Filter by date
  if (resourceId === 'date' && subResource) {
    return await handleProductsV3(method, { date: subResource }, request, env, url);
  }

  // Handle /products/:id/archive - Archive product
  if (resourceId && subResource === 'archive' && method === 'PUT') {
    return await handleProductsV3(method, { id: resourceId, archive: true }, request, env, url);
  }

  // Standard product CRUD
  return await handleProductsV3(method, { id: resourceId }, request, env, url);
}

/**
 * Health check endpoint for V3 API
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Health status response
 */
async function handleHealthV3(env) {
  try {
    const dbTest = await env.DB.prepare('SELECT 1 as test').first();

    // Get counts from key tables
    const [platformTypes, aois, campaigns, products] = await Promise.all([
      env.DB.prepare('SELECT COUNT(*) as count FROM platform_types').first(),
      env.DB.prepare('SELECT COUNT(*) as count FROM areas_of_interest').first(),
      env.DB.prepare('SELECT COUNT(*) as count FROM acquisition_campaigns').first(),
      env.DB.prepare('SELECT COUNT(*) as count FROM products').first()
    ]);

    // Build features array from config
    const featuresArray = [
      'aoi-support',
      'uav-platforms',
      'satellite-platforms',
      'spatial-queries',
      'geojson-export',
      'campaign-management',
      'product-catalog'
    ];

    return createSuccessResponse({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '8.0.0',
      apiVersions: ['v3'],
      database: dbTest ? 'connected' : 'disconnected',
      features: featuresArray,
      stats: {
        platformTypes: platformTypes?.count || 0,
        areasOfInterest: aois?.count || 0,
        campaigns: campaigns?.count || 0,
        products: products?.count || 0
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return new Response(JSON.stringify({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '8.0.0',
      apiVersion: 'v3',
      error: error.message,
      database: 'disconnected'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * API information endpoint
 * @returns {Response} API info response
 */
function handleApiInfo() {
  return createSuccessResponse({
    name: 'SITES Spectral Instruments API',
    version: V3_CONFIG.version,
    description: 'Domain-based REST API for managing research station instruments, UAV/satellite platforms, and observation data',
    documentation: '/api/v3/docs',
    endpoints: {
      platforms: {
        base: '/api/v3/platforms',
        types: '/api/v3/platforms/type/{type}',
        uav: '/api/v3/platforms/{id}/uav',
        satellite: '/api/v3/platforms/{id}/satellite'
      },
      aois: {
        base: '/api/v3/aois',
        spatial: {
          bbox: '/api/v3/aois/spatial/bbox?minLon=&minLat=&maxLon=&maxLat=',
          point: '/api/v3/aois/spatial/point?lon=&lat=',
          intersects: '/api/v3/aois/spatial/intersects'
        },
        geojson: '/api/v3/aois/geojson'
      },
      campaigns: {
        base: '/api/v3/campaigns',
        byStatus: '/api/v3/campaigns/status/{status}',
        products: '/api/v3/campaigns/{id}/products'
      },
      products: {
        base: '/api/v3/products',
        byType: '/api/v3/products/type/{type}',
        spatial: '/api/v3/products/spatial/bbox'
      }
    },
    platformTypes: V3_CONFIG.features.platformTypes,
    authentication: 'JWT Bearer token required in Authorization header'
  });
}

export { V3_CONFIG };
