/**
 * MS Sensor Models Module
 *
 * Handles fetching and management of sensor model library data.
 * Provides integration with the sensor_models API for auto-population
 * of sensor specifications during instrument creation.
 *
 * @module ms-sensor-models
 * @version 6.1.0
 */

const MSSensorModels = (() => {
    'use strict';

    // Cache for sensor models
    let modelsCache = null;
    let cacheTimestamp = null;
    const CACHE_DURATION = 300000; // 5 minutes

    /**
     * Fetch all sensor models from API
     * @param {boolean} forceRefresh - Force cache refresh
     * @returns {Promise<array>} - Array of sensor model objects
     */
    async function fetchSensorModels(forceRefresh = false) {
        // Return cached data if valid
        if (!forceRefresh && modelsCache && cacheTimestamp) {
            const age = Date.now() - cacheTimestamp;
            if (age < CACHE_DURATION) {
                console.log('📦 Using cached sensor models');
                return modelsCache;
            }
        }

        try {
            // Auth via httpOnly cookie

            console.log('🔄 Fetching sensor models from API...');
            const response = await fetch('/api/sensor-models', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch sensor models: ${response.statusText}`);
            }

            const data = await response.json();
            modelsCache = data.models || [];
            cacheTimestamp = Date.now();

            console.log(`✅ Loaded ${modelsCache.length} sensor models`);
            return modelsCache;

        } catch (error) {
            console.error('❌ Error fetching sensor models:', error);
            throw error;
        }
    }

    /**
     * Get sensor model by ID
     * @param {number} modelId - Sensor model ID
     * @returns {Promise<object>} - Sensor model object
     */
    async function getSensorModelById(modelId) {
        const models = await fetchSensorModels();
        return models.find(m => m.id === modelId) || null;
    }

    /**
     * Get sensor models by manufacturer
     * @param {string} manufacturer - Manufacturer name (SKYE, APOGEE, etc.)
     * @returns {Promise<array>} - Array of matching sensor models
     */
    async function getSensorModelsByManufacturer(manufacturer) {
        const models = await fetchSensorModels();
        return models.filter(m => m.manufacturer === manufacturer);
    }

    /**
     * Get sensor models by type
     * @param {string} sensorType - Sensor type (Multispectral, PAR, NDVI, PRI)
     * @returns {Promise<array>} - Array of matching sensor models
     */
    async function getSensorModelsByType(sensorType) {
        const models = await fetchSensorModels();
        return models.filter(m => m.sensor_type === sensorType);
    }

    /**
     * Populate dropdown with sensor models
     * @param {string} selectId - ID of select element
     * @param {object} options - {groupBy: 'manufacturer'|'type', selected: id}
     * @returns {Promise<void>}
     */
    async function populateSensorModelsDropdown(selectId, options = {}) {
        try {
            const selectElement = document.getElementById(selectId);
            if (!selectElement) {
                console.error(`Select element ${selectId} not found`);
                return;
            }

            const models = await fetchSensorModels();

            // Clear existing options
            selectElement.innerHTML = '<option value="">Select sensor model...</option>';

            if (options.groupBy === 'manufacturer') {
                // Group by manufacturer
                const manufacturers = [...new Set(models.map(m => m.manufacturer))].sort();

                for (const manufacturer of manufacturers) {
                    const optgroup = document.createElement('optgroup');
                    optgroup.label = manufacturer;

                    const mfgModels = models.filter(m => m.manufacturer === manufacturer);
                    for (const model of mfgModels) {
                        const option = document.createElement('option');
                        option.value = model.id;
                        option.textContent = `${model.model_number} - ${model.model_name || model.sensor_type}`;
                        option.dataset.modelData = JSON.stringify(model);
                        if (options.selected && model.id === options.selected) {
                            option.selected = true;
                        }
                        optgroup.appendChild(option);
                    }

                    selectElement.appendChild(optgroup);
                }
            } else if (options.groupBy === 'type') {
                // Group by sensor type
                const types = [...new Set(models.map(m => m.sensor_type))].sort();

                for (const type of types) {
                    const optgroup = document.createElement('optgroup');
                    optgroup.label = type;

                    const typeModels = models.filter(m => m.sensor_type === type);
                    for (const model of typeModels) {
                        const option = document.createElement('option');
                        option.value = model.id;
                        option.textContent = `${model.manufacturer} ${model.model_number}`;
                        option.dataset.modelData = JSON.stringify(model);
                        if (options.selected && model.id === options.selected) {
                            option.selected = true;
                        }
                        optgroup.appendChild(option);
                    }

                    selectElement.appendChild(optgroup);
                }
            } else {
                // Flat list
                for (const model of models) {
                    const option = document.createElement('option');
                    option.value = model.id;
                    option.textContent = `${model.manufacturer} ${model.model_number}`;
                    option.dataset.modelData = JSON.stringify(model);
                    if (options.selected && model.id === options.selected) {
                        option.selected = true;
                    }
                    selectElement.appendChild(option);
                }
            }

            console.log(`✅ Populated ${selectId} with ${models.length} sensor models`);

        } catch (error) {
            console.error('❌ Error populating sensor models dropdown:', error);
        }
    }

    /**
     * Get selected sensor model data from dropdown
     * @param {string} selectId - ID of select element
     * @returns {object|null} - Sensor model object or null
     */
    function getSelectedSensorModel(selectId) {
        const selectElement = document.getElementById(selectId);
        if (!selectElement || !selectElement.value) {
            return null;
        }

        const selectedOption = selectElement.options[selectElement.selectedIndex];
        if (!selectedOption || !selectedOption.dataset.modelData) {
            return null;
        }

        try {
            return JSON.parse(selectedOption.dataset.modelData);
        } catch (error) {
            console.error('Error parsing sensor model data:', error);
            return null;
        }
    }

    /**
     * Auto-populate form fields from selected sensor model
     * @param {object} sensorModel - Sensor model object
     * @param {object} fieldMapping - Map of model fields to form field IDs
     * @returns {object} - Populated fields summary
     */
    function autoPopulateFromSensorModel(sensorModel, fieldMapping) {
        const populated = {};

        for (const [modelField, formFieldId] of Object.entries(fieldMapping)) {
            const value = sensorModel[modelField];
            if (value !== null && value !== undefined) {
                const element = document.getElementById(formFieldId);
                if (element) {
                    element.value = value;
                    populated[modelField] = value;
                }
            }
        }

        console.log('✅ Auto-populated fields from sensor model:', populated);
        return populated;
    }

    /**
     * Get suggested channel configurations from sensor model
     * @param {object} sensorModel - Sensor model object
     * @returns {array} - Array of channel configuration arrays
     */
    function getSuggestedChannelConfigs(sensorModel) {
        if (!sensorModel || !sensorModel.available_channels_config) {
            return [];
        }

        // available_channels_config is already parsed by API
        return sensorModel.available_channels_config || [];
    }

    /**
     * Create channel objects from wavelength array
     * @param {array} wavelengths - Array of wavelengths
     * @param {number} defaultBandwidth - Default bandwidth (10nm typical)
     * @returns {array} - Array of channel objects
     */
    function createChannelsFromWavelengths(wavelengths, defaultBandwidth = 10) {
        return wavelengths.map((wl, index) => {
            const bandType = classifyWavelength(wl);
            return {
                channel_number: index + 1,
                channel_name: MSValidation.generateChannelName(bandType, wl, defaultBandwidth),
                center_wavelength_nm: wl,
                bandwidth_nm: defaultBandwidth,
                wavelength_notation: MSValidation.generateWavelengthNotation(defaultBandwidth),
                band_type: bandType
            };
        });
    }

    /**
     * Classify wavelength into band type
     * @param {number} wavelength - Wavelength in nm
     * @returns {string} - Band type (Blue, Green, Red, NIR, Far-Red, Custom)
     */
    function classifyWavelength(wavelength) {
        if (wavelength >= 400 && wavelength < 500) return 'Blue';
        if (wavelength >= 500 && wavelength < 600) return 'Green';
        if (wavelength >= 600 && wavelength < 700) return 'Red';
        if (wavelength >= 700 && wavelength < 750) return 'Far-Red';
        if (wavelength >= 750 && wavelength <= 1000) return 'NIR';
        return 'Custom';
    }

    /**
     * Get list of unique manufacturers
     * @returns {Promise<array>} - Array of manufacturer names
     */
    async function getManufacturers() {
        const models = await fetchSensorModels();
        return [...new Set(models.map(m => m.manufacturer))].sort();
    }

    /**
     * Get list of unique sensor types
     * @returns {Promise<array>} - Array of sensor types
     */
    async function getSensorTypes() {
        const models = await fetchSensorModels();
        return [...new Set(models.map(m => m.sensor_type))].filter(t => t).sort();
    }

    // Public API
    return {
        fetchSensorModels,
        getSensorModelById,
        getSensorModelsByManufacturer,
        getSensorModelsByType,
        populateSensorModelsDropdown,
        getSelectedSensorModel,
        autoPopulateFromSensorModel,
        getSuggestedChannelConfigs,
        createChannelsFromWavelengths,
        classifyWavelength,
        getManufacturers,
        getSensorTypes
    };
})();

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.MSSensorModels = MSSensorModels;
}
