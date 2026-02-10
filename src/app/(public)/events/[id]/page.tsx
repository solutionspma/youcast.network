'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

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

// Static events data (same as listing page)
const staticEvents: Record<string, CommunityEvent> = {
  'e1': {
    id: 'e1',
    title: 'Creator Summit 2026',
    description: 'Three days of workshops, panels, and networking with top creators from around the world. Learn from industry leaders, discover new tools, and connect with your community.\n\nWhat to expect:\n- Keynote sessions from successful creators\n- Hands-on workshops on production, marketing, and monetization\n- Networking sessions with fellow creators\n- Early access to new platform features\n- Q&A sessions with the YouCast team',
    event_type: 'virtual_conference',
    start_date: '2026-03-15T09:00:00Z',
    end_date: '2026-03-17T18:00:00Z',
    attendee_count: 1250,
    is_featured: true,
    is_public: true,
    location: 'Virtual',
    max_attendees: 5000,
    thumbnail_url: 'https://images.pexels.com/photos/2774566/pexels-photo-2774566.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750',
  },
  'e2': {
    id: 'e2',
    title: 'Stream Tech Workshop: Multi-Camera Mastery',
    description: 'Hands-on session on multi-camera streaming setups, switching techniques, and audio optimization. Perfect for creators looking to level up their production quality.\n\nTopics covered:\n- Camera placement and framing\n- Seamless switching techniques\n- Audio routing and mixing\n- Scene composition\n- Live troubleshooting tips',
    event_type: 'workshop',
    start_date: '2026-02-20T14:00:00Z',
    end_date: '2026-02-20T16:00:00Z',
    attendee_count: 380,
    is_featured: true,
    is_public: true,
    location: 'Virtual',
    max_attendees: 500,
    thumbnail_url: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750',
  },
  'e3': {
    id: 'e3',
    title: 'Monetization Masterclass',
    description: 'Learn proven strategies for subscription models, sponsor partnerships, and diversifying your revenue streams as a content creator.\n\nYou will learn:\n- Setting up subscription tiers that convert\n- Approaching and negotiating with sponsors\n- Merchandise and digital product strategies\n- Building sustainable income streams\n- Real case studies from successful creators',
    event_type: 'webinar',
    start_date: '2026-02-28T18:00:00Z',
    end_date: '2026-02-28T19:30:00Z',
    attendee_count: 620,
    is_featured: true,
    is_public: true,
    location: 'Virtual',
    max_attendees: 1000,
    thumbnail_url: 'https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750',
  },
  'e4': {
    id: 'e4',
    title: 'Church Media Monthly Meetup',
    description: 'Monthly gathering for church media teams to share setups, workflows, and best practices for worship broadcasts.\n\nJoin us to:\n- Share your current setup and get feedback\n- Learn from other church media teams\n- Discuss volunteer training strategies\n- Explore new tools and techniques\n- Build connections with other ministries',
    event_type: 'meetup',
    start_date: '2026-03-05T19:00:00Z',
    end_date: '2026-03-05T20:30:00Z',
    attendee_count: 145,
    is_featured: false,
    is_public: true,
    location: 'Virtual',
    max_attendees: 300,
    thumbnail_url: 'https://images.pexels.com/photos/8815899/pexels-photo-8815899.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750',
  },
  'e5': {
    id: 'e5',
    title: 'Ask Me Anything: Platform Roadmap',
    description: 'Join the YouCast team for an open Q&A about upcoming features, platform direction, and creator feedback.\n\nTopics open for discussion:\n- Upcoming feature releases\n- Mobile app development\n- Creator tools roadmap\n- Community feature requests\n- Platform direction and vision',
    event_type: 'ama',
    start_date: '2026-03-10T17:00:00Z',
    end_date: '2026-03-10T18:00:00Z',
    attendee_count: 890,
    is_featured: true,
    is_public: true,
    location: 'Virtual',
    max_attendees: null,
    thumbnail_url: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750',
  },
  'e6': {
    id: 'e6',
    title: 'Podcast Growth Strategies',
    description: 'Expert panel on growing your podcast audience through cross-promotion, SEO, and social media marketing.\n\nPanel topics:\n- Podcast SEO and discoverability\n- Cross-promotion strategies\n- Social media content repurposing\n- Guest booking and collaborations\n- Analytics and growth tracking',
    event_type: 'webinar',
    start_date: '2026-03-12T16:00:00Z',
    end_date: '2026-03-12T17:30:00Z',
    attendee_count: 340,
    is_featured: false,
    is_public: true,
    location: 'Virtual',
    max_attendees: 500,
    thumbnail_url: 'https://images.pexels.com/photos/3783471/pexels-photo-3783471.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750',
  },
  'e7': {
    id: 'e7',
    title: 'Live Music Production Workshop',
    description: 'Technical deep-dive into streaming live music performances with optimal audio quality and visual production.\n\nWorkshop contents:\n- Audio chain optimization\n- Latency management\n- Visual production techniques\n- Multi-cam setups for performances\n- Engaging your audience during sets',
    event_type: 'workshop',
    start_date: '2026-03-18T15:00:00Z',
    end_date: '2026-03-18T17:00:00Z',
    attendee_count: 210,
    is_featured: false,
    is_public: true,
    location: 'Virtual',
    max_attendees: 400,
    thumbnail_url: 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750',
  },
  'e8': {
    id: 'e8',
    title: 'Sports Broadcasting Basics',
    description: 'Introduction to live sports streaming: equipment, commentary, instant replay, and engaging your audience.\n\nLearn about:\n- Essential equipment for sports streaming\n- Commentary techniques and best practices\n- Instant replay system setup\n- Graphics and scoreboard overlays\n- Building your sports broadcasting brand',
    event_type: 'workshop',
    start_date: '2026-03-22T14:00:00Z',
    end_date: '2026-03-22T16:00:00Z',
    attendee_count: 175,
    is_featured: false,
    is_public: true,
    location: 'Virtual',
    max_attendees: 300,
    thumbnail_url: 'https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750',
  },
};

function formatEventDate(startDate: string, endDate: string | null) {
  const start = new Date(startDate);
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
  const timeOptions: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' };
  
  if (endDate) {
    const end = new Date(endDate);
    if (start.toDateString() !== end.toDateString()) {
      return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
    }
  }
  return start.toLocaleDateString('en-US', options);
}

function formatTimeRange(startDate: string, endDate: string | null) {
  const start = new Date(startDate);
  const timeOptions: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
  
  if (endDate) {
    const end = new Date(endDate);
    return `${start.toLocaleTimeString('en-US', timeOptions)} - ${end.toLocaleTimeString('en-US', { ...timeOptions, timeZoneName: 'short' })}`;
  }
  return start.toLocaleTimeString('en-US', { ...timeOptions, timeZoneName: 'short' });
}

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [event, setEvent] = useState<CommunityEvent | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [reminderSet, setReminderSet] = useState(false);

  useEffect(() => {
    async function loadEvent() {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);
      
      // Try database first
      const { data: dbEvent } = await supabase
        .from('community_events')
        .select('*')
        .eq('id', id)
        .single();
      
      if (dbEvent) {
        setEvent(dbEvent);
      } else if (staticEvents[id]) {
        setEvent(staticEvents[id]);
      } else {
        router.push('/events');
        return;
      }
      
      // Check registration
      if (authUser) {
        const { data: registration } = await supabase
          .from('event_registrations')
          .select('id')
          .eq('event_id', id)
          .eq('user_id', authUser.id)
          .single();
        
        setIsRegistered(!!registration);
        
        // Check reminder
        const { data: reminder } = await supabase
          .from('event_reminders')
          .select('id')
          .eq('event_id', id)
          .eq('user_id', authUser.id)
          .single();
        
        setReminderSet(!!reminder);
      }
      
      setLoading(false);
    }
    
    loadEvent();
  }, [id, router]);

  async function handleRegister() {
    if (!user) {
      window.location.href = `/auth/login?redirect=/events/${id}`;
      return;
    }
    
    setRegistering(true);
    const supabase = createClient();
    
    if (isRegistered) {
      await supabase
        .from('event_registrations')
        .delete()
        .eq('event_id', id)
        .eq('user_id', user.id);
      
      setIsRegistered(false);
    } else {
      await supabase
        .from('event_registrations')
        .insert({ event_id: id, user_id: user.id });
      
      setIsRegistered(true);
    }
    
    setRegistering(false);
  }

  async function handleReminder() {
    if (!user) return;
    
    const supabase = createClient();
    
    if (reminderSet) {
      await supabase
        .from('event_reminders')
        .delete()
        .eq('event_id', id)
        .eq('user_id', user.id);
      
      setReminderSet(false);
    } else {
      await supabase
        .from('event_reminders')
        .insert({ 
          event_id: id, 
          user_id: user.id,
          remind_at: new Date(new Date(event!.start_date).getTime() - 24 * 60 * 60 * 1000).toISOString(),
        });
      
      setReminderSet(true);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!event) {
    return null;
  }

  const spotsLeft = event.max_attendees ? event.max_attendees - event.attendee_count : null;

  return (
    <div className="min-h-screen bg-surface-950">
      {/* Hero Image */}
      {event.thumbnail_url && (
        <div className="relative h-64 md:h-80 lg:h-96">
          <img
            src={event.thumbnail_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-950 via-surface-950/70 to-transparent" />
        </div>
      )}
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative pb-20">
        {/* Back link */}
        <Link href="/events" className="inline-flex items-center gap-2 text-surface-400 hover:text-white transition-colors mb-6">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Events
        </Link>
        
        {/* Event Header */}
        <div className="bg-surface-900/80 backdrop-blur-sm rounded-2xl border border-surface-800/50 p-8 mb-8">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${eventTypeColors[event.event_type] || 'bg-surface-700 text-surface-300'}`}>
              {eventTypeLabels[event.event_type] || event.event_type}
            </span>
            {event.is_featured && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-amber-500/20 text-amber-400">
                Featured
              </span>
            )}
            {event.location && (
              <span className="text-sm text-surface-400">{event.location}</span>
            )}
          </div>
          
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
            {event.title}
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <div className="flex items-center gap-3 text-surface-300 mb-2">
                <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                {formatEventDate(event.start_date, event.end_date)}
              </div>
              <div className="flex items-center gap-3 text-surface-300">
                <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatTimeRange(event.start_date, event.end_date)}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3 text-surface-300 mb-2">
                <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
                {event.attendee_count.toLocaleString()} registered
              </div>
              {spotsLeft !== null && (
                <div className="flex items-center gap-3 text-surface-300">
                  <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {spotsLeft > 0 ? `${spotsLeft.toLocaleString()} spots left` : 'Event full'}
                </div>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleRegister}
              disabled={registering || (spotsLeft !== null && spotsLeft <= 0 && !isRegistered)}
              className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                isRegistered 
                  ? 'bg-accent-emerald/20 text-accent-emerald hover:bg-accent-emerald/30'
                  : 'bg-brand-500 text-white hover:bg-brand-600'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {registering ? 'Processing...' : isRegistered ? 'Registered ✓' : 'Register for Event'}
            </button>
            
            {user && (
              <button
                onClick={handleReminder}
                className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                  reminderSet 
                    ? 'bg-surface-700 text-white'
                    : 'bg-surface-800 text-white hover:bg-surface-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill={reminderSet ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                  </svg>
                  {reminderSet ? 'Reminder Set' : 'Set Reminder'}
                </span>
              </button>
            )}
          </div>
        </div>
        
        {/* Event Description */}
        <div className="bg-surface-900/50 rounded-2xl border border-surface-800/50 p-8">
          <h2 className="text-xl font-display font-semibold text-white mb-4">About this event</h2>
          <div className="prose prose-invert prose-surface max-w-none">
            {event.description?.split('\n').map((paragraph, i) => (
              <p key={i} className="text-surface-300 leading-relaxed mb-4">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
