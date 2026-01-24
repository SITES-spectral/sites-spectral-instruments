# ADR-008: v15.0.0 Audit Remediation Plan

> **Status:** Proposed
> **Date:** 2026-01-24
> **Authors:** Jobelab Agent Team (@conductor, @hexi, @shield, @quarry)
> **Deciders:** SITES Spectral Team
> **Supersedes:** None
> **Architecture Credit:** Flights for Biodiversity Sweden AB

## Context

A comprehensive audit of SITES Spectral webapp v15.0.0 was conducted on 2026-01-24 by 6 specialized agents. The audit revealed critical issues that must be addressed before the subdomain architecture can be fully utilized.

### Audit Summary

| Domain | Score | Critical Issues |
|--------|-------|-----------------|
| Security | 85/100 | 0 critical, 1 high |
| Architecture | 82/100 | Business logic in handlers |
| Database | 95/100 | Minor FK warnings |
| **API Endpoints** | **40/100** | **3 handlers NOT wired** |
| **Test Coverage** | **20/100** | **0% for v15 features** |
| Documentation | 90/100 | OpenAPI outdated |

## Decision

We will address the audit findings in three phases:

### Phase 1: Critical Wiring (Immediate)

**Decision:** Wire all implemented handlers to the routing layer before any production use of v15 features.

**Changes:**
1. Add magic-links handler to `api-handler.js`
2. Add public API handler to `api-handler.js`
3. Create and wire UAV handler
4. Synchronize CSRF origins with CORS configuration

### Phase 2: Test Coverage (Sprint 1)

**Decision:** Achieve minimum 80% test coverage for all v15 security-critical components.

**Required Tests:**
- CloudflareAccessAdapter (JWT verification, role mapping)
- Magic Links (token generation, validation, expiry, revocation)
- Subdomain Routing (portal detection, access control)
- Public API (no-auth access, data filtering)

### Phase 3: Architecture Refinement (Sprint 2)

**Decision:** Refactor magic link logic to follow hexagonal architecture.

**Changes:**
- Move business logic from `handlers/magic-links.js` to domain layer
- Create `domain/authentication/MagicLinkService.js`
- Create `domain/authentication/MagicLinkToken.js` value object
- Update handler to be thin orchestration layer

## Consequences

### Positive
- v15 features will actually work (magic links, public API, UAV)
- Security-critical code will have automated regression testing
- Architecture will be consistent with established patterns
- Subdomain architecture can be safely used in production

### Negative
- Delays v15 production readiness by ~2 weeks
- Requires significant test writing effort
- Refactoring magic links requires careful migration

### Risks Mitigated
- Authentication bypass (CloudflareAccessAdapter tests)
- Token vulnerabilities (magic link tests)
- Portal isolation breach (subdomain tests)
- Data leakage (public API tests)

## Alternatives Considered

### 1. Deploy v15 as-is with Known Issues

**Rejected because:** Critical handlers are not wired, making core features non-functional. No security test coverage creates unacceptable risk.

### 2. Rollback to v14 Architecture

**Rejected because:** v15 subdomain architecture provides significant UX improvements and is already deployed to Cloudflare. The issues are fixable.

### 3. Partial Fix (Wiring Only)

**Considered but expanded:** Wiring fixes are necessary but insufficient. Security-critical features without test coverage are too risky.

## Implementation

### Immediate Actions

```bash
# 1. Wire magic-links handler
# Edit: src/api-handler.js
# Add: import { handleMagicLinks } from './handlers/magic-links.js';
# Add: case 'magic-links': routing

# 2. Wire public API handler
# Edit: src/api-handler.js
# Add: import { handlePublicApi } from './handlers/public.js';
# Add: public path routing (before auth check)

# 3. Sync CSRF origins
# Edit: src/utils/csrf.js
# Import: isAllowedOrigin from config/allowed-origins.js
```

### Test Files to Create

```
tests/
├── infrastructure/
│   └── auth/
│       ├── CloudflareAccessAdapter.test.js (NEW)
│       └── MagicLinks.test.js (NEW)
├── handlers/
│   ├── magic-links.test.js (NEW)
│   └── public.test.js (NEW)
└── domain/
    └── uav/
        ├── Pilot.test.js (NEW)
        ├── Mission.test.js (NEW)
        └── FlightLog.test.js (NEW)
```

## Verification

After implementation:

1. **Functional Tests:**
   ```bash
   # Magic links work
   curl -X POST https://admin.sitesspectral.work/api/v11/magic-links/create \
     -H "Cookie: sites_auth=<admin_token>" \
     -d '{"station_id": 7, "label": "Test"}'

   # Public API works
   curl https://sitesspectral.work/api/public/health
   ```

2. **Test Coverage:**
   ```bash
   npm run test:coverage
   # Target: >80% for v15 features
   ```

3. **Security Validation:**
   - JWT signature verification tested
   - Token expiry/revocation tested
   - Portal isolation tested

## Related Documents

- [[2026-01-24-MASTER-AUDIT-v15|Master Audit Report]]
- [[2026-01-24-security-audit-v15|Security Audit]]
- [[2026-01-24-api-audit-v15|API Audit]]
- [[2026-01-24-test-audit-v15|Test Coverage Audit]]
- [[SUBDOMAIN_ARCHITECTURE|Subdomain Architecture Docs]]

## Audit Trail

| Date | Action | By |
|------|--------|-----|
| 2026-01-24 | Comprehensive audit completed | @conductor + team |
| 2026-01-24 | ADR created | @hexi |
| TBD | Phase 1 implemented | TBD |
| TBD | Phase 2 tests written | TBD |
| TBD | Phase 3 refactoring complete | TBD |
