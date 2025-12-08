/**
 * Maintenance Controller
 *
 * HTTP controller for maintenance record endpoints.
 * Implements V11 API routes for maintenance timeline management.
 *
 * @module infrastructure/http/controllers/MaintenanceController
 */

import { jsonResponse, errorResponse, notFoundResponse } from '../../../utils/responses.js';

export class MaintenanceController {
  constructor(container) {
    this.queries = container.queries;
    this.commands = container.commands;
    this.repositories = container.repositories;
  }

  /**
   * GET /api/v11/maintenance
   * List maintenance records with optional filters
   */
  async list(request) {
    try {
      const url = new URL(request.url);
      const filters = {
        stationId: url.searchParams.get('station_id'),
        platformId: url.searchParams.get('platform_id'),
        instrumentId: url.searchParams.get('instrument_id'),
        entityType: url.searchParams.get('entity_type'),
        type: url.searchParams.get('type'),
        status: url.searchParams.get('status'),
        priority: url.searchParams.get('priority'),
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

      const records = await this.queries.listMaintenanceRecords.execute(filters);

      return jsonResponse({ maintenance_records: records });
    } catch (error) {
      return errorResponse(error.message, 500);
    }
  }

  /**
   * GET /api/v11/maintenance/:id
   * Get a single maintenance record
   */
  async get(request, id) {
    try {
      const record = await this.queries.getMaintenanceRecord.execute(parseInt(id));

      return jsonResponse({ maintenance_record: record });
    } catch (error) {
      if (error.message.includes('not found')) {
        return notFoundResponse(error.message);
      }
      return errorResponse(error.message, 500);
    }
  }

  /**
   * GET /api/v11/maintenance/timeline
   * Get maintenance timeline for an entity
   */
  async timeline(request) {
    try {
      const url = new URL(request.url);
      const entityType = url.searchParams.get('entity_type');
      const entityId = url.searchParams.get('entity_id');
      const startDate = url.searchParams.get('start_date');
      const endDate = url.searchParams.get('end_date');

      if (!entityType || !entityId) {
        return errorResponse('entity_type and entity_id are required', 400);
      }

      const timeline = await this.queries.getMaintenanceTimeline.execute({
        entityType,
        entityId: parseInt(entityId),
        startDate,
        endDate
      });

      return jsonResponse(timeline);
    } catch (error) {
      return errorResponse(error.message, 500);
    }
  }

  /**
   * GET /api/v11/maintenance/pending
   * Get pending/scheduled maintenance records
   */
  async pending(request) {
    try {
      const url = new URL(request.url);
      const stationId = url.searchParams.get('station_id');

      const records = await this.repositories.maintenance.findPending(stationId ? parseInt(stationId) : null);

      return jsonResponse({ pending_maintenance: records });
    } catch (error) {
      return errorResponse(error.message, 500);
    }
  }

  /**
   * GET /api/v11/maintenance/overdue
   * Get overdue maintenance records
   */
  async overdue(request) {
    try {
      const records = await this.repositories.maintenance.findOverdue();

      return jsonResponse({ overdue_maintenance: records });
    } catch (error) {
      return errorResponse(error.message, 500);
    }
  }

  /**
   * POST /api/v11/maintenance
   * Create a new maintenance record
   */
  async create(request) {
    try {
      const data = await request.json();

      const record = await this.commands.createMaintenanceRecord.execute(data);

      return jsonResponse({ maintenance_record: record }, 201);
    } catch (error) {
      if (error.message.includes('not found')) {
        return notFoundResponse(error.message);
      }
      return errorResponse(error.message, 400);
    }
  }

  /**
   * PUT /api/v11/maintenance/:id
   * Update a maintenance record
   */
  async update(request, id) {
    try {
      const data = await request.json();
      data.id = parseInt(id);

      const record = await this.commands.updateMaintenanceRecord.execute(data);

      return jsonResponse({ maintenance_record: record });
    } catch (error) {
      if (error.message.includes('not found')) {
        return notFoundResponse(error.message);
      }
      return errorResponse(error.message, 400);
    }
  }

  /**
   * POST /api/v11/maintenance/:id/complete
   * Mark a maintenance record as completed
   */
  async complete(request, id) {
    try {
      const data = await request.json();
      data.id = parseInt(id);

      const record = await this.commands.completeMaintenanceRecord.execute(data);

      return jsonResponse({ maintenance_record: record });
    } catch (error) {
      if (error.message.includes('not found')) {
        return notFoundResponse(error.message);
      }
      return errorResponse(error.message, 400);
    }
  }

  /**
   * DELETE /api/v11/maintenance/:id
   * Delete a maintenance record
   */
  async delete(request, id) {
    try {
      await this.commands.deleteMaintenanceRecord.execute(parseInt(id));

      return jsonResponse({ success: true, message: 'Maintenance record deleted' });
    } catch (error) {
      if (error.message.includes('not found')) {
        return notFoundResponse(error.message);
      }
      return errorResponse(error.message, 500);
    }
  }
}
