// Users Management Handler
// Admin-only user listing and management interface
// NOTE: Actual credential modification requires updating Cloudflare secrets
// v11.0.0-alpha.30: Uses domain authorization for global admin validation

import { getUserFromRequest } from '../auth/authentication.js';
import { requireGlobalAdmin, validateAdminPermission } from '../auth/permissions.js';
import {
  createSuccessResponse,
  createErrorResponse,
  createUnauthorizedResponse,
  createForbiddenResponse,
  createNotFoundResponse
} from '../utils/responses.js';
import { logSecurityEvent } from '../utils/logging.js';

/**
 * Handle user management requests (Global Admin only)
 * Station admins (e.g., svb-admin) cannot access user management
 *
 * @param {string} method - HTTP method
 * @param {Array} pathSegments - Path segments from URL
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Users response
 */
export async function handleUsers(method, pathSegments, request, env) {
  // Require global admin (admin or sites-admin usernames only)
  const user = await requireGlobalAdmin(request, env);
  if (user instanceof Response) {
    // Log unauthorized access attempt
    const attemptingUser = await getUserFromRequest(request, env);
    if (attemptingUser) {
      await logSecurityEvent('UNAUTHORIZED_USER_ACCESS', attemptingUser, request, env);
    }
    return user; // Returns the 403 Forbidden response
  }

  const action = pathSegments[1];

  try {
    switch (method) {
      case 'GET':
        if (action === 'list') {
          return await listAllUsers(user, env);
        }
        if (action === 'audit') {
          return await getUserAuditLog(user, env);
        }
        return await listAllUsers(user, env);

      case 'POST':
        if (action === 'analyze-role-change') {
          return await analyzeRoleChange(user, request, env);
        }
        return createErrorResponse('User creation requires Cloudflare secrets modification', 501);

      default:
        return createErrorResponse('Method not allowed', 405);
    }
  } catch (error) {
    console.error('User management error:', error);
    return createErrorResponse('User management operation failed: ' + error.message, 500);
  }
}

/**
 * List all users from credentials (read-only)
 * @param {Object} user - Authenticated admin user
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Users list response
 */
async function listAllUsers(user, env) {
  try {
    const credentials = await loadCredentials(env);
    if (!credentials) {
      return createErrorResponse('Failed to load user credentials', 500);
    }

    const users = [];

    // Add admin user
    if (credentials.admin) {
      users.push({
        id: 'admin',
        username: credentials.admin.username,
        role: credentials.admin.role,
        station: null,
        station_name: 'All Stations',
        scope: 'system-wide',
        security_level: 'full-access',
        created_source: 'cloudflare-secret',
        can_edit_online: false,
        warning: null
      });
    }

    // Add station users
    if (credentials.stations) {
      for (const [stationName, stationCreds] of Object.entries(credentials.stations)) {
        // Get station info from database
        const stationData = await getStationByNormalizedName(stationName, env);

        users.push({
          id: `station-${stationName}`,
          username: stationCreds.username,
          role: stationCreds.role,
          station: stationName,
          station_acronym: stationData?.acronym || stationName.toUpperCase(),
          station_name: stationData?.display_name || stationName,
          scope: 'station-limited',
          security_level: stationCreds.edit_privileges ? 'station-edit' : 'station-read-only',
          permissions: stationCreds.permissions || ['read'],
          edit_privileges: stationCreds.edit_privileges || false,
          created_source: 'cloudflare-secret',
          can_edit_online: false,
          warning: null
        });
      }
    }

    await logSecurityEvent('USER_LIST_ACCESSED', { admin: user.username, count: users.length }, null, env);

    return createSuccessResponse({
      users,
      total: users.length,
      message: 'Users loaded from Cloudflare secrets (read-only)',
      management_note: 'To modify users, update Cloudflare secrets using wrangler CLI or dashboard'
    });

  } catch (error) {
    console.error('Error listing users:', error);
    return createErrorResponse('Failed to list users: ' + error.message, 500);
  }
}

/**
 * Analyze what would happen if a user's role was changed
 * Security impact analysis with warnings
 * @param {Object} adminUser - Authenticated admin user
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Role change analysis response
 */
async function analyzeRoleChange(adminUser, request, env) {
  try {
    const { username, current_role, new_role, station } = await request.json();

    if (!username || !current_role || !new_role) {
      return createErrorResponse('Missing required fields: username, current_role, new_role', 400);
    }

    const analysis = {
      username,
      current_role,
      new_role,
      station,
      security_impact: 'unknown',
      warnings: [],
      access_changes: [],
      recommendations: []
    };

    // Analyze role change impact
    if (current_role === 'station' && new_role === 'admin') {
      analysis.security_impact = 'CRITICAL';
      analysis.warnings.push({
        level: 'CRITICAL',
        type: 'permission_escalation',
        message: `⚠️ CRITICAL: Changing ${username} from station to admin grants FULL SYSTEM ACCESS`
      });
      analysis.warnings.push({
        level: 'HIGH',
        type: 'station_boundary_removed',
        message: `Station restriction for "${station}" will be COMPLETELY BYPASSED`
      });
      analysis.warnings.push({
        level: 'HIGH',
        type: 'data_corruption_risk',
        message: 'User can now modify ALL stations, platforms, and instruments across entire system'
      });

      analysis.access_changes.push({
        category: 'Stations',
        before: `Limited to ${station} only`,
        after: 'ALL stations (system-wide access)',
        risk: 'HIGH'
      });
      analysis.access_changes.push({
        category: 'Platforms',
        before: `Only platforms at ${station}`,
        after: 'ALL platforms at ALL stations',
        risk: 'HIGH'
      });
      analysis.access_changes.push({
        category: 'Instruments',
        before: `Only instruments at ${station}`,
        after: 'ALL instruments system-wide',
        risk: 'HIGH'
      });
      analysis.access_changes.push({
        category: 'User Management',
        before: 'No access',
        after: 'Can manage all users',
        risk: 'CRITICAL'
      });

      analysis.recommendations.push('Consider creating a "station_admin" role instead for station-scoped admin privileges');
      analysis.recommendations.push('Ensure user is trained on all stations in the system before granting admin access');
      analysis.recommendations.push('Enable comprehensive audit logging to track all admin actions');

    } else if (current_role === 'admin' && new_role === 'station') {
      analysis.security_impact = 'MEDIUM';
      analysis.warnings.push({
        level: 'MEDIUM',
        type: 'permission_reduction',
        message: `Changing ${username} from admin to station will RESTRICT access to only ${station}`
      });
      analysis.warnings.push({
        level: 'LOW',
        type: 'access_loss',
        message: 'User will lose ability to manage other stations and users'
      });

      analysis.access_changes.push({
        category: 'Scope',
        before: 'System-wide access to ALL stations',
        after: `Limited to ${station} only`,
        risk: 'LOW'
      });

      analysis.recommendations.push('Verify this is intentional - admin privileges will be revoked');
      analysis.recommendations.push('User should be notified of access restriction before change');

    } else if (current_role === 'readonly' && new_role === 'station') {
      analysis.security_impact = 'LOW';
      analysis.warnings.push({
        level: 'LOW',
        type: 'edit_privileges_granted',
        message: `User ${username} will gain edit privileges for ${station}`
      });

      analysis.access_changes.push({
        category: 'Permissions',
        before: 'Read-only access',
        after: 'Read and write access',
        risk: 'LOW'
      });

    } else if (new_role === current_role) {
      analysis.security_impact = 'NONE';
      analysis.warnings.push({
        level: 'INFO',
        type: 'no_change',
        message: 'Role is unchanged - no security impact'
      });
    } else {
      analysis.security_impact = 'UNKNOWN';
      analysis.warnings.push({
        level: 'MEDIUM',
        type: 'review_required',
        message: `Role change from ${current_role} to ${new_role} requires manual security review`
      });
    }

    await logSecurityEvent('ROLE_CHANGE_ANALYZED', {
      admin: adminUser.username,
      target_user: username,
      current_role,
      new_role,
      security_impact: analysis.security_impact
    }, null, env);

    return createSuccessResponse(analysis);

  } catch (error) {
    console.error('Role change analysis error:', error);
    return createErrorResponse('Failed to analyze role change: ' + error.message, 500);
  }
}

/**
 * Get user audit log (security events)
 * @param {Object} user - Authenticated admin user
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Audit log response
 */
async function getUserAuditLog(user, env) {
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

    const results = await env.DB.prepare(query).all();

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
 * Load credentials from environment variables (copied from authentication.js)
 * @param {Object} env - Environment variables and bindings
 * @returns {Object|null} Credentials object or null if failed
 */
async function loadCredentials(env) {
  try {
    if (env.USE_CLOUDFLARE_SECRETS === 'true') {
      const credentials = {
        admin: JSON.parse(env.ADMIN_CREDENTIALS || '{}'),
        stations: {},
        jwt_secret: env.JWT_SECRET
      };

      const stationNames = ['abisko', 'asa', 'bolmen', 'erken', 'grimso', 'lonnstorp', 'robacksdalen', 'skogaryd', 'svartberget'];

      for (const stationName of stationNames) {
        const secretName = `STATION_${stationName.toUpperCase()}_CREDENTIALS`;
        const stationSecret = env[secretName];
        if (stationSecret) {
          try {
            credentials.stations[stationName] = JSON.parse(stationSecret);
          } catch (parseError) {
            console.warn(`Failed to parse credentials for ${stationName}:`, parseError);
          }
        }
      }

      return credentials;
    } else {
      console.error('No credential loading method configured');
      return null;
    }
  } catch (error) {
    console.error('Failed to load credentials:', error);
    return null;
  }
}

/**
 * Get station data by normalized name (copied from authentication.js)
 * @param {string} normalizedName - Station normalized name
 * @param {Object} env - Environment variables and bindings
 * @returns {Object|null} Station data or null
 */
async function getStationByNormalizedName(normalizedName, env) {
  try {
    const query = `
      SELECT id, display_name, acronym, normalized_name, latitude, longitude,
             elevation_m, status, country, description
      FROM stations
      WHERE normalized_name = ?
    `;

    const result = await env.DB.prepare(query).bind(normalizedName).first();
    return result || null;
  } catch (error) {
    console.error('Database error in getStationByNormalizedName:', error);
    return null;
  }
}
