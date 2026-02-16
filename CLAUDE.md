# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Current Version: 15.6.11

| Property | Value |
|----------|-------|
| **Status** | Production Ready |
| **Admin Portal** | https://admin.sitesspectral.work |
| **Public Portal** | https://sitesspectral.work |
| **Last Updated** | 2026-02-16 |
| **Test Coverage** | 1268 tests |

### Recent Changes

- **v15.6.11**: CF Access session persistence ([docs](docs/security/SESSION_PERSISTENCE.md))
- **v15.6.10**: Security audit complete (P0/P1/P2)
- **v15.0.0**: Subdomain architecture ([docs](docs/architecture/SUBDOMAIN_ARCHITECTURE.md))

See: [Version History](docs/VERSION_HISTORY.md) | [Feature Matrix](docs/FEATURE_MATRIX.md) | [CHANGELOG](CHANGELOG.md)

---

## Architecture Requirements

**All code MUST follow SOLID principles and Hexagonal Architecture.**

```
src/
├── domain/           # Core business logic (NO external dependencies)
│   ├── station/      # Station entities, repository ports
│   ├── platform/     # Platform entities, type strategies
│   ├── instrument/   # Instrument entities, type registry
│   └── authorization/# Role, User, AuthorizationService
│
├── application/      # Use cases (orchestration layer)
│   ├── commands/     # Write operations
│   └── queries/      # Read operations
│
└── infrastructure/   # External adapters
    ├── persistence/  # D1Repository implementations
    ├── http/         # Controllers, routes, middleware
    └── auth/         # Authentication adapters
```

### Code Rules

1. **Domain layer has ZERO external dependencies**
2. **Repository interfaces live in domain** - implementations in infrastructure
3. **Use cases orchestrate domain logic** - no business logic in controllers
4. **Config-driven over code-driven** - use YAML for configuration
5. **No monolithic files** - focused, single-responsibility modules

---

## Quick Reference

### Platform Types

| Type | Code | Status |
|------|------|--------|
| Fixed | `fixed` | Active |
| UAV | `uav` | Active |
| Satellite | `satellite` | Active |
| Mobile | `mobile` | Coming Soon |

### Entity Naming

| Entity | Format | Example |
|--------|--------|---------|
| Station | `{ACRONYM}` | SVB, ANS |
| Platform (Fixed) | `{STATION}_{ECOSYSTEM}_{MOUNT}{##}` | SVB_FOR_TWR01 |
| Instrument | `{PLATFORM}_{TYPE}{##}` | SVB_FOR_TWR01_PHE01 |

### Mount Types (v12.0.0+)

| Code | Name |
|------|------|
| TWR | Tower/Mast |
| BLD | Building |
| GND | Ground Level |
| UAV | UAV Position |
| SAT | Satellite |

See: [Quick Reference Guide](docs/QUICK_REFERENCE.md)

---

## Development

### Commands

```bash
npm run dev          # Local development
npm run build        # Build application
npm run deploy       # Deploy to production
npm run db:migrate   # Apply database migrations
npm test             # Run tests
```

### Deployment Checklist

1. Bump version in `package.json`
2. Update `CHANGELOG.md`
3. Run `npm run deploy`
4. Commit with descriptive message

---

## File Structure

```
public/
├── index.html              # Login redirect
├── login.html              # Authentication
├── station-dashboard.html  # Station view
├── sites-dashboard.html    # Admin view
└── js/
    ├── api.js              # API client
    ├── dashboard.js        # Dashboard logic
    └── core/               # Utilities

src/
├── worker.js               # CF Worker entry
├── api-handler.js          # API routing
├── auth/                   # Authentication
├── utils/                  # Utilities
├── handlers/               # API handlers
└── infrastructure/         # Adapters
    └── http/controllers/   # HTTP controllers
```

---

## Security

### Authentication Methods

| Method | Use Case | Session |
|--------|----------|---------|
| CF Access OTP | Admin/Station portals | 24h cookie |
| Password | All portals | 24h cookie |
| Magic Link | Station users | 24h cookie |

### Key Security Features

- CSRF Protection via Origin/Referer validation
- Input Sanitization Framework
- httpOnly JWT Cookies with SameSite=Lax
- Rate Limiting
- XSS Prevention

See: [Security Documentation](docs/security/)

---

## Database

### Core Tables

```sql
stations (id, acronym, display_name, latitude, longitude, ...)
platforms (id, station_id, normalized_name, ecosystem_code, mount_type_code, ...)
instruments (id, platform_id, normalized_name, instrument_type, status, ...)
instrument_rois (id, instrument_id, roi_name, polygon_points, ...)
users (id, username, role, station_id, ...)
```

See: [Database Schema](docs/DATABASE_SCHEMA.md)

---

## Documentation Index

| Document | Purpose |
|----------|---------|
| [CHANGELOG.md](CHANGELOG.md) | Version history |
| [Quick Reference](docs/QUICK_REFERENCE.md) | Platform/instrument types, naming |
| [Version History](docs/VERSION_HISTORY.md) | Release summaries |
| [Feature Matrix](docs/FEATURE_MATRIX.md) | Feature status by version |
| [API Reference](docs/API_REFERENCE.md) | API endpoints |
| [Database Schema](docs/DATABASE_SCHEMA.md) | Table structure |

### Security Documentation

| Document | Purpose |
|----------|---------|
| [Session Persistence](docs/security/SESSION_PERSISTENCE.md) | CF Access session fix (v15.6.11) |
| [CF Access Integration](docs/security/CLOUDFLARE_ACCESS_INTEGRATION.md) | Cloudflare Access setup |
| [Authentication v14](docs/security/AUTHENTICATION_v14.md) | Cookie auth system |
| [Magic Link System](docs/MAGIC_LINK_SYSTEM.md) | Token-based auth |

### Architecture Documentation

| Document | Purpose |
|----------|---------|
| [Subdomain Architecture](docs/architecture/SUBDOMAIN_ARCHITECTURE.md) | Portal structure |
| [Architecture Visualization](docs/ARCHITECTURE_VISUALIZATION.md) | Hexagonal diagrams |
| [Vocabulary Mapping](docs/VOCABULARY_MAPPING.md) | Darwin Core, ICOS alignment |

---

## YAML Configuration

### Backend (Build-Time)

| Config | Generated Module |
|--------|------------------|
| `yamls/instruments/instrument-types.yaml` | `src/domain/instrument/instrument-types.generated.js` |

### Frontend (Runtime)

| Config | Purpose |
|--------|---------|
| `yamls/ui/platform-types.yaml` | Platform icons, colors |
| `yamls/ui/instrument-types.yaml` | Instrument icons |
| `yamls/core/ecosystems.yaml` | Ecosystem codes |

Access via `window.SitesConfig`:
```javascript
SitesConfig.getPlatformType('uav')
SitesConfig.getStatusColor('Active')
```

---

## Agent Teams

Key agents for this project:

| Agent | Best For |
|-------|----------|
| `@hexi` | Hexagonal architecture, SOLID principles |
| `@cascade` | Backend, Cloudflare Workers |
| `@shield` | Security, CSRF, XSS, JWT |
| `@quarry` | Database schema, migrations |
| `@forge` | Cross-app ecosystem |

See: [Full Agent Matrix](~/.claude/AGENTS_MATRIX.md)

---

## Environment Notes

- No root access - everything local to user
- Python: Use uv with Python 3.12.9
- Use `tmp/` folder inside project (gitignored), never system `/tmp/`
- Use Cloudflare API directly for database queries
