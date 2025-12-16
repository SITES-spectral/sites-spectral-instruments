/**
 * Campaign Controller (V11 Architecture)
 *
 * HTTP controller for acquisition campaign endpoints.
 * Maps HTTP requests to application use cases.
 * Supports status workflow (planned → active → completed).
 * v11.0.0-alpha.34: Added authentication and authorization middleware
 *
 * @module infrastructure/http/controllers/CampaignController
 */

import {
  createSuccessResponse,
  createErrorResponse,
  createNotFoundResponse
} from '../../../utils/responses.js';
import { AuthMiddleware } from '../middleware/AuthMiddleware.js';

/**
 * Campaign Controller
 */
export class CampaignController {
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
   * GET /campaigns - List campaigns with filters
   */
  async list(request, url) {
    // Authentication required for read
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'campaigns', 'read'
    );
    if (response) return response;

    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = Math.min(
      parseInt(url.searchParams.get('limit') || '25', 10),
      100
    );
    const stationId = url.searchParams.get('station_id');
    const platformId = url.searchParams.get('platform_id');
    const status = url.searchParams.get('status');
    const campaignType = url.searchParams.get('campaign_type');
    const coordinatorId = url.searchParams.get('coordinator_id');
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');
    const sortBy = url.searchParams.get('sort_by') || 'planned_start_datetime';
    const sortOrder = url.searchParams.get('sort_order') || 'desc';

    const result = await this.queries.listCampaigns.execute({
      page,
      limit,
      stationId: stationId ? parseInt(stationId, 10) : undefined,
      platformId: platformId ? parseInt(platformId, 10) : undefined,
      status,
      campaignType,
      coordinatorId: coordinatorId ? parseInt(coordinatorId, 10) : undefined,
      startDate,
      endDate,
      sortBy,
      sortOrder
    });

    return createSuccessResponse({
      data: result.items.map(c => c.toJSON()),
      meta: result.pagination
    });
  }

  /**
   * GET /campaigns/:id - Get campaign by ID
   */
  async get(request, id) {
    // Authentication required for read
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'campaigns', 'read'
    );
    if (response) return response;

    const campaign = await this.queries.getCampaign.execute(parseInt(id, 10));

    if (!campaign) {
      return createNotFoundResponse(`Campaign '${id}' not found`);
    }

    return createSuccessResponse({ data: campaign.toJSON() });
  }

  /**
   * GET /campaigns/station/:stationId - Get campaigns by station
   */
  async getByStation(request, stationId, url) {
    // Authentication required for read
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'campaigns', 'read'
    );
    if (response) return response;

    const result = await this.queries.listCampaigns.execute({
      stationId: parseInt(stationId, 10),
      limit: 100
    });

    return createSuccessResponse({
      data: result.items.map(c => c.toJSON()),
      meta: result.pagination
    });
  }

  /**
   * GET /campaigns/active - Get active campaigns
   */
  async getActive(request, url) {
    // Authentication required for read
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'campaigns', 'read'
    );
    if (response) return response;

    const result = await this.queries.listCampaigns.execute({
      status: 'active',
      limit: 100
    });

    return createSuccessResponse({
      data: result.items.map(c => c.toJSON()),
      meta: result.pagination
    });
  }

  /**
   * POST /campaigns - Create campaign
   * Requires write permission on campaigns resource
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

    // Authorization: station admins can create campaigns at their station
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'campaigns', 'write', { stationId }
    );
    if (response) return response;

    try {
      const campaign = await this.commands.createCampaign.execute({
        name: body.name || body.campaign_name,
        description: body.description,
        campaignType: body.campaign_type || body.campaignType,
        startDate: body.start_date || body.startDate || body.planned_start_datetime,
        endDate: body.end_date || body.endDate || body.planned_end_datetime,
        stationId: body.station_id || body.stationId,
        platformId: body.platform_id || body.platformId,
        aoiId: body.aoi_id || body.aoiId,
        coordinatorId: body.coordinator_id || body.coordinatorId,
        participants: body.participants,
        objectives: body.objectives,
        expectedOutcomes: body.expected_outcomes || body.expectedOutcomes,
        fundingSource: body.funding_source || body.fundingSource,
        budget: body.budget,
        metadata: body.metadata
      });

      return createSuccessResponse({ data: campaign.toJSON() }, 201);
    } catch (error) {
      return createErrorResponse(error.message, 400);
    }
  }

  /**
   * PUT /campaigns/:id - Update campaign
   * Requires write permission on campaigns resource
   */
  async update(request, id) {
    // First get the campaign to determine its station
    const existingCampaign = await this.queries.getCampaign.execute(parseInt(id, 10));
    if (!existingCampaign) {
      return createNotFoundResponse(`Campaign '${id}' not found`);
    }

    // Authorization: station admins can update campaigns at their station
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'campaigns', 'write', { stationId: existingCampaign.stationId }
    );
    if (response) return response;

    let body;
    try {
      body = await request.json();
    } catch (error) {
      return createErrorResponse('Invalid JSON in request body', 400);
    }

    try {
      const campaign = await this.commands.updateCampaign.execute({
        id: parseInt(id, 10),
        name: body.name || body.campaign_name,
        description: body.description,
        campaignType: body.campaign_type || body.campaignType,
        startDate: body.start_date || body.startDate || body.planned_start_datetime,
        endDate: body.end_date || body.endDate || body.planned_end_datetime,
        platformId: body.platform_id || body.platformId,
        aoiId: body.aoi_id || body.aoiId,
        coordinatorId: body.coordinator_id || body.coordinatorId,
        participants: body.participants,
        objectives: body.objectives,
        expectedOutcomes: body.expected_outcomes || body.expectedOutcomes,
        fundingSource: body.funding_source || body.fundingSource,
        budget: body.budget,
        metadata: body.metadata
      });

      return createSuccessResponse({ data: campaign.toJSON() });
    } catch (error) {
      if (error.message.includes('not found')) {
        return createNotFoundResponse(error.message);
      }
      return createErrorResponse(error.message, 400);
    }
  }

  /**
   * POST /campaigns/:id/start - Start campaign (planned → active)
   * Requires write permission on campaigns resource
   */
  async start(request, id) {
    // First get the campaign to determine its station
    const existingCampaign = await this.queries.getCampaign.execute(parseInt(id, 10));
    if (!existingCampaign) {
      return createNotFoundResponse(`Campaign '${id}' not found`);
    }

    // Authorization: station admins can start campaigns at their station
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'campaigns', 'write', { stationId: existingCampaign.stationId }
    );
    if (response) return response;

    const body = await request.json().catch(() => ({}));

    try {
      const campaign = await this.commands.startCampaign.execute({
        campaignId: parseInt(id, 10),
        actualStartDate: body.actual_start_date || body.actualStartDate
      });

      return createSuccessResponse({
        data: campaign.toJSON(),
        message: 'Campaign started successfully'
      });
    } catch (error) {
      if (error.message.includes('not found')) {
        return createNotFoundResponse(error.message);
      }
      return createErrorResponse(error.message, 400);
    }
  }

  /**
   * POST /campaigns/:id/complete - Complete campaign (active → completed)
   * Requires write permission on campaigns resource
   */
  async complete(request, id) {
    // First get the campaign to determine its station
    const existingCampaign = await this.queries.getCampaign.execute(parseInt(id, 10));
    if (!existingCampaign) {
      return createNotFoundResponse(`Campaign '${id}' not found`);
    }

    // Authorization: station admins can complete campaigns at their station
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'campaigns', 'write', { stationId: existingCampaign.stationId }
    );
    if (response) return response;

    const body = await request.json().catch(() => ({}));

    try {
      const campaign = await this.commands.completeCampaign.execute({
        campaignId: parseInt(id, 10),
        actualEndDate: body.actual_end_date || body.actualEndDate,
        outcomes: body.outcomes,
        notes: body.notes
      });

      return createSuccessResponse({
        data: campaign.toJSON(),
        message: 'Campaign completed successfully'
      });
    } catch (error) {
      if (error.message.includes('not found')) {
        return createNotFoundResponse(error.message);
      }
      return createErrorResponse(error.message, 400);
    }
  }

  /**
   * DELETE /campaigns/:id - Delete campaign
   * Requires delete permission on campaigns resource
   */
  async delete(request, id) {
    // First get the campaign to determine its station
    const existingCampaign = await this.queries.getCampaign.execute(parseInt(id, 10));
    if (!existingCampaign) {
      return createNotFoundResponse(`Campaign '${id}' not found`);
    }

    // Authorization: station admins can delete campaigns at their station
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'campaigns', 'delete', { stationId: existingCampaign.stationId }
    );
    if (response) return response;

    try {
      await this.commands.deleteCampaign.execute(parseInt(id, 10));
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
    const segment1 = pathSegments[0];
    const segment2 = pathSegments[1];

    // GET /campaigns
    if (method === 'GET' && !segment1) {
      return this.list(request, url);
    }

    // GET /campaigns/active
    if (method === 'GET' && segment1 === 'active') {
      return this.getActive(request, url);
    }

    // GET /campaigns/station/:stationId
    if (method === 'GET' && segment1 === 'station' && segment2) {
      return this.getByStation(request, segment2, url);
    }

    // GET /campaigns/:id
    if (method === 'GET' && segment1 && /^\d+$/.test(segment1)) {
      return this.get(request, segment1);
    }

    // POST /campaigns/:id/start
    if (method === 'POST' && segment1 && /^\d+$/.test(segment1) && segment2 === 'start') {
      return this.start(request, segment1);
    }

    // POST /campaigns/:id/complete
    if (method === 'POST' && segment1 && /^\d+$/.test(segment1) && segment2 === 'complete') {
      return this.complete(request, segment1);
    }

    // POST /campaigns
    if (method === 'POST' && !segment1) {
      return this.create(request);
    }

    // PUT /campaigns/:id
    if (method === 'PUT' && segment1 && /^\d+$/.test(segment1)) {
      return this.update(request, segment1);
    }

    // DELETE /campaigns/:id
    if (method === 'DELETE' && segment1 && /^\d+$/.test(segment1)) {
      return this.delete(request, segment1);
    }

    return createNotFoundResponse();
  }
}
