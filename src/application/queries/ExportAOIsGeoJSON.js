/**
 * Export AOIs as GeoJSON Query
 *
 * Application layer query for exporting AOIs as GeoJSON FeatureCollection.
 *
 * @module application/queries/ExportAOIsGeoJSON
 */

/**
 * Export AOIs GeoJSON Query
 */
export class ExportAOIsGeoJSON {
  /**
   * @param {Object} dependencies
   * @param {import('../../domain/aoi/AOIRepository.js').AOIRepository} dependencies.aoiRepository
   */
  constructor({ aoiRepository }) {
    this.aoiRepository = aoiRepository;
  }

  /**
   * Export all AOIs as GeoJSON
   *
   * @returns {Promise<Object>} GeoJSON FeatureCollection
   */
  async all() {
    const aois = await this.aoiRepository.findAll();
    return this.toFeatureCollection(aois);
  }

  /**
   * Export AOIs by station as GeoJSON
   *
   * @param {number} stationId - Station ID
   * @returns {Promise<Object>} GeoJSON FeatureCollection
   */
  async byStation(stationId) {
    const aois = await this.aoiRepository.findByStationId(stationId);
    return this.toFeatureCollection(aois);
  }

  /**
   * Export specific AOIs by IDs as GeoJSON
   *
   * @param {number[]} ids - AOI IDs
   * @returns {Promise<Object>} GeoJSON FeatureCollection
   */
  async byIds(ids) {
    const aois = [];
    for (const id of ids) {
      const aoi = await this.aoiRepository.findById(id);
      if (aoi) {
        aois.push(aoi);
      }
    }
    return this.toFeatureCollection(aois);
  }

  /**
   * Convert AOIs to GeoJSON FeatureCollection
   *
   * @param {import('../../domain/aoi/AOI.js').AOI[]} aois
   * @returns {Object} GeoJSON FeatureCollection
   */
  toFeatureCollection(aois) {
    return {
      type: 'FeatureCollection',
      features: aois.map(aoi => aoi.toGeoJSON())
    };
  }
}
