/**
 * Update Instrument Use Case
 *
 * Application layer command for updating an existing instrument.
 *
 * @module application/commands/UpdateInstrument
 */

/**
 * @typedef {Object} UpdateInstrumentInput
 * @property {number} id - Instrument ID
 * @property {string} [displayName] - Human-readable name
 * @property {string} [description] - Instrument description
 * @property {string} [status] - Instrument status
 * @property {string} [measurementStatus] - Measurement status
 * @property {Object} [specifications] - Type-specific specifications (merged with existing)
 */

/**
 * Update Instrument Command
 */
export class UpdateInstrument {
  /**
   * @param {Object} dependencies
   * @param {import('../../domain/instrument/InstrumentRepository.js').InstrumentRepository} dependencies.instrumentRepository
   */
  constructor({ instrumentRepository, platformRepository, publicDataSync }) {
    this.instrumentRepository = instrumentRepository;
    this.platformRepository = platformRepository;
    this.publicDataSync = publicDataSync;
  }

  /**
   * Execute the update instrument command
   *
   * @param {UpdateInstrumentInput} input - Update data
   * @returns {Promise<import('../../domain/instrument/Instrument.js').Instrument>} Updated instrument
   * @throws {Error} If instrument not found
   */
  async execute(input) {
    const { id, ...updateData } = input;

    // Find existing instrument
    const instrument = await this.instrumentRepository.findById(id);
    if (!instrument) {
      throw new Error(`Instrument with ID '${id}' not found`);
    }

    // Update allowed fields
    if (updateData.displayName !== undefined) {
      instrument.displayName = updateData.displayName;
    }
    if (updateData.description !== undefined) {
      instrument.description = updateData.description;
    }
    if (updateData.status !== undefined) {
      instrument.updateStatus(updateData.status);
    }
    if (updateData.measurementStatus !== undefined) {
      instrument.updateMeasurementStatus(updateData.measurementStatus);
    }
    if (updateData.specifications !== undefined) {
      // Merge specifications
      instrument.specifications = {
        ...instrument.specifications,
        ...updateData.specifications
      };
    }

    // Update timestamp
    instrument.updatedAt = new Date().toISOString();

    // Persist
    const saved = await this.instrumentRepository.save(instrument);

    // Sync counts to public database
    if (this.publicDataSync && saved.platformId) {
      const platform = await this.platformRepository.findById(saved.platformId);
      if (platform?.stationId) {
        await this.publicDataSync.syncStationCounts(platform.stationId);
      }
    }

    return saved;
  }
}
