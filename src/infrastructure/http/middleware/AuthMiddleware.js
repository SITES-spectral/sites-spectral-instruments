/**
 * Authentication Middleware for V11 Controllers
 *
 * Provides authentication and authorization checks for hexagonal architecture controllers.
 * Uses the domain AuthorizationService for permission decisions.
 *
 * @module infrastructure/http/middleware/AuthMiddleware
 * @version 11.0.0-alpha.34
 */

import { getUserFromRequest } from '../../../auth/authentication.js';
import { AuthorizationService } from '../../../domain/authorization/AuthorizationService.js';
import {
  createUnauthorizedResponse,
  createForbiddenResponse,
  createErrorResponse
} from '../../../utils/responses.js';

/**
 * Authentication Middleware
 * Handles JWT validation and authorization checks for V11 controllers
 */
export class AuthMiddleware {
  /**
   * @param {Object} env - Cloudflare Worker environment
   */
  constructor(env) {
    this.env = env;
    this.authService = new AuthorizationService();
  }

  /**
   * Authenticate request and return user or error response
   * @param {Request} request - HTTP request
   * @returns {Promise<Object|Response>} User object or error response
   */
  async authenticate(request) {
    try {
      const user = await getUserFromRequest(request, this.env);

      if (!user) {
        return createUnauthorizedResponse();
      }

      return user;
    } catch (error) {
      console.error('Authentication error:', error);
      return createUnauthorizedResponse();
    }
  }

  /**
   * Authenticate and authorize in one step
   * @param {Request} request - HTTP request
   * @param {string} resource - Resource type (stations, platforms, instruments, etc.)
   * @param {string} action - Action type (read, write, delete, admin)
   * @param {Object} context - Additional context for authorization
   * @returns {Promise<{user: Object|null, response: Response|null}>}
   */
  async authenticateAndAuthorize(request, resource, action, context = {}) {
    // First authenticate
    const authResult = await this.authenticate(request);

    if (authResult instanceof Response) {
      return { user: null, response: authResult };
    }

    const rawUser = authResult;

    // Create User entity from raw payload
    const userEntity = this.authService.createUser(rawUser);

    // Check authorization
    const authzResult = this.authService.authorize(userEntity, resource, action, context);

    if (!authzResult.allowed) {
      return {
        user: null,
        response: createForbiddenResponse(authzResult.reason)
      };
    }

    // Return both raw user (for backward compat) and user entity
    return {
      user: rawUser,
      userEntity,
      response: null
    };
  }

  /**
   * Check if user is a global admin (admin or sites-admin)
   * @param {Object} user - Raw user object
   * @returns {boolean}
   */
  isGlobalAdmin(user) {
    const userEntity = this.authService.createUser(user);
    return userEntity.isGlobalAdmin();
  }

  /**
   * Check if user is a station admin
   * @param {Object} user - Raw user object
   * @returns {boolean}
   */
  isStationAdmin(user) {
    const userEntity = this.authService.createUser(user);
    return userEntity.isStationAdmin();
  }

  /**
   * Check if user can edit at a specific station
   * @param {Object} user - Raw user object
   * @param {string|number} stationId - Station identifier
   * @returns {boolean}
   */
  canEditStation(user, stationId) {
    const userEntity = this.authService.createUser(user);
    return userEntity.canEditStation(stationId);
  }

  /**
   * Get station context for authorization from request body or URL
   * @param {Object} body - Request body (optional)
   * @param {string|number} stationId - Station ID from URL (optional)
   * @returns {Object} Context object for authorization
   */
  getStationContext(body = {}, stationId = null) {
    return {
      stationId: stationId || body.station_id || body.stationId || null
    };
  }
}

/**
 * Create authentication middleware instance
 * @param {Object} env - Cloudflare Worker environment
 * @returns {AuthMiddleware}
 */
export function createAuthMiddleware(env) {
  return new AuthMiddleware(env);
}
