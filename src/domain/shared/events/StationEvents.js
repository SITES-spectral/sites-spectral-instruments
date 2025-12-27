/**
 * Station Domain Events
 *
 * Events related to station lifecycle.
 *
 * @module domain/shared/events/StationEvents
 * @version 13.1.0
 */

import { DomainEvent } from './DomainEvent.js';

/**
 * Emitted when a new station is created
 */
export class StationCreated extends DomainEvent {
  constructor(station, createdBy = null) {
    super('StationCreated', {
      stationId: station.id,
      acronym: station.acronym,
      displayName: station.display_name,
      latitude: station.latitude,
      longitude: station.longitude
    }, {
      aggregateType: 'Station',
      aggregateId: station.id,
      createdBy
    });
  }
}

/**
 * Emitted when a station is updated
 */
export class StationUpdated extends DomainEvent {
  constructor(station, changes, updatedBy = null) {
    super('StationUpdated', {
      stationId: station.id,
      acronym: station.acronym,
      changes: Object.keys(changes)
    }, {
      aggregateType: 'Station',
      aggregateId: station.id,
      updatedBy
    });
  }
}

/**
 * Emitted when a station is deleted
 */
export class StationDeleted extends DomainEvent {
  constructor(stationId, acronym, deletedBy = null) {
    super('StationDeleted', {
      stationId,
      acronym
    }, {
      aggregateType: 'Station',
      aggregateId: stationId,
      deletedBy
    });
  }
}

export default {
  StationCreated,
  StationUpdated,
  StationDeleted
};
