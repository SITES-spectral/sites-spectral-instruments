# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Version 4.9.0 - Complete Admin-Only CRUD Operations for Stations and Platforms (2025-09-26)
**✅ STATUS: SUCCESSFULLY DEPLOYED AND OPERATIONAL**
**🌐 Production URL:** https://sites.jobelab.com
**🔗 Worker URL:** https://sites-spectral-instruments.jose-e5f.workers.dev
**📅 Deployment Date:** 2025-09-26 ✅ DEPLOYED v4.9.0 🚀
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
- **Current Version**: 4.9.0
- **Last Deployed**: 2025-09-26
- **Status**: Fully operational with admin CRUD functionality
- **Environment**: Cloudflare Workers with D1 database

### Admin CRUD Operations Usage
- **Admin Login**: Use admin credentials to access all functionality
- **Station Management**: Create/delete stations via admin controls in station header
- **Platform Management**: Create platforms via section header button, delete via platform card buttons
- **Data Safety**: All deletions include dependency analysis and optional backup generation
- **Validation**: Real-time conflict checking with intelligent name suggestions