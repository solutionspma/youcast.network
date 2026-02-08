'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';

export default function ProfilePage() {
  const [displayName, setDisplayName] = useState('Elevation Studios');
  const [bio, setBio] = useState('Live worship broadcasts and faith-based content reaching communities worldwide.');
  const [channelSlug, setChannelSlug] = useState('elevation-studios');

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Profile & Channel</h1>
        <p className="text-surface-400 text-sm mt-1">Manage your public profile and channel settings</p>
      </div>

      {/* Profile Header */}
      <Card variant="default">
        <div className="flex items-start gap-6">
          <div className="relative group">
            <Avatar alt={displayName} size="xl" />
            <button className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-white">{displayName}</h2>
              <Badge variant="success" size="sm" dot>Verified</Badge>
            </div>
            <p className="text-sm text-surface-400 mb-1">@{channelSlug}</p>
            <p className="text-sm text-surface-400">0 subscribers &middot; 0 total views</p>
          </div>
          <Button variant="outline" size="sm">View Public Channel</Button>
        </div>
      </Card>

      {/* Edit Form */}
      <Card variant="default">
        <h3 className="text-lg font-semibold text-white mb-6">Edit Profile</h3>
        <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
          <Input
            label="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <Input
            label="Channel URL"
            value={channelSlug}
            onChange={(e) => setChannelSlug(e.target.value)}
            hint="youcast.network/@elevation-studios"
          />
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="w-full bg-surface-800 border border-surface-600 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-colors resize-none"
            />
          </div>
          <Input label="Website" placeholder="https://your-website.com" />
          <Input label="Location" placeholder="City, Country" />

          <div className="flex gap-3 pt-2">
            <Button type="submit">Save Changes</Button>
            <Button variant="ghost">Cancel</Button>
          </div>
        </form>
      </Card>

      {/* Banner */}
      <Card variant="default">
        <h3 className="text-lg font-semibold text-white mb-4">Channel Banner</h3>
        <div className="h-40 bg-surface-800 rounded-xl border-2 border-dashed border-surface-600 flex flex-col items-center justify-center hover:border-brand-500/50 transition-colors cursor-pointer">
          <svg className="w-10 h-10 text-surface-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm text-surface-500">Click to upload banner (2560 x 440 recommended)</p>
        </div>
      </Card>
    </div>
  );
}
