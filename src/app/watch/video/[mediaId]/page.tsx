'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

type MediaVideo = {
  id: string;
  channel_id: string;
  title: string;
  description: string | null;
  type: string;
  media_url: string | null;
  thumbnail_url: string | null;
  duration: number | null;
  views: number;
  likes: number;
  status: string;
  created_at: string;
  channel: {
    handle: string;
    name: string;
    thumbnail_url: string | null;
    subscriber_count: number;
  };
};

export default function WatchVideoPage() {
  const params = useParams();
  const router = useRouter();
  const mediaId = params.mediaId as string;
  
  const [video, setVideo] = useState<MediaVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [relatedVideos, setRelatedVideos] = useState<any[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const supabase = createClient();

  // Load video data
  useEffect(() => {
    const loadVideo = async () => {
      try {
        const { data, error: videoError } = await supabase
          .from('media')
          .select(`
            *,
            channel:channels (
              handle,
              name,
              thumbnail_url,
              subscriber_count
            )
          `)
          .eq('id', mediaId)
          .single();
        
        if (videoError) throw videoError;
        if (!data) {
          setError('Video not found');
          return;
        }
        
        setVideo(data as MediaVideo);
        
        // Increment view count
        await supabase
          .from('media')
          .update({ views: (data.views || 0) + 1 })
          .eq('id', mediaId);
        
        // Load related videos from same channel
        const { data: related } = await supabase
          .from('media')
          .select('id, title, thumbnail_url, views, duration, created_at')
          .eq('channel_id', data.channel_id)
          .neq('id', mediaId)
          .eq('status', 'ready')
          .order('views', { ascending: false })
          .limit(6);
        
        if (related) {
          setRelatedVideos(related);
        }
      } catch (err: any) {
        console.error('Error loading video:', err);
        setError(err.message || 'Failed to load video');
      } finally {
        setLoading(false);
      }
    };
    
    loadVideo();
  }, [mediaId, supabase]);

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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-surface-400">Loading video...</p>
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Video Not Found</h1>
          <p className="text-surface-400 mb-6">{error || 'This video does not exist or has been removed.'}</p>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-950">
      {/* Header */}
      <header className="h-16 bg-surface-900/80 backdrop-blur-xl border-b border-surface-800 flex items-center justify-between px-6 sticky top-0 z-30">
        <Link href="/" className="flex items-center gap-2">
          <img src="/youCastlogoorange.png" alt="YouCast" className="h-8 w-auto" />
          <span className="text-lg font-display font-bold tracking-tight text-brand-400">YOUCAST</span>
        </Link>
        <Link href="/auth/login">
          <Button variant="ghost" size="sm">Sign In</Button>
        </Link>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Video Section */}
          <div className="lg:col-span-2">
            {/* Video Player */}
            <div className="bg-black rounded-xl overflow-hidden aspect-video relative group">
              {video.media_url ? (
                <video
                  ref={videoRef}
                  src={video.media_url}
                  className="w-full h-full object-contain"
                  controls
                  autoPlay
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  poster={video.thumbnail_url || undefined}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-surface-900">
                  <p className="text-surface-400">Video file not available</p>
                </div>
              )}
            </div>

            {/* Video Info */}
            <div className="mt-4">
              <h1 className="text-xl font-bold text-white">{video.title}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-surface-400">
                <span>{formatViews(video.views)} views</span>
                <span>•</span>
                <span>{formatDate(video.created_at)}</span>
              </div>
            </div>

            {/* Channel Info */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-surface-800">
              <Link href={`/c/${video.channel.handle}`} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold">
                  {video.channel.thumbnail_url ? (
                    <img src={video.channel.thumbnail_url} className="w-full h-full rounded-full object-cover" alt="" />
                  ) : (
                    video.channel.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="font-medium text-white hover:text-brand-400 transition-colors">{video.channel.name}</div>
                  <div className="text-xs text-surface-500">{video.channel.subscriber_count.toLocaleString()} subscribers</div>
                </div>
              </Link>
              <Button variant="primary" size="sm">Subscribe</Button>
            </div>

            {/* Description */}
            {video.description && (
              <div className="mt-4 p-4 bg-surface-900 rounded-xl">
                <p className="text-sm text-surface-300 whitespace-pre-wrap">{video.description}</p>
              </div>
            )}
          </div>

          {/* Sidebar - Related Videos */}
          <div className="space-y-4">
            <h2 className="font-semibold text-white">More from this channel</h2>
            {relatedVideos.length > 0 ? (
              relatedVideos.map((related) => (
                <Link key={related.id} href={`/watch/video/${related.id}`} className="flex gap-3 group">
                  <div className="w-40 h-24 bg-surface-800 rounded-lg overflow-hidden flex-shrink-0 relative">
                    {related.thumbnail_url ? (
                      <img src={related.thumbnail_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-surface-600" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    )}
                    {related.duration && (
                      <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                        {formatDuration(related.duration)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-white group-hover:text-brand-400 transition-colors line-clamp-2">{related.title}</h3>
                    <p className="text-xs text-surface-500 mt-1">{formatViews(related.views)} views</p>
                    <p className="text-xs text-surface-500">{formatDate(related.created_at)}</p>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-surface-500">No other videos from this channel</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
