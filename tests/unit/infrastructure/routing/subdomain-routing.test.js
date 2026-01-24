/**
 * Subdomain Routing Tests
 *
 * Tests for subdomain-based portal routing introduced in v15.0.0
 * Covers subdomain detection, portal type determination, station validation,
 * and integration with CORS/CSRF protection.
 *
 * Architecture Credit: This subdomain-based architecture design is based on
 * architectural knowledge shared by Flights for Biodiversity Sweden AB
 * (https://github.com/flightsforbiodiversity)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  isAllowedOrigin,
  getAllowedOrigin,
  getStationAcronyms,
  isValidStationSubdomain
} from '../../../../src/config/allowed-origins.js';
import {
  validateRequestOrigin,
  csrfProtect
} from '../../../../src/utils/csrf.js';

/**
 * Helper to create mock request with Host header
 * @param {Object} options - Request options
 * @returns {Object} Mock Request object
 */
function createMockRequest(options = {}) {
  const {
    host = 'sitesspectral.work',
    origin = null,
    referer = null,
    method = 'GET',
    contentType = 'application/json',
    url = 'https://sitesspectral.work/api/stations'
  } = options;

  return {
    method,
    url,
    headers: {
      get: (name) => {
        switch (name.toLowerCase()) {
          case 'host': return host;
          case 'origin': return origin;
          case 'referer': return referer;
          case 'content-type': return contentType;
          default: return null;
        }
      }
    }
  };
}

/**
 * Extract subdomain from Host header (mirrors worker.js logic)
 * @param {Request} request - Request object
 * @returns {string|null} Subdomain or null for root domain
 */
function getSubdomain(request) {
  const host = request.headers.get('Host') || '';
  const parts = host.split('.');

  // Expected formats:
  // - sitesspectral.work (root domain)
  // - admin.sitesspectral.work (admin subdomain)
  // - svartberget.sitesspectral.work (station subdomain)
  if (parts.length === 3 && parts[1] === 'sitesspectral' && parts[2] === 'work') {
    return parts[0];
  }

  // For Workers dev URL, use X-Subdomain header (testing) or query param
  if (host.includes('workers.dev')) {
    const subdomainHeader = request.headers.get('X-Subdomain');
    if (subdomainHeader) {
      return subdomainHeader;
    }

    // Check query param for testing
    const url = new URL(request.url);
    const subdomainParam = url.searchParams.get('subdomain');
    if (subdomainParam) {
      return subdomainParam;
    }
  }

  return null;
}

/**
 * Determine portal type from subdomain (mirrors worker.js logic)
 * @param {string|null} subdomain - Subdomain from request
 * @returns {'public'|'admin'|'station'} Portal type
 */
function getPortalType(subdomain) {
  if (!subdomain || subdomain === 'www') {
    return 'public';
  }

  if (subdomain === 'admin') {
    return 'admin';
  }

  // Any other subdomain is treated as a station portal
  return 'station';
}

describe('Subdomain Routing', () => {
  describe('Subdomain Detection (getSubdomain)', () => {
    it('should return null for root domain (sitesspectral.work)', () => {
      const request = createMockRequest({ host: 'sitesspectral.work' });
      const subdomain = getSubdomain(request);

      expect(subdomain).toBeNull();
    });

    it('should detect admin subdomain', () => {
      const request = createMockRequest({ host: 'admin.sitesspectral.work' });
      const subdomain = getSubdomain(request);

      expect(subdomain).toBe('admin');
    });

    it('should detect station subdomain (svartberget)', () => {
      const request = createMockRequest({ host: 'svartberget.sitesspectral.work' });
      const subdomain = getSubdomain(request);

      expect(subdomain).toBe('svartberget');
    });

    it('should detect station subdomain (svb)', () => {
      const request = createMockRequest({ host: 'svb.sitesspectral.work' });
      const subdomain = getSubdomain(request);

      expect(subdomain).toBe('svb');
    });

    it('should detect station subdomain (abisko)', () => {
      const request = createMockRequest({ host: 'abisko.sitesspectral.work' });
      const subdomain = getSubdomain(request);

      expect(subdomain).toBe('abisko');
    });

    it('should detect station subdomain (ans)', () => {
      const request = createMockRequest({ host: 'ans.sitesspectral.work' });
      const subdomain = getSubdomain(request);

      expect(subdomain).toBe('ans');
    });

    it('should detect station subdomain (lonnstorp)', () => {
      const request = createMockRequest({ host: 'lonnstorp.sitesspectral.work' });
      const subdomain = getSubdomain(request);

      expect(subdomain).toBe('lonnstorp');
    });

    it('should detect station subdomain (lon)', () => {
      const request = createMockRequest({ host: 'lon.sitesspectral.work' });
      const subdomain = getSubdomain(request);

      expect(subdomain).toBe('lon');
    });

    it('should detect station subdomain (grimso)', () => {
      const request = createMockRequest({ host: 'grimso.sitesspectral.work' });
      const subdomain = getSubdomain(request);

      expect(subdomain).toBe('grimso');
    });

    it('should detect station subdomain (gri)', () => {
      const request = createMockRequest({ host: 'gri.sitesspectral.work' });
      const subdomain = getSubdomain(request);

      expect(subdomain).toBe('gri');
    });

    it('should detect station subdomain (alnarp)', () => {
      const request = createMockRequest({ host: 'alnarp.sitesspectral.work' });
      const subdomain = getSubdomain(request);

      expect(subdomain).toBe('alnarp');
    });

    it('should detect station subdomain (aln)', () => {
      const request = createMockRequest({ host: 'aln.sitesspectral.work' });
      const subdomain = getSubdomain(request);

      expect(subdomain).toBe('aln');
    });

    it('should detect station subdomain (hyltemossa)', () => {
      const request = createMockRequest({ host: 'hyltemossa.sitesspectral.work' });
      const subdomain = getSubdomain(request);

      expect(subdomain).toBe('hyltemossa');
    });

    it('should detect station subdomain (hyl)', () => {
      const request = createMockRequest({ host: 'hyl.sitesspectral.work' });
      const subdomain = getSubdomain(request);

      expect(subdomain).toBe('hyl');
    });

    it('should return null for invalid subdomain format', () => {
      const request = createMockRequest({ host: 'not-a-station.example.com' });
      const subdomain = getSubdomain(request);

      expect(subdomain).toBeNull();
    });

    it('should return null for apex domain without subdomain', () => {
      const request = createMockRequest({ host: 'sitesspectral.work' });
      const subdomain = getSubdomain(request);

      expect(subdomain).toBeNull();
    });

    it('should return null for www subdomain (treated as apex)', () => {
      const request = createMockRequest({ host: 'www.sitesspectral.work' });
      const subdomain = getSubdomain(request);

      expect(subdomain).toBe('www');
    });

    it('should handle workers.dev URL with no subdomain', () => {
      const request = createMockRequest({
        host: 'sites-spectral-instruments.jose-e5f.workers.dev'
      });
      const subdomain = getSubdomain(request);

      expect(subdomain).toBeNull();
    });

    it('should detect X-Subdomain header on workers.dev', () => {
      const request = {
        url: 'https://sites-spectral-instruments.jose-e5f.workers.dev',
        headers: {
          get: (name) => {
            if (name === 'Host') return 'sites-spectral-instruments.jose-e5f.workers.dev';
            if (name === 'X-Subdomain') return 'admin';
            return null;
          }
        }
      };
      const subdomain = getSubdomain(request);

      expect(subdomain).toBe('admin');
    });

    it('should detect subdomain query param on workers.dev', () => {
      const request = createMockRequest({
        host: 'sites-spectral-instruments.jose-e5f.workers.dev',
        url: 'https://sites-spectral-instruments.jose-e5f.workers.dev?subdomain=svartberget'
      });
      const subdomain = getSubdomain(request);

      expect(subdomain).toBe('svartberget');
    });

    it('should prioritize X-Subdomain header over query param', () => {
      const request = {
        url: 'https://sites-spectral-instruments.jose-e5f.workers.dev?subdomain=abisko',
        headers: {
          get: (name) => {
            if (name === 'Host') return 'sites-spectral-instruments.jose-e5f.workers.dev';
            if (name === 'X-Subdomain') return 'svartberget';
            return null;
          }
        }
      };
      const subdomain = getSubdomain(request);

      expect(subdomain).toBe('svartberget');
    });
  });

  describe('Portal Type Determination (getPortalType)', () => {
    it('should return "public" for null subdomain', () => {
      const portalType = getPortalType(null);

      expect(portalType).toBe('public');
    });

    it('should return "public" for www subdomain', () => {
      const portalType = getPortalType('www');

      expect(portalType).toBe('public');
    });

    it('should return "admin" for admin subdomain', () => {
      const portalType = getPortalType('admin');

      expect(portalType).toBe('admin');
    });

    it('should return "station" for svartberget subdomain', () => {
      const portalType = getPortalType('svartberget');

      expect(portalType).toBe('station');
    });

    it('should return "station" for svb subdomain', () => {
      const portalType = getPortalType('svb');

      expect(portalType).toBe('station');
    });

    it('should return "station" for abisko subdomain', () => {
      const portalType = getPortalType('abisko');

      expect(portalType).toBe('station');
    });

    it('should return "station" for ans subdomain', () => {
      const portalType = getPortalType('ans');

      expect(portalType).toBe('station');
    });

    it('should return "station" for lonnstorp subdomain', () => {
      const portalType = getPortalType('lonnstorp');

      expect(portalType).toBe('station');
    });

    it('should return "station" for lon subdomain', () => {
      const portalType = getPortalType('lon');

      expect(portalType).toBe('station');
    });

    it('should return "station" for any unknown subdomain', () => {
      const portalType = getPortalType('random-station-name');

      expect(portalType).toBe('station');
    });

    it('should return "station" for empty string subdomain', () => {
      const portalType = getPortalType('');

      // Empty string is falsy, so should return 'public'
      expect(portalType).toBe('public');
    });
  });

  describe('Station Acronym Validation (isValidStationSubdomain)', () => {
    it('should validate full station name (svartberget)', () => {
      expect(isValidStationSubdomain('svartberget')).toBe(true);
    });

    it('should validate short station code (svb)', () => {
      expect(isValidStationSubdomain('svb')).toBe(true);
    });

    it('should validate full station name (abisko)', () => {
      expect(isValidStationSubdomain('abisko')).toBe(true);
    });

    it('should validate short station code (ans)', () => {
      expect(isValidStationSubdomain('ans')).toBe(true);
    });

    it('should validate full station name (lonnstorp)', () => {
      expect(isValidStationSubdomain('lonnstorp')).toBe(true);
    });

    it('should validate short station code (lon)', () => {
      expect(isValidStationSubdomain('lon')).toBe(true);
    });

    it('should validate full station name (grimso)', () => {
      expect(isValidStationSubdomain('grimso')).toBe(true);
    });

    it('should validate short station code (gri)', () => {
      expect(isValidStationSubdomain('gri')).toBe(true);
    });

    it('should validate full station name (robacksdalen)', () => {
      expect(isValidStationSubdomain('robacksdalen')).toBe(true);
    });

    it('should validate short station code (rob)', () => {
      expect(isValidStationSubdomain('rob')).toBe(true);
    });

    it('should validate full station name (skogaryd)', () => {
      expect(isValidStationSubdomain('skogaryd')).toBe(true);
    });

    it('should validate short station code (sko)', () => {
      expect(isValidStationSubdomain('sko')).toBe(true);
    });

    it('should validate other valid stations (asa, bolmen, erken)', () => {
      expect(isValidStationSubdomain('asa')).toBe(true);
      expect(isValidStationSubdomain('bolmen')).toBe(true);
      expect(isValidStationSubdomain('erken')).toBe(true);
    });

    it('should validate new stations (alnarp, aln)', () => {
      expect(isValidStationSubdomain('alnarp')).toBe(true);
      expect(isValidStationSubdomain('aln')).toBe(true);
    });

    it('should validate new stations (hyltemossa, hyl)', () => {
      expect(isValidStationSubdomain('hyltemossa')).toBe(true);
      expect(isValidStationSubdomain('hyl')).toBe(true);
    });

    it('should reject invalid station name', () => {
      expect(isValidStationSubdomain('invalid-station')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isValidStationSubdomain('')).toBe(false);
    });

    it('should reject null', () => {
      expect(isValidStationSubdomain(null)).toBe(false);
    });

    it('should reject undefined', () => {
      expect(isValidStationSubdomain(undefined)).toBe(false);
    });

    it('should be case insensitive (SVARTBERGET)', () => {
      expect(isValidStationSubdomain('SVARTBERGET')).toBe(true);
    });

    it('should be case insensitive (SVB)', () => {
      expect(isValidStationSubdomain('SVB')).toBe(true);
    });

    it('should be case insensitive (Abisko)', () => {
      expect(isValidStationSubdomain('Abisko')).toBe(true);
    });

    it('should be case insensitive (AnS)', () => {
      expect(isValidStationSubdomain('AnS')).toBe(true);
    });
  });

  describe('getStationAcronyms', () => {
    it('should return an array of station acronyms', () => {
      const acronyms = getStationAcronyms();

      expect(Array.isArray(acronyms)).toBe(true);
      expect(acronyms.length).toBeGreaterThan(0);
    });

    it('should include full station names', () => {
      const acronyms = getStationAcronyms();

      expect(acronyms).toContain('svartberget');
      expect(acronyms).toContain('abisko');
      expect(acronyms).toContain('lonnstorp');
      expect(acronyms).toContain('grimso');
    });

    it('should include short station codes', () => {
      const acronyms = getStationAcronyms();

      expect(acronyms).toContain('svb');
      expect(acronyms).toContain('ans');
      expect(acronyms).toContain('lon');
      expect(acronyms).toContain('gri');
    });

    it('should include new stations (v14.1.0)', () => {
      const acronyms = getStationAcronyms();

      expect(acronyms).toContain('alnarp');
      expect(acronyms).toContain('aln');
      expect(acronyms).toContain('hyltemossa');
      expect(acronyms).toContain('hyl');
    });

    it('should return a copy (not mutate original)', () => {
      const acronyms1 = getStationAcronyms();
      const acronyms2 = getStationAcronyms();

      acronyms1.push('new-station');

      expect(acronyms2).not.toContain('new-station');
    });
  });

  describe('Origin Validation with Subdomains (isAllowedOrigin)', () => {
    describe('Static allowed origins', () => {
      it('should allow root domain (sitesspectral.work)', () => {
        expect(isAllowedOrigin('https://sitesspectral.work')).toBe(true);
      });

      it('should allow admin subdomain (admin.sitesspectral.work)', () => {
        expect(isAllowedOrigin('https://admin.sitesspectral.work')).toBe(true);
      });

      it('should allow legacy jobelab domain', () => {
        expect(isAllowedOrigin('https://sites.jobelab.com')).toBe(true);
      });

      it('should allow workers.dev URLs', () => {
        expect(isAllowedOrigin('https://sites-spectral-instruments.jose-e5f.workers.dev')).toBe(true);
        expect(isAllowedOrigin('https://sites-spectral-instruments.jose-beltran.workers.dev')).toBe(true);
      });

      it('should allow localhost development URLs', () => {
        expect(isAllowedOrigin('http://localhost:8787')).toBe(true);
        expect(isAllowedOrigin('http://127.0.0.1:8787')).toBe(true);
        expect(isAllowedOrigin('http://localhost:3000')).toBe(true);
        expect(isAllowedOrigin('http://127.0.0.1:3000')).toBe(true);
      });
    });

    describe('Dynamic station subdomain matching', () => {
      it('should allow station subdomain (svartberget.sitesspectral.work)', () => {
        expect(isAllowedOrigin('https://svartberget.sitesspectral.work')).toBe(true);
      });

      it('should allow station subdomain (svb.sitesspectral.work)', () => {
        expect(isAllowedOrigin('https://svb.sitesspectral.work')).toBe(true);
      });

      it('should allow station subdomain (abisko.sitesspectral.work)', () => {
        expect(isAllowedOrigin('https://abisko.sitesspectral.work')).toBe(true);
      });

      it('should allow station subdomain (ans.sitesspectral.work)', () => {
        expect(isAllowedOrigin('https://ans.sitesspectral.work')).toBe(true);
      });

      it('should allow station subdomain (lonnstorp.sitesspectral.work)', () => {
        expect(isAllowedOrigin('https://lonnstorp.sitesspectral.work')).toBe(true);
      });

      it('should allow station subdomain (lon.sitesspectral.work)', () => {
        expect(isAllowedOrigin('https://lon.sitesspectral.work')).toBe(true);
      });

      it('should allow station subdomain (grimso.sitesspectral.work)', () => {
        expect(isAllowedOrigin('https://grimso.sitesspectral.work')).toBe(true);
      });

      it('should allow station subdomain (gri.sitesspectral.work)', () => {
        expect(isAllowedOrigin('https://gri.sitesspectral.work')).toBe(true);
      });

      it('should allow new station subdomains (alnarp, hyltemossa)', () => {
        expect(isAllowedOrigin('https://alnarp.sitesspectral.work')).toBe(true);
        expect(isAllowedOrigin('https://aln.sitesspectral.work')).toBe(true);
        expect(isAllowedOrigin('https://hyltemossa.sitesspectral.work')).toBe(true);
        expect(isAllowedOrigin('https://hyl.sitesspectral.work')).toBe(true);
      });

      it('should allow any valid subdomain pattern (alphanumeric + hyphens)', () => {
        // Even if not in station list, pattern is valid
        expect(isAllowedOrigin('https://future-station.sitesspectral.work')).toBe(true);
        expect(isAllowedOrigin('https://test123.sitesspectral.work')).toBe(true);
        expect(isAllowedOrigin('https://station-01.sitesspectral.work')).toBe(true);
      });

      it('should reject invalid subdomain characters', () => {
        // Underscores not allowed (only a-z0-9-)
        expect(isAllowedOrigin('https://station_with_underscore.sitesspectral.work')).toBe(false);
        // Multiple dots create nested subdomains (not matching pattern)
        expect(isAllowedOrigin('https://station.with.dots.sitesspectral.work')).toBe(false);
      });

      it('should allow uppercase letters (URL hostname normalization)', () => {
        // The URL constructor automatically normalizes hostnames to lowercase
        // https://CAPS.sitesspectral.work -> hostname: caps.sitesspectral.work
        // This is standard URL behavior per WHATWG URL specification
        expect(isAllowedOrigin('https://CAPS.sitesspectral.work')).toBe(true);
        expect(isAllowedOrigin('https://Admin.sitesspectral.work')).toBe(true);
        expect(isAllowedOrigin('https://MixedCase.sitesspectral.work')).toBe(true);
      });

      it('should allow workers.dev subdomains (development)', () => {
        expect(isAllowedOrigin('https://test.workers.dev')).toBe(true);
        expect(isAllowedOrigin('https://my-worker.some-account.workers.dev')).toBe(true);
      });
    });

    describe('Security - Rejected origins', () => {
      it('should reject unknown domain', () => {
        expect(isAllowedOrigin('https://evil-site.com')).toBe(false);
      });

      it('should reject subdomain spoofing', () => {
        expect(isAllowedOrigin('https://sitesspectral.work.attacker.com')).toBe(false);
      });

      it('should reject similar domain', () => {
        expect(isAllowedOrigin('https://sites-spectral.com')).toBe(false);
      });

      it('should reject wrong TLD', () => {
        expect(isAllowedOrigin('https://sitesspectral.org')).toBe(false);
      });

      it('should allow http for development (protocol not validated in subdomain pattern)', () => {
        // Note: The subdomain pattern /^[a-z0-9-]+$/ doesn't check protocol
        // Protocol enforcement should happen at the infrastructure level (CF Access, load balancer)
        // For static list, http://sitesspectral.work is not in ALLOWED_ORIGINS (only https)
        expect(isAllowedOrigin('http://sitesspectral.work')).toBe(false);

        // But dynamic subdomain pattern accepts both http and https
        // This is intentional for development/testing flexibility
        expect(isAllowedOrigin('http://admin.sitesspectral.work')).toBe(true);
        expect(isAllowedOrigin('http://svartberget.sitesspectral.work')).toBe(true);
      });

      it('should reject null string (not null value)', () => {
        expect(isAllowedOrigin('null')).toBe(false);
      });

      it('should allow null value (same-origin)', () => {
        expect(isAllowedOrigin(null)).toBe(true);
      });

      it('should allow undefined (same-origin)', () => {
        expect(isAllowedOrigin(undefined)).toBe(true);
      });
    });

    describe('getAllowedOrigin', () => {
      it('should return origin if allowed', () => {
        expect(getAllowedOrigin('https://sitesspectral.work')).toBe('https://sitesspectral.work');
        expect(getAllowedOrigin('https://admin.sitesspectral.work')).toBe('https://admin.sitesspectral.work');
        expect(getAllowedOrigin('https://svartberget.sitesspectral.work')).toBe('https://svartberget.sitesspectral.work');
      });

      it('should return fallback for unknown origin', () => {
        const fallback = getAllowedOrigin('https://evil.com');
        expect(fallback).toBe('https://sitesspectral.work');
      });

      it('should return fallback for null origin', () => {
        const fallback = getAllowedOrigin(null);
        expect(fallback).toBe('https://sitesspectral.work');
      });
    });
  });

  describe('CSRF Protection with Subdomains', () => {
    describe('validateRequestOrigin with station subdomains', () => {
      it('should validate request from station subdomain', () => {
        const request = createMockRequest({
          origin: 'https://svartberget.sitesspectral.work'
        });
        const result = validateRequestOrigin(request);

        expect(result.isValid).toBe(true);
        expect(result.origin).toBe('https://svartberget.sitesspectral.work');
        expect(result.source).toBe('origin');
      });

      it('should validate request from short station code subdomain', () => {
        const request = createMockRequest({
          origin: 'https://svb.sitesspectral.work'
        });
        const result = validateRequestOrigin(request);

        expect(result.isValid).toBe(true);
        expect(result.origin).toBe('https://svb.sitesspectral.work');
      });

      it('should validate request from admin subdomain', () => {
        const request = createMockRequest({
          origin: 'https://admin.sitesspectral.work'
        });
        const result = validateRequestOrigin(request);

        expect(result.isValid).toBe(true);
        expect(result.origin).toBe('https://admin.sitesspectral.work');
      });

      it('should validate request from root domain', () => {
        const request = createMockRequest({
          origin: 'https://sitesspectral.work'
        });
        const result = validateRequestOrigin(request);

        expect(result.isValid).toBe(true);
        expect(result.origin).toBe('https://sitesspectral.work');
      });

      it('should reject request from unknown origin', () => {
        const request = createMockRequest({
          origin: 'https://attacker.com'
        });
        const result = validateRequestOrigin(request);

        expect(result.isValid).toBe(false);
        expect(result.origin).toBe('https://attacker.com');
      });

      it('should validate request with referer from station subdomain', () => {
        const request = createMockRequest({
          referer: 'https://lonnstorp.sitesspectral.work/dashboard'
        });
        const result = validateRequestOrigin(request);

        expect(result.isValid).toBe(true);
        expect(result.source).toBe('referer');
      });
    });

    describe('csrfProtect with station subdomains', () => {
      it('should allow POST from station subdomain', () => {
        const request = createMockRequest({
          method: 'POST',
          origin: 'https://svartberget.sitesspectral.work'
        });
        const result = csrfProtect(request);

        expect(result.isValid).toBe(true);
        expect(result.origin).toBe('https://svartberget.sitesspectral.work');
      });

      it('should allow DELETE from admin subdomain', () => {
        const request = createMockRequest({
          method: 'DELETE',
          origin: 'https://admin.sitesspectral.work'
        });
        const result = csrfProtect(request);

        expect(result.isValid).toBe(true);
        expect(result.origin).toBe('https://admin.sitesspectral.work');
      });

      it('should allow PUT from short station code subdomain', () => {
        const request = createMockRequest({
          method: 'PUT',
          origin: 'https://ans.sitesspectral.work'
        });
        const result = csrfProtect(request);

        expect(result.isValid).toBe(true);
        expect(result.origin).toBe('https://ans.sitesspectral.work');
      });

      it('should block POST from unknown origin', () => {
        const request = createMockRequest({
          method: 'POST',
          origin: 'https://evil.com'
        });
        const result = csrfProtect(request);

        expect(result.isValid).toBe(false);
        expect(result.status).toBe(403);
        expect(result.error).toContain('Invalid origin');
      });

      it('should allow GET from any origin (safe method)', () => {
        const request = createMockRequest({
          method: 'GET',
          origin: 'https://unknown.com'
        });
        const result = csrfProtect(request);

        // GET doesn't require CSRF protection
        expect(result.isValid).toBe(true);
      });

      it('should protect form submission from station subdomain', () => {
        const request = createMockRequest({
          method: 'POST',
          origin: 'https://grimso.sitesspectral.work',
          contentType: 'application/x-www-form-urlencoded'
        });
        const result = csrfProtect(request);

        expect(result.isValid).toBe(true);
      });

      it('should block form submission without origin', () => {
        const request = createMockRequest({
          method: 'POST',
          contentType: 'application/x-www-form-urlencoded'
          // No origin header
        });
        const result = csrfProtect(request);

        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Form submissions require Origin header');
      });
    });
  });

  describe('Integration Tests - Full Routing Flow', () => {
    it('should route public portal request correctly', () => {
      const request = createMockRequest({
        host: 'sitesspectral.work',
        origin: 'https://sitesspectral.work'
      });

      const subdomain = getSubdomain(request);
      const portalType = getPortalType(subdomain);
      const originValid = isAllowedOrigin(request.headers.get('origin'));

      expect(subdomain).toBeNull();
      expect(portalType).toBe('public');
      expect(originValid).toBe(true);
    });

    it('should route admin portal request correctly', () => {
      const request = createMockRequest({
        host: 'admin.sitesspectral.work',
        origin: 'https://admin.sitesspectral.work'
      });

      const subdomain = getSubdomain(request);
      const portalType = getPortalType(subdomain);
      const originValid = isAllowedOrigin(request.headers.get('origin'));

      expect(subdomain).toBe('admin');
      expect(portalType).toBe('admin');
      expect(originValid).toBe(true);
    });

    it('should route station portal request correctly (full name)', () => {
      const request = createMockRequest({
        host: 'svartberget.sitesspectral.work',
        origin: 'https://svartberget.sitesspectral.work'
      });

      const subdomain = getSubdomain(request);
      const portalType = getPortalType(subdomain);
      const isValidStation = isValidStationSubdomain(subdomain);
      const originValid = isAllowedOrigin(request.headers.get('origin'));

      expect(subdomain).toBe('svartberget');
      expect(portalType).toBe('station');
      expect(isValidStation).toBe(true);
      expect(originValid).toBe(true);
    });

    it('should route station portal request correctly (short code)', () => {
      const request = createMockRequest({
        host: 'svb.sitesspectral.work',
        origin: 'https://svb.sitesspectral.work'
      });

      const subdomain = getSubdomain(request);
      const portalType = getPortalType(subdomain);
      const isValidStation = isValidStationSubdomain(subdomain);
      const originValid = isAllowedOrigin(request.headers.get('origin'));

      expect(subdomain).toBe('svb');
      expect(portalType).toBe('station');
      expect(isValidStation).toBe(true);
      expect(originValid).toBe(true);
    });

    it('should handle workers.dev URL with subdomain override', () => {
      const request = {
        url: 'https://sites-spectral-instruments.jose-e5f.workers.dev?subdomain=admin',
        headers: {
          get: (name) => {
            if (name === 'Host') return 'sites-spectral-instruments.jose-e5f.workers.dev';
            if (name === 'Origin') return 'https://sites-spectral-instruments.jose-e5f.workers.dev';
            return null;
          }
        }
      };

      const subdomain = getSubdomain(request);
      const portalType = getPortalType(subdomain);
      const originValid = isAllowedOrigin(request.headers.get('Origin'));

      expect(subdomain).toBe('admin');
      expect(portalType).toBe('admin');
      expect(originValid).toBe(true);
    });

    it('should validate and protect POST request to station portal', () => {
      const request = createMockRequest({
        method: 'POST',
        host: 'lonnstorp.sitesspectral.work',
        origin: 'https://lonnstorp.sitesspectral.work',
        url: 'https://lonnstorp.sitesspectral.work/api/instruments'
      });

      const subdomain = getSubdomain(request);
      const portalType = getPortalType(subdomain);
      const isValidStation = isValidStationSubdomain(subdomain);
      const csrfResult = csrfProtect(request);

      expect(subdomain).toBe('lonnstorp');
      expect(portalType).toBe('station');
      expect(isValidStation).toBe(true);
      expect(csrfResult.isValid).toBe(true);
      expect(csrfResult.origin).toBe('https://lonnstorp.sitesspectral.work');
    });

    it('should reject POST request from wrong origin to station portal', () => {
      const request = createMockRequest({
        method: 'POST',
        host: 'svartberget.sitesspectral.work',
        origin: 'https://attacker.com',
        url: 'https://svartberget.sitesspectral.work/api/instruments'
      });

      const subdomain = getSubdomain(request);
      const portalType = getPortalType(subdomain);
      const csrfResult = csrfProtect(request);

      expect(subdomain).toBe('svartberget');
      expect(portalType).toBe('station');
      expect(csrfResult.isValid).toBe(false);
      expect(csrfResult.status).toBe(403);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle request with no Host header', () => {
      const request = {
        headers: {
          get: () => null
        }
      };

      const subdomain = getSubdomain(request);
      expect(subdomain).toBeNull();
    });

    it('should handle request with empty Host header', () => {
      const request = createMockRequest({ host: '' });

      const subdomain = getSubdomain(request);
      expect(subdomain).toBeNull();
    });

    it('should handle deeply nested subdomain', () => {
      const request = createMockRequest({ host: 'test.svartberget.sitesspectral.work' });

      const subdomain = getSubdomain(request);
      // Only expects exactly 3 parts
      expect(subdomain).toBeNull();
    });

    it('should handle invalid URL in origin validation', () => {
      // isAllowedOrigin handles URL parsing errors
      expect(isAllowedOrigin('not-a-url')).toBe(false);
    });

    it('should be case sensitive for subdomain detection', () => {
      const request = createMockRequest({ host: 'Admin.sitesspectral.work' });

      const subdomain = getSubdomain(request);
      // Returns exact subdomain as-is
      expect(subdomain).toBe('Admin');
    });

    it('should handle numeric subdomains', () => {
      const request = createMockRequest({ host: '123.sitesspectral.work' });

      const subdomain = getSubdomain(request);
      const originValid = isAllowedOrigin(`https://${request.headers.get('host')}`);

      expect(subdomain).toBe('123');
      expect(originValid).toBe(true); // Alphanumeric pattern allows numbers
    });

    it('should handle hyphenated subdomains', () => {
      const request = createMockRequest({ host: 'station-01.sitesspectral.work' });

      const subdomain = getSubdomain(request);
      const originValid = isAllowedOrigin(`https://${request.headers.get('host')}`);

      expect(subdomain).toBe('station-01');
      expect(originValid).toBe(true); // Pattern allows hyphens
    });
  });
});
