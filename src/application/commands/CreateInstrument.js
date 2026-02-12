/**
 * Create Instrument Use Case
 *
 * Application layer command for creating a new instrument.
 * Uses InstrumentFactory for type-specific creation.
 *
 * @module application/commands/CreateInstrument
 */

import { instrumentFactory, instrumentTypeRegistry } from '../../domain/index.js';

/**
 * @typedef {Object} CreateInstrumentInput
 * @property {number} platformId - Parent platform ID
 * @property {string} instrumentType - Instrument type (e.g., 'Phenocam', 'Multispectral')
 * @property {string} [normalizedName] - Normalized name (auto-generated if not provided)
 * @property {string} [displayName] - Human-readable name
 * @property {string} [description] - Instrument description
 * @property {string} [status] - Instrument status
 * @property {Object} [specifications] - Type-specific specifications
 */

/**
 * Create Instrument Command
 */
export class CreateInstrument {
  /**
   * @param {Object} dependencies
   * @param {import('../../domain/platform/PlatformRepository.js').PlatformRepository} dependencies.platformRepository
   * @param {import('../../domain/instrument/InstrumentRepository.js').InstrumentRepository} dependencies.instrumentRepository
   */
  constructor({ platformRepository, instrumentRepository }) {
    this.platformRepository = platformRepository;
    this.instrumentRepository = instrumentRepository;
  }

  /**
   * Execute the create instrument command
   *
   * @param {CreateInstrumentInput} input - Instrument data
   * @returns {Promise<import('../../domain/instrument/Instrument.js').Instrument>} Created instrument
   * @throws {Error} If validation fails or platform not found
   */
  async execute(input) {
    // Get platform
    const platform = await this.platformRepository.findById(input.platformId);
    if (!platform) {
      throw new Error(`Platform with ID '${input.platformId}' not found`);
    }

    // Validate instrument type
    const typeConfig = instrumentTypeRegistry.getType(input.instrumentType);
    if (!typeConfig) {
      throw new Error(`Unknown instrument type: ${input.instrumentType}`);
    }

    // Check platform compatibility
    if (!instrumentTypeRegistry.isCompatibleWithPlatform(input.instrumentType, platform.platformType)) {
      throw new Error(
        `Instrument type '${input.instrumentType}' is not compatible with platform type '${platform.platformType}'`
      );
    }

    // Generate normalized name if not provided
    let normalizedName = input.normalizedName;
    if (!normalizedName) {
      const typeCode = instrumentTypeRegistry.getCode(input.instrumentType);
      const nextNumber = await this.instrumentRepository.getNextInstrumentNumber(
        input.platformId,
        typeCode
      );
      normalizedName = `${platform.normalizedName}_${typeCode}${String(nextNumber).padStart(2, '0')}`;
    }

    // Check if instrument already exists
    const existing = await this.instrumentRepository.findByNormalizedName(normalizedName);
    if (existing) {
      throw new Error(`Instrument '${normalizedName}' already exists`);
    }

    // Create instrument using factory
    const instrument = instrumentFactory.create(input.instrumentType, {
      platformId: input.platformId,
      normalizedName: normalizedName,
      displayName: input.displayName || normalizedName,
      description: input.description,
      status: input.status || 'Active',
      specifications: input.specifications || {}
    });

    // Save and return - handle UNIQUE constraint (race condition protection)
    try {
      return await this.instrumentRepository.save(instrument);
    } catch (error) {
      // TOCTOU Race Condition: Another request may have created the same instrument
      // between our existence check and save. Handle UNIQUE constraint gracefully.
      if (error.message && error.message.includes('UNIQUE constraint')) {
        throw new Error(
          `Instrument '${normalizedName}' already exists (concurrent creation detected). ` +
          `Please try again.`
        );
      }
      throw error;
    }
  }
}
