'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

interface Video {
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
}

interface Stream {
  id: string;
  title: string;
  status: string;
  viewer_count: number;
  thumbnail_url: string | null;
  channel: {
    id: string;
    name: string;
    thumbnail_url: string | null;
  };
}

interface Channel {
  id: string;
  name: string;
  handle: string;
  thumbnail_url: string | null;
  subscriber_count: number;
}

export default function PersonalizedHome() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [recentVideos, setRecentVideos] = useState<Video[]>([]);
  const [liveStreams, setLiveStreams] = useState<Stream[]>([]);
  const [trendingVideos, setTrendingVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      
      // Get current user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        setLoading(false);
        return;
      }
      setUser(authUser);

      // Get profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();
      setProfile(profileData);

      // Get user's channel
      const { data: channelData } = await supabase
        .from('channels')
        .select('*')
        .eq('creator_id', authUser.id)
        .single();
      setChannel(channelData);

      // Get live streams
      const { data: streams } = await supabase
        .from('streams')
        .select(`
          id, title, status, viewer_count, thumbnail_url,
          channel:channels!inner(id, name, thumbnail_url)
        `)
        .eq('status', 'live')
        .order('viewer_count', { ascending: false })
        .limit(4);

      if (streams) {
        setLiveStreams(streams.map((s: any) => ({
          ...s,
          channel: Array.isArray(s.channel) ? s.channel[0] : s.channel
        })));
      }

      // Get recent videos
      const { data: recent } = await supabase
        .from('media')
        .select(`
          id, title, type, views, duration, created_at, media_url, thumbnail_url,
          channel:channels!inner(id, name, thumbnail_url)
        `)
        .eq('status', 'ready')
        .order('created_at', { ascending: false })
        .limit(8);

      if (recent) {
        setRecentVideos(recent.map((v: any) => ({
          ...v,
          channel: Array.isArray(v.channel) ? v.channel[0] : v.channel
        })));
      }

      // Get trending videos
      const { data: trending } = await supabase
        .from('media')
        .select(`
          id, title, type, views, duration, created_at, media_url, thumbnail_url,
          channel:channels!inner(id, name, thumbnail_url)
        `)
        .eq('status', 'ready')
        .order('views', { ascending: false })
        .limit(8);

      if (trending) {
        setTrendingVideos(trending.map((v: any) => ({
          ...v,
          channel: Array.isArray(v.channel) ? v.channel[0] : v.channel
        })));
      }

      setLoading(false);
    }

    fetchData();
  }, []);

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
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const handleMouseEnter = (video: Video) => {
    setHoveredId(video.id);
    if (video.media_url && video.type === 'video') {
      const videoEl = videoRefs.current.get(video.id);
      if (videoEl) {
        videoEl.currentTime = 0;
        videoEl.play().catch(() => {});
      }
    }
  };

  const handleMouseLeave = (video: Video) => {
    setHoveredId(null);
    if (video.media_url && video.type === 'video') {
      const videoEl = videoRefs.current.get(video.id);
      if (videoEl) {
        videoEl.pause();
        videoEl.currentTime = 0;
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-950">
      {/* Hero Section - Personalized */}
      <section className="relative pt-8 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mb-2">
                Welcome back, {profile?.display_name || 'Creator'}!
              </h1>
              <p className="text-surface-400">
                Here&apos;s what&apos;s happening on YouCast today.
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/dashboard/stream">
                <Button>
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Go Live
                </Button>
              </Link>
              <Link href="/dashboard/media">
                <Button variant="outline">
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Upload
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Stats */}
          {channel && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              <div className="bg-surface-900 border border-surface-800 rounded-xl p-4">
                <div className="text-2xl font-display font-bold text-white">{channel.subscriber_count.toLocaleString()}</div>
                <div className="text-sm text-surface-500">Subscribers</div>
              </div>
              <div className="bg-surface-900 border border-surface-800 rounded-xl p-4">
                <div className="text-2xl font-display font-bold text-white">{liveStreams.length}</div>
                <div className="text-sm text-surface-500">Live Now</div>
              </div>
              <div className="bg-surface-900 border border-surface-800 rounded-xl p-4">
                <div className="text-2xl font-display font-bold text-white">{recentVideos.length}</div>
                <div className="text-sm text-surface-500">New Videos</div>
              </div>
              <div className="bg-surface-900 border border-surface-800 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent-emerald animate-pulse" />
                  <span className="text-2xl font-display font-bold text-white">Online</span>
                </div>
                <div className="text-sm text-surface-500">Your Status</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Live Now */}
      {liveStreams.length > 0 && (
        <section className="py-8 px-4 sm:px-6 lg:px-8 bg-surface-900/30">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <h2 className="text-xl font-display font-bold text-white">Live Now</h2>
              </div>
              <Link href="/watch" className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1">
                View All
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {liveStreams.map((stream) => (
                <Link
                  key={stream.id}
                  href={`/watch/${stream.id}`}
                  className="group block"
                >
                  <div className="relative aspect-video bg-surface-800 rounded-xl overflow-hidden mb-3">
                    {stream.thumbnail_url ? (
                      <img src={stream.thumbnail_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-surface-600" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute top-2 left-2 flex items-center gap-2">
                      <Badge variant="live" dot size="sm">LIVE</Badge>
                      <span className="text-xs text-white bg-black/60 px-1.5 py-0.5 rounded">
                        {stream.viewer_count.toLocaleString()} watching
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-full bg-surface-700 flex-shrink-0 overflow-hidden">
                      {stream.channel?.thumbnail_url ? (
                        <img src={stream.channel.thumbnail_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm font-bold text-brand-400">
                          {stream.channel?.name?.charAt(0) || 'Y'}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-white line-clamp-2 group-hover:text-brand-400">{stream.title}</h3>
                      <p className="text-xs text-surface-500">{stream.channel?.name}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recent Uploads */}
      <section className="py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-display font-bold text-white">Recently Uploaded</h2>
            <Link href="/watch" className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1">
              View All
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          
          {recentVideos.length === 0 ? (
            <div className="bg-surface-900 border border-surface-800 rounded-2xl p-12 text-center">
              <svg className="w-12 h-12 text-surface-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-medium text-white mb-2">No videos yet</h3>
              <p className="text-surface-400 mb-4">Be the first to upload content to the platform!</p>
              <Link href="/dashboard/media">
                <Button>Upload Your First Video</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {recentVideos.map((video) => (
                <Link
                  key={video.id}
                  href={`/watch/video/${video.id}`}
                  className="group block"
                  onMouseEnter={() => handleMouseEnter(video)}
                  onMouseLeave={() => handleMouseLeave(video)}
                >
                  <div className="relative aspect-video bg-surface-800 rounded-xl overflow-hidden mb-3">
                    {video.media_url && video.type === 'video' ? (
                      <>
                        {video.thumbnail_url && hoveredId !== video.id ? (
                          <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
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
                        {hoveredId !== video.id && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
                              <svg className="w-6 h-6 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-surface-600" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    )}
                    {video.duration && (
                      <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-medium">
                        {formatDuration(video.duration)}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-full bg-surface-700 flex-shrink-0 overflow-hidden">
                      {video.channel?.thumbnail_url ? (
                        <img src={video.channel.thumbnail_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm font-bold text-brand-400">
                          {video.channel?.name?.charAt(0) || 'Y'}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-medium text-white line-clamp-2 group-hover:text-brand-400">{video.title}</h3>
                      <p className="text-xs text-surface-500 mt-1">{video.channel?.name}</p>
                      <p className="text-xs text-surface-500">{formatViews(video.views)} views • {formatTimeAgo(video.created_at)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Trending */}
      {trendingVideos.length > 0 && (
        <section className="py-10 px-4 sm:px-6 lg:px-8 bg-surface-900/30">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                </svg>
                <h2 className="text-xl font-display font-bold text-white">Trending</h2>
              </div>
              <Link href="/watch" className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1">
                View All
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {trendingVideos.slice(0, 4).map((video, index) => (
                <Link
                  key={video.id}
                  href={`/watch/video/${video.id}`}
                  className="group block"
                >
                  <div className="relative aspect-video bg-surface-800 rounded-xl overflow-hidden mb-3">
                    {video.thumbnail_url ? (
                      <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-surface-600" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    )}
                    {video.duration && (
                      <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-medium">
                        {formatDuration(video.duration)}
                      </span>
                    )}
                    {index < 3 && (
                      <Badge variant="live" size="sm" className="absolute top-2 left-2">#{index + 1}</Badge>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-full bg-surface-700 flex-shrink-0 overflow-hidden">
                      {video.channel?.thumbnail_url ? (
                        <img src={video.channel.thumbnail_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm font-bold text-brand-400">
                          {video.channel?.name?.charAt(0) || 'Y'}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-medium text-white line-clamp-2 group-hover:text-brand-400">{video.title}</h3>
                      <p className="text-xs text-surface-500 mt-1">{video.channel?.name}</p>
                      <p className="text-xs text-surface-500">{formatViews(video.views)} views</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Quick Links */}
      <section className="py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-xl font-display font-bold text-white mb-6">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/dashboard" className="bg-surface-900 border border-surface-800 rounded-xl p-5 hover:border-brand-500/50 transition-colors group">
              <svg className="w-8 h-8 text-brand-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
              <div className="font-medium text-white group-hover:text-brand-400 transition-colors">Dashboard</div>
              <div className="text-xs text-surface-500">Manage your channel</div>
            </Link>
            <Link href="/dashboard/analytics" className="bg-surface-900 border border-surface-800 rounded-xl p-5 hover:border-brand-500/50 transition-colors group">
              <svg className="w-8 h-8 text-brand-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <div className="font-medium text-white group-hover:text-brand-400 transition-colors">Analytics</div>
              <div className="text-xs text-surface-500">View performance</div>
            </Link>
            <Link href="/community" className="bg-surface-900 border border-surface-800 rounded-xl p-5 hover:border-brand-500/50 transition-colors group">
              <svg className="w-8 h-8 text-brand-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <div className="font-medium text-white group-hover:text-brand-400 transition-colors">Community</div>
              <div className="text-xs text-surface-500">Connect with creators</div>
            </Link>
            <Link href="/dashboard/settings" className="bg-surface-900 border border-surface-800 rounded-xl p-5 hover:border-brand-500/50 transition-colors group">
              <svg className="w-8 h-8 text-brand-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div className="font-medium text-white group-hover:text-brand-400 transition-colors">Settings</div>
              <div className="text-xs text-surface-500">Customize experience</div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
