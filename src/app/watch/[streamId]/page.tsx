'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LiveKitClient, createLiveKitClient, generateLiveKitToken } from '@/lib/livekit/client';
import { useAnalytics } from '@/hooks/useAnalytics';
import StreamChat from '@/components/stream/StreamChat';
import Badge from '@/components/ui/Badge';

type Stream = {
  id: string;
  channel_id: string;
  title: string;
  description: string | null;
  status: 'offline' | 'preview' | 'live' | 'ended';
  webrtc_room_id: string | null;
  started_at: string | null;
  ended_at: string | null;
  thumbnail_url: string | null;
  channel: {
    handle: string;
    name: string;
    thumbnail_url: string | null;
    subscriber_count: number;
  };
};

export default function WatchStreamPage() {
  const params = useParams();
  const router = useRouter();
  const streamId = params.streamId as string;
  
  const [stream, setStream] = useState<Stream | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const liveKitClientRef = useRef<LiveKitClient | null>(null);
  const supabase = useMemo(() => createClient(), []);
  const analytics = useAnalytics();
  
  // ============================================================================
  // LOAD STREAM DATA
  // ============================================================================
  
  useEffect(() => {
    const loadStream = async () => {
      try {
        console.log('🔍 Loading stream:', streamId);
        const { data, error: streamError } = await supabase
          .from('streams')
          .select(`
            *,
            channel:channels (
              handle,
              name,
              thumbnail_url,
              subscriber_count
            )
          `)
          .eq('id', streamId)
          .single();
        
        if (streamError) {
          console.error('❌ Stream query error:', streamError);
          throw streamError;
        }
        
        if (!data) {
          console.error('❌ Stream not found in database');
          setError('Stream not found');
          return;
        }
        
        console.log('✅ Stream loaded:', data.title, 'Status:', data.status);
        setStream(data as any);
        
        // Show warning if not live, but still try to connect
        if (data.status !== 'live') {
          console.warn('⚠️ Stream status:', data.status, '(not live)');
        }
      } catch (err: any) {
        console.error('Error loading stream:', err);
        setError(err.message || 'Failed to load stream');
      } finally {
        setLoading(false);
      }
    };
    
    loadStream();
  }, [streamId, supabase]);
  
  // ============================================================================
  // CHECK SUBSCRIPTION STATUS
  // ============================================================================
  
  useEffect(() => {
    const checkSubscription = async () => {
      if (!stream) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('subscriber_id', user.id)
        .eq('channel_id', stream.channel_id)
        .eq('status', 'active')
        .single();
      
      setIsSubscribed(!!data);
    };
    
    checkSubscription();
  }, [stream, supabase]);
  
  // ============================================================================
  // START ANALYTICS TRACKING
  // ============================================================================
  
  useEffect(() => {
    if (!stream || stream.status !== 'live') return;
    
    // Start view tracking
    analytics.startViewTracking(streamId);
    analytics.trackJoin(streamId);
    
    return () => {
      // Stop view tracking on unmount
      analytics.stopViewTracking(streamId);
      analytics.trackLeave(streamId);
    };
  }, [stream, streamId, analytics]);
  
  // ============================================================================
  // SUBSCRIBE TO VIEWER COUNT
  // ============================================================================
  
  useEffect(() => {
    if (!stream) return;
    
    const unsubscribe = analytics.subscribeToViewerCount(streamId, (count) => {
      setViewerCount(count);
    });
    
    return unsubscribe;
  }, [stream, streamId, analytics]);
  
  // ============================================================================
  // LIVEKIT VIEWER CONNECTION
  // ============================================================================
  
  useEffect(() => {
    if (!stream) return;
    
    const connectToLiveStream = async () => {
      try {
        console.log('🔌 Connecting to LiveKit room: stream-' + stream.id);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.warn('⚠️ User not authenticated');
          setError('Please sign in to watch');
          return;
        }
        
        // Generate viewer token
        const roomName = `stream-${stream.id}`;
        const participantName = `viewer-${user.id}`;
        console.log('🎫 Generating token for:', participantName);
        const token = await generateLiveKitToken(roomName, participantName, false);
        
        if (!token) {
          throw new Error('Failed to generate LiveKit token');
        }
        
        console.log('✅ Token generated, connecting...');
        
        // Create and connect LiveKit client
        const client = createLiveKitClient();
        await client.connect(token, {
          audio: true,
          video: true
        });
        
        // Subscribe to broadcaster's tracks
        client.subscribeToTracks((track, participant) => {
          console.log('Received track:', track.kind, 'from', participant.identity);
          
          // Attach video track to video element
          if (track.kind === 'video' && videoRef.current) {
            try {
              // Use attach() method from LiveKit SDK
              (track as any).attach(videoRef.current);
              console.log('✅ Video track attached to element');
            } catch (err) {
              console.error('❌ Failed to attach video track:', err);
              // Fallback: use srcObject
              try {
                const mediaStreamTrack = (track as any).mediaStreamTrack;
                if (mediaStreamTrack) {
                  videoRef.current.srcObject = new MediaStream([mediaStreamTrack]);
                  videoRef.current.play().catch(e => console.error('Video play error:', e));
                  console.log('✅ Video track attached via srcObject');
                }
              } catch (fallbackErr) {
                console.error('❌ Fallback attach failed:', fallbackErr);
              }
            }
          }
          
          // Audio tracks auto-play in browser
        });
        
        liveKitClientRef.current = client;
        console.log('✅ Connected to LiveKit stream');
      } catch (err: any) {
        console.error('❌ LiveKit connection failed:', err);
        setError(`Connection failed: ${err.message}`);
      }
    };
    
    connectToLiveStream();
    
    return () => {
      if (liveKitClientRef.current) {
        liveKitClientRef.current.disconnect();
        liveKitClientRef.current = null;
      }
    };
  }, [stream, supabase.auth]);
  
  // ============================================================================
  // HANDLE LIKE
  // ============================================================================
  
  const handleLike = async () => {
    if (!stream || hasLiked) return;
    
    const success = await analytics.trackLike(streamId);
    if (success) {
      setHasLiked(true);
    }
  };
  
  // ============================================================================
  // HANDLE SHARE
  // ============================================================================
  
  const handleShare = async (platform?: string) => {
    if (!stream) return;
    
    const url = `${window.location.origin}/watch/${streamId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: stream.title,
          text: `Watch ${stream.channel.name} live!`,
          url,
        });
        analytics.trackShare(streamId, 'native');
      } catch (err) {
        // User cancelled
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(url);
      analytics.trackShare(streamId, 'clipboard');
      alert('Link copied to clipboard!');
    }
  };
  
  // ============================================================================
  // HANDLE SUBSCRIBE
  // ============================================================================
  
  const handleSubscribe = async () => {
    if (!stream) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('subscriptions')
        .insert({
          subscriber_id: user.id,
          channel_id: stream.channel_id,
          tier: 'free',
          status: 'active',
        });
      
      if (error) throw error;
      
      setIsSubscribed(true);
      analytics.trackSubscribe(streamId, stream.channel_id);
    } catch (err: any) {
      console.error('Failed to subscribe:', err);
      alert('Failed to subscribe. Please try again.');
    }
  };
  
  // ============================================================================
  // SEND CHAT MESSAGE
  // ============================================================================
  
  const handleSendMessage = async (message: string) => {
    if (!stream) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }
    
    // TODO: Send message to Supabase real-time chat
    const newMessage = {
      id: `msg-${Date.now()}`,
      username: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Anonymous',
      message,
      timestamp: 'now',
      type: 'message' as const,
    };
    
    setChatMessages(prev => [...prev, newMessage]);
    analytics.trackComment(streamId, newMessage.id, message);
  };
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  if (loading) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-surface-400">Loading stream...</p>
        </div>
      </div>
    );
  }
  
  if (error || !stream) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📺</div>
          <h1 className="text-2xl font-bold text-white mb-2">{error || 'Stream not found'}</h1>
          <p className="text-surface-400 mb-6">This stream may have ended or is not available.</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-surface-950">
      {/* Video Player */}
      <div className="bg-black">
        <div className="container mx-auto">
          <div className="relative" style={{ aspectRatio: '16/9' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              controls
              className="w-full h-full bg-black"
            />
            
            <div className="absolute top-4 left-4 flex items-center gap-2">
              {stream.status === 'live' && (
                <>
                  <Badge variant="live" size="lg">LIVE</Badge>
                  <span className="px-3 py-1 bg-black/70 backdrop-blur-sm text-white text-sm rounded-full">
                    {viewerCount} watching
                  </span>
                </>
              )}
              {stream.status === 'preview' && <Badge variant="warning" size="lg">PREVIEW</Badge>}
              {stream.status === 'offline' && <Badge variant="default" size="lg">OFFLINE</Badge>}
              {stream.status === 'ended' && <Badge variant="default" size="lg">ENDED</Badge>}
            </div>
            
            {/* Debug overlay */}
            {stream.status !== 'live' && (
              <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm text-white text-xs px-3 py-2 rounded font-mono">
                Status: {stream.status} | Room: stream-{stream.id.substring(0, 8)}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Stream Info & Chat */}
      <div className="container mx-auto py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Stream Info */}
          <div className="lg:col-span-2 space-y-4">
            {/* Title & Stats */}
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">{stream.title}</h1>
              <div className="flex items-center gap-4 text-sm text-surface-400">
                <span>{viewerCount} viewers</span>
                <span>•</span>
                <span>Started {new Date(stream.started_at || '').toLocaleString()}</span>
              </div>
            </div>
            
            {/* Channel Info */}
            <div className="flex items-center justify-between p-4 bg-surface-900 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold">
                  {stream.channel.name[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-white">{stream.channel.name}</p>
                  <p className="text-sm text-surface-400">{stream.channel.subscriber_count} subscribers</p>
                </div>
              </div>
              
              {!isSubscribed ? (
                <button
                  onClick={handleSubscribe}
                  className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors"
                >
                  Subscribe
                </button>
              ) : (
                <button
                  disabled
                  className="px-6 py-2 bg-surface-700 text-surface-400 rounded-lg font-medium cursor-not-allowed"
                >
                  Subscribed ✓
                </button>
              )}
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleLike}
                disabled={hasLiked}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  hasLiked
                    ? 'bg-red-600 text-white'
                    : 'bg-surface-900 hover:bg-surface-800 text-white'
                }`}
              >
                {hasLiked ? '❤️ Liked' : '🤍 Like'}
              </button>
              
              <button
                onClick={() => handleShare()}
                className="px-4 py-2 bg-surface-900 hover:bg-surface-800 text-white rounded-lg font-medium transition-colors"
              >
                Share
              </button>
            </div>
            
            {/* Description */}
            {stream.description && (
              <div className="p-4 bg-surface-900 rounded-lg">
                <p className="text-surface-300 whitespace-pre-wrap">{stream.description}</p>
              </div>
            )}
          </div>
          
          {/* Right Column - Chat */}
          <div className="lg:col-span-1">
            <div className="bg-surface-900 rounded-lg overflow-hidden" style={{ height: '600px' }}>
              <StreamChat
                messages={chatMessages}
                onSendMessage={handleSendMessage}
                viewerCount={viewerCount}
                isLive={stream.status === 'live'}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
