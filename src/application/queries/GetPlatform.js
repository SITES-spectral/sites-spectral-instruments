/**
 * Get Platform Query
 *
 * Application layer query for retrieving a single platform.
 *
 * @module application/queries/GetPlatform
 */

/**
 * Get Platform Query
 */
export class GetPlatform {
  /**
   * @param {Object} dependencies
   * @param {import('../../domain/platform/PlatformRepository.js').PlatformRepository} dependencies.platformRepository
   */
  constructor({ platformRepository }) {
    this.platformRepository = platformRepository;
  }

  /**
   * Execute the get platform query by ID
   *
   * @param {number} id - Platform ID
   * @returns {Promise<import('../../domain/platform/Platform.js').Platform|null>}
   */
  async byId(id) {
    return await this.platformRepository.findById(id);
  }

  /**
   * Execute the get platform query by normalized name
   *
   * @param {string} normalizedName - Platform normalized name
   * @returns {Promise<import('../../domain/platform/Platform.js').Platform|null>}
   */
  async byNormalizedName(normalizedName) {
    return await this.platformRepository.findByNormalizedName(normalizedName);
  }
}
