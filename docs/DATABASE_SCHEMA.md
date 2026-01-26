# SITES Spectral Database Schema

> **Version**: 15.6.0
> **Database**: Cloudflare D1 (SQLite)
> **Last Updated**: 2026-01-26

---

## Overview

The database uses SQLite via Cloudflare D1 with 46+ migrations applied. The schema follows Domain-Driven Design principles with clear aggregate boundaries.

---

## Entity Relationship Diagram

```
┌──────────────────┐
│     stations     │
│  (9 stations)    │
└────────┬─────────┘
         │ 1:N
         │
         ├──────────────────────────────────────────────────┐
         │                                                  │
         ▼                                                  ▼
┌──────────────────┐                              ┌──────────────────┐
│    platforms     │                              │    campaigns     │
└────────┬─────────┘                              └────────┬─────────┘
         │ 1:N                                             │ 1:N
         │                                                 │
         ▼                                                 ▼
┌──────────────────┐                              ┌──────────────────┐
│   instruments    │                              │    products      │
└────────┬─────────┘                              └──────────────────┘
         │ 1:N
         │
    ┌────┴────┬────────────┬────────────┐
    │         │            │            │
    ▼         ▼            ▼            ▼
┌────────┐ ┌────────┐ ┌──────────┐ ┌──────────────┐
│  rois  │ │  aois  │ │calibrat- │ │ maintenance  │
│        │ │        │ │  ions    │ │              │
└────────┘ └────────┘ └──────────┘ └──────────────┘


UAV Subdomain:

┌──────────────────┐
│     stations     │
└────────┬─────────┘
         │
    ┌────┴────┬─────────────┬─────────────┐
    │         │             │             │
    ▼         ▼             ▼             ▼
┌────────┐ ┌────────┐ ┌───────────┐ ┌───────────┐
│ pilots │ │missions│ │ batteries │ │  (via     │
│        │ │        │ │           │ │ platforms)│
└────┬───┘ └────┬───┘ └───────────┘ └───────────┘
     │          │
     │          ▼
     │    ┌───────────┐
     └───>│flight_logs│
          └───────────┘
```

---

## Core Tables

### stations

Primary table for SITES research stations.

```sql
CREATE TABLE stations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    acronym TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    normalized_name TEXT NOT NULL UNIQUE,
    description TEXT,
    latitude REAL,
    longitude REAL,
    elevation_m REAL,
    country TEXT DEFAULT 'Sweden',
    status TEXT DEFAULT 'Active',
    sites_member BOOLEAN DEFAULT true,
    icos_member BOOLEAN DEFAULT false,
    icos_class TEXT,
    station_type TEXT DEFAULT 'TER',
    timezone TEXT DEFAULT 'Europe/Stockholm',
    dwc_location_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

| Field | Type | Description |
|-------|------|-------------|
| `acronym` | TEXT | 2-5 letter unique code (e.g., SVB, ANS) |
| `status` | TEXT | `Active`, `Inactive`, `Maintenance` |
| `station_type` | TEXT | ICOS type: `TER`, `ATM`, `AQA`, `INT` |
| `sites_member` | BOOLEAN | SITES network membership |
| `icos_member` | BOOLEAN | ICOS network membership |

---

### platforms

Research platforms (towers, UAVs, satellites, etc.).

```sql
CREATE TABLE platforms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_id INTEGER NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
    normalized_name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    platform_type TEXT NOT NULL DEFAULT 'fixed',
    ecosystem_code TEXT,
    mount_type_code TEXT,
    sequence_number INTEGER DEFAULT 1,
    status TEXT DEFAULT 'Active',
    latitude REAL,
    longitude REAL,
    elevation_m REAL,
    height_m REAL,
    uav_vendor TEXT,
    uav_model TEXT,
    serial_number TEXT,
    satellite_agency TEXT,
    satellite_name TEXT,
    satellite_sensor TEXT,
    managing_institution TEXT,
    managing_department TEXT,
    thematic_program TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

| Field | Type | Description |
|-------|------|-------------|
| `platform_type` | TEXT | `fixed`, `uav`, `satellite`, `mobile`, `usv`, `uuv` |
| `ecosystem_code` | TEXT | `FOR`, `AGR`, `MIR`, `LAK`, `GRA`, `HEA`, `ALP`, etc. |
| `mount_type_code` | TEXT | `TWR`, `BLD`, `GND`, `UAV`, `SAT`, `MOB` |
| `normalized_name` | TEXT | Auto-generated: `{STATION}_{ECO}_{MOUNT}{SEQ}` |

**Mount Type Codes (v12.0.0+):**

| Code | Name | Description |
|------|------|-------------|
| `TWR` | Tower/Mast | Elevated structures (>1.5m) |
| `BLD` | Building | Rooftop or facade mounted |
| `GND` | Ground Level | Below 1.5m height |
| `UAV` | UAV Position | Drone flight position |
| `SAT` | Satellite | Satellite virtual position |
| `MOB` | Mobile | Portable platform |

---

### instruments

Measurement instruments attached to platforms.

```sql
CREATE TABLE instruments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    platform_id INTEGER NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
    normalized_name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    instrument_type TEXT NOT NULL,
    sequence_number INTEGER DEFAULT 1,
    status TEXT DEFAULT 'Active',
    measurement_status TEXT DEFAULT 'collecting',

    -- Position
    latitude REAL,
    longitude REAL,
    height_m REAL,
    viewing_direction TEXT,
    azimuth_deg REAL,
    nadir_angle_deg REAL,

    -- Timeline
    deployment_date DATE,
    decommission_date DATE,
    last_calibration_date DATE,

    -- System
    power_source TEXT,
    data_transmission TEXT,

    -- Type-specific (stored as JSON or individual fields)
    camera_brand TEXT,
    camera_model TEXT,
    resolution TEXT,
    capture_interval_minutes INTEGER,
    number_of_channels INTEGER,
    spectral_range_start_nm REAL,
    spectral_range_end_nm REAL,

    description TEXT,
    installation_notes TEXT,
    maintenance_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

| Field | Type | Description |
|-------|------|-------------|
| `instrument_type` | TEXT | `Phenocam`, `Multispectral`, `PAR`, `NDVI`, `PRI`, `Hyperspectral`, etc. |
| `status` | TEXT | `Active`, `Inactive`, `Maintenance`, `Decommissioned` |
| `measurement_status` | TEXT | `collecting`, `paused`, `calibrating`, `error` |

---

### instrument_rois

Regions of Interest for phenocam instruments.

```sql
CREATE TABLE instrument_rois (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    instrument_id INTEGER NOT NULL REFERENCES instruments(id) ON DELETE CASCADE,
    roi_name TEXT NOT NULL,
    description TEXT,
    polygon_points TEXT NOT NULL,  -- JSON array
    color TEXT DEFAULT '#00FF00',
    is_active BOOLEAN DEFAULT true,
    is_legacy BOOLEAN DEFAULT false,
    legacy_date DATETIME,
    replaced_by_roi_id INTEGER REFERENCES instrument_rois(id),
    timeseries_broken BOOLEAN DEFAULT false,
    legacy_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Legacy ROI Fields (v10.0.0+):**

| Field | Description |
|-------|-------------|
| `is_legacy` | Marked as historical |
| `legacy_date` | When marked as legacy |
| `replaced_by_roi_id` | Reference to new ROI |
| `timeseries_broken` | Admin override flag |

---

### aois

Areas of Interest (geospatial boundaries).

```sql
CREATE TABLE aois (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_id INTEGER NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    geometry_type TEXT DEFAULT 'Polygon',
    coordinates TEXT NOT NULL,  -- GeoJSON coordinates
    area_hectares REAL,
    centroid_lat REAL,
    centroid_lon REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

### campaigns

Research campaigns organizing data collection.

```sql
CREATE TABLE campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_id INTEGER NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    status TEXT DEFAULT 'planned',
    objectives TEXT,  -- JSON array
    created_by INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

| Status | Description |
|--------|-------------|
| `planned` | Scheduled but not started |
| `active` | Currently running |
| `completed` | Successfully finished |
| `cancelled` | Cancelled before completion |

---

### products

Data products from instruments/campaigns.

```sql
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    instrument_id INTEGER REFERENCES instruments(id),
    campaign_id INTEGER REFERENCES campaigns(id),
    name TEXT NOT NULL,
    doi TEXT UNIQUE,
    processing_level TEXT NOT NULL,
    quality_control_level TEXT DEFAULT 'raw',
    quality_score INTEGER,
    quality_notes TEXT,
    file_format TEXT,
    file_size_mb REAL,
    coverage_start DATE,
    coverage_end DATE,
    license TEXT DEFAULT 'CC-BY-4.0',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Processing Levels:**

| Level | Description |
|-------|-------------|
| `L0` | Raw data |
| `L1` | Georeferenced/registered |
| `L2` | Atmospherically corrected |
| `L3` | Composites/aggregated |
| `L4` | Derived products |

---

### maintenance

Maintenance records for platforms/instruments.

```sql
CREATE TABLE maintenance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL,  -- 'platform' or 'instrument'
    entity_id INTEGER NOT NULL,
    maintenance_type TEXT NOT NULL,
    scheduled_date DATE,
    completed_date DATE,
    status TEXT DEFAULT 'scheduled',
    description TEXT,
    performed_by TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

### calibrations

Calibration records for instruments.

```sql
CREATE TABLE calibrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    instrument_id INTEGER NOT NULL REFERENCES instruments(id) ON DELETE CASCADE,
    calibration_date DATE NOT NULL,
    expiry_date DATE,
    calibration_type TEXT,
    panel_serial_number TEXT,
    panel_condition TEXT,
    cloud_cover TEXT,
    solar_elevation_deg REAL,
    ambient_temperature_c REAL,
    quality_score INTEGER,
    certificate_number TEXT,
    performed_by TEXT,
    notes TEXT,
    is_current BOOLEAN DEFAULT true,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## UAV Tables

### uav_pilots

UAV pilot registry.

```sql
CREATE TABLE uav_pilots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    organization TEXT,
    certificate_type TEXT,
    certificate_number TEXT,
    certificate_expiry DATE,
    insurance_policy TEXT,
    insurance_expiry DATE,
    authorized_stations TEXT,  -- JSON array of station IDs
    flight_hours_total REAL DEFAULT 0,
    flight_hours_sites_spectral REAL DEFAULT 0,
    last_flight_date DATE,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Certificate Types (Swedish Transport Agency):**

| Type | Description |
|------|-------------|
| `A1/A3` | Open category basic |
| `A2` | Open category close |
| `STS-01` | Specific category VLOS |
| `STS-02` | Specific category BVLOS |
| `national` | National authorization |

---

### uav_missions

Mission planning and execution.

```sql
CREATE TABLE uav_missions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_id INTEGER NOT NULL REFERENCES stations(id),
    mission_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'draft',
    planned_date DATE,
    actual_start_time DATETIME,
    actual_end_time DATETIME,
    flight_pattern TEXT,
    target_altitude_m REAL,
    target_overlap_percent INTEGER,
    aoi_id INTEGER REFERENCES aois(id),
    weather_conditions TEXT,  -- JSON
    objectives TEXT,  -- JSON array
    quality_score INTEGER,
    coverage_percent REAL,
    approved_by INTEGER REFERENCES users(id),
    approved_at DATETIME,
    created_by INTEGER REFERENCES users(id),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Mission Status:**

| Status | Description |
|--------|-------------|
| `draft` | Initial creation |
| `planned` | Details complete |
| `approved` | Admin approved |
| `in_progress` | Currently executing |
| `completed` | Successfully finished |
| `aborted` | Stopped during execution |
| `cancelled` | Cancelled before start |

---

### uav_mission_pilots

Junction table for mission-pilot assignments.

```sql
CREATE TABLE uav_mission_pilots (
    mission_id INTEGER NOT NULL REFERENCES uav_missions(id) ON DELETE CASCADE,
    pilot_id INTEGER NOT NULL REFERENCES uav_pilots(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'pilot',  -- 'pilot', 'observer', 'backup'
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (mission_id, pilot_id)
);
```

---

### uav_flight_logs

Individual flight records within missions.

```sql
CREATE TABLE uav_flight_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mission_id INTEGER NOT NULL REFERENCES uav_missions(id),
    pilot_id INTEGER NOT NULL REFERENCES uav_pilots(id),
    platform_id INTEGER NOT NULL REFERENCES platforms(id),
    flight_number INTEGER DEFAULT 1,
    takeoff_time DATETIME NOT NULL,
    landing_time DATETIME NOT NULL,
    flight_duration_seconds INTEGER,
    takeoff_latitude REAL,
    takeoff_longitude REAL,
    takeoff_altitude_m REAL,
    max_altitude_agl_m REAL,
    max_distance_m REAL,
    total_distance_m REAL,
    average_speed_ms REAL,
    battery_id INTEGER REFERENCES uav_batteries(id),
    battery_start_percent INTEGER,
    battery_end_percent INTEGER,
    images_captured INTEGER DEFAULT 0,
    data_size_mb REAL DEFAULT 0,
    had_incident INTEGER DEFAULT 0,
    incident_description TEXT,
    incident_severity TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

### uav_batteries

Battery inventory and lifecycle tracking.

```sql
CREATE TABLE uav_batteries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_id INTEGER NOT NULL REFERENCES stations(id),
    serial_number TEXT NOT NULL UNIQUE,
    manufacturer TEXT,
    model TEXT,
    capacity_mah INTEGER,
    cell_count INTEGER,
    chemistry TEXT DEFAULT 'LiPo',
    purchase_date DATE,
    status TEXT DEFAULT 'available',
    health_percent INTEGER DEFAULT 100,
    internal_resistance_mohm INTEGER,
    cycle_count INTEGER DEFAULT 0,
    last_health_check DATE,
    retirement_date DATE,
    retirement_reason TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Battery Status:**

| Status | Description |
|--------|-------------|
| `available` | Ready for use |
| `in_use` | Currently in aircraft |
| `charging` | Being charged |
| `storage` | Storage mode |
| `maintenance` | Under inspection |
| `retired` | End of life |
| `damaged` | Do not use |

---

## User Management Tables

### users

User accounts.

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    email TEXT UNIQUE,
    role TEXT NOT NULL DEFAULT 'readonly',
    station_id INTEGER REFERENCES stations(id),
    full_name TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Roles:**

| Role | Description |
|------|-------------|
| `admin` | Full system access |
| `sites-admin` | Full system access |
| `station-admin` | Admin for assigned station |
| `station` | Read-only for assigned station |
| `uav-pilot` | UAV pilot access |
| `station-internal` | Internal via magic link |
| `readonly` | Read-only access |

---

### user_sessions

Active sessions.

```sql
CREATE TABLE user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

### activity_log

Audit trail.

```sql
CREATE TABLE activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id INTEGER,
    details TEXT,  -- JSON
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

### magic_links

Time-limited authentication tokens.

```sql
CREATE TABLE magic_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    station_id INTEGER REFERENCES stations(id),
    role TEXT DEFAULT 'station-internal',
    expires_at DATETIME NOT NULL,
    used_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## Indexes

Key indexes for query performance:

```sql
-- Stations
CREATE INDEX idx_stations_acronym ON stations(acronym);
CREATE INDEX idx_stations_status ON stations(status);

-- Platforms
CREATE INDEX idx_platforms_station_id ON platforms(station_id);
CREATE INDEX idx_platforms_type ON platforms(platform_type);
CREATE INDEX idx_platforms_normalized_name ON platforms(normalized_name);

-- Instruments
CREATE INDEX idx_instruments_platform_id ON instruments(platform_id);
CREATE INDEX idx_instruments_type ON instruments(instrument_type);
CREATE INDEX idx_instruments_normalized_name ON instruments(normalized_name);

-- ROIs
CREATE INDEX idx_instrument_rois_instrument_id ON instrument_rois(instrument_id);
CREATE INDEX idx_instrument_rois_is_legacy ON instrument_rois(is_legacy);

-- UAV
CREATE INDEX idx_uav_missions_station_id ON uav_missions(station_id);
CREATE INDEX idx_uav_missions_status ON uav_missions(status);
CREATE INDEX idx_uav_flight_logs_mission_id ON uav_flight_logs(mission_id);
CREATE INDEX idx_uav_flight_logs_pilot_id ON uav_flight_logs(pilot_id);
CREATE INDEX idx_uav_batteries_station_id ON uav_batteries(station_id);
CREATE INDEX idx_uav_pilots_email ON uav_pilots(email);
```

---

## Triggers

Auto-calculation triggers:

```sql
-- Auto-calculate flight duration
CREATE TRIGGER calculate_flight_duration
AFTER INSERT ON uav_flight_logs
BEGIN
    UPDATE uav_flight_logs
    SET flight_duration_seconds =
        (julianday(landing_time) - julianday(takeoff_time)) * 86400
    WHERE id = NEW.id;
END;

-- Auto-update pilot flight hours
CREATE TRIGGER update_pilot_hours
AFTER INSERT ON uav_flight_logs
BEGIN
    UPDATE uav_pilots
    SET flight_hours_sites_spectral = (
        SELECT COALESCE(SUM(flight_duration_seconds) / 3600.0, 0)
        FROM uav_flight_logs
        WHERE pilot_id = NEW.pilot_id
    ),
    last_flight_date = NEW.landing_time
    WHERE id = NEW.pilot_id;
END;

-- Auto-update battery cycle count
CREATE TRIGGER update_battery_cycles
AFTER INSERT ON uav_flight_logs
WHEN NEW.battery_id IS NOT NULL
BEGIN
    UPDATE uav_batteries
    SET cycle_count = cycle_count + 1
    WHERE id = NEW.battery_id;
END;
```

---

## Migration History

Migrations are stored in `migrations/` directory:

| Migration | Version | Description |
|-----------|---------|-------------|
| 0001-0010 | v1-v5 | Initial schema |
| 0011-0020 | v6-v8 | Platform types, UAV |
| 0021-0030 | v9-v10 | ROI system, AOI |
| 0031-0040 | v11-v12 | Authorization, campaigns |
| 0041-0046 | v13-v15 | Mount type normalization, UAV subdomain |

Run migrations:

```bash
# Local
npm run db:migrate:local

# Production
npm run db:migrate
```

---

## Related Documentation

- [[SYSTEM_ARCHITECTURE]] - Overall system architecture
- [[API_REFERENCE]] - API endpoint documentation
- [[DEPLOYMENT_GUIDE]] - Deployment procedures
