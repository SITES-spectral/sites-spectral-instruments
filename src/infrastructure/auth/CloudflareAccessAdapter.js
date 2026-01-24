/**
 * Cloudflare Access Adapter
 * Verifies Cloudflare Access JWT tokens for passwordless authentication
 *
 * Architecture Credit: This subdomain-based architecture design is based on
 * architectural knowledge shared by Flights for Biodiversity Sweden AB
 * (https://github.com/flightsforbiodiversity)
 *
 * @module infrastructure/auth/CloudflareAccessAdapter
 * @version 15.0.0
 */

import { createRemoteJWKSet, jwtVerify } from 'jose';

/**
 * Cloudflare Access team domain for SITES Spectral
 * This should match your CF Access configuration
 */
const CF_ACCESS_TEAM_DOMAIN = 'sitesspectral.cloudflareaccess.com';

/**
 * JWKS (JSON Web Key Set) URL for Cloudflare Access
 * Used to verify JWT signatures with automatic key rotation
 */
const CF_ACCESS_CERTS_URL = `https://${CF_ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`;

/**
 * Cache for the JWKS to avoid repeated fetches
 * @type {ReturnType<typeof createRemoteJWKSet>|null}
 */
let jwksCache = null;

/**
 * Global admin email whitelist
 * These users get full admin access via CF Access
 */
const GLOBAL_ADMIN_EMAILS = [
  'jose.beltran@mgeo.lu.se',
  'lars.eklundh@nateko.lu.se'
];

/**
 * Station admin email patterns
 * Maps email domains/patterns to station access
 */
const STATION_EMAIL_MAPPINGS = {
  // Abisko
  'abisko': ['@polar.se', '@naturvardsverket.se'],

  // Asa
  'asa': ['@slu.se'],

  // Svartberget
  'svartberget': ['@slu.se', '@svartberget.se'],

  // Add more station mappings as needed
};

/**
 * Get or create the JWKS key set for verification
 * Uses caching to avoid repeated network requests
 *
 * @returns {ReturnType<typeof createRemoteJWKSet>}
 */
function getJWKS() {
  if (!jwksCache) {
    jwksCache = createRemoteJWKSet(new URL(CF_ACCESS_CERTS_URL));
  }
  return jwksCache;
}

/**
 * Cloudflare Access Adapter for JWT verification
 */
export class CloudflareAccessAdapter {
  /**
   * @param {Object} env - Cloudflare Worker environment
   */
  constructor(env) {
    this.env = env;

    // Allow overriding team domain via environment
    this.teamDomain = env.CF_ACCESS_TEAM_DOMAIN || CF_ACCESS_TEAM_DOMAIN;
    this.certsUrl = `https://${this.teamDomain}/cdn-cgi/access/certs`;
  }

  /**
   * Verify Cloudflare Access JWT from request
   *
   * @param {Request} request - Incoming request
   * @returns {Promise<Object|null>} Verified user info or null if invalid
   */
  async verifyAccessToken(request) {
    try {
      // Get JWT from CF Access header
      const jwtAssertion = request.headers.get('Cf-Access-Jwt-Assertion');

      if (!jwtAssertion) {
        return null;
      }

      // Verify the JWT signature and claims
      const jwks = getJWKS();

      const { payload } = await jwtVerify(jwtAssertion, jwks, {
        // Audience should match your CF Access application ID
        audience: this.env.CF_ACCESS_AUD || undefined,
        issuer: `https://${this.teamDomain}`
      });

      // Extract user information from verified payload
      const email = payload.email;
      const identityNonce = payload.identity_nonce;
      const sub = payload.sub;

      if (!email) {
        console.warn('CF Access JWT missing email claim');
        return null;
      }

      // Map CF Access identity to user role
      const userInfo = await this.mapIdentityToUser(email, sub, payload);

      return userInfo;

    } catch (error) {
      if (error.code === 'ERR_JWT_EXPIRED') {
        console.warn('CF Access JWT expired');
      } else if (error.code === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED') {
        console.warn('CF Access JWT signature verification failed');
      } else {
        console.error('CF Access verification error:', error);
      }
      return null;
    }
  }

  /**
   * Map a CF Access identity (email) to a user record
   *
   * @param {string} email - User email from CF Access
   * @param {string} identityId - CF Access identity ID
   * @param {Object} payload - Full JWT payload
   * @returns {Promise<Object|null>} User info or null
   */
  async mapIdentityToUser(email, identityId, payload) {
    const emailLower = email.toLowerCase();

    // Check if global admin
    if (GLOBAL_ADMIN_EMAILS.includes(emailLower)) {
      // Look up or create admin user
      const adminUser = await this.findOrCreateUser({
        email: emailLower,
        role: 'admin',
        auth_provider: 'cloudflare_access',
        cf_access_identity_id: identityId
      });

      return {
        id: adminUser?.id,
        username: emailLower.split('@')[0],
        email: emailLower,
        role: 'admin',
        auth_provider: 'cloudflare_access',
        cf_access_identity_id: identityId,
        edit_privileges: true,
        permissions: ['read', 'write', 'edit', 'delete', 'admin']
      };
    }

    // Check if existing user in database by CF Access email
    const existingUser = await this.findUserByCFAccessEmail(emailLower);
    if (existingUser) {
      // Update last login timestamp
      await this.updateLastCFAccessLogin(existingUser.id);

      return {
        id: existingUser.id,
        username: existingUser.username,
        email: emailLower,
        role: existingUser.role,
        station_id: existingUser.station_id,
        station_acronym: existingUser.station_acronym,
        auth_provider: 'cloudflare_access',
        cf_access_identity_id: identityId,
        edit_privileges: this.hasEditPrivileges(existingUser.role),
        permissions: this.getPermissionsForRole(existingUser.role)
      };
    }

    // Check if UAV pilot by email
    const pilot = await this.findPilotByEmail(emailLower);
    if (pilot) {
      return {
        id: pilot.user_id,
        username: emailLower.split('@')[0],
        email: emailLower,
        role: 'uav-pilot',
        station_id: null,
        authorized_stations: JSON.parse(pilot.authorized_stations || '[]'),
        auth_provider: 'cloudflare_access',
        cf_access_identity_id: identityId,
        edit_privileges: false,
        permissions: ['read', 'flight-log']
      };
    }

    // No matching user found - could auto-provision based on email domain
    // For now, return null (user must be pre-registered)
    console.warn(`CF Access user not found in database: ${emailLower}`);
    return null;
  }

  /**
   * Find a user by CF Access email
   *
   * @param {string} email - Email address
   * @returns {Promise<Object|null>}
   */
  async findUserByCFAccessEmail(email) {
    try {
      const result = await this.env.DB.prepare(`
        SELECT u.id, u.username, u.email, u.role, u.station_id,
               s.acronym as station_acronym, s.normalized_name as station_normalized_name
        FROM users u
        LEFT JOIN stations s ON u.station_id = s.id
        WHERE u.cf_access_email = ? AND u.active = 1
      `).bind(email).first();

      return result || null;
    } catch (error) {
      console.error('Error finding user by CF Access email:', error);
      return null;
    }
  }

  /**
   * Find a UAV pilot by email
   *
   * @param {string} email - Email address
   * @returns {Promise<Object|null>}
   */
  async findPilotByEmail(email) {
    try {
      const result = await this.env.DB.prepare(`
        SELECT id, user_id, full_name, email, authorized_stations, status
        FROM uav_pilots
        WHERE email = ? AND status = 'active'
      `).bind(email).first();

      return result || null;
    } catch (error) {
      console.error('Error finding pilot by email:', error);
      return null;
    }
  }

  /**
   * Find or create a user based on CF Access identity
   *
   * @param {Object} params - User parameters
   * @returns {Promise<Object|null>}
   */
  async findOrCreateUser(params) {
    try {
      // First try to find existing user
      let user = await this.findUserByCFAccessEmail(params.email);

      if (!user) {
        // Try to find by username (for admin users)
        user = await this.env.DB.prepare(`
          SELECT id, username, email, role, station_id
          FROM users
          WHERE username = ? AND active = 1
        `).bind(params.email.split('@')[0]).first();
      }

      if (user) {
        // Update CF Access fields if needed
        await this.env.DB.prepare(`
          UPDATE users
          SET cf_access_email = ?,
              cf_access_identity_id = ?,
              auth_provider = ?,
              last_cf_access_login = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(
          params.email,
          params.cf_access_identity_id,
          params.auth_provider,
          user.id
        ).run();

        return user;
      }

      // For now, don't auto-create users
      // Admin must pre-register users
      return null;

    } catch (error) {
      console.error('Error in findOrCreateUser:', error);
      return null;
    }
  }

  /**
   * Update last CF Access login timestamp
   *
   * @param {number} userId - User ID
   */
  async updateLastCFAccessLogin(userId) {
    try {
      await this.env.DB.prepare(`
        UPDATE users
        SET last_cf_access_login = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(userId).run();
    } catch (error) {
      console.error('Error updating last CF Access login:', error);
    }
  }

  /**
   * Check if a role has edit privileges
   *
   * @param {string} role - User role
   * @returns {boolean}
   */
  hasEditPrivileges(role) {
    return ['admin', 'sites-admin', 'station-admin'].includes(role);
  }

  /**
   * Get permissions array for a role
   *
   * @param {string} role - User role
   * @returns {string[]}
   */
  getPermissionsForRole(role) {
    const rolePermissions = {
      'admin': ['read', 'write', 'edit', 'delete', 'admin'],
      'sites-admin': ['read', 'write', 'edit', 'delete', 'admin'],
      'station-admin': ['read', 'write', 'edit', 'delete'],
      'station': ['read'],
      'uav-pilot': ['read', 'flight-log'],
      'readonly': ['read'],
      'station-internal': ['read']
    };

    return rolePermissions[role] || ['read'];
  }

  /**
   * Get subdomain from request Host header
   *
   * @param {Request} request - Incoming request
   * @returns {string|null} Subdomain or null for root domain
   */
  static getSubdomain(request) {
    const host = request.headers.get('Host') || '';
    const parts = host.split('.');

    // Expected: subdomain.sitesspectral.work or sitesspectral.work
    if (parts.length === 3 && parts[1] === 'sitesspectral' && parts[2] === 'work') {
      return parts[0];
    }

    // Workers dev URL pattern: subdomain.sites-spectral-instruments.jose-beltran.workers.dev
    // For dev, we might use query param or custom header instead
    if (host.includes('workers.dev')) {
      // Check for X-Subdomain header (for testing)
      const subdomainHeader = request.headers.get('X-Subdomain');
      if (subdomainHeader) {
        return subdomainHeader;
      }
    }

    return null;
  }

  /**
   * Determine portal type from subdomain
   *
   * @param {string|null} subdomain - Subdomain from request
   * @returns {'public'|'admin'|'station'} Portal type
   */
  static getPortalType(subdomain) {
    if (!subdomain || subdomain === 'www') {
      return 'public';
    }

    if (subdomain === 'admin') {
      return 'admin';
    }

    // Any other subdomain is treated as a station portal
    return 'station';
  }

  /**
   * Check if user has access to the requested portal
   *
   * @param {Object} user - Verified user info
   * @param {string} portalType - 'public', 'admin', or 'station'
   * @param {string|null} subdomain - Requested subdomain
   * @returns {boolean}
   */
  static canAccessPortal(user, portalType, subdomain) {
    if (portalType === 'public') {
      return true; // Public is always accessible
    }

    if (!user) {
      return false; // Auth required for admin and station portals
    }

    if (portalType === 'admin') {
      // Only global admins can access admin portal
      return ['admin', 'sites-admin'].includes(user.role);
    }

    if (portalType === 'station') {
      // Global admins can access any station
      if (['admin', 'sites-admin'].includes(user.role)) {
        return true;
      }

      // Station admins/users can access their own station
      if (['station-admin', 'station'].includes(user.role)) {
        const stationSubdomain = subdomain?.toLowerCase();
        const userStationAcronym = user.station_acronym?.toLowerCase();
        return stationSubdomain === userStationAcronym;
      }

      // UAV pilots can access their authorized stations
      if (user.role === 'uav-pilot' && user.authorized_stations) {
        const stationSubdomain = subdomain?.toLowerCase();
        return user.authorized_stations.some(
          s => s.toLowerCase() === stationSubdomain
        );
      }
    }

    return false;
  }
}

export default CloudflareAccessAdapter;
