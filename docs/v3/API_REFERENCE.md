# SITES Spectral V3 API Reference

**Version:** 9.0.0
**Status:** Production
**Last Updated:** 2025-12-02
**Base URL:** `https://<your-server>/api/v3/`

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Response Format](#response-format)
4. [Pagination](#pagination)
5. [Core Endpoints](#core-endpoints)
   - [Stations](#stations)
   - [Platforms](#platforms)
   - [Instruments](#instruments)
   - [ROIs](#rois)
6. [Campaign Management](#campaign-management)
7. [Product Catalog](#product-catalog)
8. [Spatial Queries](#spatial-queries)
9. [Error Handling](#error-handling)
10. [Rate Limiting](#rate-limiting)
11. [Security Features](#security-features)

---

## Overview

The SITES Spectral V3 API is the default API version as of v9.0.0. It provides a RESTful interface for managing research station instruments, platforms, campaigns, and data products.

### API Versions

| Version | Path Prefix | Status | Notes |
|---------|-------------|--------|-------|
| V3 | `/api/v3/` or `/api/` | **Default** | Full feature set, recommended |
| V1 | `/api/v1/` | Deprecated | Legacy support, removal in v10.0.0 |

### Key Features

- **JWT HMAC-SHA256 Authentication**: Secure token-based authentication
- **HATEOAS Links**: Self-describing API with navigation links
- **Pagination**: Consistent pagination across all list endpoints
- **Spatial Queries**: Bounding box, point-in-polygon, and proximity searches
- **Campaign Management**: Full lifecycle management for data acquisition campaigns
- **Product Catalog**: Comprehensive data product metadata tracking
- **CSRF Protection**: Cross-site request forgery prevention
- **Input Sanitization**: Server-side validation and sanitization

### Platform Types

| Type | Code | Description |
|------|------|-------------|
| Fixed | `fixed` | Towers, masts, permanent installations |
| UAV | `uav` | Unmanned aerial vehicles/drones |
| Satellite | `satellite` | Earth observation satellite platforms |
| Mobile | `mobile` | Portable sensors (coming soon) |

---

## Authentication

All API endpoints (except health check) require JWT authentication.

### Login

Authenticate and receive a JWT token.

**Endpoint:** `POST /api/auth/login`

**Request:**

```bash
curl -X POST https://<your-server>/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "your-username",
    "password": "your-password"
  }'
```

**JavaScript:**

```javascript
const response = await fetch('https://<your-server>/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'your-username',
    password: 'your-password'
  })
});

const data = await response.json();
const token = data.token;
```

**Response:**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "username": "your-username",
    "role": "station",
    "station_acronym": "SVB",
    "station_normalized_name": "svartberget"
  }
}
```

### Token Verification

Verify an existing token is still valid.

**Endpoint:** `GET /api/auth/verify`

**Request:**

```bash
curl -X GET https://<your-server>/api/auth/verify \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**JavaScript:**

```javascript
const response = await fetch('https://<your-server>/api/auth/verify', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const data = await response.json();
console.log(data.user);
```

**Response:**

```json
{
  "success": true,
  "user": {
    "username": "your-username",
    "role": "station",
    "station_acronym": "SVB",
    "station_normalized_name": "svartberget"
  }
}
```

### Authorization Header

All subsequent requests must include the token:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Details

- **Algorithm:** HMAC-SHA256 (HS256)
- **Expiration:** 24 hours
- **Issuer:** `sites-spectral`

### User Roles

| Role | Permissions |
|------|-------------|
| `admin` | Full access to all stations and operations |
| `station` | Read/write access to assigned station only |
| `readonly` | Read-only access |

---

## Response Format

V3 API responses follow a consistent structure with data, metadata, and navigation links.

### Success Response (Single Item)

```json
{
  "id": 1,
  "acronym": "SVB",
  "display_name": "Svartberget",
  "latitude": 64.256,
  "longitude": 19.775,
  "created_at": "2020-01-15T10:00:00Z",
  "updated_at": "2024-11-27T12:30:00Z"
}
```

### Success Response (List with Pagination)

```json
{
  "data": [
    { "id": 1, "name": "SVB_FOR_PL01", "type": "fixed" },
    { "id": 2, "name": "SVB_FOR_PL02", "type": "uav" }
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 25,
    "totalPages": 2,
    "hasNext": true,
    "hasPrev": false
  },
  "links": {
    "self": "/api/v3/platforms?page=1&limit=25",
    "first": "/api/v3/platforms?page=1&limit=25",
    "last": "/api/v3/platforms?page=2&limit=25",
    "next": "/api/v3/platforms?page=2&limit=25",
    "prev": null
  }
}
```

### Error Response

```json
{
  "error": "Validation failed",
  "validation_errors": [
    "Platform name must match pattern {STATION}_{ECOSYSTEM}_PL##"
  ]
}
```

---

## Pagination

All list endpoints support consistent pagination.

### Query Parameters

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `page` | integer | 1 | - | Page number (1-indexed) |
| `limit` | integer | 25 | 100 | Items per page |
| `sort_by` | string | `created_at` | - | Field to sort by |
| `sort_order` | string | `DESC` | - | `ASC` or `DESC` |

### Example

```bash
curl -X GET "https://<your-server>/api/v3/platforms?page=2&limit=10&sort_by=name&sort_order=ASC" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Response Metadata

```json
{
  "meta": {
    "total": 45,
    "page": 2,
    "limit": 10,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": true
  }
}
```

---

## Core Endpoints

### Stations

#### List All Stations

**Endpoint:** `GET /api/v3/stations`

```bash
curl -X GET https://<your-server>/api/v3/stations \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**JavaScript:**

```javascript
const response = await fetch('https://<your-server>/api/v3/stations', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const stations = await response.json();
```

#### Get Station by Acronym

**Endpoint:** `GET /api/v3/stations/{acronym}`

```bash
curl -X GET https://<your-server>/api/v3/stations/SVB \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**

```json
{
  "id": 1,
  "acronym": "SVB",
  "display_name": "Svartberget",
  "description": "Boreal forest research station in northern Sweden",
  "latitude": 64.256,
  "longitude": 19.775,
  "elevation": 235,
  "ecosystem_types": ["FOR", "MIR"],
  "platforms_count": 5,
  "instruments_count": 12,
  "created_at": "2020-01-15T10:00:00Z",
  "updated_at": "2024-11-27T12:30:00Z"
}
```

---

### Platforms

#### List All Platforms

**Endpoint:** `GET /api/v3/platforms`

**Query Parameters:**

| Parameter | Description |
|-----------|-------------|
| `station` | Filter by station acronym (e.g., `SVB`) |
| `type` | Filter by platform type (`fixed`, `uav`, `satellite`) |
| `ecosystem` | Filter by ecosystem code (`FOR`, `MIR`, etc.) |
| `status` | Filter by status (`active`, `inactive`) |
| `bounds` | Bounding box filter: `minLat,minLon,maxLat,maxLon` |

```bash
curl -X GET "https://<your-server>/api/v3/platforms?station=SVB&type=fixed" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**JavaScript:**

```javascript
const params = new URLSearchParams({
  station: 'SVB',
  type: 'fixed',
  page: '1',
  limit: '25'
});

const response = await fetch(`https://<your-server>/api/v3/platforms?${params}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();
```

#### Get Platform by ID

**Endpoint:** `GET /api/v3/platforms/{id}`

```bash
curl -X GET https://<your-server>/api/v3/platforms/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Include Related Data:**

```bash
curl -X GET "https://<your-server>/api/v3/platforms/1?include=instruments,aois" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Get Platforms by Type

**Endpoint:** `GET /api/v3/platforms/type/{type}`

```bash
# Get all UAV platforms
curl -X GET https://<your-server>/api/v3/platforms/type/uav \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Valid Types:** `fixed`, `uav`, `satellite`, `mobile`

#### Create Platform

**Endpoint:** `POST /api/v3/platforms`

```bash
curl -X POST https://<your-server>/api/v3/platforms \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "station_id": 1,
    "name": "SVB_FOR_PL06",
    "display_name": "Svartberget Forest Platform 06",
    "type": "fixed",
    "ecosystem": "FOR",
    "latitude": 64.260,
    "longitude": 19.780,
    "height": 10.0,
    "description": "New monitoring tower",
    "status": "testing"
  }'
```

**JavaScript:**

```javascript
const response = await fetch('https://<your-server>/api/v3/platforms', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    station_id: 1,
    name: 'SVB_FOR_PL06',
    display_name: 'Svartberget Forest Platform 06',
    type: 'fixed',
    ecosystem: 'FOR',
    latitude: 64.260,
    longitude: 19.780,
    height: 10.0,
    status: 'testing'
  })
});
```

#### Update Platform

**Endpoint:** `PUT /api/v3/platforms/{id}`

```bash
curl -X PUT https://<your-server>/api/v3/platforms/15 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "active",
    "description": "Updated description"
  }'
```

#### Delete Platform

**Endpoint:** `DELETE /api/v3/platforms/{id}`

```bash
curl -X DELETE https://<your-server>/api/v3/platforms/15 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Platform Sub-Resources

| Endpoint | Description |
|----------|-------------|
| `GET /api/v3/platforms/{id}/uav` | UAV extension data |
| `GET /api/v3/platforms/{id}/satellite` | Satellite extension data |
| `GET /api/v3/platforms/{id}/campaigns` | Campaigns for platform |
| `GET /api/v3/platforms/{id}/products` | Products for platform |
| `GET /api/v3/platforms/{id}/aois` | AOIs for platform |

---

### Instruments

#### List All Instruments

**Endpoint:** `GET /api/v3/instruments`

**Query Parameters:**

| Parameter | Description |
|-----------|-------------|
| `station` | Filter by station acronym |
| `platform_id` | Filter by platform ID |
| `type` | Filter by instrument type |
| `status` | Filter by status |

```bash
curl -X GET "https://<your-server>/api/v3/instruments?station=SVB&type=phenocam" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Get Instrument by ID

**Endpoint:** `GET /api/v3/instruments/{id}`

```bash
curl -X GET https://<your-server>/api/v3/instruments/42 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Create Instrument

**Endpoint:** `POST /api/v3/instruments`

```bash
curl -X POST https://<your-server>/api/v3/instruments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform_id": 15,
    "name": "SVB_FOR_PL06_PHE01",
    "instrument_type": "phenocam",
    "status": "testing",
    "height_above_ground": 8.0,
    "viewing_direction": "S",
    "azimuth": 180,
    "nadir_angle": 90,
    "specifications": {
      "camera_brand": "StarDot",
      "camera_model": "NetCam SC 5MP",
      "resolution": 5.0,
      "interval_minutes": 20
    }
  }'
```

---

### ROIs

#### List All ROIs

**Endpoint:** `GET /api/v3/rois`

```bash
curl -X GET "https://<your-server>/api/v3/rois?station=SVB" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Get ROI by ID

**Endpoint:** `GET /api/v3/rois/{id}`

```bash
curl -X GET https://<your-server>/api/v3/rois/5 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Campaign Management

Campaigns represent data acquisition events, particularly for UAV and satellite platforms.

### Campaign Statuses

| Status | Description |
|--------|-------------|
| `planned` | Scheduled but not started |
| `in_progress` | Currently executing |
| `completed` | Successfully finished |
| `cancelled` | Cancelled before completion |
| `failed` | Failed during execution |

### Campaign Types

| Type | Description |
|------|-------------|
| `flight` | UAV flight mission |
| `acquisition` | Data acquisition session |
| `survey` | Survey campaign |
| `monitoring` | Continuous monitoring |
| `calibration` | Calibration campaign |

### List All Campaigns

**Endpoint:** `GET /api/v3/campaigns`

**Query Parameters:**

| Parameter | Description |
|-----------|-------------|
| `station` | Filter by station |
| `platform` | Filter by platform ID |
| `status` | Filter by status |
| `type` | Filter by campaign type |
| `from_date` | Start date filter (ISO format) |
| `to_date` | End date filter (ISO format) |

```bash
curl -X GET "https://<your-server>/api/v3/campaigns?station=SVB&status=completed" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**JavaScript:**

```javascript
const response = await fetch('https://<your-server>/api/v3/campaigns?station=SVB', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();
```

### Get Campaign by ID

**Endpoint:** `GET /api/v3/campaigns/{id}`

```bash
curl -X GET https://<your-server>/api/v3/campaigns/10 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**

```json
{
  "id": 10,
  "station_id": 1,
  "platform_id": 5,
  "aoi_id": 3,
  "campaign_name": "SVB Summer Survey 2024",
  "campaign_type": "survey",
  "description": "Annual summer vegetation survey",
  "planned_start_datetime": "2024-07-15T08:00:00Z",
  "planned_end_datetime": "2024-07-15T12:00:00Z",
  "actual_start_datetime": "2024-07-15T08:15:00Z",
  "actual_end_datetime": "2024-07-15T11:45:00Z",
  "status": "completed",
  "flight_altitude_m": 120,
  "flight_speed_ms": 5,
  "overlap_frontal_pct": 80,
  "overlap_side_pct": 70,
  "gsd_cm": 3.5,
  "weather_conditions": "Clear sky, light wind",
  "wind_speed_ms": 2.5,
  "cloud_cover_pct": 5,
  "images_collected": 1250,
  "data_size_gb": 8.5,
  "quality_score": 95,
  "processing_status": "completed",
  "station_acronym": "SVB",
  "platform_name": "Svartberget UAV Platform",
  "aoi_name": "Forest Transect North",
  "product_count": 5
}
```

### Get Campaigns by Status

**Endpoint:** `GET /api/v3/campaigns/status/{status}`

```bash
curl -X GET https://<your-server>/api/v3/campaigns/status/in_progress \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Upcoming Campaigns

**Endpoint:** `GET /api/v3/campaigns/upcoming`

```bash
curl -X GET https://<your-server>/api/v3/campaigns/upcoming \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Campaigns Calendar

**Endpoint:** `GET /api/v3/campaigns/calendar`

**Query Parameters:**

| Parameter | Default | Description |
|-----------|---------|-------------|
| `year` | Current year | Calendar year |
| `month` | Current month | Calendar month (1-12) |
| `station` | - | Filter by station |

```bash
curl -X GET "https://<your-server>/api/v3/campaigns/calendar?year=2024&month=7" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**

```json
{
  "year": 2024,
  "month": 7,
  "startDate": "2024-07-01",
  "endDate": "2024-07-31",
  "totalCampaigns": 5,
  "calendar": {
    "2024-07-15": [
      {
        "id": 10,
        "name": "SVB Summer Survey 2024",
        "type": "survey",
        "status": "planned",
        "start": "2024-07-15T08:00:00Z",
        "end": "2024-07-15T12:00:00Z",
        "station": "SVB",
        "platform": "Svartberget UAV Platform",
        "platform_type": "uav"
      }
    ]
  },
  "campaigns": [...]
}
```

### Create Campaign

**Endpoint:** `POST /api/v3/campaigns`

```bash
curl -X POST https://<your-server>/api/v3/campaigns \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "station_id": 1,
    "platform_id": 5,
    "aoi_id": 3,
    "campaign_name": "SVB Autumn Survey 2024",
    "campaign_type": "survey",
    "description": "Autumn leaf senescence monitoring",
    "planned_start_datetime": "2024-09-20T08:00:00Z",
    "planned_end_datetime": "2024-09-20T14:00:00Z",
    "flight_altitude_m": 100,
    "overlap_frontal_pct": 80,
    "overlap_side_pct": 70,
    "gsd_cm": 3.0,
    "status": "planned"
  }'
```

**JavaScript:**

```javascript
const response = await fetch('https://<your-server>/api/v3/campaigns', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    station_id: 1,
    platform_id: 5,
    aoi_id: 3,
    campaign_name: 'SVB Autumn Survey 2024',
    campaign_type: 'survey',
    planned_start_datetime: '2024-09-20T08:00:00Z',
    planned_end_datetime: '2024-09-20T14:00:00Z',
    status: 'planned'
  })
});
```

### Update Campaign

**Endpoint:** `PUT /api/v3/campaigns/{id}`

```bash
curl -X PUT https://<your-server>/api/v3/campaigns/10 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress",
    "actual_start_datetime": "2024-09-20T08:15:00Z"
  }'
```

### Update Campaign Status

**Endpoint:** `PUT /api/v3/campaigns/{id}/status`

Shortcut endpoint for status-only updates.

```bash
curl -X PUT https://<your-server>/api/v3/campaigns/10/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "processing_status": "pending"
  }'
```

### Complete Campaign

**Endpoint:** `PUT /api/v3/campaigns/{id}/complete`

Complete a campaign with results data.

```bash
curl -X PUT https://<your-server>/api/v3/campaigns/10/complete \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "actual_end_datetime": "2024-09-20T13:45:00Z",
    "images_collected": 1500,
    "data_size_gb": 10.2,
    "quality_score": 92,
    "quality_notes": "Excellent conditions, minor wind gusts",
    "weather_conditions": "Partly cloudy",
    "cloud_cover_pct": 25,
    "processing_status": "pending"
  }'
```

### Delete Campaign

**Endpoint:** `DELETE /api/v3/campaigns/{id}`

Note: Cannot delete campaigns with associated products.

```bash
curl -X DELETE https://<your-server>/api/v3/campaigns/10 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Campaign Products

**Endpoint:** `GET /api/v3/campaigns/{id}/products`

```bash
curl -X GET https://<your-server>/api/v3/campaigns/10/products \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Product Catalog

Products represent derived data products from processing pipelines.

### Product Types

| Category | Types |
|----------|-------|
| Vegetation Indices | `ndvi`, `ndre`, `ndwi`, `evi`, `savi`, `gcc`, `rcc`, `bcc`, `grvi`, `vari` |
| Biophysical | `chlorophyll`, `lai`, `fcover`, `fapar` |
| Terrain | `orthomosaic`, `dsm`, `dtm`, `dem`, `chm` |
| Point Cloud | `point_cloud`, `las`, `laz` |
| Thermal | `thermal`, `lst` |
| Imagery | `true_color`, `false_color`, `cir` |
| Analysis | `classification`, `segmentation`, `change_detection` |
| Composite | `time_series`, `composite`, `mosaic` |
| Processing | `raw`, `calibrated`, `corrected` |

### Processing Levels

| Level | Description |
|-------|-------------|
| `raw` | Unprocessed data |
| `L0` | Raw with metadata |
| `L1` | Radiometrically corrected |
| `L2` | Geometrically corrected |
| `L3` | Derived products |
| `L4` | Model outputs |

### List All Products

**Endpoint:** `GET /api/v3/products`

**Query Parameters:**

| Parameter | Description |
|-----------|-------------|
| `station` | Filter by station |
| `platform` | Filter by platform ID |
| `type` | Filter by product type |
| `quality` | Filter by quality flag |
| `level` | Filter by processing level |
| `from_date` | Start date filter |
| `to_date` | End date filter |
| `status` | Filter by status (default: `available`) |

```bash
curl -X GET "https://<your-server>/api/v3/products?station=SVB&type=ndvi" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Product by ID

**Endpoint:** `GET /api/v3/products/{id}`

```bash
curl -X GET https://<your-server>/api/v3/products/100 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**

```json
{
  "id": 100,
  "station_id": 1,
  "platform_id": 5,
  "campaign_id": 10,
  "aoi_id": 3,
  "product_type": "ndvi",
  "product_name": "SVB_NDVI_20240715",
  "description": "NDVI derived from multispectral imagery",
  "source_platform_type": "uav",
  "source_date": "2024-07-15",
  "source_datetime": "2024-07-15T10:30:00Z",
  "bbox": [19.70, 64.20, 19.85, 64.30],
  "center_lat": 64.25,
  "center_lon": 19.775,
  "resolution_m": 0.035,
  "crs": "EPSG:32633",
  "file_path": "/data/products/SVB/2024/ndvi/SVB_NDVI_20240715.tif",
  "file_format": "GeoTIFF",
  "file_size_bytes": 125000000,
  "file_size_mb": 119.21,
  "min_value": -0.15,
  "max_value": 0.95,
  "mean_value": 0.65,
  "std_value": 0.12,
  "nodata_percent": 2.5,
  "quality_flag": "good",
  "cloud_cover_pct": 5,
  "processing_level": "L2",
  "algorithm_version": "ndvi-v2.1.0",
  "status": "available",
  "station_acronym": "SVB",
  "platform_name": "Svartberget UAV Platform",
  "campaign_name": "SVB Summer Survey 2024"
}
```

### Get Products by Type

**Endpoint:** `GET /api/v3/products/type/{type}`

```bash
curl -X GET https://<your-server>/api/v3/products/type/ndvi \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Product Types List

**Endpoint:** `GET /api/v3/products/types`

Returns all available product types with counts.

```bash
curl -X GET https://<your-server>/api/v3/products/types \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Product Statistics

**Endpoint:** `GET /api/v3/products/stats`

```bash
curl -X GET "https://<your-server>/api/v3/products/stats?station=SVB" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**

```json
{
  "total_products": 250,
  "by_type": [
    { "product_type": "ndvi", "count": 85 },
    { "product_type": "orthomosaic", "count": 60 }
  ],
  "by_platform_type": [
    { "source_platform_type": "uav", "count": 180 },
    { "source_platform_type": "satellite", "count": 70 }
  ],
  "by_quality": [
    { "quality_flag": "good", "count": 220 },
    { "quality_flag": "moderate", "count": 30 }
  ],
  "by_processing_level": [
    { "processing_level": "L2", "count": 200 },
    { "processing_level": "L3", "count": 50 }
  ]
}
```

### Get Products Timeline

**Endpoint:** `GET /api/v3/products/timeline`

**Query Parameters:**

| Parameter | Default | Description |
|-----------|---------|-------------|
| `year` | Current year | Timeline year |
| `station` | - | Filter by station |
| `type` | - | Filter by product type |

```bash
curl -X GET "https://<your-server>/api/v3/products/timeline?year=2024&station=SVB" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**

```json
{
  "year": 2024,
  "timeline": [
    { "month": "2024-05", "count": 15, "types": "ndvi,orthomosaic" },
    { "month": "2024-06", "count": 28, "types": "ndvi,lai,orthomosaic" },
    { "month": "2024-07", "count": 35, "types": "ndvi,ndre,dsm,orthomosaic" }
  ],
  "recent_products": [
    { "id": 100, "product_type": "ndvi", "product_name": "SVB_NDVI_20240715", "source_date": "2024-07-15" }
  ]
}
```

### Create Product

**Endpoint:** `POST /api/v3/products`

```bash
curl -X POST https://<your-server>/api/v3/products \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "station_id": 1,
    "platform_id": 5,
    "campaign_id": 10,
    "aoi_id": 3,
    "product_type": "ndvi",
    "product_name": "SVB_NDVI_20240720",
    "source_date": "2024-07-20",
    "resolution_m": 0.035,
    "center_lat": 64.25,
    "center_lon": 19.775,
    "bbox": [19.70, 64.20, 19.85, 64.30],
    "file_format": "GeoTIFF",
    "processing_level": "L2",
    "quality_flag": "good"
  }'
```

### Update Product

**Endpoint:** `PUT /api/v3/products/{id}`

```bash
curl -X PUT https://<your-server>/api/v3/products/100 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quality_flag": "good",
    "quality_notes": "Reprocessed with improved algorithm"
  }'
```

### Archive Product

**Endpoint:** `PUT /api/v3/products/{id}/archive`

```bash
curl -X PUT https://<your-server>/api/v3/products/100/archive \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Delete Product

**Endpoint:** `DELETE /api/v3/products/{id}`

```bash
curl -X DELETE https://<your-server>/api/v3/products/100 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Spatial Queries

The V3 API supports powerful spatial queries for AOIs and products.

### AOI Spatial Queries

#### Query by Bounding Box

**Endpoint:** `GET /api/v3/aois/spatial/bbox`

**Query Parameters:**

| Parameter | Alias | Description |
|-----------|-------|-------------|
| `minLon` | `west` | Minimum longitude |
| `minLat` | `south` | Minimum latitude |
| `maxLon` | `east` | Maximum longitude |
| `maxLat` | `north` | Maximum latitude |

```bash
curl -X GET "https://<your-server>/api/v3/aois/spatial/bbox?minLon=19.0&minLat=64.0&maxLon=20.0&maxLat=65.0" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**JavaScript:**

```javascript
const params = new URLSearchParams({
  minLon: '19.0',
  minLat: '64.0',
  maxLon: '20.0',
  maxLat: '65.0'
});

const response = await fetch(`https://<your-server>/api/v3/aois/spatial/bbox?${params}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

**Response:**

```json
{
  "data": [
    {
      "id": 1,
      "name": "Forest Transect North",
      "geometry_type": "Polygon",
      "centroid_lat": 64.25,
      "centroid_lon": 19.775,
      "area_m2": 250000,
      "station_acronym": "SVB"
    }
  ],
  "meta": {
    "query": "bbox",
    "bounds": { "minLon": 19.0, "minLat": 64.0, "maxLon": 20.0, "maxLat": 65.0 },
    "count": 1
  }
}
```

#### Query by Point (Point-in-Polygon)

**Endpoint:** `GET /api/v3/aois/spatial/point`

Find AOIs that contain a specific point.

```bash
curl -X GET "https://<your-server>/api/v3/aois/spatial/point?lon=19.775&lat=64.256" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Query by Intersection

**Endpoint:** `POST /api/v3/aois/spatial/intersects`

Find AOIs that intersect with a given geometry.

```bash
curl -X POST https://<your-server>/api/v3/aois/spatial/intersects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "Polygon",
    "coordinates": [[[19.7, 64.2], [19.8, 64.2], [19.8, 64.3], [19.7, 64.3], [19.7, 64.2]]]
  }'
```

#### Query Within Geometry

**Endpoint:** `POST /api/v3/aois/spatial/within`

Find AOIs completely contained within a geometry.

```bash
curl -X POST https://<your-server>/api/v3/aois/spatial/within \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "Polygon",
    "coordinates": [[[19.5, 64.0], [20.0, 64.0], [20.0, 64.5], [19.5, 64.5], [19.5, 64.0]]]
  }'
```

#### Query Nearest AOIs

**Endpoint:** `GET /api/v3/aois/spatial/nearest`

```bash
curl -X GET "https://<your-server>/api/v3/aois/spatial/nearest?lon=19.775&lat=64.256&limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**

```json
{
  "data": [
    {
      "id": 1,
      "name": "Forest Transect North",
      "centroid_lat": 64.25,
      "centroid_lon": 19.775,
      "distance_km": 0.67
    }
  ],
  "meta": {
    "query": "nearest",
    "point": { "lon": 19.775, "lat": 64.256 },
    "limit": 5,
    "count": 1
  }
}
```

### GeoJSON Export

#### Get All AOIs as GeoJSON

**Endpoint:** `GET /api/v3/aois/geojson`

```bash
curl -X GET "https://<your-server>/api/v3/aois/geojson?station=SVB" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": 1,
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[19.77, 64.25], [19.78, 64.25], [19.78, 64.26], [19.77, 64.26], [19.77, 64.25]]]
      },
      "properties": {
        "id": 1,
        "name": "Forest Transect North",
        "aoi_type": "flight_area",
        "area_m2": 250000,
        "station_acronym": "SVB"
      }
    }
  ],
  "properties": {
    "generated_at": "2024-07-15T12:00:00Z",
    "api_version": "3.0.0",
    "station": "SVB",
    "count": 1
  }
}
```

#### Get Single AOI as GeoJSON

**Endpoint:** `GET /api/v3/aois/{id}/geojson`

```bash
curl -X GET https://<your-server>/api/v3/aois/1/geojson \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Product Spatial Queries

#### Products by Bounding Box

**Endpoint:** `GET /api/v3/products/spatial/bbox`

```bash
curl -X GET "https://<your-server>/api/v3/products/spatial/bbox?minLon=19.0&minLat=64.0&maxLon=20.0&maxLat=65.0&type=ndvi" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Products by Point

**Endpoint:** `GET /api/v3/products/spatial/point`

```bash
curl -X GET "https://<your-server>/api/v3/products/spatial/point?lon=19.775&lat=64.256&radius=0.1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Product Coverage Statistics

**Endpoint:** `GET /api/v3/products/spatial/coverage`

```bash
curl -X GET "https://<your-server>/api/v3/products/spatial/coverage?station=SVB&year=2024" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**

```json
{
  "statistics": {
    "total_products": 250,
    "unique_types": 8,
    "unique_dates": 45,
    "unique_stations": 1,
    "date_range": {
      "earliest": "2024-05-01",
      "latest": "2024-07-20"
    },
    "avg_resolution_m": 0.035,
    "total_size_gb": 125.5
  },
  "by_type": [
    { "product_type": "ndvi", "count": 85, "avg_resolution": 0.035 }
  ],
  "by_platform_type": [
    { "source_platform_type": "uav", "count": 180 }
  ]
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 405 | Method Not Allowed |
| 409 | Conflict - Resource already exists or constraint violation |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

### Error Response Format

**Standard Error:**

```json
{
  "error": "Resource not found"
}
```

**Validation Error:**

```json
{
  "error": "Validation failed",
  "validation_errors": [
    "Platform name must match pattern {STATION}_{ECOSYSTEM}_PL##",
    "Latitude must be between -90 and 90"
  ]
}
```

### Common Errors

#### Authentication Errors

```json
{
  "error": "Unauthorized"
}
```

**Causes:**
- Missing Authorization header
- Invalid or expired token
- Malformed token

#### Permission Errors

```json
{
  "error": "Forbidden"
}
```

**Causes:**
- Station user accessing another station's data
- Read-only user attempting write operations
- Insufficient role for requested action

#### CSRF Errors

```json
{
  "error": "CSRF validation failed: Invalid origin"
}
```

**Causes:**
- Request from unknown origin
- Missing Origin/Referer headers on state-changing requests

### Error Handling Example

**JavaScript:**

```javascript
async function apiRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired - re-authenticate
        await refreshToken();
        return apiRequest(url, options);
      }

      if (response.status === 400 && data.validation_errors) {
        console.error('Validation errors:', data.validation_errors);
      }

      throw new Error(data.error || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}
```

---

## Rate Limiting

### Limits

| User Type | Requests/Minute | Requests/Hour |
|-----------|-----------------|---------------|
| Standard | 100 | 1000 |
| Admin | 200 | 2000 |

### Response Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1638360000
```

### Rate Limit Exceeded Response

```json
{
  "error": "Rate limit exceeded"
}
```

**HTTP Status:** 429

### Best Practices

1. **Implement exponential backoff** for retries
2. **Cache responses** when possible
3. **Use pagination** instead of fetching all data
4. **Batch requests** when creating multiple resources

---

## Security Features

### CSRF Protection

All state-changing requests (POST, PUT, DELETE) are protected against CSRF attacks.

**Requirements:**
- Valid `Origin` or `Referer` header
- Request must come from allowed origins

**Allowed Origins:**
- Production domain
- `localhost:*` (development)
- Worker URLs

### Input Sanitization

All input is sanitized before processing:

| Type | Sanitization |
|------|--------------|
| Strings | Trimmed, control characters removed, max length enforced |
| Integers | Parsed, bounded to min/max values |
| Floats | Parsed with decimal precision limits |
| Coordinates | Validated for lat/lon ranges |
| Identifiers | Alphanumeric with underscores only |
| Acronyms | Uppercase, 2-10 characters |
| JSON | Safely parsed with error handling |
| Enums | Validated against whitelists |
| Dates | ISO format validation |
| URLs | Protocol-restricted (http/https only) |

### JWT Security

- **Algorithm:** HMAC-SHA256 (prevents algorithm confusion attacks)
- **Expiration:** 24-hour tokens
- **Issuer Validation:** Tokens verified against `sites-spectral` issuer
- **Signature Verification:** Full cryptographic verification

---

## Health Check

**Endpoint:** `GET /api/health`

No authentication required.

```bash
curl -X GET https://<your-server>/api/health
```

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2024-07-15T12:00:00Z",
  "version": "9.0.0",
  "database": "connected",
  "architecture": "v3-api",
  "apiVersions": ["v3", "v1-legacy"],
  "defaultApiVersion": "v3",
  "features": [
    "v3-api-default",
    "campaigns",
    "products",
    "spatial-queries",
    "pagination",
    "aoi-support",
    "uav-platforms",
    "satellite-platforms",
    "mobile-platforms",
    "csrf-protection",
    "input-sanitization",
    "jwt-hmac-sha256"
  ]
}
```

---

## API Information

**Endpoint:** `GET /api/v3/info`

```bash
curl -X GET https://<your-server>/api/v3/info \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**

```json
{
  "name": "SITES Spectral Instruments API",
  "version": "3.0.0",
  "description": "Domain-based REST API for managing research station instruments, UAV/satellite platforms, and observation data",
  "documentation": "/api/v3/docs",
  "endpoints": {
    "platforms": {
      "base": "/api/v3/platforms",
      "types": "/api/v3/platforms/type/{type}",
      "uav": "/api/v3/platforms/{id}/uav",
      "satellite": "/api/v3/platforms/{id}/satellite"
    },
    "aois": {
      "base": "/api/v3/aois",
      "spatial": {
        "bbox": "/api/v3/aois/spatial/bbox?minLon=&minLat=&maxLon=&maxLat=",
        "point": "/api/v3/aois/spatial/point?lon=&lat=",
        "intersects": "/api/v3/aois/spatial/intersects"
      },
      "geojson": "/api/v3/aois/geojson"
    },
    "campaigns": {
      "base": "/api/v3/campaigns",
      "byStatus": "/api/v3/campaigns/status/{status}",
      "products": "/api/v3/campaigns/{id}/products"
    },
    "products": {
      "base": "/api/v3/products",
      "byType": "/api/v3/products/type/{type}",
      "spatial": "/api/v3/products/spatial/bbox"
    }
  },
  "platformTypes": ["fixed", "uav", "satellite", "mobile"],
  "authentication": "JWT Bearer token required in Authorization header"
}
```

---

## Changelog

### Version 9.0.0 (2025-12-02)

- **V3 API as Default**: V3 is now the default API version
- **Legacy V1 Deprecation**: V1 endpoints moved to `/api/v1/` prefix
- **Enhanced Security**: CSRF protection, input sanitization framework
- **Campaign Management**: Full lifecycle support
- **Product Catalog**: Comprehensive metadata tracking
- **Spatial Queries**: Bounding box, point, intersection queries
- **GeoJSON Support**: Native GeoJSON export for AOIs

---

**Document Version:** 1.0.0
**API Version:** V3
**System Version:** 9.0.0
