/**
 * Instrument Modals - Type-Specific Edit Forms
 * SITES Spectral Stations & Instruments v6.3.0
 *
 * Architecture: Separation of Concerns
 * - Each instrument type has its own dedicated modal rendering function
 * - No conditionals within modals - clean, focused code
 * - Easy to debug and maintain
 * - Scalable for future instrument types (PAR, NDVI, PRI)
 */

/**
 * Categorize instrument type into phenocam, multispectral, or other
 * @param {string} instrumentType - The instrument type string
 * @returns {string} Category: 'phenocam', 'multispectral', or 'other'
 */
export function getInstrumentCategory(instrumentType) {
    if (!instrumentType) return 'other';

    const type = instrumentType.toLowerCase();

    // Phenocam category
    if (type.includes('phenocam')) {
        return 'phenocam';
    }

    // Multispectral sensor category
    if (type.includes('multispectral') ||
        type.includes('skye') ||
        type.includes('decagon') ||
        type.includes('apogee ms') ||
        type === 'ms sensor') {
        return 'multispectral';
    }

    // Everything else (PAR, NDVI, PRI, Other, legacy types)
    return 'other';
}

/**
 * Render Phenocam-specific edit modal
 * Sections: General Info, Camera Specs, Position, Timeline, System Config, Phenocam Processing, Documentation
 */
export function renderPhenocamModal(instrument, isAdmin) {
    // Import shared sections
    const section1 = renderGeneralInfoSection(instrument);
    const section2 = renderCameraSpecsSection(instrument);
    const section3 = renderPositionSection(instrument);
    const section4 = renderTimelineSection(instrument);
    const section5 = renderSystemConfigSection(instrument);
    const section6 = renderPhenocamProcessingSection(instrument);
    const section7 = renderDocumentationSection(instrument);

    return `
        ${!isAdmin ? '<div class="form-readonly-notice"><i class="fas fa-info-circle"></i> Some fields are read-only based on your permissions</div>' : ''}
        <form id="instrument-update-form">
            <input type="hidden" id="edit-instrument-id" value="${instrument.id}">
            ${section1}
            ${section2}
            ${section3}
            ${section4}
            ${section5}
            ${section6}
            ${section7}
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeInstrumentEditModal()">Cancel</button>
                <button type="submit" class="save-btn">
                    <i class="fas fa-save"></i> Save Changes
                </button>
            </div>
        </form>
    `;
}

/**
 * Render Multispectral Sensor-specific edit modal
 * Sections: General Info, Sensor Specs, Position, Timeline, System Config, Documentation
 * NOTE: NO Phenocam Processing section, NO ROI management
 */
export function renderMSSensorModal(instrument, isAdmin) {
    // Import shared sections
    const section1 = renderGeneralInfoSection(instrument);
    const section2 = renderSensorSpecsSection(instrument);
    const section3 = renderPositionSection(instrument);
    const section4 = renderTimelineSection(instrument);
    const section5 = renderSystemConfigSection(instrument);
    const section7 = renderDocumentationSection(instrument);

    return `
        ${!isAdmin ? '<div class="form-readonly-notice"><i class="fas fa-info-circle"></i> Some fields are read-only based on your permissions</div>' : ''}
        <form id="instrument-update-form">
            <input type="hidden" id="edit-instrument-id" value="${instrument.id}">
            ${section1}
            ${section2}
            ${section3}
            ${section4}
            ${section5}
            ${section7}
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeInstrumentEditModal()">Cancel</button>
                <button type="submit" class="save-btn">
                    <i class="fas fa-save"></i> Save Changes
                </button>
            </div>
        </form>
    `;
}

// ============================================================================
// SHARED SECTIONS (Used by multiple instrument types)
// ============================================================================

function renderGeneralInfoSection(instrument) {
    return `
    <!-- SECTION 1: General Information (5 fields) -->
    <div class="form-section">
        <h4 onclick="toggleSection(this)"><i class="fas fa-info-circle"></i> General Information</h4>
        <div class="form-section-content">
            <div class="form-group">
                <label>Instrument Name <span style="color: #ef4444;">*</span></label>
                <input type="text" id="edit-instrument-name" value="${instrument.display_name || ''}"
                       class="form-control" required aria-label="Instrument Name">
            </div>
            <div class="form-group">
                <label>Normalized ID</label>
                <input type="text" id="edit-instrument-normalized" value="${instrument.normalized_name || ''}"
                       class="form-control field-readonly" readonly aria-label="Normalized ID">
                <small class="form-text">System-generated identifier</small>
            </div>
            <div class="form-group">
                <label>Legacy Acronym</label>
                <input type="text" id="edit-instrument-legacy" value="${instrument.legacy_acronym || ''}"
                       class="form-control" placeholder="e.g., ANS-FOR-P01" aria-label="Legacy Acronym">
                <small class="form-text">Historical data compatibility</small>
            </div>
            <div class="form-group">
                <label>Status</label>
                <select id="edit-instrument-status" class="form-control" aria-label="Instrument Status">
                    <option value="Active" ${instrument.status === 'Active' ? 'selected' : ''}>Active</option>
                    <option value="Inactive" ${instrument.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                    <option value="Testing" ${instrument.status === 'Testing' ? 'selected' : ''}>Testing</option>
                    <option value="Maintenance" ${instrument.status === 'Maintenance' ? 'selected' : ''}>Maintenance</option>
                    <option value="Decommissioned" ${instrument.status === 'Decommissioned' ? 'selected' : ''}>Decommissioned</option>
                    <option value="Planned" ${instrument.status === 'Planned' ? 'selected' : ''}>Planned</option>
                </select>
            </div>
            <div class="form-group">
                <label>Measurement Status</label>
                <select id="edit-instrument-measurement-status" class="form-control" aria-label="Measurement Status">
                    <option value="">Select status...</option>
                    <option value="Active" ${instrument.measurement_status === 'Active' ? 'selected' : ''}>Active</option>
                    <option value="Inactive" ${instrument.measurement_status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                    <option value="Intermittent" ${instrument.measurement_status === 'Intermittent' ? 'selected' : ''}>Intermittent</option>
                    <option value="Seasonal" ${instrument.measurement_status === 'Seasonal' ? 'selected' : ''}>Seasonal</option>
                    <option value="Completed" ${instrument.measurement_status === 'Completed' ? 'selected' : ''}>Completed</option>
                </select>
            </div>
        </div>
    </div>
    `;
}

// Note: Due to length constraints, I'll create a separate continuation message for the remaining sections
// This modular approach allows us to build the functions piece by piece
