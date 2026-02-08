'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';
import type { StreamSession, StreamSettings, StreamInput, StreamScene, StreamOverlay } from '@/types';

interface UseStreamReturn {
  session: StreamSession | null;
  isLive: boolean;
  isPreview: boolean;
  isConnecting: boolean;
  duration: number;
  viewerCount: number;
  health: 'excellent' | 'good' | 'fair' | 'poor' | 'offline';
  inputs: StreamInput[];
  scenes: StreamScene[];
  activeSceneId: string | null;
  overlays: StreamOverlay[];
  startPreview: () => void;
  stopPreview: () => void;
  goLive: (settings?: Partial<StreamSettings>) => Promise<boolean>;
  stopStream: () => Promise<boolean>;
  switchScene: (sceneId: string) => void;
  addInput: (input: Omit<StreamInput, 'id'>) => void;
  removeInput: (id: string) => void;
  toggleInput: (id: string) => void;
  addOverlay: (overlay: Omit<StreamOverlay, 'id'>) => void;
  removeOverlay: (id: string) => void;
  toggleOverlay: (id: string) => void;
  updateSettings: (settings: Partial<StreamSettings>) => void;
}

export function useStream(channelId?: string): UseStreamReturn {
  const [session, setSession] = useState<StreamSession | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [duration, setDuration] = useState(0);
  const [viewerCount, setViewerCount] = useState(0);
  const [health, setHealth] = useState<UseStreamReturn['health']>('offline');
  const [inputs, setInputs] = useState<StreamInput[]>([]);
  const [scenes, setScenes] = useState<StreamScene[]>([]);
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [overlays, setOverlays] = useState<StreamOverlay[]>([]);

  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Duration timer
  useEffect(() => {
    if (isLive) {
      durationTimerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
    }
    return () => {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    };
  }, [isLive]);

  const startPreview = useCallback(() => {
    setIsPreview(true);
  }, []);

  const stopPreview = useCallback(() => {
    setIsPreview(false);
  }, []);

  const goLive = useCallback(async (settings?: Partial<StreamSettings>): Promise<boolean> => {
    setIsConnecting(true);
    try {
      const session = await apiClient.post<StreamSession>('/stream/start', {
        channelId,
        settings,
      });
      if (session) {
        setSession(session);
        setIsLive(true);
        setIsPreview(false);
        setDuration(0);
        setHealth('excellent');
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [channelId]);

  const stopStream = useCallback(async (): Promise<boolean> => {
    try {
      if (session?.id) {
        await apiClient.post(`/stream/${session.id}/stop`, {});
      }
      setIsLive(false);
      setHealth('offline');
      setSession(null);
      return true;
    } catch {
      return false;
    }
  }, [session]);

  const switchScene = useCallback((sceneId: string) => {
    setActiveSceneId(sceneId);
  }, []);

  const addInput = useCallback((input: Omit<StreamInput, 'id'>) => {
    const newInput: StreamInput = { ...input, id: `input-${Date.now()}` };
    setInputs(prev => [...prev, newInput]);
  }, []);

  const removeInput = useCallback((id: string) => {
    setInputs(prev => prev.filter(i => i.id !== id));
  }, []);

  const toggleInput = useCallback((id: string) => {
    setInputs(prev => prev.map(i =>
      i.id === id ? { ...i, is_active: !i.is_active } : i
    ));
  }, []);

  const addOverlay = useCallback((overlay: Omit<StreamOverlay, 'id'>) => {
    const newOverlay: StreamOverlay = { ...overlay, id: `overlay-${Date.now()}` };
    setOverlays(prev => [...prev, newOverlay]);
  }, []);

  const removeOverlay = useCallback((id: string) => {
    setOverlays(prev => prev.filter(o => o.id !== id));
  }, []);

  const toggleOverlay = useCallback((id: string) => {
    setOverlays(prev => prev.map(o =>
      o.id === id ? { ...o, is_visible: !o.is_visible } : o
    ));
  }, []);

  const updateSettings = useCallback((settings: Partial<StreamSettings>) => {
    // Apply settings update - in production this would sync with the server
    if (session) {
      setSession(prev => prev ? { ...prev, settings: { ...prev.settings, ...settings } } : null);
    }
  }, [session]);

  return {
    session,
    isLive,
    isPreview,
    isConnecting,
    duration,
    viewerCount,
    health,
    inputs,
    scenes,
    activeSceneId,
    overlays,
    startPreview,
    stopPreview,
    goLive,
    stopStream,
    switchScene,
    addInput,
    removeInput,
    toggleInput,
    addOverlay,
    removeOverlay,
    toggleOverlay,
    updateSettings,
  };
}
