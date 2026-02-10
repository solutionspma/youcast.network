// ============================================================================
// ELEVENLABS CLIENT - AI Voice and Sound Effects for Stream Studio
// ============================================================================

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1';

if (!ELEVENLABS_API_KEY && typeof window === 'undefined') {
  console.warn('ELEVENLABS_API_KEY not configured - AI voice features will not work');
}

// ============================================================================
// TYPES
// ============================================================================

export interface Voice {
  voice_id: string;
  name: string;
  category?: string;
  description?: string;
  preview_url?: string;
  labels?: Record<string, string>;
}

export interface SoundEffect {
  id: string;
  name: string;
  audioUrl: string;
  duration: number;
}

export interface VoiceSettings {
  stability: number;       // 0-1, higher = more stable
  similarity_boost: number; // 0-1, higher = more similar to original voice
  style?: number;          // 0-1, style exaggeration
  use_speaker_boost?: boolean;
}

// ============================================================================
// API HELPER
// ============================================================================

async function elevenLabsJsonRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  body?: Record<string, unknown>
): Promise<T | null> {
  if (!ELEVENLABS_API_KEY) {
    console.error('ElevenLabs API key not configured');
    return null;
  }

  try {
    const response = await fetch(`${ELEVENLABS_API_BASE}${endpoint}`, {
      method,
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('ElevenLabs API error:', error);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('ElevenLabs request failed:', error);
    return null;
  }
}

async function elevenLabsAudioRequest(
  endpoint: string,
  method: 'POST' = 'POST',
  body?: Record<string, unknown>
): Promise<ArrayBuffer | null> {
  if (!ELEVENLABS_API_KEY) {
    console.error('ElevenLabs API key not configured');
    return null;
  }

  try {
    const response = await fetch(`${ELEVENLABS_API_BASE}${endpoint}`, {
      method,
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('ElevenLabs API error:', error);
      return null;
    }

    return await response.arrayBuffer();
  } catch (error) {
    console.error('ElevenLabs request failed:', error);
    return null;
  }
}

// ============================================================================
// VOICE FUNCTIONS
// ============================================================================

/**
 * Get list of available voices
 */
export async function getVoices(): Promise<Voice[]> {
  const response = await elevenLabsJsonRequest<{ voices: Voice[] }>('/voices');
  return response?.voices || [];
}

/**
 * Generate speech from text
 */
export async function textToSpeech(
  text: string,
  voiceId: string,
  settings?: VoiceSettings
): Promise<ArrayBuffer | null> {
  const defaultSettings: VoiceSettings = {
    stability: 0.5,
    similarity_boost: 0.75,
    style: 0.5,
    use_speaker_boost: true,
  };

  return elevenLabsAudioRequest(
    `/text-to-speech/${voiceId}`,
    'POST',
    {
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { ...defaultSettings, ...settings },
    }
  );
}

/**
 * Generate sound effect using AI
 * This is great for stream soundboard effects
 */
export async function generateSoundEffect(
  text: string,
  durationSeconds?: number
): Promise<ArrayBuffer | null> {
  return elevenLabsAudioRequest(
    '/sound-generation',
    'POST',
    {
      text,
      duration_seconds: durationSeconds,
    }
  );
}

// ============================================================================
// STREAM STUDIO PRESETS
// ============================================================================

export const SOUNDBOARD_PRESETS = [
  { id: 'applause', name: 'Applause', prompt: 'Crowd applause and cheering', duration: 3 },
  { id: 'airhorn', name: 'Air Horn', prompt: 'Air horn sound effect', duration: 2 },
  { id: 'drumroll', name: 'Drum Roll', prompt: 'Dramatic drum roll', duration: 4 },
  { id: 'sad_trombone', name: 'Sad Trombone', prompt: 'Sad trombone failure sound', duration: 2 },
  { id: 'victory', name: 'Victory', prompt: 'Triumphant victory fanfare', duration: 3 },
  { id: 'suspense', name: 'Suspense', prompt: 'Dramatic suspenseful music sting', duration: 5 },
  { id: 'laugh_track', name: 'Laugh Track', prompt: 'Sitcom audience laughter', duration: 3 },
  { id: 'error', name: 'Error', prompt: 'Computer error beep sound', duration: 1 },
  { id: 'notification', name: 'Notification', prompt: 'Pleasant notification chime', duration: 1 },
  { id: 'intro_music', name: 'Intro Music', prompt: 'Energetic podcast/stream intro music', duration: 10 },
];

/**
 * Generate a preset sound effect
 */
export async function generatePresetSound(
  presetId: string
): Promise<ArrayBuffer | null> {
  const preset = SOUNDBOARD_PRESETS.find(p => p.id === presetId);
  if (!preset) {
    console.error('Unknown preset:', presetId);
    return null;
  }

  return generateSoundEffect(preset.prompt, preset.duration);
}

// ============================================================================
// TTS ANNOUNCEMENTS FOR STREAMS
// ============================================================================

export const STREAM_VOICES = {
  hype: 'TX3LPaxmHKxFdv7VOQHJ', // Energetic male
  calm: 'EXAVITQu4vr4xnSDxMaL', // Calm female
  funny: 'jsCqWAovK2LkecY7zXl4', // Comedic voice
  professional: 'pNInz6obpgDQGcFmaJgB', // Professional male
};

/**
 * Generate stream announcement (donations, subs, etc.)
 */
export async function generateStreamAnnouncement(
  text: string,
  style: 'hype' | 'calm' | 'funny' | 'professional' = 'hype'
): Promise<ArrayBuffer | null> {
  const voiceId = STREAM_VOICES[style];
  return textToSpeech(text, voiceId, {
    stability: 0.4,
    similarity_boost: 0.8,
    style: style === 'hype' ? 0.8 : 0.3,
  });
}

/**
 * Generate donation/tip announcement
 */
export async function generateDonationAnnouncement(
  username: string,
  amount: number,
  message?: string
): Promise<ArrayBuffer | null> {
  let text = `${username} just donated ${amount} dollars!`;
  if (message) {
    text += ` They say: ${message}`;
  }
  return generateStreamAnnouncement(text, 'hype');
}

/**
 * Generate new subscriber announcement
 */
export async function generateSubscriberAnnouncement(
  username: string,
  tier?: string
): Promise<ArrayBuffer | null> {
  const text = tier
    ? `Wow! ${username} just subscribed at the ${tier} tier! Thank you so much!`
    : `${username} just subscribed! Welcome to the community!`;
  return generateStreamAnnouncement(text, 'hype');
}
