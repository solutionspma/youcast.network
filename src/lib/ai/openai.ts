// OpenAI API integration for YouCast AI-powered features
// Content generation, moderation, recommendations, and stream assistance

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ========================================
// Content Generation
// ========================================

// Generate stream titles and descriptions
export async function generateStreamMetadata(
  topic: string,
  style: 'casual' | 'professional' | 'hype' | 'educational' = 'casual'
): Promise<{ title: string; description: string; tags: string[] }> {
  const stylePrompts = {
    casual: 'friendly and conversational',
    professional: 'polished and authoritative',
    hype: 'exciting and high-energy with emojis',
    educational: 'informative and clear',
  };

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a content strategist helping creators write ${stylePrompts[style]} stream metadata. Return JSON with title (max 100 chars), description (150-200 chars), and tags (5-8 relevant tags).`,
      },
      {
        role: 'user',
        content: `Generate stream metadata for a stream about: ${topic}`,
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 300,
  });

  const result = JSON.parse(completion.choices[0].message.content || '{}');
  return {
    title: result.title || topic,
    description: result.description || '',
    tags: result.tags || [],
  };
}

// Generate video/VOD descriptions from transcript
export async function generateVideoDescription(
  transcript: string,
  options: { includeTimestamps?: boolean; maxLength?: number } = {}
): Promise<{ description: string; chapters?: { time: string; title: string }[] }> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a content writer creating SEO-optimized video descriptions. ${
          options.includeTimestamps 
            ? 'Include chapter timestamps in your response.' 
            : ''
        } Return JSON with description and optionally chapters array with time and title.`,
      },
      {
        role: 'user',
        content: `Generate a description (max ${options.maxLength || 500} chars) for this video transcript:\n\n${transcript.slice(0, 4000)}`,
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 500,
  });

  return JSON.parse(completion.choices[0].message.content || '{}');
}

// Generate social media posts for stream promotion
export async function generateSocialPosts(
  streamTitle: string,
  streamUrl: string,
  platforms: ('twitter' | 'instagram' | 'linkedin' | 'facebook')[]
): Promise<Record<string, string>> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a social media strategist. Generate promotional posts for different platforms. Each post should be optimized for that platform's character limits and style. Include relevant hashtags. Return JSON with platform names as keys and posts as values.`,
      },
      {
        role: 'user',
        content: `Generate posts for these platforms: ${platforms.join(', ')}\n\nStream: "${streamTitle}"\nLink: ${streamUrl}`,
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 600,
  });

  return JSON.parse(completion.choices[0].message.content || '{}');
}

// ========================================
// Content Moderation
// ========================================

export interface ModerationResult {
  flagged: boolean;
  categories: {
    hate: boolean;
    harassment: boolean;
    selfHarm: boolean;
    sexual: boolean;
    violence: boolean;
    minors: boolean;
  };
  categoryScores: {
    hate: number;
    harassment: number;
    selfHarm: number;
    sexual: number;
    violence: number;
    minors: number;
  };
}

// Moderate text content (chat messages, comments, etc.)
export async function moderateText(text: string): Promise<ModerationResult> {
  const moderation = await openai.moderations.create({
    input: text,
  });

  const result = moderation.results[0];
  
  return {
    flagged: result.flagged,
    categories: {
      hate: result.categories.hate || result.categories['hate/threatening'],
      harassment: result.categories.harassment || result.categories['harassment/threatening'],
      selfHarm: result.categories['self-harm'] || result.categories['self-harm/intent'] || result.categories['self-harm/instructions'],
      sexual: result.categories.sexual || result.categories['sexual/minors'],
      violence: result.categories.violence || result.categories['violence/graphic'],
      minors: result.categories['sexual/minors'] || false,
    },
    categoryScores: {
      hate: result.category_scores.hate || 0,
      harassment: result.category_scores.harassment || 0,
      selfHarm: result.category_scores['self-harm'] || 0,
      sexual: result.category_scores.sexual || 0,
      violence: result.category_scores.violence || 0,
      minors: result.category_scores['sexual/minors'] || 0,
    },
  };
}

// Batch moderate multiple messages
export async function moderateBatch(texts: string[]): Promise<ModerationResult[]> {
  const results = await Promise.all(texts.map(moderateText));
  return results;
}

// ========================================
// Stream Chat Assistance
// ========================================

// Generate AI response to chat question (for creator AI assistants)
export async function generateChatResponse(
  question: string,
  context: {
    creatorName: string;
    streamTopic?: string;
    channelInfo?: string;
    recentMessages?: string[];
  }
): Promise<string> {
  const systemPrompt = `You are a helpful AI assistant for ${context.creatorName}'s stream chat. 
${context.channelInfo ? `Channel info: ${context.channelInfo}` : ''}
${context.streamTopic ? `Current stream topic: ${context.streamTopic}` : ''}

Be friendly, concise, and helpful. Keep responses under 200 characters when possible. Don't pretend to be the creator.`;

  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: systemPrompt },
  ];

  // Add recent chat context
  if (context.recentMessages?.length) {
    messages.push({
      role: 'user',
      content: `Recent chat context:\n${context.recentMessages.slice(-5).join('\n')}`,
    });
  }

  messages.push({ role: 'user', content: question });

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    max_tokens: 150,
  });

  return completion.choices[0].message.content || '';
}

// Summarize chat for stream highlights
export async function summarizeChat(
  messages: { username: string; content: string; timestamp: string }[],
  options: { includeHighlights?: boolean; maxSummaryLength?: number } = {}
): Promise<{ summary: string; highlights?: string[]; sentiment: 'positive' | 'neutral' | 'negative' }> {
  const chatText = messages
    .map((m) => `[${m.timestamp}] ${m.username}: ${m.content}`)
    .join('\n');

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Analyze this stream chat and provide: 
1. A brief summary (max ${options.maxSummaryLength || 200} chars)
2. ${options.includeHighlights ? 'Key highlights/moments (up to 5)' : ''}
3. Overall sentiment (positive/neutral/negative)
Return JSON with summary, highlights (array), and sentiment.`,
      },
      {
        role: 'user',
        content: chatText.slice(0, 8000),
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 400,
  });

  return JSON.parse(completion.choices[0].message.content || '{}');
}

// ========================================
// Recommendations
// ========================================

// Generate content recommendations based on viewing history
export async function generateRecommendations(
  viewingHistory: { title: string; category: string; watchTime: number }[],
  availableContent: { id: string; title: string; category: string; description: string }[],
  limit: number = 10
): Promise<string[]> {
  const historyText = viewingHistory
    .sort((a, b) => b.watchTime - a.watchTime)
    .slice(0, 20)
    .map((v) => `${v.title} (${v.category})`)
    .join(', ');

  const contentText = availableContent
    .map((c) => `${c.id}: ${c.title} [${c.category}]`)
    .join('\n');

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a recommendation engine. Based on viewing history, return a JSON array of content IDs that would interest this user. Return exactly ${limit} IDs in order of relevance.`,
      },
      {
        role: 'user',
        content: `Viewing history: ${historyText}\n\nAvailable content:\n${contentText}`,
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 200,
  });

  const result = JSON.parse(completion.choices[0].message.content || '{}');
  return result.recommendations || result.ids || [];
}

// ========================================
// Image Generation (DALL-E)
// ========================================

// Generate custom stream thumbnails
export async function generateThumbnail(
  description: string,
  style: 'realistic' | 'artistic' | 'minimal' | 'gaming' = 'artistic'
): Promise<string> {
  const stylePrompts = {
    realistic: 'photorealistic, high quality, professional',
    artistic: 'digital art, vibrant colors, stylized',
    minimal: 'minimalist design, clean, simple shapes',
    gaming: 'gaming aesthetic, neon colors, dynamic',
  };

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt: `Stream thumbnail: ${description}. Style: ${stylePrompts[style]}. 16:9 aspect ratio, suitable for video thumbnail.`,
    n: 1,
    size: '1792x1024',
    quality: 'standard',
  });

  return response.data?.[0]?.url || '';
}

// Generate channel banner
export async function generateChannelBanner(
  channelName: string,
  theme: string,
  colors?: string[]
): Promise<string> {
  const colorPrompt = colors?.length 
    ? `Use these brand colors: ${colors.join(', ')}.` 
    : '';

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt: `Channel banner for "${channelName}". Theme: ${theme}. ${colorPrompt} Professional streaming channel banner, modern design, no text.`,
    n: 1,
    size: '1792x1024',
    quality: 'standard',
  });

  return response.data?.[0]?.url || '';
}

// ========================================
// Text-to-Speech via OpenAI
// ========================================

export type OpenAIVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

// Generate speech for stream alerts, intros, etc.
export async function generateSpeech(
  text: string,
  voice: OpenAIVoice = 'nova',
  speed: number = 1.0
): Promise<ArrayBuffer> {
  const response = await openai.audio.speech.create({
    model: 'tts-1',
    voice,
    input: text,
    speed,
  });

  return response.arrayBuffer();
}

// Generate HD speech for production use
export async function generateSpeechHD(
  text: string,
  voice: OpenAIVoice = 'nova',
  speed: number = 1.0
): Promise<ArrayBuffer> {
  const response = await openai.audio.speech.create({
    model: 'tts-1-hd',
    voice,
    input: text,
    speed,
  });

  return response.arrayBuffer();
}

// ========================================
// Transcription (Whisper)
// ========================================

// Transcribe audio/video for captions
export async function transcribeAudio(
  audioFile: File | Blob,
  options: {
    language?: string;
    prompt?: string;
    timestamps?: boolean;
  } = {}
): Promise<{ text: string; segments?: { start: number; end: number; text: string }[] }> {
  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-1',
    language: options.language,
    prompt: options.prompt,
    response_format: options.timestamps ? 'verbose_json' : 'text',
  });

  if (typeof transcription === 'string') {
    return { text: transcription };
  }

  return {
    text: transcription.text,
    segments: (transcription as any).segments?.map((s: any) => ({
      start: s.start,
      end: s.end,
      text: s.text,
    })),
  };
}

// ========================================
// Utility Functions
// ========================================

// Estimate token count (rough estimate)
export function estimateTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters for English
  return Math.ceil(text.length / 4);
}

// Export organized API
export const YouCastAI = {
  content: {
    generateStreamMetadata,
    generateVideoDescription,
    generateSocialPosts,
  },
  moderation: {
    moderateText,
    moderateBatch,
  },
  chat: {
    generateResponse: generateChatResponse,
    summarize: summarizeChat,
  },
  recommendations: {
    generate: generateRecommendations,
  },
  images: {
    generateThumbnail,
    generateChannelBanner,
  },
  audio: {
    speak: generateSpeech,
    speakHD: generateSpeechHD,
    transcribe: transcribeAudio,
  },
  utils: {
    estimateTokens,
  },
};
