'use client';

import Badge from '@/components/ui/Badge';

interface StreamPreviewProps {
  isLive: boolean;
  isPreview: boolean;
  viewerCount: number;
  duration: string;
  activeScene: string;
}

export default function StreamPreview({ isLive, isPreview, viewerCount, duration, activeScene }: StreamPreviewProps) {
  return (
    <div className="relative w-full aspect-video bg-surface-900 rounded-xl overflow-hidden border border-surface-700/50">
      {/* Preview Canvas */}
      <div className="absolute inset-0 flex items-center justify-center">
        {isLive || isPreview ? (
          <div className="w-full h-full bg-gradient-to-br from-surface-800 via-surface-900 to-black flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-surface-700/50 flex items-center justify-center">
                <svg className="w-10 h-10 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm text-surface-500">
                {isLive ? 'Live Output' : 'Preview Output'}
              </p>
              <p className="text-xs text-surface-600 mt-1">Camera feed will appear here</p>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-surface-800 flex items-center justify-center">
              <svg className="w-10 h-10 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-surface-400 text-sm font-medium">Stream Offline</p>
            <p className="text-surface-600 text-xs mt-1">Start a preview or go live to begin</p>
          </div>
        )}
      </div>

      {/* Top-left Status + Scene */}
      <div className="absolute top-3 left-3 flex items-center gap-2">
        {isLive && <Badge variant="live" size="sm">LIVE</Badge>}
        {isPreview && !isLive && <Badge variant="warning" size="sm">PREVIEW</Badge>}
        <span className="text-xs text-surface-300 bg-black/60 backdrop-blur-sm px-2 py-1 rounded">
          {activeScene}
        </span>
      </div>

      {/* Top-right Stats */}
      {(isLive || isPreview) && (
        <div className="absolute top-3 right-3 flex items-center gap-3">
          {isLive && (
            <span className="text-xs text-surface-300 bg-black/60 backdrop-blur-sm px-2 py-1 rounded flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {viewerCount.toLocaleString()}
            </span>
          )}
          <span className="text-xs font-mono text-surface-300 bg-black/60 backdrop-blur-sm px-2 py-1 rounded">
            {duration}
          </span>
        </div>
      )}

      {/* Bottom Bar — Resolution / Bitrate / FPS */}
      {(isLive || isPreview) && (
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <div className="flex gap-2">
            <span className="text-[10px] text-surface-400 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded">1080p</span>
            <span className="text-[10px] text-surface-400 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded">4500 kbps</span>
            <span className="text-[10px] text-surface-400 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded">30 fps</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-live-500 animate-pulse-live' : 'bg-yellow-500'}`} />
            <span className="text-[10px] text-surface-400 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded">
              {isLive ? 'Streaming' : 'Preview Only'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
