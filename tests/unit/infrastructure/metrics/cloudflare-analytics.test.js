/**
 * Cloudflare Analytics Adapter Tests
 * Tests for metrics collection, aggregation, and API request tracking
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CloudflareAnalyticsAdapter } from '../../../../src/infrastructure/metrics/CloudflareAnalyticsAdapter.js';

describe('CloudflareAnalyticsAdapter', () => {
  let adapter;

  beforeEach(() => {
    adapter = new CloudflareAnalyticsAdapter();
  });

  describe('Constructor', () => {
    it('should create adapter with default options', () => {
      expect(adapter.namespace).toBe('sites_spectral');
      expect(adapter.enabled).toBe(true);
    });

    it('should accept custom namespace', () => {
      const customAdapter = new CloudflareAnalyticsAdapter({ namespace: 'custom' });
      expect(customAdapter.namespace).toBe('custom');
    });

    it('should allow disabling metrics', () => {
      const disabledAdapter = new CloudflareAnalyticsAdapter({ enabled: false });
      expect(disabledAdapter.enabled).toBe(false);
    });
  });

  describe('Counter Metrics', () => {
    it('should increment counter with default value', () => {
      adapter.incrementCounter('test_counter');
      expect(adapter.getCounter('test_counter')).toBe(1);
    });

    it('should increment counter with custom value', () => {
      adapter.incrementCounter('test_counter', 5);
      expect(adapter.getCounter('test_counter')).toBe(5);
    });

    it('should accumulate counter values', () => {
      adapter.incrementCounter('test_counter', 3);
      adapter.incrementCounter('test_counter', 7);
      expect(adapter.getCounter('test_counter')).toBe(10);
    });

    it('should track counters with different labels separately', () => {
      adapter.incrementCounter('requests', 1, { method: 'GET' });
      adapter.incrementCounter('requests', 2, { method: 'POST' });
      adapter.incrementCounter('requests', 3, { method: 'GET' });

      expect(adapter.getCounter('requests', { method: 'GET' })).toBe(4);
      expect(adapter.getCounter('requests', { method: 'POST' })).toBe(2);
    });
  });

  describe('Gauge Metrics', () => {
    it('should set gauge value', () => {
      adapter.setGauge('active_users', 42);
      expect(adapter.getGauge('active_users')).toBe(42);
    });

    it('should overwrite gauge value', () => {
      adapter.setGauge('active_users', 42);
      adapter.setGauge('active_users', 100);
      expect(adapter.getGauge('active_users')).toBe(100);
    });

    it('should track gauges with different labels', () => {
      adapter.setGauge('queue_size', 10, { queue: 'main' });
      adapter.setGauge('queue_size', 5, { queue: 'retry' });

      expect(adapter.getGauge('queue_size', { queue: 'main' })).toBe(10);
      expect(adapter.getGauge('queue_size', { queue: 'retry' })).toBe(5);
    });
  });

  describe('Histogram Metrics', () => {
    it('should record histogram observation', () => {
      adapter.recordHistogram('response_time', 150);
      adapter.recordHistogram('response_time', 200);
      adapter.recordHistogram('response_time', 100);

      const metrics = adapter.getMetrics();
      const histogram = metrics.histograms['response_time'];

      expect(histogram.count).toBe(3);
      expect(histogram.min).toBe(100);
      expect(histogram.max).toBe(200);
      expect(histogram.avg).toBe(150);
      expect(histogram.sum).toBe(450);
    });

    it('should work with observeHistogram alias', () => {
      adapter.observeHistogram('latency', 50);
      adapter.observeHistogram('latency', 150);

      const metrics = adapter.getMetrics();
      expect(metrics.histograms['latency'].count).toBe(2);
    });
  });

  describe('Timer', () => {
    it('should measure duration with startTimer', async () => {
      const endTimer = adapter.startTimer('operation_duration');

      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 50));

      const duration = endTimer();

      expect(duration).toBeGreaterThanOrEqual(40);
      expect(duration).toBeLessThan(200);

      const metrics = adapter.getMetrics();
      expect(metrics.histograms['operation_duration'].count).toBe(1);
    });
  });

  describe('timeOperation', () => {
    it('should time successful async operation', async () => {
      const result = await adapter.timeOperation(
        'db_query',
        async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return 'success';
        }
      );

      expect(result).toBe('success');

      const metrics = adapter.getMetrics();
      expect(metrics.histograms['db_query.duration_ms{status=success}'].count).toBe(1);
    });

    it('should time failed async operation and rethrow', async () => {
      await expect(
        adapter.timeOperation(
          'failing_op',
          async () => {
            throw new Error('Operation failed');
          }
        )
      ).rejects.toThrow('Operation failed');

      const metrics = adapter.getMetrics();
      expect(metrics.histograms['failing_op.duration_ms{status=error}'].count).toBe(1);
    });
  });

  describe('Request Recording', () => {
    it('should record API request metrics', () => {
      adapter.recordRequest(
        { method: 'GET', url: 'https://api.example.com/users/123' },
        { status: 200 },
        150
      );

      const metrics = adapter.getMetrics();

      // Check request count
      const countKey = 'http_requests_total{method=GET,path=/users/:id,station=unknown,status=200}';
      expect(metrics.counters[countKey]).toBe(1);

      // Check duration recorded
      const durationKey = 'http_request_duration_ms{method=GET,path=/users/:id,station=unknown,status=200}';
      expect(metrics.histograms[durationKey].count).toBe(1);
    });

    it('should track error requests separately', () => {
      adapter.recordRequest(
        { method: 'POST', url: 'https://api.example.com/data' },
        { status: 500 },
        50
      );

      const metrics = adapter.getMetrics();

      // Check error counter
      const errorKey = 'http_errors_total{method=POST,path=/data,station=unknown,status=500}';
      expect(metrics.counters[errorKey]).toBe(1);
    });

    it('should normalize paths with IDs', () => {
      adapter.recordRequest(
        { method: 'GET', url: 'https://api.example.com/stations/123/platforms/456' },
        { status: 200 },
        100
      );

      const metrics = adapter.getMetrics();
      const keys = Object.keys(metrics.counters);

      // Should normalize numeric IDs
      const normalizedKey = keys.find(k => k.includes('/stations/:id/platforms/:id'));
      expect(normalizedKey).toBeDefined();
    });

    it('should include station label when provided', () => {
      adapter.recordRequest(
        { method: 'GET', url: 'https://api.example.com/data', station: 'SVB' },
        { status: 200 },
        75
      );

      const metrics = adapter.getMetrics();
      const keys = Object.keys(metrics.counters);

      const svbKey = keys.find(k => k.includes('station=SVB'));
      expect(svbKey).toBeDefined();
    });
  });

  describe('Domain Metrics', () => {
    it('should record domain-specific actions', () => {
      adapter.recordDomainAction('pilot', 'created', { station: 'SVB' });
      adapter.recordDomainAction('mission', 'approved', { station: 'ANS' });

      const metrics = adapter.getMetrics();

      expect(metrics.counters['pilot_created_total{station=SVB}']).toBe(1);
      expect(metrics.counters['mission_approved_total{station=ANS}']).toBe(1);
    });
  });

  describe('Analytics Engine Integration', () => {
    it('should write data point when Analytics Engine available', () => {
      const mockWriteDataPoint = vi.fn();
      const analyticsAdapter = new CloudflareAnalyticsAdapter({
        analyticsEngine: { writeDataPoint: mockWriteDataPoint }
      });

      analyticsAdapter.incrementCounter('test', 1);

      expect(mockWriteDataPoint).toHaveBeenCalled();
      const call = mockWriteDataPoint.mock.calls[0][0];
      expect(call.blobs[0]).toBe('sites_spectral');
      expect(call.blobs[1]).toBe('counter.test');
    });

    it('should buffer data when Analytics Engine not available', () => {
      adapter.incrementCounter('buffered_metric', 5);

      const metrics = adapter.getMetrics();
      expect(metrics.buffer.length).toBe(1);
      expect(metrics.buffer[0].metric).toBe('counter.buffered_metric');
    });

    it('should not write when disabled', () => {
      const mockWriteDataPoint = vi.fn();
      const disabledAdapter = new CloudflareAnalyticsAdapter({
        analyticsEngine: { writeDataPoint: mockWriteDataPoint },
        enabled: false
      });

      disabledAdapter.incrementCounter('test', 1);

      expect(mockWriteDataPoint).not.toHaveBeenCalled();
    });

    it('should handle Analytics Engine errors gracefully', () => {
      const mockWriteDataPoint = vi.fn().mockImplementation(() => {
        throw new Error('Analytics Engine error');
      });
      const analyticsAdapter = new CloudflareAnalyticsAdapter({
        analyticsEngine: { writeDataPoint: mockWriteDataPoint }
      });

      // Should not throw
      expect(() => analyticsAdapter.incrementCounter('test', 1)).not.toThrow();
    });
  });

  describe('Reset and Flush', () => {
    it('should reset all metrics', () => {
      adapter.incrementCounter('test', 5);
      adapter.setGauge('active', 10);
      adapter.recordHistogram('time', 100);

      adapter.reset();

      const metrics = adapter.getMetrics();
      expect(Object.keys(metrics.counters)).toHaveLength(0);
      expect(Object.keys(metrics.gauges)).toHaveLength(0);
      expect(Object.keys(metrics.histograms)).toHaveLength(0);
      expect(metrics.buffer).toHaveLength(0);
    });

    it('should flush buffer and return data', () => {
      adapter.incrementCounter('metric1', 1);
      adapter.incrementCounter('metric2', 2);

      const flushed = adapter.flush();

      expect(flushed).toHaveLength(2);
      expect(adapter.getMetrics().buffer).toHaveLength(0);
    });
  });

  describe('getMetrics', () => {
    it('should return all collected metrics', () => {
      adapter.incrementCounter('requests', 100);
      adapter.setGauge('connections', 50);
      adapter.recordHistogram('latency', 25);

      const metrics = adapter.getMetrics();

      expect(metrics).toHaveProperty('counters');
      expect(metrics).toHaveProperty('gauges');
      expect(metrics).toHaveProperty('histograms');
      expect(metrics).toHaveProperty('buffer');
    });

    it('should calculate histogram statistics', () => {
      adapter.recordHistogram('values', 10);
      adapter.recordHistogram('values', 20);
      adapter.recordHistogram('values', 30);
      adapter.recordHistogram('values', 40);

      const metrics = adapter.getMetrics();
      const histogram = metrics.histograms['values'];

      expect(histogram.count).toBe(4);
      expect(histogram.sum).toBe(100);
      expect(histogram.min).toBe(10);
      expect(histogram.max).toBe(40);
      expect(histogram.avg).toBe(25);
    });
  });
});
