/**
 * AOI Controller (V11 Architecture)
 *
 * HTTP controller for Areas of Interest endpoints.
 * Maps HTTP requests to application use cases.
 * Supports GeoJSON/KML import and geospatial queries.
 * v11.0.0-alpha.34: Added authentication and authorization middleware
 *
 * @module infrastructure/http/controllers/AOIController
 */

import {
  createSuccessResponse,
  createErrorResponse,
  createNotFoundResponse
} from '../../../utils/responses.js';
import { AuthMiddleware } from '../middleware/AuthMiddleware.js';

/**
 * AOI Controller
 */
export class AOIController {
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
   * GET /aois - List AOIs with filters
   */
  async list(request, url) {
    // Authentication required for read
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'aois', 'read'
    );
    if (response) return response;

    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = Math.min(
      parseInt(url.searchParams.get('limit') || '25', 10),
      100
    );
    const stationId = url.searchParams.get('station_id');
    const ecosystemCode = url.searchParams.get('ecosystem_code');
    const geometryType = url.searchParams.get('geometry_type');
    const platformTypeCode = url.searchParams.get('platform_type_code');
    const platformId = url.searchParams.get('platform_id');
    const missionType = url.searchParams.get('mission_type');

    const result = await this.queries.listAOIs.execute({
      page,
      limit,
      stationId: stationId ? parseInt(stationId, 10) : undefined,
      ecosystemCode,
      geometryType,
      platformTypeCode,
      platformId: platformId ? parseInt(platformId, 10) : undefined,
      missionType
    });

    return createSuccessResponse({
      data: result.items.map(aoi => aoi.toJSON()),
      meta: result.pagination
    });
  }

  /**
   * GET /aois/:id - Get AOI by ID
   */
  async get(request, id) {
    // Authentication required for read
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'aois', 'read'
    );
    if (response) return response;

    const aoi = await this.queries.getAOI.execute(parseInt(id, 10));

    if (!aoi) {
      return createNotFoundResponse(`AOI '${id}' not found`);
    }

    return createSuccessResponse({ data: aoi.toJSON() });
  }

  /**
   * GET /aois/station/:stationId - Get AOIs by station
   */
  async getByStation(request, stationId, url) {
    // Authentication required for read
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'aois', 'read'
    );
    if (response) return response;

    const result = await this.queries.listAOIs.execute({
      stationId: parseInt(stationId, 10),
      limit: 100
    });

    return createSuccessResponse({
      data: result.items.map(aoi => aoi.toJSON()),
      meta: result.pagination
    });
  }

  /**
   * GET /aois/export/geojson - Export AOIs as GeoJSON FeatureCollection
   */
  async exportGeoJSON(request, url) {
    // Authentication required for read
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'aois', 'read'
    );
    if (response) return response;

    const stationId = url.searchParams.get('station_id');
    const aoiIds = url.searchParams.get('aoi_ids')?.split(',').map(id => parseInt(id, 10));

    const geojson = await this.queries.exportAOIsGeoJSON.execute({
      stationId: stationId ? parseInt(stationId, 10) : undefined,
      aoiIds
    });

    return new Response(JSON.stringify(geojson, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/geo+json',
        'Content-Disposition': 'attachment; filename="aois.geojson"'
      }
    });
  }

  /**
   * POST /aois - Create AOI
   * Requires write permission on aois resource
   */
  async create(request) {
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return createErrorResponse('Invalid JSON in request body', 400);
    }

    // Get station ID for authorization context
    const stationId = body.station_id || body.stationId;

    // Authorization: station admins can create AOIs at their station
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'aois', 'write', { stationId }
    );
    if (response) return response;

    try {
      const aoi = await this.commands.createAOI.execute({
        name: body.name,
        description: body.description,
        geometry: body.geometry,
        geometryType: body.geometry_type || body.geometryType,
        stationId: body.station_id || body.stationId,
        ecosystemCode: body.ecosystem_code || body.ecosystemCode,
        platformTypeCode: body.platform_type_code || body.platformTypeCode,
        platformId: body.platform_id || body.platformId,
        missionType: body.mission_type || body.missionType,
        missionRecurrence: body.mission_recurrence || body.missionRecurrence,
        sourceFormat: body.source_format || body.sourceFormat || 'manual'
      });

      return createSuccessResponse({ data: aoi.toJSON() }, 201);
    } catch (error) {
      return createErrorResponse(error.message, 400);
    }
  }

  /**
   * POST /aois/import/geojson - Import AOIs from GeoJSON
   * Requires write permission on aois resource
   */
  async importGeoJSON(request) {
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return createErrorResponse('Invalid JSON in request body', 400);
    }

    // Get station ID for authorization context
    const stationId = body.station_id || body.stationId;

    // Authorization: station admins can import AOIs at their station
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'aois', 'write', { stationId }
    );
    if (response) return response;

    try {
      const aois = await this.commands.importGeoJSON.execute({
        geoJsonData: body.geojson || body.data,
        stationId: body.station_id || body.stationId,
        platformTypeCode: body.platform_type_code || body.platformTypeCode,
        missionType: body.mission_type || body.missionType,
        missionRecurrence: body.mission_recurrence || body.missionRecurrence
      });

      return createSuccessResponse({
        data: aois.map(aoi => aoi.toJSON()),
        meta: { imported: aois.length }
      }, 201);
    } catch (error) {
      return createErrorResponse(error.message, 400);
    }
  }

  /**
   * POST /aois/import/kml - Import AOIs from KML
   * Requires write permission on aois resource
   */
  async importKML(request) {
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return createErrorResponse('Invalid JSON in request body', 400);
    }

    // Get station ID for authorization context
    const stationId = body.station_id || body.stationId;

    // Authorization: station admins can import AOIs at their station
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'aois', 'write', { stationId }
    );
    if (response) return response;

    try {
      const aois = await this.commands.importKML.execute({
        kmlData: body.kml || body.data,
        stationId: body.station_id || body.stationId,
        platformTypeCode: body.platform_type_code || body.platformTypeCode,
        missionType: body.mission_type || body.missionType,
        missionRecurrence: body.mission_recurrence || body.missionRecurrence
      });

      return createSuccessResponse({
        data: aois.map(aoi => aoi.toJSON()),
        meta: { imported: aois.length }
      }, 201);
    } catch (error) {
      return createErrorResponse(error.message, 400);
    }
  }

  /**
   * PUT /aois/:id - Update AOI
   * Requires write permission on aois resource
   */
  async update(request, id) {
    // First get the AOI to determine its station
    const existingAOI = await this.queries.getAOI.execute(parseInt(id, 10));
    if (!existingAOI) {
      return createNotFoundResponse(`AOI '${id}' not found`);
    }

    // Authorization: station admins can update AOIs at their station
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'aois', 'write', { stationId: existingAOI.stationId }
    );
    if (response) return response;

    let body;
    try {
      body = await request.json();
    } catch (error) {
      return createErrorResponse('Invalid JSON in request body', 400);
    }

    try {
      const aoi = await this.commands.updateAOI.execute({
        id: parseInt(id, 10),
        name: body.name,
        description: body.description,
        geometry: body.geometry,
        geometryType: body.geometry_type || body.geometryType,
        ecosystemCode: body.ecosystem_code || body.ecosystemCode,
        platformTypeCode: body.platform_type_code || body.platformTypeCode,
        platformId: body.platform_id || body.platformId,
        missionType: body.mission_type || body.missionType,
        missionRecurrence: body.mission_recurrence || body.missionRecurrence
      });

      return createSuccessResponse({ data: aoi.toJSON() });
    } catch (error) {
      if (error.message.includes('not found')) {
        return createNotFoundResponse(error.message);
      }
      return createErrorResponse(error.message, 400);
    }
  }

  /**
   * DELETE /aois/:id - Delete AOI
   * Requires delete permission on aois resource
   */
  async delete(request, id) {
    // First get the AOI to determine its station
    const existingAOI = await this.queries.getAOI.execute(parseInt(id, 10));
    if (!existingAOI) {
      return createNotFoundResponse(`AOI '${id}' not found`);
    }

    // Authorization: station admins can delete AOIs at their station
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'aois', 'delete', { stationId: existingAOI.stationId }
    );
    if (response) return response;

    try {
      await this.commands.deleteAOI.execute(parseInt(id, 10));
      return createSuccessResponse({ deleted: true });
    } catch (error) {
      if (error.message.includes('not found')) {
        return createNotFoundResponse(error.message);
      }
      return createErrorResponse(error.message, 400);
    }
  }

  /**
   * Handle request routing
   */
  async handle(request, pathSegments, url) {
    const method = request.method;
    const segment1 = pathSegments[0];
    const segment2 = pathSegments[1];

    // GET /aois
    if (method === 'GET' && !segment1) {
      return this.list(request, url);
    }

    // GET /aois/export/geojson
    if (method === 'GET' && segment1 === 'export' && segment2 === 'geojson') {
      return this.exportGeoJSON(request, url);
    }

    // GET /aois/station/:stationId
    if (method === 'GET' && segment1 === 'station' && segment2) {
      return this.getByStation(request, segment2, url);
    }

    // GET /aois/:id
    if (method === 'GET' && segment1 && /^\d+$/.test(segment1)) {
      return this.get(request, segment1);
    }

    // POST /aois/import/geojson
    if (method === 'POST' && segment1 === 'import' && segment2 === 'geojson') {
      return this.importGeoJSON(request);
    }

    // POST /aois/import/kml
    if (method === 'POST' && segment1 === 'import' && segment2 === 'kml') {
      return this.importKML(request);
    }

    // POST /aois
    if (method === 'POST' && !segment1) {
      return this.create(request);
    }

    // PUT /aois/:id
    if (method === 'PUT' && segment1 && /^\d+$/.test(segment1)) {
      return this.update(request, segment1);
    }

    // DELETE /aois/:id
    if (method === 'DELETE' && segment1 && /^\d+$/.test(segment1)) {
      return this.delete(request, segment1);
    }

    return createNotFoundResponse();
  }
}
