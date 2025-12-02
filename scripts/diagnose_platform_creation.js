/**
 * SITES Spectral Platform Creation Diagnostic Script
 *
 * Run this in the browser console on station-dashboard.html to diagnose
 * why platform creation controls are not showing for admin users.
 *
 * Usage:
 *   1. Open station-dashboard.html in browser
 *   2. Press F12 to open DevTools console
 *   3. Copy and paste this entire script
 *   4. Press Enter to run
 *   5. Review the diagnostic output
 */

(function() {
    console.log('='.repeat(60));
    console.log('SITES Spectral Platform Creation Diagnostics');
    console.log('='.repeat(60));
    console.log('\n');

    // Test 1: Check localStorage
    console.log('1. CHECKING LOCALSTORAGE');
    console.log('-'.repeat(40));

    const token = localStorage.getItem('sites_spectral_token');
    const userJson = localStorage.getItem('sites_spectral_user');

    console.log('Token exists:', !!token);
    console.log('Token value:', token ? token.substring(0, 20) + '...' : 'NULL');

    console.log('User JSON exists:', !!userJson);
    console.log('User JSON:', userJson);

    let parsedUser = null;
    try {
        parsedUser = userJson ? JSON.parse(userJson) : null;
        console.log('Parsed user successfully:', parsedUser);
    } catch (e) {
        console.error('ERROR: Failed to parse user JSON:', e);
    }

    console.log('\n');

    // Test 2: Check API Instance
    console.log('2. CHECKING API INSTANCE');
    console.log('-'.repeat(40));

    console.log('window.sitesAPI exists:', !!window.sitesAPI);

    if (window.sitesAPI) {
        console.log('sitesAPI.getUser() method exists:', typeof window.sitesAPI.getUser === 'function');

        if (typeof window.sitesAPI.getUser === 'function') {
            const apiUser = window.sitesAPI.getUser();
            console.log('sitesAPI.getUser() result:', apiUser);

            if (apiUser) {
                console.log('  - username:', apiUser.username);
                console.log('  - role:', apiUser.role);
                console.log('  - station_id:', apiUser.station_id);
                console.log('  - station_acronym:', apiUser.station_acronym);
            }
        }

        console.log('sitesAPI.isAuthenticated():', window.sitesAPI.isAuthenticated());
        console.log('sitesAPI.isAdmin():', window.sitesAPI.isAdmin());
    } else {
        console.error('ERROR: window.sitesAPI is not defined');
    }

    console.log('\n');

    // Test 3: Check Dashboard Instance
    console.log('3. CHECKING DASHBOARD INSTANCE');
    console.log('-'.repeat(40));

    console.log('window.sitesStationDashboard exists:', !!window.sitesStationDashboard);

    if (window.sitesStationDashboard) {
        console.log('Dashboard currentUser:', window.sitesStationDashboard.currentUser);
        console.log('Dashboard stationData:', window.sitesStationDashboard.stationData);
        console.log('Dashboard canEdit:', window.sitesStationDashboard.canEdit);

        if (window.sitesStationDashboard.stationData) {
            console.log('  - station id:', window.sitesStationDashboard.stationData.id);
            console.log('  - station acronym:', window.sitesStationDashboard.stationData.acronym);
            console.log('  - station name:', window.sitesStationDashboard.stationData.display_name);
        }
    } else {
        console.error('ERROR: window.sitesStationDashboard is not defined');
    }

    console.log('\n');

    // Test 4: Check Global Variables
    console.log('4. CHECKING GLOBAL VARIABLES');
    console.log('-'.repeat(40));

    console.log('currentUser (global) exists:', typeof currentUser !== 'undefined');
    if (typeof currentUser !== 'undefined') {
        console.log('currentUser value:', currentUser);
        if (currentUser) {
            console.log('  - role:', currentUser.role);
            console.log('  - username:', currentUser.username);
        }
    }

    console.log('stationData (global) exists:', typeof stationData !== 'undefined');
    if (typeof stationData !== 'undefined') {
        console.log('stationData value:', stationData);
        if (stationData) {
            console.log('  - id:', stationData.id);
            console.log('  - acronym:', stationData.acronym);
        }
    }

    console.log('\n');

    // Test 5: Check DOM Elements
    console.log('5. CHECKING DOM ELEMENTS');
    console.log('-'.repeat(40));

    const controlsElement = document.getElementById('admin-platform-controls');
    console.log('admin-platform-controls exists:', !!controlsElement);

    if (controlsElement) {
        console.log('  - display style:', controlsElement.style.display);
        console.log('  - computed display:', window.getComputedStyle(controlsElement).display);
        console.log('  - visibility:', window.getComputedStyle(controlsElement).visibility);
        console.log('  - opacity:', window.getComputedStyle(controlsElement).opacity);
        console.log('  - offsetParent:', controlsElement.offsetParent);
        console.log('  - clientWidth:', controlsElement.clientWidth);
        console.log('  - clientHeight:', controlsElement.clientHeight);

        const button = controlsElement.querySelector('button');
        if (button) {
            console.log('  - button exists: true');
            console.log('  - button text:', button.textContent.trim());
            console.log('  - button onclick:', button.getAttribute('onclick'));
        } else {
            console.error('  - ERROR: No button found inside controls');
        }
    } else {
        console.error('ERROR: admin-platform-controls element not found');
    }

    console.log('\n');

    // Test 6: Evaluate Permission Logic
    console.log('6. EVALUATING PERMISSION LOGIC');
    console.log('-'.repeat(40));

    let checkUser = null;
    let checkStationData = null;

    // Try to get user from multiple sources
    if (typeof currentUser !== 'undefined' && currentUser) {
        checkUser = currentUser;
        console.log('Using currentUser (global)');
    } else if (window.sitesStationDashboard?.currentUser) {
        checkUser = window.sitesStationDashboard.currentUser;
        console.log('Using sitesStationDashboard.currentUser');
    } else if (window.sitesAPI?.getUser) {
        checkUser = window.sitesAPI.getUser();
        console.log('Using sitesAPI.getUser()');
    }

    // Try to get station data from multiple sources
    if (typeof stationData !== 'undefined' && stationData) {
        checkStationData = stationData;
        console.log('Using stationData (global)');
    } else if (window.sitesStationDashboard?.stationData) {
        checkStationData = window.sitesStationDashboard.stationData;
        console.log('Using sitesStationDashboard.stationData');
    }

    console.log('\nPermission check values:');
    console.log('  - checkUser:', checkUser);
    console.log('  - checkUser.role:', checkUser?.role);
    console.log('  - checkStationData:', checkStationData);
    console.log('  - checkStationData.id:', checkStationData?.id);

    // Evaluate the condition from line 4483
    const hasUser = !!checkUser;
    const isAdminOrStation = checkUser && (checkUser.role === 'admin' || checkUser.role === 'station');
    const hasStationData = !!checkStationData;
    const hasStationId = checkStationData && !!checkStationData.id;

    console.log('\nCondition evaluation:');
    console.log('  - currentUser exists:', hasUser);
    console.log('  - role is admin or station:', isAdminOrStation);
    console.log('  - stationData exists:', hasStationData);
    console.log('  - stationData.id exists:', hasStationId);

    const shouldShow = hasUser && isAdminOrStation && hasStationData && hasStationId;
    console.log('\n  >> SHOULD SHOW CONTROLS:', shouldShow);

    console.log('\n');

    // Test 7: Test Button Functionality
    console.log('7. TESTING BUTTON FUNCTIONALITY');
    console.log('-'.repeat(40));

    if (typeof handleCreatePlatformClick === 'function') {
        console.log('handleCreatePlatformClick() function exists: true');
        console.log('Function source (first 200 chars):');
        console.log(handleCreatePlatformClick.toString().substring(0, 200) + '...');
    } else {
        console.error('ERROR: handleCreatePlatformClick() function not found');
    }

    if (typeof openCreatePlatformForm === 'function') {
        console.log('openCreatePlatformForm() function exists: true');
    } else {
        console.error('ERROR: openCreatePlatformForm() function not found');
    }

    console.log('\n');

    // Summary and Recommendations
    console.log('8. SUMMARY AND RECOMMENDATIONS');
    console.log('='.repeat(60));

    const issues = [];
    const warnings = [];

    if (!token) {
        issues.push('CRITICAL: No authentication token found');
    }

    if (!parsedUser) {
        issues.push('CRITICAL: User data not found or malformed in localStorage');
    }

    if (!window.sitesAPI) {
        issues.push('CRITICAL: sitesAPI not initialized');
    }

    if (!window.sitesStationDashboard) {
        warnings.push('WARNING: sitesStationDashboard not initialized');
    }

    if (checkUser && checkUser.role !== 'admin' && checkUser.role !== 'station') {
        issues.push(`PERMISSION ISSUE: User role is "${checkUser.role}" (need admin or station)`);
    }

    if (!checkStationData || !checkStationData.id) {
        issues.push('DATA ISSUE: Station data not loaded or missing id');
    }

    if (controlsElement && controlsElement.style.display === 'none' && shouldShow) {
        issues.push('UI ISSUE: Controls should be visible but are hidden');
    }

    if (issues.length === 0 && warnings.length === 0) {
        console.log('%c✓ NO ISSUES FOUND', 'color: green; font-weight: bold; font-size: 14px');
        console.log('\nEverything looks correct. If controls are still not showing,');
        console.log('check for CSS conflicts or JavaScript errors in the console.');
    } else {
        if (issues.length > 0) {
            console.log('%c✗ ISSUES FOUND:', 'color: red; font-weight: bold; font-size: 14px');
            issues.forEach((issue, i) => {
                console.log(`  ${i + 1}. ${issue}`);
            });
        }

        if (warnings.length > 0) {
            console.log('\n%c⚠ WARNINGS:', 'color: orange; font-weight: bold; font-size: 14px');
            warnings.forEach((warning, i) => {
                console.log(`  ${i + 1}. ${warning}`);
            });
        }

        console.log('\n%cRECOMMENDED ACTIONS:', 'font-weight: bold; font-size: 12px');

        if (!token || !parsedUser) {
            console.log('  → Log out and log back in to refresh authentication');
        }

        if (!checkStationData || !checkStationData.id) {
            console.log('  → Refresh the page to reload station data');
            console.log('  → Check browser console for loading errors');
        }

        if (controlsElement && controlsElement.style.display === 'none' && shouldShow) {
            console.log('  → Run this to force show controls:');
            console.log('     document.getElementById("admin-platform-controls").style.display = "block"');
        }
    }

    console.log('\n');
    console.log('='.repeat(60));
    console.log('Diagnostic Complete');
    console.log('='.repeat(60));

    // Return diagnostic data for further inspection
    return {
        localStorage: {
            hasToken: !!token,
            hasUser: !!userJson,
            parsedUser: parsedUser
        },
        api: {
            exists: !!window.sitesAPI,
            user: window.sitesAPI?.getUser(),
            isAuthenticated: window.sitesAPI?.isAuthenticated(),
            isAdmin: window.sitesAPI?.isAdmin()
        },
        dashboard: {
            exists: !!window.sitesStationDashboard,
            currentUser: window.sitesStationDashboard?.currentUser,
            stationData: window.sitesStationDashboard?.stationData,
            canEdit: window.sitesStationDashboard?.canEdit
        },
        permissions: {
            hasUser,
            isAdminOrStation,
            hasStationData,
            hasStationId,
            shouldShowControls: shouldShow
        },
        dom: {
            controlsExist: !!controlsElement,
            controlsDisplay: controlsElement?.style.display,
            controlsComputedDisplay: controlsElement ? window.getComputedStyle(controlsElement).display : null
        },
        issues,
        warnings
    };
})();
