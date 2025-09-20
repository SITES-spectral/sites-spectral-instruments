-- ROI Data Population from stations.yaml
-- Generated on 2025-09-20T19:22:12.232Z

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
    (SELECT id FROM instruments WHERE normalized_name = 'LON_AGR_PL01_PHE02'),
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
    '[[10,425],[3062,425],[3062,2038],[10,2038]]'
);

INSERT INTO instrument_rois (
    instrument_id, roi_name, description, alpha, auto_generated,
    color_r, color_g, color_b, thickness, generated_date, source_image, points_json
) VALUES (
    (SELECT id FROM instruments WHERE normalized_name = 'LON_AGR_PL01_PHE02'),
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
    '[[100,950],[350,720],[820,670],[950,880]]'
);

INSERT INTO instrument_rois (
    instrument_id, roi_name, description, alpha, auto_generated,
    color_r, color_g, color_b, thickness, generated_date, source_image, points_json
) VALUES (
    (SELECT id FROM instruments WHERE normalized_name = 'LON_AGR_PL01_PHE02'),
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
    '[[1100,880],[930,650],[1450,630],[2000,830]]'
);

INSERT INTO instrument_rois (
    instrument_id, roi_name, description, alpha, auto_generated,
    color_r, color_g, color_b, thickness, generated_date, source_image, points_json
) VALUES (
    (SELECT id FROM instruments WHERE normalized_name = 'LON_AGR_PL01_PHE02'),
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
    '[[2150,800],[1630,620],[2000,615],[2700,790]]'
);

INSERT INTO instrument_rois (
    instrument_id, roi_name, description, alpha, auto_generated,
    color_r, color_g, color_b, thickness, generated_date, source_image, points_json
) VALUES (
    (SELECT id FROM instruments WHERE normalized_name = 'LON_AGR_PL01_PHE02'),
    'ROI_04',
    NULL,
    0,
    0,
    0,
    255,
    255,
    7,
    NULL,
    NULL,
    '[[2150,600],[2400,600],[3035,740],[2950,780]]'
);

INSERT INTO instrument_rois (
    instrument_id, roi_name, description, alpha, auto_generated,
    color_r, color_g, color_b, thickness, generated_date, source_image, points_json
) VALUES (
    (SELECT id FROM instruments WHERE normalized_name = 'LON_AGR_PL01_PHE03'),
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
    '[[10,560],[3062,560],[3062,2038],[10,2038]]'
);

INSERT INTO instrument_rois (
    instrument_id, roi_name, description, alpha, auto_generated,
    color_r, color_g, color_b, thickness, generated_date, source_image, points_json
) VALUES (
    (SELECT id FROM instruments WHERE normalized_name = 'LON_AGR_PL01_PHE03'),
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
    '[[250,1800],[250,900],[2850,900],[2850,1800]]'
);

INSERT INTO instrument_rois (
    instrument_id, roi_name, description, alpha, auto_generated,
    color_r, color_g, color_b, thickness, generated_date, source_image, points_json
) VALUES (
    (SELECT id FROM instruments WHERE normalized_name = 'RBD_AGR_PL01_PHE01'),
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
    '[[10,10],[790,10],[790,590],[10,590]]'
);

INSERT INTO instrument_rois (
    instrument_id, roi_name, description, alpha, auto_generated,
    color_r, color_g, color_b, thickness, generated_date, source_image, points_json
) VALUES (
    (SELECT id FROM instruments WHERE normalized_name = 'RBD_AGR_PL01_PHE01'),
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
    '[[50,120],[50,500],[750,500],[750,120]]'
);

INSERT INTO instrument_rois (
    instrument_id, roi_name, description, alpha, auto_generated,
    color_r, color_g, color_b, thickness, generated_date, source_image, points_json
) VALUES (
    (SELECT id FROM instruments WHERE normalized_name = 'RBD_AGR_PL02_PHE01'),
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
    '[[10,205],[790,205],[790,590],[10,590]]'
);

INSERT INTO instrument_rois (
    instrument_id, roi_name, description, alpha, auto_generated,
    color_r, color_g, color_b, thickness, generated_date, source_image, points_json
) VALUES (
    (SELECT id FROM instruments WHERE normalized_name = 'RBD_AGR_PL02_PHE01'),
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
    '[[100,200],[100,500],[700,500],[700,200]]'
);

INSERT INTO instrument_rois (
    instrument_id, roi_name, description, alpha, auto_generated,
    color_r, color_g, color_b, thickness, generated_date, source_image, points_json
) VALUES (
    (SELECT id FROM instruments WHERE normalized_name = 'SKC_CEM_FOR_PL01_PHE01'),
    'ROI_00',
    'Full image excluding sky (auto-calculated)',
    0.2,
    1,
    255,
    255,
    255,
    7,
    '2025-06-02',
    'skogaryd_SKC_CEM_FOR_PL01_PHE01_2021_152_20210601_040000.jpg',
    '[[0,0],[3071,0],[3071,2047],[0,2047]]'
);

INSERT INTO instrument_rois (
    instrument_id, roi_name, description, alpha, auto_generated,
    color_r, color_g, color_b, thickness, generated_date, source_image, points_json
) VALUES (
    (SELECT id FROM instruments WHERE normalized_name = 'SKC_CEM_FOR_PL01_PHE01'),
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
    '[[300,1800],[300,400],[2700,400],[2700,1200],[2400,1400],[2200,1800]]'
);

INSERT INTO instrument_rois (
    instrument_id, roi_name, description, alpha, auto_generated,
    color_r, color_g, color_b, thickness, generated_date, source_image, points_json
) VALUES (
    (SELECT id FROM instruments WHERE normalized_name = 'SKC_CEM_FOR_PL01_PHE01'),
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
    '[[2600,1950],[2600,1680],[2950,1680],[2950,1950]]'
);

INSERT INTO instrument_rois (
    instrument_id, roi_name, description, alpha, auto_generated,
    color_r, color_g, color_b, thickness, generated_date, source_image, points_json
) VALUES (
    (SELECT id FROM instruments WHERE normalized_name = 'SKC_CEM_FOR_PL02_PHE01'),
    'ROI_00',
    'Full image excluding sky (auto-calculated)',
    0.2,
    1,
    255,
    255,
    255,
    7,
    '2025-06-02',
    'skogaryd_SKC_CEM_FOR_PL02_PHE01_2021_152_20210601_040000.jpg',
    '[[0,0],[3071,0],[3071,2047],[0,2047]]'
);

INSERT INTO instrument_rois (
    instrument_id, roi_name, description, alpha, auto_generated,
    color_r, color_g, color_b, thickness, generated_date, source_image, points_json
) VALUES (
    (SELECT id FROM instruments WHERE normalized_name = 'SKC_CEM_FOR_PL02_PHE01'),
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
    '[[2550,700],[2550,1850],[700,1850],[700,700]]'
);

INSERT INTO instrument_rois (
    instrument_id, roi_name, description, alpha, auto_generated,
    color_r, color_g, color_b, thickness, generated_date, source_image, points_json
) VALUES (
    (SELECT id FROM instruments WHERE normalized_name = 'SKC_CEM_FOR_PL03_PHE01'),
    'ROI_00',
    'Full image excluding sky (auto-calculated)',
    0.2,
    1,
    255,
    255,
    255,
    7,
    '2025-06-02',
    'skogaryd_SKC_CEM_FOR_PL03_PHE01_2021_152_20210601_040000.jpg',
    '[[0,0],[3071,0],[3071,2047],[0,2047]]'
);

INSERT INTO instrument_rois (
    instrument_id, roi_name, description, alpha, auto_generated,
    color_r, color_g, color_b, thickness, generated_date, source_image, points_json
) VALUES (
    (SELECT id FROM instruments WHERE normalized_name = 'SKC_CEM_FOR_PL03_PHE01'),
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
    '[[500,500],[2500,500],[2500,1750],[500,1750]]'
);

INSERT INTO instrument_rois (
    instrument_id, roi_name, description, alpha, auto_generated,
    color_r, color_g, color_b, thickness, generated_date, source_image, points_json
) VALUES (
    (SELECT id FROM instruments WHERE normalized_name = 'SKC_LAK_PL01_PHE01'),
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
    '[[300,1800],[300,400],[2700,400],[2700,1200],[2400,1400],[2200,1800]]'
);

INSERT INTO instrument_rois (
    instrument_id, roi_name, description, alpha, auto_generated,
    color_r, color_g, color_b, thickness, generated_date, source_image, points_json
) VALUES (
    (SELECT id FROM instruments WHERE normalized_name = 'SKC_LAK_PL01_PHE01'),
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
    '[[2600,1950],[2600,1680],[2950,1680],[2950,1950]]'
);

INSERT INTO instrument_rois (
    instrument_id, roi_name, description, alpha, auto_generated,
    color_r, color_g, color_b, thickness, generated_date, source_image, points_json
) VALUES (
    (SELECT id FROM instruments WHERE normalized_name = 'SKC_MAD_WET_PL01_PHE01'),
    'ROI_00',
    'Full image excluding sky (auto-calculated)',
    0.2,
    1,
    255,
    255,
    255,
    7,
    '2025-06-02',
    'skogaryd_SKC_MAD_WET_PL01_PHE01_2024_152_20240531_070000.jpg',
    '[[0,201],[1023,201],[1023,767],[0,767]]'
);

INSERT INTO instrument_rois (
    instrument_id, roi_name, description, alpha, auto_generated,
    color_r, color_g, color_b, thickness, generated_date, source_image, points_json
) VALUES (
    (SELECT id FROM instruments WHERE normalized_name = 'SKC_MAD_FOR_PL02_PHE01'),
    'ROI_00',
    'Full image excluding sky (auto-calculated)',
    0.2,
    1,
    255,
    255,
    255,
    7,
    '2025-06-02',
    'skogaryd_SKC_MAD_FOR_PL02_PHE01_2023_152_20230601_070000.jpg',
    '[[0,511],[3071,511],[3071,2047],[0,2047]]'
);

INSERT INTO instrument_rois (
    instrument_id, roi_name, description, alpha, auto_generated,
    color_r, color_g, color_b, thickness, generated_date, source_image, points_json
) VALUES (
    (SELECT id FROM instruments WHERE normalized_name = 'SVB_MIR_PL01_PHE01'),
    'ROI_00',
    'Full image excluding sky (auto-calculated)',
    0.2,
    1,
    255,
    255,
    255,
    7,
    '2025-06-02',
    'svartberget_SVB_MIR_PL01_PHE01_2022_152_20220601_000002.jpg',
    '[[0,748],[3071,748],[3071,2047],[0,2047]]'
);

INSERT INTO instrument_rois (
    instrument_id, roi_name, description, alpha, auto_generated,
    color_r, color_g, color_b, thickness, generated_date, source_image, points_json
) VALUES (
    (SELECT id FROM instruments WHERE normalized_name = 'SVB_MIR_PL02_PHE01'),
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
    '[[100,400],[280,800],[1200,800],[900,350]]'
);

INSERT INTO instrument_rois (
    instrument_id, roi_name, description, alpha, auto_generated,
    color_r, color_g, color_b, thickness, generated_date, source_image, points_json
) VALUES (
    (SELECT id FROM instruments WHERE normalized_name = 'SVB_MIR_PL03_PHE01'),
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
    '[[450,800],[1750,870],[2750,900],[2850,2048],[400,2048],[700,1300],[700,1100]]'
);

INSERT INTO instrument_rois (
    instrument_id, roi_name, description, alpha, auto_generated,
    color_r, color_g, color_b, thickness, generated_date, source_image, points_json
) VALUES (
    (SELECT id FROM instruments WHERE normalized_name = 'SVB_FOR_PL01_PHE01'),
    'ROI_00',
    'Full image excluding sky (auto-calculated)',
    0.2,
    1,
    255,
    255,
    255,
    7,
    '2025-06-02',
    'svartberget_SVB_FOR_PL01_PHE01_2022_152_20220601_060003.jpg',
    '[[0,744],[3071,744],[3071,2047],[0,2047]]'
);

INSERT INTO instrument_rois (
    instrument_id, roi_name, description, alpha, auto_generated,
    color_r, color_g, color_b, thickness, generated_date, source_image, points_json
) VALUES (
    (SELECT id FROM instruments WHERE normalized_name = 'SVB_FOR_PL01_PHE01'),
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
    '[[700,2048],[300,600],[3072,600],[3072,2048]]'
);

INSERT INTO instrument_rois (
    instrument_id, roi_name, description, alpha, auto_generated,
    color_r, color_g, color_b, thickness, generated_date, source_image, points_json
) VALUES (
    (SELECT id FROM instruments WHERE normalized_name = 'SVB_FOR_PL01_PHE02'),
    'ROI_00',
    'Full image excluding sky (auto-calculated)',
    0.2,
    1,
    255,
    255,
    255,
    7,
    '2025-06-02',
    'svartberget_SVB_FOR_PL01_PHE02_2025_051_20250220_100000.jpg',
    '[[0,748],[3071,748],[3071,2047],[0,2047]]'
);

INSERT INTO instrument_rois (
    instrument_id, roi_name, description, alpha, auto_generated,
    color_r, color_g, color_b, thickness, generated_date, source_image, points_json
) VALUES (
    (SELECT id FROM instruments WHERE normalized_name = 'SVB_FOR_PL01_PHE02'),
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
    '[[700,2048],[300,600],[3072,600],[3072,2048]]'
);

