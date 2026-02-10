// ============================================================================
// ADMIN API - Stats Endpoint
// ============================================================================

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient, CookieOptions } from '@supabase/ssr';

type CookieToSet = { name: string; value: string; options: CookieOptions };

async function getAdminUser() {
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
          cookiesToSet.forEach(({ name, value, options }: CookieToSet) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('global_admin')
    .eq('id', user.id)
    .single();
    
  if (!profile?.global_admin) return null;
  
  return user;
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const supabase = getSupabaseAdmin();
  
  try {
    // Get counts in parallel
    const [usersResult, streamsResult, videosResult, suspendedResult] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('streams').select('*', { count: 'exact', head: true }).eq('status', 'live'),
      supabase.from('videos').select('*', { count: 'exact', head: true }).eq('status', 'ready'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_suspended', true),
    ]);
    
    // Get tier breakdown
    const { data: tierData } = await supabase
      .from('profiles')
      .select('tier');
      
    const tierBreakdown: Record<string, number> = {};
    (tierData || []).forEach((p: { tier: string | null }) => {
      const tier = p.tier || 'free';
      tierBreakdown[tier] = (tierBreakdown[tier] || 0) + 1;
    });
    
    // Get recent activity
    const { data: activityData } = await supabase
      .from('activity_log')
      .select('actor_id, action, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    return NextResponse.json({
      totalUsers: usersResult.count || 0,
      activeStreams: streamsResult.count || 0,
      totalVideos: videosResult.count || 0,
      suspendedUsers: suspendedResult.count || 0,
      tierBreakdown,
      recentActivity: activityData || [],
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
