-- Create phenocams table based on YAML data structure
CREATE TABLE IF NOT EXISTS phenocams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_id INTEGER NOT NULL,
    canonical_id TEXT NOT NULL UNIQUE,
    legacy_acronym TEXT,
    ecosystem TEXT NOT NULL,
    location TEXT NOT NULL,
    instrument_number TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active',
    deployment_date TEXT,
    
    -- Platform information
    platform_mounting_structure TEXT,
    platform_height_m REAL,
    
    -- Geolocation
    latitude REAL,
    longitude REAL,
    epsg TEXT DEFAULT 'epsg:4326',
    geolocation_notes TEXT,
    
    -- Instrument specifications
    instrument_height_m REAL,
    viewing_direction TEXT,
    azimuth_degrees REAL,
    degrees_from_nadir REAL,
    
    -- ROI data as JSON
    rois_data TEXT, -- JSON string containing all ROI definitions
    legacy_rois_data TEXT, -- JSON string containing legacy ROI definitions
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_phenocams_station_id ON phenocams(station_id);
CREATE INDEX IF NOT EXISTS idx_phenocams_canonical_id ON phenocams(canonical_id);
CREATE INDEX IF NOT EXISTS idx_phenocams_ecosystem ON phenocams(ecosystem);
CREATE INDEX IF NOT EXISTS idx_phenocams_status ON phenocams(status);