// AI Assistance Hooks for Stream Studio
// Hooks for AI-powered title suggestions, thumbnail generation, and scene recommendations

import { useState, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface AITitleSuggestion {
  title: string;
  confidence: number;
  reasoning?: string;
}

export interface AIThumbnailSuggestion {
  prompt: string;
  style: 'bold' | 'minimal' | 'professional' | 'playful';
  colorPalette: string[];
  layoutHint: string;
}

export interface AISceneRecommendation {
  type: 'layout' | 'overlay' | 'transition' | 'audio';
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
  action?: () => void;
}

export interface AIAssistanceState {
  isLoading: boolean;
  error: string | null;
  lastQuery?: string;
}

// ============================================================================
// AI TITLE HOOK
// ============================================================================

interface UseTitleSuggestionsOptions {
  maxSuggestions?: number;
  categories?: string[];
}

interface UseTitleSuggestionsResult {
  suggestions: AITitleSuggestion[];
  isLoading: boolean;
  error: string | null;
  generateSuggestions: (context: {
    topic?: string;
    category?: string;
    keywords?: string[];
    existingTitle?: string;
  }) => Promise<void>;
  clearSuggestions: () => void;
}

export function useTitleSuggestions(
  options: UseTitleSuggestionsOptions = {}
): UseTitleSuggestionsResult {
  const { maxSuggestions = 5 } = options;
  
  const [suggestions, setSuggestions] = useState<AITitleSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSuggestions = useCallback(async (context: {
    topic?: string;
    category?: string;
    keywords?: string[];
    existingTitle?: string;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      // Call AI service endpoint
      const response = await fetch('/api/ai/title-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...context, maxSuggestions }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate suggestions');
      }

      const data = await response.json() as { suggestions: AITitleSuggestion[] };
      setSuggestions(data.suggestions || []);
    } catch (err) {
      // Fallback to local generation if API fails
      const fallbackSuggestions = generateLocalSuggestions(context, maxSuggestions);
      setSuggestions(fallbackSuggestions);
      setError('Using offline suggestions');
    } finally {
      setIsLoading(false);
    }
  }, [maxSuggestions]);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setError(null);
  }, []);

  return {
    suggestions,
    isLoading,
    error,
    generateSuggestions,
    clearSuggestions,
  };
}

// Local fallback suggestion generator
function generateLocalSuggestions(
  context: { topic?: string; category?: string; keywords?: string[]; existingTitle?: string },
  count: number
): AITitleSuggestion[] {
  const templates = [
    '{topic} - Everything You Need to Know',
    'The Ultimate Guide to {topic}',
    'How to Master {topic} in 2024',
    '{topic}: Tips & Tricks for Beginners',
    'Why {topic} Changes Everything',
    '{topic} Explained in 10 Minutes',
    'Live: {topic} Discussion',
    '{topic} Q&A Session',
  ];

  const topic = context.topic || context.keywords?.[0] || 'This Topic';
  
  return templates
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
    .map((template, i) => ({
      title: template.replace('{topic}', topic),
      confidence: 0.8 - (i * 0.1),
    }));
}

// ============================================================================
// AI THUMBNAIL HOOK
// ============================================================================

interface UseThumbnailSuggestionsResult {
  suggestions: AIThumbnailSuggestion[];
  isLoading: boolean;
  error: string | null;
  generateSuggestions: (context: {
    title: string;
    category?: string;
    targetPlatform?: string;
  }) => Promise<void>;
  generateThumbnail: (suggestion: AIThumbnailSuggestion) => Promise<string | null>;
}

export function useThumbnailSuggestions(): UseThumbnailSuggestionsResult {
  const [suggestions, setSuggestions] = useState<AIThumbnailSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSuggestions = useCallback(async (context: {
    title: string;
    category?: string;
    targetPlatform?: string;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/thumbnail-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(context),
      });

      if (!response.ok) {
        throw new Error('Failed to generate thumbnail suggestions');
      }

      const data = await response.json() as { suggestions: AIThumbnailSuggestion[] };
      setSuggestions(data.suggestions || []);
    } catch (err) {
      // Fallback suggestions
      const fallback: AIThumbnailSuggestion[] = [
        {
          prompt: `Bold, eye-catching thumbnail for "${context.title}"`,
          style: 'bold',
          colorPalette: ['#FF0000', '#FFFFFF', '#000000'],
          layoutHint: 'Large text with face close-up',
        },
        {
          prompt: `Clean, professional thumbnail for "${context.title}"`,
          style: 'professional',
          colorPalette: ['#2563EB', '#FFFFFF', '#1E293B'],
          layoutHint: 'Centered title with subtle background',
        },
        {
          prompt: `Minimal thumbnail design for "${context.title}"`,
          style: 'minimal',
          colorPalette: ['#FFFFFF', '#000000', '#888888'],
          layoutHint: 'Simple text on gradient',
        },
      ];
      setSuggestions(fallback);
      setError('Using template suggestions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateThumbnail = useCallback(async (
    suggestion: AIThumbnailSuggestion
  ): Promise<string | null> => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/ai/generate-thumbnail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestion }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate thumbnail');
      }

      const data = await response.json() as { imageUrl: string };
      return data.imageUrl;
    } catch (err) {
      setError('Thumbnail generation unavailable');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    suggestions,
    isLoading,
    error,
    generateSuggestions,
    generateThumbnail,
  };
}

// ============================================================================
// AI SCENE RECOMMENDATIONS HOOK
// ============================================================================

interface UseSceneRecommendationsResult {
  recommendations: AISceneRecommendation[];
  isLoading: boolean;
  dismissRecommendation: (index: number) => void;
  refreshRecommendations: () => void;
}

export function useSceneRecommendations(
  streamContext: {
    isLive: boolean;
    currentScene?: string;
    viewerCount?: number;
    duration?: number;
    audioLevels?: number[];
  }
): UseSceneRecommendationsResult {
  const [recommendations, setRecommendations] = useState<AISceneRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const generateRecommendations = useCallback(() => {
    const recs: AISceneRecommendation[] = [];

    // Audio-based recommendations
    const avgAudio = streamContext.audioLevels?.reduce((a, b) => a + b, 0) || 0;
    if (avgAudio < 0.1 && streamContext.isLive) {
      recs.push({
        type: 'audio',
        suggestion: 'Audio levels are very low. Consider checking your microphone.',
        priority: 'high',
      });
    }

    // Duration-based recommendations
    if (streamContext.duration && streamContext.duration > 3600 && streamContext.isLive) {
      recs.push({
        type: 'overlay',
        suggestion: 'Consider adding a "1 Hour Mark" celebration overlay!',
        priority: 'medium',
      });
    }

    // Viewer engagement recommendations
    if (streamContext.viewerCount && streamContext.viewerCount > 100) {
      recs.push({
        type: 'overlay',
        suggestion: 'High viewer count! Time for a chat interaction or poll.',
        priority: 'medium',
      });
    }

    // General recommendations
    if (streamContext.isLive && !streamContext.currentScene?.includes('camera')) {
      recs.push({
        type: 'layout',
        suggestion: 'Viewers engage more when they can see you. Consider switching to a camera scene.',
        priority: 'low',
      });
    }

    setRecommendations(recs);
  }, [streamContext]);

  const dismissRecommendation = useCallback((index: number) => {
    setRecommendations(prev => prev.filter((_, i) => i !== index));
  }, []);

  const refreshRecommendations = useCallback(() => {
    setIsLoading(true);
    generateRecommendations();
    setIsLoading(false);
  }, [generateRecommendations]);

  return {
    recommendations,
    isLoading,
    dismissRecommendation,
    refreshRecommendations,
  };
}

// ============================================================================
// AI CHAT MODERATION HOOK
// ============================================================================

interface ModerationResult {
  message: string;
  isHarmful: boolean;
  category?: 'spam' | 'hate' | 'harassment' | 'adult' | 'other';
  confidence: number;
  action: 'allow' | 'flag' | 'block';
}

interface UseChatModerationResult {
  moderateMessage: (message: string) => Promise<ModerationResult>;
  isProcessing: boolean;
  stats: {
    total: number;
    blocked: number;
    flagged: number;
  };
}

export function useChatModeration(): UseChatModerationResult {
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState({ total: 0, blocked: 0, flagged: 0 });

  const moderateMessage = useCallback(async (message: string): Promise<ModerationResult> => {
    setIsProcessing(true);
    
    try {
      // Try API
      const response = await fetch('/api/ai/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      if (response.ok) {
        const result = await response.json() as ModerationResult;
        updateStats(result);
        return result;
      }
    } catch (e) {
      // Fallback to local moderation
    }

    // Local fallback moderation
    const result = localModerate(message);
    updateStats(result);
    setIsProcessing(false);
    return result;
  }, []);

  const updateStats = (result: ModerationResult) => {
    setStats(prev => ({
      total: prev.total + 1,
      blocked: prev.blocked + (result.action === 'block' ? 1 : 0),
      flagged: prev.flagged + (result.action === 'flag' ? 1 : 0),
    }));
  };

  return {
    moderateMessage,
    isProcessing,
    stats,
  };
}

// Simple local moderation
function localModerate(message: string): ModerationResult {
  const lowerMessage = message.toLowerCase();
  
  // Very basic spam detection
  if (message.length > 500 || /(.)\1{5,}/.test(message)) {
    return {
      message,
      isHarmful: true,
      category: 'spam',
      confidence: 0.7,
      action: 'flag',
    };
  }

  // Check for common harmful patterns (this is a placeholder - real implementation would use ML)
  const harmfulPatterns = [
    /\b(buy\s+now|limited\s+offer|click\s+here)\b/i,
    /(\w+\.){2,}(com|net|org|io)/i, // URL-like patterns
  ];

  for (const pattern of harmfulPatterns) {
    if (pattern.test(lowerMessage)) {
      return {
        message,
        isHarmful: true,
        category: 'spam',
        confidence: 0.6,
        action: 'flag',
      };
    }
  }

  return {
    message,
    isHarmful: false,
    confidence: 0.8,
    action: 'allow',
  };
}

// ============================================================================
// COMBINED AI ASSISTANT HOOK
// ============================================================================

export interface AIAssistantState {
  isAvailable: boolean;
  quotaUsed: number;
  quotaLimit: number;
  lastError?: string;
}

export function useAIAssistant(userTier: string): AIAssistantState {
  // AI availability based on tier
  const tierLimits: Record<string, number> = {
    guest: 0,
    free: 5,
    creator: 50,
    pro: 500,
    enterprise: -1, // unlimited
  };

  const [quotaUsed, setQuotaUsed] = useState(0);
  const quotaLimit = tierLimits[userTier] ?? 5;
  
  return {
    isAvailable: quotaLimit === -1 || quotaUsed < quotaLimit,
    quotaUsed,
    quotaLimit,
  };
}
