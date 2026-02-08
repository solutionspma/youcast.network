'use client';

import { useState } from 'react';
import Badge from '@/components/ui/Badge';

interface ChatMessage {
  id: string;
  username: string;
  avatar?: string;
  message: string;
  timestamp: string;
  type: 'message' | 'superchat' | 'system' | 'moderator';
  amount?: number;
}

interface StreamChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  viewerCount: number;
  isLive: boolean;
}

export default function StreamChat({ messages, onSendMessage, viewerCount, isLive }: StreamChatProps) {
  const [newMessage, setNewMessage] = useState('');
  const [slowMode, setSlowMode] = useState(false);

  const handleSend = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  const messageColors: Record<ChatMessage['type'], string> = {
    message: 'text-surface-300',
    superchat: 'text-yellow-300',
    system: 'text-surface-500 italic',
    moderator: 'text-green-400',
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-surface-700/50">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white">Live Chat</h3>
          {isLive && (
            <span className="text-[10px] text-surface-400 bg-surface-800 px-1.5 py-0.5 rounded">
              {viewerCount.toLocaleString()} watching
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSlowMode(!slowMode)}
            className={`p-1.5 rounded transition-colors ${
              slowMode ? 'bg-yellow-500/20 text-yellow-400' : 'text-surface-500 hover:text-surface-300'
            }`}
            title="Slow Mode"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button className="p-1.5 rounded text-surface-500 hover:text-surface-300 transition-colors" title="Chat Settings">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {messages.map((msg) => (
          <div key={msg.id} className={msg.type === 'superchat' ? 'p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20' : ''}>
            <div className="flex gap-1.5 text-xs leading-relaxed">
              {msg.type === 'system' ? (
                <span className={messageColors[msg.type]}>{msg.message}</span>
              ) : (
                <>
                  <span className={`font-semibold flex-shrink-0 ${
                    msg.type === 'moderator' ? 'text-green-400' : 'text-brand-400'
                  }`}>
                    {msg.username}
                  </span>
                  <span className={messageColors[msg.type]}>
                    {msg.message}
                  </span>
                  {msg.type === 'superchat' && msg.amount && (
                    <Badge variant="warning" size="sm" className="ml-auto flex-shrink-0">${msg.amount}</Badge>
                  )}
                </>
              )}
            </div>
          </div>
        ))}

        {!isLive && (
          <div className="text-center py-8">
            <p className="text-xs text-surface-500">Chat is offline</p>
            <p className="text-[10px] text-surface-600 mt-1">Go live to enable chat</p>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-surface-700/50">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isLive ? 'Send a message...' : 'Chat offline'}
            disabled={!isLive}
            className="flex-1 bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-surface-500 focus:outline-none focus:ring-1 focus:ring-brand-500/50 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!isLive || !newMessage.trim()}
            className="px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        {slowMode && (
          <p className="text-[10px] text-yellow-400 mt-1.5">Slow mode enabled — 30s between messages</p>
        )}
      </div>
    </div>
  );
}
