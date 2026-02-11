/**
 * Hook to bridge microphone stream from useStream to audio initialization
 * Automatically binds captured microphone to the audio graph for metering and mixing
 */

'use client';

import { useEffect, useState } from 'react';
import {
  addAudioSource,
  removeAudioSource,
  getAudioSource,
} from '@/lib/audio/audioInitialization';

interface useMicrophoneAudioBindingProps {
  audioStream: MediaStream | null;
  deviceLabel?: string;
  sourceId?: string;
}

/**
 * Hook that automatically binds microphone stream to Web Audio graph
 * Handles adding/removing audio sources as stream changes
 */
export function useMicrophoneAudioBinding({
  audioStream,
  deviceLabel = 'Microphone',
  sourceId = 'microphone-primary',
}: useMicrophoneAudioBindingProps) {
  useEffect(() => {
    if (!audioStream) {
      // Remove audio source if stream goes away
      const existingSource = getAudioSource(sourceId);
      if (existingSource) {
        removeAudioSource(sourceId);
        console.log(`🎤 Microphone unbound from audio graph`);
      }
      return;
    }

    // Check if source already bound
    const existingSource = getAudioSource(sourceId);
    if (existingSource) {
      // Already bound, update label if needed
      if (existingSource.label !== deviceLabel) {
        console.log(`🎤 Microphone label updated: ${deviceLabel}`);
      }
      return;
    }

    // Bind microphone stream to audio graph
    const bindMicrophone = async () => {
      try {
        await addAudioSource({
          id: sourceId,
          type: 'microphone',
          stream: audioStream,
          label: deviceLabel,
        });
        console.log(`✅ Microphone bound to audio graph: ${deviceLabel}`);
      } catch (error) {
        console.error('Failed to bind microphone to audio graph:', error);
      }
    };

    bindMicrophone();

    // Cleanup on unmount
    return () => {
      const source = getAudioSource(sourceId);
      if (source) {
        removeAudioSource(sourceId);
      }
    };
  }, [audioStream, deviceLabel, sourceId]);
}

/**
 * Hook that provides microphone status and binding info
 */
export function useMicrophoneStatus(sourceId: string = 'microphone-primary') {
  const [isActive, setIsActive] = useState(false);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const checkStatus = () => {
      const source = getAudioSource(sourceId);
      if (source) {
        setIsActive(true);
        setIsLive(source.readyState === 'live');
      } else {
        setIsActive(false);
        setIsLive(false);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 500);
    return () => clearInterval(interval);
  }, [sourceId]);

  return { isActive, isLive };
}
