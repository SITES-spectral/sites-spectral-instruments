/**
 * Email Service for SITES Spectral
 *
 * Sends transactional emails using MailChannels API (free for Cloudflare Workers).
 * Used for magic link delivery, notifications, and alerts.
 *
 * @module services/email-service
 * @version 15.6.5
 * @see https://blog.cloudflare.com/sending-email-from-workers-with-mailchannels/
 */

/**
 * Email configuration defaults
 */
const EMAIL_CONFIG = {
  fromName: 'SITES Spectral',
  fromEmail: 'noreply@sitesspectral.work',
  replyTo: 'support@sitesspectral.work'
};

/**
 * Send an email using MailChannels API
 *
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.toName - Recipient name (optional)
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content (optional, auto-generated if not provided)
 * @param {Object} env - Environment bindings
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export async function sendEmail({ to, toName, subject, html, text }, env) {
  // Check if email is disabled (for testing/development)
  if (env.DISABLE_EMAIL === 'true') {
    console.log(`[EMAIL DISABLED] Would send to ${to}: ${subject}`);
    return { success: true, messageId: 'disabled', note: 'Email sending disabled' };
  }

  // Validate required fields
  if (!to || !subject || !html) {
    return { success: false, error: 'Missing required fields: to, subject, html' };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    return { success: false, error: `Invalid email address: ${to}` };
  }

  // Auto-generate plain text from HTML if not provided
  const plainText = text || htmlToPlainText(html);

  // Build MailChannels request
  const mailRequest = {
    personalizations: [
      {
        to: [{ email: to, name: toName || to }]
      }
    ],
    from: {
      email: env.EMAIL_FROM || EMAIL_CONFIG.fromEmail,
      name: env.EMAIL_FROM_NAME || EMAIL_CONFIG.fromName
    },
    reply_to: {
      email: env.EMAIL_REPLY_TO || EMAIL_CONFIG.replyTo
    },
    subject: subject,
    content: [
      {
        type: 'text/plain',
        value: plainText
      },
      {
        type: 'text/html',
        value: html
      }
    ]
  };

  try {
    const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mailRequest)
    });

    if (response.status === 202) {
      // MailChannels returns 202 for accepted
      return { success: true, messageId: `mc-${Date.now()}` };
    }

    // Handle errors
    const errorText = await response.text();
    console.error(`MailChannels error: ${response.status} - ${errorText}`);

    return {
      success: false,
      error: `Email delivery failed: ${response.status}`,
      details: errorText
    };

  } catch (error) {
    console.error('Email sending error:', error);
    return {
      success: false,
      error: `Email sending failed: ${error.message}`
    };
  }
}

/**
 * Send a magic link email to a user
 *
 * @param {Object} options - Magic link email options
 * @param {string} options.recipientEmail - Recipient email address
 * @param {string} options.recipientName - Recipient name (optional)
 * @param {string} options.magicLinkUrl - The magic link URL
 * @param {string} options.stationName - Station display name
 * @param {string} options.stationAcronym - Station acronym
 * @param {string} options.expiresAt - Expiration datetime ISO string
 * @param {string} options.label - Link label/purpose (optional)
 * @param {string} options.createdBy - Creator username
 * @param {Object} env - Environment bindings
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export async function sendMagicLinkEmail({
  recipientEmail,
  recipientName,
  magicLinkUrl,
  stationName,
  stationAcronym,
  expiresAt,
  label,
  createdBy
}, env) {
  const expiryDate = new Date(expiresAt);
  const formattedExpiry = expiryDate.toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Stockholm'
  });

  const subject = `Your SITES Spectral Access Link for ${stationName}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SITES Spectral Access Link</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1a5f2a 0%, #2d8f45 100%); padding: 30px; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">SITES Spectral</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px;">Swedish Infrastructure for Ecosystem Science</p>
  </div>

  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
    <h2 style="color: #1a5f2a; margin-top: 0;">Your Access Link is Ready</h2>

    <p>Hello${recipientName ? ` ${recipientName}` : ''},</p>

    <p>You have been granted access to the <strong>${stationName} (${stationAcronym})</strong> station portal on SITES Spectral.</p>

    ${label ? `<p style="background: #e8f5e9; padding: 10px 15px; border-radius: 4px; border-left: 4px solid #1a5f2a;"><strong>Purpose:</strong> ${label}</p>` : ''}

    <div style="text-align: center; margin: 30px 0;">
      <a href="${magicLinkUrl}" style="display: inline-block; background: #1a5f2a; color: white; text-decoration: none; padding: 15px 30px; border-radius: 6px; font-weight: 600; font-size: 16px;">Access Station Portal</a>
    </div>

    <p style="font-size: 13px; color: #666;">Or copy this link into your browser:</p>
    <p style="font-size: 12px; background: #fff; padding: 10px; border-radius: 4px; word-break: break-all; border: 1px solid #e5e7eb;">${magicLinkUrl}</p>

    <div style="background: #fff3cd; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #ffc107;">
      <p style="margin: 0; font-size: 14px;"><strong>⚠️ Important:</strong></p>
      <ul style="margin: 10px 0 0 0; padding-left: 20px; font-size: 14px;">
        <li>This link expires on <strong>${formattedExpiry} (CET)</strong></li>
        <li>Do not share this link with others</li>
        <li>This link provides read-only access to station data</li>
      </ul>
    </div>

    <p style="font-size: 13px; color: #666;">This access was granted by <strong>${createdBy}</strong>.</p>
  </div>

  <div style="background: #333; color: #999; padding: 20px; border-radius: 0 0 8px 8px; font-size: 12px; text-align: center;">
    <p style="margin: 0;">SITES Spectral - Swedish Infrastructure for Ecosystem Science</p>
    <p style="margin: 5px 0 0 0;">
      <a href="https://www.fieldsites.se" style="color: #66bb6a;">fieldsites.se</a> |
      <a href="https://sitesspectral.work" style="color: #66bb6a;">sitesspectral.work</a>
    </p>
    <p style="margin: 10px 0 0 0; color: #666;">If you did not request this access, please ignore this email.</p>
  </div>
</body>
</html>
`;

  return sendEmail({
    to: recipientEmail,
    toName: recipientName,
    subject,
    html
  }, env);
}

/**
 * Convert HTML to plain text (basic implementation)
 *
 * @param {string} html - HTML content
 * @returns {string} Plain text
 */
function htmlToPlainText(html) {
  return html
    // Remove style and script tags with content
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    // Convert links to text with URL
    .replace(/<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi, '$2 ($1)')
    // Convert headers to uppercase with newlines
    .replace(/<h[1-6][^>]*>([^<]*)<\/h[1-6]>/gi, '\n\n$1\n')
    // Convert paragraphs to double newlines
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<p[^>]*>/gi, '')
    // Convert list items
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    // Convert line breaks
    .replace(/<br\s*\/?>/gi, '\n')
    // Remove all remaining tags
    .replace(/<[^>]+>/g, '')
    // Decode common entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    // Clean up whitespace
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

export default {
  sendEmail,
  sendMagicLinkEmail
};
