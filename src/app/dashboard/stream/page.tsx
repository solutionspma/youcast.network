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

// ============================================================================
// TYPES
// ============================================================================

type LeftPanel = 'devices' | 'scenes' | 'audio' | 'graphics';
type RightPanel = 'chat' | 'stats';

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
  
  const isInitialMount = useRef(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Initialize Stream Hook with REAL device connections
  const stream = useStream(channelId);
  
  // Lower Thirds System
  const lowerThirdEngine = useLowerThirds(canvasRef);
  useLowerThirdHotkeys(lowerThirdEngine);
  
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
  
  // Initialize canvas when ref is available
  useEffect(() => {
    if (canvasRef.current) {
      stream.initCanvas(canvasRef.current);
    }
  }, [stream]);
  
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
  
  const handleSendMessage = useCallback((message: string) => {
    setChatMessages(prev => [...prev, {
      id: `msg-${Date.now()}`,
      username: 'You (Host)',
      message,
      timestamp: 'now',
      type: 'moderator' as const,
    }]);
  }, []);
  
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col -m-6 -mt-0">
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
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Sidebar — Devices / Scenes / Audio */}
        <div className="w-full md:w-72 bg-surface-900/80 border-r border-surface-700/50 flex flex-col md:max-h-none max-h-48">
          {/* Panel Tabs */}
          <div className="flex border-b border-surface-700/50">
            {(['devices', 'scenes', 'audio', 'graphics'] as LeftPanel[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setLeftPanel(tab)}
                className={`flex-1 py-2.5 text-xs font-medium capitalize transition-colors ${
                  leftPanel === tab
                    ? 'text-white border-b-2 border-brand-500 bg-surface-800/50'
                    : 'text-surface-500 hover:text-surface-300'
                }`}
              >
                {tab}
              </button>
            ))}
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
              <div className="space-y-4">
                <h3 className="text-xs font-medium text-white">Audio Mixer</h3>
                
                {/* Camera Audio */}
                {stream.cameraStream && (
                  <div>
                    <label className="text-xs text-surface-300 mb-1 block">Camera Audio</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      defaultValue="0"
                      onChange={(e) => stream.setAudioVolume('camera-audio', parseInt(e.target.value) / 100)}
                      className="w-full"
                    />
                  </div>
                )}
                
                {/* Microphone Audio */}
                {stream.audioStream && (
                  <div>
                    <label className="text-xs text-surface-300 mb-1 block">Microphone</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      defaultValue="100"
                      onChange={(e) => stream.setAudioVolume('microphone', parseInt(e.target.value) / 100)}
                      className="w-full"
                    />
                  </div>
                )}
                
                {/* Screen Audio */}
                {stream.screenStream && (
                  <div>
                    <label className="text-xs text-surface-300 mb-1 block">Screen Audio</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      defaultValue="50"
                      onChange={(e) => stream.setAudioVolume('screen-audio', parseInt(e.target.value) / 100)}
                      className="w-full"
                    />
                  </div>
                )}
                
                {!stream.audioStream && !stream.cameraStream && !stream.screenStream && (
                  <div className="text-center py-8 text-sm text-surface-500">
                    No audio sources active
                  </div>
                )}
              </div>
            )}
            
            {/* GRAPHICS PANEL - Lower Thirds */}
            {leftPanel === 'graphics' && (
              <div className="space-y-4">
                <LowerThirdEditor engine={lowerThirdEngine} />
              </div>
            )}
          </div>
        </div>

        {/* Center — Preview + Controls */
        <div className="flex-1 flex flex-col bg-surface-950 p-2 md:p-4 overflow-y-auto">
          {/* Canvas Preview */}
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-5xl">
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
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

        {/* Right Sidebar — Chat / Stats */}
        <div className="w-full md:w-80 bg-surface-900/80 border-l border-surface-700/50 flex flex-col md:max-h-none max-h-64 hidden md:flex">
          {/* Panel Tabs */}
          <div className="flex border-b border-surface-700/50">
            {(['chat', 'stats'] as RightPanel[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setRightPanel(tab)}
                className={`flex-1 py-2.5 text-xs font-medium capitalize transition-colors ${
                  rightPanel === tab
                    ? 'text-white border-b-2 border-brand-500 bg-surface-800/50'
                    : 'text-surface-500 hover:text-surface-300'
                }`}
              >
                {tab}
              </button>
            ))}
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
          </div>
        </div>
      </div>
    </div>
  );
}
