import { NextRequest, NextResponse } from 'next/server';
import { adminService } from '@/lib/admin/adminService';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { CookieOptions } from '@supabase/ssr';

type CookieToSet = { name: string; value: string; options: CookieOptions };

// Helper to get current user and verify admin
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
          cookiesToSet.forEach(({ name, value, options }: CookieToSet) =>
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
    return { error: 'Forbidden: Admin access required', status: 403 };
  }

  return { user, admin: await adminService.getAdminUser(user.id) };
}

// GET /api/admin - Get admin dashboard stats and live streams
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    // Get dashboard stats and live streams in parallel
    const [stats, liveStreams] = await Promise.all([
      adminService.getDashboardStats(),
      adminService.getAllLiveStreams(),
    ]);

    return NextResponse.json({
      stats,
      liveStreams,
      admin: {
        email: auth.admin?.email,
        role: auth.admin?.role,
        permissions: auth.admin?.permissions,
      },
    });
  } catch (error) {
    console.error('Admin API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin - Execute admin actions
export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'kill_stream': {
        const { streamId, reason } = params;
        if (!streamId || !reason) {
          return NextResponse.json(
            { error: 'Missing streamId or reason' },
            { status: 400 }
          );
        }
        const result = await adminService.killStream(auth.user.id, streamId, reason);
        return NextResponse.json(result);
      }

      case 'suspend_account': {
        const { userId, reason, durationHours } = params;
        if (!userId || !reason) {
          return NextResponse.json(
            { error: 'Missing userId or reason' },
            { status: 400 }
          );
        }
        const result = await adminService.suspendAccount(
          auth.user.id,
          userId,
          reason,
          durationHours
        );
        return NextResponse.json(result);
      }

      case 'unsuspend_account': {
        const { userId } = params;
        if (!userId) {
          return NextResponse.json(
            { error: 'Missing userId' },
            { status: 400 }
          );
        }
        const result = await adminService.unsuspendAccount(auth.user.id, userId);
        return NextResponse.json(result);
      }

      case 'change_tier': {
        const { userId, newTier, reason } = params;
        if (!userId || !newTier || !reason) {
          return NextResponse.json(
            { error: 'Missing userId, newTier, or reason' },
            { status: 400 }
          );
        }
        const result = await adminService.changeTier(
          auth.user.id,
          userId,
          newTier,
          reason
        );
        return NextResponse.json(result);
      }

      case 'impersonate': {
        const { userId, reason } = params;
        if (!userId || !reason) {
          return NextResponse.json(
            { error: 'Missing userId or reason' },
            { status: 400 }
          );
        }
        const result = await adminService.generateImpersonationToken(
          auth.user.id,
          userId,
          reason
        );
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Admin action error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
