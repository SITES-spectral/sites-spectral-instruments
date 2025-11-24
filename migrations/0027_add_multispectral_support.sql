-- ====================================================================
-- Migration: 0027_add_multispectral_support.sql
-- Description: Add comprehensive multispectral sensor support with
--              sensor models library, channels, and documentation system
-- Date: 2025-11-18
-- Version: 5.2.58
-- ====================================================================

-- ====================================================================
-- PART 1: Add Multispectral-Specific Fields to instruments Table
-- ====================================================================
-- Add 12 new fields to support multispectral sensors with enhanced
-- metadata including datalogger configuration, calibration tracking,
-- and sensor-specific specifications

ALTER TABLE instruments ADD COLUMN sensor_brand TEXT;
ALTER TABLE instruments ADD COLUMN sensor_model TEXT;
ALTER TABLE instruments ADD COLUMN sensor_serial_number TEXT;
ALTER TABLE instruments ADD COLUMN cable_length_m REAL;
ALTER TABLE instruments ADD COLUMN field_of_view_degrees REAL;
ALTER TABLE instruments ADD COLUMN end_date DATE;
ALTER TABLE instruments ADD COLUMN number_of_channels INTEGER;
ALTER TABLE instruments ADD COLUMN datalogger_type TEXT DEFAULT 'Campbell Scientific CR1000X';
ALTER TABLE instruments ADD COLUMN datalogger_program_normal TEXT;
ALTER TABLE instruments ADD COLUMN datalogger_program_calibration TEXT;
ALTER TABLE instruments ADD COLUMN calibration_logs TEXT;
ALTER TABLE instruments ADD COLUMN orientation TEXT; -- 'uplooking' or 'downlooking'

-- ====================================================================
-- PART 2: Create sensor_models Table (Reference Library)
-- ====================================================================
-- Centralized library of sensor models (SKR 1800, SKR110, PP Systems, etc.)
-- Stores manufacturer specifications, calibration procedures, and
-- technical documentation for reuse across multiple instrument instances

CREATE TABLE IF NOT EXISTS sensor_models (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Basic Identity
    manufacturer TEXT NOT NULL,              -- SKYE, DECAGON, APOGEE, PP Systems, LICOR
    model_number TEXT NOT NULL UNIQUE,       -- SKR 1800, SKR110, SQ-500, etc.
    model_name TEXT,                         -- Full descriptive name

    -- Basic Specifications
    sensor_type TEXT,                        -- Multispectral, PAR, NDVI, PRI
    wavelength_range_min_nm INTEGER,         -- Minimum wavelength (e.g., 400)
    wavelength_range_max_nm INTEGER,         -- Maximum wavelength (e.g., 1050)
    available_channels_config TEXT,          -- JSON: [[645,850], [530,645,730,850]]

    -- Technical Specifications
    field_of_view_degrees REAL,              -- FOV in degrees
    angular_response TEXT,                   -- Cosine corrected, lambertian, etc.
    cosine_response TEXT,                    -- Deviation from ideal cosine response
    spectral_sensitivity_curve TEXT,         -- JSON or file path to sensitivity data
    temperature_coefficient REAL,            -- Temperature dependency coefficient

    -- Calibration Information
    calibration_procedure TEXT,              -- Standard calibration procedure description
    factory_calibration_interval_months INTEGER,  -- Recommended recalibration interval
    recalibration_requirements TEXT,         -- Field vs. factory recalibration requirements
    typical_calibration_coefficients TEXT,   -- JSON: {"channel_1": {"slope": 1.23, "offset": 0.01}}

    -- Physical Specifications
    dimensions_mm TEXT,                      -- "50x30x15" or JSON: {"length": 50, "width": 30, "height": 15}
    weight_grams REAL,                       -- Weight in grams
    cable_types TEXT,                        -- "Shielded twisted pair, 6-conductor"
    connector_type TEXT,                     -- "6-pin waterproof connector, IP67"
    power_requirements TEXT,                 -- "9-24V DC, 10mA typical"
    ip_rating TEXT,                          -- "IP67", "IP68"
    operating_temp_min_c REAL,               -- Minimum operating temperature
    operating_temp_max_c REAL,               -- Maximum operating temperature

    -- Documentation Links
    manufacturer_website_url TEXT,           -- Main product page
    specification_sheet_url TEXT,            -- Link to spec sheet PDF
    user_manual_url TEXT,                    -- Link to user manual PDF

    -- Metadata
    notes TEXT,                              -- Additional notes or special considerations
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_sensor_models_manufacturer ON sensor_models(manufacturer);
CREATE INDEX idx_sensor_models_type ON sensor_models(sensor_type);
CREATE INDEX idx_sensor_models_model_number ON sensor_models(model_number);

-- ====================================================================
-- PART 3: Create instrument_channels Table (Nested Channel Structure)
-- ====================================================================
-- Stores individual spectral channels/bands for multispectral instruments
-- Similar to instrument_rois relationship pattern (1:many from instruments)
-- Each MS sensor can have 2-8+ channels with specific wavelength characteristics

CREATE TABLE IF NOT EXISTS instrument_channels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    instrument_id INTEGER NOT NULL,

    -- Channel Identity
    channel_name TEXT NOT NULL,              -- e.g., "RED645nm", "NIR850nm"
    channel_number INTEGER NOT NULL,         -- Sequential: 1, 2, 3, 4...

    -- Spectral Properties
    center_wavelength_nm INTEGER NOT NULL,   -- Center wavelength in nanometers
    bandwidth_nm INTEGER NOT NULL,           -- Full width at half maximum (FWHM)
    wavelength_notation TEXT,                -- Human-readable: "NW10nm", "NW40nm"
    band_type TEXT,                          -- Red, NIR, FER (Far-Red), Green, Blue, Custom

    -- Instrument-Specific Calibration
    -- (Differs from factory calibration in sensor_models)
    calibration_coefficient REAL,            -- Field calibration slope/multiplier
    calibration_offset REAL,                 -- Field calibration intercept/offset
    last_calibrated_date DATE,               -- Date of last field calibration

    -- Data Processing
    data_column_name TEXT,                   -- Column name in datalogger output files
    processing_enabled BOOLEAN DEFAULT true,  -- Enable/disable in processing pipeline
    quality_flag TEXT,                       -- Pass, Warning, Fail

    -- Documentation
    description TEXT,                        -- Channel description or purpose
    notes TEXT,                              -- Special notes, known issues

    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Key Constraints
    FOREIGN KEY (instrument_id) REFERENCES instruments(id) ON DELETE CASCADE,

    -- Unique Constraints
    UNIQUE(instrument_id, channel_number),
    UNIQUE(instrument_id, channel_name)
);

-- Create indexes for performance
CREATE INDEX idx_instrument_channels_instrument_id ON instrument_channels(instrument_id);
CREATE INDEX idx_instrument_channels_band_type ON instrument_channels(band_type);
CREATE INDEX idx_instrument_channels_wavelength ON instrument_channels(center_wavelength_nm);
CREATE INDEX idx_instrument_channels_name ON instrument_channels(channel_name);

-- ====================================================================
-- PART 4: Create sensor_documentation Table (Dual-Level Documentation)
-- ====================================================================
-- Stores documentation at BOTH sensor model level (spec sheets, manuals)
-- and individual instrument level (calibration certificates, custom configs)
-- Files stored in Cloudflare R2, metadata stored here

CREATE TABLE IF NOT EXISTS sensor_documentation (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Association (exactly one must be set via CHECK constraint)
    sensor_model_id INTEGER,                 -- For model-level docs (spec sheets, manuals)
    instrument_id INTEGER,                   -- For instrument-level docs (cal certs, configs)

    -- File Information
    document_type TEXT NOT NULL,             -- Type enum (see below)
    file_name TEXT NOT NULL,                 -- Original filename
    file_path TEXT NOT NULL,                 -- R2 path: 'sensor-docs/models/SKR1800_spec.pdf'
    file_size_bytes INTEGER,                 -- File size in bytes
    mime_type TEXT,                          -- 'application/pdf', 'text/plain', etc.

    -- Document Metadata
    title TEXT,                              -- Human-readable title
    description TEXT,                        -- Document description
    version TEXT,                            -- Document version (e.g., "v2.1", "Rev A")
    document_date DATE,                      -- Date printed on document
    upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    uploaded_by TEXT,                        -- Username of uploader

    -- Search and Organization
    tags TEXT,                               -- JSON array: ["calibration", "2024", "field"]

    -- Metadata
    notes TEXT,                              -- Additional notes
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Key Constraints
    FOREIGN KEY (sensor_model_id) REFERENCES sensor_models(id) ON DELETE CASCADE,
    FOREIGN KEY (instrument_id) REFERENCES instruments(id) ON DELETE CASCADE,

    -- Constraint: Exactly one association (model XOR instrument)
    CHECK (
        (sensor_model_id IS NOT NULL AND instrument_id IS NULL) OR
        (sensor_model_id IS NULL AND instrument_id IS NOT NULL)
    )
);

-- Create indexes for performance
CREATE INDEX idx_sensor_documentation_model_id ON sensor_documentation(sensor_model_id);
CREATE INDEX idx_sensor_documentation_instrument_id ON sensor_documentation(instrument_id);
CREATE INDEX idx_sensor_documentation_type ON sensor_documentation(document_type);
CREATE INDEX idx_sensor_documentation_upload_date ON sensor_documentation(upload_date);

-- ====================================================================
-- PART 5: Document Type Reference
-- ====================================================================
-- Valid document_type values:
--   - 'specification_sheet': Manufacturer specification sheet
--   - 'user_manual': User manual or operation guide
--   - 'calibration_certificate': Factory or field calibration certificate
--   - 'calibration_procedure': Calibration procedure document
--   - 'datalogger_program': Datalogger program file (.CR1, .CR6, etc.)
--   - 'spectral_response': Spectral sensitivity curve data
--   - 'installation_guide': Installation instructions
--   - 'maintenance_log': Maintenance records
--   - 'photo': Instrument photos
--   - 'custom': Custom document type

-- ====================================================================
-- PART 6: Naming Convention Documentation
-- ====================================================================
-- Multispectral Sensor Naming Pattern:
--   {STATION}_{ECOSYSTEM}_{PLATFORM}_{BRAND}_MS{NN}_NB{NN}
--
-- Examples:
--   ANS_FOR_PL01_SKYE_MS01_NB04 (4-band SKYE sensor)
--   SVB_MIR_PL02_DECAGON_MS01_NB02 (2-band DECAGON sensor)
--   LON_AGR_PL01_APOGEE_MS01_NB04 (4-band APOGEE sensor)
--
-- Channel Naming Pattern:
--   {INSTRUMENT_NAME}_{WAVELENGTH}_{BANDWIDTH}
--
-- Examples:
--   ANS_FOR_PL01_SKYE_MS01_NB04_RED645nm_NW10nm
--   ANS_FOR_PL01_SKYE_MS01_NB04_NIR850nm_NW40nm
--   SVB_MIR_PL02_DECAGON_MS01_NB02_RED660nm_NW10nm
--   SVB_MIR_PL02_DECAGON_MS01_NB02_FER730nm_NW10nm

-- ====================================================================
-- PART 7: Migration Metadata
-- ====================================================================
-- Migration completed: 0027_add_multispectral_support.sql
-- Tables created: 3 (sensor_models, instrument_channels, sensor_documentation)
-- Fields added to instruments: 12
-- Indexes created: 11
-- Foreign key relationships: 3 (channels→instruments, docs→models, docs→instruments)

-- End of migration
