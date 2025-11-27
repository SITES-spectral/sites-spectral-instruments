/**
 * Vitest Setup File
 * Provides mock environment for Cloudflare Workers testing
 */

import { vi } from 'vitest';

// Mock D1 Database
class MockD1Database {
  constructor() {
    this.data = {
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
    };
    this.lastInsertRowId = 0;
  }

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
  }

  bind(...values) {
    this.boundValues = values;
    return this;
  }

  async run() {
    this.db.lastInsertRowId++;
    return {
      success: true,
      meta: {
        last_row_id: this.db.lastInsertRowId,
        changes: 1,
      },
    };
  }

  async first(column) {
    // Return mock data based on SQL
    if (this.sql.includes('SELECT 1')) {
      return { test: 1 };
    }
    if (this.sql.includes('COUNT(*)')) {
      return { count: 5 };
    }
    return null;
  }

  async all() {
    return {
      results: [],
      success: true,
      meta: {},
    };
  }
}

// Create mock environment
const mockEnv = {
  DB: new MockD1Database(),
  ENVIRONMENT: 'test',
  APP_NAME: 'SITES Spectral Test',
  APP_VERSION: '8.0.0-rc.2',
  JWT_SECRET: 'test-jwt-secret-key-for-testing-only',
  USE_CLOUDFLARE_SECRETS: 'false',
};

// Make env available globally
globalThis.env = mockEnv;

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
export { mockEnv, MockD1Database };
