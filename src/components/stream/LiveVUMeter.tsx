/**
 * Live VU Meter Component
 * Real-time audio level metering for device selection panel
 */

'use client';

import { useState, useEffect } from 'react';
import { subscribeMeterUpdates, MeterData } from '@/lib/audio/audioInitialization';

interface LiveVUMeterProps {
  sourceId: string;
  isMuted?: boolean;
  showLabel?: boolean;
  compact?: boolean;
  className?: string;
}

/**
 * Real-time VU meter with peak and RMS display
 * Updates via requestAnimationFrame from audio analyzer
 */
export function LiveVUMeter({
  sourceId,
  isMuted = false,
  showLabel = true,
  compact = false,
  className = '',
}: LiveVUMeterProps) {
  const [peak, setPeak] = useState(0);
  const [rms, setRms] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    // Subscribe to meter updates for this source
    const unsubscribe = subscribeMeterUpdates((data: MeterData) => {
      if (data.sourceId === sourceId) {
        setPeak(data.peak);
        setRms(data.rms);
        setIsActive(data.isActive);
      }
    });

    return unsubscribe;
  }, [sourceId]);

  const getSegmentColor = (threshold: number, value: number): string => {
    if (!isActive || isMuted || value < threshold) return 'bg-surface-700';
    if (threshold > 85) return 'bg-red-500';
    if (threshold > 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const displayValue = isMuted ? 0 : rms;
  const displayPeak = isMuted ? 0 : peak;
  const noSignal = displayPeak < 1 && displayValue < 1 && isActive;

  if (compact) {
    // Compact horizontal meter with minimal height
    return (
      <div className={`space-y-1 ${className}`}>
        {showLabel && (
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-surface-400">Signal</span>
            {!isActive && (
              <span className="text-surface-600 text-[8px]">OFFLINE</span>
            )}
          </div>
        )}

        <div className="flex gap-0.5 h-1.5">
          {Array.from({ length: 12 }).map((_, i) => {
            const threshold = (i + 1) * (100 / 12);
            return (
              <div
                key={`segment-${i}`}
                className={`flex-1 rounded-sm transition-colors duration-75 ${getSegmentColor(threshold, displayValue)}`}
              />
            );
          })}
        </div>

        {displayValue > 0 && (
          <div className="text-[9px] text-surface-400 text-right">
            {displayValue.toFixed(0)}%
          </div>
        )}
      </div>
    );
  }

  // Full meter with RMS + Peak
  return (
    <div className={`space-y-2 ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <span className={isActive ? 'text-white' : 'text-surface-500'}>
            Level: {isMuted ? 'MUTED' : displayValue.toFixed(0)}%
          </span>
          {!isActive && (
            <span className="text-surface-600 text-[9px] uppercase tracking-tight">
              No Signal
            </span>
          )}
        </div>
      )}

      {/* RMS Bar (darker, main level) */}
      <div className="flex gap-0.5">
        {Array.from({ length: 20 }).map((_, i) => {
          const threshold = (i + 1) * 5;
          return (
            <div
              key={`rms-${i}`}
              className={`h-2 flex-1 rounded-sm transition-colors duration-75 ${getSegmentColor(threshold, displayValue)} opacity-70`}
            />
          );
        })}
      </div>

      {/* Peak Bar (brighter, peak level) */}
      <div className="flex gap-0.5">
        {Array.from({ length: 20 }).map((_, i) => {
          const threshold = (i + 1) * 5;
          return (
            <div
              key={`peak-${i}`}
              className={`h-1 flex-1 rounded-sm transition-colors duration-75 ${getSegmentColor(threshold, displayPeak)}`}
            />
          );
        })}
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-2 text-[9px]">
        <div
          className={`w-1.5 h-1.5 rounded-full ${
            isActive ? (displayValue > 0 ? 'bg-green-500' : 'bg-green-500/40') : 'bg-red-500/40'
          }`}
        />
        <span className={isActive ? 'text-surface-400' : 'text-red-500/60'}>
          {isActive ? 'Live' : 'Offline'}
        </span>
      </div>
    </div>
  );
}

/**
 * Inline compact meter for mixing/selection
 */
export function CompactVUMeter({
  sourceId,
  isMuted = false,
}: {
  sourceId: string;
  isMuted?: boolean;
}) {
  const [rms, setRms] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeMeterUpdates((data: MeterData) => {
      if (data.sourceId === sourceId) {
        setRms(data.rms);
      }
    });

    return unsubscribe;
  }, [sourceId]);

  const value = isMuted ? 0 : rms;

  return (
    <div className="w-full h-1.5 bg-surface-800 rounded-full overflow-hidden">
      <div
        className={`h-full transition-all duration-75 ${
          value > 85 ? 'bg-red-500' : value > 70 ? 'bg-yellow-500' : 'bg-green-500'
        }`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
