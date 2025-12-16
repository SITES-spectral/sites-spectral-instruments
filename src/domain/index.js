/**
 * Domain Layer (V11 Architecture)
 *
 * Core business logic following Hexagonal Architecture.
 * This layer is framework-agnostic and contains:
 * - Entities (Station, Platform, Instrument, AOI, Campaign, Product, Maintenance, Calibration)
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

// Maintenance domain (V11)
export {
  MaintenanceRecord,
  MaintenanceRepository,
  MaintenanceService
} from './maintenance/index.js';

// Calibration domain (V11 - Multispectral sensors only)
export {
  CalibrationRecord,
  CalibrationRepository,
  CalibrationService
} from './calibration/index.js';

// ROI domain (V11)
export {
  ROI,
  ROIRepository,
  ROIService
} from './roi/index.js';

// User domain (V11)
export {
  UserCredentialsPort,
  UserService
} from './user/index.js';

// Analytics domain (V11)
export {
  AnalyticsRepository,
  AnalyticsService
} from './analytics/index.js';

// Export domain (V11)
export {
  ExportRepository,
  ExportService
} from './export/index.js';
