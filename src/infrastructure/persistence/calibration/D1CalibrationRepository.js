/**
 * D1 Calibration Repository
 *
 * Implements CalibrationRepository port using Cloudflare D1.
 * Only supports multispectral and hyperspectral instruments.
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

    return result ? this.mapToEntity(result) : null;
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

    return results.results.map(row => this.mapToEntity(row));
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

    return result ? this.mapToEntity(result) : null;
  }

  async findAll(filters = {}) {
    let sql = 'SELECT * FROM calibration_records WHERE 1=1';
    const params = [];

    if (filters.channelId) {
      sql += ' AND channel_id = ?';
      params.push(filters.channelId);
    }

    if (filters.type) {
      sql += ' AND type = ?';
      params.push(filters.type);
    }

    if (filters.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.startDate) {
      sql += ' AND calibration_date >= ?';
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      sql += ' AND calibration_date <= ?';
      params.push(filters.endDate);
    }

    sql += ' ORDER BY calibration_date DESC';
    sql += ` LIMIT ${filters.limit || 50} OFFSET ${filters.offset || 0}`;

    const stmt = this.db.prepare(sql);
    const results = params.length > 0
      ? await stmt.bind(...params).all()
      : await stmt.all();

    return results.results.map(row => this.mapToEntity(row));
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

    sql += ' ORDER BY calibration_date ASC';

    const results = await this.db
      .prepare(sql)
      .bind(...params)
      .all();

    return results.results.map(row => this.mapToEntity(row));
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

    return results.results.map(row => this.mapToEntity(row));
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

    return results.results.map(row => this.mapToEntity(row));
  }

  async save(record) {
    if (record.id) {
      return await this.update(record);
    }
    return await this.create(record);
  }

  async create(record) {
    const result = await this.db
      .prepare(`
        INSERT INTO calibration_records (
          instrument_id, channel_id, type, status,
          calibration_date, valid_until, performed_by, laboratory,
          certificate_number, certificate_url, reference_standard,
          coefficients, uncertainty, temperature_celsius, humidity_percent,
          notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        record.instrumentId,
        record.channelId,
        record.type,
        record.status,
        record.calibrationDate,
        record.validUntil,
        record.performedBy,
        record.laboratory,
        record.certificateNumber,
        record.certificateUrl,
        record.referenceStandard,
        record.coefficients ? JSON.stringify(record.coefficients) : null,
        record.uncertainty,
        record.temperatureCelsius,
        record.humidityPercent,
        record.notes,
        record.createdAt,
        record.updatedAt
      )
      .run();

    record.id = result.meta.last_row_id;
    return record;
  }

  async update(record) {
    await this.db
      .prepare(`
        UPDATE calibration_records SET
          instrument_id = ?, channel_id = ?, type = ?, status = ?,
          calibration_date = ?, valid_until = ?, performed_by = ?,
          laboratory = ?, certificate_number = ?, certificate_url = ?,
          reference_standard = ?, coefficients = ?, uncertainty = ?,
          temperature_celsius = ?, humidity_percent = ?, notes = ?,
          updated_at = ?
        WHERE id = ?
      `)
      .bind(
        record.instrumentId,
        record.channelId,
        record.type,
        record.status,
        record.calibrationDate,
        record.validUntil,
        record.performedBy,
        record.laboratory,
        record.certificateNumber,
        record.certificateUrl,
        record.referenceStandard,
        record.coefficients ? JSON.stringify(record.coefficients) : null,
        record.uncertainty,
        record.temperatureCelsius,
        record.humidityPercent,
        record.notes,
        new Date().toISOString(),
        record.id
      )
      .run();

    return record;
  }

  async deleteById(id) {
    await this.db
      .prepare('DELETE FROM calibration_records WHERE id = ?')
      .bind(id)
      .run();

    return true;
  }

  mapToEntity(row) {
    return new CalibrationRecord({
      id: row.id,
      instrumentId: row.instrument_id,
      channelId: row.channel_id,
      type: row.type,
      status: row.status,
      calibrationDate: row.calibration_date,
      validUntil: row.valid_until,
      performedBy: row.performed_by,
      laboratory: row.laboratory,
      certificateNumber: row.certificate_number,
      certificateUrl: row.certificate_url,
      referenceStandard: row.reference_standard,
      coefficients: row.coefficients ? JSON.parse(row.coefficients) : null,
      uncertainty: row.uncertainty,
      temperatureCelsius: row.temperature_celsius,
      humidityPercent: row.humidity_percent,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }
}
