# SITES Spectral — Platform & Instrument Status Report

**Generated:** 2026-03-12
**Source:** Live production database — `sitesspectral.work`
**API Version:** v15.7.2

---

## Summary

| Metric | Count |
|--------|-------|
| Stations | 12 (9 SITES + 3 Guest) |
| Platforms (total) | 33 records *(see SVB note)* |
| Platforms (unique) | 30 |
| Instruments (total) | 31 |
| Active instruments | 27 |
| Inactive instruments | 1 |
| Testing instruments | 1 |
| Planned instruments | 2 |
| Instrument types | Phenocam (28), Multispectral (2), RGB Camera (1) |

---

## Station Legend

| Status | Meaning |
|--------|---------|
| **Active** | Operational, collecting data |
| **Testing** | Commissioned but under validation |
| **Planned** | Registered, not yet deployed |
| **Inactive** | Deployed but currently not collecting |
| **Decommissioned** | Permanently removed from service |

---

## SITES Member Stations

---

### ANS — Abisko
**Location:** 68.354°N, 18.816°E · Abisko Scientific Research Station
**Portal:** https://ans.sitesspectral.work · **Status:** Operational

| Platform | Display Name | Mount | Platform Status | Instrument | Type | Instrument Status |
|----------|-------------|-------|-----------------|------------|------|-------------------|
| `ANS_FOR_BLD01` | Abisko Meteorological Station | BLD | Active | `ANS_FOR_BLD01_PHE01` | Phenocam | **Active** |

---

### ASA — Asa
**Location:** 57.165°N, 14.783°E · Asa Research Station
**Portal:** https://asa.sitesspectral.work · **Status:** Operational

| Platform | Display Name | Mount | Platform Status | Instrument | Type | Instrument Status |
|----------|-------------|-------|-----------------|------------|------|-------------------|
| `ASA_FOR_TWR01` | Asa Nybigget Tower 01 | TWR | **Decommissioned** | `ASA_FOR_TWR01_PHE01` | Phenocam | Active ⚠️ |
| `ASA_FOR_TWR02` | Asa Nybigget Tower 02 | TWR | Testing | `ASA_FOR_TWR02_PHE01` | Phenocam | **Testing** |

> ⚠️ `ASA_FOR_TWR01_PHE01` instrument status is `Active` but its platform is `Decommissioned` — status mismatch should be reviewed.

---

### BOL — Bolmen
**Location:** 56.997°N, 13.783°E · Bolmen Research Station
**Portal:** https://bol.sitesspectral.work · **Status:** Operational

| Platform | Display Name | Mount | Platform Status | Instrument | Type | Instrument Status |
|----------|-------------|-------|-----------------|------------|------|-------------------|
| `BOL_FOR_TWR01` | Bolmen Forest Platform 01 | TWR | Planned | `BOL_FOR_TWR01_PHE01` | Phenocam | **Planned** |

---

### ERK — Erken
**Location:** 59.884°N, 18.655°E · Erken Laboratory
**Portal:** https://erk.sitesspectral.work · **Status:** Operational

| Platform | Display Name | Mount | Platform Status | Instrument | Type | Instrument Status |
|----------|-------------|-------|-----------------|------------|------|-------------------|
| `ERK_LAK_TWR01` | Erken Lake Platform 01 | TWR | Planned | `ERK_LAK_TWR01_PHE01` | Phenocam | **Planned** |

---

### GRI — Grimsö
**Location:** 59.729°N, 15.472°E · Grimsö Wildlife Research Station
**Portal:** https://gri.sitesspectral.work · **Status:** Operational

| Platform | Display Name | Mount | Platform Status | Instrument | Type | Instrument Status |
|----------|-------------|-------|-----------------|------------|------|-------------------|
| `GRI_FOR_BLD01` | Grimsö Forest Building 01 | BLD | Active | `GRI_FOR_BLD01_PHE01` | Phenocam | **Active** |

---

### LON — Lönnstorp
**Location:** 55.669°N, 13.103°E · Lönnstorp Agricultural Research Station
**Portal:** https://lon.sitesspectral.work · **Status:** Operational

| Platform | Display Name | Mount | Platform Status | Instrument | Type | Instrument Status |
|----------|-------------|-------|-----------------|------------|------|-------------------|
| `LON_AGR_TWR01` | Lönnstorp Agriculture Platform 01 | TWR | Active | `LON_AGR_TWR01_PHE01` | Phenocam | **Active** |
| `LON_AGR_TWR01` | Lönnstorp Agriculture Platform 01 | TWR | Active | `LON_AGR_TWR01_PHE02` | Phenocam | **Active** |
| `LON_AGR_TWR01` | Lönnstorp Agriculture Platform 01 | TWR | Active | `LON_AGR_TWR01_PHE03` | Phenocam | **Active** |

---

### RBD — Röbäcksdalen
**Location:** 63.811°N, 20.239°E · Röbäcksdalen Research Station
**Portal:** https://rbd.sitesspectral.work · **Status:** Operational

| Platform | Display Name | Mount | Platform Status | Instrument | Type | Instrument Status |
|----------|-------------|-------|-----------------|------------|------|-------------------|
| `RBD_AGR_TWR01` | RBD AGR Platform 01 | TWR | Active | `RBD_AGR_TWR01_PHE01` | Phenocam | **Active** |
| `RBD_AGR_TWR02` | RBD AGR Platform 02 | TWR | Active | `RBD_AGR_TWR02_PHE01` | Phenocam | **Active** |

---

### SKC — Skogaryd
**Location:** 58.365°N, 12.145°E · Skogaryd Research Catchment
**Portal:** https://skc.sitesspectral.work · **Status:** Operational

| Platform | Display Name | Mount | Platform Status | Instrument | Type | Instrument Status |
|----------|-------------|-------|-----------------|------------|------|-------------------|
| `SKC_CEM_FOR_TWR01` | SKC CEM Platform OR | TWR | Active | `SKC_CEM_FOR_TWR01_PHE01` | Phenocam | **Active** |
| `SKC_CEM_FOR_TWR02` | SKC CEM Platform OR | TWR | Active | `SKC_CEM_FOR_TWR02_PHE01` | Phenocam | **Active** |
| `SKC_CEM_FOR_TWR03` | SKC CEM Platform OR | TWR | Active | `SKC_CEM_FOR_TWR03_PHE01` | Phenocam | **Active** |
| `SKC_LAK_TWR01` | SKC LAK Platform 01 | TWR | Active | `SKC_LAK_TWR01_PHE01` | Phenocam | **Active** |
| `SKC_MAD_WET_TWR01` | SKC MAD Platform ET | TWR | Active | `SKC_MAD_WET_TWR01_PHE01` | Phenocam | **Active** |
| `SKC_MAD_FOR_TWR02` | SKC MAD Platform OR | TWR | Active | `SKC_MAD_FOR_TWR02_PHE01` | Phenocam | **Active** |
| `SKC_SRC_FOL_WET_TWR01` | SKC SRC Platform OL | TWR | Active | `SKC_SRC_FOL_WET_TWR01_PHE01` | Phenocam | **Active** |
| `SKC_SRC_FOL_WET_TWR02` | SKC SRC Platform OL | TWR | Active | `SKC_SRC_FOL_WET_TWR02_PHE01` | Phenocam | **Active** |
| `STM_FOR_TWR01` | STM FOR Platform 01 | TWR | Active | `STM_FOR_TWR01_PHE01` | Phenocam | **Active** |

> ℹ️ `STM_FOR_TWR01` — platform name prefix `STM` does not match station acronym `SKC`. Verify if this is a legacy naming issue.

---

### SVB — Svartberget
**Location:** 64.244°N, 19.766°E · Svartberget Research Station
**Portal:** https://svb.sitesspectral.work · **Status:** Operational

| Platform | Display Name | Mount | Platform Status | Instrument | Type | Instrument Status |
|----------|-------------|-------|-----------------|------------|------|-------------------|
| `SVB_MIR_TWR01` | SVB MIR Platform 01 | TWR | Active | `SVB_MIR_TWR01_PHE01` | Phenocam | **Active** |
| `SVB_MIR_TWR02` | SVB MIR Platform 02 | TWR | Active | `SVB_MIR_TWR02_PHE01` | Phenocam | **Active** |
| `SVB_MIR_TWR03` | SVB MIR Platform 03 | TWR | Active | `SVB_MIR_TWR03_PHE01` | Phenocam | **Active** |
| `SVB_MIR_TWR04` | DEG PL04 wet PAR pole | TWR | Active | *(no instruments)* | — | — |
| `SVB_FOR_TWR01` | SVB FOR Platform 01 | TWR | Active | `SVB_FOR_TWR01_PHE01` | Phenocam | **Inactive** |
| `SVB_FOR_TWR01` | SVB FOR Platform 01 | TWR | Active | `SVB_FOR_TWR01_PHE02` | Phenocam | **Active** |
| `SVB_FOR_TWR02` | SVB Forest Below Canopy Platform 02 | TWR | Active | `SVB_FOR_TWR02_PHE01` | Phenocam | **Active** |
| `SVB_FOR_TWR03` | SVB Below Canopy CPEC | TWR | Active | *(no instruments)* | — | — |

> ⚠️ **Duplicate platform records detected in database:**
> - `SVB_FOR_TWR02` has 2 platform records (id 23, id 31) — one with 2 instruments, one with 1
> - `SVB_FOR_TWR03` has 2 platform records (id 24, id 32) — both with 0 instruments
> - `SVB_MIR_TWR04` has 2 platform records (id 25, id 33) — both with 0 instruments
>
> **Recommendation:** Run a deduplication migration to remove the duplicate platform entries (ids 31, 32, 33).

> ℹ️ `SVB_MIR_TWR04` display name `DEG PL04 wet PAR pole` appears to be a legacy name from the Degerö (DEG) mirror station. Review if this is correct.

> ℹ️ `SVB_FOR_TWR01_PHE01` is **Inactive** — investigate if a replacement is planned or if it should be Decommissioned.

---

## Guest Stations

---

### ALN — Alnarp *(SLU Guest)*
**Location:** 55.659°N, 13.082°E · Alnarp Research Station (SLU campus)
**Portal:** https://aln.sitesspectral.work · **Status:** Operational
**Focus:** UAV & Satellite agricultural monitoring

| Platform | Display Name | Mount | Platform Status | Instrument | Type | Instrument Status |
|----------|-------------|-------|-----------------|------------|------|-------------------|
| `ALN_AGR_TWR01` | Alnarp Agricultural Tower 01 | TWR | Planned | *(no instruments)* | — | — |
| `ALN_DJI_M3M_UAV01` | Alnarp DJI Mavic 3 Multispectral | UAV | Active | `ALN_DJI_M3M_UAV01_MS01` | Multispectral | **Active** |
| `ALN_DJI_M3M_UAV01` | Alnarp DJI Mavic 3 Multispectral | UAV | Active | `ALN_DJI_M3M_UAV01_RGB01` | RGB Camera | **Active** |
| `ALN_ESA_S2A_SAT01` | Alnarp Sentinel-2A | SAT | Active | `ALN_ESA_S2A_SAT01_MSI01` | Multispectral | **Active** |

---

### HYL — Hyltemossa *(ICOS Class 1 Guest)*
**Location:** 56.098°N, 13.419°E · Mixed coniferous forest, elevation 115 m
**Portal:** https://hyl.sitesspectral.work · **Status:** Pending
**Focus:** ICOS carbon flux tower — SITES Spectral data processing support

| Platform | Display Name | Mount | Platform Status | Instrument | Type | Instrument Status |
|----------|-------------|-------|-----------------|------------|------|-------------------|
| `HYL_FOR_TWR01` | Hyltemossa Flux Tower (ICOS) | TWR | Planned | *(no instruments yet)* | — | — |

---

### NOR — Norunda *(ICOS Class 1 Guest)*
**Location:** 60.086°N, 17.479°E · Boreal forest, 102 m tower, elevation 46 m
**Portal:** https://nor.sitesspectral.work · **Status:** Pending
**Focus:** ICOS carbon flux tower — SITES Spectral data processing support

| Platform | Display Name | Mount | Platform Status | Instrument | Type | Instrument Status |
|----------|-------------|-------|-----------------|------------|------|-------------------|
| `NOR_FOR_TWR01` | Norunda Flux Tower (ICOS) | TWR | Planned | *(no instruments yet)* | — | — |

---

## Issues & Recommendations

### Data Quality Issues

| Priority | Station | Issue | Action |
|----------|---------|-------|--------|
| 🔴 High | SVB | 3 duplicate platform records (ids 31, 32, 33 duplicate ids 23, 24, 25) | Run deduplication migration |
| 🟡 Medium | ASA | `ASA_FOR_TWR01_PHE01` instrument is `Active` but platform is `Decommissioned` | Set instrument to `Decommissioned` |
| 🟡 Medium | SVB | `SVB_FOR_TWR01_PHE01` is `Inactive` with no notes | Investigate or set to `Decommissioned` |
| 🟡 Medium | SVB | `SVB_MIR_TWR04` display name references `DEG` (Degerö) — appears to be legacy name | Review and update display name |
| 🟢 Low | SKC | `STM_FOR_TWR01` prefix `STM` does not match station `SKC` | Confirm if legacy naming or error |

### Stations Awaiting Deployment

| Station | Pending Items |
|---------|--------------|
| BOL | `BOL_FOR_TWR01` platform and `BOL_FOR_TWR01_PHE01` instrument both Planned |
| ERK | `ERK_LAK_TWR01` platform and `ERK_LAK_TWR01_PHE01` instrument both Planned |
| ALN | `ALN_AGR_TWR01` tower platform Planned, no instruments assigned yet |
| HYL | `HYL_FOR_TWR01` platform Planned, no instruments assigned |
| NOR | `NOR_FOR_TWR01` platform Planned, no instruments assigned |
| SVB | `SVB_FOR_TWR03` and `SVB_MIR_TWR04` platforms Active but no instruments registered |

---

## Instrument Type Distribution

| Type | Count | Stations |
|------|-------|---------|
| Phenocam | 28 | ANS, ASA, BOL, ERK, GRI, LON, RBD, SKC, SVB |
| Multispectral | 2 | ALN (UAV + Satellite) |
| RGB Camera | 1 | ALN (UAV) |

---

*Data sourced live from `spectral_stations_db` (D1) via Cloudflare Workers at `sitesspectral.work`.*
