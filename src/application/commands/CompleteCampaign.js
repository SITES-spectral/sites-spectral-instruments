/**
 * Complete Campaign Use Case
 *
 * Application layer command for completing a campaign.
 * Changes campaign status to COMPLETED.
 *
 * @module application/commands/CompleteCampaign
 */

/**
 * Complete Campaign Command
 */
export class CompleteCampaign {
  /**
   * @param {Object} dependencies
   * @param {import('../../domain/campaign/CampaignRepository.js').CampaignRepository} dependencies.campaignRepository
   */
  constructor({ campaignRepository }) {
    this.campaignRepository = campaignRepository;
  }

  /**
   * Execute the complete campaign command
   *
   * @param {number} id - Campaign ID
   * @returns {Promise<import('../../domain/campaign/Campaign.js').Campaign>} Completed campaign
   * @throws {Error} If campaign not found or already completed
   */
  async execute(id) {
    const campaign = await this.campaignRepository.findById(id);
    if (!campaign) {
      throw new Error(`Campaign with ID ${id} not found`);
    }

    const completedCampaign = campaign.complete();
    return await this.campaignRepository.save(completedCampaign);
  }
}
