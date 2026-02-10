// Admin Service - Server-enforced admin controls
// Master admin: solutions@pitchmarketing.agency

import { createClient } from '@supabase/supabase-js';

// Admin permission types
export type AdminPermission =
  | 'view_all_users'
  | 'view_all_streams'
  | 'view_all_activity'
  | 'impersonate_user'
  | 'kill_stream'
  | 'disable_destination'
  | 'suspend_account'
  | 'ban_account'
  | 'edit_tiers'
  | 'manage_admins'
  | 'view_revenue'
  | 'manage_marketplace';

export type AdminRole = 'master' | 'admin' | 'moderator';

export interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  role: AdminRole;
  permissions: AdminPermission[];
  active: boolean;
  last_login?: string;
  created_at: string;
}

export interface AdminAction {
  id?: string;
  admin_user_id: string;
  admin_email: string;
  action: string;
  target_type: 'user' | 'stream' | 'vod' | 'destination' | 'account';
  target_id: string;
  reason?: string;
  metadata?: Record<string, unknown>;
  reversible?: boolean;
  created_at?: string;
}

export interface StreamInfo {
  id: string;
  user_id: string;
  title: string;
  status: string;
  started_at: string;
  viewer_count: number;
  user_email?: string;
  user_name?: string;
}

export interface UserInfo {
  id: string;
  email: string;
  display_name?: string;
  tier: string;
  is_suspended: boolean;
  created_at: string;
  last_stream?: string;
  total_streams?: number;
}

const MASTER_ADMINS = ['solutions@pitchmarketing.agency'];

class AdminService {
  private supabase: ReturnType<typeof createClient> | null = null;

  private getClient() {
    if (!this.supabase) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Missing Supabase credentials for admin service');
      }
      
      this.supabase = createClient(supabaseUrl, supabaseServiceKey);
    }
    return this.supabase;
  }

  // ============================================================================
  // AUTH & PERMISSIONS
  // ============================================================================

  async isAdmin(userId: string): Promise<boolean> {
    const client = this.getClient();
    
    const { data, error } = await client
      .from('admin_users')
      .select('id')
      .eq('user_id', userId)
      .eq('active', true)
      .single();
    
    return !error && !!data;
  }

  async isMasterAdmin(userId: string): Promise<boolean> {
    const client = this.getClient();
    
    const { data, error } = await client
      .from('admin_users')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'master')
      .eq('active', true)
      .single();
    
    return !error && !!data;
  }

  async getAdminUser(userId: string): Promise<AdminUser | null> {
    const client = this.getClient();
    
    const { data, error } = await client
      .from('admin_users')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true)
      .single();
    
    if (error || !data) return null;
    return data as AdminUser;
  }

  async hasPermission(userId: string, permission: AdminPermission): Promise<boolean> {
    const admin = await this.getAdminUser(userId);
    if (!admin) return false;
    
    // Master admins have all permissions
    if (admin.role === 'master') return true;
    
    return admin.permissions.includes(permission);
  }

  // ============================================================================
  // USER MANAGEMENT
  // ============================================================================

  async getAllUsers(options: {
    page?: number;
    limit?: number;
    search?: string;
    tier?: string;
    status?: 'active' | 'suspended';
  } = {}): Promise<{ users: UserInfo[]; total: number }> {
    const client = this.getClient();
    const { page = 1, limit = 50, search, tier, status } = options;
    const offset = (page - 1) * limit;

    let query = client
      .from('profiles')
      .select(`
        id,
        email,
        display_name,
        created_at,
        user_tiers!left(tier),
        account_suspensions!left(active)
      `, { count: 'exact' });

    if (search) {
      query = query.or(`email.ilike.%${search}%,display_name.ilike.%${search}%`);
    }

    if (tier) {
      query = query.eq('user_tiers.tier', tier);
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return { users: [], total: 0 };
    }

    const users: UserInfo[] = (data || []).map((u: Record<string, unknown>) => ({
      id: u.id as string,
      email: u.email as string,
      display_name: u.display_name as string | undefined,
      tier: (u.user_tiers as Record<string, unknown>)?.tier as string || 'free',
      is_suspended: (u.account_suspensions as Record<string, unknown>)?.active === true,
      created_at: u.created_at as string,
    }));

    if (status === 'suspended') {
      return { users: users.filter(u => u.is_suspended), total: count || 0 };
    } else if (status === 'active') {
      return { users: users.filter(u => !u.is_suspended), total: count || 0 };
    }

    return { users, total: count || 0 };
  }

  async getUserDetails(userId: string): Promise<UserInfo | null> {
    const client = this.getClient();

    const { data, error } = await client
      .from('profiles')
      .select(`
        id,
        email,
        display_name,
        created_at,
        user_tiers!left(tier, storage_used_mb),
        account_suspensions!left(active, reason, suspended_at),
        streams!left(id, created_at)
      `)
      .eq('id', userId)
      .single();

    if (error || !data) return null;

    // Cast to unknown first to bypass TypeScript's strict checking
    const userData = data as unknown as {
      id: string;
      email: string;
      display_name?: string;
      created_at: string;
      user_tiers?: { tier?: string; storage_used_mb?: number } | null;
      account_suspensions?: { active?: boolean; reason?: string; suspended_at?: string } | null;
      streams?: Array<{ id: string; created_at: string }> | null;
    };

    return {
      id: userData.id,
      email: userData.email,
      display_name: userData.display_name,
      tier: userData.user_tiers?.tier || 'free',
      is_suspended: userData.account_suspensions?.active === true,
      created_at: userData.created_at,
      total_streams: userData.streams?.length || 0,
      last_stream: userData.streams?.[0]?.created_at,
    };
  }

  // ============================================================================
  // STREAM MANAGEMENT
  // ============================================================================

  async getAllLiveStreams(): Promise<StreamInfo[]> {
    const client = this.getClient();

    const { data, error } = await client
      .from('streams')
      .select(`
        id,
        user_id,
        title,
        status,
        started_at,
        viewer_count,
        profiles!left(email, display_name)
      `)
      .eq('status', 'live')
      .order('started_at', { ascending: false });

    if (error) {
      console.error('Error fetching streams:', error);
      return [];
    }

    return (data || []).map((s: Record<string, unknown>) => {
      const profiles = s.profiles as Record<string, unknown> | null;
      return {
        id: s.id as string,
        user_id: s.user_id as string,
        title: s.title as string,
        status: s.status as string,
        started_at: s.started_at as string,
        viewer_count: s.viewer_count as number || 0,
        user_email: profiles?.email as string | undefined,
        user_name: profiles?.display_name as string | undefined,
      };
    });
  }

  async killStream(
    adminUserId: string,
    streamId: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    // Verify admin permission
    if (!await this.hasPermission(adminUserId, 'kill_stream')) {
      return { success: false, error: 'Unauthorized: missing kill_stream permission' };
    }

    const client = this.getClient();
    const admin = await this.getAdminUser(adminUserId);
    if (!admin) return { success: false, error: 'Admin not found' };

    // Update stream status
    const { error: streamError } = await client
      .from('streams')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
      } as never)
      .eq('id', streamId);

    if (streamError) {
      return { success: false, error: streamError.message };
    }

    // Update stream session
    const { error: sessionError } = await client
      .from('stream_sessions')
      .update({
        ended_at: new Date().toISOString(),
        was_killed: true,
        kill_reason: reason,
      } as never)
      .eq('stream_id', streamId);

    if (sessionError) {
      console.error('Error updating session:', sessionError);
    }

    // Log the action
    await this.logAction({
      admin_user_id: admin.id,
      admin_email: admin.email,
      action: 'kill_stream',
      target_type: 'stream',
      target_id: streamId,
      reason,
      reversible: false,
    });

    return { success: true };
  }

  // ============================================================================
  // ACCOUNT MANAGEMENT
  // ============================================================================

  async suspendAccount(
    adminUserId: string,
    targetUserId: string,
    reason: string,
    durationHours?: number
  ): Promise<{ success: boolean; error?: string }> {
    if (!await this.hasPermission(adminUserId, 'suspend_account')) {
      return { success: false, error: 'Unauthorized: missing suspend_account permission' };
    }

    const client = this.getClient();
    const admin = await this.getAdminUser(adminUserId);
    if (!admin) return { success: false, error: 'Admin not found' };

    const expiresAt = durationHours
      ? new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString()
      : null;

    // Create suspension record
    const { error } = await client
      .from('account_suspensions')
      .insert({
        user_id: targetUserId,
        admin_user_id: admin.id,
        admin_email: admin.email,
        reason,
        duration_hours: durationHours || null,
        expires_at: expiresAt,
        active: true,
      } as never);

    if (error) {
      return { success: false, error: error.message };
    }

    // Kill any active streams
    const liveStreams = await this.getAllLiveStreams();
    for (const stream of liveStreams) {
      if (stream.user_id === targetUserId) {
        await this.killStream(adminUserId, stream.id, 'Account suspended');
      }
    }

    // Log the action
    await this.logAction({
      admin_user_id: admin.id,
      admin_email: admin.email,
      action: 'suspend_account',
      target_type: 'account',
      target_id: targetUserId,
      reason,
      metadata: { duration_hours: durationHours },
      reversible: true,
    });

    return { success: true };
  }

  async unsuspendAccount(
    adminUserId: string,
    targetUserId: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!await this.hasPermission(adminUserId, 'suspend_account')) {
      return { success: false, error: 'Unauthorized' };
    }

    const client = this.getClient();
    const admin = await this.getAdminUser(adminUserId);
    if (!admin) return { success: false, error: 'Admin not found' };

    const { error } = await client
      .from('account_suspensions')
      .update({
        active: false,
        lifted_at: new Date().toISOString(),
        lifted_by: admin.id,
      } as never)
      .eq('user_id', targetUserId)
      .eq('active', true);

    if (error) {
      return { success: false, error: error.message };
    }

    await this.logAction({
      admin_user_id: admin.id,
      admin_email: admin.email,
      action: 'unsuspend_account',
      target_type: 'account',
      target_id: targetUserId,
    });

    return { success: true };
  }

  async changeTier(
    adminUserId: string,
    targetUserId: string,
    newTier: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!await this.hasPermission(adminUserId, 'edit_tiers')) {
      return { success: false, error: 'Unauthorized: missing edit_tiers permission' };
    }

    const client = this.getClient();
    const admin = await this.getAdminUser(adminUserId);
    if (!admin) return { success: false, error: 'Admin not found' };

    const validTiers = ['guest', 'free', 'creator', 'pro', 'enterprise'];
    if (!validTiers.includes(newTier)) {
      return { success: false, error: `Invalid tier: ${newTier}` };
    }

    // Upsert tier
    const { error } = await client
      .from('user_tiers')
      .upsert({
        user_id: targetUserId,
        tier: newTier,
        upgraded_at: new Date().toISOString(),
      } as never, { onConflict: 'user_id' });

    if (error) {
      return { success: false, error: error.message };
    }

    await this.logAction({
      admin_user_id: admin.id,
      admin_email: admin.email,
      action: 'change_tier',
      target_type: 'user',
      target_id: targetUserId,
      reason,
      metadata: { new_tier: newTier },
    });

    return { success: true };
  }

  // ============================================================================
  // AUDIT LOG
  // ============================================================================

  async logAction(action: AdminAction): Promise<void> {
    const client = this.getClient();

    const { error } = await client
      .from('admin_actions')
      .insert(action as never);

    if (error) {
      console.error('Error logging admin action:', error);
    }
  }

  async getActionLog(options: {
    page?: number;
    limit?: number;
    adminId?: string;
    targetType?: string;
    action?: string;
  } = {}): Promise<{ actions: AdminAction[]; total: number }> {
    const client = this.getClient();
    const { page = 1, limit = 50, adminId, targetType, action } = options;
    const offset = (page - 1) * limit;

    let query = client
      .from('admin_actions')
      .select('*', { count: 'exact' });

    if (adminId) {
      query = query.eq('admin_user_id', adminId);
    }
    if (targetType) {
      query = query.eq('target_type', targetType);
    }
    if (action) {
      query = query.eq('action', action);
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching action log:', error);
      return { actions: [], total: 0 };
    }

    return { actions: data || [], total: count || 0 };
  }

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  async getDashboardStats(): Promise<{
    totalUsers: number;
    liveStreams: number;
    totalVODs: number;
    suspendedUsers: number;
    tierBreakdown: Record<string, number>;
  }> {
    const client = this.getClient();

    // Run parallel queries
    const [usersResult, streamsResult, vodsResult, suspensionsResult, tiersResult] = await Promise.all([
      client.from('profiles').select('id', { count: 'exact', head: true }),
      client.from('streams').select('id', { count: 'exact', head: true }).eq('status', 'live'),
      client.from('vods').select('id', { count: 'exact', head: true }).eq('status', 'ready'),
      client.from('account_suspensions').select('id', { count: 'exact', head: true }).eq('active', true),
      client.from('user_tiers').select('tier'),
    ]);

    // Calculate tier breakdown
    const tierBreakdown: Record<string, number> = {
      guest: 0,
      free: 0,
      creator: 0,
      pro: 0,
      enterprise: 0,
    };

    if (tiersResult.data) {
      for (const { tier } of tiersResult.data as { tier: string }[]) {
        tierBreakdown[tier] = (tierBreakdown[tier] || 0) + 1;
      }
    }

    return {
      totalUsers: usersResult.count || 0,
      liveStreams: streamsResult.count || 0,
      totalVODs: vodsResult.count || 0,
      suspendedUsers: suspensionsResult.count || 0,
      tierBreakdown,
    };
  }

  // ============================================================================
  // IMPERSONATION (Master admin only)
  // ============================================================================

  async generateImpersonationToken(
    adminUserId: string,
    targetUserId: string,
    reason: string
  ): Promise<{ token?: string; error?: string }> {
    // Only master admins can impersonate
    if (!await this.isMasterAdmin(adminUserId)) {
      return { error: 'Unauthorized: only master admins can impersonate users' };
    }

    const admin = await this.getAdminUser(adminUserId);
    if (!admin) return { error: 'Admin not found' };

    // Log the impersonation attempt
    await this.logAction({
      admin_user_id: admin.id,
      admin_email: admin.email,
      action: 'impersonate_user',
      target_type: 'user',
      target_id: targetUserId,
      reason,
      metadata: { timestamp: new Date().toISOString() },
    });

    // Note: Actual impersonation token generation would require
    // Supabase service role key and custom token generation
    // This is a placeholder that should be implemented with proper security
    return { token: `impersonation-${targetUserId}-${Date.now()}` };
  }
}

// Export singleton
export const adminService = new AdminService();
