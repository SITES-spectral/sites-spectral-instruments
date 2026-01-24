/**
 * UAV Mission Entity
 * Represents a planned or executed UAV data collection mission
 *
 * Architecture Credit: This subdomain-based architecture design is based on
 * architectural knowledge shared by Flights for Biodiversity Sweden AB
 * (https://github.com/flightsforbiodiversity)
 *
 * @module domain/uav/Mission
 * @version 15.0.0
 */

/**
 * Valid mission status values
 */
export const MISSION_STATUSES = [
  'draft',
  'planned',
  'approved',
  'in_progress',
  'completed',
  'aborted',
  'cancelled'
];

/**
 * Valid flight pattern values
 */
export const FLIGHT_PATTERNS = [
  'grid',
  'crosshatch',
  'perimeter',
  'point_of_interest',
  'custom'
];

/**
 * Mission Entity
 */
export class Mission {
  /**
   * @param {Object} props - Mission properties
   */
  constructor(props) {
    this.id = props.id;
    this.mission_code = props.mission_code;
    this.display_name = props.display_name;

    // Location
    this.station_id = props.station_id;
    this.platform_id = props.platform_id;
    this.station_acronym = props.station_acronym; // From join

    // Planning
    this.planned_date = props.planned_date;
    this.planned_start_time = props.planned_start_time;
    this.planned_end_time = props.planned_end_time;
    this.planned_area_hectares = props.planned_area_hectares;
    this.planned_altitude_m = props.planned_altitude_m;
    this.planned_flight_pattern = props.planned_flight_pattern;
    this.planned_overlap_side = props.planned_overlap_side;
    this.planned_overlap_front = props.planned_overlap_front;

    // Objectives
    this.objectives = Array.isArray(props.objectives)
      ? props.objectives
      : JSON.parse(props.objectives || '[]');
    this.target_products = Array.isArray(props.target_products)
      ? props.target_products
      : JSON.parse(props.target_products || '[]');

    // Execution
    this.status = props.status || 'draft';
    this.actual_start_time = props.actual_start_time;
    this.actual_end_time = props.actual_end_time;

    // Weather
    this.weather_conditions = typeof props.weather_conditions === 'string'
      ? JSON.parse(props.weather_conditions || '{}')
      : (props.weather_conditions || {});
    this.weather_source = props.weather_source;

    // Flight area
    this.flight_area_geojson = typeof props.flight_area_geojson === 'string'
      ? JSON.parse(props.flight_area_geojson || 'null')
      : props.flight_area_geojson;

    // Approvals
    this.approved_by_user_id = props.approved_by_user_id;
    this.approved_at = props.approved_at;
    this.approval_notes = props.approval_notes;

    // Results
    this.data_collected_gb = props.data_collected_gb;
    this.images_captured = props.images_captured;
    this.coverage_achieved_percent = props.coverage_achieved_percent;
    this.quality_score = props.quality_score;

    // Metadata
    this.notes = props.notes;
    this.created_by_user_id = props.created_by_user_id;
    this.created_at = props.created_at;
    this.updated_at = props.updated_at;

    this.#validate();
  }

  /**
   * Validate mission data
   * @private
   */
  #validate() {
    if (!this.station_id) {
      throw new Error('Station ID is required');
    }

    if (!this.planned_date) {
      throw new Error('Planned date is required');
    }

    if (!MISSION_STATUSES.includes(this.status)) {
      throw new Error(`Invalid status. Must be one of: ${MISSION_STATUSES.join(', ')}`);
    }

    if (this.planned_flight_pattern && !FLIGHT_PATTERNS.includes(this.planned_flight_pattern)) {
      throw new Error(`Invalid flight pattern. Must be one of: ${FLIGHT_PATTERNS.join(', ')}`);
    }

    if (this.quality_score !== null && this.quality_score !== undefined) {
      if (this.quality_score < 0 || this.quality_score > 100) {
        throw new Error('Quality score must be between 0 and 100');
      }
    }
  }

  /**
   * Generate mission code from station and date
   * @param {string} stationAcronym - Station acronym
   * @param {string} date - Mission date (YYYY-MM-DD)
   * @param {number} sequenceNumber - Sequence number for the day
   * @returns {string}
   */
  static generateMissionCode(stationAcronym, date, sequenceNumber = 1) {
    const seq = String(sequenceNumber).padStart(3, '0');
    return `${stationAcronym.toUpperCase()}_${date}_${seq}`;
  }

  /**
   * Check if mission is in a planning state
   * @returns {boolean}
   */
  isPlanning() {
    return ['draft', 'planned'].includes(this.status);
  }

  /**
   * Check if mission needs approval
   * @returns {boolean}
   */
  needsApproval() {
    return this.status === 'planned' && !this.approved_at;
  }

  /**
   * Check if mission is approved
   * @returns {boolean}
   */
  isApproved() {
    return !!this.approved_at;
  }

  /**
   * Check if mission is active (can be flown)
   * @returns {boolean}
   */
  isActive() {
    return ['approved', 'in_progress'].includes(this.status);
  }

  /**
   * Check if mission is completed
   * @returns {boolean}
   */
  isCompleted() {
    return this.status === 'completed';
  }

  /**
   * Check if mission was aborted or cancelled
   * @returns {boolean}
   */
  isCancelled() {
    return ['aborted', 'cancelled'].includes(this.status);
  }

  /**
   * Check if mission can be started
   * @returns {boolean}
   */
  canStart() {
    return this.status === 'approved';
  }

  /**
   * Start the mission
   * @returns {Mission}
   */
  start() {
    if (!this.canStart()) {
      throw new Error('Mission cannot be started - must be approved first');
    }
    this.status = 'in_progress';
    this.actual_start_time = new Date().toISOString();
    return this;
  }

  /**
   * Complete the mission
   * @param {Object} results - Mission results
   * @returns {Mission}
   */
  complete(results = {}) {
    if (this.status !== 'in_progress') {
      throw new Error('Mission must be in progress to complete');
    }
    this.status = 'completed';
    this.actual_end_time = new Date().toISOString();
    Object.assign(this, results);
    return this;
  }

  /**
   * Abort the mission
   * @param {string} reason - Reason for aborting
   * @returns {Mission}
   */
  abort(reason) {
    if (!['approved', 'in_progress'].includes(this.status)) {
      throw new Error('Can only abort approved or in-progress missions');
    }
    this.status = 'aborted';
    this.actual_end_time = new Date().toISOString();
    this.notes = (this.notes || '') + `\nAborted: ${reason}`;
    return this;
  }

  /**
   * Cancel the mission
   * @param {string} reason - Reason for cancellation
   * @returns {Mission}
   */
  cancel(reason) {
    if (!['draft', 'planned', 'approved'].includes(this.status)) {
      throw new Error('Can only cancel planned missions');
    }
    this.status = 'cancelled';
    this.notes = (this.notes || '') + `\nCancelled: ${reason}`;
    return this;
  }

  /**
   * Approve the mission
   * @param {number} userId - Approving user ID
   * @param {string} [notes] - Approval notes
   * @returns {Mission}
   */
  approve(userId, notes) {
    if (this.status !== 'planned') {
      throw new Error('Can only approve planned missions');
    }
    this.status = 'approved';
    this.approved_by_user_id = userId;
    this.approved_at = new Date().toISOString();
    this.approval_notes = notes;
    return this;
  }

  /**
   * Calculate actual duration in minutes
   * @returns {number|null}
   */
  getActualDurationMinutes() {
    if (!this.actual_start_time || !this.actual_end_time) {
      return null;
    }
    const start = new Date(this.actual_start_time);
    const end = new Date(this.actual_end_time);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  }

  /**
   * Convert to database record format
   * @returns {Object}
   */
  toRecord() {
    return {
      id: this.id,
      mission_code: this.mission_code,
      display_name: this.display_name,
      station_id: this.station_id,
      platform_id: this.platform_id,
      planned_date: this.planned_date,
      planned_start_time: this.planned_start_time,
      planned_end_time: this.planned_end_time,
      planned_area_hectares: this.planned_area_hectares,
      planned_altitude_m: this.planned_altitude_m,
      planned_flight_pattern: this.planned_flight_pattern,
      planned_overlap_side: this.planned_overlap_side,
      planned_overlap_front: this.planned_overlap_front,
      objectives: JSON.stringify(this.objectives),
      target_products: JSON.stringify(this.target_products),
      status: this.status,
      actual_start_time: this.actual_start_time,
      actual_end_time: this.actual_end_time,
      weather_conditions: JSON.stringify(this.weather_conditions),
      weather_source: this.weather_source,
      flight_area_geojson: JSON.stringify(this.flight_area_geojson),
      approved_by_user_id: this.approved_by_user_id,
      approved_at: this.approved_at,
      approval_notes: this.approval_notes,
      data_collected_gb: this.data_collected_gb,
      images_captured: this.images_captured,
      coverage_achieved_percent: this.coverage_achieved_percent,
      quality_score: this.quality_score,
      notes: this.notes,
      created_by_user_id: this.created_by_user_id
    };
  }

  /**
   * Convert to JSON (for API responses)
   * @returns {Object}
   */
  toJSON() {
    return {
      ...this.toRecord(),
      objectives: this.objectives,
      target_products: this.target_products,
      weather_conditions: this.weather_conditions,
      flight_area_geojson: this.flight_area_geojson,
      station_acronym: this.station_acronym,
      is_planning: this.isPlanning(),
      is_approved: this.isApproved(),
      is_active: this.isActive(),
      is_completed: this.isCompleted(),
      can_start: this.canStart(),
      actual_duration_minutes: this.getActualDurationMinutes(),
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  /**
   * Create Mission from database record
   * @param {Object} record - Database record
   * @returns {Mission}
   */
  static fromRecord(record) {
    return new Mission(record);
  }
}

export default Mission;
