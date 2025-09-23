# Changelog

All notable changes to the SITES Spectral Stations & Instruments Management System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### 📋 Next Steps
- Enhanced user management interface
- Bulk data operations
- Advanced analytics dashboard
- ROI visualization overlays on phenocam images

## [4.8.4] - 2025-09-23

### 🗺️ Abisko Platform Data Updates

#### 📍 Coordinate Updates
- **Miellejokka Heath Platform**: Updated coordinates to 68.311722, 18.91527
- **Stordalen Birch Forest Platform**: Updated coordinates to 68.34980602492992, 19.04258100806418
- **Instrument Coordinates**: Updated corresponding instrument coordinates to match platform locations

#### 🏷️ Normalized Name Updates
- **Miellejokka Platform**: Updated normalized name to `ANS_MJH_PL01` (MJH = Miellejokka Heath)
- **Miellejokka Instrument**: Updated normalized name to `ANS_MJH_PL01_PHE01`
- **Stordalen Platform**: Updated normalized name to `ANS_SBF_FOR_PL01` (SBF = Stordalen Birch Forest)
- **Stordalen Instrument**: Updated normalized name to `ANS_SBF_FOR_PL01_PHE01`

#### 🔧 Technical Implementation
- **Database Updates**: Applied coordinate and naming updates to platforms and instruments tables
- **Consistent Naming**: Follows standard SITES nomenclature with station acronyms
- **Geographic Accuracy**: Precise coordinates for accurate mapping and field deployment

## [4.8.3] - 2025-09-23

### 🏷️ Instrument Card Title Enhancement

#### ✨ User Experience Improvements
- **Normalized Name Titles**: Added instrument normalized names as prominent titles above thumbnail images in instrument cards
- **Visual Hierarchy**: Enhanced card layout with clear instrument identification at the top
- **Consistent Display**: All instrument cards now show normalized names (e.g., "ANS_FOR_BL01_PHE01") before legacy names
- **Professional Styling**: Title section with subtle background and border for better visual separation

#### 🔧 Technical Implementation
- **Card Structure**: Added dedicated title section above thumbnail in instrument cards
- **Fallback Display**: Shows "No ID" when normalized name is not available
- **Responsive Design**: Title styling works across different screen sizes
- **Consistent Formatting**: Centered, styled titles with professional appearance

## [4.8.2] - 2025-09-23

### 🎯 Enhanced UX with Legacy Name Prefix, Help Buttons, and New Abisko Platforms

#### ✨ User Experience Improvements
- **Legacy Name Display**: Added "legacy name:" prefix before legacy acronyms in instrument cards for better clarity
- **Help System**: Added helpful question mark icons to platform and instrument cards with tooltips explaining card functionality
- **Modal Instructions**: Added small instructional text next to edit buttons in detail modals
- **Improved Guidance**: Enhanced user guidance with contextual help throughout the interface

#### 🗺️ Platform Expansion at Abisko Station
- **Stordalen Birch Forest Platform**: New platform for forest ecosystem monitoring
  - Platform Code: BF01 (Birch Forest 01)
  - Mobotix phenocam planned for installation
  - Status: Planned for future deployment
- **Miellejokka Heath Platform**: New platform for heath ecosystem monitoring
  - Platform Code: HE01 (Heath 01)
  - Mobotix phenocam planned for installation
  - Status: Planned for future deployment
- **Meteorological Station Enhancement**: Added second Nikon phenocam to existing met station platform
  - Additional camera for expanded monitoring capabilities
  - Status: Planned for future deployment

#### 🔧 Technical Implementation
- **Database Expansion**: Added 2 new platforms and 3 new instruments to Abisko station
- **Status Management**: All new equipment marked as "Planned" status for proper workflow tracking
- **Normalized Naming**: Consistent naming convention for new platforms and instruments
- **Ecosystem Codes**: Proper ecosystem classification (FOR for forest, HEA for heath, TUN for tundra)

#### 📋 Data Management
- **Platform IDs**: Stordalen (ID: 23), Miellejokka (ID: 24), Met Station (ID: 1)
- **Instrument IDs**: Stordalen Phenocam (ID: 26), Miellejokka Phenocam (ID: 27), Met Station Nikon (ID: 28)
- **Future Planning**: Null coordinates and specifications allow for future completion during actual deployment

## [4.7.8] - 2025-09-20

### 🎯 Enhanced Station Tooltips

#### ✨ User Experience Improvements
- **Station Name Tooltips**: Station markers now show full station names instead of just acronyms
  - **Before**: "Station: ANS"
  - **After**: "Abisko" (full display name)
  - **Fallback**: Uses acronym if display name not available
- **Platform Identification**: Maintained correct platform ID tooltips (e.g., "Platform: ANS_FOR_BL01")

#### 🔧 Technical Implementation
- **Smart Fallback**: Uses `display_name` first, then `acronym` as fallback
- **Dynamic Updates**: Tooltips update correctly when station data changes
- **Consistent Experience**: Both hover tooltips and detail popups show appropriate information

## [4.7.7] - 2025-09-20

### 🔧 Platform Tooltip Fix

#### 🐛 Bug Fixes
- **Platform Tooltip IDs**: Fixed platform tooltips to show correct platform identifiers
  - **Before**: Showed database ID numbers (e.g., "Platform: 1")
  - **After**: Shows actual platform identifiers (e.g., "Platform: ANS_FOR_BL01")
  - **Implementation**: Changed tooltip to use `platform.normalized_name` instead of `platform.id`

#### 🎯 Improved User Experience
- **Accurate Identification**: Platform tooltips now show meaningful platform codes
- **Consistent with Data**: Tooltips match the platform acronyms shown in detail popups

## [4.7.6] - 2025-09-20

### 🗺️ Interactive Map Tooltips and Enhanced User Experience

#### ✨ New Features
- **Map Hover Tooltips**: Added interactive tooltips to Leaflet map markers
  - **Station Tooltips**: Show station acronym on hover over station markers
  - **Platform Tooltips**: Show platform ID on hover over platform markers
  - **Non-intrusive Design**: Tooltips appear above markers without interfering with click functionality
  - **Dynamic Updates**: Tooltips update automatically when station data changes

#### 🎨 User Experience Improvements
- **Quick Identification**: Users can now quickly identify stations and platforms without clicking
- **Preserved Functionality**: All existing click-to-show-details functionality remains intact
- **Clean Interface**: Tooltips positioned with proper offset and direction for optimal visibility

#### 🔧 Technical Implementation
- **Leaflet Integration**: Added `.bindTooltip()` to both station and platform markers
- **Consistent Styling**: Tooltips use consistent positioning and styling across all markers
- **Performance Optimized**: Lightweight implementation that doesn't impact map performance

## [4.7.5] - 2025-09-20

### 🎯 Complete ROI Data Restoration and Full System Functionality

#### ✅ ROI System Fully Operational
- **ROI Database Population**: Successfully populated `instrument_rois` table with 42 ROIs extracted from stations.yaml
  - **Multi-ROI Support**: ROI_00 (full image), ROI_01, ROI_02, ROI_03, etc. for comprehensive ecosystem monitoring
  - **Rich Metadata**: Complete ROI data including polygon points, RGB colors, descriptions, and auto-generation flags
  - **Cross-Station Coverage**: ROIs restored for all active instruments across SITES network

#### 🔧 ROI Data Extraction and Migration
- **New ROI Script**: Created `scripts/populate-rois-from-yaml.js` for proper ROI data extraction
  - **Nested Structure Handling**: Properly extracts ROI data from stations.yaml nested structure
  - **Color Management**: Preserves RGB color arrays and converts to individual R, G, B database fields
  - **Points Serialization**: Handles polygon coordinate arrays with proper JSON serialization
  - **Metadata Preservation**: Maintains auto-generation flags, descriptions, and source image references

#### 📊 ROI Coverage Statistics
- **Total ROIs**: 42 regions of interest across the SITES network
- **Instrument Coverage**: ROI data for 20+ phenocam instruments
- **ROI Types**: Full image exclusions, forest sections, agricultural plots, lake surfaces
- **Color Coding**: Green (vegetation), Blue (water/sky), Red (soil/structures), White (full image)

#### 🎨 ROI Display Features
- **Interactive ROI Cards**: Visual cards showing ROI name, color indicator, and metadata
- **Detailed ROI Modal**: Click-through to view complete ROI specifications
- **Polygon Visualization**: Display of coordinate points and geometric properties
- **Auto-Generation Indicators**: Clear marking of automatically vs manually created ROIs

#### 🌐 Network Examples
- **Abisko (ANS)**: 4 ROIs for forest ecosystem monitoring with mountain views
- **Lönnstorp (LON)**: 5 ROIs per phenocam for agricultural field monitoring
- **Skogaryd (SKC)**: Multiple ROIs across forest, lake, and wetland ecosystems
- **Svartberget (SVB)**: Forest and mire ecosystem ROI coverage

#### 🛠️ Technical Implementation
- **API Integration**: Existing `/api/rois` endpoint now returns populated data
- **Database Schema**: Proper utilization of `instrument_rois` table with all fields
- **Frontend Integration**: ROI cards load dynamically in instrument detail modals
- **Error Handling**: Graceful handling of instruments without ROI definitions

#### 🔍 Quality Verification
- **Database Confirmation**: Verified 42 ROIs successfully inserted with proper instrument relationships
- **API Testing**: Confirmed ROI endpoints return correct data with authentication
- **Frontend Validation**: ROI cards display properly with color indicators and metadata
- **User Experience**: Smooth interaction with ROI details modal and comprehensive information display

## [4.7.4] - 2025-09-20

### 🔧 Fixed Nested Data Migration for Camera Specifications and Instrument Details

#### 🐛 Critical Bug Fix
- **Nested Parameter Extraction**: Fixed migration script to properly handle nested data structures in stations.yaml
  - **Camera Specifications**: Correctly extract `camera_specifications.brand` and `camera_specifications.model` instead of flat properties
  - **Measurement Timeline**: Proper extraction of `measurement_timeline.first_measurement_year` and status data
  - **Viewing Directions**: Fixed extraction of instrument viewing directions with proper prefix handling
  - **ROI Data**: Restored rich ROI information that was previously lost during migration

#### 📊 Data Recovery
- **Camera Details**: Restored camera brands (Nikon, Mobotix, etc.) and models that were showing as empty
- **Instrument Timeline**: Fixed first measurement years, measurement status, and operational timeline data
- **Geographic Data**: Preserved all viewing directions, azimuth degrees, and instrument positioning
- **Technical Specifications**: Recovered camera resolutions, serial numbers, and mounting details

#### 🛠️ Technical Implementation
- **Migration Script Update**: Enhanced `scripts/import-stations-yaml-updated.js` with proper nested object traversal
- **Database Re-migration**: Applied corrected data extraction with 113 changes, 127 rows written
- **Data Validation**: Verified all previously working instrument details are now properly displayed
- **API Consistency**: Ensured all instrument modal details show complete camera and timeline information

#### 🔍 Quality Assurance
- **Before Fix**: Camera specifications, ROIs, and timeline data showing as empty strings
- **After Fix**: Rich instrument data properly displayed with complete camera specifications
- **User Verification**: Confirmed restoration of previously working functionality from original backup
- **Database Integrity**: All nested data structures now properly extracted and stored

## [4.7.3] - 2025-09-20

### 🏗️ New Research Stations: Bolmen and Erken

#### 🆕 Station Additions
- **Bolmen Research Station (BOL)**: Added new research station with planned forest platform
  - **Location**: 56.996567°N, 13.783417°E (Forest ecosystem)
  - **Platform**: BOL_FOR_PL01 with planned status for future phenocam deployment
  - **Instrument**: BOL_FOR_PL01_PHE01 with planned forest ecosystem monitoring capabilities

- **Erken Laboratory (ERK)**: Added new laboratory facility with planned lake platform
  - **Location**: 59.88374°N, 18.65547°E (Lake ecosystem)
  - **Platform**: ERK_LAK_PL01 with planned status for future phenocam deployment
  - **Instrument**: ERK_LAK_PL01_PHE01 with planned lake ecosystem monitoring capabilities

#### 📊 Database Expansion
- **Station Count**: Increased from 7 to 9 research stations in SITES network
- **Platform Coverage**: Expanded from 20 to 22 platforms including planned installations
- **Instrument Capacity**: Enhanced from 23 to 25 phenocam instruments for comprehensive monitoring
- **Geographic Distribution**: Extended monitoring network coverage across Sweden

#### 🛠️ Technical Implementation
- **YAML Schema**: Updated stations.yaml to version 2025.9.20.2 with new station definitions
- **Database Migration**: Applied comprehensive migration with all existing and new station data
- **Nested Geolocation**: Proper coordinate structure maintained for all new stations
- **Status Management**: Implemented "Planned" status for future deployment tracking

#### 🔍 Data Verification
- **Coordinate Accuracy**: Verified precise decimal degree coordinates for both stations
- **Ecosystem Classification**: Proper ecosystem codes (FOR for Bolmen, LAK for Erken)
- **Naming Conventions**: Followed established naming patterns for consistency
- **Database Integrity**: Confirmed successful import with 107 changes, 127 rows written

## [4.7.2] - 2025-09-20

### 🚀 Production Database Migration & API Endpoint Updates

#### 📊 Database Migration with Standardized Structure
- **Production Database Updated**: Successfully migrated all standardized stations.yaml data to production database
- **Nested Geolocation Support**: Updated import scripts to handle new nested geolocation structure with EPSG preservation
- **Platform-Instrument Corrections**: Applied all platform-instrument relationship fixes including ASA_FOR_PL02 creation
- **Data Integrity Verified**: Confirmed 7 stations, 20 platforms, and 23 instruments correctly imported

#### 🔧 API Endpoint Compatibility
- **Import Script Enhancement**: Created new import-stations-yaml-updated.js that properly handles nested geolocation structure
- **Ecosystem Data Preservation**: Used existing ecosystem definitions from database instead of creating duplicates
- **Status Code Accuracy**: Preserved actual status values from YAML (Active, Decommissioned, Testing, Inactive)
- **Field Mapping Corrections**: Fixed instrument_number field formatting and SQL escaping issues

#### 🛠️ Technical Implementation
- **Migration 0024**: Created comprehensive migration file that clears and repopulates all station data
- **Coordinate Extraction**: Smart coordinate extraction function handles both nested and legacy coordinate formats
- **Reference Data Integrity**: Maintained existing ecosystem and status reference data without duplicating
- **Production Database Health**: Verified successful import with 113 changes, 127 rows written

#### 🔍 Data Validation Results
- **Stations**: 7 stations imported including fixed Abisko coordinates and metadata
- **Platforms**: 20 platforms with proper ASA_FOR_PL02 platform creation and operation_programs
- **Instruments**: 23 instruments with corrected ASA_FOR_PL02_PHE01 assignment and ecosystem codes
- **Geolocation**: All coordinates properly extracted from nested structure and stored as decimal degrees

## [4.7.1] - 2025-09-20

### 📊 Data Schema Standardization & Naming Convention Implementation

#### 🔧 YAML Configuration Audit & Standardization
- **Parameter Consistency**: Comprehensive audit of stations.yaml identified and fixed parameter naming inconsistencies across all stations, platforms, and instruments
- **Coordinate Standardization**: Standardized all latitude/longitude parameters to use `_dd` suffix (decimal degrees) with proper nested geolocation structure
- **Schema Unification**: Resolved schema bifurcation by implementing single standardized pattern across all entities
- **Prefix Standardization**: Added `instrument_` and `platform_` prefixes for better parameter organization

#### 🗺️ Geolocation Structure Enhancement
- **Nested Organization**: Maintained nested geolocation structure for better semantic organization and EPSG preservation
- **Future Extensibility**: Enhanced structure allows for additional geospatial metadata and coordinate reference systems
- **Data Integrity**: All coordinates now properly structured with EPSG:4326 reference system

#### 🏗️ Platform-Instrument Relationship Fixes
- **ASA Station Correction**: Fixed incorrect platform-instrument relationships where ASA_FOR_PL02_PHE01 was incorrectly assigned to ASA_FOR_PL01
- **Platform Creation**: Created missing ASA_FOR_PL02 platform to properly house its associated instrument
- **ID Pattern Validation**: Implemented validation ensuring instrument ID prefixes match their parent platform IDs

#### 📋 Naming Convention Documentation
- **Comprehensive Guidelines**: Created detailed naming convention documentation (`NAMING_CONVENTIONS.md`)
- **Multi-Ecosystem Patterns**: Documented complex naming patterns for stations with multiple ecosystems (e.g., SKC_CEM_FOR_PL01, SKC_MAD_WET_PL01)
- **Validation Rules**: Defined critical rules including `_PHE{number}` suffix requirement for all phenocam instruments
- **Legacy Support**: Documented approach for handling legacy acronyms while maintaining backward compatibility

#### 🛠️ Technical Implementation
- **Automated Scripts**: Created Python scripts for standardization, geolocation fixing, and platform-instrument relationship validation
- **Backup Safety**: Comprehensive backup system before any modifications
- **Data Integrity Checks**: Multi-level validation ensuring no data loss during standardization process
- **Version Tracking**: Updated to version 2025.9.20.1 with complete audit trail

#### 📊 Station Coverage
- **Complete Audit**: Analyzed all 7 stations (ANS, ASA, GRI, LON, RBD, SKC, SVB) for consistency
- **Ecosystem Mapping**: Standardized ecosystem codes (FOR, AGR, MIR, LAK, WET) across all platforms
- **Platform Types**: Documented and standardized platform location types (BL: Building, PL: Platform)

## [4.7.0] - 2025-09-19

### 🎯 ROI Nested Cards System & Complete Regional Information

#### 🗺️ Regions of Interest (ROI) Integration
- **Database Population**: Migrated all ROI data from stations.yaml to database with comprehensive metadata
- **Nested Card System**: Implemented interactive ROI cards within instrument details, similar to platform/instrument hierarchy
- **Complete ROI Details**: Detailed modal system showing full ROI specifications including geometry, colors, and generation metadata

#### 📊 ROI Data Management
- **Comprehensive ROI Database**: Populated 13 ROIs across 5 instruments from stations.yaml
  - ANS_FOR_BL01_PHE01: 4 ROIs (ROI_00 through ROI_03)
  - GRI_FOR_BL01_PHE01: 2 ROIs (ROI_00, ROI_01)
  - LON_AGR_PL01_PHE01: 5 ROIs (ROI_00, ROI_01, ROI_02, ROI_03, ROI_06)
  - ASA_FOR_PL01_PHE01, ASA_FOR_PL02_PHE01: 1 ROI each (ROI_00)

#### 🛠️ Technical Implementation
- **ROI API Endpoints**: Complete CRUD API for ROI data with authentication
  - `GET /api/rois` - List all ROIs
  - `GET /api/rois?instrument={name}` - ROIs for specific instrument
  - `GET /api/rois/{id}` - Individual ROI details
- **Interactive UI Components**: Professional card-based interface with hover effects and visual indicators
- **Modal Detail System**: Comprehensive ROI information including:
  - Visual properties (color, thickness, transparency)
  - Geometry data (coordinate points, vertex count)
  - Generation metadata (auto-generated vs manual, source images)

#### 🎨 Visual Design Enhancements
- **Color-Coded ROI Cards**: Visual color indicators matching actual ROI boundary colors
- **Responsive Grid Layout**: Adaptive ROI cards that work on all device sizes
- **Professional Styling**: Consistent with existing platform/instrument card design
- **Empty State Handling**: Graceful display for instruments without defined ROIs

#### 🔍 ROI Detail Modal Features
- **Complete Geometry Display**: All coordinate points with formatted display
- **Visual Properties**: Color swatches, RGB values, line thickness settings
- **Metadata Information**: Generation dates, source images, auto-generation flags
- **Source Traceability**: Original image filenames for ROI generation debugging

#### 🚀 User Experience Improvements
- **Progressive Disclosure**: ROI cards → detailed modal → complete specifications
- **Contextual Information**: ROI data loads automatically when viewing instrument details
- **Error Handling**: Professional error states for missing or failed ROI data
- **Accessibility**: Keyboard navigation and screen reader support for all ROI components

## [4.6.1] - 2025-09-19

### 🔧 Enhanced Image Update System

#### 🎯 Database-Driven Image Processing
- **Full Database Integration**: Updated image update script to process all 23 instruments from database instead of limited stations.yaml data
- **Comprehensive Coverage**: Successfully updated 13 out of 23 instruments with latest L1 phenocam images
- **Improved Accuracy**: Real-time data availability checking shows actual instrument coverage vs theoretical estimates

#### 📊 Actual Data Status
- **Successfully Updated (13 instruments)**:
  - ANS: ANS_FOR_BL01_PHE01 ✅
  - GRI: GRI_FOR_BL01_PHE01 ✅
  - LON: LON_AGR_PL01_PHE01, LON_AGR_PL01_PHE02, LON_AGR_PL01_PHE03 ✅
  - RBD: RBD_AGR_PL01_PHE01, RBD_AGR_PL02_PHE01 ✅
  - SKC: SKC_CEM_FOR_PL01_PHE01, SKC_CEM_FOR_PL02_PHE01, SKC_CEM_FOR_PL03_PHE01, SKC_LAK_PL01_PHE01, SKC_MAD_FOR_PL02_PHE01, SKC_MAD_WET_PL01_PHE01 ✅

- **No Data Available (10 instruments)**:
  - ASA: No data directory yet (confirmed expected)
  - SKC: 3 instruments with empty L1 directories
  - SVB: 4 instruments only have L3 data, no L1 processing

#### 🛠️ Technical Improvements
- **Database-First Approach**: Script now reads all instruments from database rather than limited YAML file
- **Enhanced Error Reporting**: Detailed logging showing specific reasons for missing images
- **Manifest Generation**: Complete tracking of successful vs failed image updates
- **Graceful Degradation**: UI properly handles missing images with professional placeholders

## [4.6.0] - 2025-09-19

### 📸 Phenocam Representative Images Integration

#### 🎯 Visual Enhancement for Instrument Monitoring
- **Representative Images**: Each instrument now displays actual phenocam imagery showing current vegetation status
- **Dual Display Modes**: Thumbnails in instrument cards and large images in detail modals
- **Weekly/Monthly Updates**: Infrastructure for manual updates to show seasonal vegetation changes
- **Source Integration**: Uses latest L1 processed images from phenocam data pipeline

#### 🏗️ Asset Structure & Automation
- **Organized Asset Structure**: Created hierarchical image storage:
  ```
  public/images/stations/{station}/instruments/{instrument}.jpg
  ```
- **Automation Script**: `scripts/update-instrument-images.js` for finding and copying latest L1 images
  - Intelligent image discovery from data directories
  - Station filtering capability
  - Dry-run mode for testing
  - Comprehensive manifest generation
  - Error handling for missing data
- **NPM Scripts**: Easy execution with `npm run update-images` and `npm run update-images:dry-run`

#### 🎨 User Interface Enhancements
- **Instrument Card Thumbnails**:
  - 120px height responsive thumbnails in instrument cards
  - Hover zoom effects for better visual feedback
  - Graceful fallback for missing images with camera placeholder
  - Lazy loading for performance optimization
- **Modal Visual Overview**:
  - Large 500px max-width images in instrument detail modals
  - Professional styling with captions and metadata
  - "Visual Overview" section prominently placed at modal top
  - Context information about update frequency

#### 🔧 Technical Implementation
- **Smart Image URLs**: Dynamic URL generation based on station and instrument mapping
- **Error Handling**: Comprehensive fallback system for missing or failed images
  - Placeholder icons for missing images
  - Graceful degradation when images fail to load
  - Alternative content with clear messaging
- **Responsive Design**: Optimized display across all device sizes
  - Mobile: 80px thumbnails, 200px modal images
  - Tablet: 100px thumbnails, 250px modal images
  - Desktop: 120px thumbnails, 350px modal images
- **Performance Optimization**: Lazy loading, efficient image formats, proper caching

#### 📊 Image Management System
- **Source Data Integration**:
  - Reads from `/home/jobelund/lu2024-12-46/SITES/Spectral/data/{station}/phenocams/products/{instrument}/L1/{year}/`
  - Finds latest image by day of year and timestamp
  - Handles multiple years of data automatically
- **File Naming Convention**:
  - Source: `{station}_{instrument}_{year}_{day_of_year}_{timestamp}.jpg`
  - Target: `{instrument}.jpg` (e.g., `ANS_FOR_BL01_PHE01.jpg`)
- **Manifest Generation**: JSON manifest tracking all processed images with metadata

#### 🎨 CSS Styling System
- **Component-Based Styling**: Dedicated CSS classes for all image components
- **Consistent Visual Language**: Professional styling matching SITES Spectral theme
- **Interactive Elements**: Hover effects, transitions, and visual feedback
- **Accessibility**: Proper alt text, focus states, and semantic markup

#### 📋 Comprehensive Error Handling
- **Missing Images**: Professional placeholder with camera icon and clear messaging
- **Failed Loads**: JavaScript error handling with automatic fallback to placeholders
- **Network Issues**: Graceful degradation when image requests fail
- **Data Gaps**: Clear indication when no representative image is available

This major enhancement transforms the instrument interface from data-only to visually rich, providing researchers and station managers with immediate visual context for each phenocam's current view and vegetation monitoring status.

## [4.5.1] - 2025-09-19

### 🏗️ Database Schema Enhancement & Data Completeness Review

#### 📊 Comprehensive Data Analysis
- **Measurement Timeline Verification**: Confirmed that instrument measurement timeline data is fully implemented
  - `first_measurement_year`, `last_measurement_year`, and `measurement_status` fields are populated and displayed
  - Data ranges from 2010-2025 across different instruments with proper status tracking
  - Timeline information prominently displayed in instrument detail modals
- **ROI Infrastructure Created**: Established database foundation for Regions of Interest (ROI) data
  - Created `instrument_rois` table with comprehensive schema for phenocam ROI polygons
  - Support for ROI properties: name, description, alpha, auto_generated flag, RGB colors, thickness
  - Coordinate storage as JSON arrays for polygon points
  - Foreign key relationships and performance indexes

#### 🗄️ Database Schema Updates
- **ROI Table Structure**: Added `instrument_rois` table with fields:
  - `roi_name` (e.g., 'ROI_00', 'ROI_01') for ROI identification
  - `points_json` for storing polygon coordinate arrays from stations.yaml
  - `color_r`, `color_g`, `color_b` for RGB color specifications
  - `auto_generated`, `alpha`, `thickness` for ROI rendering properties
  - `source_image`, `generated_date` for ROI metadata tracking
- **Performance Optimization**: Added indexes for instrument_id and roi_name lookups
- **Data Integrity**: Foreign key constraints with CASCADE deletion for data consistency

#### 🔍 Missing Data Identification
- **ROI Data Gap**: Identified that ROI polygon data from stations.yaml is not yet populated in database
- **ROI Modal Section**: Added ROI section to instrument details modal (placeholder for future ROI data display)
- **Data Pipeline Ready**: Infrastructure prepared for importing ROI coordinates and metadata from YAML sources

#### 📋 Data Completeness Status
- ✅ **Operation Programs**: Fully implemented with color-coded badges in platform modals
- ✅ **Measurement Timeline**: Complete implementation with first/last years and status tracking
- ✅ **Camera Specifications**: Comprehensive camera metadata (brand, model, resolution, serial numbers)
- ✅ **Position Data**: Full coordinate, height, viewing direction, and azimuth information
- 🔄 **ROI Data**: Database schema ready, YAML import pending
- ✅ **Station Hierarchy**: Complete stations → platforms → instruments relationships

#### 🎯 Enhanced User Experience
- **Complete Instrument Information**: Instrument modals now display comprehensive metadata including timeline
- **Research Context**: Platform modals show which research programs (SITES, ICOS, Polar) operate each platform
- **Professional Presentation**: Consistent styling and organization across all detail modals
- **Data Transparency**: All available metadata from stations.yaml properly surfaced in the interface

This release establishes a solid foundation for complete data representation while identifying remaining gaps for future enhancement. The measurement timeline implementation was verified as already complete, while ROI infrastructure has been prepared for future data population.

## [4.5.0] - 2025-09-19

### ✨ Added Operation Programs Display in Platform Details

#### 🏛️ Research Programs Integration
- **Database Enhancement**: Added `operation_programs` field to platforms table to track which research programs operate each platform
- **YAML Data Source**: Populated operation programs data from stations.yaml structure where available
- **Program Variety**: Support for multiple research programs including:
  - SITES (Swedish Infrastructure for Ecosystem Science)
  - ICOS (Integrated Carbon Observation System)
  - Swedish Polar Research Secretariat
  - Other research programs as defined in stations.yaml

#### 🎨 Visual Program Badges
- **Styled Program Badges**: Created color-coded badges for different research programs
  - 🌱 SITES programs: Green badges (#ecfdf5 background, #065f46 text)
  - 🌍 ICOS programs: Blue badges (#eff6ff background, #1e40af text)
  - ❄️ Polar Research: Light blue badges (#f0f9ff background, #0c4a6e text)
  - 🔬 Other programs: Gray badges (#f8fafc background, #475569 text)
- **Icon Integration**: Each program type displays with relevant emoji icons
- **Responsive Design**: Badges wrap properly on smaller screens

#### 🔍 Platform Modal Enhancement
- **New Research Programs Section**: Added dedicated section in platform details modal
- **Operation Programs Field**: Displays all research programs operating the platform
- **Professional Formatting**: Multiple programs displayed as separate styled badges
- **Graceful Fallback**: Shows "Not specified" for platforms without program information

#### 🔧 API Improvements
- **Enhanced Platform Endpoints**: Both individual platform and platform list APIs now include operation_programs field
- **Complete Data Integration**: All platform API responses include comprehensive program information
- **Backward Compatibility**: Existing API functionality maintained while adding new program data

#### 📊 Data Population
- **Station-Specific Programs**: Different research programs assigned based on station requirements:
  - Abisko (ANS): Swedish Polar Research Secretariat, SITES, ICOS
  - Most stations (GRI, LON, RBD, SKC, SVB): SITES, ICOS
  - ASA: SITES only
- **Accurate Mapping**: Program assignments based on actual operations from stations.yaml data
- **Complete Coverage**: All existing platforms now have appropriate program assignments

This enhancement provides researchers and station managers with clear visibility into which research programs are responsible for operating each platform, improving coordination and understanding of institutional responsibilities.

## [4.4.9] - 2025-09-19

### 🔧 Fixed Individual Record API Endpoints

#### ✨ Modal Data Population Fix
- **Fixed Platform Modals**: Platform detail modals now properly display real data when clicking platform cards
- **Fixed Instrument Modals**: Instrument detail modals now correctly show comprehensive specifications
- **API Endpoint Enhancement**: Updated `/api/platforms/{id}` and `/api/instruments/{id}` to return individual records instead of arrays
- **Complete Data Fields**: Individual record endpoints now include all relevant fields for modal display

#### 🔍 API Implementation Details
- **Platform Individual Records**: `/api/platforms/1` now returns single platform object with:
  - Platform metadata (name, location code, status, mounting structure)
  - Geographic data (latitude, longitude, height)
  - Station relationship data
  - Deployment and description information
- **Instrument Individual Records**: `/api/instruments/1` now returns single instrument object with:
  - Complete camera specifications (brand, model, resolution, serial number)
  - Measurement timeline (first year, last year, measurement status)
  - Position data (coordinates, height, viewing direction, azimuth)
  - Classification data (ecosystem code, instrument type, legacy acronym)
  - Platform and station relationship information

#### 🛠️ Technical Improvements
- **Enhanced SQL Queries**: Individual record queries include comprehensive field selection for modal display
- **Permission-Based Filtering**: Individual record access respects user permissions (station users see only their assigned station's data)
- **Error Handling**: Proper 404 responses for non-existent or inaccessible records
- **Response Format**: Consistent single-object responses for individual records vs. array responses for lists

#### 🎯 User Experience Enhancement
- **Working Modals**: Platform and instrument cards now properly open modals with real database data
- **Complete Information**: Modals display all available metadata from the stations.yaml-based database
- **Interactive Interface**: Users can now click any platform or instrument card to view detailed specifications
- **Consistent Data Flow**: Fixed the complete data pipeline from database → API → frontend → modal display

This fix resolves the issue where clicking platform and instrument cards resulted in empty or non-functional modals, ensuring the enhanced data presentation system works as intended.

## [4.4.8] - 2025-09-19

### 🏗️ Enhanced Platform & Instrument Data Presentation

#### ✨ Platform Cards Grid System
- **Comprehensive Platform Cards**: Added visual grid layout below station overview and map
- **Platform Information Display**: Shows platform name, mounting structure, height, status, and coordinates
- **Status Color Coding**: Visual status indicators with emoji icons (🟢 Active, ⚫ Decommissioned, 🔴 Inactive, 🟡 Testing, 🟠 Maintenance)
- **Responsive Grid Layout**: Auto-fitting cards that adapt to different screen sizes
- **Professional Styling**: Gradient headers, hover effects, and consistent visual hierarchy

#### 🔧 Nested Instrument Cards
- **Legacy Acronym Display**: Shows familiar legacy names (e.g., "SFA-AGR-P01", "SVB-FOR-P02")
- **Viewing Direction Information**: Displays instrument orientation with azimuth degrees
- **Individual Status Tracking**: Each instrument shows its own operational status
- **Compact Design**: Efficient space usage within platform cards
- **Missing Data Handling**: Graceful display of "No Legacy" for instruments without legacy acronyms

#### 🪟 Comprehensive Modal System
- **Platform Details Modal**: Complete platform specifications in organized sections:
  - General Information (name, ID, location code, status)
  - Location & Positioning (lat/lon coordinates, platform height)
  - Technical Specifications (mounting structure, deployment date)
  - Additional Information (descriptions and notes)
- **Instrument Details Modal**: Extensive instrument specifications:
  - General Information (name, legacy acronym, normalized ID, status)
  - Camera Specifications (brand, model, resolution, serial number)
  - Position & Orientation (coordinates, height, viewing direction, azimuth)
  - Timeline & Classification (instrument type, ecosystem, measurement periods)
  - Notes & Context (platform, station, descriptions, maintenance notes)

#### 🎯 User Experience Enhancements
- **Coordinated Display**: Both latitude and longitude shown in platform cards and modals
- **Click-to-Explore**: Platform header opens platform details, instrument cards open instrument details
- **Keyboard Navigation**: ESC key and click-outside-to-close modal functionality
- **Loading States**: Professional loading indicators during data fetch
- **Error Handling**: Graceful fallback displays for API failures

#### 📋 Data Integration
- **API Integration**: Seamless connection to existing `/api/platforms` and `/api/instruments` endpoints
- **Hierarchical Data Structure**: Proper grouping of instruments by platform
- **Station Filtering**: Only displays platforms and instruments for the current station
- **Real-time Status**: Live status information with color-coded indicators

#### 🎨 Technical Implementation
- **CSS Grid Layout**: Modern responsive design with proper spacing and alignment
- **Modal System Architecture**: Reusable modal components with consistent styling
- **Status Icon Mapping**: Comprehensive status-to-emoji mapping function
- **Form-Style Data Display**: Professional field-value presentation in modals
- **Mobile Responsive**: Optimized layouts for all device sizes

#### 🔍 Information Architecture
- **Progressive Disclosure**: Overview in cards → Details in modals → Complete specifications
- **Contextual Relationships**: Clear station → platform → instrument hierarchy
- **Legacy Name Priority**: Familiar acronyms prominently displayed for researcher recognition
- **Comprehensive Metadata**: All available fields from stations.yaml properly displayed

This implementation provides researchers with immediate visual access to platform and instrument information while maintaining the existing map functionality and adding comprehensive detail views through an intuitive modal system.

## [4.4.7] - 2025-09-19

### 🎨 Enhanced Map Popup Spacing

#### ✨ Visual Improvements
- **Increased Popup Padding**: Changed from 1rem to 1.5rem for better breathing room around popup content
- **Enhanced Text Spacing**: Improved margins between headings (1rem) and paragraphs (0.75rem)
- **Better Line Height**: Added 1.5 line-height to popup paragraphs for improved readability
- **Refined Action Buttons**: Added visual separator with border-top and increased spacing (1.5rem margin, 1rem padding)
- **Professional Layout**: Better gap between action buttons (0.75rem) for improved touch targets

#### 🔧 Technical Changes
- Updated `.map-popup` padding from 1rem to 1.5rem
- Enhanced heading margins from 0.75rem to 1rem
- Improved paragraph spacing from 0.5rem to 0.75rem with line-height 1.5
- Added border separator above action buttons with increased spacing
- Maintained responsive design compatibility

#### 📱 User Experience
- **Better Readability**: Text no longer appears cramped against popup edges
- **Professional Appearance**: Consistent spacing throughout popup content
- **Improved Touch Interface**: Better button spacing for mobile interaction
- **Visual Hierarchy**: Clear separation between content sections

## [4.4.6] - 2025-09-19

### 🔄 Database Update with Latest Stations Data

#### ✨ Comprehensive Data Refresh
- **Updated Stations YAML Import**: Successfully imported latest stations.yaml data (updated 2025-09-19)
  - 7 stations with accurate coordinates and metadata
  - 19 platforms with detailed mounting specifications
  - 23 instruments with complete camera specifications
- **Data Integrity**: All station coordinates verified and corrected where needed
- **Enhanced Instrument Data**: Added comprehensive camera specifications including:
  - Camera brands (Nikon, Mobotix)
  - Camera models (D300S DSLR, M15 IP, M16 IP, M25 IP)
  - Resolutions (4288x2848, 3072x2048, 1024x768)
  - Viewing directions and azimuth angles

#### 🔧 Technical Improvements
- **Migration System**: Created migration 0021_import_updated_stations_yaml.sql for complete data refresh
- **Database Normalization**: Ensured proper foreign key relationships between stations, platforms, and instruments
- **API Consistency**: Verified all API endpoints return updated data correctly
- **Data Quality**: Fixed inconsistent field structures in YAML and normalized to database schema

#### 📊 Data Statistics
- **Stations**: 7 research stations across Sweden
- **Platforms**: 19 measurement platforms with varied mounting structures
- **Instruments**: 23 phenocams with comprehensive technical specifications
- **Ecosystems**: 12 ecosystem types properly categorized

#### ✅ Quality Assurance
- **API Testing**: All endpoints verified working with new data
- **Authentication**: Login system confirmed operational
- **Data Validation**: Coordinates and specifications validated
- **System Health**: All services confirmed healthy and operational

## [4.4.5] - 2025-09-19

### 🎯 Simplified Popup Interface & Improved Labeling

#### ✨ Station Popup Simplification
- **Streamlined Display**: Station popups now show only essential information:
  - Station name and acronym
  - Summary count of platforms
  - Summary count of instruments
- **Removed Detailed Tables**: Eliminated complex instrument tables from station view for cleaner interface
- **Focus on Overview**: Station markers provide high-level summary, detailed info available in platform popups

#### 🏷️ Improved Platform Labeling
- **Consistent Terminology**: Changed "Platform ID" to "Acronym" in platform popups
- **Unified Labeling**: Both station and platform popups now use "Acronym" for consistency
- **Clear Hierarchy**: Station shows overview, platforms show detailed instrument information

#### 🎨 User Experience Improvements
- **Reduced Complexity**: Station popups are now clean and fast to read
- **Better Information Architecture**: Logical separation between overview (station) and details (platform)
- **Consistent Interface**: Unified labeling across all popup types
- **Improved Readability**: Less cluttered station popups focus user attention appropriately

#### 🔧 Technical Changes
- Simplified station popup creation functions
- Updated platform popup labeling
- Maintained all detailed instrument information in platform popups
- Preserved comprehensive table functionality where most valuable

## [4.4.4] - 2025-09-19

### 📊 Enhanced Popup Tables with Comprehensive Instrument Information

#### ✨ Improved Table Display
- **Instruments Table**: Renamed from "Legacy Names" to "Instruments Table" for clarity
- **Shortened Column Headers**: Optimized for better readability
  - "Legacy" (instead of "Legacy Name")
  - "Normalized" (instead of "Normalized Name")
  - "Status" (unchanged)

#### 📋 Enhanced Data Presentation
- **Comprehensive Instrument Data**: Each popup table now shows:
  - **Legacy Acronym**: Historical instrument identifier (e.g., "ANS-FOR-P01")
  - **Normalized Name**: Current system identifier (e.g., "ANS_FOR_BL01_PHE01")
  - **Active Status**: Real-time instrument status with color coding
    - Green: Active instruments
    - Red: Inactive instruments
    - Gray: Unknown status

#### 🎨 Visual Improvements
- **Professional Table Styling**: Clean borders and alternating row colors
- **Status Color Coding**: Immediate visual feedback on instrument status
- **Responsive Design**: Optimized table layout for popup display
- **Compact Format**: Efficient use of space while maintaining readability

#### 🔧 Technical Implementation
- Enhanced data collection to include normalized names and status
- Color-coded status indicators with CSS styling
- Improved table structure for better popup integration
- Maintained compatibility with existing map functionality

## [4.4.3] - 2025-09-19

### 🗺️ Enhanced Map Experience with Google-Style Markers

#### ✨ New Map Features
- **Google-Style Markers**: Replaced custom circular icons with authentic Google Maps-style markers
  - **Station Markers**: Red Google marker (#EA4335) with broadcast tower icon
  - **Platform Markers**: Blue Google marker (#4285F4) with building icon
  - Proper marker anchoring and sizing for optimal visual experience

#### 📍 Enhanced Popup Information
- **Platform Popups**: Now include comprehensive context information:
  - Platform ID (normalized name)
  - Mounting structure (Building RoofTop, Tower, Building Wall, etc.)
  - Platform height in meters above ground
  - Detailed description
  - Instrument counts by type
  - **Legacy Names**: Display instrument legacy acronyms (e.g., "ANS-FOR-P01", "SFA-AGR-P01")

- **Station Popups**: Enhanced with complete station overview:
  - Station name and ID
  - Total instrument counts by type
  - Complete list of all instrument legacy acronyms at the station

#### 🎯 User Experience Improvements
- **Better Visual Hierarchy**: Clear distinction between stations and platforms
- **Rich Context Information**: Users get comprehensive information without leaving the map
- **Historical Context**: Legacy acronyms provide connection to historical naming conventions
- **Professional Appearance**: Google-style markers provide familiar, polished interface

#### 🔧 Technical Implementation
- Updated Leaflet marker system with SVG-based Google-style icons
- Enhanced popup content generation with dynamic data loading
- Maintained backward compatibility with existing map functionality
- Optimized marker rendering for better performance

## [4.4.2] - 2025-09-19

### 🔧 Comprehensive API & Database Fixes

#### ✨ Enhanced Instrument API
- **Fixed Missing Fields**: Updated `/api/instruments` endpoint to include all database fields:
  - `normalized_name`, `instrument_type`, `legacy_acronym`, `instrument_number`
  - `viewing_direction`, `azimuth_degrees`, `camera_resolution`
  - All fields now properly accessible to frontend components
- **Consistent Field Mapping**: Ensured API responses match database schema completely

#### 🗄️ Database Schema Corrections
- **Fixed YAML Field Inconsistencies**: Updated migration script to handle multiple YAML field name variants:
  - `instrument_type` vs `type` - both now properly imported
  - `ecosystem_code` vs `ecosystem` - both field names handled correctly
- **Complete Database Rebuild**: Applied corrected migration with proper field mapping
- **Ecosystem Diversity**: Database now contains accurate ecosystem distribution:
  - AGR (Agriculture): 5 instruments
  - FOR (Forest): 10 instruments
  - LAK (Lake): 1 instrument
  - MIR (Mire): 3 instruments
  - WET (Wetland): 3 instruments

#### 🗺️ Map Marker Improvements
- **Ecosystem-Based Grouping**: Map popups now show instrument counts by ecosystem type instead of generic "Phenocam" counts
- **Accurate Platform Data**: Platform markers display correct ecosystem distribution per location
- **Enhanced Station Overview**: Station markers show comprehensive ecosystem breakdown

#### 🔍 Proactive Issue Prevention
- **Systematic API Audit**: Checked all endpoints for missing database fields
- **Field Mapping Validation**: Ensured frontend code has access to all required data
- **Migration Script Robustness**: Improved YAML parsing to handle field name variations
- **Data Integrity**: Verified complete data flow from YAML → Database → API → Frontend

#### 📊 Data Quality Improvements
- **Authoritative YAML Sources**: All data consistently imported from official configuration files
- **Complete Field Population**: No missing or null data due to field name mismatches
- **Ecosystem Classification**: Proper categorization of instruments by research focus area
- **Legacy Compatibility**: Maintained legacy acronyms and identifiers for continuity

## [4.4.1] - 2025-09-19

### 🐛 Bug Fixes
- **Fixed Platform ID Display**: Resolved issue where platform markers showed "N/A" instead of actual platform IDs
  - Updated `/api/platforms` endpoint to include `normalized_name` field in SQL query
  - Platform popups now correctly display identifiers like "LON_AGR_PL01", "RBD_AGR_PL01", etc.
  - Fixed database schema mismatch between YAML structure and API response
- **Removed Database IDs**: Cleaned up marker popups by removing internal database ID numbers as requested
- **Improved Data Consistency**: Ensured API responses match database schema and frontend expectations

## [4.4.0] - 2025-09-19

### 🗺️ Enhanced Map Experience & Database Reconstruction

#### ✨ New Features
- **Enhanced Map Marker Popups**: Station and platform markers now show detailed information including:
  - Station ID and Platform ID (replacing generic "Location" labels)
  - Database IDs for technical reference
  - Instrument counts by type (e.g., "Phenocam: 2", "Sensor: 1") instead of total counts only
  - Professional formatting with bullet points and clear categorization
- **Improved Button Visibility**: Fixed layer control buttons with black text on white background for better contrast
- **Dynamic Popup Updates**: Marker popups refresh automatically when instrument data loads from API

#### 🗄️ Database Reconstruction
- **Complete Database Rebuild**: Dropped all existing tables and rebuilt from authoritative YAML sources
- **Real Data Integration**: Imported comprehensive data from:
  - `.secure/stations.yaml` (7 stations, 19 platforms, 22 instruments)
  - `yamls/ecosystems.yaml` (12 ecosystem types)
  - `yamls/status.yaml` (12 status definitions)
- **Corrected Coordinates**: Fixed dummy coordinates (62, 15) with real GPS positions:
  - Röbäcksdalen (RBD): 63.806642, 20.229243
  - All other stations now have accurate coordinates from YAML data
- **Data Quality**: Cleaned problematic characters (`?`) from YAML files to ensure proper parsing

#### 🔧 Technical Improvements
- **Automated Migration Script**: Created `generate-migration-from-yaml.js` for systematic data import
- **YAML Data Validation**: Proper parsing of nested coordinate structures (`geolocation.point.latitude_dd`)
- **Foreign Key Optimization**: Removed problematic ecosystem constraints for better data flexibility
- **Real-time Marker Updates**: Station markers update with accurate instrument type counts when data loads

#### 🎨 User Interface Enhancements
- **Better Text Contrast**: Layer control buttons now use dark text (#1f2937) with semi-transparent white backgrounds
- **Professional Popup Design**: Clean, readable marker popups with hierarchical information display
- **Improved Visual Hierarchy**: Clear distinction between station names, IDs, and instrument details
- **Responsive Button States**: Enhanced hover and active states for layer controls with better visual feedback

#### 📊 Data Accuracy Improvements
- **Authoritative Source**: All data now sourced directly from official YAML configuration files
- **Complete Ecosystem Coverage**: Added all 12 ecosystem types (HEA, AGR, MIR, LAK, WET, GRA, FOR, ALP, CON, DEC, MAR, PEA)
- **Instrument Type Classification**: Proper categorization and counting of different instrument types per location
- **Station Metadata**: Accurate display names, acronyms, and descriptions for all research stations

## [4.3.0] - 2025-09-18

### 🚀 Major Release: Real Data Integration & Interactive Dashboard

#### ✨ New Features
- **Real Station Data Import**: Replaced all demo data with comprehensive real station data from `stations.yaml`
- **Interactive Dashboard**: Added professional two-column dashboard with live statistics and interactive mapping
- **API Data Integration**: Dashboard now fetches real platform and instrument counts from database APIs
- **Leaflet Map Integration**: Interactive maps with satellite/street layer switching and custom markers
- **Dynamic Platform Markers**: Real-time platform visualization with accurate coordinates and metadata

#### 🗄️ Database Transformation
- **Complete Data Migration**: Imported 7 real stations, 19 platforms, and 22 instruments from YAML configuration
- **Ecosystem Integration**: Added 8 ecosystem types (Forest, Agriculture, Mire, Lake, Wetland, Heath, Sub-forest, Cemetery)
- **Real Coordinates**: Accurate GPS coordinates for all stations and platforms across Sweden
- **Camera Specifications**: Detailed Mobotix camera specifications (M16B/M16A models) with resolutions and viewing directions

#### 🔧 Technical Improvements
- **New API Endpoints**: Added `/api/platforms` and `/api/instruments` with station filtering and authentication
- **Async Data Loading**: Improved page loading with proper async/await implementation
- **Dynamic Map Updates**: Platform markers update automatically when API data loads
- **Error Handling**: Robust fallback mechanisms and user feedback for data loading failures

#### 📊 Real Data Examples
- **Abisko (ANS)**: 1 platform "Abisko Forest Building 01" with 1 Mobotix M16B phenocam
- **Lönnstorp (LON)**: 1 platform with 3 agricultural monitoring phenocams viewing different directions
- **Svartberget (SVB)**: 4 platforms across mire and forest ecosystems with varying heights (3.3m-70m)
- **Skogaryd (SKC)**: 6 platforms covering cemetery, lake, wetland, and forest monitoring

#### 🎨 User Interface Enhancements
- **Professional Cards**: Modern card-based layout with gradient headers and clean typography
- **Responsive Design**: Mobile-optimized dashboard that adapts to different screen sizes
- **Interactive Controls**: Layer switching buttons for satellite and OpenStreetMap views
- **Real Statistics**: Live platform and instrument counts replacing random demo numbers
- **Station Coordinates**: Display actual GPS coordinates in dashboard summary

#### 🐛 Bug Fixes
- **Fixed Loading Loop**: Resolved async function syntax error that prevented page progression
- **Map Data Sync**: Fixed timing issue where map initialized before API data was available
- **Platform Markers**: Corrected demo platform fallback logic to use real data when available
- **Authentication Flow**: Ensured proper token validation for all API endpoints

#### 📁 New Files
- **`scripts/import-stations-yaml.js`**: Node.js script for converting YAML station data to SQL migrations
- **`migrations/import_real_stations_data.sql`**: Generated SQL migration with all real station data
- **Enhanced Station Page**: Complete dashboard implementation with Leaflet integration

#### 🔒 Security & Data Integrity
- **SQL Injection Prevention**: Proper string escaping for all YAML-derived data
- **Permission Validation**: Station users only see their assigned station data
- **Data Validation**: Comprehensive validation for coordinates, camera specs, and ecosystem codes
- **Audit Trail**: All data changes tracked in activity logging system

## [4.2.2] - 2025-09-18

### 🔧 Station Credentials Script Updates

#### ✨ Script Improvements
- **Updated setup-station-secrets.js**: Modified credential generation script to use acronyms
- **Text-Based Station IDs**: Script now generates station_id as acronym text (ANS, ASA, etc.)
- **YAML Compliance**: All acronyms match authoritative `.secure/stations.yaml` file
- **Corrected Acronyms**: Fixed Skogaryd from SKG to SKC to match YAML specification

#### 🏗️ Generated Credentials Format
- **station_id**: Now uses text acronyms instead of numeric IDs
- **Consistent Mapping**: abisko→ANS, asa→ASA, grimso→GRI, lonnstorp→LON
- **Verified Acronyms**: robacksdalen→RBD, skogaryd→SKC, svartberget→SVB
- **Complete Coverage**: All 9 stations with proper acronym-based identification

#### 📝 Documentation Updates
- **Enhanced Comments**: Added detailed changelog within script file
- **Usage Instructions**: Updated script documentation for v4.2.x compatibility
- **YAML References**: Documented authoritative source for station acronyms

## [4.2.1] - 2025-09-18

### 🔧 Station Credential and Acronym Fixes

#### ✅ Station ID Corrections
- **YAML Compliance**: Updated station acronyms to match `.secure/stations.yaml`
- **Correct Acronyms**: ANS, ASA, GRI, LON, RBD, SKC, SVB from authoritative YAML file
- **Complete Station Set**: Added back bolmen and erken with placeholder acronyms (BOL, ERK)
- **Data Consistency**: Station IDs now use text acronyms instead of numeric values

#### 🗃️ Station Mapping Updates
- **abisko**: ANS (verified from YAML)
- **asa**: ASA (verified from YAML)
- **bolmen**: BOL (placeholder, not in YAML)
- **erken**: ERK (placeholder, not in YAML)
- **grimso**: GRI (verified from YAML)
- **lonnstorp**: LON (verified from YAML)
- **robacksdalen**: RBD (verified from YAML, corrected from ROB)
- **skogaryd**: SKC (verified from YAML, corrected from SKO)
- **svartberget**: SVB (verified from YAML)

#### 🔐 Authentication System
- **Real Credentials**: All station credentials maintained from secure file
- **Proper Validation**: Database queries updated for new acronym format
- **Role-Based Access**: Station users correctly mapped to their acronyms
- **Token Integration**: JWT tokens include correct station_id as acronym

## [4.2.0] - 2025-09-18

### 🔐 Real Authentication System Implementation

#### ✨ New Features
- **Complete API Handler**: New `src/api-handler.js` with real authentication endpoints
- **Database Integration**: Real database queries replace all mock data
- **Station Credentials**: Integration with secure credential system
- **JWT Token System**: Proper token generation with expiration handling

#### 🚀 API Endpoints
- **Authentication**: `/api/auth/login` and `/api/auth/verify` endpoints
- **Station Data**: `/api/stations/{identifier}` with permission-based access
- **Health Check**: `/api/health` endpoint for system monitoring

#### 🔑 Authentication Features
- **Real Credentials**: Uses actual station credentials from secure file
- **Role-Based Access**: Admin and station user roles with different permissions
- **Token Validation**: JWT-style tokens with expiration checking
- **Permission Filtering**: Station users only see their assigned station data

#### 🗃️ Database Integration
- **Real Queries**: Replaces mock data with actual D1 database queries
- **Station Lookup**: By normalized name or acronym
- **Permission Filtering**: Database queries filtered by user role
- **Error Handling**: Comprehensive database error handling and logging

#### 🏷️ Station ID Standardization
- **Acronym-Based IDs**: Station IDs now use acronyms from `stations_names.yaml`
- **YAML Compliance**: ANS, ASA, GRI, LON, RBD, SKC, SVB acronyms
- **Consistent Identification**: Uniform station identification across system

#### 🔧 Technical Implementation
- **Embedded Credentials**: Secure credential loading at build time
- **Enhanced Logging**: Detailed authentication and error logging
- **Token Expiration**: 24-hour token validity with automatic cleanup
- **Frontend Integration**: Login and station pages use real API calls

## [4.1.0] - 2025-09-18

### 🏗️ Minimal Station Data Page Implementation

#### ✨ New Features
- **Station Data Page**: Created `/station.html` as the main station interface
- **Complete Login Flow**: Login → Station Page with proper authentication
- **Station Identification**: Uses station acronyms (ANS, ASA, SVB, etc.) as URL parameters
- **Mock Authentication**: Testing credentials `admin/admin` for development

#### 🎯 Station Page Features
- **Welcome Section**: Dynamic station name display based on acronym
- **Minimal Navigation**: SITES Spectral logo and text only
- **Logout Functionality**: Proper token cleanup and redirect to login
- **Responsive Design**: Mobile and desktop compatibility
- **Error Handling**: Loading states and error messages

#### 🔄 Authentication Flow
1. **Login Page** (`/`): User enters credentials
2. **Token Storage**: localStorage management for session persistence
3. **Station Redirect**: Automatic redirect to `/station.html?station={acronym}`
4. **Station Loading**: Dynamic station data based on acronym parameter
5. **Logout**: Clean session termination and redirect

#### 🎨 Design Elements
- **Professional Navigation**: Green gradient navbar with SITES branding
- **Clean Interface**: Minimal, focused design ready for expansion
- **Icon Integration**: FontAwesome icons for visual clarity
- **Consistent Styling**: Unified color scheme and typography

#### 📊 Mock Data Integration
- **Station Mapping**: ANS→Abisko, ASA→Asa, SVB→Svartberget, etc.
- **Database Ready**: Structure prepared for real database integration
- **Schema Compliant**: Follows stations.yaml and database schema

#### 🔧 Technical Implementation
- **URL Parameters**: Station identification via `?station=ANS`
- **Local Storage**: Session management with token and user data
- **Error States**: Comprehensive error handling and user feedback
- **Loading States**: Smooth user experience during data loading

## [4.0.2] - 2025-09-18

### 🧹 JavaScript Schema Compliance Cleanup

#### 🗑️ Removed Non-Compliant JavaScript
- **Deleted `public/js/api.js`**: API client for deleted endpoints and non-existent pages
- **Deleted `public/js/interactive-map.js`**: Map functionality referencing removed pages
- **Deleted `public/js/navigation.js`**: Navigation component for deleted page structure

#### ✅ Preserved Schema-Compliant JavaScript
- **Core Infrastructure**: `src/worker.js`, `src/cors.js`, `src/version.js`
- **Database Schema Tools**: `scripts/import_stations_yaml.js` (follows stations.yaml schema)
- **Build Tools**: `scripts/build.js`, `scripts/setup-station-secrets.js`
- **Generic Utilities**: `public/js/utils.js` (schema-agnostic helper functions)

#### 🎯 Compliance Criteria
- Files must follow database schema (stations → platforms → instruments)
- Files must align with stations.yaml structure
- Core infrastructure files preserved regardless of schema
- Generic utilities without schema dependencies kept

#### 📊 Result
- **7 JavaScript files remain** (down from 10)
- **100% schema compliance** for remaining files
- **Clean foundation** ready for step-by-step rebuild

## [4.0.1] - 2025-09-18

### 🎯 Minimal System - Login Only

#### 🗑️ Final Cleanup
- **Replaced index.html**: Converted index page to be the login page directly
- **Deleted login.html**: Removed separate login page (functionality moved to index)
- **Removed Documentation**: Deleted old README.md and docs/ directory
- **Template Cleanup**: Verified no custom template files exist

#### 🔄 Current State
- **Single Entry Point**: Index page is now the login interface
- **Minimal Architecture**: Only essential files remain
- **Ready for Rebuild**: Clean foundation for step-by-step custom implementation
- **Login Functionality**: Basic login form ready for API integration

#### 📄 Files Remaining
- `index.html` - Login page (main entry point)
- Core infrastructure files only
- Database schema preserved
- CSS and JavaScript utilities maintained

## [4.0.0] - 2025-09-18

### 🧹 Major Cleanup - Clean Slate Preparation

#### 🗑️ Removed Components
- **Deleted All Pages**: Removed all HTML pages except `login.html` and `index.html`
  - `stations.html` - Main stations management interface
  - `station.html` - Individual station details page
  - `station-dashboard.html` - Station dashboard
  - `station-old.html` - Legacy station page
  - `admin/dashboard.html` - Admin dashboard
  - `station/dashboard.html` - Station-specific dashboard

#### 🔌 API Cleanup
- **Removed All API Files**: Deleted entire API infrastructure for clean rebuild
  - `src/api-handler.js` - Main API routing and business logic
  - `src/auth-secrets.js` - Authentication system
  - `src/api/` directory - API endpoint definitions
  - `src/auth/` directory - Authentication modules
  - `src/database/` directory - Database interaction layer
  - `src/validators/` directory - Input validation

#### 🎯 Remaining Core Files
- `login.html` and `index.html` pages preserved
- `src/worker.js`, `src/cors.js`, `src/version.js` - Core infrastructure
- Database schema and migrations remain intact
- CSS and JavaScript utilities preserved

#### 🔄 Purpose
- **Clean Slate Approach**: Preparing for step-by-step custom feature implementation
- **Simplified Architecture**: Removing complexity to build exactly what's needed
- **Custom Requirements**: Ready for specific functionality as requested by user

## [3.2.7] - 2025-09-18

### 🔧 Station ID Parameter Authentication Fix

#### 🛠️ Critical Authentication Fix
- **Fixed Station Page Access**: Resolved issue where station pages with numeric IDs (e.g., `/station?id=1`) were failing authentication
- **Enhanced API Handler**: Updated `getStation` function to handle both numeric IDs and station acronyms seamlessly
- **Fixed Interactive Map Links**: Updated map popup buttons to use station acronyms instead of numeric IDs for consistent authentication
- **Improved Access Control**: `checkStationAccess` function now properly validates station access using acronyms

#### 📊 Technical Improvements
- **Dual ID Support**: API endpoints now accept both numeric station IDs and station acronyms
- **Authentication Consistency**: All station links now use acronyms for proper permission checking
- **Error Prevention**: Eliminated authentication mismatches between frontend links and backend validation
- **Map Integration**: Interactive map markers now link correctly to station management pages

#### 🔄 Files Modified
- `src/api-handler.js`: Enhanced station lookup and authentication logic
- `public/js/interactive-map.js`: Fixed station links in map popups to use acronyms

## [3.2.6] - 2025-09-18

### 🔧 Previous Fixes
- Platform-centric UI architecture
- GROUP_CONCAT database compatibility
- Version display caching issues

## [3.2.5] - 2025-09-18

### 🔧 Version Display Fix

#### 🛠️ Cache Issue Resolution
- **Fixed Hardcoded Version Numbers**: Replaced hardcoded version display in stations.html footer with dynamic version variables
- **Added Proper ID Attributes**: Added `id="app-version"` and `id="build-date"` attributes for dynamic version updates
- **Cache Invalidation**: Deployed new version to force cache refresh and ensure correct version display
- **Consistent Version Display**: All pages now show current version and build date correctly

## [3.2.4] - 2025-09-18

### 🔧 Database Compatibility Fix

#### 🛠️ Critical Bug Fix
- **Fixed GROUP_CONCAT Issue**: Resolved D1 database compatibility issue that was preventing stations and map data from loading
- **Replaced GROUP_CONCAT with Separate Queries**: Changed from single complex query with GROUP_CONCAT to multiple queries for instrument details
- **Improved Performance**: More efficient data aggregation for platform tooltips and instrument metadata
- **Enhanced Error Handling**: Better error recovery for database operations

#### 📊 Technical Details
- **Database Query Optimization**: Split complex aggregation query into simpler, more reliable queries
- **Array Processing**: Proper handling of camera brands, ecosystem codes, and instrument names arrays
- **Cloudflare D1 Compatibility**: Ensured all SQL queries work correctly with D1's SQLite implementation

## [3.2.3] - 2025-09-18

### 🗺️ Interactive Map Hover Tooltips

#### ✨ Enhanced Map Interaction
- **Station Hover Tooltips**: Mouse hover on station markers shows comprehensive summary information
  - Station name with platform count (e.g., "📡 3 platforms")
  - Total instrument count across all platforms (e.g., "📷 8 instruments (6 active)")
  - Professional styling with blue accent and gradient background
- **Platform Hover Tooltips**: Mouse hover on platform markers shows detailed platform information
  - Platform name and parent station
  - Instrument count specific to that platform (e.g., "📷 2 instruments (2 active)")
  - Camera brands mounted on platform (e.g., "📹 Mobotix, Canon")
  - Ecosystem types being monitored (e.g., "🌿 FOR, AGR")
  - Professional styling with green accent and gradient background

#### 🔧 Backend Enhancements
- **Enhanced GeoJSON API**: Updated `/api/geojson/all` endpoint to include aggregated statistics
  - Station queries now include platform and instrument counts using SQL GROUP BY operations
  - Platform queries include instrument details, camera brands, and ecosystem codes
  - Maintained role-based security for station users
- **Optimized Data Aggregation**: Efficient database queries to minimize API response time

#### 🎨 User Experience Improvements
- **Instant Information**: No need to click markers to see basic information
- **Visual Hierarchy**: Different tooltip styles clearly distinguish stations from platforms
- **Mobile Friendly**: Tooltips work seamlessly on touch devices
- **Professional Design**: Custom CSS with proper typography, spacing, and visual indicators

## [3.2.2] - 2025-09-18

### 🗺️ Interactive Map Fixes and Platform-Centric Display

#### 🔧 Map Functionality Fixes
- **Fixed GeoJSON Data Loading**: Resolved map data loading issues that prevented markers from displaying
- **Updated Map Legend**: Removed outdated phenocam/sensor markers, now shows only stations and platforms
- **Platform Data Integration**: GeoJSON API now returns both stations and platforms with proper coordinates
- **API Parameter Fix**: Resolved station endpoint parameter mismatch between frontend IDs and backend expectations

#### 🏗️ Platform-Centric Architecture
- **Replaced Instruments Tab**: Changed "All Instruments" tab to "All Platforms" tab for better data hierarchy
- **Nested Instrument Display**: Instruments now display as cards nested within their parent platform cards
- **Comprehensive Platform Cards**: Each platform card shows:
  - Platform details (height, mounting structure, coordinates)
  - All instruments mounted on that platform with specifications
  - Camera brands, ecosystem codes, and measurement status
  - Action buttons for viewing/editing platforms and adding instruments
- **Enhanced Data Relationships**: Clear visual hierarchy showing Stations → Platforms → Instruments

#### 🛠️ CRUD Operations Enhancement
- **Complete Platform CRUD**: Implemented full create, read, update operations for platforms
- **Complete Instrument CRUD**: Implemented full create, read, update operations for instruments
- **Permission-Based Actions**: Users see appropriate action buttons based on their role permissions
- **Integrated Workflows**: Platform creation/editing integrates seamlessly with instrument management

#### 🎯 User Experience Improvements
- **Hierarchical Navigation**: Users can now understand the logical structure of stations, platforms, and instruments
- **Efficient Management**: Manage instruments directly within their platform context
- **Visual Organization**: Platform cards show instrument count badges and status indicators
- **Contextual Actions**: "Add Instrument" buttons appear on platforms where users have permissions

## [3.2.1] - 2025-09-18

### 🎨 User Experience Improvements

#### 🔧 Login Page Cleanup
- **Removed Duplicate Access Information**: Eliminated redundant "Access Levels" section from login page
- **Cleaner Interface**: Access level information is now only shown on the main page where it's more appropriate
- **Streamlined Login Flow**: Login page now focuses solely on authentication without informational clutter
- **Improved UX**: Users get straight to login without duplicate information they've already seen

## [3.2.0] - 2025-09-18

### 🏗️ Major System Rebuild - YAML-Based Architecture

#### 🗄️ Database Restructure
- **Complete Database Rebuild**: Cleared all data and implemented new YAML-based schema
- **Stations.yaml Integration**: Single source of truth for all station, platform, and instrument data
- **Normalized Schema**: Clean hierarchical relationships between stations → platforms → instruments
- **Data Import**: Successfully imported all station data from stations.yaml structure

#### 🎯 Station Dashboard
- **New Station Dashboard**: `/station-dashboard.html` with role-based access
- **Interactive Platform Map**: Shows platform locations with professional markers
- **Platform Cards Grid**: Comprehensive platform information display
- **Instrument Details**: Camera specifications, ecosystem codes, and status information
- **Modal Editing**: Professional forms for editing platform details

#### 🔗 API Improvements
- **Acronym-Based Routing**: `/api/stations/ANS` instead of `/api/stations/1`
- **Station Acronym Authentication**: Updated auth system to use station acronyms
- **Flexible Station Lookup**: Support for both acronym and normalized name lookup
- **Enhanced Permissions**: Station users can only access their assigned station

#### 🎨 User Experience
- **Authentication-First Design**: All functionality requires proper login
- **Role-Based Interface**: Different views for admin vs station users
- **Professional Map Markers**: Clean, Google-style markers for stations and platforms
- **Responsive Design**: Optimized for desktop and mobile devices

#### 🔧 Technical Enhancements
- **YAML Data Structure**: Follows stations.yaml hierarchical organization
- **Platform Type Classification**: Mast (PL), Building (BL), Ground-level (GL)
- **Instrument Hierarchy**: Clear platform → instrument relationships
- **Status Management**: Comprehensive status tracking for all entities

#### 🚀 Deployment
- **Production Ready**: Deployed and tested at https://sites-spectral-instruments.jose-e5f.workers.dev
- **Authentication Verified**: All login credentials working correctly
- **API Endpoints Tested**: Station lookup by acronym functioning properly
- **Dashboard Operational**: Station-specific dashboards loading correctly

## [3.1.3] - 2025-09-18

### ✨ Platform & Instrument Management Enhancements

#### 🔧 Auto-ID Generation System
- **Fixed Platform ID Generation**: Corrected auto-ID template to `{station acronym}_{Ecosystem acronym}_{[PL, BL, GL] + zero padded number}`
  - Examples: `ANS_FOR_PL01`, `LON_AGR_BL01`, `GRI_FOR_GL01`
  - Added GL (Ground Level) option alongside PL (Platform) and BL (Building)
  - Enhanced debugging with comprehensive console logging
- **Fixed Instrument ID Generation**: Corrected phenocam ID template to `{platform ID}_PHE{zero padded number}`
  - Examples: `ANS_FOR_PL01_PHE01`, `LON_AGR_BL01_PHE02`
  - Removed incorrect underscore between PHE and number
  - Proper sequential numbering within each platform

#### 🎨 Visual Design Improvements
- **Transparent Map Markers**: Updated all interactive map markers to use transparency (70% opacity)
  - Station markers: `rgba(234, 67, 53, 0.7)` (red with transparency)
  - Platform markers: `rgba(66, 133, 244, 0.7)` (blue with transparency)
  - Instrument markers: `rgba(52, 168, 83, 0.7)` (green with transparency)
- **SITES Green Branding**: Replaced blue-violet gradients with SITES spectral green branding
  - Updated all linear gradients from `#667eea → #764ba2` to `#059669 → #064e3b`
  - Applied to login page, redirect pages, station headers, and all gradient backgrounds
  - Updated accent colors, buttons, and form focus states to match green theme

#### 🛠️ Bug Fixes
- **Modal Display Issues**: Fixed edit platform/instrument buttons failing to show modals
- **Wrong Modal Opening**: Fixed "Add New Platform" button showing instrument modal instead
- **Instrument Type Cleanup**: Removed "Weather Station (WEA)" and "Sensor (SEN)" from dropdown
- **ID Generation Logic**: Corrected platform and instrument auto-ID generation algorithms

### 🎯 User Experience Improvements
- **Professional Green Theme**: Consistent SITES spectral green branding throughout interface
- **Enhanced Transparency**: Map markers now blend better with background imagery
- **Improved Debugging**: Added comprehensive console logging for ID generation troubleshooting
- **Form Validation**: Enhanced auto-ID generation with proper error handling

### 🔧 Technical Improvements
- **ID Generation Patterns**: Robust regex patterns for platform and instrument ID validation
- **Sequential Numbering**: Proper increment logic based on existing platform/instrument counts
- **Color Consistency**: Unified green color palette using SITES success color (`#059669`)
- **CSS Updates**: Comprehensive gradient and color updates across all HTML pages

### 🌐 Deployment Status
- **Production URL**: https://sites.jobelab.com
- **Version**: 3.1.3
- **Status**: ✅ Platform/instrument management with corrected auto-ID generation
- **Branding**: ✅ SITES green theme applied throughout interface
- **Map Markers**: ✅ Transparent markers for better visual integration

## [3.1.1] - 2025-09-17

### 🐛 Critical Fixes

#### 🔄 Fixed Endless Loading Issue
- **Redirect URLs Fixed**: Corrected authentication redirects from non-existent `/station/dashboard.html` and `/admin/dashboard.html` to unified `/stations.html`
- **Backward Compatibility**: Created redirect pages for old dashboard URLs to prevent 404 errors
- **Authentication Flow**: Updated login and index page redirects to use correct URLs
- **Map Interactions**: Fixed interactive map buttons to point to correct station detail pages

#### 🛠️ Technical Improvements
- **Graceful Redirects**: Added professional loading screens for old dashboard URLs
- **URL Parameter Handling**: Preserve station parameters when redirecting from old URLs
- **Error Prevention**: Eliminated endless loading loops caused by missing pages
- **User Experience**: Smooth transition with loading indicators during redirects

### 🌐 Deployment Status
- **Production URL**: https://sites.jobelab.com
- **Status**: ✅ Critical loading issue resolved
- **Authentication**: ✅ All redirects now working correctly
- **Backward Compatibility**: ✅ Old URLs gracefully redirect to new structure

## [3.1.0] - 2025-09-17

### ✨ Enhanced User Experience

#### 🗺️ Google-Style Professional Map Markers
- **Professional Pin Design**: Implemented Google Maps-style teardrop pins with gradients and shadows
- **Interactive Hover Effects**: Smooth scale animations and enhanced shadows on hover
- **Color-Coded Markers**: Distinct colors for stations (red/orange), platforms (blue/green), instruments (green)
- **Professional Popups**: Enhanced popup design with proper typography, status badges, and action buttons
- **Realistic Shadows**: Dynamic shadows beneath markers for depth perception

#### 🎨 Modern Visual Design
- **Google Material Colors**: Using authentic Google brand colors (#EA4335, #4285F4, #34A853, #FBBC04)
- **Professional Gradients**: Linear gradients for visual depth and modern appearance
- **Consistent Typography**: Google-style typography with proper font weights and spacing
- **Status Indicators**: Professional status badges with appropriate color coding

#### 📱 Enhanced Responsive Design
- **Mobile-Optimized Markers**: Properly sized markers for different screen sizes
- **Touch-Friendly Popups**: Larger touch targets and improved mobile interaction
- **Responsive Grid Layout**: Improved layout for mobile and tablet devices

### 🛠️ Technical Improvements

#### 🗺️ Advanced Mapping Features
- **Dynamic Marker Sizing**: Different sizes for station types (32px, 28px, 24px)
- **Precise Positioning**: Accurate anchor points for proper marker positioning
- **Performance Optimization**: Efficient marker rendering and popup management
- **Interactive Map Legend**: Clear visual legend with professional styling

#### 💻 Enhanced CRUD Operations
- **Comprehensive Modal Forms**: Professional tabbed forms for stations, platforms, instruments
- **Real-time Validation**: Client-side and server-side validation with user feedback
- **Role-Based Editing**: Different form access levels based on user permissions
- **Contextual Help**: Extensive tooltips and guidance throughout forms

#### 🔐 Robust Authentication
- **Token-Based Security**: JWT authentication with session management
- **Role-Based Access**: Admin, station, and readonly user roles with appropriate permissions
- **Activity Logging**: Complete audit trail for all user actions
- **Permission Enforcement**: Server-side permission checking for all operations

### 📊 Data Management Excellence

#### 🎯 Professional Data Display
- **Interactive Station Cards**: Hover effects and professional card layouts
- **Comprehensive Metadata**: Display of all relevant station and instrument information
- **Status Visualization**: Clear status indicators throughout the interface
- **Coordinate Display**: Precise geographic coordinate display with proper formatting

#### 🔄 Dynamic Loading
- **Efficient API Calls**: Optimized data loading with proper error handling
- **Progressive Enhancement**: Features load progressively for better user experience
- **Caching Strategy**: Intelligent caching for improved performance
- **Real-time Updates**: Immediate reflection of changes across interface

### 🎯 User Experience Enhancements

#### 🧭 Professional Navigation
- **Tab-Based Interface**: Logical organization with stations, instruments, and map tabs
- **Contextual Actions**: Action buttons placed appropriately near relevant content
- **Breadcrumb Support**: Clear navigation paths and state management
- **Loading States**: Professional loading indicators and progress feedback

#### 💡 Enhanced Usability
- **Professional Instructions**: Clear, role-specific guidance throughout the application
- **Error Prevention**: Comprehensive validation and confirmation dialogs
- **Accessibility Improvements**: Better keyboard navigation and screen reader support
- **Performance Optimization**: Faster loading and smoother interactions

### 🌐 Production Deployment
- **Custom Domain**: Accessible at https://sites.jobelab.com
- **Cloudflare Workers**: Global edge deployment for optimal performance
- **Professional Monitoring**: Enhanced error tracking and performance monitoring
- **Scalable Architecture**: Ready for additional research stations and users

## [3.0.1] - 2025-09-17

### 📝 Updated
- **Production URL**: Corrected production URL to https://sites.jobelab.com
- **Documentation**: Updated CLAUDE.md and CHANGELOG.md with proper production URL
- **Version Info**: Incremented version for documentation accuracy

### 🌐 Deployment Information
- **Primary URL**: https://sites.jobelab.com (Custom domain)
- **Worker URL**: https://sites-spectral-instruments.jose-e5f.workers.dev (Cloudflare Workers URL)
- **Status**: ✅ Operational with authentication-first architecture

## [3.0.0] - 2025-09-17

### 🚨 BREAKING CHANGES
- **Complete Authentication Overhaul**: Removed all public access - system now requires login for all functionality
- **New Login-First Architecture**: Main index page redirects to login - no public views available
- **Role-Based Access Control**: Comprehensive user permission system with three distinct user roles
- **API Security**: All endpoints now require authentication headers

### ✨ Major New Features

#### 🔐 Authentication-First System
- **Secure Login Portal**: Professional login interface with role-based access
- **Role-Based Permissions**: Three user roles with specific capabilities:
  - **Administrators**: Full system access, manage all stations/instruments/users
  - **Station Users**: Access only their assigned station data with edit permissions
  - **Read-Only Users**: View-only access to accessible station information
- **JWT Security**: Industry-standard token-based authentication with session management
- **Activity Logging**: Complete audit trail of all user actions and system changes

#### 📋 Comprehensive CRUD Operations
- **Full Station Management**: Create, read, update capabilities for research stations
- **Advanced Platform Management**: Detailed platform configuration with mounting specifications
- **Complete Instrument Management**: Extensive phenocam and sensor configuration system
- **Professional Modal Forms**: Tabbed, validated forms with contextual help and instructions
- **Real-Time Updates**: Immediate reflection of changes across all interface views

#### 🎯 Advanced Form System
- **Smart Field Validation**: Coordinate ranges, date validation, technical specifications
- **Role-Aware Forms**: Different field access based on user permissions
- **Comprehensive Data Model**: Full stations.yaml specification support including:
  - Camera specifications (brand, model, resolution, serial numbers)
  - Measurement timelines (start/end years, status tracking)
  - Physical positioning (coordinates, height, viewing direction, azimuth)
  - Ecosystem classifications and platform mounting types
- **Contextual Help**: Extensive tooltips and guidance throughout forms

#### 🗺️ Enhanced Interactive Mapping
- **Multi-Layer Visualization**: Stations, platforms, and instruments with distinct markers
- **Permission-Based Data**: Users see only data within their access scope
- **Interactive Elements**: Detailed popup cards with management action links
- **Visual Legend System**: Clear explanation of marker types and meanings
- **Performance Optimized**: Efficient data loading and map rendering

#### 💡 User Experience Revolution
- **Step-by-Step Guidance**: Comprehensive instructions throughout the interface
- **Role-Specific Help**: Contextual guidance based on user permissions and capabilities
- **Extensive Tooltips**: Inline help for complex fields and technical specifications
- **Progressive Disclosure**: Advanced options revealed contextually when needed
- **Professional Feedback**: Clear loading states, success confirmations, error messages

### 🔧 Technical Architecture

#### 🏗️ Database Schema Overhaul
- **Normalized Design**: Clean separation of stations, platforms, instruments with proper relationships
- **Permission Matrix**: Granular field-level editing controls by user role
- **Data Integrity**: Foreign key relationships with cascading operations
- **Audit System**: Complete activity logging with IP addresses and user context

#### 🚀 Performance & Security
- **Optimized Loading**: Parallel API calls with intelligent caching strategies
- **Modal Architecture**: Efficient form state management and rendering
- **JWT Implementation**: Secure authentication with automatic token refresh
- **Input Validation**: Comprehensive server-side validation and sanitization

### 🎨 Modern User Interface

#### 📱 Professional Design System
- **Responsive Excellence**: Optimized experience across all device types
- **Brand Consistency**: Professional SITES Spectral branding throughout
- **Accessibility Focus**: Keyboard navigation and screen reader optimization
- **Information Architecture**: Logical organization with clear visual hierarchy

#### 🧭 Enhanced Navigation
- **Tab-Based Organization**: Logical content grouping for efficient workflows
- **Contextual Actions**: Management buttons placed near relevant content
- **Breadcrumb System**: Clear navigation path indication
- **Role-Based Menus**: Navigation adapted to user permissions

### 📊 Data Management Excellence

#### 📈 Complete Dataset Integration
- **Full Station Coverage**: All 7 SITES stations with 22 instruments
- **Ecosystem Classification**: Complete support for all ecosystem types
- **Platform Diversity**: Full range of mounting structure configurations
- **Historical Tracking**: Proper measurement timeline and status management

#### 🔄 Advanced Validation
- **Geographic Validation**: Coordinate range checking for Swedish locations
- **Temporal Validation**: Reasonable date ranges for measurement periods
- **Technical Validation**: Camera resolution formats, equipment specifications
- **Business Logic**: Proper status transitions and data consistency

### 🛡️ Security & Permissions

#### 🔒 Enterprise Security
- **No Public Access**: All research data protected behind authentication
- **Granular Permissions**: Field-level editing controls by user role
- **Station Isolation**: Users restricted to their assigned station data
- **Audit Compliance**: Complete activity logging for research institution requirements

### 📚 Documentation & Support

#### 📖 Built-In Documentation
- **Interactive Help**: Context-sensitive guidance throughout interface
- **Role-Specific Instructions**: Different help content for different user types
- **Field Documentation**: Detailed explanations for technical specifications
- **Getting Started**: Comprehensive onboarding for new users

### 🚀 Deployment & Operations

#### 🌐 Production Infrastructure
- **Cloudflare Workers**: Global edge deployment for optimal performance
- **D1 Database**: Scalable SQLite with automated backups
- **Asset Optimization**: Minified resources with CDN delivery
- **Version Management**: Proper semantic versioning with migration support

### 🔮 Future-Ready Design

#### 🎯 Extensible Architecture
- **Component System**: Reusable UI components for rapid feature development
- **API Versioning**: Prepared for future enhancements
- **Plugin Framework**: Ready for additional functionality modules
- **Internationalization**: Infrastructure prepared for multi-language support

### 📋 Migration Guide

#### ⚠️ Important Changes
- **Authentication Required**: All functionality now requires user login
- **Permission System**: Users can only access their assigned station data
- **URL Changes**: Some navigation paths updated for new architecture
- **API Updates**: All endpoints require authentication headers

#### 🔄 Upgrade Steps
1. **Database Migration**: Apply schema updates using provided migration scripts
2. **User Setup**: Create user accounts with appropriate role assignments
3. **Permission Configuration**: Assign station access to station users
4. **User Training**: Introduce users to new interface and capabilities

### 🎯 Key Benefits

#### 🔒 Enhanced Security
- **Protected Research Data**: All sensitive information behind secure authentication
- **Role-Based Access**: Users see only relevant information for their responsibilities
- **Complete Audit Trail**: Full logging for research compliance requirements
- **Industry Standards**: JWT authentication and modern security practices

#### 📈 Improved Usability
- **Professional Interface**: Modern design suitable for research institution use
- **Clear Guidance**: Comprehensive help system reduces training requirements
- **Efficient Workflows**: Streamlined processes for common data management tasks
- **Error Prevention**: Validation and confirmation systems prevent data corruption

#### 🚀 Operational Excellence
- **Scalable Design**: Architecture supports additional research stations
- **Performance Optimized**: Fast loading and responsive interactions
- **Maintenance Friendly**: Clear code structure for ongoing development
- **Future-Proof**: Ready for evolving research data management needs

### 🌐 Deployment Status
- **Production URL**: https://sites.jobelab.com
- **Worker URL**: https://sites-spectral-instruments.jose-e5f.workers.dev
- **Deployment Date**: 2025-09-17
- **Version**: 3.0.0
- **Status**: ✅ Successfully deployed and tested
- **Authentication**: ✅ Working correctly with role-based access
- **CRUD Operations**: ✅ All tested and functional
- **API Security**: ✅ All endpoints require authentication

## [2.0.2] - 2025-09-17

### Fixed
- **🗄️ Database Schema Migration** - Fixed API endpoints to work with new unified database schema
  - Updated all API endpoints to use unified `instruments` table instead of separate `phenocams` and `mspectral_sensors` tables
  - Enhanced instruments API with phenocam-only filtering during migration period
  - Improved platforms API to properly join with instruments table using new schema
  - Fixed GeoJSON endpoints to use new database relationships
  - Added comprehensive error handling and validation for all CRUD operations
  - Temporarily disabled multispectral sensor functionality during database migration

### Changed
- **🔧 API Architecture** - Streamlined API endpoints for better consistency and reliability
  - All instrument queries now use unified schema with proper platform relationships
  - Enhanced error messages with detailed validation feedback
  - Added migration status indicators in API responses
  - Improved network statistics calculations using new schema

### Technical
- **🛠️ Schema Migration** - Transitioned from legacy table structure to normalized schema
- **🛡️ Error Handling** - Added comprehensive validation and error reporting
- **📊 Data Integrity** - Enhanced data validation and relationship checks
- **⚡ Performance** - Optimized queries for new database structure

## [2.0.1] - 2025-09-17

### Fixed
- **🐛 API Error Handling** - Improved error handling and debugging for dashboard data issues
  - Enhanced health check endpoint with database connectivity testing
  - Added table listing and error reporting for debugging
  - Improved network stats endpoint with graceful error handling for missing tables
  - Added fallback responses when database queries fail
  - Better error messages to help diagnose dashboard data retrieval issues

### Technical
- **🔧 Database Debugging** - Added comprehensive database connectivity testing
- **🛡️ Error Resilience** - API endpoints now handle missing tables gracefully
- **📊 Monitoring** - Enhanced health check with detailed database status information

## [2.0.0] - 2025-09-17

### Changed
- **🚀 Production Deployment** - Updated to take over sites.jobelab.com domain as production system
  - Updated deployment configuration to replace legacy application
  - Configured for sites.jobelab.com domain deployment
  - Bumped version from 0.7.0 to 2.0.0 to reflect production deployment status
  - Updated all version references across the application

### Infrastructure
- **🔧 Domain Configuration** - Updated Cloudflare Workers routes for sites.jobelab.com
- **📦 Version Management** - Synchronized version across package.json, wrangler.toml, and application metadata
- **🏗️ Production Ready** - Complete production deployment replacing deprecated legacy system

## [0.7.0] - 2025-09-17

### Added
- **🗃️ Complete Database Schema Rewrite** - Fresh normalized schema from scratch
  - **Normalized Naming**: Replaced "canonical_id" with "normalized_name" throughout system
  - **Camera Specifications**: Full camera metadata with brand dropdown (Mobotix default, RedDot, Canon, Nikon)
  - **Measurement Timeline**: Track first_measurement_year, last_measurement_year, and measurement_status
  - **User-Editable Geolocations**: Station users can modify platform and instrument coordinates (decimal degrees)
  - **Coordinate Inheritance**: Instruments inherit platform coordinates by default, but users can override
  - **Enhanced YAML Structure**: Complete stations.yaml restructure with camera specs and timeline data

### Enhanced
- **🔐 Advanced Permission System** - Field-level editing controls
  - **Station Users CAN Edit**: Camera specs, measurement timeline, coordinates, descriptions, ROI data
  - **Station Users CANNOT Edit**: Normalized names, legacy acronyms, system identifiers (admin only)
  - **Coordinate Editing**: Full decimal degree coordinate editing for both platforms and instruments
  - **Camera Management**: Complete camera specification editing including brand, model, resolution, serial number

### Technical
- **📊 Fresh Database Architecture** - Clean start with no legacy dependencies
  - **11 Migrations**: Complete schema from 0009_new_normalized_schema.sql onwards
  - **Coordinate Inheritance Triggers**: Automatic coordinate inheritance from platform to instruments
  - **Activity Logging**: Comprehensive audit trail for all coordinate and camera specification changes
  - **Performance Optimized**: Strategic indexing for normalized names, coordinates, and camera specifications
  - **Data Import Pipeline**: Automated import from enhanced stations.yaml structure

### Database Schema
- **stations**: Enhanced with status, coordinates, and description fields
- **platforms**: User-editable coordinates, mounting details, and status tracking
- **instruments**: Camera specifications, measurement timeline, coordinate overrides
- **instrument_rois**: Complete ROI management with user editing capabilities
- **user_field_permissions**: Granular field-level permission control system

### User Experience
- **🎯 Coordinate Management**: Easy decimal degree coordinate editing with validation
- **📷 Camera Specification Tracking**: Complete camera metadata management
- **📅 Timeline Tracking**: Measurement period tracking with status indicators
- **🔄 Inheritance Logic**: Smart coordinate inheritance with override capabilities
- **✅ Validation**: Coordinate range validation, camera resolution format validation, year range checks

### Security
- **🔒 Protected Identifiers**: Normalized names and system IDs restricted to admin users
- **📍 Geographic Validation**: Coordinate range validation (Sweden: lat 55-70, lng 10-25)
- **🎛️ Field-Level Permissions**: Granular control over what station users can modify
- **📝 Audit Trail**: Complete activity logging for all user modifications

## [0.6.1] - 2025-09-15

### Fixed
- **🔒 Public Page Security** - Removed CRUD buttons from public station pages
  - **Station Individual Pages**: Removed Add Platform/Instrument buttons from public view
  - **Item Actions**: Removed Edit/Delete action buttons from platform and instrument items on public pages
  - **Clean Public Interface**: Public station pages now show read-only information without management controls
  - **Security Enhancement**: Prevents unauthorized access attempts to management functions

### Technical
- **📝 Code Cleanup**: Removed unnecessary CRUD JavaScript functions from public station pages
- **🎨 UI Consistency**: Public pages now have clean, read-only interface without management controls
- **🔧 Version Bump**: Updated to v0.6.1 with proper cache busting for CSS/JS assets

### User Experience
- **👥 Clear Separation**: Management functions only available in authenticated station/admin dashboards
- **🔍 Read-Only Public View**: Public users can view station information without being tempted by non-functional buttons
- **🎯 Role-Based Access**: CRUD operations properly restricted to authenticated users only

## [0.6.0] - 2025-09-12

### Added
- **🛡️ Complete Admin CRUD System** - Full administrative interface for system management
  - **User Management**: Complete user table with dropdown status editing (Active/Inactive/Disabled)
  - **Station Management**: Full station CRUD with dropdown status control and view/edit/delete actions
  - **Platform Management**: Comprehensive platform management with status controls and location tracking
  - **Instrument Management**: Complete instrument overview with status dropdowns and management actions
  - **Activity Logs**: Real-time activity monitoring with refresh/export/clear functionality
  - **System Settings**: Dangerous operations in secure danger zone with confirmation dialogs

### Enhanced
- **🎮 Dropdown-Based Editing** - Reduce human input errors with structured choices
  - **Status Controls**: Click-to-change status dropdowns for users, stations, platforms, and instruments
  - **Confirmation Dialogs**: All status changes require confirmation to prevent accidental changes
  - **Visual Feedback**: Color-coded status indicators (green/yellow/red) for quick status identification
  - **Unified Interface**: Consistent CRUD operations across all management sections

### Technical
- **📊 Data Loading**: Test data integration for all management sections
- **🔒 Security**: Admin-only access with proper authentication verification
- **🎨 Professional UI**: Enterprise-grade admin interface with modern styling
- **📱 Responsive Design**: Admin interface works seamlessly across all device sizes
- **⚡ Performance**: Efficient data rendering with proper loading states

### User Experience
- **🎯 Error Prevention**: Dropdown selections eliminate typing errors and ensure data consistency
- **✅ Confirmation Flow**: All destructive actions require explicit confirmation
- **🔄 Status Management**: Easy enable/disable functionality for all system components
- **📈 Activity Tracking**: Comprehensive logs for audit and troubleshooting purposes

## [0.5.7] - 2025-09-12

### Added
- **🛠️ Station CRUD Interface** - Added complete management interface for station individual pages
  - **Platform Management**: Add/Edit/Delete buttons for platforms with proper section headers
  - **Instrument Management**: Add/Edit/Delete buttons for instruments with action buttons on each item
  - **Visual Enhancement**: Improved section headers with dedicated action areas
  - **User-Friendly Actions**: Edit and delete buttons integrated into each platform/instrument card
  - **Confirmation Dialogs**: Delete confirmations to prevent accidental data loss

### Enhanced
- **📋 Management UI**: Professional CRUD interface for station owners and managers
  - **Section Actions**: Clean action buttons in section headers for adding new items
  - **Item Actions**: Individual edit/delete buttons for each platform and instrument
  - **Consistent Styling**: Uniform button styling and layout across all management interfaces
  - **Responsive Design**: Action buttons adapt to different screen sizes

### Technical
- **🎯 Placeholder Framework**: CRUD functions ready for API integration
- **🔧 Error Prevention**: Confirmation dialogs and user-friendly messaging
- **📱 Mobile-First**: Responsive button layouts for all device sizes

## [0.5.6] - 2025-09-12

### Fixed
- **📚 Documentation Links Corrected** - Fixed all documentation page links to point to correct GitHub repository
  - **Station Management Guide**: Now correctly points to GitHub repository documentation
  - **Authentication Setup**: Fixed broken `/api/docs/` links that were returning 404 errors
  - **Platform Status**: Updated to proper GitHub raw documentation URLs  
  - **System Status Summary**: Corrected documentation endpoint links
  - **Resource Versions**: Updated CSS and JavaScript version references to v0.5.6

### Technical
- **🔗 GitHub Integration**: All documentation links now properly reference `github.com/SITES-spectral/sites-spectral-instruments/blob/main/docs/`
- **📄 Link Validation**: Verified all documentation files exist and are accessible
- **🌐 External Access**: Documentation now opens in new tabs with proper `target="_blank"` attributes

## [0.5.5] - 2025-09-12

### Enhanced
- **🗺️ Improved Station Map Display** - Station-specific interactive maps with all instruments and platforms
  - **Individual Station Focus**: Maps now show only the current station's platforms and instruments
  - **Smart Marker Integration**: Utilizes existing GeoJSON API and filters data for current station
  - **Visual Legend**: Added map legend showing different marker types (Station, Platform, Phenocam, Sensor)
  - **Color-Coded Markers**: Different colors and icons for each element type
  - **Auto-Fit Bounds**: Map automatically adjusts zoom to fit all station elements
  - **Fallback Support**: Graceful fallback to station marker only if data loading fails

### Technical
- **🔄 Code Reuse**: Leveraged existing `/api/geojson/all` endpoint instead of creating redundant API calls
- **🎯 Efficient Filtering**: Client-side filtering of GeoJSON data for station-specific display
- **📍 Responsive Markers**: Different sized markers based on element importance (station > platform > instruments)

## [0.5.4] - 2025-09-12

### Fixed
- **🏥 Critical Station Data Consistency** - Resolved major station login and data mapping issues
  - **Fixed Station Login Bug**: Logging into Lönnstorp now correctly shows Lönnstorp data instead of Svartberget
  - **Removed Invalid Stations**: Eliminated non-existent stations (bolmen, erken, stordalen) from credentials
  - **Disabled Tarfala**: Marked Tarfala as inactive since it's no longer part of SITES network
  - **Updated Station Names**: Aligned display names with authoritative YAML configuration sources
  - **Fixed Database Population**: Corrected file paths to use proper YAML sources as single source of truth

### Enhanced
- **🔐 Authentication Security** - Improved station access control
  - Added validation to prevent login to disabled/inactive stations
  - Enhanced station verification during authentication process
  - Implemented disabled station checks in both secrets and database authentication

### Database
- **📋 Migration 0008**: Added comprehensive station data cleanup
  - Added status column to stations table for active/inactive tracking
  - Cleaned up station names and acronyms to match YAML sources
  - Removed orphaned data from invalid stations
  - Established YAML files as authoritative source for all station data

## [0.5.3] - 2025-09-12

### Changed
- **🔗 Documentation Menu**: Hidden documentation menu link (was already commented out)
- **📦 Version Bump**: Updated version across all HTML files and manifests

## [0.5.2] - 2025-09-12

### Improved
- **📊 Enhanced Table Spacing** - Improved readability across all data tables
  - Increased cell padding from `1rem` to `1.25rem 1rem` for general data tables
  - Enhanced platform table spacing with `1.5rem 1.25rem` padding for long content
  - Added `vertical-align: top` for better multi-line content alignment
  - Implemented responsive table spacing that scales down on smaller screens
  - Applied consistent spacing across admin, station dashboard, and platform tables
  - Improved visual hierarchy with proper column width constraints and min-widths

## [0.5.1] - 2025-09-12

### Added
- **🏗️ Complete Platform Management System** - Full CRUD functionality for platforms
  - Implemented comprehensive platforms API with all HTTP methods (GET, POST, PUT, PATCH, DELETE)
  - Added platform-specific database operations using actual platforms table
  - Created complete platform management UI with table view and modal forms
  - Integrated platform type badges (tower, mast, building, ground) with color coding
  - Added instrument count display showing attached phenocams and sensors
  
- **🎨 Enhanced Platform UI Components** - Professional platform management interface
  - Created detailed platform edit modal with comprehensive form fields
  - Implemented platform delete confirmation with dependency checking
  - Added platform type selection with validation
  - Created coordinate input handling for geographic positioning
  - Added description and metadata fields for comprehensive platform documentation

### Enhanced
- **🔗 Improved Data Integration** - Platform-instrument relationships
  - Platforms now display total instrument count with real-time updates
  - Enhanced station dashboard to load and display platform data
  - Integrated platform management with existing authentication system
  - Added platform-specific permission checks and validation

### Fixed
- **🐛 Platform API Implementation** - Replaced virtual platform abstraction
  - Fixed platforms endpoint to use actual platforms database table instead of virtual data
  - Corrected platform CRUD operations to work with proper database schema
  - Enhanced platform queries to include station information and instrument counts
  - Resolved platform management functionality that was previously non-functional

## [0.5.0] - 2025-09-12

### Added
- **🔧 Complete CRUD Management System** - Full create, read, update, delete functionality for all instruments
  - Implemented comprehensive phenocam management (POST, PUT, PATCH, DELETE endpoints)
  - Implemented comprehensive multispectral sensor management (POST, PUT, PATCH, DELETE endpoints)  
  - Added full authentication and authorization checks with role-based access control
  - Created station-aware permissions ensuring users can only modify their assigned station's instruments

- **🎨 Enhanced Station Dashboard UI** - Professional management interface with modal forms
  - Added sophisticated edit instrument modals with pre-populated forms
  - Implemented delete confirmation dialogs with detailed instrument information
  - Created comprehensive form validation and error handling
  - Added visual feedback with success/error toasts and loading states

- **🔒 Advanced Security Features** - Enterprise-grade permission system
  - Station users can only manage instruments within their assigned station
  - Admin users have full system access with proper audit trails
  - Prevents duplicate canonical IDs across the entire system
  - Validates station existence and user permissions before any operations

- **✨ User Experience Improvements** - Polished interface and workflows
  - Real-time data updates after create/edit/delete operations
  - Smart form handling that removes empty fields to prevent data corruption
  - Professional modal dialogs with proper styling and animations
  - Consistent UI patterns across all management functions

### Enhanced
- **🗺️ Platform Management Architecture** - Refined virtual platform handling
  - Platforms are now properly abstracted from phenocams and multispectral sensors
  - Enhanced GeoJSON endpoint integration for map visualization
  - Improved coordinate validation and geographic data handling

- **⚡ API Performance & Reliability** - Optimized endpoint architecture
  - Consolidated API routing with proper HTTP method support
  - Enhanced error handling with detailed error messages
  - Improved database query efficiency for large datasets
  - Added proper content-type headers and status codes

## [0.4.5] - 2025-09-12

### Improved
- **🗺️ Map Legend Visual Consistency** - Updated legend to match Google Maps style markers
  - Replaced circular legend markers with Google Maps style pin markers
  - Applied consistent color coding: Red pins for stations, Blue pins for platforms  
  - Enhanced visual hierarchy with proper shadows and 3D pin effects
  - Maintained backward compatibility with existing legend styles
  - Achieved perfect visual consistency between interactive map markers and legend display

## [0.4.4] - 2025-09-12

### Fixed
- **🔐 Login Session Management** - Fixed session persistence issues
  - Updated authentication verification to support both secrets-based and database authentication
  - Fixed navigation.js to use correct `/api/auth/verify` endpoint instead of non-existent `/api/auth/profile`
  - Enhanced handleVerify function to properly handle dual authentication systems
  - Resolved immediate logout issues after successful login for all users including admin

### Added
- **📚 Documentation System** - Enhanced local documentation access
  - Created new API endpoint `/api/docs/[doc].js` for serving local documentation files
  - Updated documentation page links to point to local docs instead of external GitHub links
  - Added security controls to prevent unauthorized documentation file access
  - Improved documentation page styling with better icons and navigation

- **🗺️ Google Maps Style Markers** - Enhanced interactive map visualization
  - Redesigned map markers with Google Maps style pin design
  - Added distinct color coding: Red for stations, Blue for platforms, Green for instruments
  - Implemented proper shadows and 3D pin effects for better visual hierarchy
  - Updated CSS with scalable marker system supporting different sizes by type

### Improved
- **⚡ Dynamic Data Loading** - Verified and enhanced dashboard performance
  - Confirmed all dashboard components load data dynamically from database
  - Validated API integration for real-time station and instrument data
  - Enhanced error handling and loading states for better user experience

## [0.4.2] - 2025-09-11

### Fixed
- **🗺️ Interactive Map Double Initialization** - Resolved map loading conflicts
  - Fixed "Map container is already initialized" error on main dashboard
  - Enhanced container cleanup with proper Leaflet instance removal
  - Added global reference tracking to prevent duplicate map instances
  - Implemented asynchronous initialization with DOM readiness checks
  - Improved error handling and graceful degradation for map loading failures
  - Restructured initialization flow to separate map creation from data loading

## [0.4.1] - 2025-09-11

### Fixed
- **🔧 Version Consistency** - Fixed version display inconsistencies across all pages
  - Updated all HTML pages to show correct v0.4.0 in status bar and meta tags
  - Fixed version manifest file with correct cache-busting parameters
  - Updated default version fallback in version.js from 0.2.0 to 0.4.0
  - Synchronized all CSS and JavaScript resource versions (v=0.4.0)
  - Ensured consistent version display across login, admin, station, and documentation pages

## [0.4.0] - 2025-09-11

### Added
- **🌍 GeoJSON API Endpoints** - Standardized geospatial data access
  - New `/api/geojson/all` endpoint providing both stations and platforms in GeoJSON format
  - Individual endpoints `/api/geojson/stations` and `/api/geojson/platforms` for specific data
  - Proper GeoJSON FeatureCollection format with rich metadata properties
  - Optional `?include_instruments=true` parameter for detailed station instrument data
  - Optimized coordinate format `[longitude, latitude]` following GeoJSON standard

- **⚡ Enhanced Interactive Map Performance** - Improved data loading and display
  - Updated map to use single GeoJSON API call instead of multiple REST endpoints
  - Added proper icon support for phenocam and mspectral_sensor platform types
  - Enhanced platform popups with status badges and complete station information
  - Improved marker clustering and performance with large datasets

- **🚀 GitHub Integration & Auto-Deployment** - Streamlined development workflow
  - GitHub Actions workflow for automatic Cloudflare Workers deployment
  - Complete setup documentation in `CLOUDFLARE_SETUP.md` with step-by-step instructions
  - Updated `wrangler.toml` configuration for GitHub integration support
  - Automatic deployment on push to main branch with build validation

### Removed
- **📚 Documentation Navigation Links** - Hidden broken GitHub documentation references
  - Commented out documentation links in main navigation (index.html, station.html)
  - Removed access to `/docs/` section with broken GitHub links
  - Clean navigation menu focusing on functional features only

### Technical
- **🗺️ Geospatial Data Architecture** - Modern GeoJSON-based mapping system
  - Unified data loading through standardized GeoJSON endpoints
  - Proper handling of both station and platform coordinates
  - Rich metadata embedding in GeoJSON properties for enhanced map interactions
- **🔧 CI/CD Pipeline** - Automated deployment and version management
  - GitHub Actions integration with Cloudflare Workers deployment
  - Automated testing and build validation on pull requests
  - Version synchronization across package.json, wrangler.toml, and HTML meta tags

## [0.3.0] - 2025-09-11

### Added
- **🏛️ Individual Station Detail Pages** - Comprehensive station information views
  - Clickable station cards on dashboard now navigate to individual station pages
  - Real-time loading of station-specific platforms and instruments
  - Interactive station maps with coordinates and metadata
  - Professional layout with breadcrumb navigation and responsive design

- **🗺️ Interactive Map System** - Fixed and enhanced map functionality
  - Resolved "Failed to load map data" error on dashboard interactive map
  - Added proper map initialization in dashboard with error handling
  - Map displays all 18 official SITES Spectral platforms with coordinates
  - Integrated satellite, topographic, and OpenStreetMap tile layers

- **📱 Navigation Template System** - Unified navigation with authentication support
  - Created reusable NavigationManager for consistent navigation across all pages
  - Authentication-aware navigation with user role display
  - Mobile-responsive navigation with hamburger menu support
  - Automatic login/logout state management with token validation

- **🔌 Enhanced API Endpoints** - Improved data access and filtering
  - Added `station_id` query parameter filtering for platforms API
  - Created unified instruments API combining phenocams and multispectral sensors
  - Enhanced stations API with detailed individual station information
  - Proper error handling and response formatting for all endpoints

### Removed
- **🗑️ Broken Station Pages** - Cleaned up non-functional components
  - Removed broken `/stations.html` page that showed infinite loading
  - Eliminated non-working Quick Actions section from dashboard
  - Streamlined navigation to only show functional, working links

### Technical
- **🏗️ Harmonized Data Architecture** - Unified instrument handling
  - Combined phenocams and mspectral_sensors tables in instruments API
  - Proper handling of different instrument types on same platforms
  - Support for different mounting heights and viewing directions
- **🔧 Enhanced Error Handling** - Better user experience and debugging
  - Added comprehensive error states for map loading failures
  - Improved API error messages and logging for development
  - Graceful fallbacks for missing data and network issues

## [0.1.1] - 2025-09-11

### Fixed
- **🔧 Interactive Map Data Loading** - Resolved platforms API intermittent errors
  - Fixed `TypeError: Cannot read properties of undefined (reading '1')` in platforms handler
  - Ensured stable API responses for stations and platforms endpoints
  - Interactive map now loads properly without "Failed to load map data" error
  - Verified all API endpoints return correct JSON responses

### Technical
- Enhanced API error handling and logging for better debugging
- Improved platforms API stability and response consistency

## [0.2.0] - 2025-09-11

### Added
- **🔐 Complete Authentication System** - JWT-based authentication with secure token management
  - Three-tier access control: Public, Station, and Admin roles
  - Session management with automatic token refresh
  - Role-based data access and permission enforcement
  - Secure password hashing and validation

- **🗺️ Interactive Mapping System** - Professional Leaflet.js integration
  - High-resolution satellite imagery (Esri ArcGIS)
  - Multi-layer support: Satellite, topographic, and street maps
  - Custom markers for stations and platforms with color coding
  - Rich popups with detailed information and direct management links
  - Auto-fitting bounds and responsive design

- **🏗️ Hierarchical Platform Management** - Complete platform infrastructure
  - Platforms table with tower/mast/building/ground types
  - Full CRUD API operations for platform management
  - Height specifications and structural details
  - Geographic positioning with precise coordinates

- **📊 Thematic Program Tracking** - Priority-based organization system
  - SITES Spectral, ICOS, and Other program classification
  - Automatic priority assignment (1=SITES_Spectral, 2=ICOS, 3=Other)
  - Color-coded badges for visual identification
  - Database triggers for automatic priority updates
  - Comprehensive filtering and search capabilities

- **🎨 Professional SITES Spectral Branding** - Official visual identity
  - Official SITES Spectral logos and favicon integration
  - Consistent brand presentation across all interfaces
  - Professional color scheme matching SITES guidelines
  - Responsive logo sizing and placement

- **⚡ Dynamic Data Management** - Real-time editing capabilities
  - Inline editing for all instrument and platform fields
  - Dropdown selectors for status and program fields
  - Real-time validation and error handling
  - Optimistic UI updates with server synchronization

- **🔄 Version Management & Cache Busting** - Robust deployment system
  - Automated version bumping and tracking
  - Query parameter cache invalidation for all assets
  - Version manifest generation for deployment verification
  - Build scripts with version synchronization

### Enhanced
- **🏠 Station Dashboard** - Comprehensive management interface
  - Tabbed interface for phenocams and multispectral sensors
  - Program filtering with real-time updates
  - Bulk selection and operations framework
  - Enhanced search and filtering capabilities

- **🔒 Security & Authentication** - Production-ready security
  - JWT token validation and refresh mechanisms
  - Protected API endpoints with role-based access
  - SQL injection prevention with prepared statements
  - XSS protection and input sanitization

- **📱 User Experience** - Professional interface improvements
  - Loading states and error handling throughout
  - Toast notifications for user feedback
  - Responsive design optimized for all devices
  - Professional footer with version information

### Database Schema Updates
- **Migration 0005**: Platform hierarchy and user authentication
- **Migration 0006**: Development test users with proper roles
- **Migration 0007**: Thematic program tracking with automatic triggers
- **Enhanced Relationships**: Foreign key constraints and data integrity
- **Performance Optimization**: Strategic indexing for filtering and sorting

### API Enhancements
- **Authentication Endpoints**: `/api/auth/*` for login, logout, verification
- **Platform Management**: Full CRUD operations for platform data
- **Enhanced Filtering**: Support for program-based filtering across all endpoints
- **PATCH Operations**: Update support for phenocams and sensors
- **Error Handling**: Comprehensive error responses with proper HTTP codes

### Technical Infrastructure
- **Build System**: Automated version management with cache busting
- **Git Repository**: Professional version control with comprehensive .gitignore
- **NPM Scripts**: Complete development and deployment workflow
- **Documentation**: Updated API documentation and deployment guides

### User Interface Features
- **Interactive Map**: Clickable station and platform markers
- **Layer Controls**: Radio button switching between map layers  
- **Legend System**: Visual guide for marker types and meanings
- **Program Badges**: Color-coded visual indicators for thematic programs
- **Inline Editing**: Double-click to edit functionality across all tables
- **Bulk Operations**: Multi-select framework for future enhancements

### Performance & Optimization
- **Asset Versioning**: Automatic cache invalidation on deployments
- **Optimized Queries**: Strategic database indexing for fast filtering
- **Concurrent Loading**: Parallel API requests for improved performance
- **Responsive Images**: Optimized logo and asset loading

## [0.1.0-dev] - 2025-09-10

### Added
- **Initial Development Release** - First functional version of the SITES Spectral Stations & Instruments Management System
- **Database Schema** - Complete database design with stations, phenocams, and multispectral sensors tables
- **Web Dashboard** - Professional responsive web interface built with vanilla JavaScript
- **REST API** - Comprehensive RESTful API for all CRUD operations
- **Real Data Integration** - Populated with actual SITES research station data

#### Database & Data Management
- **Stations Table** - 9 Swedish research stations (Abisko, Grimsö, Lönnstorp, Röbäcksdalen, Skogaryd, Svartberget, Asa, Hyltemossa, Tarfala)
- **Phenocams Table** - 21 phenocam instruments with ROI polygon data and geolocation
- **Multispectral Sensors Table** - 62 detailed multispectral sensors with technical specifications
- **Data Population Scripts** - Automated scripts to populate database from YAML and CSV sources
- **Migration System** - Cloudflare D1 migrations for schema versioning

#### Web Interface
- **Responsive Dashboard** - Modern, mobile-friendly interface showing real-time statistics
- **Station Management** - View stations with instrument counts, locations, and status indicators
- **Professional UI/UX** - Clean design with loading states, error handling, and user feedback
- **Real-time Data** - Live data from Cloudflare D1 database, no placeholder content
- **Search & Filtering** - Station search functionality with real-time filtering

#### API Endpoints
- **Stations API** (`/api/stations`) - Complete CRUD operations with instrument counts
- **Phenocams API** (`/api/phenocams`) - Phenocam data with ROI information
- **Multispectral API** (`/api/mspectral`) - Detailed sensor specifications and metadata
- **Statistics API** (`/api/stats/*`) - Network, station, and instrument statistics
- **Reference Data API** (`/api/reference/*`) - Ecosystems and instrument types
- **Activity Feed API** (`/api/activity`) - Recent changes and system activity
- **Health Check API** (`/api/health`) - System status monitoring

#### Infrastructure
- **Cloudflare Workers** - Serverless backend with high performance and global edge deployment
- **Cloudflare D1** - SQLite database with automatic backups and scaling
- **Static Assets** - Efficient static file serving with CDN caching
- **CORS Support** - Proper cross-origin resource sharing configuration
- **Error Handling** - Comprehensive error handling and logging

#### Data Sources & Integration
- **YAML Data Sources** - Integration with stations.yaml and stations_mspectral.yaml configuration files
- **CSV Metadata** - Rich sensor metadata from CSV files including wavelengths, brands, models
- **Geolocation Data** - Precise coordinates for instruments and stations
- **Technical Specifications** - Detailed sensor specifications (wavelengths, bandwidths, field of view, etc.)

#### Features
- **83 Total Instruments** - 21 phenocams + 62 multispectral sensors across 6 active stations
- **Real Instrument Counts** - Accurate per-station breakdowns (Svartberget: 54, Skogaryd: 15, etc.)
- **Status Management** - Active/inactive instrument tracking (82/83 instruments currently active)
- **Multi-ecosystem Support** - Forest (FOR), Agricultural (AGR), Mirror (MIR), Lake (LAK), Wetland (WET), Heath (HEA), Sub-forest (SFO), Cem ecosystem types
- **Legacy Name Support** - Maintains backward compatibility with existing instrument naming conventions

### Technical Details
- **Architecture**: Serverless Cloudflare Workers with D1 SQLite database
- **Frontend**: Vanilla JavaScript, CSS Grid, modern responsive design
- **Database**: 4 migrations, foreign key relationships, proper indexing
- **Security**: Input sanitization, SQL injection prevention, CORS configuration
- **Performance**: Edge caching, optimized queries, concurrent API calls
- **Deployment**: Automated deployment with Wrangler, custom domain (sites.jobelab.com)

### Documentation
- **README.md** - Comprehensive project documentation
- **API Documentation** - Detailed API endpoint specifications
- **Migration Scripts** - Database schema and data population documentation
- **Deployment Guide** - Step-by-step deployment instructions

### Infrastructure Setup
- **Domain**: sites.jobelab.com with SSL certificate
- **Database**: spectral_stations_db on Cloudflare D1
- **Environment**: Production deployment with development workflow support

## Previous Versions
This is the initial tracked release. Previous development was exploratory and not versioned.

---

## Version Schema
- **Major** (X.y.z): Breaking changes, major feature releases
- **Minor** (x.Y.z): New features, backwards compatible
- **Patch** (x.y.Z): Bug fixes, small improvements
- **Pre-release** (x.y.z-dev): Development versions, may be unstable

## Links
- [Live Application](https://sites.jobelab.com)
- [API Documentation](https://sites.jobelab.com/api/health)
- [SITES Network](https://www.fieldsites.se/)