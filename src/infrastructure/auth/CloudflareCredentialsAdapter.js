/**
 * Cloudflare Credentials Adapter
 *
 * Implementation of UserCredentialsPort that loads credentials from
 * Cloudflare environment secrets.
 *
 * @module infrastructure/auth/CloudflareCredentialsAdapter
 * @version 11.0.0
 */

import { UserCredentialsPort } from '../../domain/user/UserCredentialsPort.js';

/**
 * Known SITES station names for credential loading
 */
const STATION_NAMES = [
  'abisko',
  'asa',
  'bolmen',
  'erken',
  'grimso',
  'lonnstorp',
  'robacksdalen',
  'skogaryd',
  'svartberget'
];

/**
 * Cloudflare Credentials Adapter
 * @implements {UserCredentialsPort}
 */
export class CloudflareCredentialsAdapter extends UserCredentialsPort {
  /**
   * @param {Object} env - Cloudflare Worker environment
   */
  constructor(env) {
    super();
    this.env = env;
    this._cachedCredentials = null;
  }

  /**
   * Load all credentials from Cloudflare secrets
   * @returns {Promise<{admin: Object, stations: Object, jwt_secret: string}|null>}
   */
  async loadCredentials() {
    // Return cached credentials if available
    if (this._cachedCredentials) {
      return this._cachedCredentials;
    }

    try {
      if (this.env.USE_CLOUDFLARE_SECRETS !== 'true') {
        console.warn('Cloudflare secrets not enabled');
        return null;
      }

      const credentials = {
        admin: null,
        stations: {},
        jwt_secret: this.env.JWT_SECRET
      };

      // Load admin credentials
      if (this.env.ADMIN_CREDENTIALS) {
        try {
          credentials.admin = JSON.parse(this.env.ADMIN_CREDENTIALS);
        } catch (parseError) {
          console.warn('Failed to parse admin credentials:', parseError);
        }
      }

      // Load station credentials
      for (const stationName of STATION_NAMES) {
        const secretName = `STATION_${stationName.toUpperCase()}_CREDENTIALS`;
        const stationSecret = this.env[secretName];

        if (stationSecret) {
          try {
            credentials.stations[stationName] = JSON.parse(stationSecret);
          } catch (parseError) {
            console.warn(`Failed to parse credentials for ${stationName}:`, parseError);
          }
        }
      }

      this._cachedCredentials = credentials;
      return credentials;

    } catch (error) {
      console.error('Failed to load credentials:', error);
      return null;
    }
  }

  /**
   * Get admin credentials
   * @returns {Promise<{username: string, role: string}|null>}
   */
  async getAdminCredentials() {
    const credentials = await this.loadCredentials();
    return credentials?.admin || null;
  }

  /**
   * Get station credentials by station name
   * @param {string} stationName - Station normalized name
   * @returns {Promise<{username: string, role: string, permissions: string[], edit_privileges: boolean}|null>}
   */
  async getStationCredentials(stationName) {
    const credentials = await this.loadCredentials();
    return credentials?.stations?.[stationName.toLowerCase()] || null;
  }

  /**
   * Get all station credentials
   * @returns {Promise<Object<string, Object>>}
   */
  async getAllStationCredentials() {
    const credentials = await this.loadCredentials();
    return credentials?.stations || {};
  }

  /**
   * Validate user credentials
   * @param {string} username - Username to validate
   * @param {string} password - Password to validate
   * @returns {Promise<{valid: boolean, user: Object|null}>}
   */
  async validateCredentials(username, password) {
    const credentials = await this.loadCredentials();
    if (!credentials) {
      return { valid: false, user: null };
    }

    // Check admin credentials
    if (credentials.admin &&
        credentials.admin.username === username &&
        credentials.admin.password === password) {
      return {
        valid: true,
        user: {
          username: credentials.admin.username,
          role: credentials.admin.role,
          station: null,
          scope: 'system-wide'
        }
      };
    }

    // Check station credentials
    for (const [stationName, stationCreds] of Object.entries(credentials.stations || {})) {
      if (stationCreds.username === username && stationCreds.password === password) {
        return {
          valid: true,
          user: {
            username: stationCreds.username,
            role: stationCreds.role,
            station: stationName,
            scope: 'station-limited',
            permissions: stationCreds.permissions || ['read'],
            edit_privileges: stationCreds.edit_privileges || false
          }
        };
      }
    }

    return { valid: false, user: null };
  }

  /**
   * Clear cached credentials (useful for testing)
   */
  clearCache() {
    this._cachedCredentials = null;
  }
}
