import type { Metadata } from 'next';
import Link from 'next/link';
import Button from '@/components/ui/Button';

export const metadata: Metadata = { title: 'Community' };

const communitySpaces = [
  {
    name: 'Creator Lounge',
    members: '4.2K',
    desc: 'General discussion for all Youcast creators. Share wins, ask questions, collaborate.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
      </svg>
    ),
  },
  {
    name: 'Stream Tech',
    members: '1.8K',
    desc: 'Technical discussions on streaming setups, encoding, and production workflows.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.384-3.108A2.25 2.25 0 014.5 9.96V6.353a2.25 2.25 0 011.536-2.1l5.384-1.794a2.25 2.25 0 011.16 0l5.384 1.794a2.25 2.25 0 011.536 2.1V9.96a2.25 2.25 0 01-1.536 2.1l-5.384 3.108a2.25 2.25 0 01-1.16 0z" />
      </svg>
    ),
  },
  {
    name: 'Church Media',
    members: '2.1K',
    desc: 'Dedicated space for church media teams sharing best practices for worship broadcasts.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
      </svg>
    ),
  },
  {
    name: 'Podcast Network',
    members: '1.5K',
    desc: 'Audio creators discussing recording, editing, distribution, and audience growth.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
      </svg>
    ),
  },
  {
    name: 'Growth & Marketing',
    members: '3.3K',
    desc: 'Strategies for audience growth, SEO, social media, and cross-promotion.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
  },
  {
    name: 'Developer Hub',
    members: '890',
    desc: 'API discussions, integrations, custom tools, and open-source contributions.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
      </svg>
    ),
  },
];

const upcomingEvents = [
  { title: 'Creator Summit 2026', date: 'March 15-17, 2026', type: 'Virtual Conference', desc: 'Three days of workshops, panels, and networking with top creators.' },
  { title: 'Stream Tech Workshop', date: 'February 20, 2026', type: 'Workshop', desc: 'Hands-on session on multi-camera streaming setups and audio optimization.' },
  { title: 'Monetization Masterclass', date: 'February 28, 2026', type: 'Webinar', desc: 'Learn proven strategies for subscription models and sponsor partnerships.' },
  { title: 'Church Media Meetup', date: 'March 5, 2026', type: 'Virtual Meetup', desc: 'Monthly gathering for church media teams to share setups and workflows.' },
];

export default function CommunityPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-brand-400 mb-4">
            <span className="w-8 h-px bg-brand-500" />COMMUNITY
          </span>
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-white mb-6 max-w-3xl">
            Connect. Collaborate. Create together.
          </h1>
          <p className="text-lg text-surface-400 max-w-2xl mb-8">
            Join a network of independent creators sharing knowledge, building together, and pushing the boundaries of digital media.
          </p>
          <div className="flex gap-4">
            <Button size="lg">Join the Community</Button>
            <Button variant="outline" size="lg">Discord Server</Button>
          </div>
        </div>
      </section>

      {/* Community Spaces */}
      <section className="section-padding bg-surface-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-brand-400 mb-4">
              <span className="w-8 h-px bg-brand-500" />SPACES
            </span>
            <h2 className="text-3xl font-display font-bold text-white">Community Spaces</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {communitySpaces.map((space) => (
              <div key={space.name} className="bg-surface-900 border border-surface-800 rounded-2xl p-6 card-hover">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center flex-shrink-0">
                    {space.icon}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{space.name}</h3>
                    <span className="text-xs text-surface-500">{space.members} members</span>
                  </div>
                </div>
                <p className="text-sm text-surface-400">{space.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Events */}
      <section className="section-padding">
        <div className="max-w-4xl mx-auto">
          <div className="mb-10">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-brand-400 mb-4">
              <span className="w-8 h-px bg-brand-500" />EVENTS
            </span>
            <h2 className="text-3xl font-display font-bold text-white">Upcoming Events</h2>
          </div>
          <div className="space-y-4">
            {upcomingEvents.map((event) => (
              <div key={event.title} className="bg-surface-900 border border-surface-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-semibold">{event.title}</h3>
                    <span className="text-xs font-medium text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-full">{event.type}</span>
                  </div>
                  <p className="text-sm text-surface-400 mb-1">{event.desc}</p>
                  <p className="text-xs text-surface-500">{event.date}</p>
                </div>
                <Button variant="outline" size="sm" className="flex-shrink-0 self-start sm:self-center">
                  Register
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-surface-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-brand-400 mb-4">
            <span className="w-8 h-px bg-brand-500" />JOIN US
          </span>
          <h2 className="text-3xl font-display font-bold text-white mb-4">Be part of something bigger</h2>
          <p className="text-surface-400 text-lg mb-8 max-w-2xl">
            The Youcast community is where independent creators go to learn, grow, and support each other. No gatekeepers.
          </p>
          <Link href="/auth/signup">
            <Button size="xl">Join Youcast Today</Button>
          </Link>
        </div>
      </section>
    </>
  );
}
