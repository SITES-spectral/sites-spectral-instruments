-- SITES Spectral Stations & Instruments Database Schema
-- Created: 2025-09-09

-- Stations table
CREATE TABLE stations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    normalized_name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    acronym TEXT NOT NULL UNIQUE,
    country TEXT DEFAULT 'Sweden',
    region TEXT,
    established_date DATE,
    description TEXT,
    website_url TEXT,
    contact_email TEXT,
    latitude REAL,
    longitude REAL,
    elevation_m REAL,
    timezone TEXT DEFAULT 'Europe/Stockholm',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Ecosystems reference table
CREATE TABLE ecosystems (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT
);

-- Instrument types reference table  
CREATE TABLE instrument_types (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT -- 'phenocam', 'fixed_sensor', 'other'
);

-- Platform types reference table
CREATE TABLE platform_types (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT
);

-- Instruments table
CREATE TABLE instruments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_id INTEGER NOT NULL,
    canonical_id TEXT NOT NULL UNIQUE,
    legacy_id TEXT,
    legacy_acronym TEXT,
    instrument_type_code TEXT NOT NULL,
    ecosystem_code TEXT,
    platform_code TEXT,
    platform_number TEXT,
    instrument_number TEXT,
    
    -- Status tracking
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Maintenance', 'Removed', 'Planned', 'Unknown')),
    deployment_date DATE,
    removal_date DATE,
    last_maintenance_date DATE,
    
    -- Location details
    latitude REAL,
    longitude REAL,
    elevation_m REAL,
    platform_height_m REAL,
    instrument_height_m REAL,
    
    -- Orientation
    viewing_direction TEXT,
    azimuth_degrees REAL,
    degrees_from_nadir REAL,
    field_of_view TEXT,
    
    -- Platform mounting
    mounting_structure TEXT,
    mounting_height_m REAL,
    
    -- Sensor specifications
    brand TEXT,
    model TEXT,
    serial_number TEXT,
    ip_address TEXT,
    mac_address TEXT,
    
    -- Technical specs (JSON for flexibility)
    wavelengths_nm TEXT, -- JSON array
    bandwidths_nm TEXT,  -- JSON array
    spectral_response TEXT, -- JSON object
    technical_specs TEXT,  -- JSON object
    
    -- Notes and comments
    description TEXT,
    installation_notes TEXT,
    maintenance_notes TEXT,
    
    -- Metadata
    data_logger_id TEXT,
    data_collection_interval TEXT,
    data_storage_location TEXT,
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE,
    FOREIGN KEY (instrument_type_code) REFERENCES instrument_types(code),
    FOREIGN KEY (ecosystem_code) REFERENCES ecosystems(code),
    FOREIGN KEY (platform_code) REFERENCES platform_types(code)
);

-- ROI (Region of Interest) data for phenocams
CREATE TABLE instrument_rois (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    instrument_id INTEGER NOT NULL,
    roi_name TEXT NOT NULL,
    roi_points TEXT NOT NULL, -- JSON array of coordinates
    color_rgb TEXT, -- JSON array [r,g,b]
    thickness INTEGER DEFAULT 7,
    alpha REAL DEFAULT 1.0,
    auto_generated BOOLEAN DEFAULT FALSE,
    description TEXT,
    source_image TEXT,
    generated_date DATE,
    active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (instrument_id) REFERENCES instruments(id) ON DELETE CASCADE,
    UNIQUE(instrument_id, roi_name)
);

-- Equipment change history
CREATE TABLE instrument_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    instrument_id INTEGER NOT NULL,
    change_date DATE NOT NULL,
    change_type TEXT NOT NULL CHECK (change_type IN ('Installation', 'Removal', 'Maintenance', 'Upgrade', 'Relocation', 'Status Change', 'Configuration')),
    old_status TEXT,
    new_status TEXT,
    description TEXT,
    performed_by TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (instrument_id) REFERENCES instruments(id) ON DELETE CASCADE
);

-- Data quality flags
CREATE TABLE data_quality_flags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    instrument_id INTEGER NOT NULL,
    flag_date DATE NOT NULL,
    flag_type TEXT NOT NULL CHECK (flag_type IN ('Good', 'Suspicious', 'Bad', 'Missing', 'Calibration')),
    severity TEXT CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
    description TEXT,
    resolution_notes TEXT,
    resolved_date DATE,
    flagged_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (instrument_id) REFERENCES instruments(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_instruments_station_id ON instruments(station_id);
CREATE INDEX idx_instruments_canonical_id ON instruments(canonical_id);
CREATE INDEX idx_instruments_legacy_id ON instruments(legacy_id);
CREATE INDEX idx_instruments_status ON instruments(status);
CREATE INDEX idx_instruments_type ON instruments(instrument_type_code);
CREATE INDEX idx_instruments_ecosystem ON instruments(ecosystem_code);

CREATE INDEX idx_history_instrument_id ON instrument_history(instrument_id);
CREATE INDEX idx_history_date ON instrument_history(change_date);

CREATE INDEX idx_quality_instrument_id ON data_quality_flags(instrument_id);
CREATE INDEX idx_quality_date ON data_quality_flags(flag_date);

CREATE INDEX idx_rois_instrument_id ON instrument_rois(instrument_id);

-- Triggers to update timestamps
CREATE TRIGGER update_stations_timestamp 
    AFTER UPDATE ON stations 
    BEGIN 
        UPDATE stations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; 
    END;

CREATE TRIGGER update_instruments_timestamp 
    AFTER UPDATE ON instruments 
    BEGIN 
        UPDATE instruments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; 
    END;