'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAudioEngine, UseAudioEngineReturn } from '@/hooks/useAudioEngine';
import { ChannelState } from '@/lib/audio/WebAudioEngine';

// ============================================================================
// TYPES
// ============================================================================

interface AudioSource {
  id: string;
  name: string;
  icon: string;
  type: 'camera' | 'mic' | 'screen' | 'media' | 'guest';
  gain: number;      // -∞ to +12 dB
  eqLow: number;     // -15 to +15 dB
  eqMid: number;     // -15 to +15 dB  
  eqHigh: number;    // -15 to +15 dB
  compThreshold: number; // -60 to 0 dB
  compRatio: number;     // 1:1 to 20:1
  gateThreshold: number; // -60 to 0 dB
  fader: number;    // 0-100 (mapped to dB)
  muted: boolean;
  solo: boolean;
  linked: boolean;
  routeStream: boolean;
  routeMonitor: boolean;
  routeRecord: boolean;
  meterLevel: number; // 0-100 for display
  meterPeak: number;
  hasSignal: boolean;  // TRUE ONLY when real audio detected
  stream?: MediaStream; // Actual audio stream connection
  channelState?: ChannelState; // Reference to real audio engine state
}

interface MasterState {
  level: number;
  meterL: number;
  meterR: number;
  peakL: number;
  peakR: number;
  limiterActive: boolean;
  muted: boolean;
  monitorEnabled: boolean;
  hasSignal: boolean; // TRUE only when real audio detected
}

const NOISE_FLOOR_DB = -50;

// ============================================================================
// KNOB COMPONENT
// ============================================================================

function RotaryKnob({ 
  value, 
  min, 
  max, 
  onChange, 
  label,
  unit = 'dB',
  size = 'md'
}: { 
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  label: string;
  unit?: string;
  size?: 'sm' | 'md';
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const startY = useRef(0);
  const startValue = useRef(0);

  const rotation = ((value - min) / (max - min)) * 270 - 135;
  const sizeClass = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startY.current = e.clientY;
    startValue.current = value;
    setShowTooltip(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = startY.current - e.clientY;
      const range = max - min;
      const newValue = Math.max(min, Math.min(max, startValue.current + (delta / 100) * range));
      onChange(Math.round(newValue * 10) / 10);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setShowTooltip(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, min, max, onChange]);

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div 
        className={`${sizeClass} relative cursor-ns-resize select-none`}
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => !isDragging && setShowTooltip(false)}
      >
        {/* Knob body */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-zinc-600 to-zinc-800 shadow-lg border border-zinc-500/30">
          {/* Indicator line */}
          <div 
            className="absolute top-1 left-1/2 w-0.5 h-3 bg-cyan-400 rounded-full origin-bottom"
            style={{ transform: `translateX(-50%) rotate(${rotation}deg)`, transformOrigin: 'center 16px' }}
          />
        </div>
        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-black text-white text-[10px] rounded whitespace-nowrap z-10">
            {value > 0 ? '+' : ''}{value}{unit}
          </div>
        )}
      </div>
      <span className="text-[9px] text-zinc-500 uppercase">{label}</span>
    </div>
  );
}

// ============================================================================
// VU METER COMPONENT  
// ============================================================================

function VUMeter({ level, peak, vertical = true, hasSignal = false, inactive = false }: { 
  level: number; 
  peak: number; 
  vertical?: boolean;
  hasSignal?: boolean;
  inactive?: boolean;
}) {
  const segments = 20;
  const levelSegments = Math.floor((level / 100) * segments);
  const peakSegment = Math.floor((peak / 100) * segments);

  return (
    <div className={`flex ${vertical ? 'flex-col-reverse' : 'flex-row'} gap-0.5`}>
      {Array.from({ length: segments }).map((_, i) => {
        const isLit = hasSignal && i < levelSegments;
        const isPeak = hasSignal && i === peakSegment && peak > 0;
        
        // Gray out inactive meters
        if (inactive || !hasSignal) {
          return (
            <div 
              key={i} 
              className={`${vertical ? 'w-full h-1.5' : 'w-2 h-full'} rounded-sm bg-zinc-800 opacity-30`}
            />
          );
        }
        
        let color = 'bg-zinc-700';
        
        if (isLit || isPeak) {
          if (i >= segments - 3) color = 'bg-red-500';
          else if (i >= segments - 6) color = 'bg-yellow-500';
          else color = 'bg-green-500';
        }
        
        return (
          <div 
            key={i} 
            className={`${vertical ? 'w-full h-1.5' : 'w-2 h-full'} rounded-sm transition-colors ${color} ${isPeak ? 'opacity-100' : isLit ? 'opacity-90' : 'opacity-30'}`}
          />
        );
      })}
    </div>
  );
}

// ============================================================================
// FADER COMPONENT
// ============================================================================

function Fader({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const faderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = () => setIsDragging(true);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!faderRef.current) return;
      const rect = faderRef.current.getBoundingClientRect();
      const y = Math.max(0, Math.min(1, (rect.bottom - e.clientY) / rect.height));
      onChange(Math.round(y * 100));
    };

    const handleMouseUp = () => setIsDragging(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onChange]);

  // Convert 0-100 to dB display
  const dB = value === 0 ? '-∞' : (((value - 75) / 75) * 12).toFixed(1);

  return (
    <div ref={faderRef} className="relative w-8 h-32 bg-zinc-800 rounded cursor-ns-resize" onMouseDown={handleMouseDown}>
      {/* Track */}
      <div className="absolute inset-x-1 top-2 bottom-2 bg-zinc-900 rounded">
        {/* Tick marks */}
        {[0, 25, 50, 75, 100].map(tick => (
          <div 
            key={tick} 
            className="absolute left-0 right-0 h-px bg-zinc-600" 
            style={{ bottom: `${tick}%` }}
          />
        ))}
      </div>
      {/* Handle */}
      <div 
        className="absolute left-0 right-0 h-4 bg-gradient-to-b from-zinc-400 to-zinc-600 rounded shadow-lg border border-zinc-300/50 cursor-grab active:cursor-grabbing"
        style={{ bottom: `calc(${value}% - 8px)` }}
      >
        <div className="absolute inset-x-1 top-1/2 -translate-y-1/2 h-0.5 bg-zinc-800" />
        <div className="absolute inset-x-1 top-1/2 -translate-y-1/2 mt-1 h-0.5 bg-zinc-800" />
      </div>
      {/* dB readout */}
      <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-zinc-400 font-mono">
        {dB}dB
      </div>
    </div>
  );
}

// ============================================================================
// CHANNEL STRIP COMPONENT
// ============================================================================

function ChannelStrip({ 
  source, 
  onUpdate 
}: { 
  source: AudioSource;
  onUpdate: (id: string, updates: Partial<AudioSource>) => void;
}) {
  return (
    <div className={`flex flex-col items-center gap-2 p-2 rounded-lg bg-zinc-900/80 border ${source.solo ? 'border-yellow-500' : source.muted ? 'border-red-500/50' : 'border-zinc-700/50'} min-w-[100px]`}>
      {/* Source Name + Icon */}
      <div className="flex items-center gap-1.5 w-full">
        <span className="text-sm">{source.icon}</span>
        <span className="text-[10px] text-white font-medium truncate flex-1">{source.name}</span>
      </div>

      {/* Signal Indicator */}
      <div className={`w-full py-0.5 text-center text-[8px] font-bold rounded ${
        source.hasSignal 
          ? 'bg-green-600/20 text-green-400 border border-green-500/50' 
          : 'bg-zinc-800 text-zinc-600 border border-zinc-700/50'
      }`}>
        {source.hasSignal ? '● SIGNAL' : '○ NO SIGNAL'}
      </div>

      {/* Input Meter */}
      <div className="w-full h-24 flex justify-center">
        <div className="w-3">
          <VUMeter 
            level={source.meterLevel} 
            peak={source.meterPeak} 
            hasSignal={source.hasSignal}
            inactive={source.muted || !source.stream}
          />
        </div>
      </div>

      {/* EQ Knobs */}
      <div className="grid grid-cols-2 gap-1">
        <RotaryKnob value={source.gain} min={-20} max={12} onChange={(v) => onUpdate(source.id, { gain: v })} label="Gain" size="sm" />
        <RotaryKnob value={source.eqHigh} min={-15} max={15} onChange={(v) => onUpdate(source.id, { eqHigh: v })} label="High" size="sm" />
        <RotaryKnob value={source.eqMid} min={-15} max={15} onChange={(v) => onUpdate(source.id, { eqMid: v })} label="Mid" size="sm" />
        <RotaryKnob value={source.eqLow} min={-15} max={15} onChange={(v) => onUpdate(source.id, { eqLow: v })} label="Low" size="sm" />
      </div>

      {/* Compressor */}
      <div className="w-full p-1.5 bg-zinc-800/50 rounded">
        <div className="text-[8px] text-zinc-500 uppercase text-center mb-1">Comp</div>
        <div className="flex justify-center gap-2">
          <RotaryKnob value={source.compThreshold} min={-60} max={0} onChange={(v) => onUpdate(source.id, { compThreshold: v })} label="Thr" size="sm" />
          <RotaryKnob value={source.compRatio} min={1} max={20} onChange={(v) => onUpdate(source.id, { compRatio: v })} label="Rat" unit=":1" size="sm" />
        </div>
      </div>

      {/* Noise Gate */}
      <div className="w-full p-1.5 bg-zinc-800/50 rounded">
        <div className="text-[8px] text-zinc-500 uppercase text-center mb-1">Gate</div>
        <div className="flex justify-center">
          <RotaryKnob value={source.gateThreshold} min={-60} max={0} onChange={(v) => onUpdate(source.id, { gateThreshold: v })} label="Thr" size="sm" />
        </div>
      </div>

      {/* Fader */}
      <div className="py-2">
        <Fader value={source.fader} onChange={(v) => onUpdate(source.id, { fader: v })} />
      </div>

      {/* Mute / Solo / Link */}
      <div className="flex gap-1">
        <button 
          onClick={() => onUpdate(source.id, { muted: !source.muted })}
          className={`px-2 py-1 text-[10px] font-bold rounded ${source.muted ? 'bg-red-600 text-white' : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'}`}
        >
          M
        </button>
        <button 
          onClick={() => onUpdate(source.id, { solo: !source.solo })}
          className={`px-2 py-1 text-[10px] font-bold rounded ${source.solo ? 'bg-yellow-500 text-black' : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'}`}
        >
          S
        </button>
        <button 
          onClick={() => onUpdate(source.id, { linked: !source.linked })}
          className={`px-2 py-1 text-[10px] font-bold rounded ${source.linked ? 'bg-blue-500 text-white' : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'}`}
        >
          🔗
        </button>
      </div>

      {/* Routing Toggles */}
      <div className="w-full grid grid-cols-3 gap-0.5 text-[8px]">
        <button 
          onClick={() => onUpdate(source.id, { routeStream: !source.routeStream })}
          className={`py-1 rounded ${source.routeStream ? 'bg-green-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}
        >
          STR
        </button>
        <button 
          onClick={() => onUpdate(source.id, { routeMonitor: !source.routeMonitor })}
          className={`py-1 rounded ${source.routeMonitor ? 'bg-cyan-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}
        >
          MON
        </button>
        <button 
          onClick={() => onUpdate(source.id, { routeRecord: !source.routeRecord })}
          className={`py-1 rounded ${source.routeRecord ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}
        >
          REC
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// MASTER SECTION COMPONENT
// ============================================================================

function MasterSection({ master, onUpdate }: { master: MasterState; onUpdate: (updates: Partial<MasterState>) => void }) {
  return (
    <div className="flex flex-col items-center gap-3 p-3 bg-zinc-900 rounded-lg border border-zinc-700">
      <div className="text-xs font-bold text-white uppercase tracking-wider">Master</div>
      
      {/* Signal Indicator */}
      <div className={`w-full py-0.5 text-center text-[8px] font-bold rounded ${
        master.hasSignal 
          ? 'bg-green-600/20 text-green-400 border border-green-500/50' 
          : 'bg-zinc-800 text-zinc-600 border border-zinc-700/50'
      }`}>
        {master.hasSignal ? '● OUTPUT' : '○ SILENT'}
      </div>
      
      {/* Stereo VU Meters */}
      <div className="flex gap-1 h-40">
        <div className="flex flex-col items-center">
          <span className="text-[8px] text-zinc-500 mb-1">L</span>
          <div className="w-4">
            <VUMeter 
              level={master.meterL} 
              peak={master.peakL}
              hasSignal={master.hasSignal}
              inactive={master.muted}
            />
          </div>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[8px] text-zinc-500 mb-1">R</span>
          <div className="w-4">
            <VUMeter 
              level={master.meterR} 
              peak={master.peakR}
              hasSignal={master.hasSignal}
              inactive={master.muted}
            />
          </div>
        </div>
      </div>

      {/* Limiter Indicator */}
      <div className={`w-full py-1 text-center text-[10px] font-bold rounded ${master.limiterActive ? 'bg-red-600 text-white animate-pulse' : 'bg-zinc-800 text-zinc-500'}`}>
        LIMIT
      </div>

      {/* Master Fader */}
      <Fader value={master.level} onChange={(v) => onUpdate({ level: v })} />

      {/* Controls */}
      <div className="flex gap-2">
        <button 
          onClick={() => onUpdate({ muted: !master.muted })}
          className={`px-3 py-2 text-xs font-bold rounded ${master.muted ? 'bg-red-600 text-white animate-pulse' : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'}`}
        >
          🔇 PANIC
        </button>
      </div>

      {/* Monitor Toggle */}
      <button 
        onClick={() => onUpdate({ monitorEnabled: !master.monitorEnabled })}
        className={`w-full py-2 text-xs font-bold rounded flex items-center justify-center gap-1 ${master.monitorEnabled ? 'bg-cyan-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}
      >
        🎧 Monitor
      </button>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT - WIRED TO REAL WEBAUDIOENGINE
// ============================================================================

export default function ProAudioMixerFull({ className = '' }: { className?: string }) {
  // Use the REAL WebAudioEngine, not local mock state
  const audioEngine = useAudioEngine();
  
  const [sources, setSources] = useState<AudioSource[]>([]);
  const [master, setMaster] = useState<MasterState>({
    level: 75,
    meterL: 0,
    meterR: 0,
    peakL: 0,
    peakR: 0,
    limiterActive: false,
    muted: false,
    monitorEnabled: false,
    hasSignal: false,
  });
  
  const meterPeaksRef = useRef<Map<string, number>>(new Map());
  const masterMeterPeaksRef = useRef<{ L: number; R: number }>({ L: 0, R: 0 });

  // INITIALIZATION: Wire audio engine to UI
  useEffect(() => {
    // Initialize audio engine with microphone stream
    const initAudio = async () => {
      try {
        const stream = await audioEngine.initAudio();
        console.log('✅ Audio engine initialized with stream:', stream);
        
        // Add microphone as first channel
        await audioEngine.addChannel(
          { id: 'mic1', name: 'Microphone', type: 'microphone' },
          stream
        );
      } catch (error) {
        console.error('❌ Failed to initialize audio:', error);
      }
    };
    
    if (!audioEngine.isInitialized) {
      initAudio();
    }
  }, [audioEngine]);

  // SYNC: Keep UI sources synchronized with engine channels
  useEffect(() => {
    const newSources: AudioSource[] = Array.from(audioEngine.channels.entries()).map(([id, state]) => {
      return {
        id,
        name: state.name,
        icon: state.type === 'microphone' ? '🎙️' : state.type === 'desktop' ? '🖥️' : '🎵',
        type: state.type === 'microphone' ? 'mic' : state.type === 'desktop' ? 'screen' : 'media',
        gain: state.volume, // Map engine volume to UI
        eqLow: state.eq[0]?.gain || 0,
        eqMid: state.eq[1]?.gain || 0,
        eqHigh: state.eq[2]?.gain || 0,
        compThreshold: state.compressor.threshold,
        compRatio: state.compressor.ratio,
        gateThreshold: state.noiseGate.threshold,
        fader: state.volume, // UI fader reflects engine volume
        muted: state.muted,
        solo: state.solo,
        linked: false,
        routeStream: true,
        routeMonitor: false,
        routeRecord: true,
        meterLevel: state.rmsLevel || 0,
        meterPeak: meterPeaksRef.current.get(id) || 0,
        hasSignal: state.rmsLevel > 5, // Signal detected if RMS > -55dB
        channelState: state,
      };
    });
    
    setSources(newSources);
  }, [audioEngine.channels, audioEngine.meters]);

  // METERING: Update meters from real audio engine in real-time
  useEffect(() => {
    const meterInterval = setInterval(() => {
      // Update individual channel meters
      audioEngine.channels.forEach((state, id) => {
        const currentPeak = meterPeaksRef.current.get(id) || 0;
        const newPeak = Math.max(state.rmsLevel || 0, currentPeak - 3); // Decay at 3% per frame
        meterPeaksRef.current.set(id, newPeak);
      });
      
      // Update master meters (from engine master output)
      setMaster(prev => {
        const masterMeters = Array.from(audioEngine.meters.values())[0];
        if (!masterMeters) return prev;
        
        const currentPeakL = masterMeterPeaksRef.current.L;
        const currentPeakR = masterMeterPeaksRef.current.R;
        const newPeakL = Math.max(masterMeters.rms || 0, currentPeakL - 3);
        const newPeakR = Math.max(masterMeters.rms || 0, currentPeakR - 3);
        
        masterMeterPeaksRef.current = { L: newPeakL, R: newPeakR };
        
        return {
          ...prev,
          meterL: masterMeters.rms || 0,
          meterR: masterMeters.rms || 0,
          peakL: newPeakL,
          peakR: newPeakR,
          hasSignal: (masterMeters.rms || 0) > 5,
          limiterActive: (masterMeters.rms || 0) > 95,
        };
      });
    }, 33); // ~30fps
    
    return () => clearInterval(meterInterval);
  }, [audioEngine.meters, audioEngine.channels]);

  // BUTTON WIRING: Handle all control changes
  const handleSourceUpdate = useCallback((id: string, updates: Partial<AudioSource>) => {
    // Update engine state based on UI changes
    if (updates.muted !== undefined) {
      audioEngine.setMuted(id, updates.muted);
    }
    if (updates.fader !== undefined) {
      audioEngine.setVolume(id, updates.fader);
    }
    if (updates.solo !== undefined) {
      audioEngine.setSolo(id, updates.solo);
    }
    if (updates.eqLow !== undefined || updates.eqMid !== undefined || updates.eqHigh !== undefined) {
      const state = audioEngine.channels.get(id);
      if (state) {
        if (updates.eqLow !== undefined) {
          audioEngine.setEQBand(id, 0, { gain: updates.eqLow });
        }
        if (updates.eqMid !== undefined) {
          audioEngine.setEQBand(id, 1, { gain: updates.eqMid });
        }
        if (updates.eqHigh !== undefined) {
          audioEngine.setEQBand(id, 2, { gain: updates.eqHigh });
        }
      }
    }
    if (updates.compThreshold !== undefined || updates.compRatio !== undefined) {
      const state = audioEngine.channels.get(id);
      if (state) {
        const newSettings: any = {};
        if (updates.compThreshold !== undefined) newSettings.threshold = updates.compThreshold;
        if (updates.compRatio !== undefined) newSettings.ratio = updates.compRatio;
        audioEngine.setCompressor(id, newSettings);
      }
    }
    if (updates.gateThreshold !== undefined) {
      audioEngine.setNoiseGate(id, { threshold: updates.gateThreshold });
    }
  }, [audioEngine]);

  const handleMasterUpdate = useCallback((updates: Partial<MasterState>) => {
    if (updates.muted !== undefined) {
      if (updates.muted) {
        audioEngine.muteAll();
      } else {
        audioEngine.unmuteAll();
      }
      setMaster(prev => ({ ...prev, muted: updates.muted || false }));
    }
    if (updates.level !== undefined) {
      audioEngine.setMasterVolume(updates.level);
      setMaster(prev => ({ ...prev, level: updates.level || 75 }));
    }
    if (updates.monitorEnabled !== undefined) {
      if (updates.monitorEnabled) {
        // Enable monitor on first channel
        const firstChannelId = audioEngine.channels.keys().next().value;
        if (firstChannelId) {
          audioEngine.enableMonitor(firstChannelId);
        }
      } else {
        audioEngine.disableMonitor();
      }
      setMaster(prev => ({ ...prev, monitorEnabled: updates.monitorEnabled || false }));
    }
  }, [audioEngine]);

  return (
    <div className={`audio-mixer bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden ${className}`}>
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-white">🎛️ Audio Mixer</span>
          <span className="text-[10px] text-zinc-500">{sources.length} {sources.length === 1 ? 'Source' : 'Sources'}</span>
          {/* Global Signal Status */}
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${
            sources.some(s => s.hasSignal) 
              ? 'bg-green-600/20 text-green-400' 
              : 'bg-zinc-800 text-zinc-600'
          }`}>
            {sources.some(s => s.hasSignal) ? '● SIGNAL' : '○ NO INPUT'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-2 py-1 text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded">
            ⚙️ Settings
          </button>
        </div>
      </div>

      {/* Main Mixer Area */}
      <div className="flex">
        {/* Master Section */}
        <div className="p-3 border-r border-zinc-800">
          <MasterSection master={master} onUpdate={handleMasterUpdate} />
        </div>

        {/* Channel Strips */}
        <div className="flex-1 overflow-x-auto p-3">
          <div className="flex gap-2">
            {sources.map(source => (
              <ChannelStrip key={source.id} source={source} onUpdate={handleSourceUpdate} />
            ))}
            {sources.length === 0 && (
              <div className="flex items-center justify-center w-full text-zinc-600">
                <span className="text-[12px]">Initializing audio...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
