/**
 * Analytics HTTP Controller
 *
 * Handles HTTP requests for analytics endpoints.
 * Delegates business logic to AnalyticsService.
 *
 * Following Hexagonal Architecture:
 * - This is an HTTP adapter (driving adapter)
 * - Translates HTTP requests to domain service calls
 * - Admin-only access for all analytics endpoints
 *
 * @module infrastructure/http/controllers/AnalyticsController
 */

import { AnalyticsService } from '../../../domain/analytics/AnalyticsService.js';
import { D1AnalyticsRepository } from '../../persistence/d1/D1AnalyticsRepository.js';
import { getUserFromRequest } from '../../../auth/authentication.js';
import {
  createSuccessResponse,
  createErrorResponse,
  createUnauthorizedResponse,
  createForbiddenResponse
} from '../../../utils/responses.js';

export class AnalyticsController {
  /**
   * Handle analytics requests
   * @param {Request} request - HTTP request
   * @param {Object} env - Environment bindings
   * @param {string} method - HTTP method
   * @param {string[]} pathSegments - URL path segments
   * @returns {Promise<Response>}
   */
  static async handle(request, env, method, pathSegments) {
    // Authenticate user
    const user = await getUserFromRequest(request, env);
    if (!user) {
      return createUnauthorizedResponse();
    }

    // Admin-only access for analytics
    if (user.role !== 'admin') {
      return createForbiddenResponse('Admin privileges required for system analytics');
    }

    if (method !== 'GET') {
      return createErrorResponse('Method not allowed', 405);
    }

    // Create repository and service
    const repository = new D1AnalyticsRepository(env.DB);
    const service = new AnalyticsService(repository);

    const action = pathSegments[1];

    try {
      switch (action) {
        case 'overview':
          return await this.getOverview(service);

        case 'stations':
          return await this.getStationAnalytics(service);

        case 'instruments':
          return await this.getInstrumentAnalytics(service);

        case 'activity':
          return await this.getActivityAnalytics(service);

        case 'health':
          return await this.getSystemHealth(service);

        default:
          // Default: return overview
          return await this.getOverview(service);
      }
    } catch (error) {
      console.error('Analytics error:', error);
      return createErrorResponse('Analytics operation failed: ' + error.message, 500);
    }
  }

  /**
   * Get system overview
   * @param {AnalyticsService} service
   * @returns {Promise<Response>}
   */
  static async getOverview(service) {
    const data = await service.getSystemOverview();
    return createSuccessResponse(data);
  }

  /**
   * Get station analytics
   * @param {AnalyticsService} service
   * @returns {Promise<Response>}
   */
  static async getStationAnalytics(service) {
    const data = await service.getStationAnalytics();
    return createSuccessResponse(data);
  }

  /**
   * Get instrument analytics
   * @param {AnalyticsService} service
   * @returns {Promise<Response>}
   */
  static async getInstrumentAnalytics(service) {
    const data = await service.getInstrumentAnalytics();
    return createSuccessResponse(data);
  }

  /**
   * Get activity analytics
   * @param {AnalyticsService} service
   * @returns {Promise<Response>}
   */
  static async getActivityAnalytics(service) {
    const data = await service.getActivityAnalytics();
    return createSuccessResponse(data);
  }

  /**
   * Get system health
   * @param {AnalyticsService} service
   * @returns {Promise<Response>}
   */
  static async getSystemHealth(service) {
    const data = await service.getSystemHealth();
    return createSuccessResponse(data);
  }
}
