/**
 * Position & Orientation Section
 * SITES Spectral v8.0.0-alpha.2
 *
 * Config-driven section for instrument position and orientation:
 * - Latitude/Longitude with map preview
 * - Height above ground
 * - Viewing direction
 * - Azimuth angle
 * - Tilt angle (degrees from nadir)
 *
 * Features:
 * - Real-time map marker updates
 * - Coordinate validation
 * - WGS84 decimal degrees
 */

class PositionSection {
    /**
     * Render position and orientation section
     * @param {Object} instrument - Instrument data
     * @param {Object} config - Configuration from YAML
     * @returns {string} HTML string
     */
    static render(instrument, config = {}) {
        const viewingDirections = PositionSection._getViewingDirections(config);

        return `
            <div class="form-section" data-section="position">
                <h4 class="form-section-header" onclick="toggleSection(this)">
                    <i class="fas fa-map-marker-alt" aria-hidden="true"></i>
                    <span>Position & Orientation</span>
                    <i class="fas fa-chevron-down section-toggle-icon" aria-hidden="true"></i>
                </h4>
                <div class="form-section-content">
                    ${PositionSection._renderCoordinates(instrument)}

                    ${FormField.number({
                        id: 'edit-instrument-height',
                        label: 'Height Above Ground (m)',
                        value: instrument.instrument_height_m || instrument.height_above_ground_m || '',
                        min: 0,
                        step: 0.1,
                        placeholder: 'e.g., 2.5',
                        helpText: 'Vertical distance from ground to instrument sensor'
                    })}

                    ${FormField.select({
                        id: 'edit-instrument-viewing-direction',
                        label: 'Viewing Direction',
                        value: instrument.viewing_direction || '',
                        options: viewingDirections,
                        helpText: 'Primary direction the instrument is pointing'
                    })}

                    ${FormField.number({
                        id: 'edit-instrument-azimuth',
                        label: 'Azimuth Angle (°)',
                        value: instrument.azimuth_degrees || '',
                        min: 0,
                        max: 360,
                        step: 0.1,
                        placeholder: '0-360 degrees',
                        helpText: 'Clockwise from North (0° = North, 90° = East, 180° = South, 270° = West)'
                    })}

                    ${FormField.number({
                        id: 'edit-instrument-nadir',
                        label: 'Tilt Angle (° from Nadir)',
                        value: instrument.degrees_from_nadir || instrument.tilt_degrees || '',
                        min: 0,
                        max: 90,
                        step: 0.1,
                        placeholder: '0-90 degrees',
                        helpText: '0° = straight down (nadir), 90° = horizontal'
                    })}

                    ${PositionSection._renderMapPreview(instrument)}
                </div>
            </div>
        `;
    }

    /**
     * Render coordinate input fields
     * @private
     */
    static _renderCoordinates(instrument) {
        return FormField.coordinates({
            idPrefix: 'edit-instrument',
            latValue: instrument.latitude || '',
            lonValue: instrument.longitude || '',
            required: false,
            readonly: false,
            helpText: 'Decimal degrees (WGS84), rounded to 6 decimal places',
            showMap: true
        });
    }

    /**
     * Render map preview (if coordinates available)
     * @private
     */
    static _renderMapPreview(instrument) {
        const hasCoords = instrument.latitude && instrument.longitude;

        return `
            <div id="position-map-container" class="map-preview-container" style="${hasCoords ? '' : 'display: none;'}">
                <label>Location Preview</label>
                <div id="position-map" class="position-map" style="height: 300px; border-radius: var(--radius-md); overflow: hidden;">
                    <!-- Map will be initialized here via MapHelper -->
                </div>
                <small class="form-text">
                    <i class="fas fa-info-circle"></i>
                    Map updates automatically when coordinates change
                </small>
            </div>
        `;
    }

    /**
     * Get viewing direction options from config
     * @private
     */
    static _getViewingDirections(config) {
        const defaultDirections = [
            { value: '', label: 'Select direction...' },
            { group: 'Cardinal Directions', options: [
                { value: 'North', label: 'North' },
                { value: 'Northeast', label: 'Northeast' },
                { value: 'East', label: 'East' },
                { value: 'Southeast', label: 'Southeast' },
                { value: 'South', label: 'South' },
                { value: 'Southwest', label: 'Southwest' },
                { value: 'West', label: 'West' },
                { value: 'Northwest', label: 'Northwest' }
            ]},
            { group: 'Vertical Orientations', options: [
                { value: 'Nadir', label: 'Nadir (Downward)' },
                { value: 'Zenith', label: 'Zenith (Upward)' }
            ]}
        ];

        if (config.viewingDirections && Array.isArray(config.viewingDirections)) {
            return [
                { value: '', label: 'Select direction...' },
                ...config.viewingDirections.map(dir => ({
                    value: dir.value || dir,
                    label: dir.label || dir.value || dir
                }))
            ];
        }

        return defaultDirections;
    }

    /**
     * Initialize map (called after section is rendered)
     * @param {Object} instrument - Instrument data
     * @param {string} mapContainerId - Map container element ID
     */
    static initializeMap(instrument, mapContainerId = 'position-map') {
        if (!instrument.latitude || !instrument.longitude) {
            return;
        }

        // Check if Leaflet is available
        if (typeof L === 'undefined') {
            console.warn('Leaflet library not loaded. Map preview disabled.');
            return;
        }

        const mapContainer = document.getElementById(mapContainerId);
        if (!mapContainer) {
            return;
        }

        // Initialize map
        const map = L.map(mapContainerId).setView(
            [instrument.latitude, instrument.longitude],
            13
        );

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map);

        // Add marker
        const marker = L.marker([instrument.latitude, instrument.longitude]).addTo(map);

        if (instrument.display_name) {
            marker.bindPopup(`<b>${instrument.display_name}</b>`).openPopup();
        }

        // Update marker when coordinates change
        const latInput = document.getElementById('edit-instrument-latitude');
        const lonInput = document.getElementById('edit-instrument-longitude');

        if (latInput && lonInput) {
            const updateMarker = () => {
                const lat = parseFloat(latInput.value);
                const lon = parseFloat(lonInput.value);

                if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
                    marker.setLatLng([lat, lon]);
                    map.setView([lat, lon], map.getZoom());

                    // Show map container if hidden
                    const container = document.getElementById('position-map-container');
                    if (container && container.style.display === 'none') {
                        container.style.display = 'block';
                    }
                }
            };

            latInput.addEventListener('input', updateMarker);
            lonInput.addEventListener('input', updateMarker);
        }

        return map;
    }

    /**
     * Extract form data from section
     * @param {HTMLElement} sectionElement - Section DOM element
     * @returns {Object} Form data
     */
    static extractData(sectionElement) {
        if (!sectionElement) return {};

        const lat = document.getElementById('edit-instrument-latitude')?.value;
        const lon = document.getElementById('edit-instrument-longitude')?.value;

        return {
            latitude: lat ? parseFloat(lat) : null,
            longitude: lon ? parseFloat(lon) : null,
            instrument_height_m: parseFloat(document.getElementById('edit-instrument-height')?.value) || null,
            viewing_direction: document.getElementById('edit-instrument-viewing-direction')?.value || null,
            azimuth_degrees: parseFloat(document.getElementById('edit-instrument-azimuth')?.value) || null,
            degrees_from_nadir: parseFloat(document.getElementById('edit-instrument-nadir')?.value) || null
        };
    }

    /**
     * Validate section data
     * @param {Object} data - Data to validate
     * @returns {Object} { valid: boolean, errors: Array }
     */
    static validate(data) {
        const errors = [];

        // Validate latitude
        if (data.latitude !== null && data.latitude !== undefined) {
            if (isNaN(data.latitude) || data.latitude < -90 || data.latitude > 90) {
                errors.push('Latitude must be between -90 and 90 degrees');
            }
        }

        // Validate longitude
        if (data.longitude !== null && data.longitude !== undefined) {
            if (isNaN(data.longitude) || data.longitude < -180 || data.longitude > 180) {
                errors.push('Longitude must be between -180 and 180 degrees');
            }
        }

        // Validate height
        if (data.instrument_height_m !== null && data.instrument_height_m < 0) {
            errors.push('Height cannot be negative');
        }

        // Validate azimuth
        if (data.azimuth_degrees !== null) {
            if (isNaN(data.azimuth_degrees) || data.azimuth_degrees < 0 || data.azimuth_degrees > 360) {
                errors.push('Azimuth must be between 0 and 360 degrees');
            }
        }

        // Validate nadir angle
        if (data.degrees_from_nadir !== null) {
            if (isNaN(data.degrees_from_nadir) || data.degrees_from_nadir < 0 || data.degrees_from_nadir > 90) {
                errors.push('Tilt angle must be between 0 and 90 degrees');
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}

// Export for module systems and make globally available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PositionSection;
}
if (typeof window !== 'undefined') {
    window.PositionSection = PositionSection;
}
