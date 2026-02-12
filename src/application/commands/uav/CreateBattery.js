/**
 * Create Battery Command
 *
 * Application layer command for creating a new UAV battery.
 * Includes authorization check (UAV-003) to ensure only authorized users
 * can create batteries for their station.
 *
 * @module application/commands/uav/CreateBattery
 * @see docs/audits/2026-02-11-COMPREHENSIVE-SECURITY-AUDIT.md (UAV-003)
 */

import { Battery } from '../../../domain/uav/index.js';
import { UAVAuthorizationService } from '../../../domain/uav/authorization/UAVAuthorizationService.js';

/**
 * Create Battery Command
 */
export class CreateBattery {
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
   * Execute the create battery command
   *
   * @param {Object} input - Battery data
   * @param {import('../../../domain/authorization/User.js').User} [input.user] - Authenticated user (required for authorization)
   * @returns {Promise<Battery>} Created battery
   * @throws {Error} If serial number already exists, user unauthorized, or validation fails
   */
  async execute(input) {
    // UAV-003: Authorization check - user must have modify access to the station
    if (input.user) {
      // For create, we check modify permission on the target station
      const batteryContext = { station_id: input.station_id };
      if (!this.authorizationService.canModifyBattery(input.user, batteryContext)) {
        throw new Error(
          `Unauthorized: User '${input.user.username}' cannot create batteries ` +
          `for station ${input.station_id}. Only global admins and station admins ` +
          `can manage battery inventory.`
        );
      }
    }

    // Check if serial number already exists
    const existing = await this.batteryRepository.findBySerialNumber(input.serial_number);
    if (existing) {
      throw new Error(`Battery with serial number '${input.serial_number}' already exists`);
    }

    // Create battery entity (validates input)
    const battery = new Battery({
      serial_number: input.serial_number,
      display_name: input.display_name,
      manufacturer: input.manufacturer,
      model: input.model,
      capacity_mah: input.capacity_mah,
      cell_count: input.cell_count,
      chemistry: input.chemistry,
      station_id: input.station_id,
      platform_id: input.platform_id,
      purchase_date: input.purchase_date,
      first_use_date: input.first_use_date,
      status: input.status || 'available',
      health_percent: input.health_percent ?? 100,
      notes: input.notes
    });

    // Persist and return
    return await this.batteryRepository.save(battery);
  }
}
