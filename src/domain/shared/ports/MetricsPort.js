/**
 * Metrics Port
 *
 * Port interface for recording metrics.
 * Implementations live in infrastructure layer.
 *
 * @module domain/shared/ports/MetricsPort
 * @version 13.1.0
 */

/**
 * Metrics Port (Abstract)
 *
 * @interface
 */
export class MetricsPort {
  /**
   * Increment a counter metric
   * @param {string} name - Metric name
   * @param {number} [value=1] - Value to increment by
   * @param {Object} [labels] - Additional labels/tags
   * @returns {void}
   */
  incrementCounter(name, value = 1, labels = {}) {
    throw new Error('MetricsPort.incrementCounter() must be implemented');
  }

  /**
   * Set a gauge metric value
   * @param {string} name - Metric name
   * @param {number} value - Gauge value
   * @param {Object} [labels] - Additional labels/tags
   * @returns {void}
   */
  setGauge(name, value, labels = {}) {
    throw new Error('MetricsPort.setGauge() must be implemented');
  }

  /**
   * Record a histogram observation
   * @param {string} name - Metric name
   * @param {number} value - Observed value
   * @param {Object} [labels] - Additional labels/tags
   * @returns {void}
   */
  recordHistogram(name, value, labels = {}) {
    throw new Error('MetricsPort.recordHistogram() must be implemented');
  }

  /**
   * Time an operation
   * @param {string} name - Metric name
   * @param {Function} operation - Async function to time
   * @param {Object} [labels] - Additional labels/tags
   * @returns {Promise<*>} Result of the operation
   */
  async timeOperation(name, operation, labels = {}) {
    throw new Error('MetricsPort.timeOperation() must be implemented');
  }

  /**
   * Record API request metrics
   * @param {Object} request - Request details
   * @param {Object} response - Response details
   * @param {number} durationMs - Request duration in milliseconds
   * @returns {void}
   */
  recordRequest(request, response, durationMs) {
    throw new Error('MetricsPort.recordRequest() must be implemented');
  }
}

export default MetricsPort;
