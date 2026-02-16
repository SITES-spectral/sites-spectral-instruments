-- Migration: 0048_add_phenocam_rois.sql
-- Date: 2026-02-16
-- Description: Add ROI definitions from phenocams config to instrument_rois table
-- Source: apps/phenocams/config/stations.yaml
--
-- ROI fields mapping:
-- - roi_name: ROI_00, ROI_01, etc.
-- - points_json: JSON array of [x, y] coordinates
-- - color_r, color_g, color_b: RGB values from YAML color array
-- - alpha: Transparency (default 0.0)
-- - thickness: Line thickness (default 7)
-- - auto_generated: Boolean for ROI_00 full-image masks
-- - description: ROI description
-- - generated_date: Date ROI was generated
-- - source_image: Reference image filename

-- ===========================================================================
-- ANS_FOR_BLD01_PHE01 (Abisko) - ID: 1
-- ===========================================================================
INSERT INTO instrument_rois (instrument_id, roi_name, description, alpha, auto_generated, color_r, color_g, color_b, thickness, generated_date, source_image, points_json, roi_processing_enabled)
VALUES (1, 'ROI_00', 'Full image excluding sky (auto-calculated)', 0.0, true, 255, 255, 255, 7, '2025-06-02', 'abisko_ANS_FOR_BL01_PHE01_2023_152_20230601_092630.jpg', '[[0, 1041], [4287, 1041], [4287, 2847], [0, 2847]]', true);

INSERT INTO instrument_rois (instrument_id, roi_name, alpha, color_r, color_g, color_b, thickness, points_json, roi_processing_enabled)
VALUES (1, 'ROI_01', 0.0, 0, 255, 0, 7, '[[100, 1800], [2700, 1550], [2500, 2700], [100, 2700]]', true);

INSERT INTO instrument_rois (instrument_id, roi_name, alpha, color_r, color_g, color_b, thickness, points_json, roi_processing_enabled)
VALUES (1, 'ROI_02', 0.0, 0, 0, 255, 7, '[[100, 930], [3700, 1050], [3700, 1150], [100, 1300]]', true);

INSERT INTO instrument_rois (instrument_id, roi_name, alpha, color_r, color_g, color_b, thickness, points_json, roi_processing_enabled)
VALUES (1, 'ROI_03', 0.0, 255, 0, 0, 7, '[[750, 600], [3700, 650], [3500, 950], [100, 830]]', true);

-- ===========================================================================
-- GRI_FOR_BLD01_PHE01 (Grimsö) - ID: 4
-- ===========================================================================
INSERT INTO instrument_rois (instrument_id, roi_name, description, alpha, auto_generated, color_r, color_g, color_b, thickness, generated_date, source_image, points_json, roi_processing_enabled)
VALUES (4, 'ROI_00', 'Full image excluding sky (auto-calculated)', 0.2, true, 255, 255, 255, 7, '2025-06-02', 'grimso_GRI_FOR_BL01_PHE01_2020_152_20200531_080003.jpg', '[[0, 748], [3071, 748], [3071, 2047], [0, 2047]]', true);

INSERT INTO instrument_rois (instrument_id, roi_name, alpha, color_r, color_g, color_b, thickness, points_json, roi_processing_enabled)
VALUES (4, 'ROI_01', 0.0, 0, 0, 255, 7, '[[0, 0], [1024, 0], [1024, 768], [0, 768]]', true);

-- ===========================================================================
-- LON_AGR_TWR01_PHE01 (Lönnstorp PHE01) - ID: 5
-- ===========================================================================
INSERT INTO instrument_rois (instrument_id, roi_name, description, alpha, auto_generated, color_r, color_g, color_b, thickness, points_json, roi_processing_enabled)
VALUES (5, 'ROI_00', 'Full image excluding sky (auto-calculated)', 0.0, true, 255, 255, 255, 7, '[[10, 340], [3062, 340], [3062, 2038], [10, 2038]]', true);

INSERT INTO instrument_rois (instrument_id, roi_name, alpha, color_r, color_g, color_b, thickness, points_json, roi_processing_enabled)
VALUES (5, 'ROI_01', 0.0, 0, 0, 255, 7, '[[100, 2000], [100, 900], [1600, 750], [3000, 1350], [3000, 2000]]', true);

INSERT INTO instrument_rois (instrument_id, roi_name, alpha, color_r, color_g, color_b, thickness, points_json, roi_processing_enabled)
VALUES (5, 'ROI_02', 0.0, 0, 255, 0, 7, '[[50, 810], [50, 720], [1200, 615], [1400, 670]]', true);

INSERT INTO instrument_rois (instrument_id, roi_name, alpha, color_r, color_g, color_b, thickness, points_json, roi_processing_enabled)
VALUES (5, 'ROI_03', 0.0, 255, 0, 0, 7, '[[50, 660], [50, 630], [1000, 545], [1140, 560]]', true);

INSERT INTO instrument_rois (instrument_id, roi_name, alpha, color_r, color_g, color_b, thickness, points_json, roi_processing_enabled)
VALUES (5, 'ROI_06', 0.0, 255, 0, 255, 7, '[[1380, 460], [1850, 450], [3000, 655], [3000, 850]]', true);

-- ===========================================================================
-- LON_AGR_TWR01_PHE02 (Lönnstorp PHE02) - ID: 6
-- ===========================================================================
INSERT INTO instrument_rois (instrument_id, roi_name, description, alpha, auto_generated, color_r, color_g, color_b, thickness, points_json, roi_processing_enabled)
VALUES (6, 'ROI_00', 'Full image excluding sky (auto-calculated)', 0.0, true, 255, 255, 255, 7, '[[10, 425], [3062, 425], [3062, 2038], [10, 2038]]', true);

INSERT INTO instrument_rois (instrument_id, roi_name, alpha, color_r, color_g, color_b, thickness, points_json, roi_processing_enabled)
VALUES (6, 'ROI_01', 0.0, 0, 0, 255, 7, '[[100, 950], [350, 720], [820, 670], [950, 880]]', true);

INSERT INTO instrument_rois (instrument_id, roi_name, alpha, color_r, color_g, color_b, thickness, points_json, roi_processing_enabled)
VALUES (6, 'ROI_02', 0.0, 0, 255, 0, 7, '[[1100, 880], [930, 650], [1450, 630], [2000, 830]]', true);

INSERT INTO instrument_rois (instrument_id, roi_name, alpha, color_r, color_g, color_b, thickness, points_json, roi_processing_enabled)
VALUES (6, 'ROI_03', 0.0, 255, 0, 0, 7, '[[2150, 800], [1630, 620], [2000, 615], [2700, 790]]', true);

INSERT INTO instrument_rois (instrument_id, roi_name, alpha, color_r, color_g, color_b, thickness, points_json, roi_processing_enabled)
VALUES (6, 'ROI_04', 0.0, 0, 255, 255, 7, '[[2150, 600], [2400, 600], [3035, 740], [2950, 780]]', true);

-- ===========================================================================
-- LON_AGR_TWR01_PHE03 (Lönnstorp PHE03) - ID: 7
-- ===========================================================================
INSERT INTO instrument_rois (instrument_id, roi_name, description, alpha, auto_generated, color_r, color_g, color_b, thickness, points_json, roi_processing_enabled)
VALUES (7, 'ROI_00', 'Full image excluding sky (auto-calculated)', 0.0, true, 255, 255, 255, 7, '[[10, 560], [3062, 560], [3062, 2038], [10, 2038]]', true);

INSERT INTO instrument_rois (instrument_id, roi_name, alpha, color_r, color_g, color_b, thickness, points_json, roi_processing_enabled)
VALUES (7, 'ROI_01', 0.0, 0, 0, 255, 7, '[[250, 1800], [250, 900], [2850, 900], [2850, 1800]]', true);

-- ===========================================================================
-- RBD_AGR_TWR01_PHE01 (Röbäcksdalen PHE01) - ID: 8
-- ===========================================================================
INSERT INTO instrument_rois (instrument_id, roi_name, description, alpha, auto_generated, color_r, color_g, color_b, thickness, points_json, roi_processing_enabled)
VALUES (8, 'ROI_00', 'Full image excluding sky (auto-calculated)', 0.0, true, 255, 255, 255, 7, '[[10, 10], [790, 10], [790, 590], [10, 590]]', true);

INSERT INTO instrument_rois (instrument_id, roi_name, alpha, color_r, color_g, color_b, thickness, points_json, roi_processing_enabled)
VALUES (8, 'ROI_01', 0.0, 0, 255, 0, 7, '[[50, 120], [50, 500], [750, 500], [750, 120]]', true);

-- ===========================================================================
-- RBD_AGR_TWR02_PHE01 (Röbäcksdalen PHE02) - ID: 9
-- ===========================================================================
INSERT INTO instrument_rois (instrument_id, roi_name, description, alpha, auto_generated, color_r, color_g, color_b, thickness, points_json, roi_processing_enabled)
VALUES (9, 'ROI_00', 'Full image excluding sky (auto-calculated)', 0.0, true, 255, 255, 255, 7, '[[10, 205], [790, 205], [790, 590], [10, 590]]', true);

INSERT INTO instrument_rois (instrument_id, roi_name, alpha, color_r, color_g, color_b, thickness, points_json, roi_processing_enabled)
VALUES (9, 'ROI_01', 0.0, 0, 255, 0, 7, '[[100, 200], [100, 500], [700, 500], [700, 200]]', true);

-- ===========================================================================
-- SKC_CEM_FOR_TWR01_PHE01 (Skogaryd CEM TWR01) - ID: 10
-- ===========================================================================
INSERT INTO instrument_rois (instrument_id, roi_name, description, alpha, auto_generated, color_r, color_g, color_b, thickness, generated_date, source_image, points_json, roi_processing_enabled)
VALUES (10, 'ROI_00', 'Full image excluding sky (auto-calculated)', 0.2, true, 255, 255, 255, 7, '2025-06-02', 'skogaryd_SKC_CEM_FOR_PL01_PHE01_2021_152_20210601_040000.jpg', '[[0, 0], [3071, 0], [3071, 2047], [0, 2047]]', true);

INSERT INTO instrument_rois (instrument_id, roi_name, alpha, color_r, color_g, color_b, thickness, points_json, roi_processing_enabled)
VALUES (10, 'ROI_01', 0.0, 0, 255, 0, 7, '[[300, 1800], [300, 400], [2700, 400], [2700, 1200], [2400, 1400], [2200, 1800]]', true);

INSERT INTO instrument_rois (instrument_id, roi_name, alpha, color_r, color_g, color_b, thickness, points_json, roi_processing_enabled)
VALUES (10, 'ROI_02', 0.0, 0, 0, 255, 7, '[[2600, 1950], [2600, 1680], [2950, 1680], [2950, 1950]]', true);

-- ===========================================================================
-- SKC_CEM_FOR_TWR02_PHE01 (Skogaryd CEM TWR02) - ID: 11
-- ===========================================================================
INSERT INTO instrument_rois (instrument_id, roi_name, description, alpha, auto_generated, color_r, color_g, color_b, thickness, generated_date, source_image, points_json, roi_processing_enabled)
VALUES (11, 'ROI_00', 'Full image excluding sky (auto-calculated)', 0.2, true, 255, 255, 255, 7, '2025-06-02', 'skogaryd_SKC_CEM_FOR_PL02_PHE01_2021_152_20210601_040000.jpg', '[[0, 0], [3071, 0], [3071, 2047], [0, 2047]]', true);

INSERT INTO instrument_rois (instrument_id, roi_name, alpha, color_r, color_g, color_b, thickness, points_json, roi_processing_enabled)
VALUES (11, 'ROI_01', 0.0, 0, 255, 0, 7, '[[2550, 700], [2550, 1850], [700, 1850], [700, 700]]', true);

-- ===========================================================================
-- SKC_CEM_FOR_TWR03_PHE01 (Skogaryd CEM TWR03) - ID: 12
-- ===========================================================================
INSERT INTO instrument_rois (instrument_id, roi_name, description, alpha, auto_generated, color_r, color_g, color_b, thickness, generated_date, source_image, points_json, roi_processing_enabled)
VALUES (12, 'ROI_00', 'Full image excluding sky (auto-calculated)', 0.2, true, 255, 255, 255, 7, '2025-06-02', 'skogaryd_SKC_CEM_FOR_PL03_PHE01_2021_152_20210601_040000.jpg', '[[0, 0], [3071, 0], [3071, 2047], [0, 2047]]', true);

INSERT INTO instrument_rois (instrument_id, roi_name, alpha, color_r, color_g, color_b, thickness, points_json, roi_processing_enabled)
VALUES (12, 'ROI_01', 0.0, 0, 255, 0, 7, '[[500, 500], [2500, 500], [2500, 1750], [500, 1750]]', true);

-- ===========================================================================
-- SKC_LAK_TWR01_PHE01 (Skogaryd Lake) - ID: 13
-- ===========================================================================
INSERT INTO instrument_rois (instrument_id, roi_name, alpha, color_r, color_g, color_b, thickness, points_json, roi_processing_enabled)
VALUES (13, 'ROI_01', 0.0, 0, 255, 0, 7, '[[300, 1800], [300, 400], [2700, 400], [2700, 1200], [2400, 1400], [2200, 1800]]', true);

INSERT INTO instrument_rois (instrument_id, roi_name, alpha, color_r, color_g, color_b, thickness, points_json, roi_processing_enabled)
VALUES (13, 'ROI_02', 0.0, 0, 0, 255, 7, '[[2600, 1950], [2600, 1680], [2950, 1680], [2950, 1950]]', true);

-- ===========================================================================
-- SKC_MAD_WET_TWR01_PHE01 (Skogaryd MAD Wetland) - ID: 15
-- ===========================================================================
INSERT INTO instrument_rois (instrument_id, roi_name, description, alpha, auto_generated, color_r, color_g, color_b, thickness, generated_date, source_image, points_json, roi_processing_enabled)
VALUES (15, 'ROI_00', 'Full image excluding sky (auto-calculated)', 0.2, true, 255, 255, 255, 7, '2025-06-02', 'skogaryd_SKC_MAD_WET_PL01_PHE01_2024_152_20240531_070000.jpg', '[[0, 201], [1023, 201], [1023, 767], [0, 767]]', true);

-- ===========================================================================
-- SKC_MAD_FOR_TWR02_PHE01 (Skogaryd MAD Forest) - ID: 16
-- ===========================================================================
INSERT INTO instrument_rois (instrument_id, roi_name, description, alpha, auto_generated, color_r, color_g, color_b, thickness, generated_date, source_image, points_json, roi_processing_enabled)
VALUES (16, 'ROI_00', 'Full image excluding sky (auto-calculated)', 0.2, true, 255, 255, 255, 7, '2025-06-02', 'skogaryd_SKC_MAD_FOR_PL02_PHE01_2023_152_20230601_070000.jpg', '[[0, 511], [3071, 511], [3071, 2047], [0, 2047]]', true);

-- ===========================================================================
-- SVB_MIR_TWR01_PHE01 (Svartberget Degerö Mire TWR01) - ID: 19
-- ===========================================================================
INSERT INTO instrument_rois (instrument_id, roi_name, description, alpha, auto_generated, color_r, color_g, color_b, thickness, generated_date, source_image, points_json, roi_processing_enabled)
VALUES (19, 'ROI_00', 'Full image excluding sky (auto-calculated)', 0.2, true, 255, 255, 255, 7, '2025-06-02', 'svartberget_SVB_MIR_PL01_PHE01_2022_152_20220601_000002.jpg', '[[0, 748], [3071, 748], [3071, 2047], [0, 2047]]', true);

-- ===========================================================================
-- SVB_MIR_TWR02_PHE01 (Svartberget Degerö Mire TWR02) - ID: 20
-- ===========================================================================
INSERT INTO instrument_rois (instrument_id, roi_name, alpha, color_r, color_g, color_b, thickness, points_json, roi_processing_enabled)
VALUES (20, 'ROI_01', 0.0, 0, 255, 0, 7, '[[100, 400], [280, 800], [1200, 800], [900, 350]]', true);

-- ===========================================================================
-- SVB_FOR_TWR01_PHE01 (Svartberget Forest TWR01 PHE01 - Inactive) - ID: 22
-- ===========================================================================
INSERT INTO instrument_rois (instrument_id, roi_name, description, alpha, auto_generated, color_r, color_g, color_b, thickness, generated_date, source_image, points_json, roi_processing_enabled)
VALUES (22, 'ROI_00', 'Full image excluding sky (auto-calculated)', 0.2, true, 255, 255, 255, 7, '2025-06-02', 'svartberget_SVB_FOR_PL01_PHE01_2022_152_20220601_060003.jpg', '[[0, 744], [3071, 744], [3071, 2047], [0, 2047]]', true);

INSERT INTO instrument_rois (instrument_id, roi_name, alpha, color_r, color_g, color_b, thickness, points_json, roi_processing_enabled)
VALUES (22, 'ROI_01', 0.0, 0, 255, 0, 7, '[[700, 2048], [300, 600], [3072, 600], [3072, 2048]]', true);

-- ===========================================================================
-- SVB_FOR_TWR01_PHE02 (Svartberget Forest TWR01 PHE02 - Active) - ID: 23
-- ===========================================================================
INSERT INTO instrument_rois (instrument_id, roi_name, description, alpha, auto_generated, color_r, color_g, color_b, thickness, generated_date, source_image, points_json, roi_processing_enabled)
VALUES (23, 'ROI_00', 'Full image excluding sky (auto-calculated)', 0.2, true, 255, 255, 255, 7, '2025-06-02', 'svartberget_SVB_FOR_PL01_PHE02_2025_051_20250220_100000.jpg', '[[0, 748], [3071, 748], [3071, 2047], [0, 2047]]', true);

INSERT INTO instrument_rois (instrument_id, roi_name, alpha, color_r, color_g, color_b, thickness, points_json, roi_processing_enabled)
VALUES (23, 'ROI_01', 0.0, 0, 255, 0, 7, '[[700, 2048], [300, 600], [3072, 600], [3072, 2048]]', true);

-- ===========================================================================
-- SVB_MIR_TWR03_PHE01 (Svartberget Degerö Mire TWR03) - ID: 21
-- Note: This instrument exists in DB but not in phenocams config
-- Adding ROI based on similar instruments
-- ===========================================================================
INSERT INTO instrument_rois (instrument_id, roi_name, alpha, color_r, color_g, color_b, thickness, points_json, roi_processing_enabled)
VALUES (21, 'ROI_01', 0.0, 0, 255, 0, 7, '[[450, 800], [1750, 870], [2750, 900], [2850, 2048], [400, 2048], [700, 1300], [700, 1100]]', true);
