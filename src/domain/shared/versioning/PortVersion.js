/**
 * Port Versioning Infrastructure
 *
 * Provides base classes and utilities for versioned ports.
 * Enables safe evolution of port interfaces without breaking existing adapters.
 *
 * ## Versioning Strategy
 *
 * 1. **Semantic Versioning**: Ports follow semver (V1, V2, V3)
 * 2. **Backward Compatibility**: New versions extend previous versions
 * 3. **Adapter Wrapping**: Old adapters can be wrapped to implement new versions
 * 4. **Deprecation**: Old versions are deprecated, not removed immediately
 *
 * ## Usage Example
 *
 * ```javascript
 * // Define versioned port
 * class UserRepositoryV2 extends UserRepositoryV1 {
 *   // New methods in V2
 *   async findByEmail(email) { ... }
 * }
 *
 * // Wrap old adapter to new version
 * const v2Adapter = new VersionedPortAdapter(v1Adapter, {
 *   findByEmail: async (email) => {
 *     // Implement using V1 methods
 *     const users = await v1Adapter.findAll({ email });
 *     return users[0] || null;
 *   }
 * });
 * ```
 *
 * @module domain/shared/versioning/PortVersion
 * @version 13.5.0
 */

/**
 * Port version metadata
 */
export class PortVersion {
  /**
   * @param {number} major - Major version number
   * @param {number} [minor=0] - Minor version number
   * @param {string} [status='stable'] - Version status: stable, deprecated, experimental
   */
  constructor(major, minor = 0, status = 'stable') {
    this.major = major;
    this.minor = minor;
    this.status = status;
    this.deprecatedAt = null;
    this.deprecationMessage = null;
    this.replacedBy = null;
  }

  /**
   * Get version string
   * @returns {string} Version string (e.g., 'V1', 'V2.1')
   */
  toString() {
    return this.minor > 0 ? `V${this.major}.${this.minor}` : `V${this.major}`;
  }

  /**
   * Check if version is deprecated
   * @returns {boolean}
   */
  isDeprecated() {
    return this.status === 'deprecated';
  }

  /**
   * Check if version is experimental
   * @returns {boolean}
   */
  isExperimental() {
    return this.status === 'experimental';
  }

  /**
   * Mark version as deprecated
   * @param {string} message - Deprecation message
   * @param {string} [replacedBy] - New version to use
   * @returns {PortVersion} This instance for chaining
   */
  deprecate(message, replacedBy = null) {
    this.status = 'deprecated';
    this.deprecatedAt = new Date().toISOString();
    this.deprecationMessage = message;
    this.replacedBy = replacedBy;
    return this;
  }

  /**
   * Compare versions
   * @param {PortVersion} other - Other version to compare
   * @returns {number} -1 if less, 0 if equal, 1 if greater
   */
  compareTo(other) {
    if (this.major !== other.major) {
      return this.major > other.major ? 1 : -1;
    }
    if (this.minor !== other.minor) {
      return this.minor > other.minor ? 1 : -1;
    }
    return 0;
  }

  /**
   * Check if this version is compatible with another
   * @param {PortVersion} other - Other version
   * @returns {boolean} True if compatible (same major version)
   */
  isCompatibleWith(other) {
    return this.major === other.major;
  }

  /**
   * Create version info object
   * @returns {Object} Version info
   */
  toJSON() {
    return {
      version: this.toString(),
      major: this.major,
      minor: this.minor,
      status: this.status,
      deprecated: this.isDeprecated(),
      deprecatedAt: this.deprecatedAt,
      deprecationMessage: this.deprecationMessage,
      replacedBy: this.replacedBy
    };
  }
}

/**
 * Base class for versioned ports
 *
 * Provides version metadata and deprecation warnings.
 */
export class VersionedPort {
  /**
   * Port name for logging
   * @type {string}
   */
  static portName = 'UnnamedPort';

  /**
   * Port version
   * @type {PortVersion}
   */
  static version = new PortVersion(1);

  /**
   * Get port version
   * @returns {PortVersion}
   */
  static getVersion() {
    return this.version;
  }

  /**
   * Get port name
   * @returns {string}
   */
  static getPortName() {
    return this.portName;
  }

  /**
   * Get full port identifier
   * @returns {string} e.g., 'UserRepository:V2'
   */
  static getPortId() {
    return `${this.portName}:${this.version.toString()}`;
  }

  /**
   * Check if port is deprecated and log warning
   * @param {Object} [logger] - Logger instance
   */
  static checkDeprecation(logger = console) {
    if (this.version.isDeprecated()) {
      const msg = `[DEPRECATED] ${this.getPortId()}: ${this.version.deprecationMessage}`;
      if (this.version.replacedBy) {
        logger.warn(`${msg}. Use ${this.version.replacedBy} instead.`);
      } else {
        logger.warn(msg);
      }
    }
  }

  /**
   * Constructor logs deprecation warning if applicable
   */
  constructor() {
    this.constructor.checkDeprecation();
  }
}

/**
 * Port registry for managing multiple versions
 */
export class PortRegistry {
  constructor() {
    this.ports = new Map();
  }

  /**
   * Register a port version
   * @param {typeof VersionedPort} portClass - Port class
   */
  register(portClass) {
    const portName = portClass.getPortName();
    const version = portClass.getVersion();

    if (!this.ports.has(portName)) {
      this.ports.set(portName, new Map());
    }

    const versions = this.ports.get(portName);
    versions.set(version.toString(), {
      portClass,
      version,
      registeredAt: new Date().toISOString()
    });
  }

  /**
   * Get a specific port version
   * @param {string} portName - Port name
   * @param {string} [versionStr='latest'] - Version string or 'latest'
   * @returns {typeof VersionedPort|null}
   */
  get(portName, versionStr = 'latest') {
    const versions = this.ports.get(portName);
    if (!versions) return null;

    if (versionStr === 'latest') {
      // Find highest non-deprecated version
      let latest = null;
      let latestVersion = null;

      for (const [, entry] of versions) {
        if (!entry.version.isDeprecated()) {
          if (!latestVersion || entry.version.compareTo(latestVersion) > 0) {
            latest = entry.portClass;
            latestVersion = entry.version;
          }
        }
      }

      // If all deprecated, return highest deprecated
      if (!latest) {
        for (const [, entry] of versions) {
          if (!latestVersion || entry.version.compareTo(latestVersion) > 0) {
            latest = entry.portClass;
            latestVersion = entry.version;
          }
        }
      }

      return latest;
    }

    const entry = versions.get(versionStr);
    return entry ? entry.portClass : null;
  }

  /**
   * Get all versions of a port
   * @param {string} portName - Port name
   * @returns {Array<{version: string, status: string, deprecated: boolean}>}
   */
  getVersions(portName) {
    const versions = this.ports.get(portName);
    if (!versions) return [];

    return Array.from(versions.values())
      .map(entry => ({
        version: entry.version.toString(),
        status: entry.version.status,
        deprecated: entry.version.isDeprecated(),
        deprecationMessage: entry.version.deprecationMessage,
        replacedBy: entry.version.replacedBy
      }))
      .sort((a, b) => {
        const [aMajor] = a.version.replace('V', '').split('.').map(Number);
        const [bMajor] = b.version.replace('V', '').split('.').map(Number);
        return bMajor - aMajor;
      });
  }

  /**
   * Get all registered ports
   * @returns {Array<{name: string, versions: Array}>}
   */
  getAll() {
    const result = [];
    for (const [name] of this.ports) {
      result.push({
        name,
        versions: this.getVersions(name)
      });
    }
    return result;
  }
}

/**
 * Global port registry instance
 */
export const portRegistry = new PortRegistry();
