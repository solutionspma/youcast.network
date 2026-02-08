import type { Metadata } from 'next';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

export const metadata: Metadata = { title: 'Community' };

const communitySpaces = [
  { name: 'Creator Lounge', members: '4.2K', desc: 'General discussion for all Youcast creators. Share wins, ask questions, collaborate.', icon: '💬' },
  { name: 'Stream Tech', members: '1.8K', desc: 'Technical discussions on streaming setups, encoding, and production workflows.', icon: '🔧' },
  { name: 'Church Media', members: '2.1K', desc: 'Dedicated space for church media teams sharing best practices for worship broadcasts.', icon: '⛪' },
  { name: 'Podcast Network', members: '1.5K', desc: 'Audio creators discussing recording, editing, distribution, and audience growth.', icon: '🎙️' },
  { name: 'Growth & Marketing', members: '3.3K', desc: 'Strategies for audience growth, SEO, social media, and cross-promotion.', icon: '📈' },
  { name: 'Developer Hub', members: '890', desc: 'API discussions, integrations, custom tools, and open-source contributions.', icon: '💻' },
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
        <div className="absolute inset-0 bg-gradient-mesh opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 text-center">
          <Badge variant="brand" size="lg" className="mb-6">Community</Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Connect. Collaborate. <span className="gradient-text">Create together.</span>
          </h1>
          <p className="text-lg text-surface-400 max-w-2xl mx-auto mb-8">
            Join a network of independent creators sharing knowledge, building together, and pushing the boundaries of digital media.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg">Join the Community</Button>
            <Button variant="outline" size="lg">Discord Server</Button>
          </div>
        </div>
      </section>

      {/* Community Spaces */}
      <section className="section-padding bg-surface-900/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Community Spaces</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {communitySpaces.map((space) => (
              <Card key={space.name} variant="glass" hover>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{space.icon}</span>
                  <div>
                    <h3 className="text-white font-semibold">{space.name}</h3>
                    <span className="text-xs text-surface-500">{space.members} members</span>
                  </div>
                </div>
                <p className="text-sm text-surface-400">{space.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Events */}
      <section className="section-padding">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Upcoming Events</h2>
          <div className="space-y-4">
            {upcomingEvents.map((event) => (
              <Card key={event.title} variant="default" className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-semibold">{event.title}</h3>
                    <Badge variant="info" size="sm">{event.type}</Badge>
                  </div>
                  <p className="text-sm text-surface-400 mb-1">{event.desc}</p>
                  <p className="text-xs text-surface-500">{event.date}</p>
                </div>
                <Button variant="outline" size="sm" className="flex-shrink-0 self-start sm:self-center">
                  Register
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-surface-900/50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Be part of something bigger</h2>
          <p className="text-surface-400 text-lg mb-8">
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
