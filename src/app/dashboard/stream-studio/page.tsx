'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useStream } from '@/hooks/useStream';
import { createClient } from '@/lib/supabase/client';
import StreamChat from '@/components/stream/StreamChat';
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

// Import Pro CSS
import '@/styles/pro-mixer.css';

// ============================================================================
// TYPES
// ============================================================================

type LeftPanel = 'sources' | 'compositions' | 'overlays';
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
// PRO CHANNEL STRIP (inline for now)
// ============================================================================

interface ChannelStripProps {
  name: string;
  type: 'mic' | 'camera' | 'screen' | 'music' | 'sfx';
  volume: number;
  isMuted: boolean;
  isSolo: boolean;
  onVolumeChange: (v: number) => void;
  onMuteToggle: () => void;
  onSoloToggle: () => void;
  peakL?: number;
  peakR?: number;
}

function ChannelStrip({ 
  name, type, volume, isMuted, isSolo, 
  onVolumeChange, onMuteToggle, onSoloToggle,
  peakL = 0, peakR = 0
}: ChannelStripProps) {
  const dB = volume === 0 ? -Infinity : 20 * Math.log10(volume / 100);
  const dBDisplay = volume === 0 ? '-∞' : dB.toFixed(1);
  
  return (
    <div className={`channel-strip ${isMuted ? 'muted' : ''}`}>
      <div className="channel-strip__header">
        <span className="channel-strip__name truncate">{name}</span>
        <span className="channel-strip__type">{type}</span>
      </div>
      
      {/* VU Meters */}
      <div className="vu-meters">
        <div className="vu-bar">
          <div className="vu-bar__fill" style={{ height: `${peakL}%` }} />
        </div>
        <div className="vu-bar">
          <div className="vu-bar__fill" style={{ height: `${peakR}%` }} />
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
        >
          S
        </button>
        <button 
          className={`channel-btn mute ${isMuted ? 'active' : ''}`}
          onClick={onMuteToggle}
        >
          M
        </button>
      </div>
      
      {/* Output Routing */}
      <div className="output-routing">
        <button className="output-btn active">🔴 Stream</button>
        <button className="output-btn">🎧 Mon</button>
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
  
  // Audio state
  const [audioChannels, setAudioChannels] = useState([
    { id: 'mic', name: 'Mic', type: 'mic' as const, volume: 80, muted: false, solo: false },
    { id: 'camera', name: 'Camera', type: 'camera' as const, volume: 0, muted: true, solo: false },
    { id: 'screen', name: 'Screen', type: 'screen' as const, volume: 50, muted: false, solo: false },
    { id: 'music', name: 'Music', type: 'music' as const, volume: 30, muted: false, solo: false },
  ]);
  const [masterVolume, setMasterVolume] = useState(85);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Initialize Stream Hook
  const stream = useStream(channelId);
  const supabase = createClient();
  
  // Composition system
  const { compositions, activeComposition, previewComposition, switchToComposition, setPreview } = useCompositions();
  useCompositionHotkeys();
  
  // Collaborative session
  const collaborativeSession = useCollaborativeSession();
  
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
  
  // Audio handlers
  const updateChannel = (id: string, updates: Partial<typeof audioChannels[0]>) => {
    setAudioChannels(prev => prev.map(ch => ch.id === id ? { ...ch, ...updates } : ch));
  };
  
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
            {(['sources', 'compositions', 'overlays'] as LeftPanel[]).map(tab => (
              <button
                key={tab}
                onClick={() => setLeftPanel(tab)}
                className={`flex-1 px-2 py-1.5 text-xs font-medium rounded capitalize ${
                  leftPanel === tab
                    ? 'bg-zinc-700 text-white'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tab}
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
              <h3 className="text-xs font-semibold text-zinc-400 uppercase">Quick Audio</h3>
              {audioChannels.map(ch => (
                <div key={ch.id} className="flex items-center gap-3">
                  <button 
                    onClick={() => updateChannel(ch.id, { muted: !ch.muted })}
                    className={`w-8 h-8 rounded flex items-center justify-center text-sm ${
                      ch.muted ? 'bg-red-600 text-white' : 'bg-zinc-700 text-zinc-300'
                    }`}
                  >
                    {ch.muted ? '🔇' : '🔊'}
                  </button>
                  <div className="flex-1">
                    <div className="text-xs text-white mb-1">{ch.name}</div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={ch.volume}
                      onChange={(e) => updateChannel(ch.id, { volume: Number(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </div>
              ))}
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
            {audioChannels.map(ch => (
              <ChannelStrip
                key={ch.id}
                name={ch.name}
                type={ch.type}
                volume={ch.volume}
                isMuted={ch.muted}
                isSolo={ch.solo}
                onVolumeChange={(v) => updateChannel(ch.id, { volume: v })}
                onMuteToggle={() => updateChannel(ch.id, { muted: !ch.muted })}
                onSoloToggle={() => updateChannel(ch.id, { solo: !ch.solo })}
                peakL={Math.random() * ch.volume}
                peakR={Math.random() * ch.volume}
              />
            ))}
            
            {/* Master Bus */}
            <div className="channel-strip master-bus">
              <div className="channel-strip__header">
                <span className="channel-strip__name">MASTER</span>
              </div>
              
              <div className="vu-meters">
                <div className="vu-bar">
                  <div className="vu-bar__fill" style={{ height: `${masterVolume * 0.8}%` }} />
                </div>
                <div className="vu-bar">
                  <div className="vu-bar__fill" style={{ height: `${masterVolume * 0.8}%` }} />
                </div>
              </div>
              
              <div className="fader-container" style={{ height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={masterVolume}
                  onChange={(e) => setMasterVolume(Number(e.target.value))}
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
