/**
 * Platform Controller
 *
 * HTTP controller for platform endpoints.
 * Maps HTTP requests to application use cases.
 * v11.0.0-alpha.34: Added authentication and authorization middleware
 * v15.6.6: Integrated API validation utilities
 *
 * @module infrastructure/http/controllers/PlatformController
 * @see docs/audits/2026-02-11-COMPREHENSIVE-SECURITY-AUDIT.md
 */

import {
  createSuccessResponse,
  createErrorResponse,
  createNotFoundResponse
} from '../../../utils/responses.js';
import { AuthMiddleware } from '../middleware/AuthMiddleware.js';
import {
  parsePagination,
  parsePathId,
  parseRequestBody,
  parseSorting,
  parseFlexibleId
} from './ControllerUtils.js';

/**
 * Platform Controller
 */
export class PlatformController {
  /**
   * @param {Object} container - Dependency injection container
   * @param {Object} env - Cloudflare Worker environment
   */
  constructor(container, env) {
    this.queries = container.queries;
    this.commands = container.commands;
    this.auth = new AuthMiddleware(env);
  }

  /**
   * GET /platforms - List all platforms
   * Supports filtering by:
   * - station: Station acronym (e.g., 'RBD', 'SVB') - resolves to station_id
   * - station_id: Numeric station ID (legacy support)
   * - platform_type: Platform type filter
   * - ecosystem_code: Ecosystem code filter
   */
  async list(request, url) {
    // Authentication required for read
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'platforms', 'read'
    );
    if (response) return response;

    // Parse and validate pagination
    const paginationResult = parsePagination(url);
    if (!paginationResult.valid) return paginationResult.error;

    // Parse and validate sorting
    const allowedSortFields = ['normalized_name', 'display_name', 'platform_type', 'created_at'];
    const { sortBy, sortOrder } = parseSorting(url, allowedSortFields, 'normalized_name');

    const platformType = url.searchParams.get('platform_type') || url.searchParams.get('type');
    const ecosystemCode = url.searchParams.get('ecosystem_code');

    // Support both 'station' (acronym) and 'station_id' (numeric) parameters
    // v12.0.1: Fix for frontend sending station acronym instead of numeric ID
    let stationId = url.searchParams.get('station_id');
    const stationAcronym = url.searchParams.get('station');

    if (!stationId && stationAcronym) {
      // Resolve station acronym to ID
      const station = await this.queries.getStation.byAcronym(stationAcronym.toUpperCase());
      if (station) {
        stationId = station.id;
      }
    }

    const result = await this.queries.listPlatforms.execute({
      page: paginationResult.pagination.page,
      limit: paginationResult.pagination.limit,
      sortBy,
      sortOrder,
      stationId: stationId ? parseInt(stationId, 10) : undefined,
      platformType,
      ecosystemCode
    });

    return createSuccessResponse({
      data: result.items.map(p => p.toJSON()),
      meta: result.pagination
    });
  }

  /**
   * GET /platforms/station/:stationId - Get platforms by station
   */
  async byStation(request, stationId) {
    // Authentication required for read
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'platforms', 'read'
    );
    if (response) return response;

    // Parse and validate station ID
    const idResult = parsePathId(stationId, 'station_id');
    if (!idResult.valid) return idResult.error;

    const platforms = await this.queries.listPlatforms.byStationId(idResult.value);

    return createSuccessResponse({
      data: platforms.map(p => p.toJSON())
    });
  }

  /**
   * GET /platforms/type/:type - Get platforms by type
   */
  async byType(request, platformType, url) {
    // Authentication required for read
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'platforms', 'read'
    );
    if (response) return response;

    // Parse and validate pagination
    const paginationResult = parsePagination(url);
    if (!paginationResult.valid) return paginationResult.error;

    const result = await this.queries.listPlatforms.execute({
      platformType,
      page: paginationResult.pagination.page,
      limit: paginationResult.pagination.limit
    });

    return createSuccessResponse({
      data: result.items.map(p => p.toJSON()),
      meta: result.pagination
    });
  }

  /**
   * GET /platforms/:id - Get platform by ID or normalized name
   */
  async get(request, id) {
    // Authentication required for read
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'platforms', 'read'
    );
    if (response) return response;

    // Parse flexible ID (numeric or normalized name)
    const idResult = parseFlexibleId(id);
    let platform;

    if (idResult.isNumeric) {
      platform = await this.queries.getPlatform.byId(idResult.numericValue);
    } else {
      platform = await this.queries.getPlatform.byNormalizedName(idResult.stringValue.toUpperCase());
    }

    if (!platform) {
      return createNotFoundResponse(`Platform '${id}' not found`);
    }

    return createSuccessResponse({ data: platform.toJSON() });
  }

  /**
   * POST /platforms - Create platform
   * Requires write permission on platforms resource
   */
  async create(request) {
    // Parse and validate request body first
    const bodyResult = await parseRequestBody(request);
    if (!bodyResult.valid) return bodyResult.error;
    const body = bodyResult.body;

    // Get station ID for authorization context
    const stationId = body.station_id || body.stationId;

    // Authorization: station admins can create platforms at their station
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'platforms', 'write', { stationId }
    );
    if (response) return response;

    try {
      const result = await this.commands.createPlatform.execute({
        stationId,
        platformType: body.platform_type || body.platformType || 'fixed',
        ecosystemCode: body.ecosystem_code || body.ecosystemCode,
        mountTypeCode: body.mount_type_code || body.mountTypeCode,
        displayName: body.display_name || body.displayName,
        description: body.description,
        latitude: body.latitude,
        longitude: body.longitude,
        // UAV-specific
        vendor: body.vendor,
        model: body.model,
        // Satellite-specific
        agency: body.agency,
        satellite: body.satellite,
        sensor: body.sensor
      });

      return createSuccessResponse({
        data: {
          platform: result.platform.toJSON(),
          instruments: result.instruments.map(i => i.toJSON())
        }
      }, 201);
    } catch (error) {
      return createErrorResponse(error.message, 400);
    }
  }

  /**
   * PUT /platforms/:id - Update platform
   * Requires write permission on platforms resource
   */
  async update(request, id) {
    // Parse and validate path ID
    const idResult = parsePathId(id, 'platform_id');
    if (!idResult.valid) return idResult.error;

    // First get the platform to determine its station
    let platform = await this.queries.getPlatform.byId(idResult.value);
    if (!platform) {
      return createNotFoundResponse(`Platform '${id}' not found`);
    }

    // Authorization: station admins can update platforms at their station
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'platforms', 'write', { stationId: platform.stationId }
    );
    if (response) return response;

    // Parse and validate request body
    const bodyResult = await parseRequestBody(request);
    if (!bodyResult.valid) return bodyResult.error;
    const body = bodyResult.body;

    try {
      const updatedPlatform = await this.commands.updatePlatform.execute({
        id: idResult.value,
        displayName: body.display_name || body.displayName,
        description: body.description,
        latitude: body.latitude,
        longitude: body.longitude,
        status: body.status
      });

      return createSuccessResponse({ data: updatedPlatform.toJSON() });
    } catch (error) {
      if (error.message.includes('not found')) {
        return createNotFoundResponse(error.message);
      }
      return createErrorResponse(error.message, 400);
    }
  }

  /**
   * DELETE /platforms/:id - Delete platform
   * Requires delete permission on platforms resource
   */
  async delete(request, id) {
    // Parse and validate path ID
    const idResult = parsePathId(id, 'platform_id');
    if (!idResult.valid) return idResult.error;

    // First get the platform to determine its station
    let platform = await this.queries.getPlatform.byId(idResult.value);
    if (!platform) {
      return createNotFoundResponse(`Platform '${id}' not found`);
    }

    // Authorization: station admins can delete platforms at their station
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'platforms', 'delete', { stationId: platform.stationId }
    );
    if (response) return response;

    try {
      await this.commands.deletePlatform.execute(idResult.value);
      return createSuccessResponse({ deleted: true });
    } catch (error) {
      if (error.message.includes('not found')) {
        return createNotFoundResponse(error.message);
      }
      if (error.message.includes('Cannot delete')) {
        return createErrorResponse(error.message, 409); // Conflict
      }
      return createErrorResponse(error.message, 400);
    }
  }

  /**
   * Handle request routing
   */
  async handle(request, pathSegments, url) {
    const method = request.method;
    const id = pathSegments[0];
    const subResource = pathSegments[1];

    // GET /platforms
    if (method === 'GET' && !id) {
      return this.list(request, url);
    }

    // GET /platforms/station/:stationId
    if (method === 'GET' && id === 'station' && subResource) {
      return this.byStation(request, subResource);
    }

    // GET /platforms/type/:type
    if (method === 'GET' && id === 'type' && subResource) {
      return this.byType(request, subResource, url);
    }

    // GET /platforms/:id
    if (method === 'GET' && id) {
      return this.get(request, id);
    }

    // POST /platforms
    if (method === 'POST' && !id) {
      return this.create(request);
    }

    // PUT /platforms/:id
    if (method === 'PUT' && id) {
      return this.update(request, id);
    }

    // DELETE /platforms/:id
    if (method === 'DELETE' && id) {
      return this.delete(request, id);
    }

    return createNotFoundResponse();
  }
}
