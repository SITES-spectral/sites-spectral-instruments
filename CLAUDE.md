# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Version 3.1.1 - Fixed Authentication Redirects (2025-09-17)
**✅ STATUS: SUCCESSFULLY DEPLOYED AND OPERATIONAL**
**🌐 Production URL:** https://sites.jobelab.com
**🔗 Worker URL:** https://sites-spectral-instruments.jose-e5f.workers.dev
**📅 Deployment Date:** 2025-09-17
**🔧 All Tests Passed:** Authentication, CRUD Operations, API Security

### 🚨 BREAKING CHANGES - IMPORTANT ARCHITECTURE CHANGES

This version represents a **complete overhaul** from public-access to authentication-first architecture:

- **NO PUBLIC ACCESS**: All functionality now requires user login
- **ROLE-BASED SYSTEM**: Three user roles with different permission levels
- **SECURED DATA**: All research station data protected behind authentication
- **NEW LOGIN FLOW**: Main index page redirects to login - no public views

### 🏗️ Core Architecture Overview

#### Authentication-First Design
- **Login Portal**: Main entry point at `/login.html` with role-based access
- **Protected Routes**: All pages require authentication verification
- **JWT Security**: Industry-standard token-based authentication with session management
- **Permission Matrix**: Granular field-level permissions based on user roles

#### User Role System
1. **Administrator (`admin`)**:
   - Full system access across all stations
   - User management and system configuration
   - Create/edit/delete all stations, platforms, instruments
   - Access to audit logs and system settings

2. **Station User (`station`)**:
   - Access only to their assigned station
   - Can edit instruments and platforms at their station
   - Update camera specifications and measurement data
   - Modify coordinates and technical specifications

3. **Read-Only (`readonly`)**:
   - View-only access to station information
   - Browse instrument specifications and maps
   - Export available data
   - No editing capabilities

#### Database Architecture
- **Normalized Schema**: Clean separation of stations, platforms, instruments
- **User Permissions**: Field-level editing controls via `user_field_permissions` table
- **Activity Logging**: Complete audit trail in `activity_log` table
- **Data Integrity**: Foreign key relationships with cascading operations

### 🛠️ Development Commands

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

# With specific Cloudflare account
CLOUDFLARE_ACCOUNT_ID=e5f93ed83288202d33cf9c7b18068f64 npm run deploy
```

#### Database Management
```bash
# Execute migrations
CLOUDFLARE_ACCOUNT_ID=e5f93ed83288202d33cf9c7b18068f64 npx wrangler d1 migrations apply spectral_stations_db --remote

# Query database
CLOUDFLARE_ACCOUNT_ID=e5f93ed83288202d33cf9c7b18068f64 npx wrangler d1 execute spectral_stations_db --remote --command="SELECT * FROM stations;"
```

### 📁 Key File Structure

#### Frontend Architecture
```
public/
├── index.html              # Login redirect page (NO public access)
├── login.html              # Main login portal
├── stations.html           # Authenticated dashboard (rebuilt from scratch)
├── station.html            # Individual station details
└── admin/                  # Admin-only interfaces
    └── dashboard.html

src/
├── worker.js               # Main Cloudflare Worker
├── auth.js                 # JWT authentication system
└── api-handler.js          # API routing with auth middleware

migrations/
├── 0009_new_normalized_schema.sql    # Core database schema
├── 0010_seed_reference_data.sql      # User permissions and ecosystems
└── 0011_import_stations_data.sql     # Station data population
```

#### Key Components
- **Authentication System**: `src/auth.js` with JWT tokens and role-based permissions
- **Database Schema**: Normalized design with proper relationships
- **Modal CRUD Forms**: Comprehensive forms for stations, platforms, instruments
- **Interactive Maps**: Permission-based map data with role-specific views

### 🔐 Authentication System

#### JWT Token Management
```javascript
// Token verification
const user = await getUserFromRequest(request);
if (!user) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
    });
}

// Permission checking
if (!hasPermission(user, 'write', 'instruments', stationId)) {
    return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
    });
}
```

#### Default Admin User
- **Username**: `admin`
- **Password**: `admin` (should be changed on first login)
- **Role**: `admin`
- **Access**: Full system access

#### Session Management
- JWT tokens stored in localStorage
- Automatic token verification on page load
- Session tracking in `user_sessions` table
- Activity logging for audit compliance

### 📊 Database Schema Guide

#### Core Tables
- **`stations`**: Research station master data
- **`platforms`**: Physical mounting structures
- **`instruments`**: Phenocams and sensors with full specifications
- **`users`**: User accounts with role-based access
- **`user_field_permissions`**: Granular field-level permissions
- **`activity_log`**: Complete audit trail

#### Key Relationships
```sql
stations (1) -> (*) platforms -> (*) instruments
users (1) -> (*) user_sessions
users (*) -> (1) stations (for station users)
```

#### Permission System
- **Field-level control**: Different users can edit different fields
- **Station isolation**: Station users see only their assigned station
- **Role inheritance**: Admin users have all permissions

### 🎯 CRUD Operations

#### Modal Form System
All CRUD operations use professional modal forms with:
- **Tabbed Organization**: Logical grouping of related fields
- **Field Validation**: Client and server-side validation
- **Contextual Help**: Tooltips and instructions throughout
- **Role-Aware**: Different fields available based on user permissions

#### Station Management
```javascript
// Edit station (admin only)
async function editStation(stationId) {
    const station = await fetchStationData(stationId);
    populateStationForm(station);
    showModal('station-modal');
}
```

#### Platform Management
```javascript
// Platform with mounting structure details
const platformData = {
    display_name: "Abisko Forest Building 01",
    mounting_structure: "Building RoofTop",
    platform_height_m: 15.5,
    latitude: 68.3629,
    longitude: 18.7985
};
```

#### Instrument Management
```javascript
// Comprehensive instrument configuration
const instrumentData = {
    display_name: "Abisko Forest Phenocam 01",
    ecosystem_code: "FOR",
    camera_brand: "Mobotix",
    camera_model: "M16B",
    camera_resolution: "4096x3072",
    first_measurement_year: 2010,
    measurement_status: "Active"
};
```

### 🗺️ Interactive Mapping

#### Permission-Based Data Loading
```javascript
// Load map data based on user permissions
const response = await fetch('/api/geojson/all', {
    headers: {
        'Authorization': `Bearer ${token}`
    }
});
```

#### Marker System
- **Station Markers**: Blue broadcast tower icons
- **Platform Markers**: Green tower icons
- **Phenocam Markers**: Camera icons
- **Sensor Markers**: Microscope icons

### 🎨 User Interface Guidelines

#### Instructions and Help
- **Role-Specific Guidance**: Different instructions for different user types
- **Contextual Help**: Tooltips and field descriptions throughout
- **Progressive Disclosure**: Advanced options revealed when needed
- **Error Prevention**: Validation and confirmation for destructive actions

#### Responsive Design
- **Mobile-First**: Optimized for all device sizes
- **Professional Styling**: Consistent SITES Spectral branding
- **Accessibility**: Keyboard navigation and screen reader support

### ⚡ Performance Optimization

#### Data Loading
- **Parallel API Calls**: Multiple endpoints loaded simultaneously
- **Smart Caching**: Intelligent caching of user permissions and station data
- **Lazy Loading**: Map data loaded only when map tab is activated

#### Form Management
- **Efficient Rendering**: Modal forms created once and reused
- **State Management**: Proper cleanup of form data between uses
- **Validation Optimization**: Client-side validation to reduce server load

### 🛡️ Security Best Practices

#### Data Protection
- **No Public Access**: All sensitive research data protected
- **Input Sanitization**: All user input validated and sanitized
- **SQL Injection Prevention**: Prepared statements throughout
- **XSS Protection**: Proper output encoding

#### Permission Enforcement
- **Server-Side Validation**: All permissions checked on backend
- **Session Security**: Secure JWT token management
- **Activity Logging**: Complete audit trail for compliance

### 🔧 API Endpoints

#### Authentication Endpoints
- `POST /api/auth/login` - User login with role assignment
- `GET /api/auth/verify` - Token verification and refresh
- `POST /api/auth/logout` - Session termination

#### Data Management Endpoints
- `GET /api/stations` - List stations (filtered by user permissions)
- `PUT /api/stations/{id}` - Update station (admin only)
- `GET /api/platforms` - List platforms (station-filtered)
- `POST /api/instruments` - Create instrument (with permission check)
- `PUT /api/instruments/{id}` - Update instrument (with permission check)

#### Specialized Endpoints
- `GET /api/geojson/all` - GeoJSON data (permission-filtered)
- `GET /api/activity/recent` - Recent activity (role-based)

### 📝 Form Field Specifications

#### Station Fields (Admin Only)
- `display_name` (required): Human-readable station name
- `acronym` (required): 3-letter station code
- `status`: Active/Inactive/Maintenance
- `country`: Default "Sweden"
- `latitude/longitude`: Decimal degrees, validated ranges
- `elevation_m`: Elevation in meters
- `description`: Detailed station description

#### Platform Fields (Station Users Can Edit)
- `display_name`: Platform display name
- `location_code`: Code like "BL01", "PL01"
- `mounting_structure`: Building RoofTop/Tower/Mast/etc.
- `platform_height_m`: Height above ground
- `status`: Active/Inactive/Maintenance/Removed/Planned
- `deployment_date`: Installation date
- `latitude/longitude`: Override station coordinates if needed

#### Instrument Fields (Station Users Can Edit Most)
- **Basic Info**: `display_name`, `ecosystem_code`, `instrument_number`, `status`
- **Camera Specs**: `camera_brand`, `camera_model`, `camera_resolution`, `camera_serial_number`
- **Timeline**: `first_measurement_year`, `last_measurement_year`, `measurement_status`
- **Position**: `latitude`, `longitude`, `instrument_height_m`, `viewing_direction`, `azimuth_degrees`
- **Notes**: `description`, `installation_notes`, `maintenance_notes`

### 🚀 Deployment Guide

#### Prerequisites
- Cloudflare account with Workers and D1 access
- Wrangler CLI installed and configured
- Environment variables set in wrangler.toml

#### Deployment Steps
1. **Database Setup**: Apply all migrations to populate schema and data
2. **Asset Build**: Run build process to optimize static assets
3. **Worker Deploy**: Deploy Cloudflare Worker with D1 bindings
4. **User Setup**: Create initial user accounts with proper roles
5. **Testing**: Verify authentication and CRUD functionality

#### Post-Deployment
- Change default admin password
- Create station user accounts
- Assign station permissions
- Test all user roles and permissions
- Verify data access restrictions work correctly

### 🎯 Testing Strategy

#### Authentication Testing
- Verify login/logout flows for all user roles
- Test permission restrictions are properly enforced
- Confirm JWT token expiration and refresh
- Validate session management and cleanup

#### CRUD Testing
- Test all create/read/update operations
- Verify form validation works correctly
- Confirm permission checking on all operations
- Test data persistence and consistency

#### User Interface Testing
- Verify responsive design across device sizes
- Test modal forms and navigation
- Confirm help text and instructions are clear
- Validate accessibility features

### 🔮 Future Enhancements

#### Planned Features
- **User Management UI**: Admin interface for creating/managing users
- **Bulk Operations**: Multi-select for batch instrument updates
- **Data Export**: Enhanced export capabilities with filtering
- **Audit Dashboard**: Visual audit trail interface
- **Mobile App**: Native mobile application for field work

#### Architecture Readiness
- **API Versioning**: Prepared for future API enhancements
- **Plugin System**: Framework ready for additional modules
- **Internationalization**: Infrastructure for multi-language support
- **Advanced Permissions**: Ready for more granular permission systems

### 📚 Documentation Resources

#### User Guides
- **Getting Started**: Step-by-step onboarding for new users
- **Role Guides**: Specific instructions for each user type
- **FAQ**: Common questions and troubleshooting
- **API Documentation**: Complete endpoint reference

#### Technical Documentation
- **Database Schema**: Detailed ERD and table specifications
- **Security Guide**: Authentication and authorization details
- **Deployment Guide**: Complete deployment instructions
- **Development Setup**: Local development environment setup

---

## Important Notes for Development

1. **Security First**: All operations must check authentication and permissions
2. **User Experience**: Provide clear instructions and feedback at every step
3. **Data Integrity**: Validate all inputs and maintain referential integrity
4. **Performance**: Use efficient queries and minimize API calls
5. **Documentation**: Keep this file updated as features evolve

## Common Development Tasks

### Adding New User Role
1. Update `user_field_permissions` table with role permissions
2. Add role handling in `src/auth.js` permission functions
3. Update UI to show/hide features based on role
4. Add role-specific instructions in `setupRoleInstructions()`

### Adding New Form Field
1. Add field to database schema via migration
2. Add field to appropriate modal form in `stations.html`
3. Update form population and save functions
4. Add field permissions to `user_field_permissions` table
5. Update validation logic in API handlers

### Testing CRUD Operations
1. Test as admin user: should see all stations and have full edit rights
2. Test as station user: should see only assigned station with edit rights
3. Test as readonly user: should see data but no edit buttons
4. Verify all form validations work correctly
5. Check that activity logging captures all changes

This system prioritizes security, usability, and comprehensive audit trails suitable for research institution requirements.
- update the version number, changelog, documentation, when successfully tested, troubleshooted fixed  and done. Then commit, push and deploy
- The authentication system uses Cloudflare secrets, not database credentials