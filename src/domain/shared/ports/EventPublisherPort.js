/**
 * Event Publisher Port
 *
 * Port interface for publishing domain events.
 * Implementations live in infrastructure layer.
 *
 * @module domain/shared/ports/EventPublisherPort
 * @version 13.1.0
 */

/**
 * Event Publisher Port (Abstract)
 *
 * @interface
 */
export class EventPublisherPort {
  /**
   * Publish a single domain event
   * @param {DomainEvent} event - Event to publish
   * @returns {Promise<void>}
   */
  async publish(event) {
    throw new Error('EventPublisherPort.publish() must be implemented');
  }

  /**
   * Publish multiple domain events
   * @param {DomainEvent[]} events - Events to publish
   * @returns {Promise<void>}
   */
  async publishAll(events) {
    throw new Error('EventPublisherPort.publishAll() must be implemented');
  }

  /**
   * Subscribe to events of a specific type
   * @param {string} eventType - Event type to subscribe to
   * @param {Function} handler - Handler function
   * @returns {Function} Unsubscribe function
   */
  subscribe(eventType, handler) {
    throw new Error('EventPublisherPort.subscribe() must be implemented');
  }

  /**
   * Subscribe to all events
   * @param {Function} handler - Handler function
   * @returns {Function} Unsubscribe function
   */
  subscribeAll(handler) {
    throw new Error('EventPublisherPort.subscribeAll() must be implemented');
  }
}

export default EventPublisherPort;
