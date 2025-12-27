# Port Versioning Strategy

> **Version**: 13.5.0 (Phase 7.7)
> **Pattern**: Backward Compatibility

This document describes the port versioning strategy for SITES Spectral.

## Overview

Ports (interfaces) in hexagonal architecture define contracts between the domain and infrastructure layers. As requirements evolve, ports need to be extended without breaking existing adapters.

## Versioning Convention

### Naming

Ports follow semantic versioning with a `V` prefix:

```
{PortName}V{Major}[.{Minor}]
```

Examples:
- `UserRepositoryV1` - Version 1
- `UserRepositoryV2` - Version 2
- `UserRepositoryV2.1` - Version 2.1 (minor enhancement)

### Version Metadata

Each versioned port includes metadata:

```javascript
import { VersionedPort, PortVersion } from '../shared/versioning/PortVersion.js';

class UserRepositoryV2 extends UserRepositoryV1 {
  static portName = 'UserRepository';
  static version = new PortVersion(2, 0, 'stable');
}
```

Version statuses:
- `stable` - Production-ready
- `deprecated` - Should migrate to newer version
- `experimental` - May change without notice

### Backward Compatibility Rules

1. **New versions extend previous versions** - V2 extends V1
2. **No breaking changes within major version** - V1.1 must be compatible with V1.0
3. **New methods only** - Don't modify existing method signatures
4. **Default values** - New parameters must have defaults

## Creating a New Port Version

### Step 1: Define the New Version

```javascript
// src/domain/user/UserRepositoryV2.js
import { PortVersion, portRegistry } from '../shared/versioning/PortVersion.js';
import { UserRepositoryV1 } from './UserRepositoryV1.js';

export class UserRepositoryV2 extends UserRepositoryV1 {
  static portName = 'UserRepository';
  static version = new PortVersion(2, 0, 'stable');

  // NEW in V2
  async findByEmail(email) {
    throw new Error('UserRepositoryV2.findByEmail() must be implemented');
  }

  async hasPermission(userId, permission, context = {}) {
    throw new Error('UserRepositoryV2.hasPermission() must be implemented');
  }
}

portRegistry.register(UserRepositoryV2);
```

### Step 2: Deprecate Old Version (Optional)

```javascript
// Mark V1 as deprecated
UserRepositoryV1.version.deprecate(
  'V1 lacks permission methods needed for new auth system',
  'UserRepositoryV2'
);
```

### Step 3: Create Migration Path

```javascript
// src/domain/user/UserRepositoryMigrations.js
import { AdapterMigrationFactory } from '../shared/versioning/VersionedPortAdapter.js';

export const userRepositoryMigrations = new AdapterMigrationFactory({
  'V1 -> V2': (v1Adapter) => ({
    // Implement V2 methods using V1 methods
    findByEmail: async (email) => {
      const users = await v1Adapter.findAll({ email });
      return users[0] || null;
    },
    hasPermission: async (userId, permission, context) => {
      const user = await v1Adapter.findById(userId);
      return user?.permissions?.includes(permission) || false;
    }
  })
});
```

### Step 4: Migrate Existing Adapters

```javascript
import { migrateUserRepositoryV1ToV2 } from '../domain/user/index.js';

// In composition root
const v1Adapter = new D1UserRepositoryV1(db);
const v2Adapter = migrateUserRepositoryV1ToV2(v1Adapter);

// v2Adapter now supports all V2 methods
const user = await v2Adapter.findByEmail('user@example.com');
```

## Port Registry

The `portRegistry` tracks all registered port versions:

```javascript
import { portRegistry } from '../shared/versioning/PortVersion.js';

// Get latest version
const UserRepo = portRegistry.get('UserRepository', 'latest');

// Get specific version
const UserRepoV1 = portRegistry.get('UserRepository', 'V1');

// List all versions
const versions = portRegistry.getVersions('UserRepository');
// [{ version: 'V2', status: 'stable', deprecated: false },
//  { version: 'V1', status: 'deprecated', deprecated: true, replacedBy: 'UserRepositoryV2' }]
```

## Adapter Wrapping

The `VersionedPortAdapter` wraps an old adapter to implement a new version:

```javascript
import { VersionedPortAdapter } from '../shared/versioning/VersionedPortAdapter.js';

const v2Adapter = new VersionedPortAdapter(v1Adapter, {
  // New methods
  findByEmail: async (email) => { ... },

  // Override existing methods
  findById: async (id) => {
    const user = await v1Adapter.findById(id);
    return user ? { ...user, v2Field: 'default' } : null;
  }
}, {
  sourceVersion: 'V1',
  targetVersion: 'V2'
});
```

## Multi-Hop Migration

For larger version jumps, migrations can be chained:

```javascript
import { AdapterMigrationFactory } from '../shared/versioning/VersionedPortAdapter.js';

const migrations = new AdapterMigrationFactory();
migrations.registerMigration('V1', 'V2', createV1ToV2Extensions);
migrations.registerMigration('V2', 'V3', createV2ToV3Extensions);

// Migrate V1 -> V3 (through V2)
const v3Adapter = migrations.migrateThrough(v1Adapter, 'V1', 'V3');
```

## Best Practices

### DO

- **Extend previous version** - Keep inheritance chain
- **Document breaking changes** - In version comment header
- **Register with portRegistry** - For discoverability
- **Provide migration factory** - For gradual adoption
- **Use semantic versioning** - Major.Minor.Patch

### DON'T

- **Break existing method signatures** - Add new methods instead
- **Remove methods** - Deprecate and keep for compatibility
- **Skip versions** - V1 → V3 without V2 migration path
- **Mix concerns** - One port per domain concept

## Example: Full Migration

```javascript
// 1. Define V1
class UserRepositoryV1 extends VersionedPort {
  static portName = 'UserRepository';
  static version = new PortVersion(1);

  async findById(id) { throw new Error('Not implemented'); }
  async findAll(filters) { throw new Error('Not implemented'); }
  async save(user) { throw new Error('Not implemented'); }
  async delete(id) { throw new Error('Not implemented'); }
}

// 2. Implement V1 Adapter
class D1UserRepositoryV1 extends UserRepositoryV1 {
  constructor(db) { super(); this.db = db; }

  async findById(id) {
    return this.db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
  }
  // ... other implementations
}

// 3. Define V2 (extends V1)
class UserRepositoryV2 extends UserRepositoryV1 {
  static version = new PortVersion(2);

  async findByEmail(email) { throw new Error('Not implemented'); }
  async hasPermission(userId, permission) { throw new Error('Not implemented'); }
}

// 4. Deprecate V1
UserRepositoryV1.version.deprecate('Use V2 for permission checks', 'UserRepositoryV2');

// 5. Create migration
const migrations = new AdapterMigrationFactory({
  'V1 -> V2': (v1) => ({
    findByEmail: async (email) => {
      const all = await v1.findAll({ email });
      return all[0] || null;
    },
    hasPermission: async (userId, permission) => {
      const user = await v1.findById(userId);
      return user?.permissions?.includes(permission) || false;
    }
  })
});

// 6. Use in application
const v1Adapter = new D1UserRepositoryV1(db);
const v2Adapter = migrations.migrate(v1Adapter, 'V1', 'V2');

// Or implement native V2 adapter for better performance
class D1UserRepositoryV2 extends UserRepositoryV2 {
  // Native implementations of all V2 methods
}
```

## Files

| File | Purpose |
|------|---------|
| `src/domain/shared/versioning/PortVersion.js` | Version metadata, base classes, registry |
| `src/domain/shared/versioning/VersionedPortAdapter.js` | Adapter wrapping, migration factory |
| `src/domain/user/UserRepositoryV1.js` | Example V1 port |
| `src/domain/user/UserRepositoryV2.js` | Example V2 port extending V1 |
| `src/domain/user/UserRepositoryMigrations.js` | V1→V2 migration factory |

## See Also

- [Hexagonal Architecture](./HEXAGONAL_ARCHITECTURE.md)
- [OpenAPI Specification](./openapi/openapi.yaml)
- [CHANGELOG](../CHANGELOG.md)
