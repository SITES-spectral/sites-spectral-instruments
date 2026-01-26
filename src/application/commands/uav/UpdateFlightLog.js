/**
 * Update Flight Log Command
 *
 * Application layer command for updating an existing flight log.
 *
 * @module application/commands/uav/UpdateFlightLog
 */

import { FlightLog } from '../../../domain/uav/index.js';

/**
 * Update Flight Log Command
 */
export class UpdateFlightLog {
  /**
   * @param {Object} dependencies
   */
  constructor({ flightLogRepository }) {
    this.flightLogRepository = flightLogRepository;
  }

  /**
   * Execute the update flight log command
   *
   * @param {Object} input - Updated flight log data
   * @param {number} input.id - Flight log ID
   * @returns {Promise<FlightLog>} Updated flight log
   * @throws {Error} If flight log not found
   */
  async execute(input) {
    const existing = await this.flightLogRepository.findById(input.id);
    if (!existing) {
      throw new Error(`Flight log ${input.id} not found`);
    }

    // Create updated flight log entity
    const flightLog = new FlightLog({
      id: input.id,
      mission_id: existing.mission_id,
      pilot_id: existing.pilot_id,
      platform_id: input.platform_id ?? existing.platform_id,
      flight_number: existing.flight_number,
      takeoff_time: input.takeoff_time ?? existing.takeoff_time,
      landing_time: input.landing_time ?? existing.landing_time,
      flight_duration_seconds: input.flight_duration_seconds ?? existing.flight_duration_seconds,
      takeoff_latitude: input.takeoff_latitude ?? existing.takeoff_latitude,
      takeoff_longitude: input.takeoff_longitude ?? existing.takeoff_longitude,
      takeoff_altitude_m: input.takeoff_altitude_m ?? existing.takeoff_altitude_m,
      max_altitude_agl_m: input.max_altitude_agl_m ?? existing.max_altitude_agl_m,
      max_distance_m: input.max_distance_m ?? existing.max_distance_m,
      total_distance_m: input.total_distance_m ?? existing.total_distance_m,
      average_speed_ms: input.average_speed_ms ?? existing.average_speed_ms,
      battery_id: input.battery_id ?? existing.battery_id,
      battery_start_percent: input.battery_start_percent ?? existing.battery_start_percent,
      battery_end_percent: input.battery_end_percent ?? existing.battery_end_percent,
      images_captured: input.images_captured ?? existing.images_captured,
      data_size_mb: input.data_size_mb ?? existing.data_size_mb,
      telemetry_file_path: input.telemetry_file_path ?? existing.telemetry_file_path,
      telemetry_file_hash: input.telemetry_file_hash ?? existing.telemetry_file_hash,
      had_incident: input.had_incident ?? existing.had_incident,
      incident_description: input.incident_description ?? existing.incident_description,
      incident_severity: input.incident_severity ?? existing.incident_severity,
      notes: input.notes ?? existing.notes,
      created_at: existing.created_at
    });

    return await this.flightLogRepository.save(flightLog);
  }
}
