/**
 * Delete Station Use Case
 *
 * Application layer command for deleting a station.
 * Validates no dependent platforms exist before deletion.
 *
 * @module application/commands/DeleteStation
 */

/**
 * Delete Station Command
 */
export class DeleteStation {
  /**
   * @param {Object} dependencies
   * @param {import('../../domain/station/StationRepository.js').StationRepository} dependencies.stationRepository
   * @param {import('../../domain/platform/PlatformRepository.js').PlatformRepository} dependencies.platformRepository
   */
  constructor({ stationRepository, platformRepository }) {
    this.stationRepository = stationRepository;
    this.platformRepository = platformRepository;
  }

  /**
   * Execute the delete station command
   *
   * @param {number} id - Station ID to delete
   * @returns {Promise<boolean>} True if deleted
   * @throws {Error} If station not found or has dependent platforms
   */
  async execute(id) {
    // Find existing station
    const station = await this.stationRepository.findById(id);
    if (!station) {
      throw new Error(`Station with ID '${id}' not found`);
    }

    // Check for dependent platforms
    const platforms = await this.platformRepository.findByStationId(id);
    if (platforms.length > 0) {
      throw new Error(
        `Cannot delete station '${station.acronym}': ${platforms.length} platform(s) still exist. ` +
        `Delete all platforms first.`
      );
    }

    // Delete station
    return await this.stationRepository.delete(id);
  }
}
