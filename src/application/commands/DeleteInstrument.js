/**
 * Delete Instrument Use Case
 *
 * Application layer command for deleting an instrument.
 * Validates no dependent ROIs exist before deletion.
 *
 * @module application/commands/DeleteInstrument
 */

/**
 * Delete Instrument Command
 */
export class DeleteInstrument {
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
   * Execute the delete instrument command
   *
   * @param {number} id - Instrument ID to delete
   * @param {Object} [options] - Delete options
   * @param {boolean} [options.cascade=false] - If true, delete associated ROIs
   * @returns {Promise<boolean>} True if deleted
   * @throws {Error} If instrument not found or has dependent ROIs (when cascade=false)
   */
  async execute(id, options = { cascade: false }) {
    // Find existing instrument
    const instrument = await this.instrumentRepository.findById(id);
    if (!instrument) {
      throw new Error(`Instrument with ID '${id}' not found`);
    }

    // Check for dependent ROIs if not cascading
    if (!options.cascade) {
      const hasROIs = await this.instrumentRepository.hasROIs(id);
      if (hasROIs) {
        throw new Error(
          `Cannot delete instrument '${instrument.normalizedName}': ROIs still exist. ` +
          `Delete ROIs first or use cascade option.`
        );
      }
    }

    // Look up station before deletion
    const platform = instrument.platformId
      ? await this.platformRepository.findById(instrument.platformId)
      : null;

    // Delete instrument (and ROIs if cascade=true)
    const result = await this.instrumentRepository.delete(id, options.cascade);

    // Sync counts to public database
    if (this.publicDataSync && platform?.stationId) {
      await this.publicDataSync.syncStationCounts(platform.stationId);
    }

    return result;
  }
}
