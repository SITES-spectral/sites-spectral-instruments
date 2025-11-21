# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**For historical version information, see [CLAUDE_LEGACY.md](./CLAUDE_LEGACY.md)**

---

## Current Version: 5.2.59 - Documentation Cleanup & Legacy Archive (2025-11-21)
**✅ STATUS: SUCCESSFULLY COMPLETED**
**🌐 Production URL:** https://sites.jobelab.com
**📅 Last Update:** 2025-11-21

### 📚 Latest Updates (v5.2.59)

**Documentation Restructure:**
- **CLAUDE.md reduced**: 932 lines → 243 lines (74% reduction)
- **CLAUDE_LEGACY.md created**: Historical archive with all previous versions
- **Performance improvement**: Faster context loading, reduced token usage
- **Better maintainability**: Clear separation of current vs historical info

### 📊 Previous Update (v5.2.58 - 2025-11-20)

**Migration Statistics:**
- **Source File**: `metadata shared.xlsx` (76 rows of instrument data)
- **Platforms Processed**: 7 (SVB_FOR_PL01-03, SVB_MIR_PL01-04)
- **Total Instruments Extracted**: 22
- **New Instruments Ready**: 19 (Phenocams, Multispectral, PAR sensors)

**Generated Files** (in `docs/migrations/`):
- `svb_instruments_generated.yaml` - Ready-to-integrate YAML definitions
- `SVB_INSTRUMENT_MIGRATION_SUMMARY.md` - Comprehensive integration guide
- `process_svb_instruments.py` - Reusable processing script

### 🎯 Pending Tasks (v5.2.58)
1. Review generated instruments for accuracy
2. Adjust instrument numbering (MS01, MS02, etc.)
3. Merge split multi-channel instruments
4. Integrate into `yamls/stations_latest_production.yaml`
5. Migrate to production database

---

## System Architecture

### Authentication & Security
- **Role-Based Access**: Three user roles (admin, station, readonly) with granular permissions
- **JWT Authentication**: Secure token-based authentication with session management
- **Permission Matrix**: Field-level permissions via `user_field_permissions` table
- **Credentials**: Cloudflare usernames (NOT emails/passwords)

### Database Schema (Cloudflare D1)
- **Core Tables**: `stations`, `platforms`, `instruments`, `instrument_rois`
- **User Management**: `users`, `user_sessions`, `activity_log`
- **Relationships**: Proper foreign key constraints with cascade rules
- **Migration System**: Numbered SQL migrations in `/migrations/`

### Key Features
- **Complete CRUD Operations**: Full create/read/update/delete for all entities
- **Interactive Mapping**: Leaflet-based maps with SWEREF 99 coordinate system
- **Professional UI**: Responsive design with comprehensive modal systems
- **ROI Management**: Region of Interest functionality with visual editing
- **Export Capabilities**: Multi-format data export (CSV, TSV, JSON)

---

## Development Workflow

### Build and Development
```bash
npm run dev                 # Start local development server
npm run build              # Build application
npm run build:bump         # Build with automatic version increment
```

### Database Operations
```bash
npm run db:migrate         # Apply migrations to remote database
npm run db:migrate:local   # Apply migrations to local database
npm run db:studio          # Open database studio interface

# Direct database commands
npx wrangler d1 migrations apply spectral_stations_db --remote
npx wrangler d1 execute spectral_stations_db --remote --command="SELECT * FROM stations;"
```

### Deployment
```bash
npm run deploy             # Build and deploy to production
npm run deploy:bump        # Build with version bump and deploy
```

**IMPORTANT**: Always bump version and update changelog before committing!

---

## File Structure

```
public/
├── index.html              # Login redirect page
├── login.html              # Main login portal
├── station.html            # Station details and management
├── css/                    # Stylesheets
├── js/                     # JavaScript modules
│   ├── api.js              # API communication layer
│   ├── components.js       # UI components
│   ├── interactive-map.js  # Leaflet mapping
│   ├── station-dashboard.js # Station management
│   ├── navigation.js       # Client-side routing
│   └── export.js           # Data export functionality
└── images/                 # Static assets

src/
├── worker.js               # Main Cloudflare Worker
├── auth.js                 # JWT authentication system
├── api-handler.js          # API routing with auth middleware
└── handlers/               # API endpoint handlers
    ├── stations.js
    ├── platforms.js
    ├── instruments.js
    ├── export.js
    └── ...

migrations/
└── *.sql                   # Database schema migrations

yamls/
└── stations_latest_production.yaml  # Station metadata source
```

---

## Naming Conventions

### Platform Naming
- **Format**: `{STATION}_{ECOSYSTEM}_PL##`
- **Location Codes**: Always use `PL##` (not `P##`)
- **Examples**: `SVB_FOR_PL01`, `SVB_MIR_PL04`, `ANS_AGR_PL01`

### Instrument Naming
- **Format**: `{PLATFORM}_{TYPE_CODE}{NUMBER}`
- **Type Codes**:
  - `PHE` - Phenocam
  - `MUL` - Multispectral Sensor
  - `HYP` - Hyperspectral Sensor
  - `PAR` - PAR Sensor
- **Number Format**: Zero-padded 2-digit (e.g., `01`, `02`)
- **Examples**: `SVB_MIR_PL02_PHE01`, `ANS_AGR_PL01_MUL02`

### Ecosystem Codes
All 12 official ecosystem codes:
- **FOR** - Forest
- **CON** - Coniferous Forest
- **DEC** - Deciduous Forest
- **ALP** - Alpine Forest
- **AGR** - Arable Land
- **GRA** - Grassland
- **HEA** - Heathland
- **MIR** - Mires
- **PEA** - Peatland
- **WET** - Wetland
- **MAR** - Marshland
- **LAK** - Lake

---

## Security Best Practices

1. **No Public Access**: All functionality requires user authentication
2. **Input Sanitization**: All user input validated and sanitized
3. **Permission Enforcement**: Server-side validation of all permissions
4. **Activity Logging**: Complete audit trail for compliance
5. **Session Security**: Secure JWT token management
6. **Documentation Security**: Never include actual server names or credentials

---

## Important Development Notes

### Admin CRUD Operations
- **Station Management**: Create/delete stations via admin controls
- **Platform Management**: Create/delete platforms with dependency checking
- **Data Safety**: All deletions include cascade analysis and optional backup
- **Validation**: Real-time conflict checking with intelligent suggestions

### Station User Permissions
- **Instrument Management**: Full CRUD for instruments on their station
- **Platform Access**: Read-only access to platforms
- **Data Export**: Can export data for their station
- **UI Controls**: Permission-based visibility of management buttons

### Known Issues & Workarounds
- **Platform Creation Button**: If button doesn't respond, use direct database operations
- **Form Field Loading**: Console logging added for debugging empty form fields
- **Modal Conflicts**: Ensure proper data synchronization between dashboard and globals

### Development Principles
1. **Security First**: All operations must check authentication and permissions
2. **User Experience**: Provide clear instructions and feedback at every step
3. **Data Integrity**: Validate all inputs and maintain referential integrity
4. **Performance**: Use efficient queries and minimize API calls
5. **Documentation**: Keep this file updated as features evolve

---

## Current Production Status

- **Production URL**: https://sites.jobelab.com
- **Worker URL**: https://sites-spectral-instruments.jose-e5f.workers.dev
- **Current Version**: 5.2.59
- **Last Updated**: 2025-11-21
- **Status**: Fully operational
- **Environment**: Cloudflare Workers with D1 database

---

## Git Workflow Best Practices

### Before Every Commit
1. **Use git worktrees** for parallel sessions with agents team
2. **Bump version** in `package.json`
3. **Update CHANGELOG.md** with comprehensive entry
4. **Test locally** if changes affect functionality
5. **Update this CLAUDE.md** if architecture changes

### Commit Message Format
```
📚 SITES Spectral v{VERSION}: {TYPE} - {BRIEF DESCRIPTION}

{Detailed description with bullet points}

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Types
- 📚 DOCUMENTATION
- 🚀 FEATURE
- 🔧 FIX / CRITICAL FIX
- 🚨 HOTFIX
- 📊 DATABASE UPDATE
- 🐛 BUG FIX
- ✨ ENHANCEMENT
- 🎨 UI/UX

---

*For historical version documentation, see [CLAUDE_LEGACY.md](./CLAUDE_LEGACY.md)*
