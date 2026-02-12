/**
 * Update Battery Command
 *
 * Application layer command for updating an existing UAV battery.
 * Includes authorization check (UAV-003) to ensure only authorized users
 * can modify batteries at their station.
 *
 * @module application/commands/uav/UpdateBattery
 * @see docs/audits/2026-02-11-COMPREHENSIVE-SECURITY-AUDIT.md (UAV-003)
 */

import { Battery } from '../../../domain/uav/index.js';
import { UAVAuthorizationService } from '../../../domain/uav/authorization/UAVAuthorizationService.js';

/**
 * Update Battery Command
 */
export class UpdateBattery {
  /**
   * @param {Object} dependencies
   * @param {Object} dependencies.batteryRepository - Battery repository
   * @param {UAVAuthorizationService} [dependencies.authorizationService] - Authorization service
   */
  constructor({ batteryRepository, authorizationService = null }) {
    this.batteryRepository = batteryRepository;
    this.authorizationService = authorizationService || new UAVAuthorizationService();
  }

  /**
   * Execute the update battery command
   *
   * @param {Object} input - Updated battery data
   * @param {number} input.id - Battery ID
   * @param {import('../../../domain/authorization/User.js').User} [input.user] - Authenticated user (required for authorization)
   * @returns {Promise<Battery>} Updated battery
   * @throws {Error} If battery not found or user unauthorized
   */
  async execute(input) {
    const existing = await this.batteryRepository.findById(input.id);
    if (!existing) {
      throw new Error(`Battery ${input.id} not found`);
    }

    // UAV-003: Authorization check - user must have modify access to the battery's station
    if (input.user) {
      if (!this.authorizationService.canModifyBattery(input.user, existing)) {
        throw new Error(
          `Unauthorized: User '${input.user.username}' cannot modify battery ${input.id}. ` +
          `Only global admins and station admins for station ${existing.station_id} ` +
          `can modify battery records.`
        );
      }
    }

    // Create updated battery entity
    const battery = new Battery({
      id: input.id,
      serial_number: input.serial_number ?? existing.serial_number,
      display_name: input.display_name ?? existing.display_name,
      manufacturer: input.manufacturer ?? existing.manufacturer,
      model: input.model ?? existing.model,
      capacity_mah: input.capacity_mah ?? existing.capacity_mah,
      cell_count: input.cell_count ?? existing.cell_count,
      chemistry: input.chemistry ?? existing.chemistry,
      station_id: input.station_id ?? existing.station_id,
      platform_id: input.platform_id ?? existing.platform_id,
      purchase_date: input.purchase_date ?? existing.purchase_date,
      first_use_date: input.first_use_date ?? existing.first_use_date,
      last_use_date: input.last_use_date ?? existing.last_use_date,
      cycle_count: input.cycle_count ?? existing.cycle_count,
      health_percent: input.health_percent ?? existing.health_percent,
      internal_resistance_mohm: input.internal_resistance_mohm ?? existing.internal_resistance_mohm,
      last_health_check_date: input.last_health_check_date ?? existing.last_health_check_date,
      status: input.status ?? existing.status,
      storage_voltage_v: input.storage_voltage_v ?? existing.storage_voltage_v,
      notes: input.notes ?? existing.notes,
      created_at: existing.created_at
    });

    return await this.batteryRepository.save(battery);
  }
}
