import type { Metadata } from 'next';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

export const metadata: Metadata = { title: 'Audience' };

// NO MOCK DATA - Real audience data only
const audienceStats = [
  { label: 'Total Subscribers', value: '0', change: '—' },
  { label: 'Active Viewers (7d)', value: '0', change: '—' },
  { label: 'New Subscribers (30d)', value: '0', change: '—' },
  { label: 'Churn Rate', value: '0%', change: '—' },
];

const topViewers: any[] = [];

const segments: any[] = [];

export default function AudiencePage() {
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
        {audienceStats.map((stat) => (
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
              {topViewers.map((viewer) => (
                <div key={viewer.name} className="px-6 py-3.5 flex items-center gap-4 hover:bg-surface-800/50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                    {viewer.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{viewer.name}</span>
                      <Badge variant={viewer.tier === 'VIP' ? 'brand' : viewer.tier === 'Premium' ? 'info' : viewer.tier === 'Supporter' ? 'success' : 'default'} size="sm">
                        {viewer.tier}
                      </Badge>
                    </div>
                    <span className="text-xs text-surface-500">Joined {viewer.joined} &middot; {viewer.watchTime}</span>
                  </div>
                  <span className="text-xs text-surface-500 flex-shrink-0">{viewer.lastActive}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Segments */}
        <div>
          <Card variant="default">
            <h2 className="text-lg font-semibold text-white mb-4">Audience Segments</h2>
            <div className="space-y-3">
              {segments.map((seg) => (
                <div key={seg.name} className="p-3 rounded-lg bg-surface-800/50 border border-surface-700/50 hover:border-surface-600 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white">{seg.name}</span>
                    <span className="text-sm font-semibold text-brand-400">{seg.count.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-surface-500">{seg.desc}</p>
                </div>
              ))}
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
