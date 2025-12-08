/**
 * Update Campaign Use Case
 *
 * Application layer command for updating an existing campaign.
 *
 * @module application/commands/UpdateCampaign
 */

/**
 * Update Campaign Command
 */
export class UpdateCampaign {
  /**
   * @param {Object} dependencies
   * @param {import('../../domain/campaign/CampaignRepository.js').CampaignRepository} dependencies.campaignRepository
   */
  constructor({ campaignRepository }) {
    this.campaignRepository = campaignRepository;
  }

  /**
   * Execute the update campaign command
   *
   * @param {number} id - Campaign ID
   * @param {Object} updates - Properties to update
   * @returns {Promise<import('../../domain/campaign/Campaign.js').Campaign>} Updated campaign
   * @throws {Error} If campaign not found
   */
  async execute(id, updates) {
    const existingCampaign = await this.campaignRepository.findById(id);
    if (!existingCampaign) {
      throw new Error(`Campaign with ID ${id} not found`);
    }

    const updatedCampaign = existingCampaign.update(updates);
    return await this.campaignRepository.save(updatedCampaign);
  }
}
