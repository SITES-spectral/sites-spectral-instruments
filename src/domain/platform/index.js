/**
 * Platform Domain Module
 *
 * Exports platform entity, repository interface, type strategies, and related types.
 *
 * @module domain/platform
 */

export {
  Platform,
  PLATFORM_TYPES,
  ECOSYSTEM_CODES,
  MOUNT_TYPE_PREFIXES
} from './Platform.js';
export { PlatformRepository } from './PlatformRepository.js';

// Export type strategies and registry
export {
  PlatformTypeStrategy,
  FixedPlatformType,
  UAVPlatformType,
  SatellitePlatformType,
  UAV_SPECIFICATIONS,
  SATELLITE_SPECIFICATIONS,
  platformTypeRegistry
} from './types/index.js';
