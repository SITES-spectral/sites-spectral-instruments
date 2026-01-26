/**
 * UAV Domain Queries (Read Operations)
 *
 * CQRS Query handlers for UAV read-only operations.
 *
 * @module application/queries/uav
 * @version 15.0.0
 */

// Pilot queries
export { GetPilot } from './GetPilot.js';
export { ListPilots } from './ListPilots.js';
export { GetPilotsWithExpiringCredentials } from './GetPilotsWithExpiringCredentials.js';

// Mission queries
export { GetMission } from './GetMission.js';
export { ListMissions } from './ListMissions.js';
export { GetMissionPilots } from './GetMissionPilots.js';
export { GetPendingMissions } from './GetPendingMissions.js';

// Flight Log queries
export { GetFlightLog } from './GetFlightLog.js';
export { ListFlightLogs } from './ListFlightLogs.js';
export { GetFlightLogsByMission } from './GetFlightLogsByMission.js';
export { GetPilotStatistics } from './GetPilotStatistics.js';

// Battery queries
export { GetBattery } from './GetBattery.js';
export { ListBatteries } from './ListBatteries.js';
export { GetBatteriesNeedingHealthCheck } from './GetBatteriesNeedingHealthCheck.js';
export { GetBatteryStatistics } from './GetBatteryStatistics.js';
