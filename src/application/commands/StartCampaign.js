/**
 * Start Campaign Use Case
 *
 * Application layer command for starting a campaign.
 * Changes campaign status from PLANNED to ACTIVE.
 *
 * @module application/commands/StartCampaign
 */

/**
 * Start Campaign Command
 */
export class StartCampaign {
  /**
   * @param {Object} dependencies
   * @param {import('../../domain/campaign/CampaignRepository.js').CampaignRepository} dependencies.campaignRepository
   */
  constructor({ campaignRepository }) {
    this.campaignRepository = campaignRepository;
  }

  /**
   * Execute the start campaign command
   *
   * @param {number} id - Campaign ID
   * @returns {Promise<import('../../domain/campaign/Campaign.js').Campaign>} Started campaign
   * @throws {Error} If campaign not found or already active
   */
  async execute(id) {
    const campaign = await this.campaignRepository.findById(id);
    if (!campaign) {
      throw new Error(`Campaign with ID ${id} not found`);
    }

    const startedCampaign = campaign.start();
    return await this.campaignRepository.save(startedCampaign);
  }
}
