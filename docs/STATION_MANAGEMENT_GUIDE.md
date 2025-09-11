# SITES Spectral Stations & Instruments Management Guide

## Quick Start for Station Managers

This guide explains how to easily add, update, and manage platforms and instruments using the SITES Spectral web interface.

### 🔐 Access the System

1. **Web Interface**: Visit `https://sites.jobelab.com`
2. **Login**: Use your station-specific credentials
   - Username: Your station name (e.g., `abisko`, `lonnstorp`, `skogaryd`)  
   - Password: Provided by system administrator
3. **Dashboard**: After login, you'll see your station's management dashboard

---

## 📋 Current System Status

### Database Status
- **Stations**: ✅ 9 stations loaded and active
- **Instruments**: ✅ Active phenocams and sensors from YAML configs
- **Platforms**: ⚠️ **None currently defined** - platforms need to be created

### Data Sources
- **Station metadata**: From YAML configuration files
- **Instruments**: Imported from `stations.yaml` configurations  
- **Platform data**: Currently missing - needs manual creation

---

## 🏗️ Managing Platforms

Platforms are physical structures (towers, masts, buildings) that hold instruments. **Currently no platforms exist in the system**, so you'll need to create them first.

### Creating a New Platform

1. **Navigate to Platform Management**
   - Go to your station dashboard
   - Click "Platform Management" or "Add Platform"

2. **Required Information**
   ```
   Platform ID: e.g., "BL01", "PL01", "TOWER_01"
   Name: Descriptive name like "Building RoofTop"
   Type: Choose from:
     • Tower - Free-standing tower structure
     • Mast - Pole or mast structure  
     • Building - Building-mounted platform
     • Ground - Ground-level platform
   ```

3. **Location Data**
   ```
   Latitude: Decimal degrees (e.g., 55.668731)
   Longitude: Decimal degrees (e.g., 13.108632) 
   Elevation: Height above sea level (optional)
   Platform Height: Height above ground in meters
   ```

4. **Additional Details**
   ```
   Structure Material: Steel, wood, concrete, etc.
   Installation Date: When platform was installed
   Status: Active, Maintenance, Decommissioned
   Notes: Any special information
   ```

### Platform Examples Based on Current Instruments

Based on your existing instruments, you should create these platforms:

#### Abisko Station
```yaml
Platform ID: BL01
Name: Building RoofTop Platform  
Type: building
Height: 4.5m above ground
Location: Building rooftop
Supports: ANS_FOR_BL01_PHE01 phenocam
```

#### Lönnstorp Station  
```yaml
Platform ID: PL01
Name: Agricultural Mast Platform
Type: mast  
Height: 10m above ground
Location: Agricultural field
Supports: 3 phenocams (PHE01, PHE02, PHE03)
```

---

## 📷 Managing Instruments

Instruments are currently loaded from YAML files but can be managed through the web interface.

### Viewing Current Instruments

1. **Dashboard Overview**: See all your instruments at a glance
2. **Detailed View**: Click on any instrument for full specifications
3. **Map View**: See instrument locations on interactive map

### Adding New Instruments

1. **Prerequisites**: Create platform first (see above)
2. **Instrument Details**:
   ```
   Canonical ID: Follow naming convention 
     Format: {STATION}_{ECOSYSTEM}_{PLATFORM}_{INSTRUMENT}
     Example: LON_AGR_PL01_PHE04
   
   Type: phenocam, sensor, spectrometer
   Status: Active, Testing, Maintenance, Decommissioned
   Location: Platform location (BL01, PL01, etc.)
   ```

3. **Technical Specifications**:
   ```
   Platform Assignment: Select from available platforms
   Mounting Height: Height above ground  
   Viewing Direction: North, South, East, West, etc.
   Azimuth: Degrees (0-360)
   Tilt: Degrees from nadir (0-90)
   ```

### Updating Existing Instruments

1. **Select Instrument**: From dashboard or list view
2. **Edit Details**: Click "Edit" or pencil icon
3. **Modify Fields**: Update any editable information
4. **Save Changes**: Confirm updates

**Editable Fields**:
- Status (Active/Maintenance/Decommissioned)
- Platform assignment  
- Technical specifications
- Notes and descriptions
- ROI (Region of Interest) data

---

## 🗺️ Interactive Map Features

The system includes an interactive map showing all stations and their instruments:

### Map Functions
- **Station Markers**: Blue tower icons show station locations
- **Platform Markers**: Different icons for platform types
- **Information Popups**: Click markers for detailed information
- **Layer Controls**: Switch between satellite, topographic, and street views
- **Navigation**: Zoom and pan to explore all locations

### Using the Map
1. **Access**: Available from main dashboard or direct link
2. **Navigation**: Click and drag to move, scroll to zoom
3. **Information**: Click any marker for popup with details
4. **Management Links**: Direct links to manage specific stations/platforms

---

## 🔧 Common Workflows

### Adding a Complete New Setup

1. **Create Platform First**
   - Define physical structure (tower, mast, building)
   - Set precise coordinates
   - Specify height and construction details

2. **Add Instruments to Platform**  
   - Assign instruments to the platform
   - Set mounting specifications
   - Configure viewing angles and directions

3. **Verify Configuration**
   - Check instrument appears on map
   - Verify all data is correct
   - Test any automated data collection

### Maintenance Updates

1. **Status Changes**
   - Mark instruments as "Maintenance" when servicing
   - Update to "Active" when operational
   - Use "Decommissioned" for removed equipment

2. **Location Updates**
   - Update coordinates if equipment moved
   - Modify height if platform extended
   - Change viewing direction if repositioned

### Bulk Operations

The system supports bulk updates for multiple instruments:
- Status changes across multiple instruments
- Export data for reporting
- Filter and search capabilities

---

## 📊 Data Integration

### Current Data Sources

**Stations YAML Structure**:
```yaml
stations:
  station_name:
    phenocams:
      platforms:
        PLATFORM_ID:
          instruments:
            CANONICAL_ID:
              geolocation:
                point:
                  latitude_dd: XX.XXXXXX
                  longitude_dd: XX.XXXXXX
              platform_height_in_meters_above_ground: X.X
              instrument_viewing_direction: Direction
              azimuth_in_degrees: XXX
```

### Data Synchronization

- **YAML to Database**: System imports from configuration files
- **Web Updates**: Changes made via web interface update database
- **Conflict Resolution**: Web interface takes precedence over YAML
- **Backup**: Configuration changes should be reflected back to YAML files

---

## 🔐 Authentication & Permissions

### Station-Level Access

Each station has dedicated login credentials:
- **Username**: Station name (lowercase)
- **Password**: Secure generated password (contact administrator)
- **Permissions**: Full access to own station's data only

### Available Roles

1. **Station User** (Your role)
   - View and edit own station's instruments and platforms
   - Create new instruments and platforms for your station
   - Update status and technical specifications
   - Cannot access other stations' data

2. **Admin User**
   - Full system access across all stations
   - User management capabilities
   - System configuration and maintenance

### Security Best Practices

- **Password Security**: Keep your login credentials secure
- **Session Management**: System will auto-logout after inactivity
- **Data Privacy**: You can only see your station's data
- **Audit Trail**: All changes are logged with timestamps and user ID

---

## 🆘 Support & Troubleshooting

### Common Issues

**Cannot see platforms on map**:
- Check that platforms have been created with coordinates
- Verify latitude/longitude are in decimal degrees format
- Ensure platform status is "Active"

**Instruments not appearing**:
- Confirm instrument is assigned to a platform
- Check that platform coordinates are set
- Verify instrument status is "Active"

**Login problems**:
- Ensure username is your station name (lowercase)
- Contact administrator if password needs reset
- Check that your user account is active

### Getting Help

- **Documentation**: This guide and system help pages
- **System Status**: Check dashboard for any alerts or issues
- **Technical Support**: Contact system administrator
- **Feature Requests**: Submit via support channels

---

## 📝 Quick Reference

### Essential URLs
- **Main Dashboard**: `https://sites.jobelab.com`
- **Interactive Map**: `https://sites.jobelab.com/stations.html`
- **Station Management**: `https://sites.jobelab.com/station/dashboard.html`

### Common ID Formats
```
Station Codes: abisko, lonnstorp, skogaryd, svartberget, etc.
Platform IDs: BL01, PL01, TOWER_01, MAST_02
Canonical IDs: {STATION}_{ECOSYSTEM}_{PLATFORM}_{TYPE}{NUMBER}
Example: LON_AGR_PL01_PHE01
```

### Platform Types
- **tower**: Free-standing structures
- **mast**: Pole structures
- **building**: Building-mounted
- **ground**: Ground-level installations

### Instrument Types  
- **phenocam**: Digital cameras for phenology
- **sensor**: Various sensor types
- **spectrometer**: Spectral analysis instruments

---

*This guide covers the essential workflows for managing your station's platforms and instruments. For detailed technical specifications or advanced configuration options, consult the full system documentation or contact technical support.*