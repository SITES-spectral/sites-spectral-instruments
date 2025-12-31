# SITES Spectral Instruments Database - Station User Guide

**Version:** 9.0.16
**Last Updated:** 2025-12-02

## Overview

Welcome to the SITES Spectral Instruments Database! This system allows you to view and update information about platforms and instruments at your assigned research station. This guide will help you navigate the system and make necessary updates to keep our database current and accurate.

## Getting Started

### Login
1. Visit the SITES Spectral Instruments portal
2. Enter your assigned username and password
3. You will be automatically directed to your station's dashboard

### Your Dashboard
Once logged in, you'll see:
- **Station Overview**: General information about your research station
- **Platform Cards**: Visual cards showing all platforms at your station
- **Instrument Cards**: Detailed cards for each phenocam and sensor
- **Interactive Map**: Geographic view of your station's infrastructure
- **Platform Controls**: Create new platforms (admin and station users only)

### Creating New Platforms (v9.0.16+)

If you have admin or station user privileges, you can create new platforms directly from your dashboard:

1. **Click "Add Platform"** button in the platforms section
2. **Select Platform Type**:
   - **Fixed**: Towers, masts, permanent installations
   - **UAV**: Drones and unmanned aerial vehicles
   - **Satellite**: Earth observation satellite platforms
3. **Fill in required fields**:
   - For Fixed platforms: normalized name, display name, ecosystem
   - For UAV platforms: vendor, model, and location (normalized name auto-generated)
4. **Click Create** to save the new platform

**Important Notes:**
- Platform normalized names must use your station's acronym (e.g., `ANS_FOR_TWR01`)
- UAV platforms auto-generate their normalized name based on vendor and model
- Instruments cannot be created with generic station fallbacks - all require valid station data

## Understanding the Data Structure

### Normalized Names vs Legacy Names
- **Normalized Names**: New standardized naming convention (e.g., `ANS_FOR_BLD01_PHE01`)
  - Format: `[STATION]_[ECOSYSTEM]_[PLATFORM]_[INSTRUMENT]`
  - These are the official identifiers going forward
- **Legacy Names**: Previous naming conventions still displayed for reference
  - Marked with "legacy name:" prefix in the interface
  - Maintained for historical continuity

## Updating Platform Information

### Accessing Platform Details
1. **Click on any platform card** to open the detailed view modal
2. **Click the green "Edit" button** (visible only to authorized users)
3. The edit form will open with current information pre-filled

### Editable Platform Fields
You can update the following information:

**General Information:**
- Display name
- Location code
- Status (Active, Inactive, Maintenance, Removed, Planned)

**Location & Positioning:**
- Latitude and longitude coordinates
- Platform height above ground
- Mounting structure type

**Timeline & Programs:**
- Deployment date
- Operation programs
- Description and notes

### What You Cannot Edit
- Normalized names and IDs (managed by SITES Spectral Center)
- Station assignment

## Updating Instrument Information

### Accessing Instrument Details
1. **Click on any instrument card** to open the detailed view modal
2. **Click the green "Edit" button** to modify information
3. Complete the comprehensive edit form

### Editable Instrument Fields
You can update extensive information including:

**Basic Information:**
- Display name
- Status (Active, Inactive, Maintenance, Removed, Planned, Testing)
- Instrument type and ecosystem classification
- Measurement status and legacy acronym

**Type-Specific Specifications (v9.0.11+):**

The edit modal automatically adapts to show relevant fields for each instrument type:

| Instrument Type | Specification Fields |
|-----------------|---------------------|
| Phenocam | Camera brand, model, resolution, interval |
| Multispectral | Number of channels, orientation, datalogger |
| PAR Sensor | Spectral range, calibration coefficient |
| NDVI Sensor | Red wavelength, NIR wavelength |
| PRI Sensor | Band 1 wavelength (~531nm), Band 2 wavelength (~570nm) |
| Hyperspectral | Spectral range start/end, spectral resolution |

**Camera Specifications (Phenocams):**
- Camera brand and model
- Camera resolution
- Serial number
- Imaging interval

**Position & Orientation:**
- Precise latitude and longitude coordinates
- Instrument height above ground
- Viewing direction (North, Northeast, East, Southeast, South, Southwest, West, Northwest)
- Azimuth degrees (0-360°)
- Degrees from nadir

**Timeline & Classification:**
- First measurement year
- Last measurement year
- Measurement status
- Deployment date

**Notes & Context:**
- General description
- Installation notes
- Maintenance notes
- Operational details

### What You Cannot Edit
- Normalized names and IDs (managed by SITES Spectral Center)
- Platform assignment
- Station assignment

## Data Export

### Exporting Station Data
1. **Use the export functionality** to download current data
2. **CSV format recommended** for easy viewing in spreadsheet software
3. Export includes all platform and instrument details for your station
4. Use exported data for:
   - Offline review and planning
   - Sharing with local team members
   - Preparation for field work

## Priority Updates Needed

We especially encourage you to review and update:

### **Position & Coordinates**
- Verify GPS coordinates for all platforms and instruments
- Update any instruments moved since initial installation
- Correct elevation and height measurements

### **Camera Specifications**
- Complete camera brand, model, and resolution information
- Add serial numbers for equipment tracking
- Update viewing directions and orientations

### **Timeline Information**
- Confirm first and last measurement years
- Update deployment dates
- Set current operational status

### **Operational Context**
- Add installation notes and maintenance history
- Update descriptions with current operational details
- Note any equipment changes or upgrades

## Best Practices

### Regular Updates
- **Review your station data quarterly**
- **Update immediately after equipment changes**
- **Verify coordinates during field visits**

### Accuracy
- **Double-check GPS coordinates** before saving
- **Use precise measurements** for heights and orientations
- **Keep descriptions current and detailed**

### Documentation
- **Add detailed notes** about equipment changes
- **Document maintenance activities**
- **Record any operational issues or solutions**

## Need Help or New Equipment?

### For New Platforms or Instruments
If you need to add new platforms or instruments to your station:

**Contact:** SITES Spectral Thematic Center
**Email:** jose.beltran@mgeo.lu.se
**Subject:** New Platform/Instrument Request - [Your Station Name]

Please include:
- Proposed location and coordinates
- Equipment specifications
- Intended research purpose
- Timeline for installation

### For Technical Support
For login issues, system problems, or questions about using the database:

**Contact:** SITES Spectral Thematic Center
**Email:** jose.beltran@mgeo.lu.se
**Subject:** Database Support - [Your Station Name]

### For Data Questions
For questions about data interpretation, field protocols, or research coordination:

**Contact:** SITES Spectral Thematic Center
**Email:** jose.beltran@mgeo.lu.se

## System Features

### User Interface
- **Responsive design** works on desktop, tablet, and mobile devices
- **Real-time updates** - changes are saved immediately
- **Visual feedback** - success notifications confirm your updates
- **Help tooltips** throughout the interface

### Data Validation
- **Coordinate validation** ensures realistic GPS coordinates
- **Required field checking** prevents incomplete submissions
- **Format validation** for dates, numbers, and text fields

### Security
- **Role-based access** - you can only edit your assigned station
- **Activity logging** - all changes are tracked for audit purposes
- **Session management** - automatic logout after inactivity

## Getting the Most from the System

### Regular Review Workflow
1. **Monthly**: Quick review of all instrument status
2. **Quarterly**: Comprehensive coordinate and specification check
3. **After field work**: Update any changes or observations
4. **Before reports**: Export current data for documentation

### Quality Assurance
- **Cross-reference with field notes** when updating coordinates
- **Verify camera specifications** with equipment labels
- **Confirm operational status** with recent data collection

Thank you for helping maintain the SITES Spectral Instruments Database! Your accurate and timely updates ensure that our research network operates effectively and that data quality remains high across all stations.

---

*This guide covers the essential features available to station users. For advanced features or administrative functions, please contact the SITES Spectral Thematic Center.*