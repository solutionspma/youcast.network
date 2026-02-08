'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

export default function AdminPage() {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'users' | 'content' | 'settings'>('overview');

  // Real stats from Supabase - placeholder values until connected
  const stats = {
    totalUsers: 0,
    activeCreators: 0,
    totalViews: 0,
    totalRevenue: 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">Admin Control Panel</h1>
          <p className="text-surface-400">Master administrative dashboard — full platform control</p>
        </div>
        <Badge variant="live">Master Admin</Badge>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-surface-800 pb-px">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'users', label: 'Users & Accounts' },
          { id: 'content', label: 'Content Management' },
          { id: 'settings', label: 'System Settings' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id as typeof selectedTab)}
            className={`px-4 py-2 text-sm font-medium transition-colors relative ${
              selectedTab === tab.id
                ? 'text-brand-400'
                : 'text-surface-400 hover:text-white'
            }`}
          >
            {tab.label}
            {selectedTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500" />
            )}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-surface-400">Total Users</span>
                <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="text-2xl font-display font-bold text-white">{stats.totalUsers.toLocaleString()}</div>
              <div className="text-xs text-surface-500 mt-1">—</div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-surface-400">Active Creators</span>
                <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-2xl font-display font-bold text-white">{stats.activeCreators.toLocaleString()}</div>
              <div className="text-xs text-surface-500 mt-1">—</div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-surface-400">Total Views</span>
                <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div className="text-2xl font-display font-bold text-white">{stats.totalViews === 0 ? '0' : `${(stats.totalViews / 1000000).toFixed(1)}M`}</div>
              <div className="text-xs text-surface-500 mt-1">—</div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-surface-400">Revenue (MRR)</span>
                <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-2xl font-display font-bold text-white">${stats.totalRevenue === 0 ? '0' : `${(stats.totalRevenue / 1000).toFixed(1)}K`}</div>
              <div className="text-xs text-surface-500 mt-1">—</div>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="p-6">
            <h2 className="text-lg font-display font-bold text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="secondary" className="justify-start">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Create New User
              </Button>
              <Button variant="secondary" className="justify-start">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
                Send Platform Announcement
              </Button>
              <Button variant="secondary" className="justify-start">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                View Analytics Report
              </Button>
            </div>
          </Card>

          {/* System Health */}
          <Card className="p-6">
            <h2 className="text-lg font-display font-bold text-white mb-4">System Health</h2>
            <div className="space-y-3">
              {[
                { service: 'API Services', status: 'operational', uptime: '99.98%' },
                { service: 'Video Streaming', status: 'operational', uptime: '99.95%' },
                { service: 'Database', status: 'operational', uptime: '100%' },
                { service: 'CDN & Storage', status: 'operational', uptime: '99.99%' },
              ].map((item) => (
                <div key={item.service} className="flex items-center justify-between py-2 border-b border-surface-800 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-white">{item.service}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-surface-400">Uptime: {item.uptime}</span>
                    <Badge>{item.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Users Tab */}
      {selectedTab === 'users' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-display font-bold text-white">User Management</h2>
            <Button>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add User
            </Button>
          </div>
          <div className="text-surface-400 text-center py-12">
            <p className="mb-4">User management will be available once Supabase is configured.</p>
            <p className="text-sm">You&apos;ll be able to view all users, manage roles, suspend accounts, and more.</p>
          </div>
        </Card>
      )}

      {/* Content Tab */}
      {selectedTab === 'content' && (
        <Card className="p-6">
          <h2 className="text-lg font-display font-bold text-white mb-6">Content Management System</h2>
          <div className="text-surface-400 text-center py-12">
            <p className="mb-4">CMS features coming soon.</p>
            <p className="text-sm">Moderate content, manage featured creators, configure content policies.</p>
          </div>
        </Card>
      )}

      {/* Settings Tab */}
      {selectedTab === 'settings' && (
        <Card className="p-6">
          <h2 className="text-lg font-display font-bold text-white mb-6">System Settings</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-white font-semibold mb-2">Platform Configuration</h3>
              <p className="text-sm text-surface-400 mb-4">Core platform settings and feature flags</p>
              <div className="space-y-2">
                {[
                  { feature: 'User Registration', enabled: true },
                  { feature: 'Live Streaming', enabled: true },
                  { feature: 'Monetization', enabled: false },
                  { feature: 'White-label Networks', enabled: false },
                ].map((item) => (
                  <div key={item.feature} className="flex items-center justify-between py-2 px-3 bg-surface-800/50 rounded-lg">
                    <span className="text-white">{item.feature}</span>
                    <Badge variant={item.enabled ? 'live' : 'default'}>
                      {item.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-2">Master Admin Email</h3>
              <p className="text-sm text-surface-400 mb-2">
                Current: <strong className="text-brand-400">solutions@pitchmarketing.agency</strong>
              </p>
              <p className="text-xs text-surface-500">
                This email has full platform access including CRM, CMS, billing, and all admin functions.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
