/**
 * SITES Spectral Platform Modals v8.2.0
 * Platform-type-specific modal builders for Fixed, UAV, Satellite, and Mobile platforms
 */

window.PlatformModals = (function() {
    'use strict';

    // =========================================================================
    // CONFIGURATION
    // =========================================================================

    const CARRIER_TYPES = {
        'vehicle': { label: 'Vehicle', icon: 'fa-truck', desc: 'Truck, car, ATV for road/trail surveys' },
        'boat': { label: 'Boat', icon: 'fa-ship', desc: 'Watercraft for lake/coastal surveys' },
        'rover': { label: 'Rover', icon: 'fa-robot', desc: 'Autonomous/remote-controlled ground robot' },
        'backpack': { label: 'Backpack', icon: 'fa-hiking', desc: 'Human walking with backpack instruments' },
        'bicycle': { label: 'Bicycle', icon: 'fa-bicycle', desc: 'Human cycling with mounted/backpack instruments' },
        'other': { label: 'Other', icon: 'fa-question', desc: 'Custom carrier type' }
    };

    const CARRIER_CODES = {
        'vehicle': 'VEH',
        'boat': 'BOT',
        'rover': 'ROV',
        'backpack': 'BPK',
        'bicycle': 'BIC',
        'other': 'OTH'
    };

    const TERRAIN_OPTIONS = ['road', 'trail', 'offroad', 'water', 'snow', 'sand', 'rocky'];
    const POWER_TYPES = ['battery', 'fuel', 'human', 'solar', 'hybrid'];
    const SURVEY_METHODS = ['transect', 'grid', 'opportunistic', 'route', 'manual'];

    // =========================================================================
    // FIXED PLATFORM MODAL
    // =========================================================================

    function buildFixedPlatformModal(platform, isEditable = false) {
        return `
        <div class="platform-detail-sections">
            <!-- Location & Positioning -->
            <div class="detail-section">
                <h4><i class="fas fa-map-marker-alt"></i> Location & Positioning</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Latitude</label>
                        ${isEditable ?
                            `<input type="number" id="platform-lat" class="form-input" step="any" value="${platform.latitude || ''}" placeholder="e.g., 64.1823">` :
                            `<span>${platform.latitude ? platform.latitude.toFixed(6) : 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Longitude</label>
                        ${isEditable ?
                            `<input type="number" id="platform-lon" class="form-input" step="any" value="${platform.longitude || ''}" placeholder="e.g., 19.7756">` :
                            `<span>${platform.longitude ? platform.longitude.toFixed(6) : 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Platform Height (m)</label>
                        ${isEditable ?
                            `<input type="number" id="platform-height" class="form-input" step="0.1" value="${platform.platform_height_m || ''}" placeholder="Height in meters">` :
                            `<span>${platform.platform_height_m ? platform.platform_height_m + ' m' : 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Mounting Structure</label>
                        ${isEditable ?
                            `<select id="platform-mounting" class="form-input">
                                <option value="">Select structure...</option>
                                <option value="Tower" ${platform.mounting_structure === 'Tower' ? 'selected' : ''}>Tower</option>
                                <option value="Mast" ${platform.mounting_structure === 'Mast' ? 'selected' : ''}>Mast</option>
                                <option value="Building Rooftop" ${platform.mounting_structure === 'Building Rooftop' ? 'selected' : ''}>Building Rooftop</option>
                                <option value="Pole" ${platform.mounting_structure === 'Pole' ? 'selected' : ''}>Pole</option>
                                <option value="Scaffold" ${platform.mounting_structure === 'Scaffold' ? 'selected' : ''}>Scaffold</option>
                                <option value="Other" ${platform.mounting_structure === 'Other' ? 'selected' : ''}>Other</option>
                            </select>` :
                            `<span>${platform.mounting_structure || 'Not specified'}</span>`
                        }
                    </div>
                </div>
            </div>

            <!-- Deployment Information -->
            <div class="detail-section">
                <h4><i class="fas fa-calendar-alt"></i> Deployment Information</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Deployment Date</label>
                        ${isEditable ?
                            `<input type="date" id="platform-deployment" class="form-input" value="${platform.deployment_date || ''}">` :
                            `<span>${platform.deployment_date || 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Status</label>
                        ${isEditable ?
                            `<select id="platform-status" class="form-input">
                                <option value="Active" ${platform.status === 'Active' ? 'selected' : ''}>Active</option>
                                <option value="Maintenance" ${platform.status === 'Maintenance' ? 'selected' : ''}>Maintenance</option>
                                <option value="Inactive" ${platform.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                                <option value="Decommissioned" ${platform.status === 'Decommissioned' ? 'selected' : ''}>Decommissioned</option>
                            </select>` :
                            `<span class="status-badge status-${(platform.status || 'unknown').toLowerCase()}">${platform.status || 'Unknown'}</span>`
                        }
                    </div>
                    <div class="detail-item full-width">
                        <label>Description</label>
                        ${isEditable ?
                            `<textarea id="platform-description" class="form-input" rows="3" placeholder="Platform description...">${platform.description || ''}</textarea>` :
                            `<span>${platform.description || 'No description'}</span>`
                        }
                    </div>
                </div>
            </div>
        </div>
        `;
    }

    // =========================================================================
    // UAV PLATFORM MODAL
    // =========================================================================

    function buildUAVPlatformModal(platform, uavData = {}, isEditable = false) {
        return `
        <div class="platform-detail-sections">
            <!-- Aircraft Specifications -->
            <div class="detail-section">
                <h4><i class="fas fa-crosshairs"></i> Aircraft Specifications</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Manufacturer</label>
                        ${isEditable ?
                            `<input type="text" id="uav-manufacturer" class="form-input" value="${uavData.manufacturer || ''}" placeholder="e.g., DJI">` :
                            `<span>${uavData.manufacturer || 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Model</label>
                        ${isEditable ?
                            `<input type="text" id="uav-model" class="form-input" value="${uavData.uav_model || ''}" placeholder="e.g., Mavic 3 Multispectral">` :
                            `<span>${uavData.uav_model || 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Serial Number</label>
                        ${isEditable ?
                            `<input type="text" id="uav-serial" class="form-input" value="${uavData.serial_number || ''}" placeholder="Serial number">` :
                            `<span>${uavData.serial_number || 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Registration Number</label>
                        ${isEditable ?
                            `<input type="text" id="uav-registration" class="form-input" value="${uavData.registration_number || ''}" placeholder="Regulatory registration">` :
                            `<span>${uavData.registration_number || 'Not set'}</span>`
                        }
                    </div>
                </div>
            </div>

            <!-- Flight Capabilities -->
            <div class="detail-section">
                <h4><i class="fas fa-tachometer-alt"></i> Flight Capabilities</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Max Flight Time (min)</label>
                        ${isEditable ?
                            `<input type="number" id="uav-flight-time" class="form-input" value="${uavData.max_flight_time_min || ''}" placeholder="Minutes">` :
                            `<span>${uavData.max_flight_time_min ? uavData.max_flight_time_min + ' min' : 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Max Payload (kg)</label>
                        ${isEditable ?
                            `<input type="number" id="uav-payload" class="form-input" step="0.1" value="${uavData.max_payload_kg || ''}" placeholder="kg">` :
                            `<span>${uavData.max_payload_kg ? uavData.max_payload_kg + ' kg' : 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Max Altitude AGL (m)</label>
                        ${isEditable ?
                            `<input type="number" id="uav-altitude" class="form-input" value="${uavData.max_altitude_m || ''}" placeholder="Meters AGL">` :
                            `<span>${uavData.max_altitude_m ? uavData.max_altitude_m + ' m' : 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Max Speed (m/s)</label>
                        ${isEditable ?
                            `<input type="number" id="uav-speed" class="form-input" step="0.1" value="${uavData.max_speed_ms || ''}" placeholder="m/s">` :
                            `<span>${uavData.max_speed_ms ? uavData.max_speed_ms + ' m/s' : 'Not set'}</span>`
                        }
                    </div>
                </div>
            </div>

            <!-- Positioning System -->
            <div class="detail-section">
                <h4><i class="fas fa-satellite-dish"></i> Positioning System</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Navigation System</label>
                        ${isEditable ?
                            `<input type="text" id="uav-nav" class="form-input" value="${uavData.navigation_system || ''}" placeholder="e.g., GPS+GLONASS">` :
                            `<span>${uavData.navigation_system || 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>RTK Capable</label>
                        ${isEditable ?
                            `<select id="uav-rtk" class="form-input">
                                <option value="0" ${!uavData.rtk_capable ? 'selected' : ''}>No</option>
                                <option value="1" ${uavData.rtk_capable ? 'selected' : ''}>Yes</option>
                            </select>` :
                            `<span>${uavData.rtk_capable ? 'Yes' : 'No'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Positioning Accuracy (cm)</label>
                        ${isEditable ?
                            `<input type="number" id="uav-accuracy" class="form-input" step="0.1" value="${uavData.positioning_accuracy_cm || ''}" placeholder="cm">` :
                            `<span>${uavData.positioning_accuracy_cm ? uavData.positioning_accuracy_cm + ' cm' : 'Not set'}</span>`
                        }
                    </div>
                </div>
            </div>

            <!-- Sensors -->
            <div class="detail-section">
                <h4><i class="fas fa-camera"></i> Onboard Sensors</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>RGB Camera</label>
                        ${isEditable ?
                            `<input type="text" id="uav-rgb" class="form-input" value="${uavData.rgb_camera || ''}" placeholder="RGB camera model">` :
                            `<span>${uavData.rgb_camera || 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Multispectral Camera</label>
                        ${isEditable ?
                            `<input type="text" id="uav-ms" class="form-input" value="${uavData.multispectral_camera || ''}" placeholder="MS camera model">` :
                            `<span>${uavData.multispectral_camera || 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Thermal Camera</label>
                        ${isEditable ?
                            `<input type="text" id="uav-thermal" class="form-input" value="${uavData.thermal_camera || ''}" placeholder="Thermal camera if any">` :
                            `<span>${uavData.thermal_camera || 'None'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>LiDAR Sensor</label>
                        ${isEditable ?
                            `<input type="text" id="uav-lidar" class="form-input" value="${uavData.lidar_sensor || ''}" placeholder="LiDAR if any">` :
                            `<span>${uavData.lidar_sensor || 'None'}</span>`
                        }
                    </div>
                </div>
            </div>

            <!-- Maintenance -->
            <div class="detail-section">
                <h4><i class="fas fa-tools"></i> Maintenance & Status</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Total Flight Hours</label>
                        ${isEditable ?
                            `<input type="number" id="uav-hours" class="form-input" step="0.1" value="${uavData.total_flight_hours || ''}" placeholder="Hours">` :
                            `<span>${uavData.total_flight_hours ? uavData.total_flight_hours + ' hrs' : 'Not logged'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Last Maintenance</label>
                        ${isEditable ?
                            `<input type="date" id="uav-maintenance" class="form-input" value="${uavData.last_maintenance_date || ''}">` :
                            `<span>${uavData.last_maintenance_date || 'Not logged'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Firmware Version</label>
                        ${isEditable ?
                            `<input type="text" id="uav-firmware" class="form-input" value="${uavData.firmware_version || ''}" placeholder="Current firmware">` :
                            `<span>${uavData.firmware_version || 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Status</label>
                        ${isEditable ?
                            `<select id="platform-status" class="form-input">
                                <option value="Active" ${platform.status === 'Active' ? 'selected' : ''}>Active</option>
                                <option value="Maintenance" ${platform.status === 'Maintenance' ? 'selected' : ''}>Maintenance</option>
                                <option value="Inactive" ${platform.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                            </select>` :
                            `<span class="status-badge status-${(platform.status || 'unknown').toLowerCase()}">${platform.status || 'Unknown'}</span>`
                        }
                    </div>
                </div>
            </div>
        </div>
        `;
    }

    // =========================================================================
    // SATELLITE PLATFORM MODAL
    // =========================================================================

    function buildSatellitePlatformModal(platform, satData = {}, isEditable = false) {
        return `
        <div class="platform-detail-sections">
            <!-- Satellite Identification -->
            <div class="detail-section">
                <h4><i class="fas fa-satellite"></i> Satellite Identification</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Satellite Name</label>
                        ${isEditable ?
                            `<input type="text" id="sat-name" class="form-input" value="${satData.satellite_name || ''}" placeholder="e.g., Sentinel-2A">` :
                            `<span>${satData.satellite_name || platform.display_name || 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Operator</label>
                        ${isEditable ?
                            `<input type="text" id="sat-operator" class="form-input" value="${satData.operator || ''}" placeholder="e.g., ESA">` :
                            `<span>${satData.operator || 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Program</label>
                        ${isEditable ?
                            `<input type="text" id="sat-program" class="form-input" value="${satData.program || ''}" placeholder="e.g., Copernicus">` :
                            `<span>${satData.program || 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Constellation</label>
                        ${isEditable ?
                            `<input type="text" id="sat-constellation" class="form-input" value="${satData.constellation || ''}" placeholder="e.g., Sentinel-2">` :
                            `<span>${satData.constellation || 'Not set'}</span>`
                        }
                    </div>
                </div>
            </div>

            <!-- Orbital Characteristics -->
            <div class="detail-section">
                <h4><i class="fas fa-globe"></i> Orbital Characteristics</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Orbit Type</label>
                        ${isEditable ?
                            `<select id="sat-orbit" class="form-input">
                                <option value="">Select orbit type...</option>
                                <option value="sun_synchronous" ${satData.orbit_type === 'sun_synchronous' ? 'selected' : ''}>Sun-synchronous</option>
                                <option value="polar" ${satData.orbit_type === 'polar' ? 'selected' : ''}>Polar</option>
                                <option value="geostationary" ${satData.orbit_type === 'geostationary' ? 'selected' : ''}>Geostationary</option>
                            </select>` :
                            `<span>${satData.orbit_type ? satData.orbit_type.replace('_', '-') : 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Altitude (km)</label>
                        ${isEditable ?
                            `<input type="number" id="sat-altitude" class="form-input" value="${satData.altitude_km || ''}" placeholder="Orbital altitude">` :
                            `<span>${satData.altitude_km ? satData.altitude_km + ' km' : 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Inclination (°)</label>
                        ${isEditable ?
                            `<input type="number" id="sat-inclination" class="form-input" step="0.1" value="${satData.inclination_deg || ''}" placeholder="Degrees">` :
                            `<span>${satData.inclination_deg ? satData.inclination_deg + '°' : 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Repeat Cycle (days)</label>
                        ${isEditable ?
                            `<input type="number" id="sat-repeat" class="form-input" value="${satData.repeat_cycle_days || ''}" placeholder="Days">` :
                            `<span>${satData.repeat_cycle_days ? satData.repeat_cycle_days + ' days' : 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Revisit Time (days)</label>
                        ${isEditable ?
                            `<input type="number" id="sat-revisit" class="form-input" value="${satData.revisit_days || ''}" placeholder="Days">` :
                            `<span>${satData.revisit_days ? satData.revisit_days + ' days' : 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Local Time (equator)</label>
                        ${isEditable ?
                            `<input type="text" id="sat-localtime" class="form-input" value="${satData.local_time || ''}" placeholder="e.g., 10:30">` :
                            `<span>${satData.local_time || 'Not set'}</span>`
                        }
                    </div>
                </div>
            </div>

            <!-- Sensor Specifications -->
            <div class="detail-section">
                <h4><i class="fas fa-eye"></i> Sensor Specifications</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Sensor Name</label>
                        ${isEditable ?
                            `<input type="text" id="sat-sensor" class="form-input" value="${satData.sensor_name || ''}" placeholder="e.g., MSI, OLI">` :
                            `<span>${satData.sensor_name || 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Swath Width (km)</label>
                        ${isEditable ?
                            `<input type="number" id="sat-swath" class="form-input" value="${satData.swath_width_km || ''}" placeholder="km">` :
                            `<span>${satData.swath_width_km ? satData.swath_width_km + ' km' : 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Spatial Resolution (m)</label>
                        ${isEditable ?
                            `<input type="number" id="sat-resolution" class="form-input" value="${satData.native_resolution_m || ''}" placeholder="Meters">` :
                            `<span>${satData.native_resolution_m ? satData.native_resolution_m + ' m' : 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Spectral Bands</label>
                        ${isEditable ?
                            `<input type="number" id="sat-bands" class="form-input" value="${satData.num_spectral_bands || ''}" placeholder="Number of bands">` :
                            `<span>${satData.num_spectral_bands ? satData.num_spectral_bands + ' bands' : 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Radiometric Resolution</label>
                        ${isEditable ?
                            `<input type="number" id="sat-bitdepth" class="form-input" value="${satData.radiometric_resolution_bits || ''}" placeholder="Bits">` :
                            `<span>${satData.radiometric_resolution_bits ? satData.radiometric_resolution_bits + '-bit' : 'Not set'}</span>`
                        }
                    </div>
                </div>
            </div>

            <!-- Data Access -->
            <div class="detail-section">
                <h4><i class="fas fa-database"></i> Data Access</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Data Provider</label>
                        ${isEditable ?
                            `<input type="text" id="sat-provider" class="form-input" value="${satData.data_provider || ''}" placeholder="e.g., Copernicus Hub">` :
                            `<span>${satData.data_provider || 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Data Format</label>
                        ${isEditable ?
                            `<input type="text" id="sat-format" class="form-input" value="${satData.data_format || ''}" placeholder="e.g., GeoTIFF, JP2">` :
                            `<span>${satData.data_format || 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Processing Levels</label>
                        ${isEditable ?
                            `<input type="text" id="sat-levels" class="form-input" value="${satData.processing_levels || ''}" placeholder="e.g., L1C, L2A">` :
                            `<span>${satData.processing_levels || 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item full-width">
                        <label>Access URL</label>
                        ${isEditable ?
                            `<input type="url" id="sat-url" class="form-input" value="${satData.data_access_url || ''}" placeholder="https://...">` :
                            `<span>${satData.data_access_url ? `<a href="${satData.data_access_url}" target="_blank">${satData.data_access_url}</a>` : 'Not set'}</span>`
                        }
                    </div>
                </div>
            </div>

            <!-- Status -->
            <div class="detail-section">
                <h4><i class="fas fa-info-circle"></i> Status</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Launch Date</label>
                        ${isEditable ?
                            `<input type="date" id="sat-launch" class="form-input" value="${satData.launch_date || ''}">` :
                            `<span>${satData.launch_date || 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Operational Status</label>
                        ${isEditable ?
                            `<select id="sat-status" class="form-input">
                                <option value="operational" ${satData.operational_status === 'operational' ? 'selected' : ''}>Operational</option>
                                <option value="planned" ${satData.operational_status === 'planned' ? 'selected' : ''}>Planned</option>
                                <option value="decommissioned" ${satData.operational_status === 'decommissioned' ? 'selected' : ''}>Decommissioned</option>
                            </select>` :
                            `<span class="status-badge status-${satData.operational_status || 'unknown'}">${satData.operational_status || 'Unknown'}</span>`
                        }
                    </div>
                </div>
            </div>
        </div>
        `;
    }

    // =========================================================================
    // MOBILE PLATFORM MODAL
    // =========================================================================

    function buildMobilePlatformModal(platform, mobileData = {}, isEditable = false) {
        const carrierOptions = Object.entries(CARRIER_TYPES).map(([value, config]) =>
            `<option value="${value}" ${mobileData.carrier_type === value ? 'selected' : ''}>${config.label} - ${config.desc}</option>`
        ).join('');

        const powerOptions = POWER_TYPES.map(type =>
            `<option value="${type}" ${mobileData.power_type === type ? 'selected' : ''}>${type.charAt(0).toUpperCase() + type.slice(1)}</option>`
        ).join('');

        const surveyOptions = SURVEY_METHODS.map(method =>
            `<option value="${method}" ${mobileData.survey_method === method ? 'selected' : ''}>${method.charAt(0).toUpperCase() + method.slice(1)}</option>`
        ).join('');

        return `
        <div class="platform-detail-sections">
            <!-- Carrier Information -->
            <div class="detail-section">
                <h4><i class="fas fa-truck"></i> Carrier Information</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Carrier Type</label>
                        ${isEditable ?
                            `<select id="mobile-carrier-type" class="form-input" onchange="PlatformModals.onCarrierTypeChange()">
                                <option value="">Select carrier type...</option>
                                ${carrierOptions}
                            </select>` :
                            `<span><i class="fas ${CARRIER_TYPES[mobileData.carrier_type]?.icon || 'fa-question'}"></i> ${CARRIER_TYPES[mobileData.carrier_type]?.label || mobileData.carrier_type || 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Carrier Subtype</label>
                        ${isEditable ?
                            `<input type="text" id="mobile-carrier-subtype" class="form-input" value="${mobileData.carrier_subtype || ''}" placeholder="e.g., pickup truck, kayak">` :
                            `<span>${mobileData.carrier_subtype || 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Model/Description</label>
                        ${isEditable ?
                            `<input type="text" id="mobile-carrier-model" class="form-input" value="${mobileData.carrier_model || ''}" placeholder="Model or description">` :
                            `<span>${mobileData.carrier_model || 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Carrier ID</label>
                        ${isEditable ?
                            `<input type="text" id="mobile-carrier-id" class="form-input" value="${mobileData.carrier_id || ''}" placeholder="ID or registration">` :
                            `<span>${mobileData.carrier_id || 'Not set'}</span>`
                        }
                    </div>
                </div>
            </div>

            <!-- Mobility Characteristics -->
            <div class="detail-section">
                <h4><i class="fas fa-route"></i> Mobility Characteristics</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Typical Speed (km/h)</label>
                        ${isEditable ?
                            `<input type="number" id="mobile-speed" class="form-input" step="0.1" value="${mobileData.typical_speed_kmh || ''}" placeholder="km/h">` :
                            `<span>${mobileData.typical_speed_kmh ? mobileData.typical_speed_kmh + ' km/h' : 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Range (km)</label>
                        ${isEditable ?
                            `<input type="number" id="mobile-range" class="form-input" step="0.1" value="${mobileData.range_km || ''}" placeholder="km per survey">` :
                            `<span>${mobileData.range_km ? mobileData.range_km + ' km' : 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item full-width">
                        <label>Terrain Capability</label>
                        ${isEditable ?
                            `<div class="checkbox-group" id="mobile-terrain">
                                ${TERRAIN_OPTIONS.map(terrain => `
                                    <label class="checkbox-label">
                                        <input type="checkbox" name="terrain" value="${terrain}"
                                            ${(mobileData.terrain_capability || '').includes(terrain) ? 'checked' : ''}>
                                        ${terrain.charAt(0).toUpperCase() + terrain.slice(1)}
                                    </label>
                                `).join('')}
                            </div>` :
                            `<span>${mobileData.terrain_capability || 'Not specified'}</span>`
                        }
                    </div>
                </div>
            </div>

            <!-- Power System -->
            <div class="detail-section">
                <h4><i class="fas fa-battery-full"></i> Power System</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Power Type</label>
                        ${isEditable ?
                            `<select id="mobile-power" class="form-input">
                                <option value="">Select power type...</option>
                                ${powerOptions}
                            </select>` :
                            `<span>${mobileData.power_type ? mobileData.power_type.charAt(0).toUpperCase() + mobileData.power_type.slice(1) : 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Battery Capacity (Wh)</label>
                        ${isEditable ?
                            `<input type="number" id="mobile-battery" class="form-input" value="${mobileData.battery_capacity_wh || ''}" placeholder="Watt-hours">` :
                            `<span>${mobileData.battery_capacity_wh ? mobileData.battery_capacity_wh + ' Wh' : 'N/A'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Runtime (hours)</label>
                        ${isEditable ?
                            `<input type="number" id="mobile-runtime" class="form-input" step="0.1" value="${mobileData.runtime_hours || ''}" placeholder="Hours">` :
                            `<span>${mobileData.runtime_hours ? mobileData.runtime_hours + ' hrs' : 'Not set'}</span>`
                        }
                    </div>
                </div>
            </div>

            <!-- Equipment -->
            <div class="detail-section">
                <h4><i class="fas fa-microchip"></i> Mounted Equipment</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Primary Sensor</label>
                        ${isEditable ?
                            `<input type="text" id="mobile-sensor" class="form-input" value="${mobileData.primary_sensor || ''}" placeholder="Main sensor type">` :
                            `<span>${mobileData.primary_sensor || 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>GPS Model</label>
                        ${isEditable ?
                            `<input type="text" id="mobile-gps" class="form-input" value="${mobileData.gps_model || ''}" placeholder="GPS/GNSS model">` :
                            `<span>${mobileData.gps_model || 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Data Logger</label>
                        ${isEditable ?
                            `<input type="text" id="mobile-logger" class="form-input" value="${mobileData.data_logger || ''}" placeholder="Logger model">` :
                            `<span>${mobileData.data_logger || 'Not set'}</span>`
                        }
                    </div>
                </div>
            </div>

            <!-- Survey Method -->
            <div class="detail-section">
                <h4><i class="fas fa-clipboard-list"></i> Survey Method</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Survey Method</label>
                        ${isEditable ?
                            `<select id="mobile-survey" class="form-input">
                                <option value="">Select method...</option>
                                ${surveyOptions}
                            </select>` :
                            `<span>${mobileData.survey_method ? mobileData.survey_method.charAt(0).toUpperCase() + mobileData.survey_method.slice(1) : 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Logging Interval (sec)</label>
                        ${isEditable ?
                            `<input type="number" id="mobile-interval" class="form-input" value="${mobileData.logging_interval_sec || ''}" placeholder="Seconds">` :
                            `<span>${mobileData.logging_interval_sec ? mobileData.logging_interval_sec + ' sec' : 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item full-width">
                        <label>Typical Operating Area</label>
                        ${isEditable ?
                            `<textarea id="mobile-area" class="form-input" rows="2" placeholder="Description of usual survey area">${mobileData.typical_operating_area || ''}</textarea>` :
                            `<span>${mobileData.typical_operating_area || 'Not specified'}</span>`
                        }
                    </div>
                </div>
            </div>

            <!-- Maintenance -->
            <div class="detail-section">
                <h4><i class="fas fa-tools"></i> Usage & Maintenance</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Total Distance (km)</label>
                        ${isEditable ?
                            `<input type="number" id="mobile-distance" class="form-input" step="0.1" value="${mobileData.total_distance_km || ''}" placeholder="km">` :
                            `<span>${mobileData.total_distance_km ? mobileData.total_distance_km + ' km' : 'Not logged'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Total Hours</label>
                        ${isEditable ?
                            `<input type="number" id="mobile-hours" class="form-input" step="0.1" value="${mobileData.total_hours || ''}" placeholder="Hours">` :
                            `<span>${mobileData.total_hours ? mobileData.total_hours + ' hrs' : 'Not logged'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Last Maintenance</label>
                        ${isEditable ?
                            `<input type="date" id="mobile-maintenance" class="form-input" value="${mobileData.last_maintenance_date || ''}">` :
                            `<span>${mobileData.last_maintenance_date || 'Not logged'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Status</label>
                        ${isEditable ?
                            `<select id="platform-status" class="form-input">
                                <option value="Active" ${platform.status === 'Active' ? 'selected' : ''}>Active</option>
                                <option value="Maintenance" ${platform.status === 'Maintenance' ? 'selected' : ''}>Maintenance</option>
                                <option value="Inactive" ${platform.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                            </select>` :
                            `<span class="status-badge status-${(platform.status || 'unknown').toLowerCase()}">${platform.status || 'Unknown'}</span>`
                        }
                    </div>
                </div>
            </div>
        </div>
        `;
    }

    // =========================================================================
    // USV PLATFORM MODAL (Unmanned Surface Vehicle)
    // =========================================================================

    function buildUSVPlatformModal(platform, usvData = {}, isEditable = false) {
        return `
        <div class="platform-detail-sections">
            <!-- USV Identification -->
            <div class="detail-section">
                <h4><i class="fas fa-ship"></i> USV Identification</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Manufacturer</label>
                        ${isEditable ?
                            `<input type="text" id="usv-manufacturer" class="form-input" value="${usvData.manufacturer || ''}" placeholder="e.g., Clearpath, Maritime Robotics">` :
                            `<span>${usvData.manufacturer || 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Model</label>
                        ${isEditable ?
                            `<input type="text" id="usv-model" class="form-input" value="${usvData.usv_model || ''}" placeholder="Model name">` :
                            `<span>${usvData.usv_model || 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Serial Number</label>
                        ${isEditable ?
                            `<input type="text" id="usv-serial" class="form-input" value="${usvData.serial_number || ''}" placeholder="Serial number">` :
                            `<span>${usvData.serial_number || 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Hull Type</label>
                        ${isEditable ?
                            `<select id="usv-hull" class="form-input">
                                <option value="">Select hull type...</option>
                                <option value="monohull" ${usvData.hull_type === 'monohull' ? 'selected' : ''}>Monohull</option>
                                <option value="catamaran" ${usvData.hull_type === 'catamaran' ? 'selected' : ''}>Catamaran</option>
                                <option value="trimaran" ${usvData.hull_type === 'trimaran' ? 'selected' : ''}>Trimaran</option>
                                <option value="other" ${usvData.hull_type === 'other' ? 'selected' : ''}>Other</option>
                            </select>` :
                            `<span>${usvData.hull_type || 'Not set'}</span>`
                        }
                    </div>
                </div>
            </div>

            <!-- Physical Specifications -->
            <div class="detail-section">
                <h4><i class="fas fa-ruler"></i> Physical Specifications</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Length (m)</label>
                        ${isEditable ?
                            `<input type="number" id="usv-length" class="form-input" step="0.01" value="${usvData.length_m || ''}" placeholder="Meters">` :
                            `<span>${usvData.length_m ? usvData.length_m + ' m' : 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Beam (m)</label>
                        ${isEditable ?
                            `<input type="number" id="usv-beam" class="form-input" step="0.01" value="${usvData.beam_m || ''}" placeholder="Meters">` :
                            `<span>${usvData.beam_m ? usvData.beam_m + ' m' : 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Draft (m)</label>
                        ${isEditable ?
                            `<input type="number" id="usv-draft" class="form-input" step="0.01" value="${usvData.draft_m || ''}" placeholder="Meters">` :
                            `<span>${usvData.draft_m ? usvData.draft_m + ' m' : 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Payload Capacity (kg)</label>
                        ${isEditable ?
                            `<input type="number" id="usv-payload" class="form-input" step="0.1" value="${usvData.max_payload_kg || ''}" placeholder="kg">` :
                            `<span>${usvData.max_payload_kg ? usvData.max_payload_kg + ' kg' : 'Not set'}</span>`
                        }
                    </div>
                </div>
            </div>

            <!-- Performance -->
            <div class="detail-section">
                <h4><i class="fas fa-tachometer-alt"></i> Performance</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Max Speed (knots)</label>
                        ${isEditable ?
                            `<input type="number" id="usv-speed" class="form-input" step="0.1" value="${usvData.max_speed_knots || ''}" placeholder="Knots">` :
                            `<span>${usvData.max_speed_knots ? usvData.max_speed_knots + ' kn' : 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Endurance (hours)</label>
                        ${isEditable ?
                            `<input type="number" id="usv-endurance" class="form-input" step="0.1" value="${usvData.endurance_hours || ''}" placeholder="Hours">` :
                            `<span>${usvData.endurance_hours ? usvData.endurance_hours + ' hrs' : 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Range (NM)</label>
                        ${isEditable ?
                            `<input type="number" id="usv-range" class="form-input" step="0.1" value="${usvData.range_nm || ''}" placeholder="Nautical miles">` :
                            `<span>${usvData.range_nm ? usvData.range_nm + ' NM' : 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Max Wave Height (m)</label>
                        ${isEditable ?
                            `<input type="number" id="usv-wave" class="form-input" step="0.1" value="${usvData.max_wave_height_m || ''}" placeholder="Meters">` :
                            `<span>${usvData.max_wave_height_m ? usvData.max_wave_height_m + ' m' : 'Not set'}</span>`
                        }
                    </div>
                </div>
            </div>

            <!-- Navigation & Control -->
            <div class="detail-section">
                <h4><i class="fas fa-satellite-dish"></i> Navigation & Control</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Navigation System</label>
                        ${isEditable ?
                            `<input type="text" id="usv-nav" class="form-input" value="${usvData.navigation_system || ''}" placeholder="e.g., GPS+GLONASS">` :
                            `<span>${usvData.navigation_system || 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Control Mode</label>
                        ${isEditable ?
                            `<select id="usv-control" class="form-input">
                                <option value="">Select mode...</option>
                                <option value="autonomous" ${usvData.control_mode === 'autonomous' ? 'selected' : ''}>Autonomous</option>
                                <option value="remote" ${usvData.control_mode === 'remote' ? 'selected' : ''}>Remote Control</option>
                                <option value="hybrid" ${usvData.control_mode === 'hybrid' ? 'selected' : ''}>Hybrid</option>
                            </select>` :
                            `<span>${usvData.control_mode || 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>RTK Capable</label>
                        ${isEditable ?
                            `<select id="usv-rtk" class="form-input">
                                <option value="0" ${!usvData.rtk_capable ? 'selected' : ''}>No</option>
                                <option value="1" ${usvData.rtk_capable ? 'selected' : ''}>Yes</option>
                            </select>` :
                            `<span>${usvData.rtk_capable ? 'Yes' : 'No'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>AIS Equipped</label>
                        ${isEditable ?
                            `<select id="usv-ais" class="form-input">
                                <option value="0" ${!usvData.ais_equipped ? 'selected' : ''}>No</option>
                                <option value="1" ${usvData.ais_equipped ? 'selected' : ''}>Yes</option>
                            </select>` :
                            `<span>${usvData.ais_equipped ? 'Yes' : 'No'}</span>`
                        }
                    </div>
                </div>
            </div>

            <!-- Sensors -->
            <div class="detail-section">
                <h4><i class="fas fa-microchip"></i> Sensors</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Primary Sensor</label>
                        ${isEditable ?
                            `<input type="text" id="usv-sensor" class="form-input" value="${usvData.primary_sensor || ''}" placeholder="Main sensor">` :
                            `<span>${usvData.primary_sensor || 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Sonar System</label>
                        ${isEditable ?
                            `<input type="text" id="usv-sonar" class="form-input" value="${usvData.sonar_system || ''}" placeholder="Echo sounder model">` :
                            `<span>${usvData.sonar_system || 'None'}</span>`
                        }
                    </div>
                    <div class="detail-item full-width">
                        <label>Water Quality Sensors</label>
                        ${isEditable ?
                            `<input type="text" id="usv-wq" class="form-input" value="${usvData.water_quality_sensors || ''}" placeholder="Water quality sensor suite">` :
                            `<span>${usvData.water_quality_sensors || 'None'}</span>`
                        }
                    </div>
                </div>
            </div>

            <!-- Maintenance -->
            <div class="detail-section">
                <h4><i class="fas fa-tools"></i> Maintenance & Status</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Total Hours</label>
                        ${isEditable ?
                            `<input type="number" id="usv-hours" class="form-input" step="0.1" value="${usvData.total_hours || ''}" placeholder="Hours">` :
                            `<span>${usvData.total_hours ? usvData.total_hours + ' hrs' : 'Not logged'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Last Maintenance</label>
                        ${isEditable ?
                            `<input type="date" id="usv-maintenance" class="form-input" value="${usvData.last_maintenance_date || ''}">` :
                            `<span>${usvData.last_maintenance_date || 'Not logged'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Status</label>
                        ${isEditable ?
                            `<select id="platform-status" class="form-input">
                                <option value="Active" ${platform.status === 'Active' ? 'selected' : ''}>Active</option>
                                <option value="Maintenance" ${platform.status === 'Maintenance' ? 'selected' : ''}>Maintenance</option>
                                <option value="Inactive" ${platform.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                            </select>` :
                            `<span class="status-badge status-${(platform.status || 'unknown').toLowerCase()}">${platform.status || 'Unknown'}</span>`
                        }
                    </div>
                </div>
            </div>
        </div>
        `;
    }

    // =========================================================================
    // UUV PLATFORM MODAL (Unmanned Underwater Vehicle)
    // =========================================================================

    function buildUUVPlatformModal(platform, uuvData = {}, isEditable = false) {
        return `
        <div class="platform-detail-sections">
            <!-- UUV Identification -->
            <div class="detail-section">
                <h4><i class="fas fa-water"></i> UUV Identification</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Manufacturer</label>
                        ${isEditable ?
                            `<input type="text" id="uuv-manufacturer" class="form-input" value="${uuvData.manufacturer || ''}" placeholder="e.g., BlueROV, Kongsberg">` :
                            `<span>${uuvData.manufacturer || 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Model</label>
                        ${isEditable ?
                            `<input type="text" id="uuv-model" class="form-input" value="${uuvData.uuv_model || ''}" placeholder="Model name">` :
                            `<span>${uuvData.uuv_model || 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>UUV Type</label>
                        ${isEditable ?
                            `<select id="uuv-type" class="form-input">
                                <option value="">Select type...</option>
                                <option value="rov" ${uuvData.uuv_type === 'rov' ? 'selected' : ''}>ROV (Tethered)</option>
                                <option value="auv" ${uuvData.uuv_type === 'auv' ? 'selected' : ''}>AUV (Autonomous)</option>
                                <option value="hybrid" ${uuvData.uuv_type === 'hybrid' ? 'selected' : ''}>Hybrid</option>
                            </select>` :
                            `<span>${uuvData.uuv_type ? uuvData.uuv_type.toUpperCase() : 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Serial Number</label>
                        ${isEditable ?
                            `<input type="text" id="uuv-serial" class="form-input" value="${uuvData.serial_number || ''}" placeholder="Serial number">` :
                            `<span>${uuvData.serial_number || 'Not set'}</span>`
                        }
                    </div>
                </div>
            </div>

            <!-- Depth Rating -->
            <div class="detail-section">
                <h4><i class="fas fa-arrows-alt-v"></i> Depth Rating</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Max Operating Depth (m)</label>
                        ${isEditable ?
                            `<input type="number" id="uuv-max-depth" class="form-input" value="${uuvData.max_depth_m || ''}" placeholder="Meters">` :
                            `<span>${uuvData.max_depth_m ? uuvData.max_depth_m + ' m' : 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Typical Operating Depth (m)</label>
                        ${isEditable ?
                            `<input type="number" id="uuv-typical-depth" class="form-input" value="${uuvData.typical_depth_m || ''}" placeholder="Meters">` :
                            `<span>${uuvData.typical_depth_m ? uuvData.typical_depth_m + ' m' : 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Crush Depth (m)</label>
                        ${isEditable ?
                            `<input type="number" id="uuv-crush" class="form-input" value="${uuvData.crush_depth_m || ''}" placeholder="Meters">` :
                            `<span>${uuvData.crush_depth_m ? uuvData.crush_depth_m + ' m' : 'Not set'}</span>`
                        }
                    </div>
                </div>
            </div>

            <!-- Physical Specifications -->
            <div class="detail-section">
                <h4><i class="fas fa-ruler"></i> Physical Specifications</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Length (m)</label>
                        ${isEditable ?
                            `<input type="number" id="uuv-length" class="form-input" step="0.01" value="${uuvData.length_m || ''}" placeholder="Meters">` :
                            `<span>${uuvData.length_m ? uuvData.length_m + ' m' : 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Width (m)</label>
                        ${isEditable ?
                            `<input type="number" id="uuv-width" class="form-input" step="0.01" value="${uuvData.width_m || ''}" placeholder="Meters">` :
                            `<span>${uuvData.width_m ? uuvData.width_m + ' m' : 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Weight in Air (kg)</label>
                        ${isEditable ?
                            `<input type="number" id="uuv-weight-air" class="form-input" step="0.1" value="${uuvData.weight_air_kg || ''}" placeholder="kg">` :
                            `<span>${uuvData.weight_air_kg ? uuvData.weight_air_kg + ' kg' : 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Payload Capacity (kg)</label>
                        ${isEditable ?
                            `<input type="number" id="uuv-payload" class="form-input" step="0.1" value="${uuvData.max_payload_kg || ''}" placeholder="kg">` :
                            `<span>${uuvData.max_payload_kg ? uuvData.max_payload_kg + ' kg' : 'Not set'}</span>`
                        }
                    </div>
                </div>
            </div>

            <!-- Propulsion & Performance -->
            <div class="detail-section">
                <h4><i class="fas fa-tachometer-alt"></i> Propulsion & Performance</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Number of Thrusters</label>
                        ${isEditable ?
                            `<input type="number" id="uuv-thrusters" class="form-input" value="${uuvData.num_thrusters || ''}" placeholder="Number">` :
                            `<span>${uuvData.num_thrusters || 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Max Speed (knots)</label>
                        ${isEditable ?
                            `<input type="number" id="uuv-speed" class="form-input" step="0.1" value="${uuvData.max_speed_knots || ''}" placeholder="Knots">` :
                            `<span>${uuvData.max_speed_knots ? uuvData.max_speed_knots + ' kn' : 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Endurance (hours)</label>
                        ${isEditable ?
                            `<input type="number" id="uuv-endurance" class="form-input" step="0.1" value="${uuvData.endurance_hours || ''}" placeholder="Hours">` :
                            `<span>${uuvData.endurance_hours ? uuvData.endurance_hours + ' hrs' : 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Tether Length (m)</label>
                        ${isEditable ?
                            `<input type="number" id="uuv-tether" class="form-input" value="${uuvData.tether_length_m || ''}" placeholder="Meters (ROV only)">` :
                            `<span>${uuvData.tether_length_m ? uuvData.tether_length_m + ' m' : 'N/A'}</span>`
                        }
                    </div>
                </div>
            </div>

            <!-- Sensors & Cameras -->
            <div class="detail-section">
                <h4><i class="fas fa-video"></i> Sensors & Cameras</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Primary Camera</label>
                        ${isEditable ?
                            `<input type="text" id="uuv-camera" class="form-input" value="${uuvData.primary_camera || ''}" placeholder="Main camera">` :
                            `<span>${uuvData.primary_camera || 'Not set'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Sonar System</label>
                        ${isEditable ?
                            `<input type="text" id="uuv-sonar" class="form-input" value="${uuvData.sonar_system || ''}" placeholder="Sonar model">` :
                            `<span>${uuvData.sonar_system || 'None'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Multibeam Sonar</label>
                        ${isEditable ?
                            `<input type="text" id="uuv-multibeam" class="form-input" value="${uuvData.multibeam_sonar || ''}" placeholder="Multibeam model">` :
                            `<span>${uuvData.multibeam_sonar || 'None'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Lighting (lumens)</label>
                        ${isEditable ?
                            `<input type="number" id="uuv-lumens" class="form-input" value="${uuvData.total_lumens || ''}" placeholder="Total lumens">` :
                            `<span>${uuvData.total_lumens ? uuvData.total_lumens + ' lm' : 'Not set'}</span>`
                        }
                    </div>
                </div>
            </div>

            <!-- Manipulator (for ROVs) -->
            <div class="detail-section">
                <h4><i class="fas fa-hand-rock"></i> Manipulator</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Manipulator Type</label>
                        ${isEditable ?
                            `<select id="uuv-manip-type" class="form-input">
                                <option value="none" ${uuvData.manipulator_type === 'none' ? 'selected' : ''}>None</option>
                                <option value="grabber" ${uuvData.manipulator_type === 'grabber' ? 'selected' : ''}>Grabber</option>
                                <option value="arm" ${uuvData.manipulator_type === 'arm' ? 'selected' : ''}>Robotic Arm</option>
                            </select>` :
                            `<span>${uuvData.manipulator_type || 'None'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Reach (m)</label>
                        ${isEditable ?
                            `<input type="number" id="uuv-manip-reach" class="form-input" step="0.1" value="${uuvData.manipulator_reach_m || ''}" placeholder="Meters">` :
                            `<span>${uuvData.manipulator_reach_m ? uuvData.manipulator_reach_m + ' m' : 'N/A'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Payload (kg)</label>
                        ${isEditable ?
                            `<input type="number" id="uuv-manip-payload" class="form-input" step="0.1" value="${uuvData.manipulator_payload_kg || ''}" placeholder="kg">` :
                            `<span>${uuvData.manipulator_payload_kg ? uuvData.manipulator_payload_kg + ' kg' : 'N/A'}</span>`
                        }
                    </div>
                </div>
            </div>

            <!-- Maintenance -->
            <div class="detail-section">
                <h4><i class="fas fa-tools"></i> Maintenance & Status</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Total Hours</label>
                        ${isEditable ?
                            `<input type="number" id="uuv-hours" class="form-input" step="0.1" value="${uuvData.total_hours || ''}" placeholder="Hours">` :
                            `<span>${uuvData.total_hours ? uuvData.total_hours + ' hrs' : 'Not logged'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Total Dives</label>
                        ${isEditable ?
                            `<input type="number" id="uuv-dives" class="form-input" value="${uuvData.total_dives || ''}" placeholder="Number of dives">` :
                            `<span>${uuvData.total_dives || 'Not logged'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Last Maintenance</label>
                        ${isEditable ?
                            `<input type="date" id="uuv-maintenance" class="form-input" value="${uuvData.last_maintenance_date || ''}">` :
                            `<span>${uuvData.last_maintenance_date || 'Not logged'}</span>`
                        }
                    </div>
                    <div class="detail-item">
                        <label>Status</label>
                        ${isEditable ?
                            `<select id="platform-status" class="form-input">
                                <option value="Active" ${platform.status === 'Active' ? 'selected' : ''}>Active</option>
                                <option value="Maintenance" ${platform.status === 'Maintenance' ? 'selected' : ''}>Maintenance</option>
                                <option value="Inactive" ${platform.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                            </select>` :
                            `<span class="status-badge status-${(platform.status || 'unknown').toLowerCase()}">${platform.status || 'Unknown'}</span>`
                        }
                    </div>
                </div>
            </div>
        </div>
        `;
    }

    // =========================================================================
    // MAIN ROUTER
    // =========================================================================

    function buildPlatformModal(platform, extensionData = {}, isEditable = false) {
        const platformType = platform.platform_type || 'fixed';

        switch (platformType) {
            case 'usv':
                return buildUSVPlatformModal(platform, extensionData, isEditable);
            case 'uuv':
                return buildUUVPlatformModal(platform, extensionData, isEditable);
            case 'uav':
                return buildUAVPlatformModal(platform, extensionData, isEditable);
            case 'satellite':
                return buildSatellitePlatformModal(platform, extensionData, isEditable);
            case 'mobile':
                return buildMobilePlatformModal(platform, extensionData, isEditable);
            case 'fixed':
            default:
                return buildFixedPlatformModal(platform, isEditable);
        }
    }

    // =========================================================================
    // HELPER FUNCTIONS
    // =========================================================================

    function onCarrierTypeChange() {
        const carrierType = document.getElementById('mobile-carrier-type')?.value;
        // Update platform normalized name if function exists
        if (typeof updatePlatformNormalizedName === 'function') {
            updatePlatformNormalizedName();
        }
    }

    function getCarrierCode(carrierType) {
        return CARRIER_CODES[carrierType] || 'OTH';
    }

    // =========================================================================
    // PUBLIC API
    // =========================================================================

    return {
        buildPlatformModal,
        buildFixedPlatformModal,
        buildUAVPlatformModal,
        buildSatellitePlatformModal,
        buildMobilePlatformModal,
        onCarrierTypeChange,
        getCarrierCode,
        CARRIER_TYPES,
        CARRIER_CODES,
        TERRAIN_OPTIONS,
        POWER_TYPES,
        SURVEY_METHODS
    };

})();
