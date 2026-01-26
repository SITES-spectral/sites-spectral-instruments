/**
 * Application Queries (Read Operations)
 *
 * CQRS Query handlers for read-only operations.
 *
 * @module application/queries
 */

// Station queries
export { GetStation } from './GetStation.js';
export { ListStations } from './ListStations.js';
export { GetStationDashboard } from './GetStationDashboard.js';

// Platform queries
export { GetPlatform } from './GetPlatform.js';
export { ListPlatforms } from './ListPlatforms.js';

// Instrument queries
export { GetInstrument } from './GetInstrument.js';
export { ListInstruments } from './ListInstruments.js';

// AOI queries
export { GetAOI } from './GetAOI.js';
export { ListAOIs } from './ListAOIs.js';
export { ExportAOIsGeoJSON } from './ExportAOIsGeoJSON.js';

// Campaign queries
export { GetCampaign } from './GetCampaign.js';
export { ListCampaigns } from './ListCampaigns.js';

// Product queries
export { GetProduct } from './GetProduct.js';
export { ListProducts } from './ListProducts.js';

// Admin queries
export { GetActivityLogs } from './admin/GetActivityLogs.js';
export { GetUserSessions } from './admin/GetUserSessions.js';
export { GetStationStats } from './admin/GetStationStats.js';

// Maintenance queries (V11 - Timeline for platforms/instruments)
export { GetMaintenanceRecord } from './GetMaintenanceRecord.js';
export { ListMaintenanceRecords } from './ListMaintenanceRecords.js';
export { GetMaintenanceTimeline } from './GetMaintenanceTimeline.js';

// Calibration queries (V11 - Multispectral/Hyperspectral only)
export { GetCalibrationRecord } from './GetCalibrationRecord.js';
export { ListCalibrationRecords } from './ListCalibrationRecords.js';
export { GetCalibrationTimeline } from './GetCalibrationTimeline.js';
export { GetCurrentCalibration } from './GetCurrentCalibration.js';

// UAV queries (V15 - Pilot, Mission, FlightLog, Battery)
export {
  // Pilot queries
  GetPilot,
  ListPilots,
  GetPilotsWithExpiringCredentials,
  // Mission queries
  GetMission,
  ListMissions,
  GetMissionPilots,
  GetPendingMissions,
  // Flight Log queries
  GetFlightLog,
  ListFlightLogs,
  GetFlightLogsByMission,
  GetPilotStatistics,
  // Battery queries
  GetBattery,
  ListBatteries,
  GetBatteriesNeedingHealthCheck,
  GetBatteryStatistics
} from './uav/index.js';
