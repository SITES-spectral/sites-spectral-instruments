# SITES Spectral Stations & Instruments Management System

A comprehensive web application for managing SITES (Swedish Infrastructure for Ecosystem Science) spectral monitoring stations and instruments. Built with Cloudflare Workers, D1 Database, and vanilla JavaScript.

**Version**: 0.1.0-dev  
**Status**: ✅ Active Development  
**Live Site**: https://sites.jobelab.com

## 📊 Current Data

- **9 Research Stations** across Sweden
- **83 Total Instruments** (82 active)
- **21 Phenocams** with ROI data
- **62 Multispectral Sensors** with detailed specifications
- **Real-time Data** from YAML and CSV sources

## 📋 Features

### 🏛️ Station Management
- **Complete CRUD operations** for research stations
- **Geographic visualization** with interactive maps
- **Station metadata** including coordinates, elevations, contact information
- **Region-based filtering** and search capabilities
- **Station statistics** and instrument counts

### 🔬 Instrument Management
- **Comprehensive instrument database** with phenocams and fixed sensors
- **Legacy name tracking** with canonical ID mapping
- **Status management** (Active, Inactive, Maintenance, Removed, Planned, Unknown)
- **Equipment specifications** (brand, model, serial numbers, wavelengths)
- **Platform mounting details** with heights and orientations
- **ROI (Region of Interest)** management for phenocams

### 📊 Data Export & Integration
- **Multiple export formats**: CSV, YAML, JSON
- **Flexible filtering** by station, type, status, ecosystem
- **Custom field selection** for targeted exports
- **Complete dataset exports** with full metadata
- **Export history tracking** with download links

### 🔄 Change Tracking
- **Instrument history** with deployment, maintenance, and status changes
- **Data quality flags** with severity levels and resolution tracking
- **Activity feed** showing recent system changes
- **Audit trails** for all modifications

### 🎯 Professional UI/UX
- **Responsive design** optimized for desktop and mobile
- **Modern interface** with professional styling
- **Real-time validation** and error handling
- **Toast notifications** for user feedback
- **Loading states** and progress indicators

## 🏗️ Architecture

### Frontend
- **Vanilla JavaScript** - No framework dependencies
- **Modern CSS** with CSS Grid and Flexbox
- **Font Awesome** icons
- **Inter** font family
- **Responsive design** principles

### Backend
- **Cloudflare Workers** with Static Assets for hosting
- **Cloudflare D1** SQLite database with migrations
- **RESTful API** design with comprehensive error handling
- **CORS Support** for cross-origin requests

### Database Schema (Current v0.1.0-dev)
```sql
-- Core tables
- stations (9 Swedish research stations with coordinates)
- phenocams (21 instruments with ROI polygon data)
- mspectral_sensors (62 sensors with detailed specifications)

-- Reference tables  
- ecosystems (FOR, AGR, MIR, LAK, WET, HEA, SFO, CEM)
- instrument_types (PHE, SPECTRAL, etc.)
- platform_types (PL, BL, TW, MS, UC, GR, FL, EC)
```

### API Endpoints
```
GET  /api/stations          # List all stations with instrument counts
GET  /api/phenocams         # List all phenocams with ROI data
GET  /api/mspectral         # List all multispectral sensors
GET  /api/stats/network     # Network statistics (83 instruments, 82 active)
GET  /api/stats/instruments # Instrument status breakdown
GET  /api/reference/*       # Reference data (ecosystems, types)
GET  /api/activity         # Recent system activity
GET  /api/health           # System health check
```

## 🚀 Deployment

### Prerequisites
- Node.js 18+
- Cloudflare account
- Wrangler CLI installed

### Setup Steps

1. **Clone and install dependencies**
```bash
cd sites-spectral-stations-instruments  
npm install
```

2. **Create Cloudflare D1 database**
```bash
npm run db:create
```

3. **Update wrangler.toml with database ID**
```bash
# Copy the database ID from the creation output
# Update database_id in wrangler.toml
```

4. **Run database migrations**
```bash
npm run db:migrate
```

5. **Populate database with real data**
```bash
npm run populate:all  # Runs both phenocams and mspectral population scripts
```

6. **Deploy to Cloudflare Workers**
```bash
npm run deploy
```

### Environment Configuration

The application uses Cloudflare's environment variables:
- `DB` - D1 database binding
- `ENVIRONMENT` - Production/development flag
- `APP_NAME` - Application display name

## 📁 Project Structure

```
spectral-stations-instruments/
├── public/                 # Frontend assets
│   ├── index.html         # Dashboard
│   ├── stations.html      # Station management
│   ├── instruments.html   # Instrument management  
│   ├── export.html        # Data export
│   ├── css/
│   │   ├── styles.css     # Main styles
│   │   ├── forms.css      # Form styles
│   │   └── export.css     # Export page styles
│   └── js/
│       ├── utils.js       # Utility functions
│       ├── api.js         # API client
│       ├── dashboard.js   # Dashboard logic
│       ├── stations.js    # Station management
│       ├── instruments.js # Instrument management
│       └── export.js      # Export functionality
├── functions/             # Cloudflare Workers API
│   └── api/
│       ├── stations.js    # Station CRUD operations
│       ├── instruments.js # Instrument CRUD operations
│       ├── export.js      # Data export handlers
│       └── stats.js       # Statistics endpoints
├── migrations/            # Database migrations
│   ├── 0001_initial_schema.sql
│   ├── 0002_seed_data.sql
│   ├── 0003_phenocams_table.sql
│   └── 0004_mspectral_sensors_table.sql
├── populate_phenocams.js  # YAML to DB population script
├── populate_mspectral.js  # YAML+CSV to DB population script
├── package.json
├── wrangler.toml         # Cloudflare configuration
└── README.md
```

## 🔧 Development

### Local Development
```bash
# Start local development server
npm run dev

# Open database studio
npm run db:studio

# Run migrations locally
npm run db:migrate
```

### Database Management
```bash
# Apply migrations
npm run db:migrate

# Populate with real data
npm run populate:phenocams    # Load 21 phenocams from YAML
npm run populate:mspectral    # Load 62 multispectral sensors from YAML+CSV  
npm run populate:all          # Load all data

# Open database studio for inspection
npm run db:studio

# Execute raw SQL commands
npm run db:console "SELECT COUNT(*) FROM phenocams"
```

## 📊 Data Model

### Station Naming Convention
**Format**: `{STATION}_{ECOSYSTEM}_{PLATFORM}_{INSTRUMENT}`

**Examples**:
- `ANS_FOR_BL01_PHE01` - Abisko Forest Building phenocam
- `LON_AGR_PL01_PHE01` - Lönnstorp Agriculture Platform phenocam
- `RBD_AGR_F01_MS01` - Röbäcksdalen Agriculture Fixed multispectral sensor

### Legacy Name Mapping
The system maintains backward compatibility with legacy naming:
- `ANS-FOR-P01` → `ANS_FOR_BL01_PHE01`
- `SFA-AGR-P01` → `LON_AGR_PL01_PHE01`
- `RBD-AGR-F01` → `RBD_AGR_F01_MS01`

### Status Tracking
Instruments can have the following statuses:
- **Active** - Currently operational
- **Inactive** - Not currently operational but not removed
- **Maintenance** - Under maintenance or repair
- **Removed** - Permanently removed from station
- **Planned** - Planned for installation
- **Unknown** - Status unclear or unverified

## 🌍 SITES Network Stations (Current v0.1.0-dev)

Currently supporting **83 instruments** across **6 active stations**:

### Active Stations with Instruments
- **Svartberget** (SVB) - 54 instruments (5 phenocams + 49 multispectral sensors)
- **Skogaryd** (SKC) - 15 instruments (9 phenocams + 6 multispectral sensors) 
- **Lönnstorp** (LON) - 5 instruments (3 phenocams + 2 multispectral sensors)
- **Abisko** (ANS) - 4 instruments (1 phenocam + 3 multispectral sensors)
- **Röbäcksdalen** (RBD) - 4 instruments (2 phenocams + 2 multispectral sensors)
- **Grimsö** (GRI) - 1 instrument (1 phenocam)

### Stations in Database (No Current Instruments)
- **Asa** (ASA) - Forest and lake research
- **Hyltemossa** (HTM) - Forest research  
- **Tarfala** (TAR) - Alpine and glacier research

### Rich Sensor Data
- **Precise coordinates** with high-precision lat/lon
- **Technical specifications** (wavelengths, bandwidths, field of view)
- **Equipment details** (SKYE, Decagon brands with model numbers)
- **Usage types** (PRI, NDVI, PAR measurements)
- **Installation details** (tower heights, azimuths, mounting configurations)

## 🔒 Security Features

- **Input sanitization** to prevent XSS attacks
- **SQL injection prevention** through parameterized queries  
- **CSRF protection** through Cloudflare's built-in features
- **Rate limiting** via Cloudflare Workers
- **Data validation** on both client and server side

## 🎨 UI Components

### Form Elements
- **Validation feedback** with real-time error messages
- **Dropdown selects** with dynamic option loading
- **Date pickers** for temporal data
- **Checkbox groups** for multi-select options
- **File upload** with drag-and-drop support

### Interactive Features
- **Modal dialogs** for form editing and confirmations
- **Toast notifications** for user feedback
- **Loading spinners** and progress bars
- **Sortable tables** with pagination
- **Search and filtering** with debounced input

## 📈 Performance

### Optimization Features
- **Lazy loading** of large datasets
- **Pagination** for table views
- **Debounced search** to reduce API calls
- **Caching** at Cloudflare edge locations
- **Minified assets** for faster loading
- **Progressive enhancement** for offline capability

## 🤝 Contributing

### Development Guidelines
1. Follow **semantic HTML** structure
2. Use **BEM methodology** for CSS naming
3. Implement **progressive enhancement**
4. Write **accessible** interfaces
5. Include **error handling** for all operations
6. Add **loading states** for async operations

### Code Style
- **ES6+** JavaScript features
- **Async/await** for promises
- **Destructuring** for cleaner code
- **Template literals** for string formatting
- **Consistent indentation** (2 spaces)

## 📞 Support

For issues, feature requests, or questions:
- Create an issue in the repository
- Contact the SITES Spectral team
- Check live application at https://sites.jobelab.com
- API health check: https://sites.jobelab.com/api/health

## 📄 Version Information

- **Current Version**: 0.1.0-dev
- **Release Date**: 2025-09-10
- **Database Schema**: v4 (4 migrations applied)
- **Data Sources**: YAML configuration files + CSV metadata
- **Deployment**: Cloudflare Workers with D1 database

## 📝 Recent Updates

See [CHANGELOG.md](CHANGELOG.md) for detailed release notes.

## 📄 License

This project is developed for the Swedish Infrastructure for Ecosystem Science (SITES) research network.

---

**Built with ❤️ for the SITES research community**  
**Version 0.1.0-dev** • **Database: 83 instruments across 9 stations** • **Status: ✅ Active Development**