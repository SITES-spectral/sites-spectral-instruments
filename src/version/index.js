/**
 * SITES Spectral - Centralized Version Management
 *
 * Single source of truth for application version.
 * This file is auto-generated during build from package.json.
 * DO NOT EDIT MANUALLY - run 'npm run build' to update.
 *
 * @module version
 * @generated 2026-01-24
 * @see scripts/build.js
 */

// Version info is injected at build time
// DO NOT EDIT - this is auto-generated
export const VERSION = '14.2.0';
export const BUILD_DATE = '2026-01-24';
export const BUILD_TIMESTAMP = 1769232338844;

/**
 * Version information object
 */
export const VersionInfo = {
  version: VERSION,
  major: parseInt(VERSION.split('.')[0], 10),
  minor: parseInt(VERSION.split('.')[1], 10),
  patch: parseInt(VERSION.split('.')[2], 10),
  buildDate: BUILD_DATE,
  buildTimestamp: BUILD_TIMESTAMP,

  /**
   * Get full version string with build info
   * @returns {string} e.g., "13.2.0 (2025-12-27)"
   */
  getFullVersion() {
    return `${this.version} (${this.buildDate})`;
  },

  /**
   * Get semantic version string
   * @returns {string} e.g., "13.2.0"
   */
  getSemanticVersion() {
    return this.version;
  },

  /**
   * Add version query param to URL for cache busting
   * @param {string} url - The URL to version
   * @returns {string} URL with version query param
   */
  versionUrl(url) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${this.version}`;
  },

  /**
   * Get version as JSON (for API responses)
   * @returns {Object} Version info object
   */
  toJSON() {
    return {
      version: this.version,
      major: this.major,
      minor: this.minor,
      patch: this.patch,
      buildDate: this.buildDate,
      buildTimestamp: this.buildTimestamp
    };
  }
};

export default VersionInfo;
