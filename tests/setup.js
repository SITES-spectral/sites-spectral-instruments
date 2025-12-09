/**
 * Vitest Setup File
 * Provides mock environment for Cloudflare Workers testing
 * Enhanced with functional in-memory database
 */

import { vi } from 'vitest';

// In-memory data storage
const dataStore = {
  tables: {},
  autoIncrement: {},
};

// Initialize tables
function initTables() {
  dataStore.tables = {
    stations: [],
    platforms: [],
    instruments: [],
    areas_of_interest: [],
    acquisition_campaigns: [],
    products: [],
    platform_types: [],
    uav_platforms: [],
    satellite_platforms: [],
    users: [],
    activity_log: [],
  };
  dataStore.autoIncrement = {};
  Object.keys(dataStore.tables).forEach(t => {
    dataStore.autoIncrement[t] = 0;
  });
}

initTables();

// Parse simple SQL to determine table and operation
function parseSQL(sql) {
  const normalized = sql.trim().toUpperCase();

  if (normalized.startsWith('SELECT')) {
    const fromMatch = sql.match(/FROM\s+(\w+)/i);
    return { operation: 'SELECT', table: fromMatch ? fromMatch[1] : null, sql };
  }
  if (normalized.startsWith('INSERT')) {
    const intoMatch = sql.match(/INTO\s+(\w+)/i);
    return { operation: 'INSERT', table: intoMatch ? intoMatch[1] : null, sql };
  }
  if (normalized.startsWith('UPDATE')) {
    const tableMatch = sql.match(/UPDATE\s+(\w+)/i);
    return { operation: 'UPDATE', table: tableMatch ? tableMatch[1] : null, sql };
  }
  if (normalized.startsWith('DELETE')) {
    const fromMatch = sql.match(/FROM\s+(\w+)/i);
    return { operation: 'DELETE', table: fromMatch ? fromMatch[1] : null, sql };
  }
  if (normalized.startsWith('CREATE')) {
    return { operation: 'CREATE', table: null, sql };
  }
  return { operation: 'OTHER', table: null, sql };
}

// Extract column names from INSERT statement
function extractInsertColumns(sql) {
  const colMatch = sql.match(/\(([^)]+)\)\s*VALUES/i);
  if (colMatch) {
    return colMatch[1].split(',').map(c => c.trim());
  }
  return [];
}

// Mock D1 Database with actual data storage
class MockD1Database {
  prepare(sql) {
    return new MockD1PreparedStatement(sql, this);
  }

  async batch(statements) {
    const results = [];
    for (const stmt of statements) {
      results.push(await stmt.run());
    }
    return results;
  }

  async exec(sql) {
    return { success: true };
  }
}

class MockD1PreparedStatement {
  constructor(sql, db) {
    this.sql = sql;
    this.db = db;
    this.boundValues = [];
    this.parsed = parseSQL(sql);
  }

  bind(...values) {
    this.boundValues = values;
    return this;
  }

  async run() {
    const { operation, table } = this.parsed;

    if (operation === 'CREATE') {
      return { success: true, meta: { changes: 0 } };
    }

    if (operation === 'INSERT' && table && dataStore.tables[table]) {
      const columns = extractInsertColumns(this.sql);
      const record = { id: ++dataStore.autoIncrement[table] };

      columns.forEach((col, idx) => {
        if (idx < this.boundValues.length) {
          record[col] = this.boundValues[idx];
        }
      });

      dataStore.tables[table].push(record);

      return {
        success: true,
        meta: {
          last_row_id: record.id,
          changes: 1,
        },
        changes: 1,
      };
    }

    if (operation === 'UPDATE' && table && dataStore.tables[table]) {
      // Parse SET clause to get field names
      const setMatch = this.sql.match(/SET\s+(.+?)\s+WHERE/i);
      if (setMatch && this.boundValues.length > 0) {
        // Extract field names from SET clause (e.g., "field1 = ?, field2 = ?")
        const setClause = setMatch[1];
        const fields = setClause.split(',').map(f => f.split('=')[0].trim());

        // Last bound value is the ID from WHERE clause
        const id = parseInt(this.boundValues[this.boundValues.length - 1], 10);
        const record = dataStore.tables[table].find(r => r.id === id);

        if (record) {
          // Apply updates (bound values before the ID)
          fields.forEach((field, idx) => {
            if (idx < this.boundValues.length - 1) {
              record[field] = this.boundValues[idx];
            }
          });
        }
      }

      return {
        success: true,
        meta: {
          changes: 1,
        },
        changes: 1,
      };
    }

    if (operation === 'DELETE' && table && dataStore.tables[table]) {
      // Get ID from bound values if WHERE id = ?
      if (this.sql.toLowerCase().includes('where') && this.boundValues.length > 0) {
        const id = this.boundValues[this.boundValues.length - 1];
        const initialLength = dataStore.tables[table].length;
        dataStore.tables[table] = dataStore.tables[table].filter(r => r.id !== parseInt(id, 10));
        const changes = initialLength - dataStore.tables[table].length;
        return {
          success: true,
          meta: { changes },
          changes,
        };
      }
      // Delete all - also reset auto-increment counter
      const changes = dataStore.tables[table].length;
      dataStore.tables[table] = [];
      dataStore.autoIncrement[table] = 0; // Reset counter so IDs start fresh
      return { success: true, meta: { changes }, changes };
    }

    return { success: true, meta: { changes: 0 }, changes: 0 };
  }

  async first(column) {
    const { operation, table } = this.parsed;

    // Handle SELECT 1 health check
    if (this.sql.includes('SELECT 1')) {
      return { test: 1 };
    }

    // Handle COUNT(*)
    if (this.sql.includes('COUNT(*)')) {
      if (table && dataStore.tables[table]) {
        // Apply simple WHERE filters
        let data = dataStore.tables[table];
        if (this.boundValues.length > 0 && this.sql.toLowerCase().includes('where')) {
          // Very basic filter for common patterns
          data = this.filterData(data);
        }
        return { total: data.length, count: data.length };
      }
      return { total: 0, count: 0 };
    }

    // Handle SELECT by ID or other field
    if (operation === 'SELECT' && table && dataStore.tables[table]) {
      if (this.sql.toLowerCase().includes('where') && this.boundValues.length > 0) {
        const sqlLower = this.sql.toLowerCase();
        const firstBound = this.boundValues[0];

        // Check for id = ? pattern first (most common case)
        // Handles: "WHERE id = ?", "WHERE p.id = ?", "WHERE c.id = ?", etc.
        if (sqlLower.match(/where\s+(?:\w+\.)?id\s*=\s*\?/)) {
          const id = parseInt(firstBound, 10);
          if (!isNaN(id)) {
            const record = dataStore.tables[table].find(r => r.id === id);
            return record ? this.enrichRecord(record, table) : null;
          }
        }

        // Check for specific foreign key fields
        const idFields = ['station_id', 'platform_id', 'campaign_id', 'aoi_id', 'instrument_id', 'user_id'];
        for (const field of idFields) {
          if (sqlLower.includes(`${field} =`)) {
            const filtered = dataStore.tables[table].filter(r => r[field] == firstBound);
            if (filtered.length > 0) {
              return this.enrichRecord(filtered[0], table);
            }
            return null;
          }
        }

        // Check for string fields (normalized_name, name, etc)
        const stringFields = ['normalized_name', 'name', 'acronym', 'username'];
        for (const field of stringFields) {
          if (sqlLower.includes(`${field} =`)) {
            const record = dataStore.tables[table].find(r => r[field] === firstBound);
            return record ? this.enrichRecord(record, table) : null;
          }
        }

        // Fallback: try to find by id if firstBound is numeric
        const id = parseInt(firstBound, 10);
        if (!isNaN(id)) {
          const record = dataStore.tables[table].find(r => r.id === id);
          if (record) {
            return this.enrichRecord(record, table);
          }
        }

        // WHERE clause specified but no matching record found
        return null;
      }
      // No WHERE clause - return first record
      if (dataStore.tables[table].length > 0) {
        return this.enrichRecord(dataStore.tables[table][0], table);
      }
    }

    return null;
  }

  async all() {
    const { operation, table } = this.parsed;

    if (operation === 'SELECT' && table && dataStore.tables[table]) {
      let data = [...dataStore.tables[table]];

      // Apply filters based on WHERE clause
      if (this.sql.toLowerCase().includes('where')) {
        data = this.filterData(data);
      }

      // Apply LIMIT
      const limitMatch = this.sql.match(/LIMIT\s+(\d+)/i);
      if (limitMatch) {
        const limit = parseInt(limitMatch[1], 10);
        data = data.slice(0, limit);
      }

      // Enrich records with JOIN data
      data = data.map(r => this.enrichRecord(r, table));

      return {
        results: data,
        success: true,
        meta: {},
      };
    }

    return {
      results: [],
      success: true,
      meta: {},
    };
  }

  filterData(data) {
    // Very basic filter implementation for common patterns
    const sqlLower = this.sql.toLowerCase();
    let filtered = [...data];

    // Generic ID field filters - use first bound value for WHERE field = ?
    const idFields = ['station_id', 'platform_id', 'campaign_id', 'aoi_id', 'instrument_id', 'user_id'];
    for (const field of idFields) {
      if (sqlLower.includes(`${field} =`) && this.boundValues.length > 0) {
        const id = this.boundValues[0];
        filtered = filtered.filter(r => r[field] == id);
        break; // Only filter by first matching field
      }
    }

    // Filter by platform_type
    if (sqlLower.includes('platform_type =') && this.boundValues.length > 0) {
      const type = this.boundValues.find(v => typeof v === 'string' && ['fixed', 'uav', 'satellite', 'mobile'].includes(v));
      if (type) {
        filtered = filtered.filter(r => r.platform_type === type);
      }
    }

    // Filter by status
    if (sqlLower.includes('status =') && this.boundValues.length > 0) {
      const status = this.boundValues.find(v => typeof v === 'string' && ['active', 'planned', 'completed', 'available', 'good'].includes(v));
      if (status) {
        filtered = filtered.filter(r => r.status === status);
      }
    }

    return filtered;
  }

  enrichRecord(record, table) {
    if (!record) return null;
    const enriched = { ...record };

    // Add station info for platforms, products, campaigns, AOIs
    if (record.station_id && dataStore.tables.stations) {
      const station = dataStore.tables.stations.find(s => s.id === record.station_id);
      if (station) {
        enriched.station_acronym = station.acronym;
        enriched.station_name = station.display_name;
        enriched.station_normalized_name = station.normalized_name || station.acronym?.toLowerCase();
      }
    }

    // Add platform info for campaigns, products
    if (record.platform_id && dataStore.tables.platforms) {
      const platform = dataStore.tables.platforms.find(p => p.id === record.platform_id);
      if (platform) {
        enriched.platform_name = platform.display_name;
        enriched.platform_type = platform.platform_type;
      }
    }

    // Add platform_type info
    if (record.platform_type && dataStore.tables.platform_types) {
      const pt = dataStore.tables.platform_types.find(p => p.code === record.platform_type);
      if (pt) {
        enriched.platform_type_name = pt.name;
        enriched.platform_type_icon = pt.icon;
        enriched.platform_type_color = pt.color;
        enriched.requires_aoi = pt.requires_aoi;
      }
    }

    return enriched;
  }
}

// Create mock environment
const mockEnv = {
  DB: new MockD1Database(),
  ENVIRONMENT: 'test',
  APP_NAME: 'SITES Spectral Test',
  APP_VERSION: '11.0.0-alpha.33',
  JWT_SECRET: 'test-jwt-secret-key-for-testing-only',
  USE_CLOUDFLARE_SECRETS: 'false',
};

// Make env available globally
globalThis.env = mockEnv;

// Reset database function for use in tests
globalThis.resetMockDatabase = function() {
  initTables();
};

// Get data store for debugging
globalThis.getMockDataStore = function() {
  return dataStore;
};

// Mock Request and Response if not available
if (typeof Request === 'undefined') {
  globalThis.Request = class Request {
    constructor(url, options = {}) {
      this.url = url;
      this.method = options.method || 'GET';
      this.headers = new Map(Object.entries(options.headers || {}));
      this._body = options.body;
    }

    async json() {
      return JSON.parse(this._body);
    }

    async text() {
      return this._body;
    }
  };
}

if (typeof Response === 'undefined') {
  globalThis.Response = class Response {
    constructor(body, options = {}) {
      this._body = body;
      this.status = options.status || 200;
      this.headers = new Map(Object.entries(options.headers || {}));
    }

    async json() {
      return JSON.parse(this._body);
    }

    async text() {
      return this._body;
    }
  };
}

if (typeof Headers === 'undefined') {
  globalThis.Headers = class Headers {
    constructor(init = {}) {
      this._headers = new Map();
      if (init) {
        Object.entries(init).forEach(([key, value]) => {
          this._headers.set(key.toLowerCase(), value);
        });
      }
    }

    get(name) {
      return this._headers.get(name.toLowerCase());
    }

    set(name, value) {
      this._headers.set(name.toLowerCase(), value);
    }

    has(name) {
      return this._headers.has(name.toLowerCase());
    }

    delete(name) {
      this._headers.delete(name.toLowerCase());
    }

    entries() {
      return this._headers.entries();
    }
  };
}

if (typeof URL === 'undefined') {
  const { URL: NodeURL } = await import('url');
  globalThis.URL = NodeURL;
}

// Export for use in tests
export { mockEnv, MockD1Database, dataStore };
