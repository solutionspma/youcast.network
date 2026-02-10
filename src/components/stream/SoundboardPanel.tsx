'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { SoundPad, SoundboardState, getSoundboard } from '@/lib/audio/SoundboardEngine';
import { getMidiController, MidiController } from '@/lib/audio/MidiController';

interface SoundboardPanelProps {
  className?: string;
}

// ============================================================================
// SOUND PAD COMPONENT
// ============================================================================

function SoundPadButton({ pad, onPlay, onLoadSound, onClearSound, onSettings }: {
  pad: SoundPad;
  onPlay: () => void;
  onLoadSound: (file: File) => void;
  onClearSound: () => void;
  onSettings: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onLoadSound(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const hasSound = pad.audioBuffer !== null;

  return (
    <div className="relative group">
      <button
        onClick={hasSound ? onPlay : () => fileInputRef.current?.click()}
        disabled={pad.isLoading}
        className={`
          w-full aspect-square rounded-xl font-medium text-sm transition-all
          flex flex-col items-center justify-center gap-1
          ${pad.isPlaying 
            ? 'ring-2 ring-white scale-95' 
            : 'hover:scale-[0.98]'
          }
          ${hasSound 
            ? 'text-white shadow-lg' 
            : 'bg-surface-800 border-2 border-dashed border-surface-600 text-surface-400 hover:border-surface-500'
          }
          ${pad.isLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
        `}
        style={hasSound ? { backgroundColor: pad.color } : undefined}
      >
        {pad.isLoading ? (
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : hasSound ? (
          <>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            <span className="text-[10px] px-1 truncate w-full text-center">{pad.name}</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-[10px]">Add Sound</span>
          </>
        )}
        
        {/* Keyboard shortcut indicator */}
        {pad.keyBinding && hasSound && (
          <span className="absolute top-1 left-1 text-[9px] bg-black/40 px-1 rounded">
            {pad.keyBinding}
          </span>
        )}
      </button>

      {/* Context menu buttons */}
      {hasSound && (
        <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onSettings}
            className="w-5 h-5 bg-black/40 hover:bg-black/60 rounded flex items-center justify-center text-white/80 hover:text-white"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button
            onClick={onClearSound}
            className="w-5 h-5 bg-black/40 hover:bg-red-500/60 rounded flex items-center justify-center text-white/80 hover:text-white"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}

// ============================================================================
// PAD SETTINGS MODAL
// ============================================================================

function PadSettingsModal({ pad, onClose }: { pad: SoundPad; onClose: () => void }) {
  const soundboard = getSoundboard();
  const midi = getMidiController();
  const [isLearning, setIsLearning] = useState(false);

  const handleLearnMidi = async () => {
    setIsLearning(true);
    const result = await midi.learnMapping(5000);
    if (result) {
      soundboard.setPadMidiNote(pad.id, result.note);
    }
    setIsLearning(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-surface-900 rounded-xl p-4 w-80 max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Pad Settings</h3>
          <button onClick={onClose} className="text-surface-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs text-surface-400 mb-1">Name</label>
            <input
              type="text"
              value={pad.name}
              onChange={(e) => soundboard.setPadName(pad.id, e.target.value)}
              className="w-full bg-surface-800 border border-surface-700 rounded px-3 py-2 text-sm text-white"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs text-surface-400 mb-1">Color</label>
            <input
              type="color"
              value={pad.color}
              onChange={(e) => soundboard.setPadColor(pad.id, e.target.value)}
              className="w-full h-10 rounded cursor-pointer"
            />
          </div>

          {/* Volume */}
          <div>
            <label className="block text-xs text-surface-400 mb-1">Volume: {pad.volume}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={pad.volume}
              onChange={(e) => soundboard.setPadVolume(pad.id, parseInt(e.target.value))}
              className="w-full h-2 bg-surface-700 rounded-full appearance-none cursor-pointer"
            />
          </div>

          {/* Play Mode */}
          <div>
            <label className="block text-xs text-surface-400 mb-1">Play Mode</label>
            <select
              value={pad.playMode}
              onChange={(e) => soundboard.setPadPlayMode(pad.id, e.target.value as any)}
              className="w-full bg-surface-800 border border-surface-700 rounded px-3 py-2 text-sm text-white"
            >
              <option value="oneshot">One Shot (play once)</option>
              <option value="toggle">Toggle (play/stop)</option>
              <option value="hold">Hold (play while pressed)</option>
            </select>
          </div>

          {/* Duck Settings */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                id={`duck-${pad.id}`}
                checked={pad.duckMic}
                onChange={(e) => soundboard.setPadDuck(pad.id, e.target.checked)}
                className="rounded bg-surface-700 border-surface-600"
              />
              <label htmlFor={`duck-${pad.id}`} className="text-xs text-surface-400">
                Duck microphone when playing
              </label>
            </div>
            {pad.duckMic && (
              <div>
                <label className="block text-xs text-surface-500 mb-1">Duck Amount: {pad.duckAmount}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={pad.duckAmount}
                  onChange={(e) => soundboard.setPadDuck(pad.id, true, parseInt(e.target.value))}
                  className="w-full h-1 bg-surface-700 rounded-full appearance-none cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Key Binding */}
          <div>
            <label className="block text-xs text-surface-400 mb-1">Keyboard Shortcut</label>
            <input
              type="text"
              value={pad.keyBinding || ''}
              onChange={(e) => soundboard.setPadKeyBinding(pad.id, e.target.value || undefined)}
              placeholder="e.g., 1, Q, F1"
              maxLength={3}
              className="w-full bg-surface-800 border border-surface-700 rounded px-3 py-2 text-sm text-white"
            />
          </div>

          {/* MIDI Binding */}
          <div>
            <label className="block text-xs text-surface-400 mb-1">MIDI Note</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={pad.midiNote !== undefined ? MidiController.noteToName(pad.midiNote) : ''}
                readOnly
                placeholder="Not set"
                className="flex-1 bg-surface-800 border border-surface-700 rounded px-3 py-2 text-sm text-white"
              />
              <button
                onClick={handleLearnMidi}
                disabled={isLearning}
                className={`px-3 py-2 rounded text-xs font-medium ${
                  isLearning 
                    ? 'bg-amber-500/20 text-amber-400 animate-pulse' 
                    : 'bg-surface-700 text-white hover:bg-surface-600'
                }`}
              >
                {isLearning ? 'Press pad...' : 'Learn'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN SOUNDBOARD COMPONENT
// ============================================================================

export default function SoundboardPanel({ className = '' }: SoundboardPanelProps) {
  const [state, setState] = useState<SoundboardState | null>(null);
  const [settingsPad, setSettingsPad] = useState<SoundPad | null>(null);
  const [midiInitialized, setMidiInitialized] = useState(false);
  const soundboard = getSoundboard();
  const midi = getMidiController();

  // Subscribe to soundboard state
  useEffect(() => {
    const unsubscribe = soundboard.subscribe(setState);
    return unsubscribe;
  }, [soundboard]);

  // Initialize MIDI
  useEffect(() => {
    midi.init().then((success) => {
      setMidiInitialized(success);
      
      if (success) {
        // Connect MIDI to soundboard
        midi.onMidiMessage((note, velocity, channel, type) => {
          if (type === 'noteon' && velocity > 0) {
            soundboard.handleMidiNoteOn(note, velocity);
          } else if (type === 'noteoff' || (type === 'noteon' && velocity === 0)) {
            soundboard.handleMidiNoteOff(note);
          }
        });
      }
    });
  }, [soundboard, midi]);

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      soundboard.handleKeyDown(e.key);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      soundboard.handleKeyUp(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [soundboard]);

  const handleLoadSound = async (padId: string, file: File) => {
    try {
      await soundboard.loadSoundFromFile(padId, file);
    } catch (error) {
      console.error('Failed to load sound:', error);
    }
  };

  if (!state) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Soundboard</h3>
        <div className="flex items-center gap-2">
          {midiInitialized && (
            <span className="text-[10px] text-cyan-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              MIDI
            </span>
          )}
          <button
            onClick={() => soundboard.stopAll()}
            className="text-[10px] text-surface-400 hover:text-white"
          >
            Stop All
          </button>
        </div>
      </div>

      {/* Pad Grid */}
      <div className="grid grid-cols-4 gap-2">
        {state.pads.map((pad) => (
          <SoundPadButton
            key={pad.id}
            pad={pad}
            onPlay={() => soundboard.playPad(pad.id)}
            onLoadSound={(file) => handleLoadSound(pad.id, file)}
            onClearSound={() => soundboard.clearSound(pad.id)}
            onSettings={() => setSettingsPad(pad)}
          />
        ))}
      </div>

      {/* Master Volume */}
      <div className="pt-2 border-t border-surface-700/50">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] text-surface-400">Master</span>
          <input
            type="range"
            min="0"
            max="100"
            value={state.masterVolume}
            onChange={(e) => soundboard.setMasterVolume(parseInt(e.target.value))}
            className="flex-1 h-1 bg-surface-700 rounded-full appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer"
          />
          <span className="text-[10px] text-surface-500 w-8 text-right">{state.masterVolume}%</span>
        </div>
      </div>

      {/* Settings Modal */}
      {settingsPad && (
        <PadSettingsModal
          pad={settingsPad}
          onClose={() => setSettingsPad(null)}
        />
      )}
    </div>
  );
}
