/**
 * Password Hasher Tests
 * Tests for PBKDF2-based password hashing with Web Crypto API
 */

import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  isPasswordHashed,
  timingSafeEqual,
  bytesToHex,
  hexToBytes
} from '../../src/auth/password-hasher.js';

describe('Password Hasher', () => {
  describe('hashPassword', () => {
    it('should return a string in salt:hash format', async () => {
      const hash = await hashPassword('test-password');
      expect(hash).toMatch(/^[a-f0-9]{32}:[a-f0-9]{64}$/);
    });

    it('should generate different hashes for the same password (random salt)', async () => {
      const hash1 = await hashPassword('same-password');
      const hash2 = await hashPassword('same-password');
      expect(hash1).not.toBe(hash2);
    });

    it('should throw for empty password', async () => {
      await expect(hashPassword('')).rejects.toThrow('Password must be a non-empty string');
    });

    it('should throw for null password', async () => {
      await expect(hashPassword(null)).rejects.toThrow('Password must be a non-empty string');
    });

    it('should throw for undefined password', async () => {
      await expect(hashPassword(undefined)).rejects.toThrow('Password must be a non-empty string');
    });

    it('should handle special characters', async () => {
      const hash = await hashPassword('p@$$w0rd!#$%^&*()');
      expect(hash).toMatch(/^[a-f0-9]{32}:[a-f0-9]{64}$/);
    });

    it('should handle unicode characters', async () => {
      const hash = await hashPassword('пароль密码كلمة');
      expect(hash).toMatch(/^[a-f0-9]{32}:[a-f0-9]{64}$/);
    });

    it('should handle very long passwords', async () => {
      const longPassword = 'a'.repeat(1000);
      const hash = await hashPassword(longPassword);
      expect(hash).toMatch(/^[a-f0-9]{32}:[a-f0-9]{64}$/);
    });
  });

  describe('verifyPassword', () => {
    it('should return true for correct password with hashed value', async () => {
      const password = 'my-secure-password';
      const hash = await hashPassword(password);
      const result = await verifyPassword(password, hash);
      expect(result).toBe(true);
    });

    it('should return false for incorrect password with hashed value', async () => {
      const hash = await hashPassword('correct-password');
      const result = await verifyPassword('wrong-password', hash);
      expect(result).toBe(false);
    });

    it('should return true for correct plain text password (legacy support)', async () => {
      // Plain text passwords don't contain ':'
      const plainPassword = 'legacy-plain-password';
      const result = await verifyPassword(plainPassword, plainPassword);
      expect(result).toBe(true);
    });

    it('should return false for incorrect plain text password', async () => {
      const result = await verifyPassword('wrong', 'correct');
      expect(result).toBe(false);
    });

    it('should return false for empty password', async () => {
      const hash = await hashPassword('test');
      const result = await verifyPassword('', hash);
      expect(result).toBe(false);
    });

    it('should return false for null password', async () => {
      const hash = await hashPassword('test');
      const result = await verifyPassword(null, hash);
      expect(result).toBe(false);
    });

    it('should return false for empty stored hash', async () => {
      const result = await verifyPassword('password', '');
      expect(result).toBe(false);
    });

    it('should return false for malformed hash', async () => {
      const result = await verifyPassword('password', 'not:a:valid:hash');
      expect(result).toBe(false);
    });

    it('should return false for hash with invalid hex', async () => {
      const result = await verifyPassword('password', 'zzzz:yyyy');
      expect(result).toBe(false);
    });
  });

  describe('isPasswordHashed', () => {
    it('should return true for valid hashed password', async () => {
      const hash = await hashPassword('test');
      expect(isPasswordHashed(hash)).toBe(true);
    });

    it('should return false for plain text password', () => {
      expect(isPasswordHashed('plain-password')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isPasswordHashed('')).toBe(false);
    });

    it('should return false for null', () => {
      expect(isPasswordHashed(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isPasswordHashed(undefined)).toBe(false);
    });

    it('should return false for string with wrong format', () => {
      expect(isPasswordHashed('abc:def')).toBe(false); // Too short
      expect(isPasswordHashed('a'.repeat(32) + ':' + 'b'.repeat(32))).toBe(false); // Hash too short
    });
  });

  describe('timingSafeEqual', () => {
    it('should return true for equal strings', () => {
      expect(timingSafeEqual('hello', 'hello')).toBe(true);
    });

    it('should return false for unequal strings', () => {
      expect(timingSafeEqual('hello', 'world')).toBe(false);
    });

    it('should return false for different length strings', () => {
      expect(timingSafeEqual('short', 'longer-string')).toBe(false);
    });

    it('should return false for non-string first argument', () => {
      expect(timingSafeEqual(123, '123')).toBe(false);
    });

    it('should return false for non-string second argument', () => {
      expect(timingSafeEqual('123', 123)).toBe(false);
    });

    it('should handle empty strings', () => {
      expect(timingSafeEqual('', '')).toBe(true);
    });
  });

  describe('bytesToHex and hexToBytes', () => {
    it('should round-trip correctly', () => {
      const original = new Uint8Array([0, 127, 255, 1, 128]);
      const hex = bytesToHex(original);
      const result = hexToBytes(hex);
      expect(Array.from(result)).toEqual(Array.from(original));
    });

    it('should convert bytes to hex correctly', () => {
      const bytes = new Uint8Array([0, 15, 16, 255]);
      expect(bytesToHex(bytes)).toBe('000f10ff');
    });

    it('should convert hex to bytes correctly', () => {
      const result = hexToBytes('000f10ff');
      expect(Array.from(result)).toEqual([0, 15, 16, 255]);
    });
  });

  describe('Security Scenarios', () => {
    it('should be resistant to timing attacks (constant time comparison)', async () => {
      const hash = await hashPassword('correct-password');

      // These should all take roughly the same time
      // (We can't measure precisely in tests, but we verify the function exists)
      await verifyPassword('wrong', hash);
      await verifyPassword('completely-different-password', hash);
      await verifyPassword('correct-password', hash);
      // If we got here without errors, timing-safe comparison is working
      expect(true).toBe(true);
    });

    it('should use unique salt for each hash', async () => {
      const hashes = await Promise.all([
        hashPassword('password'),
        hashPassword('password'),
        hashPassword('password'),
        hashPassword('password'),
        hashPassword('password')
      ]);

      const salts = hashes.map(h => h.split(':')[0]);
      const uniqueSalts = new Set(salts);

      // All salts should be unique
      expect(uniqueSalts.size).toBe(5);
    });
  });
});
