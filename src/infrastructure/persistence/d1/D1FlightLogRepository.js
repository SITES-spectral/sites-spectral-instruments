/**
 * D1 Flight Log Repository
 *
 * Cloudflare D1 implementation of FlightLogRepository.
 * Adapts the domain port to the D1 database.
 *
 * @module infrastructure/persistence/d1/D1FlightLogRepository
 */

import { FlightLog } from '../../../domain/uav/index.js';

/**
 * D1 Flight Log Repository Adapter
 */
export class D1FlightLogRepository {
  /**
   * @param {D1Database} db - Cloudflare D1 database instance
   */
  constructor(db) {
    this.db = db;
  }

  /**
   * Find flight log by ID
   * @param {number} id
   * @returns {Promise<FlightLog|null>}
   */
  async findById(id) {
    const result = await this.db
      .prepare(`
        SELECT fl.*,
               p.full_name as pilot_name,
               plt.normalized_name as platform_name,
               m.mission_code
        FROM uav_flight_logs fl
        LEFT JOIN uav_pilots p ON fl.pilot_id = p.id
        LEFT JOIN platforms plt ON fl.platform_id = plt.id
        LEFT JOIN uav_missions m ON fl.mission_id = m.id
        WHERE fl.id = ?
      `)
      .bind(id)
      .first();

    return result ? FlightLog.fromRecord(result) : null;
  }

  /**
   * Find flight logs by mission ID
   * @param {number} missionId
   * @param {Object} options
   * @returns {Promise<FlightLog[]>}
   */
  async findByMissionId(missionId, options = {}) {
    const { limit = 100, offset = 0 } = options;

    const results = await this.db
      .prepare(`
        SELECT fl.*,
               p.full_name as pilot_name,
               plt.normalized_name as platform_name,
               m.mission_code
        FROM uav_flight_logs fl
        LEFT JOIN uav_pilots p ON fl.pilot_id = p.id
        LEFT JOIN platforms plt ON fl.platform_id = plt.id
        LEFT JOIN uav_missions m ON fl.mission_id = m.id
        WHERE fl.mission_id = ?
        ORDER BY fl.flight_number ASC
        LIMIT ? OFFSET ?
      `)
      .bind(missionId, limit, offset)
      .all();

    return results.results.map(row => FlightLog.fromRecord(row));
  }

  /**
   * Find flight logs by pilot ID
   * @param {number} pilotId
   * @param {Object} options
   * @returns {Promise<FlightLog[]>}
   */
  async findByPilotId(pilotId, options = {}) {
    const { limit = 100, offset = 0 } = options;

    const results = await this.db
      .prepare(`
        SELECT fl.*,
               p.full_name as pilot_name,
               plt.normalized_name as platform_name,
               m.mission_code
        FROM uav_flight_logs fl
        LEFT JOIN uav_pilots p ON fl.pilot_id = p.id
        LEFT JOIN platforms plt ON fl.platform_id = plt.id
        LEFT JOIN uav_missions m ON fl.mission_id = m.id
        WHERE fl.pilot_id = ?
        ORDER BY fl.takeoff_time DESC
        LIMIT ? OFFSET ?
      `)
      .bind(pilotId, limit, offset)
      .all();

    return results.results.map(row => FlightLog.fromRecord(row));
  }

  /**
   * Find flight logs by platform ID
   * @param {number} platformId
   * @param {Object} options
   * @returns {Promise<FlightLog[]>}
   */
  async findByPlatformId(platformId, options = {}) {
    const { limit = 100, offset = 0 } = options;

    const results = await this.db
      .prepare(`
        SELECT fl.*,
               p.full_name as pilot_name,
               plt.normalized_name as platform_name,
               m.mission_code
        FROM uav_flight_logs fl
        LEFT JOIN uav_pilots p ON fl.pilot_id = p.id
        LEFT JOIN platforms plt ON fl.platform_id = plt.id
        LEFT JOIN uav_missions m ON fl.mission_id = m.id
        WHERE fl.platform_id = ?
        ORDER BY fl.takeoff_time DESC
        LIMIT ? OFFSET ?
      `)
      .bind(platformId, limit, offset)
      .all();

    return results.results.map(row => FlightLog.fromRecord(row));
  }

  /**
   * Find flight logs with incidents
   * @param {Object} options
   * @returns {Promise<FlightLog[]>}
   */
  async findWithIncidents(options = {}) {
    const { severity, limit = 100, offset = 0 } = options;

    let whereClause = 'WHERE fl.had_incident = 1';
    const bindings = [];

    if (severity) {
      whereClause += ' AND fl.incident_severity = ?';
      bindings.push(severity);
    }

    const results = await this.db
      .prepare(`
        SELECT fl.*,
               p.full_name as pilot_name,
               plt.normalized_name as platform_name,
               m.mission_code
        FROM uav_flight_logs fl
        LEFT JOIN uav_pilots p ON fl.pilot_id = p.id
        LEFT JOIN platforms plt ON fl.platform_id = plt.id
        LEFT JOIN uav_missions m ON fl.mission_id = m.id
        ${whereClause}
        ORDER BY fl.takeoff_time DESC
        LIMIT ? OFFSET ?
      `)
      .bind(...bindings, limit, offset)
      .all();

    return results.results.map(row => FlightLog.fromRecord(row));
  }

  /**
   * Find flight logs by date range
   * @param {string} startDate
   * @param {string} endDate
   * @param {Object} options
   * @returns {Promise<FlightLog[]>}
   */
  async findByDateRange(startDate, endDate, options = {}) {
    const { pilotId, platformId, limit = 100, offset = 0 } = options;

    let whereClause = 'WHERE DATE(fl.takeoff_time) BETWEEN ? AND ?';
    const bindings = [startDate, endDate];

    if (pilotId) {
      whereClause += ' AND fl.pilot_id = ?';
      bindings.push(pilotId);
    }

    if (platformId) {
      whereClause += ' AND fl.platform_id = ?';
      bindings.push(platformId);
    }

    const results = await this.db
      .prepare(`
        SELECT fl.*,
               p.full_name as pilot_name,
               plt.normalized_name as platform_name,
               m.mission_code
        FROM uav_flight_logs fl
        LEFT JOIN uav_pilots p ON fl.pilot_id = p.id
        LEFT JOIN platforms plt ON fl.platform_id = plt.id
        LEFT JOIN uav_missions m ON fl.mission_id = m.id
        ${whereClause}
        ORDER BY fl.takeoff_time ASC
        LIMIT ? OFFSET ?
      `)
      .bind(...bindings, limit, offset)
      .all();

    return results.results.map(row => FlightLog.fromRecord(row));
  }

  /**
   * Find all flight logs with pagination
   * @param {Object} options
   * @returns {Promise<{items: FlightLog[], total: number}>}
   */
  async findAll(options = {}) {
    const {
      limit = 100,
      offset = 0,
      missionId,
      pilotId,
      platformId,
      sortBy = 'takeoff_time',
      sortOrder = 'desc'
    } = options;

    // Whitelist allowed sort columns
    const allowedSortColumns = ['id', 'flight_number', 'takeoff_time', 'landing_time', 'flight_duration_seconds', 'created_at'];
    const safeSort = allowedSortColumns.includes(sortBy) ? sortBy : 'takeoff_time';
    const safeOrder = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    const conditions = [];
    const bindings = [];

    if (missionId) {
      conditions.push('fl.mission_id = ?');
      bindings.push(missionId);
    }

    if (pilotId) {
      conditions.push('fl.pilot_id = ?');
      bindings.push(pilotId);
    }

    if (platformId) {
      conditions.push('fl.platform_id = ?');
      bindings.push(platformId);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    // Get total count
    const countResult = await this.db
      .prepare(`SELECT COUNT(*) as count FROM uav_flight_logs fl ${whereClause}`)
      .bind(...bindings)
      .first();

    // Get paginated results
    const results = await this.db
      .prepare(`
        SELECT fl.*,
               p.full_name as pilot_name,
               plt.normalized_name as platform_name,
               m.mission_code
        FROM uav_flight_logs fl
        LEFT JOIN uav_pilots p ON fl.pilot_id = p.id
        LEFT JOIN platforms plt ON fl.platform_id = plt.id
        LEFT JOIN uav_missions m ON fl.mission_id = m.id
        ${whereClause}
        ORDER BY fl.${safeSort} ${safeOrder}
        LIMIT ? OFFSET ?
      `)
      .bind(...bindings, limit, offset)
      .all();

    return {
      items: results.results.map(row => FlightLog.fromRecord(row)),
      total: countResult?.count || 0
    };
  }

  /**
   * Count total flight logs
   * @param {Object} [filter]
   * @returns {Promise<number>}
   */
  async count(filter = {}) {
    const conditions = [];
    const bindings = [];

    if (filter.missionId) {
      conditions.push('mission_id = ?');
      bindings.push(filter.missionId);
    }

    if (filter.pilotId) {
      conditions.push('pilot_id = ?');
      bindings.push(filter.pilotId);
    }

    if (filter.hadIncident) {
      conditions.push('had_incident = 1');
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const result = await this.db
      .prepare(`SELECT COUNT(*) as count FROM uav_flight_logs ${whereClause}`)
      .bind(...bindings)
      .first();

    return result?.count || 0;
  }

  /**
   * Get next flight number for a mission
   * @param {number} missionId
   * @returns {Promise<number>}
   */
  async getNextFlightNumber(missionId) {
    const result = await this.db
      .prepare(`
        SELECT COALESCE(MAX(flight_number), 0) as max_flight_number
        FROM uav_flight_logs
        WHERE mission_id = ?
      `)
      .bind(missionId)
      .first();

    return (result?.max_flight_number || 0) + 1;
  }

  /**
   * Get flight statistics for a pilot
   * @param {number} pilotId
   * @returns {Promise<Object>}
   */
  async getPilotStatistics(pilotId) {
    const result = await this.db
      .prepare(`
        SELECT
          COUNT(*) as total_flights,
          COALESCE(SUM(flight_duration_seconds), 0) as total_duration_seconds,
          COALESCE(SUM(images_captured), 0) as total_images,
          COALESCE(SUM(data_size_mb), 0) as total_data_mb,
          COUNT(CASE WHEN had_incident = 1 THEN 1 END) as incidents_count,
          MIN(takeoff_time) as first_flight,
          MAX(takeoff_time) as last_flight
        FROM uav_flight_logs
        WHERE pilot_id = ?
      `)
      .bind(pilotId)
      .first();

    return {
      totalFlights: result?.total_flights || 0,
      totalDurationSeconds: result?.total_duration_seconds || 0,
      totalDurationHours: (result?.total_duration_seconds || 0) / 3600,
      totalImages: result?.total_images || 0,
      totalDataMb: result?.total_data_mb || 0,
      incidentsCount: result?.incidents_count || 0,
      firstFlight: result?.first_flight,
      lastFlight: result?.last_flight
    };
  }

  /**
   * Save flight log (insert or update)
   * @param {FlightLog} flightLog
   * @returns {Promise<FlightLog>}
   */
  async save(flightLog) {
    const data = flightLog.toRecord();
    const now = new Date().toISOString();

    if (flightLog.id) {
      // Update existing
      await this.db
        .prepare(`
          UPDATE uav_flight_logs SET
            mission_id = ?,
            pilot_id = ?,
            platform_id = ?,
            flight_number = ?,
            takeoff_time = ?,
            landing_time = ?,
            flight_duration_seconds = ?,
            takeoff_latitude = ?,
            takeoff_longitude = ?,
            takeoff_altitude_m = ?,
            max_altitude_agl_m = ?,
            max_distance_m = ?,
            total_distance_m = ?,
            average_speed_ms = ?,
            battery_id = ?,
            battery_start_percent = ?,
            battery_end_percent = ?,
            images_captured = ?,
            data_size_mb = ?,
            telemetry_file_path = ?,
            telemetry_file_hash = ?,
            had_incident = ?,
            incident_description = ?,
            incident_severity = ?,
            notes = ?,
            updated_at = ?
          WHERE id = ?
        `)
        .bind(
          data.mission_id,
          data.pilot_id,
          data.platform_id,
          data.flight_number,
          data.takeoff_time,
          data.landing_time,
          data.flight_duration_seconds,
          data.takeoff_latitude,
          data.takeoff_longitude,
          data.takeoff_altitude_m,
          data.max_altitude_agl_m,
          data.max_distance_m,
          data.total_distance_m,
          data.average_speed_ms,
          data.battery_id,
          data.battery_start_percent,
          data.battery_end_percent,
          data.images_captured,
          data.data_size_mb,
          data.telemetry_file_path,
          data.telemetry_file_hash,
          data.had_incident,
          data.incident_description,
          data.incident_severity,
          data.notes,
          now,
          flightLog.id
        )
        .run();

      return await this.findById(flightLog.id);
    } else {
      // Insert new
      const result = await this.db
        .prepare(`
          INSERT INTO uav_flight_logs (
            mission_id, pilot_id, platform_id, flight_number,
            takeoff_time, landing_time, flight_duration_seconds,
            takeoff_latitude, takeoff_longitude, takeoff_altitude_m,
            max_altitude_agl_m, max_distance_m, total_distance_m, average_speed_ms,
            battery_id, battery_start_percent, battery_end_percent,
            images_captured, data_size_mb,
            telemetry_file_path, telemetry_file_hash,
            had_incident, incident_description, incident_severity,
            notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          data.mission_id,
          data.pilot_id,
          data.platform_id,
          data.flight_number,
          data.takeoff_time,
          data.landing_time,
          data.flight_duration_seconds,
          data.takeoff_latitude,
          data.takeoff_longitude,
          data.takeoff_altitude_m,
          data.max_altitude_agl_m,
          data.max_distance_m,
          data.total_distance_m,
          data.average_speed_ms,
          data.battery_id,
          data.battery_start_percent,
          data.battery_end_percent,
          data.images_captured,
          data.data_size_mb,
          data.telemetry_file_path,
          data.telemetry_file_hash,
          data.had_incident,
          data.incident_description,
          data.incident_severity,
          data.notes,
          now,
          now
        )
        .run();

      return await this.findById(result.meta.last_row_id);
    }
  }

  /**
   * Delete flight log by ID
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    const result = await this.db
      .prepare('DELETE FROM uav_flight_logs WHERE id = ?')
      .bind(id)
      .run();

    return result.meta.changes > 0;
  }
}
