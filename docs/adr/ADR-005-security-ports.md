# ADR-005: Security Ports Pattern

## Status

**Accepted**

## Context

SITES Spectral authentication and authorization was implemented directly in handlers using JWT validation and role checks. This led to:
- JWT library coupled to business logic
- Repeated authorization checks across handlers
- Difficulty testing business logic in isolation
- No clear abstraction for future auth methods (API keys, OAuth)

## Decision

Implement **Security Ports** following the hexagonal architecture pattern:

### Principal Value Object

```javascript
// src/domain/shared/ports/SecurityPort.js
export class Principal {
  constructor({ userId, username, roles, stationId, permissions }) {
    this.userId = userId;
    this.username = username;
    this.roles = roles;
    this.stationId = stationId;
    this.permissions = permissions;
  }

  hasRole(role) { return this.roles.includes(role); }
  isSuperAdmin() { return this.hasAnyRole(['admin', 'sites-admin']); }
  canAccessStation(stationId) { /* ... */ }
}
```

### Security Port Interface

```javascript
export class SecurityPort {
  // Returns Principal or throws AuthenticationError
  async authenticate(token) { /* ... */ }

  // Returns boolean
  async authorize(principal, resource, action, context = {}) { /* ... */ }

  // Throws AuthorizationError if not authorized
  async requireAuthorization(principal, resource, action, context) { /* ... */ }
}
```

### Custom Exceptions

```javascript
export class AuthenticationError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = 401;
  }
}

export class AuthorizationError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = 403;
  }
}
```

### Adapters

- `JWTSecurityAdapter`: Current JWT + RBAC implementation
- `MockSecurityAdapter`: Testing with configurable principals
- `APIKeySecurityAdapter`: Future machine-to-machine auth

### Usage in Commands

```javascript
class CreateStationCommand {
  constructor(stationRepository, securityPort) { /* ... */ }

  async execute(data, token) {
    const principal = await this.securityPort.authenticate(token);
    await this.securityPort.requireAuthorization(principal, 'stations', 'create');
    return this.stationRepository.save(Station.create(data));
  }
}
```

### Controller Integration

```javascript
// Controller extracts token, passes to use case
async handleCreateStation(request) {
  const token = extractToken(request); // From cookie or header
  const data = await request.json();
  return this.createStation.execute(data, token);
}
```

## Consequences

### Positive

- **Testability**: Mock security in use case tests
- **Flexibility**: Swap JWT for OAuth2, API keys
- **Consistency**: Single authorization pattern
- **Domain isolation**: Core logic doesn't touch HTTP/JWT

### Negative

- **Indirection**: Token passed through layers
- **Overhead**: Port/adapter for every auth check

### Neutral

- Existing AuthorizationService in domain layer continues to hold business rules
- SecurityPort adapter calls AuthorizationService internally

## Alternatives Considered

### Alternative 1: Middleware-Only Auth

All auth in HTTP middleware, use cases assume authorized. Rejected because fine-grained authorization (station access) requires business context.

### Alternative 2: Pass User Object Directly

Controllers create Principal, pass to use cases. Rejected because it couples controllers to authentication logic.

### Alternative 3: Decorator Pattern

Wrap use cases with auth decorators. Rejected as too magic - explicit auth calls are clearer.

## Related

- [[ADR-001-hexagonal-architecture\|ADR-001: Hexagonal Architecture]]
- [[ADR-004-domain-events\|ADR-004: Domain Events]]
- [[../../CLAUDE\|CLAUDE.md Security Section]]

---

**Date**: 2025-12-27
**Author**: SITES Spectral Team
**Reviewers**: Security Review
