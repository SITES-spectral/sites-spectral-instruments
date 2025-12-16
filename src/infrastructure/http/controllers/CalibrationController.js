/**
 * Calibration Controller
 *
 * HTTP controller for calibration record endpoints.
 * Implements V11 API routes for calibration timeline management.
 * Only supports multispectral and hyperspectral instruments.
 * v11.0.0-alpha.34: Added authentication and authorization middleware
 *
 * @module infrastructure/http/controllers/CalibrationController
 */

import { jsonResponse, errorResponse, notFoundResponse } from '../../../utils/responses.js';
import { AuthMiddleware } from '../middleware/AuthMiddleware.js';

export class CalibrationController {
  /**
   * @param {Object} container - Dependency injection container
   * @param {Object} env - Cloudflare Worker environment
   */
  constructor(container, env) {
    this.queries = container.queries;
    this.commands = container.commands;
    this.repositories = container.repositories;
    this.auth = new AuthMiddleware(env);
  }

  /**
   * GET /api/v11/calibrations
   * List calibration records with optional filters
   */
  async list(request) {
    // Authentication required for read
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'calibrations', 'read'
    );
    if (response) return response;

    try {
      const url = new URL(request.url);
      const filters = {
        instrumentId: url.searchParams.get('instrument_id'),
        channelId: url.searchParams.get('channel_id'),
        type: url.searchParams.get('type'),
        status: url.searchParams.get('status'),
        startDate: url.searchParams.get('start_date'),
        endDate: url.searchParams.get('end_date'),
        limit: parseInt(url.searchParams.get('limit')) || 50,
        offset: parseInt(url.searchParams.get('offset')) || 0
      };

      // Remove null values
      Object.keys(filters).forEach(key => {
        if (filters[key] === null || filters[key] === undefined) {
          delete filters[key];
        }
      });

      const records = await this.queries.listCalibrationRecords.execute(filters);

      return jsonResponse({ calibration_records: records });
    } catch (error) {
      return errorResponse(error.message, 500);
    }
  }

  /**
   * GET /api/v11/calibrations/:id
   * Get a single calibration record
   */
  async get(request, id) {
    // Authentication required for read
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'calibrations', 'read'
    );
    if (response) return response;

    try {
      const record = await this.queries.getCalibrationRecord.execute(parseInt(id));

      return jsonResponse({ calibration_record: record });
    } catch (error) {
      if (error.message.includes('not found')) {
        return notFoundResponse(error.message);
      }
      return errorResponse(error.message, 500);
    }
  }

  /**
   * GET /api/v11/calibrations/current
   * Get current valid calibration for an instrument
   */
  async current(request) {
    // Authentication required for read
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'calibrations', 'read'
    );
    if (response) return response;

    try {
      const url = new URL(request.url);
      const instrumentId = url.searchParams.get('instrument_id');
      const channelId = url.searchParams.get('channel_id');

      if (!instrumentId) {
        return errorResponse('instrument_id is required', 400);
      }

      const result = await this.queries.getCurrentCalibration.execute({
        instrumentId: parseInt(instrumentId),
        channelId: channelId ? parseInt(channelId) : null
      });

      return jsonResponse(result);
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('not calibratable')) {
        return errorResponse(error.message, 400);
      }
      return errorResponse(error.message, 500);
    }
  }

  /**
   * GET /api/v11/calibrations/timeline
   * Get calibration timeline for an instrument
   */
  async timeline(request) {
    // Authentication required for read
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'calibrations', 'read'
    );
    if (response) return response;

    try {
      const url = new URL(request.url);
      const instrumentId = url.searchParams.get('instrument_id');
      const channelId = url.searchParams.get('channel_id');
      const startDate = url.searchParams.get('start_date');
      const endDate = url.searchParams.get('end_date');

      if (!instrumentId) {
        return errorResponse('instrument_id is required', 400);
      }

      const timeline = await this.queries.getCalibrationTimeline.execute({
        instrumentId: parseInt(instrumentId),
        channelId: channelId ? parseInt(channelId) : null,
        startDate,
        endDate
      });

      return jsonResponse(timeline);
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('not calibratable')) {
        return errorResponse(error.message, 400);
      }
      return errorResponse(error.message, 500);
    }
  }

  /**
   * GET /api/v11/calibrations/expired
   * Get expired calibrations
   */
  async expired(request) {
    // Authentication required for read
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'calibrations', 'read'
    );
    if (response) return response;

    try {
      const records = await this.repositories.calibration.findExpired();

      return jsonResponse({ expired_calibrations: records });
    } catch (error) {
      return errorResponse(error.message, 500);
    }
  }

  /**
   * GET /api/v11/calibrations/expiring
   * Get calibrations expiring within N days
   */
  async expiring(request) {
    // Authentication required for read
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'calibrations', 'read'
    );
    if (response) return response;

    try {
      const url = new URL(request.url);
      const days = parseInt(url.searchParams.get('days')) || 30;

      const records = await this.repositories.calibration.findExpiringWithin(days);

      return jsonResponse({
        expiring_within_days: days,
        calibrations: records
      });
    } catch (error) {
      return errorResponse(error.message, 500);
    }
  }

  /**
   * POST /api/v11/calibrations
   * Create a new calibration record (multispectral/hyperspectral only)
   * Requires write permission on calibrations resource
   */
  async create(request) {
    // Authorization: station admins can create calibration records
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'calibrations', 'write'
    );
    if (response) return response;

    try {
      const data = await request.json();

      const record = await this.commands.createCalibrationRecord.execute(data);

      return jsonResponse({ calibration_record: record }, 201);
    } catch (error) {
      if (error.message.includes('not found')) {
        return notFoundResponse(error.message);
      }
      if (error.message.includes('not calibratable')) {
        return errorResponse(error.message, 400);
      }
      return errorResponse(error.message, 400);
    }
  }

  /**
   * PUT /api/v11/calibrations/:id
   * Update a calibration record
   * Requires write permission on calibrations resource
   */
  async update(request, id) {
    // Authorization: station admins can update calibration records
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'calibrations', 'write'
    );
    if (response) return response;

    try {
      const data = await request.json();
      data.id = parseInt(id);

      const record = await this.commands.updateCalibrationRecord.execute(data);

      return jsonResponse({ calibration_record: record });
    } catch (error) {
      if (error.message.includes('not found')) {
        return notFoundResponse(error.message);
      }
      return errorResponse(error.message, 400);
    }
  }

  /**
   * POST /api/v11/calibrations/:id/expire
   * Mark a calibration record as expired
   * Requires write permission on calibrations resource
   */
  async expire(request, id) {
    // Authorization: station admins can expire calibration records
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'calibrations', 'write'
    );
    if (response) return response;

    try {
      const data = await request.json();
      const reason = data.reason || 'expired';

      const record = await this.commands.expireCalibrationRecord.execute({
        id: parseInt(id),
        reason
      });

      return jsonResponse({ calibration_record: record });
    } catch (error) {
      if (error.message.includes('not found')) {
        return notFoundResponse(error.message);
      }
      return errorResponse(error.message, 400);
    }
  }

  /**
   * DELETE /api/v11/calibrations/:id
   * Delete a calibration record
   * Requires delete permission on calibrations resource
   */
  async delete(request, id) {
    // Authorization: station admins can delete calibration records
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'calibrations', 'delete'
    );
    if (response) return response;

    try {
      await this.commands.deleteCalibrationRecord.execute(parseInt(id));

      return jsonResponse({ success: true, message: 'Calibration record deleted' });
    } catch (error) {
      if (error.message.includes('not found')) {
        return notFoundResponse(error.message);
      }
      return errorResponse(error.message, 500);
    }
  }
}
