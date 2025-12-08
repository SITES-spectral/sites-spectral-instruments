/**
 * Update Maintenance Record Command
 *
 * Updates an existing maintenance record.
 *
 * @module application/commands/UpdateMaintenanceRecord
 */

import { MaintenanceService } from '../../domain/index.js';

export class UpdateMaintenanceRecord {
  constructor({ maintenanceRepository }) {
    this.maintenanceRepository = maintenanceRepository;
    this.maintenanceService = new MaintenanceService();
  }

  async execute(data) {
    const record = await this.maintenanceRepository.findById(data.id);
    if (!record) {
      throw new Error(`Maintenance record with ID ${data.id} not found`);
    }

    const { record: updated, errors } = this.maintenanceService.updateRecord(record, data);

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    return await this.maintenanceRepository.save(updated);
  }
}
