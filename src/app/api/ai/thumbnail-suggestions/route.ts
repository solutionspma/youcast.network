import { NextRequest, NextResponse } from 'next/server';

// AI Thumbnail Suggestions API
// Returns style suggestions for thumbnail creation
// Actual image generation requires integration with DALL-E, Stable Diffusion, etc.

interface ThumbnailContext {
  title: string;
  category?: string;
  targetPlatform?: string;
}

interface ThumbnailSuggestion {
  prompt: string;
  style: 'bold' | 'minimal' | 'professional' | 'playful';
  colorPalette: string[];
  layoutHint: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ThumbnailContext;
    const { title, category, targetPlatform } = body;

    // Generate suggestions based on title and category
    const suggestions = generateThumbnailSuggestions(title, category, targetPlatform);

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Thumbnail suggestion error:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}

function generateThumbnailSuggestions(
  title: string,
  category?: string,
  platform?: string
): ThumbnailSuggestion[] {
  const categoryStyles: Record<string, ThumbnailSuggestion[]> = {
    gaming: [
      {
        prompt: `Gaming thumbnail with dynamic action pose for "${title}"`,
        style: 'bold',
        colorPalette: ['#FF0000', '#FFFF00', '#000000'],
        layoutHint: 'Diagonal composition with character focus',
      },
      {
        prompt: `Neon gaming aesthetic for "${title}"`,
        style: 'playful',
        colorPalette: ['#00FF88', '#FF00FF', '#000033'],
        layoutHint: 'Cyberpunk style with glowing effects',
      },
    ],
    education: [
      {
        prompt: `Clean educational thumbnail for "${title}"`,
        style: 'professional',
        colorPalette: ['#2563EB', '#FFFFFF', '#1E293B'],
        layoutHint: 'Clear text with supporting icons',
      },
      {
        prompt: `Whiteboard style thumbnail for "${title}"`,
        style: 'minimal',
        colorPalette: ['#FFFFFF', '#333333', '#3B82F6'],
        layoutHint: 'Hand-drawn elements on white background',
      },
    ],
    podcast: [
      {
        prompt: `Podcast cover style for "${title}"`,
        style: 'professional',
        colorPalette: ['#1F1F1F', '#FFFFFF', '#F59E0B'],
        layoutHint: 'Host photo with episode title',
      },
      {
        prompt: `Modern podcast thumbnail for "${title}"`,
        style: 'minimal',
        colorPalette: ['#000000', '#FFFFFF', '#EF4444'],
        layoutHint: 'Centered text with gradient backdrop',
      },
    ],
    church: [
      {
        prompt: `Inspirational church thumbnail for "${title}"`,
        style: 'professional',
        colorPalette: ['#7C3AED', '#FBBF24', '#FFFFFF'],
        layoutHint: 'Warm lighting with faith symbols',
      },
      {
        prompt: `Serene worship thumbnail for "${title}"`,
        style: 'minimal',
        colorPalette: ['#FDF7ED', '#92400E', '#1E3A8A'],
        layoutHint: 'Soft gradients with scripture reference',
      },
    ],
  };

  const defaultSuggestions: ThumbnailSuggestion[] = [
    {
      prompt: `Bold, attention-grabbing thumbnail with "${title}" as main focus`,
      style: 'bold',
      colorPalette: ['#FF0000', '#FFFFFF', '#000000'],
      layoutHint: 'Large expressive face with big text overlay',
    },
    {
      prompt: `Clean, modern thumbnail for "${title}"`,
      style: 'professional',
      colorPalette: ['#2563EB', '#FFFFFF', '#1E293B'],
      layoutHint: 'Centered composition with clear hierarchy',
    },
    {
      prompt: `Minimalist thumbnail design for "${title}"`,
      style: 'minimal',
      colorPalette: ['#FFFFFF', '#000000', '#888888'],
      layoutHint: 'Simple text on solid or gradient background',
    },
    {
      prompt: `Fun, energetic thumbnail for "${title}"`,
      style: 'playful',
      colorPalette: ['#8B5CF6', '#EC4899', '#10B981'],
      layoutHint: 'Dynamic angles with emoji or stickers',
    },
  ];

  // Get category-specific suggestions or use defaults
  const categorySuggestions = categoryStyles[category || ''] || [];
  
  // Combine with defaults, prioritizing category-specific
  const allSuggestions = [...categorySuggestions, ...defaultSuggestions];
  
  // Apply platform-specific adjustments
  if (platform === 'youtube-shorts' || platform === 'tiktok') {
    return allSuggestions.map(s => ({
      ...s,
      layoutHint: s.layoutHint + ' (vertical orientation)',
    })).slice(0, 4);
  }

  return allSuggestions.slice(0, 4);
}
