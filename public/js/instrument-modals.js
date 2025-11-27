/**
 * Instrument Modals - Type-Specific Edit Forms
 * SITES Spectral Stations & Instruments v7.0.0
 *
 * Architecture: Separation of Concerns + DRY
 * - Uses shared sections from modal-sections.js
 * - Each instrument type has dedicated type-specific section
 * - Composes shared + type-specific sections for each modal
 * - Reduces ~2,400 lines of duplicate code to ~800 lines
 *
 * Requires: modal-sections.js to be loaded first
 */

// ============================================================================
// INSTRUMENT CATEGORY DETECTION
// ============================================================================

/**
 * Categorize instrument type into: phenocam, multispectral, par, ndvi, pri, hyperspectral, other
 * @param {string} instrumentType - The instrument type string
 * @returns {string} Category
 */
function getInstrumentCategory(instrumentType) {
    if (!instrumentType) return 'other';

    const type = instrumentType.toLowerCase();

    // Phenocam category
    if (type.includes('phenocam')) {
        return 'phenocam';
    }

    // Hyperspectral (check before multispectral to avoid false match)
    if (type.includes('hyperspectral') || type.includes('hyp')) {
        return 'hyperspectral';
    }

    // Multispectral sensor category
    if (type.includes('multispectral') ||
        type.includes('skye') ||
        type.includes('decagon') ||
        (type.includes('apogee') && type.includes('ms')) ||
        type === 'ms sensor') {
        return 'multispectral';
    }

    // PAR sensor category
    if (type.includes('par')) {
        return 'par';
    }

    // NDVI sensor category
    if (type.includes('ndvi')) {
        return 'ndvi';
    }

    // PRI sensor category
    if (type.includes('pri') || type.includes('530') || type.includes('570')) {
        return 'pri';
    }

    return 'other';
}

// ============================================================================
// TYPE-SPECIFIC SECTIONS
// ============================================================================

/**
 * Camera Specifications Section (Phenocam only)
 */
function renderCameraSpecsSection(instrument) {
    const standardBrands = ['Mobotix', 'Axis', 'Canon', 'Nikon', 'Sony'];
    const isOtherBrand = instrument.camera_brand && !standardBrands.includes(instrument.camera_brand);

    const standardResolutions = ['4096x3072', '3264x2448', '2592x1944', '2048x1536', '1920x1080'];
    const isOtherResolution = instrument.camera_resolution && !standardResolutions.includes(instrument.camera_resolution);

    return `
    <div class="form-section">
        <h4 onclick="toggleSection(this)"><i class="fas fa-camera"></i> Camera Specifications</h4>
        <div class="form-section-content">
            <div class="form-group">
                <label>Camera Brand</label>
                <select id="edit-instrument-camera-brand" class="form-control" aria-label="Camera Brand"
                        onchange="handleCameraBrandOther(this)">
                    <option value="">Select brand...</option>
                    ${standardBrands.map(b => `<option value="${b}" ${instrument.camera_brand === b ? 'selected' : ''}>${b}</option>`).join('')}
                    <option value="Other" ${isOtherBrand ? 'selected' : ''}>Other</option>
                </select>
                <input type="text" id="edit-instrument-camera-brand-other" value="${isOtherBrand ? instrument.camera_brand : ''}"
                       class="form-control mt-2" placeholder="Enter other brand..."
                       style="display: ${isOtherBrand ? 'block' : 'none'};" aria-label="Other Camera Brand">
            </div>
            <div class="form-group">
                <label>Camera Model</label>
                <input type="text" id="edit-instrument-camera-model" value="${instrument.camera_model || ''}"
                       class="form-control" placeholder="e.g., M16B, P1437-E" aria-label="Camera Model">
            </div>
            <div class="form-group">
                <label>Serial Number</label>
                <input type="text" id="edit-instrument-camera-serial" value="${instrument.camera_serial_number || ''}"
                       class="form-control" placeholder="Camera serial number" aria-label="Camera Serial Number">
            </div>
            <div class="form-group">
                <label>Resolution</label>
                <select id="edit-instrument-camera-resolution" class="form-control" aria-label="Camera Resolution"
                        onchange="handleCameraResolutionOther(this)">
                    <option value="">Select resolution...</option>
                    <option value="4096x3072" ${instrument.camera_resolution === '4096x3072' ? 'selected' : ''}>4096x3072 (12MP)</option>
                    <option value="3264x2448" ${instrument.camera_resolution === '3264x2448' ? 'selected' : ''}>3264x2448 (8MP)</option>
                    <option value="2592x1944" ${instrument.camera_resolution === '2592x1944' ? 'selected' : ''}>2592x1944 (5MP)</option>
                    <option value="2048x1536" ${instrument.camera_resolution === '2048x1536' ? 'selected' : ''}>2048x1536 (3MP)</option>
                    <option value="1920x1080" ${instrument.camera_resolution === '1920x1080' ? 'selected' : ''}>1920x1080 (2MP/FHD)</option>
                    <option value="Other" ${isOtherResolution ? 'selected' : ''}>Other</option>
                </select>
                <input type="text" id="edit-instrument-camera-resolution-other" value="${isOtherResolution ? instrument.camera_resolution : ''}"
                       class="form-control mt-2" placeholder="e.g., 5472x3648"
                       style="display: ${isOtherResolution ? 'block' : 'none'};" aria-label="Other Camera Resolution">
            </div>
            <div class="form-group">
                <label>Mega Pixels</label>
                <input type="number" id="edit-instrument-camera-megapixels" value="${instrument.camera_mega_pixels || ''}"
                       class="form-control" step="0.1" min="0" placeholder="e.g., 12.3" aria-label="Camera Megapixels">
            </div>
            <div class="form-group">
                <label>Lens</label>
                <input type="text" id="edit-instrument-camera-lens" value="${instrument.camera_lens || ''}"
                       class="form-control" placeholder="e.g., 18-55mm f/3.5-5.6" aria-label="Camera Lens">
            </div>
            <div class="form-group">
                <label>Focal Length (mm)</label>
                <input type="number" id="edit-instrument-camera-focal-length" value="${instrument.camera_focal_length_mm || ''}"
                       class="form-control" step="0.1" min="0" placeholder="e.g., 50" aria-label="Camera Focal Length">
            </div>
            <div class="form-group">
                <label>Aperture (f-stop)</label>
                <select id="edit-instrument-camera-aperture" class="form-control" aria-label="Camera Aperture">
                    <option value="">Select aperture...</option>
                    <option value="f/1.4" ${instrument.camera_aperture === 'f/1.4' ? 'selected' : ''}>f/1.4</option>
                    <option value="f/1.8" ${instrument.camera_aperture === 'f/1.8' ? 'selected' : ''}>f/1.8</option>
                    <option value="f/2.0" ${instrument.camera_aperture === 'f/2.0' ? 'selected' : ''}>f/2.0</option>
                    <option value="f/2.8" ${instrument.camera_aperture === 'f/2.8' ? 'selected' : ''}>f/2.8</option>
                    <option value="f/4.0" ${instrument.camera_aperture === 'f/4.0' ? 'selected' : ''}>f/4.0</option>
                    <option value="f/5.6" ${instrument.camera_aperture === 'f/5.6' ? 'selected' : ''}>f/5.6</option>
                    <option value="f/8.0" ${instrument.camera_aperture === 'f/8.0' ? 'selected' : ''}>f/8.0</option>
                    <option value="Auto" ${instrument.camera_aperture === 'Auto' ? 'selected' : ''}>Auto</option>
                </select>
            </div>
            <div class="form-group">
                <label>Exposure Time</label>
                <input type="text" id="edit-instrument-camera-exposure" value="${instrument.camera_exposure_time || ''}"
                       class="form-control" placeholder="e.g., 1/250s, Auto" aria-label="Camera Exposure Time">
                <small class="form-text">Format: 1/250s or Auto</small>
            </div>
            <div class="form-group">
                <label>ISO</label>
                <select id="edit-instrument-camera-iso" class="form-control" aria-label="Camera ISO">
                    <option value="">Select ISO...</option>
                    <option value="100" ${instrument.camera_iso === '100' ? 'selected' : ''}>100</option>
                    <option value="200" ${instrument.camera_iso === '200' ? 'selected' : ''}>200</option>
                    <option value="400" ${instrument.camera_iso === '400' ? 'selected' : ''}>400</option>
                    <option value="800" ${instrument.camera_iso === '800' ? 'selected' : ''}>800</option>
                    <option value="1600" ${instrument.camera_iso === '1600' ? 'selected' : ''}>1600</option>
                    <option value="3200" ${instrument.camera_iso === '3200' ? 'selected' : ''}>3200</option>
                    <option value="Auto" ${instrument.camera_iso === 'Auto' ? 'selected' : ''}>Auto</option>
                </select>
            </div>
            <div class="form-group">
                <label>White Balance</label>
                <select id="edit-instrument-camera-wb" class="form-control" aria-label="Camera White Balance">
                    <option value="">Select white balance...</option>
                    <option value="Auto" ${instrument.camera_white_balance === 'Auto' ? 'selected' : ''}>Auto</option>
                    <option value="Daylight" ${instrument.camera_white_balance === 'Daylight' ? 'selected' : ''}>Daylight</option>
                    <option value="Cloudy" ${instrument.camera_white_balance === 'Cloudy' ? 'selected' : ''}>Cloudy</option>
                    <option value="Shade" ${instrument.camera_white_balance === 'Shade' ? 'selected' : ''}>Shade</option>
                    <option value="Tungsten" ${instrument.camera_white_balance === 'Tungsten' ? 'selected' : ''}>Tungsten</option>
                    <option value="Fluorescent" ${instrument.camera_white_balance === 'Fluorescent' ? 'selected' : ''}>Fluorescent</option>
                    <option value="Custom" ${instrument.camera_white_balance === 'Custom' ? 'selected' : ''}>Custom</option>
                </select>
            </div>
        </div>
    </div>
    `;
}

/**
 * Multispectral Sensor Specifications Section
 */
function renderMSSensorSpecsSection(instrument) {
    return `
    <div class="form-section">
        <h4 onclick="toggleSection(this)"><i class="fas fa-satellite"></i> Sensor Specifications</h4>
        <div class="form-section-content">
            <div class="form-group">
                <label>Sensor Brand</label>
                <input type="text" id="edit-sensor-brand" value="${instrument.sensor_brand || ''}"
                       class="form-control" placeholder="e.g., SKYE, Decagon, Apogee" aria-label="Sensor Brand">
            </div>
            <div class="form-group">
                <label>Sensor Model</label>
                <input type="text" id="edit-sensor-model" value="${instrument.sensor_model || ''}"
                       class="form-control" placeholder="e.g., SKR 1800, SKR110" aria-label="Sensor Model">
            </div>
            <div class="form-group">
                <label>Sensor Serial Number</label>
                <input type="text" id="edit-sensor-serial" value="${instrument.sensor_serial_number || ''}"
                       class="form-control" placeholder="Sensor serial number" aria-label="Sensor Serial Number">
            </div>
            <div class="form-group">
                <label>Orientation</label>
                <select id="edit-sensor-orientation" class="form-control" aria-label="Sensor Orientation">
                    <option value="">Select orientation...</option>
                    <option value="uplooking" ${instrument.orientation === 'uplooking' ? 'selected' : ''}>Uplooking</option>
                    <option value="downlooking" ${instrument.orientation === 'downlooking' ? 'selected' : ''}>Downlooking</option>
                </select>
                <small class="form-text">Sensor pointing direction</small>
            </div>
            <div class="form-group">
                <label>Number of Channels</label>
                <input type="number" id="edit-number-channels" value="${instrument.number_of_channels || ''}"
                       class="form-control" min="1" max="8" placeholder="e.g., 2, 4" aria-label="Number of Channels">
                <small class="form-text">Spectral bands/wavelengths (typically 2-8)</small>
            </div>
            <div class="form-group">
                <label>Field of View (degrees)</label>
                <input type="number" id="edit-field-of-view" value="${instrument.field_of_view_degrees || ''}"
                       class="form-control" step="0.1" min="0" max="180" placeholder="e.g., 180" aria-label="Field of View">
            </div>
            <div class="form-group">
                <label>Cable Length (meters)</label>
                <input type="number" id="edit-cable-length" value="${instrument.cable_length_m || ''}"
                       class="form-control" step="0.1" min="0" placeholder="e.g., 10.0" aria-label="Cable Length">
            </div>
            <div class="form-group">
                <label>Datalogger Type</label>
                <input type="text" id="edit-datalogger-type" value="${instrument.datalogger_type || 'Campbell Scientific CR1000X'}"
                       class="form-control" placeholder="e.g., Campbell Scientific CR1000X" aria-label="Datalogger Type">
            </div>
            <div class="form-group">
                <label>Normal Datalogger Program</label>
                <input type="text" id="edit-datalogger-program-normal" value="${instrument.datalogger_program_normal || ''}"
                       class="form-control" placeholder="Program name or file path" aria-label="Normal Program">
                <small class="form-text">Program used for regular measurements</small>
            </div>
            <div class="form-group">
                <label>Calibration Datalogger Program</label>
                <input type="text" id="edit-datalogger-program-calibration" value="${instrument.datalogger_program_calibration || ''}"
                       class="form-control" placeholder="Program name or file path" aria-label="Calibration Program">
                <small class="form-text">Program used for calibration procedures</small>
            </div>
            <div class="form-group">
                <label>End Date</label>
                <input type="date" id="edit-end-date" value="${instrument.end_date || ''}"
                       class="form-control" aria-label="End Date">
                <small class="form-text">Date sensor was decommissioned (if applicable)</small>
            </div>
            <div class="form-group full-width">
                <label>Calibration Logs</label>
                <textarea id="edit-calibration-logs" class="form-control" rows="3"
                          placeholder="Calibration history and notes..." aria-label="Calibration Logs">${instrument.calibration_logs || ''}</textarea>
                <small class="form-text">Calibration history, coefficients, and procedures</small>
            </div>
            <div class="form-group full-width">
                <p class="form-text"><i class="fas fa-info-circle"></i> <strong>Channel Management:</strong>
                Individual spectral channels/bands can be configured after saving.
                Use the channel manager to define wavelengths, calibration coefficients, and processing parameters for each band.</p>
            </div>
        </div>
    </div>
    `;
}

/**
 * PAR Sensor Specifications Section
 */
function renderPARSensorSpecsSection(instrument) {
    return `
    <div class="form-section">
        <h4 onclick="toggleSection(this)"><i class="fas fa-sun"></i> PAR Sensor Specifications</h4>
        <div class="form-section-content">
            <div class="form-group">
                <label>Sensor Brand</label>
                <input type="text" id="edit-sensor-brand" value="${instrument.sensor_brand || ''}"
                       class="form-control" placeholder="e.g., Apogee, LI-COR" aria-label="Sensor Brand">
            </div>
            <div class="form-group">
                <label>Sensor Model</label>
                <input type="text" id="edit-sensor-model" value="${instrument.sensor_model || ''}"
                       class="form-control" placeholder="e.g., SQ-500, LI-190R" aria-label="Sensor Model">
            </div>
            <div class="form-group">
                <label>Sensor Serial Number</label>
                <input type="text" id="edit-sensor-serial" value="${instrument.sensor_serial_number || ''}"
                       class="form-control" placeholder="Sensor serial number" aria-label="Sensor Serial Number">
            </div>
            <div class="form-group">
                <label>Spectral Range (nm)</label>
                <input type="text" id="edit-spectral-range" value="${instrument.spectral_range || '400-700'}"
                       class="form-control" placeholder="e.g., 400-700" aria-label="Spectral Range">
                <small class="form-text">Photosynthetically Active Radiation range</small>
            </div>
            <div class="form-group">
                <label>Calibration Coefficient (µmol m⁻² s⁻¹ per mV)</label>
                <input type="number" id="edit-calibration-coefficient" value="${instrument.calibration_coefficient || ''}"
                       class="form-control" step="0.001" placeholder="e.g., 5.0" aria-label="Calibration Coefficient">
            </div>
            <div class="form-group">
                <label>Orientation</label>
                <select id="edit-sensor-orientation" class="form-control" aria-label="Sensor Orientation">
                    <option value="">Select orientation...</option>
                    <option value="uplooking" ${instrument.orientation === 'uplooking' ? 'selected' : ''}>Uplooking (Incoming PAR)</option>
                    <option value="downlooking" ${instrument.orientation === 'downlooking' ? 'selected' : ''}>Downlooking (Reflected PAR)</option>
                </select>
            </div>
            <div class="form-group">
                <label>Field of View (degrees)</label>
                <input type="number" id="edit-field-of-view" value="${instrument.field_of_view_degrees || ''}"
                       class="form-control" step="0.1" min="0" max="180" placeholder="e.g., 180" aria-label="Field of View">
            </div>
            <div class="form-group">
                <label>Cable Length (meters)</label>
                <input type="number" id="edit-cable-length" value="${instrument.cable_length_m || ''}"
                       class="form-control" step="0.1" min="0" placeholder="e.g., 10.0" aria-label="Cable Length">
            </div>
            <div class="form-group">
                <label>Datalogger Type</label>
                <input type="text" id="edit-datalogger-type" value="${instrument.datalogger_type || ''}"
                       class="form-control" placeholder="e.g., Campbell Scientific CR1000X" aria-label="Datalogger Type">
            </div>
        </div>
    </div>
    `;
}

/**
 * NDVI Sensor Specifications Section
 */
function renderNDVISensorSpecsSection(instrument) {
    return `
    <div class="form-section">
        <h4 onclick="toggleSection(this)"><i class="fas fa-leaf"></i> NDVI Sensor Specifications</h4>
        <div class="form-section-content">
            <div class="form-group">
                <label>Sensor Brand</label>
                <input type="text" id="edit-sensor-brand" value="${instrument.sensor_brand || ''}"
                       class="form-control" placeholder="e.g., Apogee, Decagon, SKYE" aria-label="Sensor Brand">
            </div>
            <div class="form-group">
                <label>Sensor Model</label>
                <input type="text" id="edit-sensor-model" value="${instrument.sensor_model || ''}"
                       class="form-control" placeholder="e.g., SI-111, NDVI Sensor" aria-label="Sensor Model">
            </div>
            <div class="form-group">
                <label>Sensor Serial Number</label>
                <input type="text" id="edit-sensor-serial" value="${instrument.sensor_serial_number || ''}"
                       class="form-control" placeholder="Sensor serial number" aria-label="Sensor Serial Number">
            </div>
            <div class="form-group">
                <label>Red Band Wavelength (nm)</label>
                <input type="number" id="edit-red-wavelength" value="${instrument.red_wavelength_nm || 650}"
                       class="form-control" step="1" min="600" max="700" placeholder="e.g., 650" aria-label="Red Wavelength">
                <small class="form-text">Typical: 650-680 nm</small>
            </div>
            <div class="form-group">
                <label>NIR Band Wavelength (nm)</label>
                <input type="number" id="edit-nir-wavelength" value="${instrument.nir_wavelength_nm || 810}"
                       class="form-control" step="1" min="750" max="900" placeholder="e.g., 810" aria-label="NIR Wavelength">
                <small class="form-text">Typical: 800-850 nm</small>
            </div>
            <div class="form-group">
                <label>Orientation</label>
                <select id="edit-sensor-orientation" class="form-control" aria-label="Sensor Orientation">
                    <option value="">Select orientation...</option>
                    <option value="uplooking" ${instrument.orientation === 'uplooking' ? 'selected' : ''}>Uplooking</option>
                    <option value="downlooking" ${instrument.orientation === 'downlooking' ? 'selected' : ''}>Downlooking</option>
                </select>
            </div>
            <div class="form-group">
                <label>Field of View (degrees)</label>
                <input type="number" id="edit-field-of-view" value="${instrument.field_of_view_degrees || ''}"
                       class="form-control" step="0.1" min="0" max="180" placeholder="e.g., 25" aria-label="Field of View">
            </div>
            <div class="form-group">
                <label>Cable Length (meters)</label>
                <input type="number" id="edit-cable-length" value="${instrument.cable_length_m || ''}"
                       class="form-control" step="0.1" min="0" placeholder="e.g., 10.0" aria-label="Cable Length">
            </div>
            <div class="form-group">
                <label>Datalogger Type</label>
                <input type="text" id="edit-datalogger-type" value="${instrument.datalogger_type || ''}"
                       class="form-control" placeholder="e.g., Campbell Scientific CR1000X" aria-label="Datalogger Type">
            </div>
        </div>
    </div>
    `;
}

/**
 * PRI Sensor Specifications Section
 */
function renderPRISensorSpecsSection(instrument) {
    return `
    <div class="form-section">
        <h4 onclick="toggleSection(this)"><i class="fas fa-microscope"></i> PRI Sensor Specifications</h4>
        <div class="form-section-content">
            <div class="form-group">
                <label>Sensor Brand</label>
                <input type="text" id="edit-sensor-brand" value="${instrument.sensor_brand || ''}"
                       class="form-control" placeholder="e.g., SKYE, Decagon" aria-label="Sensor Brand">
            </div>
            <div class="form-group">
                <label>Sensor Model</label>
                <input type="text" id="edit-sensor-model" value="${instrument.sensor_model || ''}"
                       class="form-control" placeholder="e.g., SKR 1800-PRI" aria-label="Sensor Model">
            </div>
            <div class="form-group">
                <label>Sensor Serial Number</label>
                <input type="text" id="edit-sensor-serial" value="${instrument.sensor_serial_number || ''}"
                       class="form-control" placeholder="Sensor serial number" aria-label="Sensor Serial Number">
            </div>
            <div class="form-group">
                <label>Band 1 Wavelength (nm) - Reference</label>
                <input type="number" id="edit-band1-wavelength" value="${instrument.band1_wavelength_nm || 531}"
                       class="form-control" step="1" min="520" max="540" placeholder="e.g., 531" aria-label="Band 1 Wavelength">
                <small class="form-text">Reference band ~531 nm (xanthophyll cycle sensitive)</small>
            </div>
            <div class="form-group">
                <label>Band 2 Wavelength (nm) - Reference</label>
                <input type="number" id="edit-band2-wavelength" value="${instrument.band2_wavelength_nm || 570}"
                       class="form-control" step="1" min="560" max="580" placeholder="e.g., 570" aria-label="Band 2 Wavelength">
                <small class="form-text">Reference band ~570 nm (stable reference)</small>
            </div>
            <div class="form-group">
                <label>Orientation</label>
                <select id="edit-sensor-orientation" class="form-control" aria-label="Sensor Orientation">
                    <option value="">Select orientation...</option>
                    <option value="uplooking" ${instrument.orientation === 'uplooking' ? 'selected' : ''}>Uplooking</option>
                    <option value="downlooking" ${instrument.orientation === 'downlooking' ? 'selected' : ''}>Downlooking</option>
                </select>
            </div>
            <div class="form-group">
                <label>Field of View (degrees)</label>
                <input type="number" id="edit-field-of-view" value="${instrument.field_of_view_degrees || ''}"
                       class="form-control" step="0.1" min="0" max="180" placeholder="e.g., 25" aria-label="Field of View">
            </div>
            <div class="form-group">
                <label>Cable Length (meters)</label>
                <input type="number" id="edit-cable-length" value="${instrument.cable_length_m || ''}"
                       class="form-control" step="0.1" min="0" placeholder="e.g., 10.0" aria-label="Cable Length">
            </div>
            <div class="form-group">
                <label>Datalogger Type</label>
                <input type="text" id="edit-datalogger-type" value="${instrument.datalogger_type || ''}"
                       class="form-control" placeholder="e.g., Campbell Scientific CR1000X" aria-label="Datalogger Type">
            </div>
        </div>
    </div>
    `;
}

/**
 * Hyperspectral Sensor Specifications Section
 */
function renderHyperspectralSpecsSection(instrument) {
    return `
    <div class="form-section">
        <h4 onclick="toggleSection(this)"><i class="fas fa-rainbow"></i> Hyperspectral Specifications</h4>
        <div class="form-section-content">
            <div class="form-group">
                <label>Sensor Brand</label>
                <input type="text" id="edit-sensor-brand" value="${instrument.sensor_brand || ''}"
                       class="form-control" placeholder="e.g., Ocean Optics, ASD" aria-label="Sensor Brand">
            </div>
            <div class="form-group">
                <label>Sensor Model</label>
                <input type="text" id="edit-sensor-model" value="${instrument.sensor_model || ''}"
                       class="form-control" placeholder="e.g., USB4000, FieldSpec" aria-label="Sensor Model">
            </div>
            <div class="form-group">
                <label>Sensor Serial Number</label>
                <input type="text" id="edit-sensor-serial" value="${instrument.sensor_serial_number || ''}"
                       class="form-control" placeholder="Sensor serial number" aria-label="Sensor Serial Number">
            </div>
            <div class="form-group">
                <label>Spectral Range Start (nm)</label>
                <input type="number" id="edit-spectral-range-start" value="${instrument.spectral_range_start_nm || 350}"
                       class="form-control" step="1" min="200" max="2500" placeholder="e.g., 350" aria-label="Spectral Range Start">
            </div>
            <div class="form-group">
                <label>Spectral Range End (nm)</label>
                <input type="number" id="edit-spectral-range-end" value="${instrument.spectral_range_end_nm || 1000}"
                       class="form-control" step="1" min="200" max="2500" placeholder="e.g., 1000" aria-label="Spectral Range End">
            </div>
            <div class="form-group">
                <label>Spectral Resolution (nm)</label>
                <input type="number" id="edit-spectral-resolution" value="${instrument.spectral_resolution_nm || ''}"
                       class="form-control" step="0.1" min="0.1" max="50" placeholder="e.g., 1.5" aria-label="Spectral Resolution">
                <small class="form-text">Full width at half maximum (FWHM)</small>
            </div>
            <div class="form-group">
                <label>Number of Bands</label>
                <input type="number" id="edit-number-channels" value="${instrument.number_of_channels || ''}"
                       class="form-control" min="1" max="2048" placeholder="e.g., 256, 512" aria-label="Number of Bands">
            </div>
            <div class="form-group">
                <label>Orientation</label>
                <select id="edit-sensor-orientation" class="form-control" aria-label="Sensor Orientation">
                    <option value="">Select orientation...</option>
                    <option value="uplooking" ${instrument.orientation === 'uplooking' ? 'selected' : ''}>Uplooking</option>
                    <option value="downlooking" ${instrument.orientation === 'downlooking' ? 'selected' : ''}>Downlooking</option>
                    <option value="nadir" ${instrument.orientation === 'nadir' ? 'selected' : ''}>Nadir</option>
                </select>
            </div>
            <div class="form-group">
                <label>Field of View (degrees)</label>
                <input type="number" id="edit-field-of-view" value="${instrument.field_of_view_degrees || ''}"
                       class="form-control" step="0.1" min="0" max="180" placeholder="e.g., 25" aria-label="Field of View">
            </div>
            <div class="form-group">
                <label>Integration Time (ms)</label>
                <input type="number" id="edit-integration-time" value="${instrument.integration_time_ms || ''}"
                       class="form-control" step="0.1" min="0" placeholder="e.g., 10" aria-label="Integration Time">
            </div>
            <div class="form-group">
                <label>Datalogger Type</label>
                <input type="text" id="edit-datalogger-type" value="${instrument.datalogger_type || ''}"
                       class="form-control" placeholder="e.g., Campbell Scientific CR1000X" aria-label="Datalogger Type">
            </div>
        </div>
    </div>
    `;
}

// ============================================================================
// COMPLETE MODAL BUILDERS
// ============================================================================

/**
 * Build Phenocam Edit Modal
 */
function buildPhenocamModalHTML(instrument, isAdmin) {
    const MS = window.ModalSections;
    const sections = [
        MS.renderGeneralInfoSection(instrument),
        renderCameraSpecsSection(instrument),
        MS.renderPositionSection(instrument),
        MS.renderTimelineSection(instrument),
        MS.renderSystemConfigSection(instrument),
        MS.renderPhenocamProcessingSection(instrument),
        MS.renderDocumentationSection(instrument)
    ].join('');

    return MS.renderFormWrapper(instrument, isAdmin, sections);
}

/**
 * Build Multispectral Sensor Edit Modal
 */
function buildMSSensorModalHTML(instrument, isAdmin) {
    const MS = window.ModalSections;
    const sections = [
        MS.renderGeneralInfoSection(instrument),
        renderMSSensorSpecsSection(instrument),
        MS.renderPositionSection(instrument),
        MS.renderTimelineSection(instrument),
        MS.renderSystemConfigSection(instrument),
        MS.renderDocumentationSection(instrument)
    ].join('');

    return MS.renderFormWrapper(instrument, isAdmin, sections);
}

/**
 * Build PAR Sensor Edit Modal
 */
function buildPARSensorModalHTML(instrument, isAdmin) {
    const MS = window.ModalSections;
    const sections = [
        MS.renderGeneralInfoSection(instrument),
        renderPARSensorSpecsSection(instrument),
        MS.renderPositionSection(instrument),
        MS.renderTimelineSection(instrument),
        MS.renderSystemConfigSection(instrument),
        MS.renderDocumentationSection(instrument)
    ].join('');

    return MS.renderFormWrapper(instrument, isAdmin, sections);
}

/**
 * Build NDVI Sensor Edit Modal
 */
function buildNDVISensorModalHTML(instrument, isAdmin) {
    const MS = window.ModalSections;
    const sections = [
        MS.renderGeneralInfoSection(instrument),
        renderNDVISensorSpecsSection(instrument),
        MS.renderPositionSection(instrument),
        MS.renderTimelineSection(instrument),
        MS.renderSystemConfigSection(instrument),
        MS.renderDocumentationSection(instrument)
    ].join('');

    return MS.renderFormWrapper(instrument, isAdmin, sections);
}

/**
 * Build PRI Sensor Edit Modal
 */
function buildPRISensorModalHTML(instrument, isAdmin) {
    const MS = window.ModalSections;
    const sections = [
        MS.renderGeneralInfoSection(instrument),
        renderPRISensorSpecsSection(instrument),
        MS.renderPositionSection(instrument),
        MS.renderTimelineSection(instrument),
        MS.renderSystemConfigSection(instrument),
        MS.renderDocumentationSection(instrument)
    ].join('');

    return MS.renderFormWrapper(instrument, isAdmin, sections);
}

/**
 * Build Hyperspectral Sensor Edit Modal
 */
function buildHyperspectralModalHTML(instrument, isAdmin) {
    const MS = window.ModalSections;
    const sections = [
        MS.renderGeneralInfoSection(instrument),
        renderHyperspectralSpecsSection(instrument),
        MS.renderPositionSection(instrument),
        MS.renderTimelineSection(instrument),
        MS.renderSystemConfigSection(instrument),
        MS.renderDocumentationSection(instrument)
    ].join('');

    return MS.renderFormWrapper(instrument, isAdmin, sections);
}

// ============================================================================
// RENDER FUNCTIONS (thin wrappers for backward compatibility)
// ============================================================================

function renderPhenocamEditForm(instrument, isAdmin) {
    return buildPhenocamModalHTML(instrument, isAdmin);
}

function renderMSSensorEditForm(instrument, isAdmin) {
    return buildMSSensorModalHTML(instrument, isAdmin);
}

function renderPARSensorEditForm(instrument, isAdmin) {
    return buildPARSensorModalHTML(instrument, isAdmin);
}

function renderNDVISensorEditForm(instrument, isAdmin) {
    return buildNDVISensorModalHTML(instrument, isAdmin);
}

function renderPRISensorEditForm(instrument, isAdmin) {
    return buildPRISensorModalHTML(instrument, isAdmin);
}

function renderHyperspectralEditForm(instrument, isAdmin) {
    return buildHyperspectralModalHTML(instrument, isAdmin);
}

// ============================================================================
// EXPORTS - Make available globally
// ============================================================================

if (typeof window !== 'undefined') {
    // Category detection
    window.getInstrumentCategory = getInstrumentCategory;

    // Type-specific section renderers
    window.renderCameraSpecsSection = renderCameraSpecsSection;
    window.renderMSSensorSpecsSection = renderMSSensorSpecsSection;
    window.renderPARSensorSpecsSection = renderPARSensorSpecsSection;
    window.renderNDVISensorSpecsSection = renderNDVISensorSpecsSection;
    window.renderPRISensorSpecsSection = renderPRISensorSpecsSection;
    window.renderHyperspectralSpecsSection = renderHyperspectralSpecsSection;

    // Complete modal builders
    window.buildPhenocamModalHTML = buildPhenocamModalHTML;
    window.buildMSSensorModalHTML = buildMSSensorModalHTML;
    window.buildPARSensorModalHTML = buildPARSensorModalHTML;
    window.buildNDVISensorModalHTML = buildNDVISensorModalHTML;
    window.buildPRISensorModalHTML = buildPRISensorModalHTML;
    window.buildHyperspectralModalHTML = buildHyperspectralModalHTML;

    // Render functions (backward compatibility)
    window.renderPhenocamEditForm = renderPhenocamEditForm;
    window.renderMSSensorEditForm = renderMSSensorEditForm;
    window.renderPARSensorEditForm = renderPARSensorEditForm;
    window.renderNDVISensorEditForm = renderNDVISensorEditForm;
    window.renderPRISensorEditForm = renderPRISensorEditForm;
    window.renderHyperspectralEditForm = renderHyperspectralEditForm;
}
