/**
 * D1 Campaign Repository
 *
 * Cloudflare D1 implementation of CampaignRepository.
 * Adapts the domain port to the D1 database.
 *
 * @module infrastructure/persistence/d1/D1CampaignRepository
 */

import { Campaign } from '../../../domain/index.js';

/**
 * D1 Campaign Repository Adapter
 * @implements {import('../../../domain/campaign/CampaignRepository.js').CampaignRepository}
 */
export class D1CampaignRepository {
  /**
   * @param {D1Database} db - Cloudflare D1 database instance
   */
  constructor(db) {
    this.db = db;
  }

  /**
   * Map database row to Campaign entity
   * @param {Object} row - Database row
   * @returns {Campaign}
   */
  mapToEntity(row) {
    return new Campaign({
      id: row.id,
      name: row.campaign_name,
      description: row.description,
      campaignType: row.campaign_type_v11 || row.campaign_type || Campaign.TYPES.FIELD_CAMPAIGN,
      startDate: row.planned_start_datetime,
      endDate: row.planned_end_datetime,
      status: row.status || Campaign.STATUS.PLANNED,
      stationId: row.station_id,
      platformId: row.platform_id,
      aoiId: row.aoi_id,
      coordinatorId: row.coordinator_id,
      participants: row.participants_json ? JSON.parse(row.participants_json) : [],
      objectives: row.objectives_json ? JSON.parse(row.objectives_json) : [],
      expectedOutcomes: row.expected_outcomes_json ? JSON.parse(row.expected_outcomes_json) : [],
      fundingSource: row.funding_source,
      budget: row.budget,
      metadata: row.metadata_json ? JSON.parse(row.metadata_json) : {},
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }

  /**
   * Find campaign by ID
   * @param {number} id
   * @returns {Promise<Campaign|null>}
   */
  async findById(id) {
    const result = await this.db
      .prepare('SELECT * FROM acquisition_campaigns WHERE id = ?')
      .bind(id)
      .first();

    return result ? this.mapToEntity(result) : null;
  }

  /**
   * Find all campaigns for a station
   * @param {number} stationId
   * @returns {Promise<Campaign[]>}
   */
  async findByStationId(stationId) {
    const results = await this.db
      .prepare('SELECT * FROM acquisition_campaigns WHERE station_id = ? ORDER BY planned_start_datetime DESC')
      .bind(stationId)
      .all();

    return results.results.map(row => this.mapToEntity(row));
  }

  /**
   * Find all campaigns for a platform
   * @param {number} platformId
   * @returns {Promise<Campaign[]>}
   */
  async findByPlatformId(platformId) {
    const results = await this.db
      .prepare('SELECT * FROM acquisition_campaigns WHERE platform_id = ? ORDER BY planned_start_datetime DESC')
      .bind(platformId)
      .all();

    return results.results.map(row => this.mapToEntity(row));
  }

  /**
   * Find all campaigns for an AOI
   * @param {number} aoiId
   * @returns {Promise<Campaign[]>}
   */
  async findByAOIId(aoiId) {
    const results = await this.db
      .prepare('SELECT * FROM acquisition_campaigns WHERE aoi_id = ? ORDER BY planned_start_datetime DESC')
      .bind(aoiId)
      .all();

    return results.results.map(row => this.mapToEntity(row));
  }

  /**
   * Find campaigns by status
   * @param {string} status
   * @returns {Promise<Campaign[]>}
   */
  async findByStatus(status) {
    const results = await this.db
      .prepare('SELECT * FROM acquisition_campaigns WHERE status = ? ORDER BY planned_start_datetime DESC')
      .bind(status)
      .all();

    return results.results.map(row => this.mapToEntity(row));
  }

  /**
   * Find campaigns by coordinator
   * @param {number} coordinatorId
   * @returns {Promise<Campaign[]>}
   */
  async findByCoordinatorId(coordinatorId) {
    const results = await this.db
      .prepare('SELECT * FROM acquisition_campaigns WHERE coordinator_id = ? ORDER BY planned_start_datetime DESC')
      .bind(coordinatorId)
      .all();

    return results.results.map(row => this.mapToEntity(row));
  }

  /**
   * Find campaigns by participant
   * @param {number} userId
   * @returns {Promise<Campaign[]>}
   */
  async findByParticipant(userId) {
    // Search in JSON array for participant
    const results = await this.db
      .prepare(`
        SELECT * FROM acquisition_campaigns
        WHERE participants_json LIKE ?
        ORDER BY planned_start_datetime DESC
      `)
      .bind(`%${userId}%`)
      .all();

    // Filter results to ensure exact match in JSON array
    return results.results
      .filter(row => {
        const participants = row.participants_json ? JSON.parse(row.participants_json) : [];
        return participants.includes(userId);
      })
      .map(row => this.mapToEntity(row));
  }

  /**
   * Find active campaigns
   * @returns {Promise<Campaign[]>}
   */
  async findActiveCampaigns() {
    return await this.findByStatus('active');
  }

  /**
   * Find campaigns within date range
   * @param {string} startDate
   * @param {string} endDate
   * @returns {Promise<Campaign[]>}
   */
  async findByDateRange(startDate, endDate) {
    const results = await this.db
      .prepare(`
        SELECT * FROM acquisition_campaigns
        WHERE planned_start_datetime >= ? AND planned_start_datetime <= ?
        ORDER BY planned_start_datetime
      `)
      .bind(startDate, endDate)
      .all();

    return results.results.map(row => this.mapToEntity(row));
  }

  /**
   * Find ongoing campaigns
   * @returns {Promise<Campaign[]>}
   */
  async findOngoingCampaigns() {
    const now = new Date().toISOString();
    const results = await this.db
      .prepare(`
        SELECT * FROM acquisition_campaigns
        WHERE status = 'active'
        AND planned_start_datetime <= ?
        AND (planned_end_datetime IS NULL OR planned_end_datetime >= ?)
        ORDER BY planned_start_datetime
      `)
      .bind(now, now)
      .all();

    return results.results.map(row => this.mapToEntity(row));
  }

  /**
   * Find all campaigns
   * @returns {Promise<Campaign[]>}
   */
  async findAll() {
    const results = await this.db
      .prepare('SELECT * FROM acquisition_campaigns ORDER BY planned_start_datetime DESC')
      .all();

    return results.results.map(row => this.mapToEntity(row));
  }

  /**
   * Save campaign (insert or update)
   * @param {Campaign} campaign
   * @returns {Promise<Campaign>}
   */
  async save(campaign) {
    const now = new Date().toISOString();
    const participantsJson = JSON.stringify(campaign.participants || []);
    const objectivesJson = JSON.stringify(campaign.objectives || []);
    const expectedOutcomesJson = JSON.stringify(campaign.expectedOutcomes || []);
    const metadataJson = JSON.stringify(campaign.metadata || {});

    if (campaign.id) {
      // Update existing
      await this.db
        .prepare(`
          UPDATE acquisition_campaigns SET
            campaign_name = ?,
            description = ?,
            campaign_type_v11 = ?,
            planned_start_datetime = ?,
            planned_end_datetime = ?,
            status = ?,
            platform_id = ?,
            aoi_id = ?,
            coordinator_id = ?,
            participants_json = ?,
            objectives_json = ?,
            expected_outcomes_json = ?,
            funding_source = ?,
            budget = ?,
            metadata_json = ?,
            updated_at = ?
          WHERE id = ?
        `)
        .bind(
          campaign.name,
          campaign.description,
          campaign.campaignType,
          campaign.startDate,
          campaign.endDate,
          campaign.status,
          campaign.platformId,
          campaign.aoiId,
          campaign.coordinatorId,
          participantsJson,
          objectivesJson,
          expectedOutcomesJson,
          campaign.fundingSource,
          campaign.budget,
          metadataJson,
          now,
          campaign.id
        )
        .run();

      return await this.findById(campaign.id);
    } else {
      // Insert new
      const result = await this.db
        .prepare(`
          INSERT INTO acquisition_campaigns (
            station_id, campaign_name, description,
            campaign_type_v11, planned_start_datetime, planned_end_datetime,
            status, platform_id, aoi_id, coordinator_id,
            participants_json, objectives_json, expected_outcomes_json,
            funding_source, budget, metadata_json,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          campaign.stationId,
          campaign.name,
          campaign.description,
          campaign.campaignType,
          campaign.startDate,
          campaign.endDate,
          campaign.status,
          campaign.platformId,
          campaign.aoiId,
          campaign.coordinatorId,
          participantsJson,
          objectivesJson,
          expectedOutcomesJson,
          campaign.fundingSource,
          campaign.budget,
          metadataJson,
          now,
          now
        )
        .run();

      return await this.findById(result.meta.last_row_id);
    }
  }

  /**
   * Delete campaign by ID
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  async deleteById(id) {
    const result = await this.db
      .prepare('DELETE FROM acquisition_campaigns WHERE id = ?')
      .bind(id)
      .run();

    return result.meta.changes > 0;
  }

  /**
   * Count campaigns for a station
   * @param {number} stationId
   * @returns {Promise<number>}
   */
  async countByStationId(stationId) {
    const result = await this.db
      .prepare('SELECT COUNT(*) as count FROM acquisition_campaigns WHERE station_id = ?')
      .bind(stationId)
      .first();

    return result?.count || 0;
  }

  /**
   * Check if campaign exists by ID
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  async existsById(id) {
    const result = await this.db
      .prepare('SELECT 1 FROM acquisition_campaigns WHERE id = ?')
      .bind(id)
      .first();

    return !!result;
  }
}
