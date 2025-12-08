# CRUD Enhancements Documentation
## Research Station Management System v5.2.0

---

## 📷 Camera Specification Fields Documentation

### Field Definitions and Best Practices

#### **Aperture**
- **Definition**: Camera lens opening size that controls depth of field and light intake
- **Format**: f-stop notation (f/1.4, f/2.8, f/5.6, f/8.0, f/11, f/16)
- **Scientific Relevance**: Affects image sharpness and depth of field for phenocam monitoring
- **Examples**:
  - f/2.8 (wide aperture, shallow depth of field)
  - f/8.0 (optimal sharpness for landscape photography)
  - f/11 (maximum depth of field for distant subjects)

#### **Exposure Time**
- **Definition**: Duration the camera sensor is exposed to light (shutter speed)
- **Format**: Fractions of seconds or decimal seconds (1/60, 1/125, 0.5, 2.0)
- **Scientific Relevance**: Critical for capturing clear vegetation images without motion blur
- **Examples**:
  - 1/60 sec (standard daylight exposure)
  - 1/125 sec (faster for windy conditions)
  - 2.0 sec (long exposure for low light conditions)

#### **Focal Length**
- **Definition**: Distance from lens optical center to sensor, determining field of view
- **Format**: Millimeters (18mm, 35mm, 50mm, 85mm, 200mm)
- **Scientific Relevance**: Determines coverage area and magnification for ecosystem monitoring
- **Examples**:
  - 18mm (wide-angle, large area coverage)
  - 50mm (standard field of view)
  - 200mm (telephoto, specific target monitoring)

#### **ISO**
- **Definition**: Camera sensor sensitivity to light
- **Format**: Numeric values (100, 200, 400, 800, 1600, 3200)
- **Scientific Relevance**: Affects image noise and quality in varying light conditions
- **Examples**:
  - ISO 100 (bright daylight, minimal noise)
  - ISO 400 (overcast conditions)
  - ISO 800 (early morning/late evening)

#### **Lens**
- **Definition**: Complete lens model and specifications including manufacturer
- **Format**: Manufacturer + Model + Specifications
- **Scientific Relevance**: Lens characteristics affect image quality and distortion
- **Examples**:
  - "Canon EF 24-70mm f/2.8L USM"
  - "Nikon AF-S 18-55mm f/3.5-5.6G VR"
  - "Sony FE 50mm f/1.8"

#### **Mega Pixels**
- **Definition**: Camera sensor resolution in millions of pixels
- **Format**: Decimal with MP suffix (6.2 MP, 12.3 MP, 24.7 MP)
- **Scientific Relevance**: Determines image detail level for vegetation analysis
- **Examples**:
  - 6.2 MP (sufficient for time-lapse)
  - 12.3 MP (standard research quality)
  - 24.7 MP (high-detail analysis)

#### **White Balance**
- **Definition**: Color temperature adjustment for accurate color reproduction
- **Format**: Preset names or Kelvin values
- **Scientific Relevance**: Essential for consistent vegetation index calculations
- **Examples**:
  - Auto (camera automatic adjustment)
  - Daylight (5600K, standard outdoor)
  - Cloudy (6500K, overcast conditions)
  - Manual (custom Kelvin value)

---

## 🔬 Research Programs Documentation

### Multiselect Research Programs
Research programs represent collaborative scientific initiatives that utilize phenocam data. Multiple programs can be associated with a single instrument.

#### **Available Research Programs**:
1. **SITES Spectral** - Swedish Infrastructure for Ecosystem Science spectral monitoring
2. **ICOS** - Integrated Carbon Observation System
3. **LTER** - Long Term Ecological Research
4. **eLTER** - European Long Term Ecological Research Infrastructure
5. **PhenoCam Network** - Continental-scale phenology observations
6. **FLUXNET** - Global network of micrometeorological flux measurement sites
7. **NEON** - National Ecological Observatory Network
8. **INTERACT** - International Network for Terrestrial Research and Monitoring in the Arctic
9. **EnvRi** - Environmental Research Infrastructures
10. **DEIMS-SDR** - Dynamic Ecological Information Management System

#### **Selection Guidelines**:
- Select all applicable research programs for comprehensive data sharing
- Consider data usage agreements when selecting programs
- Update selections when joining or leaving research networks
- Coordinate with station managers for institutional affiliations

---

## 🌍 Ecosystem Codes Documentation

### Official SITES Ecosystem Classification

All 12 officially supported ecosystem codes for Swedish research stations:

#### **Forest Ecosystems**
- **FOR** - General Forest (mixed or unspecified forest types)
- **CON** - Coniferous Forest (spruce, pine, fir dominated)
- **DEC** - Deciduous Forest (birch, oak, beech dominated)
- **ALP** - Alpine Forest (high-elevation forest ecosystems)

#### **Wetland Ecosystems**
- **MIR** - Mires (bog and fen peatland systems)
- **WET** - General Wetland (non-peat wetland areas)
- **PEA** - Peatland (specialized peat-forming wetlands)
- **MAR** - Marshland (seasonal or permanent marsh areas)

#### **Open Ecosystems**
- **HEA** - Heathland (shrub-dominated open areas)
- **GRA** - Grassland (natural and semi-natural grasslands)
- **AGR** - Arable Land (agricultural and cultivated areas)

#### **Aquatic Ecosystems**
- **LAK** - Lake (freshwater lake ecosystems)

### **Usage Guidelines**:
- Select the most specific ecosystem code that accurately describes the monitoring area
- For mixed ecosystems, choose the dominant ecosystem type
- Coordinate with ecological specialists for complex ecosystem classification
- Update codes if ecosystem management or disturbance changes characteristics

---

## 🎯 User Interface Content

### Form Field Labels and Help Text

#### **Camera Specifications Section**
```html
<!-- Aperture Field -->
<label for="aperture" class="form-label">
  Aperture <span class="text-muted">(f-stop)</span>
</label>
<input type="text" class="form-control" id="aperture" placeholder="e.g., f/2.8, f/5.6, f/8.0">
<div class="form-text">
  Lens aperture setting in f-stop notation. Affects depth of field and light intake.
</div>

<!-- Exposure Time Field -->
<label for="exposureTime" class="form-label">
  Exposure Time <span class="text-muted">(shutter speed)</span>
</label>
<input type="text" class="form-control" id="exposureTime" placeholder="e.g., 1/60, 1/125, 2.0">
<div class="form-text">
  Shutter speed in seconds or fractions. Critical for avoiding motion blur.
</div>

<!-- Focal Length Field -->
<label for="focalLength" class="form-label">
  Focal Length <span class="text-muted">(mm)</span>
</label>
<input type="text" class="form-control" id="focalLength" placeholder="e.g., 18mm, 50mm, 200mm">
<div class="form-text">
  Lens focal length in millimeters. Determines field of view and magnification.
</div>

<!-- ISO Field -->
<label for="iso" class="form-label">
  ISO <span class="text-muted">(sensitivity)</span>
</label>
<input type="number" class="form-control" id="iso" placeholder="e.g., 100, 400, 800">
<div class="form-text">
  Camera sensor sensitivity. Lower values reduce noise in good lighting.
</div>

<!-- Lens Field -->
<label for="lens" class="form-label">
  Lens <span class="text-muted">(complete specifications)</span>
</label>
<input type="text" class="form-control" id="lens" placeholder="e.g., Canon EF 24-70mm f/2.8L USM">
<div class="form-text">
  Complete lens model including manufacturer and specifications.
</div>

<!-- Mega Pixels Field -->
<label for="megaPixels" class="form-label">
  Resolution <span class="text-muted">(MP)</span>
</label>
<input type="text" class="form-control" id="megaPixels" placeholder="e.g., 12.3 MP, 24.7 MP">
<div class="form-text">
  Camera sensor resolution in megapixels. Higher resolution provides more detail.
</div>

<!-- White Balance Field -->
<label for="whiteBalance" class="form-label">
  White Balance <span class="text-muted">(color temperature)</span>
</label>
<select class="form-select" id="whiteBalance">
  <option value="">Select white balance setting...</option>
  <option value="Auto">Auto (camera automatic)</option>
  <option value="Daylight">Daylight (5600K)</option>
  <option value="Cloudy">Cloudy (6500K)</option>
  <option value="Shade">Shade (7500K)</option>
  <option value="Tungsten">Tungsten (3200K)</option>
  <option value="Fluorescent">Fluorescent (4000K)</option>
  <option value="Manual">Manual (custom setting)</option>
</select>
<div class="form-text">
  Color temperature setting for accurate color reproduction in vegetation analysis.
</div>
```

#### **Research Programs Multiselect**
```html
<label for="researchPrograms" class="form-label">
  Research Programs <span class="text-muted">(select all applicable)</span>
</label>
<select class="form-select" id="researchPrograms" multiple size="6">
  <option value="SITES_SPECTRAL">SITES Spectral</option>
  <option value="ICOS">ICOS (Integrated Carbon Observation System)</option>
  <option value="LTER">LTER (Long Term Ecological Research)</option>
  <option value="ELTER">eLTER (European Long Term Ecological Research)</option>
  <option value="PHENOCAM">PhenoCam Network</option>
  <option value="FLUXNET">FLUXNET</option>
  <option value="NEON">NEON (National Ecological Observatory Network)</option>
  <option value="INTERACT">INTERACT (Arctic Research Network)</option>
  <option value="ENVRI">EnvRi (Environmental Research Infrastructures)</option>
  <option value="DEIMS_SDR">DEIMS-SDR (Ecological Information Management)</option>
</select>
<div class="form-text">
  Hold Ctrl (Cmd on Mac) to select multiple research programs. Choose all networks that will use this instrument's data.
</div>
```

#### **Ecosystem Code Dropdown**
```html
<label for="ecosystemCode" class="form-label">
  Ecosystem Code <span class="text-muted">(primary ecosystem type)</span>
</label>
<select class="form-select" id="ecosystemCode" required>
  <option value="">Select ecosystem type...</option>
  <optgroup label="Forest Ecosystems">
    <option value="FOR">FOR - General Forest</option>
    <option value="CON">CON - Coniferous Forest</option>
    <option value="DEC">DEC - Deciduous Forest</option>
    <option value="ALP">ALP - Alpine Forest</option>
  </optgroup>
  <optgroup label="Wetland Ecosystems">
    <option value="MIR">MIR - Mires</option>
    <option value="WET">WET - General Wetland</option>
    <option value="PEA">PEA - Peatland</option>
    <option value="MAR">MAR - Marshland</option>
  </optgroup>
  <optgroup label="Open Ecosystems">
    <option value="HEA">HEA - Heathland</option>
    <option value="GRA">GRA - Grassland</option>
    <option value="AGR">AGR - Arable Land</option>
  </optgroup>
  <optgroup label="Aquatic Ecosystems">
    <option value="LAK">LAK - Lake</option>
  </optgroup>
</select>
<div class="form-text">
  Select the primary ecosystem type being monitored. Choose the most specific code that accurately describes the area.
</div>
```

### Validation Error Messages

#### **Camera Specifications Validation**
```javascript
const validationMessages = {
  aperture: {
    invalid: "Aperture must be in f-stop format (e.g., f/2.8, f/5.6)",
    required: "Aperture setting is required for camera specifications"
  },
  exposureTime: {
    invalid: "Exposure time must be in seconds or fractions (e.g., 1/60, 0.5)",
    required: "Exposure time is required for proper image capture settings"
  },
  focalLength: {
    invalid: "Focal length must be specified in millimeters (e.g., 50mm)",
    required: "Focal length determines field of view and is required"
  },
  iso: {
    invalid: "ISO must be a numeric value (e.g., 100, 400, 800)",
    range: "ISO value should be between 50 and 6400 for scientific photography"
  },
  megaPixels: {
    invalid: "Resolution must be specified in megapixels (e.g., 12.3 MP)",
    minimum: "Minimum 6 MP resolution recommended for scientific imaging"
  },
  whiteBalance: {
    required: "White balance setting is required for color accuracy"
  }
};
```

### Tooltips for Technical Terms

```javascript
const tooltips = {
  aperture: "Controls depth of field and light intake. Smaller f-numbers = wider aperture = more light",
  exposureTime: "Controls motion blur and exposure. Faster speeds freeze motion, slower speeds allow more light",
  focalLength: "Determines field of view. Shorter lengths = wider view, longer lengths = magnified view",
  iso: "Sensor sensitivity to light. Higher ISO = more sensitive but potentially more noise",
  whiteBalance: "Adjusts colors for different lighting conditions to ensure accurate vegetation color analysis"
};
```

---

## 📋 Step-by-Step User Guides

### Creating an Instrument with Enhanced Specifications

#### **Step 1: Basic Information**
1. Click "Create Instrument" button in the platform section
2. Enter clear, descriptive **Display Name** (e.g., "Svartberget Forest Phenocam North")
3. Select appropriate **Platform** from dropdown
4. Choose **Instrument Type** (typically "phenocam" for camera systems)

#### **Step 2: Camera Specifications**
1. **Aperture**: Enter the lens aperture setting
   - Use f-stop notation (f/2.8, f/5.6, f/8.0)
   - Consult camera manual or check camera settings
   - For automatic cameras, use "Auto" or check EXIF data from sample images

2. **Exposure Time**: Specify shutter speed
   - Use fraction format for fast speeds (1/60, 1/125)
   - Use decimal format for slow speeds (0.5, 2.0)
   - Consider wind conditions and target vegetation movement

3. **Focal Length**: Enter lens focal length
   - Check lens markings or camera specifications
   - Include units (mm) in the value
   - For zoom lenses, specify the setting used

4. **ISO**: Set sensor sensitivity
   - Use standard ISO values (100, 200, 400, 800)
   - Lower values for bright conditions, higher for low light
   - Balance sensitivity with image noise requirements

5. **Lens**: Complete lens specifications
   - Include manufacturer and model
   - Add focal length range for zoom lenses
   - Include maximum aperture specification

6. **Resolution**: Camera sensor resolution
   - Check camera specifications for exact megapixel count
   - Use decimal format (12.3 MP, not 12MP)
   - Higher resolution provides more detail for analysis

7. **White Balance**: Color temperature setting
   - Select from predefined options or enter custom value
   - "Daylight" is standard for outdoor monitoring
   - "Auto" for varying lighting conditions

#### **Step 3: Research Programs**
1. **Multiple Selection**: Hold Ctrl (Windows) or Cmd (Mac) to select multiple programs
2. **Selection Criteria**:
   - Include all networks that will use the data
   - Consider institutional partnerships
   - Check data sharing agreements
   - Coordinate with station manager for official affiliations

#### **Step 4: Ecosystem Classification**
1. **Primary Ecosystem**: Select the most specific applicable code
2. **Mixed Ecosystems**: Choose the dominant ecosystem type
3. **Uncertainty**: Consult with ecological specialists if unsure
4. **Future Changes**: Can be updated if ecosystem management changes

### Editing Instrument Specifications

#### **Permission Requirements**
- **Station Users**: Can edit all fields except normalized names and legacy acronyms
- **Admin Users**: Can edit all fields including system-generated identifiers

#### **Best Practices for Updates**
1. **Document Changes**: Use maintenance notes to record specification updates
2. **Verify Settings**: Cross-check camera settings after physical adjustments
3. **Coordinate Updates**: Inform research program coordinators of significant changes
4. **Version Control**: Keep records of previous settings for data continuity

### ROI Management Workflow

#### **Creating ROIs for Enhanced Instruments**
1. **ROI Planning**: Consider camera specifications when defining regions
   - Higher resolution cameras allow smaller, more precise ROIs
   - Lens focal length affects ROI relative size
   - Camera position affects ROI geometry

2. **ROI Validation**: Use camera specifications for quality control
   - Verify ROI visibility within camera field of view
   - Check adequate resolution for intended analysis
   - Validate ROI positioning relative to known camera parameters

---

## 🔌 API Documentation

### Enhanced Instrument Endpoints

#### **POST /api/instruments**
Create new instrument with enhanced specifications.

**Request Body:**
```json
{
  "display_name": "Svartberget Forest Phenocam North",
  "platform_id": 15,
  "instrument_type": "phenocam",
  "ecosystem_code": "CON",
  "research_programs": ["SITES_SPECTRAL", "ICOS", "LTER"],
  "camera_specifications": {
    "aperture": "f/8.0",
    "exposure_time": "1/60",
    "focal_length": "50mm",
    "iso": 400,
    "lens": "Canon EF 50mm f/1.8 STM",
    "mega_pixels": "24.7 MP",
    "white_balance": "Daylight"
  },
  "position": {
    "latitude": 64.2567,
    "longitude": 19.7767,
    "instrument_height_m": 3.5,
    "viewing_direction": "North",
    "azimuth_degrees": 0,
    "degrees_from_nadir": 15
  },
  "deployment_info": {
    "deployment_date": "2024-03-15",
    "status": "Active",
    "first_measurement_year": 2024,
    "measurement_status": "Active"
  },
  "documentation": {
    "description": "High-resolution phenocam monitoring coniferous forest phenology",
    "installation_notes": "Mounted on 3.5m tower, weatherproof housing installed",
    "maintenance_notes": "Schedule quarterly cleaning and annual calibration"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Instrument created successfully",
  "id": 42,
  "normalized_name": "SVB_FOR_P02_PHE_01",
  "instrument_number": "01",
  "data": {
    "id": 42,
    "normalized_name": "SVB_FOR_P02_PHE_01",
    "display_name": "Svartberget Forest Phenocam North",
    "camera_specifications": {
      "aperture": "f/8.0",
      "exposure_time": "1/60",
      "focal_length": "50mm",
      "iso": 400,
      "lens": "Canon EF 50mm f/1.8 STM",
      "mega_pixels": "24.7 MP",
      "white_balance": "Daylight"
    },
    "research_programs": ["SITES_SPECTRAL", "ICOS", "LTER"],
    "created_at": "2024-03-15T10:30:00Z"
  }
}
```

#### **PUT /api/instruments/{id}**
Update instrument with enhanced specifications.

**Field Validation Requirements:**
- **aperture**: Must match f-stop pattern `/^f\/[\d.]+$/`
- **exposure_time**: Must match time pattern `/^(\d+\/\d+|\d*\.?\d+)$/`
- **focal_length**: Must include 'mm' unit and be numeric
- **iso**: Integer between 50 and 6400
- **mega_pixels**: Must include 'MP' and be numeric
- **white_balance**: Must be from predefined list or numeric Kelvin value
- **research_programs**: Array of valid program codes
- **ecosystem_code**: Must be one of the 12 official codes

### Error Response Examples

#### **Validation Errors**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "aperture": "Invalid f-stop format. Use format like f/2.8, f/5.6",
    "iso": "ISO value must be between 50 and 6400",
    "ecosystem_code": "Invalid ecosystem code. Must be one of: FOR, CON, DEC, ALP, MIR, WET, PEA, MAR, HEA, GRA, AGR, LAK"
  }
}
```

#### **Permission Errors**
```json
{
  "success": false,
  "error": "Insufficient permissions",
  "message": "Station users cannot modify normalized names or legacy acronyms"
}
```

---

## 📊 Content Strategy Summary

### **Target Audience Segmentation**

#### **Primary Users - Station Managers**
- **Needs**: Clear field definitions, step-by-step guidance, validation feedback
- **Content**: Detailed tooltips, comprehensive help text, practical examples
- **Language**: Professional but accessible, minimal jargon

#### **Secondary Users - Research Scientists**
- **Needs**: Technical accuracy, scientific context, methodology guidelines
- **Content**: Specification rationales, research program descriptions, best practices
- **Language**: Technically precise, scientifically rigorous

#### **Administrative Users - System Administrators**
- **Needs**: System documentation, API references, troubleshooting guides
- **Content**: Complete API documentation, error handling, system architecture
- **Language**: Technical, comprehensive, implementation-focused

### **Content Principles**

1. **Clarity First**: Every technical term explained in context
2. **Progressive Disclosure**: Basic information first, advanced details available
3. **Consistent Terminology**: Same terms used across all interfaces
4. **Practical Examples**: Real-world examples from Swedish research stations
5. **Error Prevention**: Proactive guidance to prevent common mistakes
6. **Accessibility**: Screen reader compatible, keyboard navigation support

### **Implementation Recommendations**

1. **Phase 1**: Core field definitions and validation messages
2. **Phase 2**: Interactive help system and tooltips
3. **Phase 3**: Comprehensive user guides and video tutorials
4. **Phase 4**: API documentation and developer resources

This documentation provides a comprehensive foundation for implementing enhanced CRUD functionality while maintaining the high standards of clarity and technical accuracy required for scientific research station management.