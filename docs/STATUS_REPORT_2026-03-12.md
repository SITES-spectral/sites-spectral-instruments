# SITES Spectral — Platform & Instrument Status Report

**Generated:** 2026-03-12 (updated post-migration 0050)
**Source:** Live production database — `sitesspectral.work`
**API Version:** v15.7.2

---

## Summary

| Metric | Count |
|--------|-------|
| Stations | 12 (9 SITES + 3 Guest) |
| Platforms (total) | 40 records *(see SVB duplicate note)* |
| Platforms (unique) | 37 |
| Instruments (total) | 47 |
| Active instruments | 32 |
| Inactive instruments | 4 |
| Testing instruments | 1 |
| Planned instruments | 10 |
| Instrument types | Phenocam (38), Multispectral (6), PAR Sensor (2), RGB Camera (1) |

---

## Status Legend

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
| `ANS_FOR_BLD01` | Abisko Meteorological Station | BLD | Active | `ANS_FOR_BLD01_PHE02` | Phenocam | **Active** |
| `ANS_SBF_FOR_TWR01` | Abisko Stordalen Birch Forest | TWR | Planned | `ANS_SBF_FOR_TWR01_PHE01` | Phenocam | **Planned** |
| `ANS_MJH_HEA_TWR01` | Abisko Miellejokka Heath | TWR | Planned | `ANS_MJH_HEA_TWR01_PHE01` | Phenocam | **Planned** |

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
| `LON_AGR_TWR02` | Lönnstorp Agriculture Platform 02 | TWR | Planned | `LON_AGR_TWR02_PHE01` | Phenocam | **Planned** |

---

### RBD — Röbäcksdalen
**Location:** 63.811°N, 20.239°E · Röbäcksdalen Research Station
**Portal:** https://rbd.sitesspectral.work · **Status:** Operational

| Platform | Display Name | Mount | Platform Status | Instrument | Type | Instrument Status |
|----------|-------------|-------|-----------------|------------|------|-------------------|
| `RBD_AGR_TWR01` | RBD AGR Platform 01 | TWR | Active | `RBD_AGR_TWR01_PHE01` | Phenocam | **Active** |
| `RBD_AGR_TWR02` | RBD AGR Platform 02 | TWR | Active | `RBD_AGR_TWR02_PHE01` | Phenocam | **Active** |
| `RBD_AGR_TWR03` | Röbäcksdalen Agriculture Platform 03 | TWR | Planned | `RBD_AGR_TWR03_PHE01` | Phenocam | **Planned** |

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
| `SKC_III_FOR_TWR01` | Skogaryd III Forest Platform 01 | TWR | Planned | `SKC_III_FOR_TWR01_PHE01` | Phenocam | **Planned** |
| `SKC_III_MIR_TWR01` | Skogaryd III Mire Platform 01 | TWR | Planned | `SKC_III_MIR_TWR01_PHE01` | Phenocam | **Planned** |
| `SKC_III_FOL_TWR01` | Skogaryd III Fen on Lake Platform 01 | TWR | Planned | `SKC_III_FOL_TWR01_PHE01` | Phenocam | **Planned** |

> ℹ️ `STM_FOR_TWR01` — platform name prefix `STM` does not match station acronym `SKC`. Verify if this is a legacy naming issue.

---

### SVB — Svartberget
**Location:** 64.244°N, 19.766°E · Svartberget Research Station
**Portal:** https://svb.sitesspectral.work · **Status:** Operational

| Platform | Display Name | Mount | Platform Status | Instrument | Type | Instrument Status |
|----------|-------------|-------|-----------------|------------|------|-------------------|
| `SVB_MIR_TWR01` | SVB MIR Platform 01 | TWR | Active | `SVB_MIR_TWR01_PHE01` | Phenocam | **Active** |
| `SVB_MIR_TWR01` | SVB MIR Platform 01 | TWR | Active | `SVB_MIR_TWR01_PHE02` | Phenocam | **Active** |
| `SVB_MIR_TWR01` | SVB MIR Platform 01 | TWR | Active | `SVB_MIR_TWR01_MS01` | Multispectral | **Inactive** |
| `SVB_MIR_TWR01` | SVB MIR Platform 01 | TWR | Active | `SVB_MIR_TWR01_MS02` | Multispectral | **Inactive** |
| `SVB_MIR_TWR02` | SVB MIR Platform 02 | TWR | Active | `SVB_MIR_TWR02_PHE01` | Phenocam | **Active** |
| `SVB_MIR_TWR03` | SVB MIR Platform 03 | TWR | Active | `SVB_MIR_TWR03_PHE01` | Phenocam | **Active** |
| `SVB_MIR_TWR03` | SVB MIR Platform 03 | TWR | Active | `SVB_MIR_TWR03_PAR01` | PAR Sensor | **Active** |
| `SVB_MIR_TWR04` | DEG PL04 wet PAR pole | TWR | Active | `SVB_MIR_TWR04_PAR01` | PAR Sensor | **Active** |
| `SVB_FOR_TWR01` | SVB FOR Platform 01 | TWR | Active | `SVB_FOR_TWR01_PHE01` | Phenocam | **Inactive** |
| `SVB_FOR_TWR01` | SVB FOR Platform 01 | TWR | Active | `SVB_FOR_TWR01_PHE02` | Phenocam | **Active** |
| `SVB_FOR_TWR01` | SVB FOR Platform 01 | TWR | Active | `SVB_FOR_TWR01_MS01` | Multispectral | **Inactive** |
| `SVB_FOR_TWR02` | SVB Forest Below Canopy Platform 02 | TWR | Active | `SVB_FOR_TWR02_PHE01` | Phenocam | **Active** |
| `SVB_FOR_TWR02` | SVB Forest Below Canopy Platform 02 | TWR | Active | `SVB_FOR_TWR02_MS01` | Multispectral | **Planned** |
| `SVB_FOR_TWR03` | SVB Below Canopy CPEC | TWR | Active | `SVB_FOR_TWR03_PHE01` | Phenocam | **Active** |

> ⚠️ **Duplicate platform records still present in database:**
> - `SVB_FOR_TWR02` has 2 records (id 23 — canonical with instruments, id 31 — empty)
> - `SVB_FOR_TWR03` has 2 records (id 24 — has PHE01, id 32 — empty)
> - `SVB_MIR_TWR04` has 2 records (id 25 — has PAR01, id 33 — empty)
>
> **Action required:** Run deduplication migration to remove empty duplicate records (ids 31, 32, 33).

> ℹ️ `SVB_MIR_TWR04` display name `DEG PL04 wet PAR pole` is a legacy name from the Degerö (DEG) mirror station. Should be updated to `SVB MIR TWR04 Wet PAR Pole`.

> ℹ️ `SVB_FOR_TWR01_PHE01` is **Inactive** — investigate if a replacement is planned or if it should be Decommissioned.

---

## Guest Stations

---

### ALN — Alnarp *(SLU Guest)*
**Location:** 55.659°N, 13.082°E · Alnarp Research Station (SLU campus)
**Portal:** https://aln.sitesspectral.work · **Status:** Operational
**Focus:** UAV & Satellite agricultural monitoring + fixed NDVI sensors

| Platform | Display Name | Mount | Platform Status | Instrument | Type | Instrument Status |
|----------|-------------|-------|-----------------|------------|------|-------------------|
| `ALN_AGR_TWR01` | Alnarp Agricultural Tower 01 | TWR | Planned | *(no instruments registered)* | — | — |
| `ALN_DJI_M3M_UAV01` | Alnarp DJI Mavic 3 Multispectral | UAV | Active | `ALN_DJI_M3M_UAV01_MS01` | Multispectral | **Active** |
| `ALN_DJI_M3M_UAV01` | Alnarp DJI Mavic 3 Multispectral | UAV | Active | `ALN_DJI_M3M_UAV01_RGB01` | RGB Camera | **Active** |
| `ALN_ESA_S2A_SAT01` | Alnarp Sentinel-2A | SAT | Active | `ALN_ESA_S2A_SAT01_MSI01` | Multispectral | **Active** |

> ℹ️ `ALN_AGR_TWR01` — Fixed NDVI sensors (3× Skye SKR-1840) are configured in the mspectral app (`stations.yaml`) but not yet registered in the instruments database. Register instruments when the platform is commissioned.

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
| 🔴 High | SVB | 3 duplicate platform records (ids 31, 32, 33 duplicate ids 23, 24, 25) | Run deduplication migration (migration 0051) |
| 🟡 Medium | ASA | `ASA_FOR_TWR01_PHE01` instrument is `Active` but platform is `Decommissioned` | Set instrument to `Decommissioned` |
| 🟡 Medium | SVB | `SVB_FOR_TWR01_PHE01` is `Inactive` with no notes | Investigate or set to `Decommissioned` |
| 🟡 Medium | SVB | `SVB_MIR_TWR04` display name references `DEG` (Degerö) — legacy name | Update to `SVB MIR TWR04 Wet PAR Pole` |
| 🟡 Medium | ALN | `ALN_AGR_TWR01` has 3 SKR-1840 sensors in mspectral config but none in instruments DB | Register instruments when platform commissioned |
| 🟢 Low | SKC | `STM_FOR_TWR01` prefix `STM` does not match station `SKC` | Confirm if legacy naming or error |

### Stations Awaiting Deployment

| Station | Pending Items |
|---------|--------------|
| ANS | 2 planned platforms: `ANS_SBF_FOR_TWR01` (Stordalen Birch Forest), `ANS_MJH_HEA_TWR01` (Miellejokka Heath) |
| BOL | `BOL_FOR_TWR01` platform and `BOL_FOR_TWR01_PHE01` instrument both Planned |
| ERK | `ERK_LAK_TWR01` platform and `ERK_LAK_TWR01_PHE01` instrument both Planned |
| LON | `LON_AGR_TWR02` platform and `LON_AGR_TWR02_PHE01` instrument Planned |
| RBD | `RBD_AGR_TWR03` platform and `RBD_AGR_TWR03_PHE01` instrument Planned |
| SKC | 3 Skogaryd III platforms Planned (FOR, MIR, FOL) |
| ALN | `ALN_AGR_TWR01` tower platform Planned, no instruments registered in DB |
| HYL | `HYL_FOR_TWR01` platform Planned, no instruments assigned |
| NOR | `NOR_FOR_TWR01` platform Planned, no instruments assigned |

---

## Instrument Type Distribution

| Type | Count | Stations |
|------|-------|---------|
| Phenocam | 38 | ANS, ASA, BOL, ERK, GRI, LON, RBD, SKC, SVB |
| Multispectral | 6 | ALN (UAV ×1, Satellite ×1), SVB (inactive ×3, planned ×1) |
| PAR Sensor | 2 | SVB (Degerö mire dry + wet poles) |
| RGB Camera | 1 | ALN (UAV) |

---

## Changes Since Initial Report (2026-03-12, migration 0050)

| Change | Details |
|--------|---------|
| ➕ Added | `ANS_FOR_BLD01_PHE02` — second phenocam on Abisko building |
| ➕ Added | `SVB_MIR_TWR01_PHE02` — second phenocam on Degerö flag pole |
| ➕ Added | `SVB_FOR_TWR03_PHE01` — phenocam on SVB below-canopy CPEC |
| ➕ Added | `SVB_MIR_TWR01_MS01/MS02` — Skye + Decagon multispectral on flag pole (Inactive) |
| ➕ Added | `SVB_FOR_TWR01_MS01` — Skye multispectral top of 150m forest tower (Inactive) |
| ➕ Added | `SVB_FOR_TWR02_MS01` — Skye multispectral below-canopy north (Planned) |
| ➕ Added | `SVB_MIR_TWR03_PAR01` — Licor PAR sensor on Degerö dry pole (Active) |
| ➕ Added | `SVB_MIR_TWR04_PAR01` — Licor PAR sensor on Degerö wet pole (Active) |
| ➕ Added | 7 planned platforms: ANS (×2), LON (×1), RBD (×1), SKC III (×3) with phenocams |

---

*Data sourced live from `spectral_stations_db` (D1) via Cloudflare Workers at `sitesspectral.work`.*
