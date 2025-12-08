/**
 * Delete Campaign Use Case
 *
 * Application layer command for deleting a campaign.
 *
 * @module application/commands/DeleteCampaign
 */

/**
 * Delete Campaign Command
 */
export class DeleteCampaign {
  /**
   * @param {Object} dependencies
   * @param {import('../../domain/campaign/CampaignRepository.js').CampaignRepository} dependencies.campaignRepository
   */
  constructor({ campaignRepository }) {
    this.campaignRepository = campaignRepository;
  }

  /**
   * Execute the delete campaign command
   *
   * @param {number} id - Campaign ID
   * @returns {Promise<boolean>} True if deleted
   * @throws {Error} If campaign not found
   */
  async execute(id) {
    const exists = await this.campaignRepository.existsById(id);
    if (!exists) {
      throw new Error(`Campaign with ID ${id} not found`);
    }

    return await this.campaignRepository.deleteById(id);
  }
}
