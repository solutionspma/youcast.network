'use client';

// ============================================================================
// ADMIN CONTROL PANEL
// Visible ONLY if user.global_admin === true OR master account
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isMasterAccount } from '@/lib/auth/master';

// ─── Inline SVG Icons ────────────────────────────────────────────────────────

const Icons = {
  Search: ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  Users: ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  Radio: ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
    </svg>
  ),
  HardDrive: ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7c-2 0-3 1-3 3zm0 9h16M8 16h.01M12 16h.01" />
    </svg>
  ),
  AlertTriangle: ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  Shield: ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  Ban: ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
  ),
  Eye: ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  RefreshCw: ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  ChevronRight: ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  ),
  Activity: ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  ),
  Zap: ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  Clock: ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  ArrowUpRight: ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7m10 0v10" />
    </svg>
  ),
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface AdminUser {
  id: string;
  email: string;
  display_name: string | null;
  tier: string;
  role: string;
  global_admin: boolean;
  is_suspended: boolean;
  is_verified: boolean;
  created_at: string;
}

interface AdminStream {
  id: string;
  title: string;
  status: string;
  viewer_count: number;
  started_at: string | null;
  owner_id: string;
  owner_email?: string;
  owner_name?: string;
}

interface AdminStats {
  totalUsers: number;
  activeStreams: number;
  totalVideos: number;
  suspendedUsers: number;
  tierBreakdown: Record<string, number>;
  recentActivity: Array<{
    actor_id: string;
    action: string;
    created_at: string;
  }>;
}

interface ActivityLogEntry {
  id: string;
  actor_id: string;
  target_user_id: string | null;
  action: string;
  action_category: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ─── Admin Service Functions ─────────────────────────────────────────────────

async function fetchAdminStats(): Promise<AdminStats | null> {
  try {
    const res = await fetch('/api/admin/stats');
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function fetchUsers(search?: string): Promise<AdminUser[]> {
  try {
    const url = search 
      ? `/api/admin/users?search=${encodeURIComponent(search)}` 
      : '/api/admin/users';
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return data.users || [];
  } catch {
    return [];
  }
}

async function fetchLiveStreams(): Promise<AdminStream[]> {
  try {
    const res = await fetch('/api/admin/streams?status=live');
    if (!res.ok) return [];
    const data = await res.json();
    return data.streams || [];
  } catch {
    return [];
  }
}

async function fetchActivityLog(): Promise<ActivityLogEntry[]> {
  try {
    const res = await fetch('/api/admin/activity');
    if (!res.ok) return [];
    const data = await res.json();
    return data.logs || [];
  } catch {
    return [];
  }
}

// ─── Admin Actions ───────────────────────────────────────────────────────────

async function killStream(streamId: string, reason: string): Promise<boolean> {
  try {
    const res = await fetch('/api/admin/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'kill_stream', streamId, reason }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function suspendAccount(userId: string, reason: string, durationHours?: number): Promise<boolean> {
  try {
    const res = await fetch('/api/admin/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'suspend_account', userId, reason, durationHours }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function unsuspendAccount(userId: string): Promise<boolean> {
  try {
    const res = await fetch('/api/admin/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'unsuspend_account', userId }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function changeTier(userId: string, newTier: string, reason: string): Promise<boolean> {
  try {
    const res = await fetch('/api/admin/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'change_tier', userId, newTier, reason }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Components ──────────────────────────────────────────────────────────────

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  trend,
  color = 'blue' 
}: { 
  icon: (props: { className?: string }) => JSX.Element;
  label: string;
  value: string | number;
  trend?: string;
  color?: 'blue' | 'green' | 'red' | 'yellow';
}) {
  const colors = {
    blue: 'bg-blue-500/10 text-blue-500',
    green: 'bg-green-500/10 text-green-500',
    red: 'bg-red-500/10 text-red-500',
    yellow: 'bg-yellow-500/10 text-yellow-500',
  };
  
  return (
    <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm text-zinc-400">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {trend && (
            <p className="text-xs text-zinc-500">{trend}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function UserRow({ 
  user, 
  onSelect, 
  isSelected 
}: { 
  user: AdminUser;
  onSelect: () => void;
  isSelected: boolean;
}) {
  return (
    <div 
      className={`p-3 rounded-lg cursor-pointer transition-colors ${
        isSelected 
          ? 'bg-blue-500/20 border border-blue-500/50' 
          : 'bg-zinc-900 border border-zinc-800 hover:bg-zinc-800'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-medium">
            {(user.display_name || user.email)[0].toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-white">
              {user.display_name || user.email.split('@')[0]}
            </p>
            <p className="text-xs text-zinc-400">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
            user.tier === 'enterprise' ? 'bg-purple-500/20 text-purple-400' :
            user.tier === 'pro' ? 'bg-blue-500/20 text-blue-400' :
            user.tier === 'creator' ? 'bg-green-500/20 text-green-400' :
            'bg-zinc-700 text-zinc-400'
          }`}>
            {user.tier}
          </span>
          {user.is_suspended && (
            <Icons.Ban className="w-4 h-4 text-red-500" />
          )}
          {user.global_admin && (
            <Icons.Shield className="w-4 h-4 text-yellow-500" />
          )}
          <Icons.ChevronRight className="w-4 h-4 text-zinc-500" />
        </div>
      </div>
    </div>
  );
}

function StreamCard({ 
  stream, 
  onKill 
}: { 
  stream: AdminStream;
  onKill: (streamId: string) => void;
}) {
  const duration = stream.started_at 
    ? Math.floor((Date.now() - new Date(stream.started_at).getTime()) / 1000 / 60)
    : 0;
    
  return (
    <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <h4 className="font-medium text-white">{stream.title}</h4>
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            {stream.owner_name || stream.owner_email || stream.owner_id}
          </p>
          <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <Icons.Eye className="w-3 h-3" />
              {stream.viewer_count} viewers
            </span>
            <span className="flex items-center gap-1">
              <Icons.Clock className="w-3 h-3" />
              {duration}m
            </span>
          </div>
        </div>
        <button
          onClick={() => onKill(stream.id)}
          className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-colors flex items-center gap-1"
        >
          <Icons.Zap className="w-4 h-4" />
          Kill
        </button>
      </div>
    </div>
  );
}

function UserInspector({ 
  user, 
  onClose,
  onAction,
}: { 
  user: AdminUser;
  onClose: () => void;
  onAction: () => void;
}) {
  const [newTier, setNewTier] = useState(user.tier);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendDuration, setSuspendDuration] = useState('24');
  const [tierReason, setTierReason] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSuspend = async () => {
    if (!suspendReason) return;
    setLoading(true);
    const hours = suspendDuration ? parseInt(suspendDuration) : undefined;
    const success = await suspendAccount(user.id, suspendReason, hours);
    setLoading(false);
    if (success) {
      onAction();
    }
  };
  
  const handleUnsuspend = async () => {
    setLoading(true);
    const success = await unsuspendAccount(user.id);
    setLoading(false);
    if (success) {
      onAction();
    }
  };
  
  const handleChangeTier = async () => {
    if (newTier === user.tier || !tierReason) return;
    setLoading(true);
    const success = await changeTier(user.id, newTier, tierReason);
    setLoading(false);
    if (success) {
      onAction();
    }
  };
  
  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center text-lg font-medium">
            {(user.display_name || user.email)[0].toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              {user.display_name || user.email}
            </h3>
            <p className="text-sm text-zinc-400">{user.email}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-white transition-colors"
        >
          &times;
        </button>
      </div>
      
      {/* User Details */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-zinc-800 rounded-lg p-3">
          <p className="text-xs text-zinc-400 mb-1">Role</p>
          <p className="text-sm font-medium text-white">{user.role}</p>
        </div>
        <div className="bg-zinc-800 rounded-lg p-3">
          <p className="text-xs text-zinc-400 mb-1">Tier</p>
          <p className="text-sm font-medium text-white">{user.tier}</p>
        </div>
        <div className="bg-zinc-800 rounded-lg p-3">
          <p className="text-xs text-zinc-400 mb-1">Status</p>
          <p className={`text-sm font-medium ${user.is_suspended ? 'text-red-400' : 'text-green-400'}`}>
            {user.is_suspended ? 'Suspended' : 'Active'}
          </p>
        </div>
        <div className="bg-zinc-800 rounded-lg p-3">
          <p className="text-xs text-zinc-400 mb-1">Joined</p>
          <p className="text-sm font-medium text-white">
            {new Date(user.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
      
      {/* Tier Change */}
      <div className="border-t border-zinc-800 pt-4 mb-4">
        <h4 className="text-sm font-medium text-white mb-3">Change Tier</h4>
        <div className="flex gap-2 mb-2">
          <select
            value={newTier}
            onChange={(e) => setNewTier(e.target.value)}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
          >
            <option value="guest">Guest</option>
            <option value="free">Free</option>
            <option value="creator">Creator</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>
        <input
          type="text"
          placeholder="Reason for tier change"
          value={tierReason}
          onChange={(e) => setTierReason(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white mb-2"
        />
        <button
          onClick={handleChangeTier}
          disabled={loading || newTier === user.tier || !tierReason}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors"
        >
          Update Tier
        </button>
      </div>
      
      {/* Suspension */}
      <div className="border-t border-zinc-800 pt-4">
        <h4 className="text-sm font-medium text-white mb-3">
          {user.is_suspended ? 'Account Suspended' : 'Suspend Account'}
        </h4>
        
        {user.is_suspended ? (
          <button
            onClick={handleUnsuspend}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors"
          >
            Unsuspend Account
          </button>
        ) : (
          <>
            <input
              type="text"
              placeholder="Suspension reason"
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white mb-2"
            />
            <div className="flex gap-2">
              <select
                value={suspendDuration}
                onChange={(e) => setSuspendDuration(e.target.value)}
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="24">24 hours</option>
                <option value="72">3 days</option>
                <option value="168">1 week</option>
                <option value="720">30 days</option>
                <option value="">Permanent</option>
              </select>
              <button
                onClick={handleSuspend}
                disabled={loading || !suspendReason}
                className="px-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
              >
                Suspend
              </button>
            </div>
          </>
        )}
      </div>
      
      {/* Quick Actions */}
      <div className="border-t border-zinc-800 pt-4 mt-4">
        <h4 className="text-sm font-medium text-white mb-3">Quick Actions</h4>
        <div className="flex flex-wrap gap-2">
          <button className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm transition-colors flex items-center gap-1">
            <Icons.Eye className="w-4 h-4" />
            View Sessions
          </button>
          <button className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm transition-colors flex items-center gap-1">
            <Icons.HardDrive className="w-4 h-4" />
            View Storage
          </button>
          <button className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm transition-colors flex items-center gap-1">
            <Icons.ArrowUpRight className="w-4 h-4" />
            Impersonate
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Admin Panel ────────────────────────────────────────────────────────

export function AdminControlPanel() {
  const supabase = createClient();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [streams, setStreams] = useState<AdminStream[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'streams' | 'activity'>('users');
  const [loading, setLoading] = useState(true);
  const [killModalStream, setKillModalStream] = useState<string | null>(null);
  const [killReason, setKillReason] = useState('');

  // Check if current user is admin
  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAdmin(false);
        return;
      }
      
      // Master account always has admin access
      if (isMasterAccount(user.email)) {
        setIsAdmin(true);
        return;
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('global_admin')
        .eq('id', user.id)
        .single();
        
      setIsAdmin(profile?.global_admin === true);
    }
    checkAdmin();
  }, [supabase]);
  
  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    const [statsData, usersData, streamsData, activityData] = await Promise.all([
      fetchAdminStats(),
      fetchUsers(searchQuery),
      fetchLiveStreams(),
      fetchActivityLog(),
    ]);
    setStats(statsData);
    setUsers(usersData);
    setStreams(streamsData);
    setActivityLog(activityData);
    setLoading(false);
  }, [searchQuery]);
  
  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin, loadData]);
  
  // Search users
  useEffect(() => {
    if (isAdmin && searchQuery) {
      const timer = setTimeout(() => {
        fetchUsers(searchQuery).then(setUsers);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, isAdmin]);
  
  // Kill stream handler
  const handleKillStream = async () => {
    if (!killModalStream || !killReason) return;
    const success = await killStream(killModalStream, killReason);
    if (success) {
      setKillModalStream(null);
      setKillReason('');
      loadData();
    }
  };
  
  // Not admin - show nothing
  if (isAdmin === false) {
    return null;
  }
  
  // Loading admin check
  if (isAdmin === null) {
    return (
      <div className="flex items-center justify-center h-64">
        <Icons.RefreshCw className="w-6 h-6 text-zinc-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Icons.Shield className="w-8 h-8 text-yellow-500" />
          <div>
            <h1 className="text-2xl font-bold">Admin Control Panel</h1>
            <p className="text-sm text-zinc-400">Global admin access</p>
          </div>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
        >
          <Icons.RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard 
          icon={Icons.Users} 
          label="Total Users" 
          value={stats?.totalUsers || 0}
          color="blue"
        />
        <StatCard 
          icon={Icons.Radio} 
          label="Live Streams" 
          value={stats?.activeStreams || 0}
          color="green"
        />
        <StatCard 
          icon={Icons.HardDrive} 
          label="Total Videos" 
          value={stats?.totalVideos || 0}
          color="blue"
        />
        <StatCard 
          icon={Icons.Ban} 
          label="Suspended" 
          value={stats?.suspendedUsers || 0}
          color="red"
        />
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Lists */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'users' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('streams')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'streams' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              Live Streams
              {streams.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                  {streams.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'activity' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              Activity Log
            </button>
          </div>
          
          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
              <div className="relative mb-4">
                <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search users by email or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-zinc-500"
                />
              </div>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {users.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    onSelect={() => setSelectedUser(user)}
                    isSelected={selectedUser?.id === user.id}
                  />
                ))}
                {users.length === 0 && (
                  <p className="text-center text-zinc-500 py-8">No users found</p>
                )}
              </div>
            </div>
          )}
          
          {/* Streams Tab */}
          {activeTab === 'streams' && (
            <div className="space-y-4">
              {streams.length > 0 ? (
                streams.map((stream) => (
                  <StreamCard
                    key={stream.id}
                    stream={stream}
                    onKill={(id) => setKillModalStream(id)}
                  />
                ))
              ) : (
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-8 text-center">
                  <Icons.Radio className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                  <p className="text-zinc-400">No live streams</p>
                </div>
              )}
            </div>
          )}
          
          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {activityLog.map((log) => (
                  <div key={log.id} className="p-3 bg-zinc-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icons.Activity className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-medium text-white">{log.action}</span>
                        {log.action_category && (
                          <span className="px-2 py-0.5 bg-zinc-700 rounded text-xs text-zinc-400">
                            {log.action_category}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-zinc-500">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <pre className="mt-2 text-xs text-zinc-400 bg-zinc-900 p-2 rounded overflow-x-auto">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
                {activityLog.length === 0 && (
                  <p className="text-center text-zinc-500 py-8">No activity logged</p>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Right Panel - Inspector */}
        <div>
          {selectedUser ? (
            <UserInspector
              user={selectedUser}
              onClose={() => setSelectedUser(null)}
              onAction={() => {
                loadData();
                setSelectedUser(null);
              }}
            />
          ) : (
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-8 text-center">
              <Icons.Users className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-400">Select a user to inspect</p>
            </div>
          )}
          
          {/* Tier Breakdown */}
          {stats?.tierBreakdown && (
            <div className="mt-6 bg-zinc-900 rounded-xl border border-zinc-800 p-4">
              <h3 className="text-sm font-medium text-white mb-3">Tier Distribution</h3>
              <div className="space-y-2">
                {Object.entries(stats.tierBreakdown).map(([tier, count]) => (
                  <div key={tier} className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400 capitalize">{tier}</span>
                    <span className="text-sm font-medium text-white">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Kill Stream Modal */}
      {killModalStream && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <Icons.AlertTriangle className="w-6 h-6 text-red-500" />
              <h3 className="text-lg font-semibold text-white">Kill Stream</h3>
            </div>
            <p className="text-zinc-400 mb-4">
              This will immediately terminate the live stream. This action cannot be undone.
            </p>
            <input
              type="text"
              placeholder="Reason for killing stream"
              value={killReason}
              onChange={(e) => setKillReason(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setKillModalStream(null);
                  setKillReason('');
                }}
                className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleKillStream}
                disabled={!killReason}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
              >
                Kill Stream
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminControlPanel;
