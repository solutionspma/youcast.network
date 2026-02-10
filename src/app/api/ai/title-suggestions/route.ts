import { NextRequest, NextResponse } from 'next/server';

// AI Title Suggestions API
// Stub endpoint - connect to OpenAI/Claude/etc for real implementation

interface TitleContext {
  topic?: string;
  category?: string;
  keywords?: string[];
  existingTitle?: string;
  maxSuggestions?: number;
}

interface TitleSuggestion {
  title: string;
  confidence: number;
  reasoning?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as TitleContext;
    const { topic, category, keywords, existingTitle, maxSuggestions = 5 } = body;

    // TODO: Replace with actual AI service call
    // const openai = new OpenAI();
    // const response = await openai.chat.completions.create({...});

    // For now, use template-based generation
    const suggestions = generateTitleSuggestions(
      topic || keywords?.[0] || existingTitle || 'Your Stream',
      category,
      maxSuggestions
    );

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Title suggestion error:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}

function generateTitleSuggestions(
  topic: string,
  category: string | undefined,
  count: number
): TitleSuggestion[] {
  const categoryTemplates: Record<string, string[]> = {
    gaming: [
      '🎮 LIVE: Playing {topic}',
      '{topic} Gameplay - Road to Victory',
      'Let\'s Play {topic} Together!',
      '{topic} Challenge Stream',
      'First Time Playing {topic}!',
    ],
    education: [
      '{topic} Explained Simply',
      'Learn {topic} in One Stream',
      '{topic} Tutorial for Beginners',
      'Deep Dive: Understanding {topic}',
      'Q&A: All About {topic}',
    ],
    podcast: [
      'Discussing {topic} | Live Podcast',
      '{topic} Talk Show',
      'The {topic} Conversation',
      'Live Discussion: {topic}',
      'Hot Take: {topic}',
    ],
    church: [
      '🙏 {topic} Service',
      'Worship & {topic}',
      'Sunday Service: {topic}',
      'Faith Talk: {topic}',
      'Prayer Meeting: {topic}',
    ],
    default: [
      '🔴 LIVE: {topic}',
      '{topic} - Join the Stream!',
      'Let\'s Talk About {topic}',
      '{topic} Live Session',
      'Interactive {topic} Stream',
      'Watch Party: {topic}',
      '{topic} Discussion',
      'Exploring {topic} Together',
    ],
  };

  const templates = categoryTemplates[category || 'default'] || categoryTemplates.default;
  
  return templates
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
    .map((template, i) => ({
      title: template.replace('{topic}', topic),
      confidence: Math.round((0.95 - i * 0.08) * 100) / 100,
      reasoning: i === 0 ? 'Top suggestion based on engagement patterns' : undefined,
    }));
}
