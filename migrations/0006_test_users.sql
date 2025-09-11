-- Test users for SITES Spectral authentication system
-- Generated: 2025-09-11

INSERT INTO users (
    username, email, password_hash, role, station_id,
    full_name, organization, active
) VALUES (
    'admin',
    'admin@sites.se',
    '040b3665291e70b752cdde6b4c6dd6bfc2fe0cebf9c9a09a101d277d9edacbb9',
    'admin',
    NULL,
    'SITES System Administrator',
    'SITES Network',
    TRUE
);

INSERT INTO users (
    username, email, password_hash, role, station_id,
    full_name, organization, active
) VALUES (
    'svartberget',
    'svb@sites.se',
    'da3ca3f7fba1ec47afe768507f80228a4b8386ec593c2f131e1d6966911d7a6d',
    'station',
    6,
    'Svartberget Station Manager',
    'Svartberget Field Research Station',
    TRUE
);

INSERT INTO users (
    username, email, password_hash, role, station_id,
    full_name, organization, active
) VALUES (
    'skogaryd',
    'skc@sites.se',
    '76e8eee48fd2568c78bce52d5491bfdbb8f72b21eaedc4507a99291e9e04d137',
    'station',
    5,
    'Skogaryd Station Manager',
    'Skogaryd Research Station',
    TRUE
);

INSERT INTO users (
    username, email, password_hash, role, station_id,
    full_name, organization, active
) VALUES (
    'lonnstorp',
    'lon@sites.se',
    '5e3124cbe2c22028900ea9149e66ad386ffe2ea4762589cf2728cc02c1c58668',
    'station',
    3,
    'Lönnstorp Station Manager',
    'Lönnstorp Field Research Station',
    TRUE
);

INSERT INTO users (
    username, email, password_hash, role, station_id,
    full_name, organization, active
) VALUES (
    'readonly',
    'readonly@sites.se',
    'ef6828bfd828f1ceacecfd13f88c264f42991a1aeaf2de035d3b5a8f4753ef69',
    'readonly',
    NULL,
    'Read-Only User',
    'SITES Network',
    TRUE
);

-- Test user credentials:
-- admin / admin123 - Full system administrator access
-- svartberget / svb123 - Svartberget station manager
-- skogaryd / skc123 - Skogaryd station manager  
-- lonnstorp / lon123 - Lönnstorp station manager
-- readonly / readonly123 - Read-only system access