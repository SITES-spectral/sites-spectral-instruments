/**
 * Get Maintenance Record Query
 *
 * Retrieves a single maintenance record by ID.
 *
 * @module application/queries/GetMaintenanceRecord
 */

export class GetMaintenanceRecord {
  constructor({ maintenanceRepository }) {
    this.maintenanceRepository = maintenanceRepository;
  }

  async execute(id) {
    const record = await this.maintenanceRepository.findById(id);
    if (!record) {
      throw new Error(`Maintenance record with ID ${id} not found`);
    }
    return record;
  }
}
