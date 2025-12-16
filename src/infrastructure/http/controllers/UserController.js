/**
 * User Controller (V11 Architecture)
 *
 * HTTP controller for user management endpoints.
 * Global admin access only (admin or sites-admin usernames).
 * Users are read-only - actual changes require updating Cloudflare secrets.
 *
 * @module infrastructure/http/controllers/UserController
 * @version 11.0.0
 */

import {
  createSuccessResponse,
  createErrorResponse,
  createForbiddenResponse
} from '../../../utils/responses.js';
import { AuthMiddleware } from '../middleware/AuthMiddleware.js';
import { UserService } from '../../../domain/user/UserService.js';
import { CloudflareCredentialsAdapter } from '../../auth/CloudflareCredentialsAdapter.js';
import { logSecurityEvent } from '../../../utils/logging.js';

/**
 * User Controller
 */
export class UserController {
  /**
   * @param {Object} env - Cloudflare Worker environment
   * @param {Object} stationRepository - Optional station repository for enriching user data
   */
  constructor(env, stationRepository = null) {
    const credentialsAdapter = new CloudflareCredentialsAdapter(env);
    this.userService = new UserService(credentialsAdapter, stationRepository);
    this.auth = new AuthMiddleware(env);
    this.env = env;
  }

  /**
   * GET /users - List all users
   * Requires global admin (admin or sites-admin)
   */
  async list(request) {
    // Only global admins can access user management
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'users', 'read'
    );
    if (response) return response;

    // Additional check: must be global admin
    if (!user.isGlobalAdmin()) {
      await logSecurityEvent('UNAUTHORIZED_USER_ACCESS', user, request, this.env);
      return createForbiddenResponse('User management requires global admin privileges');
    }

    try {
      const result = await this.userService.listUsers();

      await logSecurityEvent('USER_LIST_ACCESSED', {
        admin: user.username,
        count: result.users.length
      }, request, this.env);

      return createSuccessResponse({
        ...result,
        message: 'Users loaded from Cloudflare secrets (read-only)'
      });
    } catch (error) {
      console.error('Error listing users:', error);
      return createErrorResponse('Failed to list users: ' + error.message, 500);
    }
  }

  /**
   * GET /users/audit - Get user audit log
   * Requires global admin
   */
  async audit(request) {
    // Only global admins can access audit
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'users', 'read'
    );
    if (response) return response;

    if (!user.isGlobalAdmin()) {
      return createForbiddenResponse('Audit log requires global admin privileges');
    }

    try {
      // Query activity_log table for user-related security events
      const query = `
        SELECT
          id,
          user_id,
          action,
          resource_type,
          resource_id,
          details,
          ip_address,
          user_agent,
          created_at
        FROM activity_log
        WHERE action IN (
          'SUCCESSFUL_LOGIN', 'FAILED_LOGIN', 'USER_LIST_ACCESSED',
          'ROLE_CHANGE_ANALYZED', 'UNAUTHORIZED_USER_ACCESS'
        )
        ORDER BY created_at DESC
        LIMIT 100
      `;

      const results = await this.env.DB.prepare(query).all();

      return createSuccessResponse({
        audit_log: results.results || [],
        total: (results.results || []).length,
        message: 'Last 100 user-related security events'
      });

    } catch (error) {
      console.error('Error fetching audit log:', error);
      // If activity_log table doesn't exist yet, return empty log
      return createSuccessResponse({
        audit_log: [],
        total: 0,
        message: 'Audit logging not yet configured',
        note: 'Activity log table will be created in future migration'
      });
    }
  }

  /**
   * POST /users/analyze-role-change - Analyze role change impact
   * Requires global admin
   */
  async analyzeRoleChange(request) {
    // Only global admins can analyze role changes
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'users', 'write'
    );
    if (response) return response;

    if (!user.isGlobalAdmin()) {
      return createForbiddenResponse('Role change analysis requires global admin privileges');
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return createErrorResponse('Invalid JSON in request body', 400);
    }

    const { username, current_role, new_role, station } = body;

    if (!username || !current_role || !new_role) {
      return createErrorResponse('Missing required fields: username, current_role, new_role', 400);
    }

    const analysis = this.userService.analyzeRoleChange(
      username,
      current_role,
      new_role,
      station
    );

    await logSecurityEvent('ROLE_CHANGE_ANALYZED', {
      admin: user.username,
      target_user: username,
      current_role,
      new_role,
      security_impact: analysis.security_impact
    }, request, this.env);

    return createSuccessResponse(analysis);
  }

  /**
   * Handle request routing
   */
  async handle(request, pathSegments, url) {
    const method = request.method;
    const action = pathSegments[0];

    // GET /users
    if (method === 'GET' && (!action || action === 'list')) {
      return this.list(request);
    }

    // GET /users/audit
    if (method === 'GET' && action === 'audit') {
      return this.audit(request);
    }

    // POST /users/analyze-role-change
    if (method === 'POST' && action === 'analyze-role-change') {
      return this.analyzeRoleChange(request);
    }

    // POST /users (not supported - requires Cloudflare secrets)
    if (method === 'POST' && !action) {
      return createErrorResponse('User creation requires Cloudflare secrets modification', 501);
    }

    return createErrorResponse('Method not allowed', 405);
  }
}
