# Changelog

All notable changes to the SITES Spectral Stations & Instruments Management System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0] - 2025-09-17

### Changed
- **🚀 Production Deployment** - Migrated from deprecated v1 system to take over sites.jobelund.com domain
  - Updated deployment configuration to replace legacy application
  - Migrated from sites.jobelab.com to sites.jobelund.com domain
  - Bumped version from 0.7.0 to 2.0.0 to reflect production deployment status
  - Updated all version references across the application

### Infrastructure
- **🔧 Domain Migration** - Updated Cloudflare Workers routes to sites.jobelund.com
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
- [Live Application](https://sites.jobelund.com)
- [API Documentation](https://sites.jobelund.com/api/health)
- [SITES Network](https://www.fieldsites.se/)