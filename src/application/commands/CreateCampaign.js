/**
 * Create Campaign Use Case
 *
 * Application layer command for creating a new field campaign.
 * Orchestrates domain logic and persistence.
 *
 * @module application/commands/CreateCampaign
 */

import { Campaign } from '../../domain/index.js';

/**
 * @typedef {Object} CreateCampaignInput
 * @property {string} name - Campaign name
 * @property {string} [description] - Campaign description
 * @property {string} [campaignType] - Campaign type
 * @property {string} startDate - Start date (ISO 8601)
 * @property {string} [endDate] - End date (ISO 8601)
 * @property {number} stationId - Station ID
 * @property {number} [platformId] - Platform ID
 * @property {number} [aoiId] - AOI ID
 * @property {number} [coordinatorId] - Coordinator user ID
 * @property {number[]} [participants] - Participant user IDs
 * @property {string[]} [objectives] - Campaign objectives
 * @property {string[]} [expectedOutcomes] - Expected outcomes
 * @property {string} [fundingSource] - Funding source
 * @property {number} [budget] - Budget
 * @property {Object} [metadata] - Additional metadata
 */

/**
 * Create Campaign Command
 */
export class CreateCampaign {
  /**
   * @param {Object} dependencies
   * @param {import('../../domain/campaign/CampaignRepository.js').CampaignRepository} dependencies.campaignRepository
   */
  constructor({ campaignRepository }) {
    this.campaignRepository = campaignRepository;
  }

  /**
   * Execute the create campaign command
   *
   * @param {CreateCampaignInput} input - Campaign data
   * @returns {Promise<Campaign>} Created campaign
   * @throws {Error} If validation fails
   */
  async execute(input) {
    // Create campaign entity (validates input)
    const campaign = new Campaign({
      name: input.name,
      description: input.description,
      campaignType: input.campaignType || Campaign.TYPES.FIELD_CAMPAIGN,
      startDate: input.startDate,
      endDate: input.endDate,
      status: Campaign.STATUS.PLANNED,
      stationId: input.stationId,
      platformId: input.platformId,
      aoiId: input.aoiId,
      coordinatorId: input.coordinatorId,
      participants: input.participants || [],
      objectives: input.objectives || [],
      expectedOutcomes: input.expectedOutcomes || [],
      fundingSource: input.fundingSource,
      budget: input.budget,
      metadata: input.metadata || {}
    });

    // Persist and return
    return await this.campaignRepository.save(campaign);
  }
}
