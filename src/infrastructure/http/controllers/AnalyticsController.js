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
import { getUserFromRequest } from '../../../auth/authentication.js';
import {
  createSuccessResponse,
  createErrorResponse,
  createUnauthorizedResponse,
  createForbiddenResponse
} from '../../../utils/responses.js';

export class AnalyticsController {
  /**
   * @param {Object} container - Dependency injection container
   * @param {Object} env - Cloudflare Worker environment
   */
  constructor(container, env) {
    this.analyticsRepository = container.repositories.analytics;
    this.service = new AnalyticsService(this.analyticsRepository);
    this.env = env;
  }

  /**
   * Handle analytics requests
   * @param {Request} request - HTTP request
   * @param {string[]} resourcePath - URL path segments
   * @param {URL} url - Parsed URL
   * @returns {Promise<Response>}
   */
  async handle(request, resourcePath, url) {
    // Authenticate user
    const user = await getUserFromRequest(request, this.env);
    if (!user) {
      return createUnauthorizedResponse();
    }

    // Admin-only access for analytics
    if (user.role !== 'admin') {
      return createForbiddenResponse('Admin privileges required for system analytics');
    }

    if (request.method !== 'GET') {
      return createErrorResponse('Method not allowed', 405);
    }

    const action = resourcePath[0];

    try {
      switch (action) {
        case 'overview':
          return await this.getOverview();

        case 'stations':
          return await this.getStationAnalytics();

        case 'instruments':
          return await this.getInstrumentAnalytics();

        case 'activity':
          return await this.getActivityAnalytics();

        case 'health':
          return await this.getSystemHealth();

        default:
          // Default: return overview
          return await this.getOverview();
      }
    } catch (error) {
      console.error('Analytics error:', error);
      return createErrorResponse('Analytics operation failed: ' + error.message, 500);
    }
  }

  /**
   * Get system overview
   * @returns {Promise<Response>}
   */
  async getOverview() {
    const data = await this.service.getSystemOverview();
    return createSuccessResponse(data);
  }

  /**
   * Get station analytics
   * @returns {Promise<Response>}
   */
  async getStationAnalytics() {
    const data = await this.service.getStationAnalytics();
    return createSuccessResponse(data);
  }

  /**
   * Get instrument analytics
   * @returns {Promise<Response>}
   */
  async getInstrumentAnalytics() {
    const data = await this.service.getInstrumentAnalytics();
    return createSuccessResponse(data);
  }

  /**
   * Get activity analytics
   * @returns {Promise<Response>}
   */
  async getActivityAnalytics() {
    const data = await this.service.getActivityAnalytics();
    return createSuccessResponse(data);
  }

  /**
   * Get system health
   * @returns {Promise<Response>}
   */
  async getSystemHealth() {
    const data = await this.service.getSystemHealth();
    return createSuccessResponse(data);
  }
}
