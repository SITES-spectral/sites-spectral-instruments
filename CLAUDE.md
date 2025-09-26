# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Version 4.8.15 - Fixed Ecosystem Codes to Match YAML Source (2025-09-26)
**✅ STATUS: SUCCESSFULLY DEPLOYED AND OPERATIONAL**
**🌐 Production URL:** https://sites.jobelab.com
**🔗 Worker URL:** https://sites-spectral-instruments.jose-e5f.workers.dev
**📅 Deployment Date:** 2025-09-26 ✅ DEPLOYED v4.8.15 📚
**🎯 Major Achievement:** Synchronized ecosystem codes with official YAML source of truth for data consistency

### 📚 Ecosystem Code Standardization in v4.8.15
- **Source of Truth Integration**: Updated dropdown options to match `yamls/ecosystems.yaml` exactly
- **Complete Ecosystem Coverage**: Added all 12 official ecosystem codes vs previous limited selection
- **Consistent Naming**: Standardized format "CODE - Description" matching YAML specifications
- **Data Integrity**: Ensures all new instruments use officially recognized ecosystem classifications
- **Backward Compatibility**: Maintains "Other" option for custom codes with proper validation

### ✅ Official Ecosystem Codes Added
- **HEA - Heathland**: Added from YAML source
- **AGR - Arable Land**: Updated description from generic "Agricultural"
- **MIR - Mires**: Maintained existing option
- **LAK - Lake**: Maintained existing option
- **WET - Wetland**: Maintained existing option
- **GRA - Grassland**: Maintained existing option
- **FOR - Forest**: Maintained existing option
- **ALP - Alpine Forest**: Updated description from generic "Alpine"
- **CON - Coniferous Forest**: Added new forest subtype from YAML
- **DEC - Deciduous Forest**: Added new forest subtype from YAML
- **MAR - Marshland**: Added new wetland subtype from YAML
- **PEA - Peatland**: Added new wetland subtype from YAML

### ✨ Technical Implementation
- **Edit Form Updates**: Updated instrument edit dropdown with all 12 ecosystem codes
- **Create Form Updates**: Updated new instrument creation dropdown with all 12 codes
- **Validation Updates**: Updated "Other" field detection to recognize all official codes
- **Description Consistency**: Standardized all descriptions to match YAML specifications
- **Form Synchronization**: Both create and edit forms now have identical ecosystem options

### 🎯 Data Quality Benefits
- **Standardized Classification**: All instruments now use consistent ecosystem terminology
- **Research Accuracy**: Ecosystem codes match scientific classification standards
- **Database Integrity**: Prevents inconsistent ecosystem code entries
- **Report Consistency**: Standardized codes improve data analysis and reporting
- **Future-Proof**: New ecosystem types can be added to YAML without code changes

## Version 4.8.14 - Improved Add Button Placement (2025-09-26)
**📅 Previous Version**
**🎯 Major Achievement:** Optimized add button placement to eliminate proximity confusion with delete buttons

### 🎯 Smart Button Positioning in v4.8.14
- **Moved Add Button to Title**: Relocated "+ Add Instrument" button from card bottom to inline with "Instruments" title
- **Clear Visual Separation**: Add button now positioned far from delete buttons to prevent confusion
- **Logical Grouping**: Add button grouped with title where it semantically belongs
- **Reduced Interface Clutter**: Cleaner card layout with better visual hierarchy
- **Professional Styling**: Compact button styling that fits naturally in title area

### ✨ Technical Implementation
- **Flexbox Layout**: Used `display: flex; justify-content: space-between` for title area
- **Compact Sizing**: Smaller, appropriately-sized button (`padding: 6px 12px`) for title integration
- **Consistent Styling**: Maintained green color scheme (#10b981) with hover effects
- **Responsive Design**: Button scales properly with title text across all screen sizes
- **Clean Typography**: Button size and font weight balanced with title text

### 🎯 User Benefits
- **No More Confusion**: Clear separation between add (top) and delete (bottom) functions
- **Intuitive Placement**: Add button where users expect it - with the section title
- **Reduced Cognitive Load**: Visual hierarchy makes intent immediately clear
- **Safer Interaction**: Impossible to accidentally click delete when trying to add
- **Professional UX**: Follows standard UI patterns for section-level actions

## Version 4.8.13 - Explicit CRUD Buttons with Warning Icons (2025-09-26)
**📅 Previous Version**
**🎯 Major Achievement:** Complete redesign of CRUD buttons with explicit text labels and warning icons for maximum user safety

### ⚠️ Explicit CRUD Button Redesign in v4.8.13
- **Removed Problematic Small Buttons**: Eliminated small icon-only delete buttons that were prone to accidental clicks
- **Explicit Delete Buttons**: Added full-width "Delete Instrument" buttons at bottom of instrument cards with warning triangle icons
- **ROI Modal Delete Buttons**: Added prominent "Delete ROI" buttons in ROI detail modals with warning icons
- **Clear Add Buttons**: Replaced small plus icons with full-width "+ Add New Instrument" buttons in platform cards
- **Text-Based Interface**: All CRUD operations now use explicit text labels instead of icon-only buttons
- **Warning Icons**: Delete buttons feature `fas fa-exclamation-triangle` icons to clearly indicate destructive actions

### ✨ Technical Implementation
- **Button Positioning**: Delete buttons positioned at card bottoms with clear visual separation
- **Warning Iconography**: FontAwesome warning triangle icons (`fas fa-exclamation-triangle`) on all delete buttons
- **Hover Effects**: Red delete buttons darken on hover (`#ef4444` to `#dc2626`)
- **Green Add Buttons**: Full-width green buttons (`#10b981`) with hover effects for positive actions
- **Modal Integration**: Delete buttons properly integrated in ROI detail modals with permission checking
- **Event Handling**: Proper `event.stopPropagation()` to prevent unwanted card clicks

### 🎯 User Safety Benefits
- **Zero Accidental Deletions**: No more small buttons near help icons that cause accidental clicks
- **Crystal Clear Intent**: Text labels make it impossible to misunderstand button functions
- **Visual Warning System**: Warning triangles immediately communicate destructive actions
- **Comfortable Sizing**: Large, easy-to-click buttons reduce user interface stress
- **Professional Standards**: Follows modern UI/UX patterns for destructive actions
- **Accessibility**: Better for users with motor difficulties or small screens

### 🔧 Button Specifications
- **Delete Buttons**: Full-width, red background (#ef4444), white text with warning triangle icon
- **Add Buttons**: Full-width, green background (#10b981), white text with plus symbol
- **Button Text**: Clear, descriptive labels ("Delete Instrument", "Delete ROI", "+ Add New Instrument")
- **Positioning**: Bottom of cards with subtle border separation and background tinting
- **Responsive**: Works across all device sizes with consistent styling

## Version 4.8.12 - Fixed CRUD Button Placement for Better UX (2025-09-26)
**📅 Previous Version**
**🎯 Major Achievement:** Fixed CRUD button placement to prevent accidental deletions and improve user safety

### 🎯 UX Safety Enhancement in v4.8.12
- **Safe Button Placement**: Moved delete/add buttons from right to left side of cards to prevent accidental clicks
- **Clear Visual Separation**: Delete buttons now positioned away from help buttons to avoid confusion
- **Enhanced Button Icons**: White X (×) symbols for delete and white plus (+) symbols for add operations
- **Improved User Safety**: Reduced risk of accidental instrument/ROI deletions during normal browsing
- **Better Visual Hierarchy**: Clear separation between action buttons and information buttons

### ✨ Technical Implementation
- **Left-Side Positioning**: Changed delete/add buttons from `right: 5px` to `left: 5px` positioning
- **Enhanced Icon Visibility**: Maintained white FontAwesome icons (`fas fa-times`, `fas fa-plus`) for clarity
- **Consistent Styling**: Preserved button colors (red for delete, green for add) with improved placement
- **Z-Index Management**: Proper layering to ensure buttons remain clickable and visible
- **Responsive Design**: Button placement works across all device sizes

### 🎯 User Benefits
- **Accident Prevention**: No more accidental deletions when trying to click help buttons
- **Intuitive Interface**: Left-side placement follows common UI patterns for destructive actions
- **Clear Visual Cues**: White symbols on colored backgrounds provide excellent contrast
- **Professional Experience**: Consistent button placement across instrument and ROI cards
- **Enhanced Safety**: Users can safely explore help information without deletion risk

## Version 4.8.11 - Enhanced Modal Synchronization for CRUD Operations (2025-09-26)
**📅 Previous Version**
**🎯 Major Achievement:** Enhanced modal synchronization ensuring all open modals refresh automatically after CRUD operations

### 🔄 Modal Synchronization Enhancement in v4.8.11
- **Smart Modal Tracking**: Automatic tracking of open platform and instrument detail modals
- **Real-time Synchronization**: All open modals refresh automatically after any CRUD operation
- **Seamless User Experience**: Users see updated data immediately without manual refresh
- **Cross-Modal Updates**: Instrument operations refresh platform modals and vice versa
- **Consistent State Management**: Modal content stays synchronized with database changes

### ✨ Technical Implementation
- **Modal State Tracking**: Global variables track currently open platform and instrument modals
- **Refresh Functions**: Dedicated refresh functions for platform and instrument modal content
- **CRUD Integration**: All create, update, and delete operations call modal refresh functionality
- **Error Handling**: Graceful handling of modal refresh failures with console logging
- **Performance Optimized**: Only refreshes modals that are actually open and visible

### 🎯 User Benefits
- **No Manual Refresh**: Users never need to manually close/reopen modals to see updates
- **Instant Feedback**: Changes appear immediately in all relevant views
- **Professional Experience**: Smooth, synchronized interface like modern web applications
- **Reduced Confusion**: No stale data displayed in open modals after operations
- **Workflow Continuity**: Users can continue working without interruption

### 🔧 Enhanced Functions
- **Platform Modal Refresh**: `refreshPlatformModal(platformId)` updates platform details and instrument lists
- **Instrument Modal Refresh**: `refreshInstrumentModal(instrumentId)` updates instrument details and ROI lists
- **Modal State Tracking**: `trackPlatformModal()` and `trackInstrumentModal()` functions
- **Global Refresh**: `refreshOpenModals()` refreshes all currently open modals
- **CRUD Integration**: All CRUD operations (`saveNewInstrument`, `confirmDeleteInstrument`, `saveNewROI`, `confirmDeleteROI`) call refresh

## Version 4.8.10 - Complete CRUD Operations for Instruments and ROIs (2025-09-26)
**✅ STATUS: SUCCESSFULLY DEPLOYED AND OPERATIONAL**
**🌐 Production URL:** https://sites.jobelab.com
**🔗 Worker URL:** https://sites-spectral-instruments.jose-e5f.workers.dev
**📅 Deployment Date:** 2025-09-26 ✅ DEPLOYED v4.8.10 🚀
**🎯 Major Achievement:** Full CRUD (Create, Read, Update, Delete) functionality for instruments and ROIs with automatic naming, backup system, and comprehensive user guidance

### 🔧 Complete CRUD System Implementation in v4.8.10
- **Instrument Management**: Full create, read, update, delete operations for phenocam instruments
- **ROI Management**: Complete CRUD functionality for Regions of Interest (ROIs)
- **Automatic Naming**: Smart auto-generation of normalized names (e.g., ANS_FOR_BL01_PHE03, ROI_00)
- **Backup System**: Optional JSON backups before deletion with complete data preservation
- **Permission-Based Access**: Station users can only manage instruments/ROIs for their assigned stations
- **Real-time UI Updates**: Immediate refresh of all displays after create/delete operations

### ✨ User Experience Enhancements
- **Intuitive Interface**: Plus buttons for adding new instruments and ROIs throughout the UI
- **Smart Deletion**: Delete buttons with confirmation dialogs and backup options
- **Visual Feedback**: Professional loading states, success notifications, and error handling
- **Comprehensive Help**: Enhanced tooltips with emojis and detailed guidance throughout
- **Professional Forms**: Clean modal forms with validation and contextual instructions
- **Empty State Guidance**: Helpful prompts when no instruments or ROIs exist

### 🎯 Instrument CRUD Features
- **Auto-Generated Names**: Platform-based naming (e.g., ANS_FOR_BL01_PHE01, ANS_FOR_BL01_PHE02)
- **Sequential Numbering**: Automatic PHE number assignment based on existing instruments
- **Default Values**: New instruments start as "Planned" status with basic phenocam settings
- **Complete Backup**: Full instrument data plus all associated ROIs before deletion
- **Platform Integration**: Add buttons in platform cards and modals for easy access

### 🎯 ROI CRUD Features
- **Auto-Generated Names**: Sequential ROI naming (ROI_00, ROI_01, ROI_02, etc.)
- **Color Management**: RGB color picker with live preview for visualization
- **Technical Settings**: Thickness, alpha transparency, and description fields
- **Backup Preservation**: Complete ROI data with polygon coordinates before deletion
- **Instrument Integration**: Add/delete ROI buttons in instrument detail modals

### 🔒 Security and Permissions
- **Role-Based Access**: Admin users can manage all; station users limited to their station
- **Permission Validation**: Server-side checks for all create/delete operations
- **Audit Trails**: Complete logging of all CRUD operations with user attribution
- **Backup Security**: Automatic backup generation before any destructive operations

### 💾 Backup System Architecture
- **Comprehensive Data**: Includes all related data (instruments with ROIs, ROI with context)
- **Metadata Tracking**: Timestamps, deletion type, user attribution, station context
- **Automatic Downloads**: JSON files auto-download with descriptive filenames
- **Restore Capability**: Backup format designed for potential data restoration

### 🚀 Technical Implementation
- **Backend APIs**: RESTful endpoints for POST (create) and DELETE operations
- **Frontend Modals**: Professional forms with validation and user guidance
- **Auto-Naming Logic**: Smart algorithms to find next available sequential numbers
- **Error Handling**: Comprehensive error management with user-friendly messages
- **Real-time Updates**: Automatic UI refresh after all CRUD operations

### 🎨 UI/UX Design Elements
- **Professional Buttons**: Green plus buttons for creation, red delete buttons for removal
- **Modal System**: Consistent modal design for all create/delete confirmations
- **Loading States**: Spinner animations during API operations
- **Success Feedback**: Slide-in notifications with operation confirmations
- **Help Integration**: Contextual help text and tooltips throughout interface

## Version 4.8.9 - Research Programs Multiselect Component (2025-09-26)
**✅ STATUS: SUCCESSFULLY DEPLOYED AND OPERATIONAL**
**🌐 Production URL:** https://sites.jobelab.com
**🔗 Worker URL:** https://sites-spectral-instruments.jose-e5f.workers.dev
**📅 Deployment Date:** 2025-09-26 ✅ DEPLOYED v4.8.9 ✨
**🎯 Major Achievement:** Professional multiselect component for research programs with predefined options and custom input

### ✨ Research Programs Multiselect Enhancement in v4.8.9
- **Streamlit-Style Component**: Professional multiselect widget inspired by Streamlit's st.multiselect
- **Predefined Options**: Harmonized list of existing research programs (SITES, ICOS, SLU, Swedish Polar Research Secretariat, Göteborg University)
- **Custom Program Input**: Ability to add new research programs while preventing data inconsistencies
- **Visual Program Tags**: Color-coded tags with icons for different research programs
- **Data Consistency**: Prevents human errors and maintains data integrity across the network
- **Click-to-Remove**: Easy removal of selected programs with × buttons
- **Professional Styling**: Modern UI with hover effects and proper accessibility
- **Error Prevention**: No more typos or inconsistent program names
- **Backwards Compatible**: Properly handles existing JSON array and comma-separated data formats

### 🎯 User Experience Benefits
- **Harmonized Data**: All stations now use consistent research program names
- **Error-Free Input**: No more manual typing errors for program names
- **Visual Clarity**: Instant visual feedback with colored tags and icons
- **Flexible Input**: Choose from existing programs or add custom ones
- **One-Click Operations**: Easy selection/deselection with mouse clicks
- **Professional Interface**: Clean, modern design matching the overall application aesthetic

### 🔧 Technical Implementation
- **CSS-Based Styling**: Custom multiselect component with professional appearance
- **JavaScript Class**: Reusable ResearchProgramsMultiselect component
- **Data Format Handling**: Seamless conversion between JSON arrays and comma-separated values
- **API Integration**: Updated save functionality to properly handle multiselect data
- **Responsive Design**: Works across all device sizes and screen resolutions

## Version 4.8.7 - Enhanced Help Button Size and Auto-Fitting Map Zoom (2025-09-23)
**📅 Previous Version**
**🎯 Major Achievement:** Enhanced help button usability and improved map auto-fitting functionality

### ✨ User Experience Enhancement in v4.8.7
- **Increased Button Size**: Enlarged help button from 0.7em to 1.1em (57% size increase)
- **Better Visibility**: Increased opacity from 0.6 to 0.75 for improved contrast
- **Enhanced Accessibility**: Larger click target area for better interaction across devices
- **Auto-Fitting Map Zoom**: Map now automatically adjusts zoom level to show all platforms and station markers
- **Optimized Platform Visibility**: Particularly beneficial for Abisko station with distributed platforms
- **Smart Bounds Calculation**: Uses Leaflet's fitBounds with appropriate padding and maximum zoom limits
- **Full Station Names**: Station marker tooltips now display complete research station names (e.g., "Abisko Scientific Research Station" instead of just "Abisko")
- **Enhanced Information Display**: Improved user experience with more descriptive station identification on map hover
- **Welcome Card Description**: Added station description to the welcome card for better context and institutional information
- **Professional Presentation**: Station descriptions now visible in both map tooltips and welcome section
- **User-Responsive Design**: Direct implementation of user feedback for improved usability

## Version 4.8.6 - Fixed Missing Help Button in Instrument Cards (2025-09-23)
**📅 Previous Version**
**🎯 Major Achievement:** Restored missing help button functionality in instrument cards

### 🔧 Quick Fix in v4.8.6
- **Missing Help Button**: Restored help button that was inadvertently removed from instrument cards
- **Improved Positioning**: Moved help button to instrument title section for better visibility
- **Enhanced UX**: Help button now positioned in top-right corner of normalized name title area
- **Clean Design**: Removed duplicate help button and optimized placement

## Version 4.8.5 - Updated Meteorological Station Phenocam and Added Viewing Direction Label (2025-09-23)
**📅 Previous Version**
**🎯 Major Achievement:** Standardized meteorological station phenocam naming and enhanced UI clarity

### 🏷️ Database and UI Updates in v4.8.5
- **ANS_FOR_BL01_PHE02**: Updated meteorological station second phenocam normalized name and coordinates
- **Viewing Direction Labels**: Added "viewing direction:" prefix to instrument cards for better clarity
- **Coordinate Alignment**: Applied same coordinates as ANS_FOR_BL01_PHE01 for platform consistency
- **Enhanced User Experience**: Consistent labeling pattern across all instrument card fields

## Version 4.8.4 - Updated Abisko Platform Coordinates and Normalized Names (2025-09-23)
**📅 Previous Version**
**🎯 Major Achievement:** Updated Abisko platform data with precise coordinates and standardized naming

### 🗺️ Platform Data Updates in v4.8.4
- **Miellejokka Heath Platform**: Updated coordinates (68.311722, 18.91527) and normalized name (ANS_MJH_PL01)
- **Stordalen Birch Forest Platform**: Updated coordinates (68.34980602492992, 19.04258100806418) and normalized name (ANS_SBF_FOR_PL01)
- **Instrument Updates**: Applied matching coordinates and standardized normalized names for both phenocams
- **Station Acronyms**: MJH for Miellejokka Heath, SBF for Stordalen Birch Forest

## Version 4.8.3 - Added Normalized Names as Titles in Instrument Cards (2025-09-23)
**📅 Previous Version**
**🎯 Major Achievement:** Enhanced instrument card layout with prominent normalized name titles

### 🏷️ Instrument Card Enhancement in v4.8.3
- **Normalized Name Titles**: Added instrument normalized names as prominent titles above thumbnail images
- **Visual Hierarchy**: Enhanced card layout with clear instrument identification at the top
- **Professional Styling**: Title section with subtle background and border for better visual separation
- **Consistent Display**: All instrument cards now show normalized names (e.g., "ANS_FOR_BL01_PHE01") before legacy names

## Version 4.8.2 - Enhanced UX with Legacy Name Prefix, Help Buttons, and New Abisko Platforms (2025-09-23)
**📅 Previous Version**
**🎯 Major Achievement:** Enhanced user experience with improved guidance and expanded Abisko platform infrastructure

### ✨ User Experience Enhancements in v4.8.2
- **Legacy Name Display**: Added "legacy name:" prefix before legacy acronyms in instrument cards for better clarity
- **Help System**: Added helpful question mark icons to platform and instrument cards with tooltips explaining functionality
- **Modal Instructions**: Added small instructional text next to edit buttons in detail modals for better user guidance
- **Platform Expansion**: Added 2 new platforms and 3 new instruments at Abisko station for future ecosystem monitoring

### 🗺️ New Abisko Infrastructure
- **Stordalen Birch Forest Platform**: New platform (BF01) with Mobotix phenocam for forest monitoring
- **Miellejokka Heath Platform**: New platform (HE01) with Mobotix phenocam for heath ecosystem monitoring
- **Met Station Enhancement**: Added second Nikon phenocam to existing meteorological station platform
- **Status Management**: All new equipment properly marked as "Planned" for future deployment workflow

## Version 4.8.1 - Complete API Fix for All Edit Form Fields (2025-09-21)
**📅 Previous Version**
**🎯 Major Achievement:** Complete API fix ensuring all comprehensive edit form fields save and retrieve properly

### 🐛 Critical Bug Fixes in v4.8.1
- **API Field Support**: Fixed API endpoints missing support for comprehensive edit form fields
- **Database Operations**: Added all missing fields to both GET and PUT operations
- **User-Reported Issue**: Fixed "degrees_from_nadir" not saving or displaying (now works correctly)
- **Modal Refresh**: Fixed detail modals not showing updated content after edits
- **Data Persistence**: All 25 instrument fields and 12 platform fields now save properly

### 🔧 Technical Fixes Applied
- **Instrument GET**: Added `degrees_from_nadir` and `deployment_date` to SELECT query
- **Instrument PUT**: Extended `stationEditableFields` to include 13 missing fields
- **Platform PUT**: Added `deployment_date` to `stationEditableFields` array
- **Modal Refresh**: Added automatic detail modal refresh after successful edits
- **Field Validation**: All form fields now properly processed and stored

### 🏗️ Latest Update: Comprehensive Edit Forms Implementation
- **Complete Field Coverage**: Edit forms now include ALL fields shown in detail modals for both platforms and instruments
- **Unified Experience**: Edit forms follow the exact same order and section structure as detail modals
- **Smart Dropdowns**: Common values provided for camera brands, resolutions, viewing directions, instrument types, and ecosystem codes
- **"Other" Options**: Custom input fields that appear dynamically when "Other" is selected from dropdowns
- **Enhanced Data Handling**: Updated save functions to process all new fields with proper data type conversions
- **Professional Organization**: Forms organized in clear sections with icons matching the detail modal layout
- **Improved UX**: Better user experience with helpful placeholders, validation, and intuitive field grouping
- **Role-Based Control**: Maintains admin/station user permission structure across all new fields

### 📋 Comprehensive Form Fields Added
**Platform Edit Form:**
- General Information: Name, Normalized ID, Location Code, Status
- Location & Positioning: Latitude, Longitude, Platform Height
- Technical Specifications: Mounting Structure (dropdown), Deployment Date
- Research Programs: Station assignment, Operation Programs
- Additional Information: Description and notes

**Instrument Edit Form:**
- General Information: Name, Legacy Acronym, Normalized ID, Status (6 options)
- Camera Specifications: Brand (dropdown), Model, Resolution (dropdown), Serial Number
- Position & Orientation: Coordinates, Height, Viewing Direction (dropdown), Azimuth, Degrees from Nadir
- Timeline & Classification: Type (dropdown), Ecosystem Code (dropdown), Deployment Date, Measurement Years, Status
- Notes & Context: Platform, Station, Description, Installation Notes, Maintenance Notes

### 🔧 Technical Implementation
- **Frontend**: Edit modals with form validation and real-time notifications
- **Backend**: PUT API endpoints with proper authentication and permission checking
- **Database**: Utilizes existing `updated_at` timestamps for tracking modifications
- **Security**: All operations properly authenticated and authorized based on user roles
- **UX**: Success notifications, loading states, and error handling throughout

### ✨ New CRUD Features Detail

#### 🎛️ Edit Button System
- **Platform Cards**: Edit buttons appear in top-right corner for authorized users
- **Instrument Cards**: Compact edit buttons on each instrument card
- **Role Visibility**: Only admin and station users see edit buttons for their permitted items
- **Visual Design**: Professional green buttons with hover effects and proper spacing

#### 📝 Modal Edit Forms
- **Professional Layout**: Clean, organized forms with proper field grouping
- **Input Validation**: Client-side validation with required field indicators
- **Permission Notices**: Clear indicators showing which fields are read-only for station users
- **Form Controls**: Save/Cancel buttons with loading states and error handling

#### 🔒 Permission Matrix
**Admin Users:**
- Can edit all stations, platforms, and instruments
- Full access to normalized names, IDs, and legacy acronyms
- No restrictions on any field modifications

**Station Users:**
- Can only edit platforms and instruments at their assigned station
- Cannot modify normalized names, IDs, or legacy acronyms (read-only)
- Can update display names, status, coordinates, descriptions, and technical specifications

**Read-Only Users:**
- No edit buttons displayed
- View-only access to all information
- Cannot make any modifications

#### 🏷️ Recently Updated Badge System
- **Visual Indicators**: Bright orange badges with sparkle icons for recently updated items
- **Time Display**: Shows relative time since last update (e.g., "2h ago", "3 days ago")
- **Auto-Hide Feature**: Configurable display duration (1 week, 2 weeks, 1 month, 2 months)
- **User Control**: Toggle to completely hide/show recent update badges
- **Platform Badges**: Shows "Updated" with timestamp for platform cards
- **Instrument Badges**: Shows "New" for recently modified instrument cards

#### 🔔 Notification System
- **Success Notifications**: Slide-in notifications for successful edits
- **Error Handling**: Clear error messages for failed operations
- **Auto-Dismiss**: Notifications automatically disappear after 3 seconds
- **Animation**: Smooth slide-in/slide-out animations for professional feel

#### 🛡️ API Security
- **Authentication Required**: All PUT endpoints require valid JWT tokens
- **Permission Checking**: Server-side verification of user permissions for each field
- **Data Validation**: Input sanitization and validation on both client and server
- **Station Isolation**: Station users cannot access data from other stations
- **Audit Trail**: All changes tracked with timestamps in database

#### 📊 Database Integration
- **Updated Timestamps**: Automatic `updated_at` field updates on all modifications
- **Atomic Operations**: Single database transactions for consistency
- **Foreign Key Integrity**: Proper relationships maintained during updates
- **Rollback Support**: Transaction rollback on validation failures

## Version 4.7.5 - Complete ROI Data Restoration and Full System Functionality (2025-09-20)
**✅ STATUS: SUCCESSFULLY DEPLOYED AND OPERATIONAL**
**🌐 Production URL:** https://sites.jobelab.com
**🔗 Worker URL:** https://sites-spectral-instruments.jose-e5f.workers.dev
**📅 Deployment Date:** 2025-09-20
**🎯 Major Achievement:** Complete restoration of ROI system with full functionality across SITES network

### 🏗️ Previous Update: Complete ROI System Restoration
- **ROI Database Population**: Successfully populated 42 ROIs across all active phenocam instruments
- **Interactive ROI Cards**: Fully functional ROI display system with color-coded visual indicators
- **Detailed ROI Modals**: Complete ROI information including polygon coordinates and metadata
- **Network Coverage**: ROI data restored for Abisko, Lönnstorp, Skogaryd, Svartberget, and other stations
- **Technical Infrastructure**: Custom ROI extraction script and complete database integration

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
- use station-credentials-SECURE.json to login using the cloudflare credentials