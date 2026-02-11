'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import PersonalizedHome from './PersonalizedHome';

// The landing page components (will render if not logged in)
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import TrendingVideos from '@/components/TrendingVideos';

export default function HomePageWrapper() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);
      setLoading(false);
    }
    checkAuth();
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show personalized home for logged-in users
  if (user) {
    return <PersonalizedHome />;
  }

  // Show landing page for non-logged-in users
  return <LandingPage />;
}

// ─── Landing Page for Non-Logged-In Users ────────────────────────────
function LandingPage() {
  return (
    <>
      <Hero />
      <LogoMarquee />
      <TrendingVideos />
      <BentoFeatures />
      <FeaturedCreators />
      <CTASection />
    </>
  );
}

// ─── Hero Section ────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0 bg-surface-950" />
      <div className="absolute inset-0 bg-grid opacity-100" />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-500/[0.07] rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent-gold/[0.04] rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />

      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          <div className="lg:col-span-7">
            <div className="flex items-center gap-4 sm:gap-6 mb-10">
              <img src="/youCastlogoorange.png" alt="YouCast" className="h-24 sm:h-32 lg:h-40 w-auto" />
              <span className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold tracking-tight text-brand-400">YOUCAST</span>
            </div>

            <div className="flex items-center gap-3 mb-8">
              <div className="marker" />
              <span className="text-sm font-medium text-surface-400 tracking-wide uppercase">Now in Open Beta</span>
            </div>

            <h1 className="font-display text-[3.25rem] sm:text-display-lg lg:text-display-xl font-bold text-white leading-[0.95] tracking-tight mb-8">
              Your content.<br />
              <span className="text-brand-500">Your network.</span><br />
              Your rules.
            </h1>

            <p className="text-lg sm:text-xl text-surface-400 max-w-xl leading-relaxed mb-10">
              The platform built for independent creators, podcasters, churches, and media networks.
              Stream live, publish on-demand, grow your audience.
            </p>

            <div className="flex flex-col sm:flex-row items-start gap-4 mb-14">
              <Link href="/auth/signup">
                <Button size="xl">
                  Start Creating — Free
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Button>
              </Link>
              <Link href="/watch">
                <Button variant="ghost" size="xl">
                  Explore Content
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-8 sm:gap-12">
              {[
                { value: '10K+', label: 'Creators' },
                { value: '50M+', label: 'Views' },
                { value: '99.9%', label: 'Uptime' },
              ].map((stat, i) => (
                <div key={stat.label} className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-display font-bold text-white">{stat.value}</span>
                  <span className="text-sm text-surface-500">{stat.label}</span>
                  {i < 2 && <div className="hidden sm:block w-px h-6 bg-surface-700 ml-4" />}
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 relative hidden lg:block">
            <div className="relative">
              <div className="bg-surface-900 border border-surface-700/50 rounded-2xl overflow-hidden glow-brand-sm">
                <div className="aspect-video bg-surface-800 relative">
                  <div className="absolute inset-0 bg-grid opacity-50" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-brand-500/20 flex items-center justify-center backdrop-blur-sm border border-brand-500/30">
                      <svg className="w-7 h-7 text-brand-400 ml-1" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <Badge variant="live" dot size="sm">LIVE</Badge>
                    <span className="text-xs text-surface-300 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full">1,247 watching</span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="text-center text-surface-500 text-sm">Loading broadcast...</div>
                </div>
              </div>

              <div className="absolute -bottom-6 -left-8 bg-surface-800 border border-surface-700/50 rounded-xl p-3 backdrop-blur-xl animate-float shadow-2xl shadow-black/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-accent-emerald" />
                  <span className="text-xs font-medium text-surface-300">Viewers Today</span>
                </div>
                <div className="text-xl font-display font-bold text-white">24,891</div>
                <div className="text-xs text-accent-emerald">+18.2% from yesterday</div>
              </div>

              <div className="absolute -top-4 -right-6 bg-surface-800 border border-surface-700/50 rounded-xl p-3 backdrop-blur-xl shadow-2xl shadow-black/50" style={{ animationDelay: '3s', animation: 'float 6s ease-in-out infinite' }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-accent-gold" />
                  <span className="text-xs font-medium text-surface-300">Revenue</span>
                </div>
                <div className="text-xl font-display font-bold text-white">$8,420</div>
                <div className="text-xs text-accent-gold">This month</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 divider" />
    </section>
  );
}

// ─── Marquee / Social proof ──────────────────────────────────────────
function LogoMarquee() {
  const labels = ['Churches', 'Podcasters', 'News Networks', 'Educators', 'Gamers', 'Musicians', 'Nonprofits', 'Independent Media'];
  return (
    <section className="relative py-12 border-b border-surface-800/50 overflow-hidden">
      <div className="absolute inset-0 bg-surface-900/30" />
      <div className="relative flex animate-marquee whitespace-nowrap">
        {[...labels, ...labels].map((label, i) => (
          <span key={i} className="mx-8 sm:mx-12 text-sm font-display font-medium text-surface-500 uppercase tracking-widest flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-surface-600" />
            {label}
          </span>
        ))}
      </div>
    </section>
  );
}

// ─── Bento Grid Features ─────────────────────────────────────────────
function BentoFeatures() {
  return (
    <section className="section-padding noise">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mb-16">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-brand-400 mb-4">
            <span className="w-8 h-px bg-brand-500" />
            PLATFORM
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-5 tracking-tight">
            Everything you need to build your media empire
          </h2>
          <p className="text-lg text-surface-400 leading-relaxed">
            Professional-grade tools for streaming, publishing, analytics, and monetization — designed for scale.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          <div className="lg:col-span-2 group bg-surface-900 border border-surface-800 rounded-2xl p-8 relative overflow-hidden card-hover">
            <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/[0.03] rounded-full blur-[80px] group-hover:bg-brand-500/[0.06] transition-all duration-700" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-xs font-mono text-surface-500 uppercase tracking-wider">01</span>
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-white mb-3">Live Streaming Studio</h3>
              <p className="text-surface-400 leading-relaxed max-w-lg">
                Multi-camera switching, audio mixing, overlays, and scene management — all in your browser. No software to install.
              </p>
              <div className="mt-8 grid grid-cols-4 gap-2">
                {['Scene 1', 'Scene 2', 'Camera', 'Screen'].map((s) => (
                  <div key={s} className="bg-surface-800 border border-surface-700/50 rounded-lg py-2 px-3 text-xs text-surface-500 text-center">
                    {s}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="group bg-surface-900 border border-surface-800 rounded-2xl p-8 relative overflow-hidden card-hover">
            <div className="absolute top-0 right-0 w-40 h-40 bg-accent-emerald/[0.05] rounded-full blur-[60px] group-hover:bg-accent-emerald/[0.1] transition-all duration-700" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-accent-emerald/10 border border-accent-emerald/20 flex items-center justify-center text-accent-emerald">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                </div>
                <span className="text-xs font-mono text-surface-500 uppercase tracking-wider">02</span>
              </div>
              <h3 className="font-display text-xl font-bold text-white mb-3">Real-Time Analytics</h3>
              <p className="text-surface-400 leading-relaxed">
                Track views, engagement, revenue, and audience demographics with enterprise-grade analytics.
              </p>
            </div>
          </div>

          <div className="group bg-surface-900 border border-surface-800 rounded-2xl p-8 relative overflow-hidden card-hover">
            <div className="absolute top-0 right-0 w-40 h-40 bg-accent-gold/[0.05] rounded-full blur-[60px] group-hover:bg-accent-gold/[0.1] transition-all duration-700" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-accent-gold/10 border border-accent-gold/20 flex items-center justify-center text-accent-gold">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-xs font-mono text-surface-500 uppercase tracking-wider">03</span>
              </div>
              <h3 className="font-display text-xl font-bold text-white mb-3">Monetization</h3>
              <p className="text-surface-400 leading-relaxed">
                Subscriptions, tips, pay-per-view, and ad revenue. Keep 90% of what you earn.
              </p>
            </div>
          </div>

          <div className="lg:col-span-2 group bg-surface-900 border border-surface-800 rounded-2xl p-8 relative overflow-hidden card-hover">
            <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/[0.03] rounded-full blur-[80px] group-hover:bg-purple-500/[0.06] transition-all duration-700" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
                  </svg>
                </div>
                <span className="text-xs font-mono text-surface-500 uppercase tracking-wider">04</span>
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-white mb-3">Multi-Platform Distribution</h3>
              <p className="text-surface-400 leading-relaxed max-w-lg">
                Simulcast to YouTube, Facebook, Twitch, and custom RTMP destinations. Reach your audience wherever they are.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Featured Creators ───────────────────────────────────────────────
function FeaturedCreators() {
  const creators = [
    { name: 'The Daily Brief', type: 'News Network', subs: '89K', avatar: 'D', color: 'bg-cyan-600' },
    { name: 'CodeWithSarah', type: 'Tech Education', subs: '67K', avatar: 'C', color: 'bg-purple-600' },
    { name: 'Indie Music Weekly', type: 'Music', subs: '45K', avatar: 'I', color: 'bg-pink-600' },
  ];

  return (
    <section className="section-padding bg-surface-900/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-brand-400 mb-4">
            <span className="w-8 h-px bg-brand-500" />
            CREATORS
            <span className="w-8 h-px bg-brand-500" />
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
            Join thousands of creators
          </h2>
          <p className="text-surface-400">
            From churches to podcasters to independent news networks — creators of all kinds are building on Youcast.
          </p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {creators.map((c) => (
            <div key={c.name} className="bg-surface-900 border border-surface-800 rounded-2xl p-6 text-center card-hover">
              <div className={`w-16 h-16 rounded-full ${c.color} flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4`}>
                {c.avatar}
              </div>
              <h3 className="font-semibold text-white mb-1">{c.name}</h3>
              <p className="text-xs text-surface-500 mb-2">{c.type}</p>
              <p className="text-sm text-brand-400 font-medium">{c.subs} subscribers</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA Section ─────────────────────────────────────────────────────
function CTASection() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-brand-600/20" />
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-[120px]" />
      <div className="relative py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2 mb-8">
            <span className="w-2 h-2 rounded-full bg-accent-emerald animate-pulse" />
            <span className="text-sm text-white/80">Open Beta — Free to join</span>
          </div>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
            Ready to own your content?
          </h2>
          <div className="max-w-2xl mx-auto mb-10">
            <p className="text-lg sm:text-xl text-white/70 leading-relaxed">
              Stop renting audiences on platforms that don&apos;t care about you. Build something real.
              No algorithms. No gatekeepers.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="xl" className="bg-white text-surface-900 hover:bg-surface-100 shadow-2xl font-semibold">
                Create Your Channel
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="xl" className="border-white/20 text-white hover:bg-white/10">
                Talk to Our Team
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
