/**
 * Platform Form Generators - Following SOLID and Hexagonal Architecture
 *
 * Each platform type has its own dedicated form generator and save function.
 * This ensures clear separation of concerns and prevents type confusion.
 *
 * @module platform-forms
 * @version 9.0.27
 */

(function(global) {
    'use strict';

    // ========================================
    // Platform Form Configuration
    // ========================================

    const PLATFORM_CONFIG = {
        fixed: {
            icon: 'fa-tower-observation',
            label: 'Fixed Platform',
            color: '#2563eb',
            namingPattern: '{STATION}_{ECOSYSTEM}_{LOCATION}',
            example: 'SVB_FOR_PL01'
        },
        uav: {
            icon: 'fa-crosshairs',
            label: 'UAV / Drone',
            color: '#059669',
            namingPattern: '{STATION}_{VENDOR}_{MODEL}_{LOCATION}',
            example: 'SVB_DJI_M3M_UAV01'
        },
        satellite: {
            icon: 'fa-satellite',
            label: 'Satellite Platform',
            color: '#7c3aed',
            namingPattern: '{STATION}_{AGENCY}_{SATELLITE}_{SENSOR}',
            example: 'SVB_ESA_S2A_MSI'
        },
        mobile: {
            icon: 'fa-truck',
            label: 'Mobile Platform',
            color: '#f59e0b',
            namingPattern: '{STATION}_{ECOSYSTEM}_{CARRIER}_{LOCATION}',
            example: 'SVB_FOR_BPK_MOB01'
        },
        usv: {
            icon: 'fa-ship',
            label: 'USV Platform',
            color: '#06b6d4',
            namingPattern: '{STATION}_{ECOSYSTEM}_{LOCATION}',
            example: 'ANS_LAK_USV01'
        },
        uuv: {
            icon: 'fa-water',
            label: 'UUV Platform',
            color: '#0891b2',
            namingPattern: '{STATION}_{ECOSYSTEM}_{LOCATION}',
            example: 'ANS_LAK_UUV01'
        }
    };

    // ========================================
    // Utility Functions
    // ========================================

    /**
     * Escape HTML - delegates to centralized security module (v12.0.9)
     */
    function escapeHtml(text) {
        // Use global escapeHtml from core/security.js if available
        if (typeof window.SitesSecurity !== 'undefined') {
            return window.SitesSecurity.escapeHtml(text);
        }
        // Fallback for backwards compatibility
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function getStationAcronym() {
        const station = window.sitesStationDashboard?.stationData || window.stationData;
        return station?.acronym || null;
    }

    function showNotification(message, type) {
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
        } else {
            console.log(`[${type}] ${message}`);
        }
    }

    // ========================================
    // Common Form Sections
    // ========================================

    function generateLocationSection() {
        return `
            <div class="form-section">
                <h4><i class="fas fa-map-marker-alt"></i> Base Location</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label for="platform-latitude">Latitude</label>
                        <input type="number" id="platform-latitude" class="form-input" step="any"
                               placeholder="Decimal degrees" min="-90" max="90">
                        <small class="form-text">Rounded to 6 decimals before saving</small>
                    </div>
                    <div class="form-group">
                        <label for="platform-longitude">Longitude</label>
                        <input type="number" id="platform-longitude" class="form-input" step="any"
                               placeholder="Decimal degrees" min="-180" max="180">
                        <small class="form-text">Rounded to 6 decimals before saving</small>
                    </div>
                </div>
                <div class="form-group">
                    <label for="platform-deployment-date">Deployment Date</label>
                    <input type="date" id="platform-deployment-date" class="form-input">
                </div>
            </div>
        `;
    }

    function generateDescriptionSection() {
        return `
            <div class="form-section">
                <h4><i class="fas fa-align-left"></i> Description</h4>
                <div class="form-group">
                    <label for="platform-description">Description</label>
                    <textarea id="platform-description" class="form-input" rows="3"
                              placeholder="Optional description of the platform"></textarea>
                </div>
            </div>
        `;
    }

    function generateStatusField() {
        return `
            <div class="form-group">
                <label for="platform-status">Status</label>
                <select id="platform-status" class="form-input">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Planned">Planned</option>
                    <option value="Testing">Testing</option>
                    <option value="Decommissioned">Decommissioned</option>
                </select>
            </div>
        `;
    }

    function generateFormActions(platformType) {
        return `
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="PlatformForms.closeModal()">Cancel</button>
                <button type="button" class="btn btn-primary save-btn" onclick="PlatformForms.save('${platformType}')">
                    <i class="fas fa-save"></i> Create Platform
                </button>
            </div>
        `;
    }

    // ========================================
    // FIXED Platform Form Generator
    // ========================================

    function generateFixedPlatformForm(stationId) {
        const config = PLATFORM_CONFIG.fixed;
        const stationAcronym = getStationAcronym();

        return `
            <div class="form-section">
                <h4><i class="fas fa-info-circle"></i> Basic Information</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label for="platform-display-name">Display Name *</label>
                        <input type="text" id="platform-display-name" class="form-input" required
                               placeholder="e.g., Forest Tower Platform 01"
                               oninput="PlatformForms.updateNormalizedName('fixed')">
                    </div>
                    <div class="form-group">
                        <label for="platform-location-code">Location Code *</label>
                        <input type="text" id="platform-location-code" class="form-input" required
                               placeholder="e.g., PL01, BL01" style="text-transform: uppercase;"
                               oninput="PlatformForms.updateNormalizedName('fixed')">
                        <small>Unique code within station (e.g., PL01, BL01)</small>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="platform-ecosystem-code">Ecosystem Code *</label>
                        <select id="platform-ecosystem-code" class="form-input" onchange="PlatformForms.updateNormalizedName('fixed')">
                            <option value="FOR">FOR - Forest</option>
                            <option value="AGR">AGR - Agricultural</option>
                            <option value="MIR">MIR - Mires</option>
                            <option value="LAK">LAK - Lake</option>
                            <option value="WET">WET - Wetland</option>
                            <option value="GRA">GRA - Grassland</option>
                            <option value="HEA">HEA - Heathland</option>
                            <option value="ALP">ALP - Alpine</option>
                            <option value="GEN">GEN - General</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Platform Type</label>
                        <div class="form-input" style="background: #f3f4f6; cursor: not-allowed; display: flex; align-items: center; gap: 8px;">
                            <i class="fas ${config.icon}" style="color: ${config.color};"></i>
                            <span>${config.label}</span>
                            <span style="margin-left: auto; font-size: 0.75rem; color: #6b7280;">(locked)</span>
                        </div>
                    </div>
                </div>
                <div class="form-row">
                    ${generateStatusField()}
                </div>
                <div class="form-group">
                    <label for="platform-normalized-name">Normalized Name *</label>
                    <input type="text" id="platform-normalized-name" class="form-input" required readonly
                           style="background: #f9fafb;">
                    <small>Auto-generated: ${config.namingPattern} (e.g., ${config.example})</small>
                </div>
            </div>

            <div class="form-section">
                <h4><i class="fas fa-cogs"></i> Technical Specifications</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label for="platform-mounting-structure">Mounting Structure</label>
                        <select id="platform-mounting-structure" class="form-input">
                            <option value="">Select mounting structure</option>
                            <option value="Tower">Tower</option>
                            <option value="Mast">Mast</option>
                            <option value="Building RoofTop">Building RoofTop</option>
                            <option value="Building Wall">Building Wall</option>
                            <option value="Pole">Pole</option>
                            <option value="Tripod">Tripod</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="platform-height">Platform Height (m)</label>
                        <input type="number" id="platform-height" class="form-input" step="0.1"
                               placeholder="Height above ground">
                    </div>
                </div>
            </div>

            ${generateLocationSection()}
            ${generateDescriptionSection()}

            <input type="hidden" id="platform-station-id" value="${stationId}">
            <input type="hidden" id="platform-type" value="fixed">

            ${generateFormActions('fixed')}
        `;
    }

    // ========================================
    // UAV Platform Form Generator
    // ========================================

    function generateUAVPlatformForm(stationId) {
        const config = PLATFORM_CONFIG.uav;
        const stationAcronym = getStationAcronym();

        return `
            <div class="form-section">
                <h4><i class="fas fa-info-circle"></i> Basic Information</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label for="platform-display-name">Display Name *</label>
                        <input type="text" id="platform-display-name" class="form-input" required
                               placeholder="e.g., Mavic 3 Multispectral Unit 01"
                               oninput="PlatformForms.updateNormalizedName('uav')">
                    </div>
                    <div class="form-group">
                        <label for="platform-location-code">UAV Number *</label>
                        <input type="text" id="platform-location-code" class="form-input" required
                               placeholder="e.g., UAV01, UAV02" style="text-transform: uppercase;"
                               oninput="PlatformForms.updateNormalizedName('uav')">
                        <small>Unique identifier (e.g., UAV01, UAV02)</small>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Platform Type</label>
                        <div class="form-input" style="background: #f3f4f6; cursor: not-allowed; display: flex; align-items: center; gap: 8px;">
                            <i class="fas ${config.icon}" style="color: ${config.color};"></i>
                            <span>${config.label}</span>
                            <span style="margin-left: auto; font-size: 0.75rem; color: #6b7280;">(locked)</span>
                        </div>
                    </div>
                    ${generateStatusField()}
                </div>
            </div>

            <div class="form-section">
                <h4><i class="fas fa-helicopter"></i> UAV Specifications</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label for="platform-drone-vendor">Drone Vendor *</label>
                        <select id="platform-drone-vendor" class="form-input" onchange="PlatformForms.updateDroneModels(); PlatformForms.updateNormalizedName('uav')">
                            <option value="DJI">DJI - Da-Jiang Innovations</option>
                            <option value="PARROT">PARROT - Parrot SA</option>
                            <option value="AUTEL">AUTEL - Autel Robotics</option>
                            <option value="SENSEFLY">SENSEFLY - senseFly / AgEagle</option>
                            <option value="MICASENSE">MICASENSE - MicaSense</option>
                            <option value="HEADWALL">HEADWALL - Headwall Photonics</option>
                            <option value="OTHER">OTHER - Other Vendor</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="platform-drone-model">Drone Model *</label>
                        <select id="platform-drone-model" class="form-input" onchange="PlatformForms.updateNormalizedName('uav')">
                            <optgroup label="DJI Multispectral">
                                <option value="M3M">M3M - Mavic 3 Multispectral</option>
                                <option value="P4M">P4M - Phantom 4 Multispectral</option>
                            </optgroup>
                            <optgroup label="DJI Enterprise">
                                <option value="M30T">M30T - Matrice 30T</option>
                                <option value="M300">M300 - Matrice 300 RTK</option>
                                <option value="M350">M350 - Matrice 350 RTK</option>
                            </optgroup>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label for="platform-normalized-name">Normalized Name *</label>
                    <input type="text" id="platform-normalized-name" class="form-input" required readonly
                           style="background: #f9fafb;">
                    <small>Auto-generated: ${config.namingPattern} (e.g., ${config.example})</small>
                </div>
                <div class="alert alert-info" style="background: #ecfdf5; border: 1px solid #059669; border-radius: 8px; padding: 12px; margin-top: 10px;">
                    <i class="fas fa-info-circle" style="color: #059669;"></i>
                    <strong>Note:</strong> UAV naming does NOT include ecosystem code. Format: STATION_VENDOR_MODEL_NUMBER
                </div>
            </div>

            ${generateLocationSection()}
            ${generateDescriptionSection()}

            <input type="hidden" id="platform-station-id" value="${stationId}">
            <input type="hidden" id="platform-type" value="uav">

            ${generateFormActions('uav')}
        `;
    }

    // ========================================
    // Satellite Platform Form Generator
    // ========================================

    function generateSatellitePlatformForm(stationId) {
        const config = PLATFORM_CONFIG.satellite;

        return `
            <div class="form-section">
                <h4><i class="fas fa-info-circle"></i> Basic Information</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label for="platform-display-name">Display Name *</label>
                        <input type="text" id="platform-display-name" class="form-input" required
                               placeholder="e.g., Sentinel-2A MSI">
                    </div>
                    <div class="form-group">
                        <label>Platform Type</label>
                        <div class="form-input" style="background: #f3f4f6; cursor: not-allowed; display: flex; align-items: center; gap: 8px;">
                            <i class="fas ${config.icon}" style="color: ${config.color};"></i>
                            <span>${config.label}</span>
                            <span style="margin-left: auto; font-size: 0.75rem; color: #6b7280;">(locked)</span>
                        </div>
                    </div>
                </div>
                <div class="form-row">
                    ${generateStatusField()}
                </div>
            </div>

            <div class="form-section">
                <h4><i class="fas fa-satellite"></i> Satellite Specifications</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label for="platform-space-agency">Space Agency *</label>
                        <select id="platform-space-agency" class="form-input" onchange="PlatformForms.updateNormalizedName('satellite')">
                            <option value="ESA">ESA - European Space Agency</option>
                            <option value="NASA">NASA - National Aeronautics and Space Administration</option>
                            <option value="JAXA">JAXA - Japan Aerospace Exploration Agency</option>
                            <option value="NOAA">NOAA - National Oceanic and Atmospheric Administration</option>
                            <option value="USGS">USGS - United States Geological Survey</option>
                            <option value="OTHER">OTHER - Other Agency</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="platform-satellite">Satellite *</label>
                        <select id="platform-satellite" class="form-input" onchange="PlatformForms.updateNormalizedName('satellite')">
                            <optgroup label="Sentinel (ESA)">
                                <option value="S2A">S2A - Sentinel-2A</option>
                                <option value="S2B">S2B - Sentinel-2B</option>
                                <option value="S3A">S3A - Sentinel-3A</option>
                                <option value="S3B">S3B - Sentinel-3B</option>
                            </optgroup>
                            <optgroup label="Landsat (NASA/USGS)">
                                <option value="L8">L8 - Landsat 8</option>
                                <option value="L9">L9 - Landsat 9</option>
                            </optgroup>
                            <optgroup label="MODIS (NASA)">
                                <option value="TERRA">TERRA - Terra</option>
                                <option value="AQUA">AQUA - Aqua</option>
                            </optgroup>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="platform-sensor">Sensor *</label>
                        <select id="platform-sensor" class="form-input" onchange="PlatformForms.updateNormalizedName('satellite')">
                            <optgroup label="Sentinel-2">
                                <option value="MSI">MSI - MultiSpectral Instrument</option>
                            </optgroup>
                            <optgroup label="Sentinel-3">
                                <option value="OLCI">OLCI - Ocean and Land Colour Instrument</option>
                                <option value="SLSTR">SLSTR - Sea and Land Surface Temperature Radiometer</option>
                            </optgroup>
                            <optgroup label="Landsat">
                                <option value="OLI">OLI - Operational Land Imager</option>
                                <option value="TIRS">TIRS - Thermal Infrared Sensor</option>
                            </optgroup>
                            <optgroup label="MODIS">
                                <option value="MODIS">MODIS - Moderate Resolution Imaging Spectroradiometer</option>
                            </optgroup>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label for="platform-normalized-name">Normalized Name *</label>
                    <input type="text" id="platform-normalized-name" class="form-input" required readonly
                           style="background: #f9fafb;">
                    <small>Auto-generated: ${config.namingPattern} (e.g., ${config.example})</small>
                </div>
                <div class="alert alert-info" style="background: #f5f3ff; border: 1px solid #7c3aed; border-radius: 8px; padding: 12px; margin-top: 10px;">
                    <i class="fas fa-info-circle" style="color: #7c3aed;"></i>
                    <strong>Note:</strong> Satellite naming does NOT include ecosystem code. Format: STATION_AGENCY_SATELLITE_SENSOR
                </div>
            </div>

            ${generateDescriptionSection()}

            <input type="hidden" id="platform-station-id" value="${stationId}">
            <input type="hidden" id="platform-type" value="satellite">

            ${generateFormActions('satellite')}
        `;
    }

    // ========================================
    // Normalized Name Generators (Type-Specific)
    // ========================================

    function updateNormalizedName(platformType) {
        const stationAcronym = getStationAcronym();
        if (!stationAcronym) {
            console.error('Station acronym not available');
            return;
        }

        let normalizedName = '';

        switch (platformType) {
            case 'fixed': {
                const ecosystemCode = document.getElementById('platform-ecosystem-code')?.value || 'GEN';
                const locationCode = document.getElementById('platform-location-code')?.value?.trim().toUpperCase() || '';
                if (locationCode) {
                    normalizedName = `${stationAcronym}_${ecosystemCode}_${locationCode}`;
                }
                break;
            }
            case 'uav': {
                const vendor = document.getElementById('platform-drone-vendor')?.value || 'DJI';
                const model = document.getElementById('platform-drone-model')?.value || 'M3M';
                const locationCode = document.getElementById('platform-location-code')?.value?.trim().toUpperCase() || '';
                if (locationCode) {
                    // UAV: STATION_VENDOR_MODEL_LOCATION (NO ecosystem code!)
                    normalizedName = `${stationAcronym}_${vendor}_${model}_${locationCode}`;
                }
                break;
            }
            case 'satellite': {
                const agency = document.getElementById('platform-space-agency')?.value || 'ESA';
                const satellite = document.getElementById('platform-satellite')?.value || 'S2A';
                const sensor = document.getElementById('platform-sensor')?.value || 'MSI';
                // Satellite: STATION_AGENCY_SATELLITE_SENSOR (NO ecosystem code!)
                normalizedName = `${stationAcronym}_${agency}_${satellite}_${sensor}`;
                break;
            }
            default:
                console.warn('Unknown platform type:', platformType);
        }

        const normalizedInput = document.getElementById('platform-normalized-name');
        if (normalizedInput && normalizedName) {
            normalizedInput.value = normalizedName;
        }
    }

    // ========================================
    // Save Functions (Type-Specific)
    // ========================================

    async function savePlatform(platformType) {
        const saveBtn = document.querySelector('#create-platform-modal .save-btn');
        const originalText = saveBtn?.innerHTML || 'Create Platform';

        try {
            if (saveBtn) {
                saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
                saveBtn.disabled = true;
            }

            const stationId = parseInt(document.getElementById('platform-station-id')?.value);
            const displayName = document.getElementById('platform-display-name')?.value?.trim();
            const normalizedName = document.getElementById('platform-normalized-name')?.value?.trim();
            const status = document.getElementById('platform-status')?.value || 'Active';
            const description = document.getElementById('platform-description')?.value?.trim() || '';
            const latitude = parseFloat(document.getElementById('platform-latitude')?.value) || null;
            const longitude = parseFloat(document.getElementById('platform-longitude')?.value) || null;
            const deploymentDate = document.getElementById('platform-deployment-date')?.value || null;

            // Validation
            if (!displayName) throw new Error('Display name is required');
            if (!normalizedName) throw new Error('Normalized name is required');

            // Build platform data based on type
            const platformData = {
                station_id: stationId,
                display_name: displayName,
                normalized_name: normalizedName,
                platform_type: platformType, // ALWAYS use the passed type, never read from DOM
                status: status,
                description: description,
                latitude: latitude,
                longitude: longitude,
                deployment_date: deploymentDate
            };

            // Add type-specific fields
            // Note: mount_type_code renamed from location_code in v10.0.0
            switch (platformType) {
                case 'fixed': {
                    platformData.ecosystem_code = document.getElementById('platform-ecosystem-code')?.value || 'GEN';
                    platformData.mount_type_code = document.getElementById('platform-location-code')?.value?.trim().toUpperCase();
                    platformData.mounting_structure = document.getElementById('platform-mounting-structure')?.value || null;
                    platformData.platform_height_m = parseFloat(document.getElementById('platform-height')?.value) || null;
                    if (!platformData.mount_type_code) throw new Error('Mount type code is required');
                    break;
                }
                case 'uav': {
                    platformData.mount_type_code = document.getElementById('platform-location-code')?.value?.trim().toUpperCase();
                    platformData.drone_vendor = document.getElementById('platform-drone-vendor')?.value;
                    platformData.drone_model = document.getElementById('platform-drone-model')?.value;
                    // UAV does NOT use ecosystem_code in naming
                    platformData.ecosystem_code = null;
                    if (!platformData.mount_type_code) throw new Error('UAV number is required');
                    break;
                }
                case 'satellite': {
                    platformData.space_agency = document.getElementById('platform-space-agency')?.value;
                    platformData.satellite = document.getElementById('platform-satellite')?.value;
                    platformData.sensor = document.getElementById('platform-sensor')?.value;
                    platformData.mount_type_code = `${platformData.satellite}_${platformData.sensor}`;
                    // Satellite does NOT use ecosystem_code in naming
                    platformData.ecosystem_code = null;
                    break;
                }
            }

            console.log('Creating platform with data:', platformData);

            const token = localStorage.getItem('sites_spectral_token');
            const response = await fetch('/api/admin/platforms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(platformData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to create platform');
            }

            // For UAV platforms, auto-create instrument
            if (platformType === 'uav' && result.id) {
                const vendor = platformData.drone_vendor;
                const model = platformData.drone_model;
                if (vendor && model && typeof window.createUAVInstrument === 'function') {
                    await window.createUAVInstrument(result.id, normalizedName, vendor, model);
                }
            }

            showNotification(`Platform "${displayName}" created successfully!`, 'success');
            closeModal();

            // Refresh display
            if (typeof window.loadPlatformsAndInstruments === 'function') {
                window.loadPlatformsAndInstruments();
            } else if (window.sitesStationDashboard?._loadPlatformsAndInstruments) {
                window.sitesStationDashboard._loadPlatformsAndInstruments();
            }

        } catch (error) {
            console.error('Platform creation error:', error);
            showNotification(error.message, 'error');
        } finally {
            if (saveBtn) {
                saveBtn.innerHTML = originalText;
                saveBtn.disabled = false;
            }
        }
    }

    // ========================================
    // Modal Management
    // ========================================

    function openForm(stationId, platformType) {
        const config = PLATFORM_CONFIG[platformType];
        if (!config) {
            console.error('Unknown platform type:', platformType);
            return;
        }

        const modalTitle = document.getElementById('create-platform-modal-title');
        if (modalTitle) {
            modalTitle.innerHTML = `<i class="fas ${config.icon}"></i> Create ${config.label}`;
        }

        const form = document.getElementById('create-platform-form');
        if (!form) {
            console.error('Platform form container not found');
            return;
        }

        // Generate type-specific form
        switch (platformType) {
            case 'fixed':
                form.innerHTML = generateFixedPlatformForm(stationId);
                break;
            case 'uav':
                form.innerHTML = generateUAVPlatformForm(stationId);
                break;
            case 'satellite':
                form.innerHTML = generateSatellitePlatformForm(stationId);
                break;
            default:
                console.error('Form generator not implemented for:', platformType);
                return;
        }

        // Initialize normalized name
        updateNormalizedName(platformType);

        // Show modal
        document.getElementById('create-platform-modal')?.classList.add('show');
    }

    function closeModal() {
        document.getElementById('create-platform-modal')?.classList.remove('show');
    }

    function updateDroneModels() {
        // TODO: Update model options based on vendor selection
        console.log('Updating drone models based on vendor');
    }

    // ========================================
    // Public API
    // ========================================

    global.PlatformForms = {
        open: openForm,
        closeModal: closeModal,
        save: savePlatform,
        updateNormalizedName: updateNormalizedName,
        updateDroneModels: updateDroneModels,
        CONFIG: PLATFORM_CONFIG
    };

})(window);
