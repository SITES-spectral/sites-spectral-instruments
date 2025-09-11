-- Simple instrument-platform linking for testing
-- Link the few instruments we can confidently map to official platforms

-- Abisko: ANS_FOR_BL01_PHE01 -> P_RTBH_1 (Platform ID 1)
UPDATE phenocams 
SET platform_id = 1 
WHERE canonical_id = 'ANS_FOR_BL01_PHE01' 
AND station_id = 1;

-- Grimsö: GRI_FOR_BL01_PHE01 -> P_GRI_FOR_1 (Platform ID 3)
UPDATE phenocams 
SET platform_id = 3 
WHERE canonical_id = 'GRI_FOR_BL01_PHE01' 
AND station_id = 2;

-- Lönnstorp: Link the three instruments to the three platforms
UPDATE phenocams 
SET platform_id = 4 
WHERE canonical_id = 'LON_AGR_PL01_PHE01' 
AND station_id = 3;

UPDATE phenocams 
SET platform_id = 5 
WHERE canonical_id = 'LON_AGR_PL01_PHE02' 
AND station_id = 3;

UPDATE phenocams 
SET platform_id = 6 
WHERE canonical_id = 'LON_AGR_PL01_PHE03' 
AND station_id = 3;