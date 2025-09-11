-- Update platforms without coordinates to use their station's coordinates
-- This ensures all platforms appear on the interactive map

UPDATE platforms 
SET latitude = (
  SELECT latitude FROM stations WHERE id = platforms.station_id
), 
longitude = (
  SELECT longitude FROM stations WHERE id = platforms.station_id
)
WHERE latitude IS NULL OR longitude IS NULL;