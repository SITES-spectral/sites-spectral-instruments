# SITES Spectral V3 API Testing Guide

## Overview

This guide covers the comprehensive test suite for the SITES Spectral V3 API. The tests use **Vitest** with **@cloudflare/vitest-pool-workers** for testing Cloudflare Workers with D1 database support.

## Quick Start

```bash
# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage

# Run only integration tests
npm run test:integration

# Run only unit tests
npm run test:unit
```

## Test Structure

```
tests/
├── fixtures/
│   └── mock-data.js          # Mock data for all entity types
├── utils/
│   ├── test-helpers.js       # Request creation, token generation
│   └── db-setup.js           # Database schema and seeding
├── unit/                     # Unit tests (isolated functions)
└── integration/              # Integration tests (API endpoints)
    ├── v3-api-info.test.js   # Health and info endpoints
    ├── v3-platforms.test.js  # Platform CRUD operations
    ├── v3-aois.test.js       # AOI and spatial queries
    ├── v3-campaigns.test.js  # Campaign management
    └── v3-products.test.js   # Product catalog
```

## Test Categories

### 1. API Info & Health Tests

Tests the `/api/v3/info` and `/api/v3/health` endpoints:

- API info returns correct structure and version
- Health endpoint shows database connectivity
- Feature flags are included
- Error handling for unknown endpoints

### 2. Platform Tests

Tests `/api/v3/platforms` endpoints:

| Test Category | Tests |
|--------------|-------|
| Authentication | Token required, token validation |
| Read Operations | List, get by ID, pagination |
| Filtering | By station, type, ecosystem, status |
| Write Operations | Create, update, delete |
| Authorization | Admin vs station vs readonly roles |
| UAV Extension | UAV-specific data retrieval |

### 3. AOI Tests

Tests `/api/v3/aois` endpoints including spatial queries:

| Test Category | Tests |
|--------------|-------|
| CRUD Operations | Create, read, update, delete |
| Filtering | By station, type, ecosystem |
| **Spatial Queries** | |
| - Bounding Box | `GET /spatial/bbox?minLon=&minLat=&maxLon=&maxLat=` |
| - Point Query | `GET /spatial/point?lon=&lat=` |
| - Intersects | `POST /spatial/intersects` with geometry |
| - Within | `POST /spatial/within` with geometry |
| - Nearest | `GET /spatial/nearest?lon=&lat=&limit=` |
| GeoJSON Export | FeatureCollection format |

### 4. Campaign Tests

Tests `/api/v3/campaigns` endpoints:

| Test Category | Tests |
|--------------|-------|
| Read Operations | List, get by ID, filter by status |
| Write Operations | Create, update, complete, delete |
| Status Management | Transition between states |
| Scheduling | Upcoming campaigns, calendar view |
| Products | Associated products retrieval |

### 5. Product Tests

Tests `/api/v3/products` endpoints:

| Test Category | Tests |
|--------------|-------|
| Read Operations | List, get by ID, filter by type |
| Filtering | Type, platform, date, quality |
| Spatial Queries | Products within bounds |
| Write Operations | Create, update, archive, delete |
| Statistics | Aggregation and timeline |

## Test Utilities

### Creating Mock Requests

```javascript
import { createMockRequest, generateTestToken } from '../utils/test-helpers.js';

// GET request without auth
const request = createMockRequest('https://api.example.com/api/v3/info');

// GET request with auth
const token = generateTestToken({ role: 'admin' });
const request = createMockRequest('https://api.example.com/api/v3/platforms', {
  authToken: token,
});

// POST request with body
const request = createMockRequest('https://api.example.com/api/v3/platforms', {
  method: 'POST',
  authToken: token,
  body: { name: 'New Platform', ... },
});
```

### Generating Test Tokens

```javascript
import { generateTestToken } from '../utils/test-helpers.js';

// Admin token
const adminToken = generateTestToken({ role: 'admin' });

// Station user token (can only edit their station)
const stationToken = generateTestToken({
  role: 'station',
  station_id: 1,
  station_acronym: 'SVB',
});

// Readonly token
const readonlyToken = generateTestToken({ role: 'readonly' });
```

### Database Setup

```javascript
import { initializeTestDatabase, seedTestDatabase, resetTestDatabase } from '../utils/db-setup.js';

// In beforeAll
beforeAll(async () => {
  await initializeTestDatabase(env.DB);
  await seedTestDatabase(env.DB);
});

// Reset for each test (when tests modify data)
beforeEach(async () => {
  await resetTestDatabase(env.DB);
});
```

## Mock Data

### Available Mock Data

| Entity | Count | Key Fields |
|--------|-------|------------|
| Stations | 3 | SVB, ANS, LON |
| Platform Types | 4 | fixed, uav, satellite, mobile |
| Platforms | 4 | Mix of fixed and UAV |
| Instruments | 3 | phenocam, multispectral, PAR |
| AOIs | 3 | Different geometry types |
| Campaigns | 2 | completed, planned |
| Products | 2 | orthomosaic, NDVI |
| UAV Platforms | 1 | Mavic 3 MS |
| Users | 3 | admin, station, readonly |

### Data Generators

```javascript
import { generatePlatform, generateAOI, generateCampaign, generateProduct } from '../fixtures/mock-data.js';

// Generate new platform with defaults
const platform = generatePlatform();

// Generate with overrides
const uavPlatform = generatePlatform({
  platform_type: 'uav',
  station_id: 2,
});

// Generate AOI with polygon
const aoi = generateAOI({
  ecosystem_code: 'FOR',
  aoi_type: 'flight_area',
});
```

## Writing New Tests

### Test Structure

```javascript
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import { createMockRequest, createMockCtx, generateTestToken, parseJsonResponse } from '../utils/test-helpers.js';
import { resetTestDatabase } from '../utils/db-setup.js';
import { handleApiV3Request } from '../../src/v3/api-handler-v3.js';

describe('Feature Name', () => {
  beforeAll(async () => {
    await resetTestDatabase(env.DB);
  });

  describe('GET /api/v3/resource', () => {
    it('should return expected data', async () => {
      const token = generateTestToken({ role: 'admin' });
      const request = createMockRequest('https://api.example.com/api/v3/resource', {
        authToken: token,
      });
      const ctx = createMockCtx();

      const response = await handleApiV3Request(request, env, ctx);
      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(json.data).toBeDefined();
    });
  });
});
```

### Best Practices

1. **Reset database between tests** that modify data
2. **Use descriptive test names** that explain the expected behavior
3. **Test both success and error cases**
4. **Test authorization** for different user roles
5. **Validate response structure** not just status codes
6. **Use data generators** for dynamic test data

## Running Tests

### Local Development

```bash
# Watch mode for development
npm run test:watch

# Run specific test file
npx vitest run tests/integration/v3-platforms.test.js

# Run tests matching pattern
npx vitest run --grep "spatial"
```

### CI/CD Integration

```yaml
# Example GitHub Actions workflow
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test
```

## Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/index.html
```

Coverage targets:
- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%

## Troubleshooting

### Common Issues

1. **"env.DB is undefined"**
   - Ensure `cloudflare:test` import is present
   - Check vitest.config.js has correct D1 configuration

2. **"Token validation failed"**
   - Check token expiration in generateTestToken
   - Verify JWT_SECRET in mock environment

3. **"Table does not exist"**
   - Run initializeTestDatabase before tests
   - Check schema in db-setup.js matches migrations

4. **"Foreign key constraint failed"**
   - Seed data in correct order (stations → platforms → instruments)
   - Use resetTestDatabase to clean state

## Related Documentation

- [V3 API Quick Reference](../api/01-V3_API_QUICK_REFERENCE.md)
- [Platform Guides](../platform-guides/)
- [Vitest Documentation](https://vitest.dev/)
- [Cloudflare Workers Testing](https://developers.cloudflare.com/workers/testing/vitest-integration/)
