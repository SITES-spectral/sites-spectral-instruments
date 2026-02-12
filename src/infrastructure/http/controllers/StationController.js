/**
 * Station Controller
 *
 * HTTP controller for station endpoints.
 * Maps HTTP requests to application use cases.
 * v11.0.0-alpha.34: Added authentication and authorization middleware
 * v15.6.6: Integrated API validation utilities
 *
 * @module infrastructure/http/controllers/StationController
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
 * Station Controller
 */
export class StationController {
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
   * GET /stations - List all stations
   */
  async list(request, url) {
    // Authentication required for read
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'stations', 'read'
    );
    if (response) return response;

    // Parse and validate pagination
    const paginationResult = parsePagination(url);
    if (!paginationResult.valid) return paginationResult.error;

    // Parse and validate sorting
    const allowedSortFields = ['acronym', 'display_name', 'created_at', 'updated_at'];
    const { sortBy, sortOrder } = parseSorting(url, allowedSortFields, 'acronym');

    const result = await this.queries.listStations.execute({
      page: paginationResult.pagination.page,
      limit: paginationResult.pagination.limit,
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
    // Authentication required for read
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'stations', 'read'
    );
    if (response) return response;

    // Parse flexible ID (numeric or acronym)
    const idResult = parseFlexibleId(id);
    let station;

    if (idResult.isNumeric) {
      station = await this.queries.getStation.byId(idResult.numericValue);
    } else {
      station = await this.queries.getStation.byAcronym(idResult.stringValue.toUpperCase());
    }

    if (!station) {
      return createNotFoundResponse(`Station '${id}' not found`);
    }

    return createSuccessResponse({ data: station.toJSON() });
  }

  /**
   * GET /stations/:acronym/dashboard - Get station dashboard
   */
  async dashboard(request, acronym) {
    // Authentication required for read
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'stations', 'read'
    );
    if (response) return response;

    const result = await this.queries.getStationDashboard.execute(acronym.toUpperCase());

    if (!result) {
      return createNotFoundResponse(`Station '${acronym}' not found`);
    }

    return createSuccessResponse({ data: result });
  }

  /**
   * POST /stations - Create station
   * Requires global admin role
   */
  async create(request) {
    // Authorization: only global admins can create stations
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'stations', 'write'
    );
    if (response) return response;

    // Parse and validate request body
    const bodyResult = await parseRequestBody(request);
    if (!bodyResult.valid) return bodyResult.error;
    const body = bodyResult.body;

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

      return createSuccessResponse({ data: station.toJSON() }, 201);
    } catch (error) {
      return createErrorResponse(error.message, 400);
    }
  }

  /**
   * PUT /stations/:id - Update station
   * Requires global admin role
   */
  async update(request, id) {
    // Authorization: only global admins can update stations
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'stations', 'write'
    );
    if (response) return response;

    // Parse and validate path ID
    const idResult = parsePathId(id, 'station_id');
    if (!idResult.valid) return idResult.error;

    // Parse and validate request body
    const bodyResult = await parseRequestBody(request);
    if (!bodyResult.valid) return bodyResult.error;
    const body = bodyResult.body;

    try {
      const station = await this.commands.updateStation.execute({
        id: idResult.value,
        displayName: body.display_name || body.displayName,
        description: body.description,
        latitude: body.latitude,
        longitude: body.longitude,
        websiteUrl: body.website_url || body.websiteUrl,
        contactEmail: body.contact_email || body.contactEmail
      });

      return createSuccessResponse({ data: station.toJSON() });
    } catch (error) {
      if (error.message.includes('not found')) {
        return createNotFoundResponse(error.message);
      }
      return createErrorResponse(error.message, 400);
    }
  }

  /**
   * DELETE /stations/:id - Delete station
   * Requires global admin role with delete permission
   */
  async delete(request, id) {
    // Authorization: only global admins can delete stations
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'stations', 'delete'
    );
    if (response) return response;

    // Parse and validate path ID
    const idResult = parsePathId(id, 'station_id');
    if (!idResult.valid) return idResult.error;

    try {
      await this.commands.deleteStation.execute(idResult.value);
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
