/**
 * Modal Sections - Shared Form Sections for Instrument Modals
 * SITES Spectral Stations & Instruments v7.0.0
 *
 * These sections are shared across multiple instrument types,
 * reducing duplication from ~1,500 lines to ~300 lines.
 *
 * Architecture: DRY principle applied to form sections
 * - Each section is a pure function returning HTML string
 * - Sections compose together to build type-specific modals
 * - Easy to modify one section and have it apply everywhere
 */

// ============================================================================
// CONSTANTS - Status and dropdown options
// ============================================================================

const ENTITY_STATUS_OPTIONS = [
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' },
    { value: 'Testing', label: 'Testing' },
    { value: 'Maintenance', label: 'Maintenance' },
    { value: 'Decommissioned', label: 'Decommissioned' },
    { value: 'Planned', label: 'Planned' }
];

const MEASUREMENT_STATUS_OPTIONS = [
    { value: '', label: 'Select status...' },
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' },
    { value: 'Intermittent', label: 'Intermittent' },
    { value: 'Seasonal', label: 'Seasonal' },
    { value: 'Completed', label: 'Completed' }
];

const ECOSYSTEM_CODES = [
    { value: '', label: 'Select ecosystem...' },
    { value: 'HEA', label: 'HEA - Heathland' },
    { value: 'AGR', label: 'AGR - Arable Land' },
    { value: 'MIR', label: 'MIR - Mires' },
    { value: 'LAK', label: 'LAK - Lake' },
    { value: 'WET', label: 'WET - Wetland' },
    { value: 'GRA', label: 'GRA - Grassland' },
    { value: 'FOR', label: 'FOR - Forest' },
    { value: 'ALP', label: 'ALP - Alpine Forest' },
    { value: 'CON', label: 'CON - Coniferous Forest' },
    { value: 'DEC', label: 'DEC - Deciduous Forest' },
    { value: 'MAR', label: 'MAR - Marshland' },
    { value: 'PEA', label: 'PEA - Peatland' }
];

const POWER_SOURCE_OPTIONS = [
    { value: '', label: 'Select power source...' },
    { value: 'Solar', label: '☀️ Solar' },
    { value: 'Grid', label: '🔌 Grid' },
    { value: 'Battery', label: '🔋 Battery' },
    { value: 'Solar + Battery', label: '☀️🔋 Solar + Battery' },
    { value: 'Other', label: 'Other' }
];

const DATA_TRANSMISSION_OPTIONS = [
    { value: '', label: 'Select transmission method...' },
    { value: 'WiFi', label: '📡 WiFi' },
    { value: 'Ethernet', label: '🔗 Ethernet' },
    { value: 'Cellular', label: '📱 Cellular' },
    { value: 'LoRaWAN', label: '📻 LoRaWAN' },
    { value: 'SD Card', label: '💾 SD Card' },
    { value: 'Other', label: 'Other' }
];

const INSTRUMENT_TYPES = [
    { value: '', label: 'Select type...' },
    { value: 'Phenocam', label: 'Phenocam' },
    { group: 'Multispectral Sensors (Fixed Platform - MS)', options: [
        { value: 'SKYE MultiSpectral Sensor (Uplooking)', label: 'SKYE MultiSpectral (Uplooking)' },
        { value: 'SKYE MultiSpectral Sensor (Downlooking)', label: 'SKYE MultiSpectral (Downlooking)' },
        { value: 'Decagon Sensor (Uplooking)', label: 'Decagon (Uplooking)' },
        { value: 'Decagon Sensor (Downlooking)', label: 'Decagon (Downlooking)' },
        { value: 'Apogee MS', label: 'Apogee MS' }
    ]},
    { group: 'PRI & NDVI Sensors', options: [
        { value: 'PRI Sensor (2-band ~530nm/~570nm)', label: 'PRI Sensor (2-band ~530nm/~570nm)' },
        { value: 'NDVI Sensor', label: 'NDVI Sensor' },
        { value: 'Apogee NDVI', label: 'Apogee NDVI' }
    ]},
    { group: 'PAR Sensors', options: [
        { value: 'PAR Sensor', label: 'PAR Sensor' },
        { value: 'Apogee PAR', label: 'Apogee PAR' }
    ]},
    { value: 'Other', label: 'Other' }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Build select options HTML from array
 */
function buildSelectOptions(options, selectedValue) {
    return options.map(opt => {
        if (opt.group) {
            const groupOptions = opt.options.map(o =>
                `<option value="${o.value}" ${o.value === selectedValue ? 'selected' : ''}>${o.label}</option>`
            ).join('');
            return `<optgroup label="${opt.group}">${groupOptions}</optgroup>`;
        }
        return `<option value="${opt.value}" ${opt.value === selectedValue ? 'selected' : ''}>${opt.label}</option>`;
    }).join('');
}

/**
 * Check if value is in standard list (for "Other" detection)
 */
function isStandardValue(value, standardValues) {
    if (!value) return true;
    return standardValues.includes(value);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ============================================================================
// SECTION 1: GENERAL INFORMATION (shared by all instrument types)
// ============================================================================

function renderGeneralInfoSection(instrument) {
    return `
    <div class="form-section">
        <h4 onclick="toggleSection(this)"><i class="fas fa-info-circle"></i> General Information</h4>
        <div class="form-section-content">
            <div class="form-group">
                <label>Instrument Name <span style="color: #ef4444;">*</span></label>
                <input type="text" id="edit-instrument-name" value="${escapeHtml(instrument.display_name)}"
                       class="form-control" required aria-label="Instrument Name"
                       aria-describedby="name-help">
            </div>
            <div class="form-group">
                <label>Normalized ID</label>
                <input type="text" id="edit-instrument-normalized" value="${escapeHtml(instrument.normalized_name)}"
                       class="form-control field-readonly" readonly aria-label="Normalized ID"
                       tabindex="-1">
                <small class="form-text" id="normalized-help">System-generated identifier</small>
            </div>
            <div class="form-group">
                <label>Legacy Acronym</label>
                <input type="text" id="edit-instrument-legacy" value="${escapeHtml(instrument.legacy_acronym)}"
                       class="form-control" placeholder="e.g., ANS-FOR-P01" aria-label="Legacy Acronym">
                <small class="form-text">Historical data compatibility</small>
            </div>
            <div class="form-group">
                <label id="status-label">Status</label>
                <select id="edit-instrument-status" class="form-control" aria-labelledby="status-label">
                    ${buildSelectOptions(ENTITY_STATUS_OPTIONS, instrument.status)}
                </select>
            </div>
            <div class="form-group">
                <label id="measurement-status-label">Measurement Status</label>
                <select id="edit-instrument-measurement-status" class="form-control" aria-labelledby="measurement-status-label">
                    ${buildSelectOptions(MEASUREMENT_STATUS_OPTIONS, instrument.measurement_status)}
                </select>
            </div>
        </div>
    </div>
    `;
}

// ============================================================================
// SECTION 3: POSITION & ORIENTATION (shared by all instrument types)
// ============================================================================

function renderPositionSection(instrument) {
    return `
    <div class="form-section">
        <h4 onclick="toggleSection(this)"><i class="fas fa-map-marker-alt"></i> Position & Orientation</h4>
        <div class="form-section-content">
            <div class="form-group">
                <label>Latitude</label>
                <input type="number" id="edit-instrument-latitude" value="${instrument.latitude || ''}"
                       class="form-control" step="any" placeholder="Decimal degrees" aria-label="Latitude"
                       min="-90" max="90">
                <small class="form-text">Rounded to 6 decimal places (WGS84)</small>
            </div>
            <div class="form-group">
                <label>Longitude</label>
                <input type="number" id="edit-instrument-longitude" value="${instrument.longitude || ''}"
                       class="form-control" step="any" placeholder="Decimal degrees" aria-label="Longitude"
                       min="-180" max="180">
                <small class="form-text">Rounded to 6 decimal places (WGS84)</small>
            </div>
            <div class="form-group">
                <label>Height Above Ground (m)</label>
                <input type="number" id="edit-instrument-height" value="${instrument.instrument_height_m || ''}"
                       class="form-control" step="0.1" min="0" placeholder="e.g., 2.5" aria-label="Height Above Ground">
            </div>
            <div class="form-group">
                <label>Viewing Direction</label>
                <select id="edit-instrument-viewing-direction" class="form-control" aria-label="Viewing Direction">
                    <option value="">Select direction...</option>
                    <option value="North" ${instrument.viewing_direction === 'North' ? 'selected' : ''}>North</option>
                    <option value="Northeast" ${instrument.viewing_direction === 'Northeast' ? 'selected' : ''}>Northeast</option>
                    <option value="East" ${instrument.viewing_direction === 'East' ? 'selected' : ''}>East</option>
                    <option value="Southeast" ${instrument.viewing_direction === 'Southeast' ? 'selected' : ''}>Southeast</option>
                    <option value="South" ${instrument.viewing_direction === 'South' ? 'selected' : ''}>South</option>
                    <option value="Southwest" ${instrument.viewing_direction === 'Southwest' ? 'selected' : ''}>Southwest</option>
                    <option value="West" ${instrument.viewing_direction === 'West' ? 'selected' : ''}>West</option>
                    <option value="Northwest" ${instrument.viewing_direction === 'Northwest' ? 'selected' : ''}>Northwest</option>
                    <option value="Nadir" ${instrument.viewing_direction === 'Nadir' ? 'selected' : ''}>Nadir (Downward)</option>
                    <option value="Zenith" ${instrument.viewing_direction === 'Zenith' ? 'selected' : ''}>Zenith (Upward)</option>
                </select>
            </div>
            <div class="form-group">
                <label>Azimuth Angle (°)</label>
                <input type="number" id="edit-instrument-azimuth" value="${instrument.azimuth_degrees || ''}"
                       class="form-control" step="0.1" min="0" max="360" placeholder="0-360 degrees" aria-label="Azimuth Angle">
                <small class="form-text">Clockwise from North (0° = North)</small>
            </div>
            <div class="form-group">
                <label>Degrees from Nadir</label>
                <input type="number" id="edit-instrument-nadir" value="${instrument.degrees_from_nadir || ''}"
                       class="form-control" step="0.1" min="0" max="90" placeholder="0-90 degrees" aria-label="Degrees from Nadir">
                <small class="form-text">0° = straight down, 90° = horizontal</small>
            </div>
        </div>
    </div>
    `;
}

// ============================================================================
// SECTION 4: TIMELINE & DEPLOYMENT (shared by all instrument types)
// ============================================================================

function renderTimelineSection(instrument) {
    const standardEcosystems = ECOSYSTEM_CODES.map(e => e.value).filter(v => v);
    const isOtherEcosystem = instrument.ecosystem_code && !standardEcosystems.includes(instrument.ecosystem_code);

    return `
    <div class="form-section">
        <h4 onclick="toggleSection(this)"><i class="fas fa-calendar-alt"></i> Timeline & Deployment</h4>
        <div class="form-section-content">
            <div class="form-group">
                <label>Instrument Type</label>
                <select id="edit-instrument-type" class="form-control" aria-label="Instrument Type"
                        onchange="handleInstrumentTypeOther(this)">
                    ${buildSelectOptions(INSTRUMENT_TYPES, instrument.instrument_type)}
                </select>
                <input type="text" id="edit-instrument-type-other" value="${isOtherEcosystem ? instrument.instrument_type : ''}"
                       class="form-control mt-2" placeholder="Specify type..."
                       style="display: none;" aria-label="Other Instrument Type">
            </div>
            <div class="form-group">
                <label>Ecosystem Code</label>
                <select id="edit-instrument-ecosystem" class="form-control" aria-label="Ecosystem Code"
                        onchange="handleEcosystemOther(this)">
                    ${buildSelectOptions(ECOSYSTEM_CODES, isOtherEcosystem ? 'Other' : instrument.ecosystem_code)}
                    <option value="Other" ${isOtherEcosystem ? 'selected' : ''}>Other</option>
                </select>
                <input type="text" id="edit-instrument-ecosystem-other" value="${isOtherEcosystem ? instrument.ecosystem_code : ''}"
                       class="form-control mt-2" placeholder="Enter ecosystem code..."
                       style="display: ${isOtherEcosystem ? 'block' : 'none'};" aria-label="Other Ecosystem Code">
            </div>
            <div class="form-group">
                <label>Deployment Date</label>
                <input type="date" id="edit-instrument-deployment" value="${instrument.deployment_date || ''}"
                       class="form-control" aria-label="Deployment Date">
                <small class="form-text">Format: YYYY-MM-DD</small>
            </div>
            <div class="form-group">
                <label>Calibration Date</label>
                <input type="date" id="edit-instrument-calibration-date" value="${instrument.calibration_date || ''}"
                       class="form-control" onchange="updateCalibrationStatus(this)" aria-label="Calibration Date">
                <small class="form-text" id="calibration-status"></small>
            </div>
            <div class="form-group">
                <label>First Measurement Year</label>
                <input type="number" id="edit-instrument-first-year" value="${instrument.first_measurement_year || ''}"
                       class="form-control" min="2000" max="2030" placeholder="e.g., 2010" aria-label="First Measurement Year">
            </div>
            <div class="form-group">
                <label>Last Measurement Year</label>
                <input type="number" id="edit-instrument-last-year" value="${instrument.last_measurement_year || ''}"
                       class="form-control" min="2000" max="2030" placeholder="e.g., 2024" aria-label="Last Measurement Year">
            </div>
            <div class="form-group full-width">
                <label>Platform & Station</label>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                    <input type="text" value="${escapeHtml(instrument.platform_name)}"
                           class="form-control field-readonly" readonly
                           title="Platform is managed separately" aria-label="Platform" tabindex="-1">
                    <input type="text" value="${escapeHtml(instrument.station_name)}${instrument.station_acronym ? ' (' + instrument.station_acronym + ')' : ''}"
                           class="form-control field-readonly" readonly
                           title="Station is managed separately" aria-label="Station" tabindex="-1">
                </div>
            </div>
        </div>
    </div>
    `;
}

// ============================================================================
// SECTION 5: SYSTEM CONFIGURATION (shared by all instrument types)
// ============================================================================

function renderSystemConfigSection(instrument) {
    const qualityScore = instrument.image_quality_score || 80;
    const qualityClass = qualityScore >= 75 ? 'high' : qualityScore >= 50 ? 'medium' : 'low';
    const qualityLabel = qualityScore >= 75 ? 'High Quality' : qualityScore >= 50 ? 'Medium Quality' : 'Low Quality';

    return `
    <div class="form-section">
        <h4 onclick="toggleSection(this)"><i class="fas fa-cog"></i> System Configuration</h4>
        <div class="form-section-content">
            <div class="form-group">
                <label>Power Source</label>
                <select id="edit-instrument-power-source" class="form-control" aria-label="Power Source">
                    ${buildSelectOptions(POWER_SOURCE_OPTIONS, instrument.power_source)}
                </select>
            </div>
            <div class="form-group">
                <label>Data Transmission</label>
                <select id="edit-instrument-data-transmission" class="form-control" aria-label="Data Transmission">
                    ${buildSelectOptions(DATA_TRANSMISSION_OPTIONS, instrument.data_transmission)}
                </select>
            </div>
            <div class="form-group">
                <label>Warranty Expiration</label>
                <input type="date" id="edit-instrument-warranty-expires" value="${instrument.manufacturer_warranty_expires || ''}"
                       class="form-control" onchange="updateWarrantyStatus(this)" aria-label="Warranty Expiration">
                <small class="form-text" id="warranty-status"></small>
            </div>
            <div class="form-group">
                <label id="image-processing-label">Image Processing</label>
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <label class="toggle-switch">
                        <input type="checkbox" id="edit-instrument-image-processing"
                               ${instrument.image_processing_enabled ? 'checked' : ''}
                               aria-labelledby="image-processing-label"
                               onchange="updateImageProcessingLabel(this)">
                        <span class="toggle-slider"></span>
                    </label>
                    <span id="image-processing-status">${instrument.image_processing_enabled ? 'Enabled' : 'Disabled'}</span>
                </div>
            </div>
            <div class="form-group full-width">
                <label id="quality-score-label">Image Quality Score (0-100)</label>
                <div class="range-slider-container">
                    <input type="range" id="edit-instrument-quality-score" value="${qualityScore}"
                           min="0" max="100" step="1" class="range-slider"
                           oninput="updateQualityDisplay(this.value)"
                           aria-labelledby="quality-score-label"
                           aria-valuemin="0" aria-valuemax="100" aria-valuenow="${qualityScore}">
                    <div class="range-value-display">
                        <span>Score: <strong id="quality-score-value">${qualityScore}</strong></span>
                        <span id="quality-badge" class="quality-badge ${qualityClass}">${qualityLabel}</span>
                    </div>
                </div>
            </div>
            <div class="form-group full-width">
                <label for="edit-instrument-calibration-notes">Calibration Notes</label>
                <textarea id="edit-instrument-calibration-notes" class="form-control" rows="2"
                          maxlength="500" oninput="updateCharCount(this, 'calibration-char-count')"
                          placeholder="Notes about calibration procedures..."
                          aria-describedby="calibration-char-count">${escapeHtml(instrument.calibration_notes)}</textarea>
                <div id="calibration-char-count" class="char-counter" aria-live="polite">
                    ${(instrument.calibration_notes || '').length}/500
                </div>
            </div>
        </div>
    </div>
    `;
}

// ============================================================================
// SECTION 6: PHENOCAM PROCESSING (Phenocam only)
// ============================================================================

function renderPhenocamProcessingSection(instrument) {
    const hasArchivePath = !!instrument.image_archive_path;

    return `
    <div class="form-section">
        <h4 onclick="toggleSection(this)"><i class="fas fa-tree"></i> Phenocam Processing</h4>
        <div class="form-section-content">
            <div class="form-group full-width">
                <label id="phenocam-processing-label">Enable Phenocam Data Processing</label>
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                    <label class="toggle-switch">
                        <input type="checkbox" id="phenocam-processing-toggle"
                               ${hasArchivePath ? 'checked' : ''}
                               onchange="togglePhenocamSection(this)"
                               aria-labelledby="phenocam-processing-label">
                        <span class="toggle-slider"></span>
                    </label>
                    <span id="phenocam-processing-status">${hasArchivePath ? 'Phenocam processing enabled' : 'Phenocam processing disabled'}</span>
                </div>
                <div id="phenocam-archive-section" class="progressive-section ${hasArchivePath ? 'active' : ''}"
                     ${hasArchivePath ? '' : 'aria-hidden="true"'}>
                    <label for="edit-instrument-archive-path">Image Archive Path</label>
                    <input type="text" id="edit-instrument-archive-path" value="${escapeHtml(instrument.image_archive_path)}"
                           class="form-control" placeholder="/path/to/archive/STATION/INSTRUMENT/"
                           pattern="^/.*/$" aria-describedby="archive-path-help">
                    <small class="form-text" id="archive-path-help">Path must start with / and end with /</small>
                </div>
            </div>
        </div>
    </div>
    `;
}

// ============================================================================
// SECTION 7: DOCUMENTATION (shared by all instrument types)
// ============================================================================

function renderDocumentationSection(instrument) {
    const descLen = (instrument.description || '').length;
    const installLen = (instrument.installation_notes || '').length;
    const maintLen = (instrument.maintenance_notes || '').length;

    return `
    <div class="form-section">
        <h4 onclick="toggleSection(this)"><i class="fas fa-sticky-note"></i> Documentation</h4>
        <div class="form-section-content">
            <div class="form-group full-width">
                <label for="edit-instrument-description">Description</label>
                <textarea id="edit-instrument-description" class="form-control" rows="3"
                          maxlength="1000" oninput="updateCharCount(this, 'description-char-count')"
                          placeholder="General description of the instrument..."
                          aria-describedby="description-char-count">${escapeHtml(instrument.description)}</textarea>
                <div id="description-char-count" class="char-counter" aria-live="polite">${descLen}/1000</div>
            </div>
            <div class="form-group full-width">
                <label for="edit-instrument-installation-notes">Installation Notes</label>
                <textarea id="edit-instrument-installation-notes" class="form-control" rows="3"
                          maxlength="1000" oninput="updateCharCount(this, 'installation-char-count')"
                          placeholder="Notes about installation and setup..."
                          aria-describedby="installation-char-count">${escapeHtml(instrument.installation_notes)}</textarea>
                <div id="installation-char-count" class="char-counter" aria-live="polite">${installLen}/1000</div>
            </div>
            <div class="form-group full-width">
                <label for="edit-instrument-maintenance-notes">Maintenance Notes</label>
                <textarea id="edit-instrument-maintenance-notes" class="form-control" rows="3"
                          maxlength="1000" oninput="updateCharCount(this, 'maintenance-char-count')"
                          placeholder="Maintenance history and notes..."
                          aria-describedby="maintenance-char-count">${escapeHtml(instrument.maintenance_notes)}</textarea>
                <div id="maintenance-char-count" class="char-counter" aria-live="polite">${maintLen}/1000</div>
            </div>
        </div>
    </div>
    `;
}

// ============================================================================
// FORM WRAPPER AND ACTIONS
// ============================================================================

function renderFormWrapper(instrument, isAdmin, sectionsHTML) {
    return `
        ${!isAdmin ? '<div class="form-readonly-notice" role="alert"><i class="fas fa-info-circle" aria-hidden="true"></i> Some fields are read-only based on your permissions</div>' : ''}
        <form id="instrument-update-form" role="form" aria-label="Edit Instrument Form">
            <input type="hidden" id="edit-instrument-id" value="${instrument.id}">
            ${sectionsHTML}
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeInstrumentEditModal()">
                    Cancel
                </button>
                <button type="submit" class="save-btn">
                    <i class="fas fa-save" aria-hidden="true"></i> Save Changes
                </button>
            </div>
        </form>
    `;
}

// ============================================================================
// EXPORTS - Make available globally
// ============================================================================

if (typeof window !== 'undefined') {
    window.ModalSections = {
        // Constants
        ENTITY_STATUS_OPTIONS,
        MEASUREMENT_STATUS_OPTIONS,
        ECOSYSTEM_CODES,
        POWER_SOURCE_OPTIONS,
        DATA_TRANSMISSION_OPTIONS,
        INSTRUMENT_TYPES,

        // Helper functions
        buildSelectOptions,
        isStandardValue,
        escapeHtml,

        // Section renderers
        renderGeneralInfoSection,
        renderPositionSection,
        renderTimelineSection,
        renderSystemConfigSection,
        renderPhenocamProcessingSection,
        renderDocumentationSection,
        renderFormWrapper
    };
}
