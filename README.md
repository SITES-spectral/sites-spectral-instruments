# SITES Spectral Stations & Instruments Management System

A comprehensive web-based management system for SITES Spectral monitoring stations and instruments across Sweden. This professional-grade application provides secure, role-based access to manage research infrastructure with an intuitive interface and powerful data management capabilities.

![Version](https://img.shields.io/badge/version-0.4.0-blue.svg)
![Platform](https://img.shields.io/badge/platform-Cloudflare%20Workers-orange.svg)
![Database](https://img.shields.io/badge/database-D1%20SQLite-green.svg)

## 🌟 Features

### 🔐 Authentication & Access Control
- **JWT-based Authentication** with secure token management and refresh
- **Three-tier Access Control**: Public, Station, and Admin roles
- **Role-based Permissions** for granular data access and management
- **Session Management** with automatic token validation and expiration
- **Test Accounts** provided for development and demonstration

### 🗺️ Interactive Mapping System
- **Professional Leaflet.js Integration** with high-resolution satellite imagery
- **Multi-layer Support**: Satellite (Esri ArcGIS), topographic, and OpenStreetMap
- **Custom Markers**: Color-coded station and platform markers with type distinction
- **Rich Popups**: Detailed information panels with direct management links
- **Responsive Design**: Adapts seamlessly to desktop, tablet, and mobile devices
- **Layer Controls**: Easy switching between different map visualizations
- **GeoJSON API**: Standardized geospatial data endpoints for external integration

### 📊 Data Management
- **Dynamic Tables** with inline editing capabilities for real-time updates
- **Hierarchical Structure**: Stations → Platforms → Instruments organization
- **Thematic Program Tracking**: SITES Spectral, ICOS, and Other classifications
- **Priority-based Organization** with automatic sorting and visual indicators
- **Advanced Filtering**: Search and filter by program, status, location, and more
- **Bulk Operations**: Multi-select framework for efficient data management

### 🎨 Professional UI/UX
- **SITES Spectral Branding** with official logos, colors, and visual identity
- **Responsive Design** optimized for all screen sizes and devices
- **Loading States** and comprehensive error handling throughout
- **Toast Notifications** for user feedback and status updates
- **Professional Footer** with version tracking and build information

### 🏗️ Technical Architecture
- **Cloudflare Workers** serverless backend with global edge deployment
- **D1 SQLite Database** with automatic scaling and backup
- **RESTful API** with comprehensive CRUD operations
- **Version Management** with automatic cache busting for reliable deployments
- **Security First** approach with input validation and SQL injection prevention

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Cloudflare     │    │   Database      │
│   (Vanilla JS)  │◄──►│   Workers        │◄──►│   (D1 SQLite)   │
│   + Leaflet.js  │    │   + JWT Auth     │    │   + Migrations  │
└─────────────────┘    └──────────────────┘    └─────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    Data Structure                               │
│  Stations (9) → Platforms (Variable) → Instruments (83)        │
│  • Phenocams (21)     • Multispectral Sensors (62)            │
│  • Program Classification (SITES/ICOS/Other)                   │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** and npm
- **Cloudflare Workers CLI** (`wrangler`)
- **Access to Cloudflare D1** database

### Installation & Setup

1. **Clone and Install Dependencies**
   ```bash
   git clone <repository-url>
   cd spectral-stations-instruments
   npm install
   ```

2. **Database Setup**
   ```bash
   # Create D1 database
   npx wrangler d1 create sites-spectral-db
   
   # Apply all migrations
   npx wrangler d1 migrations apply sites-spectral-db --local
   npx wrangler d1 migrations apply sites-spectral-db --remote
   ```

3. **Configuration**
   ```bash
   # Configure wrangler.toml with your database details
   # Set up environment variables for JWT secrets
   echo "JWT_SECRET=your-secure-random-secret" > .env
   ```

4. **Local Development**
   ```bash
   npm run dev
   ```

5. **Build and Deploy**
   ```bash
   # Build with version management
   npm run build
   
   # Deploy to production
   npm run deploy
   
   # Or bump version and deploy
   npm run deploy:bump
   ```

## 🎯 User Roles & Access

### 👤 User Types

| Role | Access Level | Capabilities |
|------|-------------|-------------|
| **Public** | View Only | Browse stations, view instrument data, use interactive map |
| **Station** | Station Specific | Manage instruments at assigned station, edit data inline |
| **Admin** | Full System | Complete system access, user management, all stations |

### 🔑 Test Accounts (Development)

| Username | Password | Role | Station Access |
|----------|----------|------|---------------|
| `admin` | `admin123` | Administrator | All stations |
| `svartberget` | `svb123` | Station Manager | Svartberget only |
| `skogaryd` | `skc123` | Station Manager | Skogaryd only |
| `lonnstorp` | `lon123` | Station Manager | Lönnstorp only |
| `readonly` | `readonly123` | Read-only | View access only |

## 🗺️ Interactive Map Features

### Map Layers
- **Satellite**: High-resolution imagery (Esri ArcGIS World Imagery)
- **Topographic**: Detailed topographical maps (Esri World Topo)
- **Street Map**: OpenStreetMap for reference and navigation

### Marker System
- **🏢 Station Markers**: Blue broadcast tower icons with station details
- **📡 Platform Markers**: Color-coded by type and program
  - **Tower**: Blue (#0891b2) - Tall structures >1.5m
  - **Mast**: Green (#059669) - Medium height poles  
  - **Building**: Orange (#d97706) - Roof-mounted installations
  - **Ground**: Gray (#64748b) - Ground-level instruments

### Interactive Features
- **Click to Navigate**: Station markers link to management dashboards
- **Detailed Popups**: Rich information panels with instrument counts
- **Program Indicators**: Visual badges showing SITES/ICOS/Other classification
- **Zoom Controls**: Automatic bounds fitting and manual zoom controls

## 🔧 API Documentation

### 🔐 Authentication Endpoints

| Endpoint | Method | Description |
|----------|---------|-------------|
| `/api/auth/login` | POST | User authentication with JWT token generation |
| `/api/auth/verify` | GET | Token validation and user info retrieval |
| `/api/auth/logout` | POST | Session termination and token invalidation |
| `/api/auth/refresh` | POST | JWT token refresh for session extension |

### 📊 Data Management Endpoints

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/stations` | GET | List all research stations with metadata |
| `/api/platforms` | GET, POST, PATCH, DELETE | Platform CRUD operations |
| `/api/phenocams` | GET, PATCH | Phenocam instrument management |
| `/api/mspectral` | GET, PATCH | Multispectral sensor management |
| `/api/search` | GET | Global search across all data types |

### 📈 Statistics & Monitoring

| Endpoint | Description |
|----------|-------------|
| `/api/stats/network` | Network-wide statistics and counts |
| `/api/stats/stations` | Per-station instrument breakdowns |
| `/api/health` | System health and status monitoring |

### 🌍 GeoJSON API Endpoints (v0.4.0)

| Endpoint | Description |
|----------|-------------|
| `/api/geojson/all` | Complete GeoJSON FeatureCollection with both stations and platforms |
| `/api/geojson/stations` | Stations only in GeoJSON format with metadata |
| `/api/geojson/platforms` | Instruments/platforms only in GeoJSON format |

**Query Parameters:**
- `include_instruments=true` - Include detailed instrument data for stations
- Standard GeoJSON format with `[longitude, latitude]` coordinates
- Rich metadata properties for integration with mapping libraries

## 🔄 Version Management & Deployment

### Build System
```bash
# Update version parameters without bumping
npm run build

# Bump patch version and update all references
npm run build:bump

# Deploy with current version
npm run deploy

# Bump version and deploy in one command
npm run deploy:bump
```

### Cache Busting Strategy
- **Query Parameters** on all CSS and JavaScript assets
- **Version Meta Tags** in HTML for deployment tracking
- **Version Manifest** (`public/version-manifest.json`) for verification
- **Footer Display** shows current version to users

## 🛡️ Security Features

### Authentication Security
- **JWT Tokens** with configurable expiration and refresh
- **Password Hashing** using secure algorithms
- **Session Management** with automatic cleanup
- **Role-based Access** with granular permissions

### Data Protection
- **SQL Injection Prevention** through prepared statements
- **XSS Protection** via input sanitization
- **CORS Configuration** for secure cross-origin requests
- **Input Validation** on both client and server sides

## 📱 Responsive Design

The interface adapts seamlessly across all devices:

### Desktop Experience (>1024px)
- **Full Feature Set** with sidebar layouts and comprehensive tables
- **Multi-panel Views** for efficient data management
- **Keyboard Shortcuts** and power-user features

### Tablet Experience (768px - 1024px)
- **Optimized Grid Layouts** for touch interactions
- **Condensed Tables** with horizontal scrolling
- **Touch-friendly Controls** with larger tap targets

### Mobile Experience (<768px)
- **Stack Layouts** for vertical navigation
- **Simplified Interface** focusing on essential functions
- **Thumb-friendly Navigation** with bottom-aligned actions

## 🧪 Development

### Code Structure
```
├── public/                 # Static assets and HTML pages
│   ├── css/               # Stylesheets with responsive design
│   ├── js/                # Client-side JavaScript modules
│   ├── images/            # SITES branding and visual assets
│   └── station/           # Station-specific interfaces
├── src/                   # Server-side Cloudflare Workers code
│   ├── api-handler.js     # RESTful API route handling
│   ├── auth.js           # Authentication and JWT management
│   └── worker.js         # Main Cloudflare Worker entry point
├── migrations/           # Database schema and data migrations
├── scripts/             # Build and deployment automation
└── wrangler.toml        # Cloudflare Workers configuration
```

### Development Commands
```bash
# Local development with hot reloading
npm run dev

# Database management
npm run db:migrate:local    # Apply migrations locally
npm run db:migrate          # Apply migrations to production
npm run db:studio          # Open database browser interface

# Data population (development)
npm run populate:phenocams  # Load phenocam data
npm run populate:mspectral  # Load sensor data
npm run populate:all       # Load all test data
```

## 🌍 SITES Network Integration

This system serves as the central management hub for the **Swedish Infrastructure for Ecosystem Science (SITES) Spectral** monitoring network, supporting:

### Research Stations
- **9 Active Stations** across Sweden's diverse ecosystems
- **Multiple Ecosystems**: Forest, Agricultural, Lake, Wetland, Heath, and more
- **Geographic Coverage** from Abisko in the north to Lönnstorp in the south

### Instrument Network
- **83 Total Instruments** providing continuous environmental monitoring
- **21 Phenocams** capturing visual ecosystem changes
- **62 Multispectral Sensors** measuring detailed spectral characteristics
- **Real-time Data Integration** with SITES data infrastructure

### Program Integration
- **SITES Spectral Priority** with automatic classification and sorting
- **ICOS Compatibility** for international carbon observation cooperation
- **Multi-program Support** for diverse research collaborations

## 🤝 Contributing

This project was developed with assistance from Claude AI for the SITES Spectral research network. The codebase follows professional standards and is designed for maintainability and extensibility.

### Development Guidelines
- **Follow Existing Patterns** for consistency and maintainability
- **Test Thoroughly** before committing changes
- **Update Documentation** for new features and changes  
- **Maintain Responsive Design** across all screen sizes
- **Security First** approach for all user-facing features

## 📄 License

Proprietary software developed for the SITES Spectral research network. All rights reserved.

## 📞 Contact & Support

**Technical Lead**: José Beltrán  
**Email**: jose.beltran@nateko.lu.se  
**Organization**: SITES Spectral, Lund University  
**Network**: [SITES - Swedish Infrastructure for Ecosystem Science](https://www.fieldsites.se/)

**System Status**: Production Ready  
**Last Updated**: September 2025  
**Version**: 0.2.0

---

*This system enables researchers and station managers to efficiently oversee the SITES Spectral monitoring network, ensuring high-quality data collection and equipment maintenance across Sweden's diverse ecosystems.*