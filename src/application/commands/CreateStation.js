/**
 * Create Station Use Case
 *
 * Application layer command for creating a new station.
 * Orchestrates domain logic and persistence.
 *
 * @module application/commands/CreateStation
 */

import { Station } from '../../domain/index.js';

/**
 * @typedef {Object} CreateStationInput
 * @property {string} acronym - Station acronym (2-10 uppercase letters)
 * @property {string} displayName - Human-readable station name
 * @property {string} [description] - Station description
 * @property {number} latitude - Station latitude
 * @property {number} longitude - Station longitude
 * @property {string} [websiteUrl] - Station website URL
 * @property {string} [contactEmail] - Contact email
 */

/**
 * Create Station Command
 */
export class CreateStation {
  /**
   * @param {Object} dependencies
   * @param {import('../../domain/station/StationRepository.js').StationRepository} dependencies.stationRepository
   */
  constructor({ stationRepository }) {
    this.stationRepository = stationRepository;
  }

  /**
   * Execute the create station command
   *
   * @param {CreateStationInput} input - Station data
   * @returns {Promise<Station>} Created station
   * @throws {Error} If acronym already exists or validation fails
   */
  async execute(input) {
    // Check if acronym already exists
    const existing = await this.stationRepository.findByAcronym(input.acronym);
    if (existing) {
      throw new Error(`Station with acronym '${input.acronym}' already exists`);
    }

    // Create station entity (validates input)
    const station = new Station({
      acronym: input.acronym,
      displayName: input.displayName,
      description: input.description,
      latitude: input.latitude,
      longitude: input.longitude,
      websiteUrl: input.websiteUrl,
      contactEmail: input.contactEmail
    });

    // Persist and return
    return await this.stationRepository.save(station);
  }
}
