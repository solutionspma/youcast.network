'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

type Channel = {
  id: string;
  name: string;
  handle: string;
  description: string | null;
  subscriber_count: number;
  total_views: number;
  is_verified: boolean;
  created_at: string;
};

type Stream = {
  id: string;
  title: string;
  status: string;
  viewer_count: number;
  started_at: string | null;
  created_at: string;
  thumbnail_url: string | null;
};

export default function ChannelPage() {
  const params = useParams();
  const handle = params.handle as string;
  
  const [channel, setChannel] = useState<Channel | null>(null);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchChannel() {
      const supabase = createClient();
      
      try {
        // Fetch channel by handle
        const { data: channelData, error: channelError } = await supabase
          .from('channels')
          .select('*')
          .eq('handle', handle)
          .single();

        if (channelError) {
          if (channelError.code === 'PGRST116') {
            setError('Channel not found');
          } else {
            throw channelError;
          }
          return;
        }

        setChannel(channelData);

        // Fetch channel's streams
        const { data: streamsData, error: streamsError } = await supabase
          .from('streams')
          .select('id, title, status, viewer_count, started_at, created_at, thumbnail_url')
          .eq('channel_id', channelData.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (streamsError) throw streamsError;

        setStreams(streamsData || []);
      } catch (err) {
        console.error('Error fetching channel:', err);
        setError('Failed to load channel');
      } finally {
        setLoading(false);
      }
    }

    if (handle) {
      fetchChannel();
    }
  }, [handle]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-400"></div>
        </div>
      </div>
    );
  }

  if (error || !channel) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-20">
          <svg className="w-16 h-16 text-surface-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-bold text-white mb-2">Channel Not Found</h2>
          <p className="text-surface-400 mb-6">The channel you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/watch">
            <Button>Browse Channels</Button>
          </Link>
        </div>
      </div>
    );
  }

  const liveStreams = streams.filter(s => s.status === 'live');
  const pastStreams = streams.filter(s => s.status !== 'live');
  const channelInitial = channel.name[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Channel Header */}
      <div className="bg-surface-900 border border-surface-800 rounded-2xl p-8 mb-8">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-brand-500 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
            {channelInitial}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-white">{channel.name}</h1>
              {channel.is_verified && (
                <svg className="w-6 h-6 text-brand-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <p className="text-surface-400 mb-4">@{channel.handle}</p>
            
            {channel.description && (
              <p className="text-surface-300 mb-4 max-w-2xl">{channel.description}</p>
            )}

            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="text-white font-semibold">{channel.subscriber_count.toLocaleString()}</span>
                <span className="text-surface-500 ml-1">subscribers</span>
              </div>
              <div>
                <span className="text-white font-semibold">{channel.total_views.toLocaleString()}</span>
                <span className="text-surface-500 ml-1">total views</span>
              </div>
              <div>
                <span className="text-surface-500">Joined {new Date(channel.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Subscribe Button */}
          <div>
            <Button size="lg">Subscribe</Button>
          </div>
        </div>
      </div>

      {/* Live Streams */}
      {liveStreams.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Badge variant="live" size="md" dot>Live Now</Badge>
            <span className="text-sm text-surface-400">{liveStreams.length} active stream{liveStreams.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {liveStreams.map((stream) => (
              <Link key={stream.id} href={`/watch/${stream.id}`}>
                <div className="bg-surface-900 border border-surface-800 rounded-2xl overflow-hidden group card-hover cursor-pointer">
                  <div className="relative aspect-video bg-surface-800">
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-900/40 to-surface-900/60 flex items-center justify-center">
                      <svg className="w-12 h-12 text-white/20 group-hover:text-white/40 transition-colors" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                    <div className="absolute top-2 left-2">
                      <Badge variant="live" size="sm" dot>LIVE</Badge>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-0.5 rounded">
                      {stream.viewer_count || 0} watching
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-white line-clamp-2 group-hover:text-brand-400 transition-colors">
                      {stream.title}
                    </h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Past Streams */}
      {pastStreams.length > 0 && (
        <>
          <div className="divider mb-8" />
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white mb-2">Past Streams</h2>
            <p className="text-surface-400 text-sm">{pastStreams.length} video{pastStreams.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {pastStreams.map((stream) => (
              <Link key={stream.id} href={`/watch/${stream.id}`}>
                <div className="bg-surface-900 border border-surface-800 rounded-2xl overflow-hidden group card-hover cursor-pointer">
                  <div className="relative aspect-video bg-surface-800">
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-900/40 to-surface-900/60 flex items-center justify-center">
                      <svg className="w-12 h-12 text-white/20 group-hover:text-white/40 transition-colors" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-0.5 rounded">
                      VOD
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-white line-clamp-2 group-hover:text-brand-400 transition-colors">
                      {stream.title}
                    </h3>
                    <p className="text-xs text-surface-500 mt-1">
                      {new Date(stream.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {streams.length === 0 && (
        <div className="bg-surface-900 border border-surface-800 rounded-2xl p-12 text-center">
          <svg className="w-16 h-16 text-surface-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <p className="text-surface-400 text-lg">No streams yet</p>
          <p className="text-surface-500 text-sm mt-2">This channel hasn&apos;t streamed any content</p>
        </div>
      )}
    </div>
  );
}
