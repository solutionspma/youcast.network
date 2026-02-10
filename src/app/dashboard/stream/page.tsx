'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useStream } from '@/hooks/useStream';
import { createClient } from '@/lib/supabase/client';
import StreamChat from '@/components/stream/StreamChat';
import Badge from '@/components/ui/Badge';
import { IS_PRODUCTION_DATA } from '@/lib/env';
import { STREAM_STUDIO_MODE, assertNoExternalReset } from '@/lib/streamStudio/constants';
import { useLowerThirds } from '@/components/stream/useLowerThirds';
import { useLowerThirdHotkeys } from '@/components/stream/lower-thirds/useLowerThirdHotkeys';
import { LowerThirdEditor } from '@/components/stream/lower-thirds/LowerThirdEditor';
import { useOverlays } from '@/components/stream/useOverlays';
import { useCompositor } from '@/components/stream/useCompositor';
import { useGlobalShortcuts } from '@/components/stream/useGlobalShortcuts';
import { OverlayControlPanel } from '@/components/stream/overlays/OverlayControlPanel';
import { DestinationManager } from '@/components/stream/destinations/DestinationManager';

// Pro Studio Components
import '@/styles/pro-mixer.css';
import CompositionSwitcher from '@/components/stream/CompositionSwitcher';
import ProSoundboard from '@/components/stream/ProSoundboard';
import { ParticipantList, CuePanel, RoleBadge } from '@/components/stream/CollaborativeControls';
import ProAudioMixerFull from '@/components/stream/ProAudioMixerFull';
import PreviewProgramSwitcher from '@/components/stream/PreviewProgramSwitcher';
import ThumbnailStudio from '@/components/stream/ThumbnailStudio';

// ============================================================================
// TYPES
// ============================================================================

type LeftPanel = 'devices' | 'scenes' | 'audio' | 'graphics' | 'overlays' | 'destinations' | 'compositions' | 'thumbnails';
type RightPanel = 'chat' | 'stats' | 'soundboard' | 'collab';

type ChatMessage = {
  id: string;
  username: string;
  message: string;
  timestamp: string;
  type: 'message' | 'system' | 'moderator' | 'superchat';
  amount?: number;
};

// Mock chat data ONLY for UI development - NOT used in production stream state
const mockChatMessages: ChatMessage[] = IS_PRODUCTION_DATA ? [] : [
  { id: '1', username: 'ViewerPro', message: 'Great stream! Love the setup 🔥', timestamp: '2m ago', type: 'message' },
  { id: '2', username: 'System', message: 'Stream started', timestamp: '5m ago', type: 'system' },
];

// ============================================================================
// STREAM STUDIO - Real Device Connections
// ============================================================================

export default function StreamStudioPage() {
  const [channelId, setChannelId] = useState<string>('');
  const [leftPanel, setLeftPanel] = useState<LeftPanel>('devices');
  const [rightPanel, setRightPanel] = useState<RightPanel>('chat');
  const [chatMessages, setChatMessages] = useState(mockChatMessages);
  const [cameraResolution, setCameraResolution] = useState<'720p' | '1080p'>('1080p');
  const [cameraFrameRate, setCameraFrameRate] = useState<30 | 60>(30);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [showFullMixer, setShowFullMixer] = useState(false);
  const [showFullSwitcher, setShowFullSwitcher] = useState(false);
  const [showThumbnailStudio, setShowThumbnailStudio] = useState(false);
  
  const isInitialMount = useRef(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Initialize Stream Hook with REAL device connections
  const stream = useStream(channelId);
  const supabase = createClient();
  
  // Graphics Systems
  const lowerThirds = useLowerThirds();
  const overlays = useOverlays();
  
  // Unified Compositor (renders everything)
  useCompositor(
    canvasRef,
    videoRef,
    overlays.layers,
    lowerThirds.payload,
    lowerThirds.getProgress
  );
  
  // Keyboard shortcuts
  useLowerThirdHotkeys(lowerThirds.engine);
  useGlobalShortcuts(overlays.engine, lowerThirds.engine);
  
  // Production data verification
  useEffect(() => {
    console.log('🔥 STREAM STUDIO MODE:', STREAM_STUDIO_MODE);
    console.log('🔥 USING REAL DATA:', IS_PRODUCTION_DATA);
    console.log('🔥 STREAM STATE (LOCAL):', stream.status);
  }, [stream.status]);
  
  // Get channel ID from user (create if doesn't exist)
  useEffect(() => {
    const fetchOrCreateChannel = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Try to get existing channel
        const { data: channels } = await supabase
          .from('channels')
          .select('id')
          .eq('creator_id', user.id)
          .limit(1);
        
        if (channels && channels.length > 0) {
          setChannelId(channels[0].id);
        } else {
          // Create new channel
          const { data: newChannel } = await supabase
            .from('channels')
            .insert({
              creator_id: user.id,
              name: `${user.email?.split('@')[0] || 'User'}'s Channel`,
              handle: `${user.id.substring(0, 8)}-channel`,
              description: 'My streaming channel'
            })
            .select('id')
            .single();
          
          if (newChannel) {
            setChannelId(newChannel.id);
          }
        }
      }
    };
    
    fetchOrCreateChannel();
  }, []);
  
  // ============================================================================
  // REAL-TIME CHAT SUBSCRIPTION
  // ============================================================================
  
  useEffect(() => {
    if (!stream.streamId) return;
    
    // Load existing chat messages
    const loadMessages = async () => {
      console.log('💬 Loading existing chat messages for stream:', stream.streamId);
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('id, message, created_at, user_id, profiles:user_id (display_name, email)')
        .eq('stream_id', stream.streamId)
        .order('created_at', { ascending: true })
        .limit(100);
      
      if (error) {
        console.error('❌ Failed to load chat messages:', error);
        return;
      }
      
      if (messages) {
        console.log('✅ Loaded', messages.length, 'existing messages');
        const formatted = messages.map((msg: any) => ({
          id: msg.id,
          username: msg.profiles?.display_name || msg.profiles?.email?.split('@')[0] || 'Anonymous',
          message: msg.message,
          timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'message' as const,
        }));
        setChatMessages(formatted);
      }
    };
    
    loadMessages();
    
    // Subscribe to real-time chat updates
    console.log('🔔 Subscribing to real-time chat for stream:', stream.streamId);
    const channel = supabase
      .channel(`realtime-chat-${stream.streamId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `stream_id=eq.${stream.streamId}`
        },
        async (payload) => {
          console.log('📨 New chat message received:', payload);
          // Fetch user profile for the new message
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, email')
            .eq('id', payload.new.user_id)
            .single();
          
          const newMsg = {
            id: payload.new.id,
            username: profile?.display_name || profile?.email?.split('@')[0] || 'Anonymous',
            message: payload.new.message,
            timestamp: new Date(payload.new.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'message' as const,
          };
          
          setChatMessages(prev => [...prev, newMsg]);
        }
      )
      .subscribe((status) => {
        console.log('📡 Real-time subscription status:', status);
      });
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [stream.streamId, supabase]);
  
  // Initialize canvas when ref is available
  useEffect(() => {
    if (canvasRef.current) {
      stream.initCanvas(canvasRef.current);
    }
  }, [stream]);
  
  // Connect camera stream to video element for compositor
  useEffect(() => {
    if (videoRef.current && stream.cameraStream) {
      videoRef.current.srcObject = stream.cameraStream;
      videoRef.current.play().catch(err => {
        console.warn('Video play failed:', err);
      });
    }
  }, [stream.cameraStream]);
  
  // Format duration
  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };
  
  // Handlers
  const handleDeviceChange = (type: 'camera' | 'microphone', deviceId: string) => {
    if (type === 'camera') {
      stream.setSelectedCamera(deviceId);
      stream.startCamera(deviceId, cameraResolution, cameraFrameRate);
    } else {
      stream.setSelectedMicrophone(deviceId);
      stream.startMicrophone(deviceId);
    }
  };
  
  // Apply camera settings when they change (restart camera with new resolution/framerate)
  useEffect(() => {
    // Skip on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    if (stream.cameraStream && stream.selectedCamera && (stream.status === 'preview' || stream.status === 'live')) {
      console.log('Camera settings changed, restarting camera with new settings');
      stream.startCamera(stream.selectedCamera, cameraResolution, cameraFrameRate);
    }
  }, [cameraResolution, cameraFrameRate]);
  
  // DO NOT auto-start or auto-reset preview
  // Preview should only start/stop on explicit user action
  // State changes must come from user interaction ONLY

  const handleSendMessage = async (message: string) => {
    if (!stream.streamId) {
      console.error('❌ Cannot send message - no stream ID');
      return;
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ Cannot send message - not authenticated');
      return;
    }
    
    console.log('📤 Sending message to stream:', stream.streamId);
    
    // Insert message into Supabase (real-time subscription will update UI)
    const { error, data } = await supabase
      .from('chat_messages')
      .insert({
        stream_id: stream.streamId,
        user_id: user.id,
        message: message.trim()
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Failed to send message:', error);
    } else {
      console.log('✅ Message sent successfully:', data?.id);
    }
  };

  return (<div className="pro-mixer h-[calc(100vh-4rem)] flex flex-col -m-6 -mt-0">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-2 md:px-4 py-2.5 bg-surface-900 border-b border-surface-700/50">
        <div className="flex items-center gap-2 md:gap-3">
          <h1 className="text-xs md:text-sm font-bold text-white">Stream Studio</h1>
          {stream.status === 'live' && <Badge variant="live" size="sm">LIVE</Badge>}
          {stream.status === 'preview' && <Badge variant="warning" size="sm">PREVIEW</Badge>}
          {stream.status === 'offline' && <Badge variant="default" size="sm">OFFLINE</Badge>}
          {stream.status === 'error' && <Badge variant="danger" size="sm">ERROR</Badge>}
        </div>
        <div className="flex items-center gap-2 md:gap-4 text-xs text-surface-400">
          {stream.status === 'live' && (
            <>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {stream.viewerCount}
              </span>
              <span className="font-mono hidden sm:inline">{formatDuration(stream.duration)}</span>
              <span className={`hidden md:flex items-center gap-1.5 ${
                stream.streamHealth.networkQuality === 'excellent' ? 'text-green-500' :
                stream.streamHealth.networkQuality === 'good' ? 'text-yellow-500' :
                'text-red-500'
              }`}>
                {stream.streamHealth.networkQuality === 'excellent' && '●'}
                {stream.streamHealth.networkQuality === 'good' && '●'}
                {stream.streamHealth.networkQuality !== 'excellent' && stream.streamHealth.networkQuality !== 'good' && '●'}
                {stream.streamHealth.fps}fps
              </span>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left Sidebar — Devices / Scenes / Audio / Graphics */}
        <div className={`${leftCollapsed ? 'w-0 overflow-hidden' : 'w-full md:w-80'} bg-surface-900/80 border-r border-surface-700/50 flex flex-col md:max-h-none max-h-48 transition-all duration-300`}>
          {!leftCollapsed && (
            <>
              {/* Panel Tabs - Colorful Pills */}
              <div className="p-2 border-b border-surface-700/50">
                <div className="grid grid-cols-4 gap-1.5 mb-1.5">
                  {([
                    { key: 'devices', label: '📹', color: 'from-blue-500 to-cyan-500' },
                    { key: 'scenes', label: '🎬', color: 'from-purple-500 to-pink-500' },
                    { key: 'audio', label: '🎵', color: 'from-green-500 to-emerald-500' },
                    { key: 'graphics', label: '✨', color: 'from-yellow-500 to-orange-500' },
                  ] as const).map(({ key, label, color }) => (
                    <button
                      key={key}
                      onClick={() => setLeftPanel(key)}
                      className={`py-2 px-1 text-sm rounded-lg font-medium transition-all ${
                        leftPanel === key
                          ? `bg-gradient-to-r ${color} text-white shadow-lg scale-105`
                          : 'bg-surface-800 text-surface-400 hover:bg-surface-700 hover:text-white'
                      }`}
                      title={key}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {([
                    { key: 'overlays', label: '🖼️', color: 'from-rose-500 to-red-500' },
                    { key: 'destinations', label: '📡', color: 'from-indigo-500 to-blue-500' },
                    { key: 'compositions', label: '🎭', color: 'from-amber-500 to-yellow-500' },
                    { key: 'thumbnails', label: '📸', color: 'from-teal-500 to-cyan-500' },
                  ] as const).map(({ key, label, color }) => (
                    <button
                      key={key}
                      onClick={() => setLeftPanel(key)}
                      className={`py-2 px-1 text-sm rounded-lg font-medium transition-all ${
                        leftPanel === key
                          ? `bg-gradient-to-r ${color} text-white shadow-lg scale-105`
                          : 'bg-surface-800 text-surface-400 hover:bg-surface-700 hover:text-white'
                      }`}
                      title={key}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="text-center text-[10px] text-surface-500 mt-1.5 capitalize">{leftPanel}</div>
              </div>

              {/* Panel Content */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {/* DEVICES PANEL - Real Hardware */}
                {leftPanel === 'devices' && (
                  <div className="space-y-4">
                    {/* Camera Selection */}
                    <div>
                      <label className="block text-xs font-medium text-white mb-2">Camera</label>
                      <select
                        value={stream.selectedCamera}
                        onChange={(e) => handleDeviceChange('camera', e.target.value)}
                        className="w-full px-3 py-2 bg-surface-800 border border-surface-700 rounded-lg text-sm text-white"
                      >
                        <option value="">Select Camera</option>
                        {stream.cameras.map(cam => (
                          <option key={cam.deviceId} value={cam.deviceId}>{cam.label}</option>
                        ))}
                  </select>
                  {stream.cameraStream && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-green-500">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      Camera Active
                    </div>
                  )}
                  
                  {/* Camera Settings */}
                  {stream.selectedCamera && (
                    <div className="mt-3 space-y-2">
                      <div>
                        <label className="block text-xs text-surface-400 mb-1">Resolution</label>
                        <select
                          value={cameraResolution}
                          onChange={(e) => setCameraResolution(e.target.value as '720p' | '1080p')}
                          className="w-full px-2 py-1.5 bg-surface-900 border border-surface-700 rounded text-xs text-white"
                        >
                          <option value="720p">720p (1280x720)</option>
                          <option value="1080p">1080p (1920x1080)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-surface-400 mb-1">Frame Rate</label>
                        <select
                          value={cameraFrameRate}
                          onChange={(e) => setCameraFrameRate(Number(e.target.value) as 30 | 60)}
                          className="w-full px-2 py-1.5 bg-surface-900 border border-surface-700 rounded text-xs text-white"
                        >
                          <option value="30">30 FPS</option>
                          <option value="60">60 FPS</option>
                        </select>
                      </div>
                      <p className="text-xs text-surface-500">
                        {cameraResolution} @ {cameraFrameRate}fps
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Microphone Selection */}
                <div>
                  <label className="block text-xs font-medium text-white mb-2">Microphone</label>
                  <select
                    value={stream.selectedMicrophone}
                    onChange={(e) => handleDeviceChange('microphone', e.target.value)}
                    className="w-full px-3 py-2 bg-surface-800 border border-surface-700 rounded-lg text-sm text-white"
                  >
                    <option value="">Select Microphone</option>
                    {stream.microphones.map(mic => (
                      <option key={mic.deviceId} value={mic.deviceId}>{mic.label}</option>
                    ))}
                  </select>
                  {stream.audioStream && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-green-500">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      Microphone Active
                    </div>
                  )}
                </div>
                
                {/* Screen Share Button */}
                <div>
                  <label className="block text-xs font-medium text-white mb-2">Screen Share</label>
                  {!stream.screenStream ? (
                    <button
                      onClick={stream.startScreenShare}
                      className="w-full px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm transition-colors"
                    >
                      Start Screen Share
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-green-500">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        Screen Sharing Active
                      </div>
                      <button
                        onClick={stream.stopScreenShare}
                        className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                      >
                        Stop Screen Share
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Device Info */}
                <div className="pt-4 border-t border-surface-700">
                  <p className="text-xs font-medium text-white mb-2">Connected Devices</p>
                  <div className="space-y-1 text-xs text-surface-400">
                    <div>Cameras: {stream.cameras.length}</div>
                    <div>Microphones: {stream.microphones.length}</div>
                    <div>Speakers: {stream.speakers.length}</div>
                  </div>
                </div>
              </div>
            )}
            
            {/* SCENES PANEL */}
            {leftPanel === 'scenes' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-medium text-white">Scenes</h3>
                  <button
                    onClick={() => stream.createScene(`Scene ${stream.scenes.length + 1}`, 'fullscreen')}
                    className="px-2 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded text-xs transition-colors"
                  >
                    + New
                  </button>
                </div>
                
                {stream.scenes.map(scene => (
                  <div
                    key={scene.id}
                    onClick={() => stream.switchScene(scene.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      scene.isActive
                        ? 'bg-brand-600/20 border-brand-500'
                        : 'bg-surface-800 border-surface-700 hover:border-surface-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">{scene.name}</span>
                      {scene.isActive && (
                        <Badge variant="success" size="sm">ACTIVE</Badge>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-surface-400 capitalize">
                      {scene.layout} • {scene.sources.length} sources
                    </div>
                  </div>
                ))}
                
                {stream.scenes.length === 0 && (
                  <div className="text-center py-8 text-sm text-surface-500">
                    No scenes yet. Click &quot;+ New&quot; to create one.
                  </div>
                )}
              </div>
            )}
            
            {/* AUDIO PANEL */}
            {leftPanel === 'audio' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-medium text-white">🎛️ Audio Mixer</h3>
                </div>
                
                {/* Quick Controls */}
                <div className="grid grid-cols-2 gap-2">
                  <button className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-center">
                    <span className="block text-lg">🔇</span>
                    <span className="text-[9px] text-zinc-400">Mute All</span>
                  </button>
                  <button className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-center">
                    <span className="block text-lg">🎧</span>
                    <span className="text-[9px] text-zinc-400">Monitor</span>
                  </button>
                </div>

                {/* Compact Channel List */}
                <div className="space-y-2">
                  {[
                    { name: 'Camera', icon: '📹', level: 75, muted: false },
                    { name: 'Microphone', icon: '🎙️', level: 85, muted: false },
                    { name: 'Screen', icon: '🖥️', level: 50, muted: true },
                    { name: 'Media', icon: '🎵', level: 60, muted: false },
                  ].map((ch, i) => (
                    <div key={i} className={`flex items-center gap-2 p-2 rounded-lg ${ch.muted ? 'bg-red-900/20 border border-red-500/30' : 'bg-zinc-800/50'}`}>
                      <span className="text-sm">{ch.icon}</span>
                      <span className="text-xs text-white flex-1">{ch.name}</span>
                      <div className="w-16 h-2 bg-zinc-900 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${ch.muted ? 'bg-red-500/50' : 'bg-green-500'}`}
                          style={{ width: `${ch.level}%` }}
                        />
                      </div>
                      <button className={`w-6 h-6 rounded text-[10px] font-bold ${ch.muted ? 'bg-red-600 text-white' : 'bg-zinc-700 text-zinc-400'}`}>
                        M
                      </button>
                    </div>
                  ))}
                </div>

                {/* Full Mixer Link */}
                <div className="pt-2 border-t border-zinc-800">
                  <p className="text-[10px] text-zinc-500 text-center mb-2">
                    Full mixer with EQ, Compression, Gates
                  </p>
                  <button 
                    onClick={() => setShowFullMixer(true)}
                    className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-medium rounded-lg"
                  >
                    🎛️ Open Full Mixer
                  </button>
                </div>
              </div>
            )}
            
            {/* GRAPHICS PANEL - Lower Thirds */}
            {leftPanel === 'graphics' && (
              <div className="space-y-4">
                <LowerThirdEditor engine={lowerThirds.engine} />
              </div>
            )}
            
            {/* OVERLAYS PANEL - Logo, Images, Chroma Key */}
            {leftPanel === 'overlays' && (
              <div className="space-y-4">
                <OverlayControlPanel engine={overlays.engine} />
              </div>
            )}
            
            {/* DESTINATIONS PANEL - Multistream RTMP */}
            {leftPanel === 'destinations' && (
              <div className="space-y-4">
                <DestinationManager />
              </div>
            )}
            
            {/* COMPOSITIONS PANEL - Scene Switching */}
            {leftPanel === 'compositions' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-medium text-white">🎬 Compositions</h3>
                </div>

                {/* Preview / Program Mini */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-green-900/20 border border-green-500/50 rounded-lg text-center">
                    <div className="text-[8px] text-green-400 font-bold mb-1">PREVIEW</div>
                    <span className="text-2xl">📹</span>
                    <div className="text-[10px] text-white mt-1">Full Camera</div>
                  </div>
                  <div className="p-2 bg-red-900/20 border border-red-500/50 rounded-lg text-center">
                    <div className="text-[8px] text-red-400 font-bold mb-1 flex items-center justify-center gap-1">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                      PROGRAM
                    </div>
                    <span className="text-2xl">⏰</span>
                    <div className="text-[10px] text-white mt-1">Starting Soon</div>
                  </div>
                </div>

                {/* Transition Controls */}
                <div className="flex gap-1">
                  <button className="flex-1 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded">
                    CUT
                  </button>
                  <button className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded">
                    AUTO
                  </button>
                </div>

                {/* Quick Compositions */}
                <div className="space-y-1">
                  {[
                    { id: 'starting', name: 'Starting Soon', icon: '⏰', active: true },
                    { id: 'fullcam', name: 'Full Camera', icon: '📹', active: false },
                    { id: 'screenshare', name: 'Screen + PIP', icon: '🖥️', active: false },
                    { id: 'brb', name: 'Be Right Back', icon: '🔄', active: false },
                    { id: 'ending', name: 'Ending Soon', icon: '👋', active: false },
                  ].map((comp) => (
                    <button
                      key={comp.id}
                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-all ${
                        comp.active 
                          ? 'bg-red-600/20 border border-red-500 text-white' 
                          : 'bg-zinc-800/50 border border-zinc-700 text-zinc-300 hover:bg-zinc-700/50'
                      }`}
                    >
                      <span className="text-lg">{comp.icon}</span>
                      <span className="text-xs flex-1">{comp.name}</span>
                      {comp.active && <span className="text-[8px] text-red-400 font-bold">LIVE</span>}
                    </button>
                  ))}
                </div>

                {/* Full Switcher Link */}
                <div className="pt-2 border-t border-zinc-800">
                  <button 
                    onClick={() => setShowFullSwitcher(true)}
                    className="w-full py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-medium rounded-lg"
                  >
                    🎬 Open Full Switcher
                  </button>
                </div>
              </div>
            )}

            {/* THUMBNAIL STUDIO PANEL */}
            {leftPanel === 'thumbnails' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-medium text-white">📸 Thumbnail Studio</h3>
                </div>
                <p className="text-[10px] text-surface-500">
                  Create platform-optimized thumbnails for your streams, VODs, and Shorts.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { name: 'YouTube', size: '1280×720', icon: '📺' },
                    { name: 'Shorts', size: '1080×1920', icon: '📱' },
                    { name: 'Instagram', size: '1080×1080', icon: '📷' },
                    { name: 'TikTok', size: '1080×1920', icon: '🎵' },
                  ].map(p => (
                    <div key={p.name} className="p-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-center">
                      <span className="text-lg">{p.icon}</span>
                      <div className="text-[10px] text-white">{p.name}</div>
                      <div className="text-[8px] text-zinc-500">{p.size}</div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setShowThumbnailStudio(true)}
                  className="w-full py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white text-xs font-medium rounded-lg"
                >
                  🎨 Open Thumbnail Studio
                </button>
              </div>
            )}
              </div>
            </>
          )}
        </div>
        
        {/* Left Panel Toggle Button */}
        <button
          onClick={() => setLeftCollapsed(!leftCollapsed)}
          className="absolute left-0 md:left-80 top-1/2 -translate-y-1/2 z-20 w-6 h-12 bg-surface-800 hover:bg-surface-700 border border-surface-600 rounded-r-lg flex items-center justify-center transition-all"
          style={{ left: leftCollapsed ? 0 : undefined }}
        >
          <svg className={`w-4 h-4 text-surface-400 transition-transform ${leftCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Center — Preview + Controls */}
        <div className="flex-1 flex flex-col bg-surface-950 p-2 md:p-4 overflow-y-auto">
          {/* Canvas Preview */}
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-5xl">
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                {/* Hidden video element for compositor */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="hidden"
                />
                
                {/* Main canvas output */}
                <canvas
                  ref={canvasRef}
                  className="w-full h-full"
                  width={1920}
                  height={1080}
                />
                
                {stream.status === 'offline' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-surface-900/50">
                    <div className="text-center">
                      <div className="text-4xl mb-2">📹</div>
                      <p className="text-white font-medium">Stream Offline</p>
                      <p className="text-sm text-surface-400 mt-1">Click &quot;Start Preview&quot; to begin</p>
                    </div>
                  </div>
                )}
                
                {stream.status === 'live' && (
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-full">
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      LIVE
                    </span>
                    <span className="px-3 py-1.5 bg-black/50 backdrop-blur-sm text-white text-xs font-mono rounded-full">
                      {formatDuration(stream.duration)}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Stream Health */}
              {stream.status === 'live' && (
                <div className="mt-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4 text-surface-400">
                    <span>Bitrate: {stream.streamHealth.bitrate} kbps</span>
                    <span>FPS: {stream.streamHealth.fps}</span>
                    <span>Latency: {stream.streamHealth.latency}ms</span>
                    <span className={
                      stream.streamHealth.networkQuality === 'excellent' ? 'text-green-500' :
                      stream.streamHealth.networkQuality === 'good' ? 'text-yellow-500' :
                      'text-red-500'
                    }>
                      Network: {stream.streamHealth.networkQuality}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="mt-4 max-w-md mx-auto w-full">
            <div className="flex items-center justify-center gap-2">
              {stream.status === 'offline' && (
                <button
                  onClick={stream.startPreview}
                  className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors"
                >
                  Start Preview
                </button>
              )}
              
              {stream.status === 'preview' && (
                <>
                  <button
                    onClick={stream.stopPreview}
                    className="px-6 py-2.5 bg-surface-700 hover:bg-surface-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Stop Preview
                  </button>
                  <button
                    onClick={stream.goLive}
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors flex items-center gap-2"
                  >
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    Go Live
                  </button>
                </>
              )}
              
              {stream.status === 'live' && (
                <button
                  onClick={stream.stopStream}
                  className="px-8 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors"
                >
                  End Stream
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Right Panel Toggle Button */}
        <button
          onClick={() => setRightCollapsed(!rightCollapsed)}
          className="absolute right-0 md:right-80 top-1/2 -translate-y-1/2 z-20 w-6 h-12 bg-surface-800 hover:bg-surface-700 border border-surface-600 rounded-l-lg flex items-center justify-center transition-all"
          style={{ right: rightCollapsed ? 0 : undefined }}
        >
          <svg className={`w-4 h-4 text-surface-400 transition-transform ${rightCollapsed ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Right Sidebar — Chat / Stats */}
        <div className={`${rightCollapsed ? 'w-0 overflow-hidden' : 'w-full md:w-80'} bg-surface-900/80 border-l border-surface-700/50 flex flex-col md:max-h-none max-h-64 hidden md:flex transition-all duration-300`}>
          {!rightCollapsed && (
            <>
              {/* Panel Tabs - Colorful Pills */}
              <div className="p-2 border-b border-surface-700/50">
                <div className="grid grid-cols-4 gap-1.5">
                  {([
                    { key: 'chat', label: '💬', color: 'from-blue-500 to-cyan-500' },
                    { key: 'stats', label: '📊', color: 'from-green-500 to-emerald-500' },
                    { key: 'soundboard', label: '🔊', color: 'from-purple-500 to-pink-500' },
                    { key: 'collab', label: '👥', color: 'from-orange-500 to-red-500' },
                  ] as const).map(({ key, label, color }) => (
                    <button
                      key={key}
                      onClick={() => setRightPanel(key)}
                      className={`py-2 px-1 text-sm rounded-lg font-medium transition-all ${
                        rightPanel === key
                          ? `bg-gradient-to-r ${color} text-white shadow-lg scale-105`
                          : 'bg-surface-800 text-surface-400 hover:bg-surface-700 hover:text-white'
                      }`}
                      title={key}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="text-center text-[10px] text-surface-500 mt-1.5 capitalize">{rightPanel}</div>
              </div>

              {/* Panel Content */}
              <div className="flex-1 overflow-hidden">
                {rightPanel === 'chat' && (
                  <StreamChat
                    messages={chatMessages}
                    onSendMessage={handleSendMessage}
                    viewerCount={stream.viewerCount}
                    isLive={stream.status === 'live'}
                  />
                )}
                {rightPanel === 'stats' && (
                  <div className="p-4 space-y-4 text-sm">
                    <div>
                      <p className="text-xs font-medium text-surface-400 mb-1">Stream Status</p>
                      <p className="text-white capitalize">{stream.status}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-surface-400 mb-1">Duration</p>
                      <p className="text-white font-mono">{formatDuration(stream.duration)}</p>
                    </div>
                <div>
                  <p className="text-xs font-medium text-surface-400 mb-1">Viewers</p>
                  <p className="text-white">{stream.viewerCount}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-surface-400 mb-1">Resolution</p>
                  <p className="text-white">{stream.streamHealth.resolution}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-surface-400 mb-1">Active Scenes</p>
                  <p className="text-white">{stream.scenes.length}</p>
                </div>
              </div>
            )}
            
            {/* SOUNDBOARD PANEL */}
            {rightPanel === 'soundboard' && (
              <div className="p-3 overflow-y-auto h-full">
                <ProSoundboard />
              </div>
            )}
            
            {/* COLLABORATION PANEL */}
            {rightPanel === 'collab' && (
              <div className="p-3 space-y-4 overflow-y-auto h-full">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-xs font-medium text-white">Team</h3>
                  <RoleBadge role="host" />
                </div>
                <ParticipantList />
                <div className="border-t border-surface-700/50 pt-3">
                  <CuePanel />
                </div>
              </div>
            )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Full Mixer Modal */}
      {showFullMixer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-6xl max-h-[90vh] overflow-auto">
            <button
              onClick={() => setShowFullMixer(false)}
              className="absolute top-2 right-2 z-10 w-8 h-8 bg-zinc-800 hover:bg-zinc-700 rounded-full flex items-center justify-center text-white"
            >
              ✕
            </button>
            <ProAudioMixerFull />
          </div>
        </div>
      )}

      {/* Full Switcher Modal */}
      {showFullSwitcher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-auto">
            <button
              onClick={() => setShowFullSwitcher(false)}
              className="absolute top-2 right-2 z-10 w-8 h-8 bg-zinc-800 hover:bg-zinc-700 rounded-full flex items-center justify-center text-white"
            >
              ✕
            </button>
            <PreviewProgramSwitcher />
          </div>
        </div>
      )}

      {/* Thumbnail Studio Modal */}
      {showThumbnailStudio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className="relative w-full h-full max-w-[95vw] max-h-[95vh] overflow-hidden rounded-xl border border-zinc-700">
            <button
              onClick={() => setShowThumbnailStudio(false)}
              className="absolute top-2 right-2 z-10 w-8 h-8 bg-zinc-800 hover:bg-zinc-700 rounded-full flex items-center justify-center text-white"
            >
              ✕
            </button>
            <ThumbnailStudio className="h-full" />
          </div>
        </div>
      )}
    </div>
  );
}
