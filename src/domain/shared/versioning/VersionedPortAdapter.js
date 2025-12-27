/**
 * Versioned Port Adapter
 *
 * Wraps an older adapter to implement a newer port version.
 * Enables gradual migration without rewriting all adapters.
 *
 * ## Usage
 *
 * ```javascript
 * // Original V1 adapter
 * const v1Adapter = new D1UserRepositoryV1(db);
 *
 * // Wrap to support V2 interface
 * const v2Adapter = new VersionedPortAdapter(v1Adapter, {
 *   // Implement new V2 methods using V1 methods
 *   findByEmail: async (email) => {
 *     const users = await v1Adapter.findAll({ email });
 *     return users[0] || null;
 *   },
 *   // Override V1 methods if needed
 *   findById: async (id) => {
 *     const user = await v1Adapter.findById(id);
 *     // Add V2-specific transformations
 *     return user ? { ...user, v2Field: 'default' } : null;
 *   }
 * });
 * ```
 *
 * @module domain/shared/versioning/VersionedPortAdapter
 * @version 13.5.0
 */

/**
 * Adapter wrapper for version migration
 */
export class VersionedPortAdapter {
  /**
   * Create a versioned adapter wrapper
   *
   * @param {Object} baseAdapter - The original adapter to wrap
   * @param {Object} extensions - New/overridden methods for the new version
   * @param {Object} [options] - Configuration options
   * @param {string} [options.sourceVersion] - Source adapter version
   * @param {string} [options.targetVersion] - Target version being implemented
   * @param {boolean} [options.warnOnMissingMethods=true] - Warn if methods are missing
   * @param {Object} [options.logger=console] - Logger for warnings
   */
  constructor(baseAdapter, extensions = {}, options = {}) {
    this._baseAdapter = baseAdapter;
    this._extensions = extensions;
    this._options = {
      sourceVersion: options.sourceVersion || 'unknown',
      targetVersion: options.targetVersion || 'unknown',
      warnOnMissingMethods: options.warnOnMissingMethods !== false,
      logger: options.logger || console
    };

    // Create proxy to handle method calls
    return new Proxy(this, {
      get: (target, prop) => {
        // Internal properties
        if (prop.startsWith('_')) {
          return target[prop];
        }

        // Check extensions first (overrides and new methods)
        if (prop in extensions) {
          const method = extensions[prop];
          if (typeof method === 'function') {
            return method.bind(target);
          }
          return method;
        }

        // Fall back to base adapter
        if (prop in baseAdapter) {
          const value = baseAdapter[prop];
          if (typeof value === 'function') {
            return value.bind(baseAdapter);
          }
          return value;
        }

        // Method not found
        if (target._options.warnOnMissingMethods) {
          target._options.logger.warn(
            `[VersionedPortAdapter] Method '${String(prop)}' not found in ` +
            `${target._options.sourceVersion} adapter or extensions`
          );
        }

        return undefined;
      },

      has: (target, prop) => {
        return prop in extensions || prop in baseAdapter;
      }
    });
  }

  /**
   * Get adapter version info
   * @returns {Object} Version information
   */
  getVersionInfo() {
    return {
      type: 'VersionedPortAdapter',
      sourceVersion: this._options.sourceVersion,
      targetVersion: this._options.targetVersion,
      baseAdapterType: this._baseAdapter.constructor.name,
      extensionMethods: Object.keys(this._extensions)
    };
  }
}

/**
 * Factory for creating versioned adapter wrappers
 */
export class AdapterMigrationFactory {
  /**
   * Create a migration factory
   * @param {Object} migrations - Map of version migrations
   */
  constructor(migrations = {}) {
    this.migrations = new Map();

    // Register initial migrations
    for (const [key, migration] of Object.entries(migrations)) {
      const [from, to] = key.split('->').map(v => v.trim());
      this.registerMigration(from, to, migration);
    }
  }

  /**
   * Register a migration path
   * @param {string} fromVersion - Source version (e.g., 'V1')
   * @param {string} toVersion - Target version (e.g., 'V2')
   * @param {Function} migrationFn - Function that takes adapter and returns extensions
   */
  registerMigration(fromVersion, toVersion, migrationFn) {
    const key = `${fromVersion}->${toVersion}`;
    this.migrations.set(key, {
      from: fromVersion,
      to: toVersion,
      migrate: migrationFn
    });
  }

  /**
   * Migrate an adapter to a newer version
   * @param {Object} adapter - Original adapter
   * @param {string} fromVersion - Current version
   * @param {string} toVersion - Target version
   * @param {Object} [options] - Additional options
   * @returns {Object} Wrapped adapter implementing target version
   */
  migrate(adapter, fromVersion, toVersion, options = {}) {
    const key = `${fromVersion}->${toVersion}`;
    const migration = this.migrations.get(key);

    if (!migration) {
      throw new Error(
        `No migration path registered from ${fromVersion} to ${toVersion}`
      );
    }

    const extensions = migration.migrate(adapter);

    return new VersionedPortAdapter(adapter, extensions, {
      sourceVersion: fromVersion,
      targetVersion: toVersion,
      ...options
    });
  }

  /**
   * Get available migration paths
   * @returns {Array<{from: string, to: string}>}
   */
  getAvailableMigrations() {
    return Array.from(this.migrations.values()).map(m => ({
      from: m.from,
      to: m.to
    }));
  }

  /**
   * Check if a migration path exists
   * @param {string} fromVersion - Source version
   * @param {string} toVersion - Target version
   * @returns {boolean}
   */
  hasMigration(fromVersion, toVersion) {
    return this.migrations.has(`${fromVersion}->${toVersion}`);
  }

  /**
   * Find migration path between versions (multi-hop)
   * @param {string} fromVersion - Source version
   * @param {string} toVersion - Target version
   * @returns {Array<string>|null} Array of versions in path, or null if no path
   */
  findMigrationPath(fromVersion, toVersion) {
    if (fromVersion === toVersion) {
      return [fromVersion];
    }

    // BFS to find shortest path
    const visited = new Set([fromVersion]);
    const queue = [[fromVersion]];

    while (queue.length > 0) {
      const path = queue.shift();
      const current = path[path.length - 1];

      // Find all migrations from current version
      for (const [, migration] of this.migrations) {
        if (migration.from === current && !visited.has(migration.to)) {
          const newPath = [...path, migration.to];

          if (migration.to === toVersion) {
            return newPath;
          }

          visited.add(migration.to);
          queue.push(newPath);
        }
      }
    }

    return null; // No path found
  }

  /**
   * Migrate adapter through multiple versions
   * @param {Object} adapter - Original adapter
   * @param {string} fromVersion - Current version
   * @param {string} toVersion - Target version
   * @param {Object} [options] - Additional options
   * @returns {Object} Wrapped adapter implementing target version
   */
  migrateThrough(adapter, fromVersion, toVersion, options = {}) {
    const path = this.findMigrationPath(fromVersion, toVersion);

    if (!path) {
      throw new Error(
        `No migration path found from ${fromVersion} to ${toVersion}`
      );
    }

    let currentAdapter = adapter;
    let currentVersion = fromVersion;

    // Apply each migration in the path
    for (let i = 1; i < path.length; i++) {
      const nextVersion = path[i];
      currentAdapter = this.migrate(currentAdapter, currentVersion, nextVersion, options);
      currentVersion = nextVersion;
    }

    return currentAdapter;
  }
}

/**
 * Create a simple method adapter
 *
 * Converts method signatures between versions.
 *
 * @param {Function} originalMethod - The original method
 * @param {Object} options - Adapter options
 * @param {Function} [options.transformArgs] - Transform arguments before calling
 * @param {Function} [options.transformResult] - Transform result after calling
 * @returns {Function} Adapted method
 */
export function adaptMethod(originalMethod, options = {}) {
  const { transformArgs, transformResult } = options;

  return async function adaptedMethod(...args) {
    // Transform arguments if needed
    const finalArgs = transformArgs ? transformArgs(args) : args;

    // Call original method
    const result = await originalMethod.apply(this, finalArgs);

    // Transform result if needed
    return transformResult ? transformResult(result) : result;
  };
}

/**
 * Compose multiple adapters
 *
 * @param {...Object} adapters - Adapters to compose (later overrides earlier)
 * @returns {Object} Composed adapter
 */
export function composeAdapters(...adapters) {
  if (adapters.length === 0) {
    throw new Error('At least one adapter required');
  }

  if (adapters.length === 1) {
    return adapters[0];
  }

  // Merge all adapters, later ones override earlier
  return adapters.reduce((composed, adapter) => {
    return new VersionedPortAdapter(composed, adapter);
  });
}
