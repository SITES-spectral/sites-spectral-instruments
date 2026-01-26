/**
 * D1 Pilot Repository
 *
 * Cloudflare D1 implementation of PilotRepository.
 * Adapts the domain port to the D1 database.
 *
 * @module infrastructure/persistence/d1/D1PilotRepository
 */

import { Pilot } from '../../../domain/uav/index.js';

/**
 * D1 Pilot Repository Adapter
 */
export class D1PilotRepository {
  /**
   * @param {D1Database} db - Cloudflare D1 database instance
   */
  constructor(db) {
    this.db = db;
  }

  /**
   * Find pilot by ID
   * @param {number} id
   * @returns {Promise<Pilot|null>}
   */
  async findById(id) {
    const result = await this.db
      .prepare('SELECT * FROM uav_pilots WHERE id = ?')
      .bind(id)
      .first();

    return result ? Pilot.fromRecord(result) : null;
  }

  /**
   * Find pilot by email
   * @param {string} email
   * @returns {Promise<Pilot|null>}
   */
  async findByEmail(email) {
    if (!email || typeof email !== 'string') {
      return null;
    }
    const result = await this.db
      .prepare('SELECT * FROM uav_pilots WHERE email = ?')
      .bind(email.toLowerCase())
      .first();

    return result ? Pilot.fromRecord(result) : null;
  }

  /**
   * Find pilot by user ID
   * @param {number} userId
   * @returns {Promise<Pilot|null>}
   */
  async findByUserId(userId) {
    const result = await this.db
      .prepare('SELECT * FROM uav_pilots WHERE user_id = ?')
      .bind(userId)
      .first();

    return result ? Pilot.fromRecord(result) : null;
  }

  /**
   * Find pilots authorized for a station
   * @param {number} stationId
   * @returns {Promise<Pilot[]>}
   */
  async findByStationAuthorization(stationId) {
    // Search within JSON array for station authorization
    const results = await this.db
      .prepare(`
        SELECT * FROM uav_pilots
        WHERE authorized_stations LIKE ?
        ORDER BY full_name ASC
      `)
      .bind(`%${stationId}%`)
      .all();

    // Filter results to ensure exact match in JSON array
    return results.results
      .filter(row => {
        const stations = JSON.parse(row.authorized_stations || '[]');
        return stations.includes(stationId);
      })
      .map(row => Pilot.fromRecord(row));
  }

  /**
   * Find pilots with expiring certificates
   * @param {number} [days=30] - Days until expiry
   * @returns {Promise<Pilot[]>}
   */
  async findWithExpiringCertificates(days = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    const dateStr = futureDate.toISOString().split('T')[0];

    const results = await this.db
      .prepare(`
        SELECT * FROM uav_pilots
        WHERE certificate_expiry_date IS NOT NULL
          AND certificate_expiry_date <= ?
          AND certificate_expiry_date >= DATE('now')
          AND status = 'active'
        ORDER BY certificate_expiry_date ASC
      `)
      .bind(dateStr)
      .all();

    return results.results.map(row => Pilot.fromRecord(row));
  }

  /**
   * Find pilots with expiring insurance
   * @param {number} [days=30] - Days until expiry
   * @returns {Promise<Pilot[]>}
   */
  async findWithExpiringInsurance(days = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    const dateStr = futureDate.toISOString().split('T')[0];

    const results = await this.db
      .prepare(`
        SELECT * FROM uav_pilots
        WHERE insurance_expiry_date IS NOT NULL
          AND insurance_expiry_date <= ?
          AND insurance_expiry_date >= DATE('now')
          AND status = 'active'
        ORDER BY insurance_expiry_date ASC
      `)
      .bind(dateStr)
      .all();

    return results.results.map(row => Pilot.fromRecord(row));
  }

  /**
   * Find all pilots with pagination and filtering
   * @param {Object} options
   * @returns {Promise<{items: Pilot[], total: number}>}
   */
  async findAll(options = {}) {
    const {
      limit = 100,
      offset = 0,
      status,
      sortBy = 'full_name',
      sortOrder = 'asc'
    } = options;

    // Whitelist allowed sort columns
    const allowedSortColumns = ['id', 'full_name', 'email', 'status', 'flight_hours_total', 'last_flight_date', 'created_at'];
    const safeSort = allowedSortColumns.includes(sortBy) ? sortBy : 'full_name';
    const safeOrder = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    let whereClause = '';
    const bindings = [];

    if (status) {
      whereClause = 'WHERE status = ?';
      bindings.push(status);
    }

    // Get total count
    const countResult = await this.db
      .prepare(`SELECT COUNT(*) as count FROM uav_pilots ${whereClause}`)
      .bind(...bindings)
      .first();

    // Get paginated results
    const results = await this.db
      .prepare(`
        SELECT * FROM uav_pilots
        ${whereClause}
        ORDER BY ${safeSort} ${safeOrder}
        LIMIT ? OFFSET ?
      `)
      .bind(...bindings, limit, offset)
      .all();

    return {
      items: results.results.map(row => Pilot.fromRecord(row)),
      total: countResult?.count || 0
    };
  }

  /**
   * Count total pilots
   * @param {Object} [filter] - Optional filter
   * @returns {Promise<number>}
   */
  async count(filter = {}) {
    let whereClause = '';
    const bindings = [];

    if (filter.status) {
      whereClause = 'WHERE status = ?';
      bindings.push(filter.status);
    }

    const result = await this.db
      .prepare(`SELECT COUNT(*) as count FROM uav_pilots ${whereClause}`)
      .bind(...bindings)
      .first();

    return result?.count || 0;
  }

  /**
   * Save pilot (insert or update)
   * @param {Pilot} pilot
   * @returns {Promise<Pilot>}
   */
  async save(pilot) {
    const data = pilot.toRecord();
    const now = new Date().toISOString();

    if (pilot.id) {
      // Update existing
      await this.db
        .prepare(`
          UPDATE uav_pilots SET
            user_id = ?,
            full_name = ?,
            email = ?,
            phone = ?,
            organization = ?,
            pilot_certificate_number = ?,
            certificate_type = ?,
            certificate_issued_date = ?,
            certificate_expiry_date = ?,
            insurance_provider = ?,
            insurance_policy_number = ?,
            insurance_expiry_date = ?,
            flight_hours_total = ?,
            flight_hours_sites_spectral = ?,
            last_flight_date = ?,
            authorized_stations = ?,
            status = ?,
            notes = ?,
            updated_at = ?
          WHERE id = ?
        `)
        .bind(
          data.user_id,
          data.full_name,
          data.email,
          data.phone,
          data.organization,
          data.pilot_certificate_number,
          data.certificate_type,
          data.certificate_issued_date,
          data.certificate_expiry_date,
          data.insurance_provider,
          data.insurance_policy_number,
          data.insurance_expiry_date,
          data.flight_hours_total,
          data.flight_hours_sites_spectral,
          data.last_flight_date,
          data.authorized_stations,
          data.status,
          data.notes,
          now,
          pilot.id
        )
        .run();

      return await this.findById(pilot.id);
    } else {
      // Insert new
      const result = await this.db
        .prepare(`
          INSERT INTO uav_pilots (
            user_id, full_name, email, phone, organization,
            pilot_certificate_number, certificate_type, certificate_issued_date, certificate_expiry_date,
            insurance_provider, insurance_policy_number, insurance_expiry_date,
            flight_hours_total, flight_hours_sites_spectral, last_flight_date,
            authorized_stations, status, notes,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          data.user_id,
          data.full_name,
          data.email,
          data.phone,
          data.organization,
          data.pilot_certificate_number,
          data.certificate_type,
          data.certificate_issued_date,
          data.certificate_expiry_date,
          data.insurance_provider,
          data.insurance_policy_number,
          data.insurance_expiry_date,
          data.flight_hours_total,
          data.flight_hours_sites_spectral,
          data.last_flight_date,
          data.authorized_stations,
          data.status,
          data.notes,
          now,
          now
        )
        .run();

      return await this.findById(result.meta.last_row_id);
    }
  }

  /**
   * Delete pilot by ID
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    const result = await this.db
      .prepare('DELETE FROM uav_pilots WHERE id = ?')
      .bind(id)
      .run();

    return result.meta.changes > 0;
  }

  /**
   * Authorize pilot for a station
   * @param {number} pilotId
   * @param {number} stationId
   * @returns {Promise<Pilot>}
   */
  async authorizeForStation(pilotId, stationId) {
    const pilot = await this.findById(pilotId);
    if (!pilot) {
      throw new Error(`Pilot ${pilotId} not found`);
    }

    if (!pilot.authorized_stations.includes(stationId)) {
      pilot.authorized_stations.push(stationId);
      return await this.save(pilot);
    }

    return pilot;
  }

  /**
   * Remove station authorization from pilot
   * @param {number} pilotId
   * @param {number} stationId
   * @returns {Promise<Pilot>}
   */
  async removeStationAuthorization(pilotId, stationId) {
    const pilot = await this.findById(pilotId);
    if (!pilot) {
      throw new Error(`Pilot ${pilotId} not found`);
    }

    pilot.authorized_stations = pilot.authorized_stations.filter(id => id !== stationId);
    return await this.save(pilot);
  }
}
