'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

type AnalyticsStats = {
  totalViews: number;
  watchTimeHours: number;
  avgDuration: number;
  engagementRate: number;
};

type TopStream = {
  id: string;
  title: string;
  total_views: number;
  peak_viewers: number;
  started_at: string | null;
  ended_at: string | null;
};

export default function AnalyticsPage() {
  const [stats, setStats] = useState<AnalyticsStats>({
    totalViews: 0,
    watchTimeHours: 0,
    avgDuration: 0,
    engagementRate: 0,
  });
  const [topStreams, setTopStreams] = useState<TopStream[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      const supabase = createClient();
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: channels } = await supabase
          .from('channels')
          .select('id')
          .eq('creator_id', user.id)
          .limit(1);

        if (!channels || channels.length === 0) return;

        const channelId = channels[0].id;

        // Get last 30 days of streams
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: streams } = await supabase
          .from('streams')
          .select('*')
          .eq('channel_id', channelId)
          .gte('created_at', thirtyDaysAgo.toISOString())
          .order('total_views', { ascending: false });

        if (streams) {
          setTopStreams(streams.slice(0, 10));

          const totalViews = streams.reduce((sum, s) => sum + (s.total_views || 0), 0);
          let totalWatchMinutes = 0;
          let totalDurations = 0;
          let durationCount = 0;

          streams.forEach(stream => {
            if (stream.started_at && stream.ended_at) {
              const durationMinutes = (new Date(stream.ended_at).getTime() - new Date(stream.started_at).getTime()) / 1000 / 60;
              totalWatchMinutes += durationMinutes * (stream.total_views || 0);
              totalDurations += durationMinutes;
              durationCount++;
            }
          });

          setStats({
            totalViews,
            watchTimeHours: Math.round(totalWatchMinutes / 60 * 10) / 10,
            avgDuration: durationCount > 0 ? Math.round(totalDurations / durationCount) : 0,
            engagementRate: 0, // TODO: Calculate based on interactions
          });
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

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

  const overviewStats = [
    { label: 'Views (30d)', value: stats.totalViews.toLocaleString(), change: '—', up: false },
    { label: 'Watch Time (30d)', value: `${stats.watchTimeHours} hrs`, change: '—', up: false },
    { label: 'Avg. Duration', value: `${stats.avgDuration}m`, change: '—', up: false },
    { label: 'Streams', value: topStreams.length.toString(), change: '—', up: false },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-surface-400 text-sm mt-1">Last 30 days &middot; Updated 5 min ago</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewStats.map((stat) => (
          <Card key={stat.label} variant="default">
            <span className="text-sm text-surface-400">{stat.label}</span>
            <div className="flex items-end gap-2 mt-1">
              <span className="text-2xl font-bold text-white">{stat.value}</span>
              <Badge variant={stat.up ? 'success' : 'danger'} size="sm">{stat.change}</Badge>
            </div>
          </Card>
        ))}
      </div>

      {/* Chart placeholder */}
      <Card variant="default">
        <h2 className="text-lg font-semibold text-white mb-4">Views Over Time</h2>
        <div className="h-64 bg-surface-800/50 rounded-xl flex items-center justify-center border border-surface-700/50">
          <div className="text-center">
            <svg className="w-12 h-12 text-surface-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-sm text-surface-500">Interactive chart — connect analytics data source</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Content */}
        <div className="lg:col-span-2">
          <Card variant="default" padding="none">
            <div className="px-6 py-4 border-b border-surface-700">
              <h2 className="text-lg font-semibold text-white">Top Content</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-700">
                    <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Title</th>
                    <th className="text-right text-xs font-medium text-surface-500 uppercase px-6 py-3">Views</th>
                    <th className="text-right text-xs font-medium text-surface-500 uppercase px-6 py-3">Peak Viewers</th>
                    <th className="text-right text-xs font-medium text-surface-500 uppercase px-6 py-3">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-700/50">
                  {topStreams.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <p className="text-sm text-surface-400">No streams yet</p>
                      </td>
                    </tr>
                  ) : (
                    topStreams.map((stream) => (
                      <tr key={stream.id} className="hover:bg-surface-800/50 transition-colors">
                        <td className="px-6 py-3 text-sm font-medium text-white truncate max-w-[300px]">{stream.title}</td>
                        <td className="px-6 py-3 text-sm text-surface-300 text-right">{stream.total_views || 0}</td>
                        <td className="px-6 py-3 text-sm text-surface-300 text-right">{stream.peak_viewers || 0}</td>
                        <td className="px-6 py-3 text-sm text-surface-300 text-right">{formatDuration(stream.started_at, stream.ended_at)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>Coming Soon</h3>
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-surface-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-sm text-surface-400">Demographics data</p>
              <p className="text-xs text-surface-500 mt-1">Available in future update</p>
            </div>
          </Card>

          <Card variant="default">
            <h3 className="text-base font-semibold text-white mb-4">Coming Soon</h3>
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-surface-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <p className="text-sm text-surface-400">Traffic sources</p>
              <p className="text-xs text-surface-500 mt-1">Available in future update</p> <div className="flex justify-between text-sm mb-1">
                    <span className="text-surface-400">{s.source}</span>
                    <span className="text-white font-medium">{s.pct}%</span>
                  </div>
                  <div className="h-2 bg-surface-700 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${s.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
