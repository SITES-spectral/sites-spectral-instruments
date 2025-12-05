/**
 * Station Entity
 * Core domain entity representing a SITES research station.
 *
 * This entity is framework-agnostic and contains only business logic.
 * No database, HTTP, or external dependencies.
 *
 * @module domain/station/Station
 */

/**
 * @typedef {Object} StationProps
 * @property {number} [id] - Database ID (optional for new stations)
 * @property {string} acronym - Station acronym (e.g., 'SVB', 'ANS')
 * @property {string} normalizedName - Normalized name for system use
 * @property {string} displayName - Human-readable display name
 * @property {string} [description] - Station description
 * @property {number} latitude - Geographic latitude (6 decimal precision)
 * @property {number} longitude - Geographic longitude (6 decimal precision)
 * @property {string} [status] - Station status (Active, Inactive, etc.)
 * @property {string} [createdAt] - ISO timestamp
 * @property {string} [updatedAt] - ISO timestamp
 */

export class Station {
  /**
   * Create a Station entity
   * @param {StationProps} props - Station properties
   */
  constructor(props) {
    this.id = props.id || null;
    this.acronym = props.acronym;
    this.normalizedName = props.normalizedName || props.acronym;
    this.displayName = props.displayName;
    this.description = props.description || null;
    this.latitude = props.latitude;
    this.longitude = props.longitude;
    this.status = props.status || 'Active';
    this.createdAt = props.createdAt || null;
    this.updatedAt = props.updatedAt || null;

    // Validate on construction
    this.validate();
  }

  /**
   * Validate station data
   * @throws {Error} If validation fails
   */
  validate() {
    const errors = [];

    if (!this.acronym || typeof this.acronym !== 'string') {
      errors.push('Acronym is required and must be a string');
    } else if (!/^[A-Z]{2,10}$/.test(this.acronym)) {
      errors.push('Acronym must be 2-10 uppercase letters');
    }

    if (!this.displayName || typeof this.displayName !== 'string') {
      errors.push('Display name is required');
    }

    if (typeof this.latitude !== 'number' || this.latitude < -90 || this.latitude > 90) {
      errors.push('Latitude must be a number between -90 and 90');
    }

    if (typeof this.longitude !== 'number' || this.longitude < -180 || this.longitude > 180) {
      errors.push('Longitude must be a number between -180 and 180');
    }

    if (errors.length > 0) {
      throw new Error(`Station validation failed: ${errors.join(', ')}`);
    }
  }

  /**
   * Check if station is active
   * @returns {boolean}
   */
  isActive() {
    return this.status === 'Active';
  }

  /**
   * Get coordinates as [lat, lon] array
   * @returns {[number, number]}
   */
  getCoordinates() {
    return [this.latitude, this.longitude];
  }

  /**
   * Convert to plain object (for serialization)
   * @returns {StationProps}
   */
  toJSON() {
    return {
      id: this.id,
      acronym: this.acronym,
      normalized_name: this.normalizedName,
      display_name: this.displayName,
      description: this.description,
      latitude: this.latitude,
      longitude: this.longitude,
      status: this.status,
      created_at: this.createdAt,
      updated_at: this.updatedAt
    };
  }

  /**
   * Create Station from database row
   * @param {Object} row - Database row
   * @returns {Station}
   */
  static fromDatabase(row) {
    return new Station({
      id: row.id,
      acronym: row.acronym,
      normalizedName: row.normalized_name,
      displayName: row.display_name,
      description: row.description,
      latitude: row.latitude,
      longitude: row.longitude,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }
}
