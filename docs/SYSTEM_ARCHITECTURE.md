# SITES Spectral System Architecture

> **Version**: 15.6.0
> **Last Updated**: 2026-01-26
> **Status**: Production

---

## Overview

SITES Spectral Stations & Instruments Registry is a comprehensive web application for managing research stations, platforms, instruments, and UAV operations across the Swedish Infrastructure for Ecosystem Science (SITES) network.

---

## Architecture Style

The system follows **Hexagonal Architecture** (Ports & Adapters) with **Domain-Driven Design** principles.

```
┌─────────────────────────────────────────────────────────────────────┐
│                         INFRASTRUCTURE                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │   HTTP      │  │  Database   │  │   Auth      │  │  Metrics   │ │
│  │  (Workers)  │  │    (D1)     │  │ (CF Access) │  │ (Analytics)│ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬──────┘ │
│         │                │                │               │         │
│  ┌──────┴────────────────┴────────────────┴───────────────┴──────┐ │
│  │                         PORTS (Interfaces)                     │ │
│  └──────┬────────────────┬────────────────┬───────────────┬──────┘ │
└─────────┼────────────────┼────────────────┼───────────────┼────────┘
          │                │                │               │
┌─────────┼────────────────┼────────────────┼───────────────┼────────┐
│         │           APPLICATION LAYER                     │         │
│  ┌──────┴──────┐  ┌──────┴──────┐  ┌──────┴──────┐  ┌────┴─────┐  │
│  │  Commands   │  │   Queries   │  │    Auth     │  │  Events  │  │
│  │ (Write Ops) │  │ (Read Ops)  │  │   Service   │  │ Handlers │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └────┬─────┘  │
└─────────┼────────────────┼────────────────┼───────────────┼────────┘
          │                │                │               │
┌─────────┼────────────────┼────────────────┼───────────────┼────────┐
│         │              DOMAIN LAYER                       │         │
│  ┌──────┴──────────────────────────────────────────────────────┐   │
│  │                        ENTITIES                              │   │
│  │  ┌─────────┐ ┌──────────┐ ┌────────────┐ ┌───────────────┐  │   │
│  │  │ Station │ │ Platform │ │ Instrument │ │ UAV (Pilot,   │  │   │
│  │  │         │ │          │ │            │ │ Mission, etc) │  │   │
│  │  └─────────┘ └──────────┘ └────────────┘ └───────────────┘  │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │                     VALUE OBJECTS                            │   │
│  │  ┌─────────┐ ┌──────────┐ ┌────────────┐ ┌───────────────┐  │   │
│  │  │  Role   │ │ MountType│ │  Ecosystem │ │   Coordinate  │  │   │
│  │  └─────────┘ └──────────┘ └────────────┘ └───────────────┘  │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │                   DOMAIN SERVICES                            │   │
│  │  ┌─────────────────────┐ ┌───────────────────────────────┐  │   │
│  │  │ AuthorizationService│ │ InstrumentTypeRegistry        │  │   │
│  │  └─────────────────────┘ └───────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Key Architectural Patterns

### 1. CQRS (Command Query Responsibility Segregation)

Commands and Queries are separated for clear intent:

| Type | Purpose | Examples |
|------|---------|----------|
| **Commands** | Write operations | `CreateStation`, `UpdatePlatform`, `DeleteInstrument` |
| **Queries** | Read operations | `ListStations`, `GetPlatformById`, `GetStationDashboard` |

### 2. Repository Pattern

Data access is abstracted through repository interfaces:

```
src/domain/station/StationRepositoryPort.js  ← Interface (Port)
src/infrastructure/persistence/d1/D1StationRepository.js  ← Implementation (Adapter)
```

### 3. Dependency Injection

All dependencies are wired through a container:

```javascript
// src/container.js
export function createContainer(env) {
  const repositories = {
    stations: new D1StationRepository(env.DB),
    platforms: new D1PlatformRepository(env.DB),
    instruments: new D1InstrumentRepository(env.DB),
    // ...
  };

  const commands = {
    createStation: new CreateStationCommand(repositories.stations),
    // ...
  };

  return { repositories, commands, queries };
}
```

### 4. Strategy Pattern (Platform Types)

Different platform types have different behaviors:

| Platform Type | Strategy | Auto-Creation |
|---------------|----------|---------------|
| Fixed | `FixedPlatformStrategy` | None |
| UAV | `UAVPlatformStrategy` | Creates instruments based on vendor/model |
| Satellite | `SatellitePlatformStrategy` | Creates sensor instruments |

### 5. Registry Pattern (Instrument Types)

Instrument types are config-driven:

```
yamls/instruments/instrument-types.yaml  → Build-time generation →
src/domain/instrument/instrument-types.generated.js  →
InstrumentTypeRegistry.js
```

---

## Directory Structure

```
src/
├── domain/                    # Core business logic (NO external deps)
│   ├── station/               # Station aggregate
│   │   ├── Station.js         # Entity
│   │   └── StationRepositoryPort.js  # Port interface
│   ├── platform/              # Platform aggregate
│   │   ├── Platform.js
│   │   └── strategies/        # Type strategies
│   ├── instrument/            # Instrument aggregate
│   │   ├── Instrument.js
│   │   └── InstrumentTypeRegistry.js
│   ├── uav/                   # UAV subdomain
│   │   ├── Pilot.js
│   │   ├── Mission.js
│   │   ├── FlightLog.js
│   │   └── Battery.js
│   └── authorization/         # Authorization domain
│       ├── Role.js
│       ├── User.js
│       └── AuthorizationService.js
│
├── application/               # Use cases (orchestration)
│   ├── commands/              # Write operations
│   │   ├── CreateStationCommand.js
│   │   └── UpdatePlatformCommand.js
│   └── queries/               # Read operations
│       ├── ListStationsQuery.js
│       └── GetStationDashboardQuery.js
│
├── infrastructure/            # External adapters
│   ├── persistence/           # Database adapters
│   │   └── d1/                # Cloudflare D1 implementations
│   │       ├── D1StationRepository.js
│   │       └── D1PlatformRepository.js
│   ├── http/                  # HTTP adapters
│   │   ├── router.js
│   │   └── controllers/
│   ├── auth/                  # Auth adapters
│   │   ├── CloudflareAccessAdapter.js
│   │   └── JWTAdapter.js
│   └── metrics/               # Metrics adapters
│       └── CloudflareAnalyticsAdapter.js
│
├── auth/                      # Authentication
│   ├── authentication.js
│   └── password-hasher.js
│
├── utils/                     # Utilities
│   ├── validation.js
│   ├── responses.js
│   └── csrf.js
│
├── container.js               # Dependency injection
└── worker.js                  # Cloudflare Worker entry point
```

---

## Data Flow

### Request Flow

```
Client Request
     │
     ▼
┌─────────────────┐
│  worker.js      │  Entry point
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  router.js      │  Route matching
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Controller     │  HTTP handling, validation
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Command/Query   │  Business logic orchestration
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Repository     │  Data access
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  D1 Database    │  Persistence
└─────────────────┘
```

### Authentication Flow

```
Request with Cookie
       │
       ▼
┌──────────────────┐
│ Check CF Access  │  Cloudflare Access JWT
│     Header       │
└────────┬─────────┘
         │
    ┌────┴────┐
    │ Valid?  │
    └────┬────┘
         │
    Yes  │  No
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐  ┌────────────┐
│Extract │  │Check Magic │
│CF User │  │Link Cookie │
└────┬───┘  └──────┬─────┘
     │             │
     └──────┬──────┘
            │
            ▼
    ┌───────────────┐
    │ Authorization │
    │    Service    │
    └───────────────┘
```

---

## Security Architecture

### Authentication Methods

| Method | Priority | Use Case |
|--------|----------|----------|
| Cloudflare Access JWT | 1st | Admin, Station Admin portals |
| Magic Link Token | 2nd | Internal station users |
| httpOnly Cookie | 3rd | Legacy sessions |

### Authorization Model (RBAC)

| Role | Stations | Platforms | Instruments | UAV |
|------|----------|-----------|-------------|-----|
| `admin` | Full | Full | Full | Full |
| `sites-admin` | Full | Full | Full | Full |
| `station-admin` | Read | CRUD (own) | CRUD (own) | CRUD (own) |
| `station` | Read | Read | Read | Read |
| `uav-pilot` | Read | Read | Read | Log flights |
| `readonly` | Read | Read | Read | Read |

### Security Features

- **CSRF Protection**: Origin/Referer header validation
- **Input Sanitization**: Schema-based validation for all inputs
- **XSS Prevention**: Event delegation, safe DOM methods
- **Password Hashing**: PBKDF2-SHA256 (100,000 iterations)
- **Session Security**: httpOnly cookies, secure flag

---

## Infrastructure

### Cloudflare Stack

| Service | Purpose |
|---------|---------|
| **Workers** | Serverless compute (JavaScript runtime) |
| **D1** | SQLite database (edge-replicated) |
| **Access** | Zero Trust authentication |
| **Analytics Engine** | Metrics and observability |
| **KV** | Key-value storage (sessions) |

### Deployment Architecture

```
                    ┌─────────────────────────┐
                    │   Cloudflare Edge       │
                    │   (Global Network)      │
                    └───────────┬─────────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         │                      │                      │
         ▼                      ▼                      ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│ sitesspectral   │   │ admin.sites...  │   │ {station}.sites │
│   .work         │   │   .work         │   │   spectral.work │
│ (Public Portal) │   │ (Admin Portal)  │   │(Station Portal) │
└────────┬────────┘   └────────┬────────┘   └────────┬────────┘
         │                      │                      │
         └──────────────────────┼──────────────────────┘
                                │
                                ▼
                    ┌─────────────────────────┐
                    │   Worker (API + SPA)    │
                    │   sites-spectral-       │
                    │   instruments.*.workers │
                    └───────────┬─────────────┘
                                │
                                ▼
                    ┌─────────────────────────┐
                    │   D1 Database           │
                    │   spectral_stations_db  │
                    └─────────────────────────┘
```

---

## Domain Model

### Core Entities

```
Station (1) ────< Platform (N) ────< Instrument (N) ────< ROI (N)
    │                 │                    │
    │                 │                    └───< Calibration (N)
    │                 │                    └───< Maintenance (N)
    │                 │
    │                 └───< AOI (N)
    │
    └───< Campaign (N) ────< Product (N)
```

### UAV Subdomain

```
Station (1) ────< Mission (N) ────< FlightLog (N)
    │                 │
    │                 └───< Pilot (N) [many-to-many]
    │
    └───< Pilot (N) [authorized pilots]
    │
    └───< Battery (N)
```

---

## Standards Alignment

| Standard | Alignment |
|----------|-----------|
| **Darwin Core** | Location identifiers, coordinates, geodetic datum |
| **ICOS** | Station types (TER, ATM, AQA, INT) |
| **Copernicus** | Processing levels (L0-L4) |
| **FAIR** | Findable, Accessible, Interoperable, Reusable data principles |

---

## Related Documentation

- [[API_REFERENCE]] - Complete API endpoint documentation
- [[DATABASE_SCHEMA]] - Database tables and relationships
- [[DEPLOYMENT_GUIDE]] - Deployment procedures
- [[USER_GUIDE_ADMIN]] - Admin user guide
- [[USER_GUIDE_STATION_ADMIN]] - Station admin user guide
- [[USER_GUIDE_UAV_PILOT]] - UAV pilot user guide
