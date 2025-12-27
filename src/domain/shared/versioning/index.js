/**
 * Port Versioning Module
 *
 * Provides infrastructure for versioned ports and adapter migration.
 *
 * ## Features
 *
 * - **PortVersion**: Version metadata with deprecation support
 * - **VersionedPort**: Base class for versioned port interfaces
 * - **PortRegistry**: Registry for managing multiple port versions
 * - **VersionedPortAdapter**: Wrapper for migrating adapters between versions
 * - **AdapterMigrationFactory**: Factory for creating migration paths
 *
 * ## Usage Example
 *
 * ```javascript
 * import {
 *   PortVersion,
 *   VersionedPort,
 *   portRegistry,
 *   VersionedPortAdapter,
 *   AdapterMigrationFactory
 * } from './versioning/index.js';
 *
 * // Define versioned port
 * class MyRepositoryV1 extends VersionedPort {
 *   static portName = 'MyRepository';
 *   static version = new PortVersion(1);
 *
 *   async findById(id) { throw new Error('Not implemented'); }
 * }
 *
 * // Define V2 extending V1
 * class MyRepositoryV2 extends MyRepositoryV1 {
 *   static version = new PortVersion(2);
 *
 *   async findByEmail(email) { throw new Error('Not implemented'); }
 * }
 *
 * // Register versions
 * portRegistry.register(MyRepositoryV1);
 * portRegistry.register(MyRepositoryV2);
 *
 * // Create migration factory
 * const migrations = new AdapterMigrationFactory({
 *   'V1 -> V2': (v1Adapter) => ({
 *     findByEmail: async (email) => {
 *       // Implement using V1 methods
 *       const all = await v1Adapter.findAll({ email });
 *       return all[0] || null;
 *     }
 *   })
 * });
 *
 * // Migrate adapter
 * const v2Adapter = migrations.migrate(v1Adapter, 'V1', 'V2');
 * ```
 *
 * @module domain/shared/versioning
 * @version 13.5.0
 */

// Version metadata and base classes
export {
  PortVersion,
  VersionedPort,
  PortRegistry,
  portRegistry
} from './PortVersion.js';

// Adapter wrapping and migration
export {
  VersionedPortAdapter,
  AdapterMigrationFactory,
  adaptMethod,
  composeAdapters
} from './VersionedPortAdapter.js';
