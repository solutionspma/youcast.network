'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Badge from '@/components/ui/Badge';

type Transaction = {
  id: string;
  type: 'subscription' | 'tip' | 'ad_revenue' | 'ppv';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  created_at: string;
  payer_id: string | null;
};

type Subscription = {
  id: string;
  tier: 'free' | 'basic' | 'premium';
  status: 'active' | 'cancelled' | 'expired';
  created_at: string;
  subscriber: {
    display_name: string;
    email: string;
  };
};

type RevenueStats = {
  totalRevenue: number;
  monthlyRevenue: number;
  subscriptionRevenue: number;
  tipRevenue: number;
  activeSubscribers: number;
  averageRevenuePerUser: number;
};

export default function MonetizationPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'subscriptions' | 'tips' | 'payouts'>('overview');
  const [stats, setStats] = useState<RevenueStats>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    subscriptionRevenue: 0,
    tipRevenue: 0,
    activeSubscribers: 0,
    averageRevenuePerUser: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();
  
  // ============================================================================
  // LOAD DATA
  // ============================================================================
  
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        // Get user's channel
        const { data: channel } = await supabase
          .from('channels')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (!channel) return;
        
        // Load transactions
        const { data: txData } = await supabase
          .from('transactions')
          .select('*')
          .eq('recipient_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);
        
        if (txData) {
          setTransactions(txData);
          
          // Calculate stats
          const total = txData.reduce((sum, tx) => sum + tx.amount, 0);
          const thisMonth = txData.filter(tx => {
            const txDate = new Date(tx.created_at);
            const now = new Date();
            return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
          }).reduce((sum, tx) => sum + tx.amount, 0);
          
          const subscriptionRev = txData.filter(tx => tx.type === 'subscription').reduce((sum, tx) => sum + tx.amount, 0);
          const tipRev = txData.filter(tx => tx.type === 'tip').reduce((sum, tx) => sum + tx.amount, 0);
          
          setStats(prev => ({
            ...prev,
            totalRevenue: total,
            monthlyRevenue: thisMonth,
            subscriptionRevenue: subscriptionRev,
            tipRevenue: tipRev,
          }));
        }
        
        // Load subscriptions
        const { data: subsData } = await supabase
          .from('subscriptions')
          .select(`
            *,
            subscriber:profiles!subscriber_id (
              display_name,
              email
            )
          `)
          .eq('channel_id', channel.id)
          .eq('status', 'active');
        
        if (subsData) {
          setSubscriptions(subsData as any);
          setStats(prev => ({
            ...prev,
            activeSubscribers: subsData.length,
            averageRevenuePerUser: subsData.length > 0 ? prev.subscriptionRevenue / subsData.length : 0,
          }));
        }
      } catch (error) {
        console.error('Error loading monetization data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [supabase]);
  
  // ============================================================================
  // FORMAT CURRENCY
  // ============================================================================
  
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Monetization</h1>
        <p className="text-surface-400 mt-1">Manage your earnings and subscriptions</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 bg-surface-900 rounded-lg border border-surface-700">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-surface-400">Total Revenue</p>
            <span className="text-2xl">💰</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalRevenue)}</p>
          <p className="text-xs text-surface-500 mt-1">All time</p>
        </div>
        
        <div className="p-6 bg-surface-900 rounded-lg border border-surface-700">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-surface-400">This Month</p>
            <span className="text-2xl">📈</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(stats.monthlyRevenue)}</p>
          <p className="text-xs text-green-500 mt-1">+12% from last month</p>
        </div>
        
        <div className="p-6 bg-surface-900 rounded-lg border border-surface-700">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-surface-400">Active Subscribers</p>
            <span className="text-2xl">👥</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.activeSubscribers}</p>
          <p className="text-xs text-surface-500 mt-1">{formatCurrency(stats.averageRevenuePerUser)} avg/user</p>
        </div>
        
        <div className="p-6 bg-surface-900 rounded-lg border border-surface-700">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-surface-400">Available Balance</p>
            <span className="text-2xl">🏦</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(stats.monthlyRevenue * 0.85)}</p>
          <p className="text-xs text-surface-500 mt-1">Ready to withdraw</p>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-surface-700">
        <div className="flex gap-6">
          {['overview', 'subscriptions', 'tips', 'payouts'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-1 py-3 text-sm font-medium capitalize transition-colors relative ${
                activeTab === tab
                  ? 'text-white'
                  : 'text-surface-400 hover:text-surface-300'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600" />
              )}
            </button>
          ))}
        </div>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Revenue Breakdown */}
          <div className="p-6 bg-surface-900 rounded-lg border border-surface-700">
            <h2 className="text-lg font-semibold text-white mb-4">Revenue Breakdown</h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-surface-300">Subscriptions</span>
                  <span className="text-sm font-medium text-white">{formatCurrency(stats.subscriptionRevenue)}</span>
                </div>
                <div className="w-full bg-surface-800 rounded-full h-2">
                  <div
                    className="bg-brand-600 h-2 rounded-full"
                    style={{ width: `${(stats.subscriptionRevenue / stats.totalRevenue) * 100 || 0}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-surface-300">Tips & Donations</span>
                  <span className="text-sm font-medium text-white">{formatCurrency(stats.tipRevenue)}</span>
                </div>
                <div className="w-full bg-surface-800 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${(stats.tipRevenue / stats.totalRevenue) * 100 || 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Recent Transactions */}
          <div className="p-6 bg-surface-900 rounded-lg border border-surface-700">
            <h2 className="text-lg font-semibold text-white mb-4">Recent Transactions</h2>
            <div className="space-y-3">
              {transactions.slice(0, 10).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-3 border-b border-surface-800 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-white capitalize">{tx.type.replace('_', ' ')}</p>
                    <p className="text-xs text-surface-400">
                      {new Date(tx.created_at).toLocaleDateString()} at {new Date(tx.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">{formatCurrency(tx.amount, tx.currency)}</p>
                    <Badge
                      variant={
                        tx.status === 'completed' ? 'success' :
                        tx.status === 'pending' ? 'warning' :
                        tx.status === 'failed' ? 'danger' :
                        'default'
                      }
                      size="sm"
                    >
                      {tx.status}
                    </Badge>
                  </div>
                </div>
              ))}
              
              {transactions.length === 0 && (
                <div className="text-center py-8 text-surface-500">
                  No transactions yet
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'subscriptions' && (
        <div className="p-6 bg-surface-900 rounded-lg border border-surface-700">
          <h2 className="text-lg font-semibold text-white mb-4">Active Subscriptions</h2>
          <div className="space-y-3">
            {subscriptions.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between py-3 border-b border-surface-800 last:border-0">
                <div>
                  <p className="text-sm font-medium text-white">{sub.subscriber.display_name}</p>
                  <p className="text-xs text-surface-400">{sub.subscriber.email}</p>
                </div>
                <div className="text-right">
                  <Badge variant="success" size="sm">{sub.tier}</Badge>
                  <p className="text-xs text-surface-400 mt-1">
                    Since {new Date(sub.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
            
            {subscriptions.length === 0 && (
              <div className="text-center py-8 text-surface-500">
                No active subscriptions yet
              </div>
            )}
          </div>
        </div>
      )}
      
      {activeTab === 'tips' && (
        <div className="p-6 bg-surface-900 rounded-lg border border-surface-700">
          <h2 className="text-lg font-semibold text-white mb-4">Tips & Donations</h2>
          <div className="space-y-3">
            {transactions.filter(tx => tx.type === 'tip').map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-3 border-b border-surface-800 last:border-0">
                <div>
                  <p className="text-sm font-medium text-white">Tip received</p>
                  <p className="text-xs text-surface-400">
                    {new Date(tx.created_at).toLocaleDateString()} at {new Date(tx.created_at).toLocaleTimeString()}
                  </p>
                </div>
                <p className="text-lg font-bold text-green-500">{formatCurrency(tx.amount, tx.currency)}</p>
              </div>
            ))}
            
            {transactions.filter(tx => tx.type === 'tip').length === 0 && (
              <div className="text-center py-8 text-surface-500">
                No tips received yet
              </div>
            )}
          </div>
        </div>
      )}
      
      {activeTab === 'payouts' && (
        <div className="space-y-6">
          {/* Payout Settings */}
          <div className="p-6 bg-surface-900 rounded-lg border border-surface-700">
            <h2 className="text-lg font-semibold text-white mb-4">Payout Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-2">
                  Payout Method
                </label>
                <select className="w-full px-4 py-2 bg-surface-800 border border-surface-700 rounded-lg text-white">
                  <option>Bank Transfer</option>
                  <option>PayPal</option>
                  <option>Stripe</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-2">
                  Minimum Payout Amount
                </label>
                <input
                  type="number"
                  defaultValue="100"
                  className="w-full px-4 py-2 bg-surface-800 border border-surface-700 rounded-lg text-white"
                />
              </div>
              
              <button className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors">
                Request Payout
              </button>
            </div>
          </div>
          
          {/* Payout History */}
          <div className="p-6 bg-surface-900 rounded-lg border border-surface-700">
            <h2 className="text-lg font-semibold text-white mb-4">Payout History</h2>
            <div className="text-center py-8 text-surface-500">
              No payouts yet
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
