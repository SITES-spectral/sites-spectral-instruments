/**
 * Create Mission Command
 *
 * Application layer command for creating a new UAV mission.
 *
 * @module application/commands/uav/CreateMission
 */

import { Mission } from '../../../domain/uav/index.js';

/**
 * Create Mission Command
 */
export class CreateMission {
  /**
   * @param {Object} dependencies
   */
  constructor({ missionRepository, stationRepository }) {
    this.missionRepository = missionRepository;
    this.stationRepository = stationRepository;
  }

  /**
   * Execute the create mission command
   *
   * @param {Object} input - Mission data
   * @returns {Promise<Mission>} Created mission
   * @throws {Error} If station not found or validation fails
   */
  async execute(input) {
    // Verify station exists
    const station = await this.stationRepository.findById(input.station_id);
    if (!station) {
      throw new Error(`Station ${input.station_id} not found`);
    }

    // Generate mission code if not provided
    let missionCode = input.mission_code;
    if (!missionCode) {
      const sequenceNumber = await this.missionRepository.getNextSequenceNumber(
        station.acronym,
        input.planned_date
      );
      missionCode = Mission.generateMissionCode(station.acronym, input.planned_date, sequenceNumber);
    }

    // Create mission entity (validates input)
    const mission = new Mission({
      mission_code: missionCode,
      display_name: input.display_name,
      station_id: input.station_id,
      platform_id: input.platform_id,
      planned_date: input.planned_date,
      planned_start_time: input.planned_start_time,
      planned_end_time: input.planned_end_time,
      planned_area_hectares: input.planned_area_hectares,
      planned_altitude_m: input.planned_altitude_m,
      planned_flight_pattern: input.planned_flight_pattern,
      planned_overlap_side: input.planned_overlap_side,
      planned_overlap_front: input.planned_overlap_front,
      objectives: input.objectives || [],
      target_products: input.target_products || [],
      status: input.status || 'draft',
      weather_conditions: input.weather_conditions,
      weather_source: input.weather_source,
      flight_area_geojson: input.flight_area_geojson,
      notes: input.notes,
      created_by_user_id: input.created_by_user_id
    });

    // Persist and return
    return await this.missionRepository.save(mission);
  }
}
