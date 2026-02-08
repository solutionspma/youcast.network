'use client';

import { useState } from 'react';

interface AudioChannel {
  id: string;
  name: string;
  type: 'microphone' | 'desktop' | 'media' | 'music';
  level: number; // 0-100
  muted: boolean;
  peakLevel: number; // 0-100 for meter display
}

interface AudioMixerProps {
  channels: AudioChannel[];
  onVolumeChange: (id: string, level: number) => void;
  onMuteToggle: (id: string) => void;
  masterVolume: number;
  onMasterVolumeChange: (level: number) => void;
}

const channelIcons: Record<AudioChannel['type'], JSX.Element> = {
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
};

function LevelMeter({ level, muted }: { level: number; muted: boolean }) {
  const getColor = (l: number) => {
    if (muted) return 'bg-surface-600';
    if (l > 85) return 'bg-red-500';
    if (l > 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="flex gap-0.5 h-1.5">
      {Array.from({ length: 20 }).map((_, i) => {
        const threshold = (i + 1) * 5;
        const active = level >= threshold;
        return (
          <div
            key={i}
            className={`w-1 rounded-full transition-colors duration-75 ${
              active ? getColor(threshold) : 'bg-surface-700'
            }`}
          />
        );
      })}
    </div>
  );
}

export default function AudioMixer({ channels, onVolumeChange, onMuteToggle, masterVolume, onMasterVolumeChange }: AudioMixerProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Audio Mixer</h3>

      {/* Individual Channels */}
      <div className="space-y-2">
        {channels.map((channel) => (
          <div key={channel.id} className="p-2.5 rounded-lg bg-surface-800/50">
            {/* Channel Header */}
            <div className="flex items-center gap-2 mb-2">
              <span className={`${channel.muted ? 'text-surface-500' : 'text-surface-300'}`}>
                {channelIcons[channel.type]}
              </span>
              <span className={`text-xs flex-1 truncate ${channel.muted ? 'text-surface-500' : 'text-white'}`}>
                {channel.name}
              </span>
              <button
                onClick={() => onMuteToggle(channel.id)}
                className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${
                  channel.muted
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                    : 'text-surface-400 hover:bg-surface-600 hover:text-white'
                }`}
                title={channel.muted ? 'Unmute' : 'Mute'}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {channel.muted ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  )}
                </svg>
              </button>
            </div>

            {/* Level Meter */}
            <LevelMeter level={channel.peakLevel} muted={channel.muted} />

            {/* Volume Slider */}
            <div className="flex items-center gap-2 mt-2">
              <input
                type="range"
                min="0"
                max="100"
                value={channel.level}
                onChange={(e) => onVolumeChange(channel.id, parseInt(e.target.value))}
                className="flex-1 h-1 bg-surface-700 rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-webkit-slider-thumb]:shadow-sm"
              />
              <span className="text-[10px] text-surface-500 w-7 text-right font-mono">{channel.level}%</span>
            </div>
          </div>
        ))}
      </div>

      {/* Master Volume */}
      <div className="pt-2 border-t border-surface-700/50">
        <div className="flex items-center gap-2 mb-1.5">
          <svg className="w-3.5 h-3.5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
          <span className="text-xs font-medium text-white">Master</span>
          <span className="text-[10px] text-surface-500 ml-auto font-mono">{masterVolume}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={masterVolume}
          onChange={(e) => onMasterVolumeChange(parseInt(e.target.value))}
          className="w-full h-1.5 bg-surface-700 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-500 [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:shadow-sm"
        />
      </div>
    </div>
  );
}
