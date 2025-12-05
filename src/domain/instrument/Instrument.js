/**
 * Instrument Entity
 * Core domain entity representing a measurement instrument.
 *
 * This entity is framework-agnostic and contains only business logic.
 * Instrument type-specific validation is delegated to InstrumentTypeRegistry.
 *
 * @module domain/instrument/Instrument
 */

/**
 * @typedef {Object} InstrumentProps
 * @property {number} [id] - Database ID (optional for new instruments)
 * @property {string} normalizedName - System identifier (e.g., 'SVB_FOR_PL01_PHE01')
 * @property {string} displayName - Human-readable name
 * @property {number} platformId - Parent platform ID
 * @property {string} instrumentType - Instrument type (e.g., 'Phenocam', 'Multispectral Sensor')
 * @property {string} [status] - Instrument status
 * @property {string} [measurementStatus] - Measurement status
 * @property {Object} [specifications] - Type-specific specifications (JSON)
 * @property {string} [description] - Instrument description
 * @property {string} [installationNotes] - Installation notes
 * @property {string} [maintenanceNotes] - Maintenance notes
 * @property {string} [deploymentDate] - ISO date string
 * @property {string} [calibrationDate] - Last calibration date
 * @property {string} [createdAt] - ISO timestamp
 * @property {string} [updatedAt] - ISO timestamp
 */

/**
 * Valid instrument statuses
 * @constant {string[]}
 */
export const INSTRUMENT_STATUSES = ['Active', 'Inactive', 'Maintenance', 'Decommissioned'];

/**
 * Valid measurement statuses
 * @constant {string[]}
 */
export const MEASUREMENT_STATUSES = ['Operational', 'Degraded', 'Failed', 'Unknown'];

export class Instrument {
  /**
   * Create an Instrument entity
   * @param {InstrumentProps} props - Instrument properties
   */
  constructor(props) {
    this.id = props.id || null;
    this.normalizedName = props.normalizedName;
    this.displayName = props.displayName;
    this.platformId = props.platformId;
    this.instrumentType = props.instrumentType;
    this.status = props.status || 'Active';
    this.measurementStatus = props.measurementStatus || 'Operational';
    this.specifications = props.specifications || {};
    this.description = props.description || null;
    this.installationNotes = props.installationNotes || null;
    this.maintenanceNotes = props.maintenanceNotes || null;
    this.deploymentDate = props.deploymentDate || null;
    this.calibrationDate = props.calibrationDate || null;
    this.createdAt = props.createdAt || null;
    this.updatedAt = props.updatedAt || null;

    // Associated ROIs (loaded separately)
    this.rois = [];
  }

  /**
   * Validate instrument data
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

    if (!this.platformId) {
      errors.push('Platform ID is required');
    }

    if (!this.instrumentType || typeof this.instrumentType !== 'string') {
      errors.push('Instrument type is required');
    }

    if (!INSTRUMENT_STATUSES.includes(this.status)) {
      errors.push(`Invalid status. Must be one of: ${INSTRUMENT_STATUSES.join(', ')}`);
    }

    if (!MEASUREMENT_STATUSES.includes(this.measurementStatus)) {
      errors.push(`Invalid measurement status. Must be one of: ${MEASUREMENT_STATUSES.join(', ')}`);
    }

    if (errors.length > 0) {
      throw new Error(`Instrument validation failed: ${errors.join(', ')}`);
    }
  }

  /**
   * Check if instrument is active
   * @returns {boolean}
   */
  isActive() {
    return this.status === 'Active';
  }

  /**
   * Check if instrument is operational
   * @returns {boolean}
   */
  isOperational() {
    return this.measurementStatus === 'Operational';
  }

  /**
   * Check if instrument needs calibration (older than 1 year)
   * @returns {boolean}
   */
  needsCalibration() {
    if (!this.calibrationDate) return true;

    const lastCalibration = new Date(this.calibrationDate);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    return lastCalibration < oneYearAgo;
  }

  /**
   * Get a specification value
   * @param {string} key - Specification key
   * @param {*} defaultValue - Default value if not found
   * @returns {*}
   */
  getSpecification(key, defaultValue = null) {
    return this.specifications[key] ?? defaultValue;
  }

  /**
   * Set a specification value
   * @param {string} key - Specification key
   * @param {*} value - Specification value
   */
  setSpecification(key, value) {
    this.specifications[key] = value;
  }

  /**
   * Add ROI to instrument
   * @param {Object} roi - ROI entity
   */
  addROI(roi) {
    this.rois.push(roi);
  }

  /**
   * Get ROI count
   * @returns {number}
   */
  getROICount() {
    return this.rois.length;
  }

  /**
   * Extract instrument type code from normalized name
   * @returns {string|null} Type code (PHE, MS, PAR, etc.)
   */
  getTypeCode() {
    // Pattern: STATION_ECO_PLXX_TYPEXX
    const match = this.normalizedName.match(/_([A-Z]+)\d+$/);
    return match ? match[1] : null;
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
      platform_id: this.platformId,
      instrument_type: this.instrumentType,
      status: this.status,
      measurement_status: this.measurementStatus,
      specifications: this.specifications,
      description: this.description,
      installation_notes: this.installationNotes,
      maintenance_notes: this.maintenanceNotes,
      deployment_date: this.deploymentDate,
      calibration_date: this.calibrationDate,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
      roi_count: this.rois.length
    };
  }

  /**
   * Create Instrument from database row
   * @param {Object} row - Database row
   * @returns {Instrument}
   */
  static fromDatabase(row) {
    // Parse specifications if stored as JSON string
    let specifications = row.specifications;
    if (typeof specifications === 'string') {
      try {
        specifications = JSON.parse(specifications);
      } catch {
        specifications = {};
      }
    }

    return new Instrument({
      id: row.id,
      normalizedName: row.normalized_name,
      displayName: row.display_name,
      platformId: row.platform_id,
      instrumentType: row.instrument_type,
      status: row.status,
      measurementStatus: row.measurement_status,
      specifications: specifications || {},
      description: row.description,
      installationNotes: row.installation_notes,
      maintenanceNotes: row.maintenance_notes,
      deploymentDate: row.deployment_date,
      calibrationDate: row.calibration_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }
}
