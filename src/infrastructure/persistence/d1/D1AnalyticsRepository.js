/**
 * D1 Analytics Repository Adapter
 *
 * Cloudflare D1 implementation of AnalyticsRepository port.
 *
 * Following Hexagonal Architecture:
 * - This is an ADAPTER implementing the domain port
 * - Contains all D1/SQL-specific code
 *
 * @module infrastructure/persistence/d1/D1AnalyticsRepository
 */

import { AnalyticsRepository } from '../../../domain/analytics/AnalyticsRepository.js';

export class D1AnalyticsRepository extends AnalyticsRepository {
  /**
   * @param {D1Database} db - Cloudflare D1 database binding
   */
  constructor(db) {
    super();
    this.db = db;
  }

  /**
   * Get total counts for all entities
   * @returns {Promise<{stations: number, platforms: number, instruments: number, rois: number}>}
   */
  async getTotalCounts() {
    const [stations, platforms, instruments, rois] = await Promise.all([
      this.db.prepare('SELECT COUNT(*) as count FROM stations').first(),
      this.db.prepare('SELECT COUNT(*) as count FROM platforms').first(),
      this.db.prepare('SELECT COUNT(*) as count FROM instruments').first(),
      this.db.prepare('SELECT COUNT(*) as count FROM instrument_rois').first()
    ]);

    return {
      stations: stations?.count || 0,
      platforms: platforms?.count || 0,
      instruments: instruments?.count || 0,
      rois: rois?.count || 0
    };
  }

  /**
   * Get status breakdown for an entity type
   * @param {string} entityType - 'stations', 'platforms', or 'instruments'
   * @returns {Promise<Array<{status: string, count: number}>>}
   */
  async getStatusBreakdown(entityType) {
    const validTables = ['stations', 'platforms', 'instruments'];
    if (!validTables.includes(entityType)) {
      throw new Error(`Invalid entity type: ${entityType}`);
    }

    const result = await this.db.prepare(`
      SELECT status, COUNT(*) as count
      FROM ${entityType}
      GROUP BY status
    `).all();

    return result?.results || [];
  }

  /**
   * Get instrument type distribution
   * @returns {Promise<Array<{instrument_type: string, count: number}>>}
   */
  async getInstrumentTypeDistribution() {
    const result = await this.db.prepare(`
      SELECT instrument_type, COUNT(*) as count
      FROM instruments
      GROUP BY instrument_type
    `).all();

    return result?.results || [];
  }

  /**
   * Get ecosystem distribution
   * @returns {Promise<Array<{ecosystem_code: string, count: number}>>}
   */
  async getEcosystemDistribution() {
    const result = await this.db.prepare(`
      SELECT ecosystem_code, COUNT(*) as count
      FROM instruments
      GROUP BY ecosystem_code
    `).all();

    return result?.results || [];
  }

  /**
   * Get deployment timeline by year
   * @returns {Promise<Array<{year: string, count: number}>>}
   */
  async getDeploymentTimeline() {
    const result = await this.db.prepare(`
      SELECT
        strftime('%Y', deployment_date) as year,
        COUNT(*) as count
      FROM instruments
      WHERE deployment_date IS NOT NULL
      GROUP BY year
      ORDER BY year ASC
    `).all();

    return result?.results || [];
  }

  /**
   * Get recent activity from activity log
   * @param {number} days - Number of days to look back
   * @returns {Promise<Array<{action: string, count: number}>>}
   */
  async getRecentActivity(days = 7) {
    try {
      const result = await this.db.prepare(`
        SELECT action, COUNT(*) as count
        FROM activity_log
        WHERE created_at >= datetime('now', '-${days} days')
        GROUP BY action
        ORDER BY count DESC
        LIMIT 10
      `).all();

      return result?.results || [];
    } catch (e) {
      // Activity log table may not exist yet
      console.log('Activity log not available');
      return [];
    }
  }

  /**
   * Get stations with entity counts
   * @returns {Promise<Array>}
   */
  async getStationsWithCounts() {
    const result = await this.db.prepare(`
      SELECT
        s.id,
        s.normalized_name,
        s.display_name,
        s.acronym,
        s.status,
        s.country,
        s.latitude,
        s.longitude,
        s.elevation_m,
        COUNT(DISTINCT p.id) as platform_count,
        COUNT(DISTINCT i.id) as instrument_count,
        COUNT(DISTINCT r.id) as roi_count
      FROM stations s
      LEFT JOIN platforms p ON s.id = p.station_id
      LEFT JOIN instruments i ON p.id = i.platform_id
      LEFT JOIN instrument_rois r ON i.id = r.instrument_id
      GROUP BY s.id, s.normalized_name, s.display_name, s.acronym,
               s.status, s.country, s.latitude, s.longitude, s.elevation_m
      ORDER BY s.display_name ASC
    `).all();

    return result?.results || [];
  }

  /**
   * Get instrument deployment trends
   * @param {number} months - Number of months to look back
   * @returns {Promise<Array<{month: string, instrument_type: string, count: number}>>}
   */
  async getDeploymentTrends(months = 24) {
    const result = await this.db.prepare(`
      SELECT
        strftime('%Y-%m', deployment_date) as month,
        instrument_type,
        COUNT(*) as count
      FROM instruments
      WHERE deployment_date IS NOT NULL
      GROUP BY month, instrument_type
      ORDER BY month DESC
      LIMIT ?
    `).bind(months).all();

    return result?.results || [];
  }

  /**
   * Get camera brand distribution
   * @returns {Promise<Array<{camera_brand: string, count: number}>>}
   */
  async getCameraBrandDistribution() {
    const result = await this.db.prepare(`
      SELECT camera_brand, COUNT(*) as count
      FROM instruments
      WHERE camera_brand IS NOT NULL AND camera_brand != ''
      GROUP BY camera_brand
      ORDER BY count DESC
    `).all();

    return result?.results || [];
  }

  /**
   * Get camera model distribution
   * @param {number} limit - Maximum number of results
   * @returns {Promise<Array<{camera_model: string, camera_brand: string, count: number}>>}
   */
  async getCameraModelDistribution(limit = 10) {
    const result = await this.db.prepare(`
      SELECT camera_model, camera_brand, COUNT(*) as count
      FROM instruments
      WHERE camera_model IS NOT NULL AND camera_model != ''
      GROUP BY camera_model, camera_brand
      ORDER BY count DESC
      LIMIT ?
    `).bind(limit).all();

    return result?.results || [];
  }

  /**
   * Get measurement status distribution
   * @returns {Promise<Array<{measurement_status: string, count: number}>>}
   */
  async getMeasurementStatusDistribution() {
    const result = await this.db.prepare(`
      SELECT measurement_status, COUNT(*) as count
      FROM instruments
      GROUP BY measurement_status
    `).all();

    return result?.results || [];
  }

  /**
   * Get instrument height distribution
   * @returns {Promise<Array<{height_range: string, count: number}>>}
   */
  async getHeightDistribution() {
    const result = await this.db.prepare(`
      SELECT
        CASE
          WHEN instrument_height_m < 2 THEN '0-2m'
          WHEN instrument_height_m >= 2 AND instrument_height_m < 5 THEN '2-5m'
          WHEN instrument_height_m >= 5 AND instrument_height_m < 10 THEN '5-10m'
          WHEN instrument_height_m >= 10 AND instrument_height_m < 20 THEN '10-20m'
          WHEN instrument_height_m >= 20 THEN '20m+'
          ELSE 'Unknown'
        END as height_range,
        COUNT(*) as count
      FROM instruments
      GROUP BY height_range
      ORDER BY
        CASE height_range
          WHEN '0-2m' THEN 1
          WHEN '2-5m' THEN 2
          WHEN '5-10m' THEN 3
          WHEN '10-20m' THEN 4
          WHEN '20m+' THEN 5
          ELSE 6
        END
    `).all();

    return result?.results || [];
  }

  /**
   * Get ROI statistics by instrument type
   * @returns {Promise<Array<{instrument_type: string, total_rois: number, percent_with_rois: number}>>}
   */
  async getROIStatistics() {
    const result = await this.db.prepare(`
      SELECT
        i.instrument_type,
        COUNT(DISTINCT r.id) as total_rois,
        AVG(CASE WHEN r.roi_name IS NOT NULL THEN 1.0 ELSE 0.0 END) * 100 as percent_with_rois
      FROM instruments i
      LEFT JOIN instrument_rois r ON i.id = r.instrument_id
      GROUP BY i.instrument_type
    `).all();

    return result?.results || [];
  }

  /**
   * Get activity log entries
   * @param {number} limit - Maximum number of entries
   * @returns {Promise<Array>}
   */
  async getActivityLog(limit = 50) {
    try {
      const result = await this.db.prepare(`
        SELECT
          action,
          resource_type,
          resource_id,
          details,
          ip_address,
          created_at
        FROM activity_log
        ORDER BY created_at DESC
        LIMIT ?
      `).bind(limit).all();

      return result?.results || [];
    } catch (e) {
      console.log('Activity log not available:', e.message);
      return [];
    }
  }

  /**
   * Get activity by day
   * @param {number} days - Number of days to look back
   * @returns {Promise<Array<{date: string, count: number}>>}
   */
  async getActivityByDay(days = 30) {
    try {
      const result = await this.db.prepare(`
        SELECT
          date(created_at) as date,
          COUNT(*) as count
        FROM activity_log
        WHERE created_at >= datetime('now', '-${days} days')
        GROUP BY date
        ORDER BY date DESC
      `).all();

      return result?.results || [];
    } catch (e) {
      console.log('Activity log not available:', e.message);
      return [];
    }
  }

  /**
   * Get activity by type
   * @param {number} days - Number of days to look back
   * @returns {Promise<Array<{action: string, count: number}>>}
   */
  async getActivityByType(days = 30) {
    try {
      const result = await this.db.prepare(`
        SELECT
          action,
          COUNT(*) as count
        FROM activity_log
        WHERE created_at >= datetime('now', '-${days} days')
        GROUP BY action
        ORDER BY count DESC
      `).all();

      return result?.results || [];
    } catch (e) {
      console.log('Activity log not available:', e.message);
      return [];
    }
  }

  /**
   * Get entity creation timeline
   * @param {number} limit - Maximum number of entries
   * @returns {Promise<Array<{entity_type: string, created_at: string}>>}
   */
  async getEntityTimeline(limit = 100) {
    const result = await this.db.prepare(`
      SELECT 'station' as entity_type, created_at FROM stations
      UNION ALL
      SELECT 'platform' as entity_type, created_at FROM platforms
      UNION ALL
      SELECT 'instrument' as entity_type, created_at FROM instruments
      UNION ALL
      SELECT 'roi' as entity_type, created_at FROM instrument_rois
      ORDER BY created_at DESC
      LIMIT ?
    `).bind(limit).all();

    return result?.results || [];
  }

  /**
   * Check database connectivity
   * @returns {Promise<boolean>}
   */
  async checkDatabaseHealth() {
    try {
      const dbCheck = await this.db.prepare('SELECT 1 as test').first();
      return dbCheck && dbCheck.test === 1;
    } catch (e) {
      return false;
    }
  }

  /**
   * Get health issues counts
   * @returns {Promise<Object>}
   */
  async getHealthIssues() {
    const [
      stationsNoCoords,
      platformsNoCoords,
      instrumentsNoDeploymentDate,
      instrumentsNoHeight,
      instrumentsNoROIs
    ] = await Promise.all([
      this.db.prepare(`
        SELECT COUNT(*) as count FROM stations
        WHERE latitude IS NULL OR longitude IS NULL
      `).first(),
      this.db.prepare(`
        SELECT COUNT(*) as count FROM platforms
        WHERE latitude IS NULL OR longitude IS NULL
      `).first(),
      this.db.prepare(`
        SELECT COUNT(*) as count FROM instruments
        WHERE deployment_date IS NULL
      `).first(),
      this.db.prepare(`
        SELECT COUNT(*) as count FROM instruments
        WHERE instrument_height_m IS NULL
      `).first(),
      this.db.prepare(`
        SELECT COUNT(DISTINCT i.id) as count
        FROM instruments i
        LEFT JOIN instrument_rois r ON i.id = r.instrument_id
        WHERE r.id IS NULL
      `).first()
    ]);

    return {
      stationsNoCoordinates: stationsNoCoords?.count || 0,
      platformsNoCoordinates: platformsNoCoords?.count || 0,
      instrumentsNoDeploymentDate: instrumentsNoDeploymentDate?.count || 0,
      instrumentsNoHeight: instrumentsNoHeight?.count || 0,
      instrumentsNoROIs: instrumentsNoROIs?.count || 0
    };
  }
}
