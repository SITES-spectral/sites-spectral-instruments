# UAV Platform Guide

**Audience:** Station Administrators, UAV Operators
**Version:** 8.0.0-rc.1
**Last Updated:** 2025-11-27

## Overview

UAV (Unmanned Aerial Vehicle) platforms represent mobile aerial observation systems used at SITES stations. Unlike fixed platforms, UAV platforms are mobile and collect data through scheduled flights over defined Areas of Interest (AOIs).

This guide covers creating, configuring, and managing UAV platforms in SITES Spectral v8.0.0.

## Prerequisites

- **User Account**: Station User or Admin role
- **UAV Information**: Drone model, sensor payload, flight specifications
- **Flight Area**: Defined area where UAV operates (AOI)
- **Regulatory Compliance**: UAV operation permits and approvals

## UAV Platform Characteristics

### What Makes a Platform "UAV"?

A UAV platform has these characteristics:

1. **Mobile**: Moves during data collection (unlike fixed platforms)
2. **Area Coverage**: Covers defined spatial area (AOI)
3. **Flight-Based**: Data collected during flights, not continuously
4. **Sensor Payload**: Carries one or more sensors
5. **Scheduled Operations**: Flights occur on defined schedule

### UAV Types in SITES

**Multirotor UAVs**:
- Quadcopter, hexacopter, octocopter
- Vertical takeoff and landing (VTOL)
- Typical flight time: 15-30 minutes
- Best for: Small areas (<1 km²), precision mapping
- Examples: DJI Phantom, DJI Matrice, custom builds

**Fixed-Wing UAVs**:
- Airplane-style platform
- Requires runway or catapult launch
- Typical flight time: 45-90 minutes
- Best for: Large areas (>1 km²), surveys
- Examples: SenseFly eBee, Parrot Disco-Pro AG

**Hybrid UAVs**:
- Combines multirotor and fixed-wing
- VTOL with forward flight capability
- Typical flight time: 30-60 minutes
- Best for: Medium areas (1-5 km²), efficiency
- Examples: Quantum Trinity, WingtraOne

## Creating a UAV Platform

### Step-by-Step: Adding a UAV Platform

#### Step 1: Access the Add Platform Modal

1. **Navigate to your station dashboard**
2. **Click "Add Platform" button**
3. **Select "UAV Platform"**

#### Step 2: Enter UAV Details

**Required Fields**:

**Platform Name**:
- **Format**: `{STATION}_{ECOSYSTEM}_PL##`
- **Example**: `SVB_FOR_PL05_UAV`
- **Note**: Some stations add `_UAV` suffix for clarity, but not required
- **Sequential**: Number UAV platforms sequentially after fixed platforms

**Ecosystem Type**:
- **Primary Ecosystem**: Select ecosystem where UAV primarily operates
- **Note**: UAV may fly over multiple ecosystems; choose primary
- **Common for UAVs**:
  - FOR (Forest): Forest canopy mapping
  - AGR (Arable Land): Crop monitoring
  - WET (Wetland): Wetland vegetation mapping
  - GRA (Grassland): Grassland biomass estimation

**Base Coordinates**:
- **Latitude/Longitude**: Takeoff/landing location or flight base
- **Not Flight Path**: Base location, not flight area (use AOI for flight area)
- **Examples**:
  - Field station location
  - Designated UAV launch site
  - Research station coordinates

#### Step 3: Configure UAV Specifications

**UAV Details**:

**UAV Model**:
- **Manufacturer and Model**: DJI Matrice 300 RTK, SenseFly eBee X, etc.
- **Type**: Multirotor, Fixed-Wing, Hybrid
- **Custom Builds**: Document builder and specifications

**Flight Characteristics**:
- **Max Flight Time**: Minutes (e.g., 25 for typical quadcopter)
- **Max Flight Altitude**: Meters AGL (above ground level)
- **Cruise Speed**: m/s or km/h
- **Max Range**: Kilometers from base

**Payload Capacity**:
- **Max Payload**: Kilograms
- **Current Payload Weight**: Actual weight of mounted sensors

**Example UAV Specifications**:

```yaml
UAV Model: DJI Matrice 300 RTK
Type: Multirotor (Quadcopter)
Max Flight Time: 55 minutes (no payload), 30 minutes (full payload)
Max Flight Altitude: 120 m AGL (regulatory limit)
Cruise Speed: 17 m/s
Max Range: 15 km (with RTH reserve)
Max Payload: 2.7 kg
Typical Payload: 1.2 kg (multispectral camera + GPS)
```

#### Step 4: Define Sensor Payload

UAV platforms carry instruments as payload. Add instruments to UAV platform:

**Supported Instrument Types for UAVs**:
- **Phenocam**: RGB camera (consumer or professional)
- **Multispectral**: 4-10 band multispectral sensor
- **Hyperspectral**: Line-scanning or snapshot hyperspectral
- **Thermal**: Thermal infrared camera

**Payload Configuration Example**:

```yaml
Platform: SVB_FOR_PL05

Instrument 1: SVB_FOR_PL05_MS01
  Type: Multispectral
  Model: MicaSense RedEdge-MX
  Bands: 5 (Blue, Green, Red, Red Edge, NIR)
  Resolution: 3.2 MP per band
  Weight: 232g

Instrument 2: SVB_FOR_PL05_PHE01
  Type: Phenocam
  Model: Sony A7R IV
  Resolution: 61 MP
  Weight: 665g (body + lens)

Total Payload Weight: 1.1 kg (including mounting)
```

**Important**: UAV instruments don't have fixed height/orientation like fixed platforms. These vary per flight.

#### Step 5: Define Flight Area (AOI)

**Area of Interest (AOI)**:
- UAV flight area defined as polygon on map
- Can have multiple AOIs per UAV platform
- AOI defines spatial coverage for data products

**Creating AOI**:
1. Click "Add AOI" on UAV platform card
2. Choose method:
   - **Draw on Map**: Interactive polygon drawing
   - **Import GeoJSON**: Upload pre-defined AOI
   - **Bounding Box**: Define by corner coordinates
3. Name AOI (e.g., "Forest Transect A", "Agricultural Field 1")
4. Set AOI color and transparency

**AOI Example**:

```yaml
AOI Name: SVB_Forest_Transect_North
Platform: SVB_FOR_PL05
Type: Polygon
Coordinates:
  - [19.775, 64.256]
  - [19.780, 64.256]
  - [19.780, 64.260]
  - [19.775, 64.260]
  - [19.775, 64.256]  # Closed polygon
Area: ~0.25 km²
Purpose: Boreal forest phenology transect
Flight Altitude: 80m AGL
Ground Sample Distance: ~3cm
```

**See**: [AOI Management Guide](../user-guides/AOI_MANAGEMENT.md) for detailed AOI creation instructions.

#### Step 6: Configure Flight Planning

**Flight Schedule**:
- **Frequency**: Weekly, Bi-weekly, Monthly, On-Demand
- **Season**: Growing season only, Year-round, Campaign-specific
- **Time of Day**: Typically solar noon ±2 hours for optimal lighting

**Flight Parameters**:
- **Flight Altitude**: Meters AGL
  - Lower = higher resolution, smaller coverage
  - Higher = lower resolution, larger coverage
  - Typical: 50-120m AGL
- **Ground Sample Distance (GSD)**: cm/pixel
  - Calculated from altitude and sensor specifications
  - Target GSD determines flight altitude
- **Overlap**: Front overlap and side overlap (%)
  - Typical: 75% front, 65% side for photogrammetry

**Example Flight Plan**:

```yaml
AOI: SVB_Forest_Transect_North
Flight Altitude: 80m AGL
Ground Sample Distance: 3.2 cm/pixel (multispectral), 1.2 cm/pixel (RGB)
Front Overlap: 80%
Side Overlap: 70%
Flight Lines: 12
Estimated Flight Time: 18 minutes
Images Captured: ~450 (multispectral), ~350 (RGB)
Flight Speed: 5 m/s
Schedule: Every 2 weeks during growing season (May-September)
Time Window: 11:00-13:00 local time (solar noon ±1h)
```

#### Step 7: Add Deployment Information

**Deployment Details**:
- **First Flight Date**: When UAV operations began at this platform
- **Operator**: Primary UAV pilot
- **Regulatory Approval**: Permit numbers, airspace clearances
- **Insurance**: UAV insurance policy information

**Maintenance Schedule**:
- **Pre-Flight Checks**: Checklist reference
- **Post-Flight Procedures**: Download, battery care
- **Sensor Calibration**: Calibration panel usage, schedule
- **Battery Maintenance**: Charging, storage, replacement schedule

#### Step 8: Create UAV Platform

1. **Review all fields** for accuracy
2. **Verify AOI** appears correctly on map
3. **Check sensor payload** details
4. **Click "Create Platform"**
5. **Verify creation**:
   - UAV platform card appears with UAV icon
   - AOI polygon visible on map
   - Instruments listed in platform card

### Example: Svartberget Forest UAV Platform

Complete example for SVB_FOR_PL05:

```yaml
Platform Name: SVB_FOR_PL05
Platform Type: UAV Platform
Ecosystem: FOR (Forest)

UAV Specifications:
  Model: DJI Matrice 300 RTK
  Type: Multirotor (Quadcopter)
  Max Flight Time: 30 minutes (with payload)
  Max Altitude: 120m AGL
  Cruise Speed: 15 m/s
  Max Payload: 2.7 kg

Base Location:
  Latitude: 64.256
  Longitude: 19.775
  Elevation: 235m
  Description: Field station helipad

Sensor Payload:
  Total Weight: 1.1 kg
  Instruments:
    - SVB_FOR_PL05_MS01: MicaSense RedEdge-MX (232g)
    - SVB_FOR_PL05_PHE01: Sony A7R IV (665g)

Flight Areas:
  AOI_01: SVB_Forest_Transect_North (0.25 km²)
  AOI_02: SVB_Forest_Transect_South (0.30 km²)
  AOI_03: SVB_Mire_Monitoring (0.15 km²)

Flight Schedule:
  Frequency: Bi-weekly
  Season: May 1 - September 30
  Time: 11:00-13:00 local time
  Altitude: 80m AGL

Deployment:
  First Flight: 2021-05-15
  Operator: Research Technician Name
  Permit: Swedish Transport Agency UAV-2021-1234
  Insurance: UAV Liability Insurance Policy #ABC123

Status: Active
Measurement Status: operational
```

## Managing UAV Platforms

### Viewing UAV Platform Details

**Platform Card**:
- UAV icon indicates platform type
- Shows base location on map
- AOIs displayed as colored polygons
- Instruments grouped by type (Phenocam, Multispectral, etc.)

**Map View**:
- Base location marker (typically station or launch site)
- AOI polygons (flight areas)
- Click AOI to see details (name, area, last flight)

### Editing UAV Platforms

**Editable Fields**:
- UAV specifications (if model upgraded)
- Base coordinates (if launch site changes)
- AOIs (add, remove, modify flight areas)
- Flight schedule
- Status and measurement status

**Cannot Edit**:
- Platform name (use this as permanent ID)
- Station assignment

**Common Edits**:
- Update flight schedule for seasonal operations
- Add new AOIs for expanded monitoring
- Update sensor payload when cameras change
- Adjust flight altitude based on GSD requirements

### Managing Flight Data

**Data Storage**:
- Flight data typically stored externally (not in SITES Spectral DB)
- SITES Spectral tracks:
  - Flight schedule
  - AOI coverage
  - Sensor specifications
  - Data access links

**Linking to Flight Data**:
- Add data repository links to platform or instrument
- Reference external storage (e.g., data portal, file server)
- Document data processing pipeline

**Example Data Links**:

```yaml
Platform: SVB_FOR_PL05

Data Repository: https://<your-data-server>/uav/svartberget/pl05/
Data Format: GeoTIFF (orthomosaics), LAZ (point clouds)

Processing Pipeline:
  Raw Images → Agisoft Metashape → Orthomosaics
  Output GSD: 3cm (multispectral), 1.2cm (RGB)
  CRS: SWEREF99 TM (EPSG:3006)

Products:
  - Orthomosaic RGB (GeoTIFF)
  - Orthomosaic Multispectral (GeoTIFF, 5 bands)
  - Digital Surface Model (DSM)
  - Vegetation Indices (NDVI, NDRE, GNDVI)

Access: Restricted to SITES researchers
DOI: 10.xxxx/sites.svb.uav.2024
```

## UAV Instruments

### Adding Instruments to UAV Platform

UAV instruments differ from fixed platform instruments:

**No Fixed Height/Orientation**:
- Height = flight altitude (varies per flight)
- Orientation = nadir (typically) or oblique (if relevant)
- Document typical values in instrument description

**Sensor-Specific Details**:
- Focal length
- Sensor size
- Image resolution
- Spectral bands

### Common UAV Instrument Types

#### Phenocam (RGB Camera)

**Consumer UAV Cameras**:
```yaml
Instrument: SVB_FOR_PL05_PHE01
Type: Phenocam
Model: DJI Zenmuse X7
Sensor: APS-C CMOS 24MP
Lens: 24mm f/2.8
ISO Range: 100-25600
Shutter Speed: 1/8000 - 60s
Image Format: DNG (RAW) + JPEG
Weight: 628g
```

**Professional Survey Cameras**:
```yaml
Instrument: SVB_FOR_PL05_PHE02
Type: Phenocam
Model: Sony A7R IV
Sensor: Full-frame 61MP
Lens: 35mm f/2.8
ISO Range: 100-32000
Shutter Speed: 1/8000 - 30s
Image Format: ARW (RAW) + JPEG
Weight: 665g (body + lens)
GPS: External RTK GPS
```

#### Multispectral Sensor

**MicaSense RedEdge-MX**:
```yaml
Instrument: SVB_FOR_PL05_MS01
Type: Multispectral
Model: MicaSense RedEdge-MX
Bands: 5
  - Blue: 475nm (20nm bandwidth)
  - Green: 560nm (20nm bandwidth)
  - Red: 668nm (10nm bandwidth)
  - Red Edge: 717nm (10nm bandwidth)
  - NIR: 840nm (40nm bandwidth)
Resolution: 3.2 MP per band
Ground Sample Distance: 8.2cm per pixel at 120m AGL
Image Format: TIFF (16-bit)
Downwelling Light Sensor: Yes (DLS2)
Weight: 232g
```

**Parrot Sequoia+**:
```yaml
Instrument: LON_AGR_PL03_MS01
Type: Multispectral
Model: Parrot Sequoia+
Bands: 4
  - Green: 550nm (40nm bandwidth)
  - Red: 660nm (40nm bandwidth)
  - Red Edge: 735nm (10nm bandwidth)
  - NIR: 790nm (40nm bandwidth)
Resolution: 1.2 MP per band
Weight: 107g
Sunshine Sensor: Yes
Calibration: Reflectance panel
```

#### Hyperspectral Sensor

**Cubert UHD 185**:
```yaml
Instrument: SVB_FOR_PL05_HYP01
Type: Hyperspectral
Model: Cubert UHD 185
Spectral Range: 450-950nm
Spectral Bands: 125 (4nm resolution)
Spatial Resolution: 1000 x 1000 pixels
Type: Snapshot (not line-scanning)
Weight: 470g
Data Rate: High (requires significant storage)
```

#### Thermal Camera

**FLIR Vue Pro R**:
```yaml
Instrument: GRI_FOR_PL02_THER01
Type: Thermal
Model: FLIR Vue Pro R
Spectral Range: 7.5-13.5μm (LWIR)
Resolution: 640 x 512 pixels
Thermal Sensitivity: <50mK
Temperature Range: -40°C to +550°C
Radiometric: Yes (absolute temperature)
Weight: 113g
```

## Flight Planning Integration

### Standalone Flight Planning

Use dedicated flight planning software:

**Mission Planning Software**:
- **DJI Pilot** (DJI drones)
- **Pix4Dcapture** (photogrammetry)
- **UgCS** (universal ground control)
- **DroneDeploy** (agricultural mapping)

**Flight Planning Workflow**:
1. Import AOI from SITES Spectral (GeoJSON export)
2. Plan mission in flight planning software
3. Execute flight
4. Upload flight log to SITES Spectral (optional)

### Integrated Flight Planning

**Future Enhancement**: SITES Spectral v9.0 may include:
- Direct flight planning in SITES Spectral UI
- Flight log import and visualization
- Automatic product generation tracking

**Current Workaround**:
- Export AOI as GeoJSON from SITES Spectral
- Import GeoJSON to flight planning software
- Reference AOI in flight planning documentation

## Data Products from UAV Platforms

### Orthomosaic Products

**RGB Orthomosaic**:
```yaml
Product: Orthomosaic_RGB_20240615
Platform: SVB_FOR_PL05
AOI: SVB_Forest_Transect_North
Date: 2024-06-15
GSD: 1.2 cm/pixel
Format: GeoTIFF (3 bands: R, G, B)
CRS: SWEREF99 TM (EPSG:3006)
Size: 25000 x 30000 pixels (~0.25 km²)
File Size: 2.1 GB
Processing: Agisoft Metashape Professional
```

**Multispectral Orthomosaic**:
```yaml
Product: Orthomosaic_MS_20240615
Platform: SVB_FOR_PL05
AOI: SVB_Forest_Transect_North
Date: 2024-06-15
GSD: 3.2 cm/pixel
Format: GeoTIFF (5 bands: Blue, Green, Red, RedEdge, NIR)
Radiometric Calibration: Reflectance panel + DLS2
Bands:
  1: Blue (475nm)
  2: Green (560nm)
  3: Red (668nm)
  4: Red Edge (717nm)
  5: NIR (840nm)
Size: 10000 x 12000 pixels per band
File Size: 1.4 GB
```

### Vegetation Index Products

**NDVI**:
```yaml
Product: NDVI_20240615
Platform: SVB_FOR_PL05
AOI: SVB_Forest_Transect_North
Date: 2024-06-15
Formula: (NIR - Red) / (NIR + Red)
Input: Multispectral orthomosaic
Output: GeoTIFF (single band, float32)
Range: -1.0 to 1.0
Typical Forest Values: 0.6 to 0.9
```

**Other Vegetation Indices**:
- **NDRE** (Normalized Difference Red Edge): `(NIR - RedEdge) / (NIR + RedEdge)`
- **GNDVI** (Green NDVI): `(NIR - Green) / (NIR + Green)`
- **SAVI** (Soil-Adjusted Vegetation Index)
- **EVI** (Enhanced Vegetation Index)

### 3D Products

**Digital Surface Model (DSM)**:
```yaml
Product: DSM_20240615
Platform: SVB_FOR_PL05
AOI: SVB_Forest_Transect_North
Date: 2024-06-15
GSD: 5 cm/pixel
Format: GeoTIFF (single band, float32, elevation in meters)
Vertical Accuracy: ±0.15m (with RTK GPS)
Use Cases: Canopy height, volume estimation
```

**Point Cloud**:
```yaml
Product: PointCloud_20240615
Platform: SVB_FOR_PL05
AOI: SVB_Forest_Transect_North
Date: 2024-06-15
Format: LAZ (compressed LAS)
Points: ~85 million
Point Density: ~1200 points/m²
RGB Color: Yes
Classification: Ground, Vegetation, Building
Use Cases: Detailed 3D analysis, canopy structure
```

## Best Practices for UAV Platforms

### Flight Operations

1. **Pre-Flight Checklist**: Always complete before flight
   - Battery status (>80% for mission)
   - Sensor calibration (reflectance panel)
   - Weather conditions (wind <10 m/s, no rain)
   - Airspace clearance (check NOTAMs)
   - GPS signal quality (>15 satellites)

2. **Flight Timing**:
   - Solar noon ±2 hours for optimal lighting
   - Consistent time of day for time-series
   - Avoid early morning/late evening (long shadows)
   - Consider sun angle for reflectance measurements

3. **Flight Parameters**:
   - 75-80% front overlap (minimum for photogrammetry)
   - 65-70% side overlap
   - Consistent altitude (±1m with barometer, ±0.1m with RTK)
   - Appropriate flight speed (5-10 m/s typical)

### Data Quality

1. **Calibration**:
   - Use reflectance calibration panel before each flight
   - Capture panel at same altitude as survey (first image)
   - Document panel reflectance values
   - Store panel images with flight data

2. **Ground Control Points (GCPs)**:
   - Use GCPs for high-accuracy products (RTK not available)
   - Minimum 5 GCPs per flight area
   - Distribute evenly across AOI
   - Survey GCPs with differential GPS (cm-accuracy)

3. **Quality Checks**:
   - Verify image overlap in processing software
   - Check alignment quality (reprojection error)
   - Validate orthomosaic for artifacts
   - Compare products to ground truth

### Documentation

1. **Flight Logs**:
   - Keep detailed flight logs for each mission
   - Document weather, lighting, any issues
   - Track battery cycles
   - Note sensor serial numbers (if multiple sensors)

2. **Product Metadata**:
   - Comprehensive metadata for all products
   - Processing parameters and software versions
   - Coordinate reference system
   - Accuracy assessments

3. **Data Management**:
   - Consistent file naming convention
   - Organized directory structure by date/AOI
   - Backup raw data before processing
   - Archive processed products with metadata

## Troubleshooting

### Common Issues

| Problem | Cause | Solution |
|---------|-------|----------|
| Poor image alignment | Insufficient overlap | Increase overlap to 80% front, 70% side |
| Orthomosaic blurry | Motion blur or low light | Increase shutter speed, fly slower, or fly in better light |
| Color inconsistencies | Changing lighting during flight | Fly when sun is highest, shorter flight duration |
| Geometric distortion | No GCPs or RTK | Add GCPs or use RTK-capable UAV |
| Reflectance calibration failed | Panel not captured correctly | Capture panel at survey altitude, ensure proper exposure |
| Large file sizes | High resolution/large AOI | Compress products (LZW for GeoTIFF), generate tiles |
| Processing failure | Insufficient computer resources | Use cloud processing or segment AOI into smaller flights |

## Related Documentation

### Platform Guides
- [Quick Start Guide](../user-guides/01-QUICK_START.md) - Basic platform creation
- [Fixed Platform Guide](./01-FIXED_PLATFORMS.md) - Tower and building platforms
- [Satellite Platform Guide](./03-SATELLITE_PLATFORMS.md) - Satellite coverage

### Instrument Guides
- [Phenocam Guide](../instrument-guides/PHENOCAM_GUIDE.md) - RGB cameras
- [Multispectral Guide](../instrument-guides/MULTISPECTRAL_GUIDE.md) - MS sensors

### Advanced Features
- [AOI Management Guide](../user-guides/AOI_MANAGEMENT.md) - Flight area definition
- [Data Export Guide](../user-guides/DATA_EXPORT.md) - Exporting UAV data

### API Documentation
- [Platforms API](../api/PLATFORMS_API.md) - Programmatic platform management
- [AOI API](../api/AOI_API.md) - AOI management via API

## Summary

UAV platforms enable flexible, high-resolution spatial monitoring at SITES stations. Key takeaways:

- ✅ Define UAV base location and flight areas (AOIs)
- ✅ Document UAV specifications and sensor payload
- ✅ Plan flights with appropriate altitude and overlap
- ✅ Use calibration panels for multispectral data
- ✅ Maintain detailed flight logs
- ✅ Link to external data repositories for products
- ✅ Follow regulatory requirements and safety procedures

With proper configuration and operation, UAV platforms provide valuable high-resolution spatial data complementing fixed platform time-series.

---

**Document Version:** 1.0
**Last Updated:** 2025-11-27
**System Version:** 8.0.0-rc.1
