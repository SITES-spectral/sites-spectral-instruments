// Admin Router Module
// Admin operation routing with permission checks and rate limiting

import { getUserFromRequest } from '../auth/authentication.js';
import { logSecurityEvent, logAdminAction } from '../utils/logging.js';
import { checkAdminRateLimit } from '../utils/rate-limiting.js';
import {
  createErrorResponse,
  createUnauthorizedResponse,
  createForbiddenResponse,
  createRateLimitResponse,
  createInternalServerErrorResponse
} from '../utils/responses.js';

/**
 * Handle admin requests with security middleware and routing
 * @param {string} method - HTTP method
 * @param {Array} pathSegments - Path segments after /api/admin
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Admin response
 */
export async function handleAdmin(method, pathSegments, request, env) {
  const resourceType = pathSegments[1]; // stations, platforms, instruments, etc.
  const resourceId = pathSegments[2];

  // Apply admin security middleware
  const adminCheck = await adminSecurityMiddleware(request, env);
  if (adminCheck.error) {
    return adminCheck.response;
  }

  const user = adminCheck.user;

  // Rate limiting for admin operations
  const rateLimitCheck = await checkAdminRateLimit(user, method, env);
  if (rateLimitCheck.exceeded) {
    return new Response(JSON.stringify({
      error: 'Rate limit exceeded',
      message: 'Too many admin operations. Please wait before retrying.',
      retry_after: rateLimitCheck.retry_after,
      current_count: rateLimitCheck.current_count,
      limit: rateLimitCheck.limit
    }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Import admin handlers dynamically to avoid circular dependencies
    const { handleAdminStations } = await import('./admin-stations.js');
    const { handleAdminPlatforms } = await import('./admin-platforms.js');
    const { handleAdminInstruments } = await import('./admin-instruments.js');

    switch (resourceType) {
      case 'stations':
        return await handleAdminStations(method, resourceId, request, env, user);

      case 'platforms':
        return await handleAdminPlatforms(method, resourceId, request, env, user);

      case 'instruments':
        return await handleAdminInstruments(method, resourceId, request, env, user);

      case 'rois':
        // ROI admin operations can be handled through instruments admin
        return createErrorResponse('ROI admin operations should be handled through instruments', 400);

      case 'audit':
        // Future: implement audit log viewing for admin users
        return createErrorResponse('Audit functionality not yet implemented', 501);

      default:
        return createErrorResponse('Admin resource not found', 404);
    }
  } catch (error) {
    console.error('Admin API Error:', error);
    await logAdminAction(user, 'ERROR', `Admin operation failed: ${error.message}`, env, {
      resource_type: resourceType,
      resource_id: resourceId,
      method: method,
      error_message: error.message
    });
    return createInternalServerErrorResponse(error);
  }
}

/**
 * Admin Security Middleware
 * Validates admin permissions and logs security events
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Object} Security check result
 */
async function adminSecurityMiddleware(request, env) {
  const user = await getUserFromRequest(request, env);

  if (!user) {
    return {
      error: true,
      response: createUnauthorizedResponse()
    };
  }

  if (user.role !== 'admin') {
    await logSecurityEvent('UNAUTHORIZED_ADMIN_ACCESS', user, request, env);
    return {
      error: true,
      response: new Response(JSON.stringify({
        error: 'Admin privileges required',
        message: 'Access denied: insufficient privileges for admin operations'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    };
  }

  return { error: false, user };
}