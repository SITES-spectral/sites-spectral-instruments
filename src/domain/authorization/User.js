/**
 * User Entity
 * Represents an authenticated user with role and station context
 *
 * @module domain/authorization/User
 * @version 15.1.0
 */

import { Role } from './Role.js';

export class User {
  /**
   * Create a User entity from JWT payload
   * @param {Object} params - User parameters
   * @param {string} params.username - Username
   * @param {string} params.role - Role value
   * @param {number|null} params.stationId - Station ID (integer)
   * @param {string|null} params.stationAcronym - Station acronym (e.g., 'SVB')
   * @param {string|null} params.stationNormalizedName - Station normalized name (e.g., 'svartberget')
   * @param {number|null} params.pilotId - UAV pilot ID (for uav-pilot role)
   * @param {string[]|null} params.permissions - Permission array
   */
  constructor({
    username,
    role,
    stationId = null,
    station_id = null,
    stationAcronym = null,
    station_acronym = null,
    stationNormalizedName = null,
    station_normalized_name = null,
    pilotId = null,
    pilot_id = null,
    permissions = []
  }) {
    this.username = username;
    this.role = new Role(role);

    // Support both camelCase and snake_case from JWT payload
    this.stationId = stationId || station_id;
    this.stationAcronym = stationAcronym || station_acronym;
    this.stationNormalizedName = stationNormalizedName || station_normalized_name;
    this.pilotId = pilotId || pilot_id;
    this.permissions = permissions || [];
  }

  /**
   * Check if user has global admin privileges
   * Global admins are: 'admin' and 'sites-admin' usernames
   *
   * @returns {boolean}
   */
  isGlobalAdmin() {
    // Check explicit global admin usernames
    if (Role.GLOBAL_ADMIN_USERNAMES.includes(this.username)) {
      return true;
    }

    // Check role-based (for backward compatibility with role === 'admin')
    return this.role.isGlobalAdmin() && !this.#isStationSpecificAdmin();
  }

  /**
   * Check if user is a station-specific admin
   * Station admins have username ending in '-admin' (e.g., 'svb-admin')
   *
   * @returns {boolean}
   * @private
   */
  #isStationSpecificAdmin() {
    // Check if username ends with '-admin' but is NOT a global admin
    if (!this.username) return false;

    const isAdminSuffix = this.username.endsWith('-admin');
    const isGlobalUsername = Role.GLOBAL_ADMIN_USERNAMES.includes(this.username);

    return isAdminSuffix && !isGlobalUsername;
  }

  /**
   * Check if user is station admin (station-scoped)
   * @returns {boolean}
   */
  isStationAdmin() {
    return this.role.isStationAdmin() || this.#isStationSpecificAdmin();
  }

  /**
   * Check if user is regular station user
   * @returns {boolean}
   */
  isStationUser() {
    return this.role.isStationUser();
  }

  /**
   * Check if user is read-only
   * @returns {boolean}
   */
  isReadOnly() {
    return this.role.isReadOnly();
  }

  /**
   * Check if user is a UAV pilot
   * @returns {boolean}
   */
  isUAVPilot() {
    return this.role.isUAVPilot();
  }

  /**
   * Check if user is station-internal (magic link with station-scoped read-only)
   * @returns {boolean}
   */
  isStationInternal() {
    return this.role.isStationInternal();
  }

  /**
   * Check if user has access to a specific station
   * @param {string|number} stationId - Station ID, acronym, or normalized name
   * @returns {boolean}
   */
  hasAccessToStation(stationId) {
    // Global admins have access to all stations
    if (this.isGlobalAdmin()) {
      return true;
    }

    // Read-only users can view all stations
    if (this.isReadOnly()) {
      return true;
    }

    // Station users/admins only have access to their own station
    // Check multiple formats: integer ID, string acronym, normalized name
    const normalizedInput = String(stationId).toLowerCase();

    return (
      this.stationId === stationId ||
      this.stationId === parseInt(stationId, 10) ||
      (this.stationAcronym && this.stationAcronym.toUpperCase() === String(stationId).toUpperCase()) ||
      (this.stationNormalizedName && this.stationNormalizedName.toLowerCase() === normalizedInput)
    );
  }

  /**
   * Check if user can edit resources at a specific station
   * Only global admins and station admins can edit (not regular station users)
   *
   * @param {string|number} stationId - Station identifier
   * @returns {boolean}
   */
  canEditStation(stationId) {
    // Global admins can edit all stations
    if (this.isGlobalAdmin()) {
      return true;
    }

    // Station admins can edit only their own station
    if (this.isStationAdmin() && this.hasAccessToStation(stationId)) {
      return true;
    }

    // Regular station users and read-only users cannot edit
    return false;
  }

  /**
   * Check if user can delete resources at a specific station
   * @param {string|number} stationId - Station identifier
   * @returns {boolean}
   */
  canDeleteAtStation(stationId) {
    // Global admins can delete at any station
    if (this.isGlobalAdmin()) {
      return true;
    }

    // Station admins can delete at their own station
    if (this.isStationAdmin() && this.hasAccessToStation(stationId)) {
      return true;
    }

    // Station users and read-only cannot delete
    return false;
  }

  /**
   * Get a description of this user's access level
   * @returns {string}
   */
  getAccessDescription() {
    if (this.isGlobalAdmin()) {
      return 'Global administrator with full access to all stations';
    }
    if (this.isStationAdmin()) {
      return `Station administrator for ${this.stationAcronym || this.stationNormalizedName || 'assigned station'}`;
    }
    if (this.isStationUser()) {
      return `Station user for ${this.stationAcronym || this.stationNormalizedName || 'assigned station'} (no delete)`;
    }
    if (this.isReadOnly()) {
      return 'Read-only access to all stations';
    }
    return 'Unknown access level';
  }
}
