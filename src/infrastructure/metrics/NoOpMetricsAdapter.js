/**
 * No-Op Metrics Adapter
 *
 * Implements MetricsPort interface with no-op operations.
 * Placeholder until Cloudflare Analytics or other metrics system is integrated.
 *
 * @module infrastructure/metrics/NoOpMetricsAdapter
 */

import { MetricsPort } from '../../domain/shared/ports/MetricsPort.js';

/**
 * No-operation metrics adapter (stub)
 * @extends MetricsPort
 */
export class NoOpMetricsAdapter extends MetricsPort {
  constructor() {
    super();
    this._counters = new Map();
    this._gauges = new Map();
    this._histograms = new Map();
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
  }

  /**
   * Record a histogram observation
   * @param {string} name - Histogram name
   * @param {number} value - Value to observe
   * @param {Object} labels - Labels for the histogram
   */
  observeHistogram(name, value, labels = {}) {
    const key = this._makeKey(name, labels);
    const observations = this._histograms.get(key) || [];
    observations.push(value);
    this._histograms.set(key, observations);
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
      this.observeHistogram(name, duration, labels);
      return duration;
    };
  }

  /**
   * Get all collected metrics (for debugging)
   * @returns {Object} All metrics
   */
  getMetrics() {
    return {
      counters: Object.fromEntries(this._counters),
      gauges: Object.fromEntries(this._gauges),
      histograms: Object.fromEntries(this._histograms)
    };
  }

  /**
   * Reset all metrics
   */
  reset() {
    this._counters.clear();
    this._gauges.clear();
    this._histograms.clear();
  }

  /**
   * Create a key from name and labels
   * @private
   */
  _makeKey(name, labels) {
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    return labelStr ? `${name}{${labelStr}}` : name;
  }
}

export default NoOpMetricsAdapter;
