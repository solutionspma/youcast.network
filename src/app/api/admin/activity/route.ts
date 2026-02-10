// ============================================================================
// ADMIN API - Activity Log Endpoint
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

export async function GET(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
  const category = searchParams.get('category');
  const action = searchParams.get('action');
  
  const supabase = getSupabaseAdmin();
  
  try {
    let query = supabase
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (category) {
      query = query.eq('action_category', category);
    }
    
    if (action) {
      query = query.eq('action', action);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Admin activity error:', error);
      return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
    }
    
    return NextResponse.json({ logs: data || [] });
  } catch (error) {
    console.error('Admin activity error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
