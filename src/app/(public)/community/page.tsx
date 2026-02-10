'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';

interface CommunityGroup {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  member_count: number;
  is_featured: boolean;
}

interface CommunityEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  start_date: string;
  end_date: string | null;
  attendee_count: number;
  is_featured: boolean;
}

const eventTypeLabels: Record<string, string> = {
  'virtual_conference': 'Virtual Conference',
  'webinar': 'Webinar',
  'workshop': 'Workshop',
  'meetup': 'Meetup',
  'ama': 'AMA',
};

// Fallback static data - 8 communities
const fallbackGroups: CommunityGroup[] = [
  { id: 'c1', name: 'Creator Lounge', slug: 'creator-lounge', description: 'The central hub for all YouCast creators. Share wins, ask questions, find collaborators.', category: 'general', member_count: 4200, is_featured: true },
  { id: 'c2', name: 'Stream Tech', slug: 'stream-tech', description: 'Technical discussions on streaming setups, encoding, and production workflows.', category: 'tech', member_count: 1800, is_featured: true },
  { id: 'c3', name: 'Church Media', slug: 'church-media', description: 'Dedicated space for church media teams sharing best practices for worship broadcasts.', category: 'industry', member_count: 2100, is_featured: true },
  { id: 'c4', name: 'Podcast Network', slug: 'podcast-network', description: 'Audio creators discussing recording, editing, distribution, and audience growth.', category: 'industry', member_count: 1500, is_featured: true },
  { id: 'c5', name: 'Growth & Marketing', slug: 'growth-marketing', description: 'Strategies for audience growth, SEO, social media, and cross-promotion.', category: 'marketing', member_count: 3300, is_featured: true },
  { id: 'c6', name: 'Sports Media', slug: 'sports-media', description: 'For sports broadcasters, commentators, and teams. Live events and replays.', category: 'industry', member_count: 980, is_featured: true },
  { id: 'c7', name: 'Education Creators', slug: 'education-creators', description: 'Teachers and trainers creating video content, courses, and educational materials.', category: 'industry', member_count: 1250, is_featured: true },
  { id: 'c8', name: 'Music & Live Performance', slug: 'music-live', description: 'Musicians streaming concerts, sessions, and music content. Audio optimization and fan engagement.', category: 'industry', member_count: 890, is_featured: true },
];

const fallbackEvents: CommunityEvent[] = [
  { id: '1', title: 'Creator Summit 2026', description: 'Three days of workshops, panels, and networking with top creators.', event_type: 'virtual_conference', start_date: '2026-03-15T09:00:00Z', end_date: '2026-03-17T18:00:00Z', attendee_count: 0, is_featured: true },
  { id: '2', title: 'Stream Tech Workshop', description: 'Hands-on session on multi-camera streaming setups and audio optimization.', event_type: 'workshop', start_date: '2026-02-20T14:00:00Z', end_date: '2026-02-20T16:00:00Z', attendee_count: 0, is_featured: true },
  { id: '3', title: 'Monetization Masterclass', description: 'Learn proven strategies for subscription models and sponsor partnerships.', event_type: 'webinar', start_date: '2026-02-28T18:00:00Z', end_date: '2026-02-28T19:30:00Z', attendee_count: 0, is_featured: true },
  { id: '4', title: 'Church Media Meetup', description: 'Monthly gathering for church media teams to share setups and workflows.', event_type: 'meetup', start_date: '2026-03-05T19:00:00Z', end_date: '2026-03-05T20:30:00Z', attendee_count: 0, is_featured: false },
];

// Icon component for categories
function GroupIcon({ category }: { category: string }) {
  switch (category) {
    case 'general':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
        </svg>
      );
    case 'tech':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.384-3.108A2.25 2.25 0 014.5 9.96V6.353a2.25 2.25 0 011.536-2.1l5.384-1.794a2.25 2.25 0 011.16 0l5.384 1.794a2.25 2.25 0 011.536 2.1V9.96a2.25 2.25 0 01-1.536 2.1l-5.384 3.108a2.25 2.25 0 01-1.16 0z" />
        </svg>
      );
    case 'industry':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
        </svg>
      );
    case 'marketing':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
        </svg>
      );
    case 'dev':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
        </svg>
      );
    default:
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
        </svg>
      );
  }
}

export default function CommunityPage() {
  const [user, setUser] = useState<any>(null);
  const [groups, setGroups] = useState<CommunityGroup[]>(fallbackGroups);
  const [events, setEvents] = useState<CommunityEvent[]>(fallbackEvents);
  const [userMemberships, setUserMemberships] = useState<Set<string>>(new Set());
  const [userRegistrations, setUserRegistrations] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);
  const [registering, setRegistering] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);

      const { data: groupsData } = await supabase
        .from('community_groups')
        .select('*')
        .eq('is_public', true)
        .order('is_featured', { ascending: false })
        .order('member_count', { ascending: false });

      if (groupsData && groupsData.length > 0) {
        setGroups(groupsData);
      }

      const { data: eventsData } = await supabase
        .from('community_events')
        .select('*')
        .eq('is_public', true)
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true });

      if (eventsData && eventsData.length > 0) {
        setEvents(eventsData);
      }

      if (authUser) {
        const { data: memberships } = await supabase
          .from('group_memberships')
          .select('group_id')
          .eq('user_id', authUser.id);

        if (memberships) {
          setUserMemberships(new Set(memberships.map(m => m.group_id)));
        }

        const { data: registrations } = await supabase
          .from('event_registrations')
          .select('event_id')
          .eq('user_id', authUser.id);

        if (registrations) {
          setUserRegistrations(new Set(registrations.map(r => r.event_id)));
        }
      }

      setLoading(false);
    }

    fetchData();
  }, []);

  const handleJoinGroup = async (groupId: string) => {
    if (!user) {
      window.location.href = '/auth/login?redirect=/community';
      return;
    }

    setJoining(groupId);
    const supabase = createClient();
    
    const isMember = userMemberships.has(groupId);
    
    if (isMember) {
      await supabase
        .from('group_memberships')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);
      
      setUserMemberships(prev => {
        const newSet = new Set(prev);
        newSet.delete(groupId);
        return newSet;
      });
    } else {
      await supabase
        .from('group_memberships')
        .insert({ group_id: groupId, user_id: user.id });
      
      setUserMemberships(prev => new Set([...prev, groupId]));
    }
    
    setJoining(null);
  };

  const handleRegisterEvent = async (eventId: string) => {
    if (!user) {
      window.location.href = '/auth/login?redirect=/community';
      return;
    }

    setRegistering(eventId);
    const supabase = createClient();
    
    const isRegistered = userRegistrations.has(eventId);
    
    if (isRegistered) {
      await supabase
        .from('event_registrations')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user.id);
      
      setUserRegistrations(prev => {
        const newSet = new Set(prev);
        newSet.delete(eventId);
        return newSet;
      });
    } else {
      await supabase
        .from('event_registrations')
        .insert({ event_id: eventId, user_id: user.id });
      
      setUserRegistrations(prev => new Set([...prev, eventId]));
    }
    
    setRegistering(null);
  };

  const formatMemberCount = (count: number) => {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const formatEventDate = (startDate: string, endDate: string | null) => {
    const start = new Date(startDate);
    const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };
    
    if (endDate) {
      const end = new Date(endDate);
      if (start.toDateString() !== end.toDateString()) {
        return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', options)}`;
      }
    }
    return start.toLocaleDateString('en-US', options);
  };

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
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button size="lg">Go to Dashboard</Button>
                </Link>
                <a href="https://discord.gg/youcast" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="lg">Discord Server</Button>
                </a>
              </>
            ) : (
              <>
                <Link href="/auth/signup">
                  <Button size="lg">Join the Community</Button>
                </Link>
                <a href="https://discord.gg/youcast" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="lg">Discord Server</Button>
                </a>
              </>
            )}
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
            <p className="text-surface-400 mt-2">Join groups that match your interests and connect with like-minded creators.</p>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-surface-900 border border-surface-800 rounded-2xl p-6 animate-pulse">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-surface-800" />
                    <div className="flex-1">
                      <div className="h-4 w-32 bg-surface-800 rounded mb-1" />
                      <div className="h-3 w-20 bg-surface-800 rounded" />
                    </div>
                  </div>
                  <div className="h-12 bg-surface-800 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {groups.map((group) => {
                const isMember = userMemberships.has(group.id);
                return (
                  <Link 
                    key={group.id} 
                    href={`/c/${group.slug}`}
                    className="bg-surface-900 border border-surface-800 rounded-2xl p-6 card-hover group block"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center flex-shrink-0">
                          <GroupIcon category={group.category} />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold">{group.name}</h3>
                          <span className="text-xs text-surface-500">{formatMemberCount(group.member_count)} members</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-surface-400 mb-4">{group.description}</p>
                    <Button 
                      variant={isMember ? 'outline' : 'primary'} 
                      size="sm" 
                      className="w-full"
                      onClick={(e) => {
                        e.preventDefault();
                        handleJoinGroup(group.id);
                      }}
                      disabled={joining === group.id}
                    >
                      {joining === group.id ? 'Loading...' : isMember ? 'Joined ✓' : 'Join Group'}
                    </Button>
                  </Link>
                );
              })}
            </div>
          )}
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
            <p className="text-surface-400 mt-2">Workshops, meetups, and conferences to level up your creator journey.</p>
          </div>
          
          {loading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-surface-900 border border-surface-800 rounded-2xl p-6 animate-pulse">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1">
                      <div className="h-5 w-48 bg-surface-800 rounded mb-2" />
                      <div className="h-4 w-full bg-surface-800 rounded mb-2" />
                      <div className="h-3 w-32 bg-surface-800 rounded" />
                    </div>
                    <div className="w-24 h-8 bg-surface-800 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => {
                const isRegistered = userRegistrations.has(event.id);
                return (
                  <div key={event.id} className="bg-surface-900 border border-surface-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-white font-semibold">{event.title}</h3>
                        <span className="text-xs font-medium text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-full">
                          {eventTypeLabels[event.event_type] || event.event_type}
                        </span>
                        {event.is_featured && (
                          <span className="text-xs font-medium text-brand-400 bg-brand-400/10 px-2 py-0.5 rounded-full">Featured</span>
                        )}
                      </div>
                      <p className="text-sm text-surface-400 mb-1">{event.description}</p>
                      <p className="text-xs text-surface-500">{formatEventDate(event.start_date, event.end_date)}</p>
                    </div>
                    <Button 
                      variant={isRegistered ? 'outline' : 'primary'} 
                      size="sm" 
                      className="flex-shrink-0 self-start sm:self-center"
                      onClick={() => handleRegisterEvent(event.id)}
                      disabled={registering === event.id}
                    >
                      {registering === event.id ? 'Loading...' : isRegistered ? 'Registered ✓' : 'Register'}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
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
          {user ? (
            <Link href="/dashboard">
              <Button size="xl">Open Dashboard</Button>
            </Link>
          ) : (
            <Link href="/auth/signup">
              <Button size="xl">Join Youcast Today</Button>
            </Link>
          )}
        </div>
      </section>
    </>
  );
}
