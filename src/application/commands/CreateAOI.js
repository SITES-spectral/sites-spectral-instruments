/**
 * Create AOI Use Case
 *
 * Application layer command for creating a new Area of Interest.
 * Orchestrates domain logic and persistence.
 *
 * @module application/commands/CreateAOI
 */

import { AOI } from '../../domain/index.js';

/**
 * @typedef {Object} CreateAOIInput
 * @property {string} name - AOI name
 * @property {string} [description] - AOI description
 * @property {Object} geometry - GeoJSON geometry
 * @property {string} geometryType - Geometry type (point, polygon, multipolygon)
 * @property {number} stationId - Station ID
 * @property {string} [ecosystemCode] - Ecosystem code
 * @property {string} [platformTypeCode] - Platform type code
 * @property {number} [platformId] - Platform ID
 * @property {string} [missionType] - Mission type
 * @property {string} [missionRecurrence] - Mission recurrence
 * @property {string} [sourceFormat] - Source format
 * @property {Object} [metadata] - Additional metadata
 */

/**
 * Create AOI Command
 */
export class CreateAOI {
  /**
   * @param {Object} dependencies
   * @param {import('../../domain/aoi/AOIRepository.js').AOIRepository} dependencies.aoiRepository
   */
  constructor({ aoiRepository }) {
    this.aoiRepository = aoiRepository;
  }

  /**
   * Execute the create AOI command
   *
   * @param {CreateAOIInput} input - AOI data
   * @returns {Promise<AOI>} Created AOI
   * @throws {Error} If validation fails
   */
  async execute(input) {
    // Create AOI entity (validates input)
    const aoi = new AOI({
      name: input.name,
      description: input.description,
      geometry: input.geometry,
      geometryType: input.geometryType,
      stationId: input.stationId,
      ecosystemCode: input.ecosystemCode,
      platformTypeCode: input.platformTypeCode,
      platformId: input.platformId,
      missionType: input.missionType || AOI.MISSION_TYPES.MONITORING,
      missionRecurrence: input.missionRecurrence || AOI.RECURRENCE.ONE_TIME,
      sourceFormat: input.sourceFormat || AOI.SOURCE_FORMATS.MANUAL,
      metadata: input.metadata || {}
    });

    // Persist and return
    return await this.aoiRepository.save(aoi);
  }
}
