/**
 * D1 Mission Repository
 *
 * Cloudflare D1 implementation of MissionRepository.
 * Adapts the domain port to the D1 database.
 *
 * @module infrastructure/persistence/d1/D1MissionRepository
 */

import { Mission } from '../../../domain/uav/index.js';

/**
 * D1 Mission Repository Adapter
 */
export class D1MissionRepository {
  /**
   * @param {D1Database} db - Cloudflare D1 database instance
   */
  constructor(db) {
    this.db = db;
  }

  /**
   * Find mission by ID
   * @param {number} id
   * @returns {Promise<Mission|null>}
   */
  async findById(id) {
    const result = await this.db
      .prepare(`
        SELECT m.*, s.acronym as station_acronym
        FROM uav_missions m
        LEFT JOIN stations s ON m.station_id = s.id
        WHERE m.id = ?
      `)
      .bind(id)
      .first();

    return result ? Mission.fromRecord(result) : null;
  }

  /**
   * Find mission by mission code
   * @param {string} missionCode
   * @returns {Promise<Mission|null>}
   */
  async findByMissionCode(missionCode) {
    if (!missionCode || typeof missionCode !== 'string') {
      return null;
    }
    const result = await this.db
      .prepare(`
        SELECT m.*, s.acronym as station_acronym
        FROM uav_missions m
        LEFT JOIN stations s ON m.station_id = s.id
        WHERE m.mission_code = ?
      `)
      .bind(missionCode.toUpperCase())
      .first();

    return result ? Mission.fromRecord(result) : null;
  }

  /**
   * Find missions by station ID
   * @param {number} stationId
   * @param {Object} options
   * @returns {Promise<Mission[]>}
   */
  async findByStationId(stationId, options = {}) {
    const { status, limit = 100, offset = 0 } = options;

    let whereClause = 'WHERE m.station_id = ?';
    const bindings = [stationId];

    if (status) {
      whereClause += ' AND m.status = ?';
      bindings.push(status);
    }

    const results = await this.db
      .prepare(`
        SELECT m.*, s.acronym as station_acronym
        FROM uav_missions m
        LEFT JOIN stations s ON m.station_id = s.id
        ${whereClause}
        ORDER BY m.planned_date DESC, m.created_at DESC
        LIMIT ? OFFSET ?
      `)
      .bind(...bindings, limit, offset)
      .all();

    return results.results.map(row => Mission.fromRecord(row));
  }

  /**
   * Find missions by status
   * @param {string} status
   * @param {Object} options
   * @returns {Promise<Mission[]>}
   */
  async findByStatus(status, options = {}) {
    const { limit = 100, offset = 0 } = options;

    const results = await this.db
      .prepare(`
        SELECT m.*, s.acronym as station_acronym
        FROM uav_missions m
        LEFT JOIN stations s ON m.station_id = s.id
        WHERE m.status = ?
        ORDER BY m.planned_date DESC
        LIMIT ? OFFSET ?
      `)
      .bind(status, limit, offset)
      .all();

    return results.results.map(row => Mission.fromRecord(row));
  }

  /**
   * Find missions by date range
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @param {Object} options
   * @returns {Promise<Mission[]>}
   */
  async findByDateRange(startDate, endDate, options = {}) {
    const { stationId, limit = 100, offset = 0 } = options;

    let whereClause = 'WHERE m.planned_date BETWEEN ? AND ?';
    const bindings = [startDate, endDate];

    if (stationId) {
      whereClause += ' AND m.station_id = ?';
      bindings.push(stationId);
    }

    const results = await this.db
      .prepare(`
        SELECT m.*, s.acronym as station_acronym
        FROM uav_missions m
        LEFT JOIN stations s ON m.station_id = s.id
        ${whereClause}
        ORDER BY m.planned_date ASC
        LIMIT ? OFFSET ?
      `)
      .bind(...bindings, limit, offset)
      .all();

    return results.results.map(row => Mission.fromRecord(row));
  }

  /**
   * Find missions needing approval
   * @returns {Promise<Mission[]>}
   */
  async findPendingApproval() {
    const results = await this.db
      .prepare(`
        SELECT m.*, s.acronym as station_acronym
        FROM uav_missions m
        LEFT JOIN stations s ON m.station_id = s.id
        WHERE m.status = 'planned' AND m.approved_at IS NULL
        ORDER BY m.planned_date ASC
      `)
      .all();

    return results.results.map(row => Mission.fromRecord(row));
  }

  /**
   * Find all missions with pagination and filtering
   * @param {Object} options
   * @returns {Promise<{items: Mission[], total: number}>}
   */
  async findAll(options = {}) {
    const {
      limit = 100,
      offset = 0,
      stationId,
      status,
      sortBy = 'planned_date',
      sortOrder = 'desc'
    } = options;

    // Whitelist allowed sort columns
    const allowedSortColumns = ['id', 'mission_code', 'planned_date', 'status', 'created_at', 'updated_at'];
    const safeSort = allowedSortColumns.includes(sortBy) ? sortBy : 'planned_date';
    const safeOrder = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    let whereClause = '';
    const bindings = [];
    const conditions = [];

    if (stationId) {
      conditions.push('m.station_id = ?');
      bindings.push(stationId);
    }

    if (status) {
      conditions.push('m.status = ?');
      bindings.push(status);
    }

    if (conditions.length > 0) {
      whereClause = 'WHERE ' + conditions.join(' AND ');
    }

    // Get total count
    const countResult = await this.db
      .prepare(`SELECT COUNT(*) as count FROM uav_missions m ${whereClause}`)
      .bind(...bindings)
      .first();

    // Get paginated results
    const results = await this.db
      .prepare(`
        SELECT m.*, s.acronym as station_acronym
        FROM uav_missions m
        LEFT JOIN stations s ON m.station_id = s.id
        ${whereClause}
        ORDER BY m.${safeSort} ${safeOrder}
        LIMIT ? OFFSET ?
      `)
      .bind(...bindings, limit, offset)
      .all();

    return {
      items: results.results.map(row => Mission.fromRecord(row)),
      total: countResult?.count || 0
    };
  }

  /**
   * Count total missions
   * @param {Object} [filter] - Optional filter
   * @returns {Promise<number>}
   */
  async count(filter = {}) {
    const conditions = [];
    const bindings = [];

    if (filter.stationId) {
      conditions.push('station_id = ?');
      bindings.push(filter.stationId);
    }

    if (filter.status) {
      conditions.push('status = ?');
      bindings.push(filter.status);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const result = await this.db
      .prepare(`SELECT COUNT(*) as count FROM uav_missions ${whereClause}`)
      .bind(...bindings)
      .first();

    return result?.count || 0;
  }

  /**
   * Get next sequence number for a station on a date
   * @param {string} stationAcronym
   * @param {string} date - Date (YYYY-MM-DD)
   * @returns {Promise<number>}
   */
  async getNextSequenceNumber(stationAcronym, date) {
    const result = await this.db
      .prepare(`
        SELECT COUNT(*) as count FROM uav_missions
        WHERE mission_code LIKE ?
      `)
      .bind(`${stationAcronym.toUpperCase()}_${date}_%`)
      .first();

    return (result?.count || 0) + 1;
  }

  /**
   * Save mission (insert or update)
   * @param {Mission} mission
   * @returns {Promise<Mission>}
   */
  async save(mission) {
    const data = mission.toRecord();
    const now = new Date().toISOString();

    if (mission.id) {
      // Update existing
      await this.db
        .prepare(`
          UPDATE uav_missions SET
            mission_code = ?,
            display_name = ?,
            station_id = ?,
            platform_id = ?,
            planned_date = ?,
            planned_start_time = ?,
            planned_end_time = ?,
            planned_area_hectares = ?,
            planned_altitude_m = ?,
            planned_flight_pattern = ?,
            planned_overlap_side = ?,
            planned_overlap_front = ?,
            objectives = ?,
            target_products = ?,
            status = ?,
            actual_start_time = ?,
            actual_end_time = ?,
            weather_conditions = ?,
            weather_source = ?,
            flight_area_geojson = ?,
            approved_by_user_id = ?,
            approved_at = ?,
            approval_notes = ?,
            data_collected_gb = ?,
            images_captured = ?,
            coverage_achieved_percent = ?,
            quality_score = ?,
            notes = ?,
            updated_at = ?
          WHERE id = ?
        `)
        .bind(
          data.mission_code,
          data.display_name,
          data.station_id,
          data.platform_id,
          data.planned_date,
          data.planned_start_time,
          data.planned_end_time,
          data.planned_area_hectares,
          data.planned_altitude_m,
          data.planned_flight_pattern,
          data.planned_overlap_side,
          data.planned_overlap_front,
          data.objectives,
          data.target_products,
          data.status,
          data.actual_start_time,
          data.actual_end_time,
          data.weather_conditions,
          data.weather_source,
          data.flight_area_geojson,
          data.approved_by_user_id,
          data.approved_at,
          data.approval_notes,
          data.data_collected_gb,
          data.images_captured,
          data.coverage_achieved_percent,
          data.quality_score,
          data.notes,
          now,
          mission.id
        )
        .run();

      return await this.findById(mission.id);
    } else {
      // Insert new
      const result = await this.db
        .prepare(`
          INSERT INTO uav_missions (
            mission_code, display_name, station_id, platform_id,
            planned_date, planned_start_time, planned_end_time,
            planned_area_hectares, planned_altitude_m, planned_flight_pattern,
            planned_overlap_side, planned_overlap_front,
            objectives, target_products, status,
            actual_start_time, actual_end_time,
            weather_conditions, weather_source, flight_area_geojson,
            approved_by_user_id, approved_at, approval_notes,
            data_collected_gb, images_captured, coverage_achieved_percent, quality_score,
            notes, created_by_user_id, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          data.mission_code,
          data.display_name,
          data.station_id,
          data.platform_id,
          data.planned_date,
          data.planned_start_time,
          data.planned_end_time,
          data.planned_area_hectares,
          data.planned_altitude_m,
          data.planned_flight_pattern,
          data.planned_overlap_side,
          data.planned_overlap_front,
          data.objectives,
          data.target_products,
          data.status,
          data.actual_start_time,
          data.actual_end_time,
          data.weather_conditions,
          data.weather_source,
          data.flight_area_geojson,
          data.approved_by_user_id,
          data.approved_at,
          data.approval_notes,
          data.data_collected_gb,
          data.images_captured,
          data.coverage_achieved_percent,
          data.quality_score,
          data.notes,
          data.created_by_user_id,
          now,
          now
        )
        .run();

      return await this.findById(result.meta.last_row_id);
    }
  }

  /**
   * Delete mission by ID
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    const result = await this.db
      .prepare('DELETE FROM uav_missions WHERE id = ?')
      .bind(id)
      .run();

    return result.meta.changes > 0;
  }

  /**
   * Get pilots assigned to a mission
   * @param {number} missionId
   * @returns {Promise<Array>}
   */
  async getMissionPilots(missionId) {
    const results = await this.db
      .prepare(`
        SELECT mp.*, p.full_name, p.email, p.status as pilot_status
        FROM mission_pilots mp
        JOIN uav_pilots p ON mp.pilot_id = p.id
        WHERE mp.mission_id = ?
        ORDER BY mp.role, p.full_name
      `)
      .bind(missionId)
      .all();

    return results.results;
  }

  /**
   * Add pilot to mission
   * @param {number} missionId
   * @param {number} pilotId
   * @param {string} [role='pilot']
   * @param {number} [assignedByUserId]
   * @returns {Promise<boolean>}
   */
  async addPilotToMission(missionId, pilotId, role = 'pilot', assignedByUserId = null) {
    const now = new Date().toISOString();

    try {
      await this.db
        .prepare(`
          INSERT INTO mission_pilots (mission_id, pilot_id, role, assigned_at, assigned_by_user_id)
          VALUES (?, ?, ?, ?, ?)
        `)
        .bind(missionId, pilotId, role, now, assignedByUserId)
        .run();
      return true;
    } catch (error) {
      // Handle unique constraint violation (pilot already assigned)
      if (error.message.includes('UNIQUE constraint failed')) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Remove pilot from mission
   * @param {number} missionId
   * @param {number} pilotId
   * @returns {Promise<boolean>}
   */
  async removePilotFromMission(missionId, pilotId) {
    const result = await this.db
      .prepare('DELETE FROM mission_pilots WHERE mission_id = ? AND pilot_id = ?')
      .bind(missionId, pilotId)
      .run();

    return result.meta.changes > 0;
  }
}
