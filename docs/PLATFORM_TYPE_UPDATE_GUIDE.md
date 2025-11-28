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

> [!success] Admin Dashboard v8.0.5+
> The Admin Dashboard now fully supports creating all platform types with intelligent auto-naming.

### Creating a Fixed Platform

1. **Log in** as admin at https://sites.jobelab.com
2. **Navigate** to station dashboard (e.g., `/station?station=SVB`)
3. **Click** "+ Platform"
4. **Select** Platform Type: `Fixed Tower/Mast`
5. **Fill in**:
   - Display Name: "Forest Platform 01"
   - Location Code: "PL01"
   - Ecosystem Code: "FOR"
6. **Normalized Name** auto-generates: `SVB_FOR_PL01`

### Creating a UAV Platform

1. **Select** Platform Type: `UAV / Drone`
2. **New dropdown appears**: Drone Model
3. **Select** Drone Model: `M3M - DJI Mavic 3 Multispectral`
4. **Fill in**:
   - Display Name: "Mavic 3M UAV 01"
   - Location Code: "UAV01"
5. **Normalized Name** auto-generates: `SVB_M3M_UAV01`

> [!tip] UAV platforms use drone model, not ecosystem
> Drones fly over multiple ecosystems, so the drone model is more meaningful.

### Creating a Satellite Platform

1. **Select** Platform Type: `Satellite`
2. **New dropdowns appear**: Space Agency, Satellite, Sensor
3. **Select**:
   - Space Agency: `ESA`
   - Satellite: `S2A - Sentinel-2A`
   - Sensor: `MSI - MultiSpectral Instrument`
4. **Fill in**: Display Name: "Sentinel-2A MSI"
5. **Normalized Name** auto-generates: `SVB_ESA_S2A_MSI`

> [!important] Satellite platforms don't need Location Code
> The normalized name is fully derived from Agency + Satellite + Sensor.

### Platform Type Summary

| Type | Required Fields | Auto-Generated Name |
|------|-----------------|---------------------|
| Fixed | Ecosystem, Location | `SVB_FOR_PL01` |
| UAV | Drone Model, Location | `SVB_M3M_UAV01` |
| Satellite | Agency, Satellite, Sensor | `SVB_ESA_S2A_MSI` |
| Mobile | Ecosystem, Location | `SVB_FOR_MOB01` |

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

> [!info] Naming Convention Overview
> Each platform type uses a specific naming pattern optimized for its use case.
> The normalized name is auto-generated based on your selections in the Admin Dashboard.

Recommended naming patterns for different platform types:

| Type | Pattern | Example | Description |
|------|---------|---------|-------------|
| Fixed | `{STATION}_{ECO}_PL##` | `SVB_FOR_PL01` | Fixed observation tower/mast |
| UAV | `{STATION}_{DRONE}_UAV##` | `SVB_M3M_UAV01` | Drone/UAV platform |
| Satellite | `{STATION}_{AGENCY}_{SAT}_{SENSOR}` | `SVB_ESA_S2A_MSI` | Satellite-based platform |
| Mobile | `{STATION}_{ECO}_MOB##` | `SVB_FOR_MOB01` | Mobile/portable platform |

**Components:**
- `{STATION}` - Station acronym (SVB, ANS, LON, etc.)
- `{ECO}` - Ecosystem code (FOR, AGR, MIR, LAK, WET, GRA, etc.)
- `{DRONE}` - Drone model code (M3M, P4M, M30T, M300, etc.)
- `{AGENCY}` - Space agency abbreviation (ESA, NASA, JAXA, etc.)
- `{SAT}` - Satellite abbreviation (S2A, S2B, L8, L9, etc.)
- `{SENSOR}` - Sensor abbreviation (MSI, OLI, OLCI, MODIS, etc.)
- `##` - Sequential number (01, 02, 03...)

---

## UAV Platform Naming

> [!tip] UAV Naming Convention
> UAV platforms use **drone model** instead of ecosystem code because drones fly over multiple ecosystems during missions.

### Pattern
```
{STATION}_{DRONE_MODEL}_UAV##
```

### Supported Drone Models

| Code | Model | Sensors | Use Case |
|------|-------|---------|----------|
| **M3M** | DJI Mavic 3 Multispectral | RGB + 4-band MS | Compact field surveys |
| **P4M** | DJI Phantom 4 Multispectral | RGB + 5-band MS | Legacy multispectral |
| **M30T** | DJI Matrice 30T | Wide + Zoom + Thermal | Inspection, thermal |
| **M300** | DJI Matrice 300 RTK | Customizable payloads | Heavy-lift, RTK precision |
| **OTHER** | Other Drone Model | Variable | Custom configurations |

### UAV Platform Examples

```
SVB_M3M_UAV01    → Svartberget, Mavic 3M, UAV Unit 01
ANS_P4M_UAV01    → Abisko, Phantom 4M, UAV Unit 01
LON_M3M_UAV02    → Lonnstorp, Mavic 3M, UAV Unit 02
GRI_M300_UAV01   → Grimsö, Matrice 300, UAV Unit 01
```

### UAV Instrument Naming

Instruments on UAV platforms follow: `{PLATFORM}_{TYPE}##`

```
SVB_M3M_UAV01_PHE01   → RGB Camera on Mavic 3M
SVB_M3M_UAV01_MS01    → Multispectral sensor on Mavic 3M
ANS_P4M_UAV01_HYP01   → Hyperspectral payload on Phantom 4M
```

---

## Satellite Platform Naming

> [!important] Satellite Naming Convention
> Satellite platforms use **Agency + Satellite + Sensor** instead of ecosystem/location because:
> - Satellites cover entire station areas (not ecosystem-specific)
> - The satellite and sensor uniquely identify the data source
> - Enables clear data provenance tracking

### Pattern
```
{STATION}_{AGENCY}_{SATELLITE}_{SENSOR}
```

### Supported Space Agencies

| Code | Agency | Primary Missions |
|------|--------|------------------|
| **ESA** | European Space Agency | Sentinel-1, 2, 3 |
| **NASA** | National Aeronautics and Space Administration | Landsat, MODIS, VIIRS |
| **JAXA** | Japan Aerospace Exploration Agency | ALOS, GCOM |
| **NOAA** | National Oceanic and Atmospheric Administration | GOES, JPSS |
| **USGS** | United States Geological Survey | Landsat (operations) |
| **CSA** | Canadian Space Agency | RADARSAT |

### Supported Satellites

| Code | Satellite | Agency | Launch | Sensors |
|------|-----------|--------|--------|---------|
| **S2A** | Sentinel-2A | ESA | 2015 | MSI |
| **S2B** | Sentinel-2B | ESA | 2017 | MSI |
| **S3A** | Sentinel-3A | ESA | 2016 | OLCI, SLSTR |
| **S3B** | Sentinel-3B | ESA | 2018 | OLCI, SLSTR |
| **L8** | Landsat 8 | NASA/USGS | 2013 | OLI, TIRS |
| **L9** | Landsat 9 | NASA/USGS | 2021 | OLI-2, TIRS-2 |
| **TERRA** | Terra (EOS AM-1) | NASA | 1999 | MODIS |
| **AQUA** | Aqua (EOS PM-1) | NASA | 2002 | MODIS |

### Supported Sensors

| Code | Sensor | Satellite | Bands | Resolution |
|------|--------|-----------|-------|------------|
| **MSI** | MultiSpectral Instrument | Sentinel-2 | 13 bands | 10-60m |
| **OLCI** | Ocean and Land Colour Instrument | Sentinel-3 | 21 bands | 300m |
| **SLSTR** | Sea and Land Surface Temperature Radiometer | Sentinel-3 | 11 bands | 500m-1km |
| **OLI** | Operational Land Imager | Landsat 8/9 | 9 bands | 15-30m |
| **TIRS** | Thermal Infrared Sensor | Landsat 8/9 | 2 bands | 100m |
| **MODIS** | Moderate Resolution Imaging Spectroradiometer | Terra/Aqua | 36 bands | 250m-1km |

### Satellite Platform Examples

```
SVB_ESA_S2A_MSI      → Svartberget, ESA, Sentinel-2A, MSI sensor
ANS_ESA_S2B_MSI      → Abisko, ESA, Sentinel-2B, MSI sensor
LON_NASA_L8_OLI      → Lonnstorp, NASA, Landsat 8, OLI sensor
SVB_ESA_S3A_OLCI     → Svartberget, ESA, Sentinel-3A, OLCI sensor
GRI_NASA_TERRA_MODIS → Grimsö, NASA, Terra, MODIS sensor
```

### Satellite Instrument Naming

> [!note] Satellite Instruments
> For satellite platforms, instruments typically represent derived products or specific band combinations rather than physical sensors.

```
SVB_ESA_S2A_MSI_NDVI01   → NDVI product from Sentinel-2A MSI
SVB_ESA_S2A_MSI_LAI01    → LAI product from Sentinel-2A MSI
ANS_NASA_L8_OLI_SR01     → Surface Reflectance from Landsat 8 OLI
```

---

## Quick Reference Card

> [!summary] Platform Naming Quick Reference
>
> | Type | Pattern | Example |
> |------|---------|---------|
> | **Fixed** | `STA_ECO_PL##` | `SVB_FOR_PL01` |
> | **UAV** | `STA_DRONE_UAV##` | `SVB_M3M_UAV01` |
> | **Satellite** | `STA_AGENCY_SAT_SENSOR` | `SVB_ESA_S2A_MSI` |
> | **Mobile** | `STA_ECO_MOB##` | `SVB_FOR_MOB01` |

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

#### Satellite Platform (Sentinel-2A)
```
Platform:   SVB_ESA_S2A_MSI              (Svartberget, ESA Sentinel-2A MSI)
├── NDVI Product: SVB_ESA_S2A_MSI_NDVI01  (NDVI derived from S2A)
└── LAI Product:  SVB_ESA_S2A_MSI_LAI01   (LAI derived from S2A)
```

#### Satellite Platform (Landsat 8)
```
Platform:   ANS_NASA_L8_OLI              (Abisko, NASA Landsat 8 OLI)
├── SR Product:   ANS_NASA_L8_OLI_SR01    (Surface Reflectance)
└── LST Product:  ANS_NASA_L8_OLI_LST01   (Land Surface Temperature)
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
