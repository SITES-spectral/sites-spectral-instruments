# User Manual: Enhanced CRUD Operations
## SITES Spectral Research Station Management System v5.2.0

---

## 🎯 Overview

This manual provides comprehensive guidance for using the enhanced CRUD (Create, Read, Update, Delete) operations in the SITES Spectral research station management system. The enhancements include advanced camera specifications, multiselect research programs, improved ecosystem classification, and ROI management tools.

### Who Should Use This Manual
- **Station Managers**: Day-to-day instrument management and data entry
- **Research Scientists**: Setting up instruments for specific studies
- **System Administrators**: Advanced configuration and troubleshooting

---

## 🚀 Getting Started

### Accessing the System
1. Navigate to [https://sites.jobelab.com](https://sites.jobelab.com)
2. Use your **Cloudflare username** credentials (not email/password)
3. Select your station or admin dashboard based on your role

### User Roles and Permissions
- **Admin Users**: Full access to all CRUD operations across all stations
- **Station Users**: Create, edit, and delete instruments within their assigned station
- **Read-Only Users**: View-only access to station data

---

## 📷 Working with Camera Specifications

### Camera Specification Fields Explained

#### **Aperture (f-stop)**
**What it is**: Controls the size of the lens opening that lets light into the camera.

**How to enter**: Use f-stop notation
- ✅ Correct: `f/2.8`, `f/5.6`, `f/8.0`
- ❌ Incorrect: `2.8`, `F2.8`, `f2.8`

**Scientific importance**: Affects depth of field and image sharpness. For phenocam monitoring:
- `f/8.0` - Recommended for landscape phenocams (maximum sharpness)
- `f/5.6` - Good balance for most conditions
- `f/2.8` - Use only when more light is needed

#### **Exposure Time (Shutter Speed)**
**What it is**: Duration the camera sensor is exposed to light.

**How to enter**: Fractions for fast speeds, decimals for slow speeds
- ✅ Fast speeds: `1/60`, `1/125`, `1/250`
- ✅ Slow speeds: `0.5`, `2.0`, `4.0`

**Scientific importance**: Critical for avoiding motion blur in windy conditions:
- `1/125` sec - Recommended minimum for vegetation monitoring
- `1/60` sec - Acceptable for calm conditions
- Slower speeds - Only for stable mounting and calm weather

#### **Focal Length**
**What it is**: Distance from lens center to sensor, determining field of view.

**How to enter**: Numeric value in millimeters
- ✅ Examples: `18`, `50`, `85`, `200`
- System automatically adds "mm" unit

**Scientific importance**: Determines monitoring area coverage:
- `18mm` - Wide angle, large area coverage
- `50mm` - Standard field of view, natural perspective
- `200mm` - Telephoto, specific target monitoring

#### **ISO (Sensor Sensitivity)**
**What it is**: Camera sensor's sensitivity to light.

**How to enter**: Select from dropdown with standard values
- Available: 50, 100, 200, 400, 800, 1600, 3200

**Scientific importance**: Balance between image quality and noise:
- ISO 100-200: Bright daylight conditions
- ISO 400: Overcast or early/late day
- ISO 800+: Low light conditions (more noise)

#### **Lens Specifications**
**What it is**: Complete lens model and manufacturer information.

**How to enter**: Full specifications including manufacturer
- ✅ Examples:
  - `Canon EF 50mm f/1.8 STM`
  - `Nikon AF-S 18-55mm f/3.5-5.6G VR`
  - `Sony FE 24-70mm f/2.8 GM`

**Scientific importance**: Lens characteristics affect image quality and distortion correction.

#### **Resolution (Mega Pixels)**
**What it is**: Camera sensor resolution in millions of pixels.

**How to enter**: Decimal number with MP automatically added
- ✅ Examples: `12.3`, `24.7`, `45.0`

**Scientific importance**: Higher resolution provides more detail for vegetation analysis:
- 6+ MP: Minimum for phenocam analysis
- 12+ MP: Standard research quality
- 24+ MP: High-detail analysis

#### **White Balance**
**What it is**: Color temperature setting for accurate color reproduction.

**How to enter**: Select from predefined options
- **Daylight (5600K)**: Standard outdoor monitoring (recommended)
- **Auto**: Camera automatic adjustment
- **Cloudy (6500K)**: Overcast conditions
- **Manual**: Custom Kelvin value

**Scientific importance**: Essential for consistent vegetation index calculations and color analysis.

### Quick Setup Guide for Common Camera Types

#### **Standard Phenocam Setup (Recommended)**
```
Aperture: f/8.0
Exposure Time: 1/125
Focal Length: 50
ISO: 200
White Balance: Daylight
```

#### **Wide Area Monitoring**
```
Aperture: f/11
Exposure Time: 1/60
Focal Length: 18
ISO: 100
White Balance: Daylight
```

#### **Specific Target Monitoring**
```
Aperture: f/5.6
Exposure Time: 1/250
Focal Length: 200
ISO: 400
White Balance: Auto
```

---

## 🔬 Research Programs Management

### Understanding Research Programs
Research programs represent collaborative scientific networks that utilize data from SITES instruments. One instrument can participate in multiple programs simultaneously.

### Available Research Programs

#### **Primary SITES Networks**
- **SITES Spectral**: Swedish Infrastructure for Ecosystem Science spectral monitoring
- **ICOS**: Integrated Carbon Observation System

#### **European Networks**
- **LTER**: Long Term Ecological Research
- **eLTER**: European Long Term Ecological Research Infrastructure
- **EnvRi**: Environmental Research Infrastructures
- **INTERACT**: International Network for Terrestrial Research and Monitoring in the Arctic

#### **Global Networks**
- **PhenoCam Network**: Continental-scale phenology observations
- **FLUXNET**: Global network of micrometeorological flux measurement sites
- **NEON**: National Ecological Observatory Network

#### **Data Management**
- **DEIMS-SDR**: Dynamic Ecological Information Management System

### How to Select Research Programs

#### **Method 1: Manual Selection**
1. Hold `Ctrl` (Windows) or `⌘ Cmd` (Mac)
2. Click each program you want to include
3. Click again to deselect

#### **Method 2: Quick Selection Buttons**
- **SITES Only**: Selects core SITES programs
- **European Networks**: Selects all European research networks
- **Global Networks**: Selects international programs
- **Clear All**: Removes all selections

### Selection Guidelines

#### **When to Include Multiple Programs**
✅ **Include if**:
- Your station has formal partnerships
- Data sharing agreements are in place
- Research objectives align with program goals
- Institutional policies allow data sharing

❌ **Don't include if**:
- No formal agreement exists
- Data has usage restrictions
- Program requirements conflict

#### **Coordination Requirements**
1. **Check with Station Manager**: Verify institutional affiliations
2. **Review Data Agreements**: Ensure compliance with sharing policies
3. **Document Selections**: Keep records of program participations
4. **Update as Needed**: Add/remove programs as partnerships change

---

## 🌍 Ecosystem Classification

### Understanding Ecosystem Codes
Ecosystem codes provide standardized classification for the primary ecosystem type being monitored. Choose the most specific code that accurately describes your monitoring area.

### Official SITES Ecosystem Codes

#### **Forest Ecosystems** 🌲
| Code | Name | Description | When to Use |
|------|------|-------------|-------------|
| **FOR** | General Forest | Mixed or unspecified forest types | Unknown composition or diverse mix |
| **CON** | Coniferous Forest | Spruce, pine, fir dominated | >60% coniferous species |
| **DEC** | Deciduous Forest | Birch, oak, beech dominated | >60% deciduous species |
| **ALP** | Alpine Forest | High-elevation forest | Above montane zone |

#### **Wetland Ecosystems** 🌾
| Code | Name | Description | When to Use |
|------|------|-------------|-------------|
| **MIR** | Mires | Bog and fen peatland systems | Nutrient-poor peat-forming wetlands |
| **WET** | General Wetland | Non-peat wetland areas | Seasonal/permanent wet areas |
| **PEA** | Peatland | Specialized peat-forming | Deep organic soil accumulation |
| **MAR** | Marshland | Seasonal/permanent marsh | Lake margins, river associations |

#### **Open Ecosystems** 🌱
| Code | Name | Description | When to Use |
|------|------|-------------|-------------|
| **HEA** | Heathland | Shrub-dominated open areas | Heath vegetation on acidic soils |
| **GRA** | Grassland | Natural/semi-natural grasslands | Meadows and pastures |
| **AGR** | Arable Land | Agricultural/cultivated areas | Crop fields, managed farmland |

#### **Aquatic Ecosystems** 💧
| Code | Name | Description | When to Use |
|------|------|-------------|-------------|
| **LAK** | Lake | Freshwater lake ecosystems | Open water or littoral monitoring |

### Classification Guidelines

#### **For Mixed Ecosystems**
1. **Identify Dominant Type**: Choose ecosystem covering >50% of monitoring area
2. **Consider Research Focus**: Select type most relevant to study objectives
3. **Use General Codes**: When specific classification is uncertain

#### **For Transitional Areas**
1. **Assess Seasonal Variation**: Consider dominant type across seasons
2. **Document Uncertainty**: Use maintenance notes to explain classification
3. **Consult Specialists**: Get ecological expert input for complex areas

#### **Classification Changes**
- **Management Changes**: Update if forest harvesting, agricultural conversion
- **Natural Succession**: Update for gradual ecosystem transitions
- **Disturbance Events**: Update after fires, floods, or other major events

---

## 🛠️ Step-by-Step CRUD Operations

### Creating a New Instrument

#### **Step 1: Access Creation Form**
1. Navigate to your station page
2. Scroll to the Platforms section
3. Find the target platform
4. Click **"Create Instrument"** button

#### **Step 2: Basic Information**
```
Display Name: Clear, descriptive name
Platform: Auto-selected (verify correct platform)
Instrument Type: Usually "phenocam" for camera systems
Status: Active (default) or Inactive
```

#### **Step 3: Camera Specifications**
Fill in all available camera settings:
1. **Start with physical lens**: Check lens markings for focal length and aperture range
2. **Check camera settings**: Access camera menu or review sample image EXIF data
3. **Use recommended settings**: See camera setup guides above
4. **Validate entries**: System will check format and provide suggestions

#### **Step 4: Research Programs**
1. **Review available programs**: See programs list above
2. **Check institutional agreements**: Coordinate with station manager
3. **Select applicable programs**: Use multiselect or quick buttons
4. **Verify selections**: Check the selected programs display

#### **Step 5: Ecosystem Classification**
1. **Assess monitoring area**: Identify dominant ecosystem type
2. **Choose specific code**: Select most accurate classification
3. **Review description**: Verify selected code matches your area
4. **Document uncertainty**: Use description field for complex areas

#### **Step 6: Position and Setup**
```
Latitude/Longitude: GPS coordinates in decimal degrees
Height: Instrument height above ground in meters
Viewing Direction: Cardinal direction (North, South, etc.)
Azimuth: Degrees from North (0-360)
Deployment Date: Installation date
```

#### **Step 7: Documentation**
```
Description: Scientific purpose and monitoring objectives
Installation Notes: Technical setup details
Maintenance Notes: Service schedule and requirements
```

#### **Step 8: Submit and Verify**
1. **Review all entries**: Check for completeness and accuracy
2. **Submit form**: Click "Create Instrument"
3. **Verify creation**: Check instrument appears in platform list
4. **Record ID**: Note auto-generated normalized name

### Editing Existing Instruments

#### **Permission Check**
- **Station Users**: Can edit all fields except normalized names
- **Admin Users**: Can edit all fields including system identifiers

#### **Edit Process**
1. **Find instrument**: Navigate to station → platform → instrument
2. **Click "Edit"**: Opens pre-populated form
3. **Update fields**: Modify only necessary fields
4. **Document changes**: Update maintenance notes with change description
5. **Submit updates**: Verify changes are saved

#### **Common Edits**
- **Camera settings**: After physical adjustments or calibration
- **Research programs**: When joining/leaving networks
- **Status changes**: Active ↔ Inactive transitions
- **Documentation**: Regular maintenance note updates

### Deleting Instruments

#### **Prerequisites**
- **ROI Cleanup**: Delete all associated ROIs first
- **Data Backup**: Consider exporting data before deletion
- **Permission**: Admin or station user for own instruments

#### **Deletion Process**
1. **Verify prerequisites**: System checks for dependent ROIs
2. **Confirm deletion**: Review warning about permanent removal
3. **Document reason**: Add note about why instrument is being removed
4. **Execute deletion**: Confirm final deletion

⚠️ **Warning**: Instrument deletion is permanent and cannot be undone!

---

## 🎯 ROI Management with Enhanced Instruments

### Understanding ROI Interaction with Camera Specs

#### **Resolution Considerations**
- **Higher MP cameras**: Allow smaller, more precise ROIs
- **Lower resolution**: Require larger ROIs for meaningful analysis
- **Minimum ROI size**: Calculate based on camera resolution

#### **Field of View Impact**
- **Wide angle lenses (18mm)**: ROIs cover larger ground area
- **Standard lenses (50mm)**: Natural perspective for ROI definition
- **Telephoto lenses (200mm)**: ROIs target specific features

#### **ROI Planning with Camera Data**
1. **Review camera specifications**: Check focal length and resolution
2. **Calculate ground coverage**: Use height and focal length
3. **Plan ROI positioning**: Consider viewing angle and distortion
4. **Validate ROI geometry**: Ensure adequate pixel coverage

### Enhanced ROI Workflows

#### **ROI Creation for High-Resolution Cameras**
```
1. Review instrument specifications
2. Calculate optimal ROI size based on resolution
3. Use focal length to estimate ground coverage
4. Create ROIs with appropriate pixel margins
```

#### **ROI Validation Checklist**
- ✅ Adequate resolution for intended analysis
- ✅ Consistent with camera field of view
- ✅ Appropriate for focal length and height
- ✅ Accounts for seasonal vegetation changes

---

## 📊 Data Export and Reporting

### Enhanced Export Features

#### **Camera Specification Exports**
```javascript
// Example export data structure
{
  "instrument_id": 42,
  "normalized_name": "SVB_FOR_P02_PHE_01",
  "camera_specifications": {
    "aperture": "f/8.0",
    "exposure_time": "1/125",
    "focal_length_mm": 50,
    "iso": 200,
    "lens": "Canon EF 50mm f/1.8 STM",
    "mega_pixels": 24.7,
    "white_balance": "Daylight"
  },
  "research_programs": ["SITES_SPECTRAL", "ICOS", "LTER"],
  "ecosystem_code": "CON"
}
```

#### **Export Formats**
- **CSV**: Spreadsheet-compatible format
- **JSON**: API-compatible format
- **TSV**: Tab-separated for analysis tools

#### **Export Filtering**
- Filter by research programs
- Filter by ecosystem codes
- Date range filtering
- Station/platform specific exports

---

## 🔧 Troubleshooting Common Issues

### Camera Specification Validation Errors

#### **Aperture Format Issues**
❌ **Error**: "Invalid aperture format"
✅ **Solution**: Use format `f/2.8` (with f/ prefix)

❌ **Error**: "Aperture value not recognized"
✅ **Solution**: Use standard f-stop values (1.4, 2.0, 2.8, 4.0, 5.6, 8.0, 11, 16)

#### **Exposure Time Problems**
❌ **Error**: "Invalid exposure time format"
✅ **Solution**: Use fractions `1/60` or decimals `0.5`

❌ **Error**: "Exposure time out of range"
✅ **Solution**: Use realistic values (1/4000 to 30 seconds)

#### **ISO Selection Issues**
❌ **Error**: "ISO value not supported"
✅ **Solution**: Select from dropdown (50, 100, 200, 400, 800, 1600, 3200)

### Research Programs Selection Problems

#### **No Programs Selected**
❌ **Error**: "At least one research program required"
✅ **Solution**: Select applicable programs or contact admin for guidance

#### **Program Selection Not Saving**
❌ **Problem**: Selections disappear after form submission
✅ **Solution**:
1. Ensure JavaScript is enabled
2. Use Ctrl/Cmd for multiple selections
3. Check browser compatibility

### Ecosystem Code Issues

#### **Code Not Found**
❌ **Error**: "Invalid ecosystem code"
✅ **Solution**: Select from official 12-code list only

#### **Classification Uncertainty**
❌ **Problem**: Unsure which code to select
✅ **Solution**:
1. Consult ecosystem descriptions
2. Contact ecological specialist
3. Use general codes (FOR, WET) when uncertain
4. Document uncertainty in description field

---

## 📞 Support and Additional Resources

### Getting Help

#### **Station Managers**
1. **Check this manual** for step-by-step guidance
2. **Contact system administrator** for technical issues
3. **Coordinate with research teams** for program selections

#### **System Administrators**
1. **API Documentation**: See technical documentation files
2. **Database Issues**: Check server logs and connectivity
3. **User Permissions**: Review role assignments and access controls

### Best Practices Summary

#### **Data Quality**
- ✅ Verify camera specifications with physical equipment
- ✅ Coordinate research program selections with institutional policies
- ✅ Document uncertain classifications with detailed notes
- ✅ Regular maintenance and calibration of specifications

#### **Collaboration**
- ✅ Share access appropriately based on roles
- ✅ Document all changes in maintenance notes
- ✅ Coordinate with research networks for program participation
- ✅ Regular communication between station managers and researchers

#### **System Security**
- ✅ Use strong Cloudflare credentials
- ✅ Log out after sessions
- ✅ Report suspicious activity
- ✅ Keep access credentials secure

---

## 📋 Quick Reference

### Camera Specs Checklist
```
□ Aperture (f/2.8, f/5.6, f/8.0)
□ Exposure Time (1/60, 1/125, 0.5)
□ Focal Length (18, 50, 200) mm
□ ISO (100, 200, 400, 800)
□ Lens (manufacturer + model)
□ Resolution (12.3, 24.7) MP
□ White Balance (Daylight, Auto)
```

### Research Programs Quick Select
```
SITES Networks: SITES_SPECTRAL, ICOS
European: LTER, eLTER, EnvRi, INTERACT
Global: PhenoCam, FLUXNET, NEON
Data Mgmt: DEIMS-SDR
```

### Ecosystem Codes Quick Ref
```
Forest: FOR (general), CON (coniferous), DEC (deciduous), ALP (alpine)
Wetland: MIR (mires), WET (general), PEA (peatland), MAR (marsh)
Open: HEA (heath), GRA (grassland), AGR (agriculture)
Aquatic: LAK (lake)
```

This user manual provides comprehensive guidance for using the enhanced CRUD operations while maintaining clarity for users with varying technical expertise levels.