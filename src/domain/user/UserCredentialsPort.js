/**
 * User Credentials Port (Interface)
 *
 * Defines the contract for accessing user credentials.
 * Implementations may load from Cloudflare secrets, database, or other sources.
 *
 * @module domain/user/UserCredentialsPort
 * @version 11.0.0
 */

/**
 * @interface UserCredentialsPort
 */
export class UserCredentialsPort {
  /**
   * Load all credentials
   * @returns {Promise<{admin: Object, stations: Object, jwt_secret: string}|null>}
   */
  async loadCredentials() {
    throw new Error('Method not implemented');
  }

  /**
   * Get admin credentials
   * @returns {Promise<{username: string, role: string}|null>}
   */
  async getAdminCredentials() {
    throw new Error('Method not implemented');
  }

  /**
   * Get station credentials by station name
   * @param {string} stationName - Station normalized name
   * @returns {Promise<{username: string, role: string, permissions: string[], edit_privileges: boolean}|null>}
   */
  async getStationCredentials(stationName) {
    throw new Error('Method not implemented');
  }

  /**
   * Get all station credentials
   * @returns {Promise<Object<string, Object>>}
   */
  async getAllStationCredentials() {
    throw new Error('Method not implemented');
  }

  /**
   * Validate user credentials
   * @param {string} username - Username to validate
   * @param {string} password - Password to validate
   * @returns {Promise<{valid: boolean, user: Object|null}>}
   */
  async validateCredentials(username, password) {
    throw new Error('Method not implemented');
  }
}
