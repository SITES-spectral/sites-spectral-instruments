#!/usr/bin/env node

/**
 * SITES Spectral Admin CRUD Operations Test Suite
 * Comprehensive testing of data hierarchy and geolocation rules
 */

// Import fetch for Node.js environments
const fetch = globalThis.fetch || (async () => {
    try {
        const { default: fetch } = await import('node-fetch');
        return fetch;
    } catch (error) {
        console.error('fetch is not available. Please install node-fetch or use Node.js 18+');
        process.exit(1);
    }
})();

const API_BASE = 'https://sites.jobelab.com/api';
const DASHBOARD_URL = 'https://sites.jobelab.com/dashboard.html';

class AdminCRUDTestSuite {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            warnings: 0,
            tests: []
        };
        this.authToken = null;
        this.testUser = null;
        this.createdEntities = {
            stations: [],
            platforms: [],
            instruments: []
        };
    }

    // Test result logging
    logTest(name, status, message, details = null) {
        const test = { name, status, message, details, timestamp: new Date().toISOString() };
        this.results.tests.push(test);

        if (status === 'PASS') {
            this.results.passed++;
            console.log(`✅ ${name}: ${message}`);
        } else if (status === 'FAIL') {
            this.results.failed++;
            console.log(`❌ ${name}: ${message}`);
            if (details) console.log(`   Details: ${JSON.stringify(details, null, 2)}`);
        } else if (status === 'WARN') {
            this.results.warnings++;
            console.log(`⚠️  ${name}: ${message}`);
        }
    }

    // Helper method for API requests
    async apiRequest(endpoint, options = {}) {
        const url = `${API_BASE}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` }),
            ...options.headers
        };

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            const contentType = response.headers.get('content-type');
            let data;

            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = { text: await response.text() };
            }

            return {
                ok: response.ok,
                status: response.status,
                data,
                headers: response.headers
            };
        } catch (error) {
            return {
                ok: false,
                status: 0,
                data: { error: error.message },
                headers: null
            };
        }
    }

    // ==================== AUTHENTICATION TESTS ====================

    async testAuthentication() {
        console.log('\n🔐 Testing Authentication...');

        // Test 1: Login without credentials
        let response = await this.apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({})
        });

        if (response.status === 400) {
            this.logTest('Auth-001', 'PASS', 'Properly rejects empty credentials');
        } else {
            this.logTest('Auth-001', 'FAIL', 'Should reject empty credentials', response.data);
        }

        // Test 2: Login with invalid credentials
        response = await this.apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                username: 'invalid_user',
                password: 'invalid_pass'
            })
        });

        if (response.status === 401) {
            this.logTest('Auth-002', 'PASS', 'Properly rejects invalid credentials');
        } else {
            this.logTest('Auth-002', 'FAIL', 'Should reject invalid credentials', response.data);
        }

        // Note: For live testing, admin credentials would need to be provided
        this.logTest('Auth-003', 'WARN', 'Admin login test skipped - requires real credentials');
    }

    // ==================== ROLE-BASED ACCESS CONTROL TESTS ====================

    async testRoleBasedAccess() {
        console.log('\n👥 Testing Role-Based Access Control...');

        // Test admin endpoint access without authentication
        let response = await this.apiRequest('/admin/stations', {
            method: 'GET'
        });

        if (response.status === 401) {
            this.logTest('RBAC-001', 'PASS', 'Admin endpoints require authentication');
        } else {
            this.logTest('RBAC-001', 'FAIL', 'Admin endpoints should require authentication', response.data);
        }

        // Test admin endpoint with invalid token
        response = await this.apiRequest('/admin/stations', {
            method: 'GET',
            headers: { 'Authorization': 'Bearer invalid_token' }
        });

        if (response.status === 401 || response.status === 403) {
            this.logTest('RBAC-002', 'PASS', 'Admin endpoints reject invalid tokens');
        } else {
            this.logTest('RBAC-002', 'FAIL', 'Admin endpoints should reject invalid tokens', response.data);
        }
    }

    // ==================== DATA HIERARCHY TESTS ====================

    async testDataHierarchy() {
        console.log('\n🏗️  Testing Data Hierarchy Rules...');

        // Test 1: Verify station → platform → instrument hierarchy in database
        let response = await this.apiRequest('/stations');

        if (response.ok) {
            const stations = response.data.stations || response.data;
            let hierarchyValid = true;
            let hierarchyDetails = [];

            for (const station of stations.slice(0, 3)) { // Test first 3 stations
                // Check platforms for this station
                const platformResponse = await this.apiRequest(`/platforms?station_id=${station.id}`);
                if (platformResponse.ok) {
                    const platforms = platformResponse.data.platforms || platformResponse.data;

                    for (const platform of platforms.slice(0, 2)) { // Test first 2 platforms
                        // Verify platform references station
                        if (platform.station_id !== station.id) {
                            hierarchyValid = false;
                            hierarchyDetails.push(`Platform ${platform.id} has incorrect station_id`);
                        }

                        // Check instruments for this platform
                        const instrumentResponse = await this.apiRequest(`/instruments?platform_id=${platform.id}`);
                        if (instrumentResponse.ok) {
                            const instruments = instrumentResponse.data.instruments || instrumentResponse.data;

                            for (const instrument of instruments) {
                                // Verify instrument references platform
                                if (instrument.platform_id !== platform.id) {
                                    hierarchyValid = false;
                                    hierarchyDetails.push(`Instrument ${instrument.id} has incorrect platform_id`);
                                }
                            }
                        }
                    }
                }
            }

            if (hierarchyValid) {
                this.logTest('Hierarchy-001', 'PASS', 'Data hierarchy properly maintained');
            } else {
                this.logTest('Hierarchy-001', 'FAIL', 'Data hierarchy violations found', hierarchyDetails);
            }
        } else {
            this.logTest('Hierarchy-001', 'FAIL', 'Could not fetch stations for hierarchy test', response.data);
        }
    }

    // ==================== GEOLOCATION INHERITANCE TESTS ====================

    async testGeolocationInheritance() {
        console.log('\n🌍 Testing Geolocation Inheritance Rules...');

        // Test coordinate inheritance from platforms to instruments
        let response = await this.apiRequest('/platforms');

        if (response.ok) {
            const platforms = response.data.platforms || response.data;
            let inheritanceValid = true;
            let inheritanceDetails = [];

            for (const platform of platforms.slice(0, 5)) { // Test first 5 platforms
                if (platform.latitude && platform.longitude) {
                    // Get instruments for this platform
                    const instrumentResponse = await this.apiRequest(`/instruments?platform_id=${platform.id}`);

                    if (instrumentResponse.ok) {
                        const instruments = instrumentResponse.data.instruments || instrumentResponse.data;

                        for (const instrument of instruments) {
                            // Check if instrument coordinates match platform coordinates
                            if (instrument.latitude !== platform.latitude || instrument.longitude !== platform.longitude) {
                                inheritanceValid = false;
                                inheritanceDetails.push({
                                    instrument_id: instrument.id,
                                    platform_id: platform.id,
                                    platform_coords: [platform.latitude, platform.longitude],
                                    instrument_coords: [instrument.latitude, instrument.longitude]
                                });
                            }
                        }
                    }
                }
            }

            if (inheritanceValid) {
                this.logTest('Geolocation-001', 'PASS', 'Instrument coordinates properly inherit from platforms');
            } else {
                this.logTest('Geolocation-001', 'FAIL', 'Geolocation inheritance violations found', inheritanceDetails);
            }
        } else {
            this.logTest('Geolocation-001', 'FAIL', 'Could not fetch platforms for geolocation test', response.data);
        }
    }

    // ==================== COORDINATE VALIDATION TESTS ====================

    async testCoordinateValidation() {
        console.log('\n📍 Testing Swedish Coordinate Validation...');

        // Test Swedish coordinate ranges (SWEREF 99)
        let response = await this.apiRequest('/stations');

        if (response.ok) {
            const stations = response.data.stations || response.data;
            let validCoordinates = true;
            let invalidCoords = [];

            for (const station of stations) {
                if (station.latitude && station.longitude) {
                    // Swedish latitude range: approximately 55-69°N
                    // Swedish longitude range: approximately 11-24°E
                    if (station.latitude < 55 || station.latitude > 69) {
                        validCoordinates = false;
                        invalidCoords.push(`Station ${station.acronym}: Invalid latitude ${station.latitude}`);
                    }
                    if (station.longitude < 11 || station.longitude > 24) {
                        validCoordinates = false;
                        invalidCoords.push(`Station ${station.acronym}: Invalid longitude ${station.longitude}`);
                    }
                }
            }

            if (validCoordinates) {
                this.logTest('Coordinates-001', 'PASS', 'All station coordinates within Swedish bounds');
            } else {
                this.logTest('Coordinates-001', 'FAIL', 'Invalid coordinates found', invalidCoords);
            }
        } else {
            this.logTest('Coordinates-001', 'FAIL', 'Could not fetch stations for coordinate validation', response.data);
        }
    }

    // ==================== ECOSYSTEM CODE VALIDATION ====================

    async testEcosystemCodes() {
        console.log('\n🌿 Testing Ecosystem Code Validation...');

        const validEcosystemCodes = [
            'HEA', 'AGR', 'MIR', 'LAK', 'WET', 'GRA',
            'FOR', 'ALP', 'CON', 'DEC', 'MAR', 'PEA'
        ];

        let response = await this.apiRequest('/instruments');

        if (response.ok) {
            const instruments = response.data.instruments || response.data;
            let validEcosystems = true;
            let invalidEcosystems = [];

            for (const instrument of instruments) {
                if (instrument.ecosystem_code && !validEcosystemCodes.includes(instrument.ecosystem_code)) {
                    validEcosystems = false;
                    invalidEcosystems.push(`Instrument ${instrument.id}: Invalid ecosystem code '${instrument.ecosystem_code}'`);
                }
            }

            if (validEcosystems) {
                this.logTest('Ecosystem-001', 'PASS', 'All ecosystem codes are valid');
            } else {
                this.logTest('Ecosystem-001', 'FAIL', 'Invalid ecosystem codes found', invalidEcosystems);
            }
        } else {
            this.logTest('Ecosystem-001', 'FAIL', 'Could not fetch instruments for ecosystem validation', response.data);
        }
    }

    // ==================== NORMALIZED NAMING TESTS ====================

    async testNormalizedNaming() {
        console.log('\n📝 Testing Normalized Naming Conventions...');

        // Test station normalized names
        let response = await this.apiRequest('/stations');

        if (response.ok) {
            const stations = response.data.stations || response.data;
            let validNaming = true;
            let namingIssues = [];

            for (const station of stations) {
                // Check if normalized name follows convention (lowercase, no special chars)
                if (station.normalized_name !== station.normalized_name.toLowerCase()) {
                    validNaming = false;
                    namingIssues.push(`Station ${station.acronym}: Normalized name not lowercase`);
                }

                if (!/^[a-z0-9_]+$/.test(station.normalized_name)) {
                    validNaming = false;
                    namingIssues.push(`Station ${station.acronym}: Normalized name contains invalid characters`);
                }
            }

            if (validNaming) {
                this.logTest('Naming-001', 'PASS', 'Station normalized names follow conventions');
            } else {
                this.logTest('Naming-001', 'FAIL', 'Naming convention violations found', namingIssues);
            }
        } else {
            this.logTest('Naming-001', 'FAIL', 'Could not fetch stations for naming validation', response.data);
        }

        // Test platform naming convention: {STATION}_{ECOSYSTEM}_{LOCATION}
        response = await this.apiRequest('/platforms');

        if (response.ok) {
            const platforms = response.data.platforms || response.data;
            let validPlatformNaming = true;
            let platformNamingIssues = [];

            for (const platform of platforms.slice(0, 10)) { // Test first 10 platforms
                if (platform.normalized_name) {
                    const parts = platform.normalized_name.split('_');
                    if (parts.length < 3) {
                        validPlatformNaming = false;
                        platformNamingIssues.push(`Platform ${platform.id}: Naming format should be STATION_ECOSYSTEM_LOCATION`);
                    }
                }
            }

            if (validPlatformNaming) {
                this.logTest('Naming-002', 'PASS', 'Platform normalized names follow conventions');
            } else {
                this.logTest('Naming-002', 'FAIL', 'Platform naming convention violations found', platformNamingIssues);
            }
        }
    }

    // ==================== API ENDPOINT SECURITY TESTS ====================

    async testAPIEndpointSecurity() {
        console.log('\n🔒 Testing API Endpoint Security...');

        const adminEndpoints = [
            '/admin/stations',
            '/admin/platforms',
            '/admin/instruments',
            '/admin/rois'
        ];

        const httpMethods = ['GET', 'POST', 'PUT', 'DELETE'];

        for (const endpoint of adminEndpoints) {
            for (const method of httpMethods) {
                const response = await this.apiRequest(endpoint, { method });

                if (response.status === 401 || response.status === 403) {
                    this.logTest(`Security-${endpoint}-${method}`, 'PASS', `${method} ${endpoint} properly protected`);
                } else if (response.status === 405) {
                    this.logTest(`Security-${endpoint}-${method}`, 'PASS', `${method} ${endpoint} method not allowed (expected)`);
                } else {
                    this.logTest(`Security-${endpoint}-${method}`, 'FAIL', `${method} ${endpoint} should be protected`, {
                        status: response.status,
                        data: response.data
                    });
                }
            }
        }
    }

    // ==================== DASHBOARD ACCESS TESTS ====================

    async testDashboardAccess() {
        console.log('\n📊 Testing Dashboard Access...');

        try {
            // Test dashboard page accessibility
            const response = await fetch(DASHBOARD_URL);

            if (response.ok) {
                const html = await response.text();

                // Check for admin-specific elements
                const hasAdminControls = html.includes('admin-only') || html.includes('Create Station');
                const hasAuthCheck = html.includes('authentication') || html.includes('token');

                if (hasAdminControls && hasAuthCheck) {
                    this.logTest('Dashboard-001', 'PASS', 'Dashboard has admin controls and authentication checks');
                } else {
                    this.logTest('Dashboard-001', 'WARN', 'Dashboard may be missing admin controls or auth checks');
                }

                // Check for version information
                const hasVersion = html.includes('app-version') || html.includes('4.9.');
                if (hasVersion) {
                    this.logTest('Dashboard-002', 'PASS', 'Dashboard includes version information');
                } else {
                    this.logTest('Dashboard-002', 'WARN', 'Dashboard missing version information');
                }

            } else {
                this.logTest('Dashboard-001', 'FAIL', `Dashboard not accessible: ${response.status}`, {
                    status: response.status,
                    url: DASHBOARD_URL
                });
            }
        } catch (error) {
            this.logTest('Dashboard-001', 'FAIL', `Dashboard access error: ${error.message}`);
        }
    }

    // ==================== MAIN TEST RUNNER ====================

    async runAllTests() {
        console.log('🧪 SITES Spectral Admin CRUD Test Suite');
        console.log('==========================================');
        console.log(`Testing against: ${API_BASE}`);
        console.log(`Dashboard URL: ${DASHBOARD_URL}`);
        console.log('');

        const startTime = Date.now();

        // Run all test categories
        await this.testAuthentication();
        await this.testRoleBasedAccess();
        await this.testDashboardAccess();
        await this.testDataHierarchy();
        await this.testGeolocationInheritance();
        await this.testCoordinateValidation();
        await this.testEcosystemCodes();
        await this.testNormalizedNaming();
        await this.testAPIEndpointSecurity();

        const duration = Date.now() - startTime;

        // Generate summary report
        console.log('\n📋 Test Summary');
        console.log('===============');
        console.log(`Total Tests: ${this.results.tests.length}`);
        console.log(`Passed: ${this.results.passed} ✅`);
        console.log(`Failed: ${this.results.failed} ❌`);
        console.log(`Warnings: ${this.results.warnings} ⚠️`);
        console.log(`Duration: ${duration}ms`);

        // Critical issues summary
        const criticalIssues = this.results.tests.filter(t => t.status === 'FAIL');
        if (criticalIssues.length > 0) {
            console.log('\n🚨 Critical Issues Found:');
            criticalIssues.forEach(issue => {
                console.log(`   - ${issue.name}: ${issue.message}`);
            });
        }

        // Security compliance summary
        const securityTests = this.results.tests.filter(t => t.name.startsWith('Security-') || t.name.startsWith('RBAC-'));
        const securityPassed = securityTests.filter(t => t.status === 'PASS').length;
        const securityTotal = securityTests.length;

        console.log(`\n🛡️  Security Compliance: ${securityPassed}/${securityTotal} (${Math.round(securityPassed/securityTotal*100)}%)`);

        // Hierarchy compliance summary
        const hierarchyTests = this.results.tests.filter(t => t.name.startsWith('Hierarchy-') || t.name.startsWith('Geolocation-'));
        const hierarchyPassed = hierarchyTests.filter(t => t.status === 'PASS').length;
        const hierarchyTotal = hierarchyTests.length;

        console.log(`🏗️  Hierarchy Compliance: ${hierarchyPassed}/${hierarchyTotal} (${Math.round(hierarchyPassed/hierarchyTotal*100)}%)`);

        return this.results;
    }
}

// Export for use as module or run directly
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminCRUDTestSuite;
} else if (typeof window === 'undefined') {
    // Running in Node.js
    const testSuite = new AdminCRUDTestSuite();
    testSuite.runAllTests().then(results => {
        process.exit(results.failed > 0 ? 1 : 0);
    });
}