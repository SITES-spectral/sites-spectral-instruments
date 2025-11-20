# Svartberget Instrument Migration Summary

**Date**: 2025-11-20
**Source**: `/home/jobelund/Downloads/metadata shared.xlsx`
**Output**: `/tmp/svb_instruments_generated.yaml`
**Status**: ✅ Processing Complete - Ready for Manual Review

---

## Processing Results

### Overall Statistics
- **Total Platforms Processed**: 7
- **Total Instruments Generated**: 22
- **Existing Phenocams Skipped**: 3
- **New Instruments to Add**: 19

### Platform Breakdown

| Platform | Phenocams | MS Sensors | PAR Sensors | Total |
|----------|-----------|------------|-------------|-------|
| **SVB_FOR_PL01** | 1 | 5 | 0 | 6 |
| **SVB_FOR_PL02** | 0 | 2 | 0 | 2 |
| **SVB_FOR_PL03** | 1 | 0 | 0 | 1 |
| **SVB_MIR_PL01** | 0 (2 exist) | 8 | 0 | 8 |
| **SVB_MIR_PL02** | 0 (1 exists) | 0 | 0 | 0 |
| **SVB_MIR_PL03** | 0 | 0 | 1 | 1 |
| **SVB_MIR_PL04** | 0 | 0 | 1 | 1 |
| **TOTALS** | **2** | **15** | **2** | **19** |

---

## Detailed Instrument List

### SVB_FOR_PL01 (150m Tower) - 6 Instruments

#### Phenocams:
1. **SVB_FOR_PL01_PHE01** ✅ NEW
   - Brand: Mobotix MX-M25-D061
   - Status: Active
   - Height: 52m
   - Legacy: SWE-SVB-SVB-FOR-P01

#### Multispectral Sensors:
2. **SVB_FOR_PL01_SKYE_MS01_NB02** (Status: Removed)
   - Model: SKYE SKR1860
   - Channels: 2 (GREEN 531nm, GREEN 530nm)
   - Height: 150m
   - Notes: Removed 2022-10-31 due to suspicious data

3. **SVB_FOR_PL01_SKYE_MS02_NB02** (Status: Removed)
   - Model: SKYE SKR1860
   - Channels: 2 (RED 643nm, NIR 858nm)
   - Height: 150m/100m
   - Notes: Same removal reason

4. **SVB_FOR_PL01_SKYE_MS03_NB02** (Status: Active)
   - Model: SKYE 1840D
   - Channels: 2 (RED 649nm, NIR 804nm)
   - Height: 150m
   - Notes: Installed 2022-10-31 (replacement)

5. **SVB_FOR_PL01_SKYE_MS04_NB02** (Status: Active)
   - Model: SKYE 1840ND
   - Channels: 2 (RED 650nm, NIR 805nm)
   - Height: 100m
   - Notes: Installed 2022-10-31

6. **SVB_FOR_PL01_SKYE_MS05_NB01** (Status: Pending Installation)
   - Model: SKYE SKR1860D/A/LT
   - Serial: 53916
   - Channels: 1 (RED 671nm)
   - Height: 50m
   - Calibrated: 09/10/2025

### SVB_FOR_PL02 (Below Canopy North) - 2 Instruments

7. **SVB_FOR_PL02_SKYE_MS01_NB01** (Status: Pending Installation)
   - Model: SKYE SKR1840ND/LT
   - Serial: 53915
   - Channels: 1 (RED 671nm)
   - Height: 2m
   - Calibrated: 07/17/2024

8. **SVB_FOR_PL02_SKYE_MS02_NB01** (Status: Pending Installation)
   - Model: SKYE SKR1840D/LT
   - Serial: 53914
   - Channels: 1 (RED 670nm)
   - Height: 2m
   - Calibrated: 07/17/2024

### SVB_FOR_PL03 (Below Canopy CPEC) - 1 Instrument

#### Phenocams:
9. **SVB_FOR_PL03_PHE01** ✅ NEW
   - Brand: Mobotix MX-M25-D061
   - Status: Active
   - Height: 3.22m
   - Legacy: SWE-SVB-SVB-FOR-P02
   - Notes: Installed 19/12/2024

### SVB_MIR_PL01 (Degerö Flag Pole) - 8 Instruments

#### Existing Phenocams (SKIPPED):
- ~~SVB_MIR_PL01_PHE01~~ (Already in database - ID 19)
- ~~SVB_MIR_PL01_PHE02~~ (Already in database - ID 42)

#### Multispectral Sensors:
10. **SVB_MIR_PL01_SKYE_MS01_NB04** (Status: Active)
    - Model: SKYE SKR1860 D/A/X
    - Serial: 46434
    - Channels: 4 (Uplooking: 704nm, 740nm, 860nm, 1640nm)
    - Height: 17.5m
    - Calibrated: 19/09/2025 (dirty)

11. **SVB_MIR_PL01_SKYE_MS02_NB04** (Status: Active)
    - Model: SKYE SKR1860 D/A/X
    - Serial: 46436
    - Channels: 4 (Downlooking: 704nm, 740nm, 858nm, 1640nm)
    - Height: 17.5m
    - Azimuth: 317°, Nadir: 45°
    - Calibrated: 19/09/2025 (dirty)

12. **SVB_MIR_PL01_SKYE_MS03_NB02** (Status: Inactive - Old)
    - Model: SKYE SKR1850
    - Serial: 43010
    - Channels: 2 (Uplooking: 531nm, 570nm - PRI)
    - Height: 17.5m
    - Calibrated: todo

13. **SVB_MIR_PL01_SKYE_MS04_NB02** (Status: Inactive - Old)
    - Model: SKYE SKR1850
    - Serial: 43009
    - Channels: 2 (Downlooking: 531nm, 570nm - PRI)
    - Height: 17.5m
    - Azimuth: 317°, Nadir: 45°
    - Calibrated: todo

14. **SVB_MIR_PL01_SKYE_MS05_NB01** (Status: Active)
    - Model: SKYE SKR1860D/A/LT
    - Serial: 53918
    - Channels: 1 (Uplooking: 671nm)
    - Height: 17.5m
    - Notes: Installed 2025-10-24, looks at dry mire (96°)
    - Calibrated: 09/11/2025

15. **SVB_MIR_PL01_SKYE_MS06_NB01** (Status: Pending Installation)
    - Model: SKYE SKR1860ND/A/LT
    - Serial: 53919
    - Channels: 1 (Downlooking: 671nm)
    - Height: 17.5m
    - Azimuth: 96°, Nadir: 45°
    - Calibrated: 09/11/2025

16. **SVB_MIR_PL01_DECAGON_MS01_NB02** (Status: Removed)
    - Model: Decagon SRS-Ni
    - Serial: 003
    - Channels: 2 (Uplooking: 650nm, 860nm - NDVI)
    - Height: 17.5m
    - Notes: Stopped working, dismounted 30/09/2025

17. **SVB_MIR_PL01_DECAGON_MS02_NB02** (Status: Removed)
    - Model: Decagon SRS-Nr
    - Serial: 003
    - Channels: 2 (Downlooking: 650nm, 860nm - NDVI)
    - Height: 17.5m
    - Azimuth: 317°, Nadir: 45°
    - Notes: Stopped working, dismounted 30/09/2025

### SVB_MIR_PL02 (ICOS Mast) - 0 New Instruments

**Existing Phenocam (SKIPPED)**:
- ~~SVB_MIR_PL02_PHE01~~ (Already in database - ID 20)

### SVB_MIR_PL03 (Dry PAR Pole) - 1 Instrument

18. **SVB_MIR_PL03_LICOR_PAR01** ✅ NEW
    - Model: Licor PAR Sensor
    - Status: Active
    - Wavelength: 400-700nm
    - Notes: Installed 2024-04-19

### SVB_MIR_PL04 (Wet PAR Pole) - 1 Instrument

19. **SVB_MIR_PL04_LICOR_PAR01** ✅ NEW
    - Model: Licor PAR Sensor
    - Status: Active
    - Wavelength: 400-700nm
    - Notes: Installed 2024-04-18

---

## Mapping Rules Applied

✅ **Platform Naming**: Auto-corrected P01 → PL01, P02 → PL02, P03 → PL03
✅ **Site Inclusion**: Included "Degerö" rows as part of Svartberget station
✅ **Wavelength Ranges**: Used lower end of ranges (e.g., 620 from "620-670")
✅ **Legacy Names**: Preserved in `legacy_acronym` field
✅ **Status Detection**: Automatically determined from comments
✅ **Existing Phenocams**: Skipped 3 instruments already in database
✅ **PAR Sensors**: Named as "LICOR PAR Sensor"

---

## Known Issues & Manual Adjustments Needed

### 1. **Instrument Numbering**
The script assigned sequential numbers (MS01, MS02, etc.) per brand/platform.
**Action Required**: Review and adjust numbering to match actual deployment sequence.

### 2. **Channel Grouping**
Some multi-channel instruments may be split due to missing serial numbers in Excel.
**Example**: 4-channel SKYE sensors might appear as 2 separate 2-channel instruments.
**Action Required**: Manually merge channels belonging to same physical sensor.

### 3. **Missing Serial Numbers**
Many instruments lack serial numbers in Excel, making grouping difficult.
**Action Required**: Add serial numbers from equipment labels if available.

### 4. **Decagon Instrument Details**
Decagon MS sensors listed with minimal channel information (no bandwidth).
**Action Required**: Add bandwidth values if known.

### 5. **Coordinate Precision**
Some instruments have only partial coordinate data.
**Action Required**: Add missing lat/lon values.

### 6. **Calibration Dates**
Format varies ("todo", "09/10/2025", "-").
**Action Required**: Standardize to YYYY-MM-DD format.

---

## Integration Steps

### Step 1: Review Generated YAML
```bash
cat /tmp/svb_instruments_generated.yaml
```

### Step 2: Backup Current Stations YAML
```bash
cp yamls/stations_latest_production.yaml yamls/stations_backup_$(date +%Y%m%d).yaml
```

### Step 3: Manual Integration
- Open `yamls/stations_latest_production.yaml`
- Navigate to `svartberget:` section (line ~1756)
- Add new instruments under respective platforms
- Adjust instrument numbers (MS01 → MS02 if MS01 already exists)
- Merge multi-channel instruments if split incorrectly
- Verify legacy_acronym fields match historical data

### Step 4: Validate YAML Syntax
```bash
python3 -c "import yaml; yaml.safe_load(open('yamls/stations_latest_production.yaml'))"
```

### Step 5: Test Database Migration
```bash
# Use migration script to upload new instruments
# (migration script path TBD)
```

---

## Files Generated

| File | Purpose | Location |
|------|---------|----------|
| `process_svb_instruments.py` | Processing script | `/tmp/` |
| `metadata shared.csv` | Source data (converted from Excel) | `/tmp/` |
| `svb_instruments_generated.yaml` | Generated instrument definitions | `/tmp/` |
| `SVB_INSTRUMENT_MIGRATION_SUMMARY.md` | This summary document | `/tmp/` |

---

## Next Steps

1. ✅ **COMPLETED**: CSV processing and YAML generation
2. ⏳ **PENDING**: Manual review of generated instruments
3. ⏳ **PENDING**: Adjustment of instrument numbering
4. ⏳ **PENDING**: Merging of split multi-channel instruments
5. ⏳ **PENDING**: Integration into stations_latest_production.yaml
6. ⏳ **PENDING**: Database migration with new instruments
7. ⏳ **PENDING**: Frontend verification (instrument display in UI)

---

## Questions for User

Before proceeding with integration:

1. **Instrument Numbering**: Should MS sensors be numbered sequentially across all platforms or start fresh per platform?
2. **Multi-Channel Grouping**: Do the 4-channel SKYE instruments (e.g., rows 2-5 in Excel) represent single physical sensors or separate up/down instruments?
3. **Legacy Acronym Format**: Confirm format is correct (e.g., "SWE-SVB-SVB-FOR-F01" vs "SWE-SVB-FOR-F01")
4. **Decagon Instruments**: Should removed Decagon sensors be included or excluded entirely?
5. **Calibration Data**: Should "todo" and "-" calibration dates be converted to null or left as-is?

---

**Processing completed successfully! Ready for manual review and integration.**
