// Create test users for SITES Spectral authentication system
import { hashPassword } from './src/auth.js';

// Test users configuration
const TEST_USERS = [
    {
        username: 'admin',
        email: 'admin@sites.se',
        password: 'admin123',
        role: 'admin',
        full_name: 'SITES System Administrator',
        organization: 'SITES Network',
        station_id: null // Admin can access all stations
    },
    {
        username: 'svartberget',
        email: 'svb@sites.se',
        password: 'svb123',
        role: 'station',
        full_name: 'Svartberget Station Manager',
        organization: 'Svartberget Field Research Station',
        station_id: 6 // Svartberget station ID
    },
    {
        username: 'skogaryd',
        email: 'skc@sites.se',
        password: 'skc123',
        role: 'station',
        full_name: 'Skogaryd Station Manager', 
        organization: 'Skogaryd Research Station',
        station_id: 5 // Skogaryd station ID
    },
    {
        username: 'lonnstorp',
        email: 'lon@sites.se',
        password: 'lon123',
        role: 'station',
        full_name: 'Lönnstorp Station Manager',
        organization: 'Lönnstorp Field Research Station', 
        station_id: 3 // Lönnstorp station ID
    },
    {
        username: 'readonly',
        email: 'readonly@sites.se',
        password: 'readonly123',
        role: 'readonly',
        full_name: 'Read-Only User',
        organization: 'SITES Network',
        station_id: null // Can view all stations
    }
];

// Function to generate SQL for test users
async function generateUserSQL() {
    console.log('Generating test users SQL...');
    console.log('-- Test users for SITES Spectral authentication');
    console.log('-- Generated:', new Date().toISOString());
    console.log('');
    
    for (const user of TEST_USERS) {
        const passwordHash = await hashPassword(user.password);
        
        const sql = `
INSERT INTO users (
    username, email, password_hash, role, station_id,
    full_name, organization, active
) VALUES (
    '${user.username}',
    '${user.email}',
    '${passwordHash}',
    '${user.role}',
    ${user.station_id || 'NULL'},
    '${user.full_name}',
    '${user.organization}',
    TRUE
);`;
        
        console.log(sql);
        
        // Also output login info for reference
        console.log(`-- Login: ${user.username} / ${user.password} (${user.role} role)`);
        if (user.station_id) {
            console.log(`-- Station access: ID ${user.station_id}`);
        }
        console.log('');
    }
    
    console.log('-- Test users created successfully');
    console.log('-- Use these credentials to test the authentication system:');
    console.log('--');
    
    TEST_USERS.forEach(user => {
        const access = user.role === 'admin' ? 'All stations' : 
                      user.role === 'station' ? `Station ${user.station_id} only` :
                      'Read-only access';
        console.log(`-- ${user.username} / ${user.password} - ${user.role} (${access})`);
    });
}

// Execute the function
generateUserSQL().catch(console.error);