/**
 * Create Battery Command
 *
 * Application layer command for creating a new UAV battery.
 *
 * @module application/commands/uav/CreateBattery
 */

import { Battery } from '../../../domain/uav/index.js';

/**
 * Create Battery Command
 */
export class CreateBattery {
  /**
   * @param {Object} dependencies
   */
  constructor({ batteryRepository }) {
    this.batteryRepository = batteryRepository;
  }

  /**
   * Execute the create battery command
   *
   * @param {Object} input - Battery data
   * @returns {Promise<Battery>} Created battery
   * @throws {Error} If serial number already exists or validation fails
   */
  async execute(input) {
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
