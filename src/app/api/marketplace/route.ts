import { NextRequest, NextResponse } from 'next/server';
import { marketplaceService } from '@/lib/marketplace/marketplaceService';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { PresetCategory } from '@/types/marketplace';

interface CookieToSet {
  name: string;
  value: string;
  options: CookieOptions;
}

async function getUser() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async getAll() {
          return cookieStore.getAll();
        },
        async setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// GET /api/marketplace - Browse marketplace
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const query = {
    search: searchParams.get('search') || undefined,
    category: searchParams.get('category') as PresetCategory | undefined,
    tags: searchParams.get('tags')?.split(',').filter(Boolean) || undefined,
    sortBy: searchParams.get('sortBy') as 'popular' | 'newest' | 'rating' | 'price-low' | 'price-high' | undefined,
    page: parseInt(searchParams.get('page') || '1'),
    limit: Math.min(parseInt(searchParams.get('limit') || '20'), 50),
    freeOnly: searchParams.get('freeOnly') === 'true',
    verified: searchParams.get('verified') === 'true',
    priceRange: searchParams.get('minPrice') || searchParams.get('maxPrice')
      ? {
          min: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
          max: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
        }
      : undefined,
  };

  try {
    const result = await marketplaceService.browse(query);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Marketplace browse error:', error);
    return NextResponse.json(
      { error: 'Failed to browse marketplace' },
      { status: 500 }
    );
  }
}

// POST /api/marketplace - Purchase or favorite
export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, presetId, ...params } = body;

    switch (action) {
      case 'purchase': {
        const result = await marketplaceService.purchase(user.id, presetId, params);
        return NextResponse.json(result);
      }

      case 'favorite': {
        const isFavorited = await marketplaceService.toggleFavorite(user.id, presetId);
        return NextResponse.json({ success: true, favorited: isFavorited });
      }

      case 'review': {
        const { rating, comment } = params;
        const result = await marketplaceService.addReview(user.id, presetId, rating, comment);
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Marketplace action error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
