/**
 * Example Integration - Modular Modal System
 * SITES Spectral v8.0.0-alpha.2
 *
 * Complete example showing how to integrate the modular modal system
 * into the SITES Spectral application.
 *
 * This file demonstrates:
 * 1. Loading configuration from YAML
 * 2. Building instrument-specific modals
 * 3. Handling form submission
 * 4. Validation and error handling
 * 5. Integration with existing codebase
 */

// ============================================================================
// CONFIGURATION LOADER
// ============================================================================

class ModalConfigLoader {
    /**
     * Load all configuration needed for modals
     * @returns {Promise<Object>} Configuration object
     */
    static async loadConfiguration() {
        try {
            // In production, these would be API calls
            // For now, we'll use the existing global config if available
            const config = {
                statusOptions: await ModalConfigLoader._loadStatusOptions(),
                measurementStatusOptions: ModalConfigLoader._getMeasurementStatuses(),
                instrumentTypes: await ModalConfigLoader._loadInstrumentTypes(),
                ecosystemCodes: await ModalConfigLoader._loadEcosystemCodes(),
                powerSources: ModalConfigLoader._getPowerSources(),
                transmissionMethods: ModalConfigLoader._getTransmissionMethods(),
                viewingDirections: ModalConfigLoader._getViewingDirections(),
                maxLengths: {
                    description: 1000,
                    installation_notes: 1000,
                    maintenance_notes: 1000,
                    calibration_notes: 500
                }
            };

            return config;
        } catch (error) {
            console.error('Failed to load modal configuration:', error);
            return ModalConfigLoader._getDefaultConfig();
        }
    }

    /**
     * Load status options from status.yaml
     * @private
     */
    static async _loadStatusOptions() {
        // TODO: Replace with actual API call
        // const response = await fetch('/api/config/status');
        // const statusData = await response.json();

        // Default statuses (fallback)
        return [
            { value: 'Active', label: 'Active', description: 'Currently operational' },
            { value: 'Inactive', label: 'Inactive', description: 'Temporarily not in use' },
            { value: 'Testing', label: 'Testing', description: 'Being tested' },
            { value: 'Maintenance', label: 'Maintenance', description: 'Under maintenance' },
            { value: 'Decommissioned', label: 'Decommissioned', description: 'Permanently retired' },
            { value: 'Planned', label: 'Planned', description: 'Approved for future' }
        ];
    }

    /**
     * Load instrument types from instrument-types.yaml
     * @private
     */
    static async _loadInstrumentTypes() {
        // TODO: Replace with actual API call
        return [
            { value: '', label: 'Select type...' },
            { value: 'Phenocam', label: 'Phenocam' },
            { value: 'Multispectral Sensor', label: 'Multispectral Sensor' },
            { value: 'PAR Sensor', label: 'PAR Sensor' },
            { value: 'NDVI Sensor', label: 'NDVI Sensor' },
            { value: 'PRI Sensor', label: 'PRI Sensor' },
            { value: 'Hyperspectral', label: 'Hyperspectral' }
        ];
    }

    /**
     * Load ecosystem codes from ecosystems.yaml
     * @private
     */
    static async _loadEcosystemCodes() {
        return [
            { value: '', label: 'Select ecosystem...' },
            { value: 'FOR', label: 'FOR - Forest' },
            { value: 'AGR', label: 'AGR - Arable Land' },
            { value: 'MIR', label: 'MIR - Mires' },
            { value: 'LAK', label: 'LAK - Lake' },
            { value: 'WET', label: 'WET - Wetland' },
            { value: 'GRA', label: 'GRA - Grassland' },
            { value: 'ALP', label: 'ALP - Alpine Forest' },
            { value: 'HEA', label: 'HEA - Heathland' },
            { value: 'CON', label: 'CON - Coniferous Forest' },
            { value: 'DEC', label: 'DEC - Deciduous Forest' },
            { value: 'MAR', label: 'MAR - Marshland' },
            { value: 'PEA', label: 'PEA - Peatland' }
        ];
    }

    /**
     * Get measurement status options
     * @private
     */
    static _getMeasurementStatuses() {
        return [
            { value: '', label: 'Select status...' },
            { value: 'Active', label: 'Active' },
            { value: 'Inactive', label: 'Inactive' },
            { value: 'Intermittent', label: 'Intermittent' },
            { value: 'Seasonal', label: 'Seasonal' },
            { value: 'Completed', label: 'Completed' }
        ];
    }

    /**
     * Get power source options
     * @private
     */
    static _getPowerSources() {
        return [
            { value: '', label: 'Select power source...' },
            { value: 'Solar', label: '☀️ Solar' },
            { value: 'Grid', label: '🔌 Grid' },
            { value: 'Battery', label: '🔋 Battery' },
            { value: 'Solar + Battery', label: '☀️🔋 Solar + Battery' },
            { value: 'Wind', label: '💨 Wind' },
            { value: 'Other', label: 'Other' }
        ];
    }

    /**
     * Get data transmission methods
     * @private
     */
    static _getTransmissionMethods() {
        return [
            { value: '', label: 'Select transmission method...' },
            { value: 'WiFi', label: '📡 WiFi' },
            { value: 'Ethernet', label: '🔗 Ethernet' },
            { value: 'Cellular', label: '📱 Cellular (4G/5G)' },
            { value: 'LoRaWAN', label: '📻 LoRaWAN' },
            { value: 'Satellite', label: '🛰️ Satellite' },
            { value: 'SD Card', label: '💾 SD Card (Manual)' },
            { value: 'USB', label: '🔌 USB (Manual)' }
        ];
    }

    /**
     * Get viewing directions
     * @private
     */
    static _getViewingDirections() {
        return [
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
    }

    /**
     * Get default configuration (fallback)
     * @private
     */
    static _getDefaultConfig() {
        return {
            statusOptions: ModalConfigLoader._loadStatusOptions(),
            measurementStatusOptions: ModalConfigLoader._getMeasurementStatuses(),
            instrumentTypes: ModalConfigLoader._loadInstrumentTypes(),
            ecosystemCodes: ModalConfigLoader._loadEcosystemCodes(),
            powerSources: ModalConfigLoader._getPowerSources(),
            transmissionMethods: ModalConfigLoader._getTransmissionMethods(),
            viewingDirections: ModalConfigLoader._getViewingDirections(),
            maxLengths: {
                description: 1000,
                installation_notes: 1000,
                maintenance_notes: 1000,
                calibration_notes: 500
            }
        };
    }
}

// ============================================================================
// MODAL BUILDER
// ============================================================================

class InstrumentModalBuilder {
    /**
     * Build complete instrument edit modal
     * @param {Object} instrument - Instrument data
     * @param {Object} config - Configuration object
     * @returns {string} Complete modal HTML
     */
    static build(instrument, config) {
        const sections = [
            GeneralInfoSection.render(instrument, config),
            PositionSection.render(instrument, config),
            TimelineSection.render(instrument, config),
            SystemConfigSection.render(instrument, config),
            DocumentationSection.render(instrument, config)
        ].join('');

        return `
            <form id="instrument-edit-form" class="instrument-modal-form">
                ${sections}
            </form>
        `;
    }

    /**
     * Extract all form data
     * @returns {Object} Combined data from all sections
     */
    static extractData() {
        return {
            ...GeneralInfoSection.extractData(document.querySelector('[data-section="general-info"]')),
            ...PositionSection.extractData(document.querySelector('[data-section="position"]')),
            ...TimelineSection.extractData(document.querySelector('[data-section="timeline"]')),
            ...SystemConfigSection.extractData(document.querySelector('[data-section="system-config"]')),
            ...DocumentationSection.extractData(document.querySelector('[data-section="documentation"]'))
        };
    }

    /**
     * Validate all form data
     * @param {Object} data - Data to validate
     * @param {Object} config - Configuration object
     * @returns {Object} { valid: boolean, errors: Array }
     */
    static validateAll(data, config) {
        const validations = [
            GeneralInfoSection.validate(data),
            PositionSection.validate(data),
            TimelineSection.validate(data),
            SystemConfigSection.validate(data),
            DocumentationSection.validate(data, config)
        ];

        const allErrors = validations.flatMap(v => v.errors);

        return {
            valid: allErrors.length === 0,
            errors: allErrors
        };
    }
}

// ============================================================================
// MAIN INTEGRATION FUNCTIONS
// ============================================================================

/**
 * Show instrument edit modal (replaces existing showInstrumentEditModal)
 * @param {Object} instrument - Instrument data
 */
async function showInstrumentEditModal(instrument) {
    try {
        // Load configuration
        const config = await ModalConfigLoader.loadConfiguration();

        // Get or create modal container
        let modalElement = document.getElementById('instrument-edit-modal');
        if (!modalElement) {
            modalElement = createModalContainer('instrument-edit-modal');
            document.body.appendChild(modalElement);
        }

        // Create modal instance
        const modal = new ModalBase(modalElement, {
            closeOnEscape: true,
            closeOnBackdrop: false
        });

        // Build modal content
        const modalContent = InstrumentModalBuilder.build(instrument, config);

        // Configure modal
        modal
            .setTitle(`Edit ${instrument.display_name || 'Instrument'}`, 'edit')
            .setContent(modalContent)
            .setFooter([
                {
                    text: 'Cancel',
                    className: 'btn btn-secondary',
                    onClick: () => modal.cancel()
                },
                {
                    text: 'Save Changes',
                    icon: 'save',
                    className: 'btn btn-primary save-btn',
                    onClick: async () => {
                        return await handleModalSave(modal, config, instrument);
                    }
                }
            ])
            .onCancel(() => {
                console.log('Edit cancelled');
            })
            .show();

        // Initialize map preview if coordinates exist
        if (instrument.latitude && instrument.longitude) {
            setTimeout(() => {
                PositionSection.initializeMap(instrument, 'position-map');
            }, 100);
        }

        // Attach to global scope for debugging
        window.currentModal = modal;

    } catch (error) {
        console.error('Error showing instrument edit modal:', error);
        alert('Failed to load edit form. Please try again.');
    }
}

/**
 * Handle modal save action
 * @param {ModalBase} modal - Modal instance
 * @param {Object} config - Configuration
 * @param {Object} originalInstrument - Original instrument data
 * @returns {Promise<boolean>} True to close modal, false to keep open
 */
async function handleModalSave(modal, config, originalInstrument) {
    try {
        // Extract form data
        const formData = InstrumentModalBuilder.extractData();

        // Validate
        const validation = InstrumentModalBuilder.validateAll(formData, config);

        if (!validation.valid) {
            displayValidationErrors(validation.errors);
            return false; // Keep modal open
        }

        // Show loading state
        const saveButton = document.querySelector('.save-btn');
        const originalText = saveButton.innerHTML;
        saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        saveButton.disabled = true;

        // Merge with original data to preserve fields not in form
        const updatedInstrument = {
            ...originalInstrument,
            ...formData,
            id: originalInstrument.id,
            updated_at: new Date().toISOString()
        };

        // Save to API
        const response = await fetch(`/api/instruments/${originalInstrument.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify(updatedInstrument)
        });

        if (!response.ok) {
            throw new Error(`Save failed: ${response.statusText}`);
        }

        // Success notification
        showNotification('Instrument updated successfully', 'success');

        // Reload data on page
        if (typeof loadInstrumentData === 'function') {
            await loadInstrumentData();
        }

        return true; // Close modal

    } catch (error) {
        console.error('Error saving instrument:', error);
        showNotification(`Failed to save: ${error.message}`, 'error');

        // Restore button state
        const saveButton = document.querySelector('.save-btn');
        if (saveButton) {
            saveButton.innerHTML = '<i class="fas fa-save"></i> Save Changes';
            saveButton.disabled = false;
        }

        return false; // Keep modal open
    }
}

/**
 * Display validation errors to user
 * @param {Array<string>} errors - Validation error messages
 */
function displayValidationErrors(errors) {
    const errorContainer = document.getElementById('modal-error-container') ||
        createErrorContainer();

    errorContainer.innerHTML = `
        <div class="alert alert-danger" role="alert">
            <h5><i class="fas fa-exclamation-triangle"></i> Validation Errors</h5>
            <ul class="error-list">
                ${errors.map(err => `<li>${err}</li>`).join('')}
            </ul>
        </div>
    `;

    // Scroll to top of modal to show errors
    const modalBody = document.querySelector('.modal-body');
    if (modalBody) {
        modalBody.scrollTop = 0;
    }
}

/**
 * Create error container if not exists
 * @returns {HTMLElement} Error container element
 */
function createErrorContainer() {
    const container = document.createElement('div');
    container.id = 'modal-error-container';
    container.style.marginBottom = '1rem';

    const modalBody = document.querySelector('.modal-body');
    if (modalBody) {
        modalBody.insertBefore(container, modalBody.firstChild);
    }

    return container;
}

/**
 * Create modal HTML container
 * @param {string} id - Modal element ID
 * @returns {HTMLElement} Modal container element
 */
function createModalContainer(id) {
    const modal = document.createElement('div');
    modal.id = id;
    modal.className = 'modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-hidden', 'true');

    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title"></h3>
                    <button type="button" class="modal-close" onclick="this.closest('.modal').style.display='none'">
                        <i class="fas fa-times" aria-hidden="true"></i>
                    </button>
                </div>
                <div class="modal-body"></div>
                <div class="modal-footer"></div>
            </div>
        </div>
    `;

    return modal;
}

/**
 * Show notification toast
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, warning, info)
 */
function showNotification(message, type = 'info') {
    // Use existing notification system if available
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
        return;
    }

    // Fallback: simple alert
    console.log(`[${type.toUpperCase()}] ${message}`);
    alert(message);
}

/**
 * Get auth token from session/localStorage
 * @returns {string} JWT token
 */
function getAuthToken() {
    return localStorage.getItem('auth_token') ||
           sessionStorage.getItem('auth_token') ||
           '';
}

// ============================================================================
// SECTION TOGGLE HELPER (for collapsible sections)
// ============================================================================

/**
 * Toggle section collapse/expand
 * @param {HTMLElement} headerElement - Section header element
 */
function toggleSection(headerElement) {
    const section = headerElement.closest('.form-section');
    if (!section) return;

    section.classList.toggle('collapsed');

    const content = section.querySelector('.form-section-content');
    const icon = headerElement.querySelector('.section-toggle-icon');

    if (content) {
        const isCollapsed = section.classList.contains('collapsed');
        content.style.display = isCollapsed ? 'none' : 'block';

        // Rotate icon
        if (icon) {
            icon.style.transform = isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)';
        }

        // Update ARIA
        headerElement.setAttribute('aria-expanded', !isCollapsed);
    }
}

// ============================================================================
// EXPORTS AND GLOBAL ASSIGNMENTS
// ============================================================================

// Make functions globally available for onclick handlers
if (typeof window !== 'undefined') {
    window.showInstrumentEditModal = showInstrumentEditModal;
    window.toggleSection = toggleSection;
    window.ModalConfigLoader = ModalConfigLoader;
    window.InstrumentModalBuilder = InstrumentModalBuilder;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ModalConfigLoader,
        InstrumentModalBuilder,
        showInstrumentEditModal,
        toggleSection
    };
}
