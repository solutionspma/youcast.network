// ============================================================================
// ADMIN API - Streams Endpoint
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
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

interface StreamRow {
  id: string;
  title: string;
  status: string;
  viewer_count: number;
  started_at: string | null;
  owner_id: string;
  profiles?: { email: string; display_name: string | null } | null;
}

export async function GET(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
  
  const supabase = getSupabaseAdmin();
  
  try {
    let query = supabase
      .from('streams')
      .select(`
        id,
        title,
        status,
        viewer_count,
        started_at,
        owner_id,
        profiles!inner(email, display_name)
      `)
      .order('started_at', { ascending: false })
      .limit(limit);
      
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Admin streams error:', error);
      return NextResponse.json({ error: 'Failed to fetch streams' }, { status: 500 });
    }
    
    const streams = (data || []).map((s: any) => ({
      id: s.id,
      title: s.title,
      status: s.status,
      viewer_count: s.viewer_count || 0,
      started_at: s.started_at,
      owner_id: s.owner_id,
      owner_email: Array.isArray(s.profiles) ? s.profiles[0]?.email : s.profiles?.email,
      owner_name: Array.isArray(s.profiles) ? s.profiles[0]?.display_name : s.profiles?.display_name,
    }));
    
    return NextResponse.json({ streams });
  } catch (error) {
    console.error('Admin streams error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
