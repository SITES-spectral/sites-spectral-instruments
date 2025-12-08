/**
 * Delete Maintenance Record Command
 *
 * Deletes a maintenance record.
 *
 * @module application/commands/DeleteMaintenanceRecord
 */

export class DeleteMaintenanceRecord {
  constructor({ maintenanceRepository }) {
    this.maintenanceRepository = maintenanceRepository;
  }

  async execute(id) {
    const record = await this.maintenanceRepository.findById(id);
    if (!record) {
      throw new Error(`Maintenance record with ID ${id} not found`);
    }

    return await this.maintenanceRepository.deleteById(id);
  }
}
