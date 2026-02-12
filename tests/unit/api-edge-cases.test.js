/**
 * API Edge Cases Tests
 *
 * Tests for input validation edge cases identified in security audit.
 * Covers pagination, ID validation, request body validation, and size limits.
 *
 * @module tests/unit/api-edge-cases
 * @see docs/audits/2026-02-11-COMPREHENSIVE-SECURITY-AUDIT.md
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validatePagination,
  validateId,
  validateRequestBody,
  validateRequestSize,
  sanitizePaginationParams
} from '../../src/utils/api-validation.js';

describe('API Edge Cases', () => {
  describe('Pagination Validation', () => {
    it('should reject page=0', () => {
      const result = validatePagination({ page: 0, limit: 25 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('page must be at least 1');
    });

    it('should reject page=-1', () => {
      const result = validatePagination({ page: -1, limit: 25 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('page must be at least 1');
    });

    it('should reject limit=0', () => {
      const result = validatePagination({ page: 1, limit: 0 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('limit must be at least 1');
    });

    it('should reject limit=-1', () => {
      const result = validatePagination({ page: 1, limit: -1 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('limit must be at least 1');
    });

    it('should reject NaN page', () => {
      const result = validatePagination({ page: NaN, limit: 25 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('page must be a valid number');
    });

    it('should reject Infinity page', () => {
      const result = validatePagination({ page: Infinity, limit: 25 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('page must be a valid number');
    });

    it('should reject NaN limit', () => {
      const result = validatePagination({ page: 1, limit: NaN });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('limit must be a valid number');
    });

    it('should reject Infinity limit', () => {
      const result = validatePagination({ page: 1, limit: Infinity });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('limit must be a valid number');
    });

    it('should cap limit at maximum (100)', () => {
      const result = validatePagination({ page: 1, limit: 500 });
      expect(result.valid).toBe(true);
      expect(result.sanitized.limit).toBe(100);
    });

    it('should accept valid pagination', () => {
      const result = validatePagination({ page: 1, limit: 25 });
      expect(result.valid).toBe(true);
      expect(result.sanitized).toEqual({ page: 1, limit: 25 });
    });

    it('should use defaults for missing values', () => {
      const result = validatePagination({});
      expect(result.valid).toBe(true);
      expect(result.sanitized).toEqual({ page: 1, limit: 25 });
    });
  });

  describe('Pagination Parameter Sanitization', () => {
    it('should parse string page to integer', () => {
      const result = sanitizePaginationParams('5', '10');
      expect(result.page).toBe(5);
      expect(result.limit).toBe(10);
    });

    it('should handle non-numeric page string', () => {
      const result = sanitizePaginationParams('abc', '25');
      expect(result.page).toBe(1); // Default
    });

    it('should handle non-numeric limit string', () => {
      const result = sanitizePaginationParams('1', 'xyz');
      expect(result.limit).toBe(25); // Default
    });

    it('should handle empty strings', () => {
      const result = sanitizePaginationParams('', '');
      expect(result.page).toBe(1);
      expect(result.limit).toBe(25);
    });

    it('should handle null/undefined', () => {
      const result = sanitizePaginationParams(null, undefined);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(25);
    });
  });

  describe('ID Validation', () => {
    it('should reject non-numeric ID', () => {
      const result = validateId('abc');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must be a positive integer');
    });

    it('should reject negative ID', () => {
      const result = validateId(-5);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must be a positive integer');
    });

    it('should reject zero ID', () => {
      const result = validateId(0);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must be a positive integer');
    });

    it('should reject NaN ID', () => {
      const result = validateId(NaN);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must be a positive integer');
    });

    it('should reject Infinity ID', () => {
      const result = validateId(Infinity);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must be a positive integer');
    });

    it('should reject float ID', () => {
      const result = validateId(5.5);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must be a positive integer');
    });

    it('should accept valid numeric ID', () => {
      const result = validateId(123);
      expect(result.valid).toBe(true);
      expect(result.value).toBe(123);
    });

    it('should parse valid string ID', () => {
      const result = validateId('456');
      expect(result.valid).toBe(true);
      expect(result.value).toBe(456);
    });

    it('should reject ID exceeding max safe integer', () => {
      const result = validateId(Number.MAX_SAFE_INTEGER + 1);
      expect(result.valid).toBe(false);
    });
  });

  describe('Request Body Validation', () => {
    it('should reject null body', () => {
      const result = validateRequestBody(null);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must be an object');
    });

    it('should reject array body', () => {
      const result = validateRequestBody([1, 2, 3]);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must be an object');
    });

    it('should reject string body', () => {
      const result = validateRequestBody('hello');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must be an object');
    });

    it('should reject number body', () => {
      const result = validateRequestBody(42);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must be an object');
    });

    it('should reject boolean body', () => {
      const result = validateRequestBody(true);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must be an object');
    });

    it('should accept empty object', () => {
      const result = validateRequestBody({});
      expect(result.valid).toBe(true);
    });

    it('should accept valid object', () => {
      const result = validateRequestBody({ name: 'test', value: 123 });
      expect(result.valid).toBe(true);
    });
  });

  describe('Request Size Validation', () => {
    it('should reject request exceeding 1MB', () => {
      const result = validateRequestSize(1048577); // 1MB + 1 byte
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too large');
    });

    it('should accept request at exactly 1MB', () => {
      const result = validateRequestSize(1048576); // Exactly 1MB
      expect(result.valid).toBe(true);
    });

    it('should accept small request', () => {
      const result = validateRequestSize(1024); // 1KB
      expect(result.valid).toBe(true);
    });

    it('should accept missing content-length', () => {
      const result = validateRequestSize(null);
      expect(result.valid).toBe(true);
    });

    it('should handle custom max size', () => {
      const result = validateRequestSize(2048, { maxSize: 1024 });
      expect(result.valid).toBe(false);
    });
  });

  describe('Edge Case Combinations', () => {
    it('should handle multiple validation errors', () => {
      const pagination = validatePagination({ page: -1, limit: -1 });
      expect(pagination.valid).toBe(false);
      expect(pagination.errors.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle extreme values gracefully', () => {
      // MAX_VALUE is finite but exceeds MAX_SAFE_INTEGER
      const idResult = validateId(Number.MAX_VALUE);
      expect(idResult.valid).toBe(false);

      // MAX_VALUE pagination is valid but gets capped to reasonable values
      const paginationResult = validatePagination({
        page: Number.MAX_VALUE,
        limit: Number.MAX_VALUE
      });
      // This is valid because MAX_VALUE is finite, but limit gets capped to 100
      expect(paginationResult.valid).toBe(true);
      expect(paginationResult.sanitized.limit).toBe(100);
    });
  });
});
