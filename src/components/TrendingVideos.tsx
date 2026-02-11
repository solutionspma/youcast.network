'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import Badge from '@/components/ui/Badge';

// Content from trending API (live streams + VODs)
interface TrendingContent {
  id: string;
  title: string;
  thumbnail_url: string | null;
  creator_id: string;
  creator_name: string;
  view_count: number;
  is_live: boolean;
  duration: number;
  started_at: string;
  trend_score: number;
}

// Legacy media format
interface TrendingVideo {
  id: string;
  title: string;
  type: string;
  views: number;
  duration: number | null;
  created_at: string;
  media_url: string | null;
  thumbnail_url: string | null;
  channel: {
    id: string;
    name: string;
    thumbnail_url: string | null;
  };
  is_live?: boolean;
}

export default function TrendingVideos() {
  const [videos, setVideos] = useState<TrendingVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'live' | 'videos'>('all');
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  const fetchTrending = useCallback(async () => {
    setLoading(true);
    
    try {
      // Try the new trending API first
      const params = new URLSearchParams({
        limit: '12',
        hours: '48',
        live: (filterMode === 'all' || filterMode === 'live') ? 'true' : 'false',
        vods: (filterMode === 'all' || filterMode === 'videos') ? 'true' : 'false',
      });
      
      const apiRes = await fetch(`/api/trending?${params}`);
      
      if (apiRes.ok) {
        const { content } = await apiRes.json() as { content: TrendingContent[] };
        
        // Transform to legacy format for now
        const transformed: TrendingVideo[] = content.map((item) => ({
          id: item.id,
          title: item.title,
          type: item.is_live ? 'stream' : 'video',
          views: item.view_count,
          duration: item.duration,
          created_at: item.started_at,
          media_url: null,
          thumbnail_url: item.thumbnail_url,
          is_live: item.is_live,
          channel: {
            id: item.creator_id,
            name: item.creator_name,
            thumbnail_url: null,
          },
        }));
        
        setVideos(transformed);
        setLoading(false);
        return;
      }
    } catch (e) {
      console.log('Trending API not available, falling back to media query');
    }
    
    // Fallback to direct media query
    const supabase = createClient();
    
    // Fetch media with their channel info, ordered by views (trending)
    const { data, error } = await supabase
      .from('media')
      .select(`
        id,
        title,
        type,
        views,
        duration,
        created_at,
        media_url,
        thumbnail_url,
        channel:channels(id, name, thumbnail_url)
      `)
      .eq('status', 'ready')
      .order('views', { ascending: false })
      .limit(8);

    if (!error && data) {
      // Transform the data to match our expected shape
      const transformed = data.map((item: Record<string, unknown>) => ({
        ...item,
        channel: Array.isArray(item.channel) ? item.channel[0] : item.channel
      })) as TrendingVideo[];
      setVideos(transformed);
    }
    setLoading(false);
  }, [filterMode]);

  useEffect(() => {
    fetchTrending();
  }, [fetchTrending]);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const handleMouseEnter = (video: TrendingVideo) => {
    setHoveredId(video.id);
    if (video.media_url && video.type === 'video') {
      const videoEl = videoRefs.current.get(video.id);
      if (videoEl) {
        videoEl.currentTime = 0;
        videoEl.play().catch(() => {});
      }
    }
  };

  const handleMouseLeave = (video: TrendingVideo) => {
    setHoveredId(null);
    if (video.media_url && video.type === 'video') {
      const videoEl = videoRefs.current.get(video.id);
      if (videoEl) {
        videoEl.pause();
        videoEl.currentTime = 0;
      }
    }
  };

  // Don't render section if no videos
  if (!loading && videos.length === 0) {
    return null;
  }

  return (
    <section className="section-padding noise">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="inline-flex items-center gap-2 text-sm font-medium text-brand-400 mb-2">
              <span className="w-8 h-px bg-brand-500" />
              TRENDING NOW
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Popular Content
            </h2>
          </div>
          <div className="flex items-center gap-4">
            {/* Filter tabs */}
            <div className="hidden sm:flex items-center gap-1 bg-surface-800/50 rounded-lg p-1">
              {(['all', 'live', 'videos'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setFilterMode(mode)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    filterMode === mode
                      ? 'bg-brand-500 text-white'
                      : 'text-surface-400 hover:text-white'
                  }`}
                >
                  {mode === 'all' ? 'All' : mode === 'live' ? '● Live' : 'Videos'}
                </button>
              ))}
            </div>
            <Link 
              href="/watch" 
              className="text-sm text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1 transition-colors"
            >
              View All
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-video bg-surface-800 rounded-xl mb-3" />
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-surface-800 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 bg-surface-800 rounded mb-2" />
                    <div className="h-3 bg-surface-800 rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Video Grid */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {videos.map((video, index) => (
              <Link
                key={video.id}
                href={video.is_live ? `/watch/${video.id}` : `/watch/video/${video.id}`}
                className="group block"
                onMouseEnter={() => handleMouseEnter(video)}
                onMouseLeave={() => handleMouseLeave(video)}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-surface-800 rounded-xl overflow-hidden mb-3">
                  {video.media_url && video.type === 'video' ? (
                    <>
                      {/* Show thumbnail when not hovered, video when hovered */}
                      {video.thumbnail_url && hoveredId !== video.id ? (
                        <img 
                          src={video.thumbnail_url} 
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video
                          ref={(el) => { if (el) videoRefs.current.set(video.id, el); }}
                          src={video.media_url}
                          className="w-full h-full object-cover"
                          muted
                          loop
                          playsInline
                          poster={video.thumbnail_url || undefined}
                        />
                      )}
                      {/* Play button overlay */}
                      {hoveredId !== video.id && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                          <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg className="w-6 h-6 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-10 h-10 text-surface-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  )}

                  {/* Duration badge */}
                  {video.duration && !video.is_live && (
                    <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-medium">
                      {formatDuration(video.duration)}
                    </span>
                  )}
                  
                  {/* Live badge or trending badge */}
                  {video.is_live ? (
                    <Badge variant="live" size="sm" className="absolute top-2 left-2">
                      ● LIVE
                    </Badge>
                  ) : index < 3 && (
                    <Badge variant="live" size="sm" className="absolute top-2 left-2">
                      #{index + 1} Trending
                    </Badge>
                  )}

                  {/* Live viewer count */}
                  {video.is_live && video.views > 0 && (
                    <span className="absolute bottom-2 right-2 bg-red-600/90 text-white text-xs px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                      </svg>
                      {formatViews(video.views)}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex gap-3">
                  {/* Channel avatar */}
                  <div className="w-9 h-9 rounded-full bg-surface-700 flex-shrink-0 overflow-hidden">
                    {video.channel?.thumbnail_url ? (
                      <img 
                        src={video.channel.thumbnail_url} 
                        alt={video.channel.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm font-bold text-brand-400">
                        {video.channel?.name?.charAt(0) || 'Y'}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-white line-clamp-2 group-hover:text-brand-400 transition-colors">
                      {video.title}
                    </h3>
                    <p className="text-xs text-surface-500 mt-1">{video.channel?.name || 'YouCast Creator'}</p>
                    <p className="text-xs text-surface-500">
                      {formatViews(video.views)} views • {formatTimeAgo(video.created_at)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
