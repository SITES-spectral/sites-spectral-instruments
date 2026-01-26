/**
 * Application Layer (V15 Architecture)
 *
 * Use cases following CQRS pattern (Command Query Responsibility Segregation).
 * This layer orchestrates domain logic and coordinates with infrastructure.
 *
 * Commands: State-changing operations (Create, Update, Delete)
 * Queries: Read-only operations (Get, List)
 *
 * V11: Adds AOI, Campaign, Product domains with full CQRS support.
 * V15: Adds UAV Pilot domain (pilots, missions, flight logs, batteries).
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
  DeleteInstrument,
  // AOI commands (V11)
  CreateAOI,
  UpdateAOI,
  DeleteAOI,
  ImportGeoJSON,
  ImportKML,
  // Campaign commands (V11)
  CreateCampaign,
  UpdateCampaign,
  DeleteCampaign,
  StartCampaign,
  CompleteCampaign,
  // Product commands (V11)
  CreateProduct,
  UpdateProduct,
  DeleteProduct,
  SetProductQualityScore,
  PromoteProductQuality,
  // Maintenance commands (V11)
  CreateMaintenanceRecord,
  UpdateMaintenanceRecord,
  DeleteMaintenanceRecord,
  CompleteMaintenanceRecord,
  // Calibration commands (V11)
  CreateCalibrationRecord,
  UpdateCalibrationRecord,
  DeleteCalibrationRecord,
  ExpireCalibrationRecord,
  // UAV Commands (V15)
  CreatePilot,
  UpdatePilot,
  DeletePilot,
  AuthorizePilotForStation,
  CreateMission,
  UpdateMission,
  DeleteMission,
  ApproveMission,
  StartMission,
  CompleteMission,
  AbortMission,
  AssignPilotToMission,
  CreateFlightLog,
  UpdateFlightLog,
  DeleteFlightLog,
  ReportFlightIncident,
  CreateBattery,
  UpdateBattery,
  DeleteBattery,
  RecordBatteryHealthCheck,
  RetireBattery
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
  ListInstruments,
  // AOI queries (V11)
  GetAOI,
  ListAOIs,
  ExportAOIsGeoJSON,
  // Campaign queries (V11)
  GetCampaign,
  ListCampaigns,
  // Product queries (V11)
  GetProduct,
  ListProducts,
  // Admin queries
  GetActivityLogs,
  GetUserSessions,
  GetStationStats,
  // Maintenance queries (V11)
  GetMaintenanceRecord,
  ListMaintenanceRecords,
  GetMaintenanceTimeline,
  // Calibration queries (V11)
  GetCalibrationRecord,
  ListCalibrationRecords,
  GetCalibrationTimeline,
  GetCurrentCalibration,
  // UAV Queries (V15)
  GetPilot,
  ListPilots,
  GetPilotsWithExpiringCredentials,
  GetMission,
  ListMissions,
  GetMissionPilots,
  GetPendingMissions,
  GetFlightLog,
  ListFlightLogs,
  GetFlightLogsByMission,
  GetPilotStatistics,
  GetBattery,
  ListBatteries,
  GetBatteriesNeedingHealthCheck,
  GetBatteryStatistics
} from './queries/index.js';
