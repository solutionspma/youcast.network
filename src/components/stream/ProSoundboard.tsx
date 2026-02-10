'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { SoundEffect, SoundboardBank } from '@/types/composition';
import { getSoundboard } from '@/lib/audio/SoundboardEngine';
import { getMidiController } from '@/lib/audio/MidiController';

// ============================================================================
// TYPES
// ============================================================================

interface ProSoundboardProps {
  className?: string;
  banks?: SoundboardBank[];
  onBanksChange?: (banks: SoundboardBank[]) => void;
}

interface SoundPadState {
  isPlaying: boolean;
  isLoading: boolean;
  progress: number;      // 0-1 for playback progress
  waveform?: number[];   // Pre-computed waveform for visual
}

// ============================================================================
// SOUND PAD COMPONENT
// ============================================================================

interface SoundPadProps {
  sound: SoundEffect;
  state: SoundPadState;
  onPlay: () => void;
  onStop: () => void;
  onLoadSound: (file: File) => void;
  onSettings: () => void;
  onRemove: () => void;
  compact?: boolean;
}

function SoundPad({ 
  sound, 
  state, 
  onPlay, 
  onStop, 
  onLoadSound, 
  onSettings, 
  onRemove,
  compact = false 
}: SoundPadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasSound = !!sound.fileUrl;

  const handleClick = () => {
    if (state.isLoading) return;
    if (!hasSound) {
      fileInputRef.current?.click();
      return;
    }
    if (state.isPlaying && sound.playMode === 'toggle') {
      onStop();
    } else {
      onPlay();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onLoadSound(file);
    e.target.value = '';
  };

  return (
    <div className="relative group">
      <button
        onClick={handleClick}
        disabled={state.isLoading}
        className={`
          relative w-full overflow-hidden rounded-xl transition-all
          ${compact ? 'aspect-square' : 'aspect-[4/3]'}
          ${state.isPlaying 
            ? 'ring-2 ring-white ring-offset-2 ring-offset-surface-900 scale-[0.98]' 
            : 'hover:scale-[0.98]'
          }
          ${hasSound 
            ? 'shadow-lg' 
            : 'bg-surface-800 border-2 border-dashed border-surface-600 hover:border-surface-500'
          }
          ${state.isLoading ? 'opacity-60 cursor-wait' : 'cursor-pointer'}
        `}
        style={hasSound ? { backgroundColor: sound.color || '#3b82f6' } : undefined}
      >
        {/* Waveform / Progress background */}
        {hasSound && state.waveform && (
          <div className="absolute inset-0 opacity-30">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
              <path
                d={`M 0 50 ${state.waveform.map((v, i) => 
                  `L ${i / state.waveform!.length * 100} ${50 - v * 40}`
                ).join(' ')} L 100 50 Z`}
                fill="currentColor"
                className="text-black"
              />
            </svg>
          </div>
        )}

        {/* Playback progress */}
        {state.isPlaying && (
          <div 
            className="absolute inset-0 bg-white/20 transition-all"
            style={{ width: `${state.progress * 100}%` }}
          />
        )}

        {/* Content */}
        <div className="relative flex flex-col items-center justify-center h-full p-2 text-white">
          {state.isLoading ? (
            <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : hasSound ? (
            <>
              {state.isPlaying ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
              <span className={`mt-1 font-medium truncate w-full text-center ${compact ? 'text-[9px]' : 'text-xs'}`}>
                {sound.name}
              </span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-[10px] text-surface-500 mt-1">Add Sound</span>
            </>
          )}
        </div>

        {/* Keyboard shortcut */}
        {sound.trigger.keyboard && hasSound && (
          <span className="absolute top-1 left-1 text-[9px] bg-black/50 text-white/80 px-1.5 py-0.5 rounded font-mono">
            {sound.trigger.keyboard.replace('Key', '').replace('Digit', '')}
          </span>
        )}

        {/* Duck indicator */}
        {sound.duck && hasSound && (
          <span className="absolute top-1 right-1" title={`Ducks ${sound.duck.target} by ${sound.duck.amount}dB`}>
            <svg className="w-3 h-3 text-amber-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
            </svg>
          </span>
        )}
      </button>

      {/* Context menu (on hover) */}
      {hasSound && (
        <div className="absolute top-0 right-0 flex gap-0.5 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onSettings(); }}
            className="w-5 h-5 bg-black/60 hover:bg-black/80 rounded flex items-center justify-center text-white/70 hover:text-white"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="w-5 h-5 bg-black/60 hover:bg-red-500/80 rounded flex items-center justify-center text-white/70 hover:text-white"
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
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}

// ============================================================================
// SOUND SETTINGS MODAL
// ============================================================================

interface SoundSettingsModalProps {
  sound: SoundEffect;
  onUpdate: (updates: Partial<SoundEffect>) => void;
  onClose: () => void;
}

const PAD_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899',
];

function SoundSettingsModal({ sound, onUpdate, onClose }: SoundSettingsModalProps) {
  const [isLearningMidi, setIsLearningMidi] = useState(false);
  const midi = getMidiController();

  const handleLearnMidi = async () => {
    setIsLearningMidi(true);
    try {
      const result = await midi.learnMapping(5000);
      if (result) {
        onUpdate({
          trigger: {
            ...sound.trigger,
            midi: { note: result.note, channel: result.channel },
          },
        });
      }
    } finally {
      setIsLearningMidi(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-surface-900 rounded-xl p-5 w-80 max-h-[85vh] overflow-y-auto border border-surface-700"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-white">Sound Settings</h3>
          <button onClick={onClose} className="text-surface-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs text-surface-400 mb-1.5">Name</label>
            <input
              type="text"
              value={sound.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              className="w-full bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs text-surface-400 mb-1.5">Color</label>
            <div className="flex gap-2">
              {PAD_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => onUpdate({ color })}
                  className={`w-7 h-7 rounded-lg transition-transform ${
                    sound.color === color ? 'ring-2 ring-white scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Volume */}
          <div>
            <label className="block text-xs text-surface-400 mb-1.5">Volume: {sound.volume}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={sound.volume}
              onChange={(e) => onUpdate({ volume: parseInt(e.target.value) })}
              className="w-full h-2 bg-surface-700 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-500 [&::-webkit-slider-thumb]:cursor-pointer"
            />
          </div>

          {/* Play Mode */}
          <div>
            <label className="block text-xs text-surface-400 mb-1.5">Play Mode</label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'oneshot', label: 'One Shot', desc: 'Play once' },
                { id: 'toggle', label: 'Toggle', desc: 'Play/Stop' },
                { id: 'hold', label: 'Hold', desc: 'While pressed' },
                { id: 'loop', label: 'Loop', desc: 'Repeat' },
              ].map(({ id, label, desc }) => (
                <button
                  key={id}
                  onClick={() => onUpdate({ playMode: id as SoundEffect['playMode'] })}
                  className={`p-2 rounded-lg text-left transition-colors ${
                    sound.playMode === id
                      ? 'bg-brand-500/20 border border-brand-500/50 text-white'
                      : 'bg-surface-800 border border-surface-700 text-surface-400 hover:border-surface-600'
                  }`}
                >
                  <span className="text-xs font-medium block">{label}</span>
                  <span className="text-[10px] text-surface-500">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Ducking */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-surface-400">Duck Microphone</label>
              <button
                onClick={() => onUpdate({ 
                  duck: sound.duck ? undefined : { target: 'mic_main', amount: -12, fadeMs: 50 } 
                })}
                className={`px-2 py-0.5 text-[10px] rounded ${
                  sound.duck 
                    ? 'bg-amber-500/20 text-amber-400' 
                    : 'bg-surface-700 text-surface-500'
                }`}
              >
                {sound.duck ? 'ON' : 'OFF'}
              </button>
            </div>
            {sound.duck && (
              <div className="space-y-2 p-2 bg-surface-800/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-surface-500 w-14">Amount</span>
                  <input
                    type="range"
                    min="-24"
                    max="0"
                    value={sound.duck.amount}
                    onChange={(e) => onUpdate({ 
                      duck: { ...sound.duck!, amount: parseInt(e.target.value) } 
                    })}
                    className="flex-1 h-1 bg-surface-700 rounded-full appearance-none cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5
                      [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500"
                  />
                  <span className="text-[10px] text-surface-500 w-10 text-right">{sound.duck.amount}dB</span>
                </div>
              </div>
            )}
          </div>

          {/* Keyboard Trigger */}
          <div>
            <label className="block text-xs text-surface-400 mb-1.5">Keyboard Shortcut</label>
            <input
              type="text"
              value={sound.trigger.keyboard || ''}
              placeholder="Press a key..."
              onKeyDown={(e) => {
                e.preventDefault();
                onUpdate({ trigger: { ...sound.trigger, keyboard: e.code } });
              }}
              readOnly
              className="w-full bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500 cursor-pointer"
            />
          </div>

          {/* MIDI Trigger */}
          <div>
            <label className="block text-xs text-surface-400 mb-1.5">MIDI Note</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={sound.trigger.midi?.note ? `Note ${sound.trigger.midi.note}` : 'Not set'}
                readOnly
                className="flex-1 bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-400"
              />
              <button
                onClick={handleLearnMidi}
                disabled={isLearningMidi}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isLearningMidi 
                    ? 'bg-purple-500/30 text-purple-300 animate-pulse' 
                    : 'bg-surface-700 text-surface-300 hover:bg-surface-600'
                }`}
              >
                {isLearningMidi ? 'Listening...' : 'Learn'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// BANK SELECTOR
// ============================================================================

interface BankSelectorProps {
  banks: SoundboardBank[];
  activeBank: string;
  onSelect: (bankId: string) => void;
  onAdd: () => void;
  onRename: (bankId: string, name: string) => void;
  onDelete: (bankId: string) => void;
}

function BankSelector({ banks, activeBank, onSelect, onAdd, onRename, onDelete }: BankSelectorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleStartEdit = (bank: SoundboardBank) => {
    setEditingId(bank.id);
    setEditName(bank.name);
  };

  const handleFinishEdit = () => {
    if (editingId && editName.trim()) {
      onRename(editingId, editName.trim());
    }
    setEditingId(null);
    setEditName('');
  };

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {banks.map((bank) => (
        <div key={bank.id} className="relative group">
          {editingId === bank.id ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleFinishEdit}
              onKeyDown={(e) => e.key === 'Enter' && handleFinishEdit()}
              className="px-3 py-1.5 rounded-lg text-xs bg-surface-700 text-white border border-brand-500 focus:outline-none w-24"
              autoFocus
            />
          ) : (
            <button
              onClick={() => onSelect(bank.id)}
              onDoubleClick={() => handleStartEdit(bank)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                activeBank === bank.id
                  ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                  : 'bg-surface-800 text-surface-400 hover:text-white border border-surface-700'
              }`}
            >
              {bank.name}
            </button>
          )}
          
          {/* Delete button on hover */}
          {banks.length > 1 && !editingId && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(bank.id); }}
              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      ))}
      
      <button
        onClick={onAdd}
        className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-800 text-surface-500 hover:text-white hover:bg-surface-700 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
}

// ============================================================================
// MAIN PRO SOUNDBOARD COMPONENT
// ============================================================================

const DEFAULT_BANK: SoundboardBank = {
  id: 'bank-1',
  name: 'Bank 1',
  sounds: Array.from({ length: 8 }, (_, i) => ({
    id: `sfx_${i + 1}`,
    name: `Sound ${i + 1}`,
    type: 'sound',
    fileUrl: '',
    volume: 80,
    playMode: 'oneshot',
    color: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899'][i],
    trigger: {
      keyboard: `Digit${i + 1}`,
      padIndex: i,
    },
  })),
};

export default function ProSoundboard({ className = '' }: ProSoundboardProps) {
  const [banks, setBanks] = useState<SoundboardBank[]>([DEFAULT_BANK]);
  const [activeBankId, setActiveBankId] = useState(DEFAULT_BANK.id);
  const [padStates, setPadStates] = useState<Record<string, SoundPadState>>({});
  const [settingsSound, setSettingsSound] = useState<SoundEffect | null>(null);
  const soundboard = getSoundboard();

  // Initialize pad states
  useEffect(() => {
    const states: Record<string, SoundPadState> = {};
    banks.forEach(bank => {
      bank.sounds.forEach(sound => {
        states[sound.id] = {
          isPlaying: false,
          isLoading: false,
          progress: 0,
        };
      });
    });
    setPadStates(states);
  }, [banks]);

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.target instanceof HTMLInputElement) return;
      
      const activeBank = banks.find(b => b.id === activeBankId);
      if (!activeBank) return;

      const sound = activeBank.sounds.find(s => s.trigger.keyboard === e.code);
      if (sound && sound.fileUrl) {
        handlePlay(sound.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [banks, activeBankId]);

  const activeBank = banks.find(b => b.id === activeBankId) || banks[0];

  const handlePlay = useCallback((soundId: string) => {
    soundboard.playPad(soundId);
    setPadStates(prev => ({ ...prev, [soundId]: { ...prev[soundId], isPlaying: true } }));
  }, [soundboard]);

  const handleStop = useCallback((soundId: string) => {
    soundboard.stopPad(soundId);
    setPadStates(prev => ({ ...prev, [soundId]: { ...prev[soundId], isPlaying: false } }));
  }, [soundboard]);

  const handleLoadSound = useCallback(async (soundId: string, file: File) => {
    setPadStates(prev => ({ ...prev, [soundId]: { ...prev[soundId], isLoading: true } }));
    
    try {
      await soundboard.loadSoundFromFile(soundId, file);
      
      // Update sound name
      setBanks(prev => prev.map(bank => ({
        ...bank,
        sounds: bank.sounds.map(s => 
          s.id === soundId ? { ...s, name: file.name.replace(/\.[^/.]+$/, ''), fileUrl: 'loaded' } : s
        ),
      })));
    } catch (error) {
      console.error('Failed to load sound:', error);
    } finally {
      setPadStates(prev => ({ ...prev, [soundId]: { ...prev[soundId], isLoading: false } }));
    }
  }, [soundboard]);

  const handleRemoveSound = useCallback((soundId: string) => {
    soundboard.clearSound(soundId);
    setBanks(prev => prev.map(bank => ({
      ...bank,
      sounds: bank.sounds.map(s => 
        s.id === soundId ? { ...s, fileUrl: '', name: `Sound ${s.trigger.padIndex! + 1}` } : s
      ),
    })));
  }, [soundboard]);

  const handleUpdateSound = useCallback((soundId: string, updates: Partial<SoundEffect>) => {
    setBanks(prev => prev.map(bank => ({
      ...bank,
      sounds: bank.sounds.map(s => s.id === soundId ? { ...s, ...updates } as SoundEffect : s),
    })));
    
    if (updates.volume !== undefined) {
      soundboard.setPadVolume(soundId, updates.volume);
    }
    if (updates.trigger?.midi?.note !== undefined) {
      soundboard.setPadMidiNote(soundId, updates.trigger.midi.note);
    }
  }, [soundboard]);

  const handleAddBank = useCallback(() => {
    const newBank: SoundboardBank = {
      id: `bank-${Date.now()}`,
      name: `Bank ${banks.length + 1}`,
      sounds: Array.from({ length: 8 }, (_, i) => ({
        id: `sfx_${Date.now()}_${i}`,
        name: `Sound ${i + 1}`,
        type: 'sound',
        fileUrl: '',
        volume: 80,
        playMode: 'oneshot',
        color: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899'][i],
        trigger: { keyboard: `Digit${i + 1}`, padIndex: i },
      })),
    };
    setBanks(prev => [...prev, newBank]);
    setActiveBankId(newBank.id);
  }, [banks.length]);

  const handleRenameBank = useCallback((bankId: string, name: string) => {
    setBanks(prev => prev.map(b => b.id === bankId ? { ...b, name } : b));
  }, []);

  const handleDeleteBank = useCallback((bankId: string) => {
    if (banks.length <= 1) return;
    setBanks(prev => prev.filter(b => b.id !== bankId));
    if (activeBankId === bankId) {
      setActiveBankId(banks[0].id);
    }
  }, [banks, activeBankId]);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Soundboard</h3>
        <button
          onClick={() => soundboard.stopAll()}
          className="px-2 py-1 text-[10px] font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded transition-colors"
        >
          STOP ALL
        </button>
      </div>

      {/* Bank selector */}
      <BankSelector
        banks={banks}
        activeBank={activeBankId}
        onSelect={setActiveBankId}
        onAdd={handleAddBank}
        onRename={handleRenameBank}
        onDelete={handleDeleteBank}
      />

      {/* Sound pads grid */}
      <div className="grid grid-cols-4 gap-2">
        {activeBank.sounds.map((sound) => (
          <SoundPad
            key={sound.id}
            sound={sound}
            state={padStates[sound.id] || { isPlaying: false, isLoading: false, progress: 0 }}
            onPlay={() => handlePlay(sound.id)}
            onStop={() => handleStop(sound.id)}
            onLoadSound={(file) => handleLoadSound(sound.id, file)}
            onSettings={() => setSettingsSound(sound)}
            onRemove={() => handleRemoveSound(sound.id)}
          />
        ))}
      </div>

      {/* Master volume */}
      <div className="flex items-center gap-3 pt-2 border-t border-surface-700/50">
        <svg className="w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707A1 1 0 0112 5v14a1 1 0 01-1.707.707L5.586 15z" />
        </svg>
        <input
          type="range"
          min="0"
          max="100"
          value={80}
          onChange={(e) => soundboard.setMasterVolume(parseInt(e.target.value))}
          className="flex-1 h-1.5 bg-surface-700 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
        />
        <span className="text-[10px] text-surface-500 w-8 text-right">80%</span>
      </div>

      {/* Settings modal */}
      {settingsSound && (
        <SoundSettingsModal
          sound={settingsSound}
          onUpdate={(updates) => handleUpdateSound(settingsSound.id, updates)}
          onClose={() => setSettingsSound(null)}
        />
      )}
    </div>
  );
}
