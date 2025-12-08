/**
 * Campaign Domain Service
 *
 * Orchestrates campaign business logic operations.
 * Follows Single Responsibility Principle - handles campaign-specific business rules.
 * Follows Dependency Inversion Principle - depends on repository abstraction.
 *
 * @module domain/campaign/CampaignService
 */

import { Campaign } from './Campaign.js';

export class CampaignService {
    /**
     * @param {CampaignRepository} campaignRepository - Campaign repository implementation
     */
    constructor(campaignRepository) {
        this.campaignRepository = campaignRepository;
    }

    /**
     * Create a new campaign
     * @param {Object} campaignData - Campaign data
     * @returns {Promise<Campaign>}
     */
    async createCampaign(campaignData) {
        const campaign = new Campaign(campaignData);
        return await this.campaignRepository.save(campaign);
    }

    /**
     * Update an existing campaign
     * @param {number} id - Campaign ID
     * @param {Object} updates - Properties to update
     * @returns {Promise<Campaign>}
     */
    async updateCampaign(id, updates) {
        const existingCampaign = await this.campaignRepository.findById(id);
        if (!existingCampaign) {
            throw new Error(`Campaign with ID ${id} not found`);
        }

        const updatedCampaign = existingCampaign.update(updates);
        return await this.campaignRepository.save(updatedCampaign);
    }

    /**
     * Delete a campaign
     * @param {number} id - Campaign ID
     * @returns {Promise<boolean>}
     */
    async deleteCampaign(id) {
        const exists = await this.campaignRepository.existsById(id);
        if (!exists) {
            throw new Error(`Campaign with ID ${id} not found`);
        }

        return await this.campaignRepository.deleteById(id);
    }

    /**
     * Get campaign by ID
     * @param {number} id - Campaign ID
     * @returns {Promise<Campaign|null>}
     */
    async getCampaignById(id) {
        return await this.campaignRepository.findById(id);
    }

    /**
     * Get all campaigns for a station
     * @param {number} stationId - Station ID
     * @returns {Promise<Campaign[]>}
     */
    async getCampaignsByStation(stationId) {
        return await this.campaignRepository.findByStationId(stationId);
    }

    /**
     * Get all campaigns for a platform
     * @param {number} platformId - Platform ID
     * @returns {Promise<Campaign[]>}
     */
    async getCampaignsByPlatform(platformId) {
        return await this.campaignRepository.findByPlatformId(platformId);
    }

    /**
     * Get all campaigns for an AOI
     * @param {number} aoiId - AOI ID
     * @returns {Promise<Campaign[]>}
     */
    async getCampaignsByAOI(aoiId) {
        return await this.campaignRepository.findByAOIId(aoiId);
    }

    /**
     * Get campaigns by status
     * @param {string} status - Campaign status
     * @returns {Promise<Campaign[]>}
     */
    async getCampaignsByStatus(status) {
        return await this.campaignRepository.findByStatus(status);
    }

    /**
     * Get active campaigns
     * @returns {Promise<Campaign[]>}
     */
    async getActiveCampaigns() {
        return await this.campaignRepository.findActiveCampaigns();
    }

    /**
     * Get ongoing campaigns (currently within date range)
     * @returns {Promise<Campaign[]>}
     */
    async getOngoingCampaigns() {
        return await this.campaignRepository.findOngoingCampaigns();
    }

    /**
     * Get campaigns coordinated by a user
     * @param {number} coordinatorId - Coordinator user ID
     * @returns {Promise<Campaign[]>}
     */
    async getCampaignsByCoordinator(coordinatorId) {
        return await this.campaignRepository.findByCoordinatorId(coordinatorId);
    }

    /**
     * Get campaigns where user is a participant
     * @param {number} userId - User ID
     * @returns {Promise<Campaign[]>}
     */
    async getCampaignsByParticipant(userId) {
        return await this.campaignRepository.findByParticipant(userId);
    }

    /**
     * Get campaigns within date range
     * @param {string} startDate - Start date (ISO 8601)
     * @param {string} endDate - End date (ISO 8601)
     * @returns {Promise<Campaign[]>}
     */
    async getCampaignsInDateRange(startDate, endDate) {
        return await this.campaignRepository.findByDateRange(startDate, endDate);
    }

    /**
     * Start a campaign
     * @param {number} id - Campaign ID
     * @returns {Promise<Campaign>}
     */
    async startCampaign(id) {
        const campaign = await this.campaignRepository.findById(id);
        if (!campaign) {
            throw new Error(`Campaign with ID ${id} not found`);
        }

        const startedCampaign = campaign.start();
        return await this.campaignRepository.save(startedCampaign);
    }

    /**
     * Complete a campaign
     * @param {number} id - Campaign ID
     * @returns {Promise<Campaign>}
     */
    async completeCampaign(id) {
        const campaign = await this.campaignRepository.findById(id);
        if (!campaign) {
            throw new Error(`Campaign with ID ${id} not found`);
        }

        const completedCampaign = campaign.complete();
        return await this.campaignRepository.save(completedCampaign);
    }

    /**
     * Cancel a campaign
     * @param {number} id - Campaign ID
     * @returns {Promise<Campaign>}
     */
    async cancelCampaign(id) {
        const campaign = await this.campaignRepository.findById(id);
        if (!campaign) {
            throw new Error(`Campaign with ID ${id} not found`);
        }

        const cancelledCampaign = campaign.cancel();
        return await this.campaignRepository.save(cancelledCampaign);
    }

    /**
     * Put campaign on hold
     * @param {number} id - Campaign ID
     * @returns {Promise<Campaign>}
     */
    async putCampaignOnHold(id) {
        const campaign = await this.campaignRepository.findById(id);
        if (!campaign) {
            throw new Error(`Campaign with ID ${id} not found`);
        }

        const heldCampaign = campaign.putOnHold();
        return await this.campaignRepository.save(heldCampaign);
    }

    /**
     * Add participant to campaign
     * @param {number} campaignId - Campaign ID
     * @param {number} userId - User ID to add
     * @returns {Promise<Campaign>}
     */
    async addParticipant(campaignId, userId) {
        const campaign = await this.campaignRepository.findById(campaignId);
        if (!campaign) {
            throw new Error(`Campaign with ID ${campaignId} not found`);
        }

        const updatedCampaign = campaign.addParticipant(userId);
        return await this.campaignRepository.save(updatedCampaign);
    }

    /**
     * Remove participant from campaign
     * @param {number} campaignId - Campaign ID
     * @param {number} userId - User ID to remove
     * @returns {Promise<Campaign>}
     */
    async removeParticipant(campaignId, userId) {
        const campaign = await this.campaignRepository.findById(campaignId);
        if (!campaign) {
            throw new Error(`Campaign with ID ${campaignId} not found`);
        }

        const updatedCampaign = campaign.removeParticipant(userId);
        return await this.campaignRepository.save(updatedCampaign);
    }

    /**
     * Add objective to campaign
     * @param {number} campaignId - Campaign ID
     * @param {string} objective - Objective to add
     * @returns {Promise<Campaign>}
     */
    async addObjective(campaignId, objective) {
        const campaign = await this.campaignRepository.findById(campaignId);
        if (!campaign) {
            throw new Error(`Campaign with ID ${campaignId} not found`);
        }

        const updatedCampaign = campaign.addObjective(objective);
        return await this.campaignRepository.save(updatedCampaign);
    }

    /**
     * Add expected outcome to campaign
     * @param {number} campaignId - Campaign ID
     * @param {string} outcome - Expected outcome to add
     * @returns {Promise<Campaign>}
     */
    async addExpectedOutcome(campaignId, outcome) {
        const campaign = await this.campaignRepository.findById(campaignId);
        if (!campaign) {
            throw new Error(`Campaign with ID ${campaignId} not found`);
        }

        const updatedCampaign = campaign.addExpectedOutcome(outcome);
        return await this.campaignRepository.save(updatedCampaign);
    }

    /**
     * Link campaign to AOI
     * @param {number} campaignId - Campaign ID
     * @param {number} aoiId - AOI ID
     * @returns {Promise<Campaign>}
     */
    async linkCampaignToAOI(campaignId, aoiId) {
        return await this.updateCampaign(campaignId, { aoiId });
    }

    /**
     * Link campaign to platform
     * @param {number} campaignId - Campaign ID
     * @param {number} platformId - Platform ID
     * @returns {Promise<Campaign>}
     */
    async linkCampaignToPlatform(campaignId, platformId) {
        return await this.updateCampaign(campaignId, { platformId });
    }

    /**
     * Count campaigns for a station
     * @param {number} stationId - Station ID
     * @returns {Promise<number>}
     */
    async countCampaignsForStation(stationId) {
        return await this.campaignRepository.countByStationId(stationId);
    }

    /**
     * Get upcoming campaigns (starting within specified days)
     * @param {number} days - Number of days to look ahead
     * @returns {Promise<Campaign[]>}
     */
    async getUpcomingCampaigns(days = 30) {
        const allCampaigns = await this.campaignRepository.findAll();
        const now = new Date();
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);

        return allCampaigns.filter(campaign => {
            const startDate = new Date(campaign.startDate);
            return startDate >= now && startDate <= futureDate && campaign.isPlanned();
        });
    }

    /**
     * Get campaigns ending soon (ending within specified days)
     * @param {number} days - Number of days to look ahead
     * @returns {Promise<Campaign[]>}
     */
    async getCampaignsEndingSoon(days = 7) {
        const activeCampaigns = await this.campaignRepository.findActiveCampaigns();
        const now = new Date();
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);

        return activeCampaigns.filter(campaign => {
            if (!campaign.endDate) return false;
            const endDate = new Date(campaign.endDate);
            return endDate >= now && endDate <= futureDate;
        });
    }

    /**
     * Validate campaign data without saving
     * @param {Object} campaignData - Campaign data
     * @returns {boolean}
     */
    validateCampaignData(campaignData) {
        try {
            new Campaign(campaignData);
            return true;
        } catch (error) {
            throw new Error(`Campaign validation failed: ${error.message}`);
        }
    }
}
