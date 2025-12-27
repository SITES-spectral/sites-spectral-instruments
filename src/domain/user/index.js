/**
 * User Domain Module
 *
 * Exports all User domain components following hexagonal architecture.
 *
 * ## Versioned Repositories
 *
 * This module demonstrates the port versioning pattern:
 *
 * - **UserRepositoryV1**: Basic CRUD operations
 * - **UserRepositoryV2**: Extended with email lookup, permissions, activity tracking
 *
 * ## Migration Support
 *
 * V1 adapters can be migrated to V2 using the migration factory:
 *
 * ```javascript
 * import { migrateUserRepositoryV1ToV2 } from './user/index.js';
 *
 * const v2Adapter = migrateUserRepositoryV1ToV2(v1Adapter);
 * ```
 *
 * @module domain/user
 * @version 13.5.0
 */

// Existing exports
export { UserCredentialsPort } from './UserCredentialsPort.js';
export { UserService } from './UserService.js';

// Repository Ports (Versioned) - Phase 7.7
export { UserRepositoryV1 } from './UserRepositoryV1.js';
export { UserRepositoryV2 } from './UserRepositoryV2.js';

// Migration Utilities
export {
  userRepositoryMigrations,
  migrateUserRepositoryV1ToV2,
  isNativeV2Adapter
} from './UserRepositoryMigrations.js';

// Default export is latest stable version
export { UserRepositoryV2 as UserRepository } from './UserRepositoryV2.js';
