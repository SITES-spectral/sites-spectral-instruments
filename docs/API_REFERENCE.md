# SITES Spectral API Reference

> **Version**: 15.6.0
> **Base URL**: `https://sitesspectral.work/api/v11`
> **Alias**: `https://sitesspectral.work/api/latest`
> **Last Updated**: 2026-01-26

---

## Authentication

All authenticated endpoints require one of:

| Method | Header/Cookie | Description |
|--------|---------------|-------------|
| Cloudflare Access | `Cf-Access-Jwt-Assertion` header | Primary auth for admin portals |
| Magic Link | `magic_token` cookie | Internal station users |
| Session Cookie | `auth_token` httpOnly cookie | Legacy sessions |

### Authentication Endpoints

```http
POST /api/v11/auth/login
POST /api/v11/auth/logout
GET  /api/v11/auth/me
GET  /api/v11/auth/verify
POST /api/v11/auth/magic-link/request
POST /api/v11/auth/magic-link/verify
```

---

## Stations

### List Stations

```http
GET /api/v11/stations
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | integer | Results per page (default: 50) |
| `offset` | integer | Pagination offset |
| `status` | string | Filter by status: `Active`, `Inactive`, `Maintenance` |
| `sites_member` | boolean | Filter SITES member stations |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "acronym": "SVB",
      "display_name": "Svartberget",
      "normalized_name": "svartberget",
      "latitude": 64.2561,
      "longitude": 19.7745,
      "status": "Active",
      "platform_count": 5,
      "instrument_count": 12
    }
  ],
  "pagination": {
    "total": 9,
    "limit": 50,
    "offset": 0
  }
}
```

### Get Station

```http
GET /api/v11/stations/:id
```

### Get Station Dashboard

```http
GET /api/v11/stations/:acronym/dashboard
```

Returns comprehensive station data including platforms, instruments, and statistics.

### Create Station

```http
POST /api/v11/stations
```

**Request Body:**

```json
{
  "acronym": "NEW",
  "display_name": "New Station",
  "normalized_name": "new_station",
  "latitude": 64.0,
  "longitude": 18.0,
  "elevation_m": 350,
  "country": "Sweden",
  "description": "New research station"
}
```

**Required Role:** `admin`, `sites-admin`

### Update Station

```http
PUT /api/v11/stations/:id
```

**Required Role:** `admin`, `sites-admin`

### Delete Station

```http
DELETE /api/v11/stations/:id
```

**Required Role:** `admin`, `sites-admin`

---

## Platforms

### List Platforms

```http
GET /api/v11/platforms
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `station_id` | integer | Filter by station |
| `platform_type` | string | Filter by type: `fixed`, `uav`, `satellite`, `mobile` |
| `status` | string | Filter by status |

### Get Platform

```http
GET /api/v11/platforms/:id
```

### Get Platforms by Station

```http
GET /api/v11/platforms/station/:stationId
```

### Get Platforms by Type

```http
GET /api/v11/platforms/type/:type
```

### Create Platform

```http
POST /api/v11/platforms
```

**Request Body (Fixed Platform):**

```json
{
  "station_id": 1,
  "display_name": "Forest Tower",
  "platform_type": "fixed",
  "ecosystem_code": "FOR",
  "mount_type_code": "TWR",
  "latitude": 64.2561,
  "longitude": 19.7745
}
```

**Request Body (UAV Platform):**

```json
{
  "station_id": 1,
  "display_name": "DJI Mavic 3M",
  "platform_type": "uav",
  "uav_vendor": "DJI",
  "uav_model": "M3M",
  "serial_number": "ABC123"
}
```

**Required Role:** `admin`, `sites-admin`, `station-admin` (own station)

### Update Platform

```http
PUT /api/v11/platforms/:id
```

### Delete Platform

```http
DELETE /api/v11/platforms/:id
```

---

## Instruments

### List Instruments

```http
GET /api/v11/instruments
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `platform_id` | integer | Filter by platform |
| `station_id` | integer | Filter by station |
| `instrument_type` | string | Filter by type |
| `status` | string | Filter by status |

### Get Instrument

```http
GET /api/v11/instruments/:id
```

### Get Instrument Details

```http
GET /api/v11/instruments/:id/details
```

Returns full instrument data with type-specific fields.

### Get Instruments by Platform

```http
GET /api/v11/instruments/platform/:platformId
```

### Get Instruments by Station

```http
GET /api/v11/instruments/station/:stationId
```

### Create Instrument

```http
POST /api/v11/instruments
```

**Request Body (Phenocam):**

```json
{
  "platform_id": 1,
  "instrument_type": "Phenocam",
  "display_name": "Forest Phenocam",
  "status": "Active",
  "camera_brand": "StarDot",
  "camera_model": "NetCam SC",
  "resolution": "1920x1080",
  "capture_interval_minutes": 30
}
```

### Update Instrument

```http
PUT /api/v11/instruments/:id
```

### Delete Instrument

```http
DELETE /api/v11/instruments/:id
```

---

## ROIs (Regions of Interest)

### List ROIs

```http
GET /api/v11/rois
```

### Get ROI

```http
GET /api/v11/rois/:id
```

### Get ROIs by Instrument

```http
GET /api/v11/rois/instrument/:instrumentId
```

### Create ROI

```http
POST /api/v11/rois
```

**Request Body:**

```json
{
  "instrument_id": 1,
  "roi_name": "ROI_01",
  "description": "Forest canopy region",
  "polygon_points": [[100,100],[200,100],[200,200],[100,200]],
  "color": "#00FF00"
}
```

### Update ROI

```http
PUT /api/v11/rois/:id
```

### Delete ROI

```http
DELETE /api/v11/rois/:id
```

---

## AOIs (Areas of Interest)

### List AOIs

```http
GET /api/v11/aois
```

### Get AOI

```http
GET /api/v11/aois/:id
```

### Get AOIs by Station

```http
GET /api/v11/aois/station/:stationId
```

### Export as GeoJSON

```http
GET /api/v11/aois/export/geojson?station_id=1
```

### Create AOI

```http
POST /api/v11/aois
```

### Import GeoJSON

```http
POST /api/v11/aois/import/geojson
```

### Import KML

```http
POST /api/v11/aois/import/kml
```

---

## Campaigns

### List Campaigns

```http
GET /api/v11/campaigns
```

### Get Campaign

```http
GET /api/v11/campaigns/:id
```

### Get Active Campaigns

```http
GET /api/v11/campaigns/active
```

### Create Campaign

```http
POST /api/v11/campaigns
```

**Request Body:**

```json
{
  "station_id": 1,
  "name": "Summer 2026 Survey",
  "start_date": "2026-06-01",
  "end_date": "2026-08-31",
  "description": "Summer phenology monitoring"
}
```

### Start Campaign

```http
POST /api/v11/campaigns/:id/start
```

### Complete Campaign

```http
POST /api/v11/campaigns/:id/complete
```

---

## Products

### List Products

```http
GET /api/v11/products
```

### Get Product

```http
GET /api/v11/products/:id
```

### Get Product by DOI

```http
GET /api/v11/products/doi/:doi
```

### Get Products by Processing Level

```http
GET /api/v11/products/processing-level/:level
```

**Levels:** `L0`, `L1`, `L2`, `L3`, `L4`

### Create Product

```http
POST /api/v11/products
```

### Set Quality Score

```http
POST /api/v11/products/:id/quality-score
```

**Request Body:**

```json
{
  "quality_score": 85,
  "quality_notes": "Good coverage, minor cloud interference"
}
```

### Promote Quality

```http
POST /api/v11/products/:id/promote-quality
```

---

## Maintenance

### List Maintenance Records

```http
GET /api/v11/maintenance
```

### Get Maintenance Timeline

```http
GET /api/v11/maintenance/timeline?entity_type=platform&entity_id=1
```

### Get Pending Maintenance

```http
GET /api/v11/maintenance/pending
```

### Get Overdue Maintenance

```http
GET /api/v11/maintenance/overdue
```

### Create Maintenance

```http
POST /api/v11/maintenance
```

**Request Body:**

```json
{
  "entity_type": "instrument",
  "entity_id": 5,
  "maintenance_type": "cleaning",
  "scheduled_date": "2026-02-15",
  "description": "Lens cleaning"
}
```

### Complete Maintenance

```http
POST /api/v11/maintenance/:id/complete
```

---

## Calibrations

### List Calibrations

```http
GET /api/v11/calibrations
```

### Get Calibration Timeline

```http
GET /api/v11/calibrations/timeline?instrument_id=1
```

### Get Current Calibration

```http
GET /api/v11/calibrations/current?instrument_id=1
```

### Get Expired Calibrations

```http
GET /api/v11/calibrations/expired
```

### Get Expiring Calibrations

```http
GET /api/v11/calibrations/expiring?days=30
```

### Create Calibration

```http
POST /api/v11/calibrations
```

### Expire Calibration

```http
POST /api/v11/calibrations/:id/expire
```

---

## UAV Pilots

### List Pilots

```http
GET /api/v11/uav/pilots
```

### Get Pilot

```http
GET /api/v11/uav/pilots/:id
```

### Get Pilots by Station

```http
GET /api/v11/uav/pilots/station/:stationId
```

### Get Pilots with Expiring Credentials

```http
GET /api/v11/uav/pilots/expiring?days=30
```

### Create Pilot

```http
POST /api/v11/uav/pilots
```

**Request Body:**

```json
{
  "full_name": "Erik Lindqvist",
  "email": "erik@example.com",
  "phone": "+46701234567",
  "organization": "Swedish University of Agricultural Sciences",
  "certificate_type": "A2",
  "certificate_number": "SE-123456",
  "certificate_expiry": "2027-06-30",
  "insurance_policy": "INS-2026-001",
  "insurance_expiry": "2027-01-01"
}
```

### Authorize Pilot for Station

```http
POST /api/v11/uav/pilots/:id/authorize/:stationId
```

---

## UAV Missions

### List Missions

```http
GET /api/v11/uav/missions
```

### Get Mission

```http
GET /api/v11/uav/missions/:id
```

### Get Missions by Station

```http
GET /api/v11/uav/missions/station/:stationId
```

### Get Pending Missions

```http
GET /api/v11/uav/missions/pending
```

### Get Missions by Status

```http
GET /api/v11/uav/missions/status/:status
```

**Statuses:** `draft`, `planned`, `approved`, `in_progress`, `completed`, `aborted`, `cancelled`

### Create Mission

```http
POST /api/v11/uav/missions
```

**Request Body:**

```json
{
  "station_id": 1,
  "name": "Forest Survey Q1",
  "planned_date": "2026-02-15",
  "flight_pattern": "grid",
  "target_altitude_m": 100,
  "target_overlap_percent": 80,
  "objectives": ["Vegetation mapping", "Canopy structure"],
  "aoi_id": 5
}
```

### Approve Mission

```http
POST /api/v11/uav/missions/:id/approve
```

**Required Role:** `admin`, `sites-admin`, `station-admin`

### Start Mission

```http
POST /api/v11/uav/missions/:id/start
```

### Complete Mission

```http
POST /api/v11/uav/missions/:id/complete
```

**Request Body:**

```json
{
  "quality_score": 90,
  "coverage_percent": 98,
  "notes": "Excellent conditions"
}
```

### Abort Mission

```http
POST /api/v11/uav/missions/:id/abort
```

**Request Body:**

```json
{
  "reason": "High winds exceeding 15 m/s"
}
```

### Assign Pilot to Mission

```http
POST /api/v11/uav/missions/:id/pilots/:pilotId
```

### Remove Pilot from Mission

```http
DELETE /api/v11/uav/missions/:id/pilots/:pilotId
```

---

## UAV Flight Logs

### List Flight Logs

```http
GET /api/v11/uav/flight-logs
```

### Get Flight Log

```http
GET /api/v11/uav/flight-logs/:id
```

### Get Flight Logs by Mission

```http
GET /api/v11/uav/flight-logs/mission/:missionId
```

### Get Flight Logs by Pilot

```http
GET /api/v11/uav/flight-logs/pilot/:pilotId
```

### Get Pilot Statistics

```http
GET /api/v11/uav/flight-logs/pilot/:pilotId/statistics
```

### Create Flight Log

```http
POST /api/v11/uav/flight-logs
```

**Request Body:**

```json
{
  "mission_id": 1,
  "pilot_id": 5,
  "platform_id": 10,
  "takeoff_time": "2026-02-15T09:00:00Z",
  "landing_time": "2026-02-15T09:25:00Z",
  "takeoff_latitude": 64.2561,
  "takeoff_longitude": 19.7745,
  "max_altitude_agl_m": 100,
  "battery_id": 3,
  "battery_start_percent": 100,
  "battery_end_percent": 35,
  "images_captured": 250,
  "data_size_mb": 1500
}
```

### Report Incident

```http
POST /api/v11/uav/flight-logs/:id/incident
```

**Request Body:**

```json
{
  "severity": "minor",
  "description": "GPS signal lost briefly during flight"
}
```

**Severities:** `minor`, `moderate`, `major`, `critical`

---

## UAV Batteries

### List Batteries

```http
GET /api/v11/uav/batteries
```

### Get Battery

```http
GET /api/v11/uav/batteries/:id
```

### Get Batteries by Station

```http
GET /api/v11/uav/batteries/station/:stationId
```

### Get Batteries Needing Health Check

```http
GET /api/v11/uav/batteries/needs-health-check
```

### Get Station Battery Statistics

```http
GET /api/v11/uav/batteries/station/:stationId/statistics
```

### Create Battery

```http
POST /api/v11/uav/batteries
```

**Request Body:**

```json
{
  "station_id": 1,
  "serial_number": "BAT-2026-001",
  "manufacturer": "DJI",
  "model": "Mavic 3 Intelligent Flight Battery",
  "capacity_mah": 5000,
  "cell_count": 4,
  "chemistry": "LiPo",
  "purchase_date": "2026-01-15"
}
```

### Record Health Check

```http
POST /api/v11/uav/batteries/:id/health-check
```

**Request Body:**

```json
{
  "health_percent": 95,
  "internal_resistance_mohm": 25,
  "notes": "Good condition"
}
```

### Retire Battery

```http
POST /api/v11/uav/batteries/:id/retire
```

**Request Body:**

```json
{
  "reason": "Exceeded 300 charge cycles"
}
```

---

## Admin Endpoints

### Get Activity Logs

```http
GET /api/v11/admin/activity-logs
```

**Required Role:** `admin`, `sites-admin`

### Get User Sessions

```http
GET /api/v11/admin/user-sessions
```

### Get Station Statistics

```http
GET /api/v11/admin/station-stats
```

### Get System Health

```http
GET /api/v11/admin/health
```

### Get Admin Summary

```http
GET /api/v11/admin/summary
```

---

## Users

### List Users

```http
GET /api/v11/users
```

**Required Role:** `admin`, `sites-admin`

### Get User

```http
GET /api/v11/users/:id
```

### Create User

```http
POST /api/v11/users
```

### Update User

```http
PUT /api/v11/users/:id
```

### Delete User

```http
DELETE /api/v11/users/:id
```

---

## Export

### Export Station Data

```http
GET /api/v11/export/station/:acronym
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `format` | string | `csv`, `json`, `tsv` (default: `json`) |
| `include_instruments` | boolean | Include instrument data |
| `include_rois` | boolean | Include ROI data |

---

## System Endpoints

### Health Check

```http
GET /api/v11/health
```

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2026-01-26T12:00:00Z",
  "version": "15.6.0",
  "architecture": "hexagonal",
  "database": "connected"
}
```

### API Information

```http
GET /api/v11/info
```

Returns complete API documentation including all endpoints, schemas, and standards.

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (duplicate) |
| 500 | Internal Server Error |

---

## Rate Limiting

API requests are rate-limited per IP address:

| Endpoint Type | Limit |
|---------------|-------|
| Read (GET) | 1000 requests/minute |
| Write (POST/PUT/DELETE) | 100 requests/minute |
| Auth | 10 requests/minute |

---

## OpenAPI Specification

Full OpenAPI 3.0 specification available at:

- **YAML**: `docs/openapi/openapi.yaml`
- **Interactive**: `https://sitesspectral.work/api/docs`
