import Link from 'next/link';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

// ─── Hero Section ────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 bg-surface-950" />
      <div className="absolute inset-0 bg-grid opacity-100" />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-500/[0.07] rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent-gold/[0.04] rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />

      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left: Content */}
          <div className="lg:col-span-7">
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

            {/* Stats — inline, asymmetric */}
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

          {/* Right: Visual element — floating broadcast card */}
          <div className="lg:col-span-5 relative hidden lg:block">
            <div className="relative">
              {/* Main card */}
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
                  {/* Live badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <Badge variant="live" dot size="sm">LIVE</Badge>
                    <span className="text-xs text-surface-300 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full">1,247 watching</span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-sm font-bold">E</div>
                    <div>
                      <div className="text-sm font-medium text-white">Elevation Studios</div>
                      <div className="text-xs text-surface-500">Church Media • 125K subs</div>
                    </div>
                  </div>
                  <div className="text-sm text-surface-400">Sunday Morning Worship — Live from Charlotte, NC</div>
                </div>
              </div>

              {/* Floating overlay card — analytics */}
              <div className="absolute -bottom-6 -left-8 bg-surface-800 border border-surface-700/50 rounded-xl p-3 backdrop-blur-xl animate-float shadow-2xl shadow-black/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-accent-emerald" />
                  <span className="text-xs font-medium text-surface-300">Viewers Today</span>
                </div>
                <div className="text-xl font-display font-bold text-white">24,891</div>
                <div className="text-xs text-accent-emerald">+18.2% from yesterday</div>
              </div>

              {/* Floating overlay card — earnings */}
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

      {/* Bottom divider */}
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
        {/* Section header — left-aligned, editorial */}
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

        {/* Bento grid — asymmetric */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {/* Large card — Live Streaming */}
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
              {/* Mini UI mockup */}
              <div className="mt-8 grid grid-cols-4 gap-2">
                {['Scene 1', 'Scene 2', 'Camera', 'Screen'].map((s) => (
                  <div key={s} className="bg-surface-800 border border-surface-700/50 rounded-lg py-2 px-3 text-xs text-surface-500 text-center">
                    {s}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tall card — Analytics */}
          <div className="md:row-span-2 group bg-surface-900 border border-surface-800 rounded-2xl p-8 relative overflow-hidden card-hover">
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-accent-cyan/[0.03] rounded-full blur-[80px] group-hover:bg-accent-cyan/[0.06] transition-all duration-700" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-accent-cyan/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="text-xs font-mono text-surface-500 uppercase tracking-wider">03</span>
              </div>
              <h3 className="font-display text-xl font-bold text-white mb-3">Real-Time Analytics</h3>
              <p className="text-surface-400 leading-relaxed mb-8">
                Understand your audience with detailed viewer analytics, engagement metrics, and growth tracking.
              </p>
              {/* Fake chart bars */}
              <div className="flex items-end gap-2 h-32">
                {[40, 65, 55, 80, 70, 95, 85].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t-sm bg-surface-700 relative overflow-hidden" style={{ height: `${h}%` }}>
                    <div className="absolute inset-x-0 bottom-0 bg-cyan-500/20" style={{ height: `${h * 0.6}%` }} />
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-3 text-xs text-surface-600">
                <span>Mon</span><span>Sun</span>
              </div>
            </div>
          </div>

          {/* Media Library */}
          <div className="group bg-surface-900 border border-surface-800 rounded-2xl p-8 relative overflow-hidden card-hover">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-accent-violet/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
              </div>
              <span className="text-xs font-mono text-surface-500 uppercase tracking-wider">02</span>
            </div>
            <h3 className="font-display text-xl font-bold text-white mb-3">Media Library</h3>
            <p className="text-surface-400 leading-relaxed">
              Upload, manage, and distribute video and audio with built-in transcoding and CDN delivery.
            </p>
          </div>

          {/* Distribution */}
          <div className="group bg-surface-900 border border-surface-800 rounded-2xl p-8 relative overflow-hidden card-hover">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-accent-emerald/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xs font-mono text-surface-500 uppercase tracking-wider">04</span>
            </div>
            <h3 className="font-display text-xl font-bold text-white mb-3">Multi-Platform</h3>
            <p className="text-surface-400 leading-relaxed">
              Simulcast to YouTube, Facebook, Twitch, and custom RTMP destinations from a single stream.
            </p>
          </div>

          {/* Monetization — wide */}
          <div className="group bg-surface-900 border border-surface-800 rounded-2xl p-8 relative overflow-hidden card-hover">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-accent-gold/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xs font-mono text-surface-500 uppercase tracking-wider">05</span>
            </div>
            <h3 className="font-display text-xl font-bold text-white mb-3">Monetization</h3>
            <p className="text-surface-400 leading-relaxed">
              Subscriptions, tips, pay-per-view, and sponsorship management — keep more of what you earn.
            </p>
          </div>

          {/* API */}
          <div className="group bg-surface-900 border border-surface-800 rounded-2xl p-8 relative overflow-hidden card-hover">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-surface-700 border border-surface-600 flex items-center justify-center text-surface-300">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <span className="text-xs font-mono text-surface-500 uppercase tracking-wider">06</span>
            </div>
            <h3 className="font-display text-xl font-bold text-white mb-3">Developer API</h3>
            <p className="text-surface-400 leading-relaxed">
              Full REST and webhooks API for custom integrations, white-label deployments, and automation.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Featured Creators ───────────────────────────────────────────────
const featuredCreators = [
  { name: 'Elevation Studios', category: 'Church Media', subscribers: '125K', color: 'bg-brand-500' },
  { name: 'Devstream', category: 'Tech', subscribers: '89K', color: 'bg-violet-500' },
  { name: 'The Daily Brief', category: 'News', subscribers: '340K', color: 'bg-cyan-500' },
  { name: 'MindFlow Podcast', category: 'Wellness', subscribers: '67K', color: 'bg-emerald-500' },
  { name: 'GameVault', category: 'Gaming', subscribers: '210K', color: 'bg-orange-500' },
  { name: 'Creator Lab', category: 'Education', subscribers: '155K', color: 'bg-yellow-500' },
];

function FeaturedCreators() {
  return (
    <section className="section-padding relative">
      <div className="absolute inset-0 bg-dots" />
      <div className="relative max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-14">
          <div>
            <span className="inline-flex items-center gap-2 text-sm font-medium text-brand-400 mb-4">
              <span className="w-8 h-px bg-brand-500" />
              CREATORS
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Who&apos;s building on Youcast
            </h2>
          </div>
          <Link href="/creators" className="group flex items-center gap-2 text-sm font-medium text-surface-400 hover:text-white transition-colors">
            View all creators
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {featuredCreators.map((creator, i) => (
            <div key={creator.name} className="group bg-surface-900/80 border border-surface-800 rounded-2xl p-5 card-hover relative overflow-hidden">
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 ${creator.color} rounded-xl flex items-center justify-center text-white font-display font-bold text-lg flex-shrink-0`}>
                  {creator.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-semibold truncate text-sm">{creator.name}</h3>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-surface-500">{creator.category}</span>
                    <span className="w-1 h-1 rounded-full bg-surface-600" />
                    <span className="text-xs text-surface-500">{creator.subscribers} subs</span>
                  </div>
                </div>
                <span className="text-xs font-mono text-surface-600">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
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
    <section className="section-padding">
      <div className="max-w-7xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden noise">
          {/* BG */}
          <div className="absolute inset-0 bg-brand-600" />
          <div className="absolute inset-0 bg-grid opacity-10" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-400/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4" />

          <div className="relative px-8 py-16 sm:px-16 sm:py-20 flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            <div className="flex-1">
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
                Ready to own<br />your media?
              </h2>
              <p className="text-lg text-white/70 max-w-md leading-relaxed">
                Join thousands of creators who stream, publish, and grow their audiences on Youcast.
                No algorithms. No gatekeepers.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
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
      </div>
    </section>
  );
}

// ─── Home Page ───────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <>
      <Hero />
      <LogoMarquee />
      <BentoFeatures />
      <FeaturedCreators />
      <CTASection />
    </>
  );
}
