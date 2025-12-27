/**
 * Domain Events Index
 *
 * Central export for all domain events.
 *
 * @module domain/shared/events
 * @version 13.1.0
 */

// Base class
export { DomainEvent } from './DomainEvent.js';

// Station events
export {
  StationCreated,
  StationUpdated,
  StationDeleted
} from './StationEvents.js';

// Instrument events
export {
  InstrumentCalibrated,
  MaintenanceCompleted,
  InstrumentStatusChanged
} from './InstrumentEvents.js';

// ROI events
export {
  ROIModified,
  ROIMarkedLegacy,
  TimeseriesBroken
} from './ROIEvents.js';
