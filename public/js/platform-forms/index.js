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
    // MOBILE Platform Form Generator
    // ========================================

    function generateMobilePlatformForm(stationId) {
        const config = PLATFORM_CONFIG.mobile;
        const stationAcronym = getStationAcronym();

        return `
            <div class="form-section">
                <h4><i class="fas fa-info-circle"></i> Basic Information</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label for="platform-display-name">Display Name *</label>
                        <input type="text" id="platform-display-name" class="form-input" required
                               placeholder="e.g., Backpack Survey Unit 01"
                               oninput="PlatformForms.updateNormalizedName('mobile')">
                    </div>
                    <div class="form-group">
                        <label for="platform-location-code">Platform Number *</label>
                        <input type="text" id="platform-location-code" class="form-input" required
                               placeholder="e.g., MOB01" style="text-transform: uppercase;"
                               oninput="PlatformForms.updateNormalizedName('mobile')">
                        <small>Unique number within station (e.g., MOB01)</small>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="platform-ecosystem-code">Ecosystem Code *</label>
                        <select id="platform-ecosystem-code" class="form-input" onchange="PlatformForms.updateNormalizedName('mobile')">
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
                        <label for="platform-carrier-type">Carrier Type *</label>
                        <select id="platform-carrier-type" class="form-input" onchange="PlatformForms.updateNormalizedName('mobile')">
                            <option value="VEH">VEH - Vehicle (truck, car, ATV)</option>
                            <option value="BPK">BPK - Backpack (human walking)</option>
                            <option value="BIC">BIC - Bicycle (human cycling)</option>
                            <option value="BOT">BOT - Boat (small watercraft)</option>
                            <option value="ROV">ROV - Rover (autonomous/RC robot)</option>
                            <option value="OTH">OTH - Other carrier type</option>
                        </select>
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
                <div class="form-group">
                    <label for="platform-normalized-name">Normalized Name *</label>
                    <input type="text" id="platform-normalized-name" class="form-input" required readonly
                           style="background: #f9fafb;">
                    <small>Auto-generated: ${config.namingPattern} (e.g., ${config.example})</small>
                </div>
            </div>

            <div class="form-section">
                <h4><i class="fas fa-cogs"></i> Carrier Specifications</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label for="platform-carrier-model">Carrier Model</label>
                        <input type="text" id="platform-carrier-model" class="form-input"
                               placeholder="e.g., Toyota Hilux, Trek Marlin">
                    </div>
                    <div class="form-group">
                        <label for="platform-power-type">Power Source</label>
                        <select id="platform-power-type" class="form-input">
                            <option value="">Select power source</option>
                            <option value="battery">Battery</option>
                            <option value="vehicle">Vehicle Power</option>
                            <option value="solar">Solar</option>
                            <option value="manual">Manual/No Power</option>
                            <option value="hybrid">Hybrid</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="platform-typical-speed">Typical Speed (km/h)</label>
                        <input type="number" id="platform-typical-speed" class="form-input" step="0.1"
                               min="0" max="200" placeholder="Survey speed">
                    </div>
                    <div class="form-group">
                        <label for="platform-range">Range (km)</label>
                        <input type="number" id="platform-range" class="form-input" step="0.1"
                               min="0" max="1000" placeholder="Operating range">
                    </div>
                </div>
                <div class="form-group">
                    <label for="platform-runtime">Runtime (hours)</label>
                    <input type="number" id="platform-runtime" class="form-input" step="0.5"
                           min="0" max="100" placeholder="Operational runtime">
                </div>
            </div>

            ${generateLocationSection()}
            ${generateDescriptionSection()}

            <input type="hidden" id="platform-station-id" value="${stationId}">
            <input type="hidden" id="platform-type" value="mobile">

            ${generateFormActions('mobile')}
        `;
    }

    // ========================================
    // USV Platform Form Generator
    // ========================================

    function generateUSVPlatformForm(stationId) {
        const config = PLATFORM_CONFIG.usv;
        const stationAcronym = getStationAcronym();

        return `
            <div class="form-section">
                <h4><i class="fas fa-info-circle"></i> Basic Information</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label for="platform-display-name">Display Name *</label>
                        <input type="text" id="platform-display-name" class="form-input" required
                               placeholder="e.g., Lake Survey Boat 01"
                               oninput="PlatformForms.updateNormalizedName('usv')">
                    </div>
                    <div class="form-group">
                        <label for="platform-location-code">USV Number *</label>
                        <input type="text" id="platform-location-code" class="form-input" required
                               placeholder="e.g., USV01" style="text-transform: uppercase;"
                               oninput="PlatformForms.updateNormalizedName('usv')">
                        <small>Unique number within station (e.g., USV01)</small>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="platform-ecosystem-code">Ecosystem Code *</label>
                        <select id="platform-ecosystem-code" class="form-input" onchange="PlatformForms.updateNormalizedName('usv')">
                            <option value="LAK">LAK - Lake (recommended)</option>
                            <option value="WET">WET - Wetland (recommended)</option>
                            <option value="MAR">MAR - Marshland (recommended)</option>
                            <option value="FOR">FOR - Forest</option>
                            <option value="GEN">GEN - General</option>
                        </select>
                        <small>Aquatic ecosystems (LAK, WET, MAR) recommended</small>
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
                <h4><i class="fas fa-ship"></i> USV Specifications</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label for="platform-usv-model">USV Model</label>
                        <input type="text" id="platform-usv-model" class="form-input"
                               placeholder="e.g., Clearpath Heron, Q-Boat">
                    </div>
                    <div class="form-group">
                        <label for="platform-manufacturer">Manufacturer</label>
                        <input type="text" id="platform-manufacturer" class="form-input"
                               placeholder="e.g., Clearpath Robotics">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="platform-hull-type">Hull Type</label>
                        <select id="platform-hull-type" class="form-input">
                            <option value="">Select hull type</option>
                            <option value="monohull">Monohull</option>
                            <option value="catamaran">Catamaran (dual hull)</option>
                            <option value="trimaran">Trimaran (triple hull)</option>
                            <option value="inflatable">Inflatable</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="platform-propulsion-type">Propulsion</label>
                        <select id="platform-propulsion-type" class="form-input">
                            <option value="">Select propulsion</option>
                            <option value="electric">Electric</option>
                            <option value="gasoline">Gasoline</option>
                            <option value="hybrid">Hybrid</option>
                            <option value="solar">Solar Electric</option>
                            <option value="jet">Water Jet</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="platform-length">Length (m)</label>
                        <input type="number" id="platform-length" class="form-input" step="0.1"
                               min="0.1" max="20" placeholder="Overall length">
                    </div>
                    <div class="form-group">
                        <label for="platform-max-payload">Max Payload (kg)</label>
                        <input type="number" id="platform-max-payload" class="form-input"
                               min="0" max="500" placeholder="Payload capacity">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="platform-max-speed">Max Speed (knots)</label>
                        <input type="number" id="platform-max-speed" class="form-input" step="0.5"
                               min="0" max="50" placeholder="Maximum speed">
                    </div>
                    <div class="form-group">
                        <label for="platform-endurance">Endurance (hours)</label>
                        <input type="number" id="platform-endurance" class="form-input" step="0.5"
                               min="0" max="72" placeholder="Operational endurance">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="platform-navigation-system">Navigation System</label>
                        <select id="platform-navigation-system" class="form-input">
                            <option value="">Select navigation</option>
                            <option value="gps">GPS</option>
                            <option value="dgps">Differential GPS</option>
                            <option value="rtk">RTK GPS</option>
                            <option value="gnss">GNSS Multi-constellation</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="platform-control-mode">Control Mode</label>
                        <select id="platform-control-mode" class="form-input">
                            <option value="">Select control mode</option>
                            <option value="autonomous">Fully Autonomous</option>
                            <option value="supervised">Supervised Autonomy</option>
                            <option value="remote">Remote Control</option>
                            <option value="hybrid">Hybrid (Auto + Remote)</option>
                        </select>
                    </div>
                </div>
            </div>

            ${generateLocationSection()}
            ${generateDescriptionSection()}

            <input type="hidden" id="platform-station-id" value="${stationId}">
            <input type="hidden" id="platform-type" value="usv">

            ${generateFormActions('usv')}
        `;
    }

    // ========================================
    // UUV Platform Form Generator
    // ========================================

    function generateUUVPlatformForm(stationId) {
        const config = PLATFORM_CONFIG.uuv;
        const stationAcronym = getStationAcronym();

        return `
            <div class="form-section">
                <h4><i class="fas fa-info-circle"></i> Basic Information</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label for="platform-display-name">Display Name *</label>
                        <input type="text" id="platform-display-name" class="form-input" required
                               placeholder="e.g., Lake Bottom Survey ROV 01"
                               oninput="PlatformForms.updateNormalizedName('uuv')">
                    </div>
                    <div class="form-group">
                        <label for="platform-location-code">UUV Number *</label>
                        <input type="text" id="platform-location-code" class="form-input" required
                               placeholder="e.g., UUV01" style="text-transform: uppercase;"
                               oninput="PlatformForms.updateNormalizedName('uuv')">
                        <small>Unique number within station (e.g., UUV01)</small>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="platform-ecosystem-code">Ecosystem Code *</label>
                        <select id="platform-ecosystem-code" class="form-input" onchange="PlatformForms.updateNormalizedName('uuv')">
                            <option value="LAK">LAK - Lake (recommended)</option>
                            <option value="WET">WET - Wetland (recommended)</option>
                            <option value="MAR">MAR - Marshland (recommended)</option>
                            <option value="FOR">FOR - Forest</option>
                            <option value="GEN">GEN - General</option>
                        </select>
                        <small>Aquatic ecosystems (LAK, WET, MAR) recommended</small>
                    </div>
                    <div class="form-group">
                        <label for="platform-uuv-type">UUV Type *</label>
                        <select id="platform-uuv-type" class="form-input">
                            <option value="rov">ROV - Remotely Operated (tethered)</option>
                            <option value="auv">AUV - Autonomous Underwater</option>
                            <option value="hybrid">Hybrid - ROV/AUV capable</option>
                        </select>
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
                <div class="form-group">
                    <label for="platform-normalized-name">Normalized Name *</label>
                    <input type="text" id="platform-normalized-name" class="form-input" required readonly
                           style="background: #f9fafb;">
                    <small>Auto-generated: ${config.namingPattern} (e.g., ${config.example})</small>
                </div>
            </div>

            <div class="form-section">
                <h4><i class="fas fa-water"></i> UUV Specifications</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label for="platform-uuv-model">UUV Model</label>
                        <input type="text" id="platform-uuv-model" class="form-input"
                               placeholder="e.g., BlueROV2, REMUS 100">
                    </div>
                    <div class="form-group">
                        <label for="platform-manufacturer">Manufacturer</label>
                        <input type="text" id="platform-manufacturer" class="form-input"
                               placeholder="e.g., Blue Robotics, Kongsberg">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="platform-max-depth">Max Depth (m)</label>
                        <input type="number" id="platform-max-depth" class="form-input"
                               min="1" max="6000" placeholder="Maximum operating depth">
                    </div>
                    <div class="form-group">
                        <label for="platform-typical-depth">Typical Depth (m)</label>
                        <input type="number" id="platform-typical-depth" class="form-input"
                               min="0" max="1000" placeholder="Typical operating depth">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="platform-propulsion-type">Propulsion</label>
                        <select id="platform-propulsion-type" class="form-input">
                            <option value="">Select propulsion</option>
                            <option value="thruster">Electric Thrusters</option>
                            <option value="propeller">Propeller</option>
                            <option value="jet">Water Jet</option>
                            <option value="buoyancy">Buoyancy-Driven (Glider)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="platform-num-thrusters">Number of Thrusters</label>
                        <input type="number" id="platform-num-thrusters" class="form-input"
                               min="1" max="12" placeholder="e.g., 4, 6, 8">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="platform-navigation-system">Navigation System</label>
                        <select id="platform-navigation-system" class="form-input">
                            <option value="">Select navigation</option>
                            <option value="dvl">DVL (Doppler Velocity Log)</option>
                            <option value="usbl">USBL (Ultra-Short BaseLine)</option>
                            <option value="ins">INS (Inertial Navigation)</option>
                            <option value="slam">Visual SLAM</option>
                            <option value="combined">Combined/Hybrid</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="platform-tether-length">Tether Length (m)</label>
                        <input type="number" id="platform-tether-length" class="form-input"
                               min="0" max="1000" placeholder="For ROVs (0 for AUVs)">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="platform-endurance">Endurance (hours)</label>
                        <input type="number" id="platform-endurance" class="form-input" step="0.5"
                               min="0" max="72" placeholder="Operational endurance">
                    </div>
                    <div class="form-group">
                        <label for="platform-max-payload">Max Payload (kg)</label>
                        <input type="number" id="platform-max-payload" class="form-input"
                               min="0" max="200" placeholder="Additional payload capacity">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="platform-lighting">Lighting (lumens)</label>
                        <input type="number" id="platform-lighting" class="form-input"
                               min="0" max="50000" placeholder="Total lighting capacity">
                    </div>
                    <div class="form-group">
                        <label for="platform-has-manipulator">
                            <input type="checkbox" id="platform-has-manipulator" style="width: auto; margin-right: 8px;">
                            Has Manipulator Arm
                        </label>
                    </div>
                </div>
            </div>

            ${generateLocationSection()}
            ${generateDescriptionSection()}

            <input type="hidden" id="platform-station-id" value="${stationId}">
            <input type="hidden" id="platform-type" value="uuv">

            ${generateFormActions('uuv')}
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
            case 'mobile': {
                const ecosystemCode = document.getElementById('platform-ecosystem-code')?.value || 'GEN';
                const carrierType = document.getElementById('platform-carrier-type')?.value || 'BPK';
                const locationCode = document.getElementById('platform-location-code')?.value?.trim().toUpperCase() || '';
                if (locationCode) {
                    // Mobile: STATION_ECOSYSTEM_CARRIER_LOCATION
                    normalizedName = `${stationAcronym}_${ecosystemCode}_${carrierType}_${locationCode}`;
                }
                break;
            }
            case 'usv': {
                const ecosystemCode = document.getElementById('platform-ecosystem-code')?.value || 'LAK';
                const locationCode = document.getElementById('platform-location-code')?.value?.trim().toUpperCase() || '';
                if (locationCode) {
                    // USV: STATION_ECOSYSTEM_LOCATION
                    normalizedName = `${stationAcronym}_${ecosystemCode}_${locationCode}`;
                }
                break;
            }
            case 'uuv': {
                const ecosystemCode = document.getElementById('platform-ecosystem-code')?.value || 'LAK';
                const locationCode = document.getElementById('platform-location-code')?.value?.trim().toUpperCase() || '';
                if (locationCode) {
                    // UUV: STATION_ECOSYSTEM_LOCATION
                    normalizedName = `${stationAcronym}_${ecosystemCode}_${locationCode}`;
                }
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
                case 'mobile': {
                    platformData.ecosystem_code = document.getElementById('platform-ecosystem-code')?.value || 'GEN';
                    platformData.mount_type_code = document.getElementById('platform-location-code')?.value?.trim().toUpperCase();
                    platformData.carrier_type = document.getElementById('platform-carrier-type')?.value;
                    platformData.carrier_model = document.getElementById('platform-carrier-model')?.value?.trim() || null;
                    platformData.power_type = document.getElementById('platform-power-type')?.value || null;
                    platformData.typical_speed_kmh = parseFloat(document.getElementById('platform-typical-speed')?.value) || null;
                    platformData.range_km = parseFloat(document.getElementById('platform-range')?.value) || null;
                    platformData.runtime_hours = parseFloat(document.getElementById('platform-runtime')?.value) || null;
                    if (!platformData.mount_type_code) throw new Error('Platform number is required');
                    if (!platformData.carrier_type) throw new Error('Carrier type is required');
                    break;
                }
                case 'usv': {
                    platformData.ecosystem_code = document.getElementById('platform-ecosystem-code')?.value || 'LAK';
                    platformData.mount_type_code = document.getElementById('platform-location-code')?.value?.trim().toUpperCase();
                    platformData.usv_model = document.getElementById('platform-usv-model')?.value?.trim() || null;
                    platformData.manufacturer = document.getElementById('platform-manufacturer')?.value?.trim() || null;
                    platformData.hull_type = document.getElementById('platform-hull-type')?.value || null;
                    platformData.propulsion_type = document.getElementById('platform-propulsion-type')?.value || null;
                    platformData.length_m = parseFloat(document.getElementById('platform-length')?.value) || null;
                    platformData.max_payload_kg = parseFloat(document.getElementById('platform-max-payload')?.value) || null;
                    platformData.max_speed_knots = parseFloat(document.getElementById('platform-max-speed')?.value) || null;
                    platformData.endurance_hours = parseFloat(document.getElementById('platform-endurance')?.value) || null;
                    platformData.navigation_system = document.getElementById('platform-navigation-system')?.value || null;
                    platformData.control_mode = document.getElementById('platform-control-mode')?.value || null;
                    if (!platformData.mount_type_code) throw new Error('USV number is required');
                    break;
                }
                case 'uuv': {
                    platformData.ecosystem_code = document.getElementById('platform-ecosystem-code')?.value || 'LAK';
                    platformData.mount_type_code = document.getElementById('platform-location-code')?.value?.trim().toUpperCase();
                    platformData.uuv_type = document.getElementById('platform-uuv-type')?.value || 'rov';
                    platformData.uuv_model = document.getElementById('platform-uuv-model')?.value?.trim() || null;
                    platformData.manufacturer = document.getElementById('platform-manufacturer')?.value?.trim() || null;
                    platformData.max_depth_m = parseFloat(document.getElementById('platform-max-depth')?.value) || null;
                    platformData.typical_depth_m = parseFloat(document.getElementById('platform-typical-depth')?.value) || null;
                    platformData.propulsion_type = document.getElementById('platform-propulsion-type')?.value || null;
                    platformData.num_thrusters = parseInt(document.getElementById('platform-num-thrusters')?.value) || null;
                    platformData.navigation_system = document.getElementById('platform-navigation-system')?.value || null;
                    platformData.tether_length_m = parseFloat(document.getElementById('platform-tether-length')?.value) || null;
                    platformData.endurance_hours = parseFloat(document.getElementById('platform-endurance')?.value) || null;
                    platformData.max_payload_kg = parseFloat(document.getElementById('platform-max-payload')?.value) || null;
                    platformData.lighting_lumens = parseInt(document.getElementById('platform-lighting')?.value) || null;
                    platformData.has_manipulator = document.getElementById('platform-has-manipulator')?.checked || false;
                    if (!platformData.mount_type_code) throw new Error('UUV number is required');
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
            case 'mobile':
                form.innerHTML = generateMobilePlatformForm(stationId);
                break;
            case 'usv':
                form.innerHTML = generateUSVPlatformForm(stationId);
                break;
            case 'uuv':
                form.innerHTML = generateUUVPlatformForm(stationId);
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
        const vendorSelect = document.getElementById('platform-drone-vendor');
        const modelSelect = document.getElementById('platform-drone-model');

        if (!vendorSelect || !modelSelect) {
            console.warn('Drone vendor or model select not found');
            return;
        }

        const vendor = vendorSelect.value;

        // Define models per vendor (static data - no user input)
        const modelsByVendor = {
            DJI: [
                { group: 'DJI Multispectral', options: [
                    { value: 'M3M', label: 'M3M - Mavic 3 Multispectral' },
                    { value: 'P4M', label: 'P4M - Phantom 4 Multispectral' }
                ]},
                { group: 'DJI Enterprise', options: [
                    { value: 'M30T', label: 'M30T - Matrice 30T' },
                    { value: 'M300', label: 'M300 - Matrice 300 RTK' },
                    { value: 'M350', label: 'M350 - Matrice 350 RTK' }
                ]},
                { group: 'DJI Consumer', options: [
                    { value: 'M3P', label: 'M3P - Mavic 3 Pro' },
                    { value: 'AIR3', label: 'AIR3 - Air 3' }
                ]}
            ],
            PARROT: [
                { group: 'Parrot Professional', options: [
                    { value: 'ANAFI', label: 'ANAFI - ANAFI Thermal' },
                    { value: 'ANAFI-USA', label: 'ANAFI-USA - ANAFI USA' },
                    { value: 'BLUEGRASS', label: 'BLUEGRASS - Bluegrass Fields' }
                ]},
                { group: 'Parrot Legacy', options: [
                    { value: 'SEQUOIA', label: 'SEQUOIA - Sequoia+ Camera' },
                    { value: 'DISCO-AG', label: 'DISCO-AG - Disco-Pro AG' }
                ]}
            ],
            AUTEL: [
                { group: 'Autel EVO Series', options: [
                    { value: 'EVO2', label: 'EVO2 - EVO II Pro' },
                    { value: 'EVO2-RTK', label: 'EVO2-RTK - EVO II RTK' },
                    { value: 'EVO-MAX', label: 'EVO-MAX - EVO Max 4T' }
                ]},
                { group: 'Autel Enterprise', options: [
                    { value: 'DRAGONFISH', label: 'DRAGONFISH - Dragonfish' }
                ]}
            ],
            SENSEFLY: [
                { group: 'senseFly eBee', options: [
                    { value: 'EBEE-X', label: 'EBEE-X - eBee X' },
                    { value: 'EBEE-AG', label: 'EBEE-AG - eBee AG' },
                    { value: 'EBEE-TAC', label: 'EBEE-TAC - eBee TAC' }
                ]},
                { group: 'senseFly Cameras', options: [
                    { value: 'AERIA-X', label: 'AERIA-X - Aeria X' },
                    { value: 'S110', label: 'S110 - S.O.D.A.' }
                ]}
            ],
            MICASENSE: [
                { group: 'MicaSense Sensors', options: [
                    { value: 'REDEDGE-MX', label: 'REDEDGE-MX - RedEdge-MX' },
                    { value: 'REDEDGE-P', label: 'REDEDGE-P - RedEdge-P' },
                    { value: 'ALTUM-PT', label: 'ALTUM-PT - Altum-PT' },
                    { value: 'ALTUM', label: 'ALTUM - Altum' }
                ]}
            ],
            HEADWALL: [
                { group: 'Headwall Hyperspectral', options: [
                    { value: 'NANO-HYPER', label: 'NANO-HYPER - Nano-Hyperspec' },
                    { value: 'MICRO-HYPER', label: 'MICRO-HYPER - Micro-Hyperspec' },
                    { value: 'CO2', label: 'CO2 - CO2 Mapper' }
                ]}
            ],
            OTHER: [
                { group: 'Other', options: [
                    { value: 'CUSTOM', label: 'CUSTOM - Custom/Unknown Model' },
                    { value: 'PROTOTYPE', label: 'PROTOTYPE - Prototype UAV' }
                ]}
            ]
        };

        // Clear existing options using safe DOM methods
        while (modelSelect.firstChild) {
            modelSelect.removeChild(modelSelect.firstChild);
        }

        // Build options using safe DOM methods
        const groups = modelsByVendor[vendor] || modelsByVendor.OTHER;
        groups.forEach(groupData => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = groupData.group;

            groupData.options.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt.value;
                option.textContent = opt.label;
                optgroup.appendChild(option);
            });

            modelSelect.appendChild(optgroup);
        });

        console.log(`Updated drone models for vendor: ${vendor}`);
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
