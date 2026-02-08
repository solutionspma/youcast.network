import type { Metadata } from 'next';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

export const metadata: Metadata = { title: 'Platform' };

const saasModules = [
  { title: 'Stream Studio', desc: 'Browser-based live production suite with multi-camera support, scene switching, audio mixing, and real-time overlays.', icon: '🎬', status: 'Live' },
  { title: 'Media CMS', desc: 'Upload, transcode, manage, and distribute video and audio content with metadata tagging and smart search.', icon: '📁', status: 'Live' },
  { title: 'Analytics Engine', desc: 'Real-time and historical analytics with audience demographics, engagement heatmaps, and retention metrics.', icon: '📈', status: 'Live' },
  { title: 'Monetization Suite', desc: 'Subscriptions, tips, pay-per-view, ad insertion, and sponsorship management with creator-first revenue splits.', icon: '💳', status: 'Beta' },
  { title: 'Distribution Network', desc: 'Simulcast to YouTube, Facebook, Twitch, and custom RTMP/SRT endpoints. Schedule and automate releases.', icon: '🌍', status: 'Live' },
  { title: 'Audience CRM', desc: 'Subscriber management, segmentation, automated email sequences, and community engagement tools.', icon: '👥', status: 'Beta' },
  { title: 'Developer API', desc: 'REST API with webhooks, OAuth2 authentication, rate limiting, and comprehensive documentation.', icon: '🔌', status: 'Preview' },
  { title: 'White-Label Networks', desc: 'Deploy your own branded media platform powered by Youcast infrastructure. Custom domains, branding, and admin.', icon: '🏷️', status: 'Coming Soon' },
];

const architecture = [
  { label: 'Frontend', detail: 'Next.js, React, TypeScript — SSR + client hybrid for performance' },
  { label: 'Auth', detail: 'Supabase Auth with OAuth, RBAC, and session management' },
  { label: 'Database', detail: 'PostgreSQL via Supabase with RLS and real-time subscriptions' },
  { label: 'Storage', detail: 'Abstracted provider layer — Supabase Storage, S3, or custom CDN' },
  { label: 'Streaming', detail: 'WebRTC for browser ingest, RTMP/SRT for external encoders' },
  { label: 'Edge', detail: 'Global CDN delivery with edge caching and adaptive bitrate' },
];

export default function PlatformPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-mesh opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 text-center">
          <Badge variant="info" size="lg" className="mb-6">Platform Architecture</Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Built for <span className="gradient-text">millions of creators</span>
          </h1>
          <p className="text-lg text-surface-400 max-w-2xl mx-auto mb-8">
            Youcast isn&apos;t a website — it&apos;s a scalable media infrastructure platform. Every module is designed for horizontal scale, multi-tenancy, and continuous expansion.
          </p>
          <Link href="/auth/signup">
            <Button size="xl">Get Early Access</Button>
          </Link>
        </div>
      </section>

      {/* SaaS Modules */}
      <section className="section-padding bg-surface-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Platform Modules</h2>
            <p className="text-surface-400 text-lg">Each module is independently scalable and feature-flag controlled.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {saasModules.map((mod) => (
              <Card key={mod.title} variant="glass" hover>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{mod.icon}</span>
                  <Badge
                    variant={mod.status === 'Live' ? 'success' : mod.status === 'Beta' ? 'warning' : mod.status === 'Preview' ? 'info' : 'default'}
                    size="sm"
                  >
                    {mod.status}
                  </Badge>
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{mod.title}</h3>
                <p className="text-sm text-surface-400 leading-relaxed">{mod.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="section-padding">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Technical Architecture</h2>
            <p className="text-surface-400 text-lg">Production-grade infrastructure designed for reliability and scale.</p>
          </div>
          <div className="space-y-4">
            {architecture.map((item) => (
              <div key={item.label} className="flex items-start gap-4 p-4 rounded-xl bg-surface-800/50 border border-surface-700/50">
                <div className="w-24 flex-shrink-0">
                  <span className="text-sm font-semibold text-brand-400">{item.label}</span>
                </div>
                <p className="text-sm text-surface-300">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scale */}
      <section className="section-padding bg-surface-900/50">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-12">Designed for scale</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '99.99%', label: 'Target Uptime SLA' },
              { value: '<100ms', label: 'Global Latency' },
              { value: '∞', label: 'Horizontal Scale' },
              { value: '50+', label: 'Edge Locations' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl sm:text-4xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-sm text-surface-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
