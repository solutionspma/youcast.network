'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Link from 'next/link';

type Stats = {
  totalViews: number;
  totalStreams: number;
  watchTimeHours: number;
  subscribers: number;
};

type RecentStream = {
  id: string;
  title: string;
  status: string;
  viewer_count: number;
  peak_viewers: number;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalViews: 0,
    totalStreams: 0,
    watchTimeHours: 0,
    subscribers: 0,
  });
  const [recentStreams, setRecentStreams] = useState<RecentStream[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      const supabase = createClient();
      
      try {
        // Get user's channel
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: channels } = await supabase
          .from('channels')
          .select('id, subscriber_count')
          .eq('creator_id', user.id)
          .limit(1);

        if (!channels || channels.length === 0) return;
        
        const channelId = channels[0].id;

        // Get all streams for this channel
        const { data: streams } = await supabase
          .from('streams')
          .select('*')
          .eq('channel_id', channelId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (streams) {
          setRecentStreams(streams);

          // Calculate stats
          const totalViews = streams.reduce((sum, s) => sum + (s.total_views || 0), 0);
          const totalStreams = streams.filter(s => s.status === 'ended').length;
          
          // Calculate watch time from stream durations
          let totalWatchMinutes = 0;
          streams.forEach(stream => {
            if (stream.started_at && stream.ended_at) {
              const duration = (new Date(stream.ended_at).getTime() - new Date(stream.started_at).getTime()) / 1000 / 60;
              totalWatchMinutes += duration * (stream.total_views || 0);
            }
          });

          setStats({
            totalViews,
            totalStreams,
            watchTimeHours: Math.round(totalWatchMinutes / 60 * 10) / 10,
            subscribers: channels[0].subscriber_count || 0,
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (startedAt: string | null, endedAt: string | null) => {
    if (!startedAt || !endedAt) return '—';
    const duration = (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000;
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-400"></div>
      </div>
    );
  }

  const statsDisplay = [
    { label: 'Total Views', value: stats.totalViews.toLocaleString(), change: '—', up: false },
    { label: 'Total Streams', value: stats.totalStreams.toString(), change: '—', up: false },
    { label: 'Watch Time', value: `${stats.watchTimeHours} hrs`, change: '—', up: false },
    { label: 'Subscribers', value: stats.subscribers.toLocaleString(), change: '—', up: false },
  ];

  return (

    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-surface-400 text-sm mt-1">Welcome back. Here&apos;s your channel overview.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/stream">
            <Button size="sm">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse-live mr-2" />
              Go Live
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsDisplay.map((stat) => (
          <Card key={stat.label} variant="default">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-surface-400">{stat.label}</span>
              <Badge variant={stat.up ? 'success' : 'default'} size="sm">
                {stat.change}
              </Badge>
            </div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
          </Card>
        ))}
      </div>

      {/* Content Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Streams */}
        <div className="lg:col-span-2">
          <Card variant="default" padding="none">
            <div className="px-6 py-4 border-b border-surface-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Recent Streams</h2>
              <Link href="/dashboard/analytics" className="text-sm text-brand-400 hover:text-brand-300">View All</Link>
            </div>
            <div className="divide-y divide-surface-700/50">
              {recentStreams.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <svg className="w-12 h-12 text-surface-600 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-surface-400">No streams yet</p>
                  <p className="text-xs text-surface-500 mt-1">Click &quot;Go Live&quot; to start your first stream</p>
                </div>
              ) : (
                recentStreams.map((stream) => (
                  <div key={stream.id} className="px-6 py-4 flex items-center gap-4 hover:bg-surface-800/50 transition-colors">
                    <div className="w-16 h-10 rounded-lg bg-surface-700 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-surface-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-white truncate">{stream.title}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-surface-500">{formatDate(stream.created_at)}</span>
                        {stream.started_at && stream.ended_at && (
                          <>
                            <span className="text-xs text-surface-600">&middot;</span>
                            <span className="text-xs text-surface-500">{formatDuration(stream.started_at, stream.ended_at)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm text-white">{stream.peak_viewers || 0} viewers</div>
                      <Badge
                        variant={stream.status === 'live' ? 'success' : stream.status === 'ended' ? 'default' : 'warning'}
                        size="sm"
                      >
                        {stream.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Stream History Summary */}
        <div>
          <Card variant="default" padding="none">
            <div className="px-6 py-4 border-b border-surface-700">
              <h2 className="text-lg font-semibold text-white">Stream Statistics</h2>
            </div>
            <div className="divide-y divide-surface-700/50">
              {recentStreams.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <svg className="w-12 h-12 text-surface-600 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="text-sm text-surface-400">No data yet</p>
                  <p className="text-xs text-surface-500 mt-1">Stream stats will appear here</p>
                </div>
              ) : (
                <div className="px-6 py-4 space-y-4">
                  <div>
                    <div className="text-xs text-surface-400 mb-1">Total Streams</div>
                    <div className="text-2xl font-bold text-white">{recentStreams.filter(s => s.status === 'ended').length}</div>
                  </div>
                  <div>
                    <div className="text-xs text-surface-400 mb-1">Peak Viewers</div>
                    <div className="text-2xl font-bold text-white">
                      {Math.max(...recentStreams.map(s => s.peak_viewers || 0), 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-surface-400 mb-1">Average Duration</div>
                    <div className="text-2xl font-bold text-white">
                      {(() => {
                        const durations = recentStreams
                          .filter(s => s.started_at && s.ended_at)
                          .map(s => (new Date(s.ended_at!).getTime() - new Date(s.started_at!).getTime()) / 1000 / 60);
                        const avg = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
                        return Math.round(avg);
                      })()}m
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
