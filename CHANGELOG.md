# Changelog

All notable changes to the SITES Spectral Stations & Instruments Management System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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