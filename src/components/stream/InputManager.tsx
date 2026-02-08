'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

interface StreamInput {
  id: string;
  name: string;
  type: 'camera' | 'screen' | 'audio' | 'media';
  status: 'active' | 'inactive' | 'error';
  thumbnail?: string;
}

interface InputManagerProps {
  inputs: StreamInput[];
  onAddInput: () => void;
  onRemoveInput: (id: string) => void;
  onToggleInput: (id: string) => void;
}

const inputIcons: Record<StreamInput['type'], JSX.Element> = {
  camera: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  screen: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  audio: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  ),
  media: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
};

const statusColors: Record<StreamInput['status'], string> = {
  active: 'bg-green-500',
  inactive: 'bg-surface-500',
  error: 'bg-red-500',
};

export default function InputManager({ inputs, onAddInput, onRemoveInput, onToggleInput }: InputManagerProps) {
  const [expandedInput, setExpandedInput] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Sources</h3>
        <button
          onClick={onAddInput}
          className="w-6 h-6 flex items-center justify-center rounded bg-surface-700 hover:bg-surface-600 text-surface-400 hover:text-white transition-colors text-lg leading-none"
          title="Add Source"
        >
          +
        </button>
      </div>

      <div className="space-y-1.5">
        {inputs.map((input) => (
          <div key={input.id}>
            <div
              className={`group flex items-center gap-2.5 p-2.5 rounded-lg cursor-pointer transition-all ${
                expandedInput === input.id
                  ? 'bg-surface-700/80 border border-brand-500/30'
                  : 'bg-surface-800/50 hover:bg-surface-700/50 border border-transparent'
              }`}
              onClick={() => setExpandedInput(expandedInput === input.id ? null : input.id)}
            >
              {/* Thumbnail */}
              <div className="w-10 h-10 rounded-md bg-surface-700 flex items-center justify-center flex-shrink-0 text-surface-400">
                {inputIcons[input.type]}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${statusColors[input.status]}`} />
                  <span className="text-sm text-white truncate">{input.name}</span>
                </div>
                <span className="text-[10px] text-surface-500 capitalize">{input.type}</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleInput(input.id); }}
                  className="w-6 h-6 flex items-center justify-center rounded hover:bg-surface-600 text-surface-400 hover:text-white transition-colors"
                  title={input.status === 'active' ? 'Deactivate' : 'Activate'}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {input.status === 'active' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    )}
                  </svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onRemoveInput(input.id); }}
                  className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-500/20 text-surface-400 hover:text-red-400 transition-colors"
                  title="Remove"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Expanded Details */}
            {expandedInput === input.id && (
              <div className="mt-1 ml-2.5 p-3 rounded-lg bg-surface-800/30 border border-surface-700/30 space-y-2 text-xs">
                <div className="flex justify-between text-surface-400">
                  <span>Status</span>
                  <Badge variant={input.status === 'active' ? 'success' : input.status === 'error' ? 'danger' : 'default'} size="sm">
                    {input.status}
                  </Badge>
                </div>
                <div className="flex justify-between text-surface-400">
                  <span>Type</span>
                  <span className="text-surface-300 capitalize">{input.type}</span>
                </div>
                {input.type === 'camera' && (
                  <div className="flex justify-between text-surface-400">
                    <span>Resolution</span>
                    <span className="text-surface-300">1920x1080</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {inputs.length === 0 && (
          <div className="text-center py-6">
            <p className="text-xs text-surface-500">No sources added</p>
            <Button variant="ghost" size="sm" className="mt-2" onClick={onAddInput}>Add Source</Button>
          </div>
        )}
      </div>
    </div>
  );
}
