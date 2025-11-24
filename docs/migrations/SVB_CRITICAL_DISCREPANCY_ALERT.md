# 🚨 CRITICAL DISCREPANCY ALERT - Svartberget Instrument Migration

**Date**: 2025-11-21
**Severity**: HIGH
**Status**: REQUIRES IMMEDIATE USER ATTENTION

---

## Critical Issue Discovered

### Summary Claims vs Generated YAML

**Summary Document Claims:**
- File: `SVB_INSTRUMENT_MIGRATION_SUMMARY.md`
- Total instruments claimed: **22 total** (19 new + 3 existing phenocams skipped)
- Breakdown by platform:
  - SVB_FOR_PL01: 6 instruments (1 PHE + 5 MS)
  - SVB_FOR_PL02: 2 instruments (2 MS)
  - SVB_FOR_PL03: 1 instrument (1 PHE)
  - SVB_MIR_PL01: 8 instruments (8 MS)
  - SVB_MIR_PL03: 1 instrument (1 PAR)
  - SVB_MIR_PL04: 1 instrument (1 PAR)

**Generated YAML Contains:**
- File: `svb_instruments_generated.yaml`
- Total instruments found: **10 instruments**
- Breakdown by platform:
  - SVB_FOR_PL01: 3 instruments (1 PHE + 2 MS)
  - SVB_FOR_PL02: 1 instrument (1 MS)
  - SVB_FOR_PL03: 1 instrument (1 PHE)
  - SVB_MIR_PL01: 3 instruments (3 MS)
  - SVB_MIR_PL03: 1 instrument (1 PAR)
  - SVB_MIR_PL04: 1 instrument (1 PAR)

### Missing Instruments: 9

**Expected but NOT FOUND in YAML:**

#### SVB_FOR_PL01 (3 missing):
1. SVB_FOR_PL01_SKYE_MS02_NB02 (Status: Removed)
2. SVB_FOR_PL01_SKYE_MS03_NB02 (Status: Active)
3. SVB_FOR_PL01_SKYE_MS04_NB02 (Status: Active)

#### SVB_FOR_PL02 (1 missing):
4. SVB_FOR_PL02_SKYE_MS02_NB01 (Status: Pending Installation)

#### SVB_MIR_PL01 (5 missing):
5. SVB_MIR_PL01_SKYE_MS02_NB04 (Status: Active, 4-channel)
6. SVB_MIR_PL01_SKYE_MS03_NB02 (Status: Inactive)
7. SVB_MIR_PL01_SKYE_MS04_NB02 (Status: Inactive)
8. SVB_MIR_PL01_SKYE_MS05_NB01 (Status: Active)
9. SVB_MIR_PL01_SKYE_MS06_NB01 (Status: Pending Installation)
10. SVB_MIR_PL01_DECAGON_MS02_NB02 (Status: Removed)

---

## Root Cause Analysis

### Possible Causes:

1. **Processing Script Error**: The Python script that generated the YAML may have:
   - Failed to process all rows in Excel
   - Encountered errors silently
   - Had filtering logic that excluded instruments

2. **Summary Document Mismatch**: The summary may have been manually edited after YAML generation

3. **Excel Source Data Issues**: The Excel file may have:
   - Hidden rows or sheets
   - Incomplete data for some instruments
   - Formatting issues preventing parsing

---

## Instruments Successfully Generated (10)

### ✅ YAML Contains:

1. **SVB_FOR_PL01_PHE01** (Phenocam, Active)
2. **SVB_FOR_PL01_SKYE_MS01_NB02** (Multispectral, Removed)
3. **SVB_FOR_PL01_SKYE_MS01_NB01** (Multispectral, Pending) ⚠️ NUMBERING CONFLICT
4. **SVB_FOR_PL02_SKYE_MS01_NB01** (Multispectral, Pending)
5. **SVB_FOR_PL03_PHE01** (Phenocam, Active)
6. **SVB_MIR_PL01_SKYE_MS01_NB02** (Multispectral, Inactive)
7. **SVB_MIR_PL01_SKYE_MS01_NB01** (Multispectral, Pending) ⚠️ NUMBERING CONFLICT
8. **SVB_MIR_PL01_DECAGON_MS01_NB01** (Multispectral, Removed)
9. **SVB_MIR_PL03_LICOR_PAR01** (PAR Sensor, Active)
10. **SVB_MIR_PL04_LICOR_PAR01** (PAR Sensor, Active)

---

## Immediate Actions Required

### Option 1: Re-run Processing Script (RECOMMENDED)
1. Review original Excel file `/home/jobelund/Downloads/metadata shared.xlsx`
2. Check for processing script at `/tmp/process_svb_instruments.py`
3. Re-run with debugging enabled to identify why instruments were skipped
4. Compare output with summary document

### Option 2: Manual Extraction from Excel
1. Open Excel file and manually verify instrument count
2. Extract missing instrument data manually
3. Add to generated YAML following existing format
4. Validate all 19 instruments are present

### Option 3: Proceed with 10 Instruments Only
1. Verify these 10 instruments are the priority
2. Document that remaining 9 will be added in future migration
3. Update summary document to reflect actual count

---

## Recommendations

### PRIMARY RECOMMENDATION: Investigate Before Proceeding

**DO NOT integrate current YAML until discrepancy is resolved.**

Reasons:
- Missing 9 instruments (47% of expected total)
- Several active instruments missing (MS03, MS04 at SVB_FOR_PL01)
- Critical monitoring sensors may be excluded

### SECONDARY RECOMMENDATION: Validate Data Source

1. Check Excel file row count vs YAML instrument count
2. Look for processing logs or error messages
3. Verify serial numbers in Excel match YAML where present

---

## Data Quality Issues Also Found

### Issue 1: Instrument Type Capitalization
- **Location**: Lines 186, 202 in generated YAML
- **Error**: `instrument_type: Par Sensor`
- **Correction**: Should be `PAR Sensor`

### Issue 2: Instrument Numbering Conflicts
- Two MS01 instruments on same platform but different models:
  - `SVB_FOR_PL01_SKYE_MS01_NB02` (SKR1860, Removed)
  - `SVB_FOR_PL01_SKYE_MS01_NB01` (SKR1860D/A/LT, Pending)

This suggests numbering was not sequential but based on channel count, which is unusual.

---

## Next Steps - User Decision Required

### Question 1: Source of Truth
Which document is correct?
- **A**: Summary document (19 instruments expected)
- **B**: Generated YAML (10 instruments only)
- **C**: Excel file (needs verification)

### Question 2: Integration Strategy
How to proceed?
- **A**: Fix processing script and regenerate complete YAML
- **B**: Manually add 9 missing instruments to YAML
- **C**: Integrate 10 instruments now, add remaining 9 later
- **D**: Start over with new Excel processing approach

### Question 3: Timeline Priority
What is the urgency?
- **A**: Critical - need all 19 instruments immediately
- **B**: Moderate - can integrate 10 now, add 9 later
- **C**: Low - wait until complete data available

---

## Files Requiring Attention

### For Investigation:
1. `/home/jobelund/Downloads/metadata shared.xlsx` - Original source
2. `/tmp/process_svb_instruments.py` - Processing script (if exists)
3. `/tmp/metadata shared.csv` - Converted CSV (if exists)

### For Correction:
1. `/lunarc/nobackup/projects/sitesspec/SITES/Spectral/apps/sites-spectral-instruments/docs/migrations/svb_instruments_generated.yaml`
2. `/lunarc/nobackup/projects/sitesspec/SITES/Spectral/apps/sites-spectral-instruments/docs/migrations/SVB_INSTRUMENT_MIGRATION_SUMMARY.md`

---

**Alert Generated By:** Claude Code Agent (Sonnet 4.5)
**Alert Date:** 2025-11-21
**Priority:** HIGH - Requires User Decision Before Proceeding
