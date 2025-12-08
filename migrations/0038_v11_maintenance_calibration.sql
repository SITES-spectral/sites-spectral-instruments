-- ============================================================================
-- Migration 0038: V11 Maintenance & Calibration Records (Comprehensive)
-- SITES Spectral v11.0.0-alpha.3
-- Date: 2025-12-08
-- ============================================================================
-- This migration adds V11 Hexagonal Architecture tables with FULL V8 features:
--   1. maintenance_records - Unified maintenance for platforms AND instruments
--   2. calibration_records - Comprehensive calibration for multispectral sensors
--
-- Calibration Features (V8 enhanced):
--   - Calibration timing workflow (before_cleaning, after_cleaning, both)
--   - Full reflectance panel tracking (type, serial, condition, nominal reflectance)
--   - Ambient conditions (cloud cover with intermittent, solar zenith/azimuth)
--   - Sensor state before/after with cleaning workflow documentation
--   - Per-channel measurements before/after as JSON
--   - Dark current values and integration time
--   - Quality metrics (passed, score, deviation, RMSE, R²)
--   - Photo documentation and raw data file paths
-- ============================================================================

-- ============================================================================
-- PART 1: MAINTENANCE RECORDS TABLE (V11)
-- ============================================================================
-- Unified maintenance tracking for both platforms and instruments.
-- Supports timeline visualization and scheduling.
-- ============================================================================

CREATE TABLE IF NOT EXISTS maintenance_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Entity Reference (polymorphic - platform OR instrument)
    entity_type TEXT NOT NULL CHECK (entity_type IN ('platform', 'instrument')),
    entity_id INTEGER NOT NULL,
    station_id INTEGER,                              -- Denormalized for efficient queries

    -- Maintenance Classification
    type TEXT NOT NULL CHECK (type IN (
        'preventive',      -- Scheduled preventive maintenance
        'corrective',      -- Fix existing issue
        'inspection',      -- Visual inspection
        'cleaning',        -- Cleaning sensors/equipment
        'calibration',     -- Calibration-related maintenance
        'upgrade',         -- Equipment upgrade
        'repair',          -- Repair work
        'replacement',     -- Part replacement
        'installation',    -- Initial installation
        'decommissioning'  -- End-of-life decommissioning
    )),
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN (
        'scheduled',       -- Planned for future
        'in_progress',     -- Currently ongoing
        'completed',       -- Successfully completed
        'cancelled',       -- Cancelled
        'deferred'         -- Postponed
    )),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN (
        'low',             -- Can wait
        'normal',          -- Standard priority
        'high',            -- Important
        'critical'         -- Urgent - affects operations
    )),

    -- Descriptive Fields
    title TEXT NOT NULL,                             -- Short title
    description TEXT,                                -- Detailed description

    -- Scheduling
    scheduled_date TEXT NOT NULL,                    -- ISO 8601 planned date
    completed_date TEXT,                             -- Actual completion date

    -- Execution Details
    performed_by TEXT,                               -- Technician name
    work_performed TEXT,                             -- Description of work done
    parts_replaced TEXT,                             -- JSON array of replaced parts

    -- Cost and Duration
    cost REAL,                                       -- Cost in local currency
    duration INTEGER,                                -- Duration in minutes

    -- Notes and Follow-up
    notes TEXT,                                      -- Additional notes
    next_scheduled_date TEXT,                        -- Recommended next maintenance

    -- Audit Fields
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

    -- Indexes defined below
    FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE SET NULL
);

-- Indexes for maintenance_records
CREATE INDEX IF NOT EXISTS idx_mr_entity ON maintenance_records(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_mr_station ON maintenance_records(station_id);
CREATE INDEX IF NOT EXISTS idx_mr_type ON maintenance_records(type);
CREATE INDEX IF NOT EXISTS idx_mr_status ON maintenance_records(status);
CREATE INDEX IF NOT EXISTS idx_mr_priority ON maintenance_records(priority);
CREATE INDEX IF NOT EXISTS idx_mr_scheduled ON maintenance_records(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_mr_completed ON maintenance_records(completed_date);
CREATE INDEX IF NOT EXISTS idx_mr_next ON maintenance_records(next_scheduled_date);

-- ============================================================================
-- PART 2: CALIBRATION RECORDS TABLE (V11 with V8 Features)
-- ============================================================================
-- Comprehensive calibration records for multispectral/hyperspectral sensors.
-- Supports full field calibration workflow:
--   - 2 calibrations per session (~2 hours around solar maximum)
--   - Before AND after cleaning the instrument
--   - Full panel tracking and ambient conditions documentation
-- ============================================================================

CREATE TABLE IF NOT EXISTS calibration_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- === Instrument Reference ===
    instrument_id INTEGER NOT NULL,
    instrument_type TEXT,                            -- multispectral, hyperspectral (for validation)
    station_id INTEGER,                              -- Denormalized for efficient queries
    channel_id INTEGER,                              -- NULL = all channels, or specific channel

    -- === Calibration Classification ===
    calibration_type TEXT NOT NULL CHECK (calibration_type IN (
        'factory',           -- Manufacturer calibration
        'field',             -- Field calibration with reference panel
        'laboratory',        -- Laboratory calibration
        'cross_calibration', -- Cross-calibration with reference instrument
        'vicarious',         -- Vicarious calibration using ground targets
        'radiometric',       -- Radiometric calibration
        'spectral',          -- Spectral response calibration
        'geometric',         -- Geometric calibration
        'dark_current',      -- Dark current measurement
        'flat_field'         -- Flat field correction
    )),
    calibration_timing TEXT DEFAULT 'not_applicable' CHECK (calibration_timing IN (
        'before_cleaning',   -- Done before cleaning instrument
        'after_cleaning',    -- Done after cleaning instrument
        'both',              -- Full calibration (before + after)
        'not_applicable'     -- Cleaning not part of this calibration
    )),
    status TEXT NOT NULL DEFAULT 'valid' CHECK (status IN (
        'valid',             -- Currently valid
        'expired',           -- Past expiration date
        'superseded',        -- Replaced by newer calibration
        'pending_review'     -- Awaiting validation
    )),

    -- === Dates and Duration ===
    calibration_date TEXT NOT NULL,                  -- ISO 8601 date of calibration
    calibration_start_time TEXT,                     -- ISO 8601 time when calibration started
    calibration_end_time TEXT,                       -- ISO 8601 time when calibration ended
    duration_minutes INTEGER,                        -- Total duration in minutes
    valid_from TEXT,                                 -- When calibration becomes effective
    valid_until TEXT,                                -- Expiration date (NULL = no expiry)

    -- === Personnel ===
    performed_by TEXT,                               -- Technician/operator name
    performed_by_user_id INTEGER,                    -- User ID if in system
    laboratory TEXT,                                 -- Laboratory/facility name

    -- === Certificate/Documentation ===
    certificate_number TEXT,                         -- Calibration certificate ID
    certificate_url TEXT,                            -- URL to certificate document

    -- === Reflectance Panel Details (V8 Feature) ===
    panel_type TEXT CHECK (panel_type IN (
        'spectralon_99',     -- Spectralon 99% reflectance
        'spectralon_50',     -- Spectralon 50% reflectance
        'gray_18',           -- Gray 18% card
        'white_reference',   -- Generic white reference
        'black_reference',   -- Black reference for dark measurements
        'custom'             -- Custom/other panel
    )),
    panel_serial_number TEXT,                        -- Panel serial for traceability
    panel_calibration_date TEXT,                     -- When panel was last calibrated
    panel_condition TEXT CHECK (panel_condition IN (
        'excellent', 'good', 'fair', 'poor'
    )),
    panel_nominal_reflectance REAL,                  -- e.g., 0.99 for Spectralon 99%
    reference_standard TEXT,                         -- Reference standard description

    -- === Ambient Conditions (V8 Feature) ===
    temperature_celsius REAL,                        -- Air temperature
    humidity_percent REAL,                           -- Relative humidity (optional)
    cloud_cover TEXT CHECK (cloud_cover IN (
        'clear',             -- No clouds
        'mostly_clear',      -- Few clouds (<25%)
        'partly_cloudy',     -- Some clouds (25-50%)
        'mostly_cloudy',     -- Many clouds (50-75%)
        'overcast',          -- Full cloud cover
        'intermittent'       -- Variable/passing clouds - IMPORTANT for data quality
    )),
    wind_speed_ms REAL,                              -- Wind speed in m/s
    solar_zenith_angle REAL,                         -- Solar zenith angle in degrees (0-90)
    solar_azimuth_angle REAL,                        -- Solar azimuth angle in degrees (0-360)
    ambient_conditions_json TEXT,                    -- Additional conditions as JSON

    -- === Sensor State BEFORE Calibration (V8 Feature) ===
    cleanliness_state_before TEXT CHECK (cleanliness_state_before IN (
        'clean', 'dusty', 'dirty', 'contaminated'
    )),
    physical_aspect_before TEXT,                     -- Text description of sensor state

    -- === Cleaning Details (V8 Feature) ===
    cleaning_performed INTEGER DEFAULT 0,            -- Boolean: was cleaning done?
    cleaning_method TEXT CHECK (cleaning_method IN (
        'dry_wipe', 'compressed_air', 'wet_clean', 'ultrasonic'
    )),
    cleaning_solution TEXT,                          -- Solution used if wet cleaning

    -- === Sensor State AFTER Calibration (V8 Feature) ===
    cleanliness_state_after TEXT CHECK (cleanliness_state_after IN (
        'clean', 'dusty', 'dirty', 'contaminated'
    )),
    physical_aspect_after TEXT,                      -- Text description after calibration

    -- === Measurements (V8 Feature) ===
    -- Format: { "channel_1": { "wavelength_nm": 450, "value": 0.85 }, ... }
    measurements_before_json TEXT,                   -- Measurements before cleaning/calibration
    measurements_after_json TEXT,                    -- Measurements after cleaning/calibration

    -- === Calibration Coefficients (Output) ===
    -- Format: { "channel_1": { "gain": 1.02, "offset": 0.01 }, ... }
    coefficients_json TEXT,

    -- === Dark Current & Integration (V8 Feature) ===
    dark_current_values_json TEXT,                   -- JSON array of dark current readings
    integration_time_ms REAL,                        -- Integration time used (milliseconds)

    -- === Quality Metrics (V8 Feature) ===
    quality_passed INTEGER,                          -- Boolean: did it pass QC?
    quality_score REAL,                              -- 0-100 overall quality score
    deviation_from_reference REAL,                   -- Percentage deviation from expected
    uncertainty REAL,                                -- Measurement uncertainty
    rmse REAL,                                       -- Root mean square error
    r2 REAL,                                         -- R-squared coefficient (0-1)
    quality_notes TEXT,                              -- Notes on quality assessment

    -- === Documentation (V8 Feature) ===
    description TEXT,                                -- Calibration description
    methodology TEXT,                                -- Calibration methodology used
    notes TEXT,                                      -- Additional notes
    photos_json TEXT,                                -- JSON array of photo URLs/paths
    raw_data_path TEXT,                              -- Path to raw calibration data files
    attachments_json TEXT,                           -- JSON array of attachment paths
    metadata_json TEXT,                              -- Additional metadata as JSON

    -- === Audit Fields ===
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,                              -- User ID who created record

    -- === Foreign Keys ===
    FOREIGN KEY (instrument_id) REFERENCES instruments(id) ON DELETE CASCADE,
    FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE SET NULL,
    FOREIGN KEY (performed_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for calibration_records
CREATE INDEX IF NOT EXISTS idx_cr_instrument ON calibration_records(instrument_id);
CREATE INDEX IF NOT EXISTS idx_cr_station ON calibration_records(station_id);
CREATE INDEX IF NOT EXISTS idx_cr_channel ON calibration_records(channel_id);
CREATE INDEX IF NOT EXISTS idx_cr_type ON calibration_records(calibration_type);
CREATE INDEX IF NOT EXISTS idx_cr_timing ON calibration_records(calibration_timing);
CREATE INDEX IF NOT EXISTS idx_cr_status ON calibration_records(status);
CREATE INDEX IF NOT EXISTS idx_cr_date ON calibration_records(calibration_date);
CREATE INDEX IF NOT EXISTS idx_cr_valid_until ON calibration_records(valid_until);
CREATE INDEX IF NOT EXISTS idx_cr_panel_serial ON calibration_records(panel_serial_number);
CREATE INDEX IF NOT EXISTS idx_cr_cloud_cover ON calibration_records(cloud_cover);
CREATE INDEX IF NOT EXISTS idx_cr_quality_passed ON calibration_records(quality_passed);
CREATE INDEX IF NOT EXISTS idx_cr_cleaning_performed ON calibration_records(cleaning_performed);
CREATE INDEX IF NOT EXISTS idx_cr_performed_by ON calibration_records(performed_by);

-- ============================================================================
-- PART 3: V11 VIEWS FOR TIMELINE VISUALIZATION
-- ============================================================================

-- View: Maintenance timeline for a platform
DROP VIEW IF EXISTS v_platform_maintenance_timeline;
CREATE VIEW v_platform_maintenance_timeline AS
SELECT
    mr.id,
    mr.entity_type,
    mr.entity_id,
    mr.type,
    mr.status,
    mr.priority,
    mr.title,
    mr.description,
    mr.scheduled_date,
    mr.completed_date,
    mr.performed_by,
    mr.duration,
    mr.cost,
    p.normalized_name as platform_name,
    p.display_name as platform_display_name,
    p.platform_type,
    s.acronym as station_acronym,
    s.display_name as station_name
FROM maintenance_records mr
JOIN platforms p ON mr.entity_type = 'platform' AND mr.entity_id = p.id
JOIN stations s ON p.station_id = s.id
ORDER BY mr.scheduled_date DESC;

-- View: Maintenance timeline for an instrument
DROP VIEW IF EXISTS v_instrument_maintenance_timeline;
CREATE VIEW v_instrument_maintenance_timeline AS
SELECT
    mr.id,
    mr.entity_type,
    mr.entity_id,
    mr.type,
    mr.status,
    mr.priority,
    mr.title,
    mr.description,
    mr.scheduled_date,
    mr.completed_date,
    mr.performed_by,
    mr.duration,
    mr.cost,
    i.normalized_name as instrument_name,
    i.display_name as instrument_display_name,
    i.instrument_type,
    p.normalized_name as platform_name,
    s.acronym as station_acronym,
    s.display_name as station_name
FROM maintenance_records mr
JOIN instruments i ON mr.entity_type = 'instrument' AND mr.entity_id = i.id
JOIN platforms p ON i.platform_id = p.id
JOIN stations s ON p.station_id = s.id
ORDER BY mr.scheduled_date DESC;

-- View: Current valid calibrations per instrument (with V8 features)
DROP VIEW IF EXISTS v_current_calibrations;
CREATE VIEW v_current_calibrations AS
SELECT
    cr.id,
    cr.instrument_id,
    cr.instrument_type,
    cr.station_id,
    cr.channel_id,
    cr.calibration_type,
    cr.calibration_timing,
    cr.calibration_date,
    cr.calibration_start_time,
    cr.calibration_end_time,
    cr.duration_minutes,
    cr.valid_until,
    cr.coefficients_json,
    cr.uncertainty,
    cr.performed_by,
    cr.laboratory,
    cr.certificate_number,
    cr.panel_type,
    cr.panel_serial_number,
    cr.panel_condition,
    cr.cloud_cover,
    cr.solar_zenith_angle,
    cr.quality_passed,
    cr.quality_score,
    cr.cleaning_performed,
    i.normalized_name as instrument_name,
    i.display_name as instrument_display_name,
    p.normalized_name as platform_name,
    s.acronym as station_acronym,
    CASE
        WHEN cr.valid_until IS NULL THEN 'no_expiry'
        WHEN cr.valid_until < date('now') THEN 'expired'
        WHEN cr.valid_until <= date('now', '+30 days') THEN 'expiring_soon'
        ELSE 'valid'
    END as validity_status,
    CAST(JULIANDAY(cr.valid_until) - JULIANDAY('now') AS INTEGER) as days_until_expiry,
    CASE
        WHEN cr.solar_zenith_angle IS NOT NULL AND cr.solar_zenith_angle <= 45 THEN 'optimal'
        WHEN cr.solar_zenith_angle IS NOT NULL AND cr.solar_zenith_angle <= 60 THEN 'acceptable'
        WHEN cr.solar_zenith_angle IS NOT NULL THEN 'suboptimal'
        ELSE 'unknown'
    END as solar_conditions
FROM calibration_records cr
JOIN instruments i ON cr.instrument_id = i.id
JOIN platforms p ON i.platform_id = p.id
JOIN stations s ON p.station_id = s.id
WHERE cr.status = 'valid'
  AND (cr.valid_until IS NULL OR cr.valid_until >= date('now'))
ORDER BY cr.calibration_date DESC;

-- View: Calibration timeline per instrument (with V8 features)
DROP VIEW IF EXISTS v_calibration_timeline;
CREATE VIEW v_calibration_timeline AS
SELECT
    cr.id,
    cr.instrument_id,
    cr.instrument_type,
    cr.station_id,
    cr.channel_id,
    cr.calibration_type,
    cr.calibration_timing,
    cr.status,
    cr.calibration_date,
    cr.calibration_start_time,
    cr.calibration_end_time,
    cr.duration_minutes,
    cr.valid_from,
    cr.valid_until,
    cr.coefficients_json,
    cr.uncertainty,
    cr.performed_by,
    cr.laboratory,
    cr.certificate_number,
    cr.notes,
    cr.panel_type,
    cr.panel_serial_number,
    cr.panel_condition,
    cr.cloud_cover,
    cr.solar_zenith_angle,
    cr.solar_azimuth_angle,
    cr.quality_passed,
    cr.quality_score,
    cr.deviation_from_reference,
    cr.cleaning_performed,
    cr.cleanliness_state_before,
    cr.cleanliness_state_after,
    i.normalized_name as instrument_name,
    i.display_name as instrument_display_name,
    p.normalized_name as platform_name,
    s.acronym as station_acronym
FROM calibration_records cr
JOIN instruments i ON cr.instrument_id = i.id
JOIN platforms p ON i.platform_id = p.id
JOIN stations s ON p.station_id = s.id
ORDER BY cr.instrument_id, cr.calibration_date DESC;

-- View: Calibration quality analysis
DROP VIEW IF EXISTS v_calibration_quality_analysis;
CREATE VIEW v_calibration_quality_analysis AS
SELECT
    cr.instrument_id,
    i.normalized_name as instrument_name,
    i.instrument_type,
    s.acronym as station_acronym,
    COUNT(*) as total_calibrations,
    COUNT(CASE WHEN cr.quality_passed = 1 THEN 1 END) as passed_count,
    COUNT(CASE WHEN cr.quality_passed = 0 THEN 1 END) as failed_count,
    AVG(cr.quality_score) as avg_quality_score,
    AVG(cr.deviation_from_reference) as avg_deviation,
    AVG(cr.solar_zenith_angle) as avg_solar_zenith,
    COUNT(CASE WHEN cr.cloud_cover = 'clear' THEN 1 END) as clear_sky_count,
    COUNT(CASE WHEN cr.cloud_cover = 'intermittent' THEN 1 END) as intermittent_count,
    COUNT(CASE WHEN cr.cleaning_performed = 1 THEN 1 END) as with_cleaning_count,
    MAX(cr.calibration_date) as last_calibration_date,
    MIN(cr.calibration_date) as first_calibration_date
FROM calibration_records cr
JOIN instruments i ON cr.instrument_id = i.id
JOIN platforms p ON i.platform_id = p.id
JOIN stations s ON p.station_id = s.id
GROUP BY cr.instrument_id, i.normalized_name, i.instrument_type, s.acronym;

-- View: Panel usage tracking
DROP VIEW IF EXISTS v_panel_usage;
CREATE VIEW v_panel_usage AS
SELECT
    cr.panel_serial_number,
    cr.panel_type,
    COUNT(*) as usage_count,
    COUNT(DISTINCT cr.instrument_id) as instruments_calibrated,
    COUNT(DISTINCT cr.station_id) as stations_used,
    AVG(cr.quality_score) as avg_quality_score,
    MAX(cr.panel_calibration_date) as latest_panel_calibration,
    MAX(cr.calibration_date) as last_used_date,
    MIN(cr.calibration_date) as first_used_date
FROM calibration_records cr
WHERE cr.panel_serial_number IS NOT NULL
GROUP BY cr.panel_serial_number, cr.panel_type
ORDER BY usage_count DESC;

-- ============================================================================
-- PART 4: TRIGGERS FOR AUDIT TIMESTAMPS
-- ============================================================================

-- Trigger: Update maintenance_records.updated_at on update
DROP TRIGGER IF EXISTS trg_mr_updated_at;
CREATE TRIGGER trg_mr_updated_at
AFTER UPDATE ON maintenance_records
FOR EACH ROW
BEGIN
    UPDATE maintenance_records
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
END;

-- Trigger: Update calibration_records.updated_at on update
DROP TRIGGER IF EXISTS trg_cr_updated_at;
CREATE TRIGGER trg_cr_updated_at
AFTER UPDATE ON calibration_records
FOR EACH ROW
BEGIN
    UPDATE calibration_records
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
END;

-- ============================================================================
-- MIGRATION SUMMARY
-- ============================================================================
-- New Tables (V11 Architecture with V8 Features):
--   - maintenance_records - Unified maintenance for platforms AND instruments
--   - calibration_records - Comprehensive calibration with full workflow support
--
-- Calibration Features (55+ columns):
--   - Classification: type, timing (before_cleaning, after_cleaning, both)
--   - Dates: date, start_time, end_time, duration_minutes, valid_from/until
--   - Panel: type, serial, calibration_date, condition, nominal_reflectance
--   - Ambient: temperature, humidity, cloud_cover (with intermittent), wind, solar angles
--   - Sensor State: before/after cleanliness, physical aspect, cleaning workflow
--   - Measurements: per-channel before/after JSON, dark current, integration time
--   - Quality: passed, score, deviation, uncertainty, RMSE, R²
--   - Documentation: description, methodology, notes, photos, raw data path
--
-- New Indexes: 21 indexes for query optimization
--
-- New Views (V11):
--   - v_platform_maintenance_timeline - Platform maintenance history
--   - v_instrument_maintenance_timeline - Instrument maintenance history
--   - v_current_calibrations - Active calibrations with solar/quality info
--   - v_calibration_timeline - Full calibration history per instrument
--   - v_calibration_quality_analysis - Quality metrics aggregation
--   - v_panel_usage - Panel usage tracking across instruments
--
-- New Triggers:
--   - trg_mr_updated_at - Auto-update timestamps
--   - trg_cr_updated_at - Auto-update timestamps
--
-- Note: V8 tables (maintenance_history, calibration_logs) are NOT preserved.
--       This is a fresh V11 implementation without backward compatibility.
-- ============================================================================
