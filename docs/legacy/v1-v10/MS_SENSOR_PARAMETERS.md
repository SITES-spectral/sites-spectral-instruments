# **Multispectral Sensor Parameters Tracking - SITES Spectral**

**Version**: 6.1.0
**Date**: 2025-11-18
**Purpose**: Comprehensive parameter specification for multispectral (MS) sensor instruments

---

## **1. INSTRUMENT IDENTIFICATION & CLASSIFICATION**

### **Basic Identification**
| Parameter | Field Name | Type | Required | Notes |
|-----------|-----------|------|----------|-------|
| **Normalized Name** | `normalized_name` | TEXT | ✅ Yes | Auto-generated: `{PLATFORM}_{BRAND}_MS{NN}_NB{channels}`<br>Example: `ANS_FOR_PL01_SKYE_MS01_NB04` |
| **Display Name** | `display_name` | TEXT | ✅ Yes | User-friendly name<br>Example: "Aneboda Forest Canopy SKYE 4-band MS" |
| **Legacy Acronym** | `legacy_acronym` | TEXT | ⬜ No | For backward compatibility with old naming systems |
| **Instrument Type** | `instrument_type` | TEXT | ✅ Yes | Options:<br>- SKYE MultiSpectral Sensor (Uplooking)<br>- SKYE MultiSpectral Sensor (Downlooking)<br>- Decagon Sensor (Uplooking)<br>- Decagon Sensor (Downlooking)<br>- Apogee MS |
| **Instrument Number** | `instrument_number` | TEXT | ✅ Yes | Auto-generated: `MS{NN}`<br>Example: `MS01`, `MS02` |

### **Sensor Hardware**
| Parameter | Field Name | Type | Required | Notes |
|-----------|-----------|------|----------|-------|
| **Sensor Brand** | `sensor_brand` | TEXT | ✅ Yes | Manufacturer name<br>Options: SKYE, APOGEE, DECAGON, METER, LICOR, PP Systems |
| **Sensor Model** | `sensor_model` | TEXT | ✅ Yes | Model number<br>Examples: SKR 1800, SKR110, SRS-NR, SQ-500 |
| **Serial Number** | `sensor_serial_number` | TEXT | ✅ Yes | Individual instrument serial for warranty/calibration tracking |
| **Number of Channels** | `number_of_channels` | INTEGER | ✅ Yes | Total spectral bands (2-8 typical)<br>Must match actual channel count in `instrument_channels` table |

---

## **2. SPECTRAL CHANNEL/BAND CONFIGURATION**

**Table**: `instrument_channels` (1:many relationship from instruments)

### **Channel Identification**
| Parameter | Field Name | Type | Required | Notes |
|-----------|-----------|------|----------|-------|
| **Channel Name** | `channel_name` | TEXT | ✅ Yes | Descriptive name<br>Examples: "RED645nm", "NIR850nm", "GREEN530nm" |
| **Channel Number** | `channel_number` | INTEGER | ✅ Yes | Sequential numbering (1, 2, 3, 4...)<br>Unique per instrument |
| **Data Column Name** | `data_column_name` | TEXT | ⬜ No | Column name in datalogger files<br>Example: "CH1_RED", "CH2_NIR" |

### **Spectral Characteristics**
| Parameter | Field Name | Type | Required | Validation | Notes |
|-----------|-----------|------|----------|------------|-------|
| **Center Wavelength** | `center_wavelength_nm` | INTEGER | ✅ Yes | 300-1200nm | Peak wavelength in nanometers<br>Examples: 450 (Blue), 530 (Green), 645 (Red), 850 (NIR) |
| **Bandwidth** | `bandwidth_nm` | INTEGER | ✅ Yes | 1-200nm | Full Width Half Maximum (FWHM)<br>Common: 10nm (narrow), 20nm (medium), 40nm (wide) |
| **Wavelength Notation** | `wavelength_notation` | TEXT | ⬜ No | Auto-generated if not provided<br>Example: "NW10nm" (Narrow Width), "NW40nm" (Wide) |
| **Band Type** | `band_type` | TEXT | ⬜ No | Classification options:<br>- Red (600-700nm)<br>- NIR (700-1000nm)<br>- Far-Red (700-750nm)<br>- Green (500-600nm)<br>- Blue (400-500nm)<br>- Custom |

### **Channel Calibration & Processing**
| Parameter | Field Name | Type | Required | Notes |
|-----------|-----------|------|----------|-------|
| **Calibration Coefficient** | `calibration_coefficient` | REAL | ⬜ No | Multiplier for raw signal conversion<br>Example: 1.234 (W m⁻² nm⁻¹ per mV) |
| **Calibration Offset** | `calibration_offset` | REAL | ⬜ No | Additive offset for raw signal<br>Example: 0.05 |
| **Last Calibrated Date** | `last_calibrated_date` | DATE | ⬜ No | Most recent calibration date<br>Tracks calibration currency |
| **Processing Enabled** | `processing_enabled` | BOOLEAN | ⬜ No | Default: `true`<br>Flag to enable/disable channel in data processing |
| **Quality Flag** | `quality_flag` | TEXT | ⬜ No | Channel data quality status<br>Options: "Good", "Questionable", "Bad", "Under Maintenance" |

### **Channel Documentation**
| Parameter | Field Name | Type | Required | Notes |
|-----------|-----------|------|----------|-------|
| **Description** | `description` | TEXT | ⬜ No | Channel purpose and characteristics<br>Example: "Red band for chlorophyll absorption" |
| **Notes** | `notes` | TEXT | ⬜ No | Additional channel-specific notes |

---

## **3. PHYSICAL INSTALLATION & GEOMETRY**

### **Location**
| Parameter | Field Name | Type | Required | Notes |
|-----------|-----------|------|----------|-------|
| **Platform ID** | `platform_id` | INTEGER | ✅ Yes | Foreign key to platforms table |
| **Ecosystem Code** | `ecosystem_code` | TEXT | ✅ Yes | 12 options: FOR, AGR, MIR, LAK, WET, GRA, HEA, ALP, CON, DEC, MAR, PEA |
| **Latitude** | `latitude` | REAL | ⬜ No | Decimal degrees (6 decimals)<br>Defaults to platform coordinates if not specified |
| **Longitude** | `longitude` | REAL | ⬜ No | Decimal degrees (6 decimals)<br>Defaults to platform coordinates if not specified |
| **EPSG Code** | `epsg_code` | TEXT | ⬜ No | Coordinate system<br>Default: "EPSG:4326" (WGS84) |

### **Mounting & Orientation**
| Parameter | Field Name | Type | Required | Notes |
|-----------|-----------|------|----------|-------|
| **Instrument Height** | `instrument_height_m` | REAL | ✅ Yes | Height above ground/canopy in meters<br>Example: 3.22, 17.5, 70.0 |
| **Orientation** | `orientation` | TEXT | ✅ Yes | Options:<br>- `uplooking` (downwelling light, receiving sun)<br>- `downlooking` (upwelling light, reflected from surface) |
| **Azimuth (Downlooking)** | `azimuth_degrees` | REAL | Conditional | Required for downlooking sensors<br>0-360° (0=North, 90=East, 180=South, 270=West) |
| **Tilt from Nadir (Downlooking)** | `degrees_from_nadir` | REAL | Conditional | Required for downlooking sensors<br>0-90° (0=straight down, 90=horizontal) |
| **Field of View** | `field_of_view_degrees` | REAL | ⬜ No | Total FOV in degrees<br>Examples: 28° (narrow), 36° (medium), 180° (hemispherical) |
| **Viewing Direction** | `viewing_direction` | TEXT | ⬜ No | Compass direction for downlooking<br>Options: N, NE, E, SE, S, SW, W, NW |

### **Physical Characteristics**
| Parameter | Field Name | Type | Required | Notes |
|-----------|-----------|------|----------|-------|
| **Cable Length** | `cable_length_m` | REAL | ⬜ No | Cable length in meters<br>Important for signal degradation calculations |

---

## **4. DATALOGGER & DATA ACQUISITION**

### **Datalogger Configuration**
| Parameter | Field Name | Type | Required | Notes |
|-----------|-----------|------|----------|-------|
| **Datalogger Type** | `datalogger_type` | TEXT | ⬜ No | Default: "Campbell Scientific CR1000X"<br>Other options: CR3000, CR6, CR1000 |
| **Normal Operations Program** | `datalogger_program_normal` | TEXT | ⬜ No | Program filename for standard measurements<br>Example: "ANS_MS_Normal_v2.CR1" |
| **Calibration Program** | `datalogger_program_calibration` | TEXT | ⬜ No | Program filename for calibration mode<br>Example: "ANS_MS_Calibration_v1.CR1" |

### **Data Management**
| Parameter | Field Name | Type | Required | Notes |
|-----------|-----------|------|----------|-------|
| **Image Archive Path** | `image_archive_path` | TEXT | ⬜ No | Storage path for derived products<br>Example: "/data/ANS/MS01/" |
| **Data Transmission** | `data_transmission` | TEXT | ⬜ No | Method: Cellular, WiFi, Ethernet, SD Card |
| **Power Source** | `power_source` | TEXT | ⬜ No | Options: Solar, Grid, Battery, Hybrid |

---

## **5. CALIBRATION & MAINTENANCE**

### **Calibration Tracking**
| Parameter | Field Name | Type | Required | Notes |
|-----------|-----------|------|----------|-------|
| **Calibration Date** | `calibration_date` | DATE | ⬜ No | Most recent instrument-level calibration |
| **Calibration Logs** | `calibration_logs` | TEXT | ⬜ No | Path to calibration files or JSON with calibration history<br>Example: "/calibration/ANS_MS01/2025-06-15.cal" |
| **Calibration Notes** | `calibration_notes` | TEXT | ⬜ No | Notes about calibration procedures, reference standards used |

### **Warranty & Lifecycle**
| Parameter | Field Name | Type | Required | Notes |
|-----------|-----------|------|----------|-------|
| **Deployment Date** | `deployment_date` | DATE | ✅ Yes | Initial installation date |
| **Start Date** | `deployment_date` | DATE | ✅ Yes | Same as deployment_date (operational start) |
| **End Date** | `end_date` | DATE | ⬜ No | Decommissioning date (NULL if active) |
| **Manufacturer Warranty Expires** | `manufacturer_warranty_expires` | DATE | ⬜ No | Warranty end date |
| **Status** | `status` | TEXT | ⬜ No | Default: "Active"<br>Options: Active, Inactive, Maintenance, Decommissioned |

### **Maintenance Tracking**
| Parameter | Field Name | Type | Required | Notes |
|-----------|-----------|------|----------|-------|
| **Installation Notes** | `installation_notes` | TEXT | ⬜ No | Notes about initial installation, challenges, modifications |
| **Maintenance Notes** | `maintenance_notes` | TEXT | ⬜ No | Ongoing maintenance log, repairs, adjustments |

---

## **6. SENSOR MODEL REFERENCE LIBRARY**

**Table**: `sensor_models` (reference data, reusable across instruments)

### **Model Identification**
| Parameter | Field Name | Type | Required | Notes |
|-----------|-----------|------|----------|-------|
| **Manufacturer** | `manufacturer` | TEXT | ✅ Yes | SKYE, APOGEE, DECAGON, METER, LICOR, PP Systems |
| **Model Number** | `model_number` | TEXT | ✅ Yes | Unique model identifier<br>Examples: SKR 1800, SKR110, SRS-NR |
| **Model Name** | `model_name` | TEXT | ⬜ No | Full descriptive name<br>Example: "SKR 1800 2-4 Channel Light Sensor" |
| **Sensor Type** | `sensor_type` | TEXT | ⬜ No | Options: Multispectral, PAR, NDVI, PRI, Hyperspectral |

### **Spectral Specifications**
| Parameter | Field Name | Type | Required | Notes |
|-----------|-----------|------|----------|-------|
| **Wavelength Range Min** | `wavelength_range_min_nm` | INTEGER | ⬜ No | Minimum wavelength in nm<br>Example: 400 (for SKR 1800) |
| **Wavelength Range Max** | `wavelength_range_max_nm` | INTEGER | ⬜ No | Maximum wavelength in nm<br>Example: 1050 (for SKR 1800) |
| **Available Channels Config** | `available_channels_config` | TEXT (JSON) | ⬜ No | JSON array of channel configurations<br>Example: `[[645,850], [530,645,850], [450,530,645,850]]`<br>(2-ch, 3-ch, 4-ch options) |

### **Optical Characteristics**
| Parameter | Field Name | Type | Required | Notes |
|-----------|-----------|------|----------|-------|
| **Field of View** | `field_of_view_degrees` | REAL | ⬜ No | Manufacturer-specified FOV<br>Examples: 28°, 36°, 180° |
| **Angular Response** | `angular_response` | TEXT | ⬜ No | Description of angular sensitivity<br>Example: "Cosine corrected" |
| **Cosine Response** | `cosine_response` | TEXT | ⬜ No | Cosine error specification<br>Example: "f2 < 3% (0-70°)" |
| **Spectral Sensitivity Curve** | `spectral_sensitivity_curve` | TEXT | ⬜ No | URL or reference to spectral response curve |

### **Calibration Specifications**
| Parameter | Field Name | Type | Required | Notes |
|-----------|-----------|------|----------|-------|
| **Temperature Coefficient** | `temperature_coefficient` | REAL | ⬜ No | Temperature sensitivity (%/°C)<br>Example: -0.05 (typical for silicon detectors) |
| **Calibration Procedure** | `calibration_procedure` | TEXT | ⬜ No | Manufacturer calibration method<br>Example: "Factory calibration against NIST-traceable standard" |
| **Factory Calibration Interval** | `factory_calibration_interval_months` | INTEGER | ⬜ No | Recommended interval in months<br>Common: 24 months (2 years) |
| **Recalibration Requirements** | `recalibration_requirements` | TEXT | ⬜ No | Detailed recalibration guidance |
| **Typical Calibration Coefficients** | `typical_calibration_coefficients` | TEXT (JSON) | ⬜ No | JSON with typical coefficient ranges per channel |

### **Physical & Environmental Specs**
| Parameter | Field Name | Type | Required | Notes |
|-----------|-----------|------|----------|-------|
| **Dimensions** | `dimensions_mm` | TEXT (JSON) | ⬜ No | JSON: `{"diameter": 100, "height": 35}` or `{"length": 100, "width": 60, "height": 40}` |
| **Weight** | `weight_grams` | REAL | ⬜ No | Sensor weight in grams |
| **Cable Types** | `cable_types` | TEXT | ⬜ No | Standard cable specifications<br>Example: "4-core screened cable" |
| **Connector Type** | `connector_type` | TEXT | ⬜ No | Electrical connector type<br>Examples: "IP68 waterproof", "BNC", "3.5mm stereo plug" |
| **Power Requirements** | `power_requirements` | TEXT | ⬜ No | Voltage/current requirements<br>Example: "12V DC, 50mA" |
| **IP Rating** | `ip_rating` | TEXT | ⬜ No | Ingress Protection rating<br>Common: IP68 (waterproof) |
| **Operating Temp Min** | `operating_temp_min_c` | REAL | ⬜ No | Minimum operating temperature (°C)<br>Example: -40 |
| **Operating Temp Max** | `operating_temp_max_c` | REAL | ⬜ No | Maximum operating temperature (°C)<br>Example: 70 |

### **Documentation References**
| Parameter | Field Name | Type | Required | Notes |
|-----------|-----------|------|----------|-------|
| **Manufacturer Website** | `manufacturer_website_url` | TEXT (URL) | ⬜ No | Link to manufacturer page |
| **Specification Sheet URL** | `specification_sheet_url` | TEXT (URL) | ⬜ No | Link to datasheet PDF |
| **User Manual URL** | `user_manual_url` | TEXT (URL) | ⬜ No | Link to user manual |
| **Notes** | `notes` | TEXT | ⬜ No | Additional model-specific notes |

---

## **7. DOCUMENTATION MANAGEMENT**

**Table**: `sensor_documentation` (dual-level: model + instrument)

### **Document Identification**
| Parameter | Field Name | Type | Required | Notes |
|-----------|-----------|------|----------|-------|
| **Sensor Model ID** | `sensor_model_id` | INTEGER | Conditional | For model-level docs (XOR with instrument_id) |
| **Instrument ID** | `instrument_id` | INTEGER | Conditional | For instrument-specific docs (XOR with sensor_model_id) |
| **Document Type** | `document_type` | TEXT | ✅ Yes | Options:<br>- specification_sheet<br>- calibration_certificate<br>- user_manual<br>- warranty<br>- technical_note<br>- firmware_update<br>- custom |

### **File Metadata**
| Parameter | Field Name | Type | Required | Notes |
|-----------|-----------|------|----------|-------|
| **File Name** | `file_name` | TEXT | ✅ Yes | Original filename (sanitized) |
| **File Path** | `file_path` | TEXT | ✅ Yes | R2 storage path<br>Pattern: `models/{id}/{type}/{timestamp}_{filename}` or `instruments/{id}/{type}/{timestamp}_{filename}` |
| **File Size** | `file_size_bytes` | INTEGER | ⬜ No | File size in bytes |
| **MIME Type** | `mime_type` | TEXT | ⬜ No | Content type<br>Examples: "application/pdf", "image/jpeg" |

### **Document Details**
| Parameter | Field Name | Type | Required | Notes |
|-----------|-----------|------|----------|-------|
| **Title** | `title` | TEXT | ⬜ No | Document title/subject |
| **Description** | `description` | TEXT | ⬜ No | Document description |
| **Version** | `version` | TEXT | ⬜ No | Document version number |
| **Document Date** | `document_date` | DATE | ⬜ No | Date document was created/issued |
| **Upload Date** | `upload_date` | DATETIME | Auto | Timestamp of upload to system |
| **Uploaded By** | `uploaded_by` | TEXT | Auto | Username who uploaded |
| **Tags** | `tags` | TEXT (JSON) | ⬜ No | JSON array of tags for searching<br>Example: `["calibration", "2025", "field"]` |
| **Notes** | `notes` | TEXT | ⬜ No | Additional notes about document |

---

## **8. METADATA & SYSTEM FIELDS**

### **Timestamps**
| Parameter | Field Name | Type | Auto-Generated | Notes |
|-----------|-----------|------|----------------|-------|
| **Created At** | `created_at` | DATETIME | ✅ Yes | Record creation timestamp |
| **Updated At** | `updated_at` | DATETIME | ✅ Yes | Last modification timestamp |

### **Processing & Quality**
| Parameter | Field Name | Type | Required | Notes |
|-----------|-----------|------|----------|-------|
| **Measurement Status** | `measurement_status` | TEXT | ⬜ No | Data collection status<br>Options: Active, Paused, Stopped |
| **First Measurement Year** | `first_measurement_year` | INTEGER | ⬜ No | Year of first data collection |
| **Last Measurement Year** | `last_measurement_year` | INTEGER | ⬜ No | Year of most recent data |
| **Image Quality Score** | `image_quality_score` | REAL | ⬜ No | Data quality metric (0-100) |
| **Last Image Timestamp** | `last_image_timestamp` | DATETIME | ⬜ No | Most recent data acquisition timestamp |

### **Description Fields**
| Parameter | Field Name | Type | Required | Notes |
|-----------|-----------|------|----------|-------|
| **Description** | `description` | TEXT | ⬜ No | General instrument description |
| **Installation Notes** | `installation_notes` | TEXT | ⬜ No | Installation details, special configurations |
| **Maintenance Notes** | `maintenance_notes` | TEXT | ⬜ No | Maintenance history, issues, resolutions |

---

## **9. MISSING PARAMETERS - RECOMMENDATIONS**

### **❓ Parameters to Consider Adding**

#### **Environmental Monitoring**
- **Sensor Temperature**: Real-time sensor body temperature (affects dark current)
- **Ambient Temperature**: Environmental temperature at sensor location
- **Humidity Level**: Relative humidity affecting condensation risk
- **Precipitation Status**: Flag for active precipitation affecting measurements

#### **Data Quality & Validation**
- **Dark Current Measurement**: Regular dark signal measurements
- **Cross-Calibration Status**: Comparison with other instruments
- **Validation Flag**: Flag for data that has been validated by researcher
- **Outlier Detection**: Automated outlier flagging system

#### **Operational Status**
- **Last Communication**: Last successful data transmission
- **Battery Voltage**: For solar-powered systems
- **Data Storage Available**: Remaining storage capacity
- **Network Status**: Connectivity status for remote sensors

#### **Advanced Spectral Characteristics**
- **Spectral Response Function**: Full spectral response curve (not just center/bandwidth)
- **Out-of-Band Rejection**: Blocking characteristics outside passband
- **Signal-to-Noise Ratio**: Expected SNR per channel
- **Dynamic Range**: Measurement range (e.g., 0-1500 W/m²)

#### **Processing Parameters**
- **Integration Time**: Signal integration/averaging period
- **Sampling Frequency**: Measurement frequency (e.g., every 15 minutes)
- **Aggregation Method**: How sub-samples are aggregated (mean, median, etc.)
- **Correction Factors**: Applied correction factors (cosine, temperature, etc.)

#### **Geospatial Enhancement**
- **Altitude/Elevation**: Sensor elevation above sea level
- **Footprint Size**: Ground area measured by sensor
- **Footprint Geometry**: Shape/orientation of measurement area

#### **Collaborative Data**
- **Related Instruments**: Links to co-located instruments (e.g., PAR sensor, weather station)
- **Reference Measurements**: Link to in-situ validation data
- **Site Characteristics**: Vegetation type, canopy height, LAI, etc.

---

## **10. VALIDATION RULES**

### **Business Logic Constraints**

1. **Channel Count Consistency**: `instruments.number_of_channels` MUST equal COUNT of records in `instrument_channels` where `instrument_id` matches

2. **Wavelength Ranges**:
   - Center wavelength: 300-1200nm (typical sensors)
   - Bandwidth: 1-200nm
   - Validate against sensor model range if model selected

3. **Orientation Requirements**:
   - If `orientation = 'downlooking'`: REQUIRE `azimuth_degrees` and `degrees_from_nadir`
   - If `orientation = 'uplooking'`: These fields optional/NULL

4. **XOR Documentation**: Each document in `sensor_documentation` must have EITHER `sensor_model_id` OR `instrument_id` (not both, not neither)

5. **Naming Convention**: `normalized_name` must follow pattern:
   - For MS sensors: `{PLATFORM}_{BRAND}_MS{NN}_NB{channels}`
   - Must be unique across all instruments

6. **Date Logic**:
   - `end_date` must be >= `deployment_date` (if both exist)
   - `last_calibrated_date` should be <= current date
   - `deployment_date` should be <= current date

7. **Duplicate Prevention**:
   - No duplicate `channel_number` per instrument
   - No duplicate `channel_name` per instrument
   - No duplicate `normalized_name` across instruments

---

## **11. USER EXPERIENCE ENHANCEMENTS**

### **Smart Defaults & Auto-Population**

1. **Sensor Model Selection** → Auto-populate:
   - `sensor_brand` (from model manufacturer)
   - `sensor_model` (from model number)
   - `wavelength_range_min_nm` and `max_nm` (from model)
   - `field_of_view_degrees` (from model specs)
   - Suggested channel configurations (from `available_channels_config`)

2. **Platform Selection** → Auto-populate:
   - `latitude`, `longitude` (from platform coordinates)
   - `ecosystem_code` (from platform ecosystem)

3. **Channel Creation** → Provide presets:
   - **Band Type Selection** → Suggest common wavelengths:
     - Blue → 450nm (±10nm or ±40nm)
     - Green → 530nm
     - Red → 645nm or 660nm
     - NIR → 810nm or 850nm
     - Far-Red → 730nm

4. **Bandwidth Selection** → Dropdown:
   - Narrow (10nm)
   - Medium (20nm)
   - Wide (40nm)
   - Custom (manual entry)

5. **Validation Against Model**:
   - If sensor model selected, validate user-entered wavelengths are within model's supported range
   - Show warning if wavelength outside typical range

---

## **12. API ENDPOINTS SUMMARY**

### **Instruments**
- `POST /api/instruments` - Create MS instrument
- `GET /api/instruments/:id` - Get instrument details
- `PUT /api/instruments/:id` - Update instrument
- `DELETE /api/instruments/:id` - Delete instrument

### **Channels**
- `GET /api/channels?instrument_id=X` - List channels for instrument
- `POST /api/channels` - Create new channel
- `PUT /api/channels/:id` - Update channel
- `DELETE /api/channels/:id` - Delete channel

### **Sensor Models**
- `GET /api/sensor-models` - List all sensor models
- `GET /api/sensor-models/:id` - Get model details
- `POST /api/sensor-models` - Create model (admin only)
- `PUT /api/sensor-models/:id` - Update model (admin only)
- `DELETE /api/sensor-models/:id` - Delete model (admin only)

### **Documentation**
- `GET /api/documentation?instrument_id=X` - List instrument docs
- `GET /api/documentation?sensor_model_id=X` - List model docs
- `POST /api/documentation/upload` - Upload document
- `GET /api/documentation/:id/download` - Download document
- `PUT /api/documentation/:id` - Update metadata
- `DELETE /api/documentation/:id` - Delete document

---

## **SUMMARY**

### **Currently Tracked** ✅
- ✅ 12 new fields in instruments table
- ✅ 17 fields per spectral channel
- ✅ 30 fields in sensor models library
- ✅ 16 fields for documentation management
- ✅ **Total: 75+ parameters tracked**

### **Potentially Missing** ❓
- Environmental monitoring (temperature, humidity)
- Real-time operational status (battery, connectivity)
- Advanced spectral characteristics (SNR, dynamic range, response functions)
- Data quality validation flags
- Processing parameters (integration time, sampling frequency)
- Geospatial enhancements (elevation, footprint geometry)
- Collaborative links (related instruments, site characteristics)

### **Recommendation**
The current parameter set is **comprehensive for Phase 1** (v6.0.0-v6.0.1). Consider adding environmental/operational monitoring parameters in **Phase 2** (v6.2.0+) based on actual field deployment needs.

---

**END OF DOCUMENT**
