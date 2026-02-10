import { Metadata } from 'next';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Events | YouCast',
  description: 'Discover upcoming workshops, conferences, and meetups for creators on YouCast.',
};

interface CommunityEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  start_date: string;
  end_date: string | null;
  attendee_count: number;
  is_featured: boolean;
  is_public: boolean;
  location: string | null;
  max_attendees: number | null;
  thumbnail_url: string | null;
}

const eventTypeLabels: Record<string, string> = {
  'virtual_conference': 'Virtual Conference',
  'webinar': 'Webinar',
  'workshop': 'Workshop',
  'meetup': 'Meetup',
  'ama': 'AMA',
  'livestream': 'Livestream',
};

const eventTypeColors: Record<string, string> = {
  'virtual_conference': 'bg-purple-500/20 text-purple-400',
  'webinar': 'bg-cyan-500/20 text-cyan-400',
  'workshop': 'bg-emerald-500/20 text-emerald-400',
  'meetup': 'bg-amber-500/20 text-amber-400',
  'ama': 'bg-pink-500/20 text-pink-400',
  'livestream': 'bg-red-500/20 text-red-400',
};

// Static events for initial launch
const staticEvents: CommunityEvent[] = [
  {
    id: 'e1',
    title: 'Creator Summit 2026',
    description: 'Three days of workshops, panels, and networking with top creators from around the world. Learn from industry leaders, discover new tools, and connect with your community.',
    event_type: 'virtual_conference',
    start_date: '2026-03-15T09:00:00Z',
    end_date: '2026-03-17T18:00:00Z',
    attendee_count: 1250,
    is_featured: true,
    is_public: true,
    location: 'Virtual',
    max_attendees: 5000,
    thumbnail_url: 'https://images.pexels.com/photos/2774566/pexels-photo-2774566.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 'e2',
    title: 'Stream Tech Workshop: Multi-Camera Mastery',
    description: 'Hands-on session on multi-camera streaming setups, switching techniques, and audio optimization. Perfect for creators looking to level up their production quality.',
    event_type: 'workshop',
    start_date: '2026-02-20T14:00:00Z',
    end_date: '2026-02-20T16:00:00Z',
    attendee_count: 380,
    is_featured: true,
    is_public: true,
    location: 'Virtual',
    max_attendees: 500,
    thumbnail_url: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 'e3',
    title: 'Monetization Masterclass',
    description: 'Learn proven strategies for subscription models, sponsor partnerships, and diversifying your revenue streams as a content creator.',
    event_type: 'webinar',
    start_date: '2026-02-28T18:00:00Z',
    end_date: '2026-02-28T19:30:00Z',
    attendee_count: 620,
    is_featured: true,
    is_public: true,
    location: 'Virtual',
    max_attendees: 1000,
    thumbnail_url: 'https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 'e4',
    title: 'Church Media Monthly Meetup',
    description: 'Monthly gathering for church media teams to share setups, workflows, and best practices for worship broadcasts.',
    event_type: 'meetup',
    start_date: '2026-03-05T19:00:00Z',
    end_date: '2026-03-05T20:30:00Z',
    attendee_count: 145,
    is_featured: false,
    is_public: true,
    location: 'Virtual',
    max_attendees: 300,
    thumbnail_url: 'https://images.pexels.com/photos/8815899/pexels-photo-8815899.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 'e5',
    title: 'Ask Me Anything: Platform Roadmap',
    description: 'Join the YouCast team for an open Q&A about upcoming features, platform direction, and creator feedback.',
    event_type: 'ama',
    start_date: '2026-03-10T17:00:00Z',
    end_date: '2026-03-10T18:00:00Z',
    attendee_count: 890,
    is_featured: true,
    is_public: true,
    location: 'Virtual',
    max_attendees: null,
    thumbnail_url: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 'e6',
    title: 'Podcast Growth Strategies',
    description: 'Expert panel on growing your podcast audience through cross-promotion, SEO, and social media marketing.',
    event_type: 'webinar',
    start_date: '2026-03-12T16:00:00Z',
    end_date: '2026-03-12T17:30:00Z',
    attendee_count: 340,
    is_featured: false,
    is_public: true,
    location: 'Virtual',
    max_attendees: 500,
    thumbnail_url: 'https://images.pexels.com/photos/3783471/pexels-photo-3783471.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 'e7',
    title: 'Live Music Production Workshop',
    description: 'Technical deep-dive into streaming live music performances with optimal audio quality and visual production.',
    event_type: 'workshop',
    start_date: '2026-03-18T15:00:00Z',
    end_date: '2026-03-18T17:00:00Z',
    attendee_count: 210,
    is_featured: false,
    is_public: true,
    location: 'Virtual',
    max_attendees: 400,
    thumbnail_url: 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 'e8',
    title: 'Sports Broadcasting Basics',
    description: 'Introduction to live sports streaming: equipment, commentary, instant replay, and engaging your audience.',
    event_type: 'workshop',
    start_date: '2026-03-22T14:00:00Z',
    end_date: '2026-03-22T16:00:00Z',
    attendee_count: 175,
    is_featured: false,
    is_public: true,
    location: 'Virtual',
    max_attendees: 300,
    thumbnail_url: 'https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
];

function formatEventDate(startDate: string, endDate: string | null) {
  const start = new Date(startDate);
  const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };
  const timeOptions: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
  
  if (endDate) {
    const end = new Date(endDate);
    if (start.toDateString() !== end.toDateString()) {
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', options)}`;
    }
    return `${start.toLocaleDateString('en-US', options)} • ${start.toLocaleTimeString('en-US', timeOptions)} - ${end.toLocaleTimeString('en-US', timeOptions)}`;
  }
  return `${start.toLocaleDateString('en-US', options)} • ${start.toLocaleTimeString('en-US', timeOptions)}`;
}

function getDaysUntil(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days;
}

export default async function EventsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;
  
  // Try to fetch from database
  let events: CommunityEvent[] = staticEvents;
  const { data: dbEvents } = await supabase
    .from('community_events')
    .select('*')
    .eq('is_public', true)
    .gte('start_date', new Date().toISOString())
    .order('start_date', { ascending: true });
  
  if (dbEvents && dbEvents.length > 0) {
    events = dbEvents;
  }
  
  // Get user registrations
  let userRegistrations: Set<string> = new Set();
  if (user) {
    const { data: registrations } = await supabase
      .from('event_registrations')
      .select('event_id')
      .eq('user_id', user.id);
    
    if (registrations) {
      userRegistrations = new Set(registrations.map(r => r.event_id));
    }
  }
  
  const featuredEvents = events.filter(e => e.is_featured);
  const upcomingEvents = events.filter(e => !e.is_featured);
  
  return (
    <div className="min-h-screen bg-surface-950">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-brand-400 mb-4">
            <span className="w-8 h-px bg-brand-500" />EVENTS
          </span>
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-white mb-6 max-w-3xl">
            Learn, connect, and grow with the community
          </h1>
          <p className="text-lg text-surface-400 max-w-2xl">
            Workshops, conferences, and meetups designed to help creators level up their craft and connect with like-minded individuals.
          </p>
        </div>
      </section>
      
      {/* Featured Events */}
      {featuredEvents.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <h2 className="text-2xl font-display font-bold text-white mb-6">Featured Events</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {featuredEvents.slice(0, 4).map((event) => {
              const daysUntil = getDaysUntil(event.start_date);
              const isRegistered = userRegistrations.has(event.id);
              
              return (
                <div key={event.id} className="group bg-surface-900/50 rounded-2xl border border-surface-800/50 overflow-hidden hover:border-surface-700/50 transition-colors">
                  {event.thumbnail_url && (
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={event.thumbnail_url}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-surface-900 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${eventTypeColors[event.event_type] || 'bg-surface-700 text-surface-300'}`}>
                            {eventTypeLabels[event.event_type] || event.event_type}
                          </span>
                          {daysUntil <= 7 && daysUntil > 0 && (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                              In {daysUntil} day{daysUntil !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-display font-semibold text-white mb-2 group-hover:text-brand-400 transition-colors">
                      {event.title}
                    </h3>
                    <p className="text-surface-400 text-sm mb-4 line-clamp-2">
                      {event.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-surface-300">{formatEventDate(event.start_date, event.end_date)}</div>
                        <div className="text-xs text-surface-500 mt-1">
                          {event.attendee_count.toLocaleString()} registered
                          {event.max_attendees && ` • ${event.max_attendees - event.attendee_count} spots left`}
                        </div>
                      </div>
                      {isLoggedIn ? (
                        isRegistered ? (
                          <span className="px-4 py-2 rounded-xl bg-accent-emerald/20 text-accent-emerald text-sm font-medium">
                            Registered ✓
                          </span>
                        ) : (
                          <Link
                            href={`/events/${event.id}`}
                            className="px-4 py-2 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
                          >
                            Register
                          </Link>
                        )
                      ) : (
                        <Link
                          href="/auth/login?redirect=/events"
                          className="px-4 py-2 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
                        >
                          Sign in to Register
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
      
      {/* All Upcoming Events */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <h2 className="text-2xl font-display font-bold text-white mb-6">Upcoming Events</h2>
        <div className="space-y-4">
          {upcomingEvents.map((event) => {
            const isRegistered = userRegistrations.has(event.id);
            
            return (
              <div key={event.id} className="bg-surface-900/50 rounded-2xl border border-surface-800/50 p-6 hover:border-surface-700/50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {event.thumbnail_url && (
                    <div className="w-full md:w-32 h-32 md:h-20 rounded-xl overflow-hidden flex-shrink-0">
                      <img
                        src={event.thumbnail_url}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${eventTypeColors[event.event_type] || 'bg-surface-700 text-surface-300'}`}>
                        {eventTypeLabels[event.event_type] || event.event_type}
                      </span>
                      {event.location && (
                        <span className="text-xs text-surface-500">{event.location}</span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">{event.title}</h3>
                    <p className="text-sm text-surface-400 line-clamp-1 mb-2">{event.description}</p>
                    <div className="text-sm text-surface-500">
                      {formatEventDate(event.start_date, event.end_date)}
                      <span className="mx-2">•</span>
                      {event.attendee_count.toLocaleString()} registered
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {isLoggedIn ? (
                      isRegistered ? (
                        <span className="px-4 py-2 rounded-xl bg-accent-emerald/20 text-accent-emerald text-sm font-medium">
                          Registered ✓
                        </span>
                      ) : (
                        <Link
                          href={`/events/${event.id}`}
                          className="px-4 py-2 rounded-xl bg-surface-800 text-white text-sm font-medium hover:bg-surface-700 transition-colors"
                        >
                          View Details
                        </Link>
                      )
                    ) : (
                      <Link
                        href="/auth/login?redirect=/events"
                        className="px-4 py-2 rounded-xl bg-surface-800 text-white text-sm font-medium hover:bg-surface-700 transition-colors"
                      >
                        Sign in
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          {upcomingEvents.length === 0 && featuredEvents.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface-800/50 flex items-center justify-center">
                <svg className="w-8 h-8 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No upcoming events</h3>
              <p className="text-surface-400">Check back soon for new workshops and meetups.</p>
            </div>
          )}
        </div>
      </section>
      
      {/* CTA */}
      <section className="bg-surface-900/50 border-t border-surface-800/50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-display font-bold text-white mb-4">
            Want to host an event?
          </h2>
          <p className="text-surface-400 mb-8 max-w-xl mx-auto">
            Creator and Pro members can host workshops, webinars, and meetups for the YouCast community.
          </p>
          {isLoggedIn ? (
            <Link
              href="/dashboard/settings"
              className="inline-flex px-6 py-3 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-medium hover:opacity-90 transition-opacity"
            >
              Host an Event
            </Link>
          ) : (
            <Link
              href="/auth/signup"
              className="inline-flex px-6 py-3 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-medium hover:opacity-90 transition-opacity"
            >
              Join YouCast to Host
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
