/**
 * Update Platform Use Case
 *
 * Application layer command for updating an existing platform.
 * Note: Platform type and normalized name cannot be changed.
 *
 * @module application/commands/UpdatePlatform
 */

/**
 * @typedef {Object} UpdatePlatformInput
 * @property {number} id - Platform ID
 * @property {string} [displayName] - Human-readable name
 * @property {string} [description] - Platform description
 * @property {number} [latitude] - Platform latitude
 * @property {number} [longitude] - Platform longitude
 * @property {string} [status] - Platform status
 */

/**
 * Update Platform Command
 */
export class UpdatePlatform {
  /**
   * @param {Object} dependencies
   * @param {import('../../domain/platform/PlatformRepository.js').PlatformRepository} dependencies.platformRepository
   */
  constructor({ platformRepository }) {
    this.platformRepository = platformRepository;
  }

  /**
   * Execute the update platform command
   *
   * @param {UpdatePlatformInput} input - Update data
   * @returns {Promise<import('../../domain/platform/Platform.js').Platform>} Updated platform
   * @throws {Error} If platform not found
   */
  async execute(input) {
    const { id, ...updateData } = input;

    // Find existing platform
    const platform = await this.platformRepository.findById(id);
    if (!platform) {
      throw new Error(`Platform with ID '${id}' not found`);
    }

    // Update allowed fields
    if (updateData.displayName !== undefined) {
      platform.displayName = updateData.displayName;
    }
    if (updateData.description !== undefined) {
      platform.description = updateData.description;
    }
    if (updateData.latitude !== undefined) {
      platform.latitude = updateData.latitude;
    }
    if (updateData.longitude !== undefined) {
      platform.longitude = updateData.longitude;
    }
    if (updateData.status !== undefined) {
      platform.status = updateData.status;
    }

    // Update timestamp
    platform.updatedAt = new Date().toISOString();

    // Persist and return
    return await this.platformRepository.save(platform);
  }
}
