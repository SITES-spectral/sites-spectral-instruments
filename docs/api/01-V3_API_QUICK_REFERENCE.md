# V3 API Quick Reference

**Audience:** Developers, Data Scientists
**Version:** 8.0.0-rc.1 (API v3)
**Last Updated:** 2025-11-27

## Overview

The SITES Spectral V3 API provides programmatic access to stations, platforms, instruments, and AOIs. This guide provides quick examples and common use cases.

**Base URL**: `https://<your-server>/api`

**Authentication**: All endpoints require JWT authentication.

**Response Format**: JSON

## Authentication

### Login

Get a JWT token for API access:

**Endpoint**: `POST /api/login`

**Request**:
```http
POST /api/login
Content-Type: application/json

{
  "username": "your-username",
  "password": "your-password"
}
```

**Response**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "your-username",
    "role": "station",
    "station_id": 1
  }
}
```

**Using the Token**:

All subsequent requests must include the token in the `Authorization` header:

```http
GET /api/stations
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Expiration

Tokens expire after 24 hours. If you receive a 401 Unauthorized error, re-authenticate to get a new token.

## Quick Start Examples

### Example 1: Get All Stations

**cURL**:
```bash
curl -X GET https://<your-server>/api/stations \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Python (requests)**:
```python
import requests

API_BASE = "https://<your-server>/api"
TOKEN = "your-token-here"

headers = {"Authorization": f"Bearer {TOKEN}"}
response = requests.get(f"{API_BASE}/stations", headers=headers)
stations = response.json()

print(f"Found {len(stations['data'])} stations")
for station in stations['data']:
    print(f"  {station['acronym']}: {station['display_name']}")
```

**JavaScript (fetch)**:
```javascript
const API_BASE = "https://<your-server>/api";
const TOKEN = "your-token-here";

const headers = {
  "Authorization": `Bearer ${TOKEN}`,
  "Content-Type": "application/json"
};

async function getStations() {
  const response = await fetch(`${API_BASE}/stations`, { headers });
  const data = await response.json();

  console.log(`Found ${data.data.length} stations`);
  data.data.forEach(station => {
    console.log(`  ${station.acronym}: ${station.display_name}`);
  });
}
```

### Example 2: Get Station Details

**Request**:
```http
GET /api/stations/SVB
Authorization: Bearer YOUR_TOKEN
```

**Response**:
```json
{
  "success": true,
  "data": {
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
}
```

**Python Example**:
```python
station_acronym = "SVB"
response = requests.get(
    f"{API_BASE}/stations/{station_acronym}",
    headers=headers
)
station = response.json()['data']

print(f"{station['display_name']} ({station['acronym']})")
print(f"Location: {station['latitude']}, {station['longitude']}")
print(f"Platforms: {station['platforms_count']}")
print(f"Instruments: {station['instruments_count']}")
```

### Example 3: List Platforms for a Station

**Request**:
```http
GET /api/platforms?station=SVB
Authorization: Bearer YOUR_TOKEN
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "SVB_FOR_PL01",
      "display_name": "Svartberget Forest Platform 01",
      "type": "fixed",
      "ecosystem": "FOR",
      "latitude": 64.256,
      "longitude": 19.775,
      "height": 15.5,
      "status": "active",
      "instruments_count": 4
    },
    {
      "id": 5,
      "name": "SVB_FOR_PL05",
      "display_name": "Svartberget Forest UAV Platform",
      "type": "uav",
      "ecosystem": "FOR",
      "latitude": 64.256,
      "longitude": 19.775,
      "status": "active",
      "instruments_count": 2
    }
  ],
  "pagination": {
    "total": 2,
    "limit": 100,
    "offset": 0
  }
}
```

**Python Example**:
```python
response = requests.get(
    f"{API_BASE}/platforms",
    headers=headers,
    params={"station": "SVB", "type": "fixed"}
)
platforms = response.json()['data']

for platform in platforms:
    print(f"{platform['name']}: {platform['instruments_count']} instruments")
```

### Example 4: Get Platform with Instruments

**Request**:
```http
GET /api/platforms/1?include=instruments
Authorization: Bearer YOUR_TOKEN
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "SVB_FOR_PL01",
    "type": "fixed",
    "ecosystem": "FOR",
    "latitude": 64.256,
    "longitude": 19.775,
    "height": 15.5,
    "instruments": [
      {
        "id": 1,
        "name": "SVB_FOR_PL01_PHE01",
        "type": "phenocam",
        "status": "active",
        "height_above_ground": 12.0,
        "viewing_direction": "S"
      },
      {
        "id": 2,
        "name": "SVB_FOR_PL01_MS01",
        "type": "multispectral",
        "status": "active",
        "height_above_ground": 15.0,
        "viewing_direction": "NADIR"
      }
    ]
  }
}
```

### Example 5: Create a New Platform

**Request**:
```http
POST /api/platforms
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
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
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 15,
    "name": "SVB_FOR_PL06",
    "display_name": "Svartberget Forest Platform 06",
    "type": "fixed",
    "created_at": "2024-11-27T14:30:00Z"
  }
}
```

**Python Example**:
```python
new_platform = {
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
}

response = requests.post(
    f"{API_BASE}/platforms",
    headers=headers,
    json=new_platform
)

if response.json()['success']:
    platform_id = response.json()['data']['id']
    print(f"Created platform with ID: {platform_id}")
```

### Example 6: Add Instrument to Platform

**Request**:
```http
POST /api/instruments
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
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
    "interval_minutes": 20,
    "lens_type": "Fixed",
    "field_of_view": 45
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 42,
    "name": "SVB_FOR_PL06_PHE01",
    "instrument_type": "phenocam",
    "platform_id": 15,
    "created_at": "2024-11-27T14:35:00Z"
  }
}
```

### Example 7: Spatial Query - Platforms within Bounding Box

Find all platforms within a geographic area:

**Request**:
```http
GET /api/platforms?bounds=64.0,19.0,65.0,20.0
Authorization: Bearer YOUR_TOKEN
```

**Query Parameters**:
- `bounds`: `min_lat,min_lon,max_lat,max_lon`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "SVB_FOR_PL01",
      "latitude": 64.256,
      "longitude": 19.775,
      "type": "fixed"
    },
    {
      "id": 2,
      "name": "SVB_MIR_PL03",
      "latitude": 64.245,
      "longitude": 19.820,
      "type": "fixed"
    }
  ],
  "query": {
    "bounds": [64.0, 19.0, 65.0, 20.0],
    "matches": 2
  }
}
```

**Python Example**:
```python
# Define bounding box for northern Sweden
bounds = "64.0,19.0,65.0,20.0"

response = requests.get(
    f"{API_BASE}/platforms",
    headers=headers,
    params={"bounds": bounds}
)

platforms = response.json()['data']
print(f"Found {len(platforms)} platforms in bounding box")
```

### Example 8: Get AOIs for a Platform

**Request**:
```http
GET /api/platforms/5/aois
Authorization: Bearer YOUR_TOKEN
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "platform_id": 5,
      "name": "SVB_Forest_Transect_North",
      "type": "polygon",
      "coordinates": [
        [19.775, 64.256],
        [19.780, 64.256],
        [19.780, 64.260],
        [19.775, 64.260],
        [19.775, 64.256]
      ],
      "area_km2": 0.25,
      "color": "#28a745",
      "description": "Northern forest transect for UAV surveys"
    }
  ]
}
```

### Example 9: Export Station Data

Export all data for a station in CSV format:

**Request**:
```http
GET /api/export/station/SVB?format=csv
Authorization: Bearer YOUR_TOKEN
```

**Response**: CSV file download

**Python Example**:
```python
response = requests.get(
    f"{API_BASE}/export/station/SVB",
    headers=headers,
    params={"format": "csv"}
)

# Save to file
with open("SVB_export.csv", "wb") as f:
    f.write(response.content)

print("Exported station data to SVB_export.csv")
```

**Format Options**:
- `csv` (default)
- `tsv`
- `json`

### Example 10: Filtering and Pagination

Get instruments with multiple filters:

**Request**:
```http
GET /api/instruments?station=SVB&type=phenocam&status=active&limit=10&offset=0
Authorization: Bearer YOUR_TOKEN
```

**Query Parameters**:
- `station`: Filter by station acronym
- `type`: Filter by instrument type (phenocam, multispectral, etc.)
- `status`: Filter by status (active, inactive, etc.)
- `limit`: Max results per page (default: 100)
- `offset`: Pagination offset (default: 0)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "SVB_FOR_PL01_PHE01",
      "instrument_type": "phenocam",
      "status": "active"
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 10,
    "offset": 0,
    "hasMore": false
  }
}
```

**Python Example**:
```python
# Get all active phenocams at SVB (with pagination)
all_instruments = []
offset = 0
limit = 50

while True:
    response = requests.get(
        f"{API_BASE}/instruments",
        headers=headers,
        params={
            "station": "SVB",
            "type": "phenocam",
            "status": "active",
            "limit": limit,
            "offset": offset
        }
    )
    data = response.json()
    all_instruments.extend(data['data'])

    if not data['pagination']['hasMore']:
        break

    offset += limit

print(f"Total active phenocams at SVB: {len(all_instruments)}")
```

## API Endpoints Summary

### Stations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stations` | List all stations |
| GET | `/api/stations/:acronym` | Get station by acronym |
| POST | `/api/stations` | Create new station (admin only) |
| PUT | `/api/stations/:id` | Update station (admin only) |
| DELETE | `/api/stations/:id` | Delete station (admin only) |

### Platforms

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/platforms` | List platforms (supports filters) |
| GET | `/api/platforms/:id` | Get platform by ID |
| POST | `/api/platforms` | Create new platform |
| PUT | `/api/platforms/:id` | Update platform |
| DELETE | `/api/platforms/:id` | Delete platform (admin only) |
| GET | `/api/platforms/:id/aois` | Get AOIs for platform |

**Platform Query Filters**:
- `?station=SVB` - Filter by station
- `?type=fixed` - Filter by type (fixed, uav, satellite)
- `?ecosystem=FOR` - Filter by ecosystem
- `?status=active` - Filter by status
- `?bounds=lat1,lon1,lat2,lon2` - Spatial bounding box

### Instruments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/instruments` | List instruments (supports filters) |
| GET | `/api/instruments/:id` | Get instrument by ID |
| POST | `/api/instruments` | Create new instrument |
| PUT | `/api/instruments/:id` | Update instrument |
| DELETE | `/api/instruments/:id` | Delete instrument (admin only) |

**Instrument Query Filters**:
- `?station=SVB` - Filter by station
- `?platform_id=1` - Filter by platform
- `?type=phenocam` - Filter by type
- `?status=active` - Filter by status

### AOIs (Areas of Interest)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/aois` | List all AOIs |
| GET | `/api/aois/:id` | Get AOI by ID |
| POST | `/api/aois` | Create new AOI |
| PUT | `/api/aois/:id` | Update AOI |
| DELETE | `/api/aois/:id` | Delete AOI |
| GET | `/api/platforms/:id/aois` | Get AOIs for platform |

### Export

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/export/station/:acronym` | Export all station data |
| GET | `/api/export/platform/:id` | Export platform and instruments |

**Export Formats**: `?format=csv|tsv|json`

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/login` | Login and get JWT token |
| POST | `/api/logout` | Logout (invalidate token) |
| GET | `/api/user` | Get current user info |

## Common Filtering Patterns

### By Date Range

Filter platforms created within date range:

```http
GET /api/platforms?created_after=2024-01-01&created_before=2024-12-31
Authorization: Bearer YOUR_TOKEN
```

### By Geographic Bounds

Find all platforms within bounding box:

```http
GET /api/platforms?bounds=64.0,19.0,65.0,20.0
Authorization: Bearer YOUR_TOKEN
```

### Multiple Values

Filter by multiple types or statuses:

```http
GET /api/instruments?type=phenocam,multispectral&status=active,testing
Authorization: Bearer YOUR_TOKEN
```

### Sorting

Sort results by field:

```http
GET /api/platforms?sort=created_at:desc,name:asc
Authorization: Bearer YOUR_TOKEN
```

**Sort Format**: `field:direction` where direction is `asc` or `desc`

### Including Related Data

Include related entities in response:

```http
GET /api/platforms/1?include=instruments,aois
Authorization: Bearer YOUR_TOKEN
```

**Include Options**:
- `instruments` - Include platform's instruments
- `aois` - Include platform's AOIs
- `station` - Include parent station details

## Error Handling

### Error Response Format

All errors return this format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "name": "Platform name must match pattern {STATION}_{ECOSYSTEM}_PL##"
    }
  }
}
```

### Common Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | VALIDATION_ERROR | Invalid request data |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Entity not found |
| 409 | CONFLICT | Duplicate entry (e.g., name already exists) |
| 500 | SERVER_ERROR | Internal server error |

### Python Error Handling Example

```python
try:
    response = requests.post(
        f"{API_BASE}/platforms",
        headers=headers,
        json=new_platform
    )
    response.raise_for_status()  # Raise exception for 4xx/5xx

    data = response.json()
    if data['success']:
        print(f"Created platform: {data['data']['id']}")
    else:
        print(f"Error: {data['error']['message']}")

except requests.exceptions.HTTPError as e:
    print(f"HTTP Error: {e}")
except requests.exceptions.RequestException as e:
    print(f"Request failed: {e}")
```

## Rate Limiting

**Limits**:
- 100 requests per minute per user
- 1000 requests per hour per user

**Rate Limit Headers**:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1638360000
```

**Rate Limit Exceeded Response**:
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests",
    "retry_after": 60
  }
}
```

## Complete Python SDK Example

Here's a complete example showing common API operations:

```python
import requests
from typing import Dict, List, Optional

class SitesSpectralAPI:
    """Python SDK for SITES Spectral V3 API"""

    def __init__(self, base_url: str, username: str, password: str):
        self.base_url = base_url.rstrip('/')
        self.token = None
        self.headers = {"Content-Type": "application/json"}

        # Authenticate on initialization
        self.login(username, password)

    def login(self, username: str, password: str) -> Dict:
        """Authenticate and store token"""
        response = requests.post(
            f"{self.base_url}/api/login",
            json={"username": username, "password": password}
        )
        response.raise_for_status()

        data = response.json()
        self.token = data['token']
        self.headers['Authorization'] = f"Bearer {self.token}"

        return data['user']

    def get_stations(self) -> List[Dict]:
        """Get all stations"""
        response = requests.get(
            f"{self.base_url}/api/stations",
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()['data']

    def get_station(self, acronym: str) -> Dict:
        """Get station by acronym"""
        response = requests.get(
            f"{self.base_url}/api/stations/{acronym}",
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()['data']

    def get_platforms(self, station: Optional[str] = None,
                     platform_type: Optional[str] = None,
                     ecosystem: Optional[str] = None,
                     status: Optional[str] = None) -> List[Dict]:
        """Get platforms with optional filters"""
        params = {}
        if station: params['station'] = station
        if platform_type: params['type'] = platform_type
        if ecosystem: params['ecosystem'] = ecosystem
        if status: params['status'] = status

        response = requests.get(
            f"{self.base_url}/api/platforms",
            headers=self.headers,
            params=params
        )
        response.raise_for_status()
        return response.json()['data']

    def create_platform(self, platform_data: Dict) -> Dict:
        """Create a new platform"""
        response = requests.post(
            f"{self.base_url}/api/platforms",
            headers=self.headers,
            json=platform_data
        )
        response.raise_for_status()
        return response.json()['data']

    def get_instruments(self, station: Optional[str] = None,
                       platform_id: Optional[int] = None,
                       instrument_type: Optional[str] = None) -> List[Dict]:
        """Get instruments with optional filters"""
        params = {}
        if station: params['station'] = station
        if platform_id: params['platform_id'] = platform_id
        if instrument_type: params['type'] = instrument_type

        response = requests.get(
            f"{self.base_url}/api/instruments",
            headers=self.headers,
            params=params
        )
        response.raise_for_status()
        return response.json()['data']

    def create_instrument(self, instrument_data: Dict) -> Dict:
        """Create a new instrument"""
        response = requests.post(
            f"{self.base_url}/api/instruments",
            headers=self.headers,
            json=instrument_data
        )
        response.raise_for_status()
        return response.json()['data']

    def export_station(self, acronym: str, format: str = 'csv') -> bytes:
        """Export station data"""
        response = requests.get(
            f"{self.base_url}/api/export/station/{acronym}",
            headers=self.headers,
            params={"format": format}
        )
        response.raise_for_status()
        return response.content


# Usage example
if __name__ == "__main__":
    # Initialize API client
    api = SitesSpectralAPI(
        base_url="https://<your-server>",
        username="your-username",
        password="your-password"
    )

    # Get all stations
    stations = api.get_stations()
    print(f"Found {len(stations)} stations")

    # Get platforms for Svartberget
    svb_platforms = api.get_platforms(station="SVB", platform_type="fixed")
    print(f"SVB has {len(svb_platforms)} fixed platforms")

    # Create a new platform
    new_platform = api.create_platform({
        "station_id": 1,
        "name": "SVB_FOR_PL07",
        "type": "fixed",
        "ecosystem": "FOR",
        "latitude": 64.260,
        "longitude": 19.780,
        "height": 12.0,
        "status": "testing"
    })
    print(f"Created platform: {new_platform['name']}")

    # Export station data
    export_data = api.export_station("SVB", format="csv")
    with open("SVB_export.csv", "wb") as f:
        f.write(export_data)
    print("Exported SVB data to CSV")
```

## Related Documentation

- [Platforms API](./PLATFORMS_API.md) - Detailed platform endpoint documentation
- [Instruments API](./INSTRUMENTS_API.md) - Detailed instrument endpoint documentation
- [AOI API](./AOI_API.md) - AOI management endpoints
- [Authentication API](./AUTHENTICATION_API.md) - Authentication and user management
- [Export API](./EXPORT_API.md) - Data export endpoints

## Summary

The SITES Spectral V3 API provides comprehensive programmatic access to:

- ✅ Station, platform, and instrument metadata
- ✅ Spatial queries (bounding box, coordinates)
- ✅ Flexible filtering and pagination
- ✅ Data export in multiple formats
- ✅ RESTful design with JSON responses
- ✅ JWT-based authentication

For complete endpoint documentation, see the full API reference guides.

---

**Document Version:** 1.0
**Last Updated:** 2025-11-27
**API Version:** v3
**System Version:** 8.0.0-rc.1
