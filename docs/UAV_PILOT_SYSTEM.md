# UAV Pilot System

> **Architecture Credit**: This subdomain-based architecture design is based on
> architectural knowledge shared by **Flights for Biodiversity Sweden AB**
> (https://github.com/flightsforbiodiversity).

## Overview

The UAV Pilot System provides comprehensive management for UAV operations at SITES Spectral stations, including pilot certification tracking, mission planning, flight logging, and battery management.

---

## Domain Model

### Entity Relationships

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│   Station   │────<│   Mission   │────<│   Flight Log    │
└─────────────┘     └─────────────┘     └─────────────────┘
       │                   │                     │
       │                   │                     │
       v                   v                     v
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│  Platform   │     │   Pilots    │────<│    Battery      │
│    (UAV)    │     │(via junction)     └─────────────────┘
└─────────────┘     └─────────────┘
```

---

## Pilot Management

### Pilot Entity

| Field | Type | Description |
|-------|------|-------------|
| `id` | Integer | Unique identifier |
| `user_id` | Integer | Linked user account (optional) |
| `full_name` | String | Pilot's full name |
| `email` | String | Contact email (unique) |
| `phone` | String | Contact phone |
| `organization` | String | Pilot's organization |

### Certification (Swedish Transport Agency)

| Certificate Type | Description | Use Case |
|-----------------|-------------|----------|
| `A1/A3` | Open category basic | Consumer drones <25kg |
| `A2` | Open category close | Flying near people |
| `STS-01` | Specific category VLOS | Professional VLOS operations |
| `STS-02` | Specific category BVLOS | Beyond visual line of sight |
| `national` | National authorization | Special operations |

### Insurance Requirements

All pilots must maintain valid liability insurance:

- Policy number tracked
- Expiry date monitored
- Warnings issued 30 days before expiry

### Station Authorization

Pilots must be explicitly authorized for each station they can fly at:

```json
{
  "authorized_stations": [1, 7, 8]
}
```

### Flight Hours Tracking

| Metric | Description |
|--------|-------------|
| `flight_hours_total` | Total career flight hours |
| `flight_hours_sites_spectral` | Hours logged at SITES stations |
| `last_flight_date` | Most recent flight |

---

## Mission Management

### Mission Lifecycle

```
┌────────┐   ┌─────────┐   ┌──────────┐   ┌─────────────┐
│ Draft  │──>│ Planned │──>│ Approved │──>│ In Progress │
└────────┘   └─────────┘   └──────────┘   └─────────────┘
                  │              │               │
                  v              v               v
             ┌──────────┐  ┌──────────┐   ┌───────────┐
             │Cancelled │  │ Aborted  │   │ Completed │
             └──────────┘  └──────────┘   └───────────┘
```

### Mission Code Format

```
{STATION}_{DATE}_{SEQUENCE}

Examples:
- SVB_2026-01-24_001
- ANS_2026-02-15_003
```

### Flight Patterns

| Pattern | Description | Use Case |
|---------|-------------|----------|
| `grid` | Parallel lines | Standard mapping |
| `crosshatch` | Grid + perpendicular | High-overlap mapping |
| `perimeter` | Boundary flight | Area boundary |
| `point_of_interest` | Orbit around point | Structure inspection |
| `custom` | User-defined waypoints | Special surveys |

### Weather Tracking

```json
{
  "weather_conditions": {
    "temperature_c": 15,
    "wind_speed_ms": 5,
    "wind_direction_deg": 270,
    "cloud_cover_percent": 40,
    "precipitation": "none"
  },
  "weather_source": "manual"
}
```

---

## Flight Logging

### Flight Log Entry

Each battery swap creates a new flight log entry:

| Field | Type | Description |
|-------|------|-------------|
| `mission_id` | Integer | Parent mission |
| `pilot_id` | Integer | Pilot flying |
| `platform_id` | Integer | UAV used |
| `flight_number` | Integer | Sequence within mission |
| `takeoff_time` | DateTime | Flight start |
| `landing_time` | DateTime | Flight end |

### Telemetry Data

| Metric | Unit | Description |
|--------|------|-------------|
| `max_altitude_agl_m` | meters | Maximum height above ground |
| `max_distance_m` | meters | Maximum distance from takeoff |
| `total_distance_m` | meters | Total path length |
| `average_speed_ms` | m/s | Average ground speed |

### Data Collection

| Field | Unit | Description |
|-------|------|-------------|
| `images_captured` | count | Number of images taken |
| `data_size_mb` | MB | Total data collected |

### Incident Reporting

| Severity | Description | Examples |
|----------|-------------|----------|
| `minor` | No damage, flight continued | GPS glitch, wind gust |
| `moderate` | Flight affected | Forced landing, loss of video |
| `major` | Equipment damage | Crash, component failure |
| `critical` | Safety incident | Near-miss, injury, property damage |

---

## Battery Management

### Battery Tracking

| Field | Type | Description |
|-------|------|-------------|
| `serial_number` | String | Unique identifier |
| `manufacturer` | String | Battery brand |
| `model` | String | Battery model |
| `capacity_mah` | Integer | Rated capacity |
| `cell_count` | Integer | Cell configuration (e.g., 4S) |
| `chemistry` | String | LiPo, LiHV, LiIon |

### Battery Health

| Metric | Description |
|--------|-------------|
| `health_percent` | Estimated remaining capacity |
| `internal_resistance_mohm` | Internal resistance (milliohms) |
| `cycle_count` | Number of charge cycles |

### Battery Status

| Status | Description |
|--------|-------------|
| `available` | Ready for use |
| `in_use` | Currently in aircraft |
| `charging` | Being charged |
| `storage` | In storage mode |
| `maintenance` | Under inspection |
| `retired` | End of life |
| `damaged` | Damaged, do not use |

---

## API Endpoints

### Pilots

```http
GET    /api/v11/uav/pilots                 # List all pilots
GET    /api/v11/uav/pilots/:id             # Get pilot details
POST   /api/v11/uav/pilots                 # Register new pilot
PUT    /api/v11/uav/pilots/:id             # Update pilot
DELETE /api/v11/uav/pilots/:id             # Deactivate pilot
GET    /api/v11/uav/pilots/:id/flights     # Pilot's flight history
```

### Missions

```http
GET    /api/v11/uav/missions               # List missions
GET    /api/v11/uav/missions/:id           # Get mission details
POST   /api/v11/uav/missions               # Create mission
PUT    /api/v11/uav/missions/:id           # Update mission
POST   /api/v11/uav/missions/:id/approve   # Approve mission
POST   /api/v11/uav/missions/:id/start     # Start mission
POST   /api/v11/uav/missions/:id/complete  # Complete mission
POST   /api/v11/uav/missions/:id/abort     # Abort mission
```

### Flight Logs

```http
GET    /api/v11/uav/flights                # List flight logs
GET    /api/v11/uav/flights/:id            # Get flight details
POST   /api/v11/uav/flights                # Log new flight
PUT    /api/v11/uav/flights/:id            # Update flight log
POST   /api/v11/uav/flights/:id/incident   # Report incident
```

### Batteries

```http
GET    /api/v11/uav/batteries              # List batteries
GET    /api/v11/uav/batteries/:id          # Get battery details
POST   /api/v11/uav/batteries              # Register battery
PUT    /api/v11/uav/batteries/:id          # Update battery
PUT    /api/v11/uav/batteries/:id/status   # Update status
```

---

## Access Control

### UAV Pilot Role

Pilots authenticated via Cloudflare Access receive the `uav-pilot` role:

```javascript
// Permissions for uav-pilot role
permissions: ['read', 'flight-log']
```

### Authorization Matrix

| Action | Admin | Station Admin | UAV Pilot |
|--------|-------|---------------|-----------|
| Register pilots | ✅ | ✅ (own station) | ❌ |
| Create missions | ✅ | ✅ | ✅ (authorized stations) |
| Approve missions | ✅ | ✅ | ❌ |
| Log flights | ✅ | ✅ | ✅ (own flights) |
| View all flights | ✅ | ✅ (own station) | Own only |
| Manage batteries | ✅ | ✅ | ❌ |

---

## Workflow Example

### Pre-Flight

1. **Pilot Registration** (one-time)
   - Submit certification documents
   - Admin verifies and registers pilot
   - Pilot receives CF Access authorization

2. **Mission Planning**
   - Pilot creates mission with date, area, objectives
   - System generates mission code (e.g., `SVB_2026-01-24_001`)
   - Station admin reviews and approves

### Flight Day

3. **Mission Start**
   - Pilot marks mission as `in_progress`
   - Weather conditions recorded

4. **Flight Logging**
   - For each battery:
     - Record takeoff time
     - Fly mission
     - Record landing time
     - Log battery usage
     - Note images captured

5. **Mission Complete**
   - Pilot marks mission complete
   - Summary statistics calculated

### Post-Flight

6. **Data Review**
   - Quality score assigned
   - Coverage percentage calculated
   - Any incidents documented

---

## Reporting

### Pilot Reports

- Flight hours summary
- Certification expiry warnings
- Insurance expiry warnings

### Station Reports

- Missions by status
- Total flight hours
- Data collected
- Incident summary

### Fleet Reports

- Battery cycle counts
- Battery health trends
- Maintenance scheduling

---

## Testing

### Domain Entity Tests (v15.5.0+)

Comprehensive unit tests for all UAV domain entities:

| Test File | Tests | Coverage |
|-----------|-------|----------|
| `tests/unit/domain/uav/pilot.test.js` | 24 | Validation, certification, authorization |
| `tests/unit/domain/uav/mission.test.js` | 25 | Lifecycle, state transitions, approval |
| `tests/unit/domain/uav/flight-log.test.js` | 26 | Duration, battery, incidents |
| `tests/unit/domain/uav/battery.test.js` | 27 | Health, status, lifecycle |

Run tests:
```bash
npm run test:unit -- tests/unit/domain/uav/
```

---

## OpenAPI Specification

Full API documentation available in `docs/openapi/openapi.yaml`:

- **Tags**: UAV Pilots, UAV Missions, UAV Flights, UAV Batteries
- **Schemas**: Complete request/response schemas with validation
- **Endpoints**: 25+ UAV-related endpoints documented

View interactive docs at: `https://sitesspectral.work/api/docs`

---

## Related Documentation

- [[SUBDOMAIN_ARCHITECTURE]] - Overall architecture overview
- [[CLOUDFLARE_ACCESS_INTEGRATION]] - Pilot authentication
- [[MAGIC_LINK_SYSTEM]] - Alternative access method
- `docs/openapi/openapi.yaml` - Full OpenAPI 3.0 specification
