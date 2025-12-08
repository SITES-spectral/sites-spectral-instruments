/**
 * Campaign Entity
 *
 * Domain entity representing a field campaign or measurement campaign.
 * Follows Single Responsibility Principle - only contains campaign data and behavior.
 *
 * @module domain/campaign/Campaign
 */

export class Campaign {
    /**
     * Valid campaign statuses
     */
    static STATUS = {
        PLANNED: 'planned',
        ACTIVE: 'active',
        COMPLETED: 'completed',
        CANCELLED: 'cancelled',
        ON_HOLD: 'on_hold'
    };

    /**
     * Valid campaign types
     */
    static TYPES = {
        FIELD_CAMPAIGN: 'field_campaign',
        CONTINUOUS_MONITORING: 'continuous_monitoring',
        CALIBRATION: 'calibration',
        VALIDATION: 'validation',
        EXPERIMENTAL: 'experimental'
    };

    /**
     * Create a new Campaign instance
     * @param {Object} data - Campaign data
     */
    constructor({
        id = null,
        name,
        description = null,
        campaignType = Campaign.TYPES.FIELD_CAMPAIGN,
        startDate,
        endDate = null,
        status = Campaign.STATUS.PLANNED,
        stationId,
        platformId = null,
        aoiId = null,
        coordinatorId = null,
        participants = [],
        objectives = [],
        expectedOutcomes = [],
        fundingSource = null,
        budget = null,
        metadata = {},
        createdAt = null,
        updatedAt = null
    }) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.campaignType = campaignType;
        this.startDate = startDate;
        this.endDate = endDate;
        this.status = status;
        this.stationId = stationId;
        this.platformId = platformId;
        this.aoiId = aoiId;
        this.coordinatorId = coordinatorId;
        this.participants = participants;
        this.objectives = objectives;
        this.expectedOutcomes = expectedOutcomes;
        this.fundingSource = fundingSource;
        this.budget = budget;
        this.metadata = metadata;
        this.createdAt = createdAt || new Date().toISOString();
        this.updatedAt = updatedAt || new Date().toISOString();

        this.validate();
    }

    /**
     * Validate campaign entity
     * @throws {Error} If validation fails
     */
    validate() {
        if (!this.name || typeof this.name !== 'string') {
            throw new Error('Campaign name is required and must be a string');
        }

        if (!Object.values(Campaign.STATUS).includes(this.status)) {
            throw new Error(`Invalid campaign status: ${this.status}`);
        }

        if (!Object.values(Campaign.TYPES).includes(this.campaignType)) {
            throw new Error(`Invalid campaign type: ${this.campaignType}`);
        }

        if (!this.stationId) {
            throw new Error('Campaign station ID is required');
        }

        if (!this.startDate) {
            throw new Error('Campaign start date is required');
        }

        // Validate date format (ISO 8601)
        if (!this.isValidDate(this.startDate)) {
            throw new Error('Campaign start date must be in ISO 8601 format');
        }

        if (this.endDate && !this.isValidDate(this.endDate)) {
            throw new Error('Campaign end date must be in ISO 8601 format');
        }

        // End date must be after start date
        if (this.endDate && new Date(this.endDate) < new Date(this.startDate)) {
            throw new Error('Campaign end date must be after start date');
        }

        if (!Array.isArray(this.participants)) {
            throw new Error('Campaign participants must be an array');
        }

        if (!Array.isArray(this.objectives)) {
            throw new Error('Campaign objectives must be an array');
        }

        if (!Array.isArray(this.expectedOutcomes)) {
            throw new Error('Campaign expected outcomes must be an array');
        }
    }

    /**
     * Check if date string is valid ISO 8601
     * @param {string} dateString - Date string to validate
     * @returns {boolean}
     */
    isValidDate(dateString) {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date.getTime());
    }

    /**
     * Update campaign properties
     * @param {Object} updates - Properties to update
     * @returns {Campaign} Updated campaign instance
     */
    update(updates) {
        const updatedData = {
            ...this.toObject(),
            ...updates,
            updatedAt: new Date().toISOString()
        };

        return new Campaign(updatedData);
    }

    /**
     * Check if campaign is planned
     * @returns {boolean}
     */
    isPlanned() {
        return this.status === Campaign.STATUS.PLANNED;
    }

    /**
     * Check if campaign is active
     * @returns {boolean}
     */
    isActive() {
        return this.status === Campaign.STATUS.ACTIVE;
    }

    /**
     * Check if campaign is completed
     * @returns {boolean}
     */
    isCompleted() {
        return this.status === Campaign.STATUS.COMPLETED;
    }

    /**
     * Check if campaign is cancelled
     * @returns {boolean}
     */
    isCancelled() {
        return this.status === Campaign.STATUS.CANCELLED;
    }

    /**
     * Check if campaign is on hold
     * @returns {boolean}
     */
    isOnHold() {
        return this.status === Campaign.STATUS.ON_HOLD;
    }

    /**
     * Check if campaign is ongoing
     * @returns {boolean}
     */
    isOngoing() {
        const now = new Date();
        const start = new Date(this.startDate);
        const end = this.endDate ? new Date(this.endDate) : null;

        return this.isActive() && start <= now && (!end || now <= end);
    }

    /**
     * Check if campaign has ended
     * @returns {boolean}
     */
    hasEnded() {
        if (!this.endDate) {
            return false;
        }

        return new Date() > new Date(this.endDate);
    }

    /**
     * Check if campaign has started
     * @returns {boolean}
     */
    hasStarted() {
        return new Date() >= new Date(this.startDate);
    }

    /**
     * Check if campaign is linked to an AOI
     * @returns {boolean}
     */
    hasAOI() {
        return this.aoiId !== null;
    }

    /**
     * Check if campaign is linked to a platform
     * @returns {boolean}
     */
    hasPlatform() {
        return this.platformId !== null;
    }

    /**
     * Check if campaign has a coordinator
     * @returns {boolean}
     */
    hasCoordinator() {
        return this.coordinatorId !== null;
    }

    /**
     * Check if campaign has participants
     * @returns {boolean}
     */
    hasParticipants() {
        return this.participants.length > 0;
    }

    /**
     * Get campaign duration in days
     * @returns {number|null} Duration in days, or null if no end date
     */
    getDurationDays() {
        if (!this.endDate) {
            return null;
        }

        const start = new Date(this.startDate);
        const end = new Date(this.endDate);
        const diffTime = Math.abs(end - start);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    /**
     * Get days until campaign starts
     * @returns {number} Days until start (negative if already started)
     */
    getDaysUntilStart() {
        const now = new Date();
        const start = new Date(this.startDate);
        const diffTime = start - now;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    /**
     * Get days until campaign ends
     * @returns {number|null} Days until end (negative if already ended), or null if no end date
     */
    getDaysUntilEnd() {
        if (!this.endDate) {
            return null;
        }

        const now = new Date();
        const end = new Date(this.endDate);
        const diffTime = end - now;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    /**
     * Add participant to campaign
     * @param {number} userId - User ID to add
     * @returns {Campaign}
     */
    addParticipant(userId) {
        if (this.participants.includes(userId)) {
            throw new Error(`User ${userId} is already a participant`);
        }

        return this.update({
            participants: [...this.participants, userId]
        });
    }

    /**
     * Remove participant from campaign
     * @param {number} userId - User ID to remove
     * @returns {Campaign}
     */
    removeParticipant(userId) {
        return this.update({
            participants: this.participants.filter(id => id !== userId)
        });
    }

    /**
     * Add objective to campaign
     * @param {string} objective - Objective to add
     * @returns {Campaign}
     */
    addObjective(objective) {
        return this.update({
            objectives: [...this.objectives, objective]
        });
    }

    /**
     * Add expected outcome to campaign
     * @param {string} outcome - Expected outcome to add
     * @returns {Campaign}
     */
    addExpectedOutcome(outcome) {
        return this.update({
            expectedOutcomes: [...this.expectedOutcomes, outcome]
        });
    }

    /**
     * Start campaign
     * @returns {Campaign}
     */
    start() {
        if (this.isActive()) {
            throw new Error('Campaign is already active');
        }

        return this.update({ status: Campaign.STATUS.ACTIVE });
    }

    /**
     * Complete campaign
     * @returns {Campaign}
     */
    complete() {
        if (this.isCompleted()) {
            throw new Error('Campaign is already completed');
        }

        return this.update({ status: Campaign.STATUS.COMPLETED });
    }

    /**
     * Cancel campaign
     * @returns {Campaign}
     */
    cancel() {
        if (this.isCancelled()) {
            throw new Error('Campaign is already cancelled');
        }

        return this.update({ status: Campaign.STATUS.CANCELLED });
    }

    /**
     * Put campaign on hold
     * @returns {Campaign}
     */
    putOnHold() {
        if (this.isOnHold()) {
            throw new Error('Campaign is already on hold');
        }

        return this.update({ status: Campaign.STATUS.ON_HOLD });
    }

    /**
     * Convert campaign to plain object
     * @returns {Object}
     */
    toObject() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            campaignType: this.campaignType,
            startDate: this.startDate,
            endDate: this.endDate,
            status: this.status,
            stationId: this.stationId,
            platformId: this.platformId,
            aoiId: this.aoiId,
            coordinatorId: this.coordinatorId,
            participants: this.participants,
            objectives: this.objectives,
            expectedOutcomes: this.expectedOutcomes,
            fundingSource: this.fundingSource,
            budget: this.budget,
            metadata: this.metadata,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}
