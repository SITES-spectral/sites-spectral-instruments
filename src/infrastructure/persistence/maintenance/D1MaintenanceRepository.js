/**
 * D1 Maintenance Repository
 *
 * Implements MaintenanceRepository port using Cloudflare D1.
 *
 * @module infrastructure/persistence/maintenance/D1MaintenanceRepository
 */

import { MaintenanceRecord, MaintenanceRepository } from '../../../domain/index.js';

export class D1MaintenanceRepository extends MaintenanceRepository {
  constructor(db) {
    super();
    this.db = db;
  }

  async findById(id) {
    const result = await this.db
      .prepare('SELECT * FROM maintenance_records WHERE id = ?')
      .bind(id)
      .first();

    return result ? this.mapToEntity(result) : null;
  }

  async findByPlatformId(platformId) {
    const results = await this.db
      .prepare(`
        SELECT * FROM maintenance_records
        WHERE entity_type = 'platform' AND entity_id = ?
        ORDER BY scheduled_date DESC
      `)
      .bind(platformId)
      .all();

    return results.results.map(row => this.mapToEntity(row));
  }

  async findByInstrumentId(instrumentId) {
    const results = await this.db
      .prepare(`
        SELECT * FROM maintenance_records
        WHERE entity_type = 'instrument' AND entity_id = ?
        ORDER BY scheduled_date DESC
      `)
      .bind(instrumentId)
      .all();

    return results.results.map(row => this.mapToEntity(row));
  }

  async findByStationId(stationId) {
    const results = await this.db
      .prepare(`
        SELECT * FROM maintenance_records
        WHERE station_id = ?
        ORDER BY scheduled_date DESC
      `)
      .bind(stationId)
      .all();

    return results.results.map(row => this.mapToEntity(row));
  }

  async findAll(filters = {}) {
    let sql = 'SELECT * FROM maintenance_records WHERE 1=1';
    const params = [];

    if (filters.entityType) {
      sql += ' AND entity_type = ?';
      params.push(filters.entityType);
    }

    if (filters.type) {
      sql += ' AND type = ?';
      params.push(filters.type);
    }

    if (filters.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.priority) {
      sql += ' AND priority = ?';
      params.push(filters.priority);
    }

    if (filters.startDate) {
      sql += ' AND scheduled_date >= ?';
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      sql += ' AND scheduled_date <= ?';
      params.push(filters.endDate);
    }

    sql += ' ORDER BY scheduled_date DESC';
    sql += ` LIMIT ${filters.limit || 50} OFFSET ${filters.offset || 0}`;

    const stmt = this.db.prepare(sql);
    const results = params.length > 0
      ? await stmt.bind(...params).all()
      : await stmt.all();

    return results.results.map(row => this.mapToEntity(row));
  }

  async findTimeline(entityType, entityId, options = {}) {
    let sql = `
      SELECT * FROM maintenance_records
      WHERE entity_type = ? AND entity_id = ?
    `;
    const params = [entityType, entityId];

    if (options.startDate) {
      sql += ' AND scheduled_date >= ?';
      params.push(options.startDate);
    }

    if (options.endDate) {
      sql += ' AND scheduled_date <= ?';
      params.push(options.endDate);
    }

    sql += ' ORDER BY scheduled_date ASC';

    const results = await this.db
      .prepare(sql)
      .bind(...params)
      .all();

    return results.results.map(row => this.mapToEntity(row));
  }

  async findPending(stationId = null) {
    let sql = `
      SELECT * FROM maintenance_records
      WHERE status IN ('scheduled', 'in_progress')
    `;
    const params = [];

    if (stationId) {
      sql += ' AND station_id = ?';
      params.push(stationId);
    }

    sql += ' ORDER BY priority DESC, scheduled_date ASC';

    const stmt = this.db.prepare(sql);
    const results = params.length > 0
      ? await stmt.bind(...params).all()
      : await stmt.all();

    return results.results.map(row => this.mapToEntity(row));
  }

  async findOverdue() {
    const today = new Date().toISOString().split('T')[0];
    const results = await this.db
      .prepare(`
        SELECT * FROM maintenance_records
        WHERE status = 'scheduled' AND scheduled_date < ?
        ORDER BY scheduled_date ASC
      `)
      .bind(today)
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
        INSERT INTO maintenance_records (
          entity_type, entity_id, station_id, type, status, priority,
          title, description, scheduled_date, completed_date,
          performed_by, work_performed, parts_replaced,
          cost, duration, notes, next_scheduled_date,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        record.entityType,
        record.entityId,
        record.stationId,
        record.type,
        record.status,
        record.priority,
        record.title,
        record.description,
        record.scheduledDate,
        record.completedDate,
        record.performedBy,
        record.workPerformed,
        record.partsReplaced ? JSON.stringify(record.partsReplaced) : null,
        record.cost,
        record.duration,
        record.notes,
        record.nextScheduledDate,
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
        UPDATE maintenance_records SET
          entity_type = ?, entity_id = ?, station_id = ?,
          type = ?, status = ?, priority = ?,
          title = ?, description = ?, scheduled_date = ?,
          completed_date = ?, performed_by = ?, work_performed = ?,
          parts_replaced = ?, cost = ?, duration = ?, notes = ?,
          next_scheduled_date = ?, updated_at = ?
        WHERE id = ?
      `)
      .bind(
        record.entityType,
        record.entityId,
        record.stationId,
        record.type,
        record.status,
        record.priority,
        record.title,
        record.description,
        record.scheduledDate,
        record.completedDate,
        record.performedBy,
        record.workPerformed,
        record.partsReplaced ? JSON.stringify(record.partsReplaced) : null,
        record.cost,
        record.duration,
        record.notes,
        record.nextScheduledDate,
        new Date().toISOString(),
        record.id
      )
      .run();

    return record;
  }

  async deleteById(id) {
    await this.db
      .prepare('DELETE FROM maintenance_records WHERE id = ?')
      .bind(id)
      .run();

    return true;
  }

  mapToEntity(row) {
    return new MaintenanceRecord({
      id: row.id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      stationId: row.station_id,
      type: row.type,
      status: row.status,
      priority: row.priority,
      title: row.title,
      description: row.description,
      scheduledDate: row.scheduled_date,
      completedDate: row.completed_date,
      performedBy: row.performed_by,
      workPerformed: row.work_performed,
      partsReplaced: row.parts_replaced ? JSON.parse(row.parts_replaced) : null,
      cost: row.cost,
      duration: row.duration,
      notes: row.notes,
      nextScheduledDate: row.next_scheduled_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }
}
