# Quick Reference Guide

> **Version**: 15.6.11
> **Last Updated**: 2026-02-16

## Platform Types

| Type | Code | Icon | Status | Description |
|------|------|------|--------|-------------|
| Fixed | `fixed` | `fa-tower-observation` | Active | Towers, masts, permanent installations |
| UAV | `uav` | `fa-crosshairs` | Active | Drones with auto-instrument creation |
| Satellite | `satellite` | `fa-satellite` | Active | Earth observation platforms |
| Mobile | `mobile` | `fa-truck` | Coming Soon | Portable sensors, temporal deployments |
| USV | `usv` | `fa-ship` | Coming Soon | Surface vehicles for aquatic surveys |
| UUV | `uuv` | `fa-water` | Coming Soon | Underwater vehicles |

### UAV Auto-Instrument Creation

When creating UAV platforms, instruments are auto-created:

| Vendor | Models | Type |
|--------|--------|------|
| DJI | M3M, P4M, M30T, M300, M350 | Multispectral/RGB/Thermal |
| MicaSense | RedEdge-MX, Altum-PT | Multispectral |
| Parrot | Sequoia+ | Multispectral |
| Headwall | Nano-Hyperspec | Hyperspectral |

---

## Instrument Types

| Code | Type | Platforms | Key Fields |
|------|------|-----------|------------|
| PHE | Phenocam | fixed | camera_brand, camera_model, resolution, interval |
| MS | Multispectral | fixed, uav, satellite | number_of_channels, orientation |
| RGB | RGB Camera | uav | resolution, focal_length |
| PAR | PAR Sensor | fixed | spectral_range, calibration_coefficient |
| NDVI | NDVI Sensor | fixed | red_wavelength_nm, nir_wavelength_nm |
| PRI | PRI Sensor | fixed | band1_wavelength_nm, band2_wavelength_nm |
| HYP | Hyperspectral | fixed, uav, satellite | spectral_range, spectral_resolution_nm |
| TIR | Thermal | fixed, uav, satellite | temperature_range, sensitivity |
| LID | LiDAR | uav, satellite | scan_rate, range |
| SAR | Radar (SAR) | satellite | frequency_band, polarization |

---

## Naming Conventions

### Entity Naming

| Entity | Format | Example |
|--------|--------|---------|
| Station | `{ACRONYM}` | SVB, ANS, LON, GRI |
| Platform (Fixed) | `{STATION}_{ECOSYSTEM}_{MOUNT_TYPE}{##}` | SVB_FOR_TWR01 |
| Platform (UAV) | `{STATION}_{VENDOR}_{MODEL}_UAV{##}` | SVB_DJI_M3M_UAV01 |
| Platform (Satellite) | `{STATION}_{AGENCY}_{SATELLITE}_SAT{##}` | SVB_ESA_S2A_SAT01 |
| Instrument | `{PLATFORM}_{TYPE}{##}` | SVB_FOR_TWR01_PHE01 |
| ROI | `ROI_{##}` | ROI_01, ROI_02 |

### Mount Type Codes (v12.0.0+)

| Code | Name | Description | Platform Types |
|------|------|-------------|----------------|
| **TWR** | Tower/Mast | Elevated structures (>1.5m) | fixed |
| **BLD** | Building | Rooftop or facade mounted | fixed |
| **GND** | Ground Level | Below 1.5m height | fixed |
| **UAV** | UAV Position | Drone flight position | uav |
| **SAT** | Satellite | Virtual position | satellite |
| **MOB** | Mobile | Portable platform | mobile |
| **USV** | Surface Vehicle | Unmanned surface vehicle | usv |
| **UUV** | Underwater Vehicle | Unmanned underwater | uuv |

### Ecosystem Codes (12 Types)

| Code | Ecosystem | Code | Ecosystem |
|------|-----------|------|-----------|
| FOR | Forest | GRA | Grassland |
| AGR | Arable Land | HEA | Heathland |
| MIR | Mires | ALP | Alpine Forest |
| LAK | Lake | CON | Coniferous Forest |
| WET | Wetland | DEC | Deciduous Forest |
| MAR | Marshland | PEA | Peatland |

---

## User Roles

| Role | Access Level | Permissions |
|------|--------------|-------------|
| `admin` | Global | Full CRUD on all stations |
| `sites-admin` | Global | Full CRUD on all stations |
| `station-admin` | Station-specific | CRUD on assigned station |
| `station` | Station-specific | Read-only on assigned station |
| `uav-pilot` | Multi-station | Flight logging, read access |
| `station-internal` | Station-specific | Read-only via magic link |
| `readonly` | Global | Read-only on all stations |

---

## API Endpoints

### Version Aliases

| Alias | Resolves To | Status |
|-------|-------------|--------|
| `/api/latest` | V11 | Recommended |
| `/api/stable` | V11 | Production |
| `/api/current` | V11 | Production |
| `/api/v11` | V11 | Primary |
| `/api/v10` | V10 | Legacy |
| `/api/v3` | V11 | Backward compat |

### Core Endpoints

```
GET    /api/latest/stations
GET    /api/latest/stations/{acronym}
GET    /api/latest/stations/{acronym}/platforms
GET    /api/latest/platforms/{id}
GET    /api/latest/platforms/{id}/instruments
GET    /api/latest/instruments/{id}
GET    /api/latest/instruments/{id}/rois
```

### Authentication

```
POST   /api/auth/login
GET    /api/auth/verify
POST   /api/auth/logout
POST   /api/magic-links/request
GET    /api/magic-links/verify/{token}
```

---

## SITES Stations (9 Active)

| Station | Acronym | Type | Location |
|---------|---------|------|----------|
| Abisko | ANS | Terrestrial | Northern Sweden |
| Asa | ASA | Terrestrial | Southern Sweden |
| Bolmen | BOL | Aquatic | Southern Sweden |
| Erken | ERK | Aquatic | Central Sweden |
| Grimso | GRI | Terrestrial | Central Sweden |
| Lonnstorp | LON | Agricultural | Southern Sweden |
| Robacksdalen | ROB | Agricultural | Northern Sweden |
| Skogaryd | SKO | Terrestrial | Western Sweden |
| Svartberget | SVB | Terrestrial | Northern Sweden |
| Alnarp | ALN | Agricultural | Southern Sweden |
| Hyltemossa | HYL | Terrestrial | Southern Sweden |

---

## Development Commands

```bash
# Development
npm run dev                 # Start local server
npm run build              # Build application
npm run deploy             # Deploy to production

# Database
npm run db:migrate         # Apply migrations (remote)
npm run db:migrate:local   # Apply migrations (local)
npm run db:studio          # Database studio

# Testing
npm test                   # Run all tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
```

---

## Related Documentation

- [Development Guide](./developer/DEVELOPMENT_GUIDE.md)
- [API Reference](./API_REFERENCE.md)
- [Database Schema](./DATABASE_SCHEMA.md)
- [Security Architecture](./security/SECURITY_ARCHITECTURE.md)
