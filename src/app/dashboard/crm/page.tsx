'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

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

type UserTier = 'guest' | 'free' | 'creator' | 'pro' | 'enterprise';

export default function CRMPage() {
  const [user, setUser] = useState<any>(null);
  const [userTier, setUserTier] = useState<UserTier>('free');
  const [userRole, setUserRole] = useState<string>('viewer');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'subscribers' | 'engagement' | 'scores'>('overview');
  
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
      
      // Check access - admin or pro+ tier
      const hasAccess = role === 'admin' || ['pro', 'enterprise'].includes(tier);
      
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Access denied
  const hasAccess = userRole === 'admin' || ['pro', 'enterprise'].includes(userTier);
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
        <h1 className="text-3xl font-display font-bold text-white mb-2">Platform CRM</h1>
        <p className="text-surface-400">Manage subscribers, track engagement, and analyze user behavior.</p>
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
    </div>
  );
}
