/**
 * Domain Event Base Class
 *
 * Base class for all domain events in SITES Spectral.
 * Domain events represent something that happened in the domain
 * that domain experts care about.
 *
 * @module domain/shared/events/DomainEvent
 * @version 13.1.0
 *
 * @example
 * class StationCreated extends DomainEvent {
 *   constructor(station) {
 *     super('StationCreated', { stationId: station.id, acronym: station.acronym });
 *   }
 * }
 */

/**
 * Base class for domain events
 */
export class DomainEvent {
  /**
   * Create a domain event
   * @param {string} type - Event type name (e.g., 'StationCreated')
   * @param {Object} payload - Event data
   * @param {Object} [metadata] - Optional metadata
   */
  constructor(type, payload, metadata = {}) {
    if (new.target === DomainEvent) {
      throw new Error('DomainEvent is abstract and cannot be instantiated directly');
    }

    this.type = type;
    this.payload = payload;
    this.metadata = {
      eventId: this._generateEventId(),
      occurredAt: new Date().toISOString(),
      version: 1,
      ...metadata
    };
  }

  /**
   * Generate unique event ID
   * @private
   * @returns {string}
   */
  _generateEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get event type
   * @returns {string}
   */
  getType() {
    return this.type;
  }

  /**
   * Get event payload
   * @returns {Object}
   */
  getPayload() {
    return this.payload;
  }

  /**
   * Get event metadata
   * @returns {Object}
   */
  getMetadata() {
    return this.metadata;
  }

  /**
   * Get event ID
   * @returns {string}
   */
  getEventId() {
    return this.metadata.eventId;
  }

  /**
   * Get when event occurred
   * @returns {string} ISO date string
   */
  getOccurredAt() {
    return this.metadata.occurredAt;
  }

  /**
   * Serialize event to JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      type: this.type,
      payload: this.payload,
      metadata: this.metadata
    };
  }

  /**
   * Create event from JSON
   * @param {Object} json - JSON representation
   * @returns {DomainEvent}
   */
  static fromJSON(json) {
    const event = Object.create(DomainEvent.prototype);
    event.type = json.type;
    event.payload = json.payload;
    event.metadata = json.metadata;
    return event;
  }
}

export default DomainEvent;
