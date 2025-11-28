# Platform Type Update Guide

## Overview

Platform types determine how platforms are categorized and filtered in the station dashboard. The system supports four platform types:

| Type | Icon | Description |
|------|------|-------------|
| `fixed` | Tower | Stationary observation towers/masts (default) |
| `uav` | Helicopter | Unmanned Aerial Vehicles / Drones |
| `satellite` | Satellite | Satellite-based platforms |
| `mobile` | Mobile | Mobile/portable platforms |

## Current Behavior

- Tabs with **zero platforms** are automatically hidden
- Once platforms are registered with a specific type, the tab appears
- All platforms default to `fixed` if no type is specified

---

## Method 1: Update via Database (Direct SQL)

### View Current Platform Types

```bash
# Check all platforms and their types
CLOUDFLARE_ACCOUNT_ID="e5f93ed83288202d33cf9c7b18068f64" npx wrangler d1 execute spectral_stations_db --remote --command="SELECT id, normalized_name, display_name, platform_type FROM platforms ORDER BY normalized_name;"
```

### Update a Single Platform

```bash
# Update a specific platform to UAV type
CLOUDFLARE_ACCOUNT_ID="e5f93ed83288202d33cf9c7b18068f64" npx wrangler d1 execute spectral_stations_db --remote --command="UPDATE platforms SET platform_type = 'uav' WHERE normalized_name = 'SVB_FOR_PL01';"
```

### Update Multiple Platforms by Pattern

```bash
# Update all platforms containing 'UAV' in their name
CLOUDFLARE_ACCOUNT_ID="e5f93ed83288202d33cf9c7b18068f64" npx wrangler d1 execute spectral_stations_db --remote --command="UPDATE platforms SET platform_type = 'uav' WHERE normalized_name LIKE '%UAV%';"

# Update all platforms for a specific station to satellite
CLOUDFLARE_ACCOUNT_ID="e5f93ed83288202d33cf9c7b18068f64" npx wrangler d1 execute spectral_stations_db --remote --command="UPDATE platforms SET platform_type = 'satellite' WHERE normalized_name LIKE 'SVB_SAT%';"
```

### Batch Update Examples

```bash
# Set specific platforms as UAV
CLOUDFLARE_ACCOUNT_ID="e5f93ed83288202d33cf9c7b18068f64" npx wrangler d1 execute spectral_stations_db --remote --command="
UPDATE platforms
SET platform_type = 'uav'
WHERE normalized_name IN ('SVB_FOR_UAV01', 'ANS_AGR_UAV01', 'LON_FOR_UAV01');
"

# Set specific platforms as satellite
CLOUDFLARE_ACCOUNT_ID="e5f93ed83288202d33cf9c7b18068f64" npx wrangler d1 execute spectral_stations_db --remote --command="
UPDATE platforms
SET platform_type = 'satellite'
WHERE normalized_name IN ('SVB_SAT_PL01', 'ANS_SAT_PL01');
"
```

---

## Method 2: Create via Admin Dashboard (Recommended)

As of v8.0.4, the Admin Dashboard fully supports creating platforms of any type:

1. **Log in** as admin at https://sites.jobelab.com
2. **Navigate** to the station dashboard (e.g., `/station?station=SVB`)
3. **Click** the "+ Platform" button
4. **Fill in** the form:
   - **Display Name**: Descriptive name (e.g., "Mavic 3M UAV 01")
   - **Location Code**: Unique code (e.g., "UAV01", "SAT01", "MOB01")
   - **Ecosystem Code**: Select from dropdown (FOR, AGR, MIR, etc.) - *not used for UAV*
   - **Platform Type**: Select from dropdown:
     - Fixed Tower/Mast (default)
     - UAV / Drone (shows Drone Model dropdown)
     - Satellite
     - Mobile Platform
   - **Drone Model** (UAV only): Select drone model (M3M, P4M, M30T, M300)
   - **Normalized Name**: Auto-generated based on your selections
5. **Click** "Create Platform"

The normalized name updates automatically based on platform type:
- Fixed: `SVB_FOR_PL01` (station + ecosystem + location)
- UAV: `SVB_M3M_UAV01` (station + drone model + location) - **uses drone model, not ecosystem**
- Satellite: `SVB_SAT_PL01` (station + SAT + location)
- Mobile: `SVB_FOR_MOB01` (station + ecosystem + location)

---

## Method 3: Update via API (Admin Only)

### Using curl

```bash
# Get your auth token first by logging in
TOKEN="your_jwt_token_here"

# Update platform type via PATCH request
curl -X PATCH "https://sites.jobelab.com/api/platforms/{platform_id}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"platform_type": "uav"}'
```

### Using the Admin UI

1. Log in as admin at https://sites.jobelab.com
2. Navigate to the station dashboard
3. Click on a platform card to open the edit modal
4. Change the "Platform Type" field
5. Save changes

---

## Method 3: Create New Platform with Specific Type

### Via Database

```bash
CLOUDFLARE_ACCOUNT_ID="e5f93ed83288202d33cf9c7b18068f64" npx wrangler d1 execute spectral_stations_db --remote --command="
INSERT INTO platforms (
    station_id,
    normalized_name,
    display_name,
    location_code,
    platform_type,
    ecosystem_code,
    status
) VALUES (
    (SELECT id FROM stations WHERE acronym = 'SVB'),
    'SVB_FOR_UAV01',
    'Svartberget Forest UAV Platform 01',
    'UAV01',
    'uav',
    'FOR',
    'active'
);
"
```

### Via API

```bash
TOKEN="your_jwt_token_here"

curl -X POST "https://sites.jobelab.com/api/platforms" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "station_id": 1,
    "normalized_name": "SVB_FOR_UAV01",
    "display_name": "Svartberget Forest UAV Platform 01",
    "location_code": "UAV01",
    "platform_type": "uav",
    "ecosystem_code": "FOR",
    "status": "active"
  }'
```

---

## Verification

After updating, verify the changes:

```bash
# Check platform types by station
CLOUDFLARE_ACCOUNT_ID="e5f93ed83288202d33cf9c7b18068f64" npx wrangler d1 execute spectral_stations_db --remote --command="
SELECT
    s.acronym as station,
    p.normalized_name,
    p.platform_type,
    p.ecosystem_code
FROM platforms p
JOIN stations s ON p.station_id = s.id
ORDER BY s.acronym, p.platform_type, p.normalized_name;
"

# Count platforms by type
CLOUDFLARE_ACCOUNT_ID="e5f93ed83288202d33cf9c7b18068f64" npx wrangler d1 execute spectral_stations_db --remote --command="
SELECT
    platform_type,
    COUNT(*) as count
FROM platforms
GROUP BY platform_type
ORDER BY count DESC;
"
```

---

## Platform Type Tab Behavior

The station dashboard shows tabs based on available platforms:

```
[Fixed: 7] [UAV: 2] [Satellite: 1] [Mobile: 0] [All: 10]
           ^^^^^^^^  ^^^^^^^^^^^^^  ^^^^^^^^^^
           Shows if   Shows if      Hidden if
           count > 0  count > 0     count = 0
```

- **Hidden tabs**: Automatically hidden when count is 0
- **Visible tabs**: Appear when at least one platform of that type exists
- **All tab**: Always visible, shows total count

---

## Naming Conventions

### Platform Naming

Recommended naming patterns for different platform types:

| Type | Pattern | Example | Description |
|------|---------|---------|-------------|
| Fixed | `{STATION}_{ECO}_PL##` | `SVB_FOR_PL01` | Fixed observation tower/mast |
| UAV | `{STATION}_{DRONE}_UAV##` | `SVB_M3M_UAV01` | Drone/UAV platform (uses drone model, not ecosystem) |
| Satellite | `{STATION}_SAT_PL##` | `SVB_SAT_PL01` | Satellite-based platform |
| Mobile | `{STATION}_{ECO}_MOB##` | `SVB_FOR_MOB01` | Mobile/portable platform |

**Components:**
- `{STATION}` - Station acronym (SVB, ANS, LON, etc.)
- `{ECO}` - Ecosystem code (FOR, AGR, MIR, LAK, WET, GRA, etc.)
- `{DRONE}` - Drone model code (M3M, P4M, M30T, M300, etc.)
- `##` - Sequential number (01, 02, 03...)

### Supported Drone Models

| Code | Model | Description |
|------|-------|-------------|
| M3M | DJI Mavic 3 Multispectral | Compact multispectral drone |
| P4M | DJI Phantom 4 Multispectral | Legacy multispectral drone |
| M30T | DJI Matrice 30T | Thermal imaging drone |
| M300 | DJI Matrice 300 RTK | Heavy-lift RTK drone |
| OTHER | Other | Custom or other drone models |

### Instrument Naming

Instruments follow the pattern: `{PLATFORM}_{TYPE}##`

| Instrument Type | Code | Example | Description |
|-----------------|------|---------|-------------|
| Phenocam | PHE | `SVB_FOR_PL01_PHE01` | Digital phenocam |
| Multispectral | MS | `SVB_FOR_PL01_MS01` | Multispectral sensor |
| PAR Sensor | PAR | `SVB_FOR_PL01_PAR01` | Photosynthetically Active Radiation |
| NDVI Sensor | NDVI | `SVB_FOR_PL01_NDVI01` | NDVI sensor |
| PRI Sensor | PRI | `SVB_FOR_PL01_PRI01` | Photochemical Reflectance Index |
| Hyperspectral | HYP | `SVB_FOR_PL01_HYP01` | Hyperspectral sensor |

### Complete Examples

#### Fixed Tower with Phenocams and MS Sensors
```
Platform:   SVB_FOR_PL01          (Svartberget Forest Platform 01)
├── Phenocam:  SVB_FOR_PL01_PHE01  (Phenocam facing canopy)
├── Phenocam:  SVB_FOR_PL01_PHE02  (Phenocam facing understory)
└── MS Sensor: SVB_FOR_PL01_MS01   (Multispectral sensor)
```

#### UAV Platform with Multispectral (DJI Mavic 3M)
```
Platform:   SVB_M3M_UAV01         (Svartberget Mavic 3M UAV 01)
├── Phenocam:      SVB_M3M_UAV01_PHE01  (RGB camera)
└── MS Sensor:     SVB_M3M_UAV01_MS01   (4-band multispectral)
```

#### UAV Platform with Hyperspectral (DJI Phantom 4M)
```
Platform:   ANS_P4M_UAV01         (Abisko Phantom 4M UAV 01)
├── Phenocam:      ANS_P4M_UAV01_PHE01  (Nadir RGB camera)
└── Hyperspectral: ANS_P4M_UAV01_HYP01  (Hyperspectral imager)
```

#### Satellite Platform
```
Platform:   SVB_SAT_PL01          (Svartberget Satellite Platform 01)
├── NDVI Sensor: SVB_SAT_PL01_NDVI01  (Sentinel-2 NDVI)
└── MS Sensor:   SVB_SAT_PL01_MS01    (Sentinel-2 MSI)
```

#### Mobile Platform
```
Platform:   ANS_AGR_MOB01         (Abisko Agriculture Mobile 01)
├── Phenocam:  ANS_AGR_MOB01_PHE01  (Handheld phenocam)
└── PAR Sensor: ANS_AGR_MOB01_PAR01  (Portable PAR sensor)
```

---

## Quick Reference

```bash
# List all platform types in use
CLOUDFLARE_ACCOUNT_ID="e5f93ed83288202d33cf9c7b18068f64" npx wrangler d1 execute spectral_stations_db --remote --command="SELECT DISTINCT platform_type FROM platforms;"

# Update platform to UAV
CLOUDFLARE_ACCOUNT_ID="e5f93ed83288202d33cf9c7b18068f64" npx wrangler d1 execute spectral_stations_db --remote --command="UPDATE platforms SET platform_type = 'uav' WHERE id = {PLATFORM_ID};"

# Update platform to Satellite
CLOUDFLARE_ACCOUNT_ID="e5f93ed83288202d33cf9c7b18068f64" npx wrangler d1 execute spectral_stations_db --remote --command="UPDATE platforms SET platform_type = 'satellite' WHERE id = {PLATFORM_ID};"

# Update platform to Mobile
CLOUDFLARE_ACCOUNT_ID="e5f93ed83288202d33cf9c7b18068f64" npx wrangler d1 execute spectral_stations_db --remote --command="UPDATE platforms SET platform_type = 'mobile' WHERE id = {PLATFORM_ID};"

# Reset to Fixed (default)
CLOUDFLARE_ACCOUNT_ID="e5f93ed83288202d33cf9c7b18068f64" npx wrangler d1 execute spectral_stations_db --remote --command="UPDATE platforms SET platform_type = 'fixed' WHERE id = {PLATFORM_ID};"
```

---

## Support

For additional help:
- Check the station dashboard at https://sites.jobelab.com
- Review the CHANGELOG.md for recent updates
- Contact the SITES Spectral team
