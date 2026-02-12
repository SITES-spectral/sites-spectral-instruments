/**
 * UAV Controller
 *
 * HTTP controller for UAV-related endpoints (pilots, missions, flight logs, batteries).
 * Maps HTTP requests to application use cases.
 *
 * Architecture Credit: This subdomain-based architecture design is based on
 * architectural knowledge shared by Flights for Biodiversity Sweden AB
 * (https://github.com/flightsforbiodiversity)
 *
 * @module infrastructure/http/controllers/UAVController
 * @version 15.0.0
 */

import {
  createSuccessResponse,
  createErrorResponse,
  createNotFoundResponse,
  createForbiddenResponse
} from '../../../utils/responses.js';
import { AuthMiddleware } from '../middleware/AuthMiddleware.js';
import {
  parsePagination,
  parsePathId,
  parseRequestBody,
  parseFlexibleId
} from './ControllerUtils.js';

/**
 * UAV Controller - handles pilots, missions, flight logs, and batteries
 */
export class UAVController {
  /**
   * @param {Object} container - Dependency injection container
   * @param {Object} env - Cloudflare Worker environment
   */
  constructor(container, env) {
    this.queries = container.queries;
    this.commands = container.commands;
    this.auth = new AuthMiddleware(env);
  }

  // =============================================
  // PILOTS
  // =============================================

  /**
   * GET /uav/pilots - List all pilots
   */
  async listPilots(request, url) {
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'uav_pilots', 'read'
    );
    if (response) return response;

    // Validate pagination
    const paginationResult = parsePagination(url);
    if (!paginationResult.valid) return paginationResult.error;

    const { page, limit } = paginationResult.pagination;
    const status = url.searchParams.get('status');
    const stationId = url.searchParams.get('station_id');

    const result = await this.queries.listPilots.execute({
      page,
      limit,
      status,
      stationId: stationId ? parseInt(stationId, 10) : undefined
    });

    return createSuccessResponse({
      data: result.items.map(p => p.toJSON()),
      meta: result.pagination
    });
  }

  /**
   * GET /uav/pilots/:id - Get pilot by ID
   */
  async getPilot(request, id) {
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'uav_pilots', 'read'
    );
    if (response) return response;

    // Validate ID
    const idResult = parsePathId(id, 'pilot_id');
    if (!idResult.valid) return idResult.error;

    const pilot = await this.queries.getPilot.byId(idResult.value);
    if (!pilot) {
      return createNotFoundResponse(`Pilot ${id} not found`);
    }

    return createSuccessResponse({ data: pilot.toJSON() });
  }

  /**
   * POST /uav/pilots - Create pilot
   */
  async createPilot(request) {
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'uav_pilots', 'write'
    );
    if (response) return response;

    // Validate request body
    const bodyResult = await parseRequestBody(request);
    if (!bodyResult.valid) return bodyResult.error;

    try {
      const pilot = await this.commands.createPilot.execute(bodyResult.body);
      return createSuccessResponse({ data: pilot.toJSON() }, 201);
    } catch (error) {
      return createErrorResponse(error.message, 400);
    }
  }

  /**
   * PUT /uav/pilots/:id - Update pilot
   */
  async updatePilot(request, id) {
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'uav_pilots', 'write'
    );
    if (response) return response;

    let body;
    try {
      body = await request.json();
    } catch (error) {
      return createErrorResponse('Invalid JSON in request body', 400);
    }

    try {
      const pilot = await this.commands.updatePilot.execute({
        id: parseInt(id, 10),
        ...body
      });
      return createSuccessResponse({ data: pilot.toJSON() });
    } catch (error) {
      if (error.message.includes('not found')) {
        return createNotFoundResponse(error.message);
      }
      return createErrorResponse(error.message, 400);
    }
  }

  /**
   * DELETE /uav/pilots/:id - Delete pilot
   */
  async deletePilot(request, id) {
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'uav_pilots', 'delete'
    );
    if (response) return response;

    try {
      await this.commands.deletePilot.execute(parseInt(id, 10));
      return createSuccessResponse({ deleted: true });
    } catch (error) {
      if (error.message.includes('not found')) {
        return createNotFoundResponse(error.message);
      }
      return createErrorResponse(error.message, 400);
    }
  }

  /**
   * POST /uav/pilots/:id/authorize/:stationId - Authorize pilot for station
   */
  async authorizePilotForStation(request, pilotId, stationId) {
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'uav_pilots', 'write'
    );
    if (response) return response;

    try {
      const pilot = await this.commands.authorizePilotForStation.execute({
        pilotId: parseInt(pilotId, 10),
        stationId: parseInt(stationId, 10)
      });
      return createSuccessResponse({ data: pilot.toJSON() });
    } catch (error) {
      if (error.message.includes('not found')) {
        return createNotFoundResponse(error.message);
      }
      return createErrorResponse(error.message, 400);
    }
  }

  /**
   * GET /uav/pilots/expiring - Get pilots with expiring credentials
   */
  async getPilotsWithExpiringCredentials(request, url) {
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'uav_pilots', 'read'
    );
    if (response) return response;

    const days = parseInt(url.searchParams.get('days') || '30', 10);

    const result = await this.queries.getPilotsWithExpiringCredentials.execute({ days });

    return createSuccessResponse({
      data: {
        expiringCertificates: result.expiringCertificates.map(p => p.toJSON()),
        expiringInsurance: result.expiringInsurance.map(p => p.toJSON())
      }
    });
  }

  // =============================================
  // MISSIONS
  // =============================================

  /**
   * GET /uav/missions - List all missions
   */
  async listMissions(request, url) {
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'uav_missions', 'read'
    );
    if (response) return response;

    // Validate pagination
    const paginationResult = parsePagination(url);
    if (!paginationResult.valid) return paginationResult.error;

    const { page, limit } = paginationResult.pagination;
    const stationId = url.searchParams.get('station_id');
    const status = url.searchParams.get('status');

    const result = await this.queries.listMissions.execute({
      page,
      limit,
      stationId: stationId ? parseInt(stationId, 10) : undefined,
      status
    });

    return createSuccessResponse({
      data: result.items.map(m => m.toJSON()),
      meta: result.pagination
    });
  }

  /**
   * GET /uav/missions/pending - Get missions pending approval
   */
  async getPendingMissions(request) {
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'uav_missions', 'read'
    );
    if (response) return response;

    const missions = await this.queries.getPendingMissions.execute();

    return createSuccessResponse({
      data: missions.map(m => m.toJSON())
    });
  }

  /**
   * GET /uav/missions/:id - Get mission by ID
   */
  async getMission(request, id) {
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'uav_missions', 'read'
    );
    if (response) return response;

    let mission;
    if (/^\d+$/.test(id)) {
      mission = await this.queries.getMission.byId(parseInt(id, 10));
    } else {
      mission = await this.queries.getMission.byMissionCode(id);
    }

    if (!mission) {
      return createNotFoundResponse(`Mission ${id} not found`);
    }

    return createSuccessResponse({ data: mission.toJSON() });
  }

  /**
   * GET /uav/missions/:id/pilots - Get pilots assigned to mission
   */
  async getMissionPilots(request, missionId) {
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'uav_missions', 'read'
    );
    if (response) return response;

    const pilots = await this.queries.getMissionPilots.execute(parseInt(missionId, 10));

    return createSuccessResponse({ data: pilots });
  }

  /**
   * POST /uav/missions - Create mission
   */
  async createMission(request) {
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'uav_missions', 'write'
    );
    if (response) return response;

    let body;
    try {
      body = await request.json();
    } catch (error) {
      return createErrorResponse('Invalid JSON in request body', 400);
    }

    try {
      const mission = await this.commands.createMission.execute({
        ...body,
        created_by_user_id: user?.id
      });
      return createSuccessResponse({ data: mission.toJSON() }, 201);
    } catch (error) {
      return createErrorResponse(error.message, 400);
    }
  }

  /**
   * PUT /uav/missions/:id - Update mission
   */
  async updateMission(request, id) {
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'uav_missions', 'write'
    );
    if (response) return response;

    let body;
    try {
      body = await request.json();
    } catch (error) {
      return createErrorResponse('Invalid JSON in request body', 400);
    }

    try {
      const mission = await this.commands.updateMission.execute({
        id: parseInt(id, 10),
        ...body
      });
      return createSuccessResponse({ data: mission.toJSON() });
    } catch (error) {
      if (error.message.includes('not found')) {
        return createNotFoundResponse(error.message);
      }
      return createErrorResponse(error.message, 400);
    }
  }

  /**
   * DELETE /uav/missions/:id - Delete mission
   */
  async deleteMission(request, id) {
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'uav_missions', 'delete'
    );
    if (response) return response;

    try {
      await this.commands.deleteMission.execute(parseInt(id, 10));
      return createSuccessResponse({ deleted: true });
    } catch (error) {
      if (error.message.includes('not found')) {
        return createNotFoundResponse(error.message);
      }
      return createErrorResponse(error.message, 400);
    }
  }

  /**
   * POST /uav/missions/:id/approve - Approve mission
   */
  async approveMission(request, id) {
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'uav_missions', 'write'
    );
    if (response) return response;

    let body = {};
    try {
      body = await request.json();
    } catch (error) {
      // Body is optional for approve
    }

    try {
      const mission = await this.commands.approveMission.execute({
        missionId: parseInt(id, 10),
        approvedByUserId: user?.id,
        approvalNotes: body.approval_notes
      });
      return createSuccessResponse({ data: mission.toJSON() });
    } catch (error) {
      if (error.message.includes('not found')) {
        return createNotFoundResponse(error.message);
      }
      return createErrorResponse(error.message, 400);
    }
  }

  /**
   * POST /uav/missions/:id/start - Start mission
   */
  async startMission(request, id) {
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'uav_missions', 'write'
    );
    if (response) return response;

    try {
      const mission = await this.commands.startMission.execute(parseInt(id, 10));
      return createSuccessResponse({ data: mission.toJSON() });
    } catch (error) {
      if (error.message.includes('not found')) {
        return createNotFoundResponse(error.message);
      }
      return createErrorResponse(error.message, 400);
    }
  }

  /**
   * POST /uav/missions/:id/complete - Complete mission
   */
  async completeMission(request, id) {
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'uav_missions', 'write'
    );
    if (response) return response;

    let body = {};
    try {
      body = await request.json();
    } catch (error) {
      // Body is optional for complete
    }

    try {
      const mission = await this.commands.completeMission.execute({
        missionId: parseInt(id, 10),
        ...body
      });
      return createSuccessResponse({ data: mission.toJSON() });
    } catch (error) {
      if (error.message.includes('not found')) {
        return createNotFoundResponse(error.message);
      }
      return createErrorResponse(error.message, 400);
    }
  }

  /**
   * POST /uav/missions/:id/abort - Abort mission
   */
  async abortMission(request, id) {
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'uav_missions', 'write'
    );
    if (response) return response;

    let body;
    try {
      body = await request.json();
    } catch (error) {
      return createErrorResponse('Invalid JSON - reason required', 400);
    }

    if (!body.reason) {
      return createErrorResponse('Reason is required for aborting mission', 400);
    }

    try {
      const mission = await this.commands.abortMission.execute({
        missionId: parseInt(id, 10),
        reason: body.reason
      });
      return createSuccessResponse({ data: mission.toJSON() });
    } catch (error) {
      if (error.message.includes('not found')) {
        return createNotFoundResponse(error.message);
      }
      return createErrorResponse(error.message, 400);
    }
  }

  /**
   * POST /uav/missions/:id/pilots - Assign pilot to mission
   */
  async assignPilotToMission(request, missionId) {
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'uav_missions', 'write'
    );
    if (response) return response;

    let body;
    try {
      body = await request.json();
    } catch (error) {
      return createErrorResponse('Invalid JSON in request body', 400);
    }

    if (!body.pilot_id) {
      return createErrorResponse('pilot_id is required', 400);
    }

    try {
      await this.commands.assignPilotToMission.execute({
        missionId: parseInt(missionId, 10),
        pilotId: body.pilot_id,
        role: body.role,
        assignedByUserId: user?.id
      });
      return createSuccessResponse({ assigned: true }, 201);
    } catch (error) {
      if (error.message.includes('not found')) {
        return createNotFoundResponse(error.message);
      }
      return createErrorResponse(error.message, 400);
    }
  }

  // =============================================
  // FLIGHT LOGS
  // =============================================

  /**
   * GET /uav/flight-logs - List all flight logs
   */
  async listFlightLogs(request, url) {
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'uav_flight_logs', 'read'
    );
    if (response) return response;

    // Validate pagination
    const paginationResult = parsePagination(url);
    if (!paginationResult.valid) return paginationResult.error;

    const { page, limit } = paginationResult.pagination;
    const missionId = url.searchParams.get('mission_id');
    const pilotId = url.searchParams.get('pilot_id');
    const platformId = url.searchParams.get('platform_id');

    const result = await this.queries.listFlightLogs.execute({
      page,
      limit,
      missionId: missionId ? parseInt(missionId, 10) : undefined,
      pilotId: pilotId ? parseInt(pilotId, 10) : undefined,
      platformId: platformId ? parseInt(platformId, 10) : undefined
    });

    return createSuccessResponse({
      data: result.items.map(fl => fl.toJSON()),
      meta: result.pagination
    });
  }

  /**
   * GET /uav/flight-logs/:id - Get flight log by ID
   */
  async getFlightLog(request, id) {
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'uav_flight_logs', 'read'
    );
    if (response) return response;

    const flightLog = await this.queries.getFlightLog.byId(parseInt(id, 10));
    if (!flightLog) {
      return createNotFoundResponse(`Flight log ${id} not found`);
    }

    return createSuccessResponse({ data: flightLog.toJSON() });
  }

  /**
   * GET /uav/flight-logs/mission/:missionId - Get flight logs by mission
   */
  async getFlightLogsByMission(request, missionId) {
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'uav_flight_logs', 'read'
    );
    if (response) return response;

    const flightLogs = await this.queries.getFlightLogsByMission.execute(
      parseInt(missionId, 10)
    );

    return createSuccessResponse({
      data: flightLogs.map(fl => fl.toJSON())
    });
  }

  /**
   * GET /uav/flight-logs/pilot/:pilotId/statistics - Get pilot statistics
   */
  async getPilotStatistics(request, pilotId) {
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'uav_flight_logs', 'read'
    );
    if (response) return response;

    const stats = await this.queries.getPilotStatistics.execute(
      parseInt(pilotId, 10)
    );

    return createSuccessResponse({ data: stats });
  }

  /**
   * POST /uav/flight-logs - Create flight log
   */
  async createFlightLog(request) {
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'uav_flight_logs', 'write'
    );
    if (response) return response;

    let body;
    try {
      body = await request.json();
    } catch (error) {
      return createErrorResponse('Invalid JSON in request body', 400);
    }

    try {
      const flightLog = await this.commands.createFlightLog.execute(body);
      return createSuccessResponse({ data: flightLog.toJSON() }, 201);
    } catch (error) {
      return createErrorResponse(error.message, 400);
    }
  }

  /**
   * PUT /uav/flight-logs/:id - Update flight log
   */
  async updateFlightLog(request, id) {
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'uav_flight_logs', 'write'
    );
    if (response) return response;

    let body;
    try {
      body = await request.json();
    } catch (error) {
      return createErrorResponse('Invalid JSON in request body', 400);
    }

    try {
      const flightLog = await this.commands.updateFlightLog.execute({
        id: parseInt(id, 10),
        ...body
      });
      return createSuccessResponse({ data: flightLog.toJSON() });
    } catch (error) {
      if (error.message.includes('not found')) {
        return createNotFoundResponse(error.message);
      }
      return createErrorResponse(error.message, 400);
    }
  }

  /**
   * DELETE /uav/flight-logs/:id - Delete flight log
   */
  async deleteFlightLog(request, id) {
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'uav_flight_logs', 'delete'
    );
    if (response) return response;

    try {
      await this.commands.deleteFlightLog.execute(parseInt(id, 10));
      return createSuccessResponse({ deleted: true });
    } catch (error) {
      if (error.message.includes('not found')) {
        return createNotFoundResponse(error.message);
      }
      return createErrorResponse(error.message, 400);
    }
  }

  /**
   * POST /uav/flight-logs/:id/incident - Report incident
   */
  async reportFlightIncident(request, id) {
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'uav_flight_logs', 'write'
    );
    if (response) return response;

    let body;
    try {
      body = await request.json();
    } catch (error) {
      return createErrorResponse('Invalid JSON in request body', 400);
    }

    if (!body.description || !body.severity) {
      return createErrorResponse('description and severity are required', 400);
    }

    try {
      const flightLog = await this.commands.reportFlightIncident.execute({
        flightLogId: parseInt(id, 10),
        description: body.description,
        severity: body.severity
      });
      return createSuccessResponse({ data: flightLog.toJSON() });
    } catch (error) {
      if (error.message.includes('not found')) {
        return createNotFoundResponse(error.message);
      }
      return createErrorResponse(error.message, 400);
    }
  }

  // =============================================
  // BATTERIES
  // =============================================

  /**
   * GET /uav/batteries - List all batteries
   */
  async listBatteries(request, url) {
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'uav_batteries', 'read'
    );
    if (response) return response;

    // Validate pagination
    const paginationResult = parsePagination(url);
    if (!paginationResult.valid) return paginationResult.error;

    const { page, limit } = paginationResult.pagination;
    const stationId = url.searchParams.get('station_id');
    const status = url.searchParams.get('status');

    const result = await this.queries.listBatteries.execute({
      page,
      limit,
      stationId: stationId ? parseInt(stationId, 10) : undefined,
      status
    });

    return createSuccessResponse({
      data: result.items.map(b => b.toJSON()),
      meta: result.pagination
    });
  }

  /**
   * GET /uav/batteries/health-check-needed - Get batteries needing health check
   */
  async getBatteriesNeedingHealthCheck(request, url) {
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'uav_batteries', 'read'
    );
    if (response) return response;

    const days = parseInt(url.searchParams.get('days') || '30', 10);

    const batteries = await this.queries.getBatteriesNeedingHealthCheck.execute({ days });

    return createSuccessResponse({
      data: batteries.map(b => b.toJSON())
    });
  }

  /**
   * GET /uav/batteries/station/:stationId/statistics - Get battery statistics
   */
  async getBatteryStatistics(request, stationId) {
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'uav_batteries', 'read'
    );
    if (response) return response;

    const stats = await this.queries.getBatteryStatistics.execute(
      parseInt(stationId, 10)
    );

    return createSuccessResponse({ data: stats });
  }

  /**
   * GET /uav/batteries/:id - Get battery by ID
   */
  async getBattery(request, id) {
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'uav_batteries', 'read'
    );
    if (response) return response;

    let battery;
    if (/^\d+$/.test(id)) {
      battery = await this.queries.getBattery.byId(parseInt(id, 10));
    } else {
      battery = await this.queries.getBattery.bySerialNumber(id);
    }

    if (!battery) {
      return createNotFoundResponse(`Battery ${id} not found`);
    }

    return createSuccessResponse({ data: battery.toJSON() });
  }

  /**
   * POST /uav/batteries - Create battery
   */
  async createBattery(request) {
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'uav_batteries', 'write'
    );
    if (response) return response;

    let body;
    try {
      body = await request.json();
    } catch (error) {
      return createErrorResponse('Invalid JSON in request body', 400);
    }

    try {
      const battery = await this.commands.createBattery.execute(body);
      return createSuccessResponse({ data: battery.toJSON() }, 201);
    } catch (error) {
      return createErrorResponse(error.message, 400);
    }
  }

  /**
   * PUT /uav/batteries/:id - Update battery
   */
  async updateBattery(request, id) {
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'uav_batteries', 'write'
    );
    if (response) return response;

    let body;
    try {
      body = await request.json();
    } catch (error) {
      return createErrorResponse('Invalid JSON in request body', 400);
    }

    try {
      const battery = await this.commands.updateBattery.execute({
        id: parseInt(id, 10),
        ...body
      });
      return createSuccessResponse({ data: battery.toJSON() });
    } catch (error) {
      if (error.message.includes('not found')) {
        return createNotFoundResponse(error.message);
      }
      return createErrorResponse(error.message, 400);
    }
  }

  /**
   * DELETE /uav/batteries/:id - Delete battery
   */
  async deleteBattery(request, id) {
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'uav_batteries', 'delete'
    );
    if (response) return response;

    try {
      await this.commands.deleteBattery.execute(parseInt(id, 10));
      return createSuccessResponse({ deleted: true });
    } catch (error) {
      if (error.message.includes('not found')) {
        return createNotFoundResponse(error.message);
      }
      return createErrorResponse(error.message, 400);
    }
  }

  /**
   * POST /uav/batteries/:id/health-check - Record health check
   */
  async recordBatteryHealthCheck(request, id) {
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'uav_batteries', 'write'
    );
    if (response) return response;

    let body;
    try {
      body = await request.json();
    } catch (error) {
      return createErrorResponse('Invalid JSON in request body', 400);
    }

    if (body.health_percent === undefined) {
      return createErrorResponse('health_percent is required', 400);
    }

    try {
      const battery = await this.commands.recordBatteryHealthCheck.execute({
        batteryId: parseInt(id, 10),
        healthPercent: body.health_percent,
        internalResistance: body.internal_resistance
      });
      return createSuccessResponse({ data: battery.toJSON() });
    } catch (error) {
      if (error.message.includes('not found')) {
        return createNotFoundResponse(error.message);
      }
      return createErrorResponse(error.message, 400);
    }
  }

  /**
   * POST /uav/batteries/:id/retire - Retire battery
   */
  async retireBattery(request, id) {
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'uav_batteries', 'write'
    );
    if (response) return response;

    let body = {};
    try {
      body = await request.json();
    } catch (error) {
      // Body is optional
    }

    try {
      const battery = await this.commands.retireBattery.execute({
        batteryId: parseInt(id, 10),
        reason: body.reason
      });
      return createSuccessResponse({ data: battery.toJSON() });
    } catch (error) {
      if (error.message.includes('not found')) {
        return createNotFoundResponse(error.message);
      }
      return createErrorResponse(error.message, 400);
    }
  }

  // =============================================
  // ROUTE HANDLER
  // =============================================

  /**
   * Handle request routing
   */
  async handle(request, pathSegments, url) {
    const method = request.method;
    const resource = pathSegments[0]; // pilots, missions, flight-logs, batteries
    const id = pathSegments[1];
    const subResource = pathSegments[2];
    const subId = pathSegments[3];

    // Route to appropriate handler based on resource type
    switch (resource) {
      case 'pilots':
        return this.handlePilots(request, method, id, subResource, subId, url);

      case 'missions':
        return this.handleMissions(request, method, id, subResource, url);

      case 'flight-logs':
        return this.handleFlightLogs(request, method, id, subResource, url);

      case 'batteries':
        return this.handleBatteries(request, method, id, subResource, url);

      default:
        return createNotFoundResponse(`Unknown UAV resource: ${resource}`);
    }
  }

  /**
   * Handle pilots routes
   */
  async handlePilots(request, method, id, subResource, subId, url) {
    // GET /uav/pilots/expiring
    if (method === 'GET' && id === 'expiring') {
      return this.getPilotsWithExpiringCredentials(request, url);
    }

    // GET /uav/pilots
    if (method === 'GET' && !id) {
      return this.listPilots(request, url);
    }

    // GET /uav/pilots/:id
    if (method === 'GET' && id && !subResource) {
      return this.getPilot(request, id);
    }

    // POST /uav/pilots/:id/authorize/:stationId
    if (method === 'POST' && id && subResource === 'authorize' && subId) {
      return this.authorizePilotForStation(request, id, subId);
    }

    // POST /uav/pilots
    if (method === 'POST' && !id) {
      return this.createPilot(request);
    }

    // PUT /uav/pilots/:id
    if (method === 'PUT' && id) {
      return this.updatePilot(request, id);
    }

    // DELETE /uav/pilots/:id
    if (method === 'DELETE' && id) {
      return this.deletePilot(request, id);
    }

    return createNotFoundResponse();
  }

  /**
   * Handle missions routes
   */
  async handleMissions(request, method, id, subResource, url) {
    // GET /uav/missions/pending
    if (method === 'GET' && id === 'pending') {
      return this.getPendingMissions(request);
    }

    // GET /uav/missions
    if (method === 'GET' && !id) {
      return this.listMissions(request, url);
    }

    // GET /uav/missions/:id/pilots
    if (method === 'GET' && id && subResource === 'pilots') {
      return this.getMissionPilots(request, id);
    }

    // GET /uav/missions/:id
    if (method === 'GET' && id && !subResource) {
      return this.getMission(request, id);
    }

    // POST /uav/missions/:id/approve
    if (method === 'POST' && id && subResource === 'approve') {
      return this.approveMission(request, id);
    }

    // POST /uav/missions/:id/start
    if (method === 'POST' && id && subResource === 'start') {
      return this.startMission(request, id);
    }

    // POST /uav/missions/:id/complete
    if (method === 'POST' && id && subResource === 'complete') {
      return this.completeMission(request, id);
    }

    // POST /uav/missions/:id/abort
    if (method === 'POST' && id && subResource === 'abort') {
      return this.abortMission(request, id);
    }

    // POST /uav/missions/:id/pilots
    if (method === 'POST' && id && subResource === 'pilots') {
      return this.assignPilotToMission(request, id);
    }

    // POST /uav/missions
    if (method === 'POST' && !id) {
      return this.createMission(request);
    }

    // PUT /uav/missions/:id
    if (method === 'PUT' && id && !subResource) {
      return this.updateMission(request, id);
    }

    // DELETE /uav/missions/:id
    if (method === 'DELETE' && id) {
      return this.deleteMission(request, id);
    }

    return createNotFoundResponse();
  }

  /**
   * Handle flight logs routes
   */
  async handleFlightLogs(request, method, id, subResource, url) {
    // GET /uav/flight-logs/mission/:missionId
    if (method === 'GET' && id === 'mission' && subResource) {
      return this.getFlightLogsByMission(request, subResource);
    }

    // GET /uav/flight-logs/pilot/:pilotId/statistics
    if (method === 'GET' && id === 'pilot' && subResource) {
      const pilotId = subResource;
      const action = url.pathname.split('/').pop();
      if (action === 'statistics') {
        return this.getPilotStatistics(request, pilotId);
      }
    }

    // GET /uav/flight-logs
    if (method === 'GET' && !id) {
      return this.listFlightLogs(request, url);
    }

    // GET /uav/flight-logs/:id
    if (method === 'GET' && id && !subResource) {
      return this.getFlightLog(request, id);
    }

    // POST /uav/flight-logs/:id/incident
    if (method === 'POST' && id && subResource === 'incident') {
      return this.reportFlightIncident(request, id);
    }

    // POST /uav/flight-logs
    if (method === 'POST' && !id) {
      return this.createFlightLog(request);
    }

    // PUT /uav/flight-logs/:id
    if (method === 'PUT' && id && !subResource) {
      return this.updateFlightLog(request, id);
    }

    // DELETE /uav/flight-logs/:id
    if (method === 'DELETE' && id) {
      return this.deleteFlightLog(request, id);
    }

    return createNotFoundResponse();
  }

  /**
   * Handle batteries routes
   */
  async handleBatteries(request, method, id, subResource, url) {
    // GET /uav/batteries/health-check-needed
    if (method === 'GET' && id === 'health-check-needed') {
      return this.getBatteriesNeedingHealthCheck(request, url);
    }

    // GET /uav/batteries/station/:stationId/statistics
    if (method === 'GET' && id === 'station' && subResource) {
      const stationId = subResource;
      const action = url.pathname.split('/').pop();
      if (action === 'statistics') {
        return this.getBatteryStatistics(request, stationId);
      }
    }

    // GET /uav/batteries
    if (method === 'GET' && !id) {
      return this.listBatteries(request, url);
    }

    // GET /uav/batteries/:id
    if (method === 'GET' && id && !subResource) {
      return this.getBattery(request, id);
    }

    // POST /uav/batteries/:id/health-check
    if (method === 'POST' && id && subResource === 'health-check') {
      return this.recordBatteryHealthCheck(request, id);
    }

    // POST /uav/batteries/:id/retire
    if (method === 'POST' && id && subResource === 'retire') {
      return this.retireBattery(request, id);
    }

    // POST /uav/batteries
    if (method === 'POST' && !id) {
      return this.createBattery(request);
    }

    // PUT /uav/batteries/:id
    if (method === 'PUT' && id && !subResource) {
      return this.updateBattery(request, id);
    }

    // DELETE /uav/batteries/:id
    if (method === 'DELETE' && id) {
      return this.deleteBattery(request, id);
    }

    return createNotFoundResponse();
  }
}
