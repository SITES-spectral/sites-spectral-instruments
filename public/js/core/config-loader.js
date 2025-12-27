/**
 * Configuration Loader for SITES Spectral
 *
 * Loads and caches YAML configuration files from the /yamls/ directory.
 * Provides a simple async interface for accessing configurations throughout the application.
 *
 * @module core/config-loader
 * @version 8.0.0
 */

(function(global) {
    'use strict';

    /**
     * Simple YAML parser for browser environment
     * Handles basic YAML structures used in SITES Spectral configs
     */
    class SimpleYAMLParser {
        /**
         * Parse YAML string to JavaScript object
         * @param {string} yamlText - YAML content
         * @returns {Object} Parsed object
         */
        static parse(yamlText) {
            const lines = yamlText.split('\n');
            const result = {};
            const stack = [{ obj: result, indent: -1 }];
            let currentKey = null;
            let inArray = false;
            let arrayKey = null;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];

                // Skip comments and empty lines
                if (line.trim().startsWith('#') || line.trim() === '') {
                    continue;
                }

                // Calculate indentation
                const indent = line.search(/\S/);
                if (indent === -1) continue;

                const trimmed = line.trim();

                // Handle array items
                if (trimmed.startsWith('- ')) {
                    const value = trimmed.substring(2).trim();
                    const parent = stack[stack.length - 1].obj;

                    if (value.includes(':')) {
                        // Object in array
                        const obj = {};
                        const [key, val] = value.split(':').map(s => s.trim());
                        obj[key] = this.parseValue(val);

                        if (!Array.isArray(parent[currentKey])) {
                            parent[currentKey] = [];
                        }
                        parent[currentKey].push(obj);
                    } else {
                        // Simple array item
                        if (!Array.isArray(parent[currentKey])) {
                            parent[currentKey] = [];
                        }
                        parent[currentKey].push(this.parseValue(value));
                    }
                    continue;
                }

                // Handle key-value pairs
                if (trimmed.includes(':')) {
                    const colonIndex = trimmed.indexOf(':');
                    const key = trimmed.substring(0, colonIndex).trim();
                    let value = trimmed.substring(colonIndex + 1).trim();

                    // Pop stack if we've outdented
                    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
                        stack.pop();
                    }

                    const parent = stack[stack.length - 1].obj;

                    if (value === '' || value === '{}' || value === '[]') {
                        // Empty object or array
                        parent[key] = value === '[]' ? [] : {};
                        stack.push({ obj: parent[key], indent: indent });
                        currentKey = key;
                    } else {
                        // Value present
                        parent[key] = this.parseValue(value);
                        currentKey = key;
                    }
                }
            }

            return result;
        }

        /**
         * Parse individual value from YAML
         * @param {string} value - Value string
         * @returns {*} Parsed value
         */
        static parseValue(value) {
            // Remove quotes
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
                return value.slice(1, -1);
            }

            // Boolean
            if (value === 'true') return true;
            if (value === 'false') return false;

            // Null
            if (value === 'null' || value === '~') return null;

            // Number
            if (!isNaN(value) && value !== '') {
                return parseFloat(value);
            }

            // String
            return value;
        }
    }

    /**
     * Configuration Loader Class
     */
    class ConfigLoader {
        constructor() {
            /** @private */
            this.cache = new Map();

            /** @private */
            this.baseUrl = '/yamls/';

            /** @private */
            this.loading = new Map();
        }

        /**
         * Get configuration by name
         * @param {string} name - Configuration name (e.g., 'instruments/phenocam')
         * @returns {Promise<Object>} Configuration object
         */
        async get(name) {
            // Check cache first
            if (this.cache.has(name)) {
                return this.cache.get(name);
            }

            // Check if already loading
            if (this.loading.has(name)) {
                return this.loading.get(name);
            }

            // Start loading
            const loadPromise = this._loadConfig(name);
            this.loading.set(name, loadPromise);

            try {
                const config = await loadPromise;
                this.cache.set(name, config);
                return config;
            } finally {
                this.loading.delete(name);
            }
        }

        /**
         * Load configuration from server
         * @private
         * @param {string} name - Configuration name
         * @returns {Promise<Object>} Configuration object
         */
        async _loadConfig(name) {
            const url = `${this.baseUrl}${name}.yaml`;

            try {
                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error(`Failed to load config: ${name} (${response.status})`);
                }

                const yamlText = await response.text();
                const config = SimpleYAMLParser.parse(yamlText);

                return config;
            } catch (error) {
                console.error(`Error loading config ${name}:`, error);
                throw error;
            }
        }

        /**
         * Preload multiple configurations
         * @param {string[]} names - Array of configuration names
         * @returns {Promise<void>}
         */
        async preload(names) {
            const promises = names.map(name => this.get(name));
            // Use Promise.allSettled to continue loading even if some configs fail
            const results = await Promise.allSettled(promises);

            // Log any failures but don't throw - allow partial config loading
            results.forEach((result, index) => {
                if (result.status === 'rejected') {
                    console.warn(`Failed to preload config '${names[index]}':`, result.reason);
                }
            });
        }

        /**
         * Clear cache (useful for development/testing)
         * @param {string} [name] - Specific config to clear, or all if omitted
         */
        clearCache(name) {
            if (name) {
                this.cache.delete(name);
            } else {
                this.cache.clear();
            }
        }

        /**
         * Check if config is loaded
         * @param {string} name - Configuration name
         * @returns {boolean}
         */
        isLoaded(name) {
            return this.cache.has(name);
        }

        /**
         * Get all loaded config names
         * @returns {string[]}
         */
        getLoadedConfigs() {
            return Array.from(this.cache.keys());
        }
    }

    // Create singleton instance
    const configLoader = new ConfigLoader();

    // Export for ES6 modules
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = configLoader;
    }

    // Export for browser global
    global.ConfigLoader = configLoader;

})(typeof window !== 'undefined' ? window : global);
