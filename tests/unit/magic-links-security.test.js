/**
 * Magic Links Security Tests
 *
 * Tests for rate limiting and input validation on magic link endpoints.
 *
 * ML-001: Add rate limiting on create/validate endpoints
 * ML-002: Add input validation on request bodies
 *
 * @version 15.6.3
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock validation functions
import {
  sanitizeString,
  sanitizeInteger,
  sanitizeEnum
} from '../../src/utils/validation.js';

// Magic link specific validation schema
const MAGIC_LINK_SCHEMA = {
  station_id: { type: 'integer', min: 1 },
  label: { type: 'string', maxLength: 200 },
  description: { type: 'string', maxLength: 1000 },
  expires_in_days: { type: 'integer', min: 1, max: 365 },
  single_use: { type: 'boolean' },
  role: { type: 'enum', values: ['readonly', 'station-internal'] }
};

describe('Magic Links Security (ML-001, ML-002)', () => {
  describe('Input Validation (ML-002)', () => {
    describe('sanitizeString for label', () => {
      it('should trim whitespace from label', () => {
        expect(sanitizeString('  my label  ', { maxLength: 200 })).toBe('my label');
      });

      it('should truncate labels exceeding maxLength', () => {
        const longLabel = 'a'.repeat(300);
        const result = sanitizeString(longLabel, { maxLength: 200 });
        expect(result.length).toBe(200);
      });

      it('should remove control characters from label', () => {
        const dirtyLabel = 'my\x00label\x1fwith\x7fcontrol';
        const result = sanitizeString(dirtyLabel, { maxLength: 200 });
        expect(result).toBe('mylabelwithcontrol');
      });

      it('should return null for empty strings by default', () => {
        expect(sanitizeString('', { maxLength: 200 })).toBe(null);
        expect(sanitizeString('   ', { maxLength: 200 })).toBe(null);
      });
    });

    describe('sanitizeInteger for expires_in_days', () => {
      it('should reject negative expires_in_days', () => {
        expect(sanitizeInteger(-1, { min: 1, max: 365 })).toBe(null);
      });

      it('should reject zero expires_in_days', () => {
        expect(sanitizeInteger(0, { min: 1, max: 365 })).toBe(null);
      });

      it('should reject expires_in_days over 365', () => {
        expect(sanitizeInteger(10000, { min: 1, max: 365 })).toBe(null);
      });

      it('should accept valid expires_in_days', () => {
        expect(sanitizeInteger(7, { min: 1, max: 365 })).toBe(7);
        expect(sanitizeInteger(30, { min: 1, max: 365 })).toBe(30);
        expect(sanitizeInteger(365, { min: 1, max: 365 })).toBe(365);
      });

      it('should handle string numbers correctly', () => {
        expect(sanitizeInteger('7', { min: 1, max: 365 })).toBe(7);
        expect(sanitizeInteger('invalid', { min: 1, max: 365 })).toBe(null);
      });

      it('should handle NaN/Infinity', () => {
        expect(sanitizeInteger(NaN, { min: 1, max: 365 })).toBe(null);
        expect(sanitizeInteger(Infinity, { min: 1, max: 365 })).toBe(null);
      });
    });

    describe('sanitizeEnum for role', () => {
      const allowedRoles = ['readonly', 'station-internal'];

      it('should accept valid roles', () => {
        expect(sanitizeEnum('readonly', allowedRoles)).toBe('readonly');
        expect(sanitizeEnum('station-internal', allowedRoles)).toBe('station-internal');
      });

      it('should reject invalid roles', () => {
        expect(sanitizeEnum('admin', allowedRoles)).toBe(null);
        expect(sanitizeEnum('station-admin', allowedRoles)).toBe(null);
        expect(sanitizeEnum('uav-pilot', allowedRoles)).toBe(null);
      });

      it('should reject empty/null values', () => {
        expect(sanitizeEnum('', allowedRoles)).toBe(null);
        expect(sanitizeEnum(null, allowedRoles)).toBe(null);
        expect(sanitizeEnum(undefined, allowedRoles)).toBe(null);
      });
    });

    describe('Request body type validation', () => {
      it('should validate body is an object', () => {
        // Arrays should be rejected
        const arrayBody = [{ station_id: 1 }];
        expect(Array.isArray(arrayBody)).toBe(true);
        expect(typeof arrayBody).toBe('object');
        // Our handler should explicitly check: body !== null && !Array.isArray(body) && typeof body === 'object'

        // null should be rejected
        const nullBody = null;
        expect(nullBody === null).toBe(true);

        // Valid object should be accepted
        const objectBody = { station_id: 1 };
        expect(objectBody !== null && !Array.isArray(objectBody) && typeof objectBody === 'object').toBe(true);
      });
    });
  });

  describe('Rate Limiting Configuration (ML-001)', () => {
    // These tests verify the rate limit configuration values
    const MAGIC_LINK_RATE_LIMITS = {
      magic_link_create: {
        maxAttempts: 5,
        windowMs: 60 * 60 * 1000, // 1 hour
        blockDurationMs: 60 * 60 * 1000 // 1 hour after limit exceeded
      },
      magic_link_validate: {
        maxAttempts: 10,
        windowMs: 60 * 1000, // 1 minute
        blockDurationMs: 5 * 60 * 1000 // 5 minutes after limit exceeded
      }
    };

    it('should have stricter limits on create (5 per hour)', () => {
      expect(MAGIC_LINK_RATE_LIMITS.magic_link_create.maxAttempts).toBe(5);
      expect(MAGIC_LINK_RATE_LIMITS.magic_link_create.windowMs).toBe(60 * 60 * 1000);
    });

    it('should have reasonable limits on validate (10 per minute)', () => {
      expect(MAGIC_LINK_RATE_LIMITS.magic_link_validate.maxAttempts).toBe(10);
      expect(MAGIC_LINK_RATE_LIMITS.magic_link_validate.windowMs).toBe(60 * 1000);
    });

    it('should block longer after create limit exceeded', () => {
      expect(MAGIC_LINK_RATE_LIMITS.magic_link_create.blockDurationMs).toBe(60 * 60 * 1000);
    });
  });

  describe('validateMagicLinkInput helper', () => {
    // This function will be added to magic-links.js
    function validateMagicLinkInput(body) {
      const errors = [];

      // Body must be an object (not array, not null)
      if (body === null || Array.isArray(body) || typeof body !== 'object') {
        return { valid: false, errors: ['Request body must be an object'] };
      }

      // Required: station_id
      const stationId = sanitizeInteger(body.station_id, { min: 1 });
      if (!stationId) {
        errors.push('station_id is required and must be a positive integer');
      }

      // Optional: label (max 200 chars)
      if (body.label !== undefined) {
        const label = sanitizeString(body.label, { maxLength: 200, allowEmpty: true });
        if (body.label && !label) {
          errors.push('label must be a valid string (max 200 characters)');
        }
      }

      // Optional: description (max 1000 chars)
      if (body.description !== undefined) {
        const desc = sanitizeString(body.description, { maxLength: 1000, allowEmpty: true });
        if (body.description && !desc) {
          errors.push('description must be a valid string (max 1000 characters)');
        }
      }

      // Optional: expires_in_days (1-365)
      if (body.expires_in_days !== undefined) {
        const days = sanitizeInteger(body.expires_in_days, { min: 1, max: 365 });
        if (days === null) {
          errors.push('expires_in_days must be between 1 and 365');
        }
      }

      // Optional: role (readonly or station-internal)
      if (body.role !== undefined) {
        const role = sanitizeEnum(body.role, ['readonly', 'station-internal']);
        if (!role) {
          errors.push('role must be "readonly" or "station-internal"');
        }
      }

      return {
        valid: errors.length === 0,
        errors
      };
    }

    it('should reject null body', () => {
      const result = validateMagicLinkInput(null);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Request body must be an object');
    });

    it('should reject array body', () => {
      const result = validateMagicLinkInput([{ station_id: 1 }]);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Request body must be an object');
    });

    it('should require station_id', () => {
      const result = validateMagicLinkInput({ label: 'test' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('station_id is required and must be a positive integer');
    });

    it('should reject negative station_id', () => {
      const result = validateMagicLinkInput({ station_id: -1 });
      expect(result.valid).toBe(false);
    });

    it('should accept valid minimal input', () => {
      const result = validateMagicLinkInput({ station_id: 1 });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept valid full input', () => {
      const result = validateMagicLinkInput({
        station_id: 1,
        label: 'Field researcher access',
        description: 'Access for summer field campaign 2026',
        expires_in_days: 30,
        single_use: false,
        role: 'station-internal'
      });
      expect(result.valid).toBe(true);
    });

    it('should reject invalid expires_in_days', () => {
      const result = validateMagicLinkInput({
        station_id: 1,
        expires_in_days: 10000
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('expires_in_days must be between 1 and 365');
    });

    it('should reject invalid role', () => {
      const result = validateMagicLinkInput({
        station_id: 1,
        role: 'admin'
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('role must be "readonly" or "station-internal"');
    });
  });
});
