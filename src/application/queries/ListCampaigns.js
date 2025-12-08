/**
 * List Campaigns Query
 *
 * Application layer query for listing campaigns with various filters.
 *
 * @module application/queries/ListCampaigns
 */

/**
 * List Campaigns Query
 */
export class ListCampaigns {
  /**
   * @param {Object} dependencies
   * @param {import('../../domain/campaign/CampaignRepository.js').CampaignRepository} dependencies.campaignRepository
   */
  constructor({ campaignRepository }) {
    this.campaignRepository = campaignRepository;
  }

  /**
   * List all campaigns
   *
   * @returns {Promise<import('../../domain/campaign/Campaign.js').Campaign[]>}
   */
  async all() {
    return await this.campaignRepository.findAll();
  }

  /**
   * List campaigns by station ID
   *
   * @param {number} stationId - Station ID
   * @returns {Promise<import('../../domain/campaign/Campaign.js').Campaign[]>}
   */
  async byStation(stationId) {
    return await this.campaignRepository.findByStationId(stationId);
  }

  /**
   * List campaigns by platform ID
   *
   * @param {number} platformId - Platform ID
   * @returns {Promise<import('../../domain/campaign/Campaign.js').Campaign[]>}
   */
  async byPlatform(platformId) {
    return await this.campaignRepository.findByPlatformId(platformId);
  }

  /**
   * List campaigns by AOI ID
   *
   * @param {number} aoiId - AOI ID
   * @returns {Promise<import('../../domain/campaign/Campaign.js').Campaign[]>}
   */
  async byAOI(aoiId) {
    return await this.campaignRepository.findByAOIId(aoiId);
  }

  /**
   * List campaigns by status
   *
   * @param {string} status - Campaign status
   * @returns {Promise<import('../../domain/campaign/Campaign.js').Campaign[]>}
   */
  async byStatus(status) {
    return await this.campaignRepository.findByStatus(status);
  }

  /**
   * List active campaigns
   *
   * @returns {Promise<import('../../domain/campaign/Campaign.js').Campaign[]>}
   */
  async active() {
    return await this.campaignRepository.findActiveCampaigns();
  }

  /**
   * List ongoing campaigns
   *
   * @returns {Promise<import('../../domain/campaign/Campaign.js').Campaign[]>}
   */
  async ongoing() {
    return await this.campaignRepository.findOngoingCampaigns();
  }

  /**
   * List campaigns by coordinator
   *
   * @param {number} coordinatorId - Coordinator user ID
   * @returns {Promise<import('../../domain/campaign/Campaign.js').Campaign[]>}
   */
  async byCoordinator(coordinatorId) {
    return await this.campaignRepository.findByCoordinatorId(coordinatorId);
  }

  /**
   * List campaigns by participant
   *
   * @param {number} userId - Participant user ID
   * @returns {Promise<import('../../domain/campaign/Campaign.js').Campaign[]>}
   */
  async byParticipant(userId) {
    return await this.campaignRepository.findByParticipant(userId);
  }

  /**
   * List campaigns in date range
   *
   * @param {string} startDate - Start date (ISO 8601)
   * @param {string} endDate - End date (ISO 8601)
   * @returns {Promise<import('../../domain/campaign/Campaign.js').Campaign[]>}
   */
  async inDateRange(startDate, endDate) {
    return await this.campaignRepository.findByDateRange(startDate, endDate);
  }

  /**
   * Get campaign count by station
   *
   * @param {number} stationId - Station ID
   * @returns {Promise<number>}
   */
  async countByStation(stationId) {
    return await this.campaignRepository.countByStationId(stationId);
  }
}
