import type { Metadata } from 'next';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

export const metadata: Metadata = { title: 'Dashboard' };

const stats = [
  { label: 'Total Views', value: '248.5K', change: '+12.3%', up: true },
  { label: 'Watch Time', value: '1,842 hrs', change: '+8.7%', up: true },
  { label: 'Subscribers', value: '12,490', change: '+245', up: true },
  { label: 'Revenue', value: '$4,280', change: '+18.2%', up: true },
];

const recentMedia = [
  { title: 'Sunday Morning Service — Week 42', type: 'Live Stream', views: '8.4K', status: 'published', date: '2 hours ago' },
  { title: 'Behind the Scenes: Studio Tour 2026', type: 'Video', views: '3.2K', status: 'published', date: '1 day ago' },
  { title: 'Creator Tips: Multi-Camera Setups', type: 'Video', views: '12.1K', status: 'published', date: '3 days ago' },
  { title: 'Midweek Devotional', type: 'Audio', views: '1.8K', status: 'published', date: '4 days ago' },
  { title: 'Upcoming: Easter Special', type: 'Live Stream', views: '—', status: 'scheduled', date: 'Mar 15, 2026' },
];

const activity = [
  { action: 'New subscriber', detail: 'Sarah M. subscribed to your channel', time: '5 min ago' },
  { action: 'Stream ended', detail: 'Sunday Morning Service — 2h 14m, 8.4K viewers', time: '2 hours ago' },
  { action: 'Comment', detail: '"Amazing sermon! Thank you for this." — JohnD', time: '3 hours ago' },
  { action: 'Milestone', detail: 'You reached 12,000 subscribers!', time: '1 day ago' },
  { action: 'Upload complete', detail: 'Behind the Scenes: Studio Tour 2026 is ready', time: '1 day ago' },
];

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
              {recentMedia.map((item) => (
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
              ))}
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
              {activity.map((item, i) => (
                <div key={i} className="px-6 py-3.5">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-brand-400">{item.action}</span>
                    <span className="text-xs text-surface-600">{item.time}</span>
                  </div>
                  <p className="text-sm text-surface-300">{item.detail}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
