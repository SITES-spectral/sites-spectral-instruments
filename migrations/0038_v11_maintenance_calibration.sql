-- ============================================================================
-- Migration 0038: V11 Maintenance & Calibration Records
-- SITES Spectral v11.0.0-alpha.3
-- Date: 2025-12-08
-- ============================================================================
-- This migration adds V11 Hexagonal Architecture tables:
--   1. maintenance_records - Unified maintenance for platforms AND instruments
--   2. calibration_records - Simplified calibration for multispectral sensors
--
-- Key differences from V8 migration (0030):
--   - maintenance_records supports entity_type (platform/instrument) + entity_id
--   - calibration_records uses simpler coefficient structure with validity periods
--   - Both designed for timeline visualization in V11 frontend
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
-- PART 2: CALIBRATION RECORDS TABLE (V11)
-- ============================================================================
-- Simplified calibration records for multispectral/hyperspectral sensors.
-- Supports per-channel coefficients and validity periods.
-- Only applicable to multispectral and hyperspectral instrument types.
-- ============================================================================

CREATE TABLE IF NOT EXISTS calibration_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Instrument Reference
    instrument_id INTEGER NOT NULL,
    channel_id INTEGER,                              -- NULL = all channels, or specific channel

    -- Calibration Type
    type TEXT NOT NULL CHECK (type IN (
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
    status TEXT NOT NULL DEFAULT 'valid' CHECK (status IN (
        'valid',             -- Currently valid
        'expired',           -- Past expiration date
        'superseded',        -- Replaced by newer calibration
        'pending_review'     -- Awaiting validation
    )),

    -- Dates
    calibration_date TEXT NOT NULL,                  -- ISO 8601 date of calibration
    valid_until TEXT,                                -- Expiration date (NULL = no expiry)

    -- Personnel and Documentation
    performed_by TEXT,                               -- Technician/lab name
    laboratory TEXT,                                 -- Laboratory/facility name
    certificate_number TEXT,                         -- Calibration certificate ID
    certificate_url TEXT,                            -- URL to certificate document
    reference_standard TEXT,                         -- Reference standard used

    -- Calibration Coefficients (JSON)
    -- Format: {"gain": 1.02, "offset": 0.01, "r2": 0.998, "rmse": 0.003}
    -- Or for multiple channels: {"channel_1": {"gain": 1.02, "offset": 0.01}, ...}
    coefficients TEXT,

    -- Quality Metrics
    uncertainty REAL,                                -- Measurement uncertainty
    temperature_celsius REAL,                        -- Calibration temperature
    humidity_percent REAL,                           -- Calibration humidity

    -- Notes
    notes TEXT,

    -- Audit Fields
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Key
    FOREIGN KEY (instrument_id) REFERENCES instruments(id) ON DELETE CASCADE
);

-- Indexes for calibration_records
CREATE INDEX IF NOT EXISTS idx_cr_instrument ON calibration_records(instrument_id);
CREATE INDEX IF NOT EXISTS idx_cr_channel ON calibration_records(channel_id);
CREATE INDEX IF NOT EXISTS idx_cr_type ON calibration_records(type);
CREATE INDEX IF NOT EXISTS idx_cr_status ON calibration_records(status);
CREATE INDEX IF NOT EXISTS idx_cr_date ON calibration_records(calibration_date);
CREATE INDEX IF NOT EXISTS idx_cr_valid_until ON calibration_records(valid_until);

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

-- View: Current valid calibrations per instrument
DROP VIEW IF EXISTS v_current_calibrations;
CREATE VIEW v_current_calibrations AS
SELECT
    cr.id,
    cr.instrument_id,
    cr.channel_id,
    cr.type,
    cr.calibration_date,
    cr.valid_until,
    cr.coefficients,
    cr.uncertainty,
    cr.performed_by,
    cr.laboratory,
    cr.certificate_number,
    i.normalized_name as instrument_name,
    i.display_name as instrument_display_name,
    i.instrument_type,
    p.normalized_name as platform_name,
    s.acronym as station_acronym,
    CASE
        WHEN cr.valid_until IS NULL THEN 'no_expiry'
        WHEN cr.valid_until < date('now') THEN 'expired'
        WHEN cr.valid_until <= date('now', '+30 days') THEN 'expiring_soon'
        ELSE 'valid'
    END as validity_status,
    CAST(JULIANDAY(cr.valid_until) - JULIANDAY('now') AS INTEGER) as days_until_expiry
FROM calibration_records cr
JOIN instruments i ON cr.instrument_id = i.id
JOIN platforms p ON i.platform_id = p.id
JOIN stations s ON p.station_id = s.id
WHERE cr.status = 'valid'
  AND (cr.valid_until IS NULL OR cr.valid_until >= date('now'))
ORDER BY cr.calibration_date DESC;

-- View: Calibration timeline per instrument
DROP VIEW IF EXISTS v_calibration_timeline;
CREATE VIEW v_calibration_timeline AS
SELECT
    cr.id,
    cr.instrument_id,
    cr.channel_id,
    cr.type,
    cr.status,
    cr.calibration_date,
    cr.valid_until,
    cr.coefficients,
    cr.uncertainty,
    cr.performed_by,
    cr.laboratory,
    cr.certificate_number,
    cr.notes,
    i.normalized_name as instrument_name,
    i.display_name as instrument_display_name,
    i.instrument_type,
    p.normalized_name as platform_name,
    s.acronym as station_acronym
FROM calibration_records cr
JOIN instruments i ON cr.instrument_id = i.id
JOIN platforms p ON i.platform_id = p.id
JOIN stations s ON p.station_id = s.id
ORDER BY cr.instrument_id, cr.calibration_date DESC;

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
-- New Tables (V11 Architecture):
--   - maintenance_records - Unified maintenance for platforms AND instruments
--   - calibration_records - Simplified calibration for multispectral sensors
--
-- New Indexes: 14 indexes for query optimization
--
-- New Views (V11):
--   - v_platform_maintenance_timeline - Platform maintenance history
--   - v_instrument_maintenance_timeline - Instrument maintenance history
--   - v_current_calibrations - Active calibrations per instrument
--   - v_calibration_timeline - Full calibration history per instrument
--
-- New Triggers:
--   - trg_mr_updated_at - Auto-update timestamps
--   - trg_cr_updated_at - Auto-update timestamps
--
-- Note: This migration adds NEW tables separate from the V8 tables
--       (maintenance_history, calibration_logs) to support V11 architecture.
--       V8 tables are preserved for backward compatibility.
-- ============================================================================
