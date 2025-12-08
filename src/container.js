/**
 * Dependency Injection Container (V11 Architecture)
 *
 * Wires up domain, application, and infrastructure layers.
 * Creates and manages service instances following SOLID principles.
 *
 * @module container
 */

import {
  // Core repositories
  D1StationRepository,
  D1PlatformRepository,
  D1InstrumentRepository,
  D1AdminRepository,
  // V11 Domain repositories
  D1AOIRepository,
  D1CampaignRepository,
  D1ProductRepository,
  D1MaintenanceRepository,
  D1CalibrationRepository
} from './infrastructure/index.js';

import {
  // Station Commands
  CreateStation,
  UpdateStation,
  DeleteStation,
  // Platform Commands
  CreatePlatform,
  UpdatePlatform,
  DeletePlatform,
  // Instrument Commands
  CreateInstrument,
  UpdateInstrument,
  DeleteInstrument,
  // AOI Commands (V11)
  CreateAOI,
  UpdateAOI,
  DeleteAOI,
  ImportGeoJSON,
  ImportKML,
  // Campaign Commands (V11)
  CreateCampaign,
  UpdateCampaign,
  DeleteCampaign,
  StartCampaign,
  CompleteCampaign,
  // Product Commands (V11)
  CreateProduct,
  UpdateProduct,
  DeleteProduct,
  SetProductQualityScore,
  PromoteProductQuality,
  // Maintenance Commands (V11)
  CreateMaintenanceRecord,
  UpdateMaintenanceRecord,
  DeleteMaintenanceRecord,
  CompleteMaintenanceRecord,
  // Calibration Commands (V11)
  CreateCalibrationRecord,
  UpdateCalibrationRecord,
  DeleteCalibrationRecord,
  ExpireCalibrationRecord,
  // Station Queries
  GetStation,
  ListStations,
  GetStationDashboard,
  // Platform Queries
  GetPlatform,
  ListPlatforms,
  // Instrument Queries
  GetInstrument,
  ListInstruments,
  // AOI Queries (V11)
  GetAOI,
  ListAOIs,
  ExportAOIsGeoJSON,
  // Campaign Queries (V11)
  GetCampaign,
  ListCampaigns,
  // Product Queries (V11)
  GetProduct,
  ListProducts,
  // Admin queries
  GetActivityLogs,
  GetUserSessions,
  GetStationStats,
  // Maintenance Queries (V11)
  GetMaintenanceRecord,
  ListMaintenanceRecords,
  GetMaintenanceTimeline,
  // Calibration Queries (V11)
  GetCalibrationRecord,
  ListCalibrationRecords,
  GetCalibrationTimeline,
  GetCurrentCalibration
} from './application/index.js';

/**
 * Create container with all dependencies
 *
 * @param {Object} env - Cloudflare Worker environment
 * @returns {Object} Container with all services
 */
export function createContainer(env) {
  const db = env.DB;

  // ===== REPOSITORIES (Infrastructure Adapters) =====
  // Core repositories
  const stationRepository = new D1StationRepository(db);
  const platformRepository = new D1PlatformRepository(db);
  const instrumentRepository = new D1InstrumentRepository(db);
  const adminRepository = new D1AdminRepository(db);

  // V11 Domain repositories
  const aoiRepository = new D1AOIRepository(db);
  const campaignRepository = new D1CampaignRepository(db);
  const productRepository = new D1ProductRepository(db);
  const maintenanceRepository = new D1MaintenanceRepository(db);
  const calibrationRepository = new D1CalibrationRepository(db);

  // ===== SHARED DEPENDENCIES =====
  const deps = {
    // Core
    stationRepository,
    platformRepository,
    instrumentRepository,
    // V11 Domains
    aoiRepository,
    campaignRepository,
    productRepository,
    maintenanceRepository,
    calibrationRepository
  };

  // ===== COMMANDS =====
  const commands = {
    // Station commands
    createStation: new CreateStation(deps),
    updateStation: new UpdateStation(deps),
    deleteStation: new DeleteStation(deps),
    // Platform commands
    createPlatform: new CreatePlatform(deps),
    updatePlatform: new UpdatePlatform(deps),
    deletePlatform: new DeletePlatform(deps),
    // Instrument commands
    createInstrument: new CreateInstrument(deps),
    updateInstrument: new UpdateInstrument(deps),
    deleteInstrument: new DeleteInstrument(deps),
    // AOI commands (V11)
    createAOI: new CreateAOI(deps),
    updateAOI: new UpdateAOI(deps),
    deleteAOI: new DeleteAOI(deps),
    importGeoJSON: new ImportGeoJSON(deps),
    importKML: new ImportKML(deps),
    // Campaign commands (V11)
    createCampaign: new CreateCampaign(deps),
    updateCampaign: new UpdateCampaign(deps),
    deleteCampaign: new DeleteCampaign(deps),
    startCampaign: new StartCampaign(deps),
    completeCampaign: new CompleteCampaign(deps),
    // Product commands (V11)
    createProduct: new CreateProduct(deps),
    updateProduct: new UpdateProduct(deps),
    deleteProduct: new DeleteProduct(deps),
    setProductQualityScore: new SetProductQualityScore(deps),
    promoteProductQuality: new PromoteProductQuality(deps),
    // Maintenance commands (V11)
    createMaintenanceRecord: new CreateMaintenanceRecord(deps),
    updateMaintenanceRecord: new UpdateMaintenanceRecord(deps),
    deleteMaintenanceRecord: new DeleteMaintenanceRecord(deps),
    completeMaintenanceRecord: new CompleteMaintenanceRecord(deps),
    // Calibration commands (V11)
    createCalibrationRecord: new CreateCalibrationRecord(deps),
    updateCalibrationRecord: new UpdateCalibrationRecord(deps),
    deleteCalibrationRecord: new DeleteCalibrationRecord(deps),
    expireCalibrationRecord: new ExpireCalibrationRecord(deps)
  };

  // ===== QUERIES =====
  const queries = {
    // Station queries
    getStation: new GetStation(deps),
    listStations: new ListStations(deps),
    getStationDashboard: new GetStationDashboard(deps),
    // Platform queries
    getPlatform: new GetPlatform(deps),
    listPlatforms: new ListPlatforms(deps),
    // Instrument queries
    getInstrument: new GetInstrument(deps),
    listInstruments: new ListInstruments(deps),
    // AOI queries (V11)
    getAOI: new GetAOI(deps),
    listAOIs: new ListAOIs(deps),
    exportAOIsGeoJSON: new ExportAOIsGeoJSON(deps),
    // Campaign queries (V11)
    getCampaign: new GetCampaign(deps),
    listCampaigns: new ListCampaigns(deps),
    // Product queries (V11)
    getProduct: new GetProduct(deps),
    listProducts: new ListProducts(deps),
    // Admin queries
    getActivityLogs: new GetActivityLogs(adminRepository),
    getUserSessions: new GetUserSessions(adminRepository),
    getStationStats: new GetStationStats(adminRepository),
    // Maintenance queries (V11)
    getMaintenanceRecord: new GetMaintenanceRecord(deps),
    listMaintenanceRecords: new ListMaintenanceRecords(deps),
    getMaintenanceTimeline: new GetMaintenanceTimeline(deps),
    // Calibration queries (V11)
    getCalibrationRecord: new GetCalibrationRecord(deps),
    listCalibrationRecords: new ListCalibrationRecords(deps),
    getCalibrationTimeline: new GetCalibrationTimeline(deps),
    getCurrentCalibration: new GetCurrentCalibration(deps)
  };

  return {
    // Repositories (for direct access if needed)
    repositories: {
      // Core
      station: stationRepository,
      platform: platformRepository,
      instrument: instrumentRepository,
      // V11 Domains
      aoi: aoiRepository,
      campaign: campaignRepository,
      product: productRepository,
      maintenance: maintenanceRepository,
      calibration: calibrationRepository
    },
    // Admin repository (for direct access)
    adminRepository,
    // Use cases
    commands,
    queries
  };
}
