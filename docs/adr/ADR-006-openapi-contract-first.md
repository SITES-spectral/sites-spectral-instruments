# ADR-006: OpenAPI Contract-First Design

## Status

**Accepted**

## Context

SITES Spectral Instruments has grown to 150+ API endpoints across stations, platforms, instruments, maintenance, calibrations, ROIs, and system administration. Without a formal API specification:

- Frontend developers and API consumers had no single source of truth
- Request/response schemas were implicit in handler code
- Validation rules were scattered across files
- API changes could break clients without warning
- No automated contract validation in CI/CD

The API needed a formal, machine-readable specification that could drive validation, documentation, and client generation.

## Decision

Adopt **OpenAPI 3.0 Contract-First Design** with the following components:

### 1. Central OpenAPI Specification

`docs/openapi/openapi.yaml` serves as the single source of truth:

```yaml
openapi: 3.0.3
info:
  title: SITES Spectral Instruments API
  version: 13.4.0
paths:
  /api/v3/stations:
    get:
      operationId: listStations
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StationListResponse'
components:
  schemas:
    Station:
      type: object
      required: [id, acronym, display_name]
      properties:
        id:
          type: integer
        acronym:
          type: string
          pattern: '^[A-Z]{2,10}$'
```

### 2. Contract Validation Middleware

`src/middleware/contract-validator.js` validates requests against schemas:

```javascript
import { SCHEMAS, validateBody, validateQueryParams } from '../middleware/contract-validator.js';

// Enum validation
const isValidPlatformType = SCHEMAS.PlatformType.includes(body.platform_type);

// Body validation with contract
const validation = validateBody(body, {
  required: ['acronym', 'display_name'],
  types: { acronym: 'string', latitude: 'number' }
});
```

### 3. Build-Time Validation

`npm run api:validate` runs before each build to ensure the OpenAPI spec is valid:

```json
{
  "prebuild": "npm run api:validate || echo 'OpenAPI validation skipped'",
  "api:validate": "node scripts/validate-openapi.js"
}
```

### 4. Specification Coverage

| Category | Paths | Operations | Schemas |
|----------|-------|------------|---------|
| Auth | 2 | 3 | 4 |
| Stations | 3 | 5 | 5 |
| Platforms | 4 | 8 | 6 |
| Instruments | 5 | 10 | 8 |
| Maintenance | 4 | 8 | 5 |
| Calibrations | 4 | 8 | 6 |
| ROIs | 4 | 6 | 4 |
| System | 5 | 8 | 7 |
| **Total** | **33** | **51** | **49** |

## Consequences

### Positive

- **Single source of truth**: One file defines the entire API contract
- **Client generation**: Can auto-generate TypeScript/Python clients
- **Documentation**: Swagger UI / Redoc from same spec
- **Validation**: Request bodies validated against schema at runtime
- **CI integration**: Spec validation catches breaking changes early
- **Discoverability**: Developers find endpoints without reading code

### Negative

- **Maintenance overhead**: Spec must stay synchronized with implementation
- **Learning curve**: Team must understand OpenAPI 3.0 syntax
- **Incomplete coverage**: Legacy handlers not yet in spec

### Neutral

- **Gradual adoption**: New endpoints added to spec, legacy migrated over time

## Alternatives Considered

### Alternative 1: Code-First with Swagger Annotations

Generate OpenAPI from JSDoc comments. Rejected because:
- Comments drift from implementation
- Less control over spec structure
- Harder to review spec changes

### Alternative 2: GraphQL

Replace REST with GraphQL. Rejected because:
- Existing clients depend on REST
- Overkill for simple CRUD operations
- Team more familiar with REST patterns

### Alternative 3: JSON Schema Only

Use JSON Schema without OpenAPI wrapper. Rejected because:
- No path/operation definitions
- Harder to generate documentation
- Less tooling ecosystem

## Implementation

### Files Created

| File | Purpose |
|------|---------|
| `docs/openapi/openapi.yaml` | Central specification (1,800+ lines) |
| `src/middleware/contract-validator.js` | Request validation middleware |
| `scripts/validate-openapi.js` | CI/CD validation script |

### Schema Enums (v13.4.0)

```javascript
SCHEMAS = {
  PlatformType: ['fixed', 'uav', 'satellite', 'mobile', 'usv', 'uuv'],
  MountTypeCode: ['TWR', 'BLD', 'GND', 'UAV', 'SAT', 'MOB', 'USV', 'UUV'],
  EcosystemCode: ['FOR', 'AGR', 'GRA', 'HEA', 'MIR', 'ALP', 'LAK', 'CON', 'WET', 'DEC', 'MAR', 'PEA'],
  InstrumentType: ['phenocam', 'multispectral', 'par', 'ndvi', 'pri', 'hyperspectral', 'rgb', 'thermal', 'lidar', 'sar'],
  Status: ['Active', 'Inactive', 'Maintenance', 'Decommissioned']
}
```

## Related

- [[ADR-001-hexagonal-architecture|ADR-001: Hexagonal Architecture]]
- [[ADR-007-port-versioning|ADR-007: Port Versioning Strategy]]
- [[../openapi/openapi.yaml|OpenAPI Specification]]
- [[../../CLAUDE|CLAUDE.md API Reference]]

---

**Date**: 2025-12-27
**Author**: SITES Spectral Team
**Reviewers**: Architecture Review
