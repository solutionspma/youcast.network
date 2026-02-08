import type { Metadata } from 'next';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

export const metadata: Metadata = { title: 'Monetization' };

const revenueStats = [
  { label: 'Monthly Revenue', value: '$4,280', change: '+18.2%' },
  { label: 'Active Subscribers', value: '842', change: '+12 this week' },
  { label: 'Avg. Revenue/Viewer', value: '$0.34', change: '+5.1%' },
  { label: 'Pending Payout', value: '$3,640', change: 'Next: Feb 15' },
];

const subscriptionTiers = [
  { name: 'Free Tier', subscribers: 11648, revenue: '$0', pct: 93.2 },
  { name: 'Supporter ($4.99/mo)', subscribers: 520, revenue: '$2,594', pct: 4.2 },
  { name: 'Premium ($14.99/mo)', subscribers: 280, revenue: '$4,197', pct: 2.2 },
  { name: 'VIP ($49.99/mo)', subscribers: 42, revenue: '$2,099', pct: 0.3 },
];

const recentTransactions = [
  { type: 'Subscription', from: 'Sarah M.', amount: '$14.99', tier: 'Premium', date: 'Feb 7, 2026' },
  { type: 'Tip', from: 'JohnD', amount: '$25.00', tier: '—', date: 'Feb 7, 2026' },
  { type: 'Subscription', from: 'Mike R.', amount: '$4.99', tier: 'Supporter', date: 'Feb 6, 2026' },
  { type: 'Pay-per-view', from: 'Lisa K.', amount: '$9.99', tier: '—', date: 'Feb 6, 2026' },
  { type: 'Tip', from: 'Anonymous', amount: '$10.00', tier: '—', date: 'Feb 5, 2026' },
];

export default function MonetizationPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Monetization</h1>
          <p className="text-surface-400 text-sm mt-1">Revenue tracking and subscription management</p>
        </div>
        <Button size="sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Request Payout
        </Button>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {revenueStats.map((stat) => (
          <Card key={stat.label} variant="default">
            <span className="text-sm text-surface-400">{stat.label}</span>
            <div className="text-2xl font-bold text-white mt-1">{stat.value}</div>
            <span className="text-xs text-emerald-400 mt-1">{stat.change}</span>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscription Tiers */}
        <Card variant="default">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Subscription Tiers</h2>
            <Button variant="ghost" size="sm">Edit Tiers</Button>
          </div>
          <div className="space-y-4">
            {subscriptionTiers.map((tier) => (
              <div key={tier.name} className="p-3 rounded-lg bg-surface-800/50 border border-surface-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">{tier.name}</span>
                  <span className="text-sm text-surface-400">{tier.revenue}/mo</span>
                </div>
                <div className="flex items-center justify-between text-xs text-surface-500 mb-2">
                  <span>{tier.subscribers.toLocaleString()} subscribers</span>
                  <span>{tier.pct}%</span>
                </div>
                <div className="h-1.5 bg-surface-700 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full" style={{ width: `${Math.min(tier.pct * 2, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Transactions */}
        <Card variant="default" padding="none">
          <div className="px-6 py-4 border-b border-surface-700">
            <h2 className="text-lg font-semibold text-white">Recent Transactions</h2>
          </div>
          <div className="divide-y divide-surface-700/50">
            {recentTransactions.map((tx, i) => (
              <div key={i} className="px-6 py-3.5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{tx.from}</span>
                    <Badge variant="default" size="sm">{tx.type}</Badge>
                  </div>
                  <span className="text-xs text-surface-500">{tx.date}</span>
                </div>
                <span className="text-sm font-semibold text-emerald-400">{tx.amount}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Revenue Chart Placeholder */}
      <Card variant="default">
        <h2 className="text-lg font-semibold text-white mb-4">Revenue Over Time</h2>
        <div className="h-48 bg-surface-800/50 rounded-xl border border-surface-700/50 flex items-center justify-center">
          <p className="text-sm text-surface-500">Interactive revenue chart — connect billing data source</p>
        </div>
      </Card>
    </div>
  );
}
