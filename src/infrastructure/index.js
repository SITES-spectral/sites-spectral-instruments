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
  D1InstrumentRepository
} from './persistence/d1/index.js';

// HTTP Controllers
export {
  StationController,
  PlatformController,
  InstrumentController
} from './http/controllers/index.js';

// HTTP Router
export { createRouter } from './http/router.js';
