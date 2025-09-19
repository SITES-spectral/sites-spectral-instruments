-- Migration 0023: Create ROIs table for phenocam regions of interest
-- This adds support for storing and managing ROI polygons for phenocam instruments

-- Create instrument_rois table
CREATE TABLE IF NOT EXISTS instrument_rois (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    instrument_id INTEGER NOT NULL,
    roi_name TEXT NOT NULL, -- e.g., 'ROI_00', 'ROI_01'
    description TEXT,
    alpha REAL DEFAULT 0.0,
    auto_generated BOOLEAN DEFAULT false,
    color_r INTEGER DEFAULT 255,
    color_g INTEGER DEFAULT 255,
    color_b INTEGER DEFAULT 255,
    thickness INTEGER DEFAULT 7,
    generated_date DATE,
    source_image TEXT,
    points_json TEXT, -- JSON array of coordinate pairs [[x1,y1], [x2,y2], ...]
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instrument_id) REFERENCES instruments(id) ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_instrument_rois_instrument_id ON instrument_rois(instrument_id);
CREATE INDEX IF NOT EXISTS idx_instrument_rois_roi_name ON instrument_rois(roi_name);