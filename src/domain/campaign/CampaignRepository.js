/**
 * Campaign Repository Port (Interface)
 *
 * Defines the contract for Campaign persistence operations.
 * Follows Interface Segregation Principle - focused interface for campaign operations.
 * Follows Dependency Inversion Principle - domain depends on this abstraction.
 *
 * Implementations (adapters) live in infrastructure layer.
 *
 * @module domain/campaign/CampaignRepository
 */

export class CampaignRepository {
    /**
     * Find campaign by ID
     * @param {number} id - Campaign ID
     * @returns {Promise<Campaign|null>}
     */
    async findById(id) {
        throw new Error('Method findById() must be implemented');
    }

    /**
     * Find all campaigns for a station
     * @param {number} stationId - Station ID
     * @returns {Promise<Campaign[]>}
     */
    async findByStationId(stationId) {
        throw new Error('Method findByStationId() must be implemented');
    }

    /**
     * Find all campaigns for a platform
     * @param {number} platformId - Platform ID
     * @returns {Promise<Campaign[]>}
     */
    async findByPlatformId(platformId) {
        throw new Error('Method findByPlatformId() must be implemented');
    }

    /**
     * Find all campaigns for an AOI
     * @param {number} aoiId - AOI ID
     * @returns {Promise<Campaign[]>}
     */
    async findByAOIId(aoiId) {
        throw new Error('Method findByAOIId() must be implemented');
    }

    /**
     * Find campaigns by status
     * @param {string} status - Campaign status
     * @returns {Promise<Campaign[]>}
     */
    async findByStatus(status) {
        throw new Error('Method findByStatus() must be implemented');
    }

    /**
     * Find campaigns by coordinator
     * @param {number} coordinatorId - Coordinator user ID
     * @returns {Promise<Campaign[]>}
     */
    async findByCoordinatorId(coordinatorId) {
        throw new Error('Method findByCoordinatorId() must be implemented');
    }

    /**
     * Find campaigns by participant
     * @param {number} userId - Participant user ID
     * @returns {Promise<Campaign[]>}
     */
    async findByParticipant(userId) {
        throw new Error('Method findByParticipant() must be implemented');
    }

    /**
     * Find active campaigns
     * @returns {Promise<Campaign[]>}
     */
    async findActiveCampaigns() {
        throw new Error('Method findActiveCampaigns() must be implemented');
    }

    /**
     * Find campaigns within date range
     * @param {string} startDate - Start date (ISO 8601)
     * @param {string} endDate - End date (ISO 8601)
     * @returns {Promise<Campaign[]>}
     */
    async findByDateRange(startDate, endDate) {
        throw new Error('Method findByDateRange() must be implemented');
    }

    /**
     * Find ongoing campaigns (currently active within date range)
     * @returns {Promise<Campaign[]>}
     */
    async findOngoingCampaigns() {
        throw new Error('Method findOngoingCampaigns() must be implemented');
    }

    /**
     * Find all campaigns
     * @returns {Promise<Campaign[]>}
     */
    async findAll() {
        throw new Error('Method findAll() must be implemented');
    }

    /**
     * Save campaign (create or update)
     * @param {Campaign} campaign - Campaign entity
     * @returns {Promise<Campaign>}
     */
    async save(campaign) {
        throw new Error('Method save() must be implemented');
    }

    /**
     * Delete campaign by ID
     * @param {number} id - Campaign ID
     * @returns {Promise<boolean>}
     */
    async deleteById(id) {
        throw new Error('Method deleteById() must be implemented');
    }

    /**
     * Count campaigns for a station
     * @param {number} stationId - Station ID
     * @returns {Promise<number>}
     */
    async countByStationId(stationId) {
        throw new Error('Method countByStationId() must be implemented');
    }

    /**
     * Check if campaign exists by ID
     * @param {number} id - Campaign ID
     * @returns {Promise<boolean>}
     */
    async existsById(id) {
        throw new Error('Method existsById() must be implemented');
    }
}
