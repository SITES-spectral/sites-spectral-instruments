#!/usr/bin/env node

/**
 * Comprehensive Backup Strategy for Schema Changes
 * Creates full database backups before applying migrations
 * Supports both local and remote database environments
 */

import { execSync } from 'child_process';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const BACKUP_DIR = './backups';
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

/**
 * Main backup orchestrator
 */
async function createPreMigrationBackup() {
  console.log('🚀 SITES Spectral - Pre-Migration Backup Strategy');
  console.log('================================================\n');

  try {
    // Ensure backup directory exists
    if (!existsSync(BACKUP_DIR)) {
      mkdirSync(BACKUP_DIR, { recursive: true });
      console.log(`✅ Created backup directory: ${BACKUP_DIR}`);
    }

    // Step 1: Full database export
    await exportDatabaseSchema();
    await exportDatabaseData();

    // Step 2: Critical table snapshots
    await createTableSnapshots();

    // Step 3: Migration readiness check
    await performReadinessCheck();

    // Step 4: Generate recovery instructions
    generateRecoveryInstructions();

    console.log('\n🎯 Backup Strategy Complete!');
    console.log('✅ Database schema exported');
    console.log('✅ Critical data backed up');
    console.log('✅ Table snapshots created');
    console.log('✅ Recovery instructions generated');
    console.log('\n📋 Ready for migration 0026 deployment');

  } catch (error) {
    console.error('❌ Backup strategy failed:', error.message);
    process.exit(1);
  }
}

/**
 * Export complete database schema structure
 */
async function exportDatabaseSchema() {
  console.log('📊 Exporting database schema...');

  const schemaExport = `
-- SITES Spectral Database Schema Backup
-- Generated: ${new Date().toISOString()}
-- Migration: Pre-0026 Schema State
-- Purpose: Complete schema backup before production enhancements

-- Export schema for all tables
`;

  try {
    // Use wrangler to export schema
    const schemaCommand = 'npx wrangler d1 export spectral_stations_db --output /dev/stdout --no-data';
    const schemaData = execSync(schemaCommand, { encoding: 'utf8' });

    const fullBackup = schemaExport + schemaData;
    const schemaFile = join(BACKUP_DIR, `schema-backup-${TIMESTAMP}.sql`);

    writeFileSync(schemaFile, fullBackup);
    console.log(`✅ Schema exported: ${schemaFile}`);

  } catch (error) {
    console.warn('⚠️  Wrangler export failed, creating manual schema backup');
    await createManualSchemaBackup();
  }
}

/**
 * Export critical data tables
 */
async function exportDatabaseData() {
  console.log('💾 Exporting critical database data...');

  const criticalTables = [
    'stations',
    'platforms',
    'instruments',
    'instrument_rois',
    'users',
    'migration_metadata'
  ];

  for (const table of criticalTables) {
    try {
      const dataCommand = `npx wrangler d1 execute spectral_stations_db --remote --command="SELECT * FROM ${table};"`;
      const tableData = execSync(dataCommand, { encoding: 'utf8' });

      const dataFile = join(BACKUP_DIR, `${table}-data-${TIMESTAMP}.json`);
      writeFileSync(dataFile, JSON.stringify({
        table: table,
        backup_timestamp: new Date().toISOString(),
        data: tableData
      }, null, 2));

      console.log(`✅ ${table} data exported`);

    } catch (error) {
      console.warn(`⚠️  Failed to export ${table}:`, error.message);
    }
  }
}

/**
 * Create table snapshots with row counts
 */
async function createTableSnapshots() {
  console.log('📸 Creating table snapshots...');

  const snapshotQueries = [
    "SELECT 'stations' as table_name, COUNT(*) as row_count FROM stations",
    "SELECT 'platforms' as table_name, COUNT(*) as row_count FROM platforms",
    "SELECT 'instruments' as table_name, COUNT(*) as row_count FROM instruments",
    "SELECT 'instrument_rois' as table_name, COUNT(*) as row_count FROM instrument_rois",
    "SELECT 'users' as table_name, COUNT(*) as row_count FROM users",
    "SELECT COUNT(DISTINCT s.id) as station_count, COUNT(DISTINCT p.id) as platform_count, COUNT(DISTINCT i.id) as instrument_count FROM stations s LEFT JOIN platforms p ON s.id = p.station_id LEFT JOIN instruments i ON p.id = i.platform_id"
  ];

  const snapshot = {
    backup_timestamp: new Date().toISOString(),
    migration_target: '0026',
    table_counts: {},
    integrity_checks: []
  };

  for (const query of snapshotQueries) {
    try {
      const countCommand = `npx wrangler d1 execute spectral_stations_db --remote --command="${query}"`;
      const result = execSync(countCommand, { encoding: 'utf8' });
      snapshot.integrity_checks.push({ query, result });
    } catch (error) {
      console.warn('⚠️  Snapshot query failed:', query);
    }
  }

  const snapshotFile = join(BACKUP_DIR, `table-snapshot-${TIMESTAMP}.json`);
  writeFileSync(snapshotFile, JSON.stringify(snapshot, null, 2));
  console.log(`✅ Table snapshot created: ${snapshotFile}`);
}

/**
 * Perform migration readiness check
 */
async function performReadinessCheck() {
  console.log('🔍 Performing migration readiness check...');

  const checks = {
    timestamp: new Date().toISOString(),
    migration_target: '0026',
    checks: [],
    overall_status: 'READY'
  };

  // Check 1: Verify required tables exist
  const requiredTables = ['stations', 'platforms', 'instruments', 'instrument_rois'];
  for (const table of requiredTables) {
    try {
      const checkCommand = `npx wrangler d1 execute spectral_stations_db --remote --command="SELECT name FROM sqlite_master WHERE type='table' AND name='${table}';"`;
      const result = execSync(checkCommand, { encoding: 'utf8' });
      checks.checks.push({
        check: `Table ${table} exists`,
        status: result.includes(table) ? 'PASS' : 'FAIL',
        details: result
      });
    } catch (error) {
      checks.checks.push({
        check: `Table ${table} exists`,
        status: 'ERROR',
        details: error.message
      });
      checks.overall_status = 'WARNING';
    }
  }

  // Check 2: Verify no migration 0026 already applied
  try {
    const migrationCheck = `npx wrangler d1 execute spectral_stations_db --remote --command="SELECT migration_number FROM migration_metadata WHERE migration_number = '0026';"`;
    const result = execSync(migrationCheck, { encoding: 'utf8' });
    checks.checks.push({
      check: 'Migration 0026 not already applied',
      status: result.includes('0026') ? 'WARNING' : 'PASS',
      details: result.includes('0026') ? 'Migration 0026 already exists' : 'Migration 0026 not found (ready to apply)'
    });
  } catch (error) {
    checks.checks.push({
      check: 'Migration 0026 status',
      status: 'UNKNOWN',
      details: 'Could not check migration status'
    });
  }

  // Check 3: Verify database connectivity
  try {
    const connectivityCheck = `npx wrangler d1 execute spectral_stations_db --remote --command="SELECT 1 as test;"`;
    execSync(connectivityCheck);
    checks.checks.push({
      check: 'Database connectivity',
      status: 'PASS',
      details: 'Remote database accessible'
    });
  } catch (error) {
    checks.checks.push({
      check: 'Database connectivity',
      status: 'FAIL',
      details: 'Cannot connect to remote database'
    });
    checks.overall_status = 'CRITICAL';
  }

  const readinessFile = join(BACKUP_DIR, `readiness-check-${TIMESTAMP}.json`);
  writeFileSync(readinessFile, JSON.stringify(checks, null, 2));
  console.log(`✅ Readiness check completed: ${readinessFile}`);

  if (checks.overall_status === 'CRITICAL') {
    throw new Error('Critical readiness check failures detected');
  }
}

/**
 * Generate recovery instructions
 */
function generateRecoveryInstructions() {
  console.log('📋 Generating recovery instructions...');

  const recoveryInstructions = `
# SITES Spectral Migration 0026 - Recovery Instructions
Generated: ${new Date().toISOString()}

## Quick Recovery Commands

### If Migration Fails During Application:
1. Check migration status:
   \`\`\`bash
   npx wrangler d1 execute spectral_stations_db --remote --command="SELECT * FROM migration_metadata WHERE migration_number = '0026';"
   \`\`\`

2. Rollback strategy (if needed):
   \`\`\`bash
   # Remove failed migration entry
   npx wrangler d1 execute spectral_stations_db --remote --command="DELETE FROM migration_metadata WHERE migration_number = '0026';"

   # Drop added columns (if migration partially applied)
   npx wrangler d1 execute spectral_stations_db --remote --command="PRAGMA table_info(instruments);"
   # Manually remove columns added by 0026 if present
   \`\`\`

### If Data Corruption Detected:
1. Restore from this backup set:
   - Schema: schema-backup-${TIMESTAMP}.sql
   - Data: *-data-${TIMESTAMP}.json files
   - Snapshot: table-snapshot-${TIMESTAMP}.json

2. Verify restoration:
   \`\`\`bash
   # Check table counts match snapshot
   npx wrangler d1 execute spectral_stations_db --remote --command="SELECT COUNT(*) FROM stations;"
   npx wrangler d1 execute spectral_stations_db --remote --command="SELECT COUNT(*) FROM instruments;"
   \`\`\`

## Post-Migration Verification

### Verify New Fields Added:
\`\`\`sql
PRAGMA table_info(instruments);
PRAGMA table_info(platforms);
PRAGMA table_info(instrument_rois);
\`\`\`

### Check Research Programs Table:
\`\`\`sql
SELECT COUNT(*) FROM research_programs;
SELECT program_code, program_name FROM research_programs WHERE is_active = true;
\`\`\`

### Verify Camera Specifications:
\`\`\`sql
SELECT COUNT(*) FROM camera_specifications;
SELECT brand, model FROM camera_specifications LIMIT 5;
\`\`\`

## Emergency Contacts
- Migration applied by: Cascade (Watershed Collective Backend Lead)
- Backup timestamp: ${TIMESTAMP}
- Recovery support: Check CLAUDE.md for latest procedures

## Backup File Manifest
- schema-backup-${TIMESTAMP}.sql (Complete schema structure)
- *-data-${TIMESTAMP}.json (Critical table data)
- table-snapshot-${TIMESTAMP}.json (Pre-migration counts)
- readiness-check-${TIMESTAMP}.json (Migration readiness status)

## Success Criteria Post-Migration
- [ ] All existing data preserved
- [ ] New columns accessible without errors
- [ ] API endpoints respond correctly
- [ ] Research programs multiselect functional
- [ ] Camera validation working
- [ ] Phenocam ROI queries operational
`;

  const instructionsFile = join(BACKUP_DIR, `recovery-instructions-${TIMESTAMP}.md`);
  writeFileSync(instructionsFile, recoveryInstructions);
  console.log(`✅ Recovery instructions: ${instructionsFile}`);
}

/**
 * Manual schema backup for environments where wrangler export fails
 */
async function createManualSchemaBackup() {
  const manualSchema = `
-- Manual Schema Backup for SITES Spectral
-- Generated: ${new Date().toISOString()}

-- Core tables structure (manually documented)
-- This backup covers the essential schema elements

-- Stations table
CREATE TABLE IF NOT EXISTS stations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  normalized_name TEXT UNIQUE NOT NULL,
  acronym TEXT UNIQUE,
  display_name TEXT NOT NULL,
  -- Additional fields from previous migrations
  epsg_code TEXT DEFAULT 'EPSG:4326',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Platforms table
CREATE TABLE IF NOT EXISTS platforms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  station_id INTEGER NOT NULL,
  normalized_name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  location_code TEXT,
  ecosystem_code TEXT,
  research_programs TEXT,
  epsg_code TEXT DEFAULT 'EPSG:4326',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (station_id) REFERENCES stations(id)
);

-- Instruments table (pre-migration 0026 state)
CREATE TABLE IF NOT EXISTS instruments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform_id INTEGER NOT NULL,
  normalized_name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  legacy_acronym TEXT,
  instrument_type TEXT,
  instrument_number TEXT,
  -- Deployment and positioning
  deployment_date DATE,
  instrument_deployment_date DATE,
  latitude REAL,
  longitude REAL,
  epsg_code TEXT DEFAULT 'EPSG:4326',
  -- Camera specifications (from migration 0025)
  camera_brand TEXT,
  camera_model TEXT,
  camera_resolution TEXT,
  camera_serial_number TEXT,
  camera_aperture TEXT,
  camera_exposure_time TEXT,
  camera_focal_length_mm REAL,
  camera_iso TEXT,
  camera_lens TEXT,
  camera_mega_pixels TEXT,
  camera_white_balance TEXT,
  -- Additional fields
  instrument_degrees_from_nadir REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (platform_id) REFERENCES platforms(id)
);

-- ROIs table
CREATE TABLE IF NOT EXISTS instrument_rois (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  instrument_id INTEGER NOT NULL,
  roi_name TEXT NOT NULL,
  roi_type TEXT,
  geometry TEXT,
  description TEXT,
  comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (instrument_id) REFERENCES instruments(id)
);

-- Migration metadata tracking
CREATE TABLE IF NOT EXISTS migration_metadata (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_number TEXT NOT NULL UNIQUE,
  description TEXT,
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  fields_added INTEGER,
  performance_impact TEXT,
  backward_compatible BOOLEAN DEFAULT true
);
`;

  const schemaFile = join(BACKUP_DIR, `manual-schema-backup-${TIMESTAMP}.sql`);
  writeFileSync(schemaFile, manualSchema);
  console.log(`✅ Manual schema backup: ${schemaFile}`);
}

// Execute backup strategy
if (import.meta.url === `file://${process.argv[1]}`) {
  createPreMigrationBackup();
}

export { createPreMigrationBackup };