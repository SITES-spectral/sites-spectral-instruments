/**
 * ROI Domain Events
 *
 * Events related to ROI (Region of Interest) changes.
 * Critical for L2/L3 data integrity tracking.
 *
 * @module domain/shared/events/ROIEvents
 * @version 13.1.0
 */

import { DomainEvent } from './DomainEvent.js';

/**
 * Emitted when an ROI is modified
 * Important for tracking L2/L3 data integrity
 */
export class ROIModified extends DomainEvent {
  constructor(roi, instrument, modificationType, modifiedBy = null) {
    super('ROIModified', {
      roiId: roi.id,
      roiName: roi.roi_name,
      instrumentId: instrument.id,
      instrumentNormalizedName: instrument.normalized_name,
      modificationType, // 'created', 'updated', 'replaced', 'deleted'
      isLegacy: roi.is_legacy || false,
      timeseriesBroken: roi.timeseries_broken || false
    }, {
      aggregateType: 'ROI',
      aggregateId: roi.id,
      modifiedBy,
      dataIntegrityImpact: true // Flag for L2/L3 processing
    });
  }
}

/**
 * Emitted when an ROI is marked as legacy
 */
export class ROIMarkedLegacy extends DomainEvent {
  constructor(roi, replacedByRoiId, reason, markedBy = null) {
    super('ROIMarkedLegacy', {
      roiId: roi.id,
      roiName: roi.roi_name,
      instrumentId: roi.instrument_id,
      replacedByRoiId,
      legacyReason: reason
    }, {
      aggregateType: 'ROI',
      aggregateId: roi.id,
      markedBy,
      dataIntegrityImpact: true
    });
  }
}

/**
 * Emitted when timeseries is broken due to ROI change
 */
export class TimeseriesBroken extends DomainEvent {
  constructor(roi, instrument, brokenBy = null) {
    super('TimeseriesBroken', {
      roiId: roi.id,
      roiName: roi.roi_name,
      instrumentId: instrument.id,
      instrumentNormalizedName: instrument.normalized_name,
      brokenAt: new Date().toISOString()
    }, {
      aggregateType: 'ROI',
      aggregateId: roi.id,
      brokenBy,
      dataIntegrityImpact: true,
      severity: 'warning'
    });
  }
}

export default {
  ROIModified,
  ROIMarkedLegacy,
  TimeseriesBroken
};
