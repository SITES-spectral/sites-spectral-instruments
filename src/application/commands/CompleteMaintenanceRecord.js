/**
 * Complete Maintenance Record Command
 *
 * Marks a maintenance record as completed.
 *
 * @module application/commands/CompleteMaintenanceRecord
 */

import { MaintenanceService } from '../../domain/index.js';

export class CompleteMaintenanceRecord {
  constructor({ maintenanceRepository }) {
    this.maintenanceRepository = maintenanceRepository;
    this.maintenanceService = new MaintenanceService();
  }

  async execute({ id, workPerformed, partsReplaced, cost, duration, notes, nextScheduledDate }) {
    const record = await this.maintenanceRepository.findById(id);
    if (!record) {
      throw new Error(`Maintenance record with ID ${id} not found`);
    }

    const { record: completed, errors } = this.maintenanceService.completeMaintenance(record, {
      workPerformed,
      partsReplaced,
      cost,
      duration,
      notes,
      nextScheduledDate
    });

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    return await this.maintenanceRepository.save(completed);
  }
}
