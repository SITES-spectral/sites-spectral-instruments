-- Create mspectral_sensors table based on YAML + CSV metadata
CREATE TABLE IF NOT EXISTS mspectral_sensors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_id INTEGER NOT NULL,
    
    -- Basic identification from YAML
    canonical_id TEXT NOT NULL UNIQUE,
    legacy_name TEXT,
    sensor_type TEXT, -- 'SPECTRAL', 'PAR', etc.
    ecosystem TEXT NOT NULL,
    location TEXT,
    status TEXT NOT NULL DEFAULT 'Active',
    deployment_date TEXT,
    removal_date TEXT,
    
    -- Geolocation (from CSV metadata)
    latitude REAL,
    longitude REAL,
    elevation_m REAL,
    
    -- Instrument specifications (from CSV metadata)
    brand TEXT, -- SKYE, etc.
    model TEXT, -- SKR1860, etc.
    serial_number TEXT,
    cable_length TEXT,
    honxiao_number TEXT, -- Equipment tracking number
    
    -- Optical specifications
    center_wavelength_nm REAL,
    bandwidth_nm REAL,
    field_of_view_degrees REAL,
    
    -- Positioning
    azimuth_degrees REAL,
    degrees_from_nadir REAL,
    measurement_type TEXT, -- 'outgoing', 'incoming', etc.
    
    -- Usage and parameters
    usage_type TEXT, -- 'PRI', 'NDVI', 'PAR', etc.
    parameter_names TEXT, -- from CSV: Dw_530_100m_Avg, etc.
    
    -- Multi-wavelength data (from YAML)
    wavelengths_nm TEXT, -- JSON array: [644, 858]
    bandwidths_nm TEXT,  -- JSON array if available
    sensor_pairs TEXT,   -- JSON array: ["sky_ground"]
    
    -- Notes and comments
    comments TEXT,
    installation_notes TEXT,
    maintenance_notes TEXT,
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_mspectral_sensors_station_id ON mspectral_sensors(station_id);
CREATE INDEX IF NOT EXISTS idx_mspectral_sensors_canonical_id ON mspectral_sensors(canonical_id);
CREATE INDEX IF NOT EXISTS idx_mspectral_sensors_ecosystem ON mspectral_sensors(ecosystem);
CREATE INDEX IF NOT EXISTS idx_mspectral_sensors_sensor_type ON mspectral_sensors(sensor_type);
CREATE INDEX IF NOT EXISTS idx_mspectral_sensors_status ON mspectral_sensors(status);
CREATE INDEX IF NOT EXISTS idx_mspectral_sensors_usage_type ON mspectral_sensors(usage_type);