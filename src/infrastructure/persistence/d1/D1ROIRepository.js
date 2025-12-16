/**
 * D1 ROI Repository
 *
 * Cloudflare D1 implementation of ROIRepository.
 * Adapts the domain port to the D1 database.
 *
 * @module infrastructure/persistence/d1/D1ROIRepository
 * @version 11.0.0
 */

import { ROI } from '../../../domain/roi/ROI.js';

/**
 * D1 ROI Repository Adapter
 * @implements {import('../../../domain/roi/ROIRepository.js').ROIRepository}
 */
export class D1ROIRepository {
  /**
   * @param {D1Database} db - Cloudflare D1 database instance
   */
  constructor(db) {
    this.db = db;
  }

  /**
   * Find ROI by ID
   * @param {number} id
   * @returns {Promise<ROI|null>}
   */
  async findById(id) {
    const result = await this.db
      .prepare(`
        SELECT r.*,
               i.normalized_name as instrument_name,
               p.display_name as platform_name,
               s.acronym as station_acronym,
               s.id as station_id
        FROM instrument_rois r
        JOIN instruments i ON r.instrument_id = i.id
        JOIN platforms p ON i.platform_id = p.id
        JOIN stations s ON p.station_id = s.id
        WHERE r.id = ?
      `)
      .bind(id)
      .first();

    return result ? this._toEntity(result) : null;
  }

  /**
   * Find all ROIs for an instrument
   * @param {number} instrumentId
   * @param {Object} [options]
   * @param {boolean} [options.includeLegacy=false]
   * @returns {Promise<ROI[]>}
   */
  async findByInstrumentId(instrumentId, options = {}) {
    const { includeLegacy = false } = options;

    let query = `
      SELECT r.*,
             i.normalized_name as instrument_name,
             p.display_name as platform_name,
             s.acronym as station_acronym,
             s.id as station_id
      FROM instrument_rois r
      JOIN instruments i ON r.instrument_id = i.id
      JOIN platforms p ON i.platform_id = p.id
      JOIN stations s ON p.station_id = s.id
      WHERE r.instrument_id = ?
    `;

    if (!includeLegacy) {
      query += ' AND (r.is_legacy IS NULL OR r.is_legacy = 0)';
    }

    query += ' ORDER BY r.roi_name';

    const results = await this.db
      .prepare(query)
      .bind(instrumentId)
      .all();

    return results.results.map(row => this._toEntity(row));
  }

  /**
   * Find all ROIs for a station (via instruments)
   * @param {number} stationId
   * @param {Object} [options]
   * @param {boolean} [options.includeLegacy=false]
   * @returns {Promise<ROI[]>}
   */
  async findByStationId(stationId, options = {}) {
    const { includeLegacy = false } = options;

    let query = `
      SELECT r.*,
             i.normalized_name as instrument_name,
             p.display_name as platform_name,
             s.acronym as station_acronym,
             s.id as station_id
      FROM instrument_rois r
      JOIN instruments i ON r.instrument_id = i.id
      JOIN platforms p ON i.platform_id = p.id
      JOIN stations s ON p.station_id = s.id
      WHERE s.id = ?
    `;

    if (!includeLegacy) {
      query += ' AND (r.is_legacy IS NULL OR r.is_legacy = 0)';
    }

    query += ' ORDER BY i.normalized_name, r.roi_name';

    const results = await this.db
      .prepare(query)
      .bind(stationId)
      .all();

    return results.results.map(row => this._toEntity(row));
  }

  /**
   * Find all ROIs with filtering and pagination
   * @param {Object} filters
   * @param {Object} pagination
   * @returns {Promise<{rois: ROI[], total: number, page: number, limit: number}>}
   */
  async findAll(filters = {}, pagination = {}) {
    const {
      instrumentId,
      stationId,
      includeLegacy = false,
      status
    } = filters;

    const {
      page = 1,
      limit = 50
    } = pagination;

    const offset = (page - 1) * limit;

    // Build query
    let baseQuery = `
      FROM instrument_rois r
      JOIN instruments i ON r.instrument_id = i.id
      JOIN platforms p ON i.platform_id = p.id
      JOIN stations s ON p.station_id = s.id
    `;

    const conditions = [];
    const params = [];

    if (instrumentId) {
      conditions.push('r.instrument_id = ?');
      params.push(instrumentId);
    }
    if (stationId) {
      conditions.push('s.id = ?');
      params.push(stationId);
    }
    if (!includeLegacy) {
      conditions.push('(r.is_legacy IS NULL OR r.is_legacy = 0)');
    }
    if (status) {
      conditions.push('r.status = ?');
      params.push(status);
    }

    if (conditions.length > 0) {
      baseQuery += ' WHERE ' + conditions.join(' AND ');
    }

    // Get total count
    const countResult = await this.db
      .prepare(`SELECT COUNT(*) as count ${baseQuery}`)
      .bind(...params)
      .first();

    const total = countResult?.count || 0;

    // Get paginated results
    const selectQuery = `
      SELECT r.*,
             i.normalized_name as instrument_name,
             p.display_name as platform_name,
             s.acronym as station_acronym,
             s.id as station_id
      ${baseQuery}
      ORDER BY s.acronym, i.normalized_name, r.roi_name
      LIMIT ? OFFSET ?
    `;

    const results = await this.db
      .prepare(selectQuery)
      .bind(...params, limit, offset)
      .all();

    return {
      rois: results.results.map(row => this._toEntity(row)),
      total,
      page,
      limit
    };
  }

  /**
   * Save ROI (create or update)
   * @param {ROI} roi
   * @returns {Promise<ROI>}
   */
  async save(roi) {
    const now = new Date().toISOString();
    const pointsJson = typeof roi.pointsJson === 'string'
      ? roi.pointsJson
      : JSON.stringify(roi.pointsJson || []);

    if (roi.id) {
      // Update existing
      await this.db
        .prepare(`
          UPDATE instrument_rois SET
            roi_name = ?,
            display_name = ?,
            description = ?,
            points_json = ?,
            color_r = ?,
            color_g = ?,
            color_b = ?,
            alpha = ?,
            thickness = ?,
            auto_generated = ?,
            generated_date = ?,
            source_image = ?,
            vegetation_type = ?,
            status = ?,
            is_legacy = ?,
            legacy_date = ?,
            replaced_by_roi_id = ?,
            timeseries_broken = ?,
            legacy_reason = ?,
            updated_at = ?
          WHERE id = ?
        `)
        .bind(
          roi.roiName,
          roi.displayName,
          roi.description,
          pointsJson,
          roi.colorR,
          roi.colorG,
          roi.colorB,
          roi.alpha,
          roi.thickness,
          roi.autoGenerated ? 1 : 0,
          roi.generatedDate,
          roi.sourceImage,
          roi.vegetationType,
          roi.status,
          roi.isLegacy ? 1 : 0,
          roi.legacyDate,
          roi.replacedByROIId,
          roi.timeseriesBroken ? 1 : 0,
          roi.legacyReason,
          now,
          roi.id
        )
        .run();

      return await this.findById(roi.id);
    } else {
      // Insert new
      const result = await this.db
        .prepare(`
          INSERT INTO instrument_rois (
            instrument_id, roi_name, display_name, description,
            points_json, color_r, color_g, color_b, alpha, thickness,
            auto_generated, generated_date, source_image, vegetation_type,
            status, is_legacy, legacy_date, replaced_by_roi_id,
            timeseries_broken, legacy_reason, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          roi.instrumentId,
          roi.roiName,
          roi.displayName,
          roi.description,
          pointsJson,
          roi.colorR,
          roi.colorG,
          roi.colorB,
          roi.alpha,
          roi.thickness,
          roi.autoGenerated ? 1 : 0,
          roi.generatedDate || now,
          roi.sourceImage,
          roi.vegetationType,
          roi.status || ROI.STATUSES.ACTIVE,
          roi.isLegacy ? 1 : 0,
          roi.legacyDate,
          roi.replacedByROIId,
          roi.timeseriesBroken ? 1 : 0,
          roi.legacyReason,
          now,
          now
        )
        .run();

      return await this.findById(result.meta.last_row_id);
    }
  }

  /**
   * Delete ROI by ID
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    const result = await this.db
      .prepare('DELETE FROM instrument_rois WHERE id = ?')
      .bind(id)
      .run();

    return result.meta.changes > 0;
  }

  /**
   * Mark ROI as legacy
   * @param {number} id
   * @param {string} reason
   * @param {number} [replacementId]
   * @returns {Promise<ROI>}
   */
  async markAsLegacy(id, reason, replacementId = null) {
    const now = new Date().toISOString();

    await this.db
      .prepare(`
        UPDATE instrument_rois SET
          is_legacy = 1,
          legacy_date = ?,
          legacy_reason = ?,
          replaced_by_roi_id = ?,
          status = ?,
          updated_at = ?
        WHERE id = ?
      `)
      .bind(now, reason, replacementId, ROI.STATUSES.ARCHIVED, now, id)
      .run();

    return await this.findById(id);
  }

  /**
   * Get next available ROI name for instrument
   * @param {number} instrumentId
   * @returns {Promise<string>}
   */
  async getNextROIName(instrumentId) {
    // Query ALL ROI names (including legacy) for this instrument
    const results = await this.db
      .prepare(`
        SELECT roi_name FROM instrument_rois
        WHERE instrument_id = ? AND roi_name LIKE 'ROI_%'
        ORDER BY roi_name
      `)
      .bind(instrumentId)
      .all();

    const existingNames = new Set(results.results.map(r => r.roi_name));

    // Find first available number (starting at 1, skipping all existing including legacy)
    let num = 1;
    while (existingNames.has(`ROI_${String(num).padStart(2, '0')}`)) {
      num++;
    }
    return `ROI_${String(num).padStart(2, '0')}`;
  }

  /**
   * Count ROIs for an instrument
   * @param {number} instrumentId
   * @param {Object} [options]
   * @param {boolean} [options.includeLegacy=false]
   * @returns {Promise<number>}
   */
  async countByInstrument(instrumentId, options = {}) {
    const { includeLegacy = false } = options;

    let query = 'SELECT COUNT(*) as count FROM instrument_rois WHERE instrument_id = ?';

    if (!includeLegacy) {
      query += ' AND (is_legacy IS NULL OR is_legacy = 0)';
    }

    const result = await this.db
      .prepare(query)
      .bind(instrumentId)
      .first();

    return result?.count || 0;
  }

  /**
   * Find ROI with its replacement chain
   * @param {number} id
   * @returns {Promise<{current: ROI, legacy: ROI[], replacement: ROI|null}|null>}
   */
  async findWithReplacementChain(id) {
    const current = await this.findById(id);
    if (!current) return null;

    // Find legacy ROIs that were replaced by this one
    const legacyResults = await this.db
      .prepare(`
        SELECT r.*,
               i.normalized_name as instrument_name,
               p.display_name as platform_name,
               s.acronym as station_acronym,
               s.id as station_id
        FROM instrument_rois r
        JOIN instruments i ON r.instrument_id = i.id
        JOIN platforms p ON i.platform_id = p.id
        JOIN stations s ON p.station_id = s.id
        WHERE r.replaced_by_roi_id = ?
        ORDER BY r.legacy_date DESC
      `)
      .bind(id)
      .all();

    const legacy = legacyResults.results.map(row => this._toEntity(row));

    // Find replacement if this ROI has one
    let replacement = null;
    if (current.replacedByROIId) {
      replacement = await this.findById(current.replacedByROIId);
    }

    return { current, legacy, replacement };
  }

  /**
   * Check if ROI name exists for instrument
   * @param {number} instrumentId
   * @param {string} roiName
   * @param {number} [excludeId]
   * @returns {Promise<boolean>}
   */
  async existsByName(instrumentId, roiName, excludeId = null) {
    let query = `
      SELECT COUNT(*) as count FROM instrument_rois
      WHERE instrument_id = ? AND roi_name = ?
    `;
    const params = [instrumentId, roiName];

    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }

    const result = await this.db
      .prepare(query)
      .bind(...params)
      .first();

    return (result?.count || 0) > 0;
  }

  /**
   * Get instrument info for ROI (for authorization checks)
   * @param {number} roiId
   * @returns {Promise<{instrumentId: number, platformId: number, stationId: number}|null>}
   */
  async getInstrumentInfo(roiId) {
    const result = await this.db
      .prepare(`
        SELECT
          r.instrument_id,
          i.platform_id,
          p.station_id,
          s.normalized_name as station_normalized_name
        FROM instrument_rois r
        JOIN instruments i ON r.instrument_id = i.id
        JOIN platforms p ON i.platform_id = p.id
        JOIN stations s ON p.station_id = s.id
        WHERE r.id = ?
      `)
      .bind(roiId)
      .first();

    if (!result) return null;

    return {
      instrumentId: result.instrument_id,
      platformId: result.platform_id,
      stationId: result.station_id,
      stationNormalizedName: result.station_normalized_name
    };
  }

  /**
   * Convert database row to ROI entity
   * @private
   * @param {Object} row
   * @returns {ROI}
   */
  _toEntity(row) {
    const roi = ROI.fromDatabase(row);

    // Add relation data if present
    if (row.instrument_name) roi.instrumentName = row.instrument_name;
    if (row.platform_name) roi.platformName = row.platform_name;
    if (row.station_acronym) roi.stationAcronym = row.station_acronym;
    if (row.station_id) roi.stationId = row.station_id;

    return roi;
  }
}
