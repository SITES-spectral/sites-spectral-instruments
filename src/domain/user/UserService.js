/**
 * User Domain Service
 *
 * Business logic for user management operations.
 * Provides read-only access to user information (actual user management
 * requires updating Cloudflare secrets via wrangler CLI or dashboard).
 *
 * @module domain/user/UserService
 * @version 11.0.0
 */

/**
 * User Service - Business logic for user operations
 */
export class UserService {
  /**
   * @param {import('./UserCredentialsPort.js').UserCredentialsPort} credentialsPort
   * @param {Object} stationRepository - Optional repository for station info
   */
  constructor(credentialsPort, stationRepository = null) {
    this.credentialsPort = credentialsPort;
    this.stationRepository = stationRepository;
  }

  /**
   * List all users
   * @returns {Promise<{users: Object[], total: number, management_note: string}>}
   */
  async listUsers() {
    const credentials = await this.credentialsPort.loadCredentials();
    if (!credentials) {
      throw new Error('Failed to load user credentials');
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
        // Get station info from repository if available
        let stationData = null;
        if (this.stationRepository) {
          stationData = await this.stationRepository.findByNormalizedName(stationName);
        }

        users.push({
          id: `station-${stationName}`,
          username: stationCreds.username,
          role: stationCreds.role,
          station: stationName,
          station_acronym: stationData?.acronym || stationName.toUpperCase(),
          station_name: stationData?.displayName || stationName,
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

    return {
      users,
      total: users.length,
      management_note: 'To modify users, update Cloudflare secrets using wrangler CLI or dashboard'
    };
  }

  /**
   * Analyze what would happen if a user's role was changed
   * Security impact analysis with warnings
   *
   * @param {string} username - Username being changed
   * @param {string} currentRole - Current role
   * @param {string} newRole - Proposed new role
   * @param {string} station - Station (if applicable)
   * @returns {Object} Analysis result
   */
  analyzeRoleChange(username, currentRole, newRole, station) {
    const analysis = {
      username,
      current_role: currentRole,
      new_role: newRole,
      station,
      security_impact: 'unknown',
      warnings: [],
      access_changes: [],
      recommendations: []
    };

    // Analyze role change impact
    if (currentRole === 'station' && newRole === 'admin') {
      analysis.security_impact = 'CRITICAL';
      analysis.warnings.push({
        level: 'CRITICAL',
        type: 'permission_escalation',
        message: `CRITICAL: Changing ${username} from station to admin grants FULL SYSTEM ACCESS`
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

    } else if (currentRole === 'admin' && newRole === 'station') {
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

    } else if (currentRole === 'readonly' && newRole === 'station') {
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

    } else if (newRole === currentRole) {
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
        message: `Role change from ${currentRole} to ${newRole} requires manual security review`
      });
    }

    return analysis;
  }

  /**
   * Get user by username
   * @param {string} username - Username to find
   * @returns {Promise<Object|null>}
   */
  async getUserByUsername(username) {
    const credentials = await this.credentialsPort.loadCredentials();
    if (!credentials) {
      return null;
    }

    // Check admin
    if (credentials.admin && credentials.admin.username === username) {
      return {
        id: 'admin',
        username: credentials.admin.username,
        role: credentials.admin.role,
        station: null,
        scope: 'system-wide'
      };
    }

    // Check stations
    if (credentials.stations) {
      for (const [stationName, stationCreds] of Object.entries(credentials.stations)) {
        if (stationCreds.username === username) {
          return {
            id: `station-${stationName}`,
            username: stationCreds.username,
            role: stationCreds.role,
            station: stationName,
            scope: 'station-limited',
            permissions: stationCreds.permissions || ['read'],
            edit_privileges: stationCreds.edit_privileges || false
          };
        }
      }
    }

    return null;
  }
}
