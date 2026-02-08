import type { Metadata } from 'next';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

export const metadata: Metadata = { title: 'Dashboard' };

// NO MOCK DATA - All stats should come from real analytics
const stats = [
  { label: 'Total Views', value: '0', change: '—', up: false },
  { label: 'Watch Time', value: '0 hrs', change: '—', up: false },
  { label: 'Subscribers', value: '0', change: '—', up: false },
  { label: 'Revenue', value: '$0', change: '—', up: false },
];

// NO MOCK DATA - Real media from Supabase only
const recentMedia: any[] = [];

// NO MOCK DATA - Real activity from Supabase only
const activity: any[] = [];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-surface-400 text-sm mt-1">Welcome back. Here&apos;s your channel overview.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">Upload Media</Button>
          <Button size="sm">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse-live" />
            Go Live
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} variant="default">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-surface-400">{stat.label}</span>
              <Badge variant={stat.up ? 'success' : 'danger'} size="sm">
                {stat.change}
              </Badge>
            </div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
          </Card>
        ))}
      </div>

      {/* Content Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Media */}
        <div className="lg:col-span-2">
          <Card variant="default" padding="none">
            <div className="px-6 py-4 border-b border-surface-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Recent Media</h2>
              <a href="/dashboard/media" className="text-sm text-brand-400 hover:text-brand-300">View All</a>
            </div>
            <div className="divide-y divide-surface-700/50">
              {recentMedia.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <svg className="w-12 h-12 text-surface-600 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-surface-400">No media uploaded yet</p>
                  <p className="text-xs text-surface-500 mt-1">Start by going live or uploading content</p>
                </div>
              ) : (
                recentMedia.map((item) => (
                  <div key={item.title} className="px-6 py-4 flex items-center gap-4 hover:bg-surface-800/50 transition-colors">
                    <div className="w-16 h-10 rounded-lg bg-surface-700 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-surface-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-white truncate">{item.title}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-surface-500">{item.type}</span>
                        <span className="text-xs text-surface-600">&middot;</span>
                        <span className="text-xs text-surface-500">{item.date}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm text-white">{item.views}</div>
                      <Badge
                        variant={item.status === 'published' ? 'success' : 'warning'}
                        size="sm"
                      >
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Activity Feed */}
        <div>
          <Card variant="default" padding="none">
            <div className="px-6 py-4 border-b border-surface-700">
              <h2 className="text-lg font-semibold text-white">Activity</h2>
            </div>
            <div className="divide-y divide-surface-700/50">
              {activity.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <svg className="w-12 h-12 text-surface-600 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-surface-400">No recent activity</p>
                  <p className="text-xs text-surface-500 mt-1">Your channel activity will appear here</p>
                </div>
              ) : (
                activity.map((item, i) => (
                  <div key={i} className="px-6 py-3.5">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium text-brand-400">{item.action}</span>
                      <span className="text-xs text-surface-600">{item.time}</span>
                    </div>
                    <p className="text-sm text-surface-300">{item.detail}</p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
