/**
 * Cloudflare Analytics Engine Adapter
 *
 * Implements MetricsPort interface using Cloudflare Analytics Engine.
 * Provides request tracking, counters, gauges, and histogram metrics.
 *
 * @module infrastructure/metrics/CloudflareAnalyticsAdapter
 * @version 15.5.0
 */

import { MetricsPort } from '../../domain/shared/ports/MetricsPort.js';

/**
 * Cloudflare Analytics Engine adapter
 * @extends MetricsPort
 */
export class CloudflareAnalyticsAdapter extends MetricsPort {
  /**
   * @param {Object} options - Adapter options
   * @param {Object} [options.analyticsEngine] - Cloudflare Analytics Engine binding
   * @param {string} [options.namespace='sites_spectral'] - Metrics namespace
   * @param {boolean} [options.enabled=true] - Whether metrics are enabled
   */
  constructor(options = {}) {
    super();
    this.analyticsEngine = options.analyticsEngine;
    this.namespace = options.namespace || 'sites_spectral';
    this.enabled = options.enabled !== false;

    // In-memory buffer for batch writes
    this._buffer = [];
    this._bufferSize = options.bufferSize || 50;

    // Local counters for aggregation (when Analytics Engine not available)
    this._counters = new Map();
    this._gauges = new Map();
    this._histograms = new Map();
  }

  /**
   * Create a unique key from name and labels
   * @private
   */
  _makeKey(name, labels) {
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    return labelStr ? `${name}{${labelStr}}` : name;
  }

  /**
   * Write data point to Analytics Engine
   * @private
   */
  _writeDataPoint(metric, value, labels = {}) {
    if (!this.enabled) return;

    const dataPoint = {
      blobs: [this.namespace, metric, JSON.stringify(labels)],
      doubles: [value],
      indexes: [metric]
    };

    if (this.analyticsEngine?.writeDataPoint) {
      try {
        this.analyticsEngine.writeDataPoint(dataPoint);
      } catch (error) {
        console.warn(`Failed to write metric ${metric}:`, error.message);
      }
    } else {
      // Buffer for local aggregation
      this._buffer.push({ metric, value, labels, timestamp: Date.now() });
      if (this._buffer.length > this._bufferSize) {
        this._buffer.shift(); // Remove oldest
      }
    }
  }

  /**
   * Increment a counter
   * @param {string} name - Counter name
   * @param {number} value - Value to add (default 1)
   * @param {Object} labels - Labels for the counter
   */
  incrementCounter(name, value = 1, labels = {}) {
    const key = this._makeKey(name, labels);
    const current = this._counters.get(key) || 0;
    this._counters.set(key, current + value);

    this._writeDataPoint(`counter.${name}`, value, labels);
  }

  /**
   * Set a gauge value
   * @param {string} name - Gauge name
   * @param {number} value - Value to set
   * @param {Object} labels - Labels for the gauge
   */
  setGauge(name, value, labels = {}) {
    const key = this._makeKey(name, labels);
    this._gauges.set(key, value);

    this._writeDataPoint(`gauge.${name}`, value, labels);
  }

  /**
   * Record a histogram observation
   * @param {string} name - Histogram name
   * @param {number} value - Value to observe
   * @param {Object} labels - Labels for the histogram
   */
  recordHistogram(name, value, labels = {}) {
    const key = this._makeKey(name, labels);
    const observations = this._histograms.get(key) || [];
    observations.push(value);
    this._histograms.set(key, observations);

    this._writeDataPoint(`histogram.${name}`, value, labels);
  }

  /**
   * Record histogram observation (alias for compatibility)
   * @param {string} name - Histogram name
   * @param {number} value - Value to observe
   * @param {Object} labels - Labels for the histogram
   */
  observeHistogram(name, value, labels = {}) {
    this.recordHistogram(name, value, labels);
  }

  /**
   * Create a timer for measuring duration
   * @param {string} name - Timer name
   * @param {Object} labels - Labels for the timer
   * @returns {Function} Function to call when operation completes
   */
  startTimer(name, labels = {}) {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.recordHistogram(name, duration, labels);
      return duration;
    };
  }

  /**
   * Time an async operation
   * @param {string} name - Metric name
   * @param {Function} operation - Async function to time
   * @param {Object} labels - Labels for the metric
   * @returns {Promise<*>} Result of the operation
   */
  async timeOperation(name, operation, labels = {}) {
    const start = Date.now();
    try {
      const result = await operation();
      const duration = Date.now() - start;
      this.recordHistogram(`${name}.duration_ms`, duration, { ...labels, status: 'success' });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.recordHistogram(`${name}.duration_ms`, duration, { ...labels, status: 'error' });
      throw error;
    }
  }

  /**
   * Record API request metrics
   * @param {Object} request - Request details
   * @param {Object} response - Response details
   * @param {number} durationMs - Request duration in milliseconds
   */
  recordRequest(request, response, durationMs) {
    const labels = {
      method: request.method || 'GET',
      path: this._normalizePath(request.url),
      status: String(response.status || 200),
      station: request.station || 'unknown'
    };

    // Request count
    this.incrementCounter('http_requests_total', 1, labels);

    // Request duration
    this.recordHistogram('http_request_duration_ms', durationMs, labels);

    // Track errors separately
    if (response.status >= 400) {
      this.incrementCounter('http_errors_total', 1, labels);
    }
  }

  /**
   * Normalize path for metrics (remove IDs)
   * @private
   */
  _normalizePath(url) {
    try {
      const pathname = new URL(url).pathname;
      // Replace numeric IDs with :id placeholder
      return pathname
        .replace(/\/\d+/g, '/:id')
        .replace(/\/[a-f0-9-]{36}/g, '/:uuid');
    } catch {
      return 'unknown';
    }
  }

  /**
   * Record domain-specific metrics
   * @param {string} domain - Domain name (uav, station, instrument)
   * @param {string} action - Action performed
   * @param {Object} labels - Additional labels
   */
  recordDomainAction(domain, action, labels = {}) {
    this.incrementCounter(`${domain}_${action}_total`, 1, labels);
  }

  /**
   * Record UAV-specific metrics
   * @param {string} metric - Metric type
   * @param {number} value - Metric value
   * @param {Object} labels - Labels
   */
  recordUAVMetric(metric, value, labels = {}) {
    this._writeDataPoint(`uav.${metric}`, value, labels);
  }

  /**
   * Get all collected metrics (for debugging/testing)
   * @returns {Object} All metrics
   */
  getMetrics() {
    return {
      counters: Object.fromEntries(this._counters),
      gauges: Object.fromEntries(this._gauges),
      histograms: Object.fromEntries(
        Array.from(this._histograms.entries()).map(([k, v]) => [k, {
          count: v.length,
          sum: v.reduce((a, b) => a + b, 0),
          min: Math.min(...v),
          max: Math.max(...v),
          avg: v.reduce((a, b) => a + b, 0) / v.length
        }])
      ),
      buffer: this._buffer.slice(-10) // Last 10 buffered items
    };
  }

  /**
   * Get counter value
   * @param {string} name - Counter name
   * @param {Object} labels - Labels
   * @returns {number}
   */
  getCounter(name, labels = {}) {
    const key = this._makeKey(name, labels);
    return this._counters.get(key) || 0;
  }

  /**
   * Get gauge value
   * @param {string} name - Gauge name
   * @param {Object} labels - Labels
   * @returns {number|undefined}
   */
  getGauge(name, labels = {}) {
    const key = this._makeKey(name, labels);
    return this._gauges.get(key);
  }

  /**
   * Reset all metrics
   */
  reset() {
    this._counters.clear();
    this._gauges.clear();
    this._histograms.clear();
    this._buffer = [];
  }

  /**
   * Flush buffer (for graceful shutdown)
   * @returns {Array} Buffered data points
   */
  flush() {
    const data = [...this._buffer];
    this._buffer = [];
    return data;
  }
}

export default CloudflareAnalyticsAdapter;
