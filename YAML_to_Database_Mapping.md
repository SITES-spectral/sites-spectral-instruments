# YAML to Database Field Mapping Documentation

## Overview
This document maps the relationship between the original YAML configuration structure (`stations.yaml`) and the current database schema. It identifies existing fields, missing fields, and user-driven updates not reflected in the original YAML structure.

## Station-Level Mapping

**Important Note**: Database uses auto-incrementing numeric IDs (1, 2, 3...) while YAML uses string identifiers. We use `normalized_name` and `acronym` to identify stations, platforms, and instruments across systems.

| YAML Field | Database Table | Database Column | Data Type | Status | API Endpoint | Notes |
|------------|----------------|-----------------|-----------|--------|--------------|-------|
| `id` | stations | acronym | TEXT | ✅ EXISTS | `/api/stations` | YAML string ID maps to acronym, not database ID |
| - | stations | id | INTEGER | ✅ EXISTS | `/api/stations` | Auto-incrementing numeric ID (database primary key) |
| `normalized_name` | stations | normalized_name | TEXT | ✅ EXISTS | `/api/stations` | Lowercase station identifier |
| `display_name` | stations | display_name | TEXT | ✅ EXISTS | `/api/stations` | Human-readable station name |
| `acronym` | stations | acronym | TEXT | ✅ EXISTS | `/api/stations` | Short station code |
| `status` | stations | status | TEXT | ✅ EXISTS | `/api/stations` | Active/Inactive/etc. |
| `country` | stations | country | TEXT | ✅ EXISTS | `/api/stations` | Always 'Sweden' in YAML |
| `elevation_m` | stations | elevation_m | REAL | ✅ EXISTS | `/api/stations` | Station elevation |
| `description` | stations | description | TEXT | ✅ EXISTS | `/api/stations` | Station description |
| `geolocation.point.latitude_dd` | stations | latitude | REAL | ✅ EXISTS | `/api/stations` | Station coordinates |
| `geolocation.point.longitude_dd` | stations | longitude | REAL | ✅ EXISTS | `/api/stations` | Station coordinates |
| `geolocation.point.epsg` | - | - | - | ❌ MISSING | *TBD* | Coordinate system reference |

## Platform-Level Mapping

**Important Note**: Similar to stations, platforms use auto-incrementing numeric database IDs while YAML uses structured string identifiers. We use `normalized_name` for identification across systems.

| YAML Field | Database Table | Database Column | Data Type | Status | API Endpoint | Notes |
|------------|----------------|-----------------|-----------|--------|--------------|-------|
| `id` | platforms | normalized_name | TEXT | ✅ EXISTS | `/api/platforms` | YAML string ID maps to normalized_name, not database ID |
| - | platforms | id | INTEGER | ✅ EXISTS | `/api/platforms` | Auto-incrementing numeric ID (database primary key) |
| `normalized_name` | platforms | normalized_name | TEXT | ✅ EXISTS | `/api/platforms` | Structured platform name |
| `display_name` | platforms | display_name | TEXT | ✅ EXISTS | `/api/platforms` | Human-readable platform name |
| `location_code` | platforms | location_code | TEXT | ✅ EXISTS | `/api/platforms` | Platform named location (PL01, BL01, etc.) - distinct from geolocation |
| `mounting_structure` | platforms | mounting_structure | TEXT | ✅ EXISTS | `/api/platforms` | How platform is mounted |
| `platform_height_m` | platforms | platform_height_m | REAL | ✅ EXISTS | `/api/platforms` | Platform height |
| `status` | platforms | status | TEXT | ✅ EXISTS | `/api/platforms` | Platform operational status |
| `elevation_m` | platforms | elevation_m | REAL | ✅ EXISTS | `/api/platforms` | Platform elevation |
| `platform_deployment_date` | platforms | deployment_date | DATE | ✅ EXISTS | `/api/platforms` | When platform was deployed |
| `description` | platforms | description | TEXT | ✅ EXISTS | `/api/platforms` | Platform description |
| `operation_programs` | platforms | operation_programs | JSON | ✅ EXISTS | `/api/research-programs` | Research programs (JSON array) |
| `geolocation.point.latitude_dd` | platforms | latitude | REAL | ✅ EXISTS | `/api/platforms` | Platform coordinates |
| `geolocation.point.longitude_dd` | platforms | longitude | REAL | ✅ EXISTS | `/api/platforms` | Platform coordinates |
| `geolocation.point.epsg` | - | - | - | ❌ MISSING | *TBD* | Coordinate system reference |

## Instrument-Level Mapping

**Important Note**: Instruments also use auto-incrementing numeric database IDs while YAML uses structured string identifiers. We use `normalized_name` for identification across systems.

| YAML Field | Database Table | Database Column | Data Type | Status | API Endpoint | Notes |
|------------|----------------|-----------------|-----------|--------|--------------|-------|
| `id` | instruments | normalized_name | TEXT | ✅ EXISTS | `/api/instruments` | YAML string ID maps to normalized_name, not database ID |
| - | instruments | id | INTEGER | ✅ EXISTS | `/api/instruments` | Auto-incrementing numeric ID (database primary key) |
| `normalized_name` | instruments | normalized_name | TEXT | ✅ EXISTS | `/api/instruments` | Structured instrument name |
| `display_name` | instruments | display_name | TEXT | ✅ EXISTS | `/api/instruments` | Human-readable instrument name |
| `legacy_acronym` | - | - | - | ❌ MISSING | *TBD* | Old instrument naming system |
| `instrument_type` | instruments | instrument_type | TEXT | ✅ EXISTS | `/api/instruments` | Always 'phenocam' |
| `ecosystem_code` | instruments | ecosystem_code | TEXT | ✅ EXISTS | `/api/ecosystems` | Ecosystem type (FOR, AGR, etc.) |
| `instrument_number` | instruments | instrument_number | TEXT | ✅ EXISTS | `/api/instruments` | Instrument sequence number |
| `status` | instruments | status | TEXT | ✅ EXISTS | `/api/status-codes` | Instrument operational status |
| `instrument_deployment_date` | - | - | - | ❌ MISSING | *TBD* | When instrument was deployed |
| `instrument_height_m` | instruments | instrument_height_m | REAL | ✅ EXISTS | `/api/instruments` | Instrument height |
| `instrument_viewing_direction` | instruments | viewing_direction | TEXT | ✅ EXISTS | `/api/instruments` | Camera pointing direction |
| `instrument_azimuth_degrees` | instruments | azimuth_degrees | REAL | ✅ EXISTS | `/api/instruments` | Camera azimuth angle |
| `instrument_degrees_from_nadir` | - | - | - | ❌ MISSING | *TBD* | Camera elevation angle |
| `geolocation.point.latitude_dd` | instruments | latitude | REAL | ✅ EXISTS | `/api/instruments` | Instrument coordinates |
| `geolocation.point.longitude_dd` | instruments | longitude | REAL | ✅ EXISTS | `/api/instruments` | Instrument coordinates |
| `geolocation.point.epsg` | - | - | - | ❌ MISSING | *TBD* | Coordinate system reference |

## Camera Specifications Mapping

| YAML Field | Database Table | Database Column | Data Type | Status | API Endpoint | Notes |
|------------|----------------|-----------------|-----------|--------|--------------|-------|
| `camera_specifications.brand` | instruments | camera_brand | TEXT | ✅ EXISTS | `/api/instruments` | Camera manufacturer |
| `camera_specifications.model` | instruments | camera_model | TEXT | ✅ EXISTS | `/api/instruments` | Camera model |
| `camera_specifications.resolution` | instruments | camera_resolution | TEXT | ✅ EXISTS | `/api/instruments` | Image resolution |
| `camera_specifications.serial_number` | instruments | camera_serial_number | TEXT | ✅ EXISTS | `/api/instruments` | Camera serial number |
| `camera_specifications.aperture` | - | - | - | ❌ MISSING | *TBD* | Camera aperture setting |
| `camera_specifications.exposure_time` | - | - | - | ❌ MISSING | *TBD* | Camera exposure time |
| `camera_specifications.focal_length_mm` | - | - | - | ❌ MISSING | *TBD* | Lens focal length |
| `camera_specifications.iso` | - | - | - | ❌ MISSING | *TBD* | Camera ISO setting |
| `camera_specifications.lens` | - | - | - | ❌ MISSING | *TBD* | Lens specifications |
| `camera_specifications.mega_pixels` | - | - | - | ❌ MISSING | *TBD* | Camera megapixel count |
| `camera_specifications.white_balance` | - | - | - | ❌ MISSING | *TBD* | White balance setting |

## Measurement Timeline Mapping

| YAML Field | Database Table | Database Column | Data Type | Status | API Endpoint | Notes |
|------------|----------------|-----------------|-----------|--------|--------------|-------|
| `measurement_timeline.first_measurement_year` | instruments | first_measurement_year | INTEGER | ✅ EXISTS | `/api/instruments` | Start year of measurements |
| `measurement_timeline.last_measurement_year` | instruments | last_measurement_year | INTEGER | ✅ EXISTS | `/api/instruments` | End year of measurements |
| `measurement_timeline.measurement_status` | instruments | measurement_status | TEXT | ✅ EXISTS | `/api/status-codes` | Current measurement status |

## Additional Instrument Fields

| YAML Field | Database Table | Database Column | Data Type | Status | API Endpoint | Notes |
|------------|----------------|-----------------|-----------|--------|--------------|-------|
| `description` | instruments | description | TEXT | ✅ EXISTS | `/api/instruments` | Instrument description |
| `installation_notes` | instruments | installation_notes | TEXT | ✅ EXISTS | `/api/instruments` | Installation information |
| `maintenance_notes` | instruments | maintenance_notes | TEXT | ✅ EXISTS | `/api/instruments` | Maintenance information |

## ROI (Region of Interest) Mapping

| YAML Field | Database Table | Database Column | Data Type | Status | API Endpoint | Notes |
|------------|----------------|-----------------|-----------|--------|--------------|-------|
| `rois.ROI_XX` | instrument_rois | roi_name | TEXT | ✅ EXISTS | `/api/instrument-rois` | ROI identifier |
| `rois.ROI_XX.description` | instrument_rois | description | TEXT | ✅ EXISTS | `/api/instrument-rois` | ROI description |
| `rois.ROI_XX.alpha` | instrument_rois | alpha | REAL | ✅ EXISTS | `/api/instrument-rois` | ROI transparency |
| `rois.ROI_XX.auto_generated` | instrument_rois | auto_generated | BOOLEAN | ✅ EXISTS | `/api/instrument-rois` | Auto-generated flag |
| `rois.ROI_XX.color` | instrument_rois | color_r, color_g, color_b | INTEGER | ✅ EXISTS | `/api/instrument-rois` | RGB color values |
| `rois.ROI_XX.thickness` | instrument_rois | thickness | INTEGER | ✅ EXISTS | `/api/instrument-rois` | Line thickness |
| `rois.ROI_XX.generated_date` | instrument_rois | generated_date | DATE | ✅ EXISTS | `/api/instrument-rois` | Generation date |
| `rois.ROI_XX.source_image` | instrument_rois | source_image | TEXT | ✅ EXISTS | `/api/instrument-rois` | Source image reference |
| `rois.ROI_XX.points` | instrument_rois | points_json | TEXT | ✅ EXISTS | `/api/instrument-rois` | Coordinate points (JSON) |
| `rois.ROI_XX.comment` | - | - | - | ❌ MISSING | *TBD* | ROI comments |
| `rois.ROI_XX.updated` | instrument_rois | updated_at | DATETIME | ✅ EXISTS | `/api/instrument-rois` | Last update timestamp |

## Status Options Available

### From status.yaml:
- **Active**: Currently operational and collecting data
- **Inactive**: Temporarily not in use but can be reactivated
- **Dismantled**: Permanently taken out of service
- **Under Construction**: Being built or installed
- **Pending Activation**: Installed but not yet active
- **Maintenance**: Temporarily out of service for maintenance
- **Testing**: Installed and being tested
- **Upgrading**: Currently being upgraded
- **Decommissioned**: Permanently retired
- **Planned**: Approved for future construction
- **Scheduled for Decommission**: Will be decommissioned soon
- **Dormant**: Not active but maintained for future use

### Research Programs Found in Data:
- Swedish Polar Research Secretariat
- SITES
- ICOS
- SLU
- Goteborg University

### Ecosystem Codes Available:
From ecosystems.yaml: HEA, AGR, MIR, LAK, WET, GRA, FOR, ALP, CON, DEC, MAR, PEA

## Missing Database Fields (Recommendations)

### High Priority:
1. **instrument_deployment_date** - When instrument was deployed
2. **instrument_degrees_from_nadir** - Camera elevation angle
3. **legacy_acronym** - For backward compatibility
4. **Camera specification fields** - aperture, exposure_time, focal_length_mm, iso, lens, mega_pixels, white_balance
5. **EPSG coordinate system reference** - For proper geospatial handling

### Medium Priority:
1. **ROI comments field** - For additional ROI documentation
2. **Platform/Station contact information** - For management purposes
3. **Maintenance schedule fields** - For operational planning

## User-Driven Updates Not in YAML

Based on the database analysis, users have made the following updates:
1. **Status changes** - Many instruments show different statuses than original YAML
2. **Coordinate refinements** - Some platforms have more precise coordinates
3. **Operation programs** - Some platforms have updated research program affiliations
4. **ROI modifications** - Users have updated ROI polygons and added comments
5. **Equipment changes** - Some camera models and specifications have been updated

## Terminology Clarification

**Named Location vs. Geolocation**:
- `location_code` (to be renamed `named_location`): Refers to named platform locations like "PL01", "BL01", "PL02" - these are human-readable identifiers for platform positions
- `latitude`/`longitude`: Actual geographic coordinates (geolocation) in decimal degrees
- This distinction is important for UI clarity and database field naming

## Recommendations for CRUD Enhancement

1. **Add missing camera specification fields** to instrument forms
2. **Implement multiselect for research programs** using unique values from database
3. **Add ecosystem code dropdown** using ecosystems.yaml
4. **Include all status options** from status.yaml in dropdowns
5. **Add ROI nested cards** for phenocam instruments with edit capabilities
6. **Include deployment date fields** for instruments and platforms
7. **Add legacy acronym field** for backward compatibility
8. **Update terminology**: Consider renaming `location_code` to `named_location` for clarity

This mapping serves as the foundation for enhancing the CRUD operations to include all available data fields and improve the user experience for station managers.