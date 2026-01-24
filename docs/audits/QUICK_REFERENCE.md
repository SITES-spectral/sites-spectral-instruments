# Architecture Audit - Quick Reference Card

> **Date**: 2026-01-24 | **Score**: 82/100 | **Status**: ✅ Production Ready

---

## 🎯 Top 4 Priorities

1. **Create Application Layer** - Move business logic from handlers
2. **Fix CalibrationRecord.js** - 798 lines → split into type hierarchy
3. **Write UAV Tests** - Pilot, Mission, FlightLog at 0% coverage
4. **Create ADRs** - Document v15.0.0 architecture decisions

---

## ✅ What's Working Well

| Strength | Evidence |
|----------|----------|
| Pure Domain Layer | Zero external dependencies found |
| Hexagonal Architecture | Ports in domain, adapters in infrastructure |
| UAV Entities | Pilot, Mission, FlightLog are exemplary DDD |
| Security Design | CF Access, magic links, RBAC all correct |
| Config-Driven | Instrument types generated from YAML |

---

## ❌ Critical Issues

| Issue | File | Lines | Fix |
|-------|------|-------|-----|
| Business logic in handlers | `magic-links.js` | 481 | Move to `application/commands/` |
| Monolithic entity | `CalibrationRecord.js` | 798 | Split into type hierarchy |
| Zero tests | UAV domain | 0 | Create test suite |
| Missing docs | ADRs | 0 | Create 4 ADRs |

---

## 📏 Architecture Rules

### SOLID Principles

| Principle | Rule | Example |
|-----------|------|---------|
| **S**ingle Responsibility | One reason to change | Each entity has ONE job |
| **O**pen/Closed | Extend, don't modify | Add new platform types via strategy |
| **L**iskov Substitution | Subtypes are substitutable | All `PlatformTypeStrategy` work the same |
| **I**nterface Segregation | Many small interfaces | Separate ports for logging, metrics, security |
| **D**ependency Inversion | Depend on abstractions | Infrastructure depends on domain ports |

### Hexagonal Architecture

```
┌─────────────────────────────────────┐
│         Infrastructure              │
│  (Adapters - DB, HTTP, Auth)        │
│                                     │
│  ┌───────────────────────────────┐ │
│  │      Application              │ │
│  │  (Use Cases - Commands,       │ │
│  │   Queries)                    │ │ ⚠️ MISSING!
│  │                               │ │
│  │  ┌─────────────────────────┐ │ │
│  │  │      Domain             │ │ │
│  │  │  (Entities, Services,   │ │ │
│  │  │   Ports)                │ │ │ ✅ PURE
│  │  └─────────────────────────┘ │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

### File Size Limit

- **Maximum**: 200 lines per file
- **Violations**: 8 files (biggest: CalibrationRecord.js at 798)
- **Action**: Split using type hierarchy or extract to services

---

## 🔧 Refactoring Patterns

### Pattern 1: Extract Type Hierarchy

**Before** (798 lines):
```javascript
class CalibrationRecord {
    // 10+ calibration types
    // 55+ fields
    // Mixed responsibilities
}
```

**After** (150 lines each):
```javascript
class CalibrationRecord { /* base */ }
class FieldCalibrationRecord extends CalibrationRecord { }
class FactoryCalibrationRecord extends CalibrationRecord { }
```

### Pattern 2: Move to Application Layer

**Before**:
```javascript
// handlers/magic-links.js
async function createMagicLink(request, env) {
    // 1. Auth check
    // 2. Business logic (token generation)
    // 3. Database access
    // 4. Response
}
```

**After**:
```javascript
// infrastructure/http/controllers/MagicLinkController.js
async handleCreate(request, env) {
    const user = await getUserFromRequest(request, env);
    const command = new CreateMagicLink(user, body);
    const result = await commandBus.execute(command);
    return createResponse(result);
}

// application/commands/CreateMagicLink.js
class CreateMagicLink {
    async execute(magicLinkService, repository) {
        // Business logic only
    }
}
```

### Pattern 3: Config-Driven Enums

**Before**:
```javascript
// Hardcoded in source
const CERTIFICATE_TYPES = ['A1/A3', 'A2', 'STS-01'];
```

**After**:
```yaml
# yamls/core/pilot-certifications.yaml
certificate_types:
  - code: A1/A3
    name: "Open Category A1/A3"
  - code: A2
    name: "Open Category A2"
```

---

## 📋 Code Review Checklist

Before committing, verify:

- [ ] File is under 200 lines (or has justification)
- [ ] No external dependencies in `src/domain/`
- [ ] Business logic in domain/application, not handlers
- [ ] New features have tests (80%+ coverage)
- [ ] Repository ports in domain, adapters in infrastructure
- [ ] Configuration in YAML, not hardcoded
- [ ] ADR created for architectural decisions
- [ ] JSDoc on all public methods

---

## 🧪 Testing Requirements

### UAV Domain (Currently 0% - CRITICAL)

**Required Tests**:
```javascript
// Pilot.test.js
- Certificate validation
- Insurance expiry checks
- Station authorization
- canFly() business logic

// Mission.test.js
- Status transitions (draft → planned → approved → in_progress → completed)
- Approval workflow
- Abort/cancel logic
- Duration calculations

// FlightLog.test.js
- Duration calculation
- Battery usage tracking
- Incident severity validation
- Data rate calculation
```

### Test Coverage Targets

| Layer | Current | Target |
|-------|---------|--------|
| Domain | ~70% | 90% |
| Application | N/A | 80% |
| Infrastructure | ~60% | 70% |
| **UAV Domain** | **0%** | **80%** |

---

## 📖 Documentation Standards

### Required JSDoc

```javascript
/**
 * Check if pilot can currently fly
 *
 * Validates:
 * - Active status
 * - Valid certificate (not expired)
 * - Valid insurance
 *
 * @returns {boolean} True if all conditions met
 * @throws {Error} Never - returns false instead
 */
canFly() {
    return this.status === 'active' &&
           this.hasCertificate() &&
           !this.isCertificateExpired() &&
           this.hasValidInsurance();
}
```

### ADR Template

```markdown
# ADR NNN: Title

**Status**: Proposed | Accepted | Deprecated | Superseded

**Context**: What is the issue we're facing?

**Decision**: What did we decide?

**Consequences**: What are the trade-offs?

**Alternatives Considered**: What else did we look at?
```

---

## 🚦 Health Score Breakdown

| Category | Current | Target | Gap |
|----------|---------|--------|-----|
| SOLID Compliance | 25/30 | 28/30 | -3 |
| Hexagonal Architecture | 22/25 | 25/25 | -3 |
| Configuration-Driven | 14/15 | 15/15 | -1 |
| Test Coverage | 12/15 | 14/15 | -2 |
| Documentation | 9/15 | 13/15 | -4 |
| **TOTAL** | **82/100** | **95/100** | **-13** |

**To reach 95/100**:
1. Create application layer (+3 Hexagonal)
2. Refactor CalibrationRecord (+2 SOLID)
3. Write UAV tests (+2 Coverage)
4. Create ADRs (+4 Documentation)
5. Extract configs to YAML (+1 SOLID, +1 Config-Driven)

---

## 🎓 Learn from UAV Domain

**Best Practices Demonstrated**:

1. **Clear Enums**: `CERTIFICATE_TYPES`, `PILOT_STATUSES`, `MISSION_STATUSES`
2. **Private Validation**: `#validate()` in constructor
3. **Business Methods**: `canFly()`, `isAuthorizedForStation()`, `approve()`
4. **No External Dependencies**: Pure domain logic
5. **Value Calculations**: `getDaysUntilExpiry()`, `getActualDurationMinutes()`
6. **State Transitions**: `start()`, `complete()`, `abort()`, `cancel()`

**Use Pilot.js, Mission.js, FlightLog.js as templates for refactoring other entities.**

---

## 📞 Get Help

- **Architecture Questions**: @hexi (Architecture Guardian)
- **Security Review**: @shield (Security Specialist)
- **Testing Strategy**: @pebble (QA & Testing)
- **Domain Modeling**: @cascade (Backend Architecture)

---

**Remember**: Perfect is the enemy of good. Focus on the critical issues first (application layer, UAV tests, ADRs), then iterate on improvements.

**Next Milestone**: 88/100 after Sprint 1 (2 weeks)
