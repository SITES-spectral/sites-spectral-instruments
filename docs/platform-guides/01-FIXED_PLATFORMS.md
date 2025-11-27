# Fixed Platform Guide

**Audience:** Station Administrators
**Version:** 8.0.0-rc.1
**Last Updated:** 2025-11-27

## Overview

Fixed platforms are permanent or semi-permanent infrastructure for mounting instruments at SITES stations. This includes:

- **Towers**: Meteorological towers, flux towers, canopy access towers
- **Buildings**: Research stations, instrument shelters, observation huts
- **Masts**: Pole-mounted sensor platforms
- **Scaffolding**: Temporary but stationary platforms

This guide covers creating, configuring, and managing fixed platforms in SITES Spectral v8.0.0.

## Prerequisites

- **User Account**: Station User or Admin role
- **Station Access**: Permissions for the station where you're adding platforms
- **Platform Information**: Location, height, ecosystem type, deployment details
- **Instrument Inventory**: List of instruments to be mounted on the platform

## Fixed Platform Characteristics

### What Makes a Platform "Fixed"?

A fixed platform has these characteristics:

1. **Stationary Location**: Does not move (unlike UAV platforms)
2. **Known Coordinates**: Fixed latitude and longitude
3. **Permanent or Semi-Permanent**: Installed for extended periods (months to years)
4. **Infrastructure-Based**: Attached to or part of physical infrastructure
5. **Multiple Instruments**: Typically hosts several instruments at different heights/orientations

### Platform Types

**Tower Platforms**:
- Tall structures (5-50m typical height)
- Multiple instrument mounting levels
- Often used for flux measurements, phenocams, multispectral sensors
- Examples: SVB_FOR_PL01 (Svartberget 15m tower), ANS_ALP_PL01 (Abisko alpine tower)

**Building Platforms**:
- Research stations, cabins, shelters
- Roof-mounted or wall-mounted instruments
- Lower height than towers (2-10m typical)
- Examples: LON_AGR_PL01 (Lönnstorp field station), GRI_FOR_PL02 (Grimsö research station)

**Mast Platforms**:
- Pole-mounted sensor arrays
- Simple structure (2-5m typical height)
- Usually single instrument or small sensor cluster
- Examples: SVB_MIR_PL03 (Svartberget mire mast)

**Scaffolding Platforms**:
- Temporary but stationary platforms
- Used for seasonal campaigns or temporary deployments
- Mark as "Testing" status until permanent
- Examples: SRC_WET_PL04 (Skogaryd wetland scaffolding)

## Creating a Fixed Platform

### Step-by-Step: Adding a Fixed Platform

#### Step 1: Access the Add Platform Modal

1. **Navigate to your station dashboard**
2. **Click "Add Platform" button**
   - Located in station overview section
3. **Select "Fixed Platform (Tower/Building)"**
   - Radio button in platform type selection

#### Step 2: Enter Platform Details

**Required Fields**:

**Platform Name**:
- **Format**: `{STATION}_{ECOSYSTEM}_PL##`
- **Example**: `SVB_FOR_PL01`
- **Rules**:
  - STATION: 3-letter station acronym (SVB, ANS, LON, etc.)
  - ECOSYSTEM: 3-letter ecosystem code (FOR, AGR, MIR, etc.)
  - PL##: Two-digit platform number (01-99)
- **Validation**: System enforces this pattern

**Ecosystem Type**:
- **Select from dropdown**: 12 ecosystem types
- **Common for Fixed Platforms**:
  - FOR (Forest): Forest towers and canopy platforms
  - AGR (Arable Land): Agricultural field stations
  - MIR (Mires): Peatland and wetland platforms
  - ALP (Alpine Forest): High-elevation platforms
  - GRA (Grassland): Grassland monitoring towers
  - LAK (Lake): Lakeside or over-water platforms

**Latitude/Longitude**:
- **Format**: Decimal degrees
- **Precision**: Use appropriate precision for accuracy
  - ±10m accuracy: 3 decimals (e.g., 64.256)
  - ±1m accuracy: 5 decimals (e.g., 64.25634)
  - ±0.1m accuracy: 6 decimals (e.g., 64.256341)
- **Examples**:
  - Svartberget: 64.256, 19.775
  - Abisko: 68.354, 18.816
  - Lönnstorp: 55.668, 13.108
  - Grimsö: 59.731, 15.468
- **Validation**: Must be valid coordinates in WGS84

**Optional but Recommended**:

**Height Above Ground (m)**:
- **Tower Height**: Total height of tower structure
- **Building Height**: Roof height or instrument mounting height
- **Mast Height**: Top of mast
- **Examples**:
  - 15.5 (15.5-meter tower)
  - 6.0 (6-meter building roof)
  - 3.5 (3.5-meter mast)

**Description**:
- **Purpose**: Brief description of platform function
- **Examples**:
  - "Main forest flux tower with phenocam at 12m and multispectral sensor at 15m"
  - "Agricultural field station for crop monitoring with nadir-viewing instruments"
  - "Peatland mast with PAR and NDVI sensors for bog vegetation monitoring"

**Deployment Date**:
- **Format**: YYYY-MM-DD
- **Purpose**: Track platform installation date
- **Example**: 2020-01-15

**Status**:
- **Options**:
  - `Active` - Currently operational (default)
  - `Testing` - Under testing, not yet production
  - `Inactive` - Temporarily offline (maintenance, seasonal)
  - `Decommissioned` - Permanently retired
- **Default**: Active

#### Step 3: Configure Position Details

**Geographic Position**:
- **Latitude**: North-south position (positive = North, negative = South)
- **Longitude**: East-west position (positive = East, negative = West)
- **Elevation (m)**: Altitude above sea level (optional)

**Example Coordinates**:
```yaml
Svartberget (Northern Sweden):
  Latitude: 64.256
  Longitude: 19.775
  Elevation: 235

Abisko (Arctic Sweden):
  Latitude: 68.354
  Longitude: 18.816
  Elevation: 388

Lönnstorp (Southern Sweden):
  Latitude: 55.668
  Longitude: 13.108
  Elevation: 25

Grimsö (Central Sweden):
  Latitude: 59.731
  Longitude: 15.468
  Elevation: 120
```

**Verification on Map**:
- After entering coordinates, platform marker appears on map
- Zoom in to verify correct placement
- Adjust coordinates if marker is misplaced

#### Step 4: Add Platform Configuration

**Installation Details** (optional):
- **Installation Notes**: Document installation procedure, equipment used
- **Access Instructions**: How to access platform (for maintenance)
- **Safety Notes**: Safety considerations for platform access

**Power and Data** (configured per instrument):
- Platform-level power system (solar, grid, battery)
- Data transmission method (WiFi, Ethernet, cellular)
- These are typically set at instrument level

#### Step 5: Create Platform

1. **Review all fields** for accuracy
2. **Click "Create Platform"** button
3. **Verify creation**:
   - Platform card appears in dashboard
   - Platform marker appears on map
   - Platform is ready for instrument addition

### Example: Svartberget Forest Tower

Complete example for SVB_FOR_PL01:

```yaml
Platform Name: SVB_FOR_PL01
Platform Type: Fixed (Tower/Building)
Ecosystem: FOR (Forest)

Geographic Position:
  Latitude: 64.256
  Longitude: 19.775
  Elevation: 235

Physical Characteristics:
  Height: 15.5 m
  Type: Meteorological tower
  Structure: Steel lattice tower

Timeline:
  Deployment Date: 2020-01-15
  Last Inspection: 2024-11-15
  Status: Active

Description: |
  Main forest monitoring tower in old-growth Scots pine stand.
  Hosts phenocam at 12m viewing south, multispectral sensor at 15m
  viewing nadir, and PAR sensor at 14m. Part of long-term ecological
  monitoring program.

Installation Notes: |
  Tower installed on bedrock foundation with concrete anchors.
  Climbing requires safety harness and certified training.
  Lightning protection system installed 2020-03.

Access Instructions: |
  Access via forest trail from research station (1.2 km).
  Locked ladder cage at base - key in research station.
  Maximum payload per level: 50 kg.
```

## Managing Fixed Platforms

### Viewing Platform Details

**From Dashboard**:
1. Locate platform card in dashboard
2. Click "Show Details" to expand
3. View summary: name, ecosystem, status, instrument count

**From Map**:
1. Click platform marker on map
2. Popup shows platform name and basic info
3. Click "View Details" in popup to open platform card

**Full Details View**:
- Platform card expanded view shows:
  - All platform metadata
  - Tabbed instrument list (by type)
  - AOI polygons (if defined)
  - Action buttons (Edit, Delete, Add Instrument)

### Editing Platform Details

**Permissions**:
- Station Users: Can edit platforms at their assigned station
- Admins: Can edit any platform

**To Edit**:
1. Click "Edit" button on platform card
2. Modify editable fields
3. Cannot change: Platform name (ID), station assignment
4. Can change: Coordinates, height, description, status, dates
5. Click "Save" to apply changes

**Common Edits**:
- Update status (e.g., Active → Maintenance → Active)
- Correct coordinates after surveying
- Add/update description
- Update deployment or maintenance dates
- Change ecosystem type (if platform purpose changed)

### Deleting Platforms

**Warning**: Deleting a platform also deletes all its instruments and ROIs. This action cannot be undone.

**Permissions**: Admin only

**Before Deleting**:
1. Export platform data for archival
2. Verify no active instruments (set instruments to "Decommissioned" first)
3. Document reason for deletion
4. Backup database (admin task)

**To Delete**:
1. Click "Delete" button on platform card
2. Read warning about cascade deletion
3. Type platform name to confirm
4. Click "Confirm Delete"

**Alternative**: Instead of deleting, set status to "Decommissioned" to preserve historical data.

## Adding Instruments to Fixed Platforms

### Instrument Mounting Considerations

Fixed platforms typically host multiple instruments at different:
- **Heights**: Instruments at different levels on tower
- **Orientations**: Multiple viewing directions
- **Types**: Mix of cameras, sensors, spectrometers

### Instrument Height Above Ground

**For Tower Platforms**:
- Specify exact mounting height (e.g., 12.0m)
- Use consistent measurement method (base to sensor)
- Account for sensor housing height

**For Building Platforms**:
- Use roof height or wall mounting height
- Account for sensor projection from wall
- Note if height varies seasonally (snow accumulation)

**For Mast Platforms**:
- Typically fixed height at top of mast
- Account for mast settling over time
- Re-measure after maintenance

### Instrument Viewing Direction

**Cardinal Directions**:
- N, NE, E, SE, S, SW, W, NW (horizontal viewing)
- NADIR (downward, 0° from vertical)
- ZENITH (upward, 180° from vertical)

**Azimuth**:
- Degrees from North (clockwise)
- N=0°, E=90°, S=180°, W=270°
- Example: SW = 225°

**Nadir Angle**:
- Degrees from vertical
- Nadir = 0°, Horizontal = 90°, Zenith = 180°
- Example: 45° = oblique downward view

**Common Configurations**:

```yaml
Phenocam (Horizontal View):
  Viewing Direction: S
  Azimuth: 180
  Nadir Angle: 90

Multispectral Sensor (Nadir View):
  Viewing Direction: NADIR
  Azimuth: 0
  Nadir Angle: 0

PAR Sensor (Upward View):
  Viewing Direction: ZENITH
  Azimuth: 0
  Nadir Angle: 180
```

### Example Instrument Configuration

**Phenocam on Forest Tower**:

```yaml
Instrument Name: SVB_FOR_PL01_PHE01
Instrument Type: Phenocam
Platform: SVB_FOR_PL01

Camera Specifications:
  Brand: StarDot
  Model: NetCam SC 5MP
  Resolution: 5.0 MP
  Lens Type: Fixed
  Field of View: 45°
  Image Interval: 20 minutes

Position:
  Height Above Ground: 12.0 m
  Viewing Direction: S (South)
  Azimuth: 180°
  Nadir Angle: 90°

Timeline:
  Deployment Date: 2020-02-01
  Calibration Date: 2024-06-15
  Status: Active
  Measurement Status: operational

System:
  Power Source: Solar
  Data Transmission: WiFi
  Data Storage: Local + Remote
  Quality Score: 95

Description: |
  Phenological camera monitoring mixed boreal forest canopy.
  Views mature Scots pine with understory birch. Primary target
  for spring green-up and autumn senescence phenology metrics.
```

## Platform Configurations for Common Scenarios

### Scenario 1: Single-Level Tower

**Configuration**:
- One platform (tower)
- Multiple instruments at same level
- Different viewing directions

**Example: Grassland Tower**

```yaml
Platform: LON_GRA_PL01
Height: 5.0 m
Instruments:
  - LON_GRA_PL01_PHE01 (Phenocam, S, 4.5m)
  - LON_GRA_PL01_PHE02 (Phenocam, N, 4.5m)
  - LON_GRA_PL01_MS01 (Multispectral, NADIR, 5.0m)
  - LON_GRA_PL01_PAR01 (PAR Sensor, ZENITH, 4.8m)
```

**Use Case**: 360° coverage of grassland with nadir multispectral and upward PAR

### Scenario 2: Multi-Level Tower

**Configuration**:
- One platform (tower)
- Instruments at multiple heights
- Vertical profiling capability

**Example: Forest Flux Tower**

```yaml
Platform: SVB_FOR_PL01
Height: 15.5 m

Level 1 (3m - Understory):
  - SVB_FOR_PL01_NDVI01 (NDVI Sensor, NADIR)
  - SVB_FOR_PL01_PAR01 (PAR Sensor, ZENITH)

Level 2 (9m - Mid-Canopy):
  - SVB_FOR_PL01_PHE01 (Phenocam, S)
  - SVB_FOR_PL01_PRI01 (PRI Sensor, NADIR)

Level 3 (15m - Above Canopy):
  - SVB_FOR_PL01_MS01 (Multispectral, NADIR)
  - SVB_FOR_PL01_PAR02 (PAR Sensor, ZENITH)
  - SVB_FOR_PL01_HYP01 (Hyperspectral, NADIR)
```

**Use Case**: Vertical profiling of canopy reflectance and PAR

### Scenario 3: Building-Based Platform

**Configuration**:
- Platform is building/shelter
- Roof-mounted and wall-mounted instruments
- Lower height than tower

**Example: Agricultural Field Station**

```yaml
Platform: LON_AGR_PL01
Height: 6.0 m (roof height)

Roof-Mounted:
  - LON_AGR_PL01_PHE01 (Phenocam, S, 6.5m)
  - LON_AGR_PL01_MS01 (Multispectral, NADIR, 6.0m)

Wall-Mounted (South Wall):
  - LON_AGR_PL01_NDVI01 (NDVI Sensor, S, 3.0m)

Mast-Mounted (on roof):
  - LON_AGR_PL01_PAR01 (PAR Sensor, ZENITH, 7.0m)
```

**Use Case**: Crop monitoring with multiple sensor types

### Scenario 4: Multi-Platform Site

**Configuration**:
- Multiple platforms at one station
- Each platform has specific purpose
- Platforms may be in different ecosystems

**Example: Svartberget Multi-Platform**

```yaml
Platform 1: SVB_FOR_PL01
  Ecosystem: FOR (Forest)
  Purpose: Mature forest monitoring
  Instruments: Phenocam, Multispectral, Hyperspectral

Platform 2: SVB_FOR_PL02
  Ecosystem: FOR (Forest)
  Purpose: Forest edge monitoring
  Instruments: Phenocam (4 directions), NDVI

Platform 3: SVB_MIR_PL03
  Ecosystem: MIR (Mire)
  Purpose: Peatland monitoring
  Instruments: Phenocam, PAR, NDVI

Platform 4: SVB_WET_PL04
  Ecosystem: WET (Wetland)
  Purpose: Wetland vegetation
  Instruments: Multispectral, PRI
```

**Use Case**: Comprehensive ecosystem monitoring across site

## Best Practices for Fixed Platforms

### Platform Naming

1. **Use Standard Format**: Always follow `{STATION}_{ECOSYSTEM}_PL##`
2. **Sequential Numbering**: Number platforms sequentially (PL01, PL02, ...)
3. **Document Rationale**: Note why platforms are numbered in specific order
4. **Preserve Numbers**: Don't reuse numbers from decommissioned platforms

### Location Accuracy

1. **Survey Platforms**: Use differential GPS for accurate coordinates
2. **Document Precision**: Note coordinate precision in description
3. **Update After Repositioning**: If platform moves, update coordinates immediately
4. **Verify on Map**: Always check map marker placement after entering coordinates

### Height Measurements

1. **Measure to Sensor**: Height should be to sensor, not platform top
2. **Account for Settling**: Re-measure after first year (settling)
3. **Seasonal Changes**: Note if snow affects effective height
4. **Document Method**: Note measurement method (laser, tape, GPS)

### Instrument Organization

1. **Group by Type**: Use tabbed interface to organize by instrument type
2. **Consistent Naming**: Use sequential numbering within types (PHE01, PHE02, ...)
3. **Document Purpose**: Note why each instrument is at specific height/direction
4. **Update Status**: Keep instrument status current (Active, Maintenance, etc.)

### Documentation

1. **Detailed Descriptions**: Write clear, comprehensive platform descriptions
2. **Installation Notes**: Document installation procedure and equipment
3. **Access Instructions**: Provide clear access and safety instructions
4. **Maintenance Log**: Keep maintenance notes up to date

### Safety

1. **Document Hazards**: Note safety considerations (height, electrical, wildlife)
2. **Access Requirements**: Document training or certification required
3. **Emergency Contacts**: Include emergency contact information
4. **Seasonal Restrictions**: Note if platform access is seasonal

## Troubleshooting

### Common Issues

| Problem | Cause | Solution |
|---------|-------|----------|
| Platform not appearing on map | Invalid coordinates | Verify lat/lon format (decimal degrees), check for typos |
| Cannot create platform | Name format invalid | Ensure name matches `{STATION}_{ECOSYSTEM}_PL##` |
| Wrong ecosystem type | Typo or wrong selection | Edit platform, select correct ecosystem from dropdown |
| Height measurement inconsistent | Different measurement methods | Standardize measurement method, document in notes |
| Instruments at wrong height | Height entered as platform height not instrument height | Edit each instrument with correct sensor height |
| Platform marker in wrong location | Coordinate entry error or wrong projection | Verify coordinates in WGS84 decimal degrees |
| Cannot add instrument | Platform ID mismatch | Ensure platform exists and you have permissions |
| Status not updating | Cache issue | Refresh page, clear browser cache |

### Data Quality Issues

**Issue**: Instruments reporting incorrect data
- Check instrument calibration dates
- Verify instrument is mounted at documented height/orientation
- Ensure instrument status is "operational"

**Issue**: Missing data periods
- Check instrument measurement_status (operational, intermittent, offline)
- Review instrument maintenance notes for downtime periods
- Update instrument status to reflect actual operational state

**Issue**: Coordinate mismatch with other systems
- Verify coordinate system (WGS84 vs local projection)
- Check for coordinate swap (lat/lon reversed)
- Confirm precision matches survey accuracy

## Related Documentation

### Platform Guides
- [Quick Start Guide](../user-guides/01-QUICK_START.md) - Basic platform creation
- [UAV Platform Guide](./02-UAV_PLATFORMS.md) - Drone platforms
- [Satellite Platform Guide](./03-SATELLITE_PLATFORMS.md) - Satellite coverage

### Instrument Guides
- [Phenocam Guide](../instrument-guides/PHENOCAM_GUIDE.md) - Camera configuration
- [Multispectral Guide](../instrument-guides/MULTISPECTRAL_GUIDE.md) - MS sensors
- [Sensor Guides](../instrument-guides/) - PAR, NDVI, PRI, Hyperspectral

### Advanced Features
- [AOI Management Guide](../user-guides/AOI_MANAGEMENT.md) - Platform coverage areas
- [Data Export Guide](../user-guides/DATA_EXPORT.md) - Exporting platform data

### API Documentation
- [Platforms API](../api/PLATFORMS_API.md) - Programmatic platform management
- [V3 API Quick Reference](../api/01-V3_API_QUICK_REFERENCE.md) - API overview

## Summary

Fixed platforms are the foundation of SITES Spectral monitoring infrastructure. Key takeaways:

- ✅ Use standard naming conventions for consistency
- ✅ Provide accurate coordinates and verify on map
- ✅ Document platform details thoroughly
- ✅ Measure instrument heights to sensor, not platform top
- ✅ Organize instruments logically by type
- ✅ Keep status and metadata current
- ✅ Consider safety and access in documentation

With proper configuration, fixed platforms provide stable, long-term monitoring capabilities across SITES stations.

---

**Document Version:** 1.0
**Last Updated:** 2025-11-27
**System Version:** 8.0.0-rc.1
