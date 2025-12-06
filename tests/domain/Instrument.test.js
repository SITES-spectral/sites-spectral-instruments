/**
 * Tests for Instrument Entity
 *
 * Tests the domain entity for measurement instruments.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  Instrument,
  INSTRUMENT_STATUSES,
  MEASUREMENT_STATUSES
} from '../../src/domain/instrument/Instrument.js';

describe('Instrument Entity', () => {
  const validInstrumentProps = {
    id: 1,
    normalizedName: 'SVB_FOR_PL01_PHE01',
    displayName: 'Svartberget Forest Phenocam 1',
    platformId: 1,
    instrumentType: 'Phenocam',
    status: 'Active',
    measurementStatus: 'Operational',
    specifications: {
      camera_brand: 'StarDot',
      camera_model: 'NetCam SC',
      resolution: '5MP'
    }
  };

  describe('constants', () => {
    it('should have all instrument statuses', () => {
      expect(INSTRUMENT_STATUSES).toContain('Active');
      expect(INSTRUMENT_STATUSES).toContain('Inactive');
      expect(INSTRUMENT_STATUSES).toContain('Maintenance');
      expect(INSTRUMENT_STATUSES).toContain('Decommissioned');
    });

    it('should have all measurement statuses', () => {
      expect(MEASUREMENT_STATUSES).toContain('Operational');
      expect(MEASUREMENT_STATUSES).toContain('Degraded');
      expect(MEASUREMENT_STATUSES).toContain('Failed');
      expect(MEASUREMENT_STATUSES).toContain('Unknown');
    });
  });

  describe('constructor', () => {
    it('should create an instrument with valid props', () => {
      const instrument = new Instrument(validInstrumentProps);

      expect(instrument.id).toBe(1);
      expect(instrument.normalizedName).toBe('SVB_FOR_PL01_PHE01');
      expect(instrument.instrumentType).toBe('Phenocam');
      expect(instrument.specifications.camera_brand).toBe('StarDot');
    });

    it('should set default values', () => {
      const instrument = new Instrument({
        normalizedName: 'TEST_PHE01',
        displayName: 'Test Phenocam',
        platformId: 1,
        instrumentType: 'Phenocam'
      });

      expect(instrument.status).toBe('Active');
      expect(instrument.measurementStatus).toBe('Operational');
      expect(instrument.specifications).toEqual({});
      expect(instrument.rois).toEqual([]);
    });
  });

  describe('validation', () => {
    it('should validate on demand', () => {
      const instrument = new Instrument(validInstrumentProps);
      expect(() => instrument.validate()).not.toThrow();
    });

    it('should reject missing normalized name', () => {
      const instrument = new Instrument({
        ...validInstrumentProps,
        normalizedName: ''
      });
      expect(() => instrument.validate()).toThrow('Normalized name is required');
    });

    it('should reject missing display name', () => {
      const instrument = new Instrument({
        ...validInstrumentProps,
        displayName: ''
      });
      expect(() => instrument.validate()).toThrow('Display name is required');
    });

    it('should reject missing platform ID', () => {
      const instrument = new Instrument({
        ...validInstrumentProps,
        platformId: null
      });
      expect(() => instrument.validate()).toThrow('Platform ID is required');
    });

    it('should reject missing instrument type', () => {
      const instrument = new Instrument({
        ...validInstrumentProps,
        instrumentType: ''
      });
      expect(() => instrument.validate()).toThrow('Instrument type is required');
    });

    it('should reject invalid status', () => {
      const instrument = new Instrument({
        ...validInstrumentProps,
        status: 'Invalid'
      });
      expect(() => instrument.validate()).toThrow('Invalid status');
    });

    it('should reject invalid measurement status', () => {
      const instrument = new Instrument({
        ...validInstrumentProps,
        measurementStatus: 'Invalid'
      });
      expect(() => instrument.validate()).toThrow('Invalid measurement status');
    });
  });

  describe('isActive', () => {
    it('should return true for Active status', () => {
      const instrument = new Instrument(validInstrumentProps);
      expect(instrument.isActive()).toBe(true);
    });

    it('should return false for Inactive status', () => {
      const instrument = new Instrument({
        ...validInstrumentProps,
        status: 'Inactive'
      });
      expect(instrument.isActive()).toBe(false);
    });
  });

  describe('isOperational', () => {
    it('should return true for Operational status', () => {
      const instrument = new Instrument(validInstrumentProps);
      expect(instrument.isOperational()).toBe(true);
    });

    it('should return false for Failed status', () => {
      const instrument = new Instrument({
        ...validInstrumentProps,
        measurementStatus: 'Failed'
      });
      expect(instrument.isOperational()).toBe(false);
    });
  });

  describe('needsCalibration', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-06-15'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return true if no calibration date', () => {
      const instrument = new Instrument(validInstrumentProps);
      expect(instrument.needsCalibration()).toBe(true);
    });

    it('should return true if calibration older than 1 year', () => {
      const instrument = new Instrument({
        ...validInstrumentProps,
        calibrationDate: '2023-01-01'
      });
      expect(instrument.needsCalibration()).toBe(true);
    });

    it('should return false if calibration within 1 year', () => {
      const instrument = new Instrument({
        ...validInstrumentProps,
        calibrationDate: '2024-01-01'
      });
      expect(instrument.needsCalibration()).toBe(false);
    });
  });

  describe('specifications', () => {
    it('should get specification value', () => {
      const instrument = new Instrument(validInstrumentProps);
      expect(instrument.getSpecification('camera_brand')).toBe('StarDot');
    });

    it('should return default for missing specification', () => {
      const instrument = new Instrument(validInstrumentProps);
      expect(instrument.getSpecification('missing', 'default')).toBe('default');
    });

    it('should set specification value', () => {
      const instrument = new Instrument(validInstrumentProps);
      instrument.setSpecification('new_field', 'new_value');
      expect(instrument.getSpecification('new_field')).toBe('new_value');
    });
  });

  describe('ROIs', () => {
    it('should start with empty ROIs array', () => {
      const instrument = new Instrument(validInstrumentProps);
      expect(instrument.getROICount()).toBe(0);
    });

    it('should add ROIs', () => {
      const instrument = new Instrument(validInstrumentProps);
      instrument.addROI({ id: 1, name: 'ROI_01' });
      instrument.addROI({ id: 2, name: 'ROI_02' });

      expect(instrument.getROICount()).toBe(2);
    });
  });

  describe('getTypeCode', () => {
    it('should extract type code from normalized name', () => {
      const instrument = new Instrument(validInstrumentProps);
      expect(instrument.getTypeCode()).toBe('PHE');
    });

    it('should extract MS type code', () => {
      const instrument = new Instrument({
        ...validInstrumentProps,
        normalizedName: 'SVB_FOR_PL01_MS01'
      });
      expect(instrument.getTypeCode()).toBe('MS');
    });

    it('should extract NDVI type code', () => {
      const instrument = new Instrument({
        ...validInstrumentProps,
        normalizedName: 'SVB_FOR_PL01_NDVI01'
      });
      expect(instrument.getTypeCode()).toBe('NDVI');
    });

    it('should return null for invalid name format', () => {
      const instrument = new Instrument({
        ...validInstrumentProps,
        normalizedName: 'INVALID'
      });
      expect(instrument.getTypeCode()).toBeNull();
    });
  });

  describe('toJSON', () => {
    it('should convert to plain object with snake_case keys', () => {
      const instrument = new Instrument(validInstrumentProps);
      const json = instrument.toJSON();

      expect(json.id).toBe(1);
      expect(json.normalized_name).toBe('SVB_FOR_PL01_PHE01');
      expect(json.instrument_type).toBe('Phenocam');
      expect(json.measurement_status).toBe('Operational');
      expect(json.specifications).toEqual(validInstrumentProps.specifications);
      expect(json.roi_count).toBe(0);
    });
  });

  describe('fromDatabase', () => {
    it('should create instrument from database row', () => {
      const row = {
        id: 1,
        normalized_name: 'SVB_FOR_PL01_PHE01',
        display_name: 'Test Phenocam',
        platform_id: 1,
        instrument_type: 'Phenocam',
        status: 'Active',
        measurement_status: 'Operational',
        specifications: { camera_brand: 'StarDot' }
      };

      const instrument = Instrument.fromDatabase(row);

      expect(instrument.id).toBe(1);
      expect(instrument.normalizedName).toBe('SVB_FOR_PL01_PHE01');
      expect(instrument.specifications.camera_brand).toBe('StarDot');
    });

    it('should parse JSON specifications string', () => {
      const row = {
        id: 1,
        normalized_name: 'SVB_FOR_PL01_PHE01',
        display_name: 'Test',
        platform_id: 1,
        instrument_type: 'Phenocam',
        specifications: '{"camera_brand":"StarDot"}'
      };

      const instrument = Instrument.fromDatabase(row);
      expect(instrument.specifications.camera_brand).toBe('StarDot');
    });

    it('should handle invalid JSON specifications', () => {
      const row = {
        id: 1,
        normalized_name: 'SVB_FOR_PL01_PHE01',
        display_name: 'Test',
        platform_id: 1,
        instrument_type: 'Phenocam',
        specifications: 'invalid json'
      };

      const instrument = Instrument.fromDatabase(row);
      expect(instrument.specifications).toEqual({});
    });
  });
});
