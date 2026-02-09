'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Avatar from '@/components/ui/Avatar';
import DropdownMenu from '@/components/ui/DropdownMenu';
import { useAuth } from '@/lib/auth/context';
import { createClient } from '@/lib/supabase/client';

export default function DashboardHeader() {
  const { signOut } = useAuth();
  const [channelHandle, setChannelHandle] = useState<string | null>(null);

  useEffect(() => {
    async function fetchChannel() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: channel } = await supabase
          .from('channels')
          .select('handle')
          .eq('creator_id', user.id)
          .single();
        
        if (channel) {
          setChannelHandle(channel.handle);
        }
      }
    }
    
    fetchChannel();
  }, []);

  return (
    <header className="h-16 bg-surface-900/80 backdrop-blur-xl border-b border-surface-800 flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Search */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="relative w-full">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search media, channels, streams..."
            className="w-full bg-surface-800 border border-surface-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-colors"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-surface-400 hover:text-white hover:bg-surface-800 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full" />
        </button>

        {/* Go Live */}
        <Link
          href="/dashboard/stream"
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <span className="w-2 h-2 bg-white rounded-full animate-pulse-live" />
          Go Live
        </Link>

        {/* View Channel */}
        {channelHandle && (
          <Link
            href={`/c/${channelHandle}`}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-surface-800 hover:bg-surface-700 text-white text-sm font-medium rounded-lg transition-colors border border-surface-700"
            target="_blank"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View Channel
          </Link>
        )}

        {/* Profile Menu */}
        <DropdownMenu
          trigger={
            <button className="flex items-center gap-2 p-1 rounded-lg hover:bg-surface-800 transition-colors">
              <Avatar alt="Creator" size="sm" />
              <svg className="w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          }
          items={[
            { id: 'profile', label: 'My Profile', onClick: () => {} },
            { id: 'channel', label: 'Channel Settings', onClick: () => {} },
            { id: 'billing', label: 'Billing', onClick: () => {} },
            { id: 'signout', label: 'Sign Out', danger: true, onClick: signOut },
          ]}
        />
      </div>
    </header>
  );
}
