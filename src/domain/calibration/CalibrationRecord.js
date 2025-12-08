/**
 * Calibration Record Entity
 *
 * Represents a calibration event for multispectral/hyperspectral sensors.
 * Supports timeline tracking, panel tracking, before/after measurements,
 * and comprehensive field calibration workflow documentation.
 *
 * Workflow Context:
 * - Calibrations typically done 2x per session, ~2 hours around solar maximum
 * - Usually done before AND after cleaning the instrument
 * - Need to track: panel used, ambient conditions, sensor state changes
 *
 * @module domain/calibration/CalibrationRecord
 */

/**
 * Calibration Record Entity
 */
export class CalibrationRecord {
  /**
   * Supported instrument types for calibration
   * Only multispectral/hyperspectral sensors can have calibration records
   */
  static SUPPORTED_INSTRUMENT_TYPES = [
    'multispectral',
    'Multispectral',
    'MS',
    'multispectral_sensor',
    'hyperspectral',
    'Hyperspectral',
    'HYP'
  ];

  /**
   * Calibration types
   */
  static TYPES = {
    FACTORY: 'factory',              // Factory/manufacturer calibration
    FIELD: 'field',                  // Field calibration with reference panel
    LABORATORY: 'laboratory',        // Laboratory calibration
    CROSS_CALIBRATION: 'cross_calibration', // Cross-calibration with reference
    VICARIOUS: 'vicarious',          // Vicarious calibration (using ground targets)
    RADIOMETRIC: 'radiometric',      // Radiometric calibration
    SPECTRAL: 'spectral',            // Spectral calibration
    GEOMETRIC: 'geometric',          // Geometric calibration
    DARK_CURRENT: 'dark_current',    // Dark current calibration
    FLAT_FIELD: 'flat_field'         // Flat field calibration
  };

  /**
   * Calibration status
   */
  static STATUS = {
    VALID: 'valid',                  // Calibration is currently valid
    EXPIRED: 'expired',              // Calibration has expired
    SUPERSEDED: 'superseded',        // Replaced by newer calibration
    PENDING_REVIEW: 'pending_review' // Awaiting validation
  };

  /**
   * Calibration timing relative to cleaning
   */
  static TIMING = {
    BEFORE_CLEANING: 'before_cleaning',   // Done before cleaning instrument
    AFTER_CLEANING: 'after_cleaning',     // Done after cleaning instrument
    BOTH: 'both',                         // Full calibration (before + after)
    NOT_APPLICABLE: 'not_applicable'      // Cleaning not part of this calibration
  };

  /**
   * Reflectance panel types
   */
  static PANEL_TYPES = {
    SPECTRALON_99: 'spectralon_99',       // Spectralon 99% reflectance
    SPECTRALON_50: 'spectralon_50',       // Spectralon 50% reflectance
    GRAY_18: 'gray_18',                   // Gray 18% card
    WHITE_REFERENCE: 'white_reference',   // Generic white reference
    BLACK_REFERENCE: 'black_reference',   // Black reference for dark measurements
    CUSTOM: 'custom'                      // Custom/other panel
  };

  /**
   * Sensor cleanliness states
   */
  static CLEANLINESS = {
    CLEAN: 'clean',
    DUSTY: 'dusty',
    DIRTY: 'dirty',
    CONTAMINATED: 'contaminated'
  };

  /**
   * Cleaning methods
   */
  static CLEANING_METHODS = {
    DRY_WIPE: 'dry_wipe',
    COMPRESSED_AIR: 'compressed_air',
    WET_CLEAN: 'wet_clean',
    ULTRASONIC: 'ultrasonic'
  };

  /**
   * Cloud cover conditions
   */
  static CLOUD_COVER = {
    CLEAR: 'clear',                       // No clouds
    MOSTLY_CLEAR: 'mostly_clear',         // Few clouds (<25%)
    PARTLY_CLOUDY: 'partly_cloudy',       // Some clouds (25-50%)
    MOSTLY_CLOUDY: 'mostly_cloudy',       // Many clouds (50-75%)
    OVERCAST: 'overcast',                 // Full cloud cover
    INTERMITTENT: 'intermittent'          // Variable/passing clouds - IMPORTANT
  };

  /**
   * Panel condition ratings
   */
  static PANEL_CONDITION = {
    EXCELLENT: 'excellent',
    GOOD: 'good',
    FAIR: 'fair',
    POOR: 'poor'
  };

  /**
   * @param {Object} props - Calibration record properties
   */
  constructor({
    id = null,
    instrumentId,
    instrumentType = null,
    stationId = null,

    // === Calibration Classification ===
    calibrationType,
    calibrationTiming = CalibrationRecord.TIMING.NOT_APPLICABLE,
    status = CalibrationRecord.STATUS.VALID,

    // === Dates and Duration ===
    calibrationDate,
    calibrationStartTime = null,    // ISO time when calibration started
    calibrationEndTime = null,      // ISO time when calibration ended
    durationMinutes = null,         // Total duration in minutes
    validFrom = null,
    validUntil = null,

    // === Personnel ===
    performedBy = null,
    performedByUserId = null,
    laboratory = null,

    // === Certificate/Documentation ===
    certificateNumber = null,
    certificateUrl = null,

    // === Reflectance Panel Details ===
    panelType = null,               // spectralon_99, spectralon_50, gray_18, etc.
    panelSerialNumber = null,       // Panel serial for traceability
    panelCalibrationDate = null,    // When panel was last calibrated
    panelCondition = null,          // excellent, good, fair, poor
    panelNominalReflectance = null, // e.g., 0.99 for Spectralon 99%
    referenceStandard = null,       // Reference standard description

    // === Ambient Conditions ===
    temperatureCelsius = null,
    humidityPercent = null,
    cloudCover = null,              // clear, intermittent, overcast, etc.
    windSpeedMs = null,             // Wind speed in m/s
    solarZenithAngle = null,        // Solar zenith angle in degrees
    solarAzimuthAngle = null,       // Solar azimuth angle in degrees
    ambientConditionsJson = null,   // Additional conditions as JSON

    // === Sensor State BEFORE Calibration ===
    cleanlinessStateBefore = null,  // clean, dusty, dirty, contaminated
    physicalAspectBefore = null,    // Text description of sensor state

    // === Cleaning Details (if performed) ===
    cleaningPerformed = false,
    cleaningMethod = null,          // dry_wipe, compressed_air, wet_clean, ultrasonic
    cleaningSolution = null,        // Solution used if wet cleaning

    // === Sensor State AFTER Calibration ===
    cleanlinessStateAfter = null,
    physicalAspectAfter = null,

    // === Measurements (Per-Channel) ===
    // Format: { "channel_1": { "wavelength_nm": 450, "before": 0.85, "after": 0.95, "offset": 0.02 }, ... }
    measurementsBeforeJson = null,  // Measurements before cleaning/calibration
    measurementsAfterJson = null,   // Measurements after cleaning/calibration

    // === Calibration Coefficients (Output) ===
    // Format: { "channel_1": { "gain": 1.02, "offset": 0.01 }, ... }
    coefficients = {},

    // === Dark Current & Integration ===
    darkCurrentValuesJson = null,   // JSON array of dark current readings
    integrationTimeMs = null,       // Integration time used

    // === Quality Metrics ===
    qualityPassed = null,           // true/false - did it pass QC?
    qualityScore = null,            // 0-100 overall quality score
    deviationFromReference = null,  // Percentage deviation from expected
    uncertainty = null,             // Measurement uncertainty
    rmse = null,                    // Root mean square error
    r2 = null,                      // R-squared coefficient
    qualityNotes = null,            // Notes on quality assessment

    // === Documentation ===
    description = null,
    methodology = null,
    notes = null,
    photosJson = null,              // JSON array of photo URLs/paths
    rawDataPath = null,             // Path to raw calibration data files
    attachments = [],
    metadata = {},

    // === Audit Fields ===
    createdAt = null,
    updatedAt = null,
    createdBy = null
  }) {
    this.id = id;
    this.instrumentId = instrumentId;
    this.instrumentType = instrumentType;
    this.stationId = stationId;

    // Calibration classification
    this.calibrationType = calibrationType;
    this.calibrationTiming = calibrationTiming;
    this.status = status;

    // Dates and duration
    this.calibrationDate = calibrationDate;
    this.calibrationStartTime = calibrationStartTime;
    this.calibrationEndTime = calibrationEndTime;
    this.durationMinutes = durationMinutes;
    this.validFrom = validFrom || calibrationDate;
    this.validUntil = validUntil;

    // Personnel
    this.performedBy = performedBy;
    this.performedByUserId = performedByUserId;
    this.laboratory = laboratory;

    // Certificate
    this.certificateNumber = certificateNumber;
    this.certificateUrl = certificateUrl;

    // Panel details
    this.panelType = panelType;
    this.panelSerialNumber = panelSerialNumber;
    this.panelCalibrationDate = panelCalibrationDate;
    this.panelCondition = panelCondition;
    this.panelNominalReflectance = panelNominalReflectance;
    this.referenceStandard = referenceStandard;

    // Ambient conditions
    this.temperatureCelsius = temperatureCelsius;
    this.humidityPercent = humidityPercent;
    this.cloudCover = cloudCover;
    this.windSpeedMs = windSpeedMs;
    this.solarZenithAngle = solarZenithAngle;
    this.solarAzimuthAngle = solarAzimuthAngle;
    this.ambientConditionsJson = ambientConditionsJson;

    // Sensor state before
    this.cleanlinessStateBefore = cleanlinessStateBefore;
    this.physicalAspectBefore = physicalAspectBefore;

    // Cleaning
    this.cleaningPerformed = cleaningPerformed;
    this.cleaningMethod = cleaningMethod;
    this.cleaningSolution = cleaningSolution;

    // Sensor state after
    this.cleanlinessStateAfter = cleanlinessStateAfter;
    this.physicalAspectAfter = physicalAspectAfter;

    // Measurements
    this.measurementsBeforeJson = measurementsBeforeJson;
    this.measurementsAfterJson = measurementsAfterJson;

    // Coefficients
    this.coefficients = coefficients;

    // Dark current
    this.darkCurrentValuesJson = darkCurrentValuesJson;
    this.integrationTimeMs = integrationTimeMs;

    // Quality metrics
    this.qualityPassed = qualityPassed;
    this.qualityScore = qualityScore;
    this.deviationFromReference = deviationFromReference;
    this.uncertainty = uncertainty;
    this.rmse = rmse;
    this.r2 = r2;
    this.qualityNotes = qualityNotes;

    // Documentation
    this.description = description;
    this.methodology = methodology;
    this.notes = notes;
    this.photosJson = photosJson;
    this.rawDataPath = rawDataPath;
    this.attachments = attachments;
    this.metadata = metadata;

    // Audit
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.createdBy = createdBy;
  }

  /**
   * Check if instrument type supports calibration
   * @param {string} instrumentType
   * @returns {boolean}
   */
  static isCalibratableInstrument(instrumentType) {
    if (!instrumentType) return false;
    const normalizedType = instrumentType.toLowerCase();
    return CalibrationRecord.SUPPORTED_INSTRUMENT_TYPES.some(
      type => type.toLowerCase() === normalizedType ||
              normalizedType.includes('multispectral') ||
              normalizedType.includes('hyperspectral')
    );
  }

  /**
   * Validate the calibration record
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validate() {
    const errors = [];

    // Required fields
    if (!this.instrumentId) {
      errors.push('Instrument ID is required');
    }

    if (!this.calibrationType) {
      errors.push('Calibration type is required');
    } else if (!Object.values(CalibrationRecord.TYPES).includes(this.calibrationType)) {
      errors.push(`Invalid calibration type: ${this.calibrationType}`);
    }

    if (!this.calibrationDate) {
      errors.push('Calibration date is required');
    }

    if (this.status && !Object.values(CalibrationRecord.STATUS).includes(this.status)) {
      errors.push(`Invalid status: ${this.status}`);
    }

    // Instrument type validation (must be multispectral/hyperspectral)
    if (this.instrumentType && !CalibrationRecord.isCalibratableInstrument(this.instrumentType)) {
      errors.push(`Calibration records are only supported for multispectral/hyperspectral instruments, not: ${this.instrumentType}`);
    }

    // Date validations
    if (this.validFrom && this.validUntil) {
      const from = new Date(this.validFrom);
      const until = new Date(this.validUntil);
      if (until <= from) {
        errors.push('Valid until must be after valid from');
      }
    }

    // Quality metrics validation
    if (this.r2 !== null && (this.r2 < 0 || this.r2 > 1)) {
      errors.push('R² must be between 0 and 1');
    }

    if (this.uncertainty !== null && this.uncertainty < 0) {
      errors.push('Uncertainty cannot be negative');
    }

    if (this.rmse !== null && this.rmse < 0) {
      errors.push('RMSE cannot be negative');
    }

    if (this.qualityScore !== null && (this.qualityScore < 0 || this.qualityScore > 100)) {
      errors.push('Quality score must be between 0 and 100');
    }

    if (this.deviationFromReference !== null && this.deviationFromReference < 0) {
      errors.push('Deviation from reference cannot be negative');
    }

    // Solar angle validation
    if (this.solarZenithAngle !== null && (this.solarZenithAngle < 0 || this.solarZenithAngle > 90)) {
      errors.push('Solar zenith angle must be between 0 and 90 degrees');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if calibration is currently valid
   * @returns {boolean}
   */
  isCurrentlyValid() {
    if (this.status !== CalibrationRecord.STATUS.VALID) {
      return false;
    }

    const now = new Date();

    if (this.validFrom && new Date(this.validFrom) > now) {
      return false;
    }

    if (this.validUntil && new Date(this.validUntil) < now) {
      return false;
    }

    return true;
  }

  /**
   * Check if calibration has expired
   * @returns {boolean}
   */
  isExpired() {
    if (!this.validUntil) {
      return false;
    }
    return new Date(this.validUntil) < new Date();
  }

  /**
   * Get days until expiration
   * @returns {number|null}
   */
  daysUntilExpiration() {
    if (!this.validUntil) {
      return null;
    }
    const until = new Date(this.validUntil);
    const now = new Date();
    const diffTime = until - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if calibration was done around solar maximum (good practice)
   * Solar zenith < 45° is generally considered optimal
   * @returns {boolean|null}
   */
  wasAtOptimalSolarAngle() {
    if (this.solarZenithAngle === null) {
      return null;
    }
    return this.solarZenithAngle <= 45;
  }

  /**
   * Check if ambient conditions were suitable for calibration
   * @returns {{ suitable: boolean, warnings: string[] }}
   */
  checkAmbientConditionsSuitability() {
    const warnings = [];

    if (this.cloudCover === CalibrationRecord.CLOUD_COVER.INTERMITTENT) {
      warnings.push('Intermittent clouds may cause measurement variability');
    }

    if (this.cloudCover === CalibrationRecord.CLOUD_COVER.OVERCAST) {
      warnings.push('Overcast conditions - reduced light quality');
    }

    if (this.windSpeedMs !== null && this.windSpeedMs > 5) {
      warnings.push('High wind speed may affect panel stability');
    }

    if (this.solarZenithAngle !== null && this.solarZenithAngle > 60) {
      warnings.push('High solar zenith angle - not optimal for calibration');
    }

    return {
      suitable: warnings.length === 0,
      warnings
    };
  }

  /**
   * Get parsed measurements before
   * @returns {Object|null}
   */
  getMeasurementsBefore() {
    if (!this.measurementsBeforeJson) return null;
    return typeof this.measurementsBeforeJson === 'string'
      ? JSON.parse(this.measurementsBeforeJson)
      : this.measurementsBeforeJson;
  }

  /**
   * Get parsed measurements after
   * @returns {Object|null}
   */
  getMeasurementsAfter() {
    if (!this.measurementsAfterJson) return null;
    return typeof this.measurementsAfterJson === 'string'
      ? JSON.parse(this.measurementsAfterJson)
      : this.measurementsAfterJson;
  }

  /**
   * Get parsed dark current values
   * @returns {Array|null}
   */
  getDarkCurrentValues() {
    if (!this.darkCurrentValuesJson) return null;
    return typeof this.darkCurrentValuesJson === 'string'
      ? JSON.parse(this.darkCurrentValuesJson)
      : this.darkCurrentValuesJson;
  }

  /**
   * Get parsed photos
   * @returns {Array}
   */
  getPhotos() {
    if (!this.photosJson) return [];
    return typeof this.photosJson === 'string'
      ? JSON.parse(this.photosJson)
      : this.photosJson;
  }

  /**
   * Get parsed ambient conditions
   * @returns {Object|null}
   */
  getAmbientConditions() {
    if (!this.ambientConditionsJson) return null;
    return typeof this.ambientConditionsJson === 'string'
      ? JSON.parse(this.ambientConditionsJson)
      : this.ambientConditionsJson;
  }

  /**
   * Mark calibration as expired
   */
  expire() {
    this.status = CalibrationRecord.STATUS.EXPIRED;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Mark calibration as superseded by a newer one
   * @param {number} newCalibrationId
   */
  supersede(newCalibrationId) {
    this.status = CalibrationRecord.STATUS.SUPERSEDED;
    this.metadata = {
      ...this.metadata,
      supersededBy: newCalibrationId,
      supersededAt: new Date().toISOString()
    };
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Get coefficient for a specific channel
   * @param {string|number} channel - Channel name or number
   * @returns {Object|null}
   */
  getChannelCoefficients(channel) {
    return this.coefficients[channel] || null;
  }

  /**
   * Set coefficients for a channel
   * @param {string|number} channel
   * @param {Object} coeffs - { gain, offset, ... }
   */
  setChannelCoefficients(channel, coeffs) {
    this.coefficients[channel] = coeffs;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Get all channel names
   * @returns {string[]}
   */
  getChannels() {
    return Object.keys(this.coefficients);
  }

  /**
   * Convert to JSON representation
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      instrument_id: this.instrumentId,
      instrument_type: this.instrumentType,
      station_id: this.stationId,

      // Classification
      calibration_type: this.calibrationType,
      calibration_timing: this.calibrationTiming,
      status: this.status,

      // Dates
      calibration_date: this.calibrationDate,
      calibration_start_time: this.calibrationStartTime,
      calibration_end_time: this.calibrationEndTime,
      duration_minutes: this.durationMinutes,
      valid_from: this.validFrom,
      valid_until: this.validUntil,

      // Personnel
      performed_by: this.performedBy,
      performed_by_user_id: this.performedByUserId,
      laboratory: this.laboratory,

      // Certificate
      certificate_number: this.certificateNumber,
      certificate_url: this.certificateUrl,

      // Panel
      panel_type: this.panelType,
      panel_serial_number: this.panelSerialNumber,
      panel_calibration_date: this.panelCalibrationDate,
      panel_condition: this.panelCondition,
      panel_nominal_reflectance: this.panelNominalReflectance,
      reference_standard: this.referenceStandard,

      // Ambient conditions
      temperature_celsius: this.temperatureCelsius,
      humidity_percent: this.humidityPercent,
      cloud_cover: this.cloudCover,
      wind_speed_ms: this.windSpeedMs,
      solar_zenith_angle: this.solarZenithAngle,
      solar_azimuth_angle: this.solarAzimuthAngle,
      ambient_conditions: this.getAmbientConditions(),

      // Sensor state before
      cleanliness_state_before: this.cleanlinessStateBefore,
      physical_aspect_before: this.physicalAspectBefore,

      // Cleaning
      cleaning_performed: this.cleaningPerformed,
      cleaning_method: this.cleaningMethod,
      cleaning_solution: this.cleaningSolution,

      // Sensor state after
      cleanliness_state_after: this.cleanlinessStateAfter,
      physical_aspect_after: this.physicalAspectAfter,

      // Measurements
      measurements_before: this.getMeasurementsBefore(),
      measurements_after: this.getMeasurementsAfter(),

      // Coefficients
      coefficients: this.coefficients,

      // Dark current
      dark_current_values: this.getDarkCurrentValues(),
      integration_time_ms: this.integrationTimeMs,

      // Quality
      quality_passed: this.qualityPassed,
      quality_score: this.qualityScore,
      deviation_from_reference: this.deviationFromReference,
      uncertainty: this.uncertainty,
      rmse: this.rmse,
      r2: this.r2,
      quality_notes: this.qualityNotes,

      // Documentation
      description: this.description,
      methodology: this.methodology,
      notes: this.notes,
      photos: this.getPhotos(),
      raw_data_path: this.rawDataPath,
      attachments: this.attachments,
      metadata: this.metadata,

      // Audit
      created_at: this.createdAt,
      updated_at: this.updatedAt,
      created_by: this.createdBy,

      // Computed properties
      is_currently_valid: this.isCurrentlyValid(),
      is_expired: this.isExpired(),
      days_until_expiration: this.daysUntilExpiration(),
      was_at_optimal_solar_angle: this.wasAtOptimalSolarAngle(),
      ambient_conditions_check: this.checkAmbientConditionsSuitability(),
      channels: this.getChannels()
    };
  }

  /**
   * Create from database row
   * @param {Object} row - Database row
   * @returns {CalibrationRecord}
   */
  static fromRow(row) {
    return new CalibrationRecord({
      id: row.id,
      instrumentId: row.instrument_id,
      instrumentType: row.instrument_type,
      stationId: row.station_id,

      // Classification
      calibrationType: row.calibration_type,
      calibrationTiming: row.calibration_timing,
      status: row.status,

      // Dates
      calibrationDate: row.calibration_date,
      calibrationStartTime: row.calibration_start_time,
      calibrationEndTime: row.calibration_end_time,
      durationMinutes: row.duration_minutes,
      validFrom: row.valid_from,
      validUntil: row.valid_until,

      // Personnel
      performedBy: row.performed_by,
      performedByUserId: row.performed_by_user_id,
      laboratory: row.laboratory,

      // Certificate
      certificateNumber: row.certificate_number,
      certificateUrl: row.certificate_url,

      // Panel
      panelType: row.panel_type,
      panelSerialNumber: row.panel_serial_number,
      panelCalibrationDate: row.panel_calibration_date,
      panelCondition: row.panel_condition,
      panelNominalReflectance: row.panel_nominal_reflectance,
      referenceStandard: row.reference_standard,

      // Ambient conditions
      temperatureCelsius: row.temperature_celsius,
      humidityPercent: row.humidity_percent,
      cloudCover: row.cloud_cover,
      windSpeedMs: row.wind_speed_ms,
      solarZenithAngle: row.solar_zenith_angle,
      solarAzimuthAngle: row.solar_azimuth_angle,
      ambientConditionsJson: row.ambient_conditions_json,

      // Sensor state before
      cleanlinessStateBefore: row.cleanliness_state_before,
      physicalAspectBefore: row.physical_aspect_before,

      // Cleaning
      cleaningPerformed: row.cleaning_performed === 1 || row.cleaning_performed === true,
      cleaningMethod: row.cleaning_method,
      cleaningSolution: row.cleaning_solution,

      // Sensor state after
      cleanlinessStateAfter: row.cleanliness_state_after,
      physicalAspectAfter: row.physical_aspect_after,

      // Measurements
      measurementsBeforeJson: row.measurements_before_json,
      measurementsAfterJson: row.measurements_after_json,

      // Coefficients
      coefficients: row.coefficients_json ? JSON.parse(row.coefficients_json) : {},

      // Dark current
      darkCurrentValuesJson: row.dark_current_values_json,
      integrationTimeMs: row.integration_time_ms,

      // Quality
      qualityPassed: row.quality_passed === 1 || row.quality_passed === true,
      qualityScore: row.quality_score,
      deviationFromReference: row.deviation_from_reference,
      uncertainty: row.uncertainty,
      rmse: row.rmse,
      r2: row.r2,
      qualityNotes: row.quality_notes,

      // Documentation
      description: row.description,
      methodology: row.methodology,
      notes: row.notes,
      photosJson: row.photos_json,
      rawDataPath: row.raw_data_path,
      attachments: row.attachments_json ? JSON.parse(row.attachments_json) : [],
      metadata: row.metadata_json ? JSON.parse(row.metadata_json) : {},

      // Audit
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by
    });
  }
}
