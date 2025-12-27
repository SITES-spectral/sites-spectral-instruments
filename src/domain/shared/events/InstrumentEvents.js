/**
 * Instrument Domain Events
 *
 * Events related to instrument lifecycle and operations.
 *
 * @module domain/shared/events/InstrumentEvents
 * @version 13.1.0
 */

import { DomainEvent } from './DomainEvent.js';

/**
 * Emitted when an instrument is calibrated
 */
export class InstrumentCalibrated extends DomainEvent {
  constructor(instrument, calibration, calibratedBy = null) {
    super('InstrumentCalibrated', {
      instrumentId: instrument.id,
      normalizedName: instrument.normalized_name,
      instrumentType: instrument.instrument_type,
      calibrationId: calibration.id,
      calibrationDate: calibration.calibration_date,
      qualityScore: calibration.quality_score
    }, {
      aggregateType: 'Instrument',
      aggregateId: instrument.id,
      calibratedBy
    });
  }
}

/**
 * Emitted when maintenance is completed on an instrument
 */
export class MaintenanceCompleted extends DomainEvent {
  constructor(instrument, maintenance, completedBy = null) {
    super('MaintenanceCompleted', {
      instrumentId: instrument.id,
      normalizedName: instrument.normalized_name,
      maintenanceId: maintenance.id,
      maintenanceType: maintenance.maintenance_type,
      completedDate: maintenance.completed_date,
      status: maintenance.status
    }, {
      aggregateType: 'Instrument',
      aggregateId: instrument.id,
      completedBy
    });
  }
}

/**
 * Emitted when an instrument status changes
 */
export class InstrumentStatusChanged extends DomainEvent {
  constructor(instrument, previousStatus, newStatus, changedBy = null) {
    super('InstrumentStatusChanged', {
      instrumentId: instrument.id,
      normalizedName: instrument.normalized_name,
      previousStatus,
      newStatus
    }, {
      aggregateType: 'Instrument',
      aggregateId: instrument.id,
      changedBy
    });
  }
}

export default {
  InstrumentCalibrated,
  MaintenanceCompleted,
  InstrumentStatusChanged
};
