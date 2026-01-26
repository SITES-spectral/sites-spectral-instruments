/**
 * UAV Domain Commands (Write Operations)
 *
 * CQRS Command handlers for UAV state-changing operations.
 *
 * @module application/commands/uav
 * @version 15.0.0
 */

// Pilot commands
export { CreatePilot } from './CreatePilot.js';
export { UpdatePilot } from './UpdatePilot.js';
export { DeletePilot } from './DeletePilot.js';
export { AuthorizePilotForStation } from './AuthorizePilotForStation.js';

// Mission commands
export { CreateMission } from './CreateMission.js';
export { UpdateMission } from './UpdateMission.js';
export { DeleteMission } from './DeleteMission.js';
export { ApproveMission } from './ApproveMission.js';
export { StartMission } from './StartMission.js';
export { CompleteMission } from './CompleteMission.js';
export { AbortMission } from './AbortMission.js';
export { AssignPilotToMission } from './AssignPilotToMission.js';

// Flight Log commands
export { CreateFlightLog } from './CreateFlightLog.js';
export { UpdateFlightLog } from './UpdateFlightLog.js';
export { DeleteFlightLog } from './DeleteFlightLog.js';
export { ReportFlightIncident } from './ReportFlightIncident.js';

// Battery commands
export { CreateBattery } from './CreateBattery.js';
export { UpdateBattery } from './UpdateBattery.js';
export { DeleteBattery } from './DeleteBattery.js';
export { RecordBatteryHealthCheck } from './RecordBatteryHealthCheck.js';
export { RetireBattery } from './RetireBattery.js';
