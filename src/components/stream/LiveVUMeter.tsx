/**
 * Live VU Meter Component
 * Real-time audio level metering for device selection panel
 * Uses DOM refs instead of React state to avoid 60fps re-renders
 */

'use client';

import { useEffect, useRef } from 'react';
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
 * Updates DOM refs directly via requestAnimationFrame (no React state updates)
 */
export function LiveVUMeter({
  sourceId,
  isMuted = false,
  showLabel = true,
  compact = false,
  className = '',
}: LiveVUMeterProps) {
  // Use refs to store values without triggering re-renders
  const peakRef = useRef(0);
  const rmsRef = useRef(0);
  const isActiveRef = useRef(false);
  const meterContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Subscribe to meter updates for this source
    // This updates refs directly - NO React state updates, NO re-renders
    const unsubscribe = subscribeMeterUpdates((data: MeterData) => {
      if (data.sourceId === sourceId) {
        peakRef.current = data.peak;
        rmsRef.current = data.rms;
        isActiveRef.current = data.isActive;
        
        // Update DOM directly from requestAnimationFrame
        updateMeterDisplay();
      }
    });

    return unsubscribe;
  }, [sourceId]);

  // Update meter display directly on DOM elements
  const updateMeterDisplay = () => {
    if (!meterContainerRef.current) return;

    const segments = meterContainerRef.current.querySelectorAll('[data-meter-segment]');
    segments.forEach((segment, i) => {
      const threshold = (i + 1) * (100 / segments.length);
      const displayValue = isMuted ? 0 : rmsRef.current;
      const shouldLight = displayValue >= threshold && isActiveRef.current;
      
      let colorClass = 'bg-surface-700';
      if (shouldLight) {
        if (threshold > 85) colorClass = 'bg-red-500';
        else if (threshold > 70) colorClass = 'bg-yellow-500';
        else colorClass = 'bg-green-500';
      }

      segment.className = `flex-1 rounded-sm transition-colors duration-75 ${colorClass}`;
    });
  };

  const getSegmentColor = (threshold: number, value: number): string => {
    if (!isActiveRef.current || isMuted || value < threshold) return 'bg-surface-700';
    if (threshold > 85) return 'bg-red-500';
    if (threshold > 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const displayValue = isMuted ? 0 : rmsRef.current;
  const displayPeak = isMuted ? 0 : peakRef.current;

  if (compact) {
    // Compact horizontal meter with minimal height
    return (
      <div ref={meterContainerRef} className={`space-y-1 ${className}`}>
        {showLabel && (
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-surface-400">Signal</span>
            {!isActiveRef.current && (
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
                data-meter-segment
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
    <div ref={meterContainerRef} className={`space-y-2 ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <span className={isActiveRef.current ? 'text-white' : 'text-surface-500'}>
            Level: {isMuted ? 'MUTED' : displayValue.toFixed(0)}%
          </span>
          {!isActiveRef.current && (
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
              data-meter-segment
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
              data-meter-segment
              className={`h-1 flex-1 rounded-sm transition-colors duration-75 ${getSegmentColor(threshold, displayPeak)}`}
            />
          );
        })}
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-2 text-[9px]">
        <div
          className={`w-1.5 h-1.5 rounded-full ${
            isActiveRef.current ? (displayValue > 0 ? 'bg-green-500' : 'bg-green-500/40') : 'bg-red-500/40'
          }`}
        />
        <span className={isActiveRef.current ? 'text-surface-400' : 'text-red-500/60'}>
          {isActiveRef.current ? 'Live' : 'Offline'}
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
  const rmsRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeMeterUpdates((data: MeterData) => {
      if (data.sourceId === sourceId) {
        rmsRef.current = data.rms;
        updateDisplay();
      }
    });

    return unsubscribe;
  }, [sourceId]);

  const updateDisplay = () => {
    if (!barRef.current) return;
    const value = isMuted ? 0 : rmsRef.current * 100;
    barRef.current.style.width = `${value}%`;
    
    // Update color classes
    barRef.current.classList.remove('bg-red-500', 'bg-yellow-500', 'bg-green-500');
    if (value > 85) {
      barRef.current.classList.add('bg-red-500');
    } else if (value > 70) {
      barRef.current.classList.add('bg-yellow-500');
    } else {
      barRef.current.classList.add('bg-green-500');
    }
  };

  return (
    <div ref={containerRef} className="w-full h-1.5 bg-surface-800 rounded-full overflow-hidden">
      <div
        ref={barRef}
        className="h-full transition-all duration-75 bg-green-500"
        style={{ width: '0%' }}
      />
    </div>
  );
}
