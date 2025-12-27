/**
 * In-Memory Event Bus Adapter
 *
 * Simple in-memory event bus for development and testing.
 * Events are processed synchronously and not persisted.
 *
 * @module infrastructure/events/InMemoryEventBus
 * @version 13.1.0
 */

import { EventPublisherPort } from '../../domain/shared/ports/EventPublisherPort.js';

/**
 * In-Memory Event Bus
 * @implements {EventPublisherPort}
 */
export class InMemoryEventBus extends EventPublisherPort {
  constructor() {
    super();
    /** @private */
    this.subscribers = new Map();
    /** @private */
    this.globalSubscribers = [];
    /** @private */
    this.eventHistory = [];
    /** @private */
    this.maxHistorySize = 1000;
  }

  /**
   * Publish a single domain event
   * @param {DomainEvent} event - Event to publish
   * @returns {Promise<void>}
   */
  async publish(event) {
    // Store in history
    this._addToHistory(event);

    // Notify type-specific subscribers
    const typeSubscribers = this.subscribers.get(event.getType()) || [];
    for (const handler of typeSubscribers) {
      try {
        await handler(event);
      } catch (error) {
        console.error(`Event handler error for ${event.getType()}:`, error);
      }
    }

    // Notify global subscribers
    for (const handler of this.globalSubscribers) {
      try {
        await handler(event);
      } catch (error) {
        console.error(`Global event handler error:`, error);
      }
    }
  }

  /**
   * Publish multiple domain events
   * @param {DomainEvent[]} events - Events to publish
   * @returns {Promise<void>}
   */
  async publishAll(events) {
    for (const event of events) {
      await this.publish(event);
    }
  }

  /**
   * Subscribe to events of a specific type
   * @param {string} eventType - Event type to subscribe to
   * @param {Function} handler - Handler function
   * @returns {Function} Unsubscribe function
   */
  subscribe(eventType, handler) {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }
    this.subscribers.get(eventType).push(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.subscribers.get(eventType);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to all events
   * @param {Function} handler - Handler function
   * @returns {Function} Unsubscribe function
   */
  subscribeAll(handler) {
    this.globalSubscribers.push(handler);

    // Return unsubscribe function
    return () => {
      const index = this.globalSubscribers.indexOf(handler);
      if (index > -1) {
        this.globalSubscribers.splice(index, 1);
      }
    };
  }

  /**
   * Get event history
   * @param {Object} [options] - Filter options
   * @param {string} [options.type] - Filter by event type
   * @param {number} [options.limit] - Limit results
   * @returns {DomainEvent[]}
   */
  getHistory(options = {}) {
    let history = [...this.eventHistory];

    if (options.type) {
      history = history.filter(e => e.getType() === options.type);
    }

    if (options.limit) {
      history = history.slice(-options.limit);
    }

    return history;
  }

  /**
   * Clear event history
   */
  clearHistory() {
    this.eventHistory = [];
  }

  /**
   * Clear all subscribers
   */
  clearSubscribers() {
    this.subscribers.clear();
    this.globalSubscribers = [];
  }

  /**
   * Add event to history
   * @private
   * @param {DomainEvent} event
   */
  _addToHistory(event) {
    this.eventHistory.push(event);

    // Trim history if too large
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }
}

export default InMemoryEventBus;
