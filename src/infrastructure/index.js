/**
 * Infrastructure Layer
 *
 * Adapters for external systems (database, HTTP, auth).
 * Implements domain ports using specific technologies.
 *
 * @module infrastructure
 */

// D1 Persistence
export {
  D1StationRepository,
  D1PlatformRepository,
  D1InstrumentRepository,
  D1AdminRepository,
  D1AOIRepository,
  D1CampaignRepository,
  D1ProductRepository
} from './persistence/d1/index.js';

// Maintenance Persistence (V11)
export { D1MaintenanceRepository } from './persistence/maintenance/index.js';

// Calibration Persistence (V11)
export { D1CalibrationRepository } from './persistence/calibration/index.js';

// HTTP Controllers
export {
  StationController,
  PlatformController,
  InstrumentController,
  AdminController
} from './http/controllers/index.js';

// HTTP Router
export { createRouter } from './http/router.js';
