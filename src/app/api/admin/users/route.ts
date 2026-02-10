import { NextRequest, NextResponse } from 'next/server';
import { adminService } from '@/lib/admin/adminService';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

interface CookieToSet {
  name: string;
  value: string;
  options: CookieOptions;
}

async function verifyAdmin(request: NextRequest) {
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
  
  if (!user) {
    return { error: 'Unauthorized', status: 401 };
  }

  const isAdmin = await adminService.isAdmin(user.id);
  if (!isAdmin) {
    return { error: 'Forbidden', status: 403 };
  }

  return { user };
}

// GET /api/admin/users - List users with filtering
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const search = searchParams.get('search') || undefined;
  const tier = searchParams.get('tier') || undefined;
  const status = searchParams.get('status') as 'active' | 'suspended' | undefined;

  try {
    const result = await adminService.getAllUsers({
      page,
      limit,
      search,
      tier,
      status,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Admin users API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
