'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useStream } from '@/hooks/useStream';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { useMicrophoneAudioBinding } from '@/hooks/useMicrophoneAudioBinding';
import { createClient } from '@/lib/supabase/client';
import StreamChat from '@/components/stream/StreamChat';
import { LiveVUMeter } from '@/components/stream/LiveVUMeter';
import { AudioDeviceSelector } from '@/components/stream/AudioDeviceSelector';
import { IS_PRODUCTION_DATA } from '@/lib/env';

// Pro Components
import CompositionSwitcher from '@/components/stream/CompositionSwitcher';
import ProSoundboard from '@/components/stream/ProSoundboard';
import { 
  ParticipantList, 
  IntercomButton, 
  CuePanel,
  CueDisplay,
  ControlRequestPanel,
  useCollaborativeSession 
} from '@/components/stream/CollaborativeControls';
import { getCompositionEngine } from '@/lib/streamStudio/CompositionEngine';
import { useCompositions, useCompositionHotkeys } from '@/hooks/useCompositions';

// Lower Thirds
import { LowerThirdOverlay } from '@/components/stream/lower-thirds/LowerThirdOverlay';
import { LowerThirdGallery } from '@/components/stream/lower-thirds/LowerThirdGallery';
import { getLowerThirdEngine } from '@/components/stream/lower-thirds/LowerThirdEngine';
import { useLowerThirds } from '@/components/stream/useLowerThirds';

// Import Pro CSS
import '@/styles/pro-mixer.css';

// ============================================================================
// TYPES
// ============================================================================

type LeftPanel = 'sources' | 'compositions' | 'overlays' | 'lower-thirds';
type RightPanel = 'chat' | 'audio' | 'soundboard' | 'collab';

type ChatMessage = {
  id: string;
  username: string;
  message: string;
  timestamp: string;
  type: 'message' | 'system' | 'moderator' | 'superchat';
  amount?: number;
};

// ============================================================================
// REAL VU METER COMPONENT (Uses actual analyzer data)
// ============================================================================

function RealVUMeter({ peak, rms, muted }: { peak: number; rms: number; muted: boolean }) {
  const getSegmentColor = (threshold: number, value: number) => {
    if (muted || value < threshold) return 'bg-surface-700';
    if (threshold > 85) return 'bg-red-500';
    if (threshold > 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Show "NO SIGNAL" when both peak and rms are effectively zero
  const noSignal = peak < 1 && rms < 1;

  if (noSignal && !muted) {
    return (
      <div className="space-y-1">
        <div className="h-4 flex items-center justify-center">
          <span className="text-[8px] text-surface-500 uppercase tracking-wider">No Signal</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {/* RMS meter */}
      <div className="flex gap-0.5">
        {Array.from({ length: 20 }).map((_, i) => {
          const threshold = (i + 1) * 5;
          return (
            <div
              key={`rms-${i}`}
              className={`h-1.5 flex-1 rounded-sm transition-colors duration-75 ${
                rms >= threshold ? getSegmentColor(threshold, rms) : 'bg-surface-800'
              } opacity-70`}
            />
          );
        })}
      </div>
      {/* Peak meter */}
      <div className="flex gap-0.5">
        {Array.from({ length: 20 }).map((_, i) => {
          const threshold = (i + 1) * 5;
          return (
            <div
              key={`peak-${i}`}
              className={`h-1 flex-1 rounded-sm transition-colors duration-75 ${
                peak >= threshold ? getSegmentColor(threshold, peak) : 'bg-surface-800'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// PRO CHANNEL STRIP (Uses real audio engine)
// ============================================================================

interface ChannelStripProps {
  name: string;
  type: 'mic' | 'camera' | 'screen' | 'music' | 'sfx';
  volume: number;
  isMuted: boolean;
  isSolo: boolean;
  peakL: number;
  peakR: number;
  onVolumeChange: (v: number) => void;
  onMuteToggle: () => void;
  onSoloToggle: () => void;
  onMonitorToggle: () => void;
  isMonitoring: boolean;
}

function ChannelStrip({ 
  name, type, volume, isMuted, isSolo, 
  onVolumeChange, onMuteToggle, onSoloToggle,
  onMonitorToggle, isMonitoring,
  peakL, peakR
}: ChannelStripProps) {
  const dB = volume === 0 ? -Infinity : 20 * Math.log10(volume / 100);
  const dBDisplay = volume === 0 ? '-∞' : dB.toFixed(1);
  
  return (
    <div className={`channel-strip ${isMuted ? 'muted' : ''}`}>
      <div className="channel-strip__header">
        <span className="channel-strip__name truncate">{name}</span>
        <span className="channel-strip__type">{type}</span>
      </div>
      
      {/* Real VU Meters */}
      <div className="vu-meters">
        <div className="vu-bar">
          <div 
            className={`vu-bar__fill transition-all duration-75 ${
              peakL > 85 ? 'bg-red-500' : peakL > 70 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ height: `${isMuted ? 0 : peakL}%` }} 
          />
        </div>
        <div className="vu-bar">
          <div 
            className={`vu-bar__fill transition-all duration-75 ${
              peakR > 85 ? 'bg-red-500' : peakR > 70 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ height: `${isMuted ? 0 : peakR}%` }} 
          />
        </div>
      </div>
      
      {/* Fader */}
      <div className="fader-container" style={{ height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          className="fader"
          style={{ width: '120px' }}
        />
      </div>
      <div className="fader-value text-center">{dBDisplay} dB</div>
      
      {/* Buttons */}
      <div className="channel-buttons">
        <button 
          className={`channel-btn solo ${isSolo ? 'active' : ''}`}
          onClick={onSoloToggle}
          title="Solo"
        >
          S
        </button>
        <button 
          className={`channel-btn mute ${isMuted ? 'active' : ''}`}
          onClick={onMuteToggle}
          title="Mute"
        >
          M
        </button>
      </div>
      
      {/* Output Routing */}
      <div className="output-routing">
        <button className="output-btn active">🔴 Stream</button>
        <button 
          className={`output-btn ${isMonitoring ? 'active' : ''}`}
          onClick={onMonitorToggle}
          title="Monitor to headphones"
        >
          🎧 Mon
        </button>
        <button className="output-btn">⏺ Rec</button>
      </div>
    </div>
  );
}

// ============================================================================
// PRO STREAM STUDIO
// ============================================================================

export default function ProStreamStudioPage() {
  const [channelId, setChannelId] = useState<string>('');
  const [leftPanel, setLeftPanel] = useState<LeftPanel>('compositions');
  const [rightPanel, setRightPanel] = useState<RightPanel>('audio');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [showMixer, setShowMixer] = useState(true);
  const [masterVolume, setMasterVolume] = useState(85);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Initialize Stream Hook
  const stream = useStream(channelId);
  const supabase = createClient();
  
  // Audio Engine (REAL audio processing)
  const {
    isInitialized: audioInitialized,
    channels: audioChannels,
    meters: audioMeters,
    initAudio,
    addChannel: addAudioChannel,
    setVolume,
    setMuted,
    setSolo,
    setMasterVolume: setMasterVol,
    enableMonitor,
    disableMonitor,
    isMonitoring,
    muteAll,
  } = useAudioEngine();
  
  // Composition system
  const { compositions, activeComposition, previewComposition, switchToComposition, setPreview } = useCompositions();
  useCompositionHotkeys();
  
  // Lower thirds
  const lowerThirds = useLowerThirds();
  
  // Collaborative session
  const collaborativeSession = useCollaborativeSession();
  
  // Auto-bind microphone to audio graph
  useMicrophoneAudioBinding({
    audioStream: stream.audioStream,
    deviceLabel: 'Stream Microphone',
    sourceId: 'microphone-primary',
  });
  
  // Get channel ID
  useEffect(() => {
    const fetchOrCreateChannel = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: channels } = await supabase
          .from('channels')
          .select('id')
          .eq('creator_id', user.id)
          .limit(1);
        
        if (channels && channels.length > 0) {
          setChannelId(channels[0].id);
        } else {
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
  }, [supabase]);
  
  // Initialize audio engine and bind streams
  useEffect(() => {
    const bindAudio = async () => {
      if (!audioInitialized) {
        await initAudio();
      }
      
      // Bind microphone stream
      if (stream.audioStream) {
        await addAudioChannel(
          { id: 'mic', name: 'Microphone', type: 'microphone' },
          stream.audioStream
        );
      }
      
      // Bind camera audio (if exists)
      if (stream.cameraStream?.getAudioTracks().length) {
        await addAudioChannel(
          { id: 'camera', name: 'Camera Audio', type: 'microphone' },
          stream.cameraStream
        );
      }
      
      // Bind screen audio (if exists)
      if (stream.screenStream?.getAudioTracks().length) {
        await addAudioChannel(
          { id: 'screen', name: 'Screen Audio', type: 'desktop' },
          stream.screenStream
        );
      }
    };
    
    bindAudio();
  }, [stream.audioStream, stream.cameraStream, stream.screenStream, audioInitialized, initAudio, addAudioChannel]);
  
  // Initialize canvas
  useEffect(() => {
    if (canvasRef.current) {
      stream.initCanvas(canvasRef.current);
    }
  }, [stream]);
  
  // Connect camera stream
  useEffect(() => {
    if (videoRef.current && stream.cameraStream) {
      videoRef.current.srcObject = stream.cameraStream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream.cameraStream]);
  
  // Format duration
  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };
  
  // Audio control wrappers (shared between mini and full mixer)
  const handleVolumeChange = useCallback((id: string, volume: number) => {
    setVolume(id, volume);
  }, [setVolume]);
  
  const handleMuteToggle = useCallback((id: string) => {
    const channel = audioChannels.get(id);
    if (channel) {
      setMuted(id, !channel.muted);
    }
  }, [audioChannels, setMuted]);
  
  const handleSoloToggle = useCallback((id: string) => {
    const channel = audioChannels.get(id);
    if (channel) {
      setSolo(id, !channel.solo);
    }
  }, [audioChannels, setSolo]);
  
  const handleMonitorToggle = useCallback((id: string) => {
    if (isMonitoring === id) {
      disableMonitor();
    } else {
      enableMonitor(id);
    }
  }, [isMonitoring, enableMonitor, disableMonitor]);
  
  const handleMasterVolumeChange = useCallback((volume: number) => {
    setMasterVolume(volume);
    setMasterVol(volume);
  }, [setMasterVol]);
  
  // Handle send message
  const handleSendMessage = async (message: string) => {
    if (!stream.streamId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    await supabase
      .from('chat_messages')
      .insert({
        stream_id: stream.streamId,
        user_id: user.id,
        message: message.trim()
      });
  };
  
  // Helper to get audio channel array from Map
  const audioChannelArray = Array.from(audioChannels.values());

  return (
    <div className="pro-studio">
      {/* Cue Display (full screen when active) */}
      <CueDisplay />
      
      {/* Control Request Panel */}
      <ControlRequestPanel />
      
      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* HEADER BAR */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <header className="studio-header">
        <div className="studio-header__left">
          <h1 className="text-sm font-bold text-white">YouCast Studio</h1>
          
          {/* Live Indicator */}
          <div className={`live-indicator ${stream.status !== 'live' ? 'offline' : ''}`}>
            {stream.status === 'live' ? 'LIVE' : stream.status.toUpperCase()}
          </div>
          
          {stream.status === 'live' && (
            <div className="stream-timer">{formatDuration(stream.duration)}</div>
          )}
        </div>
        
        <div className="studio-header__center">
          {/* Transition Controls */}
          <button 
            className="transition-btn cut"
            onClick={() => {
              if (previewComposition) {
                switchToComposition(previewComposition.id, { instant: true });
              }
            }}
          >
            CUT
          </button>
          <button 
            className="transition-btn auto"
            onClick={() => {
              if (previewComposition) {
                switchToComposition(previewComposition.id);
              }
            }}
          >
            AUTO
          </button>
        </div>
        
        <div className="studio-header__right">
          {/* Intercom */}
          <IntercomButton />
          
          {/* Viewers */}
          {stream.status === 'live' && (
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <span>👁️</span>
              <span>{stream.viewerCount}</span>
            </div>
          )}
          
          {/* Go Live Button */}
          {stream.status === 'offline' && (
            <button
              onClick={stream.startPreview}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-semibold"
            >
              Start Preview
            </button>
          )}
          {stream.status === 'preview' && (
            <button
              onClick={stream.goLive}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-bold flex items-center gap-2"
            >
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              Go Live
            </button>
          )}
          {stream.status === 'live' && (
            <button
              onClick={stream.stopStream}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-bold"
            >
              End Stream
            </button>
          )}
        </div>
      </header>
      
      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* SOURCES PANEL (LEFT) */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <aside className="sources-panel">
        <div className="sources-panel__header">
          <h2>Sources</h2>
          <button className="text-xs text-zinc-400 hover:text-white">+ Add</button>
        </div>
        
        <div className="sources-panel__content">
          {/* Panel Tabs */}
          <div className="flex gap-1 mb-3">
            {(['sources', 'compositions', 'overlays', 'lower-thirds'] as LeftPanel[]).map(tab => (
              <button
                key={tab}
                onClick={() => setLeftPanel(tab)}
                className={`flex-1 px-2 py-1.5 text-xs font-medium rounded capitalize ${
                  leftPanel === tab
                    ? 'bg-zinc-700 text-white'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tab === 'lower-thirds' ? 'L3' : tab.substring(0, 4)}
              </button>
            ))}
          </div>
          
          {/* Sources */}
          {leftPanel === 'sources' && (
            <div className="space-y-2">
              {/* Camera */}
              <div className={`source-item ${stream.cameraStream ? 'active' : ''}`}>
                <div className="source-item__thumbnail bg-zinc-800">
                  {stream.cameraStream && <video autoPlay muted playsInline className="w-full h-full object-cover" ref={el => { if (el && stream.cameraStream) el.srcObject = stream.cameraStream; }} />}
                </div>
                <div className="source-item__info">
                  <div className="source-item__name">Camera</div>
                  <div className="source-item__type">{stream.selectedCamera ? 'Active' : 'Not selected'}</div>
                </div>
              </div>
              
              {/* Microphone */}
              <div className={`source-item ${stream.audioStream ? 'active' : ''}`}>
                <div className="source-item__thumbnail bg-zinc-800 flex items-center justify-center text-2xl">🎤</div>
                <div className="source-item__info">
                  <div className="source-item__name">Microphone</div>
                  <div className="source-item__type">{stream.audioStream ? 'Active' : 'Not selected'}</div>
                </div>
              </div>
              
              {/* Screen Share */}
              <div className={`source-item ${stream.screenStream ? 'active' : ''}`}>
                <div className="source-item__thumbnail bg-zinc-800 flex items-center justify-center text-2xl">🖥️</div>
                <div className="source-item__info">
                  <div className="source-item__name">Screen Share</div>
                  <div className="source-item__type">{stream.screenStream ? 'Sharing' : 'Off'}</div>
                </div>
              </div>
              
              {/* Device Selectors */}
              <div className="pt-4 border-t border-zinc-800 space-y-3">
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Camera</label>
                  <select
                    value={stream.selectedCamera}
                    onChange={(e) => { stream.setSelectedCamera(e.target.value); stream.startCamera(e.target.value); }}
                    className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-xs text-white"
                  >
                    <option value="">Select Camera</option>
                    {stream.cameras.map(cam => (
                      <option key={cam.deviceId} value={cam.deviceId}>{cam.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Microphone</label>
                  <select
                    value={stream.selectedMicrophone}
                    onChange={(e) => { stream.setSelectedMicrophone(e.target.value); stream.startMicrophone(e.target.value); }}
                    className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-xs text-white"
                  >
                    <option value="">Select Microphone</option>
                    {stream.microphones.map(mic => (
                      <option key={mic.deviceId} value={mic.deviceId}>{mic.label}</option>
                    ))}
                  </select>
                  
                  {/* Live VU Meter for microphone */}
                  {stream.audioStream && (
                    <div className="mt-2">
                      <LiveVUMeter
                        sourceId="microphone-primary"
                        compact
                        showLabel={false}
                        className="text-zinc-400"
                      />
                    </div>
                  )}
                </div>
                
                <button
                  onClick={stream.screenStream ? stream.stopScreenShare : stream.startScreenShare}
                  className={`w-full px-3 py-2 rounded text-xs font-medium ${
                    stream.screenStream 
                      ? 'bg-red-600 hover:bg-red-500 text-white' 
                      : 'bg-zinc-700 hover:bg-zinc-600 text-white'
                  }`}
                >
                  {stream.screenStream ? 'Stop Screen Share' : 'Start Screen Share'}
                </button>
              </div>
            </div>
          )}
          
          {/* Compositions */}
          {leftPanel === 'compositions' && (
            <CompositionSwitcher compact />
          )}
          
          {/* Overlays */}
          {leftPanel === 'overlays' && (
            <div className="space-y-2">
              <div className="overlay-item visible">
                <div className="overlay-item__visibility">👁️</div>
                <div className="overlay-item__info">
                  <div className="overlay-item__name">Lower Third</div>
                  <div className="overlay-item__type">lower-third</div>
                </div>
                <div className="overlay-item__layer">L: 10</div>
              </div>
              <div className="overlay-item">
                <div className="overlay-item__visibility">👁️‍🗨️</div>
                <div className="overlay-item__info">
                  <div className="overlay-item__name">Logo</div>
                  <div className="overlay-item__type">logo</div>
                </div>
                <div className="overlay-item__layer">L: 5</div>
              </div>
              <button className="w-full px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-xs text-zinc-400 mt-2">
                + Add Overlay
              </button>
            </div>
          )}
          
          {/* Lower Thirds Panel */}
          {leftPanel === 'lower-thirds' && (
            <LowerThirdGallery engine={getLowerThirdEngine()} />
          )}
        </div>
      </aside>
      
      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* PREVIEW AREA (CENTER) */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <main className="preview-area">
        {/* Program/Preview Monitors */}
        <div className="monitors">
          {/* Preview Monitor */}
          <div className="monitor preview">
            <div className="monitor__label">PREVIEW</div>
            <canvas
              ref={previewCanvasRef}
              className="monitor__video"
              width={1920}
              height={1080}
            />
          </div>
          
          {/* Program Monitor */}
          <div className="monitor program">
            <div className="monitor__label">PROGRAM</div>
            <video ref={videoRef} autoPlay playsInline muted className="hidden" />
            <canvas
              ref={canvasRef}
              className="monitor__video"
              width={1920}
              height={1080}
            />
            
            {/* Lower Third Overlay */}
            <LowerThirdOverlay />
            
            {stream.status === 'offline' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <div className="text-center">
                  <div className="text-4xl mb-2">📹</div>
                  <p className="text-white font-medium">Stream Offline</p>
                  <p className="text-sm text-zinc-400 mt-1">Click &quot;Start Preview&quot; to begin</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Composition Strip */}
        <div className="composition-strip">
          {compositions.map((comp, i) => (
            <button
              key={comp.id}
              onClick={() => setPreview(comp.id)}
              onDoubleClick={() => switchToComposition(comp.id)}
              className={`composition-btn ${
                activeComposition?.id === comp.id ? 'program' : 
                previewComposition?.id === comp.id ? 'preview' : ''
              }`}
            >
              <span>{comp.icon}</span>
              <span>{comp.name}</span>
              {comp.hotkey && <span className="composition-btn__hotkey">{comp.hotkey}</span>}
            </button>
          ))}
          
          {/* Add button */}
          <button
            onClick={() => getCompositionEngine().addComposition({ name: `Comp ${compositions.length + 1}` })}
            className="composition-btn"
          >
            <span>+</span>
            <span>Add</span>
          </button>
        </div>
      </main>
      
      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* RIGHT PANELS */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <aside className="right-panels">
        {/* Panel Tabs */}
        <div className="panel-tabs">
          {(['chat', 'audio', 'soundboard', 'collab'] as RightPanel[]).map(tab => (
            <button
              key={tab}
              onClick={() => setRightPanel(tab)}
              className={`panel-tab ${rightPanel === tab ? 'active' : ''}`}
            >
              {tab === 'collab' ? 'Team' : tab}
            </button>
          ))}
        </div>
        
        {/* Panel Content */}
        <div className="panel-content">
          {rightPanel === 'chat' && (
            <StreamChat
              messages={chatMessages}
              onSendMessage={handleSendMessage}
              viewerCount={stream.viewerCount}
              isLive={stream.status === 'live'}
            />
          )}
          
          {rightPanel === 'audio' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-zinc-400 uppercase">Quick Audio</h3>
                <button 
                  onClick={muteAll}
                  className="text-[10px] px-2 py-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded"
                >
                  Mute All
                </button>
              </div>
              {audioChannelArray.map(ch => {
                const meter = audioMeters.get(ch.id);
                return (
                  <div key={ch.id} className="space-y-2">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleMuteToggle(ch.id)}
                        className={`w-8 h-8 rounded flex items-center justify-center text-sm ${
                          ch.muted ? 'bg-red-600 text-white' : 'bg-zinc-700 text-zinc-300'
                        }`}
                      >
                        {ch.muted ? '🔇' : '🔊'}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-white">{ch.name}</span>
                          <span className="text-[10px] text-surface-500">
                            {ch.volume === 0 ? '-∞' : (20 * Math.log10(ch.volume / 100)).toFixed(0)} dB
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={ch.volume}
                          onChange={(e) => handleVolumeChange(ch.id, Number(e.target.value))}
                          className="w-full h-1"
                        />
                      </div>
                    </div>
                    {/* Mini VU Meter */}
                    <RealVUMeter 
                      peak={meter?.peak || 0} 
                      rms={meter?.rms || 0}
                      muted={ch.muted}
                    />
                  </div>
                );
              })}
              {audioChannelArray.length === 0 && (
                <div className="text-center py-8 text-zinc-500 text-sm">
                  <p>No audio sources connected</p>
                  <p className="text-xs mt-1">Select a microphone in Sources panel</p>
                </div>
              )}
            </div>
          )}
          
          {rightPanel === 'soundboard' && (
            <ProSoundboard />
          )}
          
          {rightPanel === 'collab' && (
            <div className="space-y-4">
              <ParticipantList />
              <CuePanel />
            </div>
          )}
        </div>
      </aside>
      
      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* AUDIO MIXER DOCK (BOTTOM) */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <div className={`mixer-dock ${!showMixer ? 'collapsed' : ''}`}>
        {/* Toggle Button */}
        <button
          onClick={() => setShowMixer(!showMixer)}
          className="absolute -top-6 left-1/2 -translate-x-1/2 px-3 py-1 bg-zinc-800 border border-zinc-700 border-b-0 rounded-t text-xs text-zinc-400 hover:text-white z-10"
        >
          {showMixer ? '▼ Hide Mixer' : '▲ Show Mixer'}
        </button>
        
        {showMixer && (
          <div className="channel-strips">
            {audioChannelArray.map(ch => {
              const meter = audioMeters.get(ch.id);
              return (
                <ChannelStrip
                  key={ch.id}
                  name={ch.name}
                  type={ch.type === 'microphone' ? 'mic' : ch.type === 'desktop' ? 'screen' : ch.type as any}
                  volume={ch.volume}
                  isMuted={ch.muted}
                  isSolo={ch.solo}
                  peakL={meter?.peak || 0}
                  peakR={meter?.rms || 0}
                  onVolumeChange={(v) => handleVolumeChange(ch.id, v)}
                  onMuteToggle={() => handleMuteToggle(ch.id)}
                  onSoloToggle={() => handleSoloToggle(ch.id)}
                  onMonitorToggle={() => handleMonitorToggle(ch.id)}
                  isMonitoring={isMonitoring === ch.id}
                />
              );
            })}
            
            {audioChannelArray.length === 0 && (
              <div className="flex items-center justify-center w-full py-8 text-zinc-500 text-sm">
                <div className="text-center">
                  <p>No audio channels</p>
                  <p className="text-xs mt-1">Connect a microphone to get started</p>
                </div>
              </div>
            )}
            
            {/* Master Bus */}
            <div className="channel-strip master-bus">
              <div className="channel-strip__header">
                <span className="channel-strip__name">MASTER</span>
              </div>
              
              <div className="vu-meters">
                <div className="vu-bar">
                  <div 
                    className="vu-bar__fill bg-green-500 transition-all duration-75" 
                    style={{ height: `${masterVolume * 0.8}%` }} 
                  />
                </div>
                <div className="vu-bar">
                  <div 
                    className="vu-bar__fill bg-green-500 transition-all duration-75" 
                    style={{ height: `${masterVolume * 0.8}%` }} 
                  />
                </div>
              </div>
              
              <div className="fader-container" style={{ height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={masterVolume}
                  onChange={(e) => handleMasterVolumeChange(Number(e.target.value))}
                  className="fader"
                  style={{ width: '120px' }}
                />
              </div>
              <div className="fader-value text-center">
                {masterVolume === 0 ? '-∞' : (20 * Math.log10(masterVolume / 100)).toFixed(1)} dB
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
