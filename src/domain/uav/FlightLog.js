/**
 * UAV Flight Log Entity
 * Represents an individual flight within a mission (each battery swap = new flight)
 *
 * Architecture Credit: This subdomain-based architecture design is based on
 * architectural knowledge shared by Flights for Biodiversity Sweden AB
 * (https://github.com/flightsforbiodiversity)
 *
 * @module domain/uav/FlightLog
 * @version 15.0.0
 */

/**
 * Valid incident severity levels
 */
export const INCIDENT_SEVERITIES = [null, 'minor', 'moderate', 'major', 'critical'];

/**
 * Flight Log Entity
 */
export class FlightLog {
  /**
   * @param {Object} props - Flight log properties
   */
  constructor(props) {
    this.id = props.id;

    // Association
    this.mission_id = props.mission_id;
    this.pilot_id = props.pilot_id;
    this.platform_id = props.platform_id;

    // Identification
    this.flight_number = props.flight_number;

    // Timing
    this.takeoff_time = props.takeoff_time;
    this.landing_time = props.landing_time;
    this.flight_duration_seconds = props.flight_duration_seconds;

    // Position
    this.takeoff_latitude = props.takeoff_latitude;
    this.takeoff_longitude = props.takeoff_longitude;
    this.takeoff_altitude_m = props.takeoff_altitude_m;

    // Flight parameters
    this.max_altitude_agl_m = props.max_altitude_agl_m;
    this.max_distance_m = props.max_distance_m;
    this.total_distance_m = props.total_distance_m;
    this.average_speed_ms = props.average_speed_ms;

    // Battery
    this.battery_id = props.battery_id;
    this.battery_start_percent = props.battery_start_percent;
    this.battery_end_percent = props.battery_end_percent;

    // Data collected
    this.images_captured = props.images_captured || 0;
    this.data_size_mb = props.data_size_mb || 0;

    // Telemetry
    this.telemetry_file_path = props.telemetry_file_path;
    this.telemetry_file_hash = props.telemetry_file_hash;

    // Incidents
    this.had_incident = !!props.had_incident;
    this.incident_description = props.incident_description;
    this.incident_severity = props.incident_severity;

    // Notes
    this.notes = props.notes;

    // Timestamps
    this.created_at = props.created_at;
    this.updated_at = props.updated_at;

    // From joins
    this.pilot_name = props.pilot_name;
    this.platform_name = props.platform_name;
    this.mission_code = props.mission_code;

    this.#validate();
  }

  /**
   * Validate flight log data
   * @private
   */
  #validate() {
    if (!this.mission_id) {
      throw new Error('Mission ID is required');
    }

    if (!this.pilot_id) {
      throw new Error('Pilot ID is required');
    }

    if (!this.platform_id) {
      throw new Error('Platform ID is required');
    }

    if (!this.takeoff_time) {
      throw new Error('Takeoff time is required');
    }

    if (!this.landing_time) {
      throw new Error('Landing time is required');
    }

    // Validate landing after takeoff
    if (new Date(this.landing_time) <= new Date(this.takeoff_time)) {
      throw new Error('Landing time must be after takeoff time');
    }

    if (this.incident_severity && !INCIDENT_SEVERITIES.includes(this.incident_severity)) {
      throw new Error(`Invalid incident severity. Must be one of: ${INCIDENT_SEVERITIES.filter(s => s).join(', ')}`);
    }

    if (this.had_incident && !this.incident_description) {
      throw new Error('Incident description is required when incident occurred');
    }
  }

  /**
   * Calculate flight duration in seconds
   * @returns {number}
   */
  calculateDuration() {
    const takeoff = new Date(this.takeoff_time);
    const landing = new Date(this.landing_time);
    return Math.round((landing.getTime() - takeoff.getTime()) / 1000);
  }

  /**
   * Get flight duration formatted as HH:MM:SS
   * @returns {string}
   */
  getFormattedDuration() {
    const seconds = this.flight_duration_seconds || this.calculateDuration();
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  /**
   * Get battery usage percentage
   * @returns {number|null}
   */
  getBatteryUsage() {
    if (this.battery_start_percent === null || this.battery_end_percent === null) {
      return null;
    }
    return this.battery_start_percent - this.battery_end_percent;
  }

  /**
   * Calculate data rate (MB per minute)
   * @returns {number|null}
   */
  getDataRate() {
    const duration = this.flight_duration_seconds || this.calculateDuration();
    if (!duration || !this.data_size_mb) {
      return null;
    }
    return this.data_size_mb / (duration / 60);
  }

  /**
   * Check if flight had any incidents
   * @returns {boolean}
   */
  hasIncident() {
    return this.had_incident;
  }

  /**
   * Check if incident is severe (major or critical)
   * @returns {boolean}
   */
  hasSevereIncident() {
    return ['major', 'critical'].includes(this.incident_severity);
  }

  /**
   * Mark an incident
   * @param {string} description - Incident description
   * @param {string} severity - Incident severity
   * @returns {FlightLog}
   */
  reportIncident(description, severity) {
    if (!INCIDENT_SEVERITIES.includes(severity)) {
      throw new Error(`Invalid severity. Must be one of: ${INCIDENT_SEVERITIES.filter(s => s).join(', ')}`);
    }
    this.had_incident = true;
    this.incident_description = description;
    this.incident_severity = severity;
    return this;
  }

  /**
   * Convert to database record format
   * @returns {Object}
   */
  toRecord() {
    return {
      id: this.id,
      mission_id: this.mission_id,
      pilot_id: this.pilot_id,
      platform_id: this.platform_id,
      flight_number: this.flight_number,
      takeoff_time: this.takeoff_time,
      landing_time: this.landing_time,
      flight_duration_seconds: this.flight_duration_seconds || this.calculateDuration(),
      takeoff_latitude: this.takeoff_latitude,
      takeoff_longitude: this.takeoff_longitude,
      takeoff_altitude_m: this.takeoff_altitude_m,
      max_altitude_agl_m: this.max_altitude_agl_m,
      max_distance_m: this.max_distance_m,
      total_distance_m: this.total_distance_m,
      average_speed_ms: this.average_speed_ms,
      battery_id: this.battery_id,
      battery_start_percent: this.battery_start_percent,
      battery_end_percent: this.battery_end_percent,
      images_captured: this.images_captured,
      data_size_mb: this.data_size_mb,
      telemetry_file_path: this.telemetry_file_path,
      telemetry_file_hash: this.telemetry_file_hash,
      had_incident: this.had_incident ? 1 : 0,
      incident_description: this.incident_description,
      incident_severity: this.incident_severity,
      notes: this.notes
    };
  }

  /**
   * Convert to JSON (for API responses)
   * @returns {Object}
   */
  toJSON() {
    return {
      ...this.toRecord(),
      had_incident: this.had_incident,
      formatted_duration: this.getFormattedDuration(),
      battery_usage: this.getBatteryUsage(),
      data_rate_mb_per_min: this.getDataRate(),
      has_severe_incident: this.hasSevereIncident(),
      pilot_name: this.pilot_name,
      platform_name: this.platform_name,
      mission_code: this.mission_code,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  /**
   * Create FlightLog from database record
   * @param {Object} record - Database record
   * @returns {FlightLog}
   */
  static fromRecord(record) {
    return new FlightLog({
      ...record,
      had_incident: !!record.had_incident
    });
  }

  /**
   * Create a new flight log for a mission
   * @param {Object} params - Flight parameters
   * @returns {FlightLog}
   */
  static create(params) {
    return new FlightLog({
      ...params,
      flight_duration_seconds: null // Will be calculated
    });
  }
}

export default FlightLog;
