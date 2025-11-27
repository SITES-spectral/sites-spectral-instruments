// Authentication Middleware for SITES Spectral API
// Provides composable authentication and permission checking

import { requireAuthentication } from '../auth/permissions.js';
import { getUserFromRequest } from '../auth/authentication.js';
import {
  createUnauthorizedResponse,
  createForbiddenResponse,
  createMethodNotAllowedResponse
} from '../utils/responses.js';

/**
 * Higher-order function that wraps a handler with authentication
 * Returns the user object as the first parameter to the handler
 *
 * @param {Function} handler - The handler function to wrap
 * @returns {Function} Wrapped handler with authentication
 *
 * @example
 * const authenticatedHandler = withAuth(async (user, method, id, request, env) => {
 *   // user is guaranteed to be authenticated here
 *   return createSuccessResponse({ user: user.username });
 * });
 */
export function withAuth(handler) {
  return async function (method, id, request, env, ...rest) {
    const user = await requireAuthentication(request, env);
    if (user instanceof Response) {
      return user; // Return error response (unauthorized)
    }
    return handler(user, method, id, request, env, ...rest);
  };
}

/**
 * Higher-order function that validates HTTP methods before authentication
 *
 * @param {Array<string>} allowedMethods - Array of allowed HTTP methods
 * @returns {Function} Middleware function
 *
 * @example
 * const handler = compose(
 *   withMethodValidation(['GET', 'POST']),
 *   withAuth,
 *   myHandler
 * );
 */
export function withMethodValidation(allowedMethods) {
  return function (handler) {
    return async function (method, id, request, env, ...rest) {
      if (!allowedMethods.includes(method)) {
        return createMethodNotAllowedResponse();
      }
      return handler(method, id, request, env, ...rest);
    };
  };
}

/**
 * Higher-order function that requires a specific role
 *
 * @param {string|Array<string>} requiredRoles - Required role(s)
 * @returns {Function} Middleware function
 *
 * @example
 * const adminHandler = compose(
 *   withAuth,
 *   withRole('admin'),
 *   myAdminHandler
 * );
 */
export function withRole(requiredRoles) {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

  return function (handler) {
    return async function (user, method, id, request, env, ...rest) {
      if (!roles.includes(user.role)) {
        return createForbiddenResponse();
      }
      return handler(user, method, id, request, env, ...rest);
    };
  };
}

/**
 * Higher-order function that validates station access
 * Station users can only access resources from their assigned station
 *
 * @param {Function} getStationFromResource - Async function to extract station from resource
 * @returns {Function} Middleware function
 *
 * @example
 * const stationHandler = compose(
 *   withAuth,
 *   withStationAccess(async (id, env) => {
 *     const instrument = await getInstrument(id, env);
 *     return instrument?.station_normalized_name;
 *   }),
 *   myHandler
 * );
 */
export function withStationAccess(getStationFromResource) {
  return function (handler) {
    return async function (user, method, id, request, env, ...rest) {
      // Admin and readonly users have access to all stations
      if (user.role === 'admin' || user.role === 'readonly') {
        return handler(user, method, id, request, env, ...rest);
      }

      // Station users need to verify access
      if (user.role === 'station' && user.station_normalized_name) {
        if (id) {
          const resourceStation = await getStationFromResource(id, env);
          if (resourceStation && resourceStation !== user.station_normalized_name) {
            return createForbiddenResponse();
          }
        }
      }

      return handler(user, method, id, request, env, ...rest);
    };
  };
}

/**
 * Compose multiple middleware functions
 * Applies middlewares from right to left (innermost first)
 *
 * @param {...Function} middlewares - Middleware functions to compose
 * @returns {Function} Composed middleware
 *
 * @example
 * const handler = compose(
 *   withMethodValidation(['GET']),
 *   withAuth,
 *   withRole('admin'),
 *   myHandler
 * );
 */
export function compose(...middlewares) {
  return middlewares.reduceRight(
    (composed, middleware) => middleware(composed),
    (x) => x
  );
}

/**
 * Create a handler with standard authentication pattern
 * Shortcut for common handler pattern with auth + method validation
 *
 * @param {Object} options - Configuration options
 * @param {Array<string>} options.methods - Allowed HTTP methods
 * @param {string|Array<string>} [options.roles] - Required roles (optional)
 * @param {Function} handler - The handler function
 * @returns {Function} Configured handler
 *
 * @example
 * export const handleStations = createAuthenticatedHandler({
 *   methods: ['GET'],
 *   handler: async (user, method, id, request, env) => {
 *     // Handle request
 *   }
 * });
 */
export function createAuthenticatedHandler({ methods, roles, handler }) {
  return async function (method, id, request, env) {
    // Validate method
    if (!methods.includes(method)) {
      return createMethodNotAllowedResponse();
    }

    // Authenticate
    const user = await requireAuthentication(request, env);
    if (user instanceof Response) {
      return user;
    }

    // Check roles if specified
    if (roles) {
      const allowedRoles = Array.isArray(roles) ? roles : [roles];
      if (!allowedRoles.includes(user.role)) {
        return createForbiddenResponse();
      }
    }

    // Call handler
    return handler(user, method, id, request, env);
  };
}

/**
 * Try to get user from request without requiring authentication
 * Useful for endpoints that have different behavior for authenticated vs anonymous users
 *
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables
 * @returns {Promise<Object|null>} User object or null if not authenticated
 */
export async function tryGetUser(request, env) {
  try {
    const user = await getUserFromRequest(request, env);
    return user || null;
  } catch {
    return null;
  }
}
