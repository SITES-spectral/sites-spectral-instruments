# API Documentation

SITES Spectral Stations & Instruments Management System API Reference

**Base URL**: https://sites.jobelab.com/api  
**Version**: 0.1.0-dev  
**Content-Type**: application/json

## 📊 Quick Stats

- **9 Stations** with geographic coordinates
- **83 Total Instruments** (21 phenocams + 62 multispectral sensors)
- **82 Active Instruments** (1 inactive)
- **6 Stations** with active instruments

## 🏛️ Stations API

### GET /api/stations
Get all research stations with instrument counts.

**Response Example**:
```json
{
  "stations": [
    {
      "id": 6,
      "display_name": "Svartberget Field Research Station",
      "acronym": "SVB",
      "country": "Sweden",
      "region": "northern",
      "latitude": 64.256342,
      "longitude": 19.771621,
      "instrument_count": 54,
      "active_instruments": 53,
      "phenocam_count": 5,
      "sensor_count": 49
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 9,
    "totalPages": 1
  }
}
```

**Query Parameters**:
- `region` - Filter by region (northern, southern, central, etc.)
- `search` - Search in station names, acronyms, descriptions
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)

### GET /api/stations/{id}
Get single station with detailed instrument list.

**Response**: Station object with `instruments` array containing both phenocams and multispectral sensors.

## 📷 Phenocams API

### GET /api/phenocams
Get all phenocam instruments with ROI data.

**Response Example**:
```json
{
  "phenocams": [
    {
      "id": 1,
      "station_id": 6,
      "canonical_id": "SVB_FOR_BL01_PHE01",
      "legacy_acronym": "SVB-FOR-B01",
      "ecosystem": "FOR",
      "location": "BL01",
      "status": "Active",
      "latitude": 64.25642138,
      "longitude": 19.77392779,
      "rois_data": "{\"ROI_00\": [[0,0],[1920,0],[1920,1080],[0,1080]]}",
      "station_name": "Svartberget Field Research Station",
      "station_acronym": "SVB"
    }
  ]
}
```

**Key Fields**:
- `rois_data` - JSON string containing ROI polygon coordinates
- `legacy_acronym` - Original naming convention for backward compatibility
- `ecosystem` - FOR (Forest), AGR (Agriculture), MIR (Mirror), etc.

## 🔬 Multispectral Sensors API

### GET /api/mspectral
Get all multispectral sensors with detailed specifications.

**Response Example**:
```json
{
  "mspectral_sensors": [
    {
      "id": 37,
      "station_id": 6,
      "canonical_id": "SVB_FOR_F01_MS01_1",
      "legacy_name": "SVB-FOR-F01",
      "sensor_type": "SPECTRAL",
      "ecosystem": "FOR",
      "location": "F01",
      "status": "Active",
      "latitude": 64.25611,
      "longitude": 19.7745,
      "elevation_m": 100,
      "brand": "SKYE",
      "model": "SKR1860",
      "center_wavelength_nm": 530.9,
      "bandwidth_nm": 11.5,
      "field_of_view_degrees": 25,
      "azimuth_degrees": 323,
      "degrees_from_nadir": 45,
      "measurement_type": "outgoing",
      "usage_type": "PRI",
      "parameter_names": "Dw_530_100m_Avg",
      "comments": "Removed 2022-10-31",
      "station_name": "Svartberget Field Research Station"
    }
  ]
}
```

**Key Fields**:
- `center_wavelength_nm` - Primary wavelength measurement
- `bandwidth_nm` - Spectral bandwidth  
- `measurement_type` - "incoming" or "outgoing" radiation
- `usage_type` - PRI, NDVI, PAR measurements
- `degrees_from_nadir` - 0=zenith, 90=horizon, 180=nadir

## 📈 Statistics API

### GET /api/stats/network
Get overall network statistics.

**Response**:
```json
{
  "total_stations": 9,
  "total_instruments": 83,
  "active_instruments": 82
}
```

### GET /api/stats/instruments
Get instrument status breakdown.

**Response**:
```json
{
  "active": 82,
  "inactive": 1
}
```

### GET /api/stats/stations/{id}
Get detailed statistics for a specific station.

## 🔍 Reference Data API

### GET /api/reference/ecosystems
Get ecosystem types.

**Response**: Array of ecosystem objects with codes and names.

### GET /api/reference/instrument-types
Get instrument type definitions.

### GET /api/reference/platform-types
Get platform mounting type definitions.

## 📋 Activity API

### GET /api/activity
Get recent system activity feed.

**Query Parameters**:
- `limit` - Number of activities to return (default: 10)

## ✅ Health Check API

### GET /api/health
System health and status check.

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2025-09-10T14:30:00.000Z",
  "service": "SITES Spectral Stations & Instruments"
}
```

## 🔍 Search API

### GET /api/search (Placeholder)
Search functionality - coming soon.

## 📤 Export API

### GET /api/export (Placeholder)  
Data export functionality - coming soon.

**Planned Formats**: CSV, YAML, JSON

## 🚫 Error Responses

All endpoints return consistent error format:

```json
{
  "error": "Error type",
  "message": "Detailed error description"
}
```

**Common HTTP Status Codes**:
- `200` - Success
- `400` - Bad Request (validation error)
- `404` - Not Found
- `405` - Method Not Allowed
- `500` - Internal Server Error

## 🔒 Rate Limiting

Requests are rate limited through Cloudflare's built-in protection. No authentication required for read operations.

## 📊 Data Sources

- **Stations**: Configured in database with geographic coordinates
- **Phenocams**: Loaded from `stations.yaml` with ROI polygon data
- **Multispectral Sensors**: Combined data from `stations_mspectral.yaml` and CSV metadata files
- **Technical Specs**: Detailed sensor specifications from Svartberget CSV metadata

## 🔄 Updates

This API is actively developed. See [CHANGELOG.md](CHANGELOG.md) for version history and updates.

---

**Last Updated**: 2025-09-10  
**API Version**: 0.1.0-dev  
**Live Endpoint**: https://sites.jobelab.com/api/health