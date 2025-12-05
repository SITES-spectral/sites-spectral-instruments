/**
 * Create Platform Use Case
 *
 * Application layer command for creating a new platform.
 * Uses platform type strategies for type-specific behavior.
 * Handles auto-instrument creation for UAV platforms.
 *
 * @module application/commands/CreatePlatform
 */

import {
  Platform,
  platformTypeRegistry,
  instrumentFactory
} from '../../domain/index.js';

/**
 * @typedef {Object} CreatePlatformInput
 * @property {number} stationId - Parent station ID
 * @property {string} platformType - Platform type ('fixed', 'uav', 'satellite')
 * @property {string} [ecosystemCode] - Ecosystem code (required for fixed)
 * @property {string} [mountTypeCode] - Mount type code (e.g., 'PL01', 'UAV01')
 * @property {string} [vendor] - UAV vendor (required for UAV)
 * @property {string} [model] - UAV model (required for UAV)
 * @property {string} [agency] - Satellite agency (required for satellite)
 * @property {string} [satellite] - Satellite name (required for satellite)
 * @property {string} [sensor] - Satellite sensor (required for satellite)
 * @property {string} [displayName] - Human-readable name
 * @property {string} [description] - Platform description
 * @property {number} [latitude] - Platform latitude
 * @property {number} [longitude] - Platform longitude
 */

/**
 * Create Platform Command
 */
export class CreatePlatform {
  /**
   * @param {Object} dependencies
   * @param {import('../../domain/station/StationRepository.js').StationRepository} dependencies.stationRepository
   * @param {import('../../domain/platform/PlatformRepository.js').PlatformRepository} dependencies.platformRepository
   * @param {import('../../domain/instrument/InstrumentRepository.js').InstrumentRepository} dependencies.instrumentRepository
   */
  constructor({ stationRepository, platformRepository, instrumentRepository }) {
    this.stationRepository = stationRepository;
    this.platformRepository = platformRepository;
    this.instrumentRepository = instrumentRepository;
  }

  /**
   * Execute the create platform command
   *
   * @param {CreatePlatformInput} input - Platform data
   * @returns {Promise<{platform: Platform, instruments: Array}>} Created platform and auto-created instruments
   * @throws {Error} If validation fails or station not found
   */
  async execute(input) {
    // Get station
    const station = await this.stationRepository.findById(input.stationId);
    if (!station) {
      throw new Error(`Station with ID '${input.stationId}' not found`);
    }

    // Get platform type strategy
    const typeStrategy = platformTypeRegistry.getStrategy(input.platformType);
    if (!typeStrategy) {
      throw new Error(`Unknown platform type: ${input.platformType}`);
    }

    // Validate input for this platform type
    const validation = typeStrategy.validate(input);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Generate mount type code if not provided
    let mountTypeCode = input.mountTypeCode;
    if (!mountTypeCode) {
      const mountTypePrefix = this._getMountTypePrefix(input.platformType);
      mountTypeCode = await this.platformRepository.getNextMountTypeCode(
        input.stationId,
        mountTypePrefix,
        input.ecosystemCode
      );
    }

    // Generate normalized name
    const normalizedName = typeStrategy.generateNormalizedName({
      stationAcronym: station.acronym,
      ecosystemCode: input.ecosystemCode,
      mountTypeCode: mountTypeCode,
      vendor: input.vendor,
      model: input.model,
      agency: input.agency,
      satellite: input.satellite,
      sensor: input.sensor
    });

    // Check if platform already exists
    const existing = await this.platformRepository.findByNormalizedName(normalizedName);
    if (existing) {
      throw new Error(`Platform '${normalizedName}' already exists`);
    }

    // Create platform entity
    const platform = Platform.create({
      stationId: input.stationId,
      normalizedName: normalizedName,
      displayName: input.displayName || normalizedName,
      platformType: input.platformType,
      ecosystemCode: input.ecosystemCode,
      mountTypeCode: mountTypeCode,
      description: input.description,
      latitude: input.latitude ?? station.latitude,
      longitude: input.longitude ?? station.longitude,
      // Store type-specific data
      vendor: input.vendor,
      model: input.model,
      agency: input.agency,
      satellite: input.satellite,
      sensor: input.sensor
    });

    // Save platform
    const savedPlatform = await this.platformRepository.save(platform);

    // Auto-create instruments if applicable (e.g., UAV platforms)
    const createdInstruments = [];
    if (typeStrategy.autoCreatesInstruments()) {
      const instrumentsData = typeStrategy.getAutoCreatedInstruments({
        ...input,
        platformId: savedPlatform.id,
        platformName: normalizedName
      });

      for (const instrumentData of instrumentsData) {
        const instrument = instrumentFactory.create(
          instrumentData.instrumentType,
          {
            ...instrumentData,
            platformId: savedPlatform.id
          }
        );
        const savedInstrument = await this.instrumentRepository.save(instrument);
        createdInstruments.push(savedInstrument);
      }
    }

    return {
      platform: savedPlatform,
      instruments: createdInstruments
    };
  }

  /**
   * Get mount type prefix based on platform type
   * @private
   */
  _getMountTypePrefix(platformType) {
    const prefixMap = {
      fixed: 'PL', // Default to pole, can be overridden
      uav: 'UAV',
      satellite: 'SAT',
      mobile: 'MOB',
      usv: 'USV',
      uuv: 'UUV'
    };
    return prefixMap[platformType] || 'PL';
  }
}
