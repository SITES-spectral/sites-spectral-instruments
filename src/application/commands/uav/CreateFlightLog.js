/**
 * Create Flight Log Command
 *
 * Application layer command for creating a new flight log entry.
 *
 * @module application/commands/uav/CreateFlightLog
 */

import { FlightLog } from '../../../domain/uav/index.js';

/**
 * Create Flight Log Command
 */
export class CreateFlightLog {
  /**
   * @param {Object} dependencies
   */
  constructor({ flightLogRepository, missionRepository, pilotRepository }) {
    this.flightLogRepository = flightLogRepository;
    this.missionRepository = missionRepository;
    this.pilotRepository = pilotRepository;
  }

  /**
   * Execute the create flight log command
   *
   * @param {Object} input - Flight log data
   * @returns {Promise<FlightLog>} Created flight log
   * @throws {Error} If validation fails
   */
  async execute(input) {
    // Verify mission exists and is in progress
    const mission = await this.missionRepository.findById(input.mission_id);
    if (!mission) {
      throw new Error(`Mission ${input.mission_id} not found`);
    }

    if (!mission.isActive()) {
      throw new Error('Can only log flights for active (approved or in_progress) missions');
    }

    // Verify pilot exists
    const pilot = await this.pilotRepository.findById(input.pilot_id);
    if (!pilot) {
      throw new Error(`Pilot ${input.pilot_id} not found`);
    }

    // Get next flight number
    const flightNumber = input.flight_number ??
      await this.flightLogRepository.getNextFlightNumber(input.mission_id);

    // Create flight log entity (validates input)
    const flightLog = FlightLog.create({
      mission_id: input.mission_id,
      pilot_id: input.pilot_id,
      platform_id: input.platform_id || mission.platform_id,
      flight_number: flightNumber,
      takeoff_time: input.takeoff_time,
      landing_time: input.landing_time,
      takeoff_latitude: input.takeoff_latitude,
      takeoff_longitude: input.takeoff_longitude,
      takeoff_altitude_m: input.takeoff_altitude_m,
      max_altitude_agl_m: input.max_altitude_agl_m,
      max_distance_m: input.max_distance_m,
      total_distance_m: input.total_distance_m,
      average_speed_ms: input.average_speed_ms,
      battery_id: input.battery_id,
      battery_start_percent: input.battery_start_percent,
      battery_end_percent: input.battery_end_percent,
      images_captured: input.images_captured || 0,
      data_size_mb: input.data_size_mb || 0,
      telemetry_file_path: input.telemetry_file_path,
      telemetry_file_hash: input.telemetry_file_hash,
      had_incident: input.had_incident || false,
      incident_description: input.incident_description,
      incident_severity: input.incident_severity,
      notes: input.notes
    });

    // Persist and return
    return await this.flightLogRepository.save(flightLog);
  }
}
