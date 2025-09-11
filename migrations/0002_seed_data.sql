-- Seed data for SITES Spectral Stations & Instruments
-- Created: 2025-09-09

-- Insert ecosystem types
INSERT INTO ecosystems (code, name, description) VALUES
('FOR', 'Forest', 'Forest ecosystem with tree canopy coverage'),
('AGR', 'Agriculture', 'Agricultural cropland and managed grassland'),
('MIR', 'Mire', 'Wetland mire and bog ecosystems'),
('LAK', 'Lake', 'Lake and aquatic ecosystems'),
('WET', 'Wetland', 'Wetland and marsh areas'),
('HEA', 'Heathland', 'Heath and moorland ecosystems'),
('SFO', 'Sub-alpine Forest', 'Sub-alpine forest ecosystems'),
('CEM', 'Cemetery', 'Cemetery and managed landscape');

-- Insert instrument types
INSERT INTO instrument_types (code, name, description, category) VALUES
('PHE', 'Phenocam', 'Digital camera for phenological monitoring', 'phenocam'),
('MS', 'Multispectral Sensor', 'Fixed multispectral radiation sensor', 'fixed_sensor'),
('PAR', 'PAR Sensor', 'Photosynthetically Active Radiation sensor', 'fixed_sensor'),
('SPEC', 'Spectrometer', 'Full spectrum radiation measurement device', 'fixed_sensor'),
('TEMP', 'Temperature Sensor', 'Environmental temperature monitoring', 'fixed_sensor'),
('HUMI', 'Humidity Sensor', 'Relative humidity monitoring', 'fixed_sensor');

-- Insert platform types
INSERT INTO platform_types (code, name, description) VALUES
('PL', 'Platform', 'General platform mounting'),
('BL', 'Building', 'Building-mounted installation'),
('TW', 'Tower', 'Tower or tall structure mounting'),
('MS', 'Mast', 'Mast or pole mounting'),
('UC', 'Under Canopy', 'Below canopy installation'),
('GR', 'Ground', 'Ground-level installation'),
('FL', 'Flagpole', 'Flagpole mounting'),
('EC', 'Eddy Covariance Tower', 'ICOS Eddy Covariance Tower');

-- Insert stations from audit data
INSERT INTO stations (normalized_name, display_name, acronym, region, latitude, longitude, description) VALUES
('abisko', 'Abisko Scientific Research Station', 'ANS', 'north-western', 68.353729, 18.816522, 'Arctic research station in northern Sweden'),
('grimso', 'Grimsö Wildlife Research Station', 'GRI', 'central', 59.72868, 15.47249, 'Wildlife and forest research station'),
('lonnstorp', 'Lönnstorp Field Research Station', 'LON', 'southern', 55.668731, 13.108632, 'Agricultural research station in southern Sweden'),
('robacksdalen', 'Röbäcksdalen Field Research Station', 'RBD', 'northern', 63.806642, 20.229243, 'Agricultural and environmental research station'),
('skogaryd', 'Skogaryd Research Station', 'SKC', 'south-western', 58.363865, 12.149763, 'Multi-ecosystem research station'),
('svartberget', 'Svartberget Field Research Station', 'SVB', 'northern', 64.256342, 19.771621, 'Forest and mire ecosystem research'),
('asa', 'Asa Research Station', 'ASA', 'southern', 57.164451, 14.782474, 'Forest and lake ecosystem research'),
('hyltemossa', 'Hyltemossa Research Station', 'HTM', 'southern', NULL, NULL, 'Forest ecosystem research'),
('tarfala', 'Tarfala Research Station', 'TAR', 'northern', NULL, NULL, 'Alpine and glacier research station');