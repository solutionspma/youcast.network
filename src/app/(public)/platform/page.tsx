import type { Metadata } from 'next';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

export const metadata: Metadata = { title: 'Platform' };

const saasModules = [
  { num: '01', title: 'Stream Studio', desc: 'Browser-based live production suite with multi-camera support, scene switching, audio mixing, and real-time overlays.', status: 'Live' },
  { num: '02', title: 'Media CMS', desc: 'Upload, transcode, manage, and distribute video and audio content with metadata tagging and smart search.', status: 'Live' },
  { num: '03', title: 'Analytics Engine', desc: 'Real-time and historical analytics with audience demographics, engagement heatmaps, and retention metrics.', status: 'Live' },
  { num: '04', title: 'Monetization Suite', desc: 'Subscriptions, tips, pay-per-view, ad insertion, and sponsorship management with creator-first revenue splits.', status: 'Beta' },
  { num: '05', title: 'Distribution Network', desc: 'Simulcast to YouTube, Facebook, Twitch, and custom RTMP/SRT endpoints. Schedule and automate releases.', status: 'Live' },
  { num: '06', title: 'Audience CRM', desc: 'Subscriber management, segmentation, automated email sequences, and community engagement tools.', status: 'Beta' },
  { num: '07', title: 'Developer API', desc: 'REST API with webhooks, OAuth2 authentication, rate limiting, and comprehensive documentation.', status: 'Preview' },
  { num: '08', title: 'White-Label Networks', desc: 'Deploy your own branded media platform powered by Youcast infrastructure. Custom domains, branding, and admin.', status: 'Coming Soon' },
];

const architecture = [
  { label: 'Frontend', detail: 'Next.js, React, TypeScript — SSR + client hybrid for performance' },
  { label: 'Auth', detail: 'Supabase Auth with OAuth, RBAC, and session management' },
  { label: 'Database', detail: 'PostgreSQL via Supabase with RLS and real-time subscriptions' },
  { label: 'Storage', detail: 'Abstracted provider layer — Supabase Storage, S3, or custom CDN' },
  { label: 'Streaming', detail: 'WebRTC for browser ingest, RTMP/SRT for external encoders' },
  { label: 'Edge', detail: 'Global CDN delivery with edge caching and adaptive bitrate' },
];

const stats = [
  { value: '99.99%', label: 'Target Uptime SLA' },
  { value: '<100ms', label: 'Global Latency' },
  { value: '∞', label: 'Horizontal Scale' },
  { value: '50+', label: 'Edge Locations' },
];

export default function PlatformPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-brand-400 mb-4">
            <span className="w-8 h-px bg-brand-500" />PLATFORM ARCHITECTURE
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-white mb-6 leading-tight max-w-4xl">
            Built for millions of creators
          </h1>
          <p className="text-lg text-surface-400 max-w-2xl mb-8">
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
          <div className="mb-14">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-brand-400 mb-4">
              <span className="w-8 h-px bg-brand-500" />MODULES
            </span>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">Platform Modules</h2>
            <p className="text-surface-400 text-lg">Each module is independently scalable and feature-flag controlled.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {saasModules.map((mod) => (
              <div key={mod.title} className="bg-surface-900 border border-surface-800 rounded-2xl p-6 card-hover">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl font-display font-bold text-brand-500/40">{mod.num}</span>
                  <Badge
                    variant={mod.status === 'Live' ? 'success' : mod.status === 'Beta' ? 'warning' : mod.status === 'Preview' ? 'info' : 'default'}
                    size="sm"
                  >
                    {mod.status}
                  </Badge>
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{mod.title}</h3>
                <p className="text-sm text-surface-400 leading-relaxed">{mod.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="section-padding">
        <div className="max-w-4xl mx-auto">
          <div className="mb-14">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-brand-400 mb-4">
              <span className="w-8 h-px bg-brand-500" />ARCHITECTURE
            </span>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">Technical Architecture</h2>
            <p className="text-surface-400 text-lg">Production-grade infrastructure designed for reliability and scale.</p>
          </div>
          <div className="space-y-4">
            {architecture.map((item) => (
              <div key={item.label} className="flex items-start gap-4 p-5 bg-surface-900 border border-surface-800 rounded-2xl">
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
    </>
  );
}
