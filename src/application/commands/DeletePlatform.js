/**
 * Delete Platform Use Case
 *
 * Application layer command for deleting a platform.
 * Validates no dependent instruments exist before deletion.
 *
 * @module application/commands/DeletePlatform
 */

/**
 * Delete Platform Command
 */
export class DeletePlatform {
  /**
   * @param {Object} dependencies
   * @param {import('../../domain/platform/PlatformRepository.js').PlatformRepository} dependencies.platformRepository
   * @param {import('../../domain/instrument/InstrumentRepository.js').InstrumentRepository} dependencies.instrumentRepository
   */
  constructor({ platformRepository, instrumentRepository }) {
    this.platformRepository = platformRepository;
    this.instrumentRepository = instrumentRepository;
  }

  /**
   * Execute the delete platform command
   *
   * @param {number} id - Platform ID to delete
   * @returns {Promise<boolean>} True if deleted
   * @throws {Error} If platform not found or has dependent instruments
   */
  async execute(id) {
    // Find existing platform
    const platform = await this.platformRepository.findById(id);
    if (!platform) {
      throw new Error(`Platform with ID '${id}' not found`);
    }

    // Check for dependent instruments
    const instruments = await this.instrumentRepository.findByPlatformId(id);
    if (instruments.length > 0) {
      throw new Error(
        `Cannot delete platform '${platform.normalizedName}': ${instruments.length} instrument(s) still exist. ` +
        `Delete all instruments first.`
      );
    }

    // Delete platform
    return await this.platformRepository.delete(id);
  }
}
