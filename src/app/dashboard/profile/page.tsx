'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { createClient } from '@/lib/supabase/client';

export default function ProfilePage() {
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [channelSlug, setChannelSlug] = useState('');
  const [channelId, setChannelId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Load channel data on mount
  useEffect(() => {
    async function loadChannel() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      try {
        const { data: channel, error } = await supabase
          .from('channels')
          .select('*')
          .eq('creator_id', user.id)
          .single();

        if (error) {
          // If no channel exists, create one
          if (error.code === 'PGRST116') {
            const emailPrefix = user.email?.split('@')[0] || 'user';
            const { data: newChannel, error: createError } = await supabase
              .from('channels')
              .insert({
                creator_id: user.id,
                name: `${emailPrefix}'s Channel`,
                handle: `${user.id.substring(0, 8)}-channel`,
                description: ''
              })
              .select()
              .single();

            if (createError) throw createError;
            if (newChannel) {
              setChannelId(newChannel.id);
              setDisplayName(newChannel.name);
              setChannelSlug(newChannel.handle);
              setBio(newChannel.description || '');
              setSubscriberCount(newChannel.subscriber_count || 0);
              setTotalViews(newChannel.total_views || 0);
            }
          } else {
            throw error;
          }
        } else {
          setChannelId(channel.id);
          setDisplayName(channel.name);
          setChannelSlug(channel.handle);
          setBio(channel.description || '');
          setSubscriberCount(channel.subscriber_count || 0);
          setTotalViews(channel.total_views || 0);
        }
      } catch (err) {
        console.error('Error loading channel:', err);
        alert('Failed to load channel data');
      } finally {
        setLoading(false);
      }
    }

    loadChannel();
  }, []);

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!channelId) {
      alert('Channel not found');
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('channels')
        .update({
          name: displayName,
          handle: channelSlug,
          description: bio
        })
        .eq('id', channelId);

      if (error) throw error;

      alert('Profile updated successfully!');
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleBannerClick = () => {
    bannerInputRef.current?.click();
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `banners/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      const { data: channels } = await supabase
        .from('channels')
        .select('id')
        .eq('creator_id', user.id)
        .single();

      if (channels) {
        await supabase
          .from('channels')
          .update({ banner_url: publicUrl })
          .eq('id', channels.id);
      }

      alert('Banner uploaded successfully!');
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload banner');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold text-white">Profile & Channel</h1>
          <p className="text-surface-400 text-sm mt-1">Manage your public profile and channel settings</p>
        </div>
        <Card variant="default">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-400"></div>
          </div>
        </Card>
      </div>
    );
  }

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
              <h2 className="text-xl font-bold text-white">{displayName || 'Your Channel'}</h2>
            </div>
            <p className="text-sm text-surface-400 mb-1">@{channelSlug}</p>
            <p className="text-sm text-surface-400">{subscriberCount} subscribers &middot; {totalViews} total views</p>
          </div>
          <Link href={`/c/${channelSlug}`} target="_blank">
            <Button variant="outline" size="sm">View Public Channel</Button>
          </Link>
        </div>
      </Card>

      {/* Edit Form */}
      <Card variant="default">
        <h3 className="text-lg font-semibold text-white mb-6">Edit Profile</h3>
        <form className="space-y-5" onSubmit={handleSaveChanges}>
          <Input
            label="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
          <Input
            label="Channel Handle"
            value={channelSlug}
            onChange={(e) => setChannelSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            hint={`youcast.network/c/${channelSlug}`}
            required
          />
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="w-full bg-surface-800 border border-surface-600 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-colors resize-none"
              placeholder="Tell viewers about your channel..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button variant="ghost" type="button" onClick={() => window.location.reload()}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>

      {/* Banner */}
      <Card variant="default">
        <h3 className="text-lg font-semibold text-white mb-4">Channel Banner</h3>
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/*"
          onChange={handleBannerUpload}
          className="hidden"
        />
        <div 
          onClick={handleBannerClick}
          className="h-40 bg-surface-800 rounded-xl border-2 border-dashed border-surface-600 flex flex-col items-center justify-center hover:border-brand-500/50 transition-colors cursor-pointer"
        >
          <svg className="w-10 h-10 text-surface-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {uploading ? (
            <p className="text-sm text-brand-400">Uploading...</p>
          ) : (
            <p className="text-sm text-surface-500">Click to upload banner (2560 x 440 recommended)</p>
          )}
        </div>
      </Card>
    </div>
  );
}
