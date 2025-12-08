# SITES Spectral Instrument Images Audit Report

**Generated:** 2025-09-19
**Total Instruments in Database:** 23
**Total Instruments with L1 Data:** 20
**Success Rate:** 87.0% (20/23)

## Executive Summary

The audit reveals that **20 out of 23 instruments** (87%) in the database have corresponding L1 phenocam data available for representative image generation. The main issues are:

1. **ASA Station Missing**: The ASA (Åsa) station has no data directory yet - confirmed by user that ASA, Bolmen, and Erken don't have data yet
2. **One Missing Instrument**: SVB_MIR_PL03_PHE01 doesn't exist in the L1 data (only PL01 and PL02 exist for Svartberget MIR platforms)

## Station-by-Station Breakdown

| Station | Acronym | Instruments | With L1 Data | Success Rate | Status |
|---------|---------|-------------|--------------|--------------|---------|
| Abisko | ANS | 1 | 1 | 100.0% | ✅ Complete |
| Åsa | ASA | 2 | 0 | 0.0% | ❌ No data directory |
| Grimsö | GRI | 1 | 1 | 100.0% | ✅ Complete |
| Lönnstorp | LON | 3 | 3 | 100.0% | ✅ Complete |
| Röbäcksdalen | RBD | 2 | 2 | 100.0% | ✅ Complete |
| Skogaryd | SKC | 9 | 9 | 100.0% | ✅ Complete |
| Svartberget | SVB | 5 | 4 | 80.0% | ⚠️ 1 missing |

## Detailed Findings

### ✅ Instruments with L1 Data Available (20)

**Abisko (ANS):**
- ANS_FOR_BL01_PHE01 ✅

**Grimsö (GRI):**
- GRI_FOR_BL01_PHE01 ✅

**Lönnstorp (LON):**
- LON_AGR_PL01_PHE01 ✅
- LON_AGR_PL01_PHE02 ✅
- LON_AGR_PL01_PHE03 ✅

**Röbäcksdalen (RBD):**
- RBD_AGR_PL01_PHE01 ✅
- RBD_AGR_PL02_PHE01 ✅

**Skogaryd (SKC):**
- SKC_CEM_FOR_PL01_PHE01 ✅
- SKC_CEM_FOR_PL02_PHE01 ✅
- SKC_CEM_FOR_PL03_PHE01 ✅
- SKC_LAK_PL01_PHE01 ✅
- SKC_MAD_FOR_PL02_PHE01 ✅
- SKC_MAD_WET_PL01_PHE01 ✅
- SKC_SRC_FOL_WET_PL01_PHE01 ✅
- SKC_SRC_FOL_WET_PL02_PHE01 ✅
- STM_FOR_PL01_PHE01 ✅

**Svartberget (SVB):**
- SVB_FOR_PL01_PHE01 ✅
- SVB_FOR_PL01_PHE02 ✅
- SVB_MIR_PL01_PHE01 ✅
- SVB_MIR_PL02_PHE01 ✅

### ❌ Instruments Missing L1 Data (3)

**ASA Station - No Data Directory (2 instruments):**
- ASA_FOR_PL01_PHE01 ❌ (Station data directory missing)
- ASA_FOR_PL02_PHE01 ❌ (Station data directory missing)

**Svartberget - Missing Instrument (1 instrument):**
- SVB_MIR_PL03_PHE01 ⚠️ (Only PL01 and PL02 exist in L1 data)

## Data Sources Comparison

### Database vs stations.yaml
- **Database:** 23 instruments
- **stations.yaml:** 5 instruments
- **Gap:** 18 instruments in database not represented in stations.yaml

### Database vs L1 Data
- **Database:** 23 instruments
- **L1 Data:** 20 instruments available
- **Gap:** 3 instruments in database without L1 data

## Image Generation Status

### Currently Working
The image generation system successfully works for all 20 instruments with L1 data:

```bash
# Generate images for all available instruments
npm run update-images

# Example success for specific stations:
npm run update-images -- --station=LON  # 3 instruments
npm run update-images -- --station=SKC  # 9 instruments
npm run update-images -- --station=SVB  # 4 instruments
```

### Graceful Handling of Missing Data
The system properly handles missing instruments:
- Displays camera placeholder icons for missing images
- Shows "No representative image available" message
- Maintains professional interface without errors

## Recommendations

### Immediate Actions
1. **Continue with Current 20 Instruments**: The system works perfectly for 87% of instruments
2. **Monitor ASA Station**: When ASA data becomes available, simply run `npm run update-images -- --station=ASA`
3. **Investigate SVB_MIR_PL03_PHE01**: Confirm if this instrument exists or should be removed from database

### Future Enhancements
1. **Database Cleanup**: Consider removing SVB_MIR_PL03_PHE01 if it doesn't exist physically
2. **stations.yaml Synchronization**: Update stations.yaml to include all 23 instruments for consistency
3. **Automated Monitoring**: Set up automated checks for new station data availability

## Technical Notes

### Naming Conventions
All instrument names follow consistent pattern: `{STATION}_{ECOSYSTEM}_{PLATFORM}_{INSTRUMENT}`
- No naming mismatches found between database and L1 data
- Legacy acronyms properly handled in the interface

### Performance
- Image discovery: ~1-2 seconds per station
- Image copying: ~3-4MB average per instrument
- Total storage: ~60-80MB for all 20 available images

### Error Handling
- Missing station directories: Gracefully reported
- Missing instruments: Clear error messages
- Failed image loads: Automatic fallback to placeholders

This audit confirms the phenocam representative images system is working correctly for all available data, with proper handling of missing data scenarios.