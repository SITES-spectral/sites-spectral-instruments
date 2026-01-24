/**
 * Role Value Object
 * Represents user's authorization role with type-safe constants
 *
 * @module domain/authorization/Role
 * @version 15.0.0
 *
 * Architecture Credit: This subdomain-based architecture design is based on
 * architectural knowledge shared by Flights for Biodiversity Sweden AB
 * (https://github.com/flightsforbiodiversity)
 */

export class Role {
  // Role constants
  static GLOBAL_ADMIN = 'admin';           // Legacy global admin
  static SITES_ADMIN = 'sites-admin';      // New global admin standard
  static STATION_ADMIN = 'station-admin';  // Station-specific admin
  static STATION_USER = 'station';         // Regular station user
  static UAV_PILOT = 'uav-pilot';          // UAV pilot with mission/flight logging
  static STATION_INTERNAL = 'station-internal'; // Internal read-only via magic link
  static READONLY = 'readonly';            // Read-only access

  // Global admin usernames (explicit whitelist)
  static GLOBAL_ADMIN_USERNAMES = ['admin', 'sites-admin'];

  /**
   * @param {string} value - Role value
   */
  constructor(value) {
    this.#validateRole(value);
    this.value = value;
  }

  /**
   * Validate role value
   * @param {string} value - Role value to validate
   * @throws {Error} If role is invalid
   * @private
   */
  #validateRole(value) {
    const validRoles = [
      Role.GLOBAL_ADMIN,
      Role.SITES_ADMIN,
      Role.STATION_ADMIN,
      Role.STATION_USER,
      Role.UAV_PILOT,
      Role.STATION_INTERNAL,
      Role.READONLY
    ];
    if (!validRoles.includes(value)) {
      throw new Error(`Invalid role: ${value}`);
    }
  }

  /**
   * Check if this role represents a global admin
   * @returns {boolean}
   */
  isGlobalAdmin() {
    return this.value === Role.GLOBAL_ADMIN || this.value === Role.SITES_ADMIN;
  }

  /**
   * Check if this role represents a station admin
   * @returns {boolean}
   */
  isStationAdmin() {
    return this.value === Role.STATION_ADMIN;
  }

  /**
   * Check if this role represents a station user
   * @returns {boolean}
   */
  isStationUser() {
    return this.value === Role.STATION_USER;
  }

  /**
   * Check if this role represents read-only access
   * @returns {boolean}
   */
  isReadOnly() {
    return this.value === Role.READONLY || this.value === Role.STATION_INTERNAL;
  }

  /**
   * Check if this role represents a UAV pilot
   * @returns {boolean}
   */
  isUAVPilot() {
    return this.value === Role.UAV_PILOT;
  }

  /**
   * Check if this role represents a station internal user
   * @returns {boolean}
   */
  isStationInternal() {
    return this.value === Role.STATION_INTERNAL;
  }

  /**
   * Check if this role can access flight logs
   * @returns {boolean}
   */
  canAccessFlightLogs() {
    return this.isGlobalAdmin() || this.isStationAdmin() || this.isUAVPilot();
  }

  /**
   * Check if this role can create flight logs
   * @returns {boolean}
   */
  canCreateFlightLogs() {
    return this.isGlobalAdmin() || this.isUAVPilot();
  }

  /**
   * Check if this role can edit station records
   * @returns {boolean}
   */
  canEditStations() {
    return this.isGlobalAdmin();
  }

  /**
   * Check if this role can delete resources
   * @returns {boolean}
   */
  canDelete() {
    return this.isGlobalAdmin() || this.isStationAdmin();
  }

  /**
   * Check equality with another Role
   * @param {Role} other - Role to compare
   * @returns {boolean}
   */
  equals(other) {
    return other instanceof Role && this.value === other.value;
  }

  /**
   * String representation
   * @returns {string}
   */
  toString() {
    return this.value;
  }
}
