/**
 * Delete AOI Use Case
 *
 * Application layer command for deleting an Area of Interest.
 *
 * @module application/commands/DeleteAOI
 */

/**
 * Delete AOI Command
 */
export class DeleteAOI {
  /**
   * @param {Object} dependencies
   * @param {import('../../domain/aoi/AOIRepository.js').AOIRepository} dependencies.aoiRepository
   */
  constructor({ aoiRepository }) {
    this.aoiRepository = aoiRepository;
  }

  /**
   * Execute the delete AOI command
   *
   * @param {number} id - AOI ID
   * @returns {Promise<boolean>} True if deleted
   * @throws {Error} If AOI not found
   */
  async execute(id) {
    const exists = await this.aoiRepository.existsById(id);
    if (!exists) {
      throw new Error(`AOI with ID ${id} not found`);
    }

    return await this.aoiRepository.deleteById(id);
  }
}
