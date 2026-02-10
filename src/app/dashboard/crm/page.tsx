'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

// Master account - full platform access with no restrictions
const MASTER_ACCOUNT_EMAIL = 'Solutions@pitchmarketing.agency';

interface CRMStats {
  total_subscribers: number;
  active_subscribers: number;
  new_subscribers_30d: number;
  total_engagement: number;
  engagement_30d: number;
  avg_score: number;
}

interface Subscriber {
  id: string;
  email: string;
  status: string;
  source: string;
  created_at: string;
  user_id?: string;
}

interface UserScore {
  user_id: string;
  engagement_score: number;
  activity_score: number;
  loyalty_score: number;
  total_score: number;
  updated_at: string;
  profiles?: { display_name: string; email: string; avatar_url: string | null };
}

interface EngagementEvent {
  id: string;
  user_id: string;
  event_type: string;
  metadata: any;
  created_at: string;
  profiles?: { display_name: string };
}

interface PlatformUser {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  tier: string;
  role: string;
  created_at: string;
}

type UserTier = 'guest' | 'free' | 'creator' | 'pro' | 'enterprise';
type UserRole = 'viewer' | 'creator' | 'moderator' | 'admin';

export default function CRMPage() {
  const [user, setUser] = useState<any>(null);
  const [userTier, setUserTier] = useState<UserTier>('free');
  const [userRole, setUserRole] = useState<string>('viewer');
  const [isMasterAccount, setIsMasterAccount] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'subscribers' | 'engagement' | 'scores' | 'users'>('overview');
  
  // User management state (master account only)
  const [platformUsers, setPlatformUsers] = useState<PlatformUser[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editTier, setEditTier] = useState<UserTier>('free');
  const [editRole, setEditRole] = useState<UserRole>('viewer');
  const [savingUser, setSavingUser] = useState(false);
  
  const [stats, setStats] = useState<CRMStats>({
    total_subscribers: 0,
    active_subscribers: 0,
    new_subscribers_30d: 0,
    total_engagement: 0,
    engagement_30d: 0,
    avg_score: 0,
  });
  
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [userScores, setUserScores] = useState<UserScore[]>([]);
  const [engagementEvents, setEngagementEvents] = useState<EngagementEvent[]>([]);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        window.location.href = '/auth/login?redirect=/dashboard/crm';
        return;
      }
      
      setUser(authUser);
      
      // Check if master account - bypasses all restrictions
      const masterAccount = authUser.email?.toLowerCase() === MASTER_ACCOUNT_EMAIL.toLowerCase();
      setIsMasterAccount(masterAccount);
      
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('tier, role')
        .eq('id', authUser.id)
        .single();
      
      const tier = (profile?.tier || 'free') as UserTier;
      const role = profile?.role || 'viewer';
      setUserTier(tier);
      setUserRole(role);
      
      // Check access - master account, admin, or pro+ tier
      const hasAccess = masterAccount || role === 'admin' || ['pro', 'enterprise'].includes(tier);
      
      if (!hasAccess) {
        setLoading(false);
        return;
      }
      
      // Load CRM stats
      const { data: statsData } = await supabase.rpc('get_crm_stats');
      if (statsData) {
        setStats(statsData);
      }
      
      // Load subscribers
      const { data: subscribersData } = await supabase
        .from('crm_subscribers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (subscribersData) {
        setSubscribers(subscribersData);
      }
      
      // Load user scores
      const { data: scoresData } = await supabase
        .from('crm_user_scores')
        .select(`
          *,
          profiles(display_name, email, avatar_url)
        `)
        .order('total_score', { ascending: false })
        .limit(50);
      
      if (scoresData) {
        setUserScores(scoresData as UserScore[]);
      }
      
      // Load recent engagement
      const { data: engagementData } = await supabase
        .from('crm_engagement')
        .select(`
          *,
          profiles(display_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (engagementData) {
        setEngagementEvents(engagementData as EngagementEvent[]);
      }
      
      // Master account: load all platform users for privilege management
      if (masterAccount) {
        const { data: usersData } = await supabase
          .from('profiles')
          .select('id, email, display_name, avatar_url, tier, role, created_at')
          .order('created_at', { ascending: false });
        
        if (usersData) {
          setPlatformUsers(usersData as PlatformUser[]);
        }
      }
      
      setLoading(false);
    }
    
    loadData();
  }, []);

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // Master account: update user privileges
  async function updateUserPrivileges(userId: string, newTier: UserTier, newRole: UserRole) {
    if (!isMasterAccount) return;
    
    setSavingUser(true);
    const supabase = createClient();
    
    const { error } = await supabase
      .from('profiles')
      .update({ tier: newTier, role: newRole })
      .eq('id', userId);
    
    if (!error) {
      // Update local state
      setPlatformUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, tier: newTier, role: newRole } : u
      ));
      setEditingUserId(null);
    }
    
    setSavingUser(false);
  }

  // Filter platform users by search query
  const filteredUsers = platformUsers.filter(u => {
    if (!userSearchQuery) return true;
    const query = userSearchQuery.toLowerCase();
    return (
      u.email?.toLowerCase().includes(query) ||
      u.display_name?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Access denied
  const hasAccess = isMasterAccount || userRole === 'admin' || ['pro', 'enterprise'].includes(userTier);
  if (!hasAccess) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-surface-900/50 rounded-2xl border border-surface-800/50 p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-brand-500/20 to-accent-purple/20 flex items-center justify-center">
            <svg className="w-10 h-10 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h1 className="text-3xl font-display font-bold text-white mb-4">
            CRM is a Pro Feature
          </h1>
          <p className="text-surface-400 text-lg max-w-md mx-auto mb-8">
            The platform CRM is available for Pro tier and above. Upgrade to access subscriber management, engagement tracking, and user scoring.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard/settings#subscription"
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-medium hover:opacity-90 transition-opacity"
            >
              Upgrade to Pro
            </Link>
            <Link
              href="/creators"
              className="px-8 py-3 rounded-xl bg-surface-800 text-white font-medium hover:bg-surface-700 transition-colors"
            >
              View Plans
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-display font-bold text-white">Platform CRM</h1>
          {isMasterAccount && (
            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold uppercase tracking-wider">
              Master Account
            </span>
          )}
        </div>
        <p className="text-surface-400">
          {isMasterAccount 
            ? 'Full platform access. Manage subscribers, engagement, user scores, and user privileges.'
            : 'Manage subscribers, track engagement, and analyze user behavior.'}
        </p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-surface-900/50 rounded-xl border border-surface-800/50 p-4">
          <div className="text-2xl font-bold text-white">{stats.total_subscribers.toLocaleString()}</div>
          <div className="text-sm text-surface-400">Total Subscribers</div>
        </div>
        <div className="bg-surface-900/50 rounded-xl border border-surface-800/50 p-4">
          <div className="text-2xl font-bold text-accent-emerald">{stats.active_subscribers.toLocaleString()}</div>
          <div className="text-sm text-surface-400">Active</div>
        </div>
        <div className="bg-surface-900/50 rounded-xl border border-surface-800/50 p-4">
          <div className="text-2xl font-bold text-brand-400">+{stats.new_subscribers_30d.toLocaleString()}</div>
          <div className="text-sm text-surface-400">New (30d)</div>
        </div>
        <div className="bg-surface-900/50 rounded-xl border border-surface-800/50 p-4">
          <div className="text-2xl font-bold text-white">{stats.total_engagement.toLocaleString()}</div>
          <div className="text-sm text-surface-400">Total Events</div>
        </div>
        <div className="bg-surface-900/50 rounded-xl border border-surface-800/50 p-4">
          <div className="text-2xl font-bold text-cyan-400">{stats.engagement_30d.toLocaleString()}</div>
          <div className="text-sm text-surface-400">Events (30d)</div>
        </div>
        <div className="bg-surface-900/50 rounded-xl border border-surface-800/50 p-4">
          <div className="text-2xl font-bold text-purple-400">{stats.avg_score.toFixed(1)}</div>
          <div className="text-sm text-surface-400">Avg Score</div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-surface-800/50 pb-4">
        {(['overview', 'subscribers', 'engagement', 'scores'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab 
                ? 'bg-brand-500 text-white' 
                : 'text-surface-400 hover:text-white hover:bg-surface-800/50'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
        {/* Users tab - only visible to master account */}
        {isMasterAccount && (
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'users' 
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' 
                : 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/30'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            User Privileges
          </button>
        )}
      </div>
      
      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Subscribers */}
          <div className="bg-surface-900/50 rounded-2xl border border-surface-800/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Subscribers</h3>
            <div className="space-y-3">
              {subscribers.slice(0, 5).map((sub) => (
                <div key={sub.id} className="flex items-center justify-between py-2 border-b border-surface-800/30 last:border-0">
                  <div>
                    <div className="text-white font-medium">{sub.email}</div>
                    <div className="text-xs text-surface-500">{sub.source} • {formatTime(sub.created_at)}</div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    sub.status === 'active' ? 'bg-accent-emerald/20 text-accent-emerald' :
                    sub.status === 'unsubscribed' ? 'bg-red-500/20 text-red-400' :
                    'bg-surface-700 text-surface-300'
                  }`}>
                    {sub.status}
                  </span>
                </div>
              ))}
              {subscribers.length === 0 && (
                <p className="text-surface-500 text-center py-4">No subscribers yet</p>
              )}
            </div>
          </div>
          
          {/* Top Users by Score */}
          <div className="bg-surface-900/50 rounded-2xl border border-surface-800/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Top Users by Score</h3>
            <div className="space-y-3">
              {userScores.slice(0, 5).map((score, i) => (
                <div key={score.user_id} className="flex items-center gap-3 py-2 border-b border-surface-800/30 last:border-0">
                  <div className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-surface-700 flex items-center justify-center text-white font-medium">
                    {score.profiles?.avatar_url ? (
                      <img src={score.profiles.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      score.profiles?.display_name?.charAt(0) || '?'
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium truncate">{score.profiles?.display_name || 'Unknown'}</div>
                    <div className="text-xs text-surface-500">
                      E: {score.engagement_score} • A: {score.activity_score} • L: {score.loyalty_score}
                    </div>
                  </div>
                  <div className="text-lg font-bold text-brand-400">{score.total_score}</div>
                </div>
              ))}
              {userScores.length === 0 && (
                <p className="text-surface-500 text-center py-4">No user scores yet</p>
              )}
            </div>
          </div>
          
          {/* Recent Engagement */}
          <div className="lg:col-span-2 bg-surface-900/50 rounded-2xl border border-surface-800/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
            <div className="space-y-2">
              {engagementEvents.slice(0, 10).map((event) => (
                <div key={event.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-surface-800/30 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-surface-800 flex items-center justify-center">
                    {event.event_type === 'stream_view' && (
                      <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                      </svg>
                    )}
                    {event.event_type === 'video_watch' && (
                      <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m0 0c.621 0 1.125.504 1.125 1.125v1.5m-2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5m0 0v1.5c0 .621-.504 1.125-1.125 1.125m0-3.75h-1.5m0 3.75h1.5m0 0c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h1.5m14.25 0h1.5" />
                      </svg>
                    )}
                    {event.event_type === 'subscription' && (
                      <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                      </svg>
                    )}
                    {!['stream_view', 'video_watch', 'subscription'].includes(event.event_type) && (
                      <svg className="w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-white">{event.profiles?.display_name || 'Anonymous'}</span>
                    <span className="text-surface-500"> • </span>
                    <span className="text-surface-400">{event.event_type.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="text-xs text-surface-500">{formatTime(event.created_at)}</div>
                </div>
              ))}
              {engagementEvents.length === 0 && (
                <p className="text-surface-500 text-center py-4">No engagement events yet</p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'subscribers' && (
        <div className="bg-surface-900/50 rounded-2xl border border-surface-800/50 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-800/50">
                <th className="text-left text-xs font-medium text-surface-400 uppercase tracking-wider px-6 py-4">Email</th>
                <th className="text-left text-xs font-medium text-surface-400 uppercase tracking-wider px-6 py-4">Status</th>
                <th className="text-left text-xs font-medium text-surface-400 uppercase tracking-wider px-6 py-4">Source</th>
                <th className="text-left text-xs font-medium text-surface-400 uppercase tracking-wider px-6 py-4">Subscribed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800/30">
              {subscribers.map((sub) => (
                <tr key={sub.id} className="hover:bg-surface-800/30 transition-colors">
                  <td className="px-6 py-4 text-white">{sub.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      sub.status === 'active' ? 'bg-accent-emerald/20 text-accent-emerald' :
                      sub.status === 'unsubscribed' ? 'bg-red-500/20 text-red-400' :
                      'bg-surface-700 text-surface-300'
                    }`}>
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-surface-400">{sub.source}</td>
                  <td className="px-6 py-4 text-surface-500">{new Date(sub.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {subscribers.length === 0 && (
            <div className="text-center py-12 text-surface-500">No subscribers found</div>
          )}
        </div>
      )}
      
      {activeTab === 'engagement' && (
        <div className="bg-surface-900/50 rounded-2xl border border-surface-800/50 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-800/50">
                <th className="text-left text-xs font-medium text-surface-400 uppercase tracking-wider px-6 py-4">User</th>
                <th className="text-left text-xs font-medium text-surface-400 uppercase tracking-wider px-6 py-4">Event</th>
                <th className="text-left text-xs font-medium text-surface-400 uppercase tracking-wider px-6 py-4">Details</th>
                <th className="text-left text-xs font-medium text-surface-400 uppercase tracking-wider px-6 py-4">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800/30">
              {engagementEvents.map((event) => (
                <tr key={event.id} className="hover:bg-surface-800/30 transition-colors">
                  <td className="px-6 py-4 text-white">{event.profiles?.display_name || 'Anonymous'}</td>
                  <td className="px-6 py-4 text-surface-300">{event.event_type.replace(/_/g, ' ')}</td>
                  <td className="px-6 py-4 text-surface-500 text-sm">
                    {event.metadata ? JSON.stringify(event.metadata).slice(0, 50) : '-'}
                  </td>
                  <td className="px-6 py-4 text-surface-500">{formatTime(event.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {engagementEvents.length === 0 && (
            <div className="text-center py-12 text-surface-500">No engagement events found</div>
          )}
        </div>
      )}
      
      {activeTab === 'scores' && (
        <div className="bg-surface-900/50 rounded-2xl border border-surface-800/50 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-800/50">
                <th className="text-left text-xs font-medium text-surface-400 uppercase tracking-wider px-6 py-4">Rank</th>
                <th className="text-left text-xs font-medium text-surface-400 uppercase tracking-wider px-6 py-4">User</th>
                <th className="text-left text-xs font-medium text-surface-400 uppercase tracking-wider px-6 py-4">Engagement</th>
                <th className="text-left text-xs font-medium text-surface-400 uppercase tracking-wider px-6 py-4">Activity</th>
                <th className="text-left text-xs font-medium text-surface-400 uppercase tracking-wider px-6 py-4">Loyalty</th>
                <th className="text-left text-xs font-medium text-surface-400 uppercase tracking-wider px-6 py-4">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800/30">
              {userScores.map((score, i) => (
                <tr key={score.user_id} className="hover:bg-surface-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <span className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-700 flex items-center justify-center text-white font-medium">
                        {score.profiles?.avatar_url ? (
                          <img src={score.profiles.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          score.profiles?.display_name?.charAt(0) || '?'
                        )}
                      </div>
                      <div>
                        <div className="text-white font-medium">{score.profiles?.display_name || 'Unknown'}</div>
                        <div className="text-xs text-surface-500">{score.profiles?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-cyan-400">{score.engagement_score}</td>
                  <td className="px-6 py-4 text-emerald-400">{score.activity_score}</td>
                  <td className="px-6 py-4 text-purple-400">{score.loyalty_score}</td>
                  <td className="px-6 py-4 text-xl font-bold text-brand-400">{score.total_score}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {userScores.length === 0 && (
            <div className="text-center py-12 text-surface-500">No user scores found</div>
          )}
        </div>
      )}
      
      {/* Users Tab - Master Account Only */}
      {activeTab === 'users' && isMasterAccount && (
        <div className="space-y-6">
          {/* Search */}
          <div className="bg-surface-900/50 rounded-xl border border-surface-800/50 p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search users by email or name..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-surface-800/50 text-white placeholder-surface-500 border border-surface-700 focus:border-brand-500 focus:outline-none"
                />
              </div>
              <div className="text-sm text-surface-400">
                {filteredUsers.length} of {platformUsers.length} users
              </div>
            </div>
          </div>
          
          {/* User List */}
          <div className="bg-surface-900/50 rounded-2xl border border-surface-800/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-surface-800/50 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                User Privilege Management
              </h3>
              <p className="text-sm text-surface-400 mt-1">Grant or modify user tiers and roles across the platform</p>
            </div>
            
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-800/50">
                  <th className="text-left text-xs font-medium text-surface-400 uppercase tracking-wider px-6 py-4">User</th>
                  <th className="text-left text-xs font-medium text-surface-400 uppercase tracking-wider px-6 py-4">Tier</th>
                  <th className="text-left text-xs font-medium text-surface-400 uppercase tracking-wider px-6 py-4">Role</th>
                  <th className="text-left text-xs font-medium text-surface-400 uppercase tracking-wider px-6 py-4">Joined</th>
                  <th className="text-left text-xs font-medium text-surface-400 uppercase tracking-wider px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-800/30">
                {filteredUsers.map((platformUser) => {
                  const isEditing = editingUserId === platformUser.id;
                  const isMaster = platformUser.email?.toLowerCase() === MASTER_ACCOUNT_EMAIL.toLowerCase();
                  
                  return (
                    <tr key={platformUser.id} className={`hover:bg-surface-800/30 transition-colors ${isMaster ? 'bg-amber-500/5' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-surface-700 flex items-center justify-center text-white font-medium">
                            {platformUser.avatar_url ? (
                              <img src={platformUser.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              platformUser.display_name?.charAt(0) || platformUser.email?.charAt(0) || '?'
                            )}
                          </div>
                          <div>
                            <div className="text-white font-medium flex items-center gap-2">
                              {platformUser.display_name || 'No Name'}
                              {isMaster && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                                  Master
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-surface-500">{platformUser.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <select
                            value={editTier}
                            onChange={(e) => setEditTier(e.target.value as UserTier)}
                            className="px-3 py-1.5 rounded bg-surface-800 text-white border border-surface-700 focus:border-brand-500 focus:outline-none text-sm"
                          >
                            <option value="guest">Guest</option>
                            <option value="free">Free</option>
                            <option value="creator">Creator</option>
                            <option value="pro">Pro</option>
                            <option value="enterprise">Enterprise</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            platformUser.tier === 'enterprise' ? 'bg-purple-500/20 text-purple-400' :
                            platformUser.tier === 'pro' ? 'bg-brand-500/20 text-brand-400' :
                            platformUser.tier === 'creator' ? 'bg-cyan-500/20 text-cyan-400' :
                            platformUser.tier === 'free' ? 'bg-surface-700 text-surface-300' :
                            'bg-surface-800 text-surface-500'
                          }`}>
                            {platformUser.tier || 'free'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value as UserRole)}
                            className="px-3 py-1.5 rounded bg-surface-800 text-white border border-surface-700 focus:border-brand-500 focus:outline-none text-sm"
                          >
                            <option value="viewer">Viewer</option>
                            <option value="creator">Creator</option>
                            <option value="moderator">Moderator</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            platformUser.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                            platformUser.role === 'moderator' ? 'bg-amber-500/20 text-amber-400' :
                            platformUser.role === 'creator' ? 'bg-accent-emerald/20 text-accent-emerald' :
                            'bg-surface-700 text-surface-300'
                          }`}>
                            {platformUser.role || 'viewer'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-surface-500 text-sm">
                        {new Date(platformUser.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        {isMaster ? (
                          <span className="text-xs text-surface-500">Protected</span>
                        ) : isEditing ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateUserPrivileges(platformUser.id, editTier, editRole)}
                              disabled={savingUser}
                              className="px-3 py-1.5 rounded bg-accent-emerald text-white text-sm font-medium hover:bg-accent-emerald/90 transition-colors disabled:opacity-50"
                            >
                              {savingUser ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={() => setEditingUserId(null)}
                              className="px-3 py-1.5 rounded bg-surface-700 text-surface-300 text-sm font-medium hover:bg-surface-600 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingUserId(platformUser.id);
                              setEditTier((platformUser.tier || 'free') as UserTier);
                              setEditRole((platformUser.role || 'viewer') as UserRole);
                            }}
                            className="px-3 py-1.5 rounded bg-surface-800 text-surface-300 text-sm font-medium hover:bg-surface-700 hover:text-white transition-colors"
                          >
                            Edit Privileges
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-12 text-surface-500">
                {userSearchQuery ? 'No users match your search' : 'No users found'}
              </div>
            )}
          </div>
          
          {/* Legend */}
          <div className="bg-surface-900/50 rounded-xl border border-surface-800/50 p-4">
            <h4 className="text-sm font-medium text-surface-300 mb-3">Tier & Role Legend</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <div className="font-medium text-surface-400 mb-2">Tiers</div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-surface-500"></span> Guest</div>
                  <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-surface-400"></span> Free</div>
                  <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-cyan-400"></span> Creator</div>
                  <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-brand-400"></span> Pro</div>
                  <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-purple-400"></span> Enterprise</div>
                </div>
              </div>
              <div>
                <div className="font-medium text-surface-400 mb-2">Roles</div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-surface-400"></span> Viewer</div>
                  <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-accent-emerald"></span> Creator</div>
                  <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-400"></span> Moderator</div>
                  <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-400"></span> Admin</div>
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="font-medium text-surface-400 mb-2">Access Levels</div>
                <div className="space-y-1 text-surface-500">
                  <div><strong className="text-white">Creator+</strong> = Access to streaming, messaging</div>
                  <div><strong className="text-white">Pro+</strong> = Access to CRM, analytics, monetization</div>
                  <div><strong className="text-white">Admin</strong> = Full platform management</div>
                  <div><strong className="text-amber-400">Master</strong> = Unrestricted platform access</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
