# ADR-002: CQRS for Read/Write Separation

## Status

**Accepted**

## Context

As the application grew, we noticed:
- Read operations (dashboard, listings) had different optimization needs than writes
- Some queries needed denormalized data (station with platform/instrument counts)
- Write operations needed validation, authorization, and event publishing
- Mixing reads and writes in single service classes led to bloated files

## Decision

Adopt Command Query Responsibility Segregation (CQRS) at the application layer:

```
src/application/
├── commands/           # Write operations
│   ├── station/
│   │   ├── CreateStation.js
│   │   ├── UpdateStation.js
│   │   └── DeleteStation.js
│   ├── platform/
│   └── instrument/
│
└── queries/            # Read operations
    ├── station/
    │   ├── GetStationById.js
    │   ├── GetStationDashboard.js
    │   └── ListStations.js
    ├── platform/
    └── instrument/
```

### Command Characteristics

- Named with verbs: `CreateStation`, `UpdateInstrument`
- Have side effects (database writes, events)
- Return the created/updated entity or success status
- Validate input and check authorization

### Query Characteristics

- Named with `Get` or `List`: `GetStationById`, `ListPlatforms`
- No side effects (read-only)
- Can use optimized read models
- May aggregate data from multiple sources

## Consequences

### Positive

- **Clarity**: Clear distinction between reads and writes
- **Optimization**: Queries can use denormalized views
- **Testing**: Commands and queries tested independently
- **Scalability**: Read and write paths can scale differently

### Negative

- **More files**: Each operation is a separate file
- **Potential inconsistency**: Read models may lag write models (not an issue with D1's consistency)

### Neutral

- We don't use separate read/write databases (overkill for our scale)
- Commands and queries share the same repository interfaces

## Alternatives Considered

### Alternative 1: Service Classes

Traditional `StationService` with both read and write methods. Rejected because files grew too large and responsibilities mixed.

### Alternative 2: Full Event Sourcing

Store events as source of truth, project read models. Rejected as too complex for our needs - D1's transactional model is sufficient.

## Related

- [[ADR-001-hexagonal-architecture\|ADR-001: Hexagonal Architecture]]
- [[ADR-004-domain-events\|ADR-004: Domain Events]]

---

**Date**: 2025-11-20
**Author**: SITES Spectral Team
**Reviewers**: Architecture Review
