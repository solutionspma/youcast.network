/**
 * Device Selector with Live VU Metering
 * Handles microphone/audio device selection and audio graph binding
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { LiveVUMeter } from '@/components/stream/LiveVUMeter';
import {
  addAudioSource,
  removeAudioSource,
  getAllAudioSources,
  getAudioSource,
  AudioSource,
} from '@/lib/audio/audioInitialization';

export interface DeviceInfo {
  deviceId: string;
  label: string;
  kind: 'audioinput' | 'audiooutput' | 'videoinput';
}

interface AudioDeviceSelectorProps {
  onSourceSelect?: (source: AudioSource) => void;
  onSourceRemove?: (sourceId: string) => void;
  className?: string;
  showMeterOnly?: boolean;
}

/**
 * Enumerates available audio input devices
 */
async function enumerateAudioDevices(): Promise<DeviceInfo[]> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices
      .filter((d) => d.kind === 'audioinput')
      .map((d) => ({
        deviceId: d.deviceId,
        label: d.label || `Microphone (${d.deviceId.slice(0, 5)})`,
        kind: d.kind,
      }));
  } catch (error) {
    console.error('Failed to enumerate audio devices:', error);
    return [];
  }
}

/**
 * Main device selector & audio binding component
 */
export function AudioDeviceSelector({
  onSourceSelect,
  onSourceRemove,
  className = '',
  showMeterOnly = false,
}: AudioDeviceSelectorProps) {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSources, setActiveSources] = useState<AudioSource[]>([]);

  // Enumerate devices on mount and when devices change
  useEffect(() => {
    const enumerate = async () => {
      const audioDevices = await enumerateAudioDevices();
      setDevices(audioDevices);

      // Auto-select first device
      if (audioDevices.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(audioDevices[0].deviceId);
      }
    };

    enumerate();

    // Listen for device changes
    const handleDeviceChange = () => {
      enumerate();
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    return () => {
      navigator.mediaDevices.removeEventListener(
        'devicechange',
        handleDeviceChange
      );
    };
  }, [selectedDeviceId]);

  // Update active sources list
  useEffect(() => {
    setActiveSources(getAllAudioSources());
  }, []);

  // Handle device selection and audio capture
  const handleSelectDevice = useCallback(
    async (deviceId: string) => {
      if (!deviceId) return;

      setIsLoading(true);
      setError(null);

      try {
        // Request microphone stream
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: { exact: deviceId },
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: false, // Let mixer handle gain
          },
          video: false,
        });

        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length === 0) {
          throw new Error('No audio track captured');
        }

        // Add to audio graph
        const sourceId = `mic-${selectedDeviceId}`;
        const device = devices.find((d) => d.deviceId === deviceId);

        const audioSource = await addAudioSource({
          id: sourceId,
          type: 'microphone',
          stream,
          label: device?.label || 'Microphone',
        });

        // Update active sources
        setActiveSources(getAllAudioSources());

        // Notify parent
        onSourceSelect?.(audioSource);

        console.log(`✅ Microphone selected and bound: ${deviceId}`);
        setSelectedDeviceId(deviceId);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(`Failed to initialize microphone: ${errorMsg}`);
        console.error('Microphone selection error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [devices, selectedDeviceId, onSourceSelect]
  );

  // Handle removing a source
  const handleRemoveSource = useCallback(
    (sourceId: string) => {
      removeAudioSource(sourceId);
      setActiveSources(getAllAudioSources());
      onSourceRemove?.(sourceId);
    },
    [onSourceRemove]
  );

  // Only show existing meters if showMeterOnly
  if (showMeterOnly && activeSources.length > 0) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="text-xs font-semibold text-white uppercase tracking-wider">
          Audio Levels
        </div>

        <div className="space-y-2">
          {activeSources.map((source) => (
            <div key={source.id}>
              <div className="text-[11px] text-surface-400 mb-1">
                {source.label}
              </div>
              <LiveVUMeter
                sourceId={source.id}
                compact
                showLabel={false}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Device Selection Header */}
      <div>
        <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-2">
          Microphone
        </label>

        <div className="space-y-2">
          {/* Device Dropdown */}
          <select
            value={selectedDeviceId}
            onChange={(e) => handleSelectDevice(e.target.value)}
            disabled={isLoading || devices.length === 0}
            className="w-full px-3 py-2 bg-surface-800 border border-surface-700 rounded-lg text-sm text-white
              disabled:opacity-50 disabled:cursor-not-allowed
              hover:border-surface-600 focus:outline-none focus:border-brand-500 transition-colors"
          >
            <option value="">
              {isLoading ? 'Initializing...' : 'Select microphone...'}
            </option>
            {devices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label}
              </option>
            ))}
          </select>

          {/* Error display */}
          {error && (
            <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Active Audio Sources with VU Meters */}
      {activeSources.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-white uppercase tracking-wider mb-2">
            Active Sources ({activeSources.length})
          </div>

          <div className="space-y-3">
            {activeSources.map((source) => (
              <div
                key={source.id}
                className="p-3 rounded-lg bg-surface-800/50 border border-surface-700/50 hover:border-surface-600/50 transition-colors"
              >
                {/* Source Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-white truncate">
                      {source.label}
                    </div>
                    <div className="text-[10px] text-surface-400 truncate">
                      {source.stream.getAudioTracks()[0]?.label ||
                        `ID: ${source.id}`}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex-shrink-0">
                    <div
                      className={`px-2 py-0.5 rounded text-[9px] font-medium whitespace-nowrap ${
                        source.readyState === 'live'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {source.readyState === 'live' ? '✓ Live' : '✗ Inactive'}
                    </div>
                  </div>
                </div>

                {/* VU Meter */}
                <div className="mb-2">
                  <LiveVUMeter
                    sourceId={source.id}
                    compact
                    showLabel={false}
                  />
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => handleRemoveSource(source.id)}
                  className="w-full px-2 py-1.5 text-xs font-medium rounded bg-surface-700/50 hover:bg-red-500/20
                    text-surface-400 hover:text-red-400 transition-colors"
                >
                  Remove Source
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {activeSources.length === 0 && !isLoading && (
        <div className="p-3 rounded-lg bg-surface-800/30 border border-surface-700/30 text-center">
          <p className="text-[11px] text-surface-500">
            No audio sources active
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Simplified meter-only panel for display in device selector
 */
export function MicrophoneLevelPanel() {
  const sources = getAllAudioSources();

  if (sources.length === 0) {
    return null;
  }

  const primarySource = sources[0]; // Show first source

  return (
    <div className="space-y-2">
      <div className="text-[10px] font-medium text-surface-400 uppercase tracking-wider">
        {primarySource.label}
      </div>
      <LiveVUMeter sourceId={primarySource.id} compact showLabel={true} />
    </div>
  );
}
