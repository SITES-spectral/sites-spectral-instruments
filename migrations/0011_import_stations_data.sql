-- Import Stations Data from Enhanced YAML
-- Generated: 2025-09-17T10:31:43.920Z
-- Source: .secure/stations.yaml

-- Clear existing data (cascading deletes will handle related tables)
DELETE FROM stations;

-- Reset auto-increment counters
DELETE FROM sqlite_sequence WHERE name IN ('stations', 'platforms', 'instruments', 'instrument_rois');

-- Station: Abisko (ANS)
INSERT INTO stations (id, normalized_name, display_name, acronym, status, country, latitude, longitude, description) VALUES (
            1,
            'abisko',
            'Abisko',
            'ANS',
            'Active',
            'Sweden',
            68.353729,
            18.816522,
            'Abisko Scientific Research Station'
        );

-- Platform: Abisko Forest Building 01
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (
                1,
                1,
                'ANS_FOR_BL01',
                'Abisko Forest Building 01',
                'BL01',
                'Building RoofTop',
                4.5,
                'Active',
                68.353729,
                18.816522,
                NULL,
                'Forest phenocam platform on research station building'
            );

-- Instrument: Abisko Forest Building 01 Phenocam 01
INSERT INTO instruments (
                    id, platform_id, normalized_name, display_name, legacy_acronym,
                    instrument_type, ecosystem_code, instrument_number,
                    camera_brand, camera_model, camera_resolution, camera_serial_number,
                    first_measurement_year, last_measurement_year, measurement_status,
                    status, deployment_date, removal_date,
                    latitude, longitude, instrument_height_m,
                    viewing_direction, azimuth_degrees, degrees_from_nadir,
                    description, installation_notes, maintenance_notes
                ) VALUES (
                    1,
                    1,
                    'ANS_FOR_BL01_PHE01',
                    'Abisko Forest Building 01 Phenocam 01',
                    'ANS-FOR-P01',
                    'phenocam',
                    'FOR',
                    'PHE01',
                    'Mobotix',
                    'M16B',
                    '4096x3072',
                    NULL,
                    2023,
                    NULL,
                    'Active',
                    'Active',
                    NULL,
                    NULL,
                    68.353729,
                    18.816522,
                    4.5,
                    'West',
                    270,
                    90,
                    'Forest ecosystem monitoring phenocam',
                    'Mounted on building rooftop facing west',
                    NULL
                );

-- ROI: ROI_00
INSERT INTO instrument_rois (
                        id, instrument_id, roi_name, roi_points, color_rgb,
                        thickness, alpha, auto_generated, description,
                        source_image, generated_date, active
                    ) VALUES (
                        1,
                        1,
                        'ROI_00',
                        '[[0,1041],[4287,1041],[4287,2847],[0,2847]]',
                        '[255,255,255]',
                        7,
                        1,
                        TRUE,
                        'Full image excluding sky (auto-calculated)',
                        'abisko_ANS_FOR_BL01_PHE01_2023_152_20230601_092630.jpg',
                        '2025-06-02',
                        TRUE
                    );

-- ROI: ROI_01
INSERT INTO instrument_rois (
                        id, instrument_id, roi_name, roi_points, color_rgb,
                        thickness, alpha, auto_generated, description,
                        source_image, generated_date, active
                    ) VALUES (
                        2,
                        1,
                        'ROI_01',
                        '[[100,1800],[2700,1550],[2500,2700],[100,2700]]',
                        '[0,255,0]',
                        7,
                        1,
                        FALSE,
                        NULL,
                        NULL,
                        NULL,
                        TRUE
                    );

-- ROI: ROI_02
INSERT INTO instrument_rois (
                        id, instrument_id, roi_name, roi_points, color_rgb,
                        thickness, alpha, auto_generated, description,
                        source_image, generated_date, active
                    ) VALUES (
                        3,
                        1,
                        'ROI_02',
                        '[[100,930],[3700,1050],[3700,1150],[100,1300]]',
                        '[0,0,255]',
                        7,
                        1,
                        FALSE,
                        NULL,
                        NULL,
                        NULL,
                        TRUE
                    );

-- ROI: ROI_03
INSERT INTO instrument_rois (
                        id, instrument_id, roi_name, roi_points, color_rgb,
                        thickness, alpha, auto_generated, description,
                        source_image, generated_date, active
                    ) VALUES (
                        4,
                        1,
                        'ROI_03',
                        '[[750,600],[3700,650],[3500,950],[100,830]]',
                        '[255,0,0]',
                        7,
                        1,
                        FALSE,
                        NULL,
                        NULL,
                        NULL,
                        TRUE
                    );

-- Station: Asa (ASA)
INSERT INTO stations (id, normalized_name, display_name, acronym, status, country, latitude, longitude, description) VALUES (
            2,
            'asa',
            'Asa',
            'ASA',
            'Active',
            'Sweden',
            NULL,
            NULL,
            'Asa Research Station'
        );

-- Platform: Asa Forest Platform 01
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (
                2,
                2,
                'ASA_FOR_PL01',
                'Asa Forest Platform 01',
                'PL01',
                'Tower',
                30,
                'Active',
                NULL,
                NULL,
                'Sun Jun 01 2025 02:00:00 GMT+0200 (Central European Summer Time)',
                'New tower built June 2025'
            );

-- Instrument: Asa Forest Platform 01 Phenocam 01
INSERT INTO instruments (
                    id, platform_id, normalized_name, display_name, legacy_acronym,
                    instrument_type, ecosystem_code, instrument_number,
                    camera_brand, camera_model, camera_resolution, camera_serial_number,
                    first_measurement_year, last_measurement_year, measurement_status,
                    status, deployment_date, removal_date,
                    latitude, longitude, instrument_height_m,
                    viewing_direction, azimuth_degrees, degrees_from_nadir,
                    description, installation_notes, maintenance_notes
                ) VALUES (
                    2,
                    2,
                    'ASA_FOR_PL01_PHE01',
                    'Asa Forest Platform 01 Phenocam 01',
                    NULL,
                    'phenocam',
                    'FOR',
                    'PHE01',
                    'Mobotix',
                    'M16B',
                    '4096x3072',
                    NULL,
                    2025,
                    NULL,
                    'Active',
                    'Active',
                    'Sun Jun 01 2025 02:00:00 GMT+0200 (Central European Summer Time)',
                    NULL,
                    NULL,
                    NULL,
                    30,
                    'West',
                    270,
                    90,
                    'Forest ecosystem monitoring phenocam',
                    'New installation on tower',
                    NULL
                );

-- ROI: ROI_00
INSERT INTO instrument_rois (
                        id, instrument_id, roi_name, roi_points, color_rgb,
                        thickness, alpha, auto_generated, description,
                        source_image, generated_date, active
                    ) VALUES (
                        5,
                        2,
                        'ROI_00',
                        '[[0,1041],[4287,1041],[4287,2847],[0,2847]]',
                        '[255,255,255]',
                        7,
                        1,
                        TRUE,
                        'Full image excluding sky (auto-calculated)',
                        'dummy.jpg',
                        '2025-06-02',
                        TRUE
                    );

-- Station: Grimsö (GRI)
INSERT INTO stations (id, normalized_name, display_name, acronym, status, country, latitude, longitude, description) VALUES (
            3,
            'grimso',
            'Grimsö',
            'GRI',
            'Active',
            'Sweden',
            59.72868,
            15.47249,
            'Grimsö Wildlife Research Station'
        );

-- Platform: Grimsö Forest Building 01
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (
                3,
                3,
                'GRI_FOR_BL01',
                'Grimsö Forest Building 01',
                'BL01',
                'Building Wall',
                4,
                'Active',
                59.72868,
                15.47249,
                NULL,
                'Forest phenocam platform mounted on building wall'
            );

-- Instrument: Grimsö Forest Building 01 Phenocam 01
INSERT INTO instruments (
                    id, platform_id, normalized_name, display_name, legacy_acronym,
                    instrument_type, ecosystem_code, instrument_number,
                    camera_brand, camera_model, camera_resolution, camera_serial_number,
                    first_measurement_year, last_measurement_year, measurement_status,
                    status, deployment_date, removal_date,
                    latitude, longitude, instrument_height_m,
                    viewing_direction, azimuth_degrees, degrees_from_nadir,
                    description, installation_notes, maintenance_notes
                ) VALUES (
                    3,
                    3,
                    'GRI_FOR_BL01_PHE01',
                    'Grimsö Forest Building 01 Phenocam 01',
                    'GRI-FOR-P01',
                    'phenocam',
                    'FOR',
                    'PHE01',
                    'Mobotix',
                    'M16A',
                    '3072x2048',
                    NULL,
                    2020,
                    NULL,
                    'Active',
                    'Active',
                    NULL,
                    NULL,
                    59.72868,
                    15.47249,
                    3.5,
                    NULL,
                    NULL,
                    90,
                    'Forest ecosystem monitoring phenocam',
                    'Wall-mounted phenocam',
                    NULL
                );

-- ROI: ROI_00
INSERT INTO instrument_rois (
                        id, instrument_id, roi_name, roi_points, color_rgb,
                        thickness, alpha, auto_generated, description,
                        source_image, generated_date, active
                    ) VALUES (
                        6,
                        3,
                        'ROI_00',
                        '[[0,748],[3071,748],[3071,2047],[0,2047]]',
                        '[255,255,255]',
                        7,
                        0.2,
                        TRUE,
                        'Full image excluding sky (auto-calculated)',
                        'grimso_GRI_FOR_BL01_PHE01_2020_152_20200531_080003.jpg',
                        '2025-06-02',
                        TRUE
                    );

-- ROI: ROI_01
INSERT INTO instrument_rois (
                        id, instrument_id, roi_name, roi_points, color_rgb,
                        thickness, alpha, auto_generated, description,
                        source_image, generated_date, active
                    ) VALUES (
                        7,
                        3,
                        'ROI_01',
                        '[[0,0],[1024,0],[1024,768],[0,768]]',
                        '[0,0,255]',
                        7,
                        1,
                        FALSE,
                        NULL,
                        NULL,
                        NULL,
                        TRUE
                    );

-- Station: Lönnstorp (LON)
INSERT INTO stations (id, normalized_name, display_name, acronym, status, country, latitude, longitude, description) VALUES (
            4,
            'lonnstorp',
            'Lönnstorp',
            'LON',
            'Active',
            'Sweden',
            55.668731,
            13.108632,
            'Lönnstorp Agricultural Research Station'
        );

-- Platform: Lönnstorp Agriculture Platform 01
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (
                4,
                4,
                'LON_AGR_PL01',
                'Lönnstorp Agriculture Platform 01',
                'PL01',
                'Mast',
                10,
                'Active',
                55.668731,
                13.108632,
                NULL,
                'Agricultural phenocam platform on 10m mast'
            );

-- Instrument: Lönnstorp Agriculture Platform 01 Phenocam 01
INSERT INTO instruments (
                    id, platform_id, normalized_name, display_name, legacy_acronym,
                    instrument_type, ecosystem_code, instrument_number,
                    camera_brand, camera_model, camera_resolution, camera_serial_number,
                    first_measurement_year, last_measurement_year, measurement_status,
                    status, deployment_date, removal_date,
                    latitude, longitude, instrument_height_m,
                    viewing_direction, azimuth_degrees, degrees_from_nadir,
                    description, installation_notes, maintenance_notes
                ) VALUES (
                    4,
                    4,
                    'LON_AGR_PL01_PHE01',
                    'Lönnstorp Agriculture Platform 01 Phenocam 01',
                    'SFA-AGR-P01',
                    'phenocam',
                    'AGR',
                    'PHE01',
                    'Mobotix',
                    'M16B',
                    '4096x3072',
                    NULL,
                    2019,
                    NULL,
                    'Active',
                    'Active',
                    NULL,
                    NULL,
                    55.668731,
                    13.108632,
                    10,
                    'West-North-West',
                    293,
                    58,
                    'Agricultural ecosystem monitoring phenocam',
                    'Mast-mounted phenocam viewing WNW',
                    NULL
                );

-- ROI: ROI_01
INSERT INTO instrument_rois (
                        id, instrument_id, roi_name, roi_points, color_rgb,
                        thickness, alpha, auto_generated, description,
                        source_image, generated_date, active
                    ) VALUES (
                        8,
                        4,
                        'ROI_01',
                        '[[100,2000],[100,900],[1600,750],[3000,1350],[3000,2000]]',
                        '[0,0,255]',
                        7,
                        1,
                        FALSE,
                        NULL,
                        NULL,
                        NULL,
                        TRUE
                    );

-- ROI: ROI_02
INSERT INTO instrument_rois (
                        id, instrument_id, roi_name, roi_points, color_rgb,
                        thickness, alpha, auto_generated, description,
                        source_image, generated_date, active
                    ) VALUES (
                        9,
                        4,
                        'ROI_02',
                        '[[50,810],[50,720],[1200,615],[1400,670]]',
                        '[0,255,0]',
                        7,
                        1,
                        FALSE,
                        NULL,
                        NULL,
                        NULL,
                        TRUE
                    );

-- ROI: ROI_03
INSERT INTO instrument_rois (
                        id, instrument_id, roi_name, roi_points, color_rgb,
                        thickness, alpha, auto_generated, description,
                        source_image, generated_date, active
                    ) VALUES (
                        10,
                        4,
                        'ROI_03',
                        '[[50,660],[50,630],[1000,545],[1140,560]]',
                        '[255,0,0]',
                        7,
                        1,
                        FALSE,
                        NULL,
                        NULL,
                        NULL,
                        TRUE
                    );

-- ROI: ROI_06
INSERT INTO instrument_rois (
                        id, instrument_id, roi_name, roi_points, color_rgb,
                        thickness, alpha, auto_generated, description,
                        source_image, generated_date, active
                    ) VALUES (
                        11,
                        4,
                        'ROI_06',
                        '[[1380,460],[1850,450],[3000,655],[3000,850]]',
                        '[255,0,255]',
                        7,
                        1,
                        FALSE,
                        NULL,
                        NULL,
                        NULL,
                        TRUE
                    );

-- ROI: ROI_00
INSERT INTO instrument_rois (
                        id, instrument_id, roi_name, roi_points, color_rgb,
                        thickness, alpha, auto_generated, description,
                        source_image, generated_date, active
                    ) VALUES (
                        12,
                        4,
                        'ROI_00',
                        '[[10,340],[3062,340],[3062,2038],[10,2038]]',
                        '[255,255,255]',
                        7,
                        1,
                        TRUE,
                        'Full image excluding sky (auto-calculated)',
                        NULL,
                        NULL,
                        TRUE
                    );

-- Instrument: LON_AGR_PL01_PHE02
INSERT INTO instruments (
                    id, platform_id, normalized_name, display_name, legacy_acronym,
                    instrument_type, ecosystem_code, instrument_number,
                    camera_brand, camera_model, camera_resolution, camera_serial_number,
                    first_measurement_year, last_measurement_year, measurement_status,
                    status, deployment_date, removal_date,
                    latitude, longitude, instrument_height_m,
                    viewing_direction, azimuth_degrees, degrees_from_nadir,
                    description, installation_notes, maintenance_notes
                ) VALUES (
                    5,
                    4,
                    'LON_AGR_PL01_PHE02',
                    NULL,
                    'SFA-AGR-P02',
                    'phenocam',
                    'AGR',
                    'PHE02',
                    'Mobotix',
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    'Active',
                    'Active',
                    NULL,
                    NULL,
                    55.669186,
                    13.11036,
                    10,
                    'North',
                    12,
                    58,
                    NULL,
                    NULL,
                    NULL
                );

-- ROI: ROI_01
INSERT INTO instrument_rois (
                        id, instrument_id, roi_name, roi_points, color_rgb,
                        thickness, alpha, auto_generated, description,
                        source_image, generated_date, active
                    ) VALUES (
                        13,
                        5,
                        'ROI_01',
                        '[[100,950],[350,720],[820,670],[950,880]]',
                        '[0,0,255]',
                        7,
                        1,
                        FALSE,
                        NULL,
                        NULL,
                        NULL,
                        TRUE
                    );

-- ROI: ROI_02
INSERT INTO instrument_rois (
                        id, instrument_id, roi_name, roi_points, color_rgb,
                        thickness, alpha, auto_generated, description,
                        source_image, generated_date, active
                    ) VALUES (
                        14,
                        5,
                        'ROI_02',
                        '[[1100,880],[930,650],[1450,630],[2000,830]]',
                        '[0,255,0]',
                        7,
                        1,
                        FALSE,
                        NULL,
                        NULL,
                        NULL,
                        TRUE
                    );

-- ROI: ROI_03
INSERT INTO instrument_rois (
                        id, instrument_id, roi_name, roi_points, color_rgb,
                        thickness, alpha, auto_generated, description,
                        source_image, generated_date, active
                    ) VALUES (
                        15,
                        5,
                        'ROI_03',
                        '[[2150,800],[1630,620],[2000,615],[2700,790]]',
                        '[255,0,0]',
                        7,
                        1,
                        FALSE,
                        NULL,
                        NULL,
                        NULL,
                        TRUE
                    );

-- ROI: ROI_04
INSERT INTO instrument_rois (
                        id, instrument_id, roi_name, roi_points, color_rgb,
                        thickness, alpha, auto_generated, description,
                        source_image, generated_date, active
                    ) VALUES (
                        16,
                        5,
                        'ROI_04',
                        '[[2150,600],[2400,600],[3035,740],[2950,780]]',
                        '[0,255,255]',
                        7,
                        1,
                        FALSE,
                        NULL,
                        NULL,
                        NULL,
                        TRUE
                    );

-- ROI: ROI_00
INSERT INTO instrument_rois (
                        id, instrument_id, roi_name, roi_points, color_rgb,
                        thickness, alpha, auto_generated, description,
                        source_image, generated_date, active
                    ) VALUES (
                        17,
                        5,
                        'ROI_00',
                        '[[10,425],[3062,425],[3062,2038],[10,2038]]',
                        '[255,255,255]',
                        7,
                        1,
                        TRUE,
                        'Full image excluding sky (auto-calculated)',
                        NULL,
                        NULL,
                        TRUE
                    );

-- Instrument: LON_AGR_PL01_PHE03
INSERT INTO instruments (
                    id, platform_id, normalized_name, display_name, legacy_acronym,
                    instrument_type, ecosystem_code, instrument_number,
                    camera_brand, camera_model, camera_resolution, camera_serial_number,
                    first_measurement_year, last_measurement_year, measurement_status,
                    status, deployment_date, removal_date,
                    latitude, longitude, instrument_height_m,
                    viewing_direction, azimuth_degrees, degrees_from_nadir,
                    description, installation_notes, maintenance_notes
                ) VALUES (
                    6,
                    4,
                    'LON_AGR_PL01_PHE03',
                    NULL,
                    'SFA-AGR-P03',
                    'phenocam',
                    'AGR',
                    'PHE03',
                    'Mobotix',
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    'Active',
                    'Active',
                    NULL,
                    NULL,
                    55.668549,
                    13.110535,
                    10,
                    'East',
                    85,
                    58,
                    NULL,
                    NULL,
                    NULL
                );

-- ROI: ROI_01
INSERT INTO instrument_rois (
                        id, instrument_id, roi_name, roi_points, color_rgb,
                        thickness, alpha, auto_generated, description,
                        source_image, generated_date, active
                    ) VALUES (
                        18,
                        6,
                        'ROI_01',
                        '[[250,1800],[250,900],[2850,900],[2850,1800]]',
                        '[0,0,255]',
                        7,
                        1,
                        FALSE,
                        NULL,
                        NULL,
                        NULL,
                        TRUE
                    );

-- ROI: ROI_00
INSERT INTO instrument_rois (
                        id, instrument_id, roi_name, roi_points, color_rgb,
                        thickness, alpha, auto_generated, description,
                        source_image, generated_date, active
                    ) VALUES (
                        19,
                        6,
                        'ROI_00',
                        '[[10,560],[3062,560],[3062,2038],[10,2038]]',
                        '[255,255,255]',
                        7,
                        1,
                        TRUE,
                        'Full image excluding sky (auto-calculated)',
                        NULL,
                        NULL,
                        TRUE
                    );

-- Station: Röbäcksdalen (RBD)
INSERT INTO stations (id, normalized_name, display_name, acronym, status, country, latitude, longitude, description) VALUES (
            5,
            'robacksdalen',
            'Röbäcksdalen',
            'RBD',
            'Active',
            'Sweden',
            NULL,
            NULL,
            NULL
        );

-- Platform: RBD_AGR_PL01
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (
                5,
                5,
                'RBD_AGR_PL01',
                NULL,
                'PL01',
                'Mast',
                10,
                'Active',
                63.806642,
                20.229243,
                NULL,
                NULL
            );

-- Instrument: RBD_AGR_PL01_PHE01
INSERT INTO instruments (
                    id, platform_id, normalized_name, display_name, legacy_acronym,
                    instrument_type, ecosystem_code, instrument_number,
                    camera_brand, camera_model, camera_resolution, camera_serial_number,
                    first_measurement_year, last_measurement_year, measurement_status,
                    status, deployment_date, removal_date,
                    latitude, longitude, instrument_height_m,
                    viewing_direction, azimuth_degrees, degrees_from_nadir,
                    description, installation_notes, maintenance_notes
                ) VALUES (
                    7,
                    5,
                    'RBD_AGR_PL01_PHE01',
                    NULL,
                    'RBD-AGR-P01',
                    'phenocam',
                    'AGR',
                    'PHE01',
                    'Mobotix',
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    'Active',
                    'Active',
                    NULL,
                    NULL,
                    63.806642,
                    20.229243,
                    10,
                    'West',
                    265,
                    59,
                    NULL,
                    NULL,
                    NULL
                );

-- ROI: ROI_01
INSERT INTO instrument_rois (
                        id, instrument_id, roi_name, roi_points, color_rgb,
                        thickness, alpha, auto_generated, description,
                        source_image, generated_date, active
                    ) VALUES (
                        20,
                        7,
                        'ROI_01',
                        '[[50,120],[50,500],[750,500],[750,120]]',
                        '[0,255,0]',
                        7,
                        1,
                        FALSE,
                        NULL,
                        NULL,
                        NULL,
                        TRUE
                    );

-- ROI: ROI_00
INSERT INTO instrument_rois (
                        id, instrument_id, roi_name, roi_points, color_rgb,
                        thickness, alpha, auto_generated, description,
                        source_image, generated_date, active
                    ) VALUES (
                        21,
                        7,
                        'ROI_00',
                        '[[10,10],[790,10],[790,590],[10,590]]',
                        '[255,255,255]',
                        7,
                        1,
                        TRUE,
                        'Full image excluding sky (auto-calculated)',
                        NULL,
                        NULL,
                        TRUE
                    );

-- Platform: RBD_AGR_PL02
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (
                6,
                5,
                'RBD_AGR_PL02',
                NULL,
                'PL02',
                'Mast',
                4,
                'Active',
                63.809992,
                20.238822,
                NULL,
                NULL
            );

-- Instrument: RBD_AGR_PL02_PHE01
INSERT INTO instruments (
                    id, platform_id, normalized_name, display_name, legacy_acronym,
                    instrument_type, ecosystem_code, instrument_number,
                    camera_brand, camera_model, camera_resolution, camera_serial_number,
                    first_measurement_year, last_measurement_year, measurement_status,
                    status, deployment_date, removal_date,
                    latitude, longitude, instrument_height_m,
                    viewing_direction, azimuth_degrees, degrees_from_nadir,
                    description, installation_notes, maintenance_notes
                ) VALUES (
                    8,
                    6,
                    'RBD_AGR_PL02_PHE01',
                    NULL,
                    'RBD-AGR-P02',
                    'phenocam',
                    'AGR',
                    'PHE01',
                    'Mobotix',
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    'Active',
                    'Active',
                    NULL,
                    NULL,
                    63.809992,
                    20.238822,
                    4,
                    'West',
                    305,
                    59,
                    NULL,
                    NULL,
                    NULL
                );

-- ROI: ROI_01
INSERT INTO instrument_rois (
                        id, instrument_id, roi_name, roi_points, color_rgb,
                        thickness, alpha, auto_generated, description,
                        source_image, generated_date, active
                    ) VALUES (
                        22,
                        8,
                        'ROI_01',
                        '[[100,200],[100,500],[700,500],[700,200]]',
                        '[0,255,0]',
                        7,
                        1,
                        FALSE,
                        NULL,
                        NULL,
                        NULL,
                        TRUE
                    );

-- ROI: ROI_00
INSERT INTO instrument_rois (
                        id, instrument_id, roi_name, roi_points, color_rgb,
                        thickness, alpha, auto_generated, description,
                        source_image, generated_date, active
                    ) VALUES (
                        23,
                        8,
                        'ROI_00',
                        '[[10,205],[790,205],[790,590],[10,590]]',
                        '[255,255,255]',
                        7,
                        1,
                        TRUE,
                        'Full image excluding sky (auto-calculated)',
                        NULL,
                        NULL,
                        TRUE
                    );

-- Station: Skogaryd (SKC)
INSERT INTO stations (id, normalized_name, display_name, acronym, status, country, latitude, longitude, description) VALUES (
            6,
            'skogaryd',
            'Skogaryd',
            'SKC',
            'Active',
            'Sweden',
            NULL,
            NULL,
            NULL
        );

-- Platform: SKC_CEM_FOR_PL01
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (
                7,
                6,
                'SKC_CEM_FOR_PL01',
                NULL,
                'PL01',
                'Tower',
                38,
                'Active',
                58.363865,
                12.149763,
                NULL,
                NULL
            );

-- Instrument: SKC_CEM_FOR_PL01_PHE01
INSERT INTO instruments (
                    id, platform_id, normalized_name, display_name, legacy_acronym,
                    instrument_type, ecosystem_code, instrument_number,
                    camera_brand, camera_model, camera_resolution, camera_serial_number,
                    first_measurement_year, last_measurement_year, measurement_status,
                    status, deployment_date, removal_date,
                    latitude, longitude, instrument_height_m,
                    viewing_direction, azimuth_degrees, degrees_from_nadir,
                    description, installation_notes, maintenance_notes
                ) VALUES (
                    9,
                    7,
                    'SKC_CEM_FOR_PL01_PHE01',
                    NULL,
                    'CEM01-FOR-P01',
                    'phenocam',
                    'FOR',
                    'PHE01',
                    'Mobotix',
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    'Active',
                    'Active',
                    NULL,
                    NULL,
                    58.363865,
                    12.149763,
                    38,
                    'South',
                    185,
                    38,
                    NULL,
                    NULL,
                    NULL
                );

-- ROI: ROI_00
INSERT INTO instrument_rois (
                        id, instrument_id, roi_name, roi_points, color_rgb,
                        thickness, alpha, auto_generated, description,
                        source_image, generated_date, active
                    ) VALUES (
                        24,
                        9,
                        'ROI_00',
                        '[[0,0],[3071,0],[3071,2047],[0,2047]]',
                        '[255,255,255]',
                        7,
                        0.2,
                        TRUE,
                        'Full image excluding sky (auto-calculated)',
                        'skogaryd_SKC_CEM_FOR_PL01_PHE01_2021_152_20210601_040000.jpg',
                        '2025-06-02',
                        TRUE
                    );

-- ROI: ROI_01
INSERT INTO instrument_rois (
                        id, instrument_id, roi_name, roi_points, color_rgb,
                        thickness, alpha, auto_generated, description,
                        source_image, generated_date, active
                    ) VALUES (
                        25,
                        9,
                        'ROI_01',
                        '[[300,1800],[300,400],[2700,400],[2700,1200],[2400,1400],[2200,1800]]',
                        '[0,255,0]',
                        7,
                        1,
                        FALSE,
                        NULL,
                        NULL,
                        NULL,
                        TRUE
                    );

-- ROI: ROI_02
INSERT INTO instrument_rois (
                        id, instrument_id, roi_name, roi_points, color_rgb,
                        thickness, alpha, auto_generated, description,
                        source_image, generated_date, active
                    ) VALUES (
                        26,
                        9,
                        'ROI_02',
                        '[[2600,1950],[2600,1680],[2950,1680],[2950,1950]]',
                        '[0,0,255]',
                        7,
                        1,
                        FALSE,
                        NULL,
                        NULL,
                        NULL,
                        TRUE
                    );

-- Platform: SKC_CEM_FOR_PL02
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (
                8,
                6,
                'SKC_CEM_FOR_PL02',
                NULL,
                'PL02',
                'Mast',
                3,
                'Active',
                58.363759,
                12.149442,
                NULL,
                NULL
            );

-- Instrument: SKC_CEM_FOR_PL02_PHE01
INSERT INTO instruments (
                    id, platform_id, normalized_name, display_name, legacy_acronym,
                    instrument_type, ecosystem_code, instrument_number,
                    camera_brand, camera_model, camera_resolution, camera_serial_number,
                    first_measurement_year, last_measurement_year, measurement_status,
                    status, deployment_date, removal_date,
                    latitude, longitude, instrument_height_m,
                    viewing_direction, azimuth_degrees, degrees_from_nadir,
                    description, installation_notes, maintenance_notes
                ) VALUES (
                    10,
                    8,
                    'SKC_CEM_FOR_PL02_PHE01',
                    NULL,
                    'CEM02-FOR-P02',
                    'phenocam',
                    'FOR',
                    'PHE01',
                    'Mobotix',
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    'Active',
                    'Active',
                    NULL,
                    NULL,
                    58.363759,
                    12.149442,
                    3,
                    'West',
                    270,
                    47,
                    NULL,
                    NULL,
                    NULL
                );

-- ROI: ROI_00
INSERT INTO instrument_rois (
                        id, instrument_id, roi_name, roi_points, color_rgb,
                        thickness, alpha, auto_generated, description,
                        source_image, generated_date, active
                    ) VALUES (
                        27,
                        10,
                        'ROI_00',
                        '[[0,0],[3071,0],[3071,2047],[0,2047]]',
                        '[255,255,255]',
                        7,
                        0.2,
                        TRUE,
                        'Full image excluding sky (auto-calculated)',
                        'skogaryd_SKC_CEM_FOR_PL02_PHE01_2021_152_20210601_040000.jpg',
                        '2025-06-02',
                        TRUE
                    );

-- ROI: ROI_01
INSERT INTO instrument_rois (
                        id, instrument_id, roi_name, roi_points, color_rgb,
                        thickness, alpha, auto_generated, description,
                        source_image, generated_date, active
                    ) VALUES (
                        28,
                        10,
                        'ROI_01',
                        '[[2550,700],[2550,1850],[700,1850],[700,700]]',
                        '[0,255,0]',
                        7,
                        1,
                        FALSE,
                        NULL,
                        NULL,
                        NULL,
                        TRUE
                    );

-- Platform: SKC_CEM_FOR_PL03
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (
                9,
                6,
                'SKC_CEM_FOR_PL03',
                NULL,
                'PL03',
                'Mast',
                3,
                'Active',
                58.363596,
                12.149933,
                NULL,
                NULL
            );

-- Instrument: SKC_CEM_FOR_PL03_PHE01
INSERT INTO instruments (
                    id, platform_id, normalized_name, display_name, legacy_acronym,
                    instrument_type, ecosystem_code, instrument_number,
                    camera_brand, camera_model, camera_resolution, camera_serial_number,
                    first_measurement_year, last_measurement_year, measurement_status,
                    status, deployment_date, removal_date,
                    latitude, longitude, instrument_height_m,
                    viewing_direction, azimuth_degrees, degrees_from_nadir,
                    description, installation_notes, maintenance_notes
                ) VALUES (
                    11,
                    9,
                    'SKC_CEM_FOR_PL03_PHE01',
                    NULL,
                    'CEM03-FOR-P03',
                    'phenocam',
                    'FOR',
                    'PHE01',
                    'Mobotix',
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    'Active',
                    'Active',
                    NULL,
                    NULL,
                    58.363596,
                    12.149933,
                    3,
                    'West?',
                    270,
                    42,
                    NULL,
                    NULL,
                    NULL
                );

-- ROI: ROI_00
INSERT INTO instrument_rois (
                        id, instrument_id, roi_name, roi_points, color_rgb,
                        thickness, alpha, auto_generated, description,
                        source_image, generated_date, active
                    ) VALUES (
                        29,
                        11,
                        'ROI_00',
                        '[[0,0],[3071,0],[3071,2047],[0,2047]]',
                        '[255,255,255]',
                        7,
                        0.2,
                        TRUE,
                        'Full image excluding sky (auto-calculated)',
                        'skogaryd_SKC_CEM_FOR_PL03_PHE01_2021_152_20210601_040000.jpg',
                        '2025-06-02',
                        TRUE
                    );

-- ROI: ROI_01
INSERT INTO instrument_rois (
                        id, instrument_id, roi_name, roi_points, color_rgb,
                        thickness, alpha, auto_generated, description,
                        source_image, generated_date, active
                    ) VALUES (
                        30,
                        11,
                        'ROI_01',
                        '[[500,500],[2500,500],[2500,1750],[500,1750]]',
                        '[0,255,0]',
                        7,
                        1,
                        FALSE,
                        NULL,
                        NULL,
                        NULL,
                        TRUE
                    );

-- Platform: SKC_LAK_PL01
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (
                10,
                6,
                'SKC_LAK_PL01',
                NULL,
                'PL01',
                'Mast',
                38,
                'Active',
                58.363058,
                12.14965,
                NULL,
                NULL
            );

-- Instrument: SKC_LAK_PL01_PHE01
INSERT INTO instruments (
                    id, platform_id, normalized_name, display_name, legacy_acronym,
                    instrument_type, ecosystem_code, instrument_number,
                    camera_brand, camera_model, camera_resolution, camera_serial_number,
                    first_measurement_year, last_measurement_year, measurement_status,
                    status, deployment_date, removal_date,
                    latitude, longitude, instrument_height_m,
                    viewing_direction, azimuth_degrees, degrees_from_nadir,
                    description, installation_notes, maintenance_notes
                ) VALUES (
                    12,
                    10,
                    'SKC_LAK_PL01_PHE01',
                    NULL,
                    'ERS-LAK-P01',
                    'phenocam',
                    'LAK',
                    'PHE01',
                    'Mobotix',
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    'Active',
                    'Active',
                    NULL,
                    NULL,
                    58.363058,
                    12.14965,
                    38,
                    'South',
                    185,
                    38,
                    NULL,
                    NULL,
                    NULL
                );

-- ROI: ROI_01
INSERT INTO instrument_rois (
                        id, instrument_id, roi_name, roi_points, color_rgb,
                        thickness, alpha, auto_generated, description,
                        source_image, generated_date, active
                    ) VALUES (
                        31,
                        12,
                        'ROI_01',
                        '[[300,1800],[300,400],[2700,400],[2700,1200],[2400,1400],[2200,1800]]',
                        '[0,255,0]',
                        7,
                        1,
                        FALSE,
                        NULL,
                        NULL,
                        NULL,
                        TRUE
                    );

-- ROI: ROI_02
INSERT INTO instrument_rois (
                        id, instrument_id, roi_name, roi_points, color_rgb,
                        thickness, alpha, auto_generated, description,
                        source_image, generated_date, active
                    ) VALUES (
                        32,
                        12,
                        'ROI_02',
                        '[[2600,1950],[2600,1680],[2950,1680],[2950,1950]]',
                        '[0,0,255]',
                        7,
                        1,
                        FALSE,
                        NULL,
                        NULL,
                        NULL,
                        TRUE
                    );

-- Platform: STM_FOR_PL01
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (
                11,
                6,
                'STM_FOR_PL01',
                NULL,
                'PL01',
                'Mast',
                NULL,
                'Active',
                58.368601,
                12.145319,
                NULL,
                NULL
            );

-- Instrument: STM_FOR_PL01_PHE01
INSERT INTO instruments (
                    id, platform_id, normalized_name, display_name, legacy_acronym,
                    instrument_type, ecosystem_code, instrument_number,
                    camera_brand, camera_model, camera_resolution, camera_serial_number,
                    first_measurement_year, last_measurement_year, measurement_status,
                    status, deployment_date, removal_date,
                    latitude, longitude, instrument_height_m,
                    viewing_direction, azimuth_degrees, degrees_from_nadir,
                    description, installation_notes, maintenance_notes
                ) VALUES (
                    13,
                    11,
                    'STM_FOR_PL01_PHE01',
                    NULL,
                    'STM-FOR-P01',
                    'phenocam',
                    'FOR',
                    'PHE01',
                    'Mobotix',
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    'Active',
                    'Active',
                    NULL,
                    NULL,
                    58.368601,
                    12.145319,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL
                );

-- Platform: SKC_MAD_WET_PL01
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (
                12,
                6,
                'SKC_MAD_WET_PL01',
                NULL,
                'PL01',
                'Mast',
                NULL,
                'Active',
                58.368601,
                12.145319,
                NULL,
                NULL
            );

-- Instrument: SKC_MAD_WET_PL01_PHE01
INSERT INTO instruments (
                    id, platform_id, normalized_name, display_name, legacy_acronym,
                    instrument_type, ecosystem_code, instrument_number,
                    camera_brand, camera_model, camera_resolution, camera_serial_number,
                    first_measurement_year, last_measurement_year, measurement_status,
                    status, deployment_date, removal_date,
                    latitude, longitude, instrument_height_m,
                    viewing_direction, azimuth_degrees, degrees_from_nadir,
                    description, installation_notes, maintenance_notes
                ) VALUES (
                    14,
                    12,
                    'SKC_MAD_WET_PL01_PHE01',
                    NULL,
                    'MAD-WET-P01',
                    'phenocam',
                    'WET',
                    'PHE01',
                    'Mobotix',
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    'Active',
                    'Active',
                    NULL,
                    NULL,
                    58.368601,
                    12.145319,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL
                );

-- ROI: ROI_00
INSERT INTO instrument_rois (
                        id, instrument_id, roi_name, roi_points, color_rgb,
                        thickness, alpha, auto_generated, description,
                        source_image, generated_date, active
                    ) VALUES (
                        33,
                        14,
                        'ROI_00',
                        '[[0,201],[1023,201],[1023,767],[0,767]]',
                        '[255,255,255]',
                        7,
                        0.2,
                        TRUE,
                        'Full image excluding sky (auto-calculated)',
                        'skogaryd_SKC_MAD_WET_PL01_PHE01_2024_152_20240531_070000.jpg',
                        '2025-06-02',
                        TRUE
                    );

-- Platform: SKC_MAD_FOR_PL02
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (
                13,
                6,
                'SKC_MAD_FOR_PL02',
                NULL,
                'PL02',
                'Mast',
                NULL,
                'Active',
                58.368601,
                12.145319,
                NULL,
                NULL
            );

-- Instrument: SKC_MAD_FOR_PL02_PHE01
INSERT INTO instruments (
                    id, platform_id, normalized_name, display_name, legacy_acronym,
                    instrument_type, ecosystem_code, instrument_number,
                    camera_brand, camera_model, camera_resolution, camera_serial_number,
                    first_measurement_year, last_measurement_year, measurement_status,
                    status, deployment_date, removal_date,
                    latitude, longitude, instrument_height_m,
                    viewing_direction, azimuth_degrees, degrees_from_nadir,
                    description, installation_notes, maintenance_notes
                ) VALUES (
                    15,
                    13,
                    'SKC_MAD_FOR_PL02_PHE01',
                    NULL,
                    'MAD-FOR-P01',
                    'phenocam',
                    'FOR',
                    'PHE01',
                    'Mobotix',
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    'Active',
                    'Active',
                    NULL,
                    NULL,
                    58.368601,
                    12.145319,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL
                );

-- ROI: ROI_00
INSERT INTO instrument_rois (
                        id, instrument_id, roi_name, roi_points, color_rgb,
                        thickness, alpha, auto_generated, description,
                        source_image, generated_date, active
                    ) VALUES (
                        34,
                        15,
                        'ROI_00',
                        '[[0,511],[3071,511],[3071,2047],[0,2047]]',
                        '[255,255,255]',
                        7,
                        0.2,
                        TRUE,
                        'Full image excluding sky (auto-calculated)',
                        'skogaryd_SKC_MAD_FOR_PL02_PHE01_2023_152_20230601_070000.jpg',
                        '2025-06-02',
                        TRUE
                    );

-- Platform: SKC_SRC_FOL_WET_PL01
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (
                14,
                6,
                'SKC_SRC_FOL_WET_PL01',
                NULL,
                'PL01',
                'Mast',
                NULL,
                'Active',
                58.375661,
                12.154016,
                NULL,
                NULL
            );

-- Instrument: SKC_SRC_FOL_WET_PL01_PHE01
INSERT INTO instruments (
                    id, platform_id, normalized_name, display_name, legacy_acronym,
                    instrument_type, ecosystem_code, instrument_number,
                    camera_brand, camera_model, camera_resolution, camera_serial_number,
                    first_measurement_year, last_measurement_year, measurement_status,
                    status, deployment_date, removal_date,
                    latitude, longitude, instrument_height_m,
                    viewing_direction, azimuth_degrees, degrees_from_nadir,
                    description, installation_notes, maintenance_notes
                ) VALUES (
                    16,
                    14,
                    'SKC_SRC_FOL_WET_PL01_PHE01',
                    NULL,
                    'FOL-WET-P01',
                    'phenocam',
                    'WET',
                    'PHE01',
                    'Mobotix',
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    'Active',
                    'Active',
                    NULL,
                    NULL,
                    58.375661,
                    12.154016,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL
                );

-- Platform: SKC_SRC_FOL_WET_PL02
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (
                15,
                6,
                'SKC_SRC_FOL_WET_PL02',
                NULL,
                'PL02',
                'Mast',
                NULL,
                'Active',
                58.375854,
                12.154016,
                NULL,
                NULL
            );

-- Instrument: SKC_SRC_FOL_WET_PL02_PHE01
INSERT INTO instruments (
                    id, platform_id, normalized_name, display_name, legacy_acronym,
                    instrument_type, ecosystem_code, instrument_number,
                    camera_brand, camera_model, camera_resolution, camera_serial_number,
                    first_measurement_year, last_measurement_year, measurement_status,
                    status, deployment_date, removal_date,
                    latitude, longitude, instrument_height_m,
                    viewing_direction, azimuth_degrees, degrees_from_nadir,
                    description, installation_notes, maintenance_notes
                ) VALUES (
                    17,
                    15,
                    'SKC_SRC_FOL_WET_PL02_PHE01',
                    NULL,
                    'FOL-WET-P02',
                    'phenocam',
                    'WET',
                    'PHE01',
                    'Mobotix',
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    'Active',
                    'Active',
                    NULL,
                    NULL,
                    58.375854,
                    12.154016,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL
                );

-- Station: Svartberget (SVB)
INSERT INTO stations (id, normalized_name, display_name, acronym, status, country, latitude, longitude, description) VALUES (
            7,
            'svartberget',
            'Svartberget',
            'SVB',
            'Active',
            'Sweden',
            NULL,
            NULL,
            NULL
        );

-- Platform: SVB_MIR_PL01
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (
                16,
                7,
                'SVB_MIR_PL01',
                NULL,
                'PL01',
                NULL,
                17.5,
                'Active',
                64.182536,
                NULL,
                NULL,
                NULL
            );

-- Instrument: SVB_MIR_PL01_PHE01
INSERT INTO instruments (
                    id, platform_id, normalized_name, display_name, legacy_acronym,
                    instrument_type, ecosystem_code, instrument_number,
                    camera_brand, camera_model, camera_resolution, camera_serial_number,
                    first_measurement_year, last_measurement_year, measurement_status,
                    status, deployment_date, removal_date,
                    latitude, longitude, instrument_height_m,
                    viewing_direction, azimuth_degrees, degrees_from_nadir,
                    description, installation_notes, maintenance_notes
                ) VALUES (
                    18,
                    16,
                    'SVB_MIR_PL01_PHE01',
                    NULL,
                    'DEG-MIR-P01',
                    'phenocam',
                    'MIR',
                    'PHE01',
                    'Mobotix',
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    'Active',
                    'Active',
                    NULL,
                    NULL,
                    64.182536,
                    19.558045,
                    17.5,
                    'North-NorthEast',
                    317,
                    81,
                    NULL,
                    NULL,
                    NULL
                );

-- ROI: ROI_00
INSERT INTO instrument_rois (
                        id, instrument_id, roi_name, roi_points, color_rgb,
                        thickness, alpha, auto_generated, description,
                        source_image, generated_date, active
                    ) VALUES (
                        35,
                        18,
                        'ROI_00',
                        '[[0,748],[3071,748],[3071,2047],[0,2047]]',
                        '[255,255,255]',
                        7,
                        0.2,
                        TRUE,
                        'Full image excluding sky (auto-calculated)',
                        'svartberget_SVB_MIR_PL01_PHE01_2022_152_20220601_000002.jpg',
                        '2025-06-02',
                        TRUE
                    );

-- Platform: SVB_MIR_PL02
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (
                17,
                7,
                'SVB_MIR_PL02',
                NULL,
                'PL02',
                'Mast',
                3.3,
                'Active',
                64.18201,
                19.556576,
                NULL,
                NULL
            );

-- Instrument: SVB_MIR_PL02_PHE01
INSERT INTO instruments (
                    id, platform_id, normalized_name, display_name, legacy_acronym,
                    instrument_type, ecosystem_code, instrument_number,
                    camera_brand, camera_model, camera_resolution, camera_serial_number,
                    first_measurement_year, last_measurement_year, measurement_status,
                    status, deployment_date, removal_date,
                    latitude, longitude, instrument_height_m,
                    viewing_direction, azimuth_degrees, degrees_from_nadir,
                    description, installation_notes, maintenance_notes
                ) VALUES (
                    19,
                    17,
                    'SVB_MIR_PL02_PHE01',
                    NULL,
                    'DEG-MIR-P02',
                    'phenocam',
                    'MIR',
                    'PHE01',
                    'Mobotix',
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    'Active',
                    'Active',
                    NULL,
                    NULL,
                    64.18201,
                    19.556576,
                    3.3,
                    'North',
                    343,
                    82,
                    NULL,
                    NULL,
                    NULL
                );

-- ROI: ROI_01
INSERT INTO instrument_rois (
                        id, instrument_id, roi_name, roi_points, color_rgb,
                        thickness, alpha, auto_generated, description,
                        source_image, generated_date, active
                    ) VALUES (
                        36,
                        19,
                        'ROI_01',
                        '[[100,400],[280,800],[1200,800],[900,350]]',
                        '[0,255,0]',
                        7,
                        1,
                        FALSE,
                        NULL,
                        NULL,
                        NULL,
                        TRUE
                    );

-- Platform: SVB_MIR_PL03
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (
                18,
                7,
                'SVB_MIR_PL03',
                NULL,
                'PL03',
                'Mast',
                17.5,
                'Active',
                64.182536,
                19.558045,
                NULL,
                NULL
            );

-- Instrument: SVB_MIR_PL03_PHE01
INSERT INTO instruments (
                    id, platform_id, normalized_name, display_name, legacy_acronym,
                    instrument_type, ecosystem_code, instrument_number,
                    camera_brand, camera_model, camera_resolution, camera_serial_number,
                    first_measurement_year, last_measurement_year, measurement_status,
                    status, deployment_date, removal_date,
                    latitude, longitude, instrument_height_m,
                    viewing_direction, azimuth_degrees, degrees_from_nadir,
                    description, installation_notes, maintenance_notes
                ) VALUES (
                    20,
                    18,
                    'SVB_MIR_PL03_PHE01',
                    NULL,
                    'DEG-MIR-P03',
                    'phenocam',
                    'MIR',
                    'PHE01',
                    'Mobotix',
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    'Active',
                    'Active',
                    'Tue Oct 29 2024 01:00:00 GMT+0100 (Central European Standard Time)',
                    NULL,
                    64.182536,
                    19.558045,
                    17.5,
                    'North-NorthEast',
                    317,
                    81,
                    NULL,
                    NULL,
                    NULL
                );

-- ROI: ROI_01
INSERT INTO instrument_rois (
                        id, instrument_id, roi_name, roi_points, color_rgb,
                        thickness, alpha, auto_generated, description,
                        source_image, generated_date, active
                    ) VALUES (
                        37,
                        20,
                        'ROI_01',
                        '[[450,800],[1750,870],[2750,900],[2850,2048],[400,2048],[700,1300],[700,1100]]',
                        '[0,255,0]',
                        7,
                        1,
                        FALSE,
                        NULL,
                        NULL,
                        NULL,
                        TRUE
                    );

-- Platform: SVB_FOR_PL01
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (
                19,
                7,
                'SVB_FOR_PL01',
                NULL,
                'PL01',
                'Flagpole and Tower',
                70,
                'Active',
                64.256342,
                19.771621,
                NULL,
                NULL
            );

-- Instrument: SVB_FOR_PL01_PHE01
INSERT INTO instruments (
                    id, platform_id, normalized_name, display_name, legacy_acronym,
                    instrument_type, ecosystem_code, instrument_number,
                    camera_brand, camera_model, camera_resolution, camera_serial_number,
                    first_measurement_year, last_measurement_year, measurement_status,
                    status, deployment_date, removal_date,
                    latitude, longitude, instrument_height_m,
                    viewing_direction, azimuth_degrees, degrees_from_nadir,
                    description, installation_notes, maintenance_notes
                ) VALUES (
                    21,
                    19,
                    'SVB_FOR_PL01_PHE01',
                    NULL,
                    'SVB-FOR-P01',
                    'phenocam',
                    'FOR',
                    'PHE01',
                    'Mobotix',
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    'Active',
                    'Inactive',
                    NULL,
                    NULL,
                    64.256342,
                    19.771621,
                    70,
                    'North-West',
                    280,
                    45,
                    NULL,
                    NULL,
                    NULL
                );

-- ROI: ROI_00
INSERT INTO instrument_rois (
                        id, instrument_id, roi_name, roi_points, color_rgb,
                        thickness, alpha, auto_generated, description,
                        source_image, generated_date, active
                    ) VALUES (
                        38,
                        21,
                        'ROI_00',
                        '[[0,744],[3071,744],[3071,2047],[0,2047]]',
                        '[255,255,255]',
                        7,
                        0.2,
                        TRUE,
                        'Full image excluding sky (auto-calculated)',
                        'svartberget_SVB_FOR_PL01_PHE01_2022_152_20220601_060003.jpg',
                        '2025-06-02',
                        TRUE
                    );

-- ROI: ROI_01
INSERT INTO instrument_rois (
                        id, instrument_id, roi_name, roi_points, color_rgb,
                        thickness, alpha, auto_generated, description,
                        source_image, generated_date, active
                    ) VALUES (
                        39,
                        21,
                        'ROI_01',
                        '[[700,2048],[300,600],[3072,600],[3072,2048]]',
                        '[0,255,0]',
                        7,
                        1,
                        FALSE,
                        NULL,
                        NULL,
                        NULL,
                        TRUE
                    );

-- Instrument: SVB_FOR_PL01_PHE02
INSERT INTO instruments (
                    id, platform_id, normalized_name, display_name, legacy_acronym,
                    instrument_type, ecosystem_code, instrument_number,
                    camera_brand, camera_model, camera_resolution, camera_serial_number,
                    first_measurement_year, last_measurement_year, measurement_status,
                    status, deployment_date, removal_date,
                    latitude, longitude, instrument_height_m,
                    viewing_direction, azimuth_degrees, degrees_from_nadir,
                    description, installation_notes, maintenance_notes
                ) VALUES (
                    22,
                    19,
                    'SVB_FOR_PL01_PHE02',
                    NULL,
                    'SVB-FOR-P02',
                    'phenocam',
                    'FOR',
                    'PHE02',
                    'Mobotix',
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    'Active',
                    'Active',
                    'Tue Oct 29 2024 01:00:00 GMT+0100 (Central European Standard Time)',
                    NULL,
                    64.256342,
                    19.771621,
                    70,
                    'North-West',
                    280,
                    45,
                    NULL,
                    NULL,
                    NULL
                );

-- ROI: ROI_00
INSERT INTO instrument_rois (
                        id, instrument_id, roi_name, roi_points, color_rgb,
                        thickness, alpha, auto_generated, description,
                        source_image, generated_date, active
                    ) VALUES (
                        40,
                        22,
                        'ROI_00',
                        '[[0,748],[3071,748],[3071,2047],[0,2047]]',
                        '[255,255,255]',
                        7,
                        0.2,
                        TRUE,
                        'Full image excluding sky (auto-calculated)',
                        'svartberget_SVB_FOR_PL01_PHE02_2025_051_20250220_100000.jpg',
                        '2025-06-02',
                        TRUE
                    );

-- ROI: ROI_01
INSERT INTO instrument_rois (
                        id, instrument_id, roi_name, roi_points, color_rgb,
                        thickness, alpha, auto_generated, description,
                        source_image, generated_date, active
                    ) VALUES (
                        41,
                        22,
                        'ROI_01',
                        '[[700,2048],[300,600],[3072,600],[3072,2048]]',
                        '[0,255,0]',
                        7,
                        1,
                        FALSE,
                        NULL,
                        NULL,
                        NULL,
                        TRUE
                    );

-- Import Statistics
-- Stations: 7
-- Platforms: 19
-- Instruments: 22
-- ROIs: 41