/**
 * D1 Instrument Repository
 *
 * Cloudflare D1 implementation of InstrumentRepository.
 * Adapts the domain port to the D1 database.
 *
 * @module infrastructure/persistence/d1/D1InstrumentRepository
 */

import { Instrument } from '../../../domain/index.js';

/**
 * D1 Instrument Repository Adapter
 * @implements {import('../../../domain/instrument/InstrumentRepository.js').InstrumentRepository}
 */
export class D1InstrumentRepository {
  /**
   * @param {D1Database} db - Cloudflare D1 database instance
   */
  constructor(db) {
    this.db = db;
  }

  /**
   * Find instrument by ID
   * @param {number} id
   * @returns {Promise<Instrument|null>}
   */
  async findById(id) {
    const result = await this.db
      .prepare('SELECT * FROM instruments WHERE id = ?')
      .bind(id)
      .first();

    return result ? Instrument.fromDatabase(result) : null;
  }

  /**
   * Find instrument by ID with platform and station details
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  async findByIdWithDetails(id) {
    const result = await this.db
      .prepare(`
        SELECT
          i.*,
          p.normalized_name as platform_name,
          p.display_name as platform_display_name,
          p.platform_type,
          p.ecosystem_code,
          s.acronym as station_acronym,
          s.display_name as station_display_name
        FROM instruments i
        JOIN platforms p ON i.platform_id = p.id
        JOIN stations s ON p.station_id = s.id
        WHERE i.id = ?
      `)
      .bind(id)
      .first();

    if (!result) return null;

    const instrument = Instrument.fromDatabase(result);
    return {
      ...instrument.toJSON(),
      platform: {
        normalized_name: result.platform_name,
        display_name: result.platform_display_name,
        platform_type: result.platform_type,
        ecosystem_code: result.ecosystem_code
      },
      station: {
        acronym: result.station_acronym,
        display_name: result.station_display_name
      }
    };
  }

  /**
   * Find instrument by normalized name
   * @param {string} normalizedName
   * @returns {Promise<Instrument|null>}
   */
  async findByNormalizedName(normalizedName) {
    const result = await this.db
      .prepare('SELECT * FROM instruments WHERE normalized_name = ?')
      .bind(normalizedName.toUpperCase())
      .first();

    return result ? Instrument.fromDatabase(result) : null;
  }

  /**
   * Find instruments by platform ID
   * @param {number} platformId
   * @returns {Promise<Instrument[]>}
   */
  async findByPlatformId(platformId) {
    const results = await this.db
      .prepare('SELECT * FROM instruments WHERE platform_id = ? ORDER BY normalized_name')
      .bind(platformId)
      .all();

    return results.results.map(row => Instrument.fromDatabase(row));
  }

  /**
   * Find instruments by station ID (via platform join)
   * @param {number} stationId
   * @returns {Promise<Instrument[]>}
   */
  async findByStationId(stationId) {
    const results = await this.db
      .prepare(`
        SELECT i.* FROM instruments i
        JOIN platforms p ON i.platform_id = p.id
        WHERE p.station_id = ?
        ORDER BY i.normalized_name
      `)
      .bind(stationId)
      .all();

    return results.results.map(row => Instrument.fromDatabase(row));
  }

  /**
   * Find all instruments with filtering, pagination, and sorting
   * @param {Object} options
   * @returns {Promise<Instrument[]>}
   */
  async findAll(options = {}) {
    const {
      platformId,
      stationId,
      instrumentType,
      status,
      limit = 100,
      offset = 0,
      sortBy = 'normalized_name',
      sortOrder = 'asc'
    } = options;

    // Build query
    let query = 'SELECT i.* FROM instruments i';
    const conditions = [];
    const params = [];

    // Join with platforms if filtering by station
    if (stationId) {
      query += ' JOIN platforms p ON i.platform_id = p.id';
      conditions.push('p.station_id = ?');
      params.push(stationId);
    }

    if (platformId) {
      conditions.push('i.platform_id = ?');
      params.push(platformId);
    }
    if (instrumentType) {
      conditions.push('i.instrument_type = ?');
      params.push(instrumentType);
    }
    if (status) {
      conditions.push('i.status = ?');
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    // Whitelist allowed sort columns
    const allowedSortColumns = ['id', 'normalized_name', 'display_name', 'instrument_type', 'status', 'created_at'];
    const safeSort = allowedSortColumns.includes(sortBy) ? sortBy : 'normalized_name';
    const safeOrder = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    query += ` ORDER BY i.${safeSort} ${safeOrder} LIMIT ? OFFSET ?`;

    const results = await this.db
      .prepare(query)
      .bind(...params, limit, offset)
      .all();

    return results.results.map(row => Instrument.fromDatabase(row));
  }

  /**
   * Count instruments with optional filter
   * @param {Object} filter
   * @returns {Promise<number>}
   */
  async count(filter = {}) {
    let query = 'SELECT COUNT(*) as count FROM instruments i';
    const conditions = [];
    const params = [];

    if (filter.stationId) {
      query += ' JOIN platforms p ON i.platform_id = p.id';
      conditions.push('p.station_id = ?');
      params.push(filter.stationId);
    }

    if (filter.platformId) {
      conditions.push('i.platform_id = ?');
      params.push(filter.platformId);
    }
    if (filter.instrumentType) {
      conditions.push('i.instrument_type = ?');
      params.push(filter.instrumentType);
    }
    if (filter.status) {
      conditions.push('i.status = ?');
      params.push(filter.status);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    const result = await this.db
      .prepare(query)
      .bind(...params)
      .first();

    return result?.count || 0;
  }

  /**
   * Get next instrument number for a platform and type
   * @param {number} platformId
   * @param {string} typeCode - e.g., 'PHE', 'MS'
   * @returns {Promise<number>}
   */
  async getNextInstrumentNumber(platformId, typeCode) {
    const results = await this.db
      .prepare(`
        SELECT normalized_name FROM instruments
        WHERE platform_id = ?
        AND normalized_name LIKE ?
      `)
      .bind(platformId, `%_${typeCode}%`)
      .all();

    let maxNumber = 0;
    const pattern = new RegExp(`_${typeCode}(\\d+)$`);

    for (const row of results.results) {
      const match = row.normalized_name.match(pattern);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) maxNumber = num;
      }
    }

    return maxNumber + 1;
  }

  /**
   * Check if instrument has ROIs
   * @param {number} instrumentId
   * @returns {Promise<boolean>}
   */
  async hasROIs(instrumentId) {
    const result = await this.db
      .prepare('SELECT COUNT(*) as count FROM instrument_rois WHERE instrument_id = ?')
      .bind(instrumentId)
      .first();

    return (result?.count || 0) > 0;
  }

  /**
   * Save instrument (insert or update)
   * @param {Instrument} instrument
   * @returns {Promise<Instrument>}
   */
  async save(instrument) {
    const data = instrument.toJSON();
    const now = new Date().toISOString();

    // Serialize specifications to JSON
    const specificationsJson = JSON.stringify(data.specifications || {});

    if (instrument.id) {
      // Update existing
      await this.db
        .prepare(`
          UPDATE instruments SET
            display_name = ?,
            description = ?,
            instrument_type = ?,
            status = ?,
            measurement_status = ?,
            specifications = ?,
            updated_at = ?
          WHERE id = ?
        `)
        .bind(
          data.display_name,
          data.description,
          data.instrument_type,
          data.status,
          data.measurement_status,
          specificationsJson,
          now,
          instrument.id
        )
        .run();

      return await this.findById(instrument.id);
    } else {
      // Insert new
      const result = await this.db
        .prepare(`
          INSERT INTO instruments (
            platform_id, normalized_name, display_name, description,
            instrument_type, status, measurement_status, specifications,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          data.platform_id,
          data.normalized_name,
          data.display_name,
          data.description,
          data.instrument_type,
          data.status || 'Active',
          data.measurement_status || 'active',
          specificationsJson,
          now,
          now
        )
        .run();

      return await this.findById(result.meta.last_row_id);
    }
  }

  /**
   * Delete instrument by ID
   * @param {number} id
   * @param {boolean} [cascade=false] - If true, delete associated ROIs
   * @returns {Promise<boolean>}
   */
  async delete(id, cascade = false) {
    if (cascade) {
      // Delete ROIs first
      await this.db
        .prepare('DELETE FROM instrument_rois WHERE instrument_id = ?')
        .bind(id)
        .run();
    }

    const result = await this.db
      .prepare('DELETE FROM instruments WHERE id = ?')
      .bind(id)
      .run();

    return result.meta.changes > 0;
  }
}
