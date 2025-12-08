# Quick Start Guide

**Audience:** Station Administrators
**Version:** 8.0.0-rc.1
**Last Updated:** 2025-11-27

## Overview

Welcome to SITES Spectral v8.0.0! This guide will help you get started with the multi-platform observation network system in 15 minutes. You'll learn how to log in, navigate the interface, and perform basic tasks like adding platforms and instruments.

## What's New in v8.0.0

SITES Spectral v8.0.0 introduces major new capabilities:

- **Multi-Platform Support**: Manage fixed stations, UAV platforms, and satellite platforms
- **Interactive Map**: GeoJSON-based map with platform locations and AOIs
- **Enhanced AOI Management**: Draw and import Areas of Interest for each platform
- **Modular Architecture**: Configuration-driven, extensible system
- **Improved User Interface**: Tabbed platform cards with type-specific instrument grouping

## Prerequisites

Before you begin, ensure you have:

- **User Account**: Contact your system administrator for credentials
- **Role Assignment**: Station User (for your station) or Admin (all stations)
- **Modern Browser**: Chrome, Firefox, Edge, or Safari (latest versions)
- **Network Access**: Connection to the SITES Spectral server

## Step 1: Login and Authentication

### Accessing the System

1. **Navigate to the login page**:
   ```
   https://<your-server>/login.html
   ```

2. **Enter your credentials**:
   - Username: Your assigned username
   - Password: Your secure password

3. **Click "Login"**:
   - On success, you'll be redirected to the station dashboard
   - Your session token is stored securely in your browser

**Expected Result**: You should see the station dashboard with a map and your station information.

### Troubleshooting Login

| Problem | Solution |
|---------|----------|
| "Invalid credentials" | Check username and password, ensure caps lock is off |
| "Session expired" | Re-login; sessions expire after inactivity |
| "Access denied" | Contact administrator to verify your account is active |

## Step 2: Understanding the Dashboard

### Dashboard Layout

The SITES Spectral dashboard has four main areas:

1. **Header Bar**:
   - Station selector (for admins with multi-station access)
   - User menu (logout, settings)
   - Version information

2. **Interactive Map**:
   - Station markers with coordinates
   - Platform locations (fixed, UAV, satellite)
   - Areas of Interest (AOIs) as colored polygons
   - Zoom/pan controls

3. **Station Overview**:
   - Station details (name, location, ecosystem types)
   - Quick statistics (platform count, instrument count)
   - Action buttons (Add Platform, Export Data)

4. **Platform Cards**:
   - One card per platform
   - Tabbed interface for instrument types
   - Platform details and controls

### Navigation Tips

- **Zoom Map**: Use mouse wheel or +/- buttons
- **Pan Map**: Click and drag
- **Select Platform**: Click platform marker on map or platform card
- **Filter Instruments**: Use tabs on platform cards (Phenocam, Multispectral, etc.)
- **Expand Details**: Click "Show Details" on platform cards

## Step 3: Adding Your First Platform

Let's add a fixed platform (tower or building) to your station.

### Creating a Fixed Platform

1. **Click "Add Platform" button**:
   - Located in the station overview section
   - Opens the "Add Platform" modal

2. **Select Platform Type**:
   - Choose "Fixed Platform (Tower/Building)"
   - Other options: UAV Platform, Satellite Platform

3. **Enter Platform Details**:

   **Required Fields**:
   - **Platform Name**: Use naming convention `{STATION}_{ECOSYSTEM}_PL##`
     - Example: `SVB_FOR_PL01` (Svartberget Forest Platform 01)
   - **Ecosystem Type**: Select from 12 ecosystem codes
     - FOR (Forest), AGR (Arable Land), MIR (Mires), ALP (Alpine Forest)
     - GRA (Grassland), HEA (Heathland), LAK (Lake), CON (Coniferous Forest)
     - WET (Wetland), DEC (Deciduous Forest), MAR (Marshland), PEA (Peatland)
   - **Latitude**: Decimal degrees (e.g., 64.256)
   - **Longitude**: Decimal degrees (e.g., 19.775)

   **Optional Fields**:
   - **Height (m)**: Platform height above ground (e.g., 15.5)
   - **Description**: Brief description of the platform
   - **Deployment Date**: When platform was installed
   - **Status**: Active, Testing, Inactive, Decommissioned

4. **Click "Create Platform"**:
   - Validation checks naming convention and required fields
   - Platform appears on map and in platform list

**Example: Svartberget Forest Tower**

```yaml
Platform Name: SVB_FOR_PL01
Ecosystem: FOR (Forest)
Latitude: 64.256
Longitude: 19.775
Height: 15.5
Description: Main forest monitoring tower with phenocam and multispectral sensors
Deployment Date: 2020-01-15
Status: Active
```

**Expected Result**: Platform card appears in the dashboard with the platform marker visible on the map.

### Naming Convention Rules

All platforms must follow the naming pattern:

```
{STATION}_{ECOSYSTEM}_PL##
```

**Components**:
- `{STATION}`: 3-letter station acronym (SVB, ANS, LON, GRI, etc.)
- `{ECOSYSTEM}`: 3-letter ecosystem code (FOR, AGR, MIR, etc.)
- `PL##`: Platform number (PL01, PL02, ..., PL99)

**Valid Examples**:
- `SVB_FOR_PL01` - Svartberget Forest Platform 01
- `ANS_ALP_PL02` - Abisko Alpine Platform 02
- `LON_AGR_PL01` - Lönnstorp Arable Land Platform 01
- `GRI_FOR_PL03` - Grimsö Forest Platform 03

**Invalid Examples**:
- `SVB-FOR-01` (wrong separators)
- `SVARTBERGET_FOR_PL01` (full name instead of acronym)
- `SVB_FOR_P1` (missing zero padding)

## Step 4: Adding Your First Instrument

Now let's add an instrument to the platform you just created.

### Creating a Phenocam Instrument

1. **Select the Platform Card**:
   - Click on the platform card you created
   - Ensure you're on the "Phenocam" tab

2. **Click "Add Instrument"**:
   - Located in the platform card header
   - Opens the "Add Instrument" modal

3. **Select Instrument Type**:
   - Choose "Phenocam (📷)"
   - Other options: Multispectral, PAR Sensor, NDVI Sensor, PRI Sensor, Hyperspectral

4. **Enter Instrument Details**:

   **General Information**:
   - **Instrument Name**: Auto-generated from platform and type
     - Format: `{PLATFORM}_{TYPE}{##}`
     - Example: `SVB_FOR_PL01_PHE01`
   - **Status**: Active, Testing, Inactive, Maintenance, Decommissioned
   - **Measurement Status**: operational, intermittent, offline

   **Phenocam-Specific Fields**:
   - **Camera Brand**: StarDot, Axis, Canon, Nikon, etc.
   - **Camera Model**: Model number (e.g., "NetCam SC 5MP")
   - **Resolution**: Megapixels (e.g., 5.0)
   - **Image Interval**: Minutes between captures (e.g., 20)
   - **Lens Type**: Fixed, Fisheye, Telephoto
   - **Field of View**: Degrees (e.g., 45)

   **Position & Orientation**:
   - **Height Above Ground**: Meters (e.g., 12.0)
   - **Viewing Direction**: N, NE, E, SE, S, SW, W, NW, NADIR, ZENITH
   - **Azimuth**: Degrees from North (0-360)
   - **Nadir Angle**: Degrees from vertical (0-90)

   **Timeline**:
   - **Deployment Date**: When instrument was installed
   - **Calibration Date**: Last calibration date
   - **Years Active**: Auto-calculated from deployment date

   **System Configuration**:
   - **Power Source**: Solar, Grid, Battery
   - **Data Transmission**: WiFi, Ethernet, Cellular, USB
   - **Warranty Status**: Active, Expired, Not Applicable
   - **Quality Score**: 0-100 (data quality rating)

5. **Click "Create Instrument"**:
   - Validation checks naming and required fields
   - Instrument appears in the Phenocam tab of the platform card

**Example: Svartberget Phenocam**

```yaml
Instrument Name: SVB_FOR_PL01_PHE01
Camera Brand: StarDot
Camera Model: NetCam SC 5MP
Resolution: 5.0 MP
Image Interval: 20 minutes
Lens Type: Fixed
Field of View: 45 degrees
Height Above Ground: 12.0 m
Viewing Direction: S (South)
Azimuth: 180
Nadir Angle: 45
Status: Active
Measurement Status: operational
```

**Expected Result**: Instrument appears in the Phenocam tab with all details visible.

### Instrument Type Codes

Each instrument type has a specific code used in naming:

| Code | Type | Icon | Example |
|------|------|------|---------|
| PHE | Phenocam | 📷 | SVB_FOR_PL01_PHE01 |
| MS | Multispectral | 📡 | SVB_FOR_PL01_MS01 |
| PAR | PAR Sensor | ☀️ | SVB_MIR_PL03_PAR01 |
| NDVI | NDVI Sensor | 🌿 | ANS_FOR_PL01_NDVI01 |
| PRI | PRI Sensor | 🔬 | LON_AGR_PL01_PRI01 |
| HYP | Hyperspectral | 🌈 | GRI_FOR_PL01_HYP01 |

## Step 5: Basic Navigation and Operations

### Viewing Platform Details

1. **Click on Platform Card**:
   - Expands to show full details
   - Displays all instruments grouped by type

2. **Switch Between Instrument Types**:
   - Click tabs: Phenocam, Multispectral, PAR, NDVI, PRI, Hyperspectral
   - Empty tabs show "No instruments of this type"

3. **View Instrument Details**:
   - Click "Edit" button on instrument card
   - Opens modal with all instrument fields
   - View-only for readonly users

### Editing Existing Entities

**For Station Users**:
- Edit platforms and instruments at your assigned station
- Cannot edit other stations

**For Admins**:
- Edit any platform or instrument
- Access all stations via station selector

**To Edit**:
1. Click "Edit" button on platform or instrument card
2. Modify fields as needed
3. Click "Save" to apply changes
4. Changes are logged in activity log

### Deleting Entities

**Warning**: Deletion is permanent and cascades to related entities.

**To Delete**:
1. Click "Delete" button on platform or instrument card
2. Confirm deletion in modal dialog
3. Related entities are deleted:
   - Deleting platform deletes all its instruments
   - Deleting instrument deletes all its ROIs

**Note**: Only admins can delete platforms. Station users can delete instruments.

### Exporting Data

Export station data in multiple formats:

1. **Click "Export Data" button** in station overview
2. **Select Export Format**:
   - CSV (Comma-Separated Values)
   - TSV (Tab-Separated Values)
   - JSON (JavaScript Object Notation)
3. **Choose Entities to Export**:
   - Stations
   - Platforms
   - Instruments
   - ROIs
4. **Click "Export"**:
   - File downloads to your browser's download folder

**Example Export Filename**:
```
SVB_export_2025-11-27.csv
```

## Common Workflows

### Workflow 1: Setting Up a New Station

**Goal**: Configure a new SITES station with multiple platforms

**Steps**:
1. Create fixed platforms for permanent infrastructure (towers, buildings)
2. Add instruments to each platform (phenocams, sensors)
3. Define AOIs for each platform (see AOI Management Guide)
4. Verify all platforms appear correctly on map
5. Export data to verify configuration

**Expected Result**: Station fully configured with all platforms and instruments

### Workflow 2: Adding UAV Platform

**Goal**: Configure UAV platform for aerial observations

**Steps**:
1. Click "Add Platform" → "UAV Platform"
2. Enter UAV specifications (model, sensor payload)
3. Define flight area as AOI
4. Add UAV-mounted instruments
5. Link to flight planning system (if integrated)

**See**: [UAV Platform Guide](../platform-guides/02-UAV_PLATFORMS.md) for details

### Workflow 3: Adding Satellite Platform

**Goal**: Track satellite coverage for your station

**Steps**:
1. Click "Add Platform" → "Satellite Platform"
2. Select satellite (Sentinel-2, Landsat 8/9)
3. Define coverage area (bounding box or polygon)
4. Configure product tracking (which bands/indices to monitor)
5. Add data access links

**See**: [Satellite Platform Guide](../platform-guides/03-SATELLITE_PLATFORMS.md) for details

## Tips and Best Practices

### Naming Conventions

1. **Always Use Standard Formats**:
   - Platforms: `{STATION}_{ECOSYSTEM}_PL##`
   - Instruments: `{PLATFORM}_{TYPE}{##}`
   - ROIs: `ROI_##` (two-digit zero-padded)

2. **Use Descriptive Acronyms**:
   - Station codes: SVB, ANS, LON, GRI, SRC, ASA, BOL, DEG, STO, ROB
   - Ecosystem codes: FOR, AGR, MIR, ALP, GRA, HEA, LAK, CON, WET, DEC, MAR, PEA

3. **Number Sequentially**:
   - Start with 01, not 1
   - Increment sequentially: PL01, PL02, PL03
   - Don't skip numbers unless platform was decommissioned

### Data Quality

1. **Fill All Required Fields**:
   - Required fields marked with asterisk (*)
   - Missing required fields prevent saving

2. **Provide Accurate Coordinates**:
   - Use decimal degrees format
   - Verify coordinates on map before saving
   - Use precision appropriate to accuracy (e.g., 64.256 for ±10m)

3. **Document Thoroughly**:
   - Use description fields to document platform purpose
   - Note installation details in installation_notes
   - Track maintenance in maintenance_notes

### Map Interaction

1. **Verify Platform Locations**:
   - Always check map after adding platform
   - Ensure marker appears at correct location
   - Zoom in to verify precise placement

2. **Use AOIs Effectively**:
   - Draw AOIs to represent actual coverage areas
   - Use different colors for different platform types
   - Label AOIs clearly (e.g., "UAV Flight Area", "Tower FOV")

3. **Organize Visually**:
   - Group related platforms spatially
   - Use consistent naming for nearby platforms
   - Color-code AOIs by ecosystem or platform type

## Troubleshooting

### Common Issues

| Problem | Cause | Solution |
|---------|-------|----------|
| Platform not appearing on map | Invalid coordinates | Check lat/lon format (decimal degrees) |
| Cannot create instrument | Name already exists | Use next sequential number (PHE02, MS02, etc.) |
| "Unauthorized" error | Session expired | Log out and log back in |
| Platform card not loading | Network issue | Refresh page, check network connection |
| Map not rendering | Browser compatibility | Use latest Chrome, Firefox, or Edge |
| Cannot edit instrument | Wrong user role | Verify you have station or admin role |
| Export button disabled | No data to export | Create at least one platform/instrument first |

### Getting Help

**Error Messages**:
- Read error messages carefully - they indicate what went wrong
- Common errors: validation failures, permission issues, network problems
- Copy error text for support tickets

**Browser Console**:
- Press F12 to open developer tools
- Check Console tab for JavaScript errors
- Include console errors in support requests

**Support Contacts**:
- **Technical Issues**: Contact your system administrator
- **User Account Issues**: Contact SITES Spectral admin
- **Feature Requests**: Submit via issue tracker (if available)

## Next Steps

Now that you've completed the Quick Start, explore these guides:

### Platform-Specific Guides
- [Fixed Platform Guide](../platform-guides/01-FIXED_PLATFORMS.md) - Detailed guide for towers and buildings
- [UAV Platform Guide](../platform-guides/02-UAV_PLATFORMS.md) - Drone operations and flight planning
- [Satellite Platform Guide](../platform-guides/03-SATELLITE_PLATFORMS.md) - Satellite coverage and products

### Instrument Configuration
- [Phenocam Guide](../instrument-guides/PHENOCAM_GUIDE.md) - Camera setup and ROI management
- [Multispectral Guide](../instrument-guides/MULTISPECTRAL_GUIDE.md) - MS sensor configuration
- [Sensor Guides](../instrument-guides/) - PAR, NDVI, PRI, Hyperspectral

### Advanced Features
- [AOI Management Guide](./AOI_MANAGEMENT.md) - Drawing and importing Areas of Interest
- [Data Export Guide](./DATA_EXPORT.md) - Advanced export options and formats
- [V3 API Quick Reference](../api/01-V3_API_QUICK_REFERENCE.md) - Programmatic access

### System Administration
- [Configuration System](../developer/CONFIGURATION_SYSTEM.md) - YAML configuration files
- [Database Schema](../developer/DATABASE_SCHEMA.md) - Database structure
- [Deployment Guide](../developer/DEPLOYMENT.md) - System deployment

## Summary

Congratulations! You've learned how to:

- ✅ Log in to SITES Spectral
- ✅ Navigate the dashboard and map interface
- ✅ Create a fixed platform with proper naming conventions
- ✅ Add a phenocam instrument with full configuration
- ✅ Understand basic workflows and best practices
- ✅ Troubleshoot common issues

You're now ready to configure your SITES station and manage your observation platforms effectively.

## Reference

### SITES Station Acronyms

| Code | Station Name | Location |
|------|--------------|----------|
| SVB | Svartberget | Northern Sweden |
| ANS | Abisko | Northern Sweden |
| LON | Lönnstorp | Southern Sweden |
| GRI | Grimsö | Central Sweden |
| SRC | Skogaryd Research Catchment | Southern Sweden |
| ASA | Asa | Southern Sweden |
| BOL | Bolmen | Southern Sweden |
| DEG | Degero | Northern Sweden |
| STO | Storholmen | Central Sweden |
| ROB | Röbäcksdalen | Northern Sweden |

### Ecosystem Codes

| Code | Ecosystem Type | Code | Ecosystem Type |
|------|----------------|------|----------------|
| FOR | Forest | GRA | Grassland |
| AGR | Arable Land | HEA | Heathland |
| MIR | Mires | ALP | Alpine Forest |
| LAK | Lake | CON | Coniferous Forest |
| WET | Wetland | DEC | Deciduous Forest |
| MAR | Marshland | PEA | Peatland |

### Status Values

**Platform/Instrument Status**:
- `Active` - Currently operational
- `Testing` - Under testing, not production
- `Inactive` - Temporarily offline
- `Maintenance` - Undergoing maintenance
- `Decommissioned` - Permanently retired

**Measurement Status**:
- `operational` - Collecting data normally
- `intermittent` - Occasional data gaps
- `offline` - Not collecting data

---

**Document Version:** 1.0
**Last Updated:** 2025-11-27
**System Version:** 8.0.0-rc.1

For questions or feedback on this documentation, contact your SITES Spectral administrator.
