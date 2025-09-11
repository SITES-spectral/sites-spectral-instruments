Generating test users SQL...
-- Test users for SITES Spectral authentication
-- Generated: 2025-09-11T09:50:13.857Z


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
-- Login: admin / admin123 (admin role)


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
-- Login: svartberget / svb123 (station role)
-- Station access: ID 6


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
-- Login: skogaryd / skc123 (station role)
-- Station access: ID 5


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
-- Login: lonnstorp / lon123 (station role)
-- Station access: ID 3


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
-- Login: readonly / readonly123 (readonly role)

-- Test users created successfully
-- Use these credentials to test the authentication system:
--
-- admin / admin123 - admin (All stations)
-- svartberget / svb123 - station (Station 6 only)
-- skogaryd / skc123 - station (Station 5 only)
-- lonnstorp / lon123 - station (Station 3 only)
-- readonly / readonly123 - readonly (Read-only access)
