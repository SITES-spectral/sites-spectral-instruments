/**
 * UAV Pilot Entity Tests
 * Tests for pilot validation, certification, insurance, and authorization logic
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Pilot, CERTIFICATE_TYPES, PILOT_STATUSES } from '../../../../src/domain/uav/Pilot.js';

describe('Pilot Entity', () => {
  // Valid pilot data for testing
  const validPilotData = {
    full_name: 'Johan Andersson',
    email: 'johan.andersson@example.com',
    phone: '+46701234567',
    organization: 'SITES Spectral',
    pilot_certificate_number: 'SE-123456',
    certificate_type: 'A2',
    certificate_issued_date: '2025-01-01',
    certificate_expiry_date: '2027-01-01',
    insurance_provider: 'Nordic Insurance',
    insurance_policy_number: 'POL-789012',
    insurance_expiry_date: '2027-06-01',
    flight_hours_total: 150,
    flight_hours_sites_spectral: 50,
    authorized_stations: [1, 7, 8],
    status: 'active'
  };

  describe('Constructor & Validation', () => {
    it('should create pilot with valid data', () => {
      const pilot = new Pilot(validPilotData);

      expect(pilot.full_name).toBe('Johan Andersson');
      expect(pilot.email).toBe('johan.andersson@example.com');
      expect(pilot.certificate_type).toBe('A2');
      expect(pilot.status).toBe('active');
    });

    it('should throw error for missing full_name', () => {
      expect(() => new Pilot({ ...validPilotData, full_name: '' }))
        .toThrow('Pilot full name is required');
    });

    it('should throw error for missing email', () => {
      expect(() => new Pilot({ ...validPilotData, email: '' }))
        .toThrow('Valid email is required');
    });

    it('should throw error for invalid email format', () => {
      expect(() => new Pilot({ ...validPilotData, email: 'invalid-email' }))
        .toThrow('Valid email is required');
    });

    it('should throw error for invalid certificate type', () => {
      expect(() => new Pilot({ ...validPilotData, certificate_type: 'INVALID' }))
        .toThrow('Invalid certificate type');
    });

    it('should throw error for invalid status', () => {
      expect(() => new Pilot({ ...validPilotData, status: 'INVALID' }))
        .toThrow('Invalid status');
    });

    it('should default status to pending_verification', () => {
      const pilot = new Pilot({
        full_name: 'Test Pilot',
        email: 'test@example.com'
      });
      expect(pilot.status).toBe('pending_verification');
    });

    it('should default flight hours to 0', () => {
      const pilot = new Pilot({
        full_name: 'Test Pilot',
        email: 'test@example.com'
      });
      expect(pilot.flight_hours_total).toBe(0);
      expect(pilot.flight_hours_sites_spectral).toBe(0);
    });

    it('should parse authorized_stations from JSON string', () => {
      const pilot = new Pilot({
        ...validPilotData,
        authorized_stations: '[1, 7, 8]'
      });
      expect(pilot.authorized_stations).toEqual([1, 7, 8]);
    });

    it('should handle empty authorized_stations', () => {
      const pilot = new Pilot({
        ...validPilotData,
        authorized_stations: null
      });
      expect(pilot.authorized_stations).toEqual([]);
    });
  });

  describe('Certificate Validation', () => {
    it('should return true for hasCertificate when certificate exists', () => {
      const pilot = new Pilot(validPilotData);
      expect(pilot.hasCertificate()).toBe(true);
    });

    it('should return false for hasCertificate when missing certificate number', () => {
      const pilot = new Pilot({
        ...validPilotData,
        pilot_certificate_number: null
      });
      expect(pilot.hasCertificate()).toBe(false);
    });

    it('should return false for hasCertificate when missing certificate type', () => {
      const pilot = new Pilot({
        ...validPilotData,
        certificate_type: null
      });
      expect(pilot.hasCertificate()).toBe(false);
    });

    it('should return false for isCertificateExpired when not expired', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const pilot = new Pilot({
        ...validPilotData,
        certificate_expiry_date: futureDate.toISOString().split('T')[0]
      });
      expect(pilot.isCertificateExpired()).toBe(false);
    });

    it('should return true for isCertificateExpired when expired', () => {
      const pilot = new Pilot({
        ...validPilotData,
        certificate_expiry_date: '2020-01-01'
      });
      expect(pilot.isCertificateExpired()).toBe(true);
    });

    it('should return false for isCertificateExpired when no expiry set', () => {
      const pilot = new Pilot({
        ...validPilotData,
        certificate_expiry_date: null
      });
      expect(pilot.isCertificateExpired()).toBe(false);
    });
  });

  describe('Insurance Validation', () => {
    it('should return true for hasValidInsurance when insurance is valid', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const pilot = new Pilot({
        ...validPilotData,
        insurance_expiry_date: futureDate.toISOString().split('T')[0]
      });
      expect(pilot.hasValidInsurance()).toBe(true);
    });

    it('should return false for hasValidInsurance when insurance is expired', () => {
      const pilot = new Pilot({
        ...validPilotData,
        insurance_expiry_date: '2020-01-01'
      });
      expect(pilot.hasValidInsurance()).toBe(false);
    });

    it('should return false for hasValidInsurance when no policy number', () => {
      const pilot = new Pilot({
        ...validPilotData,
        insurance_policy_number: null
      });
      expect(pilot.hasValidInsurance()).toBe(false);
    });
  });

  describe('Station Authorization', () => {
    it('should return true for isAuthorizedForStation when authorized', () => {
      const pilot = new Pilot(validPilotData);
      expect(pilot.isAuthorizedForStation(1)).toBe(true);
      expect(pilot.isAuthorizedForStation(7)).toBe(true);
    });

    it('should return false for isAuthorizedForStation when not authorized', () => {
      const pilot = new Pilot(validPilotData);
      expect(pilot.isAuthorizedForStation(999)).toBe(false);
    });
  });

  describe('canFly Check', () => {
    it('should return true when all conditions are met', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      const pilot = new Pilot({
        ...validPilotData,
        status: 'active',
        certificate_expiry_date: futureDateStr,
        insurance_expiry_date: futureDateStr
      });
      expect(pilot.canFly()).toBe(true);
    });

    it('should return false when status is not active', () => {
      const pilot = new Pilot({
        ...validPilotData,
        status: 'inactive'
      });
      expect(pilot.canFly()).toBe(false);
    });

    it('should return false when certificate is expired', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const pilot = new Pilot({
        ...validPilotData,
        certificate_expiry_date: '2020-01-01',
        insurance_expiry_date: futureDate.toISOString().split('T')[0]
      });
      expect(pilot.canFly()).toBe(false);
    });

    it('should return false when insurance is invalid', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const pilot = new Pilot({
        ...validPilotData,
        certificate_expiry_date: futureDate.toISOString().split('T')[0],
        insurance_expiry_date: '2020-01-01'
      });
      expect(pilot.canFly()).toBe(false);
    });
  });

  describe('Expiry Calculations', () => {
    it('should calculate days until certificate expiry', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const pilot = new Pilot({
        ...validPilotData,
        certificate_expiry_date: futureDate.toISOString().split('T')[0]
      });

      const days = pilot.getDaysUntilCertificateExpiry();
      expect(days).toBeGreaterThanOrEqual(29);
      expect(days).toBeLessThanOrEqual(31);
    });

    it('should return null for getDaysUntilCertificateExpiry when no expiry', () => {
      const pilot = new Pilot({
        ...validPilotData,
        certificate_expiry_date: null
      });
      expect(pilot.getDaysUntilCertificateExpiry()).toBeNull();
    });

    it('should return negative days when certificate already expired', () => {
      const pilot = new Pilot({
        ...validPilotData,
        certificate_expiry_date: '2020-01-01'
      });
      expect(pilot.getDaysUntilCertificateExpiry()).toBeLessThan(0);
    });
  });

  describe('Flight Hours', () => {
    it('should add flight hours correctly', () => {
      const pilot = new Pilot(validPilotData);
      const initialTotal = pilot.flight_hours_total;
      const initialSites = pilot.flight_hours_sites_spectral;

      pilot.addFlightHours(2.5);

      expect(pilot.flight_hours_total).toBe(initialTotal + 2.5);
      expect(pilot.flight_hours_sites_spectral).toBe(initialSites + 2.5);
      expect(pilot.last_flight_date).toBe(new Date().toISOString().split('T')[0]);
    });
  });

  describe('Serialization', () => {
    it('should convert to database record format', () => {
      const pilot = new Pilot(validPilotData);
      const record = pilot.toRecord();

      expect(record.full_name).toBe('Johan Andersson');
      expect(record.authorized_stations).toBe('[1,7,8]'); // JSON string
      expect(record.id).toBeUndefined();
    });

    it('should convert to JSON with computed fields', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      const pilot = new Pilot({
        ...validPilotData,
        certificate_expiry_date: futureDateStr,
        insurance_expiry_date: futureDateStr
      });
      const json = pilot.toJSON();

      expect(json.can_fly).toBe(true);
      expect(json.certificate_valid).toBe(true);
      expect(json.insurance_valid).toBe(true);
      expect(json.authorized_stations).toEqual([1, 7, 8]); // Array, not string
      expect(typeof json.days_until_certificate_expiry).toBe('number');
    });

    it('should create from database record', () => {
      const record = {
        id: 1,
        full_name: 'Test Pilot',
        email: 'test@example.com',
        authorized_stations: '[1, 2]',
        status: 'active'
      };

      const pilot = Pilot.fromRecord(record);

      expect(pilot.id).toBe(1);
      expect(pilot.full_name).toBe('Test Pilot');
      expect(pilot.authorized_stations).toEqual([1, 2]);
    });
  });

  describe('Constants', () => {
    it('should export valid certificate types', () => {
      expect(CERTIFICATE_TYPES).toContain('A1/A3');
      expect(CERTIFICATE_TYPES).toContain('A2');
      expect(CERTIFICATE_TYPES).toContain('STS-01');
      expect(CERTIFICATE_TYPES).toContain('STS-02');
      expect(CERTIFICATE_TYPES).toContain('national');
    });

    it('should export valid pilot statuses', () => {
      expect(PILOT_STATUSES).toContain('active');
      expect(PILOT_STATUSES).toContain('inactive');
      expect(PILOT_STATUSES).toContain('suspended');
      expect(PILOT_STATUSES).toContain('pending_verification');
    });
  });
});
