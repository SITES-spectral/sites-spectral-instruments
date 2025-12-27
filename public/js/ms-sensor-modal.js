/**
 * MS Sensor Modal Module
 *
 * Main module for MS sensor creation and editing modals.
 * Integrates validation, sensor models, and channel management
 * into a cohesive 5-tab interface for multispectral instrument management.
 *
 * @module ms-sensor-modal
 * @version 6.1.0
 * @requires ms-validation.js
 * @requires ms-sensor-models.js
 * @requires ms-channel-manager.js
 */

const MSSensorModal = (() => {
    'use strict';

    let currentPlatformId = null;
    let currentSensorModel = null;
    let currentInstrumentId = null; // For edit mode

    /**
     * Show MS sensor creation modal
     * @param {number} platformId - Platform ID
     * @param {object} platformData - Platform data object
     */
    function showCreationModal(platformId, platformData) {
        currentPlatformId = platformId;
        currentInstrumentId = null;
        currentSensorModel = null;

        // Initialize channel manager
        MSChannelManager.init([]);

        // Build and show modal
        const modal = document.getElementById('ms-sensor-creation-modal');
        if (!modal) {
            console.error('MS sensor creation modal not found');
            return;
        }

        // Populate platform info
        document.getElementById('ms-platform-name').textContent = platformData.display_name || platformData.normalized_name;

        // Load sensor models dropdown
        MSSensorModels.populateSensorModelsDropdown('ms-sensor-model-select', {
            groupBy: 'manufacturer'
        });

        // Reset form
        resetCreationForm();

        // Show modal
        modal.classList.add('show');

        // Default to first tab
        showTab('basic-info');

        console.log(`📋 MS sensor creation modal opened for platform ${platformId}`);
    }

    /**
     * Show MS sensor edit modal
     * @param {number} instrumentId - Instrument ID
     * @param {object} instrumentData - Instrument data object
     */
    async function showEditModal(instrumentId, instrumentData) {
        currentInstrumentId = instrumentId;
        currentPlatformId = instrumentData.platform_id;
        currentSensorModel = null;

        // Load existing channels
        const channels = await MSChannelManager.loadChannelsFromServer(instrumentId);
        MSChannelManager.init(channels);

        // Build and show modal
        const modal = document.getElementById('ms-sensor-edit-modal');
        if (!modal) {
            console.error('MS sensor edit modal not found');
            return;
        }

        // Populate form with existing data
        populateEditForm(instrumentData);

        // Render channels table
        MSChannelManager.renderChannelsTable('ms-edit-channels-table', true);

        // Show modal
        modal.classList.add('show');

        console.log(`📋 MS sensor edit modal opened for instrument ${instrumentId}`);
    }

    /**
     * Close MS sensor creation modal
     */
    function closeCreationModal() {
        const modal = document.getElementById('ms-sensor-creation-modal');
        if (modal) {
            modal.classList.remove('show');
        }
        currentPlatformId = null;
        currentSensorModel = null;
        MSChannelManager.clearChannels();
    }

    /**
     * Close MS sensor edit modal
     */
    function closeEditModal() {
        const modal = document.getElementById('ms-sensor-edit-modal');
        if (modal) {
            modal.classList.remove('show');
        }
        currentInstrumentId = null;
        MSChannelManager.clearChannels();
    }

    /**
     * Show specific tab in modal
     * @param {string} tabId - Tab identifier
     */
    function showTab(tabId) {
        // Hide all tabs
        const tabs = document.querySelectorAll('.ms-tab-content');
        tabs.forEach(tab => tab.classList.remove('active'));

        // Remove active class from all tab buttons
        const tabButtons = document.querySelectorAll('.ms-tab-button');
        tabButtons.forEach(btn => btn.classList.remove('active'));

        // Show selected tab
        const selectedTab = document.getElementById(`ms-tab-${tabId}`);
        if (selectedTab) {
            selectedTab.classList.add('active');
        }

        // Highlight active tab button
        const selectedButton = document.querySelector(`[data-tab="${tabId}"]`);
        if (selectedButton) {
            selectedButton.classList.add('active');
        }

        console.log(`📑 Switched to tab: ${tabId}`);
    }

    /**
     * Handle sensor model selection
     */
    function handleSensorModelSelection() {
        const selectedModel = MSSensorModels.getSelectedSensorModel('ms-sensor-model-select');
        if (!selectedModel) {
            currentSensorModel = null;
            return;
        }

        currentSensorModel = selectedModel;
        console.log('📡 Selected sensor model:', selectedModel);

        // Auto-populate fields
        const fieldMapping = {
            'manufacturer': 'ms-sensor-brand',
            'model_number': 'ms-sensor-model',
            'field_of_view_degrees': 'ms-field-of-view',
            'wavelength_range_min_nm': 'ms-wavelength-range-info-min',
            'wavelength_range_max_nm': 'ms-wavelength-range-info-max'
        };

        MSSensorModels.autoPopulateFromSensorModel(selectedModel, fieldMapping);

        // Show wavelength range info
        const rangeInfo = document.getElementById('ms-wavelength-range-info');
        if (rangeInfo && selectedModel.wavelength_range_min_nm && selectedModel.wavelength_range_max_nm) {
            rangeInfo.innerHTML = `
                <small class="text-info">
                    <i class="fas fa-info-circle"></i>
                    This model supports ${selectedModel.wavelength_range_min_nm}-${selectedModel.wavelength_range_max_nm}nm
                </small>
            `;
        }

        // Offer to pre-populate channels
        if (selectedModel.available_channels_config && selectedModel.available_channels_config.length > 0) {
            showChannelConfigOptions(selectedModel);
        }
    }

    /**
     * Show channel configuration options from sensor model
     * @param {object} sensorModel - Sensor model object
     */
    function showChannelConfigOptions(sensorModel) {
        const configs = MSSensorModels.getSuggestedChannelConfigs(sensorModel);
        if (configs.length === 0) return;

        const container = document.getElementById('ms-channel-config-options');
        if (!container) return;

        let html = `
            <div class="alert alert-info">
                <strong>Suggested Channel Configurations:</strong>
                <div class="mt-2">
        `;

        configs.forEach((config, index) => {
            html += `
                <button type="button" class="btn btn-sm btn-outline-primary mr-2 mb-2"
                        onclick="MSSensorModal.applyChannelConfig('${index}')">
                    ${config.length}-channel (${config.join(', ')}nm)
                </button>
            `;
        });

        html += `
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    /**
     * Apply channel configuration from sensor model
     * @param {number} configIndex - Configuration index
     */
    function applyChannelConfig(configIndex) {
        if (!currentSensorModel || !currentSensorModel.available_channels_config) {
            return;
        }

        const config = currentSensorModel.available_channels_config[configIndex];
        if (!config) return;

        // Clear existing channels
        MSChannelManager.clearChannels();

        // Create channels from wavelengths
        const channels = MSSensorModels.createChannelsFromWavelengths(config, 10);

        // Add channels
        channels.forEach(ch => MSChannelManager.addChannel(ch));

        // Update number_of_channels field
        document.getElementById('ms-number-of-channels').value = channels.length;

        // Render channels table
        MSChannelManager.renderChannelsTable('ms-channels-table', true);

        alert(`Applied ${channels.length}-channel configuration`);
        console.log(`✅ Applied ${channels.length}-channel config`);
    }

    /**
     * Save MS sensor instrument
     */
    async function saveMSSensor() {
        try {
            // Collect form data
            const formData = collectFormData();

            // Get channels
            const channels = MSChannelManager.getChannels();

            // Validate
            const validation = MSValidation.validateMSInstrumentForm(formData, channels);
            if (!validation.valid) {
                alert(`Validation errors:\n${validation.errors.join('\n')}`);
                return;
            }

            // Show loading state
            const saveButton = document.getElementById('ms-save-button');
            if (saveButton) {
                saveButton.disabled = true;
                saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            }

            // Create instrument
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/instruments', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create MS sensor');
            }

            const result = await response.json();
            const instrumentId = result.id;

            console.log(`✅ Created MS sensor instrument ID ${instrumentId}`);

            // Save channels
            const channelsSaved = await MSChannelManager.saveChannelsToServer(instrumentId);
            if (!channelsSaved) {
                console.warn('⚠️ Some channels may not have saved correctly');
            }

            // Success notification
            showNotification('MS sensor created successfully!', 'success');

            // Close modal and refresh
            closeCreationModal();
            if (typeof loadPlatformsAndInstruments === 'function') {
                await loadPlatformsAndInstruments();
            }

        } catch (error) {
            console.error('❌ Error saving MS sensor:', error);
            alert(`Error: ${error.message}`);
        } finally {
            // Reset button state
            const saveButton = document.getElementById('ms-save-button');
            if (saveButton) {
                saveButton.disabled = false;
                saveButton.innerHTML = '<i class="fas fa-save"></i> Save MS Sensor';
            }
        }
    }

    /**
     * Collect form data from all tabs
     * @returns {object} - Form data object
     */
    function collectFormData() {
        return {
            platform_id: currentPlatformId,
            instrument_type: document.getElementById('ms-instrument-type')?.value || 'Multispectral Sensor',
            display_name: document.getElementById('ms-display-name')?.value,
            sensor_brand: document.getElementById('ms-sensor-brand')?.value,
            sensor_model: document.getElementById('ms-sensor-model')?.value,
            sensor_serial_number: document.getElementById('ms-sensor-serial')?.value,
            orientation: document.getElementById('ms-orientation')?.value,
            number_of_channels: parseInt(document.getElementById('ms-number-of-channels')?.value),
            deployment_date: document.getElementById('ms-deployment-date')?.value,
            ecosystem_code: document.getElementById('ms-ecosystem-code')?.value,
            latitude: parseFloat(document.getElementById('ms-latitude')?.value) || null,
            longitude: parseFloat(document.getElementById('ms-longitude')?.value) || null,
            instrument_height_m: parseFloat(document.getElementById('ms-height')?.value) || null,
            azimuth_degrees: parseFloat(document.getElementById('ms-azimuth')?.value) || null,
            degrees_from_nadir: parseFloat(document.getElementById('ms-nadir')?.value) || null,
            field_of_view_degrees: parseFloat(document.getElementById('ms-field-of-view')?.value) || null,
            cable_length_m: parseFloat(document.getElementById('ms-cable-length')?.value) || null,
            datalogger_type: document.getElementById('ms-datalogger-type')?.value,
            datalogger_program_normal: document.getElementById('ms-datalogger-program')?.value,
            datalogger_program_calibration: document.getElementById('ms-calibration-program')?.value,
            calibration_date: document.getElementById('ms-calibration-date')?.value,
            calibration_notes: document.getElementById('ms-calibration-notes')?.value,
            description: document.getElementById('ms-description')?.value,
            installation_notes: document.getElementById('ms-installation-notes')?.value
        };
    }

    /**
     * Reset creation form
     */
    function resetCreationForm() {
        // Clear all input fields
        const inputs = document.querySelectorAll('#ms-sensor-creation-modal input, #ms-sensor-creation-modal select, #ms-sensor-creation-modal textarea');
        inputs.forEach(input => {
            if (input.type === 'checkbox') {
                input.checked = false;
            } else {
                input.value = '';
            }
        });

        // Set defaults
        document.getElementById('ms-datalogger-type').value = 'Campbell Scientific CR1000X';
        document.getElementById('ms-orientation').value = 'uplooking';

        // Clear channels
        MSChannelManager.clearChannels();
        MSChannelManager.renderChannelsTable('ms-channels-table', true);
    }

    /**
     * Populate edit form with existing data
     * @param {object} instrumentData - Instrument data
     */
    function populateEditForm(instrumentData) {
        if (!instrumentData) {
            console.warn('No instrument data provided for edit form');
            return;
        }

        // Helper to safely set form field value
        const setFieldValue = (elementId, value) => {
            const element = document.getElementById(elementId);
            if (element && value !== null && value !== undefined) {
                element.value = value;
            }
        };

        // Basic info tab
        setFieldValue('ms-edit-display-name', instrumentData.display_name);
        setFieldValue('ms-edit-instrument-type', instrumentData.instrument_type);
        setFieldValue('ms-edit-sensor-brand', instrumentData.sensor_brand);
        setFieldValue('ms-edit-sensor-model', instrumentData.sensor_model);
        setFieldValue('ms-edit-sensor-serial', instrumentData.sensor_serial_number);
        setFieldValue('ms-edit-orientation', instrumentData.orientation);
        setFieldValue('ms-edit-number-of-channels', instrumentData.number_of_channels);

        // Position tab
        setFieldValue('ms-edit-latitude', instrumentData.latitude);
        setFieldValue('ms-edit-longitude', instrumentData.longitude);
        setFieldValue('ms-edit-height', instrumentData.instrument_height_m);
        setFieldValue('ms-edit-azimuth', instrumentData.azimuth_degrees);
        setFieldValue('ms-edit-nadir', instrumentData.degrees_from_nadir);
        setFieldValue('ms-edit-field-of-view', instrumentData.field_of_view_degrees);
        setFieldValue('ms-edit-ecosystem-code', instrumentData.ecosystem_code);

        // Datalogger tab
        setFieldValue('ms-edit-cable-length', instrumentData.cable_length_m);
        setFieldValue('ms-edit-datalogger-type', instrumentData.datalogger_type);
        setFieldValue('ms-edit-datalogger-program', instrumentData.datalogger_program_normal);
        setFieldValue('ms-edit-calibration-program', instrumentData.datalogger_program_calibration);

        // Calibration tab
        setFieldValue('ms-edit-calibration-date', instrumentData.calibration_date);
        setFieldValue('ms-edit-deployment-date', instrumentData.deployment_date);
        setFieldValue('ms-edit-calibration-notes', instrumentData.calibration_notes);

        // Notes tab
        setFieldValue('ms-edit-description', instrumentData.description);
        setFieldValue('ms-edit-installation-notes', instrumentData.installation_notes);

        // Update orientation-dependent fields visibility
        handleOrientationChange();

        console.log('Edit form populated with instrument data:', instrumentData.display_name);
    }

    /**
     * Handle orientation change to show/hide conditional fields
     */
    function handleOrientationChange() {
        const orientation = document.getElementById('ms-orientation')?.value;
        const azimuthGroup = document.getElementById('ms-azimuth-group');
        const nadirGroup = document.getElementById('ms-nadir-group');

        if (orientation === 'downlooking') {
            if (azimuthGroup) azimuthGroup.style.display = 'block';
            if (nadirGroup) nadirGroup.style.display = 'block';
        } else {
            if (azimuthGroup) azimuthGroup.style.display = 'none';
            if (nadirGroup) nadirGroup.style.display = 'none';
        }
    }

    // Public API
    return {
        showCreationModal,
        showEditModal,
        closeCreationModal,
        closeEditModal,
        showTab,
        handleSensorModelSelection,
        applyChannelConfig,
        saveMSSensor,
        handleOrientationChange
    };
})();

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.MSSensorModal = MSSensorModal;
}
