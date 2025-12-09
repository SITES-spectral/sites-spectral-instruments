/**
 * D1 Station Repository
 *
 * Cloudflare D1 implementation of StationRepository.
 * Adapts the domain port to the D1 database.
 *
 * @module infrastructure/persistence/d1/D1StationRepository
 */

import { Station } from '../../../domain/index.js';

/**
 * D1 Station Repository Adapter
 * @implements {import('../../../domain/station/StationRepository.js').StationRepository}
 */
export class D1StationRepository {
  /**
   * @param {D1Database} db - Cloudflare D1 database instance
   */
  constructor(db) {
    this.db = db;
  }

  /**
   * Find station by ID
   * @param {number} id
   * @returns {Promise<Station|null>}
   */
  async findById(id) {
    const result = await this.db
      .prepare('SELECT * FROM stations WHERE id = ?')
      .bind(id)
      .first();

    return result ? Station.fromDatabase(result) : null;
  }

  /**
   * Find station by acronym
   * @param {string} acronym
   * @returns {Promise<Station|null>}
   */
  async findByAcronym(acronym) {
    if (!acronym || typeof acronym !== 'string') {
      return null;
    }
    const result = await this.db
      .prepare('SELECT * FROM stations WHERE acronym = ?')
      .bind(acronym.toUpperCase())
      .first();

    return result ? Station.fromDatabase(result) : null;
  }

  /**
   * Find all stations with pagination and sorting
   * @param {Object} options
   * @returns {Promise<Station[]>}
   */
  async findAll(options = {}) {
    const {
      limit = 100,
      offset = 0,
      sortBy = 'acronym',
      sortOrder = 'asc'
    } = options;

    // Whitelist allowed sort columns
    const allowedSortColumns = ['id', 'acronym', 'display_name', 'created_at', 'updated_at'];
    const safeSort = allowedSortColumns.includes(sortBy) ? sortBy : 'acronym';
    const safeOrder = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    // Include platform and instrument counts via subqueries
    const results = await this.db
      .prepare(`
        SELECT s.*,
          (SELECT COUNT(*) FROM platforms p WHERE p.station_id = s.id) as platform_count,
          (SELECT COUNT(*) FROM instruments i
           JOIN platforms p ON i.platform_id = p.id
           WHERE p.station_id = s.id) as instrument_count,
          (SELECT COUNT(*) FROM instrument_rois r
           JOIN instruments i ON r.instrument_id = i.id
           JOIN platforms p ON i.platform_id = p.id
           WHERE p.station_id = s.id) as roi_count
        FROM stations s
        ORDER BY ${safeSort} ${safeOrder}
        LIMIT ? OFFSET ?
      `)
      .bind(limit, offset)
      .all();

    return results.results.map(row => Station.fromDatabase(row));
  }

  /**
   * Count total stations
   * @returns {Promise<number>}
   */
  async count() {
    const result = await this.db
      .prepare('SELECT COUNT(*) as count FROM stations')
      .first();

    return result?.count || 0;
  }

  /**
   * Save station (insert or update)
   * @param {Station} station
   * @returns {Promise<Station>}
   */
  async save(station) {
    const data = station.toJSON();
    const now = new Date().toISOString();

    if (station.id) {
      // Update existing
      await this.db
        .prepare(`
          UPDATE stations SET
            display_name = ?,
            description = ?,
            latitude = ?,
            longitude = ?,
            website_url = ?,
            contact_email = ?,
            updated_at = ?
          WHERE id = ?
        `)
        .bind(
          data.display_name,
          data.description,
          data.latitude,
          data.longitude,
          data.website_url,
          data.contact_email,
          now,
          station.id
        )
        .run();

      return await this.findById(station.id);
    } else {
      // Insert new
      const result = await this.db
        .prepare(`
          INSERT INTO stations (
            acronym, display_name, description,
            latitude, longitude, website_url, contact_email,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          data.acronym,
          data.display_name,
          data.description,
          data.latitude,
          data.longitude,
          data.website_url,
          data.contact_email,
          now,
          now
        )
        .run();

      return await this.findById(result.meta.last_row_id);
    }
  }

  /**
   * Delete station by ID
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    const result = await this.db
      .prepare('DELETE FROM stations WHERE id = ?')
      .bind(id)
      .run();

    return result.meta.changes > 0;
  }
}
