// ============================================================================
// CREATORS PAGE — LOGGED-IN VS LOGGED-OUT SPLIT
// Logged out: Marketing, pricing, apply buttons
// Logged in: My Channel, My Content, Creator Tools, Recommended Creators
// ============================================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Creators' };

// ─── Marketing Content (Logged Out Only) ─────────────────────────────────────

const benefits = [
  { num: '01', title: 'Professional Streaming Studio', desc: 'Multi-camera switching, scene management, audio mixing, and live overlays — all browser-based.' },
  { num: '02', title: 'Deep Analytics', desc: 'Real-time viewer metrics, audience demographics, engagement tracking, and growth insights.' },
  { num: '03', title: 'Built-in Monetization', desc: 'Subscriptions, tips, pay-per-view, and sponsorships. Keep the majority of your earnings.' },
  { num: '04', title: 'Multi-Platform Distribution', desc: 'Simulcast to YouTube, Facebook, Twitch, and any custom RTMP destination simultaneously.' },
  { num: '05', title: 'Creator API', desc: 'Programmatic access to your data, content management, and automated workflows.' },
  { num: '06', title: 'Content Ownership', desc: 'You own your content, your audience data, and your monetization. No platform lock-in.' },
];

const tiers = [
  { name: 'Starter', price: 'Free', features: ['1 channel', '720p streaming', '10GB storage', 'Basic analytics', 'Community support'], cta: 'Get Started Free' },
  { name: 'Pro', price: '$29/mo', features: ['5 channels', '1080p streaming', '500GB storage', 'Advanced analytics', 'Monetization tools', 'Custom branding', 'Priority support'], cta: 'Start Pro Trial', highlighted: true },
  { name: 'Network', price: '$199/mo', features: ['Unlimited channels', '4K streaming', '5TB storage', 'Enterprise analytics', 'White-label option', 'API access', 'Dedicated support', 'Multi-tenant admin'], cta: 'Contact Sales' },
];

// ─── Creator Tools (Logged In Only) ──────────────────────────────────────────

const creatorTools = [
  { 
    title: 'Stream Studio', 
    desc: 'Go live with multi-camera, scenes, and overlays', 
    href: '/dashboard/stream-studio',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    )
  },
  { 
    title: 'Media Library', 
    desc: 'Upload and manage your content', 
    href: '/dashboard/media',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    )
  },
  { 
    title: 'Analytics', 
    desc: 'Track performance and audience insights', 
    href: '/dashboard/analytics',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )
  },
  { 
    title: 'Monetization', 
    desc: 'Earnings, subscriptions, and payouts', 
    href: '/dashboard/monetization',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  { 
    title: 'Destinations', 
    desc: 'Configure multi-platform streaming', 
    href: '/dashboard/destinations',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
    )
  },
  { 
    title: 'Settings', 
    desc: 'Channel settings and profile', 
    href: '/dashboard/settings',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default async function CreatorsPage() {
  const supabase = createServerSupabaseClient();
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  // If logged in, fetch user profile and their channel/content
  let profile: any = null;
  let userChannel: any = null;
  let recentContent: any[] = [];
  let userCommunities: any[] = [];
  let recommendedCreators: any[] = [];

  if (isLoggedIn) {
    // Fetch profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    profile = profileData;

    // Fetch user's channel
    const { data: channelData } = await supabase
      .from('channels')
      .select('*')
      .eq('owner_id', user.id)
      .single();
    userChannel = channelData;

    // Fetch recent content
    if (userChannel) {
      const { data: contentData } = await supabase
        .from('media')
        .select('id, title, thumbnail_url, views, published_at, status')
        .eq('channel_id', userChannel.id)
        .order('created_at', { ascending: false })
        .limit(6);
      recentContent = contentData || [];
    }

    // Fetch user's communities
    const { data: membershipData } = await supabase
      .from('group_memberships')
      .select(`
        community_groups (
          id, name, slug, description, member_count, icon
        )
      `)
      .eq('user_id', user.id)
      .limit(4);
    userCommunities = (membershipData || []).map((m: any) => m.community_groups).filter(Boolean);

    // Fetch recommended creators (popular channels user isn't following)
    const { data: creatorsData } = await supabase
      .from('channels')
      .select('id, name, handle, thumbnail_url, subscriber_count')
      .neq('owner_id', user.id)
      .order('subscriber_count', { ascending: false })
      .limit(6);
    recommendedCreators = creatorsData || [];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LOGGED-IN VIEW — Creator Dashboard
  // ═══════════════════════════════════════════════════════════════════════════
  
  if (isLoggedIn) {
    return (
      <div className="min-h-screen bg-surface-950">
        {/* Header */}
        <section className="relative overflow-hidden border-b border-surface-800">
          <div className="absolute inset-0 bg-grid opacity-5" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-3xl font-bold text-white">
                {profile?.display_name?.[0] || profile?.email?.[0] || 'C'}
              </div>
              <div>
                <h1 className="text-3xl font-display font-bold text-white">
                  Welcome back, {profile?.display_name || 'Creator'}
                </h1>
                <p className="text-surface-400 mt-1">
                  {userChannel ? userChannel.name : 'Create your channel to get started'}
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <Badge variant={profile?.tier === 'pro' ? 'brand' : profile?.tier === 'enterprise' ? 'success' : 'default'}>
                    {profile?.tier || 'free'} tier
                  </Badge>
                  {userChannel && (
                    <span className="text-sm text-surface-500">
                      {userChannel.subscriber_count || 0} subscribers
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Creator Tools Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-brand-400 mb-2">
              <span className="w-8 h-px bg-brand-500" />QUICK ACCESS
            </span>
            <h2 className="text-2xl font-display font-bold text-white">Creator Tools</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {creatorTools.map((tool) => (
              <Link key={tool.title} href={tool.href}>
                <div className="bg-surface-900 border border-surface-800 rounded-xl p-5 text-center card-hover group">
                  <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center mx-auto mb-3 text-brand-400 group-hover:bg-brand-500/20 transition-colors">
                    {tool.icon}
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1">{tool.title}</h3>
                  <p className="text-xs text-surface-500 line-clamp-2">{tool.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* My Content */}
        {recentContent.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="inline-flex items-center gap-2 text-sm font-medium text-brand-400 mb-2">
                  <span className="w-8 h-px bg-brand-500" />MY CONTENT
                </span>
                <h2 className="text-2xl font-display font-bold text-white">Recent Uploads</h2>
              </div>
              <Link href="/dashboard/media" className="text-sm text-brand-400 hover:text-brand-300">
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {recentContent.map((item) => (
                <Link key={item.id} href={`/dashboard/media/${item.id}`}>
                  <div className="bg-surface-900 border border-surface-800 rounded-xl overflow-hidden card-hover">
                    <div className="aspect-video bg-surface-800 relative">
                      {item.thumbnail_url ? (
                        <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className="w-8 h-8 text-surface-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      {item.status !== 'ready' && (
                        <div className="absolute top-2 right-2">
                          <Badge variant="warning" size="sm">{item.status}</Badge>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-medium text-white line-clamp-1">{item.title}</h3>
                      <p className="text-xs text-surface-500 mt-1">{item.views || 0} views</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* My Communities */}
        {userCommunities.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="inline-flex items-center gap-2 text-sm font-medium text-brand-400 mb-2">
                  <span className="w-8 h-px bg-brand-500" />MY COMMUNITIES
                </span>
                <h2 className="text-2xl font-display font-bold text-white">Your Groups</h2>
              </div>
              <Link href="/community" className="text-sm text-brand-400 hover:text-brand-300">
                Explore More →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {userCommunities.map((group) => (
                <Link key={group.id} href={`/community/${group.slug}`}>
                  <div className="bg-surface-900 border border-surface-800 rounded-xl p-5 card-hover">
                    <h3 className="text-base font-semibold text-white mb-1">{group.name}</h3>
                    <p className="text-sm text-surface-400 line-clamp-2 mb-3">{group.description}</p>
                    <span className="text-xs text-surface-500">{group.member_count} members</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Recommended Creators */}
        {recommendedCreators.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
            <div className="mb-6">
              <span className="inline-flex items-center gap-2 text-sm font-medium text-brand-400 mb-2">
                <span className="w-8 h-px bg-brand-500" />DISCOVER
              </span>
              <h2 className="text-2xl font-display font-bold text-white">Recommended Creators</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {recommendedCreators.map((creator) => (
                <Link key={creator.id} href={`/c/${creator.handle}`}>
                  <div className="bg-surface-900 border border-surface-800 rounded-xl p-4 text-center card-hover">
                    <div className="w-16 h-16 rounded-full bg-brand-500 flex items-center justify-center text-xl font-bold text-white mx-auto mb-3">
                      {creator.thumbnail_url ? (
                        <img src={creator.thumbnail_url} alt={creator.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        creator.name[0]
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-white truncate">{creator.name}</h3>
                    <p className="text-xs text-surface-500">@{creator.handle}</p>
                    <p className="text-xs text-surface-400 mt-1">{creator.subscriber_count || 0} subs</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* No Channel CTA */}
        {!userChannel && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
            <div className="bg-gradient-to-r from-brand-900/50 to-surface-900 border border-brand-500/20 rounded-2xl p-8 text-center">
              <h2 className="text-2xl font-display font-bold text-white mb-3">
                Create Your Channel
              </h2>
              <p className="text-surface-400 mb-6 max-w-lg mx-auto">
                Set up your creator channel to start streaming, uploading content, and building your audience.
              </p>
              <Link href="/dashboard/settings/channel">
                <Button size="lg">Create Channel</Button>
              </Link>
            </div>
          </section>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LOGGED-OUT VIEW — Marketing Page
  // ═══════════════════════════════════════════════════════════════════════════
  
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-brand-400 mb-4">
            <span className="w-8 h-px bg-brand-500" />FOR CREATORS
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-white mb-6 leading-tight max-w-3xl">
            Build your media empire on Youcast
          </h1>
          <p className="text-lg text-surface-400 max-w-2xl mb-8">
            Professional tools for streaming, publishing, and growing — designed for creators who refuse to be boxed in by algorithms and platform politics.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/auth/signup">
              <Button size="xl">Apply Now</Button>
            </Link>
            <Link href="/platform">
              <Button variant="outline" size="xl">See the Platform</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="section-padding bg-surface-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-14">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-brand-400 mb-4">
              <span className="w-8 h-px bg-brand-500" />WHY YOUCAST
            </span>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">Why creators choose Youcast</h2>
            <p className="text-surface-400 text-lg">Tools built by creators, for creators.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b) => (
              <div key={b.title} className="bg-surface-900 border border-surface-800 rounded-2xl p-6 card-hover">
                <span className="text-2xl font-display font-bold text-brand-500/40 mb-4 block">{b.num}</span>
                <h3 className="text-lg font-semibold text-white mb-2">{b.title}</h3>
                <p className="text-sm text-surface-400 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="section-padding">
        <div className="max-w-7xl mx-auto">
          <div className="mb-14">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-brand-400 mb-4">
              <span className="w-8 h-px bg-brand-500" />PRICING
            </span>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">Simple, transparent pricing</h2>
            <p className="text-surface-400 text-lg">Start free. Scale as you grow.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`bg-surface-900 border rounded-2xl p-6 ${
                  tier.highlighted
                    ? 'border-brand-500/30 ring-1 ring-brand-500/20'
                    : 'border-surface-800'
                }`}
              >
                {tier.highlighted && (
                  <Badge variant="brand" size="sm" className="mb-4">Most Popular</Badge>
                )}
                <h3 className="text-xl font-display font-bold text-white mb-1">{tier.name}</h3>
                <div className="text-3xl font-display font-bold text-white mb-6">{tier.price}</div>
                <ul className="space-y-3 mb-8">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-surface-300">
                      <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/signup">
                  <Button
                    variant={tier.highlighted ? 'primary' : 'outline'}
                    fullWidth
                  >
                    {tier.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Apply CTA */}
      <section className="section-padding bg-surface-900/50">
        <div className="max-w-3xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-brand-400 mb-4">
              <span className="w-8 h-px bg-brand-500" />GET STARTED
            </span>
            <h2 className="text-3xl font-display font-bold text-white mb-4">Ready to get started?</h2>
            <p className="text-surface-400 text-lg mb-8">
              Apply for a creator account and start building your channel today. Setup takes less than 5 minutes.
            </p>
            <Link href="/auth/signup">
              <Button size="xl">Create Your Channel</Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
