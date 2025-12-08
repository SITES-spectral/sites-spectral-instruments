/**
 * List AOIs Query
 *
 * Application layer query for listing AOIs with various filters.
 *
 * @module application/queries/ListAOIs
 */

/**
 * List AOIs Query
 */
export class ListAOIs {
  /**
   * @param {Object} dependencies
   * @param {import('../../domain/aoi/AOIRepository.js').AOIRepository} dependencies.aoiRepository
   */
  constructor({ aoiRepository }) {
    this.aoiRepository = aoiRepository;
  }

  /**
   * List all AOIs
   *
   * @returns {Promise<import('../../domain/aoi/AOI.js').AOI[]>}
   */
  async all() {
    return await this.aoiRepository.findAll();
  }

  /**
   * List AOIs by station ID
   *
   * @param {number} stationId - Station ID
   * @returns {Promise<import('../../domain/aoi/AOI.js').AOI[]>}
   */
  async byStation(stationId) {
    return await this.aoiRepository.findByStationId(stationId);
  }

  /**
   * List AOIs by platform ID
   *
   * @param {number} platformId - Platform ID
   * @returns {Promise<import('../../domain/aoi/AOI.js').AOI[]>}
   */
  async byPlatform(platformId) {
    return await this.aoiRepository.findByPlatformId(platformId);
  }

  /**
   * List AOIs by ecosystem code
   *
   * @param {string} ecosystemCode - Ecosystem code
   * @returns {Promise<import('../../domain/aoi/AOI.js').AOI[]>}
   */
  async byEcosystem(ecosystemCode) {
    return await this.aoiRepository.findByEcosystemCode(ecosystemCode);
  }

  /**
   * List AOIs by mission type
   *
   * @param {string} missionType - Mission type
   * @returns {Promise<import('../../domain/aoi/AOI.js').AOI[]>}
   */
  async byMissionType(missionType) {
    return await this.aoiRepository.findByMissionType(missionType);
  }

  /**
   * List AOIs by geometry type
   *
   * @param {string} geometryType - Geometry type (point, polygon, multipolygon)
   * @returns {Promise<import('../../domain/aoi/AOI.js').AOI[]>}
   */
  async byGeometryType(geometryType) {
    return await this.aoiRepository.findByGeometryType(geometryType);
  }

  /**
   * List AOIs within bounding box
   *
   * @param {Object} bounds - Bounding box {minLat, maxLat, minLon, maxLon}
   * @returns {Promise<import('../../domain/aoi/AOI.js').AOI[]>}
   */
  async withinBounds(bounds) {
    return await this.aoiRepository.findWithinBounds(bounds);
  }

  /**
   * Get AOI count by station
   *
   * @param {number} stationId - Station ID
   * @returns {Promise<number>}
   */
  async countByStation(stationId) {
    return await this.aoiRepository.countByStationId(stationId);
  }
}
