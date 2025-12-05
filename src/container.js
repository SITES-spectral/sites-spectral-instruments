/**
 * Dependency Injection Container
 *
 * Wires up domain, application, and infrastructure layers.
 * Creates and manages service instances.
 *
 * @module container
 */

import {
  D1StationRepository,
  D1PlatformRepository,
  D1InstrumentRepository
} from './infrastructure/index.js';

import {
  // Commands
  CreateStation,
  UpdateStation,
  DeleteStation,
  CreatePlatform,
  UpdatePlatform,
  DeletePlatform,
  CreateInstrument,
  UpdateInstrument,
  DeleteInstrument,
  // Queries
  GetStation,
  ListStations,
  GetStationDashboard,
  GetPlatform,
  ListPlatforms,
  GetInstrument,
  ListInstruments
} from './application/index.js';

/**
 * Create container with all dependencies
 *
 * @param {Object} env - Cloudflare Worker environment
 * @returns {Object} Container with all services
 */
export function createContainer(env) {
  const db = env.DB;

  // Repositories (Infrastructure adapters)
  const stationRepository = new D1StationRepository(db);
  const platformRepository = new D1PlatformRepository(db);
  const instrumentRepository = new D1InstrumentRepository(db);

  // Shared dependencies
  const deps = {
    stationRepository,
    platformRepository,
    instrumentRepository
  };

  // Commands
  const commands = {
    createStation: new CreateStation(deps),
    updateStation: new UpdateStation(deps),
    deleteStation: new DeleteStation(deps),
    createPlatform: new CreatePlatform(deps),
    updatePlatform: new UpdatePlatform(deps),
    deletePlatform: new DeletePlatform(deps),
    createInstrument: new CreateInstrument(deps),
    updateInstrument: new UpdateInstrument(deps),
    deleteInstrument: new DeleteInstrument(deps)
  };

  // Queries
  const queries = {
    getStation: new GetStation(deps),
    listStations: new ListStations(deps),
    getStationDashboard: new GetStationDashboard(deps),
    getPlatform: new GetPlatform(deps),
    listPlatforms: new ListPlatforms(deps),
    getInstrument: new GetInstrument(deps),
    listInstruments: new ListInstruments(deps)
  };

  return {
    // Repositories (for direct access if needed)
    repositories: {
      station: stationRepository,
      platform: platformRepository,
      instrument: instrumentRepository
    },
    // Use cases
    commands,
    queries
  };
}
