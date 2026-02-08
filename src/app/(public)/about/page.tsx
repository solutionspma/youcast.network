import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'About' };

const values = [
  { title: 'Creator Ownership', desc: 'Your content, your audience, your data. We build tools — not walled gardens.' },
  { title: 'Radical Transparency', desc: 'Open roadmaps, transparent pricing, no hidden algorithms manipulating reach.' },
  { title: 'Scale Without Compromise', desc: 'Enterprise-grade infrastructure that serves solo creators and media networks equally.' },
  { title: 'Community First', desc: 'Every feature decision starts with the creator community. We build what matters.' },
];

const timeline = [
  { year: '2024', event: 'Youcast founded with a mission to return media ownership to creators.' },
  { year: '2024', event: 'Core streaming infrastructure built. Alpha testing begins.' },
  { year: '2025', event: 'Beta launch. First 1,000 creators join. Church media vertical launched.' },
  { year: '2025', event: 'Series A funding. Team grows to 40. Platform modules expand.' },
  { year: '2026', event: 'Public launch. 10,000+ creators. SaaS platform and API access released.' },
];

const team = [
  { name: 'Operations', count: 8, focus: 'Business strategy, partnerships, and growth' },
  { name: 'Engineering', count: 18, focus: 'Platform infrastructure, streaming, and API' },
  { name: 'Product', count: 6, focus: 'UX design, research, and feature prioritization' },
  { name: 'Creator Success', count: 8, focus: 'Onboarding, support, and community' },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-brand-400 mb-4">
            <span className="w-8 h-px bg-brand-500" />ABOUT YOUCAST
          </span>
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-white mb-6 leading-tight max-w-3xl">
            We&apos;re building the media platform creators deserve
          </h1>
          <p className="text-lg text-surface-400 max-w-2xl">
            Youcast exists because creators shouldn&apos;t have to choose between reach and ownership. We&apos;re building infrastructure that puts creators in control of their content, their audience, and their revenue.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="section-padding bg-surface-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-brand-400 mb-4">
              <span className="w-8 h-px bg-brand-500" />OUR VALUES
            </span>
            <h2 className="text-3xl font-display font-bold text-white">What we stand for</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl">
            {values.map((v, i) => (
              <div key={v.title} className="bg-surface-900 border border-surface-800 rounded-2xl p-6">
                <span className="text-sm font-display font-bold text-brand-500/40 mb-3 block">0{i + 1}</span>
                <h3 className="text-lg font-semibold text-white mb-2">{v.title}</h3>
                <p className="text-sm text-surface-400 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section-padding">
        <div className="max-w-3xl mx-auto">
          <div className="mb-10">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-brand-400 mb-4">
              <span className="w-8 h-px bg-brand-500" />OUR JOURNEY
            </span>
            <h2 className="text-3xl font-display font-bold text-white">The road so far</h2>
          </div>
          <div className="space-y-0">
            {timeline.map((item, i) => (
              <div key={i} className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-brand-500 flex-shrink-0" />
                  {i < timeline.length - 1 && <div className="w-px flex-1 bg-surface-700" />}
                </div>
                <div className="pb-8">
                  <span className="text-sm font-display font-semibold text-brand-400">{item.year}</span>
                  <p className="text-surface-300 mt-1">{item.event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="section-padding bg-surface-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-brand-400 mb-4">
              <span className="w-8 h-px bg-brand-500" />OUR TEAM
            </span>
            <h2 className="text-3xl font-display font-bold text-white mb-2">The people behind Youcast</h2>
            <p className="text-surface-400">40 people across engineering, product, operations, and creator success.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-4xl">
            {team.map((dept) => (
              <div key={dept.name} className="bg-surface-900 border border-surface-800 rounded-2xl p-6 text-center">
                <div className="text-3xl font-display font-bold text-white mb-1">{dept.count}</div>
                <h3 className="text-sm font-semibold text-brand-400 mb-2">{dept.name}</h3>
                <p className="text-xs text-surface-400">{dept.focus}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
