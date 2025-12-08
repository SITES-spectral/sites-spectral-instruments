/**
 * Update AOI Use Case
 *
 * Application layer command for updating an existing Area of Interest.
 *
 * @module application/commands/UpdateAOI
 */

/**
 * Update AOI Command
 */
export class UpdateAOI {
  /**
   * @param {Object} dependencies
   * @param {import('../../domain/aoi/AOIRepository.js').AOIRepository} dependencies.aoiRepository
   */
  constructor({ aoiRepository }) {
    this.aoiRepository = aoiRepository;
  }

  /**
   * Execute the update AOI command
   *
   * @param {number} id - AOI ID
   * @param {Object} updates - Properties to update
   * @returns {Promise<import('../../domain/aoi/AOI.js').AOI>} Updated AOI
   * @throws {Error} If AOI not found
   */
  async execute(id, updates) {
    const existingAOI = await this.aoiRepository.findById(id);
    if (!existingAOI) {
      throw new Error(`AOI with ID ${id} not found`);
    }

    const updatedAOI = existingAOI.update(updates);
    return await this.aoiRepository.save(updatedAOI);
  }
}
