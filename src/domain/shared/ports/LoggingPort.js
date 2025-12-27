/**
 * Logging Port
 *
 * Port interface for structured logging.
 * Implementations live in infrastructure layer.
 *
 * @module domain/shared/ports/LoggingPort
 * @version 13.1.0
 */

/**
 * Log levels
 */
export const LogLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  FATAL: 'fatal'
};

/**
 * Logging Port (Abstract)
 *
 * @interface
 */
export class LoggingPort {
  /**
   * Log a debug message
   * @param {string} message - Log message
   * @param {Object} [context] - Additional context
   * @returns {void}
   */
  debug(message, context = {}) {
    throw new Error('LoggingPort.debug() must be implemented');
  }

  /**
   * Log an info message
   * @param {string} message - Log message
   * @param {Object} [context] - Additional context
   * @returns {void}
   */
  info(message, context = {}) {
    throw new Error('LoggingPort.info() must be implemented');
  }

  /**
   * Log a warning message
   * @param {string} message - Log message
   * @param {Object} [context] - Additional context
   * @returns {void}
   */
  warn(message, context = {}) {
    throw new Error('LoggingPort.warn() must be implemented');
  }

  /**
   * Log an error message
   * @param {string} message - Log message
   * @param {Error|Object} [error] - Error object or context
   * @param {Object} [context] - Additional context
   * @returns {void}
   */
  error(message, error = null, context = {}) {
    throw new Error('LoggingPort.error() must be implemented');
  }

  /**
   * Log a fatal message
   * @param {string} message - Log message
   * @param {Error|Object} [error] - Error object or context
   * @param {Object} [context] - Additional context
   * @returns {void}
   */
  fatal(message, error = null, context = {}) {
    throw new Error('LoggingPort.fatal() must be implemented');
  }

  /**
   * Create a child logger with additional context
   * @param {Object} context - Context to add to all logs
   * @returns {LoggingPort}
   */
  child(context) {
    throw new Error('LoggingPort.child() must be implemented');
  }

  /**
   * Log with a specific level
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} [context] - Additional context
   * @returns {void}
   */
  log(level, message, context = {}) {
    throw new Error('LoggingPort.log() must be implemented');
  }
}

export default LoggingPort;
