/**
 * Get Station Query
 *
 * Application layer query for retrieving a single station.
 *
 * @module application/queries/GetStation
 */

/**
 * Get Station Query
 */
export class GetStation {
  /**
   * @param {Object} dependencies
   * @param {import('../../domain/station/StationRepository.js').StationRepository} dependencies.stationRepository
   */
  constructor({ stationRepository }) {
    this.stationRepository = stationRepository;
  }

  /**
   * Execute the get station query by ID
   *
   * @param {number} id - Station ID
   * @returns {Promise<import('../../domain/station/Station.js').Station|null>}
   */
  async byId(id) {
    return await this.stationRepository.findById(id);
  }

  /**
   * Execute the get station query by acronym
   *
   * @param {string} acronym - Station acronym
   * @returns {Promise<import('../../domain/station/Station.js').Station|null>}
   */
  async byAcronym(acronym) {
    return await this.stationRepository.findByAcronym(acronym);
  }
}
