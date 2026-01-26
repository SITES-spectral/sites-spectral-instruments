/**
 * D1 Battery Repository
 *
 * Cloudflare D1 implementation of BatteryRepository.
 * Adapts the domain port to the D1 database.
 *
 * @module infrastructure/persistence/d1/D1BatteryRepository
 */

import { Battery } from '../../../domain/uav/index.js';

/**
 * D1 Battery Repository Adapter
 */
export class D1BatteryRepository {
  /**
   * @param {D1Database} db - Cloudflare D1 database instance
   */
  constructor(db) {
    this.db = db;
  }

  /**
   * Find battery by ID
   * @param {number} id
   * @returns {Promise<Battery|null>}
   */
  async findById(id) {
    const result = await this.db
      .prepare(`
        SELECT b.*, s.acronym as station_acronym, p.normalized_name as platform_name
        FROM uav_batteries b
        LEFT JOIN stations s ON b.station_id = s.id
        LEFT JOIN platforms p ON b.platform_id = p.id
        WHERE b.id = ?
      `)
      .bind(id)
      .first();

    return result ? Battery.fromRecord(result) : null;
  }

  /**
   * Find battery by serial number
   * @param {string} serialNumber
   * @returns {Promise<Battery|null>}
   */
  async findBySerialNumber(serialNumber) {
    if (!serialNumber || typeof serialNumber !== 'string') {
      return null;
    }
    const result = await this.db
      .prepare(`
        SELECT b.*, s.acronym as station_acronym, p.normalized_name as platform_name
        FROM uav_batteries b
        LEFT JOIN stations s ON b.station_id = s.id
        LEFT JOIN platforms p ON b.platform_id = p.id
        WHERE b.serial_number = ?
      `)
      .bind(serialNumber)
      .first();

    return result ? Battery.fromRecord(result) : null;
  }

  /**
   * Find batteries by station ID
   * @param {number} stationId
   * @param {Object} options
   * @returns {Promise<Battery[]>}
   */
  async findByStationId(stationId, options = {}) {
    const { status, limit = 100, offset = 0 } = options;

    let whereClause = 'WHERE b.station_id = ?';
    const bindings = [stationId];

    if (status) {
      whereClause += ' AND b.status = ?';
      bindings.push(status);
    }

    const results = await this.db
      .prepare(`
        SELECT b.*, s.acronym as station_acronym, p.normalized_name as platform_name
        FROM uav_batteries b
        LEFT JOIN stations s ON b.station_id = s.id
        LEFT JOIN platforms p ON b.platform_id = p.id
        ${whereClause}
        ORDER BY b.display_name ASC, b.serial_number ASC
        LIMIT ? OFFSET ?
      `)
      .bind(...bindings, limit, offset)
      .all();

    return results.results.map(row => Battery.fromRecord(row));
  }

  /**
   * Find batteries by platform ID
   * @param {number} platformId
   * @returns {Promise<Battery[]>}
   */
  async findByPlatformId(platformId) {
    const results = await this.db
      .prepare(`
        SELECT b.*, s.acronym as station_acronym, p.normalized_name as platform_name
        FROM uav_batteries b
        LEFT JOIN stations s ON b.station_id = s.id
        LEFT JOIN platforms p ON b.platform_id = p.id
        WHERE b.platform_id = ?
        ORDER BY b.display_name ASC
      `)
      .bind(platformId)
      .all();

    return results.results.map(row => Battery.fromRecord(row));
  }

  /**
   * Find batteries needing health check
   * @param {number} [days=30] - Days since last health check
   * @returns {Promise<Battery[]>}
   */
  async findNeedingHealthCheck(days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const dateStr = cutoffDate.toISOString().split('T')[0];

    const results = await this.db
      .prepare(`
        SELECT b.*, s.acronym as station_acronym, p.normalized_name as platform_name
        FROM uav_batteries b
        LEFT JOIN stations s ON b.station_id = s.id
        LEFT JOIN platforms p ON b.platform_id = p.id
        WHERE (b.last_health_check_date IS NULL OR b.last_health_check_date <= ?)
          AND b.status NOT IN ('retired', 'damaged')
        ORDER BY b.last_health_check_date ASC
      `)
      .bind(dateStr)
      .all();

    return results.results.map(row => Battery.fromRecord(row));
  }

  /**
   * Find batteries with low health
   * @param {number} [threshold=80] - Health percentage threshold
   * @returns {Promise<Battery[]>}
   */
  async findLowHealth(threshold = 80) {
    const results = await this.db
      .prepare(`
        SELECT b.*, s.acronym as station_acronym, p.normalized_name as platform_name
        FROM uav_batteries b
        LEFT JOIN stations s ON b.station_id = s.id
        LEFT JOIN platforms p ON b.platform_id = p.id
        WHERE b.health_percent < ?
          AND b.status NOT IN ('retired', 'damaged')
        ORDER BY b.health_percent ASC
      `)
      .bind(threshold)
      .all();

    return results.results.map(row => Battery.fromRecord(row));
  }

  /**
   * Find batteries by status
   * @param {string} status
   * @param {Object} options
   * @returns {Promise<Battery[]>}
   */
  async findByStatus(status, options = {}) {
    const { limit = 100, offset = 0 } = options;

    const results = await this.db
      .prepare(`
        SELECT b.*, s.acronym as station_acronym, p.normalized_name as platform_name
        FROM uav_batteries b
        LEFT JOIN stations s ON b.station_id = s.id
        LEFT JOIN platforms p ON b.platform_id = p.id
        WHERE b.status = ?
        ORDER BY b.serial_number ASC
        LIMIT ? OFFSET ?
      `)
      .bind(status, limit, offset)
      .all();

    return results.results.map(row => Battery.fromRecord(row));
  }

  /**
   * Find available batteries at a station
   * @param {number} stationId
   * @returns {Promise<Battery[]>}
   */
  async findAvailableAtStation(stationId) {
    return this.findByStationId(stationId, { status: 'available' });
  }

  /**
   * Find all batteries with pagination and filtering
   * @param {Object} options
   * @returns {Promise<{items: Battery[], total: number}>}
   */
  async findAll(options = {}) {
    const {
      limit = 100,
      offset = 0,
      stationId,
      status,
      sortBy = 'serial_number',
      sortOrder = 'asc'
    } = options;

    // Whitelist allowed sort columns
    const allowedSortColumns = ['id', 'serial_number', 'display_name', 'status', 'health_percent', 'cycle_count', 'last_use_date', 'created_at'];
    const safeSort = allowedSortColumns.includes(sortBy) ? sortBy : 'serial_number';
    const safeOrder = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    const conditions = [];
    const bindings = [];

    if (stationId) {
      conditions.push('b.station_id = ?');
      bindings.push(stationId);
    }

    if (status) {
      conditions.push('b.status = ?');
      bindings.push(status);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    // Get total count
    const countResult = await this.db
      .prepare(`SELECT COUNT(*) as count FROM uav_batteries b ${whereClause}`)
      .bind(...bindings)
      .first();

    // Get paginated results
    const results = await this.db
      .prepare(`
        SELECT b.*, s.acronym as station_acronym, p.normalized_name as platform_name
        FROM uav_batteries b
        LEFT JOIN stations s ON b.station_id = s.id
        LEFT JOIN platforms p ON b.platform_id = p.id
        ${whereClause}
        ORDER BY b.${safeSort} ${safeOrder}
        LIMIT ? OFFSET ?
      `)
      .bind(...bindings, limit, offset)
      .all();

    return {
      items: results.results.map(row => Battery.fromRecord(row)),
      total: countResult?.count || 0
    };
  }

  /**
   * Count total batteries
   * @param {Object} [filter]
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
      .prepare(`SELECT COUNT(*) as count FROM uav_batteries ${whereClause}`)
      .bind(...bindings)
      .first();

    return result?.count || 0;
  }

  /**
   * Get battery statistics for a station
   * @param {number} stationId
   * @returns {Promise<Object>}
   */
  async getStationStatistics(stationId) {
    const result = await this.db
      .prepare(`
        SELECT
          COUNT(*) as total_batteries,
          COUNT(CASE WHEN status = 'available' THEN 1 END) as available_count,
          COUNT(CASE WHEN status = 'in_use' THEN 1 END) as in_use_count,
          COUNT(CASE WHEN status = 'charging' THEN 1 END) as charging_count,
          COUNT(CASE WHEN status = 'storage' THEN 1 END) as storage_count,
          COUNT(CASE WHEN status = 'retired' OR status = 'damaged' THEN 1 END) as retired_count,
          AVG(health_percent) as average_health,
          SUM(cycle_count) as total_cycles
        FROM uav_batteries
        WHERE station_id = ?
      `)
      .bind(stationId)
      .first();

    return {
      totalBatteries: result?.total_batteries || 0,
      availableCount: result?.available_count || 0,
      inUseCount: result?.in_use_count || 0,
      chargingCount: result?.charging_count || 0,
      storageCount: result?.storage_count || 0,
      retiredCount: result?.retired_count || 0,
      averageHealth: result?.average_health || null,
      totalCycles: result?.total_cycles || 0
    };
  }

  /**
   * Save battery (insert or update)
   * @param {Battery} battery
   * @returns {Promise<Battery>}
   */
  async save(battery) {
    const data = battery.toRecord();
    const now = new Date().toISOString();

    if (battery.id) {
      // Update existing
      await this.db
        .prepare(`
          UPDATE uav_batteries SET
            serial_number = ?,
            display_name = ?,
            manufacturer = ?,
            model = ?,
            capacity_mah = ?,
            cell_count = ?,
            chemistry = ?,
            station_id = ?,
            platform_id = ?,
            purchase_date = ?,
            first_use_date = ?,
            last_use_date = ?,
            cycle_count = ?,
            health_percent = ?,
            internal_resistance_mohm = ?,
            last_health_check_date = ?,
            status = ?,
            storage_voltage_v = ?,
            notes = ?,
            updated_at = ?
          WHERE id = ?
        `)
        .bind(
          data.serial_number,
          data.display_name,
          data.manufacturer,
          data.model,
          data.capacity_mah,
          data.cell_count,
          data.chemistry,
          data.station_id,
          data.platform_id,
          data.purchase_date,
          data.first_use_date,
          data.last_use_date,
          data.cycle_count,
          data.health_percent,
          data.internal_resistance_mohm,
          data.last_health_check_date,
          data.status,
          data.storage_voltage_v,
          data.notes,
          now,
          battery.id
        )
        .run();

      return await this.findById(battery.id);
    } else {
      // Insert new
      const result = await this.db
        .prepare(`
          INSERT INTO uav_batteries (
            serial_number, display_name, manufacturer, model,
            capacity_mah, cell_count, chemistry,
            station_id, platform_id,
            purchase_date, first_use_date, last_use_date, cycle_count,
            health_percent, internal_resistance_mohm, last_health_check_date,
            status, storage_voltage_v, notes,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          data.serial_number,
          data.display_name,
          data.manufacturer,
          data.model,
          data.capacity_mah,
          data.cell_count,
          data.chemistry,
          data.station_id,
          data.platform_id,
          data.purchase_date,
          data.first_use_date,
          data.last_use_date,
          data.cycle_count,
          data.health_percent,
          data.internal_resistance_mohm,
          data.last_health_check_date,
          data.status,
          data.storage_voltage_v,
          data.notes,
          now,
          now
        )
        .run();

      return await this.findById(result.meta.last_row_id);
    }
  }

  /**
   * Delete battery by ID
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    const result = await this.db
      .prepare('DELETE FROM uav_batteries WHERE id = ?')
      .bind(id)
      .run();

    return result.meta.changes > 0;
  }

  /**
   * Record health check for a battery
   * @param {number} id
   * @param {number} healthPercent
   * @param {number} [internalResistance]
   * @returns {Promise<Battery>}
   */
  async recordHealthCheck(id, healthPercent, internalResistance) {
    const battery = await this.findById(id);
    if (!battery) {
      throw new Error(`Battery ${id} not found`);
    }

    battery.recordHealthCheck(healthPercent, internalResistance);
    return await this.save(battery);
  }

  /**
   * Retire a battery
   * @param {number} id
   * @param {string} [reason]
   * @returns {Promise<Battery>}
   */
  async retire(id, reason) {
    const battery = await this.findById(id);
    if (!battery) {
      throw new Error(`Battery ${id} not found`);
    }

    battery.retire(reason);
    return await this.save(battery);
  }
}
