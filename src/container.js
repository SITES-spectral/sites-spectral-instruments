/**
 * Composition Root - Dependency Injection Container
 *
 * Single place for all dependency wiring following Hexagonal Architecture.
 * Connects domain ports to infrastructure adapters.
 *
 * @module container
 * @version 13.3.0
 */

// ===== INFRASTRUCTURE ADAPTERS =====
import {
  // Persistence Adapters
  D1StationRepository,
  D1PlatformRepository,
  D1InstrumentRepository,
  D1AdminRepository,
  D1AOIRepository,
  D1CampaignRepository,
  D1ProductRepository,
  D1ROIRepository,
  D1ExportRepository,
  D1AnalyticsRepository,
  D1MaintenanceRepository,
  D1CalibrationRepository,
  // Event Adapters
  InMemoryEventBus,
  // Logging Adapters
  StructuredConsoleLogger,
  // Metrics Adapters
  NoOpMetricsAdapter,
  // Auth Adapters
  CloudflareCredentialsAdapter
} from './infrastructure/index.js';

// ===== APPLICATION LAYER (USE CASES) =====
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
  // AOI Commands
  CreateAOI,
  UpdateAOI,
  DeleteAOI,
  ImportGeoJSON,
  ImportKML,
  // Campaign Commands
  CreateCampaign,
  UpdateCampaign,
  DeleteCampaign,
  StartCampaign,
  CompleteCampaign,
  // Product Commands
  CreateProduct,
  UpdateProduct,
  DeleteProduct,
  SetProductQualityScore,
  PromoteProductQuality,
  // Maintenance Commands
  CreateMaintenanceRecord,
  UpdateMaintenanceRecord,
  DeleteMaintenanceRecord,
  CompleteMaintenanceRecord,
  // Calibration Commands
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
  // AOI Queries
  GetAOI,
  ListAOIs,
  ExportAOIsGeoJSON,
  // Campaign Queries
  GetCampaign,
  ListCampaigns,
  // Product Queries
  GetProduct,
  ListProducts,
  // Admin Queries
  GetActivityLogs,
  GetUserSessions,
  GetStationStats,
  // Maintenance Queries
  GetMaintenanceRecord,
  ListMaintenanceRecords,
  GetMaintenanceTimeline,
  // Calibration Queries
  GetCalibrationRecord,
  ListCalibrationRecords,
  GetCalibrationTimeline,
  GetCurrentCalibration
} from './application/index.js';

/**
 * Environment configuration
 * Determines which adapters to use based on environment
 */
const EnvironmentConfig = {
  production: {
    logLevel: 'info',
    enableMetrics: true,
    enableEvents: true
  },
  staging: {
    logLevel: 'debug',
    enableMetrics: true,
    enableEvents: true
  },
  development: {
    logLevel: 'debug',
    enableMetrics: false,
    enableEvents: true
  },
  test: {
    logLevel: 'error',
    enableMetrics: false,
    enableEvents: false
  }
};

/**
 * Create ports with appropriate adapters based on environment
 *
 * @param {Object} env - Cloudflare Worker environment
 * @returns {Object} Port implementations
 */
function createPorts(env) {
  const environment = env.ENVIRONMENT || 'production';
  const config = EnvironmentConfig[environment] || EnvironmentConfig.production;

  // Logging Port
  const logger = new StructuredConsoleLogger({
    serviceName: 'sites-spectral',
    environment,
    minLevel: config.logLevel
  });

  // Metrics Port
  const metrics = new NoOpMetricsAdapter();
  // Future: Replace with CloudflareAnalyticsAdapter when ready

  // Event Publisher Port
  const eventBus = new InMemoryEventBus();
  // Future: Replace with CloudflareQueueEventBus for durability

  // Credentials Port
  const credentials = new CloudflareCredentialsAdapter(env);

  return {
    logger,
    metrics,
    eventBus,
    credentials,
    config
  };
}

/**
 * Create repositories (Driven Adapters)
 *
 * @param {Object} db - D1 database binding
 * @returns {Object} Repository implementations
 */
function createRepositories(db) {
  return {
    // Core entities
    station: new D1StationRepository(db),
    platform: new D1PlatformRepository(db),
    instrument: new D1InstrumentRepository(db),
    // Domain aggregates
    aoi: new D1AOIRepository(db),
    roi: new D1ROIRepository(db),
    campaign: new D1CampaignRepository(db),
    product: new D1ProductRepository(db),
    maintenance: new D1MaintenanceRepository(db),
    calibration: new D1CalibrationRepository(db),
    // Supporting
    admin: new D1AdminRepository(db),
    analytics: new D1AnalyticsRepository(db),
    export: new D1ExportRepository(db)
  };
}

/**
 * Create commands (Write Use Cases)
 *
 * @param {Object} deps - Dependencies object
 * @returns {Object} Command instances
 */
function createCommands(deps) {
  return {
    // Station
    createStation: new CreateStation(deps),
    updateStation: new UpdateStation(deps),
    deleteStation: new DeleteStation(deps),
    // Platform
    createPlatform: new CreatePlatform(deps),
    updatePlatform: new UpdatePlatform(deps),
    deletePlatform: new DeletePlatform(deps),
    // Instrument
    createInstrument: new CreateInstrument(deps),
    updateInstrument: new UpdateInstrument(deps),
    deleteInstrument: new DeleteInstrument(deps),
    // AOI
    createAOI: new CreateAOI(deps),
    updateAOI: new UpdateAOI(deps),
    deleteAOI: new DeleteAOI(deps),
    importGeoJSON: new ImportGeoJSON(deps),
    importKML: new ImportKML(deps),
    // Campaign
    createCampaign: new CreateCampaign(deps),
    updateCampaign: new UpdateCampaign(deps),
    deleteCampaign: new DeleteCampaign(deps),
    startCampaign: new StartCampaign(deps),
    completeCampaign: new CompleteCampaign(deps),
    // Product
    createProduct: new CreateProduct(deps),
    updateProduct: new UpdateProduct(deps),
    deleteProduct: new DeleteProduct(deps),
    setProductQualityScore: new SetProductQualityScore(deps),
    promoteProductQuality: new PromoteProductQuality(deps),
    // Maintenance
    createMaintenanceRecord: new CreateMaintenanceRecord(deps),
    updateMaintenanceRecord: new UpdateMaintenanceRecord(deps),
    deleteMaintenanceRecord: new DeleteMaintenanceRecord(deps),
    completeMaintenanceRecord: new CompleteMaintenanceRecord(deps),
    // Calibration
    createCalibrationRecord: new CreateCalibrationRecord(deps),
    updateCalibrationRecord: new UpdateCalibrationRecord(deps),
    deleteCalibrationRecord: new DeleteCalibrationRecord(deps),
    expireCalibrationRecord: new ExpireCalibrationRecord(deps)
  };
}

/**
 * Create queries (Read Use Cases)
 *
 * @param {Object} deps - Dependencies object
 * @param {Object} adminRepository - Admin repository for admin queries
 * @returns {Object} Query instances
 */
function createQueries(deps, adminRepository) {
  return {
    // Station
    getStation: new GetStation(deps),
    listStations: new ListStations(deps),
    getStationDashboard: new GetStationDashboard(deps),
    // Platform
    getPlatform: new GetPlatform(deps),
    listPlatforms: new ListPlatforms(deps),
    // Instrument
    getInstrument: new GetInstrument(deps),
    listInstruments: new ListInstruments(deps),
    // AOI
    getAOI: new GetAOI(deps),
    listAOIs: new ListAOIs(deps),
    exportAOIsGeoJSON: new ExportAOIsGeoJSON(deps),
    // Campaign
    getCampaign: new GetCampaign(deps),
    listCampaigns: new ListCampaigns(deps),
    // Product
    getProduct: new GetProduct(deps),
    listProducts: new ListProducts(deps),
    // Admin
    getActivityLogs: new GetActivityLogs(adminRepository),
    getUserSessions: new GetUserSessions(adminRepository),
    getStationStats: new GetStationStats(adminRepository),
    // Maintenance
    getMaintenanceRecord: new GetMaintenanceRecord(deps),
    listMaintenanceRecords: new ListMaintenanceRecords(deps),
    getMaintenanceTimeline: new GetMaintenanceTimeline(deps),
    // Calibration
    getCalibrationRecord: new GetCalibrationRecord(deps),
    listCalibrationRecords: new ListCalibrationRecords(deps),
    getCalibrationTimeline: new GetCalibrationTimeline(deps),
    getCurrentCalibration: new GetCurrentCalibration(deps)
  };
}

/**
 * Create container with all dependencies
 *
 * This is the Composition Root - the single place where all
 * dependencies are wired together.
 *
 * @param {Object} env - Cloudflare Worker environment
 * @returns {Object} Container with all services
 */
export function createContainer(env) {
  const db = env.DB;

  // ===== PORTS (Cross-Cutting Concerns) =====
  const ports = createPorts(env);

  // ===== REPOSITORIES (Driven Adapters) =====
  const repositories = createRepositories(db);

  // ===== SHARED DEPENDENCIES =====
  // Passed to all use cases
  const deps = {
    // Repositories (by domain name for use cases)
    stationRepository: repositories.station,
    platformRepository: repositories.platform,
    instrumentRepository: repositories.instrument,
    aoiRepository: repositories.aoi,
    roiRepository: repositories.roi,
    campaignRepository: repositories.campaign,
    productRepository: repositories.product,
    maintenanceRepository: repositories.maintenance,
    calibrationRepository: repositories.calibration,
    analyticsRepository: repositories.analytics,
    exportRepository: repositories.export,
    // Ports
    logger: ports.logger,
    metrics: ports.metrics,
    eventBus: ports.eventBus
  };

  // ===== USE CASES =====
  const commands = createCommands(deps);
  const queries = createQueries(deps, repositories.admin);

  // ===== CONTAINER =====
  return {
    // Environment info
    environment: env.ENVIRONMENT || 'production',
    config: ports.config,

    // Ports (for direct access if needed)
    ports: {
      logger: ports.logger,
      metrics: ports.metrics,
      eventBus: ports.eventBus,
      credentials: ports.credentials
    },

    // Repositories (for direct access if needed)
    repositories,

    // Legacy access pattern (for backward compatibility)
    adminRepository: repositories.admin,

    // Use cases
    commands,
    queries
  };
}

/**
 * Create a test container with mock dependencies
 *
 * @param {Object} overrides - Dependencies to override
 * @returns {Object} Container with mocked services
 */
export function createTestContainer(overrides = {}) {
  // Create mock repositories
  const mockRepositories = {
    station: overrides.stationRepository || createMockRepository(),
    platform: overrides.platformRepository || createMockRepository(),
    instrument: overrides.instrumentRepository || createMockRepository(),
    aoi: overrides.aoiRepository || createMockRepository(),
    roi: overrides.roiRepository || createMockRepository(),
    campaign: overrides.campaignRepository || createMockRepository(),
    product: overrides.productRepository || createMockRepository(),
    maintenance: overrides.maintenanceRepository || createMockRepository(),
    calibration: overrides.calibrationRepository || createMockRepository(),
    admin: overrides.adminRepository || createMockRepository(),
    analytics: overrides.analyticsRepository || createMockRepository(),
    export: overrides.exportRepository || createMockRepository()
  };

  // Create mock ports
  const mockPorts = {
    logger: overrides.logger || new StructuredConsoleLogger({ minLevel: 'error' }),
    metrics: overrides.metrics || new NoOpMetricsAdapter(),
    eventBus: overrides.eventBus || new InMemoryEventBus(),
    credentials: overrides.credentials || null
  };

  const deps = {
    stationRepository: mockRepositories.station,
    platformRepository: mockRepositories.platform,
    instrumentRepository: mockRepositories.instrument,
    aoiRepository: mockRepositories.aoi,
    roiRepository: mockRepositories.roi,
    campaignRepository: mockRepositories.campaign,
    productRepository: mockRepositories.product,
    maintenanceRepository: mockRepositories.maintenance,
    calibrationRepository: mockRepositories.calibration,
    analyticsRepository: mockRepositories.analytics,
    exportRepository: mockRepositories.export,
    logger: mockPorts.logger,
    metrics: mockPorts.metrics,
    eventBus: mockPorts.eventBus
  };

  return {
    environment: 'test',
    config: EnvironmentConfig.test,
    ports: mockPorts,
    repositories: mockRepositories,
    adminRepository: mockRepositories.admin,
    commands: createCommands(deps),
    queries: createQueries(deps, mockRepositories.admin)
  };
}

/**
 * Create a mock repository with common methods
 * @private
 */
function createMockRepository() {
  return {
    findById: async () => null,
    findAll: async () => [],
    save: async (entity) => entity,
    delete: async () => true,
    count: async () => 0
  };
}

export default createContainer;
