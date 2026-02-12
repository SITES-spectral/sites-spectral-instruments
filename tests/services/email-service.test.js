/**
 * Email Service Tests
 *
 * Tests for email sending functionality including magic link emails.
 *
 * @module tests/services/email-service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendEmail, sendMagicLinkEmail } from '../../src/services/email-service.js';

describe('Email Service', () => {
  let mockFetch;
  let originalFetch;

  beforeEach(() => {
    // Save original fetch
    originalFetch = global.fetch;

    // Create mock fetch
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('sendEmail', () => {
    const mockEnv = {};

    it('should send email successfully via MailChannels', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 202,
        text: () => Promise.resolve('Accepted')
      });

      const result = await sendEmail({
        to: 'test@example.com',
        toName: 'Test User',
        subject: 'Test Subject',
        html: '<p>Test content</p>'
      }, mockEnv);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();

      // Verify fetch was called with correct parameters
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.mailchannels.net/tx/v1/send',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      );
    });

    it('should return error for missing required fields', async () => {
      const result = await sendEmail({
        to: 'test@example.com'
        // Missing subject and html
      }, mockEnv);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required fields');
    });

    it('should return error for invalid email format', async () => {
      const result = await sendEmail({
        to: 'invalid-email',
        subject: 'Test',
        html: '<p>Test</p>'
      }, mockEnv);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid email address');
    });

    it('should handle MailChannels errors', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 400,
        text: () => Promise.resolve('Bad Request: Invalid email')
      });

      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>'
      }, mockEnv);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Email delivery failed');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>'
      }, mockEnv);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Email sending failed');
    });

    it('should skip sending when DISABLE_EMAIL is true', async () => {
      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>'
      }, { DISABLE_EMAIL: 'true' });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('disabled');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should use custom from email from env', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 202,
        text: () => Promise.resolve('Accepted')
      });

      await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>'
      }, {
        EMAIL_FROM: 'custom@example.com',
        EMAIL_FROM_NAME: 'Custom Sender'
      });

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.from.email).toBe('custom@example.com');
      expect(body.from.name).toBe('Custom Sender');
    });

    it('should auto-generate plain text from HTML', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 202,
        text: () => Promise.resolve('Accepted')
      });

      await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<h1>Header</h1><p>Paragraph with <a href="https://example.com">link</a></p>'
      }, mockEnv);

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      // Should have both text/plain and text/html content
      expect(body.content).toHaveLength(2);
      expect(body.content[0].type).toBe('text/plain');
      expect(body.content[1].type).toBe('text/html');

      // Plain text should contain converted content
      expect(body.content[0].value).toContain('Header');
      expect(body.content[0].value).toContain('link (https://example.com)');
    });
  });

  describe('sendMagicLinkEmail', () => {
    const mockEnv = {};

    beforeEach(() => {
      mockFetch.mockResolvedValue({
        status: 202,
        text: () => Promise.resolve('Accepted')
      });
    });

    it('should send magic link email with all details', async () => {
      const result = await sendMagicLinkEmail({
        recipientEmail: 'user@station.se',
        recipientName: 'Station User',
        magicLinkUrl: 'https://svartberget.sitesspectral.work/auth/magic?token=abc123',
        stationName: 'Svartberget Research Station',
        stationAcronym: 'SVB',
        expiresAt: '2026-02-18T12:00:00Z',
        label: 'Read-only access for field work',
        createdBy: 'admin'
      }, mockEnv);

      expect(result.success).toBe(true);

      // Verify email content
      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.personalizations[0].to[0].email).toBe('user@station.se');
      expect(body.personalizations[0].to[0].name).toBe('Station User');
      expect(body.subject).toContain('Svartberget Research Station');

      // HTML content should contain the magic link
      const htmlContent = body.content.find(c => c.type === 'text/html');
      expect(htmlContent.value).toContain('https://svartberget.sitesspectral.work/auth/magic?token=abc123');
      expect(htmlContent.value).toContain('Read-only access for field work');
      expect(htmlContent.value).toContain('admin');
    });

    it('should handle missing optional fields', async () => {
      const result = await sendMagicLinkEmail({
        recipientEmail: 'user@example.com',
        magicLinkUrl: 'https://station.sitesspectral.work/auth/magic?token=xyz',
        stationName: 'Test Station',
        stationAcronym: 'TST',
        expiresAt: '2026-02-18T12:00:00Z',
        createdBy: 'admin'
        // No recipientName or label
      }, mockEnv);

      expect(result.success).toBe(true);
    });

    it('should format expiration date correctly', async () => {
      await sendMagicLinkEmail({
        recipientEmail: 'user@example.com',
        magicLinkUrl: 'https://station.sitesspectral.work/auth/magic?token=xyz',
        stationName: 'Test Station',
        stationAcronym: 'TST',
        expiresAt: '2026-02-18T14:30:00Z',
        createdBy: 'admin'
      }, mockEnv);

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      const htmlContent = body.content.find(c => c.type === 'text/html');

      // Should contain formatted date (in CET timezone)
      expect(htmlContent.value).toContain('2026');
      expect(htmlContent.value).toContain('February');
    });
  });

  describe('Email Validation', () => {
    it('should reject emails with multiple @ symbols', async () => {
      const result = await sendEmail({
        to: 'test@@example.com',
        subject: 'Test',
        html: '<p>Test</p>'
      }, {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid email address');
    });

    it('should reject emails without domain', async () => {
      const result = await sendEmail({
        to: 'test@',
        subject: 'Test',
        html: '<p>Test</p>'
      }, {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid email address');
    });

    it('should reject emails without local part', async () => {
      const result = await sendEmail({
        to: '@example.com',
        subject: 'Test',
        html: '<p>Test</p>'
      }, {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid email address');
    });

    it('should accept valid email formats', async () => {
      const mockEnv = { DISABLE_EMAIL: 'true' }; // Skip actual send

      const validEmails = [
        'simple@example.com',
        'user.name@example.com',
        'user+tag@example.com',
        'user@subdomain.example.com'
      ];

      for (const email of validEmails) {
        const result = await sendEmail({
          to: email,
          subject: 'Test',
          html: '<p>Test</p>'
        }, mockEnv);

        expect(result.success).toBe(true);
      }
    });
  });
});
