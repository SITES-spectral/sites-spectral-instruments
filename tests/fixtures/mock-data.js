/**
 * SITES Spectral V3 API Test Fixtures
 * Mock data for testing
 */

// =============================================================================
// STATIONS
// =============================================================================

export const mockStations = [
  {
    id: 1,
    acronym: 'SVB',
    display_name: 'Svartberget',
    description: 'Svartberget Research Station in northern Sweden',
    latitude: 64.256,
    longitude: 19.775,
    altitude_m: 270,
    timezone: 'Europe/Stockholm',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    acronym: 'ANS',
    display_name: 'Abisko',
    description: 'Abisko Scientific Research Station',
    latitude: 68.354,
    longitude: 18.816,
    altitude_m: 385,
    timezone: 'Europe/Stockholm',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 3,
    acronym: 'LON',
    display_name: 'Lönnstorp',
    description: 'Lönnstorp Agricultural Research Station',
    latitude: 55.668,
    longitude: 13.108,
    altitude_m: 70,
    timezone: 'Europe/Stockholm',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

// =============================================================================
// PLATFORM TYPES
// =============================================================================

export const mockPlatformTypes = [
  {
    id: 1,
    code: 'fixed',
    name: 'Fixed Platform',
    icon: 'fa-tower-observation',
    color: '#2563eb',
    description: 'Permanent installations such as towers, buildings, or poles',
    supports_instruments: '["phenocam", "multispectral", "par", "ndvi", "pri", "hyperspectral"]',
    requires_location: 1,
    requires_aoi: 0,
    sort_order: 1,
  },
  {
    id: 2,
    code: 'uav',
    name: 'UAV Platform',
    icon: 'fa-helicopter',
    color: '#059669',
    description: 'Unmanned Aerial Vehicles for mapping and monitoring',
    supports_instruments: '["phenocam", "multispectral", "hyperspectral", "lidar", "thermal"]',
    requires_location: 0,
    requires_aoi: 1,
    sort_order: 2,
  },
  {
    id: 3,
    code: 'satellite',
    name: 'Satellite Platform',
    icon: 'fa-satellite',
    color: '#7c3aed',
    description: 'Earth observation satellites',
    supports_instruments: '["multispectral", "hyperspectral", "thermal", "sar"]',
    requires_location: 0,
    requires_aoi: 1,
    sort_order: 3,
  },
];

// =============================================================================
// PLATFORMS
// =============================================================================

export const mockPlatforms = [
  {
    id: 1,
    station_id: 1,
    normalized_name: 'svb_for_pl01',
    display_name: 'SVB Forest Platform 01',
    platform_type: 'fixed',
    ecosystem_code: 'FOR',
    mounting_structure: 'tower',
    platform_height_m: 30,
    latitude: 64.256,
    longitude: 19.775,
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    station_id: 1,
    normalized_name: 'svb_mir_pl02',
    display_name: 'SVB Mire Platform 02',
    platform_type: 'fixed',
    ecosystem_code: 'MIR',
    mounting_structure: 'mast',
    platform_height_m: 10,
    latitude: 64.182,
    longitude: 19.556,
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 3,
    station_id: 1,
    normalized_name: 'svb_uav_mavic3',
    display_name: 'SVB UAV Mavic 3 MS',
    platform_type: 'uav',
    ecosystem_code: 'FOR',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 4,
    station_id: 2,
    normalized_name: 'ans_alp_pl01',
    display_name: 'ANS Alpine Platform 01',
    platform_type: 'fixed',
    ecosystem_code: 'ALP',
    mounting_structure: 'tower',
    platform_height_m: 15,
    latitude: 68.354,
    longitude: 18.816,
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

// =============================================================================
// INSTRUMENTS
// =============================================================================

export const mockInstruments = [
  {
    id: 1,
    platform_id: 1,
    normalized_name: 'SVB_FOR_PL01_PHE01',
    display_name: 'SVB Forest Phenocam 01',
    instrument_type: 'phenocam',
    status: 'active',
    camera_brand: 'StarDot',
    camera_model: 'NetCam SC',
    resolution: '1920x1080',
    latitude: 64.256,
    longitude: 19.775,
    height_m: 28,
    viewing_direction: 'N',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    platform_id: 1,
    normalized_name: 'SVB_FOR_PL01_MS01',
    display_name: 'SVB Forest Multispectral 01',
    instrument_type: 'multispectral',
    status: 'active',
    number_of_channels: 4,
    orientation: 'downward',
    latitude: 64.256,
    longitude: 19.775,
    height_m: 30,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 3,
    platform_id: 2,
    normalized_name: 'SVB_MIR_PL02_PAR01',
    display_name: 'SVB Mire PAR Sensor 01',
    instrument_type: 'par',
    status: 'active',
    latitude: 64.182,
    longitude: 19.556,
    height_m: 8,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

// =============================================================================
// AREAS OF INTEREST (AOIs)
// =============================================================================

export const mockAOIs = [
  {
    id: 1,
    station_id: 1,
    platform_id: 3,
    name: 'SVB Forest Survey Area',
    normalized_name: 'svb_forest_survey_area',
    description: 'Primary UAV survey area for forest monitoring',
    geometry_type: 'Polygon',
    geometry_json: JSON.stringify({
      type: 'Polygon',
      coordinates: [
        [
          [19.77, 64.25],
          [19.78, 64.25],
          [19.78, 64.26],
          [19.77, 64.26],
          [19.77, 64.25],
        ],
      ],
    }),
    bbox_json: '[19.77, 64.25, 19.78, 64.26]',
    centroid_lat: 64.255,
    centroid_lon: 19.775,
    area_m2: 100000,
    perimeter_m: 1400,
    ecosystem_code: 'FOR',
    purpose: 'mapping',
    aoi_type: 'flight_area',
    status: 'active',
    source: 'manual',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    station_id: 1,
    platform_id: null,
    name: 'SVB Sentinel-2 Tile',
    normalized_name: 'svb_sentinel2_tile',
    description: 'Sentinel-2 coverage area for Svartberget',
    geometry_type: 'Polygon',
    geometry_json: JSON.stringify({
      type: 'Polygon',
      coordinates: [
        [
          [19.5, 64.0],
          [20.0, 64.0],
          [20.0, 64.5],
          [19.5, 64.5],
          [19.5, 64.0],
        ],
      ],
    }),
    bbox_json: '[19.5, 64.0, 20.0, 64.5]',
    centroid_lat: 64.25,
    centroid_lon: 19.75,
    area_m2: 50000000,
    ecosystem_code: 'FOR',
    purpose: 'monitoring',
    aoi_type: 'coverage_area',
    status: 'active',
    source: 'import',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 3,
    station_id: 2,
    platform_id: null,
    name: 'ANS Alpine Study Site',
    normalized_name: 'ans_alpine_study_site',
    description: 'Alpine ecosystem study area',
    geometry_type: 'Polygon',
    geometry_json: JSON.stringify({
      type: 'Polygon',
      coordinates: [
        [
          [18.80, 68.35],
          [18.85, 68.35],
          [18.85, 68.36],
          [18.80, 68.36],
          [18.80, 68.35],
        ],
      ],
    }),
    bbox_json: '[18.80, 68.35, 18.85, 68.36]',
    centroid_lat: 68.355,
    centroid_lon: 18.825,
    area_m2: 50000,
    ecosystem_code: 'ALP',
    purpose: 'monitoring',
    aoi_type: 'study_site',
    status: 'active',
    source: 'digitized',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

// =============================================================================
// CAMPAIGNS
// =============================================================================

export const mockCampaigns = [
  {
    id: 1,
    station_id: 1,
    platform_id: 3,
    aoi_id: 1,
    campaign_name: 'SVB Forest Spring Survey 2024',
    campaign_type: 'flight',
    description: 'Spring vegetation monitoring flight',
    planned_start_datetime: '2024-05-15T09:00:00Z',
    planned_end_datetime: '2024-05-15T12:00:00Z',
    actual_start_datetime: '2024-05-15T09:15:00Z',
    actual_end_datetime: '2024-05-15T11:45:00Z',
    status: 'completed',
    flight_altitude_m: 80,
    flight_speed_ms: 5,
    overlap_frontal_pct: 80,
    overlap_side_pct: 70,
    gsd_cm: 2.5,
    weather_conditions: 'Clear skies, light wind',
    wind_speed_ms: 3,
    cloud_cover_pct: 10,
    images_collected: 450,
    data_size_gb: 12.5,
    quality_score: 95,
    processing_status: 'completed',
    created_at: '2024-05-01T00:00:00Z',
    updated_at: '2024-05-16T00:00:00Z',
  },
  {
    id: 2,
    station_id: 1,
    platform_id: 3,
    aoi_id: 1,
    campaign_name: 'SVB Forest Summer Survey 2024',
    campaign_type: 'flight',
    description: 'Peak season vegetation monitoring',
    planned_start_datetime: '2024-07-20T09:00:00Z',
    planned_end_datetime: '2024-07-20T12:00:00Z',
    status: 'planned',
    flight_altitude_m: 80,
    overlap_frontal_pct: 80,
    overlap_side_pct: 70,
    gsd_cm: 2.5,
    created_at: '2024-06-01T00:00:00Z',
    updated_at: '2024-06-01T00:00:00Z',
  },
];

// =============================================================================
// PRODUCTS
// =============================================================================

export const mockProducts = [
  {
    id: 1,
    station_id: 1,
    platform_id: 3,
    campaign_id: 1,
    aoi_id: 1,
    product_type: 'orthomosaic',
    product_name: 'SVB Forest Spring 2024 RGB Orthomosaic',
    description: 'RGB orthomosaic from spring survey',
    source_platform_type: 'uav',
    source_date: '2024-05-15',
    source_datetime: '2024-05-15T10:30:00Z',
    bbox_json: '[19.77, 64.25, 19.78, 64.26]',
    center_lat: 64.255,
    center_lon: 19.775,
    resolution_m: 0.025,
    crs: 'EPSG:32633',
    file_format: 'GeoTIFF',
    file_size_bytes: 2500000000,
    quality_flag: 'good',
    cloud_cover_pct: 0,
    processing_level: 'L2',
    status: 'available',
    created_at: '2024-05-16T00:00:00Z',
  },
  {
    id: 2,
    station_id: 1,
    platform_id: 3,
    campaign_id: 1,
    aoi_id: 1,
    product_type: 'ndvi',
    product_name: 'SVB Forest Spring 2024 NDVI',
    description: 'NDVI vegetation index from spring survey',
    source_platform_type: 'uav',
    source_date: '2024-05-15',
    source_datetime: '2024-05-15T10:30:00Z',
    bbox_json: '[19.77, 64.25, 19.78, 64.26]',
    center_lat: 64.255,
    center_lon: 19.775,
    resolution_m: 0.025,
    crs: 'EPSG:32633',
    file_format: 'GeoTIFF',
    file_size_bytes: 500000000,
    min_value: -0.2,
    max_value: 0.85,
    mean_value: 0.55,
    std_value: 0.15,
    quality_flag: 'good',
    processing_level: 'L3',
    status: 'available',
    created_at: '2024-05-16T00:00:00Z',
  },
];

// =============================================================================
// UAV PLATFORMS
// =============================================================================

export const mockUAVPlatforms = [
  {
    id: 1,
    platform_id: 3,
    uav_model: 'Mavic 3 Multispectral',
    manufacturer: 'DJI',
    serial_number: 'DJI123456789',
    registration_number: 'SE-UAV-001',
    max_flight_time_min: 43,
    max_payload_kg: 0.1,
    max_range_km: 15,
    max_altitude_m: 500,
    max_speed_ms: 15,
    navigation_system: 'GPS+GLONASS+Galileo',
    rtk_capable: 1,
    ppk_capable: 1,
    rtk_module: 'DJI D-RTK 2',
    positioning_accuracy_cm: 2,
    rgb_camera: '4/3 CMOS 20MP',
    multispectral_camera: '5-band MS',
    home_location_lat: 64.256,
    home_location_lon: 19.775,
    operating_temp_min_c: -10,
    operating_temp_max_c: 40,
    wind_resistance_ms: 12,
    total_flight_hours: 45.5,
    firmware_version: 'v01.00.0500',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

// =============================================================================
// SATELLITE PLATFORMS
// =============================================================================

export const mockSatellitePlatforms = [
  {
    id: 1,
    platform_id: 5, // Would need to create a satellite platform first
    satellite_name: 'Sentinel-2A',
    satellite_id: '2015-028A',
    operator: 'ESA',
    program: 'Copernicus',
    constellation: 'Sentinel-2',
    orbit_type: 'sun_synchronous',
    altitude_km: 786,
    inclination_deg: 98.62,
    repeat_cycle_days: 10,
    revisit_days: 5,
    local_time: '10:30',
    swath_width_km: 290,
    native_resolution_m: 10,
    radiometric_resolution_bits: 12,
    sensor_name: 'MSI',
    num_spectral_bands: 13,
    coverage_lat_min: -56,
    coverage_lat_max: 84,
    data_provider: 'Copernicus Data Space',
    data_access_url: 'https://dataspace.copernicus.eu',
    data_format: 'SAFE/JP2',
    processing_levels: '["L1C", "L2A"]',
    launch_date: '2015-06-23',
    operational_status: 'operational',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

// =============================================================================
// USERS
// =============================================================================

export const mockUsers = [
  {
    id: 1,
    username: 'admin',
    role: 'admin',
    station_id: null,
    station_acronym: null,
    email: 'admin@test.sites.se',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    username: 'svb_user',
    role: 'station',
    station_id: 1,
    station_acronym: 'SVB',
    email: 'svb@test.sites.se',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 3,
    username: 'readonly',
    role: 'readonly',
    station_id: null,
    station_acronym: null,
    email: 'readonly@test.sites.se',
    created_at: '2024-01-01T00:00:00Z',
  },
];

// =============================================================================
// TEST DATA GENERATORS
// =============================================================================

/**
 * Generate a new platform object for testing
 */
export function generatePlatform(overrides = {}) {
  const timestamp = Date.now();
  return {
    station_id: 1,
    normalized_name: `test_platform_${timestamp}`,
    display_name: `Test Platform ${timestamp}`,
    platform_type: 'fixed',
    ecosystem_code: 'FOR',
    mounting_structure: 'tower',
    platform_height_m: 25,
    latitude: 64.256 + Math.random() * 0.01,
    longitude: 19.775 + Math.random() * 0.01,
    status: 'active',
    ...overrides,
  };
}

/**
 * Generate a new AOI object for testing
 */
export function generateAOI(overrides = {}) {
  const timestamp = Date.now();
  const baseLat = 64.25 + Math.random() * 0.1;
  const baseLon = 19.75 + Math.random() * 0.1;

  return {
    station_id: 1,
    name: `Test AOI ${timestamp}`,
    normalized_name: `test_aoi_${timestamp}`,
    description: 'Auto-generated test AOI',
    geometry_type: 'Polygon',
    geometry_json: JSON.stringify({
      type: 'Polygon',
      coordinates: [
        [
          [baseLon, baseLat],
          [baseLon + 0.01, baseLat],
          [baseLon + 0.01, baseLat + 0.01],
          [baseLon, baseLat + 0.01],
          [baseLon, baseLat],
        ],
      ],
    }),
    bbox_json: `[${baseLon}, ${baseLat}, ${baseLon + 0.01}, ${baseLat + 0.01}]`,
    centroid_lat: baseLat + 0.005,
    centroid_lon: baseLon + 0.005,
    area_m2: 100000,
    ecosystem_code: 'FOR',
    purpose: 'mapping',
    aoi_type: 'flight_area',
    status: 'active',
    source: 'manual',
    ...overrides,
  };
}

/**
 * Generate a new campaign object for testing
 */
export function generateCampaign(overrides = {}) {
  const timestamp = Date.now();
  return {
    station_id: 1,
    platform_id: 3,
    aoi_id: 1,
    campaign_name: `Test Campaign ${timestamp}`,
    campaign_type: 'flight',
    description: 'Auto-generated test campaign',
    planned_start_datetime: new Date(Date.now() + 86400000).toISOString(),
    planned_end_datetime: new Date(Date.now() + 90000000).toISOString(),
    status: 'planned',
    flight_altitude_m: 80,
    overlap_frontal_pct: 80,
    overlap_side_pct: 70,
    gsd_cm: 2.5,
    ...overrides,
  };
}

/**
 * Generate a new product object for testing
 */
export function generateProduct(overrides = {}) {
  const timestamp = Date.now();
  return {
    station_id: 1,
    platform_id: 3,
    product_type: 'ndvi',
    product_name: `Test Product ${timestamp}`,
    description: 'Auto-generated test product',
    source_platform_type: 'uav',
    source_date: new Date().toISOString().split('T')[0],
    bbox_json: '[19.77, 64.25, 19.78, 64.26]',
    center_lat: 64.255,
    center_lon: 19.775,
    resolution_m: 0.025,
    crs: 'EPSG:32633',
    file_format: 'GeoTIFF',
    quality_flag: 'good',
    processing_level: 'L2',
    status: 'available',
    ...overrides,
  };
}
