'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChannelState, EQBand, CompressorSettings, NoiseGateSettings, getAudioEngine } from '@/lib/audio/WebAudioEngine';

// ============================================================================
// TYPES
// ============================================================================

export type OutputBus = 'stream' | 'monitor' | 'recording';

export interface ChannelRouting {
  stream: boolean;
  monitor: boolean;
  recording: boolean;
}

// ============================================================================
// VERTICAL FADER COMPONENT (dB Scale)
// ============================================================================

interface VerticalFaderProps {
  value: number;         // 0-100
  onChange: (value: number) => void;
  muted: boolean;
  className?: string;
}

const DB_MARKS = [
  { db: 6, label: '+6' },
  { db: 0, label: '0' },
  { db: -6, label: '-6' },
  { db: -12, label: '-12' },
  { db: -24, label: '-24' },
  { db: -48, label: '-48' },
  { db: -60, label: '-∞' },
];

function volumeToDb(volume: number): number {
  if (volume === 0) return -60;
  // Convert 0-100 linear to dB (logarithmic)
  // 0% = -60dB, 100% = +6dB
  return 20 * Math.log10(volume / 100) + 6;
}

function dbToVolume(db: number): number {
  if (db <= -60) return 0;
  // Convert dB to 0-100 linear
  return Math.pow(10, (db - 6) / 20) * 100;
}

function dbToPosition(db: number, height: number): number {
  // Map +6dB to top (0), -60dB to bottom (height)
  const normalized = (6 - db) / 66; // 66 = total dB range (6 - (-60))
  return normalized * height;
}

function VerticalFader({ value, onChange, muted, className = '' }: VerticalFaderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const currentDb = volumeToDb(value);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    updateValue(e.clientY);
  }, []);

  const updateValue = useCallback((clientY: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const position = clientY - rect.top;
    const normalized = Math.max(0, Math.min(1, position / rect.height));
    const db = 6 - normalized * 66;
    const newVolume = dbToVolume(db);
    onChange(Math.round(newVolume));
  }, [onChange]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      updateValue(e.clientY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, updateValue]);

  return (
    <div className={`relative flex gap-1 ${className}`}>
      {/* dB scale labels */}
      <div className="w-6 relative h-full text-right">
        {DB_MARKS.map(({ db, label }) => (
          <span
            key={db}
            className="absolute text-[8px] text-surface-500 transform -translate-y-1/2"
            style={{ top: `${((6 - db) / 66) * 100}%` }}
          >
            {label}
          </span>
        ))}
      </div>

      {/* Fader track */}
      <div
        ref={trackRef}
        className="relative w-3 h-full bg-surface-800 rounded cursor-pointer"
        onMouseDown={handleMouseDown}
      >
        {/* dB tick marks */}
        {DB_MARKS.map(({ db }) => (
          <div
            key={db}
            className="absolute w-full h-px bg-surface-600"
            style={{ top: `${((6 - db) / 66) * 100}%` }}
          />
        ))}

        {/* Fill */}
        <div
          className={`absolute bottom-0 left-0 right-0 rounded-b transition-colors ${
            muted ? 'bg-surface-600' : 'bg-gradient-to-t from-green-500 via-yellow-500 to-red-500'
          }`}
          style={{ height: `${100 - ((6 - currentDb) / 66) * 100}%` }}
        />

        {/* Fader knob */}
        <div
          className={`absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5 h-3 rounded-sm shadow-lg transition-colors cursor-grab ${
            isDragging ? 'cursor-grabbing' : ''
          } ${muted ? 'bg-surface-500' : 'bg-white'}`}
          style={{ top: `${((6 - currentDb) / 66) * 100}%` }}
        >
          <div className="absolute inset-x-1 top-1/2 transform -translate-y-1/2 h-px bg-surface-400" />
        </div>
      </div>

      {/* Current value */}
      <div className="w-8 flex items-end">
        <span className={`text-[9px] font-mono ${muted ? 'text-surface-600' : 'text-surface-400'}`}>
          {currentDb <= -60 ? '-∞' : currentDb.toFixed(1)}
          <span className="text-surface-600">dB</span>
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// VU METER (STEREO)
// ============================================================================

interface StereoVUMeterProps {
  left: number;    // 0-100
  right: number;   // 0-100 (or same as left for mono)
  gainReduction: number;
  muted: boolean;
  vertical?: boolean;
}

function StereoVUMeter({ left, right, gainReduction, muted, vertical = true }: StereoVUMeterProps) {
  const segments = 24;

  const getSegmentColor = (index: number, value: number) => {
    const threshold = (index + 1) / segments * 100;
    if (muted || value < threshold) return 'bg-surface-800';
    if (index >= segments - 3) return 'bg-red-500';
    if (index >= segments - 7) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const renderMeter = (value: number, label: string) => (
    <div className={`flex ${vertical ? 'flex-col-reverse gap-0.5' : 'flex-row gap-0.5'}`}>
      {Array.from({ length: segments }).map((_, i) => (
        <div
          key={i}
          className={`${vertical ? 'w-2 h-1' : 'h-2 w-1'} rounded-sm transition-colors duration-75 ${
            getSegmentColor(i, value)
          }`}
        />
      ))}
    </div>
  );

  return (
    <div className={`flex ${vertical ? 'flex-row' : 'flex-col'} gap-0.5`}>
      {renderMeter(left, 'L')}
      {renderMeter(right, 'R')}
      
      {/* Gain reduction indicator */}
      {gainReduction < -0.5 && (
        <div className={`flex items-center gap-0.5 text-amber-400 ${vertical ? 'ml-1' : 'mt-1'}`}>
          <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
          </svg>
          <span className="text-[8px]">{Math.abs(gainReduction).toFixed(0)}</span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// OUTPUT ROUTING SELECTOR
// ============================================================================

interface OutputRoutingProps {
  routing: ChannelRouting;
  onChange: (routing: ChannelRouting) => void;
}

function OutputRouting({ routing, onChange }: OutputRoutingProps) {
  const toggleBus = (bus: OutputBus) => {
    onChange({ ...routing, [bus]: !routing[bus] });
  };

  const buses: { id: OutputBus; label: string; icon: JSX.Element; color: string }[] = [
    {
      id: 'stream',
      label: 'Stream',
      icon: (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
        </svg>
      ),
      color: 'live',
    },
    {
      id: 'monitor',
      label: 'Mon',
      icon: (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707A1 1 0 0112 5v14a1 1 0 01-1.707.707L5.586 15z" />
        </svg>
      ),
      color: 'emerald',
    },
    {
      id: 'recording',
      label: 'Rec',
      icon: (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="6" />
        </svg>
      ),
      color: 'red',
    },
  ];

  return (
    <div className="flex gap-0.5">
      {buses.map(({ id, label, icon, color }) => (
        <button
          key={id}
          onClick={() => toggleBus(id)}
          title={`Send to ${label}`}
          className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${
            routing[id]
              ? `bg-${color}-500/20 text-${color}-400`
              : 'text-surface-600 hover:text-surface-400 hover:bg-surface-700/50'
          }`}
        >
          {icon}
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// 3-BAND EQ (INLINE)
// ============================================================================

interface InlineEQProps {
  channelId: string;
  eq: EQBand[];
  onToggle: () => void;
  expanded: boolean;
}

function InlineEQ({ channelId, eq, onToggle, expanded }: InlineEQProps) {
  const engine = getAudioEngine();
  const hasChanges = eq.some(band => Math.abs(band.gain) > 0.5);

  if (!expanded) {
    return (
      <button
        onClick={onToggle}
        className={`px-2 py-1 text-[9px] font-medium rounded transition-colors ${
          hasChanges 
            ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30' 
            : 'bg-surface-700 text-surface-400 hover:text-white'
        }`}
      >
        EQ
      </button>
    );
  }

  return (
    <div className="p-2 bg-surface-800 rounded border border-surface-700 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-white">3-Band EQ</span>
        <div className="flex gap-1">
          <button
            onClick={() => engine.resetEQ(channelId)}
            className="text-[9px] text-surface-500 hover:text-white"
          >
            Reset
          </button>
          <button onClick={onToggle} className="text-surface-500 hover:text-white ml-2">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="flex gap-3">
        {['Low', 'Mid', 'High'].map((label, i) => (
          <div key={i} className="flex-1 text-center">
            <span className="text-[8px] text-surface-500 block mb-1">{label}</span>
            <input
              type="range"
              min="-12"
              max="12"
              step="0.5"
              value={eq[i].gain}
              onChange={(e) => engine.setEQBand(channelId, i, { gain: parseFloat(e.target.value) })}
              className="w-full h-1 bg-surface-700 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-500 [&::-webkit-slider-thumb]:cursor-pointer"
            />
            <span className={`text-[9px] font-mono ${
              eq[i].gain > 0 ? 'text-green-400' : eq[i].gain < 0 ? 'text-red-400' : 'text-surface-500'
            }`}>
              {eq[i].gain > 0 ? '+' : ''}{eq[i].gain.toFixed(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// COMPRESSOR (INLINE)
// ============================================================================

interface InlineCompressorProps {
  channelId: string;
  settings: CompressorSettings;
  gainReduction: number;
  onToggle: () => void;
  expanded: boolean;
}

function InlineCompressor({ channelId, settings, gainReduction, onToggle, expanded }: InlineCompressorProps) {
  const engine = getAudioEngine();
  const isActive = gainReduction < -0.5;

  if (!expanded) {
    return (
      <button
        onClick={onToggle}
        className={`px-2 py-1 text-[9px] font-medium rounded transition-colors ${
          isActive 
            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
            : 'bg-surface-700 text-surface-400 hover:text-white'
        }`}
      >
        COMP{isActive && ` ${Math.abs(gainReduction).toFixed(0)}`}
      </button>
    );
  }

  return (
    <div className="p-2 bg-surface-800 rounded border border-surface-700 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-white">Compressor</span>
        <div className="flex gap-1">
          <button
            onClick={() => engine.resetCompressor(channelId)}
            className="text-[9px] text-surface-500 hover:text-white"
          >
            Reset
          </button>
          <button onClick={onToggle} className="text-surface-500 hover:text-white ml-2">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          { key: 'threshold', label: 'Thresh', min: -60, max: 0, step: 1, unit: 'dB' },
          { key: 'ratio', label: 'Ratio', min: 1, max: 20, step: 0.5, unit: ':1' },
          { key: 'attack', label: 'Attack', min: 0, max: 0.5, step: 0.001, unit: 's' },
          { key: 'release', label: 'Release', min: 0.01, max: 1, step: 0.01, unit: 's' },
        ].map(({ key, label, min, max, step, unit }) => (
          <div key={key}>
            <span className="text-[8px] text-surface-500 block">{label}</span>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={settings[key as keyof CompressorSettings]}
              onChange={(e) => engine.setCompressor(channelId, { [key]: parseFloat(e.target.value) })}
              className="w-full h-1 bg-surface-700 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-500"
            />
            <span className="text-[8px] text-surface-500 font-mono">
              {(settings[key as keyof CompressorSettings] as number).toFixed(key === 'attack' ? 3 : 1)}{unit}
            </span>
          </div>
        ))}
      </div>

      <div>
        <span className="text-[8px] text-surface-500 block">Makeup Gain</span>
        <input
          type="range"
          min={0}
          max={24}
          step={0.5}
          value={settings.makeupGain}
          onChange={(e) => engine.setCompressor(channelId, { makeupGain: parseFloat(e.target.value) })}
          className="w-full h-1 bg-surface-700 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-500"
        />
        <span className="text-[8px] text-surface-500 font-mono">+{settings.makeupGain.toFixed(1)}dB</span>
      </div>
    </div>
  );
}

// ============================================================================
// NOISE GATE (INLINE)
// ============================================================================

interface InlineGateProps {
  channelId: string;
  settings: NoiseGateSettings;
  onToggle: () => void;
  expanded: boolean;
}

function InlineGate({ channelId, settings, onToggle, expanded }: InlineGateProps) {
  const engine = getAudioEngine();

  if (!expanded) {
    return (
      <button
        onClick={onToggle}
        className={`px-2 py-1 text-[9px] font-medium rounded transition-colors ${
          settings.enabled 
            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
            : 'bg-surface-700 text-surface-400 hover:text-white'
        }`}
      >
        GATE
      </button>
    );
  }

  return (
    <div className="p-2 bg-surface-800 rounded border border-surface-700 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-white">Noise Gate</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => engine.setNoiseGate(channelId, { enabled: !settings.enabled })}
            className={`px-2 py-0.5 text-[9px] rounded ${
              settings.enabled 
                ? 'bg-purple-500/30 text-purple-300' 
                : 'bg-surface-700 text-surface-500'
            }`}
          >
            {settings.enabled ? 'ON' : 'OFF'}
          </button>
          <button onClick={onToggle} className="text-surface-500 hover:text-white">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {[
          { key: 'threshold', label: 'Threshold', min: -80, max: 0, step: 1, value: settings.threshold, format: (v: number) => `${v}dB` },
          { key: 'attack', label: 'Attack', min: 0.001, max: 0.05, step: 0.001, value: settings.attack, format: (v: number) => `${(v * 1000).toFixed(0)}ms` },
          { key: 'release', label: 'Release', min: 0.01, max: 0.5, step: 0.01, value: settings.release, format: (v: number) => `${(v * 1000).toFixed(0)}ms` },
        ].map(({ key, label, min, max, step, value, format }) => (
          <div key={key} className="flex items-center gap-2">
            <span className="text-[9px] text-surface-500 w-14">{label}</span>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={value}
              onChange={(e) => engine.setNoiseGate(channelId, { [key]: parseFloat(e.target.value) })}
              className="flex-1 h-1 bg-surface-700 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500"
            />
            <span className="text-[9px] text-surface-500 w-10 text-right font-mono">{format(value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// PRO CHANNEL STRIP
// ============================================================================

interface ProChannelStripProps {
  channel: ChannelState;
  routing?: ChannelRouting;
  onRoutingChange?: (routing: ChannelRouting) => void;
}

const channelTypeIcons: Record<ChannelState['type'], JSX.Element> = {
  microphone: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  ),
  desktop: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  media: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  music: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
    </svg>
  ),
  soundboard: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  ),
};

export function ProChannelStrip({ channel, routing, onRoutingChange }: ProChannelStripProps) {
  const engine = getAudioEngine();
  const [expandedPanel, setExpandedPanel] = useState<'none' | 'eq' | 'comp' | 'gate'>('none');
  const [localRouting, setLocalRouting] = useState<ChannelRouting>({
    stream: true,
    monitor: true,
    recording: true,
  });

  const handleRoutingChange = (newRouting: ChannelRouting) => {
    setLocalRouting(newRouting);
    onRoutingChange?.(newRouting);
  };

  const currentRouting = routing || localRouting;

  return (
    <div className="flex gap-2 p-3 rounded-lg bg-surface-800/60 border border-surface-700/50">
      {/* Left: Meters */}
      <div className="flex flex-col items-center gap-2">
        <StereoVUMeter
          left={channel.peakLevel}
          right={channel.rmsLevel}
          gainReduction={channel.gainReduction}
          muted={channel.muted}
        />
      </div>

      {/* Center: Controls */}
      <div className="flex-1 flex flex-col gap-2 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2">
          <span className={`${channel.muted ? 'text-surface-500' : 'text-surface-300'}`}>
            {channelTypeIcons[channel.type]}
          </span>
          <span className={`text-sm font-medium truncate flex-1 ${channel.muted ? 'text-surface-500' : 'text-white'}`}>
            {channel.name}
          </span>
          
          {/* Solo/Mute */}
          <button
            onClick={() => engine.setSolo(channel.id, !channel.solo)}
            className={`w-6 h-6 flex items-center justify-center rounded text-[10px] font-bold ${
              channel.solo
                ? 'bg-amber-500/30 text-amber-300'
                : 'text-surface-500 hover:bg-surface-700 hover:text-white'
            }`}
          >
            S
          </button>
          <button
            onClick={() => engine.setMuted(channel.id, !channel.muted)}
            className={`w-6 h-6 flex items-center justify-center rounded text-[10px] font-bold ${
              channel.muted
                ? 'bg-red-500/30 text-red-300'
                : 'text-surface-500 hover:bg-surface-700 hover:text-white'
            }`}
          >
            M
          </button>
        </div>

        {/* Volume and Pan */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <input
              type="range"
              min="0"
              max="100"
              value={channel.volume}
              onChange={(e) => engine.setVolume(channel.id, parseInt(e.target.value))}
              className="w-full h-2 bg-surface-700 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:shadow"
            />
          </div>
          <span className="text-[10px] text-surface-500 w-8 text-right font-mono">
            {volumeToDb(channel.volume).toFixed(1)}
          </span>
        </div>

        {/* Pan */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-surface-600">L</span>
          <input
            type="range"
            min="-100"
            max="100"
            value={channel.pan}
            onChange={(e) => engine.setPan(channel.id, parseInt(e.target.value))}
            className="flex-1 h-1 bg-surface-700 rounded-full appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-surface-400"
          />
          <span className="text-[9px] text-surface-600">R</span>
        </div>

        {/* Processing buttons */}
        <div className="flex gap-1">
          <InlineEQ
            channelId={channel.id}
            eq={channel.eq}
            onToggle={() => setExpandedPanel(expandedPanel === 'eq' ? 'none' : 'eq')}
            expanded={expandedPanel === 'eq'}
          />
          {expandedPanel !== 'eq' && (
            <>
              <InlineCompressor
                channelId={channel.id}
                settings={channel.compressor}
                gainReduction={channel.gainReduction}
                onToggle={() => setExpandedPanel(expandedPanel === 'comp' ? 'none' : 'comp')}
                expanded={expandedPanel === 'comp'}
              />
              <InlineGate
                channelId={channel.id}
                settings={channel.noiseGate}
                onToggle={() => setExpandedPanel(expandedPanel === 'gate' ? 'none' : 'gate')}
                expanded={expandedPanel === 'gate'}
              />
            </>
          )}
        </div>

        {/* Expanded panel */}
        {expandedPanel === 'comp' && (
          <InlineCompressor
            channelId={channel.id}
            settings={channel.compressor}
            gainReduction={channel.gainReduction}
            onToggle={() => setExpandedPanel('none')}
            expanded={true}
          />
        )}
        {expandedPanel === 'gate' && (
          <InlineGate
            channelId={channel.id}
            settings={channel.noiseGate}
            onToggle={() => setExpandedPanel('none')}
            expanded={true}
          />
        )}

        {/* Output routing */}
        <div className="flex items-center justify-between pt-2 border-t border-surface-700/50">
          <span className="text-[9px] text-surface-500 uppercase tracking-wider">Output</span>
          <OutputRouting routing={currentRouting} onChange={handleRoutingChange} />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MASTER BUS COMPONENT
// ============================================================================

interface MasterBusProps {
  volume: number;
  onVolumeChange: (volume: number) => void;
  muted: boolean;
  onMuteToggle: () => void;
  peakLevel?: number;
  rmsLevel?: number;
}

export function MasterBus({ volume, onVolumeChange, muted, onMuteToggle, peakLevel = 0, rmsLevel = 0 }: MasterBusProps) {
  return (
    <div className="p-4 rounded-lg bg-gradient-to-b from-surface-800/80 to-surface-900/80 border border-surface-700/50">
      <div className="flex items-center gap-4">
        {/* Master Label */}
        <div className="flex flex-col items-center">
          <svg className="w-5 h-5 text-brand-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707A1 1 0 0112 5v14a1 1 0 01-1.707.707L5.586 15z" />
          </svg>
          <span className="text-[10px] font-bold text-brand-400 uppercase tracking-wider">Master</span>
        </div>

        {/* Meters */}
        <StereoVUMeter
          left={peakLevel}
          right={rmsLevel}
          gainReduction={0}
          muted={muted}
          vertical={false}
        />

        {/* Fader */}
        <div className="flex-1">
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => onVolumeChange(parseInt(e.target.value))}
            className="w-full h-3 bg-surface-700 rounded-full appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-500 [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white"
          />
        </div>

        {/* Value */}
        <span className="text-sm font-mono text-white w-12 text-right">
          {volumeToDb(volume).toFixed(1)}
          <span className="text-[10px] text-surface-500">dB</span>
        </span>

        {/* Mute */}
        <button
          onClick={onMuteToggle}
          className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-bold transition-colors ${
            muted
              ? 'bg-red-500 text-white'
              : 'bg-surface-700 text-surface-400 hover:bg-surface-600 hover:text-white'
          }`}
        >
          {muted ? 'ON' : 'M'}
        </button>
      </div>
    </div>
  );
}
