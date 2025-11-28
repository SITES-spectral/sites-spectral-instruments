-- ============================================================================
-- Migration 0030: Maintenance History & Calibration Logs
-- SITES Spectral v8.0.0 - Phase 7
-- Date: 2025-11-28
-- ============================================================================
-- This migration adds:
--   1. maintenance_history table - Track all maintenance activities
--   2. calibration_logs table - Track calibration for spectral instruments
--   3. error_log table - For performance monitoring
--   4. Associated indexes and views
-- ============================================================================

-- ============================================================================
-- PART 1: MAINTENANCE HISTORY TABLE
-- ============================================================================
-- Tracks all maintenance activities performed on instruments.
-- Supports recurring problem tracking, parts/materials logging, and scheduling.
-- ============================================================================

CREATE TABLE IF NOT EXISTS maintenance_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    instrument_id INTEGER NOT NULL,

    -- Maintenance Details
    maintenance_date TEXT NOT NULL,                -- ISO 8601 datetime
    maintenance_type TEXT NOT NULL,                -- routine, cleaning, calibration, repair, upgrade, inspection
    description TEXT NOT NULL,                     -- Detailed work description

    -- Categorization (uses YAML config: yamls/maintenance/maintenance-types.yaml)
    tags TEXT,                                     -- JSON array: ["lens", "cleaning", "preventive"]
    status TEXT DEFAULT 'completed',               -- scheduled, in_progress, completed, cancelled, deferred
    priority TEXT DEFAULT 'normal',                -- low, normal, high, critical

    -- Problem Tracking
    recurrent_problem INTEGER DEFAULT 0,           -- 1 = recurring issue identified
    problem_category TEXT,                         -- hardware, software, environmental, connectivity, power
    problem_severity TEXT,                         -- minor, moderate, major, critical
    root_cause TEXT,                               -- Root cause analysis text

    -- Work Details
    technician TEXT,                               -- Name of person who performed work
    technician_id INTEGER,                         -- FK to users table (optional)
    duration_minutes INTEGER,                      -- How long maintenance took

    -- Parts and Materials
    parts_replaced TEXT,                           -- JSON: [{"name": "lens", "serial": "ABC123", "cost": 150.00}]
    materials_used TEXT,                           -- JSON: [{"name": "cleaning solution", "quantity": 1}]
    total_cost REAL,                               -- Total maintenance cost

    -- Scheduling
    scheduled_date TEXT,                           -- Original scheduled date (for planned maintenance)
    completed_date TEXT,                           -- Actual completion date
    next_maintenance_date TEXT,                    -- Recommended next maintenance

    -- Documentation
    notes TEXT,                                    -- Additional notes
    photos_json TEXT,                              -- JSON array of photo references/URLs
    documents_json TEXT,                           -- JSON array of document references

    -- Audit Fields
    created_by INTEGER,                            -- FK to users
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Keys
    FOREIGN KEY (instrument_id) REFERENCES instruments(id) ON DELETE CASCADE,
    FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for maintenance_history
CREATE INDEX IF NOT EXISTS idx_mh_instrument ON maintenance_history(instrument_id);
CREATE INDEX IF NOT EXISTS idx_mh_date ON maintenance_history(maintenance_date);
CREATE INDEX IF NOT EXISTS idx_mh_status ON maintenance_history(status);
CREATE INDEX IF NOT EXISTS idx_mh_type ON maintenance_history(maintenance_type);
CREATE INDEX IF NOT EXISTS idx_mh_recurrent ON maintenance_history(recurrent_problem);
CREATE INDEX IF NOT EXISTS idx_mh_technician ON maintenance_history(technician_id);
CREATE INDEX IF NOT EXISTS idx_mh_next_date ON maintenance_history(next_maintenance_date);
CREATE INDEX IF NOT EXISTS idx_mh_created_at ON maintenance_history(created_at);

-- ============================================================================
-- PART 2: CALIBRATION LOGS TABLE
-- ============================================================================
-- Specialized calibration records for multispectral and other calibratable
-- instruments. Tracks before/after state, measurements, and quality metrics.
-- Uses YAML config: yamls/maintenance/calibration-types.yaml
-- ============================================================================

CREATE TABLE IF NOT EXISTS calibration_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    instrument_id INTEGER NOT NULL,

    -- Calibration Identification
    calibration_date TEXT NOT NULL,                -- ISO 8601 datetime
    calibration_type TEXT NOT NULL,                -- dirty, clean, full, dark_current, flat_field, wavelength
    calibration_method TEXT,                       -- reflectance_panel, integrating_sphere, cross_calibration, lamp_reference

    -- Duration and Scheduling
    duration_minutes INTEGER,                      -- How long calibration took
    frequency TEXT,                                -- daily, weekly, biweekly, monthly, seasonal, annual
    next_calibration_date TEXT,                    -- Recommended next calibration

    -- Reflectance Panel Details
    reflectance_panel_used TEXT,                   -- spectralon_99, spectralon_50, gray_18, white_reference
    panel_serial_number TEXT,                      -- Serial number of the reference panel
    panel_calibration_date TEXT,                   -- When panel was last calibrated
    panel_condition TEXT,                          -- excellent, good, fair, poor

    -- Personnel
    technician TEXT,                               -- Name of technician
    technician_id INTEGER,                         -- FK to users (optional)

    -- Ambient Conditions (JSON for flexibility)
    ambient_conditions TEXT,                       -- JSON: {"temperature_c": 20, "humidity_pct": 45, "cloud_cover": "clear", "wind_speed_ms": 2}

    -- Pre-Calibration Sensor State
    physical_aspect_before TEXT,                   -- Description of sensor condition before
    sensor_cleanliness_before TEXT,                -- clean, dusty, dirty, contaminated

    -- Cleaning Details (if applicable)
    cleaning_performed INTEGER DEFAULT 0,          -- 1 = cleaning was done
    cleaning_method TEXT,                          -- dry_wipe, compressed_air, wet_clean, ultrasonic
    cleaning_solution TEXT,                        -- Solution used if wet cleaning

    -- Post-Calibration Sensor State
    physical_aspect_after TEXT,                    -- Description after cleaning/calibration
    sensor_cleanliness_after TEXT,                 -- clean, dusty, dirty, contaminated

    -- Measurements (JSON for channel flexibility)
    measurements_json TEXT,                        -- JSON: {"channels": [{"id": 1, "wavelength_nm": 450, "before": 0.85, "after": 0.95, "offset": 0.02}]}

    -- Calibration Coefficients (output)
    coefficients_json TEXT,                        -- JSON: {"gain": [1.02, 0.99, 1.01], "offset": [0.01, -0.02, 0.00]}

    -- Quality Assessment
    quality_passed INTEGER DEFAULT 1,              -- 1 = passed quality check
    quality_score REAL,                            -- 0-100 quality metric
    quality_notes TEXT,                            -- Notes on quality assessment
    deviation_from_reference REAL,                 -- Percentage deviation from expected

    -- Additional Measurements
    dark_current_values TEXT,                      -- JSON array of dark current readings
    integration_time_ms INTEGER,                   -- Integration time used during calibration

    -- Documentation
    notes TEXT,                                    -- Additional notes
    photos_json TEXT,                              -- JSON array of photo references
    raw_data_path TEXT,                            -- Path to raw calibration data files

    -- Audit Fields
    created_by INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Keys
    FOREIGN KEY (instrument_id) REFERENCES instruments(id) ON DELETE CASCADE,
    FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for calibration_logs
CREATE INDEX IF NOT EXISTS idx_cl_instrument ON calibration_logs(instrument_id);
CREATE INDEX IF NOT EXISTS idx_cl_date ON calibration_logs(calibration_date);
CREATE INDEX IF NOT EXISTS idx_cl_type ON calibration_logs(calibration_type);
CREATE INDEX IF NOT EXISTS idx_cl_quality ON calibration_logs(quality_passed);
CREATE INDEX IF NOT EXISTS idx_cl_next_date ON calibration_logs(next_calibration_date);
CREATE INDEX IF NOT EXISTS idx_cl_created_at ON calibration_logs(created_at);

-- ============================================================================
-- PART 3: ERROR LOG TABLE (for performance monitoring)
-- ============================================================================
-- Stores application errors for debugging and monitoring.
-- Part of Phase 7 production hardening.
-- ============================================================================

CREATE TABLE IF NOT EXISTS error_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    level TEXT DEFAULT 'error',                    -- error, warn, info
    message TEXT NOT NULL,
    stack TEXT,                                    -- Stack trace
    path TEXT,                                     -- Request path
    method TEXT,                                   -- HTTP method
    username TEXT,                                 -- User who encountered error (if authenticated)
    user_id INTEGER,                               -- FK to users
    ip_address TEXT,                               -- Client IP
    user_agent TEXT,                               -- Browser/client info
    request_id TEXT,                               -- Request correlation ID
    context_json TEXT,                             -- Additional context as JSON
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for error_log
CREATE INDEX IF NOT EXISTS idx_error_timestamp ON error_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_error_level ON error_log(level);
CREATE INDEX IF NOT EXISTS idx_error_path ON error_log(path);
CREATE INDEX IF NOT EXISTS idx_error_user ON error_log(user_id);
CREATE INDEX IF NOT EXISTS idx_error_request ON error_log(request_id);

-- ============================================================================
-- PART 4: VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View: Upcoming scheduled maintenance
DROP VIEW IF EXISTS v_upcoming_maintenance;
CREATE VIEW v_upcoming_maintenance AS
SELECT
    mh.id,
    mh.instrument_id,
    mh.maintenance_date,
    mh.scheduled_date,
    mh.maintenance_type,
    mh.description,
    mh.priority,
    mh.technician,
    i.display_name as instrument_name,
    i.normalized_name as instrument_normalized_name,
    i.instrument_type,
    p.id as platform_id,
    p.display_name as platform_name,
    p.ecosystem_code,
    s.id as station_id,
    s.acronym as station_acronym,
    s.display_name as station_name
FROM maintenance_history mh
JOIN instruments i ON mh.instrument_id = i.id
JOIN platforms p ON i.platform_id = p.id
JOIN stations s ON p.station_id = s.id
WHERE mh.status = 'scheduled'
    AND mh.scheduled_date >= date('now')
ORDER BY mh.scheduled_date ASC;

-- View: Recurrent problems by instrument
DROP VIEW IF EXISTS v_recurrent_problems;
CREATE VIEW v_recurrent_problems AS
SELECT
    i.id as instrument_id,
    i.display_name as instrument_name,
    i.normalized_name,
    i.instrument_type,
    s.acronym as station_acronym,
    s.display_name as station_name,
    mh.problem_category,
    COUNT(*) as occurrence_count,
    MIN(mh.maintenance_date) as first_occurrence,
    MAX(mh.maintenance_date) as last_occurrence,
    GROUP_CONCAT(DISTINCT mh.root_cause) as root_causes,
    SUM(mh.total_cost) as total_cost
FROM maintenance_history mh
JOIN instruments i ON mh.instrument_id = i.id
JOIN platforms p ON i.platform_id = p.id
JOIN stations s ON p.station_id = s.id
WHERE mh.recurrent_problem = 1
GROUP BY i.id, mh.problem_category
HAVING COUNT(*) >= 2
ORDER BY occurrence_count DESC;

-- View: Maintenance statistics by station
DROP VIEW IF EXISTS v_maintenance_stats;
CREATE VIEW v_maintenance_stats AS
SELECT
    s.id as station_id,
    s.acronym,
    s.display_name as station_name,
    COUNT(mh.id) as total_maintenance_records,
    SUM(CASE WHEN mh.status = 'completed' THEN 1 ELSE 0 END) as completed_count,
    SUM(CASE WHEN mh.status = 'scheduled' THEN 1 ELSE 0 END) as scheduled_count,
    SUM(CASE WHEN mh.recurrent_problem = 1 THEN 1 ELSE 0 END) as recurrent_issues,
    ROUND(AVG(mh.duration_minutes), 1) as avg_duration_minutes,
    ROUND(SUM(mh.total_cost), 2) as total_cost
FROM stations s
LEFT JOIN platforms p ON p.station_id = s.id
LEFT JOIN instruments i ON i.platform_id = p.id
LEFT JOIN maintenance_history mh ON mh.instrument_id = i.id
GROUP BY s.id
ORDER BY s.acronym;

-- View: Latest calibration per instrument (for due date checking)
DROP VIEW IF EXISTS v_latest_calibration;
CREATE VIEW v_latest_calibration AS
SELECT
    cl.*,
    i.display_name as instrument_name,
    i.normalized_name as instrument_normalized_name,
    i.instrument_type,
    p.display_name as platform_name,
    s.acronym as station_acronym,
    s.display_name as station_name
FROM calibration_logs cl
JOIN instruments i ON cl.instrument_id = i.id
JOIN platforms p ON i.platform_id = p.id
JOIN stations s ON p.station_id = s.id
WHERE cl.id = (
    SELECT MAX(cl2.id) FROM calibration_logs cl2
    WHERE cl2.instrument_id = cl.instrument_id
);

-- View: Instruments needing calibration (due or overdue)
DROP VIEW IF EXISTS v_calibration_due;
CREATE VIEW v_calibration_due AS
SELECT
    i.id as instrument_id,
    i.display_name as instrument_name,
    i.normalized_name,
    i.instrument_type,
    i.status as instrument_status,
    p.id as platform_id,
    p.display_name as platform_name,
    s.id as station_id,
    s.acronym as station_acronym,
    lc.calibration_date as last_calibration,
    lc.calibration_type as last_calibration_type,
    lc.next_calibration_date,
    lc.quality_score as last_quality_score,
    CASE
        WHEN lc.next_calibration_date IS NULL THEN 'never_calibrated'
        WHEN lc.next_calibration_date < date('now') THEN 'overdue'
        WHEN lc.next_calibration_date <= date('now', '+7 days') THEN 'due_soon'
        ELSE 'ok'
    END as calibration_status,
    CAST(JULIANDAY('now') - JULIANDAY(lc.next_calibration_date) AS INTEGER) as days_overdue
FROM instruments i
JOIN platforms p ON i.platform_id = p.id
JOIN stations s ON p.station_id = s.id
LEFT JOIN v_latest_calibration lc ON lc.instrument_id = i.id
WHERE i.instrument_type LIKE '%multispectral%'
    OR i.instrument_type LIKE '%spectral%'
    OR i.instrument_type LIKE '%NDVI%'
    OR i.instrument_type LIKE '%PRI%'
    OR i.instrument_type LIKE '%PAR%'
    OR i.instrument_type LIKE '%hyperspectral%'
ORDER BY
    CASE
        WHEN lc.next_calibration_date IS NULL THEN 0
        WHEN lc.next_calibration_date < date('now') THEN 1
        ELSE 2
    END,
    lc.next_calibration_date ASC;

-- View: Calibration quality trends by month
DROP VIEW IF EXISTS v_calibration_quality_trends;
CREATE VIEW v_calibration_quality_trends AS
SELECT
    i.id as instrument_id,
    i.display_name as instrument_name,
    i.normalized_name,
    s.acronym as station_acronym,
    strftime('%Y-%m', cl.calibration_date) as month,
    AVG(cl.quality_score) as avg_quality,
    MIN(cl.quality_score) as min_quality,
    MAX(cl.quality_score) as max_quality,
    AVG(cl.deviation_from_reference) as avg_deviation,
    COUNT(*) as calibration_count,
    SUM(CASE WHEN cl.quality_passed = 1 THEN 1 ELSE 0 END) as passed_count,
    SUM(CASE WHEN cl.quality_passed = 0 THEN 1 ELSE 0 END) as failed_count
FROM calibration_logs cl
JOIN instruments i ON cl.instrument_id = i.id
JOIN platforms p ON i.platform_id = p.id
JOIN stations s ON p.station_id = s.id
WHERE cl.calibration_date >= date('now', '-12 months')
GROUP BY i.id, strftime('%Y-%m', cl.calibration_date)
ORDER BY i.id, month;

-- ============================================================================
-- PART 5: TRIGGERS FOR AUDIT TIMESTAMPS
-- ============================================================================

-- Trigger: Update maintenance_history.updated_at on update
DROP TRIGGER IF EXISTS trg_mh_updated_at;
CREATE TRIGGER trg_mh_updated_at
AFTER UPDATE ON maintenance_history
FOR EACH ROW
BEGIN
    UPDATE maintenance_history
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
END;

-- Trigger: Update calibration_logs.updated_at on update
DROP TRIGGER IF EXISTS trg_cl_updated_at;
CREATE TRIGGER trg_cl_updated_at
AFTER UPDATE ON calibration_logs
FOR EACH ROW
BEGIN
    UPDATE calibration_logs
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
END;

-- ============================================================================
-- PART 6: MIGRATION METADATA
-- ============================================================================

INSERT INTO migration_metadata (migration_number, description, fields_added, performance_impact, backward_compatible)
VALUES ('0030', 'Maintenance History & Calibration Logs - Phase 7 Production Features',
        60, 'Low - new tables with optimized indexes', true);

-- ============================================================================
-- MIGRATION SUMMARY
-- ============================================================================
-- New Tables:
--   - maintenance_history (25+ fields) - Instrument maintenance tracking
--   - calibration_logs (30+ fields) - Spectral instrument calibration
--   - error_log (15 fields) - Application error tracking
--
-- New Indexes: 22 indexes for query optimization
--
-- New Views:
--   - v_upcoming_maintenance - Scheduled maintenance dashboard
--   - v_recurrent_problems - Problem pattern analysis
--   - v_maintenance_stats - Station maintenance statistics
--   - v_latest_calibration - Most recent calibration per instrument
--   - v_calibration_due - Instruments needing calibration
--   - v_calibration_quality_trends - Quality metrics over time
--
-- New Triggers:
--   - trg_mh_updated_at - Auto-update timestamps
--   - trg_cl_updated_at - Auto-update timestamps
--
-- Configuration Files:
--   - yamls/maintenance/maintenance-types.yaml
--   - yamls/maintenance/calibration-types.yaml
--
-- Backward Compatible: Yes (additive changes only)
-- ============================================================================
