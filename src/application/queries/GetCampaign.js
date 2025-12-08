/**
 * Get Campaign Query
 *
 * Application layer query for retrieving a single campaign.
 *
 * @module application/queries/GetCampaign
 */

/**
 * Get Campaign Query
 */
export class GetCampaign {
  /**
   * @param {Object} dependencies
   * @param {import('../../domain/campaign/CampaignRepository.js').CampaignRepository} dependencies.campaignRepository
   */
  constructor({ campaignRepository }) {
    this.campaignRepository = campaignRepository;
  }

  /**
   * Execute the get campaign query by ID
   *
   * @param {number} id - Campaign ID
   * @returns {Promise<import('../../domain/campaign/Campaign.js').Campaign|null>}
   */
  async byId(id) {
    return await this.campaignRepository.findById(id);
  }
}
