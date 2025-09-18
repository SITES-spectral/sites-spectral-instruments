#!/usr/bin/env node
/**
 * Setup Station Secrets for Cloudflare Workers
 *
 * This script creates Cloudflare secrets for each station, allowing
 * station-based authentication using station names as user IDs.
 *
 * Updated to use station acronyms as station_id (text) instead of numeric IDs.
 * Station acronyms match the authoritative .secure/stations.yaml file.
 *
 * Usage:
 *   node scripts/setup-station-secrets.js
 *
 * Requirements:
 *   - wrangler CLI installed and configured
 *   - Access to the D1 database
 *   - Cloudflare API permissions for secrets management
 *
 * Changes in v4.2.1:
 *   - station_id now uses acronym text (ANS, ASA, etc.) instead of numeric IDs
 *   - Corrected Skogaryd acronym from SKG to SKC (matches YAML)
 *   - All acronyms verified against .secure/stations.yaml authoritative source
 */

const { execSync } = require('child_process');
const crypto = require('crypto');

// Station configurations with their authentication details
// Acronyms match .secure/stations.yaml authoritative source
const STATION_CONFIGS = [
    {
        station_id: 'ANS',
        name: 'Abisko',
        acronym: 'ANS',
        username: 'abisko',
        role: 'station'
    },
    {
        station_id: 'ASA',
        name: 'Asa',
        acronym: 'ASA',
        username: 'asa',
        role: 'station'
    },
    {
        station_id: 'BOL',
        name: 'Bolmen',
        acronym: 'BOL',
        username: 'bolmen',
        role: 'station'
    },
    {
        station_id: 'ERK',
        name: 'Erken',
        acronym: 'ERK',
        username: 'erken',
        role: 'station'
    },
    {
        station_id: 'GRI',
        name: 'Grimsö',
        acronym: 'GRI',
        username: 'grimso',
        role: 'station'
    },
    {
        station_id: 'LON',
        name: 'Lönnstorp',
        acronym: 'LON',
        username: 'lonnstorp',
        role: 'station'
    },
    {
        station_id: 'RBD',
        name: 'Röbäcksdalen',
        acronym: 'RBD',
        username: 'robacksdalen',
        role: 'station'
    },
    {
        station_id: 'SKC',
        name: 'Skogaryd',
        acronym: 'SKC',
        username: 'skogaryd',
        role: 'station'
    },
    {
        station_id: 'SVB',
        name: 'Svartberget',
        acronym: 'SVB',
        username: 'svartberget',
        role: 'station'
    }
];

// Admin user configuration
const ADMIN_CONFIG = {
    username: 'admin',
    role: 'admin',
    station_id: null
};

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
 * Execute wrangler command safely
 */
function execWrangler(command) {
    try {
        const result = execSync(`wrangler ${command}`, { 
            encoding: 'utf8',
            stdio: 'pipe'
        });
        return { success: true, output: result };
    } catch (error) {
        return { 
            success: false, 
            error: error.message,
            output: error.stdout || error.stderr 
        };
    }
}

/**
 * Set a Cloudflare secret
 */
function setSecret(name, value) {
    console.log(`Setting secret: ${name}`);
    
    try {
        // Use echo to pipe the value to wrangler secret put
        // Properly escape JSON for shell
        const jsonValue = typeof value === 'string' ? value : JSON.stringify(value);
        const escapedValue = jsonValue.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        const command = `echo "${escapedValue}" | wrangler secret put ${name}`;
        const result = execSync(command, { 
            encoding: 'utf8',
            stdio: 'pipe'
        });
        
        console.log(`✓ Secret ${name} set successfully`);
        return true;
    } catch (error) {
        console.error(`Failed to set secret ${name}:`, error.message);
        return false;
    }
}

/**
 * Generate JWT secret key
 */
function generateJWTSecret() {
    return crypto.randomBytes(64).toString('hex');
}

/**
 * Create user credentials object
 */
function createUserCredentials(config, password) {
    return {
        username: config.username,
        password: password,
        role: config.role,
        station_id: config.station_id || null,
        created_at: new Date().toISOString(),
        active: true
    };
}

/**
 * Main setup function
 */
async function setupStationSecrets() {
    console.log('🚀 Setting up station-based authentication secrets...\n');
    
    // Generate JWT secret
    const jwtSecret = generateJWTSecret();
    console.log('Generated JWT secret key');
    
    if (!setSecret('JWT_SECRET', jwtSecret)) {
        console.error('❌ Failed to set JWT secret. Aborting.');
        process.exit(1);
    }
    
    // Generate admin credentials
    const adminPassword = generateSecurePassword();
    const adminCredentials = createUserCredentials(ADMIN_CONFIG, adminPassword);
    
    console.log('\\n📋 Admin Credentials:');
    console.log(`Username: ${adminCredentials.username}`);
    console.log(`Password: ${adminPassword}`);
    console.log(`Role: ${adminCredentials.role}`);
    
    if (!setSecret('ADMIN_CREDENTIALS', JSON.stringify(adminCredentials))) {
        console.error('❌ Failed to set admin credentials. Aborting.');
        process.exit(1);
    }
    
    // Generate station credentials
    console.log('\\n🏢 Generating station credentials...');
    const stationCredentials = {};
    
    for (const station of STATION_CONFIGS) {
        const password = generateSecurePassword();
        const credentials = createUserCredentials(station, password);
        
        const secretName = `STATION_${station.username.toUpperCase()}_CREDENTIALS`;
        stationCredentials[station.username] = {
            ...credentials,
            password // Store password for display only
        };
        
        // Keep password in stored credentials for hashing in auth system
        if (!setSecret(secretName, JSON.stringify(credentials))) {
            console.error(`❌ Failed to set credentials for ${station.name}. Aborting.`);
            process.exit(1);
        }
        
        console.log(`✓ ${station.name} (${station.username}): ${password}`);
    }
    
    // Generate station passwords file
    const credentialsFile = {
        generated_at: new Date().toISOString(),
        jwt_secret: jwtSecret,
        admin: {
            username: adminCredentials.username,
            password: adminPassword,
            role: adminCredentials.role
        },
        stations: Object.fromEntries(
            Object.entries(stationCredentials).map(([username, creds]) => [
                username,
                {
                    username: creds.username,
                    password: creds.password,
                    role: creds.role,
                    station_id: creds.station_id
                }
            ])
        )
    };
    
    // Write credentials to secure file
    const fs = require('fs');
    const credentialsFilePath = './station-credentials-SECURE.json';
    
    try {
        fs.writeFileSync(
            credentialsFilePath, 
            JSON.stringify(credentialsFile, null, 2),
            { mode: 0o600 } // Read/write for owner only
        );
        
        console.log(`\\n🔐 Credentials saved to: ${credentialsFilePath}`);
        console.log('⚠️  This file contains sensitive information. Store it securely and delete after distribution.');
        
    } catch (error) {
        console.error('❌ Failed to write credentials file:', error.message);
    }
    
    console.log('\\n✅ Station secrets setup completed!');
    console.log('\\n📝 Next steps:');
    console.log('1. Deploy the updated worker: wrangler deploy');
    console.log('2. Distribute credentials to station managers securely');
    console.log('3. Update authentication system to use secrets');
    console.log('4. Delete the credentials file after distribution');
    
    console.log('\\n🔧 To update wrangler.toml with secret references:');
    console.log('[vars]');
    console.log('ENVIRONMENT = "production"');
    console.log('APP_NAME = "SITES Spectral Stations & Instruments"');
    console.log('APP_VERSION = "0.1.0-dev"');
    console.log('USE_CLOUDFLARE_SECRETS = "true"');
}

// Run the setup
if (require.main === module) {
    setupStationSecrets().catch(error => {
        console.error('❌ Setup failed:', error);
        process.exit(1);
    });
}

module.exports = { setupStationSecrets, STATION_CONFIGS, ADMIN_CONFIG };