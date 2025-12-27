# ADR-004: Domain Events for Audit Trail

## Status

**Accepted**

## Context

SITES Spectral requires:
- Audit trail of all significant actions
- Potential future integrations (notifications, external systems)
- Decoupled side effects (logging, metrics)
- ROI change tracking for L2/L3 data integrity

Direct method calls for these concerns led to:
- Commands becoming bloated with side-effect handling
- Tight coupling between business logic and infrastructure
- Difficulty adding new listeners

## Decision

Implement **Domain Events** infrastructure:

### Event Base Class

```javascript
// src/domain/shared/events/DomainEvent.js
export class DomainEvent {
  constructor(type, payload, metadata = {}) {
    this.type = type;
    this.payload = payload;
    this.metadata = {
      eventId: generateId(),
      occurredAt: new Date().toISOString(),
      ...metadata
    };
  }
}
```

### Event Types

| Event | Trigger | Purpose |
|-------|---------|---------|
| `StationCreated` | New station | Audit |
| `StationUpdated` | Station modified | Audit |
| `InstrumentCalibrated` | Calibration completed | Metrics, notifications |
| `MaintenanceCompleted` | Maintenance done | Audit, scheduling |
| `ROIModified` | ROI changed | L2/L3 integrity tracking |
| `TimeseriesBroken` | Admin override edit | Data integrity warning |

### Event Publisher Port

```javascript
// src/domain/shared/ports/EventPublisherPort.js
export class EventPublisherPort {
  async publish(event) { /* ... */ }
  async publishAll(events) { /* ... */ }
  subscribe(eventType, handler) { /* ... */ }
}
```

### Adapters

- `InMemoryEventBus`: Development, testing
- `CloudflareQueueEventBus`: Production (future, for async processing)
- `AuditLogEventBus`: Persist events to audit log table

### Usage in Commands

```javascript
class CreateStationCommand {
  constructor(stationRepository, eventPublisher) { /* ... */ }

  async execute(data, principal) {
    const station = await this.stationRepository.save(data);
    await this.eventPublisher.publish(
      new StationCreated(station, principal.userId)
    );
    return station;
  }
}
```

## Consequences

### Positive

- **Decoupling**: Business logic doesn't know about logging, metrics
- **Extensibility**: Add new listeners without modifying commands
- **Audit trail**: Events persist for compliance
- **Testing**: Mock event publisher in tests

### Negative

- **Complexity**: Additional abstraction layer
- **Eventual consistency**: Async handlers may lag
- **Debugging**: Event flow harder to trace

### Neutral

- Events are currently processed synchronously (in-memory bus)
- Future: migrate to Cloudflare Queues for durability

## Alternatives Considered

### Alternative 1: Direct Audit Logging

Call audit log service directly in commands. Rejected because it tightly couples business logic to audit infrastructure.

### Alternative 2: Database Triggers

Use D1 triggers for audit. Rejected because D1 doesn't support triggers and it would bypass business logic.

### Alternative 3: Change Data Capture

External system monitors database changes. Rejected as too complex for our scale and doesn't capture business intent.

## Related

- [[ADR-001-hexagonal-architecture\|ADR-001: Hexagonal Architecture]]
- [[ADR-003-legacy-roi-system\|ADR-003: Legacy ROI System]]
- [[ADR-005-security-ports\|ADR-005: Security Ports]]

---

**Date**: 2025-12-27
**Author**: SITES Spectral Team
**Reviewers**: Architecture Review
