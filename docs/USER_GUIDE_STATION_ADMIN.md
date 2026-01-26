# SITES Spectral Station Admin User Guide

> **Version**: 15.6.0
> **Portal**: https://{station}.sitesspectral.work
> **Last Updated**: 2026-01-26

---

## Overview

This guide is for users with `station-admin` roles who manage platforms, instruments, and UAV operations at their assigned SITES station.

---

## Accessing Your Station Portal

### Login Options

**Option 1: Cloudflare Access (Recommended)**
1. Navigate to https://{your-station}.sitesspectral.work (e.g., https://svb.sitesspectral.work)
2. Enter your authorized email
3. Check email for OTP
4. Enter OTP to access

**Option 2: Magic Link**
1. Request magic link from administrator
2. Click link in email
3. Access granted for configured duration

### Station Dashboard

Your dashboard displays:

- **Station Summary**: Platform and instrument counts
- **Platform Grid**: All platforms by type (Fixed, UAV, Satellite)
- **Map View**: Station location with platform markers
- **Recent Activity**: Latest changes at your station
- **UAV Operations**: Mission planning and flight logs

---

## Platform Management

### Viewing Platforms

Platforms are organized by type tabs:

| Tab | Platform Types |
|-----|----------------|
| All | All platforms |
| Fixed | Towers, buildings, ground installations |
| UAV | Drones |
| Satellite | Satellite data sources |

### Creating a Fixed Platform

1. Click **"+ Add Platform"**
2. Select **"Fixed"** type
3. Fill in the form:
   - **Display Name**: Descriptive name (e.g., "Forest Tower 01")
   - **Ecosystem Code**: Select from dropdown
     - FOR (Forest)
     - AGR (Agricultural)
     - MIR (Mire)
     - LAK (Lake)
     - GRA (Grassland)
     - etc.
   - **Mount Type**:
     - TWR (Tower/Mast)
     - BLD (Building)
     - GND (Ground Level)
   - **Height (m)**: Platform height above ground
   - **Coordinates**: Latitude/Longitude (optional)
4. Click **"Create Platform"**

The system auto-generates:
- `normalized_name`: e.g., `SVB_FOR_TWR01`

### Creating a UAV Platform

1. Click **"+ Add Platform"**
2. Select **"UAV"** type
3. Fill in the form:
   - **Display Name**: Descriptive name
   - **Vendor**: DJI, MicaSense, Parrot, Headwall, etc.
   - **Model**: Select from known models
   - **Serial Number**: Aircraft serial number
4. Click **"Create Platform"**

**Auto-Created Instruments:**

| Vendor/Model | Instruments |
|--------------|-------------|
| DJI M3M | Multispectral (MS01), RGB Camera (RGB02) |
| DJI M30T | RGB Camera (RGB01), Thermal (TIR01) |
| MicaSense RedEdge-MX | Multispectral (MS01) |
| Headwall Nano-Hyperspec | Hyperspectral (HYP01) |

### Editing a Platform

1. Click platform card to expand
2. Click **edit** button (pencil icon)
3. Modify fields
4. Click **"Save Changes"**

### Deleting a Platform

1. Click platform card
2. Click **delete** button (trash icon)
3. Confirm deletion
4. **Warning**: Deletes all associated instruments and data

---

## Instrument Management

### Viewing Instruments

Instruments are displayed as cards within their platform:

- **Status Badge**: Active (green), Inactive (gray), Maintenance (yellow)
- **Type Icon**: Camera, sensor, etc.
- **Quick Stats**: Last calibration, measurement status

### Creating an Instrument

1. Expand platform card
2. Click **"+ Add Instrument"**
3. Select instrument type
4. Fill in type-specific fields (see below)
5. Click **"Create"**

### Instrument Types

#### Phenocam

| Field | Description |
|-------|-------------|
| Camera Brand | StarDot, Campbell, Mobotix, etc. |
| Camera Model | Specific model name |
| Resolution | e.g., 1920x1080 |
| Capture Interval | Minutes between images |
| Viewing Direction | N, NE, E, SE, S, SW, W, NW |

#### Multispectral Sensor

| Field | Description |
|-------|-------------|
| Number of Channels | Typically 4-10 |
| Spectral Range Start | Minimum wavelength (nm) |
| Spectral Range End | Maximum wavelength (nm) |
| Orientation | Upward, Downward, Dual |

#### PAR Sensor

| Field | Description |
|-------|-------------|
| Spectral Range | 400-700nm (typical) |
| Calibration Coefficient | Sensor-specific value |
| Orientation | Upward, Downward |

#### NDVI Sensor

| Field | Description |
|-------|-------------|
| Red Wavelength | ~650nm |
| NIR Wavelength | ~810nm |
| Field of View | Degrees |

#### PRI Sensor

| Field | Description |
|-------|-------------|
| Band 1 Wavelength | ~531nm |
| Band 2 Wavelength | ~570nm |

#### Hyperspectral

| Field | Description |
|-------|-------------|
| Spectral Range Start | e.g., 400nm |
| Spectral Range End | e.g., 2500nm |
| Spectral Resolution | e.g., 3nm |
| Number of Bands | Typically 200+ |

### Editing an Instrument

1. Click instrument card
2. Click **edit** button
3. Modify fields in type-specific modal
4. Click **"Save"**

### Instrument Status

| Status | Meaning |
|--------|---------|
| Active | Currently operational |
| Inactive | Temporarily not in use |
| Maintenance | Under repair/calibration |
| Decommissioned | Permanently retired |

---

## ROI Management (Phenocams)

### Understanding ROIs

Regions of Interest (ROIs) are polygon areas on phenocam images used for vegetation analysis.

### Creating an ROI

1. Open phenocam instrument card
2. Click **"Manage ROIs"**
3. Click **"+ New ROI"**
4. **Drawing Mode**:
   - Click to place polygon vertices
   - Double-click to close polygon
   - Right-click to undo last point
5. Fill in details:
   - **Name**: e.g., ROI_01
   - **Description**: What the ROI captures
   - **Color**: Select from presets or custom
6. Click **"Save ROI"**

### Editing an ROI (Legacy System)

**Important**: Station admins cannot directly edit existing ROIs to preserve time series integrity.

**Workflow**:
1. Click **"Edit"** on existing ROI
2. System prompts to create new ROI
3. Draw new polygon
4. Original ROI is marked as "legacy"
5. New ROI becomes active

This maintains data continuity for historical analysis.

### ROI Best Practices

- Use consistent naming: ROI_01, ROI_02, etc.
- Document what each ROI captures
- Avoid overlapping ROIs
- Create ROI_00 for full image reference

---

## Maintenance Records

### Viewing Maintenance History

1. Click instrument card
2. Click **"Maintenance"** tab
3. View timeline of maintenance events

### Creating Maintenance Record

1. Click **"+ Schedule Maintenance"**
2. Fill in:
   - **Type**: Cleaning, Repair, Inspection, Calibration
   - **Scheduled Date**: When planned
   - **Description**: What needs to be done
3. Click **"Schedule"**

### Completing Maintenance

1. Click pending maintenance record
2. Click **"Mark Complete"**
3. Add completion notes
4. Click **"Complete"**

---

## Calibration Records

### Viewing Calibration History

1. Click instrument card (Multispectral/Hyperspectral)
2. Click **"Calibration"** tab
3. View timeline of calibrations

### Recording Calibration

1. Click **"+ New Calibration"**
2. Fill in:
   - **Date**: When performed
   - **Panel Serial**: Spectralon panel used
   - **Panel Condition**: Good, Worn, Damaged
   - **Weather**:
     - Cloud Cover: Clear, Partly Cloudy, Overcast, Intermittent
     - Solar Elevation: Degrees above horizon
     - Temperature: Ambient temp (°C)
   - **Quality Score**: 0-100
   - **Performed By**: Technician name
3. Click **"Save Calibration"**

### Calibration Expiry

- System tracks calibration validity
- Warnings appear 30 days before expiry
- Expired instruments flagged on dashboard

---

## UAV Operations

### Overview Tab

View summary statistics:
- Active missions
- Flights this month
- Pilot certifications status
- Battery inventory health

### Missions Tab

#### Creating a Mission

1. Click **"+ New Mission"**
2. Fill in:
   - **Name**: Descriptive mission name
   - **Planned Date**: When to fly
   - **Flight Pattern**: Grid, Crosshatch, Perimeter, POI
   - **Target Altitude**: Meters AGL
   - **Target Overlap**: Percentage (typically 70-80%)
   - **AOI**: Select target area
   - **Objectives**: What to capture
3. Click **"Create Mission"**

Mission status: `draft` → `planned`

#### Mission Approval

Missions require admin approval before execution:
1. Submit planned mission
2. Wait for approval notification
3. Once approved, status changes to `approved`

#### Starting a Mission

On flight day:
1. Select approved mission
2. Click **"Start Mission"**
3. Record actual weather conditions
4. Status changes to `in_progress`

#### Completing a Mission

After all flights:
1. Click **"Complete Mission"**
2. Enter results:
   - Quality Score (0-100)
   - Coverage Percentage
   - Notes
3. Click **"Complete"**

### Flights Tab

#### Logging a Flight

1. Click **"+ Log Flight"**
2. Select active mission
3. Fill in:
   - **Pilot**: Select from authorized pilots
   - **Platform**: Select UAV
   - **Takeoff Time**: Start of flight
   - **Landing Time**: End of flight
   - **Battery**: Select battery used
   - **Battery Start/End %**: Charge levels
   - **Max Altitude**: Meters AGL
   - **Images Captured**: Photo count
   - **Data Size**: MB collected
4. Click **"Save Flight Log"**

#### Reporting an Incident

If incident occurred:
1. Open flight log
2. Click **"Report Incident"**
3. Select severity:
   - **Minor**: No damage, flight continued
   - **Moderate**: Flight affected
   - **Major**: Equipment damage
   - **Critical**: Safety incident
4. Describe what happened
5. Click **"Submit Report"**

### Batteries Tab

#### Adding a Battery

1. Click **"+ Register Battery"**
2. Fill in:
   - **Serial Number**: Unique identifier
   - **Manufacturer**: DJI, etc.
   - **Model**: Battery model name
   - **Capacity**: mAh rating
   - **Cell Count**: Number of cells (e.g., 4S)
   - **Chemistry**: LiPo, LiHV, LiIon
   - **Purchase Date**: When acquired
3. Click **"Register"**

#### Recording Health Check

1. Click battery card
2. Click **"Health Check"**
3. Enter readings:
   - Health Percentage
   - Internal Resistance (mΩ)
   - Notes
4. Click **"Save"**

#### Retiring a Battery

1. Click battery card
2. Click **"Retire"**
3. Select reason:
   - Exceeded cycle limit
   - Physical damage
   - Performance degradation
   - Age
4. Click **"Confirm Retirement"**

---

## Data Export

### Export Station Data

1. Click **"Export"** in header
2. Select format: CSV, JSON, TSV
3. Select data types:
   - [ ] Platforms
   - [ ] Instruments
   - [ ] ROIs
   - [ ] Calibrations
   - [ ] Maintenance
4. Click **"Download"**

---

## Best Practices

### Platform Naming

Follow the convention:
```
{STATION}_{ECOSYSTEM}_{MOUNT_TYPE}{SEQUENCE}
```
Example: `SVB_FOR_TWR01`

### Instrument Naming

Auto-generated:
```
{PLATFORM}_{TYPE}{SEQUENCE}
```
Example: `SVB_FOR_TWR01_PHE01`

### Calibration Schedule

| Instrument Type | Recommended Interval |
|-----------------|---------------------|
| Multispectral | Monthly |
| Hyperspectral | Monthly |
| PAR/NDVI | Seasonal |
| Phenocam | Annual (lens cleaning) |

### UAV Operations

- Always get mission approval before flying
- Log all flights, even short tests
- Report all incidents, no matter how minor
- Maintain battery health records
- Keep pilot certifications current

---

## Troubleshooting

### Can't Create Platform

- Verify you're assigned to this station
- Check for duplicate names
- Ensure all required fields are filled

### ROI Drawing Issues

- Use modern browser (Chrome, Firefox, Edge)
- Ensure image is fully loaded
- Try zooming out if points won't place

### UAV Section Not Visible

- Verify UAV platforms exist at your station
- Check with admin if UAV features are enabled

---

## Related Documentation

- [[USER_GUIDE_ADMIN]] - Admin user guide
- [[USER_GUIDE_UAV_PILOT]] - UAV pilot guide
- [[API_REFERENCE]] - API documentation
