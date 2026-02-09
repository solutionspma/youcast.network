'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Badge from '@/components/ui/Badge';
import Link from 'next/link';

type Stream = {
  id: string;
  title: string;
  status: string;
  viewer_count: number;
  started_at: string | null;
  created_at: string;
  channel: {
    id: string;
    name: string;
    handle: string;
  } | null;
};

const categories = ['All', 'Live Now', 'Podcasts', 'Worship', 'Tech', 'Gaming', 'News', 'Education', 'Entertainment'];

function MediaCard({ stream }: { stream: Stream }) {
  const isLive = stream.status === 'live';
  const channelInitial = stream.channel?.name?.[0] || 'U';
  const channelHandle = stream.channel?.handle || '';

  return (
    <div className="bg-surface-900 border border-surface-800 rounded-2xl overflow-hidden group card-hover cursor-pointer">
      {/* Thumbnail */}
      <Link href={`/watch/${stream.id}`}>
        <div className="relative aspect-video bg-surface-800 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-900/40 to-surface-900/60 flex items-center justify-center">
            <svg className="w-12 h-12 text-white/20 group-hover:text-white/40 transition-colors" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          {/* Duration / Live badge */}
          <div className="absolute bottom-2 right-2">
            {isLive ? (
              <Badge variant="live" size="sm" dot>LIVE</Badge>
            ) : (
              <span className="bg-black/80 text-white text-xs font-medium px-1.5 py-0.5 rounded">
                VOD
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Info */}
      <div className="p-4">
        <div className="flex gap-3">
          <Link href={channelHandle ? `/c/${channelHandle}` : '#'} className="flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-brand-500 flex items-center justify-center text-white font-semibold text-sm hover:ring-2 hover:ring-brand-400 transition-all">
              {channelInitial}
            </div>
          </Link>
          <div className="min-w-0 flex-1">
            <Link href={`/watch/${stream.id}`}>
              <h3 className="text-sm font-semibold text-white line-clamp-2 leading-snug mb-1 group-hover:text-brand-400 transition-colors">
                {stream.title}
              </h3>
            </Link>
            <Link href={channelHandle ? `/c/${channelHandle}` : '#'}>
              <p className="text-xs text-surface-400 truncate hover:text-brand-400 transition-colors">
                {stream.channel?.name || 'Unknown Channel'}
              </p>
            </Link>
            <p className="text-xs text-surface-500 mt-0.5">
              {isLive ? `${stream.viewer_count || 0} watching` : 'Ended'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WatchPage() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    async function fetchStreams() {
      const supabase = createClient();
      
      try {
        // Fetch all streams (live and recent ended ones)
        const { data, error } = await supabase
          .from('streams')
          .select(`
            *,
            channels!inner(id, name, handle)
          `)
          .in('status', ['live', 'ended'])
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;

        // Transform data to handle channel as array
        const transformedData = data?.map(stream => ({
          ...stream,
          channel: Array.isArray(stream.channels) ? stream.channels[0] : stream.channels
        })) || [];

        setStreams(transformedData as Stream[]);
      } catch (error) {
        console.error('Error fetching streams:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStreams();

    // Refresh every 30 seconds for live updates
    const interval = setInterval(fetchStreams, 30000);
    return () => clearInterval(interval);
  }, []);

  const liveStreams = streams.filter(s => s.status === 'live');
  const endedStreams = streams.filter(s => s.status === 'ended');

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-400"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-10">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-brand-400 mb-4">
          <span className="w-8 h-px bg-brand-500" />BROWSE
        </span>
        <h1 className="text-4xl sm:text-5xl font-display font-bold text-white mb-3">Watch</h1>
        <p className="text-surface-400 text-lg max-w-xl">
          Discover live streams, videos, and podcasts from the Youcast network.
        </p>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-10 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-brand-500 text-white'
                : 'bg-surface-900 border border-surface-800 text-surface-400 hover:bg-surface-800 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Live Now Section */}
      {liveStreams.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Badge variant="live" size="md" dot>Live Now</Badge>
            <span className="text-sm text-surface-400">
              {liveStreams.length} {liveStreams.length === 1 ? 'stream' : 'streams'}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {liveStreams.map((stream) => (
              <MediaCard key={stream.id} stream={stream} />
            ))}
          </div>
        </div>
      )}

      {liveStreams.length === 0 && (
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Badge variant="default" size="md">Live Now</Badge>
            <span className="text-sm text-surface-400">No streams currently live</span>
          </div>
          <div className="bg-surface-900 border border-surface-800 rounded-2xl p-12 text-center">
            <svg className="w-16 h-16 text-surface-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="text-surface-400 text-lg mb-2">No live streams right now</p>
            <p className="text-surface-500 text-sm">Check back soon or explore recent content below</p>
          </div>
        </div>
      )}

      {endedStreams.length > 0 && (
        <>
          <div className="divider mb-12" />

          {/* Recent Streams */}
          <div>
            <span className="inline-flex items-center gap-2 text-sm font-medium text-brand-400 mb-4">
              <span className="w-8 h-px bg-brand-500" />RECENT
            </span>
            <h2 className="text-2xl font-display font-bold text-white mb-6">Recent Streams</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {endedStreams.slice(0, 8).map((stream) => (
                <MediaCard key={stream.id} stream={stream} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
