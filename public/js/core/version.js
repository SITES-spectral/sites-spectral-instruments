/**
 * SITES Spectral - Frontend Version Utility
 *
 * Fetches and caches version information from the API.
 * Provides cache-busting utilities for assets.
 *
 * @module core/version
 */

(function(global) {
  'use strict';

  /**
   * Version Manager - handles version info and cache busting
   */
  class VersionManager {
    constructor() {
      this._cache = null;
      this._cacheExpiry = null;
      this._cacheTTL = 5 * 60 * 1000; // 5 minutes
      this._loading = null;
    }

    /**
     * Get version info from API (with caching)
     * @returns {Promise<Object>} Version info object
     */
    async getVersion() {
      // Return cached version if still valid
      if (this._cache && this._cacheExpiry && Date.now() < this._cacheExpiry) {
        return this._cache;
      }

      // Avoid duplicate requests
      if (this._loading) {
        return this._loading;
      }

      this._loading = this._fetchVersion();
      try {
        const version = await this._loading;
        this._cache = version;
        this._cacheExpiry = Date.now() + this._cacheTTL;
        return version;
      } finally {
        this._loading = null;
      }
    }

    /**
     * Fetch version from API
     * @private
     */
    async _fetchVersion() {
      try {
        const response = await fetch('/api/version', {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
          throw new Error(`Version API failed: ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        console.warn('Failed to fetch version from API, using fallback:', error.message);
        return this._getFallbackVersion();
      }
    }

    /**
     * Get fallback version from meta tag
     * @private
     */
    _getFallbackVersion() {
      const metaTag = document.querySelector('meta[name="app-version"]');
      const version = metaTag ? metaTag.content : 'unknown';

      return {
        app: { version },
        api: { current: 'v11' },
        timestamp: new Date().toISOString(),
        source: 'fallback'
      };
    }

    /**
     * Get version string synchronously (from cache or meta tag)
     * @returns {string} Version string
     */
    getVersionSync() {
      if (this._cache && this._cache.app) {
        return this._cache.app.version;
      }

      const metaTag = document.querySelector('meta[name="app-version"]');
      return metaTag ? metaTag.content : 'unknown';
    }

    /**
     * Add version query parameter to URL for cache busting
     * @param {string} url - The URL to version
     * @returns {string} URL with version query param
     */
    versionUrl(url) {
      const version = this.getVersionSync();
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}v=${version}`;
    }

    /**
     * Update all versioned assets on the page
     * Useful for dynamically loaded content
     */
    async updateAssetVersions() {
      const version = await this.getVersion();
      const v = version.app?.version || this.getVersionSync();

      // Update CSS links
      document.querySelectorAll('link[rel="stylesheet"][href*="?v="]').forEach(link => {
        const baseUrl = link.href.split('?')[0];
        link.href = `${baseUrl}?v=${v}`;
      });

      // Update script sources
      document.querySelectorAll('script[src*="?v="]').forEach(script => {
        const baseUrl = script.src.split('?')[0];
        script.src = `${baseUrl}?v=${v}`;
      });
    }

    /**
     * Display version in UI element
     * @param {string} selector - CSS selector for version display element
     */
    async displayVersion(selector) {
      const element = document.querySelector(selector);
      if (!element) return;

      try {
        const version = await this.getVersion();
        element.textContent = `v${version.app?.version || 'unknown'}`;
        element.title = `Build: ${version.app?.buildDate || 'unknown'}`;
      } catch (error) {
        element.textContent = `v${this.getVersionSync()}`;
      }
    }

    /**
     * Check if current version is newer than cached
     * Useful for prompting users to refresh
     * @returns {Promise<boolean>} True if version changed
     */
    async hasVersionChanged() {
      const oldVersion = this._cache?.app?.version;
      this._cache = null; // Force refresh
      const newVersion = await this.getVersion();

      if (!oldVersion) return false;
      return oldVersion !== newVersion.app?.version;
    }

    /**
     * Get version info for analytics/logging
     * @returns {Object} Version info suitable for analytics
     */
    getVersionInfo() {
      return {
        appVersion: this.getVersionSync(),
        apiVersion: this._cache?.api?.current || 'v11',
        buildDate: this._cache?.app?.buildDate || null,
        source: this._cache?.source || 'sync'
      };
    }
  }

  // Create singleton instance
  const versionManager = new VersionManager();

  // Auto-initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Pre-fetch version info
      versionManager.getVersion().catch(() => {});
    });
  } else {
    // DOM already loaded
    versionManager.getVersion().catch(() => {});
  }

  // Export to global scope
  global.SitesVersion = versionManager;

  // Also export class for testing
  global.SitesVersionManager = VersionManager;

})(typeof window !== 'undefined' ? window : global);
