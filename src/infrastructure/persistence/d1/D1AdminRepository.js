/**
 * D1 Admin Repository
 *
 * Cloudflare D1 implementation of AdminRepository.
 *
 * @module infrastructure/persistence/d1/D1AdminRepository
 */

import { AdminRepository } from '../../../domain/admin/AdminRepository.js';
import {
  ActivityLog,
  UserSessionSummary,
  StationActivityStats
} from '../../../domain/admin/ActivityLog.js';

export class D1AdminRepository extends AdminRepository {
  /**
   * @param {D1Database} db - Cloudflare D1 database instance
   */
  constructor(db) {
    super();
    this.db = db;
  }

  /**
   * Get activity logs with filtering and pagination
   */
  async getActivityLogs(options = {}) {
    const {
      stationId,
      userId,
      action,
      entityType,
      startDate,
      endDate,
      limit = 100,
      offset = 0
    } = options;

    // Build WHERE clauses
    const conditions = [];
    const params = [];

    if (stationId) {
      conditions.push('al.entity_id = ? AND al.entity_type = ?');
      params.push(stationId, 'station');
    }

    if (userId) {
      conditions.push('al.user_id = ?');
      params.push(userId);
    }

    if (action) {
      conditions.push('al.action = ?');
      params.push(action.toLowerCase());
    }

    if (entityType) {
      conditions.push('al.entity_type = ?');
      params.push(entityType.toLowerCase());
    }

    if (startDate) {
      conditions.push('al.created_at >= ?');
      params.push(startDate.toISOString());
    }

    if (endDate) {
      conditions.push('al.created_at <= ?');
      params.push(endDate.toISOString());
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM activity_log al
      ${whereClause}
    `;

    const countResult = await this.db
      .prepare(countQuery)
      .bind(...params)
      .first();

    const total = countResult?.total || 0;

    // Get paginated results with station info
    const dataQuery = `
      SELECT
        al.id,
        al.user_id,
        al.username,
        al.action,
        al.entity_type,
        al.entity_id,
        al.entity_name,
        al.details,
        al.ip_address,
        al.user_agent,
        al.created_at,
        CASE
          WHEN al.entity_type = 'station' THEN al.entity_id
          WHEN al.entity_type = 'platform' THEN p.station_id
          WHEN al.entity_type = 'instrument' THEN p2.station_id
          ELSE NULL
        END as station_id,
        CASE
          WHEN al.entity_type = 'station' THEN s.acronym
          WHEN al.entity_type = 'platform' THEN s2.acronym
          WHEN al.entity_type = 'instrument' THEN s3.acronym
          ELSE NULL
        END as station_acronym
      FROM activity_log al
      LEFT JOIN stations s ON al.entity_type = 'station' AND al.entity_id = s.id
      LEFT JOIN platforms p ON al.entity_type = 'platform' AND al.entity_id = p.id
      LEFT JOIN stations s2 ON p.station_id = s2.id
      LEFT JOIN instruments i ON al.entity_type = 'instrument' AND al.entity_id = i.id
      LEFT JOIN platforms p2 ON i.platform_id = p2.id
      LEFT JOIN stations s3 ON p2.station_id = s3.id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const dataResult = await this.db
      .prepare(dataQuery)
      .bind(...params, limit, offset)
      .all();

    const items = (dataResult.results || []).map(row => ActivityLog.fromRow(row));

    return { items, total };
  }

  /**
   * Get user session summaries (login history)
   */
  async getUserSessions(options = {}) {
    const { includeInactive = false } = options;

    const query = `
      SELECT
        u.id,
        u.username,
        u.role,
        u.station_id,
        u.active,
        s.acronym as station_acronym,
        MAX(CASE WHEN al.action = 'login' THEN al.created_at ELSE NULL END) as last_login,
        COUNT(CASE WHEN al.action = 'login' THEN 1 ELSE NULL END) as login_count
      FROM users u
      LEFT JOIN stations s ON u.station_id = s.id
      LEFT JOIN activity_log al ON al.user_id = u.id
      ${includeInactive ? '' : 'WHERE u.active = 1'}
      GROUP BY u.id, u.username, u.role, u.station_id, u.active, s.acronym
      ORDER BY last_login DESC NULLS LAST, u.username ASC
    `;

    const result = await this.db.prepare(query).all();

    return (result.results || []).map(row => UserSessionSummary.fromRow(row));
  }

  /**
   * Get station activity statistics
   */
  async getStationStats(options = {}) {
    const { startDate, endDate } = options;

    // Build date filter
    let dateFilter = '';
    const params = [];

    if (startDate || endDate) {
      const conditions = [];
      if (startDate) {
        conditions.push('al.created_at >= ?');
        params.push(startDate.toISOString());
      }
      if (endDate) {
        conditions.push('al.created_at <= ?');
        params.push(endDate.toISOString());
      }
      dateFilter = `AND ${conditions.join(' AND ')}`;
    }

    const query = `
      SELECT
        s.id as station_id,
        s.acronym,
        s.display_name,
        COUNT(al.id) as total_activity,
        SUM(CASE WHEN al.action = 'create' THEN 1 ELSE 0 END) as create_count,
        SUM(CASE WHEN al.action = 'update' THEN 1 ELSE 0 END) as update_count,
        SUM(CASE WHEN al.action = 'delete' THEN 1 ELSE 0 END) as delete_count,
        MAX(al.created_at) as last_activity,
        COUNT(DISTINCT al.user_id) as unique_users
      FROM stations s
      LEFT JOIN (
        SELECT
          al.*,
          CASE
            WHEN al.entity_type = 'station' THEN al.entity_id
            WHEN al.entity_type = 'platform' THEN p.station_id
            WHEN al.entity_type = 'instrument' THEN p2.station_id
            ELSE NULL
          END as derived_station_id
        FROM activity_log al
        LEFT JOIN platforms p ON al.entity_type = 'platform' AND al.entity_id = p.id
        LEFT JOIN instruments i ON al.entity_type = 'instrument' AND al.entity_id = i.id
        LEFT JOIN platforms p2 ON i.platform_id = p2.id
        WHERE 1=1 ${dateFilter}
      ) al ON al.derived_station_id = s.id
      GROUP BY s.id, s.acronym, s.display_name
      ORDER BY total_activity DESC, s.acronym ASC
    `;

    const result = await this.db
      .prepare(query)
      .bind(...params)
      .all();

    return (result.results || []).map(row => StationActivityStats.fromRow(row));
  }

  /**
   * Log an activity
   */
  async logActivity(data) {
    const {
      userId,
      username,
      action,
      entityType,
      entityId,
      entityName,
      details,
      ipAddress,
      userAgent
    } = data;

    const query = `
      INSERT INTO activity_log (
        user_id, username, action, entity_type, entity_id, entity_name,
        details, ip_address, user_agent, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `;

    const detailsJson = details ? JSON.stringify(details) : null;

    const result = await this.db
      .prepare(query)
      .bind(
        userId || null,
        username || null,
        action,
        entityType,
        entityId || null,
        entityName || null,
        detailsJson,
        ipAddress || null,
        userAgent || null
      )
      .run();

    // Fetch the created record
    if (result.meta?.last_row_id) {
      const created = await this.db
        .prepare('SELECT * FROM activity_log WHERE id = ?')
        .bind(result.meta.last_row_id)
        .first();

      if (created) {
        return ActivityLog.fromRow(created);
      }
    }

    // Return a minimal object if we couldn't fetch
    return new ActivityLog({
      id: result.meta?.last_row_id,
      userId,
      username,
      action,
      entityType,
      entityId,
      entityName,
      details,
      ipAddress,
      userAgent,
      createdAt: new Date()
    });
  }

  /**
   * Get system health metrics
   */
  async getSystemHealth() {
    // Get counts from various tables
    const countsQuery = `
      SELECT
        (SELECT COUNT(*) FROM stations) as station_count,
        (SELECT COUNT(*) FROM platforms) as platform_count,
        (SELECT COUNT(*) FROM instruments) as instrument_count,
        (SELECT COUNT(*) FROM users WHERE active = 1) as active_user_count,
        (SELECT COUNT(*) FROM activity_log WHERE created_at >= datetime('now', '-24 hours')) as activity_24h,
        (SELECT COUNT(*) FROM activity_log WHERE created_at >= datetime('now', '-7 days')) as activity_7d
    `;

    const counts = await this.db.prepare(countsQuery).first();

    return {
      status: 'healthy',
      database: 'connected',
      version: '10.0.0-alpha.6',
      architecture: 'Hexagonal',
      counts: {
        stations: counts?.station_count || 0,
        platforms: counts?.platform_count || 0,
        instruments: counts?.instrument_count || 0,
        activeUsers: counts?.active_user_count || 0
      },
      activity: {
        last24Hours: counts?.activity_24h || 0,
        last7Days: counts?.activity_7d || 0
      },
      timestamp: new Date().toISOString()
    };
  }
}
