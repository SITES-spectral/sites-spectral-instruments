/**
 * Instrument Controller
 *
 * HTTP controller for instrument endpoints.
 * Maps HTTP requests to application use cases.
 *
 * @module infrastructure/http/controllers/InstrumentController
 */

import {
  createSuccessResponse,
  createErrorResponse,
  createNotFoundResponse
} from '../../../utils/responses.js';

/**
 * Instrument Controller
 */
export class InstrumentController {
  /**
   * @param {Object} container - Dependency injection container
   */
  constructor(container) {
    this.queries = container.queries;
    this.commands = container.commands;
  }

  /**
   * GET /instruments - List all instruments
   */
  async list(request, url) {
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = Math.min(
      parseInt(url.searchParams.get('limit') || '25', 10),
      100
    );
    const sortBy = url.searchParams.get('sort_by') || 'normalized_name';
    const sortOrder = url.searchParams.get('sort_order') || 'asc';
    const platformId = url.searchParams.get('platform_id');
    const stationId = url.searchParams.get('station_id');
    const instrumentType = url.searchParams.get('instrument_type');
    const status = url.searchParams.get('status');

    const result = await this.queries.listInstruments.execute({
      page,
      limit,
      sortBy,
      sortOrder,
      platformId: platformId ? parseInt(platformId, 10) : undefined,
      stationId: stationId ? parseInt(stationId, 10) : undefined,
      instrumentType,
      status
    });

    return createSuccessResponse({
      data: result.items.map(i => i.toJSON()),
      meta: result.pagination
    });
  }

  /**
   * GET /instruments/platform/:platformId - Get instruments by platform
   */
  async byPlatform(request, platformId) {
    const instruments = await this.queries.listInstruments.byPlatformId(
      parseInt(platformId, 10)
    );

    return createSuccessResponse({
      data: instruments.map(i => i.toJSON())
    });
  }

  /**
   * GET /instruments/station/:stationId - Get instruments by station
   */
  async byStation(request, stationId) {
    const instruments = await this.queries.listInstruments.byStationId(
      parseInt(stationId, 10)
    );

    return createSuccessResponse({
      data: instruments.map(i => i.toJSON())
    });
  }

  /**
   * GET /instruments/:id - Get instrument by ID or normalized name
   */
  async get(request, id, withDetails = false) {
    let instrument;

    if (/^\d+$/.test(id)) {
      instrument = withDetails
        ? await this.queries.getInstrument.withDetails(parseInt(id, 10))
        : await this.queries.getInstrument.byId(parseInt(id, 10));
    } else {
      instrument = await this.queries.getInstrument.byNormalizedName(id.toUpperCase());
    }

    if (!instrument) {
      return createNotFoundResponse(`Instrument '${id}' not found`);
    }

    // Handle both entity and plain object (from withDetails)
    const instrumentData = typeof instrument.toJSON === 'function' ? instrument.toJSON() : instrument;
    return createSuccessResponse({ data: instrumentData });
  }

  /**
   * POST /instruments - Create instrument
   */
  async create(request) {
    const body = await request.json();

    try {
      const instrument = await this.commands.createInstrument.execute({
        platformId: body.platform_id || body.platformId,
        instrumentType: body.instrument_type || body.instrumentType,
        normalizedName: body.normalized_name || body.normalizedName,
        displayName: body.display_name || body.displayName,
        description: body.description,
        status: body.status,
        specifications: body.specifications || {}
      });

      return createSuccessResponse({ data: instrument.toJSON() }, 201);
    } catch (error) {
      return createErrorResponse(error.message, 400);
    }
  }

  /**
   * PUT /instruments/:id - Update instrument
   */
  async update(request, id) {
    const body = await request.json();

    try {
      const instrument = await this.commands.updateInstrument.execute({
        id: parseInt(id, 10),
        displayName: body.display_name || body.displayName,
        description: body.description,
        status: body.status,
        measurementStatus: body.measurement_status || body.measurementStatus,
        specifications: body.specifications
      });

      return createSuccessResponse({ data: instrument.toJSON() });
    } catch (error) {
      if (error.message.includes('not found')) {
        return createNotFoundResponse(error.message);
      }
      return createErrorResponse(error.message, 400);
    }
  }

  /**
   * DELETE /instruments/:id - Delete instrument
   */
  async delete(request, id, url) {
    const cascade = url.searchParams.get('cascade') === 'true';

    try {
      await this.commands.deleteInstrument.execute(parseInt(id, 10), { cascade });
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

    // GET /instruments
    if (method === 'GET' && !id) {
      return this.list(request, url);
    }

    // GET /instruments/platform/:platformId
    if (method === 'GET' && id === 'platform' && subResource) {
      return this.byPlatform(request, subResource);
    }

    // GET /instruments/station/:stationId
    if (method === 'GET' && id === 'station' && subResource) {
      return this.byStation(request, subResource);
    }

    // GET /instruments/:id/details
    if (method === 'GET' && id && subResource === 'details') {
      return this.get(request, id, true);
    }

    // GET /instruments/:id
    if (method === 'GET' && id) {
      return this.get(request, id);
    }

    // POST /instruments
    if (method === 'POST' && !id) {
      return this.create(request);
    }

    // PUT /instruments/:id
    if (method === 'PUT' && id) {
      return this.update(request, id);
    }

    // DELETE /instruments/:id
    if (method === 'DELETE' && id) {
      return this.delete(request, id, url);
    }

    return createNotFoundResponse();
  }
}
