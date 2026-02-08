import type { Metadata } from 'next';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

export const metadata: Metadata = { title: 'Creators' };

const benefits = [
  { icon: '🎥', title: 'Professional Streaming Studio', desc: 'Multi-camera switching, scene management, audio mixing, and live overlays — all browser-based.' },
  { icon: '📊', title: 'Deep Analytics', desc: 'Real-time viewer metrics, audience demographics, engagement tracking, and growth insights.' },
  { icon: '💰', title: 'Built-in Monetization', desc: 'Subscriptions, tips, pay-per-view, and sponsorships. Keep the majority of your earnings.' },
  { icon: '🌐', title: 'Multi-Platform Distribution', desc: 'Simulcast to YouTube, Facebook, Twitch, and any custom RTMP destination simultaneously.' },
  { icon: '🔧', title: 'Creator API', desc: 'Programmatic access to your data, content management, and automated workflows.' },
  { icon: '🛡️', title: 'Content Ownership', desc: 'You own your content, your audience data, and your monetization. No platform lock-in.' },
];

const tiers = [
  { name: 'Starter', price: 'Free', features: ['1 channel', '720p streaming', '10GB storage', 'Basic analytics', 'Community support'], cta: 'Get Started Free' },
  { name: 'Pro', price: '$29/mo', features: ['5 channels', '1080p streaming', '500GB storage', 'Advanced analytics', 'Monetization tools', 'Custom branding', 'Priority support'], cta: 'Start Pro Trial', highlighted: true },
  { name: 'Network', price: '$199/mo', features: ['Unlimited channels', '4K streaming', '5TB storage', 'Enterprise analytics', 'White-label option', 'API access', 'Dedicated support', 'Multi-tenant admin'], cta: 'Contact Sales' },
];

export default function CreatorsPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-mesh opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 text-center">
          <Badge variant="brand" size="lg" className="mb-6">For Creators</Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Build your media empire on <span className="gradient-text">Youcast</span>
          </h1>
          <p className="text-lg text-surface-400 max-w-2xl mx-auto mb-8">
            Professional tools for streaming, publishing, and growing — designed for creators who refuse to be boxed in by algorithms and platform politics.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Why creators choose Youcast</h2>
            <p className="text-surface-400 text-lg">Tools built by creators, for creators.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b) => (
              <Card key={b.title} variant="glass" hover>
                <div className="text-3xl mb-4">{b.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{b.title}</h3>
                <p className="text-sm text-surface-400 leading-relaxed">{b.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="section-padding">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Simple, transparent pricing</h2>
            <p className="text-surface-400 text-lg">Start free. Scale as you grow.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {tiers.map((tier) => (
              <Card
                key={tier.name}
                variant={tier.highlighted ? 'elevated' : 'default'}
                className={tier.highlighted ? 'gradient-border ring-1 ring-brand-500/20' : ''}
              >
                {tier.highlighted && (
                  <Badge variant="brand" size="sm" className="mb-4">Most Popular</Badge>
                )}
                <h3 className="text-xl font-bold text-white mb-1">{tier.name}</h3>
                <div className="text-3xl font-bold text-white mb-6">{tier.price}</div>
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
                <Button
                  variant={tier.highlighted ? 'primary' : 'outline'}
                  fullWidth
                >
                  {tier.cta}
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Apply CTA */}
      <section className="section-padding bg-surface-900/50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to get started?</h2>
          <p className="text-surface-400 text-lg mb-8">
            Apply for a creator account and start building your channel today. Setup takes less than 5 minutes.
          </p>
          <Link href="/auth/signup">
            <Button size="xl">Create Your Channel</Button>
          </Link>
        </div>
      </section>
    </>
  );
}
