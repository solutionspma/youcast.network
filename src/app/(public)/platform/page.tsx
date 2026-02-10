// ============================================================================
// PLATFORM PAGE — ROLE-AWARE NAVIGATION
// No technical architecture exposure
// Module cards route conditionally based on user access
// ============================================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Platform' };

// ─── Module Configuration ────────────────────────────────────────────────────

type PlatformModule = {
  num: string;
  title: string;
  desc: string;
  status: 'Live' | 'Beta' | 'Preview' | 'Coming Soon';
  href: string;
  requiredTier: 'free' | 'creator' | 'pro' | 'enterprise' | null;
  adminOnly?: boolean;
  icon: React.ReactNode;
};

const platformModules: PlatformModule[] = [
  { 
    num: '01', 
    title: 'Stream Studio', 
    desc: 'Browser-based live production suite with multi-camera support, scene switching, audio mixing, and real-time overlays.', 
    status: 'Live',
    href: '/dashboard/stream-studio',
    requiredTier: 'free',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    )
  },
  { 
    num: '02', 
    title: 'Media CMS', 
    desc: 'Upload, transcode, manage, and distribute video and audio content with metadata tagging and smart search.', 
    status: 'Live',
    href: '/dashboard/media',
    requiredTier: 'free',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    )
  },
  { 
    num: '03', 
    title: 'Analytics Engine', 
    desc: 'Real-time and historical analytics with audience demographics, engagement heatmaps, and retention metrics.', 
    status: 'Live',
    href: '/dashboard/analytics',
    requiredTier: 'free',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )
  },
  { 
    num: '04', 
    title: 'Monetization Suite', 
    desc: 'Subscriptions, tips, pay-per-view, ad insertion, and sponsorship management with creator-first revenue splits.', 
    status: 'Beta',
    href: '/dashboard/monetization',
    requiredTier: 'creator',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  { 
    num: '05', 
    title: 'Distribution Network', 
    desc: 'Simulcast to YouTube, Facebook, Twitch, and custom RTMP/SRT endpoints. Schedule and automate releases.', 
    status: 'Live',
    href: '/dashboard/destinations',
    requiredTier: 'creator',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
    )
  },
  { 
    num: '06', 
    title: 'Audience CRM', 
    desc: 'Subscriber management, segmentation, automated email sequences, and community engagement tools.', 
    status: 'Beta',
    href: '/dashboard/audience',
    requiredTier: 'pro',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  },
  { 
    num: '07', 
    title: 'Developer API', 
    desc: 'REST API with webhooks, OAuth2 authentication, rate limiting, and comprehensive documentation.', 
    status: 'Preview',
    href: '/dashboard/developer',
    requiredTier: 'pro',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    )
  },
  { 
    num: '08', 
    title: 'White-Label Networks', 
    desc: 'Deploy your own branded media platform powered by Youcast infrastructure. Custom domains, branding, and admin.', 
    status: 'Coming Soon',
    href: '/dashboard/admin',
    requiredTier: 'enterprise',
    adminOnly: true,
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    )
  },
];

const stats = [
  { value: '99.99%', label: 'Target Uptime SLA' },
  { value: '<100ms', label: 'Global Latency' },
  { value: '∞', label: 'Horizontal Scale' },
  { value: '50+', label: 'Edge Locations' },
];

// ─── Tier Comparison ─────────────────────────────────────────────────────────

const tierOrder: Record<string, number> = {
  guest: 0,
  free: 1,
  creator: 2,
  pro: 3,
  enterprise: 4,
};

function hasAccess(userTier: string | null, requiredTier: string | null): boolean {
  if (!requiredTier) return true;
  if (!userTier) return false;
  return (tierOrder[userTier] || 0) >= (tierOrder[requiredTier] || 0);
}

function getUpgradeTier(requiredTier: string): string {
  switch (requiredTier) {
    case 'creator': return 'Creator ($12/mo)';
    case 'pro': return 'Pro ($29/mo)';
    case 'enterprise': return 'Enterprise';
    default: return 'upgrade';
  }
}

// ─── Module Card Component ───────────────────────────────────────────────────

function ModuleCard({ 
  module, 
  userTier, 
  isAdmin,
  isLoggedIn 
}: { 
  module: PlatformModule; 
  userTier: string | null;
  isAdmin: boolean;
  isLoggedIn: boolean;
}) {
  const canAccess = isLoggedIn && (isAdmin || (hasAccess(userTier, module.requiredTier) && (!module.adminOnly || isAdmin)));
  const needsUpgrade = isLoggedIn && !canAccess;
  
  const statusColors = {
    Live: 'success',
    Beta: 'warning',
    Preview: 'info',
    'Coming Soon': 'default',
  } as const;

  const CardContent = (
    <div className={`bg-surface-900 border border-surface-800 rounded-2xl p-6 h-full transition-all ${
      canAccess ? 'card-hover cursor-pointer' : ''
    } ${needsUpgrade ? 'opacity-75' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400">
          {module.icon}
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={statusColors[module.status]}
            size="sm"
          >
            {module.status}
          </Badge>
          {needsUpgrade && (
            <Badge variant="default" size="sm">
              Upgrade
            </Badge>
          )}
        </div>
      </div>
      <h3 className="text-base font-semibold text-white mb-2">{module.title}</h3>
      <p className="text-sm text-surface-400 leading-relaxed mb-4">{module.desc}</p>
      
      {needsUpgrade && (
        <p className="text-xs text-brand-400">
          Requires {getUpgradeTier(module.requiredTier || 'creator')}
        </p>
      )}
      
      {!isLoggedIn && (
        <p className="text-xs text-surface-500">
          Sign in to access
        </p>
      )}
    </div>
  );

  if (canAccess) {
    return (
      <Link href={module.href}>
        {CardContent}
      </Link>
    );
  }

  if (needsUpgrade) {
    return (
      <Link href="/dashboard/settings/subscription">
        {CardContent}
      </Link>
    );
  }

  if (!isLoggedIn) {
    return (
      <Link href="/auth/login">
        {CardContent}
      </Link>
    );
  }

  return CardContent;
}

// ─── Page Component ──────────────────────────────────────────────────────────

export default async function PlatformPage() {
  const supabase = createServerSupabaseClient();
  
  // Check authentication and get user profile
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;
  
  let userTier: string | null = null;
  let isAdmin = false;
  
  if (isLoggedIn) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('tier, global_admin')
      .eq('id', user.id)
      .single();
    
    userTier = profile?.tier || 'free';
    isAdmin = profile?.global_admin === true;
  }

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-brand-400 mb-4">
            <span className="w-8 h-px bg-brand-500" />PLATFORM
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-white mb-6 leading-tight max-w-4xl">
            Built for millions of creators
          </h1>
          <p className="text-lg text-surface-400 max-w-2xl mb-8">
            Youcast is a scalable media infrastructure platform. Every module is designed for reliability, performance, and continuous expansion.
          </p>
          {!isLoggedIn && (
            <Link href="/auth/signup">
              <Button size="xl">Get Early Access</Button>
            </Link>
          )}
          {isLoggedIn && (
            <Link href="/dashboard">
              <Button size="xl">Go to Dashboard</Button>
            </Link>
          )}
        </div>
      </section>

      {/* Platform Modules */}
      <section className="section-padding bg-surface-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-14">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-brand-400 mb-4">
              <span className="w-8 h-px bg-brand-500" />MODULES
            </span>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">Platform Modules</h2>
            <p className="text-surface-400 text-lg">
              {isLoggedIn 
                ? 'Click any module to access it directly. Upgrade your plan to unlock more features.'
                : 'Each module is independently scalable. Sign in to access your tools.'}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {platformModules.map((mod) => (
              <ModuleCard 
                key={mod.title}
                module={mod}
                userTier={userTier}
                isAdmin={isAdmin}
                isLoggedIn={isLoggedIn}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Scale Stats */}
      <section className="section-padding">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-brand-400 mb-4">
              <span className="w-8 h-px bg-brand-500" />SCALE
            </span>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-white">Designed for scale</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl sm:text-4xl font-display font-bold text-white mb-2">{stat.value}</div>
                <div className="text-sm text-surface-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tier Comparison (Logged In Only) */}
      {isLoggedIn && (
        <section className="section-padding bg-surface-900/50">
          <div className="max-w-7xl mx-auto">
            <div className="mb-10">
              <span className="inline-flex items-center gap-2 text-sm font-medium text-brand-400 mb-4">
                <span className="w-8 h-px bg-brand-500" />YOUR PLAN
              </span>
              <h2 className="text-2xl font-display font-bold text-white mb-2">
                You&apos;re on the <span className="text-brand-400 capitalize">{userTier}</span> tier
              </h2>
              <p className="text-surface-400">
                {userTier === 'free' && 'Upgrade to Creator or Pro to unlock monetization, multi-platform streaming, and CRM tools.'}
                {userTier === 'creator' && 'Upgrade to Pro to unlock API access, advanced CRM, and priority support.'}
                {userTier === 'pro' && 'You have access to nearly all features. Contact us for Enterprise customization.'}
                {userTier === 'enterprise' && 'You have full access to all platform features including white-label options.'}
              </p>
            </div>
            <div className="flex gap-4">
              {userTier !== 'enterprise' && (
                <Link href="/dashboard/settings/subscription">
                  <Button>Upgrade Plan</Button>
                </Link>
              )}
              <Link href="/dashboard">
                <Button variant="outline">Go to Dashboard</Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA for Logged Out */}
      {!isLoggedIn && (
        <section className="section-padding bg-surface-900/50">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-display font-bold text-white mb-4">Ready to get started?</h2>
            <p className="text-surface-400 text-lg mb-8">
              Join thousands of creators building their media presence on Youcast.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg">Create Account</Button>
              </Link>
              <Link href="/auth/login">
                <Button variant="outline" size="lg">Sign In</Button>
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
