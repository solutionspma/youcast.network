'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChannelState, EQBand, CompressorSettings, NoiseGateSettings, getAudioEngine } from '@/lib/audio/WebAudioEngine';
import { getAllAudioSources, getAudioSource, AudioSource } from '@/lib/audio/audioInitialization';

interface ProAudioMixerProps {
  className?: string;
}

type ExpandedPanel = 'none' | 'eq' | 'compressor' | 'gate';

// ============================================================================
// VU METER COMPONENT
// ============================================================================

function VUMeter({ peak, rms, gainReduction, muted }: { peak: number; rms: number; gainReduction: number; muted: boolean }) {
  const getSegmentColor = (threshold: number, value: number) => {
    if (muted || value < threshold) return 'bg-surface-700';
    if (threshold > 85) return 'bg-red-500';
    if (threshold > 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-1">
      {/* Peak + RMS meters side by side */}
      <div className="flex gap-0.5">
        {/* RMS (darker) */}
        <div className="flex gap-0.5 flex-1">
          {Array.from({ length: 20 }).map((_, i) => {
            const threshold = (i + 1) * 5;
            return (
              <div
                key={`rms-${i}`}
                className={`h-2 flex-1 rounded-sm transition-colors duration-75 ${
                  rms >= threshold ? getSegmentColor(threshold, rms) : 'bg-surface-800'
                } opacity-60`}
              />
            );
          })}
        </div>
      </div>
      {/* Peak meter */}
      <div className="flex gap-0.5">
        {Array.from({ length: 20 }).map((_, i) => {
          const threshold = (i + 1) * 5;
          return (
            <div
              key={`peak-${i}`}
              className={`h-1.5 flex-1 rounded-sm transition-colors duration-75 ${
                peak >= threshold ? getSegmentColor(threshold, peak) : 'bg-surface-800'
              }`}
            />
          );
        })}
      </div>
      {/* Gain reduction indicator */}
      {gainReduction < -0.5 && (
        <div className="flex items-center gap-1 text-[9px] text-amber-400">
          <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
          </svg>
          <span>{Math.abs(gainReduction).toFixed(1)}dB</span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EQ CONTROL COMPONENT
// ============================================================================

function EQControl({ channelId, eq, onClose }: { channelId: string; eq: EQBand[]; onClose: () => void }) {
  const engine = getAudioEngine();
  const bandLabels = ['Low', 'Mid', 'High'];

  return (
    <div className="p-3 bg-surface-800 rounded-lg border border-surface-700 mt-2">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-white">3-Band EQ</span>
        <div className="flex gap-2">
          <button
            onClick={() => engine.resetEQ(channelId)}
            className="text-[10px] text-surface-400 hover:text-white"
          >
            Reset
          </button>
          <button onClick={onClose} className="text-surface-400 hover:text-white">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="flex gap-4">
        {eq.map((band, i) => (
          <div key={i} className="flex-1 text-center">
            <div className="text-[10px] text-surface-400 mb-1">{bandLabels[i]}</div>
            <div className="text-[10px] text-surface-500 mb-2">{band.frequency}Hz</div>
            
            {/* Vertical slider simulation */}
            <div className="relative h-20 flex justify-center mb-1">
              <input
                type="range"
                min="-12"
                max="12"
                step="0.5"
                value={band.gain}
                onChange={(e) => engine.setEQBand(channelId, i, { gain: parseFloat(e.target.value) })}
                className="w-20 h-1 transform -rotate-90 origin-center absolute top-1/2 -translate-y-1/2
                  bg-surface-700 rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-500 [&::-webkit-slider-thumb]:cursor-pointer"
                style={{ width: '80px' }}
              />
            </div>
            
            <div className={`text-[10px] font-mono ${band.gain > 0 ? 'text-green-400' : band.gain < 0 ? 'text-red-400' : 'text-surface-400'}`}>
              {band.gain > 0 ? '+' : ''}{band.gain.toFixed(1)}dB
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// COMPRESSOR CONTROL COMPONENT
// ============================================================================

function CompressorControl({ channelId, settings, onClose }: { channelId: string; settings: CompressorSettings; onClose: () => void }) {
  const engine = getAudioEngine();

  const controls = [
    { label: 'Threshold', key: 'threshold', min: -60, max: 0, step: 1, unit: 'dB' },
    { label: 'Ratio', key: 'ratio', min: 1, max: 20, step: 0.5, unit: ':1' },
    { label: 'Attack', key: 'attack', min: 0, max: 0.5, step: 0.001, unit: 's' },
    { label: 'Release', key: 'release', min: 0.01, max: 1, step: 0.01, unit: 's' },
    { label: 'Makeup', key: 'makeupGain', min: 0, max: 24, step: 0.5, unit: 'dB' },
  ];

  return (
    <div className="p-3 bg-surface-800 rounded-lg border border-surface-700 mt-2">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-white">Compressor</span>
        <div className="flex gap-2">
          <button
            onClick={() => engine.resetCompressor(channelId)}
            className="text-[10px] text-surface-400 hover:text-white"
          >
            Reset
          </button>
          <button onClick={onClose} className="text-surface-400 hover:text-white">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="space-y-2">
        {controls.map(({ label, key, min, max, step, unit }) => (
          <div key={key} className="flex items-center gap-2">
            <span className="text-[10px] text-surface-400 w-16">{label}</span>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={settings[key as keyof CompressorSettings]}
              onChange={(e) => engine.setCompressor(channelId, { [key]: parseFloat(e.target.value) })}
              className="flex-1 h-1 bg-surface-700 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:cursor-pointer"
            />
            <span className="text-[10px] text-surface-500 w-12 text-right font-mono">
              {typeof settings[key as keyof CompressorSettings] === 'number' 
                ? (settings[key as keyof CompressorSettings] as number).toFixed(key === 'ratio' ? 1 : 2)
                : settings[key as keyof CompressorSettings]}
              {unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// NOISE GATE CONTROL COMPONENT
// ============================================================================

function NoiseGateControl({ channelId, settings, onClose }: { channelId: string; settings: NoiseGateSettings; onClose: () => void }) {
  const engine = getAudioEngine();

  return (
    <div className="p-3 bg-surface-800 rounded-lg border border-surface-700 mt-2">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-white">Noise Gate</span>
          <button
            onClick={() => engine.setNoiseGate(channelId, { enabled: !settings.enabled })}
            className={`px-2 py-0.5 text-[10px] rounded ${
              settings.enabled 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-surface-700 text-surface-400'
            }`}
          >
            {settings.enabled ? 'ON' : 'OFF'}
          </button>
        </div>
        <button onClick={onClose} className="text-surface-400 hover:text-white">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-surface-400 w-16">Threshold</span>
          <input
            type="range"
            min={-80}
            max={0}
            step={1}
            value={settings.threshold}
            onChange={(e) => engine.setNoiseGate(channelId, { threshold: parseFloat(e.target.value) })}
            className="flex-1 h-1 bg-surface-700 rounded-full appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:cursor-pointer"
          />
          <span className="text-[10px] text-surface-500 w-12 text-right font-mono">{settings.threshold}dB</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-surface-400 w-16">Attack</span>
          <input
            type="range"
            min={0.001}
            max={0.05}
            step={0.001}
            value={settings.attack}
            onChange={(e) => engine.setNoiseGate(channelId, { attack: parseFloat(e.target.value) })}
            className="flex-1 h-1 bg-surface-700 rounded-full appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:cursor-pointer"
          />
          <span className="text-[10px] text-surface-500 w-12 text-right font-mono">{(settings.attack * 1000).toFixed(0)}ms</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-surface-400 w-16">Release</span>
          <input
            type="range"
            min={0.01}
            max={0.5}
            step={0.01}
            value={settings.release}
            onChange={(e) => engine.setNoiseGate(channelId, { release: parseFloat(e.target.value) })}
            className="flex-1 h-1 bg-surface-700 rounded-full appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:cursor-pointer"
          />
          <span className="text-[10px] text-surface-500 w-12 text-right font-mono">{(settings.release * 1000).toFixed(0)}ms</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// CHANNEL STRIP COMPONENT
// ============================================================================

function ChannelStrip({ channel }: { channel: ChannelState }) {
  const engine = getAudioEngine();
  const [expanded, setExpanded] = useState<ExpandedPanel>('none');

  const channelIcons: Record<ChannelState['type'], JSX.Element> = {
    microphone: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    ),
    desktop: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    media: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    music: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
    ),
    soundboard: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
  };

  return (
    <div className="p-3 rounded-lg bg-surface-800/50 border border-surface-700/50">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <span className={`${channel.muted ? 'text-surface-500' : 'text-surface-300'}`}>
          {channelIcons[channel.type]}
        </span>
        <span className={`text-xs flex-1 truncate ${channel.muted ? 'text-surface-500' : 'text-white'}`}>
          {channel.name}
        </span>
        
        {/* Solo button */}
        <button
          onClick={() => engine.setSolo(channel.id, !channel.solo)}
          className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold transition-colors ${
            channel.solo
              ? 'bg-amber-500/20 text-amber-400'
              : 'text-surface-500 hover:bg-surface-700 hover:text-white'
          }`}
          title="Solo"
        >
          S
        </button>
        
        {/* Mute button */}
        <button
          onClick={() => engine.setMuted(channel.id, !channel.muted)}
          className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold transition-colors ${
            channel.muted
              ? 'bg-red-500/20 text-red-400'
              : 'text-surface-500 hover:bg-surface-700 hover:text-white'
          }`}
          title="Mute"
        >
          M
        </button>
      </div>

      {/* VU Meter */}
      <VUMeter 
        peak={channel.peakLevel} 
        rms={channel.rmsLevel} 
        gainReduction={channel.gainReduction}
        muted={channel.muted} 
      />

      {/* Volume Slider */}
      <div className="flex items-center gap-2 mt-2">
        <input
          type="range"
          min="0"
          max="100"
          value={channel.volume}
          onChange={(e) => engine.setVolume(channel.id, parseInt(e.target.value))}
          className="flex-1 h-1 bg-surface-700 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer"
        />
        <span className="text-[10px] text-surface-500 w-7 text-right font-mono">{channel.volume}%</span>
      </div>

      {/* Pan Slider */}
      <div className="flex items-center gap-2 mt-2">
        <span className="text-[9px] text-surface-500">L</span>
        <input
          type="range"
          min="-100"
          max="100"
          value={channel.pan}
          onChange={(e) => engine.setPan(channel.id, parseInt(e.target.value))}
          className="flex-1 h-0.5 bg-surface-700 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-surface-400 [&::-webkit-slider-thumb]:cursor-pointer"
        />
        <span className="text-[9px] text-surface-500">R</span>
      </div>

      {/* Processing buttons */}
      <div className="flex gap-1 mt-3">
        <button
          onClick={() => setExpanded(expanded === 'eq' ? 'none' : 'eq')}
          className={`flex-1 py-1 text-[9px] font-medium rounded transition-colors ${
            expanded === 'eq' ? 'bg-brand-500/20 text-brand-400' : 'bg-surface-700 text-surface-400 hover:text-white'
          }`}
        >
          EQ
        </button>
        <button
          onClick={() => setExpanded(expanded === 'compressor' ? 'none' : 'compressor')}
          className={`flex-1 py-1 text-[9px] font-medium rounded transition-colors ${
            expanded === 'compressor' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-surface-700 text-surface-400 hover:text-white'
          }`}
        >
          COMP
        </button>
        <button
          onClick={() => setExpanded(expanded === 'gate' ? 'none' : 'gate')}
          className={`flex-1 py-1 text-[9px] font-medium rounded transition-colors ${
            expanded === 'gate' 
              ? 'bg-purple-500/20 text-purple-400' 
              : channel.noiseGate.enabled 
                ? 'bg-purple-500/10 text-purple-400' 
                : 'bg-surface-700 text-surface-400 hover:text-white'
          }`}
        >
          GATE
        </button>
      </div>

      {/* Expanded panels */}
      {expanded === 'eq' && (
        <EQControl channelId={channel.id} eq={channel.eq} onClose={() => setExpanded('none')} />
      )}
      {expanded === 'compressor' && (
        <CompressorControl channelId={channel.id} settings={channel.compressor} onClose={() => setExpanded('none')} />
      )}
      {expanded === 'gate' && (
        <NoiseGateControl channelId={channel.id} settings={channel.noiseGate} onClose={() => setExpanded('none')} />
      )}
    </div>
  );
}

// ============================================================================
// MAIN PRO AUDIO MIXER COMPONENT
// ============================================================================

export default function ProAudioMixer({ className = '' }: ProAudioMixerProps) {
  const [channels, setChannels] = useState<Map<string, ChannelState>>(new Map());
  const [masterVolume, setMasterVolumeState] = useState(80);
  const [availableSources, setAvailableSources] = useState<AudioSource[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string>('');
  const engine = getAudioEngine();

  useEffect(() => {
    const unsubscribe = engine.subscribeChannels((channelMap) => {
      setChannels(new Map(channelMap));
    });
    return unsubscribe;
  }, [engine]);

  // Track available audio sources
  useEffect(() => {
    const updateSources = () => {
      const sources = getAllAudioSources();
      setAvailableSources(sources);
      
      // Auto-select first source if none selected
      if (sources.length > 0 && !selectedSourceId) {
        setSelectedSourceId(sources[0].id);
      }
    };

    updateSources();
    
    // Poll for source changes (triggered by device selector)
    const interval = setInterval(updateSources, 500);
    return () => clearInterval(interval);
  }, [selectedSourceId]);

  const handleMasterVolumeChange = useCallback((volume: number) => {
    setMasterVolumeState(volume);
    engine.setMasterVolume(volume);
  }, [engine]);

  const channelArray = Array.from(channels.values());

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Pro Audio Mixer</h3>
        <span className="text-[10px] text-surface-500">{channelArray.length} channels</span>
      </div>

      {/* Audio Source Selector */}
      {availableSources.length > 0 && (
        <div className="p-2.5 bg-surface-800/50 rounded-lg border border-surface-700/50">
          <label className="block text-[10px] font-semibold text-white uppercase tracking-wider mb-1.5">
            Input Source
          </label>
          <select
            value={selectedSourceId}
            onChange={(e) => setSelectedSourceId(e.target.value)}
            className="w-full px-2 py-1.5 bg-surface-900 border border-surface-700 rounded text-xs text-white
              hover:border-surface-600 focus:outline-none focus:border-brand-500 transition-colors"
          >
            <option value="">Select source...</option>
            {availableSources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.label}
                {source.readyState !== 'live' && ' (offline)'}
              </option>
            ))}
          </select>
          <div className="mt-1.5 text-[9px] text-surface-500">
            {availableSources.length} source{availableSources.length !== 1 ? 's' : ''} available
          </div>
        </div>
      )}

      {channelArray.length === 0 ? (
        <div className="text-center py-6 text-surface-500 text-sm">
          No audio channels active
        </div>
      ) : (
        <div className="space-y-2">
          {channelArray.map((channel) => (
            <ChannelStrip key={channel.id} channel={channel} />
          ))}
        </div>
      )}

      {/* Master Volume */}
      <div className="pt-3 border-t border-surface-700/50">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-4 h-4 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
          <span className="text-xs font-medium text-white flex-1">Master Output</span>
          <span className="text-[10px] text-surface-500 font-mono">{masterVolume}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={masterVolume}
          onChange={(e) => handleMasterVolumeChange(parseInt(e.target.value))}
          className="w-full h-2 bg-surface-700 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-500 [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:shadow-lg"
        />
      </div>
    </div>
  );
}
