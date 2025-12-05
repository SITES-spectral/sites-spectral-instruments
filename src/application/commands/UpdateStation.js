/**
 * Update Station Use Case
 *
 * Application layer command for updating an existing station.
 *
 * @module application/commands/UpdateStation
 */

/**
 * @typedef {Object} UpdateStationInput
 * @property {number} id - Station ID
 * @property {string} [displayName] - Human-readable station name
 * @property {string} [description] - Station description
 * @property {number} [latitude] - Station latitude
 * @property {number} [longitude] - Station longitude
 * @property {string} [websiteUrl] - Station website URL
 * @property {string} [contactEmail] - Contact email
 */

/**
 * Update Station Command
 */
export class UpdateStation {
  /**
   * @param {Object} dependencies
   * @param {import('../../domain/station/StationRepository.js').StationRepository} dependencies.stationRepository
   */
  constructor({ stationRepository }) {
    this.stationRepository = stationRepository;
  }

  /**
   * Execute the update station command
   *
   * @param {UpdateStationInput} input - Update data
   * @returns {Promise<import('../../domain/station/Station.js').Station>} Updated station
   * @throws {Error} If station not found
   */
  async execute(input) {
    const { id, ...updateData } = input;

    // Find existing station
    const station = await this.stationRepository.findById(id);
    if (!station) {
      throw new Error(`Station with ID '${id}' not found`);
    }

    // Update fields
    if (updateData.displayName !== undefined) {
      station.displayName = updateData.displayName;
    }
    if (updateData.description !== undefined) {
      station.description = updateData.description;
    }
    if (updateData.latitude !== undefined) {
      station.latitude = updateData.latitude;
    }
    if (updateData.longitude !== undefined) {
      station.longitude = updateData.longitude;
    }
    if (updateData.websiteUrl !== undefined) {
      station.websiteUrl = updateData.websiteUrl;
    }
    if (updateData.contactEmail !== undefined) {
      station.contactEmail = updateData.contactEmail;
    }

    // Update timestamp
    station.updatedAt = new Date().toISOString();

    // Persist and return
    return await this.stationRepository.save(station);
  }
}
