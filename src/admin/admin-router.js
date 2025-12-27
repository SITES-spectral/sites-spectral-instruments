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
        return await handleAdminAudit(method, request, env, user);

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
 * Handle admin audit log requests
 * GET /api/admin/audit - List audit logs with filtering and pagination
 * @param {string} method - HTTP method
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @param {Object} user - Authenticated admin user
 * @returns {Response} Audit log response
 */
async function handleAdminAudit(method, request, env, user) {
  if (method !== 'GET') {
    return createErrorResponse('Method not allowed for audit logs', 405);
  }

  try {
    const { D1AdminRepository } = await import('../infrastructure/persistence/d1/D1AdminRepository.js');
    const adminRepository = new D1AdminRepository(env.DB);

    // Parse query parameters
    const url = new URL(request.url);
    const options = {
      stationId: url.searchParams.get('station_id') ? parseInt(url.searchParams.get('station_id')) : null,
      userId: url.searchParams.get('user_id') ? parseInt(url.searchParams.get('user_id')) : null,
      action: url.searchParams.get('action'),
      entityType: url.searchParams.get('entity_type'),
      startDate: url.searchParams.get('start_date') ? new Date(url.searchParams.get('start_date')) : null,
      endDate: url.searchParams.get('end_date') ? new Date(url.searchParams.get('end_date')) : null,
      limit: Math.min(parseInt(url.searchParams.get('limit')) || 100, 500),
      offset: parseInt(url.searchParams.get('offset')) || 0
    };

    const result = await adminRepository.getActivityLogs(options);

    // Log the audit access
    await logAdminAction(user, 'READ', 'Accessed audit logs', env, {
      filters: {
        station_id: options.stationId,
        user_id: options.userId,
        action: options.action,
        entity_type: options.entityType
      },
      result_count: result.items.length
    });

    return new Response(JSON.stringify({
      success: true,
      data: {
        items: result.items.map(item => ({
          id: item.id,
          user_id: item.userId,
          username: item.username,
          action: item.action,
          entity_type: item.entityType,
          entity_id: item.entityId,
          entity_name: item.entityName,
          station_id: item.stationId,
          station_acronym: item.stationAcronym,
          details: item.details,
          ip_address: item.ipAddress,
          created_at: item.createdAt
        })),
        pagination: {
          total: result.total,
          limit: options.limit,
          offset: options.offset,
          has_more: options.offset + result.items.length < result.total
        }
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Audit log error:', error);
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