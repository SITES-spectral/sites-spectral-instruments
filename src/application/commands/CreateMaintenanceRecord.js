/**
 * Create Maintenance Record Command
 *
 * Creates a new maintenance record for a platform or instrument.
 *
 * @module application/commands/CreateMaintenanceRecord
 */

import { MaintenanceService } from '../../domain/index.js';

export class CreateMaintenanceRecord {
  constructor({ maintenanceRepository, platformRepository, instrumentRepository }) {
    this.maintenanceRepository = maintenanceRepository;
    this.platformRepository = platformRepository;
    this.instrumentRepository = instrumentRepository;
    this.maintenanceService = new MaintenanceService();
  }

  async execute(data) {
    // Validate entity exists
    if (data.entityType === 'platform') {
      const platform = await this.platformRepository.findById(data.entityId);
      if (!platform) {
        throw new Error(`Platform with ID ${data.entityId} not found`);
      }
      data.stationId = platform.stationId;
    } else if (data.entityType === 'instrument') {
      const instrument = await this.instrumentRepository.findById(data.entityId);
      if (!instrument) {
        throw new Error(`Instrument with ID ${data.entityId} not found`);
      }
      // Get station ID from platform
      const platform = await this.platformRepository.findById(instrument.platformId);
      data.stationId = platform?.stationId;
    } else {
      throw new Error(`Invalid entity type: ${data.entityType}`);
    }

    // Create record
    const { record, errors } = this.maintenanceService.createRecord(data);

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    return await this.maintenanceRepository.save(record);
  }
}
