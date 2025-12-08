/**
 * Import KML Use Case
 *
 * Application layer command for importing AOIs from KML data.
 * Converts KML to GeoJSON internally then creates AOIs.
 *
 * @module application/commands/ImportKML
 */

import { AOI, GeoJSONParser } from '../../domain/index.js';

/**
 * @typedef {Object} ImportKMLInput
 * @property {string} kml - KML string
 * @property {number} stationId - Station ID for all imported AOIs
 * @property {string} [platformTypeCode] - Platform type code
 * @property {string} [missionType] - Mission type for all AOIs
 * @property {string} [missionRecurrence] - Recurrence pattern
 * @property {string} [ecosystemCode] - Ecosystem code
 */

/**
 * Import KML Command
 */
export class ImportKML {
  /**
   * @param {Object} dependencies
   * @param {import('../../domain/aoi/AOIRepository.js').AOIRepository} dependencies.aoiRepository
   */
  constructor({ aoiRepository }) {
    this.aoiRepository = aoiRepository;
  }

  /**
   * Execute the import KML command
   *
   * @param {ImportKMLInput} input - Import parameters
   * @returns {Promise<import('../../domain/aoi/AOI.js').AOI[]>} Created AOIs
   * @throws {Error} If parsing fails or validation fails
   */
  async execute(input) {
    // Convert KML to GeoJSON
    const geojson = GeoJSONParser.parseKML(input.kml);

    // Parse the GeoJSON to AOIs
    const parsedAOIs = GeoJSONParser.parseGeoJSONObject(geojson);

    // Enhance each AOI with import metadata
    const createdAOIs = [];
    for (const aoi of parsedAOIs) {
      const enhancedAOI = new AOI({
        ...aoi.toObject(),
        stationId: input.stationId,
        platformTypeCode: input.platformTypeCode,
        missionType: input.missionType || AOI.MISSION_TYPES.MONITORING,
        missionRecurrence: input.missionRecurrence || AOI.RECURRENCE.ONE_TIME,
        ecosystemCode: input.ecosystemCode,
        sourceFormat: AOI.SOURCE_FORMATS.KML
      });

      const savedAOI = await this.aoiRepository.save(enhancedAOI);
      createdAOIs.push(savedAOI);
    }

    return createdAOIs;
  }
}
