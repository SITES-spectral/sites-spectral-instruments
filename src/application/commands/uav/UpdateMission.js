/**
 * Update Mission Command
 *
 * Application layer command for updating an existing UAV mission.
 *
 * @module application/commands/uav/UpdateMission
 */

import { Mission } from '../../../domain/uav/index.js';

/**
 * Update Mission Command
 */
export class UpdateMission {
  /**
   * @param {Object} dependencies
   */
  constructor({ missionRepository }) {
    this.missionRepository = missionRepository;
  }

  /**
   * Execute the update mission command
   *
   * @param {Object} input - Updated mission data
   * @param {number} input.id - Mission ID
   * @returns {Promise<Mission>} Updated mission
   * @throws {Error} If mission not found or cannot be updated
   */
  async execute(input) {
    const existing = await this.missionRepository.findById(input.id);
    if (!existing) {
      throw new Error(`Mission ${input.id} not found`);
    }

    // Only allow updates in planning phase
    if (!existing.isPlanning()) {
      throw new Error('Can only update missions in draft or planned status');
    }

    // Create updated mission entity
    const mission = new Mission({
      id: input.id,
      mission_code: existing.mission_code,
      display_name: input.display_name ?? existing.display_name,
      station_id: existing.station_id,
      platform_id: input.platform_id ?? existing.platform_id,
      planned_date: input.planned_date ?? existing.planned_date,
      planned_start_time: input.planned_start_time ?? existing.planned_start_time,
      planned_end_time: input.planned_end_time ?? existing.planned_end_time,
      planned_area_hectares: input.planned_area_hectares ?? existing.planned_area_hectares,
      planned_altitude_m: input.planned_altitude_m ?? existing.planned_altitude_m,
      planned_flight_pattern: input.planned_flight_pattern ?? existing.planned_flight_pattern,
      planned_overlap_side: input.planned_overlap_side ?? existing.planned_overlap_side,
      planned_overlap_front: input.planned_overlap_front ?? existing.planned_overlap_front,
      objectives: input.objectives ?? existing.objectives,
      target_products: input.target_products ?? existing.target_products,
      status: input.status ?? existing.status,
      weather_conditions: input.weather_conditions ?? existing.weather_conditions,
      weather_source: input.weather_source ?? existing.weather_source,
      flight_area_geojson: input.flight_area_geojson ?? existing.flight_area_geojson,
      notes: input.notes ?? existing.notes,
      created_by_user_id: existing.created_by_user_id,
      created_at: existing.created_at
    });

    return await this.missionRepository.save(mission);
  }
}
