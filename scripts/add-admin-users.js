#!/usr/bin/env node
/**
 * Add Admin Users for SITES Spectral
 *
 * Creates:
 * - sites-admin: Global admin with full access
 * - {station}-admin: Station-specific admin for each station
 *
 * Usage:
 *   node scripts/add-admin-users.js
 *
 * Version: 11.0.0-alpha.11
 */

const { execSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Station configurations
const STATIONS = [
    { acronym: 'ANS', name: 'Abisko', username: 'abisko' },
    { acronym: 'ASA', name: 'Asa', username: 'asa' },
    { acronym: 'BOL', name: 'Bolmen', username: 'bolmen' },
    { acronym: 'ERK', name: 'Erken', username: 'erken' },
    { acronym: 'GRI', name: 'Grimsö', username: 'grimso' },
    { acronym: 'LON', name: 'Lönnstorp', username: 'lonnstorp' },
    { acronym: 'RBD', name: 'Röbäcksdalen', username: 'robacksdalen' },
    { acronym: 'SKC', name: 'Skogaryd', username: 'skogaryd' },
    { acronym: 'SVB', name: 'Svartberget', username: 'svartberget' }
];

/**
 * Generate a secure random password (avoiding problematic JSON characters)
 */
function generateSecurePassword(length = 24) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from(crypto.randomBytes(length))
        .map(byte => charset[byte % charset.length])
        .join('');
}

/**
 * Set a Cloudflare secret
 */
function setSecret(name, value) {
    console.log(`Setting secret: ${name}`);

    try {
        const jsonValue = typeof value === 'string' ? value : JSON.stringify(value);
        const escapedValue = jsonValue.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        const command = `echo "${escapedValue}" | npx wrangler secret put ${name}`;
        execSync(command, {
            encoding: 'utf8',
            stdio: 'pipe'
        });

        console.log(`  ✓ Secret ${name} set successfully`);
        return true;
    } catch (error) {
        console.error(`  ✗ Failed to set secret ${name}:`, error.message);
        return false;
    }
}

/**
 * Main function
 */
async function addAdminUsers() {
    console.log('🚀 Adding new admin users to SITES Spectral...\n');

    const newCredentials = {
        generated_at: new Date().toISOString(),
        sites_admin: null,
        station_admins: {}
    };

    // 1. Create sites-admin (global admin)
    console.log('📋 Creating sites-admin (global admin)...');
    const sitesAdminPassword = generateSecurePassword();
    const sitesAdminCreds = {
        username: 'sites-admin',
        password: sitesAdminPassword,
        role: 'admin',
        station_id: null,
        edit_privileges: true,
        permissions: ['read', 'write', 'edit', 'delete', 'admin'],
        created_at: new Date().toISOString(),
        active: true
    };

    if (setSecret('SITES_ADMIN_CREDENTIALS', JSON.stringify(sitesAdminCreds))) {
        newCredentials.sites_admin = {
            username: 'sites-admin',
            password: sitesAdminPassword,
            role: 'admin'
        };
        console.log(`  Username: sites-admin`);
        console.log(`  Password: ${sitesAdminPassword}`);
    } else {
        console.error('❌ Failed to create sites-admin. Continuing...');
    }

    // 2. Create station-admin users
    console.log('\n📋 Creating station admin users...');

    for (const station of STATIONS) {
        const adminUsername = `${station.username}-admin`;
        const adminPassword = generateSecurePassword();

        const stationAdminCreds = {
            username: adminUsername,
            password: adminPassword,
            role: 'station-admin',
            station_id: station.acronym,
            edit_privileges: true,
            permissions: ['read', 'write', 'edit', 'delete'],
            created_at: new Date().toISOString(),
            active: true
        };

        const secretName = `STATION_${station.username.toUpperCase()}_ADMIN_CREDENTIALS`;

        if (setSecret(secretName, JSON.stringify(stationAdminCreds))) {
            newCredentials.station_admins[adminUsername] = {
                username: adminUsername,
                password: adminPassword,
                role: 'station-admin',
                station_id: station.acronym,
                station_name: station.name
            };
            console.log(`  ${station.name}: ${adminUsername} / ${adminPassword}`);
        } else {
            console.error(`  ✗ Failed to create ${adminUsername}`);
        }
    }

    // 3. Save credentials to secure file
    const credentialsFilePath = path.join(__dirname, '..', 'admin-credentials-SECURE.json');

    try {
        fs.writeFileSync(
            credentialsFilePath,
            JSON.stringify(newCredentials, null, 2),
            { mode: 0o600 }
        );
        console.log(`\n🔐 New credentials saved to: admin-credentials-SECURE.json`);
    } catch (error) {
        console.error('❌ Failed to write credentials file:', error.message);
    }

    // 4. Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ Admin users created successfully!');
    console.log('='.repeat(60));
    console.log('\n📝 New Users Summary:');
    console.log('─'.repeat(60));
    console.log(`  sites-admin          | admin        | All stations`);
    for (const station of STATIONS) {
        const adminUsername = `${station.username}-admin`;
        console.log(`  ${adminUsername.padEnd(20)} | station-admin | ${station.acronym} only`);
    }
    console.log('─'.repeat(60));

    console.log('\n⚠️  IMPORTANT: Update src/auth/authentication.js to recognize new user types!');
    console.log('⚠️  Store admin-credentials-SECURE.json safely and delete after distribution.');
    console.log('\n🚀 Next steps:');
    console.log('  1. Update authentication module (src/auth/authentication.js)');
    console.log('  2. Deploy: npm run deploy');
    console.log('  3. Test login for new users');
    console.log('  4. Distribute credentials securely');
}

// Run
addAdminUsers().catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
});
