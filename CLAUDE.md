# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Version 4.9.5 - EMERGENCY DATABASE CONNECTIVITY RESTORATION (2025-09-27)
**✅ STATUS: SUCCESSFULLY DEPLOYED AND OPERATIONAL**
**🌐 Production URL:** https://sites.jobelab.com
**🔗 Worker URL:** https://sites-spectral-instruments.jose-e5f.workers.dev
**📅 Deployment Date:** 2025-09-27 ✅ DEPLOYED v4.9.5 🚨
**🎯 Major Achievement:** Complete restoration of database connectivity through missing JavaScript module recovery

### 🚨 CRITICAL ISSUE RESOLVED: Missing JavaScript Modules in v4.9.5
- **Root Cause**: Version manifest referenced 8 JavaScript modules but only 1 existed, causing silent failures
- **Missing Modules Restored**: Created 7 missing modules from embedded code in monolithic HTML files
- **Modular Architecture**: Extracted 5,081 lines of embedded JavaScript into organized, reusable modules
- **Database Connectivity**: Restored all interactive functionality through proper module architecture

### 📦 JavaScript Modules Created in v4.9.5
- **`/js/api.js`**: Centralized API communication with authentication and error handling (8.6KB)
- **`/js/components.js`**: Reusable UI components, modals, notifications, and form handlers (12.6KB)
- **`/js/interactive-map.js`**: Leaflet mapping with Swedish coordinate system support (13.8KB)
- **`/js/dashboard.js`**: Admin dashboard functionality for station management (16.6KB)
- **`/js/station-dashboard.js`**: Station-specific management and platform operations (16.7KB)
- **`/js/navigation.js`**: Client-side routing and navigation management (9.4KB)
- **`/js/export.js`**: Data export functionality for stations, platforms, and instruments (14.3KB)

### 🔧 Technical Recovery Process in v4.9.5
- **Emergency Diagnosis**: Coordinated team analysis identified missing frontend modules vs database issues
- **Module Extraction**: Systematically extracted embedded JavaScript from station.html (5,081 lines → 7 modules)
- **Security-First Design**: Implemented centralized authentication and role-based access control
- **Swedish Compliance**: Added proper SWEREF 99 coordinate system support for mapping
- **Version Consistency**: Fixed dashboard.html version mismatch (4.9.3 → 4.9.5)

### 🛡️ Enhanced Architecture & Security in v4.9.5
- **Modular Design**: Clean separation of concerns with focused, maintainable modules
- **Role-Based Security**: Dashboard restricted to admin users only, station users isolated to their stations
- **Authentication Flow**: Centralized JWT token management with proper error handling
- **Interactive Maps**: Swedish research station mapping with platform and instrument markers
- **Export Capabilities**: Multi-format data export (CSV, JSON, Excel) with comprehensive filtering

### 🎯 Functionality Restored in v4.9.5
- **✅ Database Connectivity**: All API calls and data loading fully operational
- **✅ Interactive Mapping**: Leaflet maps with Swedish coordinate support functional
- **✅ Station Management**: Complete CRUD operations for stations, platforms, and instruments
- **✅ Admin Dashboard**: Station grid loading and management interface working
- **✅ Authentication**: JWT-based role authentication with proper redirects
- **✅ Data Export**: Multi-format export functionality for all entity types

## Previous Version: 4.9.1 - Complete Admin Dashboard with Station Management Interface (2025-09-26)
**✅ STATUS: SUCCESSFULLY DEPLOYED AND OPERATIONAL**
**🌐 Production URL:** https://sites.jobelab.com
**🔗 Worker URL:** https://sites-spectral-instruments.jose-e5f.workers.dev
**📅 Deployment Date:** 2025-09-26 ✅ DEPLOYED v4.9.1 📚
**🎯 Major Achievement:** Complete admin dashboard implementation with stations grid interface and comprehensive station management capabilities

### 🏠 Admin Dashboard Implementation in v4.9.1
- **Stations Grid Interface**: Professional dashboard with grid layout showing all research stations as cards
- **Admin Entry Point**: Created missing `/dashboard.html` that admin users are redirected to after login
- **Fixed Login Flow**: Resolved 404 errors from redirecting to non-existent `/stations.html`
- **Station Selection**: Clean interface for admins to select which station to manage
- **Integrated CRUD Operations**: Full station management functionality directly in dashboard
- **Professional Design**: Consistent SITES Spectral branding with responsive grid layout

### 🔧 Dashboard Features in v4.9.1
- **Station Cards**: Each station displayed as professional card with key information
- **Quick Actions**: Direct access to station management from dashboard cards
- **Create New Station**: Prominent button in dashboard for adding new research stations
- **Visual Status**: Station cards show status indicators and key metadata
- **Responsive Layout**: Grid adapts to different screen sizes and device types
- **Role-Based Display**: Dashboard only accessible to admin users with proper authentication

### 🚀 Technical Implementation in v4.9.1
- **Updated Login Redirects**: Changed from `/stations.html` to `/dashboard.html` in login system
- **Dashboard HTML**: Complete new page with stations grid and admin modal integration
- **Modal System**: Integrated all station management modals from station.html into dashboard
- **API Integration**: Dashboard connects to existing station management APIs
- **Authentication Flow**: Proper JWT token verification and admin role checking
- **Error Handling**: Comprehensive error states and loading indicators

## Previous Version: 4.9.0 - Complete Admin-Only CRUD Operations for Stations and Platforms (2025-09-26)
**📅 Previous Version**
**🎯 Major Achievement:** Complete admin-only station and platform management system with advanced validation, conflict resolution, and comprehensive backup capabilities

### 🔐 Admin-Only Station Management System in v4.9.0
- **Station Creation Modal**: Professional form with auto-generated normalized names, real-time validation, and conflict detection
- **Station Deletion System**: Safe deletion with dependency analysis, cascade warnings, and optional comprehensive JSON backup
- **Enhanced Validation Engine**: Duplicate detection for normalized names and acronyms with intelligent alternative suggestions
- **Smart Naming Algorithm**: Automatic normalized name generation from display names with Swedish character handling
- **Conflict Resolution**: Real-time duplicate checking with smart alternative name suggestions

### 🏗️ Admin-Only Platform Management System in v4.9.0
- **Platform Creation Forms**: Advanced modal forms with ecosystem code integration and location code validation
- **Platform Deletion Workflow**: Dependency analysis with cascade deletion warnings and backup preservation
- **Intelligent Naming Convention**: Auto-generated normalized names following `{STATION}_{ECOSYSTEM}_{LOCATION}` format
- **Location Code Management**: Smart validation and conflict resolution for platform location codes
- **Ecosystem Integration**: Full integration with 12 official ecosystem codes for proper classification

### 🛡️ Advanced Security and Permission Architecture in v4.9.0
- **Role-Based Access Control**: All functionality strictly limited to users with `role === 'admin'`
- **Server-Side Security**: Admin privilege validation on all POST, PUT, and DELETE endpoints
- **UI Security Layer**: Admin controls completely invisible to station and read-only users
- **Permission Validation**: Double-layer security with client-side and server-side permission checking
- **API Protection**: Enhanced endpoints with comprehensive admin privilege verification

### ✨ Professional Features and User Experience in v4.9.0
- **Real-time Validation**: Live normalized name generation and duplicate conflict checking during form input
- **Comprehensive Backup System**: Complete JSON backups including all dependent data (platforms → instruments → ROIs)
- **Professional Modal Design**: Consistent UI with loading states, error handling, and success notifications
- **Intelligent Conflict Resolution**: Smart suggestions for alternative normalized names and location codes
- **Dependency Analysis**: Complete cascade analysis showing what will be deleted before confirmation

### 🎯 Enhanced User Interface Elements in v4.9.0
- **Admin Dashboard Controls**: Prominent admin buttons in station header (Create Station/Delete Station)
- **Platform Management Interface**: "Create Platform" button in platforms section header for easy access
- **Platform Delete Buttons**: Individual delete buttons on each platform card (visible only to admin users)
- **Warning and Confirmation Systems**: Clear dependency analysis and cascade deletion warnings with backup options
- **Status Indicators**: Loading spinners, success notifications, and comprehensive error messaging

### 📋 API Endpoints Added in v4.9.0
- **`POST /api/stations`**: Create new station with validation and conflict resolution (admin only)
- **`PUT /api/stations/{id}`**: Enhanced station editing including normalized name modifications (admin only)
- **`DELETE /api/stations/{id}`**: Station deletion with cascade analysis and backup generation (admin only)
- **`POST /api/platforms`**: Create new platform with smart naming and validation (admin only)
- **`DELETE /api/platforms/{id}`**: Platform deletion with dependency checking and backup (admin only)

### 🔧 Advanced Technical Implementation in v4.9.0
- **Helper Functions**: `generateAlternativeNormalizedName()` and `generateNextLocationCode()` for conflict resolution
- **Backup Architecture**: Comprehensive data preservation with metadata tracking and download functionality
- **Form Validation**: Multi-layer validation with client-side checks and server-side enforcement
- **Error Handling**: Robust error management with user-friendly messages and recovery suggestions
- **Database Integration**: Proper cascade handling and foreign key constraint management

## Current System Architecture

### Authentication System
- **Role-Based Access**: Three user roles (admin, station, readonly) with granular permissions
- **JWT Authentication**: Secure token-based authentication with session management
- **Permission Matrix**: Field-level permissions controlled via `user_field_permissions` table

### Database Schema
- **Core Tables**: `stations`, `platforms`, `instruments`, `instrument_rois`
- **User Management**: `users`, `user_sessions`, `activity_log`
- **Normalized Design**: Proper relationships with foreign key constraints
- **Migration System**: Structured database evolution with numbered migrations

### Key Features
- **Complete CRUD Operations**: Full create/read/update/delete for all entities
- **Interactive Mapping**: Leaflet-based maps with permission-filtered data
- **Professional UI**: Responsive design with comprehensive modal systems
- **ROI Management**: Complete Region of Interest functionality with visual editing
- **Export Capabilities**: Multi-format data export with filtering options

### Development Commands

#### Build and Development
```bash
npm run dev                 # Start local development server
npm run build              # Build application with version bump
npm run build:bump         # Build with automatic version increment
```

#### Database Operations
```bash
npm run db:migrate         # Apply migrations to remote database
npm run db:migrate:local   # Apply migrations to local database
npm run db:studio          # Open database studio interface
```

#### Deployment
```bash
npm run deploy             # Build and deploy to production
npm run deploy:bump        # Build with version bump and deploy
```

#### Database Management
```bash
# Execute migrations
npx wrangler d1 migrations apply spectral_stations_db --remote

# Query database
npx wrangler d1 execute spectral_stations_db --remote --command="SELECT * FROM stations;"
```

### File Structure

#### Frontend Architecture
```
public/
├── index.html              # Login redirect page
├── login.html              # Main login portal
├── station.html            # Station details and management
└── css/, js/, images/      # Static assets

src/
├── worker.js               # Main Cloudflare Worker
├── auth.js                 # JWT authentication system
└── api-handler.js          # API routing with auth middleware

migrations/
├── *.sql                   # Database schema and data migrations
```

### Security Best Practices
- **No Public Access**: All functionality requires user authentication
- **Input Sanitization**: All user input validated and sanitized
- **Permission Enforcement**: Server-side validation of all permissions
- **Activity Logging**: Complete audit trail for compliance
- **Session Security**: Secure JWT token management

### Ecosystem Codes
All 12 official ecosystem codes are supported:
- **HEA** - Heathland
- **AGR** - Arable Land
- **MIR** - Mires
- **LAK** - Lake
- **WET** - Wetland
- **GRA** - Grassland
- **FOR** - Forest
- **ALP** - Alpine Forest
- **CON** - Coniferous Forest
- **DEC** - Deciduous Forest
- **MAR** - Marshland
- **PEA** - Peatland

### Important Notes for Development

1. **Security First**: All operations must check authentication and permissions
2. **User Experience**: Provide clear instructions and feedback at every step
3. **Data Integrity**: Validate all inputs and maintain referential integrity
4. **Performance**: Use efficient queries and minimize API calls
5. **Documentation**: Keep this file updated as features evolve

### Deployment Information
- **Production URL**: https://sites.jobelab.com
- **Current Version**: 4.9.1
- **Last Deployed**: 2025-09-26
- **Status**: Fully operational with admin dashboard and complete CRUD functionality
- **Environment**: Cloudflare Workers with D1 database

### Admin CRUD Operations Usage
- **Admin Login**: Use admin credentials to access all functionality
- **Station Management**: Create/delete stations via admin controls in station header
- **Platform Management**: Create platforms via section header button, delete via platform card buttons
- **Data Safety**: All deletions include dependency analysis and optional backup generation
- **Validation**: Real-time conflict checking with intelligent name suggestions