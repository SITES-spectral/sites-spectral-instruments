/**
 * Platform Controller
 *
 * HTTP controller for platform endpoints.
 * Maps HTTP requests to application use cases.
 *
 * @module infrastructure/http/controllers/PlatformController
 */

import {
  createSuccessResponse,
  createErrorResponse,
  createNotFoundResponse
} from '../../../utils/responses.js';

/**
 * Platform Controller
 */
export class PlatformController {
  /**
   * @param {Object} container - Dependency injection container
   */
  constructor(container) {
    this.queries = container.queries;
    this.commands = container.commands;
  }

  /**
   * GET /platforms - List all platforms
   */
  async list(request, url) {
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = Math.min(
      parseInt(url.searchParams.get('limit') || '25', 10),
      100
    );
    const sortBy = url.searchParams.get('sort_by') || 'normalized_name';
    const sortOrder = url.searchParams.get('sort_order') || 'asc';
    const stationId = url.searchParams.get('station_id');
    const platformType = url.searchParams.get('platform_type');
    const ecosystemCode = url.searchParams.get('ecosystem_code');

    const result = await this.queries.listPlatforms.execute({
      page,
      limit,
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
    const platforms = await this.queries.listPlatforms.byStationId(
      parseInt(stationId, 10)
    );

    return createSuccessResponse({
      data: platforms.map(p => p.toJSON())
    });
  }

  /**
   * GET /platforms/type/:type - Get platforms by type
   */
  async byType(request, platformType, url) {
    const result = await this.queries.listPlatforms.execute({
      platformType,
      page: parseInt(url.searchParams.get('page') || '1', 10),
      limit: Math.min(parseInt(url.searchParams.get('limit') || '25', 10), 100)
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
    let platform;

    // Check if ID is numeric or normalized name
    if (/^\d+$/.test(id)) {
      platform = await this.queries.getPlatform.byId(parseInt(id, 10));
    } else {
      platform = await this.queries.getPlatform.byNormalizedName(id.toUpperCase());
    }

    if (!platform) {
      return createNotFoundResponse(`Platform '${id}' not found`);
    }

    return createSuccessResponse(platform.toJSON());
  }

  /**
   * POST /platforms - Create platform
   */
  async create(request) {
    const body = await request.json();

    try {
      const result = await this.commands.createPlatform.execute({
        stationId: body.station_id || body.stationId,
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
        platform: result.platform.toJSON(),
        instruments: result.instruments.map(i => i.toJSON())
      }, 201);
    } catch (error) {
      return createErrorResponse(error.message, 400);
    }
  }

  /**
   * PUT /platforms/:id - Update platform
   */
  async update(request, id) {
    const body = await request.json();

    try {
      const platform = await this.commands.updatePlatform.execute({
        id: parseInt(id, 10),
        displayName: body.display_name || body.displayName,
        description: body.description,
        latitude: body.latitude,
        longitude: body.longitude,
        status: body.status
      });

      return createSuccessResponse(platform.toJSON());
    } catch (error) {
      if (error.message.includes('not found')) {
        return createNotFoundResponse(error.message);
      }
      return createErrorResponse(error.message, 400);
    }
  }

  /**
   * DELETE /platforms/:id - Delete platform
   */
  async delete(request, id) {
    try {
      await this.commands.deletePlatform.execute(parseInt(id, 10));
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
