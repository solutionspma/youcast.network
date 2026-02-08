import type { Metadata } from 'next';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

export const metadata: Metadata = { title: 'Analytics' };

// NO MOCK DATA - Real analytics only
const overviewStats = [
  { label: 'Views (30d)', value: '0', change: '—', up: false },
  { label: 'Watch Time (30d)', value: '0 hrs', change: '—', up: false },
  { label: 'Avg. View Duration', value: '0s', change: '—', up: false },
  { label: 'Engagement Rate', value: '0%', change: '—', up: false },
];

const topContent: any[] = [];

const demographics: any[] = [];

const trafficSources: any[] = [];

export default function AnalyticsPage() {
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
                    <th className="text-right text-xs font-medium text-surface-500 uppercase px-6 py-3">Watch Time</th>
                    <th className="text-right text-xs font-medium text-surface-500 uppercase px-6 py-3">Engagement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-700/50">
                  {topContent.map((item) => (
                    <tr key={item.title} className="hover:bg-surface-800/50 transition-colors">
                      <td className="px-6 py-3 text-sm font-medium text-white truncate max-w-[300px]">{item.title}</td>
                      <td className="px-6 py-3 text-sm text-surface-300 text-right">{item.views}</td>
                      <td className="px-6 py-3 text-sm text-surface-300 text-right">{item.watchTime}</td>
                      <td className="px-6 py-3 text-sm text-surface-300 text-right">{item.engagement}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Demographics & Sources */}
        <div className="space-y-6">
          <Card variant="default">
            <h3 className="text-base font-semibold text-white mb-4">Age Demographics</h3>
            <div className="space-y-3">
              {demographics.map((d) => (
                <div key={d.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-surface-400">{d.label}</span>
                    <span className="text-white font-medium">{d.pct}%</span>
                  </div>
                  <div className="h-2 bg-surface-700 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 rounded-full" style={{ width: `${d.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card variant="default">
            <h3 className="text-base font-semibold text-white mb-4">Traffic Sources</h3>
            <div className="space-y-3">
              {trafficSources.map((s) => (
                <div key={s.source}>
                  <div className="flex justify-between text-sm mb-1">
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
