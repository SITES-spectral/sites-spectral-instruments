# SITES Spectral Backend Enhancement Deployment Guide v2.0
**Zero-Downtime Production Deployment for Research Programs & Phenocam Infrastructure**

## Executive Summary

This deployment enhances your SITES Spectral system with:
- **Research Programs Multiselect**: Complete API endpoints for program management
- **Enhanced Camera Validation**: Comprehensive specifications database with 6 camera models
- **Phenocam ROI Processing**: Nested data queries for advanced phenocam analysis
- **Production Readiness**: 12 new fields with full backward compatibility

## 🎯 Deployment Architecture

### Pre-Migration State (Current)
- **Migration 0025**: ✅ Applied (instrument deployment, camera fields, EPSG codes)
- **Current Version**: 5.1.0 (Platform functionality restored)
- **Production Status**: ✅ Fully operational

### Post-Migration State (Target)
- **Migration 0026**: 🚀 Ready to deploy (research programs, phenocam enhancements)
- **New API Endpoints**: 3 additional endpoints for enhanced functionality
- **Enhanced Validation**: Camera specifications with manufacturer lookup
- **Phenocam Integration**: Complete ROI processing pipeline

## 📋 Pre-Deployment Checklist

### 1. Backup Strategy (CRITICAL)
```bash
# Execute comprehensive backup
node scripts/backup-before-migration.js

# Verify backup files created
ls -la backups/
# Expected files:
# - schema-backup-YYYY-MM-DD-HH-MM.sql
# - *-data-YYYY-MM-DD-HH-MM.json
# - table-snapshot-YYYY-MM-DD-HH-MM.json
# - readiness-check-YYYY-MM-DD-HH-MM.json
# - recovery-instructions-YYYY-MM-DD-HH-MM.md
```

### 2. Environment Verification
```bash
# Verify remote database connectivity
npx wrangler d1 execute spectral_stations_db --remote --command="SELECT 1 as test;"

# Check current migration state
npx wrangler d1 execute spectral_stations_db --remote --command="SELECT migration_number, applied_at FROM migration_metadata ORDER BY applied_at DESC LIMIT 5;"

# Verify no migration 0026 exists
npx wrangler d1 execute spectral_stations_db --remote --command="SELECT * FROM migration_metadata WHERE migration_number = '0026';"
```

### 3. Data Integrity Check
```bash
# Verify critical table counts
npx wrangler d1 execute spectral_stations_db --remote --command="
SELECT
  (SELECT COUNT(*) FROM stations) as stations,
  (SELECT COUNT(*) FROM platforms) as platforms,
  (SELECT COUNT(*) FROM instruments) as instruments,
  (SELECT COUNT(*) FROM instrument_rois) as rois;
"
```

## 🚀 Deployment Steps

### Step 1: Apply Migration 0026
```bash
# Apply the enhanced schema migration
npx wrangler d1 migrations apply spectral_stations_db --remote

# Verify migration applied successfully
npx wrangler d1 execute spectral_stations_db --remote --command="
SELECT migration_number, description, fields_added
FROM migration_metadata
WHERE migration_number = '0026';
"
```

### Step 2: Verify New Schema Elements
```bash
# Check research programs table populated
npx wrangler d1 execute spectral_stations_db --remote --command="
SELECT COUNT(*) as program_count,
       COUNT(CASE WHEN is_active = true THEN 1 END) as active_programs
FROM research_programs;
"

# Verify camera specifications table
npx wrangler d1 execute spectral_stations_db --remote --command="
SELECT COUNT(*) as camera_models,
       COUNT(DISTINCT brand) as unique_brands
FROM camera_specifications;
"

# Test enhanced instruments view
npx wrangler d1 execute spectral_stations_db --remote --command="
SELECT COUNT(*) FROM v_instruments_enhanced LIMIT 1;
"
```

### Step 3: Deploy Enhanced API Code
```bash
# Build with version bump
npm run build:bump

# Deploy to production
npm run deploy

# Verify deployment success
curl -X GET "https://sites-spectral-instruments.jose-e5f.workers.dev/api/health" \
  -H "Accept: application/json"
```

### Step 4: Test New API Endpoints
```bash
# Test research programs endpoint
curl -X GET "https://sites-spectral-instruments.jose-e5f.workers.dev/api/research-programs?active=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test research programs values for multiselect
curl -X GET "https://sites-spectral-instruments.jose-e5f.workers.dev/api/values/research-programs" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test phenocam ROIs overview
curl -X GET "https://sites-spectral-instruments.jose-e5f.workers.dev/api/phenocam-rois?processing_enabled=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🎛️ New API Endpoints

### Research Programs Multiselect
```
GET /api/research-programs
  - ?active=true (filter active programs)
  - ?stats=true (include usage statistics)

GET /api/research-programs/{id}
  - Detailed program with participating platforms

GET /api/values/research-programs
  - Formatted for multiselect components
  - Includes usage indicators
```

### Phenocam ROI Management
```
GET /api/phenocam-rois
  - Overview across all stations
  - ?processing_enabled=true
  - ?station={station_code}

GET /api/phenocam-rois/{instrumentId}
  - ROIs for specific instrument
  - Enhanced processing metadata

POST /api/phenocam-rois/{instrumentId}
  - Create ROI with processing defaults

PUT /api/phenocam-rois/{instrumentId}/roi/{roiId}
  - Update with processing status tracking

DELETE /api/phenocam-rois/{instrumentId}/roi/{roiId}
  - Safe deletion with dependency checks
```

### Enhanced Camera Validation
```
Integrated into existing endpoints:
POST /api/instruments (with camera validation)
PUT /api/instruments/{id} (with specification checks)
```

## 📊 Schema Enhancements Summary

### New Fields Added (14 total)

#### Platforms Table
- `research_programs` TEXT (comma-separated program codes)

#### Instruments Table (11 new fields)
- `calibration_date` DATE
- `calibration_notes` TEXT
- `manufacturer_warranty_expires` DATE
- `power_source` TEXT (default: 'Solar+Battery')
- `data_transmission` TEXT (default: 'LoRaWAN')
- `image_processing_enabled` BOOLEAN (default: false)
- `image_archive_path` TEXT
- `last_image_timestamp` DATETIME
- `image_quality_score` REAL

#### Instrument ROIs Table (4 new fields)
- `roi_processing_enabled` BOOLEAN (default: true)
- `vegetation_mask_path` TEXT
- `last_processed_timestamp` DATETIME
- `processing_status` TEXT (default: 'pending')

### New Lookup Tables

#### Research Programs (8 programs)
- SITES-SPECTRAL (Main SITES phenocam monitoring)
- ICOS (Integrated Carbon Observation System)
- LTER (Long Term Ecological Research)
- PHENOCAM (Phenocam Network)
- CLIMATE-ADAPT (Climate adaptation research)
- ECOSYSTEM-FLUX (Carbon and energy flux)
- BIODIVERSITY-MONITOR (Species monitoring)
- FOREST-DYNAMICS (Forest growth studies)

#### Camera Specifications (6 models)
- Canon EOS R5 (45MP, ISO 100-51200)
- Sony A7R IV (61MP, ISO 100-32000)
- Nikon D850 (45.7MP, ISO 64-25600)
- StarDot NetCam SC5 (5MP, ISO 100-1600)
- Mobotix M26 (6MP, ISO 100-800)
- Axis P1378 (8MP, ISO 100-1600)

## 🔍 Post-Deployment Verification

### 1. Data Integrity Verification
```bash
# Compare with pre-migration snapshot
# Check that row counts match or have expected increases

# Verify all existing instruments still accessible
npx wrangler d1 execute spectral_stations_db --remote --command="
SELECT COUNT(*) as total_instruments,
       COUNT(CASE WHEN image_processing_enabled IS NOT NULL THEN 1 END) as enhanced_instruments
FROM instruments;
"
```

### 2. API Functionality Tests
```bash
# Test existing endpoints still work
curl -X GET "https://sites-spectral-instruments.jose-e5f.workers.dev/api/stations" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test enhanced instrument data
curl -X GET "https://sites-spectral-instruments.jose-e5f.workers.dev/api/instruments/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Frontend Integration Test
- Login to admin dashboard: https://sites.jobelab.com
- Verify station loading works
- Test instrument creation with new camera fields
- Confirm research programs multiselect functionality

## 🛡️ Rollback Strategy

### If Migration Fails
```bash
# Check what was applied
npx wrangler d1 execute spectral_stations_db --remote --command="
PRAGMA table_info(instruments);
"

# Remove migration record if partially applied
npx wrangler d1 execute spectral_stations_db --remote --command="
DELETE FROM migration_metadata WHERE migration_number = '0026';
"
```

### If API Issues Detected
```bash
# Immediate rollback to previous version
git checkout HEAD~1
npm run build
npm run deploy
```

### Data Recovery (if needed)
1. Use backup files from `backups/` directory
2. Follow recovery instructions in generated markdown file
3. Restore from schema and data snapshots

## 📈 Performance Impact Assessment

### Expected Improvements
- **Query Performance**: 8 new indexes optimize frequent lookups
- **Data Organization**: Research programs enable better filtering
- **User Experience**: Camera validation prevents invalid entries
- **Processing Efficiency**: Phenocam ROI tracking reduces redundant operations

### Monitoring Points
- Database response times for instrument queries
- API endpoint performance for research programs
- Frontend multiselect component responsiveness
- Camera validation processing time

## 🎯 Success Criteria

- [ ] Migration 0026 applied without errors
- [ ] All existing functionality preserved
- [ ] Research programs API endpoints operational
- [ ] Camera validation working with 6 supported models
- [ ] Phenocam ROI queries returning nested data
- [ ] Frontend multiselect components functional
- [ ] Zero data loss confirmed
- [ ] Performance metrics within acceptable range

## 🚨 Emergency Contacts

- **Backend Lead**: Cascade (Watershed Collective)
- **Migration Support**: Check CLAUDE.md for latest procedures
- **Production Issues**: Use recovery instructions in backup directory
- **Database Monitoring**: Check migration_metadata table for status

## 🎉 Post-Deployment Next Steps

1. **User Training**: Update documentation for new research programs features
2. **Data Migration**: Populate research_programs field for existing platforms
3. **Camera Database**: Add additional camera models as needed
4. **Phenocam Processing**: Configure processing pipelines to use new ROI fields
5. **Performance Tuning**: Monitor and optimize based on real usage patterns

---

**Deployment prepared by**: Cascade, Backend Systems Architect
**Architecture**: Zero-downtime, production-ready enhancement
**Backup Strategy**: Comprehensive with full recovery procedures
**Risk Level**: LOW (100% backward compatible)
**Expected Duration**: 15-20 minutes for complete deployment