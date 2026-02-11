// ============================================================================
// USE AUDIO ENGINE HOOK
// Bridges WebAudioEngine to React components with real-time metering
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  WebAudioEngine,
  getAudioEngine,
  ChannelState,
  AudioChannelConfig,
  EQBand,
  CompressorSettings,
  NoiseGateSettings,
} from '@/lib/audio/WebAudioEngine';

export interface AudioMeterData {
  peak: number;
  rms: number;
  gainReduction: number;
}

export interface UseAudioEngineReturn {
  // Engine state
  isInitialized: boolean;
  channels: Map<string, ChannelState>;
  meters: Map<string, AudioMeterData>;
  outputStream: MediaStream | null;
  
  // Initialization
  initAudio: () => Promise<MediaStream>;
  
  // Channel management
  addChannel: (config: AudioChannelConfig, stream?: MediaStream) => Promise<void>;
  removeChannel: (id: string) => void;
  rebindChannel: (id: string, stream: MediaStream) => Promise<void>;
  resetStreamConfig: () => Promise<void>;
  
  // Channel controls
  setVolume: (id: string, volume: number) => void;
  setMuted: (id: string, muted: boolean) => void;
  setSolo: (id: string, solo: boolean) => void;
  setPan: (id: string, pan: number) => void;
  muteAll: () => void;
  unmuteAll: () => void;
  
  // EQ controls
  setEQBand: (id: string, bandIndex: number, settings: Partial<EQBand>) => void;
  resetEQ: (id: string) => void;
  
  // Compressor controls
  setCompressor: (id: string, settings: Partial<CompressorSettings>) => void;
  resetCompressor: (id: string) => void;
  
  // Noise gate controls
  setNoiseGate: (id: string, settings: Partial<NoiseGateSettings>) => void;
  
  // Master controls
  setMasterVolume: (volume: number) => void;
  
  // Monitoring
  enableMonitor: (id: string) => void;
  disableMonitor: () => void;
  isMonitoring: string | null;
}

/**
 * Hook to use the shared WebAudioEngine with React state management.
 * All components using this hook share the same audio engine instance.
 */
export function useAudioEngine(): UseAudioEngineReturn {
  const [isInitialized, setIsInitialized] = useState(false);
  const [channels, setChannels] = useState<Map<string, ChannelState>>(new Map());
  const [meters, setMeters] = useState<Map<string, AudioMeterData>>(new Map());
  const [outputStream, setOutputStream] = useState<MediaStream | null>(null);
  const [isMonitoring, setIsMonitoring] = useState<string | null>(null);
  
  const engineRef = useRef<WebAudioEngine | null>(null);
  const monitorGainRef = useRef<GainNode | null>(null);
  const monitorSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  // Get engine instance
  useEffect(() => {
    engineRef.current = getAudioEngine();
    
    // Check if already initialized
    const stream = engineRef.current.getOutputStream();
    if (stream) {
      setIsInitialized(true);
      setOutputStream(stream);
    }
    
    // Subscribe to channel state changes
    const unsubChannels = engineRef.current.subscribeChannels((newChannels) => {
      setChannels(new Map(newChannels));
    });
    
    // Subscribe to meter updates (30fps)
    const unsubMeters = engineRef.current.subscribeMeters((newMeters) => {
      setMeters(new Map(newMeters));
    });
    
    return () => {
      unsubChannels();
      unsubMeters();
    };
  }, []);
  
  // Initialize audio engine
  const initAudio = useCallback(async (): Promise<MediaStream> => {
    const engine = engineRef.current;
    if (!engine) throw new Error('Audio engine not available');
    
    const stream = await engine.init();
    setIsInitialized(true);
    setOutputStream(stream);
    return stream;
  }, []);
  
  // Add channel with stream
  const addChannel = useCallback(async (config: AudioChannelConfig, stream?: MediaStream): Promise<void> => {
    const engine = engineRef.current;
    if (!engine) throw new Error('Audio engine not available');
    
    // Ensure engine is initialized
    if (!engine.getContext()) {
      await initAudio();
    }
    
    await engine.addChannel(config, stream);
  }, [initAudio]);
  
  // Remove channel
  const removeChannel = useCallback((id: string): void => {
    engineRef.current?.removeChannel(id);
  }, []);
  
  // Rebind channel with new stream (for device changes)
  const rebindChannel = useCallback(async (id: string, stream: MediaStream): Promise<void> => {
    const engine = engineRef.current;
    if (!engine) return;
    
    const state = engine.getChannelState(id);
    if (!state) return;
    
    // Remove and re-add with new stream
    engine.removeChannel(id);
    await engine.addChannel({
      id: state.id,
      name: state.name,
      type: state.type,
    }, stream);
  }, []);
  
  // Reset entire stream config (recreate audio graph)
  const resetStreamConfig = useCallback(async (): Promise<void> => {
    const engine = engineRef.current;
    if (!engine) return;
    
    // Save current channel configs
    const savedConfigs: { config: AudioChannelConfig; state: ChannelState }[] = [];
    engine.getAllChannels().forEach((state, id) => {
      savedConfigs.push({
        config: { id, name: state.name, type: state.type },
        state: { ...state },
      });
    });
    
    // Dispose and reinitialize
    engine.dispose();
    const stream = await engine.init();
    setOutputStream(stream);
    
    // Channels will need to be re-added with fresh streams by the caller
  }, []);
  
  // Volume control
  const setVolume = useCallback((id: string, volume: number): void => {
    engineRef.current?.setVolume(id, volume);
  }, []);
  
  // Mute control
  const setMuted = useCallback((id: string, muted: boolean): void => {
    engineRef.current?.setMuted(id, muted);
  }, []);
  
  // Solo control
  const setSolo = useCallback((id: string, solo: boolean): void => {
    engineRef.current?.setSolo(id, solo);
  }, []);
  
  // Pan control
  const setPan = useCallback((id: string, pan: number): void => {
    engineRef.current?.setPan(id, pan);
  }, []);
  
  // Mute all channels
  const muteAll = useCallback((): void => {
    channels.forEach((_, id) => {
      engineRef.current?.setMuted(id, true);
    });
  }, [channels]);
  
  // Unmute all channels
  const unmuteAll = useCallback((): void => {
    channels.forEach((_, id) => {
      engineRef.current?.setMuted(id, false);
    });
  }, [channels]);
  
  // EQ band control
  const setEQBand = useCallback((id: string, bandIndex: number, settings: Partial<EQBand>): void => {
    engineRef.current?.setEQBand(id, bandIndex, settings);
  }, []);
  
  // Reset EQ
  const resetEQ = useCallback((id: string): void => {
    engineRef.current?.resetEQ(id);
  }, []);
  
  // Compressor control
  const setCompressor = useCallback((id: string, settings: Partial<CompressorSettings>): void => {
    engineRef.current?.setCompressor(id, settings);
  }, []);
  
  // Reset compressor
  const resetCompressor = useCallback((id: string): void => {
    engineRef.current?.resetCompressor(id);
  }, []);
  
  // Noise gate control
  const setNoiseGate = useCallback((id: string, settings: Partial<NoiseGateSettings>): void => {
    engineRef.current?.setNoiseGate(id, settings);
  }, []);
  
  // Master volume
  const setMasterVolume = useCallback((volume: number): void => {
    engineRef.current?.setMasterVolume(volume);
  }, []);
  
  // Enable monitoring for a specific channel
  const enableMonitor = useCallback((id: string): void => {
    const engine = engineRef.current;
    if (!engine) return;
    
    const ctx = engine.getContext();
    if (!ctx) return;
    
    // Disable previous monitoring
    if (monitorSourceRef.current) {
      monitorSourceRef.current.disconnect();
      monitorSourceRef.current = null;
    }
    if (monitorGainRef.current) {
      monitorGainRef.current.disconnect();
      monitorGainRef.current = null;
    }
    
    // Get channel stream and route to local output
    const channelNodes = (engine as any).channels.get(id);
    if (!channelNodes?.stream) return;
    
    monitorSourceRef.current = ctx.createMediaStreamSource(channelNodes.stream);
    monitorGainRef.current = ctx.createGain();
    monitorGainRef.current.gain.value = 1;
    
    monitorSourceRef.current.connect(monitorGainRef.current);
    monitorGainRef.current.connect(ctx.destination);
    
    setIsMonitoring(id);
  }, []);
  
  // Disable all monitoring
  const disableMonitor = useCallback((): void => {
    if (monitorSourceRef.current) {
      monitorSourceRef.current.disconnect();
      monitorSourceRef.current = null;
    }
    if (monitorGainRef.current) {
      monitorGainRef.current.disconnect();
      monitorGainRef.current = null;
    }
    setIsMonitoring(null);
  }, []);
  
  return {
    isInitialized,
    channels,
    meters,
    outputStream,
    initAudio,
    addChannel,
    removeChannel,
    rebindChannel,
    resetStreamConfig,
    setVolume,
    setMuted,
    setSolo,
    setPan,
    muteAll,
    unmuteAll,
    setEQBand,
    resetEQ,
    setCompressor,
    resetCompressor,
    setNoiseGate,
    setMasterVolume,
    enableMonitor,
    disableMonitor,
    isMonitoring,
  };
}

// ============================================================================
// HELPER HOOK: Auto-bind media stream to audio channel
// ============================================================================

export function useAudioChannelBind(
  channelId: string,
  channelName: string,
  channelType: AudioChannelConfig['type'],
  mediaStream: MediaStream | null
) {
  const { isInitialized, addChannel, rebindChannel, removeChannel, initAudio } = useAudioEngine();
  const boundRef = useRef(false);
  
  useEffect(() => {
    const bind = async () => {
      if (!mediaStream) {
        // Remove channel if stream goes away
        if (boundRef.current) {
          removeChannel(channelId);
          boundRef.current = false;
        }
        return;
      }
      
      // Initialize engine if needed
      if (!isInitialized) {
        await initAudio();
      }
      
      if (!boundRef.current) {
        // Add new channel
        await addChannel({ id: channelId, name: channelName, type: channelType }, mediaStream);
        boundRef.current = true;
      } else {
        // Rebind existing channel
        await rebindChannel(channelId, mediaStream);
      }
    };
    
    bind();
  }, [mediaStream, channelId, channelName, channelType, isInitialized, addChannel, rebindChannel, removeChannel, initAudio]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (boundRef.current) {
        removeChannel(channelId);
      }
    };
  }, [channelId, removeChannel]);
}
