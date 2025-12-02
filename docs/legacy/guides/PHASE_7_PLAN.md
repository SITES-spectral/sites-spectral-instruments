# SITES Spectral v8.0.0 - Phase 7 Development Plan

**Version:** 8.0.0 (targeting v8.0.0 stable release)
**Author:** Forge (SITES Spectral Ecosystem Orchestrator)
**Created:** 2025-11-28
**Status:** Planning Phase

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Analysis](#2-current-state-analysis)
3. [Production Hardening](#3-production-hardening)
4. [Maintenance History System](#4-maintenance-history-system)
5. [Calibration Log System](#5-calibration-log-system)
6. [UX Dashboard Redesign](#6-ux-dashboard-redesign)
7. [Database Migration](#7-database-migration)
8. [API Specification](#8-api-specification)
9. [Implementation Phases](#9-implementation-phases)
10. [Testing Strategy](#10-testing-strategy)
11. [Risk Assessment](#11-risk-assessment)

---

## 1. Executive Summary

Phase 7 introduces three major pillars of functionality to SITES Spectral v8.0.0:

| Pillar | Description | Priority |
|--------|-------------|----------|
| **Production Hardening** | Caching, rate limiting, performance monitoring | Critical |
| **Maintenance & Calibration** | Instrument lifecycle tracking systems | High |
| **UX Dashboard Redesign** | Reactive card-based UI with improved hierarchy | Medium |

### Key Deliverables

1. **Database Migration 0030**: New tables for maintenance_history and calibration_logs
2. **API v4 Endpoints**: Maintenance and calibration CRUD operations
3. **Cloudflare KV Caching**: Station and platform data caching layer
4. **Rate Limiting Middleware**: Protection against API abuse
5. **Reactive Dashboard**: Card-based UI with drill-down navigation
6. **Performance Monitoring**: Request timing and error tracking

### Estimated Effort

| Component | Complexity | Estimated Hours |
|-----------|------------|-----------------|
| Database Migration | Low | 4-6 |
| Maintenance API | Medium | 16-20 |
| Calibration API | Medium | 16-20 |
| Caching Layer | Medium | 12-16 |
| Rate Limiting | Low | 4-6 |
| Dashboard UI | High | 32-40 |
| Testing Suite | Medium | 16-20 |
| **Total** | - | **100-128** |

---

## 2. Current State Analysis

### 2.1 Version Status

- **Current Version:** 8.0.0-rc.3
- **Test Coverage:** 100/100 tests passing
- **Production URL:** https://sites.jobelab.com
- **API Versions:** v1 (legacy), v2 (pagination), v3 (spatial queries)

### 2.2 Existing Database Schema

```
Tables (v8 schema):
- stations (10 records)
- platforms (30+ records)
- instruments (50+ records)
- instrument_rois (200+ records)
- platform_types (4 types: fixed, uav, satellite, mobile)
- areas_of_interest (AOI for UAV/satellite)
- uav_platforms (UAV extension)
- satellite_platforms (satellite extension)
- acquisition_campaigns (mission tracking)
- products (derived products)
- users, user_sessions, activity_log
```

### 2.3 Technology Stack

| Component | Technology |
|-----------|------------|
| Runtime | Cloudflare Workers |
| Database | Cloudflare D1 (SQLite) |
| Authentication | JWT with session management |
| Frontend | Vanilla JS with modular architecture |
| Maps | Leaflet with Lantmateriet tiles |
| Testing | Vitest with Workers pool |

### 2.4 Current Pain Points

1. **No caching** - Every API call hits the database
2. **No rate limiting** - Vulnerable to abuse
3. **Limited maintenance tracking** - Notes field only
4. **No calibration history** - Single date field
5. **Dashboard complexity** - Many nested components

---

## 3. Production Hardening

### 3.1 Caching Strategy

#### 3.1.1 Cloudflare KV Caching

Use Cloudflare Workers KV for caching frequently accessed, rarely changed data.

**Cache Targets:**

| Data | TTL | Key Pattern |
|------|-----|-------------|
| Station list | 5 minutes | `cache:stations:list` |
| Station details | 5 minutes | `cache:stations:{acronym}` |
| Platform list by station | 2 minutes | `cache:platforms:{stationId}` |
| Platform types | 1 hour | `cache:platform-types` |
| Ecosystem codes | 1 hour | `cache:ecosystems` |
| Status codes | 1 hour | `cache:status-codes` |

**Cache Invalidation:**

```javascript
// Invalidation on write operations
async function invalidateCache(env, patterns) {
    for (const pattern of patterns) {
        await env.CACHE.delete(pattern);
    }
}

// Example: After station update
await invalidateCache(env, [
    'cache:stations:list',
    `cache:stations:${acronym}`,
    `cache:platforms:${stationId}`
]);
```

**KV Binding Configuration:**

```toml
# wrangler.toml addition
[[kv_namespaces]]
binding = "CACHE"
id = "xxxx"
preview_id = "yyyy"
```

#### 3.1.2 Response Headers

Add cache control headers for browser caching:

```javascript
// Static reference data (ecosystems, status codes)
headers['Cache-Control'] = 'public, max-age=3600';

// Dynamic data (stations, platforms)
headers['Cache-Control'] = 'public, max-age=60, stale-while-revalidate=300';

// User-specific data (no caching)
headers['Cache-Control'] = 'private, no-cache';
```

### 3.2 Rate Limiting

#### 3.2.1 Rate Limit Configuration

```javascript
const RATE_LIMITS = {
    // Anonymous users
    anonymous: {
        requests: 100,
        window: 60, // seconds
        burst: 20
    },
    // Authenticated users
    authenticated: {
        requests: 1000,
        window: 60,
        burst: 100
    },
    // Admin users
    admin: {
        requests: 5000,
        window: 60,
        burst: 500
    }
};
```

#### 3.2.2 Implementation Using Durable Objects

```javascript
// src/rate-limiter/RateLimiter.js
export class RateLimiter {
    constructor(state, env) {
        this.state = state;
        this.env = env;
    }

    async fetch(request) {
        const { clientId, limit } = await request.json();

        // Get current window
        const now = Date.now();
        const windowStart = Math.floor(now / (limit.window * 1000)) * (limit.window * 1000);

        // Get or create counter
        let counter = await this.state.storage.get(`count:${windowStart}`) || 0;

        if (counter >= limit.requests) {
            return new Response(JSON.stringify({
                allowed: false,
                remaining: 0,
                resetAt: windowStart + (limit.window * 1000)
            }));
        }

        counter++;
        await this.state.storage.put(`count:${windowStart}`, counter);

        // Clean old windows
        const keys = await this.state.storage.list();
        for (const key of keys.keys()) {
            if (key.startsWith('count:') && parseInt(key.split(':')[1]) < windowStart) {
                await this.state.storage.delete(key);
            }
        }

        return new Response(JSON.stringify({
            allowed: true,
            remaining: limit.requests - counter,
            resetAt: windowStart + (limit.window * 1000)
        }));
    }
}
```

#### 3.2.3 Rate Limit Middleware

```javascript
// src/middleware/rate-limit.js
export async function checkRateLimit(request, env, user) {
    const clientId = user?.id || request.headers.get('CF-Connecting-IP');
    const limits = user?.role === 'admin' ? RATE_LIMITS.admin :
                   user ? RATE_LIMITS.authenticated : RATE_LIMITS.anonymous;

    const limiter = env.RATE_LIMITER.get(
        env.RATE_LIMITER.idFromName(clientId)
    );

    const response = await limiter.fetch(new Request('http://internal', {
        method: 'POST',
        body: JSON.stringify({ clientId, limit: limits })
    }));

    const result = await response.json();

    if (!result.allowed) {
        return {
            limited: true,
            response: new Response(JSON.stringify({
                error: 'Rate limit exceeded',
                retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000)
            }), {
                status: 429,
                headers: {
                    'Content-Type': 'application/json',
                    'Retry-After': Math.ceil((result.resetAt - Date.now()) / 1000).toString(),
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': result.resetAt.toString()
                }
            })
        };
    }

    return {
        limited: false,
        headers: {
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetAt.toString()
        }
    };
}
```

### 3.3 Performance Monitoring

#### 3.3.1 Request Timing

```javascript
// src/middleware/timing.js
export function createTimingMiddleware() {
    return {
        start(request) {
            return {
                startTime: Date.now(),
                path: new URL(request.url).pathname,
                method: request.method
            };
        },

        end(context, response) {
            const duration = Date.now() - context.startTime;

            // Add timing header
            response.headers.set('X-Response-Time', `${duration}ms`);

            // Log slow requests
            if (duration > 1000) {
                console.warn(`Slow request: ${context.method} ${context.path} took ${duration}ms`);
            }

            return response;
        }
    };
}
```

#### 3.3.2 Error Tracking

```javascript
// src/utils/error-tracking.js
export async function trackError(env, error, context) {
    const errorData = {
        timestamp: new Date().toISOString(),
        message: error.message,
        stack: error.stack,
        path: context.path,
        method: context.method,
        user: context.user?.username || 'anonymous'
    };

    // Store in D1 for later analysis
    await env.DB.prepare(`
        INSERT INTO error_log (timestamp, message, stack, path, method, username)
        VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
        errorData.timestamp,
        errorData.message,
        errorData.stack,
        errorData.path,
        errorData.method,
        errorData.user
    ).run();
}
```

---

## 4. Maintenance History System

### 4.1 Database Schema

```sql
-- Table: maintenance_history
-- Tracks all maintenance activities for instruments

CREATE TABLE IF NOT EXISTS maintenance_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    instrument_id INTEGER NOT NULL,

    -- Maintenance Details
    maintenance_date TEXT NOT NULL,           -- ISO 8601 datetime
    maintenance_type TEXT NOT NULL,           -- 'routine', 'repair', 'upgrade', 'cleaning', 'calibration', 'inspection'
    description TEXT NOT NULL,                -- Detailed work description

    -- Categorization
    tags TEXT,                                -- JSON array: ["cleaning", "calibration", "repair"]
    status TEXT DEFAULT 'completed',          -- 'scheduled', 'in_progress', 'completed', 'cancelled', 'deferred'
    priority TEXT DEFAULT 'normal',           -- 'low', 'normal', 'high', 'critical'

    -- Problem Tracking
    recurrent_problem INTEGER DEFAULT 0,      -- 1 = recurring issue
    problem_category TEXT,                    -- 'hardware', 'software', 'environmental', 'connectivity', 'power'
    problem_severity TEXT,                    -- 'minor', 'moderate', 'major', 'critical'
    root_cause TEXT,                          -- Root cause analysis

    -- Work Details
    technician TEXT,                          -- Name of technician
    technician_id INTEGER,                    -- FK to users (optional)
    duration_minutes INTEGER,                 -- How long maintenance took

    -- Parts and Materials
    parts_replaced TEXT,                      -- JSON array: [{"name": "lens", "serial": "ABC123", "cost": 150.00}]
    materials_used TEXT,                      -- JSON array: [{"name": "cleaning solution", "quantity": 1}]
    total_cost REAL,                          -- Total maintenance cost

    -- Scheduling
    scheduled_date TEXT,                      -- Original scheduled date
    completed_date TEXT,                      -- Actual completion date
    next_maintenance_date TEXT,               -- Recommended next maintenance

    -- Documentation
    notes TEXT,                               -- Additional notes
    photos_json TEXT,                         -- JSON array of photo references
    documents_json TEXT,                      -- JSON array of document references

    -- Audit
    created_by INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (instrument_id) REFERENCES instruments(id) ON DELETE CASCADE,
    FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_mh_instrument ON maintenance_history(instrument_id);
CREATE INDEX IF NOT EXISTS idx_mh_date ON maintenance_history(maintenance_date);
CREATE INDEX IF NOT EXISTS idx_mh_status ON maintenance_history(status);
CREATE INDEX IF NOT EXISTS idx_mh_type ON maintenance_history(maintenance_type);
CREATE INDEX IF NOT EXISTS idx_mh_recurrent ON maintenance_history(recurrent_problem);
CREATE INDEX IF NOT EXISTS idx_mh_technician ON maintenance_history(technician_id);
```

### 4.2 Maintenance Types Taxonomy

```yaml
maintenance_types:
  routine:
    label: "Routine Maintenance"
    icon: "fa-calendar-check"
    color: "#059669"
    description: "Scheduled preventive maintenance"

  cleaning:
    label: "Cleaning"
    icon: "fa-broom"
    color: "#0891b2"
    description: "Lens, sensor, or equipment cleaning"

  calibration:
    label: "Calibration"
    icon: "fa-sliders"
    color: "#7c3aed"
    description: "Sensor or instrument calibration"

  repair:
    label: "Repair"
    icon: "fa-wrench"
    color: "#dc2626"
    description: "Fix broken or malfunctioning equipment"

  upgrade:
    label: "Upgrade"
    icon: "fa-arrow-up"
    color: "#2563eb"
    description: "Hardware or firmware upgrade"

  inspection:
    label: "Inspection"
    icon: "fa-search"
    color: "#f59e0b"
    description: "Visual or functional inspection"

problem_categories:
  hardware:
    label: "Hardware Issue"
    examples: ["broken lens", "damaged housing", "loose connector"]

  software:
    label: "Software/Firmware"
    examples: ["firmware bug", "configuration error", "memory full"]

  environmental:
    label: "Environmental"
    examples: ["condensation", "frost damage", "wildlife interference"]

  connectivity:
    label: "Connectivity"
    examples: ["network failure", "data transmission error", "antenna damage"]

  power:
    label: "Power System"
    examples: ["battery failure", "solar panel issue", "voltage fluctuation"]
```

### 4.3 Maintenance History Views

```sql
-- View: Upcoming maintenance
CREATE VIEW IF NOT EXISTS v_upcoming_maintenance AS
SELECT
    mh.*,
    i.display_name as instrument_name,
    i.normalized_name as instrument_normalized_name,
    i.instrument_type,
    p.display_name as platform_name,
    s.acronym as station_acronym,
    s.display_name as station_name
FROM maintenance_history mh
JOIN instruments i ON mh.instrument_id = i.id
JOIN platforms p ON i.platform_id = p.id
JOIN stations s ON p.station_id = s.id
WHERE mh.status = 'scheduled'
    AND mh.scheduled_date >= date('now')
ORDER BY mh.scheduled_date ASC;

-- View: Recurrent problems by instrument
CREATE VIEW IF NOT EXISTS v_recurrent_problems AS
SELECT
    i.id as instrument_id,
    i.display_name as instrument_name,
    i.normalized_name,
    s.acronym as station_acronym,
    mh.problem_category,
    COUNT(*) as occurrence_count,
    MAX(mh.maintenance_date) as last_occurrence,
    GROUP_CONCAT(DISTINCT mh.root_cause) as root_causes
FROM maintenance_history mh
JOIN instruments i ON mh.instrument_id = i.id
JOIN platforms p ON i.platform_id = p.id
JOIN stations s ON p.station_id = s.id
WHERE mh.recurrent_problem = 1
GROUP BY i.id, mh.problem_category
HAVING COUNT(*) >= 2
ORDER BY occurrence_count DESC;

-- View: Maintenance statistics by station
CREATE VIEW IF NOT EXISTS v_maintenance_stats AS
SELECT
    s.id as station_id,
    s.acronym,
    s.display_name as station_name,
    COUNT(mh.id) as total_maintenance_records,
    SUM(CASE WHEN mh.status = 'completed' THEN 1 ELSE 0 END) as completed_count,
    SUM(CASE WHEN mh.status = 'scheduled' THEN 1 ELSE 0 END) as scheduled_count,
    SUM(CASE WHEN mh.recurrent_problem = 1 THEN 1 ELSE 0 END) as recurrent_issues,
    AVG(mh.duration_minutes) as avg_duration_minutes,
    SUM(mh.total_cost) as total_cost
FROM stations s
LEFT JOIN platforms p ON p.station_id = s.id
LEFT JOIN instruments i ON i.platform_id = p.id
LEFT JOIN maintenance_history mh ON mh.instrument_id = i.id
GROUP BY s.id
ORDER BY s.acronym;
```

---

## 5. Calibration Log System

### 5.1 Database Schema

```sql
-- Table: calibration_logs
-- Specialized calibration records for multispectral sensors

CREATE TABLE IF NOT EXISTS calibration_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    instrument_id INTEGER NOT NULL,

    -- Calibration Identification
    calibration_date TEXT NOT NULL,           -- ISO 8601 datetime
    calibration_type TEXT NOT NULL,           -- 'dirty', 'clean', 'full', 'dark_current', 'flat_field', 'wavelength'
    calibration_method TEXT,                  -- 'reflectance_panel', 'integrating_sphere', 'cross_calibration'

    -- Duration and Scheduling
    duration_minutes INTEGER,                 -- How long calibration took
    frequency TEXT,                           -- 'daily', 'weekly', 'monthly', 'seasonal', 'annual'
    next_calibration_date TEXT,               -- Recommended next calibration

    -- Reflectance Panel Details
    reflectance_panel_used TEXT,              -- 'Spectralon 99%', 'Gray 18%', 'White Reference'
    panel_serial_number TEXT,                 -- Serial number of the panel
    panel_calibration_date TEXT,              -- When panel was last calibrated
    panel_condition TEXT,                     -- 'excellent', 'good', 'fair', 'poor'

    -- Personnel
    technician TEXT,                          -- Name of technician
    technician_id INTEGER,                    -- FK to users (optional)

    -- Ambient Conditions (JSON for flexibility)
    ambient_conditions TEXT,                  -- JSON: {"temperature_c": 20, "humidity_pct": 45, "cloud_cover": "clear", "wind_speed_ms": 2}

    -- Pre-Calibration State
    physical_aspect_before TEXT,              -- Description of sensor condition before
    sensor_cleanliness_before TEXT,           -- 'clean', 'dusty', 'dirty', 'contaminated'

    -- Cleaning Details (if applicable)
    cleaning_performed INTEGER DEFAULT 0,     -- 1 = cleaning was done
    cleaning_method TEXT,                     -- 'dry_wipe', 'wet_clean', 'compressed_air', 'ultrasonic'
    cleaning_solution TEXT,                   -- Solution used if wet cleaning

    -- Post-Calibration State
    physical_aspect_after TEXT,               -- Description after cleaning/calibration
    sensor_cleanliness_after TEXT,            -- 'clean', 'dusty', 'dirty', 'contaminated'

    -- Measurements (JSON for flexibility by channel)
    measurements_json TEXT,                   -- JSON: {"channels": [{"id": 1, "wavelength_nm": 450, "before": 0.85, "after": 0.95, "offset": 0.02}]}

    -- Calibration Coefficients
    coefficients_json TEXT,                   -- JSON: {"gain": [1.02, 0.99, 1.01], "offset": [0.01, -0.02, 0.00]}

    -- Quality Assessment
    quality_passed INTEGER DEFAULT 1,         -- 1 = passed quality check
    quality_score REAL,                       -- 0-100 quality metric
    quality_notes TEXT,                       -- Notes on quality assessment
    deviation_from_reference REAL,            -- Percentage deviation from expected

    -- Additional Measurements
    dark_current_values TEXT,                 -- JSON array of dark current readings
    integration_time_ms INTEGER,              -- Integration time used

    -- Documentation
    notes TEXT,                               -- Additional notes
    photos_json TEXT,                         -- JSON array of photo references
    raw_data_path TEXT,                       -- Path to raw calibration data files

    -- Audit
    created_by INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (instrument_id) REFERENCES instruments(id) ON DELETE CASCADE,
    FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_cl_instrument ON calibration_logs(instrument_id);
CREATE INDEX IF NOT EXISTS idx_cl_date ON calibration_logs(calibration_date);
CREATE INDEX IF NOT EXISTS idx_cl_type ON calibration_logs(calibration_type);
CREATE INDEX IF NOT EXISTS idx_cl_quality ON calibration_logs(quality_passed);
CREATE INDEX IF NOT EXISTS idx_cl_next_date ON calibration_logs(next_calibration_date);
```

### 5.2 Calibration Types

```yaml
calibration_types:
  dirty:
    label: "Dirty Calibration"
    icon: "fa-cloud"
    color: "#f59e0b"
    description: "Calibration before cleaning to capture sensor drift"
    requires_cleaning: false

  clean:
    label: "Clean Calibration"
    icon: "fa-sparkles"
    color: "#059669"
    description: "Calibration after thorough cleaning"
    requires_cleaning: true

  full:
    label: "Full Calibration"
    icon: "fa-certificate"
    color: "#2563eb"
    description: "Complete calibration with all reference targets"
    requires_cleaning: true

  dark_current:
    label: "Dark Current"
    icon: "fa-moon"
    color: "#6366f1"
    description: "Sensor dark current measurement"
    requires_cleaning: false

  flat_field:
    label: "Flat Field"
    icon: "fa-square"
    color: "#8b5cf6"
    description: "Flat field correction measurement"
    requires_cleaning: true

  wavelength:
    label: "Wavelength Calibration"
    icon: "fa-wave-square"
    color: "#ec4899"
    description: "Spectral wavelength verification"
    requires_cleaning: false

calibration_frequencies:
  daily:
    interval_days: 1
    recommended_for: ["research_grade", "high_precision"]

  weekly:
    interval_days: 7
    recommended_for: ["operational", "monitoring"]

  monthly:
    interval_days: 30
    recommended_for: ["standard", "reference"]

  seasonal:
    interval_days: 90
    recommended_for: ["fixed_installation"]

  annual:
    interval_days: 365
    recommended_for: ["stable_environment"]
```

### 5.3 Calibration Log Views

```sql
-- View: Latest calibration per instrument
CREATE VIEW IF NOT EXISTS v_latest_calibration AS
SELECT
    cl.*,
    i.display_name as instrument_name,
    i.normalized_name as instrument_normalized_name,
    i.instrument_type,
    p.display_name as platform_name,
    s.acronym as station_acronym
FROM calibration_logs cl
JOIN instruments i ON cl.instrument_id = i.id
JOIN platforms p ON i.platform_id = p.id
JOIN stations s ON p.station_id = s.id
WHERE cl.id = (
    SELECT MAX(id) FROM calibration_logs cl2
    WHERE cl2.instrument_id = cl.instrument_id
);

-- View: Instruments needing calibration
CREATE VIEW IF NOT EXISTS v_calibration_due AS
SELECT
    i.id as instrument_id,
    i.display_name as instrument_name,
    i.normalized_name,
    i.instrument_type,
    s.acronym as station_acronym,
    cl.calibration_date as last_calibration,
    cl.next_calibration_date,
    cl.calibration_type as last_calibration_type,
    JULIANDAY('now') - JULIANDAY(cl.next_calibration_date) as days_overdue
FROM instruments i
JOIN platforms p ON i.platform_id = p.id
JOIN stations s ON p.station_id = s.id
LEFT JOIN v_latest_calibration cl ON cl.instrument_id = i.id
WHERE i.instrument_type LIKE '%multispectral%'
    OR i.instrument_type LIKE '%spectral%'
    OR i.instrument_type LIKE '%NDVI%'
    OR i.instrument_type LIKE '%PRI%'
ORDER BY
    CASE WHEN cl.next_calibration_date < date('now') THEN 0 ELSE 1 END,
    cl.next_calibration_date ASC;

-- View: Calibration quality trends
CREATE VIEW IF NOT EXISTS v_calibration_quality_trends AS
SELECT
    i.id as instrument_id,
    i.display_name as instrument_name,
    s.acronym as station_acronym,
    strftime('%Y-%m', cl.calibration_date) as month,
    AVG(cl.quality_score) as avg_quality,
    AVG(cl.deviation_from_reference) as avg_deviation,
    COUNT(*) as calibration_count
FROM calibration_logs cl
JOIN instruments i ON cl.instrument_id = i.id
JOIN platforms p ON i.platform_id = p.id
JOIN stations s ON p.station_id = s.id
WHERE cl.calibration_date >= date('now', '-12 months')
GROUP BY i.id, strftime('%Y-%m', cl.calibration_date)
ORDER BY i.id, month;
```

---

## 6. UX Dashboard Redesign

### 6.1 Design Philosophy

The new dashboard follows these principles:

1. **Progressive Disclosure** - Show overview first, details on demand
2. **Card-Based Layout** - Scannable, mobile-friendly components
3. **Visual Hierarchy** - Platform types clearly distinguished
4. **Reactive Updates** - Real-time feedback on state changes
5. **Admin-Aware** - Delete operations only visible to admins

### 6.2 Component Hierarchy

```
StationDashboard
    StationHeader
        StationTitle
        StationBadges (status, ecosystem count)
        QuickActions (edit, export, settings)

    PlatformTypesGrid
        PlatformTypeCard (Fixed)
            PlatformTypeHeader (icon, name, count)
            PlatformSummary (instrument counts by type)
            PlatformList (collapsible)
                PlatformCard
                    PlatformHeader (name, ecosystem)
                    InstrumentGrid
                        InstrumentMiniCard (type icon, status badge)
                    ExpandButton

        PlatformTypeCard (UAV)
            ... same structure ...

        PlatformTypeCard (Satellite)
            ... same structure ...

        PlatformTypeCard (Mobile)
            ... same structure ...

    MapSection
        InteractiveMap
        PlatformMarkers
        AOILayers

    RecentActivityFeed
        ActivityItem (maintenance, calibration, updates)
```

### 6.3 Component Specifications

#### 6.3.1 PlatformTypeCard

```javascript
/**
 * PlatformTypeCard Component
 *
 * Displays a summary card for a platform type with expandable platform list.
 *
 * Props:
 * - type: 'fixed' | 'uav' | 'satellite' | 'mobile'
 * - platforms: Platform[]
 * - instruments: Instrument[]
 * - isAdmin: boolean
 * - onPlatformClick: (platform) => void
 * - onInstrumentClick: (instrument) => void
 */

// Visual Design
const PLATFORM_TYPE_STYLES = {
    fixed: {
        icon: 'fa-tower-observation',
        color: '#2563eb',
        bgGradient: 'from-blue-500 to-blue-700',
        label: 'Fixed Platforms'
    },
    uav: {
        icon: 'fa-helicopter',
        color: '#059669',
        bgGradient: 'from-emerald-500 to-emerald-700',
        label: 'UAV Platforms'
    },
    satellite: {
        icon: 'fa-satellite',
        color: '#7c3aed',
        bgGradient: 'from-violet-500 to-violet-700',
        label: 'Satellite Platforms'
    },
    mobile: {
        icon: 'fa-truck',
        color: '#f59e0b',
        bgGradient: 'from-amber-500 to-amber-700',
        label: 'Mobile Platforms'
    }
};
```

#### 6.3.2 InstrumentMiniCard

```javascript
/**
 * InstrumentMiniCard Component
 *
 * Compact instrument representation for grid display.
 *
 * Props:
 * - instrument: Instrument
 * - showStatus: boolean
 * - onClick: (instrument) => void
 */

const INSTRUMENT_TYPE_ICONS = {
    phenocam: { icon: 'fa-camera', color: '#2563eb' },
    multispectral: { icon: 'fa-satellite-dish', color: '#7c3aed' },
    par: { icon: 'fa-sun', color: '#f59e0b' },
    ndvi: { icon: 'fa-leaf', color: '#059669' },
    pri: { icon: 'fa-microscope', color: '#ec4899' },
    hyperspectral: { icon: 'fa-rainbow', color: '#6366f1' }
};

const STATUS_BADGES = {
    active: { color: '#059669', label: 'Active' },
    inactive: { color: '#6b7280', label: 'Inactive' },
    maintenance: { color: '#f59e0b', label: 'Maintenance' },
    decommissioned: { color: '#dc2626', label: 'Decommissioned' }
};
```

#### 6.3.3 Dashboard State Management

```javascript
/**
 * DashboardState - Reactive state management for dashboard
 */
class DashboardState {
    constructor() {
        this._state = {
            station: null,
            platformsByType: {
                fixed: [],
                uav: [],
                satellite: [],
                mobile: []
            },
            instruments: [],
            expandedPlatforms: new Set(),
            selectedPlatformType: null,
            isLoading: true,
            error: null
        };

        this._subscribers = [];
    }

    subscribe(callback) {
        this._subscribers.push(callback);
        return () => {
            this._subscribers = this._subscribers.filter(cb => cb !== callback);
        };
    }

    setState(updates) {
        this._state = { ...this._state, ...updates };
        this._notify();
    }

    _notify() {
        this._subscribers.forEach(cb => cb(this._state));
    }

    // Computed getters
    get instrumentCountsByType() {
        const counts = {};
        for (const instrument of this._state.instruments) {
            const type = this._getInstrumentCategory(instrument.instrument_type);
            counts[type] = (counts[type] || 0) + 1;
        }
        return counts;
    }

    get platformsWithInstruments() {
        return Object.entries(this._state.platformsByType).map(([type, platforms]) => ({
            type,
            platforms: platforms.map(p => ({
                ...p,
                instruments: this._state.instruments.filter(i => i.platform_id === p.id)
            }))
        }));
    }
}
```

### 6.4 CSS Component Styles

```css
/* Platform Type Cards */
.platform-type-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.platform-type-card {
    background: var(--bg-primary);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);
    overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s;
}

.platform-type-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
}

.platform-type-header {
    padding: 1.25rem;
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.platform-type-header.type-fixed {
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
}

.platform-type-header.type-uav {
    background: linear-gradient(135deg, #059669, #047857);
}

.platform-type-header.type-satellite {
    background: linear-gradient(135deg, #7c3aed, #6d28d9);
}

.platform-type-header.type-mobile {
    background: linear-gradient(135deg, #f59e0b, #d97706);
}

.platform-type-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-weight: 600;
    font-size: 1.1rem;
}

.platform-type-count {
    background: rgba(255, 255, 255, 0.2);
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.875rem;
}

/* Instrument Summary Grid */
.instrument-summary {
    padding: 1rem 1.25rem;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
}

.instrument-count-badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.375rem 0.75rem;
    background: var(--bg-tertiary);
    border-radius: var(--radius-sm);
    font-size: 0.8125rem;
}

.instrument-count-badge i {
    opacity: 0.8;
}

/* Platform List */
.platform-list {
    padding: 0.5rem;
}

.platform-item {
    padding: 0.75rem 1rem;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: background-color 0.15s;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.platform-item:hover {
    background: var(--bg-tertiary);
}

.platform-item-info {
    display: flex;
    flex-direction: column;
}

.platform-item-name {
    font-weight: 500;
    color: var(--text-primary);
}

.platform-item-ecosystem {
    font-size: 0.8125rem;
    color: var(--text-secondary);
}

.platform-item-instruments {
    display: flex;
    gap: 0.25rem;
}

.instrument-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
}

/* Instrument Mini Cards */
.instrument-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 0.75rem;
    padding: 1rem;
}

.instrument-mini-card {
    background: var(--bg-tertiary);
    border-radius: var(--radius-md);
    padding: 0.75rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.15s;
    position: relative;
}

.instrument-mini-card:hover {
    background: var(--bg-secondary);
    transform: scale(1.02);
}

.instrument-mini-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 0.5rem;
    font-size: 1.1rem;
    color: white;
}

.instrument-mini-name {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.instrument-status-dot {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    width: 8px;
    height: 8px;
    border-radius: 50%;
}

/* Admin Delete Button */
.admin-delete-btn {
    opacity: 0;
    transition: opacity 0.15s;
    background: var(--danger-color);
    color: white;
    border: none;
    padding: 0.375rem 0.75rem;
    border-radius: var(--radius-sm);
    font-size: 0.75rem;
    cursor: pointer;
}

.platform-item:hover .admin-delete-btn,
.instrument-mini-card:hover .admin-delete-btn {
    opacity: 1;
}

.admin-delete-btn:hover {
    background: #b91c1c;
}

/* Responsive Adjustments */
@media (max-width: 768px) {
    .platform-type-grid {
        grid-template-columns: 1fr;
    }

    .instrument-grid {
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    }
}
```

### 6.5 Delete Confirmation Pattern

```javascript
/**
 * Delete confirmation with dependency check
 */
async function confirmDelete(entityType, entityId, entityName) {
    // Check for dependencies first
    const deps = await checkDependencies(entityType, entityId);

    if (deps.hasDependencies) {
        showWarningModal({
            title: `Cannot Delete ${entityName}`,
            message: `This ${entityType} has the following dependencies that must be removed first:`,
            dependencies: deps.items,
            actions: [
                { label: 'Close', type: 'secondary' }
            ]
        });
        return false;
    }

    // Show confirmation
    return showConfirmModal({
        title: `Delete ${entityName}?`,
        message: `Are you sure you want to delete this ${entityType}? This action cannot be undone.`,
        confirmText: 'Delete',
        confirmType: 'danger',
        requireTypeConfirm: true,  // User must type entity name
        typeConfirmValue: entityName
    });
}

async function checkDependencies(entityType, entityId) {
    const response = await fetch(`/api/v3/${entityType}s/${entityId}/dependencies`);
    return response.json();
}
```

---

## 7. Database Migration

### 7.1 Migration File: 0030_maintenance_calibration.sql

```sql
-- ============================================================
-- Migration 0030: Maintenance History & Calibration Logs
-- SITES Spectral v8.0.0 - Phase 7
-- Date: 2025-11-28
-- ============================================================

-- ============================================================
-- PART 1: MAINTENANCE HISTORY TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS maintenance_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    instrument_id INTEGER NOT NULL,

    -- Maintenance Details
    maintenance_date TEXT NOT NULL,
    maintenance_type TEXT NOT NULL,
    description TEXT NOT NULL,

    -- Categorization
    tags TEXT,
    status TEXT DEFAULT 'completed',
    priority TEXT DEFAULT 'normal',

    -- Problem Tracking
    recurrent_problem INTEGER DEFAULT 0,
    problem_category TEXT,
    problem_severity TEXT,
    root_cause TEXT,

    -- Work Details
    technician TEXT,
    technician_id INTEGER,
    duration_minutes INTEGER,

    -- Parts and Materials
    parts_replaced TEXT,
    materials_used TEXT,
    total_cost REAL,

    -- Scheduling
    scheduled_date TEXT,
    completed_date TEXT,
    next_maintenance_date TEXT,

    -- Documentation
    notes TEXT,
    photos_json TEXT,
    documents_json TEXT,

    -- Audit
    created_by INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (instrument_id) REFERENCES instruments(id) ON DELETE CASCADE,
    FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mh_instrument ON maintenance_history(instrument_id);
CREATE INDEX IF NOT EXISTS idx_mh_date ON maintenance_history(maintenance_date);
CREATE INDEX IF NOT EXISTS idx_mh_status ON maintenance_history(status);
CREATE INDEX IF NOT EXISTS idx_mh_type ON maintenance_history(maintenance_type);
CREATE INDEX IF NOT EXISTS idx_mh_recurrent ON maintenance_history(recurrent_problem);
CREATE INDEX IF NOT EXISTS idx_mh_technician ON maintenance_history(technician_id);

-- ============================================================
-- PART 2: CALIBRATION LOGS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS calibration_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    instrument_id INTEGER NOT NULL,

    -- Calibration Identification
    calibration_date TEXT NOT NULL,
    calibration_type TEXT NOT NULL,
    calibration_method TEXT,

    -- Duration and Scheduling
    duration_minutes INTEGER,
    frequency TEXT,
    next_calibration_date TEXT,

    -- Reflectance Panel Details
    reflectance_panel_used TEXT,
    panel_serial_number TEXT,
    panel_calibration_date TEXT,
    panel_condition TEXT,

    -- Personnel
    technician TEXT,
    technician_id INTEGER,

    -- Ambient Conditions
    ambient_conditions TEXT,

    -- Pre-Calibration State
    physical_aspect_before TEXT,
    sensor_cleanliness_before TEXT,

    -- Cleaning Details
    cleaning_performed INTEGER DEFAULT 0,
    cleaning_method TEXT,
    cleaning_solution TEXT,

    -- Post-Calibration State
    physical_aspect_after TEXT,
    sensor_cleanliness_after TEXT,

    -- Measurements
    measurements_json TEXT,
    coefficients_json TEXT,

    -- Quality Assessment
    quality_passed INTEGER DEFAULT 1,
    quality_score REAL,
    quality_notes TEXT,
    deviation_from_reference REAL,

    -- Additional Measurements
    dark_current_values TEXT,
    integration_time_ms INTEGER,

    -- Documentation
    notes TEXT,
    photos_json TEXT,
    raw_data_path TEXT,

    -- Audit
    created_by INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (instrument_id) REFERENCES instruments(id) ON DELETE CASCADE,
    FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cl_instrument ON calibration_logs(instrument_id);
CREATE INDEX IF NOT EXISTS idx_cl_date ON calibration_logs(calibration_date);
CREATE INDEX IF NOT EXISTS idx_cl_type ON calibration_logs(calibration_type);
CREATE INDEX IF NOT EXISTS idx_cl_quality ON calibration_logs(quality_passed);
CREATE INDEX IF NOT EXISTS idx_cl_next_date ON calibration_logs(next_calibration_date);

-- ============================================================
-- PART 3: ERROR LOG TABLE (for monitoring)
-- ============================================================

CREATE TABLE IF NOT EXISTS error_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    message TEXT NOT NULL,
    stack TEXT,
    path TEXT,
    method TEXT,
    username TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_error_timestamp ON error_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_error_path ON error_log(path);

-- ============================================================
-- PART 4: VIEWS
-- ============================================================

-- Upcoming maintenance
CREATE VIEW IF NOT EXISTS v_upcoming_maintenance AS
SELECT
    mh.*,
    i.display_name as instrument_name,
    i.normalized_name as instrument_normalized_name,
    i.instrument_type,
    p.display_name as platform_name,
    s.acronym as station_acronym,
    s.display_name as station_name
FROM maintenance_history mh
JOIN instruments i ON mh.instrument_id = i.id
JOIN platforms p ON i.platform_id = p.id
JOIN stations s ON p.station_id = s.id
WHERE mh.status = 'scheduled'
    AND mh.scheduled_date >= date('now')
ORDER BY mh.scheduled_date ASC;

-- Recurrent problems
CREATE VIEW IF NOT EXISTS v_recurrent_problems AS
SELECT
    i.id as instrument_id,
    i.display_name as instrument_name,
    i.normalized_name,
    s.acronym as station_acronym,
    mh.problem_category,
    COUNT(*) as occurrence_count,
    MAX(mh.maintenance_date) as last_occurrence,
    GROUP_CONCAT(DISTINCT mh.root_cause) as root_causes
FROM maintenance_history mh
JOIN instruments i ON mh.instrument_id = i.id
JOIN platforms p ON i.platform_id = p.id
JOIN stations s ON p.station_id = s.id
WHERE mh.recurrent_problem = 1
GROUP BY i.id, mh.problem_category
HAVING COUNT(*) >= 2
ORDER BY occurrence_count DESC;

-- Instruments needing calibration
CREATE VIEW IF NOT EXISTS v_calibration_due AS
SELECT
    i.id as instrument_id,
    i.display_name as instrument_name,
    i.normalized_name,
    i.instrument_type,
    s.acronym as station_acronym,
    (SELECT calibration_date FROM calibration_logs cl2
     WHERE cl2.instrument_id = i.id
     ORDER BY calibration_date DESC LIMIT 1) as last_calibration,
    (SELECT next_calibration_date FROM calibration_logs cl2
     WHERE cl2.instrument_id = i.id
     ORDER BY calibration_date DESC LIMIT 1) as next_calibration_date
FROM instruments i
JOIN platforms p ON i.platform_id = p.id
JOIN stations s ON p.station_id = s.id
WHERE i.instrument_type LIKE '%multispectral%'
    OR i.instrument_type LIKE '%spectral%'
    OR i.instrument_type LIKE '%NDVI%'
    OR i.instrument_type LIKE '%PRI%'
    OR i.instrument_type LIKE '%PAR%'
ORDER BY next_calibration_date ASC NULLS FIRST;

-- ============================================================
-- PART 5: MIGRATION METADATA
-- ============================================================

INSERT INTO migration_metadata (migration_number, description, fields_added, performance_impact, backward_compatible)
VALUES ('0030', 'Maintenance History & Calibration Logs - Phase 7',
        60, 'Low - New tables with indexes', true);

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
```

---

## 8. API Specification

### 8.1 Maintenance History API

#### Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v3/maintenance` | List all maintenance records | admin |
| GET | `/api/v3/maintenance/:id` | Get single record | admin, station |
| GET | `/api/v3/instruments/:id/maintenance` | Get maintenance for instrument | admin, station |
| POST | `/api/v3/instruments/:id/maintenance` | Create maintenance record | admin, station |
| PUT | `/api/v3/maintenance/:id` | Update maintenance record | admin, station |
| DELETE | `/api/v3/maintenance/:id` | Delete maintenance record | admin |
| GET | `/api/v3/maintenance/upcoming` | Get upcoming scheduled maintenance | admin |
| GET | `/api/v3/maintenance/recurrent-problems` | Get recurrent issues report | admin |
| GET | `/api/v3/stations/:acronym/maintenance` | Get maintenance by station | admin, station |

#### Request/Response Examples

**POST /api/v3/instruments/:id/maintenance**

```json
// Request
{
    "maintenance_date": "2025-11-28T10:00:00Z",
    "maintenance_type": "cleaning",
    "description": "Cleaned lens and housing after storm damage",
    "status": "completed",
    "priority": "high",
    "recurrent_problem": false,
    "technician": "John Doe",
    "duration_minutes": 45,
    "parts_replaced": [
        {"name": "O-ring seal", "serial": null, "cost": 5.00}
    ],
    "notes": "Minor scratches observed on housing"
}

// Response
{
    "success": true,
    "id": 123,
    "message": "Maintenance record created successfully"
}
```

**GET /api/v3/instruments/:id/maintenance?limit=10&offset=0**

```json
// Response
{
    "maintenance_records": [
        {
            "id": 123,
            "instrument_id": 45,
            "maintenance_date": "2025-11-28T10:00:00Z",
            "maintenance_type": "cleaning",
            "description": "Cleaned lens and housing after storm damage",
            "status": "completed",
            "technician": "John Doe",
            "duration_minutes": 45,
            "created_at": "2025-11-28T10:45:00Z"
        }
    ],
    "total": 15,
    "limit": 10,
    "offset": 0
}
```

### 8.2 Calibration Logs API

#### Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v3/calibration` | List all calibration logs | admin |
| GET | `/api/v3/calibration/:id` | Get single log | admin, station |
| GET | `/api/v3/instruments/:id/calibration` | Get calibration for instrument | admin, station |
| POST | `/api/v3/instruments/:id/calibration` | Create calibration log | admin, station |
| PUT | `/api/v3/calibration/:id` | Update calibration log | admin, station |
| DELETE | `/api/v3/calibration/:id` | Delete calibration log | admin |
| GET | `/api/v3/calibration/due` | Get instruments due for calibration | admin |
| GET | `/api/v3/calibration/quality-report` | Get quality trends report | admin |
| GET | `/api/v3/stations/:acronym/calibration` | Get calibration by station | admin, station |

#### Request/Response Examples

**POST /api/v3/instruments/:id/calibration**

```json
// Request
{
    "calibration_date": "2025-11-28T09:00:00Z",
    "calibration_type": "clean",
    "calibration_method": "reflectance_panel",
    "duration_minutes": 30,
    "frequency": "monthly",
    "next_calibration_date": "2025-12-28",
    "reflectance_panel_used": "Spectralon 99%",
    "panel_serial_number": "SP99-2024-001",
    "technician": "Jane Smith",
    "ambient_conditions": {
        "temperature_c": 18.5,
        "humidity_pct": 42,
        "cloud_cover": "clear",
        "wind_speed_ms": 1.5
    },
    "physical_aspect_before": "Light dust on lens",
    "sensor_cleanliness_before": "dusty",
    "cleaning_performed": true,
    "cleaning_method": "dry_wipe",
    "physical_aspect_after": "Clean, no visible contamination",
    "sensor_cleanliness_after": "clean",
    "measurements_json": {
        "channels": [
            {"id": 1, "wavelength_nm": 450, "before": 0.85, "after": 0.95, "offset": 0.02},
            {"id": 2, "wavelength_nm": 550, "before": 0.87, "after": 0.96, "offset": 0.01},
            {"id": 3, "wavelength_nm": 650, "before": 0.84, "after": 0.94, "offset": 0.02},
            {"id": 4, "wavelength_nm": 850, "before": 0.83, "after": 0.93, "offset": 0.03}
        ]
    },
    "quality_passed": true,
    "quality_score": 95.5,
    "deviation_from_reference": 1.2
}

// Response
{
    "success": true,
    "id": 456,
    "message": "Calibration log created successfully",
    "next_calibration_date": "2025-12-28"
}
```

### 8.3 Handler Implementation Pattern

```javascript
// src/v3/handlers/maintenance-v3.js

import { checkUserPermissions } from '../../auth/permissions.js';
import { executeQueryFirst, executeQueryAll, executeQueryRun } from '../../utils/database.js';
import { createSuccessResponse, createErrorResponse, createForbiddenResponse, createNotFoundResponse } from '../../utils/responses.js';

/**
 * List maintenance records for an instrument
 */
export async function getInstrumentMaintenance(instrumentId, user, env, queryParams) {
    // Verify instrument exists and user has access
    const instrument = await verifyInstrumentAccess(instrumentId, user, env);
    if (instrument.error) return instrument.response;

    const { limit = 20, offset = 0, status, type } = queryParams;

    let query = `
        SELECT mh.*,
               u.username as created_by_username
        FROM maintenance_history mh
        LEFT JOIN users u ON mh.created_by = u.id
        WHERE mh.instrument_id = ?
    `;
    const params = [instrumentId];

    if (status) {
        query += ` AND mh.status = ?`;
        params.push(status);
    }

    if (type) {
        query += ` AND mh.maintenance_type = ?`;
        params.push(type);
    }

    query += ` ORDER BY mh.maintenance_date DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const records = await executeQueryAll(env, query, params, 'getInstrumentMaintenance');

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM maintenance_history WHERE instrument_id = ?`;
    const countParams = [instrumentId];
    const countResult = await executeQueryFirst(env, countQuery, countParams, 'getInstrumentMaintenanceCount');

    return createSuccessResponse({
        maintenance_records: records,
        total: countResult?.total || 0,
        limit: parseInt(limit),
        offset: parseInt(offset)
    });
}

/**
 * Create maintenance record
 */
export async function createMaintenanceRecord(instrumentId, user, request, env) {
    const permission = checkUserPermissions(user, 'maintenance', 'write');
    if (!permission.allowed) return createForbiddenResponse();

    // Verify instrument access
    const instrument = await verifyInstrumentAccess(instrumentId, user, env);
    if (instrument.error) return instrument.response;

    const data = await request.json();

    // Validate required fields
    const required = ['maintenance_date', 'maintenance_type', 'description'];
    for (const field of required) {
        if (!data[field]) {
            return createErrorResponse(`Missing required field: ${field}`, 400);
        }
    }

    // Validate maintenance_type
    const validTypes = ['routine', 'cleaning', 'calibration', 'repair', 'upgrade', 'inspection'];
    if (!validTypes.includes(data.maintenance_type)) {
        return createErrorResponse(`Invalid maintenance_type. Must be one of: ${validTypes.join(', ')}`, 400);
    }

    const now = new Date().toISOString();

    const query = `
        INSERT INTO maintenance_history (
            instrument_id, maintenance_date, maintenance_type, description,
            tags, status, priority, recurrent_problem, problem_category,
            problem_severity, root_cause, technician, technician_id,
            duration_minutes, parts_replaced, materials_used, total_cost,
            scheduled_date, completed_date, next_maintenance_date,
            notes, photos_json, documents_json, created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        instrumentId,
        data.maintenance_date,
        data.maintenance_type,
        data.description,
        JSON.stringify(data.tags || []),
        data.status || 'completed',
        data.priority || 'normal',
        data.recurrent_problem ? 1 : 0,
        data.problem_category || null,
        data.problem_severity || null,
        data.root_cause || null,
        data.technician || null,
        data.technician_id || null,
        data.duration_minutes || null,
        JSON.stringify(data.parts_replaced || []),
        JSON.stringify(data.materials_used || []),
        data.total_cost || null,
        data.scheduled_date || null,
        data.completed_date || data.maintenance_date,
        data.next_maintenance_date || null,
        data.notes || null,
        JSON.stringify(data.photos_json || []),
        JSON.stringify(data.documents_json || []),
        user.id,
        now,
        now
    ];

    const result = await executeQueryRun(env, query, values, 'createMaintenanceRecord');

    if (!result?.meta?.last_row_id) {
        return createErrorResponse('Failed to create maintenance record', 500);
    }

    return createSuccessResponse({
        success: true,
        id: result.meta.last_row_id,
        message: 'Maintenance record created successfully'
    });
}

/**
 * Verify instrument access for user
 */
async function verifyInstrumentAccess(instrumentId, user, env) {
    const query = `
        SELECT i.id, s.id as station_id, s.normalized_name as station_normalized_name
        FROM instruments i
        JOIN platforms p ON i.platform_id = p.id
        JOIN stations s ON p.station_id = s.id
        WHERE i.id = ?
    `;

    const instrument = await executeQueryFirst(env, query, [instrumentId], 'verifyInstrumentAccess');

    if (!instrument) {
        return { error: true, response: createNotFoundResponse('Instrument not found') };
    }

    if (user.role === 'station') {
        const hasAccess = user.station_id === instrument.station_id ||
                          user.station_normalized_name === instrument.station_normalized_name;
        if (!hasAccess) {
            return { error: true, response: createForbiddenResponse() };
        }
    }

    return { error: false, instrument };
}
```

---

## 9. Implementation Phases

### Phase 7.1: Database & Core Infrastructure (Week 1)

| Task | Priority | Estimated Hours |
|------|----------|-----------------|
| Create migration 0030 | Critical | 2 |
| Apply migration to dev/production | Critical | 1 |
| Set up Cloudflare KV namespace | Critical | 2 |
| Implement caching middleware | Critical | 8 |
| Implement rate limiting (Durable Objects) | High | 6 |
| Add performance timing middleware | Medium | 3 |
| Create error tracking table and logging | Medium | 3 |

**Deliverables:**
- Migration 0030 applied
- KV caching operational
- Rate limiting active
- Basic monitoring in place

### Phase 7.2: Maintenance & Calibration API (Week 2)

| Task | Priority | Estimated Hours |
|------|----------|-----------------|
| Create maintenance-v3 handler | Critical | 8 |
| Create calibration-v3 handler | Critical | 8 |
| Add routes to api-handler-v3.js | Critical | 2 |
| Update permissions.js for new resources | Critical | 2 |
| Write unit tests for handlers | High | 8 |
| Write integration tests | High | 8 |

**Deliverables:**
- Full CRUD for maintenance_history
- Full CRUD for calibration_logs
- 40+ new tests passing
- API documentation updated

### Phase 7.3: UX Dashboard Components (Week 3)

| Task | Priority | Estimated Hours |
|------|----------|-----------------|
| Create DashboardState class | Critical | 4 |
| Implement PlatformTypeCard component | Critical | 8 |
| Implement InstrumentMiniCard component | High | 4 |
| Implement InstrumentGrid component | High | 4 |
| Create delete confirmation system | High | 4 |
| Add reactive state subscriptions | Medium | 4 |
| CSS for new components | High | 6 |

**Deliverables:**
- New dashboard component library
- Reactive state management
- Delete confirmation workflow

### Phase 7.4: Dashboard Integration (Week 4)

| Task | Priority | Estimated Hours |
|------|----------|-----------------|
| Integrate components into station.html | Critical | 8 |
| Connect dashboard to API | Critical | 6 |
| Add maintenance/calibration modals | High | 8 |
| Implement maintenance history view | High | 6 |
| Implement calibration log view | High | 6 |
| Add activity feed | Medium | 4 |
| Responsive testing and fixes | High | 4 |

**Deliverables:**
- Complete new dashboard
- Maintenance UI integrated
- Calibration UI integrated
- Mobile-responsive

### Phase 7.5: Polish & Release (Week 5)

| Task | Priority | Estimated Hours |
|------|----------|-----------------|
| End-to-end testing | Critical | 8 |
| Performance testing | High | 4 |
| Security audit | High | 4 |
| Documentation update | High | 6 |
| CHANGELOG update | Critical | 2 |
| Version bump to 8.0.0 | Critical | 1 |
| Production deployment | Critical | 2 |
| Post-deployment verification | Critical | 2 |

**Deliverables:**
- SITES Spectral v8.0.0 stable release
- Complete documentation
- Production deployment verified

---

## 10. Testing Strategy

### 10.1 Test Files Structure

```
tests/
├── integration/
│   ├── v3-maintenance.test.js       # Maintenance API tests
│   ├── v3-calibration.test.js       # Calibration API tests
│   ├── caching.test.js              # Cache hit/miss tests
│   └── rate-limiting.test.js        # Rate limit tests
├── unit/
│   ├── dashboard-state.test.js      # Dashboard state management
│   └── validators.test.js           # Input validation
└── fixtures/
    ├── maintenance-data.js          # Mock maintenance records
    └── calibration-data.js          # Mock calibration logs
```

### 10.2 Test Coverage Goals

| Area | Target Coverage |
|------|-----------------|
| Maintenance API | 95% |
| Calibration API | 95% |
| Caching Layer | 90% |
| Rate Limiting | 85% |
| Dashboard State | 90% |
| Validators | 95% |

### 10.3 Critical Test Cases

**Maintenance API:**
- Create maintenance with all fields
- Create maintenance with minimum fields
- Update maintenance record
- Delete maintenance record
- List with pagination
- Filter by status/type
- Station user access control
- Admin-only delete

**Calibration API:**
- Create calibration log with measurements
- Update calibration coefficients
- Calculate next calibration date
- Quality score validation
- Channel measurement validation
- Due calibration report

**Caching:**
- Cache hit returns cached data
- Cache miss fetches from DB
- Cache invalidation on write
- TTL expiration
- Concurrent access handling

**Rate Limiting:**
- Under limit allows request
- At limit returns 429
- Reset after window
- Different limits by role

---

## 11. Risk Assessment

### 11.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| KV latency issues | Low | Medium | Fallback to DB if KV slow |
| Durable Object cold starts | Medium | Low | Warm-up strategy |
| Migration data loss | Very Low | Critical | Backup before migration |
| State management bugs | Medium | Medium | Comprehensive testing |
| Backward compatibility | Low | High | Maintain v2 API |

### 11.2 Schedule Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| UI complexity underestimated | Medium | Medium | Prioritize core features |
| Testing takes longer | Medium | Low | Parallel development |
| Integration issues | Low | Medium | Continuous integration |

### 11.3 Dependencies

| Dependency | Status | Risk Level |
|------------|--------|------------|
| Cloudflare Workers | Stable | Low |
| Cloudflare D1 | GA | Low |
| Cloudflare KV | Stable | Low |
| Cloudflare Durable Objects | Stable | Low |
| Vitest Workers Pool | Active | Low |

---

## Appendix A: File Locations

| Component | Path |
|-----------|------|
| Migration | `migrations/0030_maintenance_calibration.sql` |
| Maintenance Handler | `src/v3/handlers/maintenance-v3.js` |
| Calibration Handler | `src/v3/handlers/calibration-v3.js` |
| Cache Middleware | `src/middleware/cache.js` |
| Rate Limiter | `src/rate-limiter/RateLimiter.js` |
| Dashboard State | `public/js/core/dashboard-state.js` |
| Platform Type Card | `public/js/components/platform-type-card.js` |
| Instrument Mini Card | `public/js/components/instrument-mini-card.js` |
| New Dashboard CSS | `public/css/dashboard-v8.css` |
| Maintenance Tests | `tests/integration/v3-maintenance.test.js` |
| Calibration Tests | `tests/integration/v3-calibration.test.js` |

---

## Appendix B: Permissions Matrix Update

```javascript
// Add to src/auth/permissions.js

const PERMISSION_MATRIX = {
    // ... existing permissions ...

    'maintenance': {
        read: ['admin', 'station', 'readonly'],
        write: ['admin', 'station'],
        delete: ['admin'],
        admin: ['admin']
    },
    'calibration': {
        read: ['admin', 'station', 'readonly'],
        write: ['admin', 'station'],
        delete: ['admin'],
        admin: ['admin']
    }
};
```

---

## Appendix C: Version Manifest Update

After Phase 7 completion, update `public/version-manifest.json`:

```json
{
    "version": "8.0.0",
    "build_date": "2025-12-XX",
    "features": {
        "phase_7": {
            "maintenance_history": true,
            "calibration_logs": true,
            "kv_caching": true,
            "rate_limiting": true,
            "reactive_dashboard": true,
            "performance_monitoring": true
        }
    },
    "api_versions": ["v1", "v2", "v3"],
    "test_coverage": "140+ tests"
}
```

---

*Document prepared by Forge - SITES Spectral Ecosystem Orchestrator*
*Last Updated: 2025-11-28*
