# Satellite Platform Guide

**Audience:** Station Administrators, Researchers
**Version:** 8.0.0-rc.1
**Last Updated:** 2025-11-27

## Overview

Satellite platforms in SITES Spectral represent spaceborne observation systems that provide regular coverage of SITES stations. Unlike fixed and UAV platforms, satellite platforms are not physically managed by SITES, but SITES Spectral tracks:

- **Coverage Areas**: AOIs defining which satellite products are relevant
- **Product Tracking**: Which satellite products/bands are monitored
- **Data Access**: Links to satellite data sources
- **Temporal Coverage**: Acquisition schedules and archive availability

This guide covers adding, configuring, and managing satellite platforms in SITES Spectral v8.0.0.

## Prerequisites

- **User Account**: Station User or Admin role
- **Satellite Knowledge**: Basic understanding of satellite missions (Sentinel-2, Landsat, etc.)
- **AOI Definition**: Station boundaries or areas of interest for satellite coverage
- **Data Access**: Knowledge of where to access satellite data (ESA, USGS, etc.)

## Satellite Platform Characteristics

### What Makes a Platform "Satellite"?

A satellite platform has these characteristics:

1. **Spaceborne**: Orbiting Earth, not ground-based or airborne
2. **Regular Revisit**: Fixed revisit schedule (e.g., Sentinel-2: 5 days)
3. **Large Coverage**: Covers areas from 10s to 100s of kilometers
4. **Multispectral/Hyperspectral**: Multiple spectral bands (typically 4-13 bands)
5. **Free/Open Data**: Most satellites used by SITES provide free data (Copernicus, USGS)
6. **External Data Source**: Data not collected by SITES (tracked only)

### Satellite Missions Supported

**Sentinel-2 (ESA Copernicus)**:
- **Revisit**: 5 days (2 satellites: 2A and 2B)
- **Resolution**: 10m (visible/NIR), 20m (red edge/SWIR), 60m (coastal/aerosol)
- **Bands**: 13 multispectral bands
- **Coverage**: Global land surfaces
- **Data Access**: Copernicus Open Access Hub
- **Primary Use**: Vegetation monitoring, land cover, agriculture

**Landsat 8/9 (USGS)**:
- **Revisit**: 16 days (8 days with both satellites)
- **Resolution**: 30m (multispectral), 15m (panchromatic), 100m (thermal)
- **Bands**: 11 bands (coastal, visible, NIR, SWIR, thermal)
- **Coverage**: Global land and coastal areas
- **Data Access**: USGS EarthExplorer, Google Earth Engine
- **Primary Use**: Land cover change, vegetation, thermal

**MODIS (NASA Terra/Aqua)**:
- **Revisit**: Daily
- **Resolution**: 250m (red/NIR), 500m (SWIR), 1000m (other bands)
- **Bands**: 36 spectral bands
- **Coverage**: Global
- **Data Access**: NASA LAADS DAAC
- **Primary Use**: Large-scale phenology, NDVI time series

**PlanetScope (Planet Labs)**:
- **Revisit**: Daily
- **Resolution**: 3m
- **Bands**: 4 (Blue, Green, Red, NIR) or 8 (PS2.SD)
- **Coverage**: Global (commercial)
- **Data Access**: Planet Explorer (subscription)
- **Primary Use**: High-resolution monitoring, frequent revisit

**Hyperspectral Satellites**:
- **PRISMA** (Italian Space Agency): 30m resolution, 230+ bands
- **EnMAP** (German Space Agency): 30m resolution, 242 bands
- **DESIS** (German Space Agency): 30m resolution, 235 bands

## Creating a Satellite Platform

### Step-by-Step: Adding a Satellite Platform

#### Step 1: Access the Add Platform Modal

1. **Navigate to your station dashboard**
2. **Click "Add Platform" button**
3. **Select "Satellite Platform"**

#### Step 2: Select Satellite Mission

**Platform Name**:
- **Format**: `{STATION}_{SATELLITE}_{PRODUCT}_PL##`
- **Examples**:
  - `SVB_S2_L2A_PL01` (Sentinel-2 Level 2A)
  - `LON_L8_L2_PL01` (Landsat 8 Level 2)
  - `ANS_MODIS_NDVI_PL01` (MODIS NDVI product)

**Satellite Mission Codes**:
| Code | Satellite | Example Platform Name |
|------|-----------|----------------------|
| S2 | Sentinel-2 | SVB_S2_L2A_PL01 |
| L8 | Landsat 8 | LON_L8_L2_PL01 |
| L9 | Landsat 9 | LON_L9_L2_PL01 |
| MODIS | MODIS Terra/Aqua | GRI_MODIS_NDVI_PL01 |
| PS | PlanetScope | SRC_PS_ORTHO_PL01 |
| PRISMA | PRISMA | ANS_PRISMA_L2_PL01 |

**Ecosystem Type**:
- **Primary Ecosystem**: Select ecosystem that dominates coverage area
- **Multiple Ecosystems**: If satellite covers multiple ecosystems, choose primary or use "MIX"
- **Examples**:
  - FOR for forested station
  - AGR for agricultural station
  - MIR if focusing on mire/wetland

**Note**: Satellite platforms often use ecosystem code "MIX" or the dominant ecosystem within the AOI.

#### Step 3: Define Coverage Area (AOI)

Satellite platforms require AOI definition for coverage tracking.

**AOI Types for Satellites**:

**Station Bounding Box**:
- Simple rectangle around station
- Use for comprehensive coverage
- Example: 10km x 10km box centered on station

**Custom Polygon**:
- Irregular shape matching study area
- Use for specific monitoring area
- Example: Watershed boundary, forest stand

**Satellite Scene/Tile Boundary**:
- Match satellite product tile boundaries
- Example: Sentinel-2 tile (100km x 100km)
- Ensures AOI aligns with product granules

**Multiple AOIs**:
- Can define multiple AOIs per satellite platform
- Example: Different AOIs for different analysis types

**Creating AOI for Satellite**:

1. **Click "Add AOI"** on satellite platform card
2. **Choose Method**:
   - **Draw Rectangle**: Click-and-drag to create bounding box
   - **Draw Polygon**: Click points to create custom shape
   - **Import GeoJSON**: Upload pre-defined AOI (e.g., from shapefile)
3. **Name AOI**: Descriptive name (e.g., "Svartberget Station Boundary")
4. **Set Properties**:
   - Color: Visual identification on map
   - Transparency: For overlapping AOIs
   - Description: AOI purpose and coverage

**Example AOI - Sentinel-2 Coverage**:

```yaml
AOI Name: SVB_S2_Catchment
Platform: SVB_S2_L2A_PL01
Type: Polygon
Coordinates:  # WGS84 (lat, lon)
  - [19.75, 64.24]
  - [19.80, 64.24]
  - [19.80, 64.28]
  - [19.75, 64.28]
  - [19.75, 64.24]  # Closed polygon
Area: ~25 km²
Description: Svartberget research catchment for Sentinel-2 time series
Sentinel-2 Tile: T34WES
```

**Sentinel-2 Tile Reference**:
- Find your station's Sentinel-2 tile: https://eatlas.org.au/data/uuid/f7468d15-12be-4e3f-a246-b2882a324f59
- Swedish stations typically in tiles: T33V-34W (various letters)

**Landsat Path/Row Reference**:
- Find your station's Landsat path/row: https://landsat.usgs.gov/landsat_acq
- Swedish stations examples:
  - Svartberget: Path 193, Row 14-15
  - Abisko: Path 195, Row 11
  - Lönnstorp: Path 195, Row 18

#### Step 4: Configure Product Tracking

**Product Level**:
- **L1C (Top of Atmosphere)**: Raw reflectance (not atmospherically corrected)
- **L2A (Bottom of Atmosphere)**: Atmospherically corrected surface reflectance
- **L2 (Landsat)**: Surface reflectance + derived products

**Recommendation**: Use L2A/L2 (atmospherically corrected) for vegetation monitoring.

**Bands to Track**:

**Sentinel-2 L2A Bands**:
```yaml
Tracked Bands:
  B2: Blue (490nm, 10m)
  B3: Green (560nm, 10m)
  B4: Red (665nm, 10m)
  B5: Red Edge 1 (705nm, 20m)
  B6: Red Edge 2 (740nm, 20m)
  B7: Red Edge 3 (783nm, 20m)
  B8: NIR (842nm, 10m)
  B8A: Narrow NIR (865nm, 20m)
  B11: SWIR 1 (1610nm, 20m)
  B12: SWIR 2 (2190nm, 20m)

Derived Products:
  - NDVI: (B8 - B4) / (B8 + B4)
  - EVI: 2.5 * ((B8 - B4) / (B8 + 6*B4 - 7.5*B2 + 1))
  - NDRE: (B8 - B5) / (B8 + B5)
  - NDWI: (B3 - B8) / (B3 + B8)
```

**Landsat 8/9 Bands**:
```yaml
Tracked Bands:
  B1: Coastal/Aerosol (443nm, 30m)
  B2: Blue (482nm, 30m)
  B3: Green (562nm, 30m)
  B4: Red (655nm, 30m)
  B5: NIR (865nm, 30m)
  B6: SWIR 1 (1609nm, 30m)
  B7: SWIR 2 (2201nm, 30m)
  B10: Thermal 1 (10895nm, 100m)
  B11: Thermal 2 (12005nm, 100m)

Derived Products:
  - NDVI: (B5 - B4) / (B5 + B4)
  - EVI: 2.5 * ((B5 - B4) / (B5 + 6*B4 - 7.5*B2 + 1))
  - NBR: (B5 - B7) / (B5 + B7)
  - LST: Land Surface Temperature from B10
```

#### Step 5: Add Data Access Information

**Data Source Links**:

Document where to access satellite data for this platform:

**Sentinel-2**:
```yaml
Data Sources:
  Primary: Copernicus Open Access Hub
  URL: https://scihub.copernicus.eu/
  API: Copernicus Data Space Ecosystem API
  Alternative: Google Earth Engine (ee.ImageCollection('COPERNICUS/S2_SR'))

Access Method:
  - Web Interface: Manual download via SciHub
  - API: Automated download via sentinelsat Python package
  - GEE: Cloud processing via Earth Engine

Authentication: Required (free ESA account)
```

**Landsat 8/9**:
```yaml
Data Sources:
  Primary: USGS EarthExplorer
  URL: https://earthexplorer.usgs.gov/
  API: USGS M2M API
  Alternative: Google Earth Engine (ee.ImageCollection('LANDSAT/LC08/C02/T1_L2'))

Access Method:
  - Web Interface: EarthExplorer manual download
  - API: landsatxplore Python package
  - GEE: Cloud processing via Earth Engine

Authentication: Required (free USGS account)
```

**Google Earth Engine**:
```yaml
Data Sources:
  Platform: Google Earth Engine
  URL: https://earthengine.google.com/
  Collections:
    - Sentinel-2: COPERNICUS/S2_SR (Surface Reflectance)
    - Landsat 8: LANDSAT/LC08/C02/T1_L2
    - MODIS: MODIS/006/MOD13Q1 (NDVI)

Access Method:
  - Code Editor: Interactive JavaScript
  - Python API: ee Python package
  - Cloud API: REST API

Authentication: Required (Google account + Earth Engine signup)
Processing: Cloud-based (no local download needed for analysis)
```

#### Step 6: Configure Temporal Coverage

**Acquisition Schedule**:
- **Sentinel-2**: Every 5 days (both satellites)
- **Landsat 8/9**: Every 8 days (both satellites), 16 days (single)
- **MODIS**: Daily
- **PlanetScope**: Daily

**Archive Availability**:
- **Sentinel-2**: June 2015 - present
- **Landsat 8**: April 2013 - present
- **Landsat 9**: October 2021 - present
- **MODIS Terra**: February 2000 - present

**Seasonal Considerations**:
- **Cloud Cover**: Higher in winter months (exclude or filter)
- **Snow Cover**: Affects vegetation indices (mask or note)
- **Solar Angle**: Low sun angle in winter affects reflectance
- **Growing Season**: Focus on May-September for vegetation monitoring

**Example Temporal Configuration**:

```yaml
Platform: SVB_S2_L2A_PL01
Satellite: Sentinel-2

Acquisition Schedule:
  Frequency: Every 5 days (nominal)
  Actual Frequency: Variable (cloud cover, processing delays)

Archive:
  Start Date: 2015-06-23 (Sentinel-2A launch)
  Coverage: 2015-present
  Total Scenes: ~730 (as of 2024, many with clouds)

Seasonal Strategy:
  Growing Season: May 1 - September 30
  Cloud Filter: <20% cloud cover over AOI
  Snow Mask: Apply in April and October
  Target Acquisitions: ~30 clear scenes per growing season

Quality Filters:
  - Cloud cover <20%
  - Snow probability <10%
  - Exclude winter months (November-March)
  - Check scene processing baseline (latest = best)
```

#### Step 7: Add Deployment Information

**Tracking Start Date**:
- When you began tracking this satellite for this station
- Not necessarily satellite launch date

**Purpose**:
- Research project using satellite data
- Long-term monitoring program
- Validation of fixed platform or UAV data

**Processing Workflow**:
- Document how satellite data is processed
- Tools used (SNAP, GEE, QGIS, custom scripts)
- Processing level and products generated

**Example**:

```yaml
Platform: SVB_S2_L2A_PL01

Tracking Information:
  Start Date: 2020-01-01
  Purpose: Long-term forest phenology monitoring
  Project: SITES Spectral Time Series (2020-2025)

Processing Workflow:
  Download: sentinelsat Python package
  Preprocessing: SNAP (cloud masking, resampling)
  Analysis: Python (rasterio, numpy, scikit-learn)
  Products: NDVI time series, phenology metrics

  Processing Scripts: https://<your-repo>/sentinel2-processing/

Output Products:
  - NDVI time series (CSV)
  - Phenology metrics (greenup, peak, senescence dates)
  - Annual max NDVI maps (GeoTIFF)

Storage:
  Raw Data: <data-server>/sentinel2/svartberget/l2a/
  Processed Products: <data-server>/sentinel2/svartberget/products/
  Archive: 2020-present (~500 GB)
```

#### Step 8: Create Satellite Platform

1. **Review all fields** for accuracy
2. **Verify AOI** appears correctly on map
3. **Check data access links** are valid
4. **Click "Create Platform"**
5. **Verify creation**:
   - Satellite platform card appears with satellite icon
   - AOI polygon visible on map (typically large area)
   - Product tracking details visible

### Example: Svartberget Sentinel-2 Platform

Complete example for SVB_S2_L2A_PL01:

```yaml
Platform Name: SVB_S2_L2A_PL01
Platform Type: Satellite Platform
Ecosystem: FOR (Forest)

Satellite Mission:
  Satellite: Sentinel-2 (2A and 2B)
  Product Level: L2A (Surface Reflectance)
  Resolution: 10m (visible/NIR), 20m (red edge/SWIR)
  Revisit: 5 days

Coverage Area:
  AOI Name: SVB_Catchment
  Sentinel-2 Tile: T34WES
  Area: 25 km²
  Bounding Box: [19.75, 64.24] to [19.80, 64.28]

Tracked Bands:
  - B2 (Blue, 10m)
  - B3 (Green, 10m)
  - B4 (Red, 10m)
  - B5-B7 (Red Edge, 20m)
  - B8 (NIR, 10m)
  - B11-B12 (SWIR, 20m)

Derived Products:
  - NDVI
  - EVI
  - NDRE (Red Edge NDVI)
  - NDWI (Water Index)

Data Access:
  Primary: Copernicus Open Access Hub
  API: sentinelsat Python package
  Alternative: Google Earth Engine

  Download Script: /scripts/download_sentinel2_svb.py
  Processing Pipeline: /scripts/process_sentinel2_ndvi.py

Temporal Coverage:
  Archive Start: 2015-06-23
  Tracking Start: 2020-01-01
  Growing Season: May 1 - September 30
  Cloud Filter: <20% cloud cover
  Expected Scenes/Year: ~25-30 (cloud-free)

Processing:
  Tools: SNAP, Python (rasterio, geopandas)
  Output Format: GeoTIFF (products), CSV (time series)
  CRS: SWEREF99 TM (EPSG:3006)

Storage:
  Location: <data-server>/satellite/svartberget/sentinel2/
  Size: ~350 GB (2020-2024)

Status: Active
Measurement Status: operational

Description: |
  Sentinel-2 Level 2A surface reflectance time series for Svartberget
  research catchment. Used for forest phenology monitoring, validation
  of tower-based phenocam observations, and landscape-scale NDVI trends.
  Focus on growing season (May-September) with strict cloud filtering.
```

## Managing Satellite Platforms

### Viewing Satellite Platform Details

**Platform Card**:
- Satellite icon indicates platform type
- Large AOI polygon on map (typically 10s of km²)
- Product tracking information
- Data access links

**AOI on Map**:
- Satellite AOIs are typically much larger than fixed platform or UAV AOIs
- May overlap with multiple fixed platforms
- Color-coded by satellite mission or ecosystem

### Editing Satellite Platforms

**Editable Fields**:
- AOI boundaries (if coverage area changes)
- Tracked bands/products (add or remove products)
- Data access links (if data source changes)
- Processing workflow documentation
- Status and measurement status

**Common Edits**:
- Update data access links (e.g., migrate to new API)
- Add new derived products to tracking list
- Adjust AOI to focus on specific study area
- Update processing workflow documentation
- Change status to "Inactive" if satellite mission ends

### Linking Satellite to Fixed Platforms

**Cross-Platform Validation**:
- Use satellite data to validate fixed platform observations
- Compare phenocam NDVI to Sentinel-2 NDVI
- Scale plot-level measurements to landscape

**Example Workflow**:

1. **Fixed Platform**: SVB_FOR_PL01 with phenocam (SVB_FOR_PL01_PHE01)
2. **Satellite Platform**: SVB_S2_L2A_PL01 covering same area
3. **Analysis**: Compare phenocam GCC to Sentinel-2 NDVI
4. **Validation**: Ensure phenocam trends match satellite trends

**Documentation**:

```yaml
Fixed Platform: SVB_FOR_PL01
  Phenocam: SVB_FOR_PL01_PHE01
  FOV: 45° south-facing view
  Coverage: ~0.01 km² (100m x 100m)

Satellite Platform: SVB_S2_L2A_PL01
  Coverage: 25 km² (entire catchment)
  Pixel Size: 10m x 10m

Validation Approach:
  - Extract Sentinel-2 NDVI for 3x3 pixel window around phenocam FOV
  - Calculate mean NDVI for window (~900 m²)
  - Compare to phenocam GCC (greenness index)
  - Expected correlation: r > 0.85

Reference:
  "Validation of Sentinel-2 NDVI with tower-based phenocam observations
   in boreal forests" - Internal Report 2024
```

## Satellite Data Products

### Common Products by Mission

#### Sentinel-2 Products

**Surface Reflectance (L2A)**:
- Atmospherically corrected
- 10m, 20m, 60m resolution (band-dependent)
- Scene Classification Layer (SCL): clouds, cloud shadows, snow, water
- Aerosol Optical Thickness (AOT)
- Water Vapor (WV)

**Derived Indices**:
- NDVI, EVI, SAVI (vegetation)
- NDWI, MNDWI (water)
- NBR (burn severity)
- NDSI (snow)

**Time Series Products**:
- Annual max NDVI
- Phenology metrics (greenup, peak, senescence)
- Trend analysis (Mann-Kendall, Sen's slope)

#### Landsat 8/9 Products

**Surface Reflectance (L2)**:
- Atmospherically corrected
- 30m resolution (multispectral)
- Cloud/shadow/snow masks (QA band)
- Surface temperature (resampled to 30m)

**Derived Products**:
- NDVI, EVI, SAVI
- NBR, dNBR (fire)
- NDWI, MNDWI (water)
- Land Surface Temperature (LST)
- Tasseled Cap transformation

**Time Series Products**:
- Landsat Analysis Ready Data (ARD)
- Fractional cover (vegetation, bare, water)
- Change detection (LandTrendr, CCDC)

#### MODIS Products

**Vegetation Indices (MOD13Q1/MYD13Q1)**:
- 16-day composite
- 250m resolution
- NDVI and EVI pre-calculated
- Quality flags and pixel reliability

**Land Surface Temperature (MOD11A1/MYD11A1)**:
- Daily
- 1km resolution
- Day and night temperature
- Quality control flags

**Phenology (MCD12Q2)**:
- Annual product
- Greenup, maturity, peak, senescence, dormancy
- Derived from NDVI/EVI time series

## Best Practices for Satellite Platforms

### AOI Definition

1. **Align with Satellite Grid**:
   - Sentinel-2: Use whole tiles or tile subsets
   - Landsat: Align with scene boundaries
   - Avoid splitting scenes unnecessarily

2. **Size Considerations**:
   - Minimum: 1 km² (for meaningful statistics)
   - Maximum: Full satellite scene (100 km² for Sentinel-2)
   - Typical: 10-50 km² for station coverage

3. **Multiple AOIs**:
   - Define different AOIs for different analyses
   - Example: Station boundary, catchment, ecosystem-specific

### Data Management

1. **Storage Planning**:
   - Sentinel-2 L2A: ~500 MB per scene
   - Landsat 8 L2: ~1 GB per scene
   - Plan for 30-50 scenes per year (growing season)
   - Consider cloud storage or on-demand processing (GEE)

2. **Cloud Filtering**:
   - Use scene-level cloud cover metadata (<20% recommended)
   - Apply pixel-level cloud masks (SCL for Sentinel-2, QA for Landsat)
   - Buffer cloud/shadow masks (e.g., 100m) to avoid edges

3. **Quality Control**:
   - Check processing baseline (Sentinel-2)
   - Use quality flags (all satellites)
   - Validate against ground truth (when available)
   - Document quality issues

### Temporal Analysis

1. **Time Series Construction**:
   - Collect all available clear scenes for AOI
   - Apply consistent cloud/snow masks
   - Gap-fill missing data (interpolation, climatology)
   - Smooth time series (Savitzky-Golay, Whittaker)

2. **Phenology Extraction**:
   - Fit models to time series (double logistic, Gaussian)
   - Extract key dates (greenup, peak, senescence)
   - Calculate integrated metrics (cumulative NDVI, growing season length)
   - Compare inter-annual variability

3. **Change Detection**:
   - Compare current year to baseline (e.g., 2015-2020 mean)
   - Identify anomalies (drought, disturbance)
   - Trend analysis (linear regression, Mann-Kendall)

### Integration with Other Platforms

1. **Fixed Platform Validation**:
   - Compare satellite indices to tower observations
   - Use tower data to calibrate satellite products
   - Identify discrepancies and investigate causes

2. **UAV Upscaling**:
   - Use UAV high-resolution data to validate satellite pixels
   - Understand sub-pixel heterogeneity
   - Develop scaling relationships

3. **Multi-Sensor Fusion**:
   - Combine Sentinel-2 (high spatial) with MODIS (high temporal)
   - Fuse Landsat and Sentinel-2 for increased frequency
   - Use radar (Sentinel-1) with optical for cloud gaps

## Troubleshooting

### Common Issues

| Problem | Cause | Solution |
|---------|-------|----------|
| No clear scenes available | High cloud cover | Expand temporal window, use radar data (Sentinel-1) |
| AOI splits multiple tiles | AOI crosses tile boundaries | Download both tiles, mosaic before analysis |
| Time series has gaps | Clouds, snow, or processing issues | Gap-fill with interpolation or use climatology |
| NDVI values seem wrong | Uncorrected clouds/shadows | Apply stricter cloud masking, buffer masks |
| Download fails | API timeout or authentication | Retry with smaller date range, check credentials |
| Coordinates don't match | Different CRS | Ensure AOI and satellite data use same CRS |
| Products not aligning | Different resolution/grid | Resample to common grid (e.g., 10m or 30m) |

### Data Quality Checks

**Visual Inspection**:
- Load RGB composite in QGIS or similar
- Check for clouds, cloud shadows, haze
- Verify AOI alignment with expected area

**Statistical Checks**:
- NDVI range should be realistic (e.g., 0.6-0.9 for forests)
- Check for outliers (values outside expected range)
- Compare to climatology or previous years

**Metadata Validation**:
- Verify acquisition date/time
- Check processing baseline (Sentinel-2)
- Confirm cloud cover estimate matches visual

## Related Documentation

### Platform Guides
- [Quick Start Guide](../user-guides/01-QUICK_START.md) - Basic platform creation
- [Fixed Platform Guide](./01-FIXED_PLATFORMS.md) - Tower platforms for ground truth
- [UAV Platform Guide](./02-UAV_PLATFORMS.md) - High-resolution validation

### Advanced Features
- [AOI Management Guide](../user-guides/AOI_MANAGEMENT.md) - Coverage area definition
- [Data Export Guide](../user-guides/DATA_EXPORT.md) - Exporting satellite metadata

### API Documentation
- [Platforms API](../api/PLATFORMS_API.md) - Programmatic platform management
- [AOI API](../api/AOI_API.md) - AOI management via API
- [V3 API Quick Reference](../api/01-V3_API_QUICK_REFERENCE.md) - API overview

### External Resources
- [Sentinel-2 User Guide](https://sentinels.copernicus.eu/web/sentinel/user-guides/sentinel-2-msi)
- [Landsat 8-9 Data Users Handbook](https://www.usgs.gov/landsat-missions/landsat-8-data-users-handbook)
- [Google Earth Engine Documentation](https://developers.google.com/earth-engine)
- [MODIS Land Products](https://modis.gsfc.nasa.gov/data/dataprod/)

## Summary

Satellite platforms enable landscape-scale monitoring and validation at SITES stations. Key takeaways:

- ✅ Define AOI aligned with satellite tile/scene boundaries
- ✅ Track relevant bands and derived products for your research
- ✅ Document data access methods and processing workflows
- ✅ Apply appropriate cloud and quality filters
- ✅ Use satellite data to complement fixed platform and UAV observations
- ✅ Consider storage requirements for time series analysis
- ✅ Leverage cloud platforms (GEE) for large-scale processing

With proper configuration, satellite platforms provide valuable long-term, landscape-scale context for SITES ecological monitoring.

---

**Document Version:** 1.0
**Last Updated:** 2025-11-27
**System Version:** 8.0.0-rc.1
