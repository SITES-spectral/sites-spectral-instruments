# ADR-001: Hexagonal Architecture Adoption

## Status

**Accepted**

## Context

SITES Spectral Instruments started as a simple CRUD application with handlers directly accessing the database. As the application grew to support multiple platform types (fixed, UAV, satellite), complex calibration workflows, and multiple user roles, the codebase became difficult to maintain and test.

Key pain points:
- Business logic scattered across handlers
- Direct D1 database coupling made testing difficult
- Adding new platform types required modifying multiple files
- No clear separation between domain rules and infrastructure concerns

## Decision

Adopt Hexagonal Architecture (Ports and Adapters) with the following structure:

```
src/
├── domain/           # Core business logic (NO external dependencies)
│   ├── station/      # Station aggregate
│   ├── platform/     # Platform with type strategies
│   ├── instrument/   # Instrument with type registry
│   └── shared/       # Shared ports, events, value objects
│
├── application/      # Use cases (orchestration layer)
│   ├── commands/     # Write operations
│   └── queries/      # Read operations
│
└── infrastructure/   # External adapters
    ├── persistence/  # D1 repository implementations
    ├── http/         # Controllers, routes
    └── events/       # Event bus implementations
```

### Key Principles

1. **Domain has zero external dependencies** - no database, HTTP, or framework code
2. **Ports define interfaces** - repository interfaces live in domain
3. **Adapters implement ports** - D1Repository implements StationRepository
4. **Use cases orchestrate** - business logic in commands/queries, not controllers
5. **Dependency inversion** - domain defines contracts, infrastructure fulfills them

## Consequences

### Positive

- **Testability**: Domain and application layers tested without database
- **Flexibility**: Swap D1 for PostgreSQL by changing adapter
- **Maintainability**: Clear boundaries, single responsibility
- **Onboarding**: New developers understand where code belongs

### Negative

- **Boilerplate**: More files and indirection
- **Learning curve**: Team needs to understand the pattern
- **Refactoring effort**: Existing handlers need migration

### Neutral

- Legacy handlers coexist during migration (gradually deprecated)

## Alternatives Considered

### Alternative 1: Clean Architecture (Uncle Bob)

Similar to Hexagonal but with more rigid layer separation. Rejected because Hexagonal's ports/adapters metaphor fits better with our integration needs.

### Alternative 2: Keep Simple Handler Pattern

Continue with handlers → database pattern. Rejected because testability and maintainability were suffering.

### Alternative 3: Microservices

Split into separate services per domain. Rejected as premature - Cloudflare Workers already provides isolation, and the team size doesn't warrant the operational complexity.

## Related

- [[ADR-002-cqrs-pattern\|ADR-002: CQRS Pattern]]
- [[ADR-004-domain-events\|ADR-004: Domain Events]]
- [[../../CLAUDE\|CLAUDE.md Architecture Section]]

---

**Date**: 2025-11-15
**Author**: SITES Spectral Team
**Reviewers**: Architecture Review
