/**
 * MS Sensor Validation Module
 *
 * Provides validation functions for multispectral sensor parameters including
 * wavelength ranges, bandwidth validation, and sensor model compatibility checks.
 *
 * @module ms-validation
 * @version 6.1.0
 */

const MSValidation = (() => {
    'use strict';

    // Validation constants
    const WAVELENGTH_MIN = 300;  // nm
    const WAVELENGTH_MAX = 1200; // nm
    const BANDWIDTH_MIN = 1;     // nm
    const BANDWIDTH_MAX = 200;   // nm

    /**
     * Validate wavelength is within acceptable range
     * @param {number} wavelength - Wavelength in nanometers
     * @param {object} sensorModel - Optional sensor model for range checking
     * @returns {object} - {valid: boolean, message: string}
     */
    function validateWavelength(wavelength, sensorModel = null) {
        const wl = parseInt(wavelength);

        if (isNaN(wl)) {
            return { valid: false, message: 'Wavelength must be a number' };
        }

        if (wl < WAVELENGTH_MIN || wl > WAVELENGTH_MAX) {
            return {
                valid: false,
                message: `Wavelength must be between ${WAVELENGTH_MIN}-${WAVELENGTH_MAX}nm (typical sensor range)`
            };
        }

        // If sensor model provided, check against model's range
        if (sensorModel && sensorModel.wavelength_range_min_nm && sensorModel.wavelength_range_max_nm) {
            if (wl < sensorModel.wavelength_range_min_nm || wl > sensorModel.wavelength_range_max_nm) {
                return {
                    valid: false,
                    message: `Wavelength outside sensor model range (${sensorModel.wavelength_range_min_nm}-${sensorModel.wavelength_range_max_nm}nm for ${sensorModel.model_number})`
                };
            }
        }

        return { valid: true, message: 'Valid wavelength' };
    }

    /**
     * Validate bandwidth is within acceptable range
     * @param {number} bandwidth - Bandwidth in nanometers (FWHM)
     * @returns {object} - {valid: boolean, message: string}
     */
    function validateBandwidth(bandwidth) {
        const bw = parseInt(bandwidth);

        if (isNaN(bw)) {
            return { valid: false, message: 'Bandwidth must be a number' };
        }

        if (bw < BANDWIDTH_MIN || bw > BANDWIDTH_MAX) {
            return {
                valid: false,
                message: `Bandwidth must be between ${BANDWIDTH_MIN}-${BANDWIDTH_MAX}nm`
            };
        }

        return { valid: true, message: 'Valid bandwidth' };
    }

    /**
     * Validate channel count consistency
     * @param {number} declaredCount - Number declared in instrument.number_of_channels
     * @param {number} actualCount - Actual count of channels created
     * @returns {object} - {valid: boolean, message: string}
     */
    function validateChannelCount(declaredCount, actualCount) {
        if (declaredCount !== actualCount) {
            return {
                valid: false,
                message: `Channel count mismatch: Declared ${declaredCount} channels but created ${actualCount}`
            };
        }

        if (declaredCount < 2 || declaredCount > 8) {
            return {
                valid: false,
                message: 'Multispectral sensors typically have 2-8 channels'
            };
        }

        return { valid: true, message: 'Channel count valid' };
    }

    /**
     * Validate orientation-specific requirements
     * @param {string} orientation - 'uplooking' or 'downlooking'
     * @param {number} azimuth - Azimuth in degrees (0-360)
     * @param {number} nadir - Degrees from nadir (0-90)
     * @returns {object} - {valid: boolean, message: string}
     */
    function validateOrientation(orientation, azimuth, nadir) {
        if (orientation === 'downlooking') {
            if (azimuth === null || azimuth === undefined || azimuth === '') {
                return {
                    valid: false,
                    message: 'Azimuth is required for downlooking sensors'
                };
            }

            if (nadir === null || nadir === undefined || nadir === '') {
                return {
                    valid: false,
                    message: 'Tilt from nadir is required for downlooking sensors'
                };
            }

            const az = parseFloat(azimuth);
            const nd = parseFloat(nadir);

            if (isNaN(az) || az < 0 || az > 360) {
                return {
                    valid: false,
                    message: 'Azimuth must be between 0-360 degrees'
                };
            }

            if (isNaN(nd) || nd < 0 || nd > 90) {
                return {
                    valid: false,
                    message: 'Tilt from nadir must be between 0-90 degrees'
                };
            }
        }

        return { valid: true, message: 'Orientation parameters valid' };
    }

    /**
     * Validate duplicate channel names or numbers
     * @param {array} channels - Array of channel objects
     * @returns {object} - {valid: boolean, message: string}
     */
    function validateNoDuplicateChannels(channels) {
        const names = {};
        const numbers = {};

        for (const channel of channels) {
            // Check duplicate names
            if (names[channel.channel_name]) {
                return {
                    valid: false,
                    message: `Duplicate channel name: ${channel.channel_name}`
                };
            }
            names[channel.channel_name] = true;

            // Check duplicate numbers
            if (numbers[channel.channel_number]) {
                return {
                    valid: false,
                    message: `Duplicate channel number: ${channel.channel_number}`
                };
            }
            numbers[channel.channel_number] = true;
        }

        return { valid: true, message: 'No duplicate channels' };
    }

    /**
     * Get wavelength preset suggestions based on band type
     * @param {string} bandType - Band type (Red, NIR, Green, Blue, Far-Red, Custom)
     * @returns {object} - {wavelength: number, bandwidth: number, name: string}
     */
    function getWavelengthPreset(bandType) {
        const presets = {
            'Blue': { wavelength: 450, bandwidth: 10, name: 'BLUE450nm' },
            'Green': { wavelength: 530, bandwidth: 10, name: 'GREEN530nm' },
            'Red': { wavelength: 645, bandwidth: 10, name: 'RED645nm' },
            'NIR': { wavelength: 850, bandwidth: 40, name: 'NIR850nm' },
            'Far-Red': { wavelength: 730, bandwidth: 10, name: 'FER730nm' },
            'Custom': { wavelength: 550, bandwidth: 10, name: 'CUSTOM550nm' }
        };

        return presets[bandType] || presets['Custom'];
    }

    /**
     * Get bandwidth preset suggestions
     * @returns {array} - Array of bandwidth options
     */
    function getBandwidthPresets() {
        return [
            { value: 10, label: 'Narrow (10nm)', notation: 'NW10nm' },
            { value: 20, label: 'Medium (20nm)', notation: 'NW20nm' },
            { value: 40, label: 'Wide (40nm)', notation: 'NW40nm' }
        ];
    }

    /**
     * Auto-generate wavelength notation
     * @param {number} bandwidth - Bandwidth in nm
     * @returns {string} - Notation like "NW10nm", "NW40nm"
     */
    function generateWavelengthNotation(bandwidth) {
        return `NW${bandwidth}nm`;
    }

    /**
     * Auto-generate channel name
     * @param {string} bandType - Band type
     * @param {number} wavelength - Center wavelength
     * @param {number} bandwidth - Bandwidth
     * @returns {string} - Channel name like "RED645nm_NW10nm"
     */
    function generateChannelName(bandType, wavelength, bandwidth) {
        const bandLabel = bandType.toUpperCase();
        const notation = generateWavelengthNotation(bandwidth);
        return `${bandLabel}${wavelength}nm_${notation}`;
    }

    /**
     * Validate complete MS instrument form data
     * @param {object} formData - Form data object
     * @param {array} channels - Array of channels
     * @returns {object} - {valid: boolean, errors: array}
     */
    function validateMSInstrumentForm(formData, channels) {
        const errors = [];

        // Required fields
        if (!formData.display_name) errors.push('Display name is required');
        if (!formData.sensor_brand) errors.push('Sensor brand is required');
        if (!formData.sensor_model) errors.push('Sensor model is required');
        if (!formData.sensor_serial_number) errors.push('Serial number is required');
        if (!formData.orientation) errors.push('Orientation is required');
        if (!formData.instrument_height_m) errors.push('Instrument height is required');
        if (!formData.deployment_date) errors.push('Deployment date is required');

        // Orientation-specific validation
        const orientationCheck = validateOrientation(
            formData.orientation,
            formData.azimuth_degrees,
            formData.degrees_from_nadir
        );
        if (!orientationCheck.valid) {
            errors.push(orientationCheck.message);
        }

        // Channel validation
        if (!channels || channels.length === 0) {
            errors.push('At least one channel is required');
        } else {
            // Validate each channel
            for (let i = 0; i < channels.length; i++) {
                const ch = channels[i];

                const wlCheck = validateWavelength(ch.center_wavelength_nm);
                if (!wlCheck.valid) {
                    errors.push(`Channel ${i + 1}: ${wlCheck.message}`);
                }

                const bwCheck = validateBandwidth(ch.bandwidth_nm);
                if (!bwCheck.valid) {
                    errors.push(`Channel ${i + 1}: ${bwCheck.message}`);
                }

                if (!ch.channel_name) {
                    errors.push(`Channel ${i + 1}: Channel name is required`);
                }
            }

            // Check for duplicates
            const dupCheck = validateNoDuplicateChannels(channels);
            if (!dupCheck.valid) {
                errors.push(dupCheck.message);
            }

            // Check channel count
            if (formData.number_of_channels) {
                const countCheck = validateChannelCount(formData.number_of_channels, channels.length);
                if (!countCheck.valid) {
                    errors.push(countCheck.message);
                }
            }
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    // Public API
    return {
        validateWavelength,
        validateBandwidth,
        validateChannelCount,
        validateOrientation,
        validateNoDuplicateChannels,
        getWavelengthPreset,
        getBandwidthPresets,
        generateWavelengthNotation,
        generateChannelName,
        validateMSInstrumentForm,
        constants: {
            WAVELENGTH_MIN,
            WAVELENGTH_MAX,
            BANDWIDTH_MIN,
            BANDWIDTH_MAX
        }
    };
})();

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.MSValidation = MSValidation;
}
