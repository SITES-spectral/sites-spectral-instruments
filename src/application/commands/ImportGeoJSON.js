/**
 * Import GeoJSON Use Case
 *
 * Application layer command for importing AOIs from GeoJSON data.
 * Supports Feature, FeatureCollection, and Geometry objects.
 *
 * @module application/commands/ImportGeoJSON
 */

import { AOI, GeoJSONParser } from '../../domain/index.js';

/**
 * @typedef {Object} ImportGeoJSONInput
 * @property {string|Object} geojson - GeoJSON string or object
 * @property {number} stationId - Station ID for all imported AOIs
 * @property {string} [platformTypeCode] - Platform type code
 * @property {string} [missionType] - Mission type for all AOIs
 * @property {string} [missionRecurrence] - Recurrence pattern
 * @property {string} [ecosystemCode] - Ecosystem code
 */

/**
 * Import GeoJSON Command
 */
export class ImportGeoJSON {
  /**
   * @param {Object} dependencies
   * @param {import('../../domain/aoi/AOIRepository.js').AOIRepository} dependencies.aoiRepository
   */
  constructor({ aoiRepository }) {
    this.aoiRepository = aoiRepository;
  }

  /**
   * Execute the import GeoJSON command
   *
   * @param {ImportGeoJSONInput} input - Import parameters
   * @returns {Promise<import('../../domain/aoi/AOI.js').AOI[]>} Created AOIs
   * @throws {Error} If parsing fails or validation fails
   */
  async execute(input) {
    // Parse GeoJSON
    let parsedAOIs;
    if (typeof input.geojson === 'string') {
      parsedAOIs = GeoJSONParser.parseGeoJSON(input.geojson);
    } else {
      parsedAOIs = GeoJSONParser.parseGeoJSONObject(input.geojson);
    }

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
        sourceFormat: AOI.SOURCE_FORMATS.GEOJSON
      });

      const savedAOI = await this.aoiRepository.save(enhancedAOI);
      createdAOIs.push(savedAOI);
    }

    return createdAOIs;
  }
}
