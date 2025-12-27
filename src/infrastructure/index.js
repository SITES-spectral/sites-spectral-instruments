/**
 * Infrastructure Layer
 *
 * Adapters for external systems (database, HTTP, auth).
 * Implements domain ports using specific technologies.
 *
 * @module infrastructure
 */

// ===== PERSISTENCE ADAPTERS =====

// D1 Persistence
export {
  D1StationRepository,
  D1PlatformRepository,
  D1InstrumentRepository,
  D1AdminRepository,
  D1AOIRepository,
  D1CampaignRepository,
  D1ProductRepository,
  D1ROIRepository,
  D1ExportRepository,
  D1AnalyticsRepository
} from './persistence/d1/index.js';

// Maintenance Persistence (V11)
export { D1MaintenanceRepository } from './persistence/maintenance/index.js';

// Calibration Persistence (V11)
export { D1CalibrationRepository } from './persistence/calibration/index.js';

// ===== EVENT ADAPTERS =====

export { InMemoryEventBus } from './events/InMemoryEventBus.js';

// ===== LOGGING ADAPTERS =====

export { StructuredConsoleLogger } from './logging/StructuredConsoleLogger.js';

// ===== METRICS ADAPTERS =====

export { NoOpMetricsAdapter } from './metrics/NoOpMetricsAdapter.js';

// ===== AUTH ADAPTERS =====

export { CloudflareCredentialsAdapter } from './auth/CloudflareCredentialsAdapter.js';

// ===== HTTP ADAPTERS =====

// HTTP Controllers
export {
  StationController,
  PlatformController,
  InstrumentController,
  AdminController
} from './http/controllers/index.js';

// HTTP Router
export { createRouter } from './http/router.js';

// API Version Resolver
export {
  resolveAPIVersion,
  getVersionInfo,
  getAppVersionInfo,
  VersionInfo
} from './api/version-resolver.js';
