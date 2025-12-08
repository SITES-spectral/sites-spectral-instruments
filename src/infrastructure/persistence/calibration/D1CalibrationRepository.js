/**
 * D1 Calibration Repository
 *
 * Implements CalibrationRepository port using Cloudflare D1.
 * Only supports multispectral and hyperspectral instruments.
 *
 * V11 Features:
 * - Full panel tracking (type, serial, calibration date, condition)
 * - Ambient conditions (cloud cover with intermittent, solar angles)
 * - Sensor state before/after with cleaning workflow
 * - Quality metrics (quality score, deviation, RMSE, R²)
 * - Dark current values and integration time
 * - Photo documentation and raw data paths
 *
 * @module infrastructure/persistence/calibration/D1CalibrationRepository
 */

import { CalibrationRecord, CalibrationRepository } from '../../../domain/index.js';

export class D1CalibrationRepository extends CalibrationRepository {
  constructor(db) {
    super();
    this.db = db;
  }

  async findById(id) {
    const result = await this.db
      .prepare('SELECT * FROM calibration_records WHERE id = ?')
      .bind(id)
      .first();

    return result ? CalibrationRecord.fromRow(result) : null;
  }

  async findByInstrumentId(instrumentId) {
    const results = await this.db
      .prepare(`
        SELECT * FROM calibration_records
        WHERE instrument_id = ?
        ORDER BY calibration_date DESC
      `)
      .bind(instrumentId)
      .all();

    return results.results.map(row => CalibrationRecord.fromRow(row));
  }

  async findCurrentValid(instrumentId, channelId = null) {
    let sql = `
      SELECT * FROM calibration_records
      WHERE instrument_id = ?
        AND status = 'valid'
        AND (valid_until IS NULL OR valid_until >= date('now'))
    `;
    const params = [instrumentId];

    if (channelId) {
      sql += ' AND (channel_id = ? OR channel_id IS NULL)';
      params.push(channelId);
    }

    sql += ' ORDER BY calibration_date DESC LIMIT 1';

    const result = await this.db
      .prepare(sql)
      .bind(...params)
      .first();

    return result ? CalibrationRecord.fromRow(result) : null;
  }

  async findAll(filters = {}) {
    let sql = 'SELECT * FROM calibration_records WHERE 1=1';
    const params = [];

    if (filters.instrumentId) {
      sql += ' AND instrument_id = ?';
      params.push(filters.instrumentId);
    }

    if (filters.stationId) {
      sql += ' AND station_id = ?';
      params.push(filters.stationId);
    }

    if (filters.channelId) {
      sql += ' AND channel_id = ?';
      params.push(filters.channelId);
    }

    if (filters.type || filters.calibrationType) {
      sql += ' AND calibration_type = ?';
      params.push(filters.type || filters.calibrationType);
    }

    if (filters.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.calibrationTiming) {
      sql += ' AND calibration_timing = ?';
      params.push(filters.calibrationTiming);
    }

    if (filters.cloudCover) {
      sql += ' AND cloud_cover = ?';
      params.push(filters.cloudCover);
    }

    if (filters.qualityPassed !== undefined) {
      sql += ' AND quality_passed = ?';
      params.push(filters.qualityPassed ? 1 : 0);
    }

    if (filters.cleaningPerformed !== undefined) {
      sql += ' AND cleaning_performed = ?';
      params.push(filters.cleaningPerformed ? 1 : 0);
    }

    if (filters.startDate) {
      sql += ' AND calibration_date >= ?';
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      sql += ' AND calibration_date <= ?';
      params.push(filters.endDate);
    }

    if (filters.performedBy) {
      sql += ' AND performed_by LIKE ?';
      params.push(`%${filters.performedBy}%`);
    }

    if (filters.panelType) {
      sql += ' AND panel_type = ?';
      params.push(filters.panelType);
    }

    sql += ' ORDER BY calibration_date DESC';
    sql += ` LIMIT ${filters.limit || 50} OFFSET ${filters.offset || 0}`;

    const stmt = this.db.prepare(sql);
    const results = params.length > 0
      ? await stmt.bind(...params).all()
      : await stmt.all();

    return results.results.map(row => CalibrationRecord.fromRow(row));
  }

  async findTimeline(instrumentId, options = {}) {
    let sql = `
      SELECT * FROM calibration_records
      WHERE instrument_id = ?
    `;
    const params = [instrumentId];

    if (options.channelId) {
      sql += ' AND channel_id = ?';
      params.push(options.channelId);
    }

    if (options.startDate) {
      sql += ' AND calibration_date >= ?';
      params.push(options.startDate);
    }

    if (options.endDate) {
      sql += ' AND calibration_date <= ?';
      params.push(options.endDate);
    }

    if (options.includeExpired === false) {
      sql += ' AND status != ?';
      params.push('expired');
    }

    sql += ' ORDER BY calibration_date ASC';

    const results = await this.db
      .prepare(sql)
      .bind(...params)
      .all();

    return results.results.map(row => CalibrationRecord.fromRow(row));
  }

  async findExpired() {
    const results = await this.db
      .prepare(`
        SELECT * FROM calibration_records
        WHERE status = 'valid'
          AND valid_until IS NOT NULL
          AND valid_until < date('now')
        ORDER BY valid_until ASC
      `)
      .all();

    return results.results.map(row => CalibrationRecord.fromRow(row));
  }

  async findExpiringWithin(days) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const results = await this.db
      .prepare(`
        SELECT * FROM calibration_records
        WHERE status = 'valid'
          AND valid_until IS NOT NULL
          AND valid_until <= ?
          AND valid_until >= date('now')
        ORDER BY valid_until ASC
      `)
      .bind(futureDate.toISOString().split('T')[0])
      .all();

    return results.results.map(row => CalibrationRecord.fromRow(row));
  }

  async findByPanelSerial(panelSerialNumber) {
    const results = await this.db
      .prepare(`
        SELECT * FROM calibration_records
        WHERE panel_serial_number = ?
        ORDER BY calibration_date DESC
      `)
      .bind(panelSerialNumber)
      .all();

    return results.results.map(row => CalibrationRecord.fromRow(row));
  }

  async findByCloudCondition(cloudCover) {
    const results = await this.db
      .prepare(`
        SELECT * FROM calibration_records
        WHERE cloud_cover = ?
        ORDER BY calibration_date DESC
      `)
      .bind(cloudCover)
      .all();

    return results.results.map(row => CalibrationRecord.fromRow(row));
  }

  async save(record) {
    if (record.id) {
      return await this.update(record);
    }
    return await this.create(record);
  }

  async create(record) {
    const now = new Date().toISOString();

    const result = await this.db
      .prepare(`
        INSERT INTO calibration_records (
          instrument_id, instrument_type, station_id, channel_id,
          calibration_type, calibration_timing, status,
          calibration_date, calibration_start_time, calibration_end_time, duration_minutes,
          valid_from, valid_until,
          performed_by, performed_by_user_id, laboratory,
          certificate_number, certificate_url,
          panel_type, panel_serial_number, panel_calibration_date, panel_condition, panel_nominal_reflectance,
          reference_standard,
          temperature_celsius, humidity_percent, cloud_cover, wind_speed_ms,
          solar_zenith_angle, solar_azimuth_angle, ambient_conditions_json,
          cleanliness_state_before, physical_aspect_before,
          cleaning_performed, cleaning_method, cleaning_solution,
          cleanliness_state_after, physical_aspect_after,
          measurements_before_json, measurements_after_json,
          coefficients_json,
          dark_current_values_json, integration_time_ms,
          quality_passed, quality_score, deviation_from_reference, uncertainty, rmse, r2, quality_notes,
          description, methodology, notes, photos_json, raw_data_path,
          attachments_json, metadata_json,
          created_at, updated_at, created_by
        ) VALUES (
          ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?,
          ?, ?, ?,
          ?, ?,
          ?, ?, ?, ?, ?,
          ?,
          ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?,
          ?, ?, ?,
          ?, ?,
          ?, ?,
          ?,
          ?, ?,
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?,
          ?, ?, ?
        )
      `)
      .bind(
        // Instrument reference
        record.instrumentId,
        record.instrumentType,
        record.stationId,
        record.channelId || null,

        // Classification
        record.calibrationType,
        record.calibrationTiming,
        record.status,

        // Dates
        record.calibrationDate,
        record.calibrationStartTime,
        record.calibrationEndTime,
        record.durationMinutes,
        record.validFrom,
        record.validUntil,

        // Personnel
        record.performedBy,
        record.performedByUserId,
        record.laboratory,

        // Certificate
        record.certificateNumber,
        record.certificateUrl,

        // Panel
        record.panelType,
        record.panelSerialNumber,
        record.panelCalibrationDate,
        record.panelCondition,
        record.panelNominalReflectance,
        record.referenceStandard,

        // Ambient conditions
        record.temperatureCelsius,
        record.humidityPercent,
        record.cloudCover,
        record.windSpeedMs,
        record.solarZenithAngle,
        record.solarAzimuthAngle,
        record.ambientConditionsJson,

        // Sensor state before
        record.cleanlinessStateBefore,
        record.physicalAspectBefore,

        // Cleaning
        record.cleaningPerformed ? 1 : 0,
        record.cleaningMethod,
        record.cleaningSolution,

        // Sensor state after
        record.cleanlinessStateAfter,
        record.physicalAspectAfter,

        // Measurements
        record.measurementsBeforeJson ? (typeof record.measurementsBeforeJson === 'string' ? record.measurementsBeforeJson : JSON.stringify(record.measurementsBeforeJson)) : null,
        record.measurementsAfterJson ? (typeof record.measurementsAfterJson === 'string' ? record.measurementsAfterJson : JSON.stringify(record.measurementsAfterJson)) : null,

        // Coefficients
        record.coefficients ? JSON.stringify(record.coefficients) : null,

        // Dark current
        record.darkCurrentValuesJson ? (typeof record.darkCurrentValuesJson === 'string' ? record.darkCurrentValuesJson : JSON.stringify(record.darkCurrentValuesJson)) : null,
        record.integrationTimeMs,

        // Quality metrics
        record.qualityPassed !== null ? (record.qualityPassed ? 1 : 0) : null,
        record.qualityScore,
        record.deviationFromReference,
        record.uncertainty,
        record.rmse,
        record.r2,
        record.qualityNotes,

        // Documentation
        record.description,
        record.methodology,
        record.notes,
        record.photosJson ? (typeof record.photosJson === 'string' ? record.photosJson : JSON.stringify(record.photosJson)) : null,
        record.rawDataPath,

        // Metadata
        record.attachments ? JSON.stringify(record.attachments) : null,
        record.metadata ? JSON.stringify(record.metadata) : null,

        // Audit
        record.createdAt || now,
        record.updatedAt || now,
        record.createdBy
      )
      .run();

    record.id = result.meta.last_row_id;
    return record;
  }

  async update(record) {
    const now = new Date().toISOString();

    await this.db
      .prepare(`
        UPDATE calibration_records SET
          instrument_id = ?, instrument_type = ?, station_id = ?, channel_id = ?,
          calibration_type = ?, calibration_timing = ?, status = ?,
          calibration_date = ?, calibration_start_time = ?, calibration_end_time = ?, duration_minutes = ?,
          valid_from = ?, valid_until = ?,
          performed_by = ?, performed_by_user_id = ?, laboratory = ?,
          certificate_number = ?, certificate_url = ?,
          panel_type = ?, panel_serial_number = ?, panel_calibration_date = ?, panel_condition = ?, panel_nominal_reflectance = ?,
          reference_standard = ?,
          temperature_celsius = ?, humidity_percent = ?, cloud_cover = ?, wind_speed_ms = ?,
          solar_zenith_angle = ?, solar_azimuth_angle = ?, ambient_conditions_json = ?,
          cleanliness_state_before = ?, physical_aspect_before = ?,
          cleaning_performed = ?, cleaning_method = ?, cleaning_solution = ?,
          cleanliness_state_after = ?, physical_aspect_after = ?,
          measurements_before_json = ?, measurements_after_json = ?,
          coefficients_json = ?,
          dark_current_values_json = ?, integration_time_ms = ?,
          quality_passed = ?, quality_score = ?, deviation_from_reference = ?, uncertainty = ?, rmse = ?, r2 = ?, quality_notes = ?,
          description = ?, methodology = ?, notes = ?, photos_json = ?, raw_data_path = ?,
          attachments_json = ?, metadata_json = ?,
          updated_at = ?
        WHERE id = ?
      `)
      .bind(
        // Instrument reference
        record.instrumentId,
        record.instrumentType,
        record.stationId,
        record.channelId || null,

        // Classification
        record.calibrationType,
        record.calibrationTiming,
        record.status,

        // Dates
        record.calibrationDate,
        record.calibrationStartTime,
        record.calibrationEndTime,
        record.durationMinutes,
        record.validFrom,
        record.validUntil,

        // Personnel
        record.performedBy,
        record.performedByUserId,
        record.laboratory,

        // Certificate
        record.certificateNumber,
        record.certificateUrl,

        // Panel
        record.panelType,
        record.panelSerialNumber,
        record.panelCalibrationDate,
        record.panelCondition,
        record.panelNominalReflectance,
        record.referenceStandard,

        // Ambient conditions
        record.temperatureCelsius,
        record.humidityPercent,
        record.cloudCover,
        record.windSpeedMs,
        record.solarZenithAngle,
        record.solarAzimuthAngle,
        record.ambientConditionsJson,

        // Sensor state before
        record.cleanlinessStateBefore,
        record.physicalAspectBefore,

        // Cleaning
        record.cleaningPerformed ? 1 : 0,
        record.cleaningMethod,
        record.cleaningSolution,

        // Sensor state after
        record.cleanlinessStateAfter,
        record.physicalAspectAfter,

        // Measurements
        record.measurementsBeforeJson ? (typeof record.measurementsBeforeJson === 'string' ? record.measurementsBeforeJson : JSON.stringify(record.measurementsBeforeJson)) : null,
        record.measurementsAfterJson ? (typeof record.measurementsAfterJson === 'string' ? record.measurementsAfterJson : JSON.stringify(record.measurementsAfterJson)) : null,

        // Coefficients
        record.coefficients ? JSON.stringify(record.coefficients) : null,

        // Dark current
        record.darkCurrentValuesJson ? (typeof record.darkCurrentValuesJson === 'string' ? record.darkCurrentValuesJson : JSON.stringify(record.darkCurrentValuesJson)) : null,
        record.integrationTimeMs,

        // Quality metrics
        record.qualityPassed !== null ? (record.qualityPassed ? 1 : 0) : null,
        record.qualityScore,
        record.deviationFromReference,
        record.uncertainty,
        record.rmse,
        record.r2,
        record.qualityNotes,

        // Documentation
        record.description,
        record.methodology,
        record.notes,
        record.photosJson ? (typeof record.photosJson === 'string' ? record.photosJson : JSON.stringify(record.photosJson)) : null,
        record.rawDataPath,

        // Metadata
        record.attachments ? JSON.stringify(record.attachments) : null,
        record.metadata ? JSON.stringify(record.metadata) : null,

        // Audit
        now,

        // WHERE
        record.id
      )
      .run();

    record.updatedAt = now;
    return record;
  }

  async deleteById(id) {
    await this.db
      .prepare('DELETE FROM calibration_records WHERE id = ?')
      .bind(id)
      .run();

    return true;
  }

  /**
   * Get calibration statistics for an instrument
   */
  async getStatistics(instrumentId) {
    const result = await this.db
      .prepare(`
        SELECT
          COUNT(*) as total_calibrations,
          COUNT(CASE WHEN status = 'valid' THEN 1 END) as valid_count,
          COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_count,
          COUNT(CASE WHEN quality_passed = 1 THEN 1 END) as passed_count,
          AVG(quality_score) as avg_quality_score,
          MAX(calibration_date) as last_calibration_date,
          MIN(calibration_date) as first_calibration_date
        FROM calibration_records
        WHERE instrument_id = ?
      `)
      .bind(instrumentId)
      .first();

    return result;
  }

  /**
   * Get cloud cover distribution for calibrations
   */
  async getCloudCoverDistribution(instrumentId = null) {
    let sql = `
      SELECT
        cloud_cover,
        COUNT(*) as count,
        AVG(quality_score) as avg_quality_score
      FROM calibration_records
      WHERE cloud_cover IS NOT NULL
    `;
    const params = [];

    if (instrumentId) {
      sql += ' AND instrument_id = ?';
      params.push(instrumentId);
    }

    sql += ' GROUP BY cloud_cover ORDER BY count DESC';

    const results = params.length > 0
      ? await this.db.prepare(sql).bind(...params).all()
      : await this.db.prepare(sql).all();

    return results.results;
  }

  /**
   * Find calibrations with optimal conditions (solar zenith <= 45°, clear/mostly_clear sky)
   */
  async findOptimalConditionCalibrations(instrumentId) {
    const results = await this.db
      .prepare(`
        SELECT * FROM calibration_records
        WHERE instrument_id = ?
          AND solar_zenith_angle IS NOT NULL
          AND solar_zenith_angle <= 45
          AND cloud_cover IN ('clear', 'mostly_clear')
        ORDER BY calibration_date DESC
      `)
      .bind(instrumentId)
      .all();

    return results.results.map(row => CalibrationRecord.fromRow(row));
  }
}
