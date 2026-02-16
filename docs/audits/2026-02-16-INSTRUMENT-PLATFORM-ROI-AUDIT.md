# SITES Spectral Instruments & Platforms Audit Report

**Date:** 2026-02-16
**Auditor:** Claude Code
**Database:** Cloudflare D1 `spectral_stations_db` (29a77ad6-c5ff-4088-af08-478df12159b4)
**Legacy Reference:** `yamls/stations_latest_production.yaml`

---

## Executive Summary

| Category | Production DB | Legacy YAML | Gap | Status |
|----------|--------------|-------------|-----|--------|
| **Stations** | **12** | 11 | **+1** (NOR added) | **COMPLETE** |
| **Platforms** | **30** | 43 | -13 (planned only) | **+8 FIXED** |
| **Instruments** | **29** | 48 | -19 (planned only) | **+4 FIXED** |
| **ROIs** | **40** | 45+ | -5 (pending ROI_00 definitions) | **FIXED** |
| **UAV Platforms** | **1** | 1 | 0 | **FIXED** |
| **Satellite Platforms** | **1** | 1 | 0 | **FIXED** |
| **UAV Pilots** | 0 | - | Empty | Data entry needed |
| **UAV Missions** | 0 | - | Empty | Data entry needed |
| **UAV Batteries** | 0 | - | Empty | Data entry needed |

### Issues Status (Updated 2026-02-16)

1. **✅ RESOLVED: ROIs Migrated** - 40 ROI definitions migrated to production DB (migration 0048)
2. **✅ RESOLVED: SVB Platforms Added** - 3 new platforms added (SVB_FOR_TWR02, SVB_FOR_TWR03, SVB_MIR_TWR04)
3. **✅ RESOLVED: SVB Instrument Added** - SVB_FOR_TWR02_PHE01 added to production
4. **✅ RESOLVED: Guest Stations Added** - ALN (Alnarp), HYL (Hyltemossa), NOR (Norunda) added (migration 0049)
5. **✅ RESOLVED: UAV Platform Added** - ALN_DJI_M3M_UAV01 with MS01 and RGB01 instruments
6. **✅ RESOLVED: Satellite Platform Added** - ALN_ESA_S2A_SAT01 with MSI01 instrument
7. **🟡 LOW: Planned Platforms** - Some planned platforms still only in YAML (can be added as needed)

---

## Detailed Station Comparison

### Stations in Production Database

| Acronym | Display Name | Status | SITES | ICOS | Platforms | Instruments |
|---------|--------------|--------|-------|------|-----------|-------------|
| ANS | Abisko | Active | ✓ | - | 1 | 1 |
| ASA | Asa | Active | ✓ | - | 2 | 2 |
| BOL | Bolmen Research Station | Active | ✓ | - | 1 | 1 |
| ERK | Erken Laboratory | Active | ✓ | - | 1 | 1 |
| GRI | Grimsö | Active | ✓ | - | 1 | 1 |
| LON | Lönnstorp | Active | ✓ | - | 1 | 3 |
| RBD | Röbäcksdalen | Active | ✓ | - | 2 | 2 |
| SKC | Skogaryd | Active | ✓ | - | 9 | 10 |
| SVB | Svartberget | Active | ✓ | - | 4 | 5 |

### Missing Stations (In YAML, Not in DB)

| Acronym | Display Name | Status | SITES | ICOS | Platforms | Instruments | Notes |
|---------|--------------|--------|-------|------|-----------|-------------|-------|
| **ALN** | Alnarp | Active | ✓ | - | 5 | 5 | New station with UAV/Satellite |
| **HYL** | Hyltemossa | Active | ✓ | Class 1 | 2 | 0 | ICOS Class 1 station |

---

## Platform Comparison by Station

### ANS (Abisko)

| Platform | DB Status | Legacy YAML | Notes |
|----------|-----------|-------------|-------|
| ANS_FOR_BLD01 | ✓ Active | ANS_FOR_BL01 | Name normalized (BL→BLD) |
| ANS_SBF_FOR_PL01 | ✗ Missing | Planned | Legacy planned platform |
| ANS_MJH_PL01 | ✗ Missing | Planned | Legacy planned platform |

**Instruments in DB:**
- ANS_FOR_BLD01_PHE01 (Active, Nikon D300S DSLR)
  - Legacy: ANS_FOR_BL01_PHE01, ANS_FOR_BL01_PHE02

**Missing Instruments:**
- ANS_SBF_FOR_PL01_PHE01 (Planned)
- ANS_MJH_PL01_PHE01 (Planned)

---

### ASA (Asa)

| Platform | DB Status | Legacy YAML | Notes |
|----------|-----------|-------------|-------|
| ASA_FOR_TWR01 | ✓ Decommissioned | ASA_FOR_PL01 | Name normalized |
| ASA_FOR_TWR02 | ✓ Testing | ASA_NYB_FOR_PL02 | New testing platform |

**Instruments in DB:**
- ASA_FOR_TWR01_PHE01 (Active, Mobotix M25)
- ASA_FOR_TWR02_PHE01 (Testing, Mobotix M25)

---

### BOL (Bolmen)

| Platform | DB Status | Legacy YAML | Notes |
|----------|-----------|-------------|-------|
| BOL_FOR_TWR01 | ✓ Planned | BOL_FOR_PL01 | Name normalized |

**Instruments in DB:**
- BOL_FOR_TWR01_PHE01 (Planned)

---

### ERK (Erken)

| Platform | DB Status | Legacy YAML | Notes |
|----------|-----------|-------------|-------|
| ERK_LAK_TWR01 | ✓ Planned | ERK_LAK_PL01 | Name normalized |

**Instruments in DB:**
- ERK_LAK_TWR01_PHE01 (Planned)

---

### GRI (Grimsö)

| Platform | DB Status | Legacy YAML | Notes |
|----------|-----------|-------------|-------|
| GRI_FOR_BLD01 | ✓ Active | GRI_FOR_BL01 | Name normalized (BL→BLD) |

**Instruments in DB:**
- GRI_FOR_BLD01_PHE01 (Active, Mobotix M15)

---

### LON (Lönnstorp)

| Platform | DB Status | Legacy YAML | Notes |
|----------|-----------|-------------|-------|
| LON_AGR_TWR01 | ✓ Active | LON_AGR_PL01 | Name normalized |
| LON_AGR_PL02 | ✗ Missing | Planned | Legacy planned platform |

**Instruments in DB:**
- LON_AGR_TWR01_PHE01 (Active, Mobotix M16)
- LON_AGR_TWR01_PHE02 (Active, Mobotix M15)
- LON_AGR_TWR01_PHE03 (Active, Mobotix M15)

**Missing Instruments:**
- LON_AGR_PL02_PHE01 (Planned)

---

### RBD (Röbäcksdalen)

| Platform | DB Status | Legacy YAML | Notes |
|----------|-----------|-------------|-------|
| RBD_AGR_TWR01 | ✓ Active | RBD_AGR_PL01 | Name normalized |
| RBD_AGR_TWR02 | ✓ Active | RBD_AGR_PL02 | Name normalized |
| RBD_AGR_PL03 | ✗ Missing | Planned | Legacy planned platform |

**Instruments in DB:**
- RBD_AGR_TWR01_PHE01 (Active, Mobotix M15)
- RBD_AGR_TWR02_PHE01 (Active, Mobotix M15)

**Missing Instruments:**
- RBD_AGR_PL03_PHE01 (Planned)

---

### SKC (Skogaryd)

| Platform | DB Status | Legacy YAML | Notes |
|----------|-----------|-------------|-------|
| SKC_CEM_FOR_TWR01 | ✓ Active | SKC_CEM_FOR_PL01 | Name normalized |
| SKC_CEM_FOR_TWR02 | ✓ Active | SKC_CEM_FOR_PL02 | Name normalized |
| SKC_CEM_FOR_TWR03 | ✓ Active | SKC_CEM_FOR_PL03 | Name normalized |
| SKC_LAK_TWR01 | ✓ Active | SKC_LAK_PL01 | Name normalized |
| SKC_MAD_FOR_TWR02 | ✓ Active | SKC_MAD_FOR_PL02 | Name normalized |
| SKC_MAD_WET_TWR01 | ✓ Active | SKC_MAD_WET_PL01 | Name normalized |
| SKC_SRC_FOL_WET_TWR01 | ✓ Active | SKC_SRC_FOL_WET_PL01 | Name normalized |
| SKC_SRC_FOL_WET_TWR02 | ✓ Active | SKC_SRC_FOL_WET_PL02 | Name normalized |
| STM_FOR_TWR01 | ✓ Active | STM_FOR_PL01 | Name normalized |
| SKC_III_FOL_PL01 | ✗ Missing | Planned | Legacy planned |
| SKC_III_FOR_PL01 | ✗ Missing | Planned | Legacy planned |
| SKC_III_MIR_PL01 | ✗ Missing | Planned | Legacy planned |

**Instruments in DB (10):**
- SKC_CEM_FOR_TWR01_PHE01 (Active, Mobotix M25)
- SKC_CEM_FOR_TWR02_PHE01 (Active, Mobotix M25)
- SKC_CEM_FOR_TWR03_PHE01 (Active, Mobotix M25)
- SKC_LAK_TWR01_PHE01 (Active, Mobotix M25)
- SKC_MAD_FOR_TWR02_PHE01 (Active, Mobotix M16)
- SKC_MAD_WET_TWR01_PHE01 (Active, Mobotix M16)
- SKC_SRC_FOL_WET_TWR01_PHE01 (Active, Mobotix M16)
- SKC_SRC_FOL_WET_TWR02_PHE01 (Active, Mobotix M16)
- STM_FOR_TWR01_PHE01 (Active, Mobotix M16)

---

### SVB (Svartberget)

| Platform | DB Status | Legacy YAML | Notes |
|----------|-----------|-------------|-------|
| SVB_FOR_TWR01 | ✓ Active | SVB_FOR_PL01 | Name normalized |
| SVB_MIR_TWR01 | ✓ Active | SVB_MIR_PL01 | Name normalized |
| SVB_MIR_TWR02 | ✓ Active | SVB_MIR_PL02 | Name normalized |
| SVB_MIR_TWR03 | ✓ Active | SVB_MIR_PL03 | Name normalized |
| SVB_FOR_PL02 | ✗ Missing | Active | **MISSING: Below canopy platform** |
| SVB_FOR_PL03 | ✗ Missing | Active | **MISSING: Below Canopy CPEC** |
| SVB_MIR_PL04 | ✗ Missing | Active | **MISSING: Degerö wet PAR pole** |

**Instruments in DB (5):**
- SVB_FOR_TWR01_PHE01 (Inactive, Mobotix M15)
- SVB_FOR_TWR01_PHE02 (Active, Mobotix M25)
- SVB_MIR_TWR01_PHE01 (Active, Mobotix M15)
- SVB_MIR_TWR02_PHE01 (Active, Mobotix M15)
- SVB_MIR_TWR03_PHE01 (Active, Mobotix M15)

**Missing Active Instruments:**
- SVB_FOR_PL02_PHE01 (Active - Below canopy phenocam)

---

### ALN (Alnarp) - **COMPLETELY MISSING**

This entire station is defined in legacy YAML but not in production DB.

| Platform | Type | Status | Instruments |
|----------|------|--------|-------------|
| ALN_AGR_TWR01 | Fixed Tower | Planned | PHE01, MS01 |
| ALN_DJI_M3M_UAV01 | **UAV** | Active | MS01, RGB01 |
| ALN_AGR_TWR02 | Fixed Tower | Planned | (none) |
| ALN_AGR_TWR03 | Fixed Tower | Planned | (none) |
| ALN_ESA_S2A_SAT01 | **Satellite** | Active | MSI01 |

---

### HYL (Hyltemossa) - **COMPLETELY MISSING**

This ICOS Class 1 station is defined in legacy YAML but not in production DB.

| Platform | Type | Status | Instruments |
|----------|------|--------|-------------|
| HYL_FOR_TWR01 | Fixed Tower | Planned | (none) |
| HYL_FOR_TWR02 | Fixed Tower | Planned | (none) |

---

## ROI Status - **CRITICAL GAP**

### Production Database
```
Total ROIs: 0
```

### Legacy YAML ROIs (Sample)

| Instrument | ROIs | Has ROI_00 | Additional ROIs |
|------------|------|------------|-----------------|
| ANS_FOR_BL01_PHE01 | 4 | ✓ | ROI_01, ROI_02, ROI_03 |
| ASA_FOR_PL01_PHE01 | 1 | ✓ | - |
| ASA_NYB_FOR_PL02_PHE01 | 1 | ✓ | - |
| GRI_FOR_BL01_PHE01 | 2 | ✓ | ROI_01 |
| LON_AGR_PL01_PHE01 | 5 | ✓ | ROI_01, ROI_02, ROI_03, ROI_06 |
| LON_AGR_PL01_PHE02 | 5 | ✓ | ROI_01, ROI_02, ROI_03, ROI_04 |
| LON_AGR_PL01_PHE03 | 2 | ✓ | ROI_01 |
| RBD_AGR_PL01_PHE01 | 2 | ✓ | ROI_01 |
| RBD_AGR_PL02_PHE01 | 2 | ✓ | ROI_01 |
| SKC_CEM_FOR_PL01_PHE01 | 3 | ✓ | ROI_01, ROI_02 |
| SKC_CEM_FOR_PL02_PHE01 | 2 | ✓ | ROI_01 |
| SKC_CEM_FOR_PL03_PHE01 | 2 | ✓ | ROI_01 |
| SKC_LAK_PL01_PHE01 | 2 | - | ROI_01, ROI_02 |
| SKC_MAD_WET_PL01_PHE01 | 1 | ✓ | - |
| SKC_MAD_FOR_PL02_PHE01 | 1 | ✓ | - |
| SVB_MIR_PL01_PHE01 | 1 | ✓ | - |
| SVB_FOR_PL01_PHE02 | 2 | ✓ | ROI_01 |
| SVB_MIR_PL02_PHE01 | 1 | - | ROI_01 |
| SVB_MIR_PL03_PHE01 | 1 | - | ROI_01 |

**Estimated total ROIs in YAML: 45+**

---

## UAV & Satellite Status

### UAV Tables (All Empty)

| Table | Records |
|-------|---------|
| uav_pilots | 0 |
| uav_missions | 0 |
| uav_batteries | 0 |
| uav_flight_logs | 0 |

### Missing UAV Platforms

| Platform | Station | Status | Instruments |
|----------|---------|--------|-------------|
| ALN_DJI_M3M_UAV01 | ALN | Active | MS01, RGB01 |

### Missing Satellite Platforms

| Platform | Station | Status | Instruments |
|----------|---------|--------|-------------|
| ALN_ESA_S2A_SAT01 | ALN | Active | MSI01 |

---

## R2 Storage Status

| Bucket | Status |
|--------|--------|
| sites-spectral-docs | ✓ Active (Created: 2026-01-23) |

---

## Platform Naming Convention Changes

The production database uses a normalized naming convention with mount type codes:

| Legacy Pattern | Production Pattern | Example |
|----------------|-------------------|---------|
| `{STA}_{ECO}_PL{##}` | `{STA}_{ECO}_TWR{##}` | LON_AGR_PL01 → LON_AGR_TWR01 |
| `{STA}_{ECO}_BL{##}` | `{STA}_{ECO}_BLD{##}` | ANS_FOR_BL01 → ANS_FOR_BLD01 |
| `{STA}_{ECO}_HE{##}` | `{STA}_{ECO}_TWR{##}` | (Heath to Tower) |

### Mount Type Codes

| Code | Full Name | Legacy Equivalent |
|------|-----------|-------------------|
| TWR | Tower/Mast | PL, most platforms |
| BLD | Building | BL |
| GND | Ground Level | - |
| UAV | UAV Position | UAV |
| SAT | Satellite | SAT |
| MOB | Mobile | - |

---

## Recommended Actions

### Priority 1 - CRITICAL (Immediate)

1. **Migrate ROIs to Production Database**
   - Parse ROI definitions from legacy YAML
   - Insert into `instrument_rois` table
   - Validate point coordinates and metadata

2. **Add Missing Active Platforms (SVB)**
   - SVB_FOR_PL02 (Below canopy platform)
   - SVB_FOR_PL03 (Below Canopy CPEC)
   - SVB_MIR_PL04 (Degerö wet PAR pole)
   - SVB_FOR_PL02_PHE01 (Below canopy phenocam)

### Priority 2 - HIGH

3. **Add Alnarp (ALN) Station**
   - Station record
   - 5 platforms (including UAV and Satellite)
   - 5 instruments

4. **Add Hyltemossa (HYL) Station**
   - Station record (ICOS Class 1)
   - 2 platforms

5. **Populate UAV Tables**
   - Add pilot records
   - Configure UAV platforms

### Priority 3 - MEDIUM

6. **Add Planned Platforms**
   - ANS_SBF_FOR_PL01, ANS_MJH_PL01
   - LON_AGR_PL02
   - RBD_AGR_PL03
   - SKC_III_* platforms

7. **Verify Instrument Metadata**
   - Camera specifications consistency
   - Coordinate validation

### Priority 4 - LOW

8. **Documentation Update**
   - Update DATABASE_SCHEMA.md
   - Update API documentation

---

## Migration Scripts Needed

```bash
# 1. ROI Migration
phenocams db migrate-rois --from-yaml yamls/stations_latest_production.yaml

# 2. Station Migration
wrangler d1 execute spectral_stations_db --file migrations/add_aln_hyl_stations.sql

# 3. Platform Migration
wrangler d1 execute spectral_stations_db --file migrations/add_missing_platforms.sql

# 4. Instrument Migration
wrangler d1 execute spectral_stations_db --file migrations/add_missing_instruments.sql
```

---

## Appendix A: Database Schema Summary

| Table | Records | Key Columns |
|-------|---------|-------------|
| stations | 9 | acronym, display_name, status, sites_member, icos_member |
| platforms | 22 | station_id, normalized_name, mount_type_code, status |
| instruments | 25 | platform_id, normalized_name, instrument_type, status |
| instrument_rois | 0 | instrument_id, roi_name, points_json |
| uav_pilots | 0 | - |
| uav_missions | 0 | - |
| uav_batteries | 0 | - |

---

## Appendix B: Full Production Platform List

```
ANS: ANS_FOR_BLD01 (Active)
ASA: ASA_FOR_TWR01 (Decommissioned), ASA_FOR_TWR02 (Testing)
BOL: BOL_FOR_TWR01 (Planned)
ERK: ERK_LAK_TWR01 (Planned)
GRI: GRI_FOR_BLD01 (Active)
LON: LON_AGR_TWR01 (Active)
RBD: RBD_AGR_TWR01 (Active), RBD_AGR_TWR02 (Active)
SKC: SKC_CEM_FOR_TWR01 (Active), SKC_CEM_FOR_TWR02 (Active),
     SKC_CEM_FOR_TWR03 (Active), SKC_LAK_TWR01 (Active),
     SKC_MAD_FOR_TWR02 (Active), SKC_MAD_WET_TWR01 (Active),
     SKC_SRC_FOL_WET_TWR01 (Active), SKC_SRC_FOL_WET_TWR02 (Active),
     STM_FOR_TWR01 (Active)
SVB: SVB_FOR_TWR01 (Active), SVB_MIR_TWR01 (Active),
     SVB_MIR_TWR02 (Active), SVB_MIR_TWR03 (Active)
```

---

## Appendix C: Full Production Instrument List

| Station | Platform | Instrument | Type | Status | Camera |
|---------|----------|------------|------|--------|--------|
| ANS | ANS_FOR_BLD01 | ANS_FOR_BLD01_PHE01 | phenocam | Active | Nikon D300S |
| ASA | ASA_FOR_TWR01 | ASA_FOR_TWR01_PHE01 | phenocam | Active | Mobotix M25 |
| ASA | ASA_FOR_TWR02 | ASA_FOR_TWR02_PHE01 | phenocam | Testing | Mobotix M25 |
| BOL | BOL_FOR_TWR01 | BOL_FOR_TWR01_PHE01 | phenocam | Planned | - |
| ERK | ERK_LAK_TWR01 | ERK_LAK_TWR01_PHE01 | phenocam | Planned | - |
| GRI | GRI_FOR_BLD01 | GRI_FOR_BLD01_PHE01 | phenocam | Active | Mobotix M15 |
| LON | LON_AGR_TWR01 | LON_AGR_TWR01_PHE01 | phenocam | Active | Mobotix M16 |
| LON | LON_AGR_TWR01 | LON_AGR_TWR01_PHE02 | phenocam | Active | Mobotix M15 |
| LON | LON_AGR_TWR01 | LON_AGR_TWR01_PHE03 | phenocam | Active | Mobotix M15 |
| RBD | RBD_AGR_TWR01 | RBD_AGR_TWR01_PHE01 | phenocam | Active | Mobotix M15 |
| RBD | RBD_AGR_TWR02 | RBD_AGR_TWR02_PHE01 | phenocam | Active | Mobotix M15 |
| SKC | SKC_CEM_FOR_TWR01 | SKC_CEM_FOR_TWR01_PHE01 | phenocam | Active | Mobotix M25 |
| SKC | SKC_CEM_FOR_TWR02 | SKC_CEM_FOR_TWR02_PHE01 | phenocam | Active | Mobotix M25 |
| SKC | SKC_CEM_FOR_TWR03 | SKC_CEM_FOR_TWR03_PHE01 | phenocam | Active | Mobotix M25 |
| SKC | SKC_LAK_TWR01 | SKC_LAK_TWR01_PHE01 | phenocam | Active | Mobotix M25 |
| SKC | SKC_MAD_FOR_TWR02 | SKC_MAD_FOR_TWR02_PHE01 | phenocam | Active | Mobotix M16 |
| SKC | SKC_MAD_WET_TWR01 | SKC_MAD_WET_TWR01_PHE01 | phenocam | Active | Mobotix M16 |
| SKC | SKC_SRC_FOL_WET_TWR01 | SKC_SRC_FOL_WET_TWR01_PHE01 | phenocam | Active | Mobotix M16 |
| SKC | SKC_SRC_FOL_WET_TWR02 | SKC_SRC_FOL_WET_TWR02_PHE01 | phenocam | Active | Mobotix M16 |
| SKC | STM_FOR_TWR01 | STM_FOR_TWR01_PHE01 | phenocam | Active | Mobotix M16 |
| SVB | SVB_FOR_TWR01 | SVB_FOR_TWR01_PHE01 | phenocam | Inactive | Mobotix M15 |
| SVB | SVB_FOR_TWR01 | SVB_FOR_TWR01_PHE02 | phenocam | Active | Mobotix M25 |
| SVB | SVB_MIR_TWR01 | SVB_MIR_TWR01_PHE01 | phenocam | Active | Mobotix M15 |
| SVB | SVB_MIR_TWR02 | SVB_MIR_TWR02_PHE01 | phenocam | Active | Mobotix M15 |
| SVB | SVB_MIR_TWR03 | SVB_MIR_TWR03_PHE01 | phenocam | Active | Mobotix M15 |

---

---

## Appendix D: Phenocams Package Cross-Reference

The `sites-spectral-manager/apps/phenocams/config/stations.yaml` serves as the **authoritative source** for phenocam instrument configuration and ROI definitions.

### Active Stations in Phenocams Package

| Station | Instruments | ROIs Defined | Data Status |
|---------|-------------|--------------|-------------|
| abisko | 1 (ANS_FOR_BLD01_PHE01) | 4 | has_l0_data |
| grimso | 1 (GRI_FOR_BLD01_PHE01) | 2 | has_l0_data |
| lonnstorp | 3 (PHE01, PHE02, PHE03) | 11 | has_l0_data |
| robacksdalen | 2 (TWR01_PHE01, TWR02_PHE01) | 4 | has_l0_data |
| skogaryd | 10 instruments | 15 | has_l0_data |
| svartberget | 4 instruments | 6 | l3_only |

### DuckDB Databases (Local Processing)

| Station | L1 Database | Other DBs |
|---------|-------------|-----------|
| abisko | ✓ phenocams_l1.duckdb | L2 |
| asa | ✓ phenocams_l1.duckdb | - |
| bolmen | ✓ phenocams_l1.duckdb | satellite |
| erken | ✓ phenocams_l1.duckdb | - |
| grimso | ✓ phenocams_l1.duckdb | - |
| lonnstorp | ✓ phenocams_l1.duckdb | UAV, mspectral, satellite |
| robacksdalen | ✓ phenocams_l1.duckdb | mspectral |
| skogaryd | ✓ phenocams_l1.duckdb | mspectral |
| svartberget | ✓ phenocams_l1.duckdb | mspectral |
| tarfala | - | UAV |

### Missing from Phenocams Package

The following stations have data processing but are NOT defined in the phenocams config:

1. **asa** - Has L1 database but no station config
2. **bolmen** - Has L1 database but no station config
3. **erken** - Has L1 database but no station config

### Key Discrepancies vs Production DB

| Issue | Phenocams Config | Production DB | Action |
|-------|------------------|---------------|--------|
| SVB_MIR_TWR03_PHE01 | Not in config | In DB | Add to phenocams config |
| ROI definitions | 40+ ROIs | 0 ROIs | Migrate ROIs to DB |
| ASA config | Missing | Has instruments | Add station config |
| BOL config | Missing | Has instruments | Add station config |
| ERK config | Missing | Has instruments | Add station config |

### ROI Definition Source

**Phenocams Package (`stations.yaml`)** is the authoritative source for:
- ROI polygon coordinates (`points` field)
- ROI colors and thickness
- Auto-generated flag
- Source image reference
- Generated date

**Example ROI from phenocams config:**
```yaml
ROI_00:
  alpha: 0.0
  auto_generated: true
  color: [255, 255, 255]
  description: Full image excluding sky
  generated_date: '2025-06-02'
  points: [[0, 1041], [4287, 1041], [4287, 2847], [0, 2847]]
  source_image: abisko_ANS_FOR_BL01_PHE01_2023_152_20230601_092630.jpg
  thickness: 7
```

---

## Appendix E: Local Data Infrastructure

### UAV Data Locations

| Station | Database | Path |
|---------|----------|------|
| lonnstorp | uav_catalog.duckdb | `/data/lonnstorp/uav/` |
| tarfala | uav_tarfala.duckdb | `/data/tarfala/uav/` |

### Satellite Data Locations

| Station | Database | Path |
|---------|----------|------|
| bolmen | bolmen_satellite.duckdb | `/data/bolmen/database/` |
| lonnstorp | lonnstorp_satellite.duckdb | `/data/lonnstorp/database/` |

### Multispectral Data Locations

| Station | Database | Path |
|---------|----------|------|
| abisko | abisko_mspectral.duckdb | `/data/abisko/mspectral/database/` |
| lonnstorp | lonnstorp_mspectral.duckdb | `/data/lonnstorp/mspectral/database/` |
| robacksdalen | robacksdalen_mspectral.duckdb | `/data/robacksdalen/mspectral/database/` |
| skogaryd | skogaryd_mspectral.duckdb | `/data/skogaryd/mspectral/database/` |
| svartberget | svartberget_mspectral.duckdb | `/data/svartberget/mspectral/database/` |

---

## Summary of Data Sources

| Source | Type | Location | Status |
|--------|------|----------|--------|
| Production D1 | Cloudflare | `spectral_stations_db` | Central registry |
| Legacy YAML | File | `yamls/stations_latest_production.yaml` | Reference/backup |
| Phenocams Config | File | `apps/phenocams/config/stations.yaml` | **Authoritative for ROIs** |
| Station DuckDB | Local | `/data/{station}/phenocams/databases/` | Processing databases |

---

*Report generated: 2026-02-16 08:25 UTC*
*Next audit recommended: After ROI migration*
*Authoritative ROI source: `apps/phenocams/config/stations.yaml`*
