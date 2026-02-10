import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Types for Supabase query results
interface StreamRow {
  id: string;
  title: string;
  thumbnail_url: string | null;
  user_id: string;
  viewer_count: number | null;
  started_at: string;
  profiles: { display_name?: string } | null;
}

interface VodRow {
  id: string;
  title: string;
  thumbnail_url: string | null;
  user_id: string;
  view_count: number | null;
  duration: number | null;
  recorded_at: string | null;
  created_at: string;
  profiles: { display_name?: string } | null;
}

// GET /api/trending - Get trending content (live streams + VODs)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
  const hours = Math.min(parseInt(searchParams.get('hours') || '24'), 168); // max 7 days
  const includeLive = searchParams.get('live') !== 'false';
  const includeVods = searchParams.get('vods') !== 'false';

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Call the database function
    const { data, error } = await supabase.rpc('get_trending_content', {
      time_window: `${hours} hours`,
      content_limit: limit,
      include_live: includeLive,
      include_vods: includeVods,
    });

    if (error) {
      console.error('Error fetching trending:', error);
      
      // Fallback to direct query if function doesn't exist
      return await fallbackTrending(supabase as SupabaseClient, limit, includeLive, includeVods, hours);
    }

    return NextResponse.json({
      content: data || [],
      meta: {
        timeWindow: `${hours} hours`,
        includeLive,
        includeVods,
      },
    });
  } catch (error) {
    console.error('Trending API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Fallback if the RPC function doesn't exist
async function fallbackTrending(
  supabase: SupabaseClient,
  limit: number,
  includeLive: boolean,
  includeVods: boolean,
  hours: number
) {
  const results: TrendingItem[] = [];

  // Get live streams
  if (includeLive) {
    const { data: streams } = await supabase
      .from('streams')
      .select(`
        id,
        title,
        thumbnail_url,
        user_id,
        viewer_count,
        started_at,
        profiles!inner(display_name)
      `)
      .eq('status', 'live')
      .order('viewer_count', { ascending: false })
      .limit(Math.ceil(limit / 2));

    if (streams) {
      for (const s of streams as StreamRow[]) {
        const profile = s.profiles;
        results.push({
          id: s.id,
          title: s.title,
          thumbnail_url: s.thumbnail_url,
          creator_id: s.user_id,
          creator_name: profile?.display_name || 'Unknown',
          view_count: s.viewer_count || 0,
          is_live: true,
          duration: Math.floor((Date.now() - new Date(s.started_at).getTime()) / 1000),
          started_at: s.started_at,
          trend_score: (s.viewer_count || 0) * 2,
        });
      }
    }
  }

  // Get VODs
  if (includeVods) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    
    const { data: vods } = await supabase
      .from('vods')
      .select(`
        id,
        title,
        thumbnail_url,
        user_id,
        view_count,
        duration,
        recorded_at,
        created_at,
        profiles!inner(display_name)
      `)
      .eq('status', 'ready')
      .eq('visibility', 'public')
      .gte('created_at', since)
      .order('view_count', { ascending: false })
      .limit(Math.ceil(limit / 2));

    if (vods) {
      for (const v of vods as VodRow[]) {
        const profile = v.profiles;
        const ageHours = (Date.now() - new Date(v.created_at).getTime()) / (1000 * 60 * 60);
        results.push({
          id: v.id,
          title: v.title,
          thumbnail_url: v.thumbnail_url,
          creator_id: v.user_id,
          creator_name: profile?.display_name || 'Unknown',
          view_count: v.view_count || 0,
          is_live: false,
          duration: v.duration || 0,
          started_at: v.recorded_at || v.created_at,
          trend_score: (v.view_count || 0) / Math.max(1, ageHours),
        });
      }
    }
  }

  // Sort by trend score
  results.sort((a, b) => b.trend_score - a.trend_score);

  return NextResponse.json({
    content: results.slice(0, limit),
    meta: {
      timeWindow: `${hours} hours`,
      includeLive,
      includeVods,
      fallback: true,
    },
  });
}

interface TrendingItem {
  id: string;
  title: string;
  thumbnail_url: string | null;
  creator_id: string;
  creator_name: string;
  view_count: number;
  is_live: boolean;
  duration: number;
  started_at: string;
  trend_score: number;
}
