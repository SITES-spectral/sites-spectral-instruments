/**
 * Admin Controller
 *
 * HTTP controller for admin endpoints.
 * Maps HTTP requests to admin query use cases.
 * All endpoints require GLOBAL admin role (admin or sites-admin usernames only).
 * Station admins (e.g., svb-admin) cannot access these endpoints.
 *
 * @module infrastructure/http/controllers/AdminController
 * @version 11.0.0-alpha.30
 */

import {
  createSuccessResponse,
  createErrorResponse,
  createForbiddenResponse
} from '../../../utils/responses.js';
import { validateAdminPermission } from '../../../auth/permissions.js';

/**
 * Admin Controller
 */
export class AdminController {
  /**
   * @param {Object} container - Dependency injection container
   */
  constructor(container) {
    this.queries = container.queries;
    this.adminRepository = container.adminRepository;
  }

  /**
   * Check if user has GLOBAL admin role
   * Uses domain authorization to distinguish global admins from station admins
   * @private
   */
  _requireAdmin(request) {
    const user = request.user;

    // Use domain authorization to validate global admin status
    if (!validateAdminPermission(user)) {
      return createForbiddenResponse('Global admin access required. Station admins cannot access admin panel.');
    }
    return null;
  }

  /**
   * GET /admin/activity-logs - Get activity logs
   */
  async getActivityLogs(request, url) {
    const forbidden = this._requireAdmin(request);
    if (forbidden) return forbidden;

    try {
      const stationId = url.searchParams.get('station_id');
      const userId = url.searchParams.get('user_id');
      const action = url.searchParams.get('action');
      const entityType = url.searchParams.get('entity_type');
      const startDate = url.searchParams.get('start_date');
      const endDate = url.searchParams.get('end_date');
      const limit = parseInt(url.searchParams.get('limit') || '100', 10);
      const offset = parseInt(url.searchParams.get('offset') || '0', 10);

      const result = await this.queries.getActivityLogs.execute({
        stationId: stationId ? parseInt(stationId, 10) : undefined,
        userId: userId ? parseInt(userId, 10) : undefined,
        action,
        entityType,
        startDate,
        endDate,
        limit,
        offset
      });

      return createSuccessResponse({
        data: result.items,
        total: result.total,
        pagination: result.pagination
      });
    } catch (error) {
      return createErrorResponse(error.message, 500);
    }
  }

  /**
   * GET /admin/user-sessions - Get user session summaries
   */
  async getUserSessions(request, url) {
    const forbidden = this._requireAdmin(request);
    if (forbidden) return forbidden;

    try {
      const includeInactive = url.searchParams.get('include_inactive') === 'true';

      const sessions = await this.queries.getUserSessions.execute({
        includeInactive
      });

      return createSuccessResponse({
        data: sessions
      });
    } catch (error) {
      return createErrorResponse(error.message, 500);
    }
  }

  /**
   * GET /admin/station-stats - Get station activity statistics
   */
  async getStationStats(request, url) {
    const forbidden = this._requireAdmin(request);
    if (forbidden) return forbidden;

    try {
      const startDate = url.searchParams.get('start_date');
      const endDate = url.searchParams.get('end_date');

      const stats = await this.queries.getStationStats.execute({
        startDate,
        endDate
      });

      return createSuccessResponse({
        data: stats
      });
    } catch (error) {
      return createErrorResponse(error.message, 500);
    }
  }

  /**
   * GET /admin/health - Get system health (enhanced)
   */
  async getHealth(request) {
    const forbidden = this._requireAdmin(request);
    if (forbidden) return forbidden;

    try {
      const health = await this.adminRepository.getSystemHealth();

      return createSuccessResponse(health);
    } catch (error) {
      return createErrorResponse(error.message, 500);
    }
  }

  /**
   * GET /admin/summary - Get admin dashboard summary
   */
  async getSummary(request, url) {
    const forbidden = this._requireAdmin(request);
    if (forbidden) return forbidden;

    try {
      // Get stats for last 30 days by default
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [activityResult, sessions, stationStats, health] = await Promise.all([
        this.queries.getActivityLogs.execute({
          startDate: thirtyDaysAgo.toISOString(),
          limit: 1000
        }),
        this.queries.getUserSessions.execute({ includeInactive: true }),
        this.queries.getStationStats.execute({
          startDate: thirtyDaysAgo.toISOString()
        }),
        this.adminRepository.getSystemHealth()
      ]);

      // Calculate summary statistics
      const neverLoggedIn = sessions.filter(s => !s.last_login);
      const activeUsers = sessions.filter(s => s.last_login);
      const inactiveStations = stationStats.filter(s => s.total_activity === 0);

      // Group activities by action
      const activityByAction = activityResult.items.reduce((acc, log) => {
        const action = log.action || 'unknown';
        acc[action] = (acc[action] || 0) + 1;
        return acc;
      }, {});

      return createSuccessResponse({
        summary: {
          totalStations: stationStats.length,
          activeStations: stationStats.filter(s => s.total_activity > 0).length,
          inactiveStations: inactiveStations.length,
          totalUsers: sessions.length,
          activeUsers: activeUsers.length,
          neverLoggedIn: neverLoggedIn.length,
          totalActivity30d: activityResult.total,
          activityByAction
        },
        health,
        alerts: {
          neverLoggedInUsers: neverLoggedIn.map(u => u.username),
          inactiveStations: inactiveStations.map(s => s.station_acronym)
        }
      });
    } catch (error) {
      return createErrorResponse(error.message, 500);
    }
  }
}
