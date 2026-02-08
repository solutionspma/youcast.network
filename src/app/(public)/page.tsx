import Link from 'next/link';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';

// ─── Hero Section ────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-mesh opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface-950/50 to-surface-950" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32 sm:pt-28 sm:pb-40">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="brand" size="lg" className="mb-6">
            Creator-Owned Media Platform
          </Badge>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tight mb-6">
            Your content.{' '}
            <span className="gradient-text">Your network.</span>{' '}
            Your rules.
          </h1>

          <p className="text-lg sm:text-xl text-surface-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Youcast is the platform built for independent creators, podcasters, churches, and media networks.
            Stream live, publish on-demand, grow your audience — all from one powerful hub.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/signup">
              <Button size="xl">
                Start Creating — Free
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Button>
            </Link>
            <Link href="/watch">
              <Button variant="outline" size="xl">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Explore Content
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            {[
              { value: '10K+', label: 'Creators' },
              { value: '50M+', label: 'Views' },
              { value: '99.9%', label: 'Uptime' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-surface-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Featured Creators ───────────────────────────────────────────────
const featuredCreators = [
  {
    name: 'Elevation Studios',
    category: 'Church Media',
    subscribers: '125K',
    avatar: null,
    description: 'Live worship broadcasts reaching 100+ campuses worldwide every week.',
  },
  {
    name: 'Devstream',
    category: 'Tech',
    subscribers: '89K',
    avatar: null,
    description: 'Developer livestreams, code reviews, and open-source deep dives.',
  },
  {
    name: 'The Daily Brief',
    category: 'News & Commentary',
    subscribers: '340K',
    avatar: null,
    description: 'Independent news coverage and analysis — no gatekeepers.',
  },
  {
    name: 'MindFlow Podcast',
    category: 'Health & Wellness',
    subscribers: '67K',
    avatar: null,
    description: 'Mental health conversations and guided meditation sessions.',
  },
  {
    name: 'GameVault',
    category: 'Gaming',
    subscribers: '210K',
    avatar: null,
    description: 'Competitive esports and indie game showcases streamed live.',
  },
  {
    name: 'Creator Lab',
    category: 'Education',
    subscribers: '155K',
    avatar: null,
    description: 'Tutorials on video production, audio engineering, and distribution.',
  },
];

function FeaturedCreators() {
  return (
    <section className="section-padding bg-surface-950">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Featured Creators
          </h2>
          <p className="text-surface-400 text-lg max-w-2xl mx-auto">
            Independent voices building audiences on their terms. Join the network.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredCreators.map((creator) => (
            <Card key={creator.name} hover variant="default">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {creator.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-semibold truncate">{creator.name}</h3>
                    <Badge variant="default" size="sm">{creator.category}</Badge>
                  </div>
                  <p className="text-sm text-surface-400 mb-3 line-clamp-2">
                    {creator.description}
                  </p>
                  <div className="text-xs text-surface-500">
                    {creator.subscribers} subscribers
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link href="/creators">
            <Button variant="outline" size="lg">
              View All Creators
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Platform Overview ───────────────────────────────────────────────
const platformFeatures = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Live Streaming Studio',
    description: 'Multi-camera switching, audio mixing, overlays, and scene management — all in your browser.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
      </svg>
    ),
    title: 'Media Library',
    description: 'Upload, manage, and distribute video and audio content with built-in transcoding and CDN delivery.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Real-Time Analytics',
    description: 'Understand your audience with detailed viewer analytics, engagement metrics, and growth tracking.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Multi-Platform Distribution',
    description: 'Simulcast to YouTube, Facebook, Twitch, and custom RTMP destinations from a single stream.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Monetization Tools',
    description: 'Subscriptions, tips, pay-per-view, and sponsorship management — keep more of what you earn.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    title: 'Developer API',
    description: 'Full REST and webhooks API for custom integrations, white-label deployments, and automation.',
  },
];

function PlatformOverview() {
  return (
    <section className="section-padding bg-surface-900/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <Badge variant="info" size="lg" className="mb-4">Platform Capabilities</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Everything you need to build your media empire
          </h2>
          <p className="text-surface-400 text-lg max-w-2xl mx-auto">
            Professional-grade tools for streaming, publishing, analytics, and monetization — designed for scale.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {platformFeatures.map((feature) => (
            <Card key={feature.title} variant="glass" hover>
              <div className="w-12 h-12 rounded-xl bg-brand-600/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-surface-400 leading-relaxed">{feature.description}</p>
            </Card>
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
      <div className="max-w-4xl mx-auto text-center">
        <div className="relative rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-600 to-brand-900" />
          <div className="absolute inset-0 bg-gradient-mesh opacity-30" />
          <div className="relative px-8 py-16 sm:px-16 sm:py-20">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to own your media?
            </h2>
            <p className="text-lg text-brand-200 max-w-xl mx-auto mb-8">
              Join thousands of creators who stream, publish, and grow their audiences on Youcast.
              No algorithms. No gatekeepers. No limits.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="xl" className="bg-white text-brand-700 hover:bg-brand-50 shadow-xl">
                  Create Your Channel
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" size="xl" className="border-white/30 text-white hover:bg-white/10">
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
      <FeaturedCreators />
      <PlatformOverview />
      <CTASection />
    </>
  );
}
