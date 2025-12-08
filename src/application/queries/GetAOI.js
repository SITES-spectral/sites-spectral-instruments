/**
 * Get AOI Query
 *
 * Application layer query for retrieving a single AOI.
 *
 * @module application/queries/GetAOI
 */

/**
 * Get AOI Query
 */
export class GetAOI {
  /**
   * @param {Object} dependencies
   * @param {import('../../domain/aoi/AOIRepository.js').AOIRepository} dependencies.aoiRepository
   */
  constructor({ aoiRepository }) {
    this.aoiRepository = aoiRepository;
  }

  /**
   * Execute the get AOI query by ID
   *
   * @param {number} id - AOI ID
   * @returns {Promise<import('../../domain/aoi/AOI.js').AOI|null>}
   */
  async byId(id) {
    return await this.aoiRepository.findById(id);
  }
}
