/**
 * Error Messages Configuration
 *
 * Centralized error messages for SITES Spectral application.
 * All error messages should be defined here, not hardcoded in components.
 *
 * @module core/error-messages
 * @version 8.0.0
 */

(function(global) {
    'use strict';

    /**
     * Error message constants
     */
    const ERROR_MESSAGES = {
        // Network Errors
        NETWORK_ERROR: 'Unable to connect to the server. Please check your internet connection and try again.',
        NETWORK_TIMEOUT: 'The request took too long to complete. Please try again.',
        SERVER_ERROR: 'The server encountered an error. Please try again later.',
        SERVICE_UNAVAILABLE: 'The service is temporarily unavailable. Please try again later.',

        // Authentication Errors
        AUTH_REQUIRED: 'You must be logged in to perform this action.',
        AUTH_EXPIRED: 'Your session has expired. Please log in again.',
        AUTH_INVALID: 'Invalid credentials. Please check your username and password.',
        AUTH_FORBIDDEN: 'You do not have permission to perform this action.',

        // Validation Errors
        VALIDATION_ERROR: 'Please correct the highlighted fields before submitting.',
        REQUIRED_FIELD: 'This field is required.',
        INVALID_FORMAT: 'The format of this field is invalid.',
        INVALID_NUMBER: 'Please enter a valid number.',
        INVALID_RANGE: 'The value must be between {min} and {max}.',
        INVALID_COORDINATE: 'Please enter valid coordinates (latitude: -90 to 90, longitude: -180 to 180).',
        INVALID_DATE: 'Please enter a valid date.',
        INVALID_EMAIL: 'Please enter a valid email address.',
        INVALID_URL: 'Please enter a valid URL.',
        INVALID_WAVELENGTH: 'Please enter a valid wavelength in nanometers.',
        INVALID_RESOLUTION: 'Please enter a valid resolution (e.g., 1920x1080).',

        // Data Loading Errors
        LOAD_CONFIG_ERROR: 'Failed to load configuration: {config}.',
        LOAD_STATION_ERROR: 'Failed to load station data. Please refresh the page.',
        LOAD_PLATFORMS_ERROR: 'Failed to load platforms. Please try again.',
        LOAD_INSTRUMENTS_ERROR: 'Failed to load instruments. Please try again.',
        LOAD_ROIS_ERROR: 'Failed to load ROI data. Please try again.',

        // CRUD Operation Errors
        CREATE_ERROR: 'Failed to create {entity}. Please try again.',
        UPDATE_ERROR: 'Failed to update {entity}. Please try again.',
        DELETE_ERROR: 'Failed to delete {entity}. Please try again.',
        DUPLICATE_ERROR: '{entity} with this name already exists.',
        NOT_FOUND: '{entity} not found.',

        // Specific Entity Errors
        STATION_NOT_FOUND: 'Station not found. Please check the URL.',
        PLATFORM_NOT_FOUND: 'Platform not found.',
        INSTRUMENT_NOT_FOUND: 'Instrument not found.',
        ROI_NOT_FOUND: 'ROI not found.',

        // File Upload Errors
        FILE_TOO_LARGE: 'File size exceeds maximum allowed size of {maxSize}.',
        FILE_INVALID_TYPE: 'Invalid file type. Allowed types: {types}.',
        FILE_UPLOAD_ERROR: 'Failed to upload file. Please try again.',

        // ROI Errors
        ROI_INVALID_POLYGON: 'ROI polygon must have at least 3 points.',
        ROI_INVALID_NAME: 'ROI name must follow the format ROI_XX (e.g., ROI_01).',
        ROI_DUPLICATE_NAME: 'An ROI with this name already exists for this instrument.',
        ROI_YAML_PARSE_ERROR: 'Failed to parse YAML file. Please check the format.',

        // Map Errors
        MAP_LOAD_ERROR: 'Failed to load map. Please refresh the page.',
        MAP_GEOCODE_ERROR: 'Failed to find location. Please check the coordinates.',

        // Export Errors
        EXPORT_ERROR: 'Failed to export data. Please try again.',
        EXPORT_NO_DATA: 'No data available to export.',

        // Import Errors
        IMPORT_ERROR: 'Failed to import data. Please check the file format.',
        IMPORT_VALIDATION_ERROR: 'Import file contains invalid data. Please correct and try again.',

        // Modal Errors
        MODAL_LOAD_ERROR: 'Failed to load form. Please try again.',
        MODAL_SAVE_ERROR: 'Failed to save changes. Please try again.',

        // Generic Errors
        UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
        OPERATION_FAILED: 'The operation could not be completed. Please try again.',
        INVALID_OPERATION: 'This operation is not allowed.',
        UNSUPPORTED_BROWSER: 'Your browser is not supported. Please use a modern browser.',

        // Configuration Errors
        CONFIG_MISSING: 'Required configuration is missing: {config}.',
        CONFIG_INVALID: 'Configuration is invalid: {config}.'
    };

    /**
     * Success message constants
     */
    const SUCCESS_MESSAGES = {
        // CRUD Operations
        CREATE_SUCCESS: '{entity} created successfully.',
        UPDATE_SUCCESS: '{entity} updated successfully.',
        DELETE_SUCCESS: '{entity} deleted successfully.',

        // Specific Entities
        STATION_SAVED: 'Station saved successfully.',
        PLATFORM_SAVED: 'Platform saved successfully.',
        INSTRUMENT_SAVED: 'Instrument saved successfully.',
        ROI_SAVED: 'ROI saved successfully.',

        // File Operations
        FILE_UPLOADED: 'File uploaded successfully.',
        IMPORT_SUCCESS: 'Data imported successfully. {count} items processed.',
        EXPORT_SUCCESS: 'Data exported successfully.',

        // Authentication
        LOGIN_SUCCESS: 'Welcome back!',
        LOGOUT_SUCCESS: 'You have been logged out successfully.',

        // Generic
        OPERATION_SUCCESS: 'Operation completed successfully.',
        CHANGES_SAVED: 'Your changes have been saved.'
    };

    /**
     * Warning message constants
     */
    const WARNING_MESSAGES = {
        UNSAVED_CHANGES: 'You have unsaved changes. Are you sure you want to leave?',
        DELETE_CONFIRM: 'Are you sure you want to delete this {entity}? This action cannot be undone.',
        DELETE_CASCADE: 'Deleting this {entity} will also delete {count} related items. Continue?',
        OVERWRITE_CONFIRM: 'This will overwrite existing data. Continue?',
        NETWORK_SLOW: 'Network connection is slow. Some features may be delayed.',
        BROWSER_OUTDATED: 'Your browser may not support all features. Consider updating.'
    };

    /**
     * Info message constants
     */
    const INFO_MESSAGES = {
        LOADING: 'Loading...',
        SAVING: 'Saving...',
        DELETING: 'Deleting...',
        PROCESSING: 'Processing...',
        NO_DATA: 'No data available.',
        NO_RESULTS: 'No results found.',
        EMPTY_STATE: 'Nothing to display yet. Get started by adding a {entity}.',
        READONLY_MODE: 'You are in read-only mode. Contact an administrator for edit access.'
    };

    /**
     * Format message with dynamic values
     * @param {string} message - Message template
     * @param {Object} params - Parameters to interpolate
     * @returns {string} Formatted message
     */
    function formatMessage(message, params = {}) {
        let formatted = message;
        for (const [key, value] of Object.entries(params)) {
            formatted = formatted.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
        }
        return formatted;
    }

    // Export for ES6 modules
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            ERROR_MESSAGES,
            SUCCESS_MESSAGES,
            WARNING_MESSAGES,
            INFO_MESSAGES,
            formatMessage
        };
    }

    // Export for browser global
    global.ErrorMessages = ERROR_MESSAGES;
    global.SuccessMessages = SUCCESS_MESSAGES;
    global.WarningMessages = WARNING_MESSAGES;
    global.InfoMessages = INFO_MESSAGES;
    global.formatMessage = formatMessage;

})(typeof window !== 'undefined' ? window : global);
