# Future Platform Types

> **Status:** Reserved for future implementation
> **Version:** 8.3.2
> **Last Updated:** 2025-11-28

This document describes platform types that are defined in the system but currently disabled pending specification development.

---

## Mobile Platform

**Code:** `mobile`
**Icon:** `fa-truck`
**Status:** Coming Soon

### Description
Mobile platforms support portable instruments that can be carried by various means and may be deployed temporarily at different locations.

### Carrier Types
- **Person** - backpack-mounted instruments
- **Vehicle** - car, truck, ATV-mounted sensors
- **Rover** - autonomous ground vehicles
- **Bicycle** - bike-mounted sensors
- **Tripod** - temporary fixed deployments

### Supported Instruments
- Portable NDVI sensors
- Portable Leaf Area Index (LAI) meters
- Hemispherical/fisheye cameras
- Portable hyperspectral sensors
- Portable LiDAR
- Handheld spectrometers

### Temporal Deployment Use Case
Mobile platforms support **temporal installations** where portable sensors:
- Stay fixed at a location for short periods (days/weeks/months)
- Move between different measurement sites
- Support field campaign measurements

### Future Schema Requirements
- `deployment_period` - start/end dates per location
- `location_history` - track deployment locations over time
- `carrier_type` - type of carrier (person, vehicle, tripod, etc.)
- `current_status` - deployed, in transit, stored
- `campaign_id` - link to field campaign if applicable

### Naming Convention
```
{STATION}_{ECOSYSTEM}_{CARRIER}_{TYPE}{##}
Example: SVB_FOR_BPK_NDVI01 (Svartberget Forest Backpack NDVI sensor 01)
```

---

## USV - Unmanned Surface Vehicle

**Code:** `usv`
**Icon:** `fa-ship`
**Status:** Coming Soon

### Description
Autonomous or remote-controlled boats and surface drones for aquatic measurements.

### Use Cases
- Lake water quality monitoring
- Surface temperature mapping
- Aquatic vegetation surveys
- Bathymetric mapping

### Supported Instruments
- Multispectral cameras
- Thermal cameras
- Water quality sensors
- Sonar/bathymetry sensors
- GPS/RTK positioning

### Future Schema Requirements
- `vessel_type` - boat, kayak, catamaran drone
- `propulsion` - electric, solar, hybrid
- `max_speed` - operational speed limits
- `endurance` - battery/fuel capacity
- `water_body` - lake, river, coastal

### Naming Convention
```
{STATION}_{ECOSYSTEM}_USV{##}
Example: ANS_LAK_USV01 (Abisko Lake USV 01)
```

---

## UUV - Unmanned Underwater Vehicle

**Code:** `uuv`
**Icon:** `fa-water`
**Status:** Coming Soon

### Description
ROVs (Remotely Operated Vehicles) and AUVs (Autonomous Underwater Vehicles) for underwater surveys.

### Use Cases
- Underwater vegetation mapping
- Sediment analysis
- Lake/river bottom surveys
- Submerged infrastructure inspection

### Supported Instruments
- Underwater cameras
- Multibeam sonar
- Side-scan sonar
- Water sampling systems
- Dissolved oxygen sensors
- Temperature/salinity sensors

### Future Schema Requirements
- `vehicle_type` - ROV, AUV
- `max_depth` - operational depth limit
- `tether_length` - for ROVs
- `endurance` - battery capacity
- `navigation_system` - DVL, USBL, INS

### Naming Convention
```
{STATION}_{ECOSYSTEM}_UUV{##}
Example: ANS_LAK_UUV01 (Abisko Lake UUV 01)
```

---

## Implementation Timeline

| Platform | Priority | Dependencies |
|----------|----------|--------------|
| Mobile | High | Instrument specs, temporal tracking schema |
| USV | Medium | Aquatic station requirements |
| UUV | Low | Underwater sensor specifications |

---

## Related Files
- `public/station.html` - Platform type selector (disabled cards)
- `migrations/` - Future schema migrations needed
- `src/handlers/platforms.js` - Platform CRUD handlers
