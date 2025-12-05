/**
 * Platform Entity
 * Core domain entity representing a measurement platform.
 *
 * This entity is framework-agnostic and contains only business logic.
 * Platform type-specific behavior is delegated to PlatformTypeStrategy.
 *
 * @module domain/platform/Platform
 */

/**
 * @typedef {Object} PlatformProps
 * @property {number} [id] - Database ID (optional for new platforms)
 * @property {string} normalizedName - System identifier (e.g., 'SVB_FOR_PL01')
 * @property {string} displayName - Human-readable name
 * @property {string} mountTypeCode - Mount type code (e.g., 'PL01', 'BL01', 'GL01', 'UAV01')
 * @property {number} stationId - Parent station ID
 * @property {string} stationAcronym - Parent station acronym (for naming)
 * @property {string} platformType - Platform type code ('fixed', 'uav', 'satellite')
 * @property {string} [ecosystemCode] - Ecosystem code (only for fixed platforms)
 * @property {number} [latitude] - Geographic latitude
 * @property {number} [longitude] - Geographic longitude
 * @property {number} [platformHeightM] - Platform height in meters
 * @property {string} [status] - Platform status
 * @property {string} [mountingStructure] - Mounting structure description (free text)
 * @property {string} [deploymentDate] - ISO date string
 * @property {string} [description] - Platform description
 * @property {string} [createdAt] - ISO timestamp
 * @property {string} [updatedAt] - ISO timestamp
 */

/**
 * Valid platform types
 * @constant {string[]}
 */
export const PLATFORM_TYPES = ['fixed', 'uav', 'satellite', 'mobile', 'usv', 'uuv'];

/**
 * Valid ecosystem codes
 * @constant {string[]}
 */
export const ECOSYSTEM_CODES = [
  'FOR', 'AGR', 'GRA', 'HEA', 'MIR', 'ALP',
  'LAK', 'CON', 'WET', 'DEC', 'MAR', 'PEA', 'GEN'
];

/**
 * Mount type prefixes - describes physical mounting structure
 * @constant {Object}
 */
export const MOUNT_TYPE_PREFIXES = {
  PL: {
    code: 'PL',
    name: 'Pole/Tower/Mast',
    description: 'Elevated structures such as observation towers, masts, or poles',
    minHeight: 1.5,
    platformTypes: ['fixed']
  },
  BL: {
    code: 'BL',
    name: 'Building',
    description: 'Mounted on building rooftops or facades',
    minHeight: null,
    platformTypes: ['fixed']
  },
  GL: {
    code: 'GL',
    name: 'Ground Level',
    description: 'Installations below 1.5m height',
    maxHeight: 1.5,
    platformTypes: ['fixed']
  },
  UAV: {
    code: 'UAV',
    name: 'UAV Position',
    description: 'Drone flight position identifier',
    platformTypes: ['uav']
  },
  SAT: {
    code: 'SAT',
    name: 'Satellite',
    description: 'Virtual position for satellite sensor data',
    platformTypes: ['satellite']
  },
  MOB: {
    code: 'MOB',
    name: 'Mobile',
    description: 'Portable/mobile platform position',
    platformTypes: ['mobile']
  },
  USV: {
    code: 'USV',
    name: 'Surface Vehicle',
    description: 'Unmanned surface vehicle position',
    platformTypes: ['usv']
  },
  UUV: {
    code: 'UUV',
    name: 'Underwater Vehicle',
    description: 'Unmanned underwater vehicle position',
    platformTypes: ['uuv']
  }
};

export class Platform {
  /**
   * Create a Platform entity
   * @param {PlatformProps} props - Platform properties
   */
  constructor(props) {
    this.id = props.id || null;
    this.normalizedName = props.normalizedName;
    this.displayName = props.displayName;
    this.mountTypeCode = props.mountTypeCode;
    this.stationId = props.stationId;
    this.stationAcronym = props.stationAcronym;
    this.platformType = props.platformType || 'fixed';
    this.ecosystemCode = props.ecosystemCode || null;
    this.latitude = props.latitude || null;
    this.longitude = props.longitude || null;
    this.platformHeightM = props.platformHeightM || null;
    this.status = props.status || 'Active';
    this.mountingStructure = props.mountingStructure || null;
    this.deploymentDate = props.deploymentDate || null;
    this.description = props.description || null;
    this.createdAt = props.createdAt || null;
    this.updatedAt = props.updatedAt || null;

    // Associated instruments (loaded separately)
    this.instruments = [];
  }

  /**
   * Validate platform data
   * @throws {Error} If validation fails
   */
  validate() {
    const errors = [];

    if (!this.normalizedName || typeof this.normalizedName !== 'string') {
      errors.push('Normalized name is required');
    }

    if (!this.displayName || typeof this.displayName !== 'string') {
      errors.push('Display name is required');
    }

    if (!this.stationId) {
      errors.push('Station ID is required');
    }

    if (!PLATFORM_TYPES.includes(this.platformType)) {
      errors.push(`Invalid platform type. Must be one of: ${PLATFORM_TYPES.join(', ')}`);
    }

    // Fixed platforms require ecosystem code
    if (this.platformType === 'fixed' && !this.ecosystemCode) {
      errors.push('Ecosystem code is required for fixed platforms');
    }

    // Validate ecosystem code if provided
    if (this.ecosystemCode && !ECOSYSTEM_CODES.includes(this.ecosystemCode)) {
      errors.push(`Invalid ecosystem code. Must be one of: ${ECOSYSTEM_CODES.join(', ')}`);
    }

    // UAV and Satellite platforms should NOT have ecosystem code
    if (['uav', 'satellite'].includes(this.platformType) && this.ecosystemCode) {
      errors.push(`${this.platformType.toUpperCase()} platforms should not have ecosystem code`);
    }

    if (errors.length > 0) {
      throw new Error(`Platform validation failed: ${errors.join(', ')}`);
    }
  }

  /**
   * Check if platform is active
   * @returns {boolean}
   */
  isActive() {
    return this.status === 'Active';
  }

  /**
   * Check if platform requires ecosystem code
   * @returns {boolean}
   */
  requiresEcosystem() {
    return this.platformType === 'fixed';
  }

  /**
   * Check if platform is airborne (UAV)
   * @returns {boolean}
   */
  isAirborne() {
    return this.platformType === 'uav';
  }

  /**
   * Check if platform is spaceborne (Satellite)
   * @returns {boolean}
   */
  isSpaceborne() {
    return this.platformType === 'satellite';
  }

  /**
   * Get coordinates as [lat, lon] array (if available)
   * @returns {[number, number]|null}
   */
  getCoordinates() {
    if (this.latitude !== null && this.longitude !== null) {
      return [this.latitude, this.longitude];
    }
    return null;
  }

  /**
   * Add instrument to platform
   * @param {Object} instrument - Instrument entity
   */
  addInstrument(instrument) {
    this.instruments.push(instrument);
  }

  /**
   * Get instrument count
   * @returns {number}
   */
  getInstrumentCount() {
    return this.instruments.length;
  }

  /**
   * Get mount type prefix from mountTypeCode (e.g., 'PL' from 'PL01')
   * @returns {string|null}
   */
  getMountTypePrefix() {
    if (!this.mountTypeCode) return null;
    const match = this.mountTypeCode.match(/^([A-Z]+)/);
    return match ? match[1] : null;
  }

  /**
   * Get mount type info from MOUNT_TYPE_PREFIXES
   * @returns {Object|null}
   */
  getMountTypeInfo() {
    const prefix = this.getMountTypePrefix();
    return prefix ? MOUNT_TYPE_PREFIXES[prefix] : null;
  }

  /**
   * Check if mount type is ground level (below 1.5m)
   * @returns {boolean}
   */
  isGroundLevel() {
    return this.getMountTypePrefix() === 'GL';
  }

  /**
   * Convert to plain object (for serialization)
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      normalized_name: this.normalizedName,
      display_name: this.displayName,
      mount_type_code: this.mountTypeCode,
      // Legacy field mapping for backwards compatibility during migration
      location_code: this.mountTypeCode,
      station_id: this.stationId,
      station_acronym: this.stationAcronym,
      platform_type: this.platformType,
      ecosystem_code: this.ecosystemCode,
      latitude: this.latitude,
      longitude: this.longitude,
      platform_height_m: this.platformHeightM,
      status: this.status,
      mounting_structure: this.mountingStructure,
      deployment_date: this.deploymentDate,
      description: this.description,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
      instrument_count: this.instruments.length,
      // Include mount type metadata
      mount_type_info: this.getMountTypeInfo()
    };
  }

  /**
   * Create Platform from database row
   * Supports both new (mount_type_code) and legacy (location_code) column names
   * @param {Object} row - Database row
   * @returns {Platform}
   */
  static fromDatabase(row) {
    return new Platform({
      id: row.id,
      normalizedName: row.normalized_name,
      displayName: row.display_name,
      // Support both new and legacy column names
      mountTypeCode: row.mount_type_code || row.location_code,
      stationId: row.station_id,
      stationAcronym: row.station_acronym,
      platformType: row.platform_type,
      ecosystemCode: row.ecosystem_code,
      latitude: row.latitude,
      longitude: row.longitude,
      platformHeightM: row.platform_height_m,
      status: row.status,
      mountingStructure: row.mounting_structure,
      deploymentDate: row.deployment_date,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }
}
