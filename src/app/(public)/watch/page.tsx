// ============================================================================
// WATCH PAGE — LOGGED-IN CONTENT EXPERIENCE
// ============================================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Watch' };
export const revalidate = 30;

const categories = ['All', 'Live Now', 'Podcasts', 'Worship', 'Tech', 'Gaming', 'News', 'Education', 'Entertainment'];

type StreamItem = {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  viewer_count: number;
  started_at: string | null;
  channel: {
    id: string;
    name: string;
    handle: string;
    thumbnail_url: string | null;
  };
};

type MediaItem = {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  duration: number | null;
  views: number;
  published_at: string | null;
  progress_seconds?: number;
  channel: {
    id: string;
    name: string;
    handle: string;
    thumbnail_url: string | null;
  };
};

function formatDuration(seconds: number | null): string {
  if (!seconds) return '0:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function formatViewCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

function formatTimeAgo(date: string | null): string {
  if (!date) return '';
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
}

function StreamCard({ stream }: { stream: StreamItem }) {
  return (
    <Link href={`/watch/${stream.id}`}>
      <div className="bg-surface-900 border border-surface-800 rounded-2xl overflow-hidden group card-hover">
        <div className="relative aspect-video bg-surface-800 overflow-hidden">
          {stream.thumbnail_url ? (
            <img src={stream.thumbnail_url} alt={stream.title} className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-brand-900/40 to-surface-900/60 flex items-center justify-center">
              <svg className="w-12 h-12 text-white/20 group-hover:text-white/40 transition-colors" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          )}
          <div className="absolute bottom-2 right-2">
            <Badge variant="live" size="sm" dot>LIVE</Badge>
          </div>
        </div>
        <div className="p-4">
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              {stream.channel.name[0]}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-white line-clamp-2 leading-snug mb-1 group-hover:text-brand-400 transition-colors">
                {stream.title}
              </h3>
              <p className="text-xs text-surface-400 truncate">{stream.channel.name}</p>
              <p className="text-xs text-surface-500 mt-0.5">{formatViewCount(stream.viewer_count)} watching</p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function MediaCard({ media, showProgress = false }: { media: MediaItem; showProgress?: boolean }) {
  const progressPercent = showProgress && media.progress_seconds && media.duration
    ? Math.round((media.progress_seconds / media.duration) * 100)
    : 0;

  return (
    <Link href={`/watch/video/${media.id}`}>
      <div className="bg-surface-900 border border-surface-800 rounded-2xl overflow-hidden group card-hover">
        <div className="relative aspect-video bg-surface-800 overflow-hidden">
          {media.thumbnail_url ? (
            <img src={media.thumbnail_url} alt={media.title} className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-brand-900/40 to-surface-900/60 flex items-center justify-center">
              <svg className="w-12 h-12 text-white/20 group-hover:text-white/40 transition-colors" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          )}
          <div className="absolute bottom-2 right-2">
            <span className="bg-black/80 text-white text-xs font-medium px-1.5 py-0.5 rounded">
              {formatDuration(media.duration)}
            </span>
          </div>
          {/* Progress bar for continue watching */}
          {showProgress && progressPercent > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-700">
              <div 
                className="h-full bg-brand-500 transition-all" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              {media.channel.name[0]}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-white line-clamp-2 leading-snug mb-1 group-hover:text-brand-400 transition-colors">
                {media.title}
              </h3>
              <p className="text-xs text-surface-400 truncate">{media.channel.name}</p>
              <p className="text-xs text-surface-500 mt-0.5">
                {formatViewCount(media.views)} views • {formatTimeAgo(media.published_at)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function SectionHeader({ label, title, action }: { label: string; title: string; action?: { href: string; text: string } }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <span className="inline-flex items-center gap-2 text-sm font-medium text-brand-400 mb-2">
          <span className="w-8 h-px bg-brand-500" />{label}
        </span>
        <h2 className="text-xl font-display font-bold text-white">{title}</h2>
      </div>
      {action && (
        <Link href={action.href} className="text-sm text-brand-400 hover:text-brand-300 transition-colors">
          {action.text} →
        </Link>
      )}
    </div>
  );
}

export default async function WatchPage() {
  const supabase = createServerSupabaseClient();

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  // Fetch live streams (always visible)
  const { data: liveStreams } = await supabase
    .from('streams')
    .select(`
      id,
      title,
      description,
      thumbnail_url,
      viewer_count,
      started_at,
      channels!inner (
        id,
        name,
        handle,
        thumbnail_url
      )
    `)
    .eq('status', 'live')
    .order('viewer_count', { ascending: false })
    .limit(12);

  // Transform live streams
  const streams: StreamItem[] = (liveStreams || []).map((stream: any) => ({
    ...stream,
    channel: stream.channels
  }));

  // Logged-in specific queries
  let recentlyWatched: MediaItem[] = [];
  let continueWatching: MediaItem[] = [];
  let favorites: MediaItem[] = [];

  if (isLoggedIn) {
    // Recently Watched (last 20 unique items)
    const { data: historyData } = await supabase
      .from('playback_history')
      .select(`
        id,
        progress_seconds,
        media:media_id (
          id,
          title,
          description,
          thumbnail_url,
          duration,
          views,
          published_at,
          channels!inner (id, name, handle, thumbnail_url)
        )
      `)
      .eq('user_id', user.id)
      .not('media_id', 'is', null)
      .order('watched_at', { ascending: false })
      .limit(20);

    recentlyWatched = (historyData || [])
      .filter((h: any) => h.media)
      .map((h: any) => ({
        ...h.media,
        progress_seconds: h.progress_seconds,
        channel: h.media.channels
      }));

    // Continue Watching (incomplete items)
    const { data: continueData } = await supabase
      .from('playback_history')
      .select(`
        id,
        progress_seconds,
        media:media_id (
          id,
          title,
          description,
          thumbnail_url,
          duration,
          views,
          published_at,
          channels!inner (id, name, handle, thumbnail_url)
        )
      `)
      .eq('user_id', user.id)
      .eq('completed', false)
      .not('media_id', 'is', null)
      .gt('progress_seconds', 30)
      .order('updated_at', { ascending: false })
      .limit(8);

    continueWatching = (continueData || [])
      .filter((h: any) => h.media && h.media.duration && h.progress_seconds < h.media.duration * 0.9)
      .map((h: any) => ({
        ...h.media,
        progress_seconds: h.progress_seconds,
        channel: h.media.channels
      }));

    // Favorites
    const { data: favData } = await supabase
      .from('user_favorites')
      .select(`
        id,
        media:media_id (
          id,
          title,
          description,
          thumbnail_url,
          duration,
          views,
          published_at,
          channels!inner (id, name, handle, thumbnail_url)
        )
      `)
      .eq('user_id', user.id)
      .not('media_id', 'is', null)
      .order('favorited_at', { ascending: false })
      .limit(12);

    favorites = (favData || [])
      .filter((f: any) => f.media)
      .map((f: any) => ({
        ...f.media,
        channel: f.media.channels
      }));
  }

  // Trending (public - for all users, fallback for logged in with no history)
  const { data: trendingData } = await supabase
    .from('media')
    .select(`
      id,
      title,
      description,
      thumbnail_url,
      duration,
      views,
      published_at,
      channels!inner (
        id,
        name,
        handle,
        thumbnail_url
      )
    `)
    .eq('status', 'ready')
    .not('published_at', 'is', null)
    .order('views', { ascending: false })
    .limit(12);

  const trending: MediaItem[] = (trendingData || []).map((item: any) => ({
    ...item,
    channel: item.channels
  }));

  // Recent videos (for logged out users or as general content)
  const { data: recentData } = await supabase
    .from('media')
    .select(`
      id,
      title,
      description,
      thumbnail_url,
      duration,
      views,
      published_at,
      channels!inner (
        id,
        name,
        handle,
        thumbnail_url
      )
    `)
    .eq('status', 'ready')
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })
    .limit(12);

  const recentVideos: MediaItem[] = (recentData || []).map((item: any) => ({
    ...item,
    channel: item.channels
  }));

  const hasContent = streams.length > 0 || recentlyWatched.length > 0 || continueWatching.length > 0 || favorites.length > 0 || trending.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-10">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-brand-400 mb-4">
          <span className="w-8 h-px bg-brand-500" />BROWSE
        </span>
        <h1 className="text-4xl sm:text-5xl font-display font-bold text-white mb-3">Watch</h1>
        <p className="text-surface-400 text-lg max-w-xl">
          {isLoggedIn 
            ? 'Your personalized content feed. Pick up where you left off or discover something new.'
            : 'Discover live streams, videos, and podcasts from the Youcast network.'}
        </p>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-10 scrollbar-hide">
        {categories.map((cat, i) => (
          <button
            key={cat}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              i === 0
                ? 'bg-brand-500 text-white'
                : 'bg-surface-900 border border-surface-800 text-surface-400 hover:bg-surface-800 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════
          LOGGED-IN SECTIONS
         ═══════════════════════════════════════════════════════════════════════════ */}
      
      {isLoggedIn && (
        <>
          {/* Continue Watching */}
          {continueWatching.length > 0 && (
            <div className="mb-12">
              <SectionHeader label="RESUME" title="Continue Watching" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {continueWatching.map((item) => (
                  <MediaCard key={item.id} media={item} showProgress />
                ))}
              </div>
            </div>
          )}

          {/* Recently Watched */}
          {recentlyWatched.length > 0 && (
            <div className="mb-12">
              <SectionHeader label="HISTORY" title="Recently Watched" action={{ href: '/dashboard/history', text: 'View All' }} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {recentlyWatched.slice(0, 8).map((item) => (
                  <MediaCard key={item.id} media={item} />
                ))}
              </div>
            </div>
          )}

          {/* Favorites */}
          {favorites.length > 0 && (
            <div className="mb-12">
              <SectionHeader label="SAVED" title="Your Favorites" action={{ href: '/dashboard/favorites', text: 'View All' }} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {favorites.slice(0, 4).map((item) => (
                  <MediaCard key={item.id} media={item} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          LIVE NOW (Always visible)
         ═══════════════════════════════════════════════════════════════════════════ */}
      
      {streams.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Badge variant="live" size="md" dot>Live Now</Badge>
            <span className="text-sm text-surface-400">
              {streams.length} {streams.length === 1 ? 'stream' : 'streams'}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {streams.map((stream) => (
              <StreamCard key={stream.id} stream={stream} />
            ))}
          </div>
        </div>
      )}

      {/* Divider */}
      {(streams.length > 0 || (isLoggedIn && (continueWatching.length > 0 || recentlyWatched.length > 0))) && (
        <div className="divider mb-12" />
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          TRENDING (Public content)
         ═══════════════════════════════════════════════════════════════════════════ */}
      
      {trending.length > 0 && (
        <div className="mb-12">
          <SectionHeader label="TRENDING" title="Popular This Week" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {trending.map((item) => (
              <MediaCard key={item.id} media={item} />
            ))}
          </div>
        </div>
      )}

      {/* Recent Videos (for logged out or as additional content) */}
      {(!isLoggedIn || recentlyWatched.length === 0) && recentVideos.length > 0 && (
        <div>
          <SectionHeader label="RECENT" title="New Uploads" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {recentVideos.map((item) => (
              <MediaCard key={item.id} media={item} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!hasContent && recentVideos.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-surface-800 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No content yet</h3>
          <p className="text-surface-400 max-w-md mx-auto">
            {isLoggedIn 
              ? 'Start watching content to build your personalized feed!'
              : 'Be the first to go live or upload content to the platform!'}
          </p>
        </div>
      )}
    </div>
  );
}
