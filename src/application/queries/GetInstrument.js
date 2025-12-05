/**
 * Get Instrument Query
 *
 * Application layer query for retrieving a single instrument.
 *
 * @module application/queries/GetInstrument
 */

/**
 * Get Instrument Query
 */
export class GetInstrument {
  /**
   * @param {Object} dependencies
   * @param {import('../../domain/instrument/InstrumentRepository.js').InstrumentRepository} dependencies.instrumentRepository
   */
  constructor({ instrumentRepository }) {
    this.instrumentRepository = instrumentRepository;
  }

  /**
   * Execute the get instrument query by ID
   *
   * @param {number} id - Instrument ID
   * @returns {Promise<import('../../domain/instrument/Instrument.js').Instrument|null>}
   */
  async byId(id) {
    return await this.instrumentRepository.findById(id);
  }

  /**
   * Execute the get instrument query by normalized name
   *
   * @param {string} normalizedName - Instrument normalized name
   * @returns {Promise<import('../../domain/instrument/Instrument.js').Instrument|null>}
   */
  async byNormalizedName(normalizedName) {
    return await this.instrumentRepository.findByNormalizedName(normalizedName);
  }

  /**
   * Get instrument with full details including platform and station info
   *
   * @param {number} id - Instrument ID
   * @returns {Promise<Object|null>} Instrument with relations
   */
  async withDetails(id) {
    return await this.instrumentRepository.findByIdWithDetails(id);
  }
}
