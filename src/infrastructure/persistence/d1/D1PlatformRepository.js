/**
 * D1 Platform Repository
 *
 * Cloudflare D1 implementation of PlatformRepository.
 * Adapts the domain port to the D1 database.
 *
 * @module infrastructure/persistence/d1/D1PlatformRepository
 */

import { Platform } from '../../../domain/index.js';

/**
 * D1 Platform Repository Adapter
 * @implements {import('../../../domain/platform/PlatformRepository.js').PlatformRepository}
 */
export class D1PlatformRepository {
  /**
   * @param {D1Database} db - Cloudflare D1 database instance
   */
  constructor(db) {
    this.db = db;
  }

  /**
   * Find platform by ID
   * @param {number} id
   * @returns {Promise<Platform|null>}
   */
  async findById(id) {
    const result = await this.db
      .prepare(`
        SELECT p.*,
          (SELECT COUNT(*) FROM instruments i WHERE i.platform_id = p.id) as instrument_count
        FROM platforms p
        WHERE p.id = ?
      `)
      .bind(id)
      .first();

    return result ? Platform.fromDatabase(result) : null;
  }

  /**
   * Find platform by normalized name
   * @param {string} normalizedName
   * @returns {Promise<Platform|null>}
   */
  async findByNormalizedName(normalizedName) {
    if (!normalizedName || typeof normalizedName !== 'string') {
      return null;
    }
    const result = await this.db
      .prepare(`
        SELECT p.*,
          (SELECT COUNT(*) FROM instruments i WHERE i.platform_id = p.id) as instrument_count
        FROM platforms p
        WHERE p.normalized_name = ?
      `)
      .bind(normalizedName.toUpperCase())
      .first();

    return result ? Platform.fromDatabase(result) : null;
  }

  /**
   * Find platforms by station ID
   * @param {number} stationId
   * @returns {Promise<Platform[]>}
   */
  async findByStationId(stationId) {
    const results = await this.db
      .prepare(`
        SELECT p.*,
          (SELECT COUNT(*) FROM instruments i WHERE i.platform_id = p.id) as instrument_count
        FROM platforms p
        WHERE p.station_id = ?
        ORDER BY p.normalized_name
      `)
      .bind(stationId)
      .all();

    return results.results.map(row => Platform.fromDatabase(row));
  }

  /**
   * Find all platforms with filtering, pagination, and sorting
   * @param {Object} options
   * @returns {Promise<Platform[]>}
   */
  async findAll(options = {}) {
    const {
      stationId,
      platformType,
      ecosystemCode,
      limit = 100,
      offset = 0,
      sortBy = 'normalized_name',
      sortOrder = 'asc'
    } = options;

    // Build WHERE clause
    const conditions = [];
    const params = [];

    if (stationId) {
      conditions.push('p.station_id = ?');
      params.push(stationId);
    }
    if (platformType) {
      conditions.push('p.platform_type = ?');
      params.push(platformType);
    }
    if (ecosystemCode) {
      conditions.push('p.ecosystem_code = ?');
      params.push(ecosystemCode);
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    // Whitelist allowed sort columns
    const allowedSortColumns = ['id', 'normalized_name', 'display_name', 'platform_type', 'created_at'];
    const safeSort = allowedSortColumns.includes(sortBy) ? sortBy : 'normalized_name';
    const safeOrder = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    const query = `
      SELECT p.*,
        (SELECT COUNT(*) FROM instruments i WHERE i.platform_id = p.id) as instrument_count
      FROM platforms p
      ${whereClause}
      ORDER BY ${safeSort} ${safeOrder}
      LIMIT ? OFFSET ?
    `;

    const results = await this.db
      .prepare(query)
      .bind(...params, limit, offset)
      .all();

    return results.results.map(row => Platform.fromDatabase(row));
  }

  /**
   * Count platforms with optional filter
   * @param {Object} filter
   * @returns {Promise<number>}
   */
  async count(filter = {}) {
    const conditions = [];
    const params = [];

    if (filter.stationId) {
      conditions.push('station_id = ?');
      params.push(filter.stationId);
    }
    if (filter.platformType) {
      conditions.push('platform_type = ?');
      params.push(filter.platformType);
    }
    if (filter.ecosystemCode) {
      conditions.push('ecosystem_code = ?');
      params.push(filter.ecosystemCode);
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    const result = await this.db
      .prepare(`SELECT COUNT(*) as count FROM platforms ${whereClause}`)
      .bind(...params)
      .first();

    return result?.count || 0;
  }

  /**
   * Get next mount type code for a station
   * @param {number} stationId
   * @param {string} mountTypePrefix - e.g., 'PL', 'BL', 'GL', 'UAV'
   * @param {string} [ecosystemCode] - Optional ecosystem code for fixed platforms
   * @returns {Promise<string>} e.g., 'PL01', 'UAV02'
   */
  async getNextMountTypeCode(stationId, mountTypePrefix, ecosystemCode = null) {
    // Build query to find existing codes
    // NOTE: Database column is 'location_code', mapped to domain 'mount_type_code'
    let query = `
      SELECT location_code FROM platforms
      WHERE station_id = ?
      AND location_code LIKE ?
    `;
    const params = [stationId, `${mountTypePrefix}%`];

    if (ecosystemCode) {
      query += ' AND ecosystem_code = ?';
      params.push(ecosystemCode);
    }

    const results = await this.db
      .prepare(query)
      .bind(...params)
      .all();

    // Find highest number
    let maxNumber = 0;
    for (const row of results.results) {
      const code = row.location_code || '';
      const match = code.match(new RegExp(`^${mountTypePrefix}(\\d+)$`));
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) maxNumber = num;
      }
    }

    // Return next code
    return `${mountTypePrefix}${String(maxNumber + 1).padStart(2, '0')}`;
  }

  /**
   * Save platform (insert or update)
   * @param {Platform} platform
   * @returns {Promise<Platform>}
   */
  async save(platform) {
    const data = platform.toJSON();
    const now = new Date().toISOString();

    // NOTE: Database column is 'location_code', domain uses 'mount_type_code'
    const locationCode = data.mount_type_code || data.location_code;

    if (platform.id) {
      // Update existing
      await this.db
        .prepare(`
          UPDATE platforms SET
            display_name = ?,
            description = ?,
            platform_type = ?,
            ecosystem_code = ?,
            location_code = ?,
            latitude = ?,
            longitude = ?,
            status = ?,
            updated_at = ?
          WHERE id = ?
        `)
        .bind(
          data.display_name,
          data.description,
          data.platform_type,
          data.ecosystem_code,
          locationCode,
          data.latitude,
          data.longitude,
          data.status,
          now,
          platform.id
        )
        .run();

      return await this.findById(platform.id);
    } else {
      // Insert new
      const result = await this.db
        .prepare(`
          INSERT INTO platforms (
            station_id, normalized_name, display_name, description,
            platform_type, ecosystem_code, location_code,
            latitude, longitude, status,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          data.station_id,
          data.normalized_name,
          data.display_name,
          data.description,
          data.platform_type,
          data.ecosystem_code,
          locationCode,
          data.latitude,
          data.longitude,
          data.status || 'Active',
          now,
          now
        )
        .run();

      return await this.findById(result.meta.last_row_id);
    }
  }

  /**
   * Delete platform by ID
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    const result = await this.db
      .prepare('DELETE FROM platforms WHERE id = ?')
      .bind(id)
      .run();

    return result.meta.changes > 0;
  }
}
