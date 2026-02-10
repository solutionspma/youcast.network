'use client';

import { useState, useEffect } from 'react';
import { getMidiController, MidiDevice, MidiMapping, MidiController } from '@/lib/audio/MidiController';

interface MidiSettingsPanelProps {
  className?: string;
}

export default function MidiSettingsPanel({ className = '' }: MidiSettingsPanelProps) {
  const [devices, setDevices] = useState<MidiDevice[]>([]);
  const [activeDevice, setActiveDevice] = useState<MidiDevice | null>(null);
  const [mappings, setMappings] = useState<MidiMapping[]>([]);
  const [isSupported, setIsSupported] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastMessage, setLastMessage] = useState<{ note: number; velocity: number; type: string } | null>(null);
  
  const midi = getMidiController();

  // Initialize MIDI
  useEffect(() => {
    setIsSupported(midi.getSupported());
    
    const initMidi = async () => {
      const success = await midi.init();
      setIsInitialized(success);
    };
    
    initMidi();
  }, [midi]);

  // Subscribe to device changes
  useEffect(() => {
    if (!isInitialized) return;
    
    const unsubscribe = midi.onDeviceChange((devs) => {
      setDevices(devs);
      setActiveDevice(midi.getActiveInput());
    });
    
    return unsubscribe;
  }, [midi, isInitialized]);

  // Subscribe to MIDI messages for monitoring
  useEffect(() => {
    if (!isInitialized) return;
    
    const unsubscribe = midi.onMidiMessage((note, velocity, channel, type) => {
      setLastMessage({ note, velocity, type });
      
      // Clear after 1 second
      setTimeout(() => setLastMessage(null), 1000);
    });
    
    return unsubscribe;
  }, [midi, isInitialized]);

  // Update mappings list
  useEffect(() => {
    if (isInitialized) {
      setMappings(midi.getMappings());
    }
  }, [midi, isInitialized]);

  const handleDeviceSelect = (deviceId: string) => {
    midi.selectInput(deviceId);
    setActiveDevice(midi.getActiveInput());
  };

  const inputDevices = devices.filter(d => d.type === 'input' && d.connected);

  if (!isSupported) {
    return (
      <div className={`p-4 bg-surface-800/50 rounded-lg ${className}`}>
        <div className="text-center text-surface-400 text-sm">
          <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p>Web MIDI not supported in this browser.</p>
          <p className="text-xs mt-1 text-surface-500">Try Chrome, Edge, or Opera.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">MIDI Controller</h3>
        {isInitialized && (
          <span className="text-[10px] text-green-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            Ready
          </span>
        )}
      </div>

      {/* Device Selection */}
      <div>
        <label className="block text-xs text-surface-400 mb-2">Input Device</label>
        {inputDevices.length === 0 ? (
          <div className="text-xs text-surface-500 bg-surface-800 rounded-lg p-3 text-center">
            No MIDI devices detected
            <p className="text-[10px] mt-1">Connect a USB pad or MIDI controller</p>
          </div>
        ) : (
          <select
            value={activeDevice?.id || ''}
            onChange={(e) => handleDeviceSelect(e.target.value)}
            className="w-full bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-sm text-white"
          >
            <option value="">Select device...</option>
            {inputDevices.map((device) => (
              <option key={device.id} value={device.id}>
                {device.name} ({device.manufacturer})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* MIDI Monitor */}
      {activeDevice && (
        <div className="bg-surface-800/50 rounded-lg p-3">
          <div className="text-xs text-surface-400 mb-2">MIDI Monitor</div>
          <div className={`font-mono text-sm transition-colors ${
            lastMessage ? 'text-cyan-400' : 'text-surface-600'
          }`}>
            {lastMessage ? (
              <span>
                {lastMessage.type.toUpperCase()}: {MidiController.noteToName(lastMessage.note)} 
                (vel: {lastMessage.velocity})
              </span>
            ) : (
              <span>Waiting for input...</span>
            )}
          </div>
        </div>
      )}

      {/* Connected Device Info */}
      {activeDevice && (
        <div className="bg-surface-800/30 rounded-lg p-3 border border-surface-700/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-cyan-500/10 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <div>
              <div className="text-xs font-medium text-white">{activeDevice.name}</div>
              <div className="text-[10px] text-surface-500">{activeDevice.manufacturer}</div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Tips */}
      <div className="text-[10px] text-surface-500 space-y-1">
        <p>💡 Use the &quot;Learn&quot; button in pad settings to assign MIDI notes</p>
        <p>💡 Supported: AKAI, Novation, Stream Deck, and generic USB pads</p>
      </div>
    </div>
  );
}
