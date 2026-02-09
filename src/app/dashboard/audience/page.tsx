'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

type AudienceStat = {
  label: string;
  value: string;
  change: string;
};

type Viewer = {
  id: string;
  display_name: string;
  email: string;
  tier: 'VIP' | 'Premium' | 'Supporter' | 'Free';
  joined: string;
  watchTime: string;
  lastActive: string;
};

export default function AudiencePage() {
  const [stats, setStats] = useState<AudienceStat[]>([
    { label: 'Total Subscribers', value: '0', change: '—' },
    { label: 'Active Viewers (7d)', value: '0', change: '—' },
    { label: 'New Subscribers (30d)', value: '0', change: '—' },
    { label: 'Churn Rate', value: '0%', change: '—' },
  ]);
  const [topViewers, setTopViewers] = useState<Viewer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAudienceData() {
      const supabase = createClient();
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // Get user's channel
        const { data: channel } = await supabase
          .from('channels')
          .select('id, subscriber_count')
          .eq('creator_id', user.id)
          .single();

        if (!channel) {
          setLoading(false);
          return;
        }

        // Get subscribers
        const { data: subscriptions } = await supabase
          .from('subscriptions')
          .select(`
            id,
            created_at,
            tier,
            status,
            subscriber:profiles!subscriptions_subscriber_id_fkey (
              id,
              display_name,
              email
            )
          `)
          .eq('channel_id', channel.id)
          .eq('status', 'active');

        // Calculate stats
        const totalSubs = channel.subscriber_count || 0;
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const newSubs = subscriptions?.filter(s => 
          new Date(s.created_at) >= thirtyDaysAgo
        ).length || 0;

        setStats([
          { label: 'Total Subscribers', value: totalSubs.toLocaleString(), change: `+${newSubs} this month` },
          { label: 'Active Viewers (7d)', value: '0', change: '—' },
          { label: 'New Subscribers (30d)', value: newSubs.toString(), change: '—' },
          { label: 'Churn Rate', value: '0%', change: '—' },
        ]);

        // Format top viewers (subscribers)
        if (subscriptions && subscriptions.length > 0) {
          const viewers: Viewer[] = subscriptions.slice(0, 10).map((sub: any) => {
            const subscriberData = Array.isArray(sub.subscriber) ? sub.subscriber[0] : sub.subscriber;
            return {
              id: subscriberData?.id || sub.id,
              display_name: subscriberData?.display_name || subscriberData?.email?.split('@')[0] || 'Unknown',
              email: subscriberData?.email || '',
              tier: (sub.tier === 'premium' ? 'Premium' : sub.tier === 'basic' ? 'Supporter' : 'Free') as any,
              joined: new Date(sub.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
              watchTime: '—',
              lastActive: '—',
            };
          });
          setTopViewers(viewers);
        }
      } catch (error) {
        console.error('Error fetching audience data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAudienceData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-surface-400">Loading audience data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Audience</h1>
          <p className="text-surface-400 text-sm mt-1">Subscriber management and audience insights</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">Export</Button>
          <Button size="sm">Send Notification</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} variant="default">
            <span className="text-sm text-surface-400">{stat.label}</span>
            <div className="text-2xl font-bold text-white mt-1">{stat.value}</div>
            <span className="text-xs text-surface-500 mt-1">{stat.change}</span>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Viewers */}
        <div className="lg:col-span-2">
          <Card variant="default" padding="none">
            <div className="px-6 py-4 border-b border-surface-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Top Viewers</h2>
              <Button variant="ghost" size="sm">View All</Button>
            </div>
            <div className="divide-y divide-surface-700/50">
              {topViewers.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-surface-500 text-sm">No subscribers yet</p>
                  <p className="text-surface-600 text-xs mt-1">Share your channel to grow your audience</p>
                </div>
              ) : (
                topViewers.map((viewer) => (
                  <div key={viewer.id} className="px-6 py-3.5 flex items-center gap-4 hover:bg-surface-800/50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                      {viewer.display_name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{viewer.display_name}</span>
                        <Badge variant={viewer.tier === 'VIP' ? 'brand' : viewer.tier === 'Premium' ? 'info' : viewer.tier === 'Supporter' ? 'success' : 'default'} size="sm">
                          {viewer.tier}
                        </Badge>
                      </div>
                      <span className="text-xs text-surface-500">Joined {viewer.joined}</span>
                    </div>
                    <span className="text-xs text-surface-500 flex-shrink-0">{viewer.lastActive}</span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Segments */}
        <div>
          <Card variant="default">
            <h2 className="text-lg font-semibold text-white mb-4">Audience Segments</h2>
            <div className="space-y-3">
              <p className="text-sm text-surface-500">Coming soon: Auto-segmentation based on engagement, location, and watch patterns</p>
            </div>
          </Card>

          {/* Growth Chart Placeholder */}
          <Card variant="default" className="mt-6">
            <h3 className="text-base font-semibold text-white mb-3">Growth Trend</h3>
            <div className="h-40 bg-surface-800/50 rounded-xl border border-surface-700/50 flex items-center justify-center">
              <p className="text-xs text-surface-500">Subscriber growth chart</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
