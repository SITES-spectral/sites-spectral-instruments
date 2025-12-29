# SITES Spectral Vocabulary Mapping

**Version**: 13.26.0
**Last Updated**: 2025-12-29
**Standard Alignment**: Darwin Core, ICOS, ESA Copernicus, SITES

---

## Overview

This document describes how SITES Spectral terminology aligns with international standards for biodiversity data (Darwin Core), carbon observation networks (ICOS), Earth observation systems (ESA Copernicus), and Swedish field station networks (SITES).

### Standards Referenced

| Standard | Organization | Focus | URL |
|----------|--------------|-------|-----|
| **Darwin Core** | TDWG | Biodiversity data exchange | https://dwc.tdwg.org/ |
| **ICOS** | ICOS ERIC | Carbon cycle observation | https://www.icos-cp.eu/ |
| **Copernicus** | ESA/EU | Earth observation | https://dataspace.copernicus.eu/ |
| **SITES** | VR/SLU | Swedish ecosystem science | https://www.fieldsites.se/ |
| **CF Conventions** | UCAR | Climate & Forecast metadata | https://cfconventions.org/ |

---

## Alignment Status Summary

| Concept | SITES Spectral | Standard | Status |
|---------|---------------|----------|--------|
| Processing Levels | L0, L1, L2, L3 | Copernicus (L0/L1C/L2A/L3) | Aligned |
| Coordinates | lat/lon | Darwin Core (decimalLatitude/Longitude) | Aligned |
| Station Network | Multi-site | ICOS (200+ sites) + SITES (9 stations) | Aligned |
| Open Data | CSV/JSON export | ICOS + SITES (CC-BY-4.0) | Aligned |
| Satellite Platform | SVB_ESA_S2A_MSI | Copernicus (Sentinel-2A MSI) | Aligned |
| Ecosystem Codes | FOR, AGR, LAK, etc. | ICOS domains | Aligned |
| Station Types | NEW: TER, ATM, AQA, INT | ICOS domains | V11 Enhanced |
| Mount Types | Extended vocabulary | Copernicus/ICOS | V11 Enhanced |
| Data License | CC-BY-4.0 | ICOS/SITES compatible | V11 Enhanced |

---

## Station Terminology

### Station Type Classification (V11+)

SITES Spectral now includes ICOS-aligned station type classification:

| Project Code | Standard Name | ICOS Domain | Description |
|--------------|---------------|-------------|-------------|
| **TER** | Terrestrial Ecosystem | ecosystem | Land ecosystem monitoring (forests, grasslands, wetlands) |
| **ATM** | Atmospheric | atmosphere | Atmospheric composition monitoring |
| **AQA** | Aquatic | ocean | Lake/river/coastal water monitoring |
| **INT** | Integrated | multiple | Multi-domain observation station |

### SITES Stations Mapping

| Station | Acronym | Station Type | ICOS Class | Ecosystems |
|---------|---------|--------------|------------|------------|
| Abisko | ABK | TER | Class 2 | ALP, FOR, HEA, MIR |
| Asa | ASA | TER | - | FOR, CON |
| Bolmen | BOL | AQA | - | LAK |
| Erken | ERK | AQA | - | LAK |
| Grimso | GRI | TER | - | FOR |
| Lonnstorp | LON | TER | - | AGR |
| Robacksdalen | ROB | TER | - | AGR |
| Skogaryd | SKO | INT | Class 1 | FOR, WET, LAK |
| Svartberget | SVB | INT | Class 1 | FOR, MIR, WET |
| Tarfala | TAR | TER | - | ALP, GLA |

### Darwin Core Location Fields

SITES Spectral stations include Darwin Core location metadata:

| SITES Spectral Field | Darwin Core Term | Definition |
|---------------------|------------------|------------|
| `station_id` | `locationID` | Unique identifier for the location |
| `latitude` | `decimalLatitude` | Geographic latitude in decimal degrees |
| `longitude` | `decimalLongitude` | Geographic longitude in decimal degrees |
| `coordinate_uncertainty_m` | `coordinateUncertaintyInMeters` | Horizontal distance from coordinates |
| `geodetic_datum` | `geodeticDatum` | Spatial reference system (EPSG:4326/WGS84) |
| `country_code` | `countryCode` | ISO 3166-1-alpha-2 country code |
| `state_province` | `stateProvince` | County or region |
| `locality` | `locality` | Human-readable location description |

---

## Platform Terminology

### Mount Type Nomenclature (V11+)

SITES Spectral mount types with ICOS/Copernicus vocabulary mappings. Legacy codes are preserved as primary identifiers:

| Code | Name | Standard Name | ICOS Equivalent | Copernicus Equivalent |
|------|------|---------------|-----------------|----------------------|
| **TWR** | Tower | tower | flux tower | - |
| **BLD** | Building | building | building station | - |
| **GND** | Ground Level | ground | ground station | - |
| **UAV** | UAV Position | aerial | - | airborne campaign |
| **SAT** | Satellite | satellite | - | Sentinel mission |
| **MOB** | Mobile | mobile | mobile station | - |
| **USV** | Surface Vehicle | surface_vehicle | - | marine platform |
| **UUV** | Underwater Vehicle | subsurface | - | underwater platform |

### Platform Type Mapping

| Project Type | Platform Category | Description |
|--------------|-------------------|-------------|
| `fixed` | Permanent installation | Towers, masts, buildings, ground-level |
| `uav` | Aerial platform | Drones (DJI, MicaSense, Parrot) |
| `satellite` | Orbital platform | Sentinel-2, Sentinel-3, Landsat |
| `mobile` | Portable platform | Field campaigns, temporal deployments |
| `usv` | Surface vehicle | Autonomous boats for aquatic surveys |
| `uuv` | Underwater vehicle | ROVs, AUVs for underwater surveys |

---

## Instrument Terminology

### Measurement Objectives (ICOS Alignment)

SITES Spectral instruments mapped to ICOS measurement objectives:

| Measurement Objective | Instruments | ICOS Variable | Copernicus Service |
|-----------------------|-------------|---------------|-------------------|
| **vegetation_health** | Phenocam, Multispectral, NDVI, PRI | Ecosystem flux | Land Monitoring |
| **radiation_balance** | PAR, Pyranometer, Net Radiometer | Radiation | - |
| **atmospheric_composition** | CO2 sensor, CH4 sensor | CO2/CH4 mole fraction | Atmosphere |
| **structural_characterization** | LiDAR, Hyperspectral | - | Land Monitoring |
| **water_quality** | Fluorometer, Turbidity, Chlorophyll | Ocean carbon | Marine |
| **snow_ice** | Albedometer, Temperature | Cryosphere | Climate |

### Instrument Type Codes

> **Source of Truth (v13.26.0+)**: `yamls/instruments/instrument-types.yaml`
> Instrument types are defined in YAML and generated to JavaScript at build time.

| Code | Full Name | Category | Platforms | Primary Products |
|------|-----------|----------|-----------|------------------|
| PHE | Phenocam | imaging | fixed, uav | GCC, RCC, BCC, GRVI |
| MS | Multispectral Sensor | spectral | fixed, uav, satellite | NDVI, EVI, NDWI |
| RGB | RGB Camera | imaging | uav | Orthomosaics, RGB imagery |
| PAR | PAR Sensor | radiation | fixed | PPFD, DLI |
| NDVI | NDVI Sensor | spectral | fixed | NDVI, SR |
| PRI | PRI Sensor | spectral | fixed | PRI, LUE |
| HYP | Hyperspectral Sensor | spectral | fixed, uav, satellite | Full spectrum |
| TIR | Thermal Camera | thermal | fixed, uav, satellite | LST, ET |
| LID | LiDAR | structural | uav, satellite | 3D structure, LAI |
| SAR | Radar (SAR) | microwave | satellite | Backscatter, InSAR |

---

## Processing Levels

### Copernicus Alignment

| SITES Spectral | Copernicus | Description |
|----------------|------------|-------------|
| **L0** | Level-0 | Raw sensor data, unprocessed |
| **L1** | Level-1C | Radiometrically calibrated, georeferenced |
| **L2** | Level-2A | Atmospherically corrected, surface reflectance |
| **L3** | Level-3 | Spatially/temporally composited products |

### Processing Level Definitions

```yaml
processing_levels:
  L0:
    name: "Level 0 - Raw Data"
    description: "Unprocessed sensor output with metadata"
    copernicus: "Level-0"
    operations: []

  L1:
    name: "Level 1 - Calibrated"
    description: "Radiometrically calibrated, quality flagged"
    copernicus: "Level-1C"
    operations:
      - radiometric_calibration
      - geometric_correction
      - quality_flagging

  L2:
    name: "Level 2 - Surface"
    description: "Atmospherically corrected, surface properties"
    copernicus: "Level-2A"
    operations:
      - atmospheric_correction
      - surface_reflectance
      - index_calculation

  L3:
    name: "Level 3 - Composite"
    description: "Temporally aggregated, gap-filled products"
    copernicus: "Level-3"
    operations:
      - temporal_compositing
      - gap_filling
      - trend_analysis
```

---

## Data License

### CC-BY-4.0 Compatibility

All SITES Spectral data is released under Creative Commons Attribution 4.0 International (CC-BY-4.0), ensuring compatibility with:

- **ICOS Data**: CC-BY-4.0 licensed atmospheric and ecosystem data
- **SITES Data**: CC-BY-4.0 licensed field station data
- **Copernicus Data**: Free and open access policy

### License Metadata Fields

| Field | Value | Standard |
|-------|-------|----------|
| `data_license` | `CC-BY-4.0` | dcterms:license |
| `license_url` | `https://creativecommons.org/licenses/by/4.0/` | dcterms:license |
| `rights_holder` | `SITES Spectral / Lund University` | dcterms:rightsHolder |
| `access_rights` | `open` | dcterms:accessRights |

### Attribution Requirements

When using SITES Spectral data, please cite:

```
SITES Spectral (2025). [Dataset Name]. Swedish Infrastructure for Ecosystem Science.
Available at: https://www.fieldsites.se/. License: CC-BY-4.0.
```

---

## Ecosystem Codes

### SITES Spectral Ecosystem Classification

| Code | Name | ICOS Domain | IGBP Class | Description |
|------|------|-------------|------------|-------------|
| **FOR** | Forest | ecosystem | Mixed Forest | Generic forest ecosystem |
| **CON** | Coniferous Forest | ecosystem | ENF | Evergreen needleleaf forest |
| **DEC** | Deciduous Forest | ecosystem | DBF | Deciduous broadleaf forest |
| **AGR** | Arable Land | ecosystem | CRO | Croplands, agricultural fields |
| **GRA** | Grassland | ecosystem | GRA | Natural and managed grasslands |
| **HEA** | Heathland | ecosystem | OSH | Open shrublands |
| **MIR** | Mires | ecosystem | WET | Peatlands, bogs |
| **PEA** | Peatland | ecosystem | WET | Organic soil wetlands |
| **WET** | Wetland | ecosystem | WET | General wetland areas |
| **MAR** | Marshland | ecosystem | WET | Emergent herbaceous wetlands |
| **LAK** | Lake | ocean | WAT | Freshwater lakes |
| **ALP** | Alpine | ecosystem | - | Above treeline ecosystems |

### IGBP Land Cover Classes Reference

SITES Spectral ecosystem codes can be mapped to IGBP (International Geosphere-Biosphere Programme) land cover classes used in satellite products:

| IGBP Class | Code | Description |
|------------|------|-------------|
| ENF | 1 | Evergreen Needleleaf Forests |
| EBF | 2 | Evergreen Broadleaf Forests |
| DNF | 3 | Deciduous Needleleaf Forests |
| DBF | 4 | Deciduous Broadleaf Forests |
| MF | 5 | Mixed Forests |
| CSH | 6 | Closed Shrublands |
| OSH | 7 | Open Shrublands |
| WSA | 8 | Woody Savannas |
| SAV | 9 | Savannas |
| GRA | 10 | Grasslands |
| WET | 11 | Permanent Wetlands |
| CRO | 12 | Croplands |
| URB | 13 | Urban and Built-up Lands |
| CNV | 14 | Cropland/Natural Vegetation Mosaics |
| SNO | 15 | Permanent Snow and Ice |
| BAR | 16 | Barren |
| WAT | 17 | Water Bodies |

---

## Vegetation Indices

### Standard Index Definitions

All vegetation indices follow standard scientific definitions:

| Index | Formula | Range | Reference |
|-------|---------|-------|-----------|
| **NDVI** | (NIR - Red) / (NIR + Red) | [-1, 1] | Rouse et al., 1974 |
| **GCC** | Green / (Red + Green + Blue) | [0, 1] | Richardson et al., 2007 |
| **RCC** | Red / (Red + Green + Blue) | [0, 1] | - |
| **BCC** | Blue / (Red + Green + Blue) | [0, 1] | - |
| **EVI** | 2.5 * (NIR - Red) / (NIR + 6*Red - 7.5*Blue + 1) | [-1, 1] | Huete et al., 2002 |
| **PRI** | (531nm - 570nm) / (531nm + 570nm) | [-1, 1] | Gamon et al., 1992 |
| **NDWI** | (Green - NIR) / (Green + NIR) | [-1, 1] | McFeeters, 1996 |
| **GRVI** | (Green - Red) / (Green + Red) | [-1, 1] | - |

### Storage and Rescaling

SITES Spectral stores indices in 8-bit format (0-255) for efficiency. The `IndexRescaler` module provides automatic conversion to scientific ranges:

```python
# Rescaling formulas
NDVI_scientific = (NDVI_stored / 255) * 2 - 1  # [-1, 1]
GCC_scientific = GCC_stored / 255              # [0, 1]
```

---

## API Response Format

### Standard Vocabulary in Responses

V11 API responses include both project-specific codes and standard vocabulary terms:

```json
{
  "station": {
    "acronym": "SVB",
    "display_name": "Svartberget Research Station",
    "station_type": "INT",
    "station_type_standard": "integrated",
    "icos_class": "Class 1",
    "darwin_core": {
      "locationID": "urn:sites:station:SVB",
      "decimalLatitude": 64.256,
      "decimalLongitude": 19.774,
      "geodeticDatum": "EPSG:4326",
      "countryCode": "SE",
      "stateProvince": "Vasterbotten"
    }
  },
  "platform": {
    "normalized_name": "SVB_FOR_TWR01",
    "mount_type_code": "TWR",
    "mount_type_standard": "tower",
    "icos_equivalent": "flux_tower"
  },
  "instrument": {
    "normalized_name": "SVB_FOR_TWR01_PHE01",
    "instrument_type": "Phenocam",
    "measurement_objective": "vegetation_health"
  }
}
```

---

## Export Formats

### Darwin Core Archive (DwC-A)

SITES Spectral supports Darwin Core Archive export for GBIF integration:

```
dwca-export/
├── meta.xml           # Archive descriptor
├── eml.xml            # Dataset metadata (EML)
├── occurrence.csv     # Observation records
└── event.csv          # Sampling events
```

### ISO 19115 Metadata

Geospatial metadata follows ISO 19115 standards for:
- Geographic extent (bounding box)
- Temporal extent (date range)
- Data quality information
- Lineage/provenance

---

## References

### External Standards

1. **Darwin Core**: https://dwc.tdwg.org/list/
2. **ICOS Carbon Portal**: https://www.icos-cp.eu/
3. **CPMETA Ontology**: https://ecoportal.lifewatch.eu/ontologies/CPMETA
4. **SITES Field Stations**: https://www.fieldsites.se/
5. **Copernicus Data Space**: https://dataspace.copernicus.eu/
6. **CF Conventions**: https://cfconventions.org/
7. **IGBP Land Cover**: https://www.usgs.gov/programs/climate-adaptation-science-centers/science/modis-land-cover

### YAML Configuration Files

Vocabulary mappings are maintained in YAML configuration files:

- `yamls/core/station-types.yaml` - ICOS-aligned station classification
- `yamls/core/mount-types-extended.yaml` - Standard vocabulary mount types
- `yamls/core/measurement-objectives.yaml` - ICOS measurement variables
- `yamls/core/vocabulary-mappings.yaml` - External standard term mappings

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 11.0.0 | 2025-12-08 | Initial vocabulary mapping documentation |
| - | - | Added station type classification (TER, ATM, AQA, INT) |
| - | - | Added extended mount type vocabulary |
| - | - | Added Darwin Core location fields |
| - | - | Added ICOS measurement objectives |
| - | - | Added CC-BY-4.0 license metadata |
