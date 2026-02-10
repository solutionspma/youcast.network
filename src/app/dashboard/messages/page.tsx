'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { isMasterAccount } from '@/lib/auth/master';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
  sender?: { display_name: string; avatar_url: string | null };
  receiver?: { display_name: string; avatar_url: string | null };
}

interface Conversation {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

type UserTier = 'guest' | 'free' | 'creator' | 'pro' | 'enterprise';

export default function MessagesPage() {
  const [user, setUser] = useState<any>(null);
  const [userTier, setUserTier] = useState<UserTier>('free');
  const [canSend, setCanSend] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        window.location.href = '/auth/login?redirect=/dashboard/messages';
        return;
      }
      
      setUser(authUser);
      
      // Check if master account - bypasses all restrictions
      const masterAccess = isMasterAccount(authUser.email);
      
      // Get user profile for tier
      const { data: profile } = await supabase
        .from('profiles')
        .select('tier')
        .eq('id', authUser.id)
        .single();
      
      const tier = (profile?.tier || 'free') as UserTier;
      setUserTier(tier);
      
      // Master account or creator+ tier can send messages
      setCanSend(masterAccess || !['guest', 'free'].includes(tier));
      
      // Load conversations
      await loadConversations(authUser.id);
      setLoading(false);
    }
    
    loadData();
  }, []);

  async function loadConversations(userId: string) {
    const supabase = createClient();
    
    // Get all messages where user is sender or receiver
    const { data: messagesData } = await supabase
      .from('direct_messages')
      .select(`
        id,
        sender_id,
        receiver_id,
        content,
        created_at,
        read_at,
        sender:profiles!direct_messages_sender_id_fkey(display_name, avatar_url),
        receiver:profiles!direct_messages_receiver_id_fkey(display_name, avatar_url)
      `)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    
    if (!messagesData) return;
    
    // Group by conversation partner
    const conversationMap = new Map<string, Conversation>();
    
    for (const msg of messagesData) {
      const partnerId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
      const partner = msg.sender_id === userId ? msg.receiver : msg.sender;
      
      if (!conversationMap.has(partnerId)) {
        const unreadCount = messagesData.filter(
          m => m.sender_id === partnerId && m.receiver_id === userId && !m.read_at
        ).length;
        
        conversationMap.set(partnerId, {
          user_id: partnerId,
          display_name: (partner as any)?.display_name || 'Unknown',
          avatar_url: (partner as any)?.avatar_url || null,
          last_message: msg.content,
          last_message_time: msg.created_at,
          unread_count: unreadCount,
        });
      }
    }
    
    setConversations(Array.from(conversationMap.values()));
  }

  async function loadMessages(conversationUserId: string) {
    if (!user) return;
    
    const supabase = createClient();
    
    const { data: messagesData } = await supabase
      .from('direct_messages')
      .select(`
        id,
        sender_id,
        receiver_id,
        content,
        created_at,
        read_at,
        sender:profiles!direct_messages_sender_id_fkey(display_name, avatar_url),
        receiver:profiles!direct_messages_receiver_id_fkey(display_name, avatar_url)
      `)
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${conversationUserId}),and(sender_id.eq.${conversationUserId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });
    
    if (messagesData) {
      setMessages(messagesData as unknown as Message[]);
      
      // Mark messages as read
      await supabase.rpc('mark_messages_read', {
        p_sender_id: conversationUserId,
        p_receiver_id: user.id,
      });
      
      // Update unread count in conversations
      setConversations(prev => 
        prev.map(c => 
          c.user_id === conversationUserId ? { ...c, unread_count: 0 } : c
        )
      );
    }
  }

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !canSend || sending) return;
    
    setSending(true);
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('direct_messages')
      .insert({
        sender_id: user.id,
        receiver_id: selectedConversation,
        content: newMessage.trim(),
      })
      .select(`
        id,
        sender_id,
        receiver_id,
        content,
        created_at,
        read_at,
        sender:profiles!direct_messages_sender_id_fkey(display_name, avatar_url),
        receiver:profiles!direct_messages_receiver_id_fkey(display_name, avatar_url)
      `)
      .single();
    
    if (data && !error) {
      setMessages(prev => [...prev, data as unknown as Message]);
      setNewMessage('');
      
      // Update conversation preview
      setConversations(prev => 
        prev.map(c => 
          c.user_id === selectedConversation 
            ? { ...c, last_message: newMessage.trim(), last_message_time: data.created_at }
            : c
        )
      );
    }
    
    setSending(false);
  }

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return date.toLocaleDateString('en-US', { weekday: 'short' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Free tier upgrade message
  if (!canSend) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-surface-900/50 rounded-2xl border border-surface-800/50 p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-brand-500/20 to-accent-purple/20 flex items-center justify-center">
            <svg className="w-10 h-10 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h1 className="text-3xl font-display font-bold text-white mb-4">
            Messaging is a Paid Feature
          </h1>
          <p className="text-surface-400 text-lg max-w-md mx-auto mb-8">
            Direct messaging is available for Creator tier and above. Upgrade your plan to connect directly with other creators and your audience.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard/settings#subscription"
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-medium hover:opacity-90 transition-opacity"
            >
              Upgrade to Creator
            </Link>
            <Link
              href="/creators"
              className="px-8 py-3 rounded-xl bg-surface-800 text-white font-medium hover:bg-surface-700 transition-colors"
            >
              View Plans
            </Link>
          </div>
          <div className="mt-8 pt-8 border-t border-surface-800/50">
            <h3 className="text-lg font-semibold text-white mb-4">What you get with messaging:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-2xl mx-auto">
              <div className="p-4 rounded-xl bg-surface-800/30">
                <div className="text-brand-400 mb-2">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                </div>
                <div className="font-medium text-white">Creator Network</div>
                <div className="text-sm text-surface-400">Connect with other creators</div>
              </div>
              <div className="p-4 rounded-xl bg-surface-800/30">
                <div className="text-brand-400 mb-2">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a3.354 3.354 0 00-.976-2.04l-.052-.052a2.25 2.25 0 00-3.182 0l-4.5 4.5a2.25 2.25 0 000 3.182l.052.052a3.354 3.354 0 002.04.976l1.188-.118a2.25 2.25 0 001.697-1.008l1.708-2.563a1.125 1.125 0 00-1.697-1.46L14.49 9.88" />
                  </svg>
                </div>
                <div className="font-medium text-white">Fan Engagement</div>
                <div className="text-sm text-surface-400">Message your subscribers</div>
              </div>
              <div className="p-4 rounded-xl bg-surface-800/30">
                <div className="text-brand-400 mb-2">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                  </svg>
                </div>
                <div className="font-medium text-white">Collaboration</div>
                <div className="text-sm text-surface-400">Plan projects together</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] flex">
      {/* Conversations List */}
      <div className="w-80 border-r border-surface-800/50 flex flex-col">
        <div className="p-4 border-b border-surface-800/50">
          <h1 className="text-xl font-display font-bold text-white">Messages</h1>
        </div>
        
        {conversations.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-6 text-center">
            <div>
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-surface-800/50 flex items-center justify-center">
                <svg className="w-6 h-6 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
              </div>
              <p className="text-sm text-surface-400">No conversations yet</p>
              <p className="text-xs text-surface-500 mt-1">Start by messaging a creator</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {conversations.map((conv) => (
              <button
                key={conv.user_id}
                onClick={() => setSelectedConversation(conv.user_id)}
                className={`w-full p-4 flex items-start gap-3 hover:bg-surface-800/50 transition-colors text-left ${
                  selectedConversation === conv.user_id ? 'bg-surface-800/50' : ''
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-surface-700 flex-shrink-0 flex items-center justify-center text-white font-medium">
                  {conv.avatar_url ? (
                    <img src={conv.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    conv.display_name.charAt(0)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-white truncate">{conv.display_name}</span>
                    <span className="text-xs text-surface-500 flex-shrink-0 ml-2">
                      {formatTime(conv.last_message_time)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-surface-400 truncate">{conv.last_message}</p>
                    {conv.unread_count > 0 && (
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-500 text-white text-xs flex items-center justify-center">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-surface-800/50 flex items-center gap-3">
              {(() => {
                const conv = conversations.find(c => c.user_id === selectedConversation);
                return conv ? (
                  <>
                    <div className="w-10 h-10 rounded-full bg-surface-700 flex items-center justify-center text-white font-medium">
                      {conv.avatar_url ? (
                        <img src={conv.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        conv.display_name.charAt(0)
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-white">{conv.display_name}</div>
                    </div>
                  </>
                ) : null;
              })()}
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => {
                const isOwn = msg.sender_id === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      isOwn 
                        ? 'bg-brand-500 text-white' 
                        : 'bg-surface-800 text-white'
                    }`}>
                      <p>{msg.content}</p>
                      <p className={`text-xs mt-1 ${isOwn ? 'text-white/70' : 'text-surface-500'}`}>
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input */}
            <form onSubmit={handleSend} className="p-4 border-t border-surface-800/50">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-surface-800/50 border border-surface-700/50 rounded-xl px-4 py-3 text-white placeholder-surface-500 focus:outline-none focus:border-surface-600"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="p-3 rounded-xl bg-brand-500 text-white hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface-800/50 flex items-center justify-center">
                <svg className="w-8 h-8 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Select a conversation</h3>
              <p className="text-surface-400">Choose a conversation from the list to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
