-- ROI Data Population from stations.yaml
-- Generated on 2025-09-19T16:17:39.444Z

-- Clear existing ROI data
DELETE FROM instrument_rois;

-- Insert ROI data
INSERT INTO instrument_rois (
    instrument_id, roi_name, description, alpha, auto_generated,
    color_r, color_g, color_b, thickness, generated_date, source_image, points_json
) VALUES (
    (SELECT id FROM instruments WHERE normalized_name = 'ANS_FOR_BL01_PHE01'),
    'ROI_00',
    'Full image excluding sky (auto-calculated)',
    0,
    1,
    255,
    255,
    255,
    7,
    '2025-06-02',
    'abisko_ANS_FOR_BL01_PHE01_2023_152_20230601_092630.jpg',
    '[[0,1041],[4287,1041],[4287,2847],[0,2847]]'
);

INSERT INTO instrument_rois (
    instrument_id, roi_name, description, alpha, auto_generated,
    color_r, color_g, color_b, thickness, generated_date, source_image, points_json
) VALUES (
    (SELECT id FROM instruments WHERE normalized_name = 'ANS_FOR_BL01_PHE01'),
    'ROI_01',
    NULL,
    0,
    0,
    0,
    255,
    0,
    7,
    NULL,
    NULL,
    '[[100,1800],[2700,1550],[2500,2700],[100,2700]]'
);

INSERT INTO instrument_rois (
    instrument_id, roi_name, description, alpha, auto_generated,
    color_r, color_g, color_b, thickness, generated_date, source_image, points_json
) VALUES (
    (SELECT id FROM instruments WHERE normalized_name = 'ANS_FOR_BL01_PHE01'),
    'ROI_02',
    NULL,
    0,
    0,
    0,
    0,
    255,
    7,
    NULL,
    NULL,
    '[[100,930],[3700,1050],[3700,1150],[100,1300]]'
);

INSERT INTO instrument_rois (
    instrument_id, roi_name, description, alpha, auto_generated,
    color_r, color_g, color_b, thickness, generated_date, source_image, points_json
) VALUES (
    (SELECT id FROM instruments WHERE normalized_name = 'ANS_FOR_BL01_PHE01'),
    'ROI_03',
    NULL,
    0,
    0,
    255,
    0,
    0,
    7,
    NULL,
    NULL,
    '[[750,600],[3700,650],[3500,950],[100,830]]'
);

INSERT INTO instrument_rois (
    instrument_id, roi_name, description, alpha, auto_generated,
    color_r, color_g, color_b, thickness, generated_date, source_image, points_json
) VALUES (
    (SELECT id FROM instruments WHERE normalized_name = 'ASA_FOR_PL01_PHE01'),
    'ROI_00',
    NULL,
    0,
    0,
    255,
    255,
    255,
    7,
    NULL,
    NULL,
    NULL
);

INSERT INTO instrument_rois (
    instrument_id, roi_name, description, alpha, auto_generated,
    color_r, color_g, color_b, thickness, generated_date, source_image, points_json
) VALUES (
    (SELECT id FROM instruments WHERE normalized_name = 'ASA_FOR_PL02_PHE01'),
    'ROI_00',
    NULL,
    0,
    0,
    255,
    255,
    255,
    7,
    NULL,
    NULL,
    NULL
);

INSERT INTO instrument_rois (
    instrument_id, roi_name, description, alpha, auto_generated,
    color_r, color_g, color_b, thickness, generated_date, source_image, points_json
) VALUES (
    (SELECT id FROM instruments WHERE normalized_name = 'GRI_FOR_BL01_PHE01'),
    'ROI_00',
    'Full image excluding sky (auto-calculated)',
    0.2,
    1,
    255,
    255,
    255,
    7,
    '2025-06-02',
    'grimso_GRI_FOR_BL01_PHE01_2020_152_20200531_080003.jpg',
    '[[0,748],[3071,748],[3071,2047],[0,2047]]'
);

INSERT INTO instrument_rois (
    instrument_id, roi_name, description, alpha, auto_generated,
    color_r, color_g, color_b, thickness, generated_date, source_image, points_json
) VALUES (
    (SELECT id FROM instruments WHERE normalized_name = 'GRI_FOR_BL01_PHE01'),
    'ROI_01',
    NULL,
    0,
    0,
    0,
    0,
    255,
    7,
    NULL,
    NULL,
    '[[0,0],[1024,0],[1024,768],[0,768]]'
);

INSERT INTO instrument_rois (
    instrument_id, roi_name, description, alpha, auto_generated,
    color_r, color_g, color_b, thickness, generated_date, source_image, points_json
) VALUES (
    (SELECT id FROM instruments WHERE normalized_name = 'LON_AGR_PL01_PHE01'),
    'ROI_01',
    NULL,
    0,
    0,
    0,
    0,
    255,
    7,
    NULL,
    NULL,
    '[[100,2000],[100,900],[1600,750],[3000,1350],[3000,2000]]'
);

INSERT INTO instrument_rois (
    instrument_id, roi_name, description, alpha, auto_generated,
    color_r, color_g, color_b, thickness, generated_date, source_image, points_json
) VALUES (
    (SELECT id FROM instruments WHERE normalized_name = 'LON_AGR_PL01_PHE01'),
    'ROI_02',
    NULL,
    0,
    0,
    0,
    255,
    0,
    7,
    NULL,
    NULL,
    '[[50,810],[50,720],[1200,615],[1400,670]]'
);

INSERT INTO instrument_rois (
    instrument_id, roi_name, description, alpha, auto_generated,
    color_r, color_g, color_b, thickness, generated_date, source_image, points_json
) VALUES (
    (SELECT id FROM instruments WHERE normalized_name = 'LON_AGR_PL01_PHE01'),
    'ROI_03',
    NULL,
    0,
    0,
    255,
    0,
    0,
    7,
    NULL,
    NULL,
    '[[50,660],[50,630],[1000,545],[1140,560]]'
);

INSERT INTO instrument_rois (
    instrument_id, roi_name, description, alpha, auto_generated,
    color_r, color_g, color_b, thickness, generated_date, source_image, points_json
) VALUES (
    (SELECT id FROM instruments WHERE normalized_name = 'LON_AGR_PL01_PHE01'),
    'ROI_06',
    NULL,
    0,
    0,
    255,
    0,
    255,
    7,
    NULL,
    NULL,
    '[[1380,460],[1850,450],[3000,655],[3000,850]]'
);

INSERT INTO instrument_rois (
    instrument_id, roi_name, description, alpha, auto_generated,
    color_r, color_g, color_b, thickness, generated_date, source_image, points_json
) VALUES (
    (SELECT id FROM instruments WHERE normalized_name = 'LON_AGR_PL01_PHE01'),
    'ROI_00',
    'Full image excluding sky (auto-calculated)',
    0,
    1,
    255,
    255,
    255,
    7,
    NULL,
    NULL,
    '[[10,340],[3062,340],[3062,2038],[10,2038]]'
);

