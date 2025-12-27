# ADR-007: Port Versioning Strategy

## Status

**Accepted**

## Context

As SITES Spectral Instruments evolves, ports (interfaces) in the hexagonal architecture need to evolve without breaking existing adapters. Specific challenges:

- `UserRepository` needed new methods (`findByEmail`, `hasPermission`) for enhanced authorization
- Existing D1 adapters implementing V1 ports would break if methods were added directly
- No clear pattern for deprecating old port versions
- No migration path for adapters between versions
- Testing required different port versions for different scenarios

The application needed a formal strategy for evolving ports while maintaining backward compatibility.

## Decision

Adopt a **Port Versioning Strategy** with the following components:

### 1. Version Metadata

Each versioned port includes explicit version metadata:

```javascript
import { VersionedPort, PortVersion } from '../shared/versioning/PortVersion.js';

export class UserRepositoryV2 extends UserRepositoryV1 {
  static portName = 'UserRepository';
  static version = new PortVersion(2, 0, 'stable');

  // NEW in V2
  async findByEmail(email) {
    throw new Error('UserRepositoryV2.findByEmail() must be implemented');
  }
}
```

### 2. Version Inheritance

New versions extend previous versions to ensure all old methods remain available:

```
UserRepositoryV1 (CRUD)
    ↓ extends
UserRepositoryV2 (CRUD + email, permissions)
    ↓ extends
UserRepositoryV3 (future)
```

### 3. Port Registry

Centralized registry for discovering and resolving port versions:

```javascript
import { portRegistry } from '../shared/versioning/PortVersion.js';

// Register ports
portRegistry.register(UserRepositoryV1);
portRegistry.register(UserRepositoryV2);

// Resolve versions
const Latest = portRegistry.get('UserRepository', 'latest');  // V2
const V1 = portRegistry.get('UserRepository', 'V1');          // V1

// List all versions
const versions = portRegistry.getVersions('UserRepository');
// [{ version: 'V2', status: 'stable' }, { version: 'V1', status: 'deprecated' }]
```

### 4. Adapter Migration Factory

Wraps old adapters to implement new port versions:

```javascript
import { AdapterMigrationFactory } from '../shared/versioning/VersionedPortAdapter.js';

const migrations = new AdapterMigrationFactory({
  'V1 -> V2': (v1Adapter) => ({
    findByEmail: async (email) => {
      const users = await v1Adapter.findAll({ email });
      return users[0] || null;
    },
    hasPermission: async (userId, permission) => {
      const user = await v1Adapter.findById(userId);
      return user?.permissions?.includes(permission) || false;
    }
  })
});

// Migrate existing V1 adapter to V2
const v2Adapter = migrations.migrate(v1Adapter, 'V1', 'V2');
```

### 5. Multi-Hop Migration

For larger version jumps:

```javascript
migrations.registerMigration('V1', 'V2', createV1ToV2Extensions);
migrations.registerMigration('V2', 'V3', createV2ToV3Extensions);

// Automatically chains: V1 -> V2 -> V3
const v3Adapter = migrations.migrateThrough(v1Adapter, 'V1', 'V3');
```

### 6. Version Naming Convention

```
{PortName}V{Major}[.{Minor}]

Examples:
- UserRepositoryV1      Version 1.0
- UserRepositoryV2      Version 2.0
- UserRepositoryV2_1    Version 2.1 (minor enhancement)
```

### 7. Version Statuses

- `stable` - Production-ready, fully supported
- `deprecated` - Still works, migration recommended
- `experimental` - May change without notice

## Consequences

### Positive

- **Backward compatibility**: V1 adapters continue working
- **Gradual migration**: Upgrade adapters at your own pace
- **Clear contracts**: Each version defines exact capabilities
- **Discoverable**: Registry lists all available versions
- **Testable**: Mock different versions for different test scenarios
- **Documented deprecation**: Clear warnings when using old versions

### Negative

- **Complexity**: More classes and indirection
- **Performance overhead**: Wrapped adapters have extra function call layer
- **Version proliferation**: Could end up with many versions if not careful

### Neutral

- **Native vs migrated adapters**: Native V2 implementation preferred for performance, but migrated adapter works for compatibility

## Backward Compatibility Rules

1. **New versions extend previous versions** - V2 extends V1
2. **No breaking changes within major version** - V1.1 compatible with V1.0
3. **New methods only** - Don't modify existing method signatures
4. **Default values** - New parameters must have defaults
5. **Mark deprecations explicitly** - Use `version.deprecate()` method

## Implementation

### Files Created

| File | Purpose |
|------|---------|
| `src/domain/shared/versioning/PortVersion.js` | Version metadata, VersionedPort base, PortRegistry |
| `src/domain/shared/versioning/VersionedPortAdapter.js` | Adapter wrapping, AdapterMigrationFactory |
| `src/domain/shared/versioning/index.js` | Module exports |
| `src/domain/user/UserRepositoryV1.js` | Example V1 port (CRUD) |
| `src/domain/user/UserRepositoryV2.js` | Example V2 port (extended) |
| `src/domain/user/UserRepositoryMigrations.js` | V1->V2 migration factory |
| `docs/PORT_VERSIONING.md` | Comprehensive documentation |

### Example: UserRepository Evolution

**V1 Methods** (basic CRUD):
- `findById(id)`
- `findByUsername(username)`
- `findAll(filters)`
- `save(user)`
- `delete(id)`

**V2 Methods** (V1 + authorization):
- All V1 methods
- `findByEmail(email)` - Email lookup
- `findByStationWithPermissions(stationId)` - Station-specific queries
- `updateLastLogin(userId)` - Activity tracking
- `hasPermission(userId, permission, context)` - Authorization checks
- `findByPermission(permission)` - Role-based queries
- `getActivitySummary(userId, since)` - Analytics
- `bulkCheckPermission(userIds, permission)` - Batch operations

## Related

- [[ADR-001-hexagonal-architecture|ADR-001: Hexagonal Architecture]]
- [[ADR-006-openapi-contract-first|ADR-006: OpenAPI Contract-First]]
- [[../PORT_VERSIONING|Port Versioning Documentation]]
- [[../../src/domain/shared/versioning|Versioning Module]]

---

**Date**: 2025-12-27
**Author**: SITES Spectral Team
**Reviewers**: Architecture Review
