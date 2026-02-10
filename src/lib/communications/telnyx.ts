// ============================================================================
// TELNYX CLIENT - SMS and Voice Communication
// ============================================================================

const TELNYX_API_KEY = process.env.TELNYX_API_KEY;
const TELNYX_API_BASE = 'https://api.telnyx.com/v2';

if (!TELNYX_API_KEY && typeof window === 'undefined') {
  console.warn('TELNYX_API_KEY not configured - messaging features will not work');
}

// ============================================================================
// TYPES
// ============================================================================

export interface SMSMessage {
  id: string;
  to: string;
  from: string;
  text: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed';
  createdAt: string;
}

export interface PhoneNumber {
  id: string;
  phoneNumber: string;
  friendlyName?: string;
  capabilities: {
    sms: boolean;
    mms: boolean;
    voice: boolean;
  };
}

// ============================================================================
// API HELPER
// ============================================================================

async function telnyxRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'DELETE' = 'GET',
  body?: Record<string, unknown>
): Promise<T | null> {
  if (!TELNYX_API_KEY) {
    console.error('Telnyx API key not configured');
    return null;
  }

  try {
    const response = await fetch(`${TELNYX_API_BASE}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${TELNYX_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Telnyx API error:', error);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Telnyx request failed:', error);
    return null;
  }
}

// ============================================================================
// SMS FUNCTIONS
// ============================================================================

/**
 * Send an SMS message to a user
 */
export async function sendSMS(
  to: string,
  text: string,
  from?: string
): Promise<SMSMessage | null> {
  const response = await telnyxRequest<{ data: any }>('/messages', 'POST', {
    from: from || process.env.TELNYX_PHONE_NUMBER,
    to,
    text,
    type: 'SMS',
  });

  if (!response?.data) return null;

  return {
    id: response.data.id,
    to: response.data.to[0]?.phone_number,
    from: response.data.from?.phone_number,
    text: response.data.text,
    status: response.data.status,
    createdAt: response.data.created_at,
  };
}

/**
 * Send a bulk SMS to multiple recipients
 */
export async function sendBulkSMS(
  recipients: string[],
  text: string,
  from?: string
): Promise<SMSMessage[]> {
  const results: SMSMessage[] = [];

  for (const to of recipients) {
    const result = await sendSMS(to, text, from);
    if (result) {
      results.push(result);
    }
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return results;
}

/**
 * Send platform notification SMS
 */
export async function sendNotificationSMS(
  to: string,
  type: 'welcome' | 'verification' | 'stream_reminder' | 'event_reminder' | 'payment_received',
  data: Record<string, string> = {}
): Promise<SMSMessage | null> {
  const templates: Record<string, string> = {
    welcome: `Welcome to YouCast! Your account is ready. Start creating at youcast.network`,
    verification: `Your YouCast verification code is: ${data.code}`,
    stream_reminder: `${data.creator || 'A creator you follow'} is going live in ${data.time || '15 minutes'}! Watch at youcast.network`,
    event_reminder: `Reminder: "${data.event}" starts in ${data.time || '1 hour'}. Don't miss it!`,
    payment_received: `You received a payment of $${data.amount || '0'} on YouCast. View details in your dashboard.`,
  };

  const text = templates[type] || templates.welcome;
  return sendSMS(to, text);
}

// ============================================================================
// PHONE NUMBER MANAGEMENT
// ============================================================================

/**
 * List available phone numbers
 */
export async function listPhoneNumbers(): Promise<PhoneNumber[]> {
  const response = await telnyxRequest<{ data: any[] }>('/phone_numbers');
  
  if (!response?.data) return [];

  return response.data.map(pn => ({
    id: pn.id,
    phoneNumber: pn.phone_number,
    friendlyName: pn.connection_name,
    capabilities: {
      sms: pn.features?.sms?.outbound || false,
      mms: pn.features?.mms?.outbound || false,
      voice: pn.features?.voice?.outbound || false,
    },
  }));
}

// ============================================================================
// VOICE FUNCTIONS (Future expansion)
// ============================================================================

/**
 * Initiate a voice call
 */
export async function initiateCall(
  to: string,
  from?: string,
  webhookUrl?: string
): Promise<string | null> {
  const response = await telnyxRequest<{ data: any }>('/calls', 'POST', {
    connection_id: process.env.TELNYX_CONNECTION_ID,
    to,
    from: from || process.env.TELNYX_PHONE_NUMBER,
    webhook_url: webhookUrl,
  });

  return response?.data?.call_control_id || null;
}
