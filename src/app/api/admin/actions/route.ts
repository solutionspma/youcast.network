import { NextRequest, NextResponse } from 'next/server';
import { adminService } from '@/lib/admin/adminService';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

interface CookieToSet {
  name: string;
  value: string;
  options: CookieOptions;
}

async function verifyAdmin() {
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

// GET /api/admin/actions - Get admin action log
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const adminId = searchParams.get('adminId') || undefined;
  const targetType = searchParams.get('targetType') || undefined;
  const action = searchParams.get('action') || undefined;

  try {
    const result = await adminService.getActionLog({
      page,
      limit,
      adminId,
      targetType,
      action,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Admin actions API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/actions - Execute admin action
export async function POST(request: NextRequest) {
  const auth = await verifyAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { action, ...params } = body;

    let result: { success: boolean; error?: string };

    switch (action) {
      case 'kill_stream': {
        const { streamId, reason } = params;
        if (!streamId || !reason) {
          return NextResponse.json(
            { error: 'streamId and reason required' },
            { status: 400 }
          );
        }
        result = await adminService.killStream(auth.user.id, streamId, reason);
        break;
      }

      case 'suspend_account': {
        const { userId, reason, durationHours } = params;
        if (!userId || !reason) {
          return NextResponse.json(
            { error: 'userId and reason required' },
            { status: 400 }
          );
        }
        result = await adminService.suspendAccount(auth.user.id, userId, reason, durationHours);
        break;
      }

      case 'unsuspend_account': {
        const { userId } = params;
        if (!userId) {
          return NextResponse.json(
            { error: 'userId required' },
            { status: 400 }
          );
        }
        result = await adminService.unsuspendAccount(auth.user.id, userId);
        break;
      }

      case 'change_tier': {
        const { userId, newTier, reason } = params;
        if (!userId || !newTier) {
          return NextResponse.json(
            { error: 'userId and newTier required' },
            { status: 400 }
          );
        }
        result = await adminService.changeTier(auth.user.id, userId, newTier, reason || 'Admin change');
        break;
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: result.error || 'Action failed' },
        { status: 500 }
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
