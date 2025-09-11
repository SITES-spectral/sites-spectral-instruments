INSERT INTO phenocams (
    station_id, canonical_id, legacy_acronym, ecosystem, location, instrument_number, status, deployment_date,
    platform_mounting_structure, platform_height_m, latitude, longitude, epsg, geolocation_notes,
    instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, rois_data, legacy_rois_data
  ) VALUES (
    1,
    'ANS_FOR_BL01_PHE01',
    'ANS-FOR-P01',
    'FOR',
    'BL01',
    'PHE01',
    'Active',
    NULL,
    'Building RoofTop',
    4.5,
    68.353729,
    18.816522,
    'epsg:4326',
    NULL,
    4.5,
    'West',
    270,
    90,
    '{"ROI_00":{"alpha":0,"auto_generated":true,"color":[255,255,255],"description":"Full image excluding sky (auto-calculated)","generated_date":"2025-06-02","points":[[0,1041],[4287,1041],[4287,2847],[0,2847]],"source_image":"abisko_ANS_FOR_BL01_PHE01_2023_152_20230601_092630.jpg","thickness":7},"ROI_01":{"points":[[100,1800],[2700,1550],[2500,2700],[100,2700]],"color":[0,255,0],"thickness":7},"ROI_02":{"points":[[100,930],[3700,1050],[3700,1150],[100,1300]],"color":[0,0,255],"thickness":7},"ROI_03":{"points":[[750,600],[3700,650],[3500,950],[100,830]],"color":[255,0,0],"thickness":7}}',
    NULL
  );

INSERT INTO phenocams (
    station_id, canonical_id, legacy_acronym, ecosystem, location, instrument_number, status, deployment_date,
    platform_mounting_structure, platform_height_m, latitude, longitude, epsg, geolocation_notes,
    instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, rois_data, legacy_rois_data
  ) VALUES (
    2,
    'GRI_FOR_BL01_PHE01',
    'GRI-FOR-P01',
    'FOR',
    'BL01',
    'PHE01',
    'Active',
    NULL,
    'Building Wall',
    4,
    59.72868,
    15.47249,
    'epsg:4326',
    NULL,
    3.5,
    NULL,
    NULL,
    90,
    '{"ROI_00":{"alpha":0.2,"auto_generated":true,"color":[255,255,255],"description":"Full image excluding sky (auto-calculated)","generated_date":"2025-06-02","points":[[0,748],[3071,748],[3071,2047],[0,2047]],"source_image":"grimso_GRI_FOR_BL01_PHE01_2020_152_20200531_080003.jpg","thickness":7},"ROI_01":{"points":[[0,0],[1024,0],[1024,768],[0,768]],"color":[0,0,255],"thickness":7,"updated":"2024-01-01","comment":"ROI updated to match image FOV as ROI was missing in the original config"}}',
    NULL
  );

INSERT INTO phenocams (
    station_id, canonical_id, legacy_acronym, ecosystem, location, instrument_number, status, deployment_date,
    platform_mounting_structure, platform_height_m, latitude, longitude, epsg, geolocation_notes,
    instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, rois_data, legacy_rois_data
  ) VALUES (
    3,
    'LON_AGR_PL01_PHE01',
    'SFA-AGR-P01',
    'AGR',
    'PL01',
    'PHE01',
    'Active',
    NULL,
    'Mast',
    10,
    55.668731,
    13.108632,
    'epsg:4326',
    NULL,
    10,
    'West-North-West',
    293,
    58,
    '{"ROI_01":{"points":[[100,2000],[100,900],[1600,750],[3000,1350],[3000,2000]],"color":[0,0,255],"thickness":7},"ROI_02":{"points":[[50,810],[50,720],[1200,615],[1400,670]],"color":[0,255,0],"thickness":7},"ROI_03":{"points":[[50,660],[50,630],[1000,545],[1140,560]],"color":[255,0,0],"thickness":7},"ROI_06":{"points":[[1380,460],[1850,450],[3000,655],[3000,850]],"color":[255,0,255],"thickness":7},"ROI_00":{"points":[[10,340],[3062,340],[3062,2038],[10,2038]],"color":[255,255,255],"thickness":7,"description":"Full image excluding sky (auto-calculated)","auto_generated":true}}',
    '{"ROI_04":{"points":[[50,600],[50,590],[870,510],[980,515]],"color":[0,255,255],"thickness":7,"updated":"2024-01-01","comment":"DEPRECATED: ROI too small for analysis"},"ROI_05":{"points":[[50,558],[50,545],[800,468],[900,470]],"color":[255,255,0],"thickness":7,"updated":"2024-01-01","comment":"DEPRECATED: ROI too small for analysis"}}'
  );

INSERT INTO phenocams (
    station_id, canonical_id, legacy_acronym, ecosystem, location, instrument_number, status, deployment_date,
    platform_mounting_structure, platform_height_m, latitude, longitude, epsg, geolocation_notes,
    instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, rois_data, legacy_rois_data
  ) VALUES (
    3,
    'LON_AGR_PL01_PHE02',
    'SFA-AGR-P02',
    'AGR',
    'PL01',
    'PHE02',
    'Active',
    NULL,
    'Mast',
    10,
    55.669186,
    13.11036,
    'epsg:4326',
    NULL,
    10,
    'North',
    12,
    58,
    '{"ROI_01":{"points":[[100,950],[350,720],[820,670],[950,880]],"color":[0,0,255],"thickness":7},"ROI_02":{"points":[[1100,880],[930,650],[1450,630],[2000,830]],"color":[0,255,0],"thickness":7},"ROI_03":{"points":[[2150,800],[1630,620],[2000,615],[2700,790]],"color":[255,0,0],"thickness":7},"ROI_04":{"points":[[2150,600],[2400,600],[3035,740],[2950,780]],"color":[0,255,255],"thickness":7},"ROI_00":{"points":[[10,425],[3062,425],[3062,2038],[10,2038]],"color":[255,255,255],"thickness":7,"description":"Full image excluding sky (auto-calculated)","auto_generated":true}}',
    NULL
  );

INSERT INTO phenocams (
    station_id, canonical_id, legacy_acronym, ecosystem, location, instrument_number, status, deployment_date,
    platform_mounting_structure, platform_height_m, latitude, longitude, epsg, geolocation_notes,
    instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, rois_data, legacy_rois_data
  ) VALUES (
    3,
    'LON_AGR_PL01_PHE03',
    'SFA-AGR-P03',
    'AGR',
    'PL01',
    'PHE03',
    'Active',
    NULL,
    'Mast',
    10,
    55.668549,
    13.110535,
    'epsg:4326',
    NULL,
    10,
    'East',
    85,
    58,
    '{"ROI_01":{"points":[[250,1800],[250,900],[2850,900],[2850,1800]],"color":[0,0,255],"thickness":7},"ROI_00":{"points":[[10,560],[3062,560],[3062,2038],[10,2038]],"color":[255,255,255],"thickness":7,"description":"Full image excluding sky (auto-calculated)","auto_generated":true}}',
    NULL
  );

INSERT INTO phenocams (
    station_id, canonical_id, legacy_acronym, ecosystem, location, instrument_number, status, deployment_date,
    platform_mounting_structure, platform_height_m, latitude, longitude, epsg, geolocation_notes,
    instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, rois_data, legacy_rois_data
  ) VALUES (
    4,
    'RBD_AGR_PL01_PHE01',
    'RBD-AGR-P01',
    'AGR',
    'PL01',
    'PHE01',
    'Active',
    NULL,
    'Mast',
    10,
    63.806642,
    20.229243,
    'epsg:4326',
    NULL,
    10,
    'West',
    265,
    59,
    '{"ROI_01":{"points":[[50,120],[50,500],[750,500],[750,120]],"color":[0,255,0],"thickness":7},"ROI_00":{"points":[[10,10],[790,10],[790,590],[10,590]],"color":[255,255,255],"thickness":7,"description":"Full image excluding sky (auto-calculated)","auto_generated":true}}',
    NULL
  );

INSERT INTO phenocams (
    station_id, canonical_id, legacy_acronym, ecosystem, location, instrument_number, status, deployment_date,
    platform_mounting_structure, platform_height_m, latitude, longitude, epsg, geolocation_notes,
    instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, rois_data, legacy_rois_data
  ) VALUES (
    4,
    'RBD_AGR_PL02_PHE01',
    'RBD-AGR-P02',
    'AGR',
    'PL02',
    'PHE01',
    'Active',
    NULL,
    'Mast',
    4,
    63.809992,
    20.238822,
    'epsg:4326',
    NULL,
    4,
    'West',
    305,
    59,
    '{"ROI_01":{"points":[[100,200],[100,500],[700,500],[700,200]],"color":[0,255,0],"thickness":7},"ROI_00":{"points":[[10,205],[790,205],[790,590],[10,590]],"color":[255,255,255],"thickness":7,"description":"Full image excluding sky (auto-calculated)","auto_generated":true}}',
    NULL
  );

INSERT INTO phenocams (
    station_id, canonical_id, legacy_acronym, ecosystem, location, instrument_number, status, deployment_date,
    platform_mounting_structure, platform_height_m, latitude, longitude, epsg, geolocation_notes,
    instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, rois_data, legacy_rois_data
  ) VALUES (
    5,
    'SKC_CEM_FOR_PL01_PHE01',
    'CEM01-FOR-P01',
    'FOR',
    'PL01',
    'PHE01',
    'Active',
    NULL,
    'Tower',
    38,
    58.363865,
    12.149763,
    'epsg:4326',
    NULL,
    38,
    'South',
    185,
    38,
    '{"ROI_00":{"alpha":0.2,"auto_generated":true,"color":[255,255,255],"description":"Full image excluding sky (auto-calculated)","generated_date":"2025-06-02","points":[[0,0],[3071,0],[3071,2047],[0,2047]],"source_image":"skogaryd_SKC_CEM_FOR_PL01_PHE01_2021_152_20210601_040000.jpg","thickness":7},"ROI_01":{"points":[[300,1800],[300,400],[2700,400],[2700,1200],[2400,1400],[2200,1800]],"color":[0,255,0],"thickness":7},"ROI_02":{"points":[[2600,1950],[2600,1680],[2950,1680],[2950,1950]],"color":[0,0,255],"thickness":7}}',
    NULL
  );

INSERT INTO phenocams (
    station_id, canonical_id, legacy_acronym, ecosystem, location, instrument_number, status, deployment_date,
    platform_mounting_structure, platform_height_m, latitude, longitude, epsg, geolocation_notes,
    instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, rois_data, legacy_rois_data
  ) VALUES (
    5,
    'SKC_CEM_FOR_PL02_PHE01',
    'CEM02-FOR-P02',
    'FOR',
    'PL02',
    'PHE01',
    'Active',
    NULL,
    'Mast',
    3,
    58.363759,
    12.149442,
    'epsg:4326',
    NULL,
    3,
    'West',
    270,
    47,
    '{"ROI_00":{"alpha":0.2,"auto_generated":true,"color":[255,255,255],"description":"Full image excluding sky (auto-calculated)","generated_date":"2025-06-02","points":[[0,0],[3071,0],[3071,2047],[0,2047]],"source_image":"skogaryd_SKC_CEM_FOR_PL02_PHE01_2021_152_20210601_040000.jpg","thickness":7},"ROI_01":{"points":[[2550,700],[2550,1850],[700,1850],[700,700]],"color":[0,255,0],"thickness":7}}',
    NULL
  );

INSERT INTO phenocams (
    station_id, canonical_id, legacy_acronym, ecosystem, location, instrument_number, status, deployment_date,
    platform_mounting_structure, platform_height_m, latitude, longitude, epsg, geolocation_notes,
    instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, rois_data, legacy_rois_data
  ) VALUES (
    5,
    'SKC_CEM_FOR_PL03_PHE01',
    'CEM03-FOR-P03',
    'FOR',
    'PL03',
    'PHE01',
    'Active',
    NULL,
    'Mast',
    3,
    58.363596,
    12.149933,
    'epsg:4326',
    NULL,
    3,
    'West',
    270,
    42,
    '{"ROI_00":{"alpha":0.2,"auto_generated":true,"color":[255,255,255],"description":"Full image excluding sky (auto-calculated)","generated_date":"2025-06-02","points":[[0,0],[3071,0],[3071,2047],[0,2047]],"source_image":"skogaryd_SKC_CEM_FOR_PL03_PHE01_2021_152_20210601_040000.jpg","thickness":7},"ROI_01":{"points":[[500,500],[2500,500],[2500,1750],[500,1750]],"color":[0,255,0],"thickness":7}}',
    NULL
  );

INSERT INTO phenocams (
    station_id, canonical_id, legacy_acronym, ecosystem, location, instrument_number, status, deployment_date,
    platform_mounting_structure, platform_height_m, latitude, longitude, epsg, geolocation_notes,
    instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, rois_data, legacy_rois_data
  ) VALUES (
    5,
    'SKC_LAK_PL01_PHE01',
    'ERS-LAK-P01',
    'LAK',
    'PL01',
    'PHE01',
    'Active',
    NULL,
    'Mast',
    38,
    58.363058,
    12.14965,
    'epsg:4326',
    NULL,
    38,
    'South',
    185,
    38,
    '{"ROI_01":{"points":[[300,1800],[300,400],[2700,400],[2700,1200],[2400,1400],[2200,1800]],"color":[0,255,0],"thickness":7},"ROI_02":{"points":[[2600,1950],[2600,1680],[2950,1680],[2950,1950]],"color":[0,0,255],"thickness":7}}',
    NULL
  );

INSERT INTO phenocams (
    station_id, canonical_id, legacy_acronym, ecosystem, location, instrument_number, status, deployment_date,
    platform_mounting_structure, platform_height_m, latitude, longitude, epsg, geolocation_notes,
    instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, rois_data, legacy_rois_data
  ) VALUES (
    5,
    'STM_FOR_PL01_PHE01',
    'STM-FOR-P01',
    'FOR',
    'PL01',
    'PHE01',
    'Active',
    NULL,
    'Mast',
    NULL,
    58.368601,
    12.145319,
    'epsg:4326',
    'URGENT REQUIRES NAME AND LOCATION used Phenocam Replanted, C-mast-5, MCM05 because missing info',
    NULL,
    NULL,
    NULL,
    NULL,
    '{"ROI_00":null}',
    NULL
  );

INSERT INTO phenocams (
    station_id, canonical_id, legacy_acronym, ecosystem, location, instrument_number, status, deployment_date,
    platform_mounting_structure, platform_height_m, latitude, longitude, epsg, geolocation_notes,
    instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, rois_data, legacy_rois_data
  ) VALUES (
    5,
    'SKC_MAD_WET_PL01_PHE01',
    'MAD-WET-P01',
    'WET',
    'PL02',
    'PHE01',
    'Active',
    NULL,
    'Mast',
    NULL,
    58.368601,
    12.145319,
    'epsg:4326',
    'URGENT NAME AND LOCATION CONFIRMATION',
    NULL,
    NULL,
    NULL,
    NULL,
    '{"ROI_00":{"alpha":0.2,"auto_generated":true,"color":[255,255,255],"description":"Full image excluding sky (auto-calculated)","generated_date":"2025-06-02","points":[[0,201],[1023,201],[1023,767],[0,767]],"source_image":"skogaryd_SKC_MAD_WET_PL01_PHE01_2024_152_20240531_070000.jpg","thickness":7}}',
    NULL
  );

INSERT INTO phenocams (
    station_id, canonical_id, legacy_acronym, ecosystem, location, instrument_number, status, deployment_date,
    platform_mounting_structure, platform_height_m, latitude, longitude, epsg, geolocation_notes,
    instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, rois_data, legacy_rois_data
  ) VALUES (
    5,
    'SKC_MAD_FOR_PL02_PHE01',
    'MAD-FOR-P01',
    'FOR',
    'PL04',
    'PHE01',
    'Active',
    NULL,
    'Mast',
    NULL,
    58.368601,
    12.145319,
    'epsg:4326',
    'URGENT NAME AND LOCATION CONFIRMATION',
    NULL,
    NULL,
    NULL,
    NULL,
    '{"ROI_00":{"alpha":0.2,"auto_generated":true,"color":[255,255,255],"description":"Full image excluding sky (auto-calculated)","generated_date":"2025-06-02","points":[[0,511],[3071,511],[3071,2047],[0,2047]],"source_image":"skogaryd_SKC_MAD_FOR_PL02_PHE01_2023_152_20230601_070000.jpg","thickness":7}}',
    NULL
  );

INSERT INTO phenocams (
    station_id, canonical_id, legacy_acronym, ecosystem, location, instrument_number, status, deployment_date,
    platform_mounting_structure, platform_height_m, latitude, longitude, epsg, geolocation_notes,
    instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, rois_data, legacy_rois_data
  ) VALUES (
    5,
    'SKC_SRC_FOL_WET_PL01_PHE01',
    'FOL-WET-P01',
    'WET',
    'PL03',
    'PHE01',
    'Active',
    NULL,
    'Mast',
    NULL,
    58.375661,
    12.154016,
    'epsg:4326',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    '{"ROI_00":null}',
    NULL
  );

INSERT INTO phenocams (
    station_id, canonical_id, legacy_acronym, ecosystem, location, instrument_number, status, deployment_date,
    platform_mounting_structure, platform_height_m, latitude, longitude, epsg, geolocation_notes,
    instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, rois_data, legacy_rois_data
  ) VALUES (
    5,
    'SKC_SRC_FOL_WET_PL02_PHE01',
    'FOL-WET-P02',
    'WET',
    'PL04',
    'PHE01',
    'Active',
    NULL,
    'Mast',
    NULL,
    58.375854,
    12.154016,
    'epsg:4326',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    '{"ROI_00":null}',
    NULL
  );

INSERT INTO phenocams (
    station_id, canonical_id, legacy_acronym, ecosystem, location, instrument_number, status, deployment_date,
    platform_mounting_structure, platform_height_m, latitude, longitude, epsg, geolocation_notes,
    instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, rois_data, legacy_rois_data
  ) VALUES (
    6,
    'SVB_MIR_PL01_PHE01',
    'DEG-MIR-P01',
    'MIR',
    'PL01',
    'PHE01',
    'Active',
    NULL,
    NULL,
    17.5,
    64.182536,
    19.558045,
    'epsg:4326',
    NULL,
    17.5,
    'North-NorthEast',
    317,
    81,
    '{"ROI_00":{"alpha":0.2,"auto_generated":true,"color":[255,255,255],"description":"Full image excluding sky (auto-calculated)","generated_date":"2025-06-02","points":[[0,748],[3071,748],[3071,2047],[0,2047]],"source_image":"svartberget_SVB_MIR_PL01_PHE01_2022_152_20220601_000002.jpg","thickness":7}}',
    NULL
  );

INSERT INTO phenocams (
    station_id, canonical_id, legacy_acronym, ecosystem, location, instrument_number, status, deployment_date,
    platform_mounting_structure, platform_height_m, latitude, longitude, epsg, geolocation_notes,
    instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, rois_data, legacy_rois_data
  ) VALUES (
    6,
    'SVB_MIR_PL02_PHE01',
    'DEG-MIR-P02',
    'MIR',
    'PL02',
    'PHE01',
    'Active',
    NULL,
    'Mast',
    3.3,
    64.18201,
    19.556576,
    'epsg:4326',
    NULL,
    3.3,
    'North',
    343,
    82,
    '{"ROI_01":{"points":[[100,400],[280,800],[1200,800],[900,350]],"color":[0,255,0],"thickness":7,"updated":"2024-10-29","comment":"same ROI as in DEG-MIR-02-legacy, but resized to match the higher resolution (*1.25)"}}',
    '{"ROI_01":{"points":[[80,320],[224,640],[960,640],[720,280]],"color":[0,255,0],"thickness":7,"updated":"2024-10-29","comment":"Lower image_dimensions so roi does not match anylonger. ICOS phenocam, 1024x768","legacy_platform":"DEG-MIR-02-legacy"}}'
  );

INSERT INTO phenocams (
    station_id, canonical_id, legacy_acronym, ecosystem, location, instrument_number, status, deployment_date,
    platform_mounting_structure, platform_height_m, latitude, longitude, epsg, geolocation_notes,
    instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, rois_data, legacy_rois_data
  ) VALUES (
    6,
    'SVB_MIR_PL03_PHE01',
    'DEG-MIR-P03',
    'MIR',
    'PL03',
    'PHE01',
    'Active',
    '"2024-10-29T00:00:00.000Z"',
    'Mast',
    17.5,
    64.182536,
    19.558045,
    'epsg:4326',
    NULL,
    17.5,
    'North-NorthEast',
    317,
    81,
    '{"ROI_01":{"points":[[450,800],[1750,870],[2750,900],[2850,2048],[400,2048],[700,1300],[700,1100]],"color":[0,255,0],"thickness":7,"updated":"2024-10-29","comment":"Bellow boardwalk- New deployment"}}',
    NULL
  );

INSERT INTO phenocams (
    station_id, canonical_id, legacy_acronym, ecosystem, location, instrument_number, status, deployment_date,
    platform_mounting_structure, platform_height_m, latitude, longitude, epsg, geolocation_notes,
    instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, rois_data, legacy_rois_data
  ) VALUES (
    6,
    'SVB_FOR_PL01_PHE01',
    'SVB-FOR-P01',
    'FOR',
    'PL01',
    'PHE01',
    'Inactive',
    NULL,
    'Flagpole',
    70,
    64.256342,
    19.771621,
    'epsg:4326',
    NULL,
    70,
    'North-West',
    280,
    45,
    '{"ROI_00":{"alpha":0.2,"auto_generated":true,"color":[255,255,255],"description":"Full image excluding sky (auto-calculated)","generated_date":"2025-06-02","points":[[0,744],[3071,744],[3071,2047],[0,2047]],"source_image":"svartberget_SVB_FOR_PL01_PHE01_2022_152_20220601_060003.jpg","thickness":7},"ROI_01":{"points":[[700,2048],[300,600],[3072,600],[3072,2048]],"color":[0,255,0],"thickness":7,"updated":"2024-10-29","comment":"same ROI as in SVB-FOR-P02, but resized to match the higher resolution (*1.25)"}}',
    '{"ROI_01":{"points":[[300,1500],[300,600],[2800,600],[2800,1500]],"color":[0,255,0],"thickness":7,"updated":"2024-10-29","comment":"DEPRECATED: Increased camera resolution"}}'
  );

INSERT INTO phenocams (
    station_id, canonical_id, legacy_acronym, ecosystem, location, instrument_number, status, deployment_date,
    platform_mounting_structure, platform_height_m, latitude, longitude, epsg, geolocation_notes,
    instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, rois_data, legacy_rois_data
  ) VALUES (
    6,
    'SVB_FOR_PL01_PHE02',
    'SVB-FOR-P02',
    'FOR',
    'PL01',
    'PHE02',
    'Active',
    '"2024-10-29T00:00:00.000Z"',
    'Tower',
    70,
    64.256342,
    19.771621,
    'epsg:4326',
    NULL,
    70,
    'North-West',
    280,
    45,
    '{"ROI_00":{"alpha":0.2,"auto_generated":true,"color":[255,255,255],"description":"Full image excluding sky (auto-calculated)","generated_date":"2025-06-02","points":[[0,748],[3071,748],[3071,2047],[0,2047]],"source_image":"svartberget_SVB_FOR_PL01_PHE02_2025_051_20250220_100000.jpg","thickness":7},"ROI_01":{"points":[[700,2048],[300,600],[3072,600],[3072,2048]],"color":[0,255,0],"thickness":7,"updated":"2024-10-29"}}',
    '{"ROI_01":{"points":[[300,1500],[300,600],[2800,600],[2800,1500]],"color":[0,255,0],"thickness":7,"updated":"2024-10-29","comment":"DEPRECATED: Increased camera resolution - It used to be the same as SVB-FOR-P01"}}'
  );