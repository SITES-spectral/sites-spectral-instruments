/**
 * Domain Layer
 *
 * Core business logic following Hexagonal Architecture.
 * This layer is framework-agnostic and contains:
 * - Entities (Station, Platform, Instrument, AOI, Campaign, Product)
 * - Repository ports (interfaces)
 * - Domain services
 * - Type strategies and registries
 *
 * NO external dependencies allowed in this layer.
 *
 * @module domain
 */

// Station domain
export { Station, StationRepository } from './station/index.js';

// Platform domain
export {
  Platform,
  PlatformRepository,
  PLATFORM_TYPES,
  ECOSYSTEM_CODES,
  MOUNT_TYPE_PREFIXES,
  PlatformTypeStrategy,
  FixedPlatformType,
  UAVPlatformType,
  SatellitePlatformType,
  UAV_SPECIFICATIONS,
  SATELLITE_SPECIFICATIONS,
  platformTypeRegistry
} from './platform/index.js';

// Instrument domain
export {
  Instrument,
  InstrumentRepository,
  INSTRUMENT_STATUSES,
  MEASUREMENT_STATUSES,
  InstrumentTypeRegistry,
  instrumentTypeRegistry,
  InstrumentFactory,
  instrumentFactory
} from './instrument/index.js';

// AOI domain
export {
  AOI,
  AOIRepository,
  AOIService,
  GeoJSONParser
} from './aoi/index.js';

// Campaign domain
export {
  Campaign,
  CampaignRepository,
  CampaignService
} from './campaign/index.js';

// Product domain
export {
  Product,
  ProductRepository,
  ProductService
} from './product/index.js';
