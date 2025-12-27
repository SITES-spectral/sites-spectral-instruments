/**
 * Structured Console Logger Adapter
 *
 * Implements LoggingPort interface with structured JSON output.
 * Suitable for Cloudflare Workers where logs are captured and searchable.
 *
 * @module infrastructure/logging/StructuredConsoleLogger
 */

import { LoggingPort } from '../../domain/shared/ports/LoggingPort.js';

/**
 * Structured console logger with JSON output
 * @extends LoggingPort
 */
export class StructuredConsoleLogger extends LoggingPort {
  /**
   * @param {Object} options
   * @param {string} options.serviceName - Name of the service
   * @param {string} options.environment - Environment (production, staging, development)
   * @param {string} options.minLevel - Minimum log level (debug, info, warn, error)
   */
  constructor(options = {}) {
    super();
    this.serviceName = options.serviceName || 'sites-spectral';
    this.environment = options.environment || 'production';
    this.minLevel = options.minLevel || 'info';
    this.levelPriority = { debug: 0, info: 1, warn: 2, error: 3 };
  }

  /**
   * Check if level should be logged
   * @private
   */
  _shouldLog(level) {
    return this.levelPriority[level] >= this.levelPriority[this.minLevel];
  }

  /**
   * Format log entry as structured JSON
   * @private
   */
  _formatEntry(level, message, context = {}) {
    return {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      environment: this.environment,
      message,
      ...context
    };
  }

  /**
   * Log debug message
   * @param {string} message
   * @param {Object} context
   */
  debug(message, context = {}) {
    if (this._shouldLog('debug')) {
      console.debug(JSON.stringify(this._formatEntry('debug', message, context)));
    }
  }

  /**
   * Log info message
   * @param {string} message
   * @param {Object} context
   */
  info(message, context = {}) {
    if (this._shouldLog('info')) {
      console.log(JSON.stringify(this._formatEntry('info', message, context)));
    }
  }

  /**
   * Log warning message
   * @param {string} message
   * @param {Object} context
   */
  warn(message, context = {}) {
    if (this._shouldLog('warn')) {
      console.warn(JSON.stringify(this._formatEntry('warn', message, context)));
    }
  }

  /**
   * Log error message
   * @param {string} message
   * @param {Object} context
   */
  error(message, context = {}) {
    if (this._shouldLog('error')) {
      // Include stack trace if error object provided
      if (context.error instanceof Error) {
        context.stack = context.error.stack;
        context.errorMessage = context.error.message;
      }
      console.error(JSON.stringify(this._formatEntry('error', message, context)));
    }
  }

  /**
   * Create a child logger with additional context
   * @param {Object} childContext - Context to add to all log entries
   * @returns {StructuredConsoleLogger}
   */
  child(childContext = {}) {
    const child = new StructuredConsoleLogger({
      serviceName: this.serviceName,
      environment: this.environment,
      minLevel: this.minLevel
    });
    child._baseContext = { ...this._baseContext, ...childContext };
    return child;
  }
}

export default StructuredConsoleLogger;
