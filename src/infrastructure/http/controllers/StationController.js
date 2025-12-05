/**
 * Station Controller
 *
 * HTTP controller for station endpoints.
 * Maps HTTP requests to application use cases.
 *
 * @module infrastructure/http/controllers/StationController
 */

import {
  createSuccessResponse,
  createErrorResponse,
  createNotFoundResponse
} from '../../../utils/responses.js';

/**
 * Station Controller
 */
export class StationController {
  /**
   * @param {Object} container - Dependency injection container
   */
  constructor(container) {
    this.queries = container.queries;
    this.commands = container.commands;
  }

  /**
   * GET /stations - List all stations
   */
  async list(request, url) {
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = Math.min(
      parseInt(url.searchParams.get('limit') || '25', 10),
      100
    );
    const sortBy = url.searchParams.get('sort_by') || 'acronym';
    const sortOrder = url.searchParams.get('sort_order') || 'asc';

    const result = await this.queries.listStations.execute({
      page,
      limit,
      sortBy,
      sortOrder
    });

    return createSuccessResponse({
      data: result.items.map(s => s.toJSON()),
      meta: result.pagination
    });
  }

  /**
   * GET /stations/:id - Get station by ID or acronym
   */
  async get(request, id) {
    let station;

    // Check if ID is numeric or acronym
    if (/^\d+$/.test(id)) {
      station = await this.queries.getStation.byId(parseInt(id, 10));
    } else {
      station = await this.queries.getStation.byAcronym(id.toUpperCase());
    }

    if (!station) {
      return createNotFoundResponse(`Station '${id}' not found`);
    }

    return createSuccessResponse(station.toJSON());
  }

  /**
   * GET /stations/:acronym/dashboard - Get station dashboard
   */
  async dashboard(request, acronym) {
    const result = await this.queries.getStationDashboard.execute(acronym.toUpperCase());

    if (!result) {
      return createNotFoundResponse(`Station '${acronym}' not found`);
    }

    return createSuccessResponse(result);
  }

  /**
   * POST /stations - Create station
   */
  async create(request) {
    const body = await request.json();

    try {
      const station = await this.commands.createStation.execute({
        acronym: body.acronym,
        displayName: body.display_name || body.displayName,
        description: body.description,
        latitude: body.latitude,
        longitude: body.longitude,
        websiteUrl: body.website_url || body.websiteUrl,
        contactEmail: body.contact_email || body.contactEmail
      });

      return createSuccessResponse(station.toJSON(), 201);
    } catch (error) {
      return createErrorResponse(error.message, 400);
    }
  }

  /**
   * PUT /stations/:id - Update station
   */
  async update(request, id) {
    const body = await request.json();

    try {
      const station = await this.commands.updateStation.execute({
        id: parseInt(id, 10),
        displayName: body.display_name || body.displayName,
        description: body.description,
        latitude: body.latitude,
        longitude: body.longitude,
        websiteUrl: body.website_url || body.websiteUrl,
        contactEmail: body.contact_email || body.contactEmail
      });

      return createSuccessResponse(station.toJSON());
    } catch (error) {
      if (error.message.includes('not found')) {
        return createNotFoundResponse(error.message);
      }
      return createErrorResponse(error.message, 400);
    }
  }

  /**
   * DELETE /stations/:id - Delete station
   */
  async delete(request, id) {
    try {
      await this.commands.deleteStation.execute(parseInt(id, 10));
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

    // GET /stations
    if (method === 'GET' && !id) {
      return this.list(request, url);
    }

    // GET /stations/:id/dashboard
    if (method === 'GET' && id && subResource === 'dashboard') {
      return this.dashboard(request, id);
    }

    // GET /stations/:id
    if (method === 'GET' && id) {
      return this.get(request, id);
    }

    // POST /stations
    if (method === 'POST' && !id) {
      return this.create(request);
    }

    // PUT /stations/:id
    if (method === 'PUT' && id) {
      return this.update(request, id);
    }

    // DELETE /stations/:id
    if (method === 'DELETE' && id) {
      return this.delete(request, id);
    }

    return createNotFoundResponse();
  }
}
