// MailerSend API integration for YouCast CRM email campaigns
// Handles transactional emails, bulk campaigns, and automated sequences

const MAILERSEND_API_KEY = process.env.MAILERSEND_API_KEY;
const BASE_URL = 'https://api.mailersend.com/v1';

// Types
export interface EmailRecipient {
  email: string;
  name?: string;
  substitutions?: Record<string, string>;
}

export interface EmailAttachment {
  content: string; // Base64 encoded
  filename: string;
  disposition?: 'inline' | 'attachment';
  id?: string;
}

export interface EmailPersonalization {
  email: string;
  data: Record<string, any>;
}

export interface SendEmailOptions {
  from: {
    email: string;
    name?: string;
  };
  to: EmailRecipient[];
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  reply_to?: {
    email: string;
    name?: string;
  };
  subject: string;
  text?: string;
  html?: string;
  template_id?: string;
  variables?: {
    email: string;
    substitutions: { var: string; value: string }[];
  }[];
  personalization?: EmailPersonalization[];
  attachments?: EmailAttachment[];
  tags?: string[];
  send_at?: number; // Unix timestamp for scheduled sending
}

export interface BulkEmailStatus {
  bulk_email_id: string;
  state: 'processing' | 'completed' | 'failed';
  total_recipients_count: number;
  suppressed_recipients_count: number;
  suppressed_recipients: string[];
  created_at: string;
  updated_at: string;
}

export interface TemplateVariable {
  var: string;
  value: string;
}

// API Helper
async function mailersendRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any
): Promise<T> {
  if (!MAILERSEND_API_KEY) {
    throw new Error('MailerSend API key not configured');
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${MAILERSEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`MailerSend API error: ${response.status} - ${error}`);
  }

  // Some endpoints return 202 with no body
  if (response.status === 202 || response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// ========================================
// Email Sending Functions
// ========================================

// Send a single email
export async function sendEmail(options: SendEmailOptions): Promise<{ message_id: string }> {
  return mailersendRequest<{ message_id: string }>('/email', 'POST', options);
}

// Send bulk emails (up to 500 per request)
export async function sendBulkEmails(
  emails: SendEmailOptions[]
): Promise<{ bulk_email_id: string }> {
  if (emails.length > 500) {
    throw new Error('Maximum 500 emails per bulk request');
  }

  return mailersendRequest<{ bulk_email_id: string }>('/bulk-email', 'POST', emails);
}

// Check bulk email status
export async function getBulkEmailStatus(bulkEmailId: string): Promise<BulkEmailStatus> {
  return mailersendRequest<BulkEmailStatus>(`/bulk-email/${bulkEmailId}`);
}

// ========================================
// YouCast CRM Email Templates
// ========================================

const YOUCAST_FROM = {
  email: 'noreply@youcast.network',
  name: 'YouCast Network',
};

const YOUCAST_REPLY_TO = {
  email: 'support@youcast.network',
  name: 'YouCast Support',
};

// Welcome email for new users
export async function sendWelcomeEmail(
  to: EmailRecipient,
  data: { firstName?: string; verificationUrl?: string }
): Promise<{ message_id: string }> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px; text-align: center;">
        <h1 style="color: white; margin: 0;">Welcome to YouCast!</h1>
      </div>
      <div style="padding: 40px; background: #f9fafb;">
        <p style="font-size: 16px; color: #374151;">
          Hi ${data.firstName || 'there'},
        </p>
        <p style="font-size: 16px; color: #374151;">
          Welcome to YouCast Network! We're excited to have you join our community of creators and viewers.
        </p>
        ${data.verificationUrl ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.verificationUrl}" style="background: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Verify Your Email
          </a>
        </div>
        ` : ''}
        <p style="font-size: 16px; color: #374151;">
          Here's what you can do on YouCast:
        </p>
        <ul style="font-size: 16px; color: #374151;">
          <li>Watch live streams from talented creators</li>
          <li>Start your own channel and go live</li>
          <li>Connect with communities that share your interests</li>
          <li>Build your audience and monetize your content</li>
        </ul>
        <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
          If you have any questions, just reply to this email. We're here to help!
        </p>
      </div>
      <div style="padding: 20px; text-align: center; background: #1f2937;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          © ${new Date().getFullYear()} YouCast Network. All rights reserved.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    from: YOUCAST_FROM,
    to: [to],
    reply_to: YOUCAST_REPLY_TO,
    subject: `Welcome to YouCast, ${data.firstName || 'Creator'}!`,
    html,
    tags: ['welcome', 'onboarding'],
  });
}

// Stream notification for followers
export async function sendStreamNotification(
  recipients: EmailRecipient[],
  data: {
    creatorName: string;
    streamTitle: string;
    streamUrl: string;
    thumbnailUrl?: string;
  }
): Promise<{ bulk_email_id: string } | { message_id: string }> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #dc2626; padding: 20px; text-align: center;">
        <span style="color: white; font-size: 14px; font-weight: bold; background: rgba(0,0,0,0.3); padding: 4px 12px; border-radius: 4px;">
          🔴 LIVE NOW
        </span>
      </div>
      ${data.thumbnailUrl ? `
      <div style="width: 100%;">
        <img src="${data.thumbnailUrl}" alt="Stream thumbnail" style="width: 100%; height: auto;"/>
      </div>
      ` : ''}
      <div style="padding: 30px; background: #f9fafb;">
        <h2 style="margin: 0 0 10px; color: #111827;">${data.creatorName} is live!</h2>
        <p style="font-size: 18px; color: #374151; margin: 0 0 20px;">
          ${data.streamTitle}
        </p>
        <div style="text-align: center;">
          <a href="${data.streamUrl}" style="background: #dc2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Watch Now
          </a>
        </div>
      </div>
    </div>
  `;

  if (recipients.length === 1) {
    return sendEmail({
      from: YOUCAST_FROM,
      to: recipients,
      subject: `🔴 ${data.creatorName} is live: ${data.streamTitle}`,
      html,
      tags: ['stream-notification', 'live'],
    });
  }

  // Use bulk email for multiple recipients
  const emails = recipients.map((recipient) => ({
    from: YOUCAST_FROM,
    to: [recipient],
    subject: `🔴 ${data.creatorName} is live: ${data.streamTitle}`,
    html,
    tags: ['stream-notification', 'live'],
  }));

  return sendBulkEmails(emails);
}

// Payment receipt
export async function sendPaymentReceipt(
  to: EmailRecipient,
  data: {
    amount: number;
    currency: string;
    description: string;
    transactionId: string;
    date: Date;
  }
): Promise<{ message_id: string }> {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: data.currency,
  }).format(data.amount / 100); // Assuming amount is in cents

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #059669; padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">Payment Received</h1>
      </div>
      <div style="padding: 40px; background: #f9fafb;">
        <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
            <span style="font-size: 36px; font-weight: bold; color: #059669;">${formattedAmount}</span>
          </div>
          <table style="width: 100%; font-size: 14px;">
            <tr>
              <td style="padding: 10px 0; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Description</td>
              <td style="padding: 10px 0; color: #111827; text-align: right; border-bottom: 1px solid #e5e7eb;">${data.description}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Transaction ID</td>
              <td style="padding: 10px 0; color: #111827; text-align: right; border-bottom: 1px solid #e5e7eb; font-family: monospace;">${data.transactionId}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #6b7280;">Date</td>
              <td style="padding: 10px 0; color: #111827; text-align: right;">${data.date.toLocaleDateString()}</td>
            </tr>
          </table>
        </div>
        <p style="font-size: 14px; color: #6b7280; margin-top: 20px; text-align: center;">
          Thank you for your support of creators on YouCast!
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    from: YOUCAST_FROM,
    to: [to],
    reply_to: YOUCAST_REPLY_TO,
    subject: `Payment Receipt - ${formattedAmount}`,
    html,
    tags: ['payment', 'receipt'],
  });
}

// Creator payout notification
export async function sendPayoutNotification(
  to: EmailRecipient,
  data: {
    amount: number;
    currency: string;
    payoutMethod: string;
    estimatedArrival: Date;
  }
): Promise<{ message_id: string }> {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: data.currency,
  }).format(data.amount / 100);

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 40px; text-align: center;">
        <h1 style="color: white; margin: 0;">Payout on the way! 💰</h1>
      </div>
      <div style="padding: 40px; background: #f9fafb;">
        <div style="text-align: center; margin-bottom: 30px;">
          <span style="font-size: 48px; font-weight: bold; color: #059669;">${formattedAmount}</span>
        </div>
        <p style="font-size: 16px; color: #374151; text-align: center;">
          Your payout has been initiated via <strong>${data.payoutMethod}</strong>.
        </p>
        <p style="font-size: 16px; color: #374151; text-align: center;">
          Expected arrival: <strong>${data.estimatedArrival.toLocaleDateString()}</strong>
        </p>
        <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin-top: 30px;">
          <p style="font-size: 14px; color: #065f46; margin: 0; text-align: center;">
            Keep creating great content! Your viewers appreciate you. 🎉
          </p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    from: YOUCAST_FROM,
    to: [to],
    reply_to: YOUCAST_REPLY_TO,
    subject: `Your ${formattedAmount} payout is on the way!`,
    html,
    tags: ['payout', 'creator'],
  });
}

// CRM campaign email
export async function sendCampaignEmail(
  recipients: EmailRecipient[],
  data: {
    subject: string;
    preheader?: string;
    headline: string;
    body: string;
    ctaText?: string;
    ctaUrl?: string;
    imageUrl?: string;
  }
): Promise<{ bulk_email_id: string } | { message_id: string }> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      ${data.preheader ? `<span style="display: none;">${data.preheader}</span>` : ''}
      <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px; text-align: center;">
        <img src="https://youcast.network/logo-white.png" alt="YouCast" style="height: 40px; margin-bottom: 20px;"/>
        <h1 style="color: white; margin: 0; font-size: 28px;">${data.headline}</h1>
      </div>
      ${data.imageUrl ? `
      <div style="width: 100%;">
        <img src="${data.imageUrl}" alt="Campaign image" style="width: 100%; height: auto;"/>
      </div>
      ` : ''}
      <div style="padding: 40px; background: #f9fafb;">
        <div style="font-size: 16px; color: #374151; line-height: 1.6;">
          ${data.body}
        </div>
        ${data.ctaText && data.ctaUrl ? `
        <div style="text-align: center; margin-top: 30px;">
          <a href="${data.ctaUrl}" style="background: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            ${data.ctaText}
          </a>
        </div>
        ` : ''}
      </div>
      <div style="padding: 20px; text-align: center; background: #1f2937;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          © ${new Date().getFullYear()} YouCast Network. All rights reserved.
        </p>
        <p style="color: #6b7280; font-size: 11px; margin: 10px 0 0;">
          <a href="{{unsubscribe}}" style="color: #6b7280;">Unsubscribe</a> | <a href="https://youcast.network/privacy" style="color: #6b7280;">Privacy Policy</a>
        </p>
      </div>
    </div>
  `;

  if (recipients.length === 1) {
    return sendEmail({
      from: YOUCAST_FROM,
      to: recipients,
      reply_to: YOUCAST_REPLY_TO,
      subject: data.subject,
      html,
      tags: ['campaign', 'crm'],
    });
  }

  const emails = recipients.map((recipient) => ({
    from: YOUCAST_FROM,
    to: [recipient],
    reply_to: YOUCAST_REPLY_TO,
    subject: data.subject,
    html,
    tags: ['campaign', 'crm'],
  }));

  return sendBulkEmails(emails);
}

// Password reset email
export async function sendPasswordResetEmail(
  to: EmailRecipient,
  data: { resetUrl: string; expiresIn: string }
): Promise<{ message_id: string }> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1f2937; padding: 40px; text-align: center;">
        <h1 style="color: white; margin: 0;">Reset Your Password</h1>
      </div>
      <div style="padding: 40px; background: #f9fafb;">
        <p style="font-size: 16px; color: #374151;">
          We received a request to reset your password. Click the button below to create a new password:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.resetUrl}" style="background: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="font-size: 14px; color: #6b7280;">
          This link will expire in ${data.expiresIn}. If you didn't request a password reset, you can safely ignore this email.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    from: YOUCAST_FROM,
    to: [to],
    reply_to: YOUCAST_REPLY_TO,
    subject: 'Reset Your YouCast Password',
    html,
    tags: ['authentication', 'password-reset'],
  });
}

// Subscriber milestone notification for creators
export async function sendSubscriberMilestone(
  to: EmailRecipient,
  data: { milestoneCount: number; creatorName: string }
): Promise<{ message_id: string }> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%); padding: 50px; text-align: center;">
        <span style="font-size: 60px;">🎉</span>
        <h1 style="color: white; margin: 20px 0 0; font-size: 32px;">
          ${data.milestoneCount.toLocaleString()} Subscribers!
        </h1>
      </div>
      <div style="padding: 40px; background: #f9fafb; text-align: center;">
        <p style="font-size: 18px; color: #374151;">
          Congratulations, ${data.creatorName}!
        </p>
        <p style="font-size: 16px; color: #6b7280;">
          You've reached an incredible milestone. Your hard work and dedication are paying off!
        </p>
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin-top: 20px;">
          <p style="font-size: 14px; color: #92400e; margin: 0;">
            Keep creating amazing content. Your community is growing! 🚀
          </p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    from: YOUCAST_FROM,
    to: [to],
    reply_to: YOUCAST_REPLY_TO,
    subject: `🎉 You hit ${data.milestoneCount.toLocaleString()} subscribers!`,
    html,
    tags: ['milestone', 'creator', 'achievement'],
  });
}

// Export template functions for external use
export const CRM_EMAIL_TEMPLATES = {
  welcome: sendWelcomeEmail,
  streamNotification: sendStreamNotification,
  paymentReceipt: sendPaymentReceipt,
  payoutNotification: sendPayoutNotification,
  campaign: sendCampaignEmail,
  passwordReset: sendPasswordResetEmail,
  subscriberMilestone: sendSubscriberMilestone,
};
