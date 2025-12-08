/**
 * D1 AOI Repository
 *
 * Cloudflare D1 implementation of AOIRepository.
 * Adapts the domain port to the D1 database.
 *
 * @module infrastructure/persistence/d1/D1AOIRepository
 */

import { AOI } from '../../../domain/index.js';

/**
 * D1 AOI Repository Adapter
 * @implements {import('../../../domain/aoi/AOIRepository.js').AOIRepository}
 */
export class D1AOIRepository {
  /**
   * @param {D1Database} db - Cloudflare D1 database instance
   */
  constructor(db) {
    this.db = db;
  }

  /**
   * Map database row to AOI entity
   * @param {Object} row - Database row
   * @returns {AOI}
   */
  mapToEntity(row) {
    return new AOI({
      id: row.id,
      name: row.name,
      description: row.description,
      geometry: row.geometry_json ? JSON.parse(row.geometry_json) : null,
      geometryType: row.geometry_type?.toLowerCase() || 'polygon',
      stationId: row.station_id,
      ecosystemCode: row.ecosystem_code,
      platformTypeCode: row.platform_type_code,
      platformId: row.platform_id,
      missionType: row.mission_type || AOI.MISSION_TYPES.MONITORING,
      missionRecurrence: row.mission_recurrence || AOI.RECURRENCE.ONE_TIME,
      sourceFormat: row.source_format || AOI.SOURCE_FORMATS.MANUAL,
      metadata: row.metadata_json ? JSON.parse(row.metadata_json) : {},
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }

  /**
   * Find AOI by ID
   * @param {number} id
   * @returns {Promise<AOI|null>}
   */
  async findById(id) {
    const result = await this.db
      .prepare('SELECT * FROM areas_of_interest WHERE id = ?')
      .bind(id)
      .first();

    return result ? this.mapToEntity(result) : null;
  }

  /**
   * Find all AOIs for a station
   * @param {number} stationId
   * @returns {Promise<AOI[]>}
   */
  async findByStationId(stationId) {
    const results = await this.db
      .prepare('SELECT * FROM areas_of_interest WHERE station_id = ? ORDER BY name')
      .bind(stationId)
      .all();

    return results.results.map(row => this.mapToEntity(row));
  }

  /**
   * Find all AOIs for a platform
   * @param {number} platformId
   * @returns {Promise<AOI[]>}
   */
  async findByPlatformId(platformId) {
    const results = await this.db
      .prepare('SELECT * FROM areas_of_interest WHERE platform_id = ? ORDER BY name')
      .bind(platformId)
      .all();

    return results.results.map(row => this.mapToEntity(row));
  }

  /**
   * Find AOIs by mission type
   * @param {string} missionType
   * @returns {Promise<AOI[]>}
   */
  async findByMissionType(missionType) {
    const results = await this.db
      .prepare('SELECT * FROM areas_of_interest WHERE mission_type = ? ORDER BY name')
      .bind(missionType)
      .all();

    return results.results.map(row => this.mapToEntity(row));
  }

  /**
   * Find AOIs by geometry type
   * @param {string} geometryType
   * @returns {Promise<AOI[]>}
   */
  async findByGeometryType(geometryType) {
    const results = await this.db
      .prepare('SELECT * FROM areas_of_interest WHERE LOWER(geometry_type) = ? ORDER BY name')
      .bind(geometryType.toLowerCase())
      .all();

    return results.results.map(row => this.mapToEntity(row));
  }

  /**
   * Find AOIs by ecosystem code
   * @param {string} ecosystemCode
   * @returns {Promise<AOI[]>}
   */
  async findByEcosystemCode(ecosystemCode) {
    const results = await this.db
      .prepare('SELECT * FROM areas_of_interest WHERE ecosystem_code = ? ORDER BY name')
      .bind(ecosystemCode)
      .all();

    return results.results.map(row => this.mapToEntity(row));
  }

  /**
   * Find all AOIs
   * @returns {Promise<AOI[]>}
   */
  async findAll() {
    const results = await this.db
      .prepare('SELECT * FROM areas_of_interest ORDER BY station_id, name')
      .all();

    return results.results.map(row => this.mapToEntity(row));
  }

  /**
   * Save AOI (insert or update)
   * @param {AOI} aoi
   * @returns {Promise<AOI>}
   */
  async save(aoi) {
    const now = new Date().toISOString();
    const geometryJson = JSON.stringify(aoi.geometry);
    const metadataJson = JSON.stringify(aoi.metadata || {});
    const normalizedName = aoi.name.toLowerCase().replace(/\s+/g, '_');

    if (aoi.id) {
      // Update existing
      await this.db
        .prepare(`
          UPDATE areas_of_interest SET
            name = ?,
            normalized_name = ?,
            description = ?,
            geometry_type = ?,
            geometry_json = ?,
            ecosystem_code = ?,
            platform_type_code = ?,
            platform_id = ?,
            mission_type = ?,
            mission_recurrence = ?,
            source_format = ?,
            metadata_json = ?,
            updated_at = ?
          WHERE id = ?
        `)
        .bind(
          aoi.name,
          normalizedName,
          aoi.description,
          aoi.geometryType,
          geometryJson,
          aoi.ecosystemCode,
          aoi.platformTypeCode,
          aoi.platformId,
          aoi.missionType,
          aoi.missionRecurrence,
          aoi.sourceFormat,
          metadataJson,
          now,
          aoi.id
        )
        .run();

      return await this.findById(aoi.id);
    } else {
      // Insert new
      const result = await this.db
        .prepare(`
          INSERT INTO areas_of_interest (
            station_id, name, normalized_name, description,
            geometry_type, geometry_json,
            ecosystem_code, platform_type_code, platform_id,
            mission_type, mission_recurrence, source_format,
            metadata_json, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
        `)
        .bind(
          aoi.stationId,
          aoi.name,
          normalizedName,
          aoi.description,
          aoi.geometryType,
          geometryJson,
          aoi.ecosystemCode,
          aoi.platformTypeCode,
          aoi.platformId,
          aoi.missionType,
          aoi.missionRecurrence,
          aoi.sourceFormat,
          metadataJson,
          now,
          now
        )
        .run();

      return await this.findById(result.meta.last_row_id);
    }
  }

  /**
   * Delete AOI by ID
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  async deleteById(id) {
    const result = await this.db
      .prepare('DELETE FROM areas_of_interest WHERE id = ?')
      .bind(id)
      .run();

    return result.meta.changes > 0;
  }

  /**
   * Count AOIs for a station
   * @param {number} stationId
   * @returns {Promise<number>}
   */
  async countByStationId(stationId) {
    const result = await this.db
      .prepare('SELECT COUNT(*) as count FROM areas_of_interest WHERE station_id = ?')
      .bind(stationId)
      .first();

    return result?.count || 0;
  }

  /**
   * Check if AOI exists by ID
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  async existsById(id) {
    const result = await this.db
      .prepare('SELECT 1 FROM areas_of_interest WHERE id = ?')
      .bind(id)
      .first();

    return !!result;
  }

  /**
   * Find AOIs within bounding box
   * @param {Object} bounds - {minLat, maxLat, minLon, maxLon}
   * @returns {Promise<AOI[]>}
   */
  async findWithinBounds(bounds) {
    // For point geometries, filter by centroid coordinates
    const results = await this.db
      .prepare(`
        SELECT * FROM areas_of_interest
        WHERE centroid_lat BETWEEN ? AND ?
        AND centroid_lon BETWEEN ? AND ?
        ORDER BY name
      `)
      .bind(bounds.minLat, bounds.maxLat, bounds.minLon, bounds.maxLon)
      .all();

    return results.results.map(row => this.mapToEntity(row));
  }
}
