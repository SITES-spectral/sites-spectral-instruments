/**
 * Application Layer
 *
 * Use cases following CQRS pattern (Command Query Responsibility Segregation).
 * This layer orchestrates domain logic and coordinates with infrastructure.
 *
 * Commands: State-changing operations (Create, Update, Delete)
 * Queries: Read-only operations (Get, List)
 *
 * @module application
 */

// Commands (Write operations)
export {
  // Station commands
  CreateStation,
  UpdateStation,
  DeleteStation,
  // Platform commands
  CreatePlatform,
  UpdatePlatform,
  DeletePlatform,
  // Instrument commands
  CreateInstrument,
  UpdateInstrument,
  DeleteInstrument
} from './commands/index.js';

// Queries (Read operations)
export {
  // Station queries
  GetStation,
  ListStations,
  GetStationDashboard,
  // Platform queries
  GetPlatform,
  ListPlatforms,
  // Instrument queries
  GetInstrument,
  ListInstruments
} from './queries/index.js';
