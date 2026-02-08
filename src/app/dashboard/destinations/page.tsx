'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

type Platform = 'youtube' | 'facebook' | 'twitch' | 'twitter' | 'custom';

interface StreamingDestination {
  id: string;
  platform: Platform;
  name: string;
  rtmp_url: string;
  stream_key: string;
  is_enabled: boolean;
  is_connected: boolean;
  last_stream_at: string | null;
  created_at: string;
}

const PLATFORM_INFO: Record<Platform, { name: string; icon: string; color: string; defaultRtmp: string; guide: string }> = {
  youtube: {
    name: 'YouTube',
    icon: '📺',
    color: 'text-red-500',
    defaultRtmp: 'rtmp://a.rtmp.youtube.com/live2',
    guide: 'Get your stream key from YouTube Studio → Go Live → Stream Settings'
  },
  facebook: {
    name: 'Facebook',
    icon: '📘',
    color: 'text-blue-600',
    defaultRtmp: 'rtmps://live-api-s.facebook.com:443/rtmp',
    guide: 'Get your stream key from Facebook Live Producer'
  },
  twitch: {
    name: 'Twitch',
    icon: '🎮',
    color: 'text-purple-500',
    defaultRtmp: 'rtmp://live.twitch.tv/app',
    guide: 'Get your stream key from Twitch Dashboard → Settings → Stream'
  },
  twitter: {
    name: 'Twitter/X',
    icon: '🐦',
    color: 'text-sky-500',
    defaultRtmp: 'rtmp://fa.rtmp.twitter.com/live',
    guide: 'Apply for Twitter Live Producer access first'
  },
  custom: {
    name: 'Custom RTMP',
    icon: '🔌',
    color: 'text-gray-500',
    defaultRtmp: '',
    guide: 'Enter your custom RTMP server URL and stream key'
  }
};

export default function StreamDestinationsPage() {
  const [destinations, setDestinations] = useState<StreamingDestination[]>([]);
  const [channelId, setChannelId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form state
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('youtube');
  const [destinationName, setDestinationName] = useState('');
  const [rtmpUrl, setRtmpUrl] = useState('');
  const [streamKey, setStreamKey] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchChannelAndDestinations();
  }, []);

  const fetchChannelAndDestinations = async () => {
    const supabase = createClient();
    
    // Get channel
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: channels } = await supabase
      .from('channels')
      .select('id')
      .eq('creator_id', user.id)
      .limit(1);

    if (!channels || channels.length === 0) return;

    const channelId = channels[0].id;
    setChannelId(channelId);

    // Get destinations
    const { data: dests } = await supabase
      .from('streaming_destinations')
      .select('*')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: false });

    if (dests) {
      setDestinations(dests);
    }

    setLoading(false);
  };

  const handleAddDestination = async () => {
    if (!destinationName || !rtmpUrl || !streamKey || !channelId) {
      alert('Please fill in all fields');
      return;
    }

    setSaving(true);
    const supabase = createClient();

    const { error } = await supabase
      .from('streaming_destinations')
      .insert({
        channel_id: channelId,
        platform: selectedPlatform,
        name: destinationName,
        rtmp_url: rtmpUrl,
        stream_key: streamKey,
        is_enabled: true,
      });

    if (error) {
      alert(`Failed to add destination: ${error.message}`);
    } else {
      // Reset form
      setDestinationName('');
      setRtmpUrl('');
      setStreamKey('');
      setShowAddForm(false);
      
      // Refresh list
      await fetchChannelAndDestinations();
    }

    setSaving(false);
  };

  const handleToggleDestination = async (id: string, currentState: boolean) => {
    const supabase = createClient();

    const { error } = await supabase
      .from('streaming_destinations')
      .update({ is_enabled: !currentState })
      .eq('id', id);

    if (!error) {
      setDestinations(prev =>
        prev.map(d => (d.id === id ? { ...d, is_enabled: !currentState } : d))
      );
    }
  };

  const handleDeleteDestination = async (id: string) => {
    if (!confirm('Are you sure you want to delete this destination?')) return;

    const supabase = createClient();

    const { error } = await supabase
      .from('streaming_destinations')
      .delete()
      .eq('id', id);

    if (!error) {
      setDestinations(prev => prev.filter(d => d.id !== id));
    }
  };

  const handlePlatformChange = (platform: Platform) => {
    setSelectedPlatform(platform);
    setRtmpUrl(PLATFORM_INFO[platform].defaultRtmp);
    setDestinationName(`${PLATFORM_INFO[platform].name} Stream`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-surface-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Streaming Destinations</h1>
          <p className="text-sm text-surface-400 mt-1">
            Stream to YouTube, Facebook, Twitch, and more platforms simultaneously
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancel' : '+ Add Destination'}
        </Button>
      </div>

      {/* Add Destination Form */}
      {showAddForm && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Add Streaming Destination</h2>
          
          {/* Platform Selection */}
          <div className="grid grid-cols-5 gap-2 mb-4">
            {(Object.keys(PLATFORM_INFO) as Platform[]).map(platform => (
              <button
                key={platform}
                onClick={() => handlePlatformChange(platform)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedPlatform === platform
                    ? 'border-brand-500 bg-brand-500/10'
                    : 'border-surface-700 hover:border-surface-600'
                }`}
              >
                <div className="text-2xl mb-1">{PLATFORM_INFO[platform].icon}</div>
                <div className="text-xs text-surface-400">{PLATFORM_INFO[platform].name}</div>
              </button>
            ))}
          </div>

          {/* Guide */}
          <div className="bg-surface-800/50 border border-surface-700 rounded-lg p-3 mb-4">
            <p className="text-sm text-surface-300">
              <span className="font-medium">How to get your stream key:</span>
              <br />
              {PLATFORM_INFO[selectedPlatform].guide}
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1">
                Destination Name
              </label>
              <input
                type="text"
                value={destinationName}
                onChange={(e) => setDestinationName(e.target.value)}
                placeholder="e.g., My YouTube Channel"
                className="w-full px-3 py-2 bg-surface-800 border border-surface-700 rounded-lg text-white placeholder-surface-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1">
                RTMP Server URL
              </label>
              <input
                type="text"
                value={rtmpUrl}
                onChange={(e) => setRtmpUrl(e.target.value)}
                placeholder="rtmp://..."
                className="w-full px-3 py-2 bg-surface-800 border border-surface-700 rounded-lg text-white placeholder-surface-500 font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1">
                Stream Key
              </label>
              <input
                type="password"
                value={streamKey}
                onChange={(e) => setStreamKey(e.target.value)}
                placeholder="••••••••••••••••"
                className="w-full px-3 py-2 bg-surface-800 border border-surface-700 rounded-lg text-white placeholder-surface-500 font-mono text-sm"
              />
              <p className="text-xs text-surface-500 mt-1">
                Keep your stream key private. Never share it publicly.
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddDestination} disabled={saving} className="flex-1">
                {saving ? 'Adding...' : 'Add Destination'}
              </Button>
              <Button variant="secondary" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Destinations List */}
      <div className="space-y-3">
        {destinations.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-4xl mb-3">🎥</div>
            <p className="text-surface-400">No streaming destinations yet</p>
            <p className="text-sm text-surface-500 mt-1">
              Add destinations to stream to multiple platforms simultaneously
            </p>
          </Card>
        ) : (
          destinations.map(dest => (
            <Card key={dest.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{PLATFORM_INFO[dest.platform].icon}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">{dest.name}</h3>
                      {dest.is_enabled ? (
                        <Badge variant="success" size="sm">Enabled</Badge>
                      ) : (
                        <Badge variant="default" size="sm">Disabled</Badge>
                      )}
                      {dest.is_connected && (
                        <Badge variant="live" size="sm">● Streaming</Badge>
                      )}
                    </div>
                    <p className={`text-sm ${PLATFORM_INFO[dest.platform].color}`}>
                      {PLATFORM_INFO[dest.platform].name}
                    </p>
                    {dest.last_stream_at && (
                      <p className="text-xs text-surface-500 mt-1">
                        Last used: {new Date(dest.last_stream_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleToggleDestination(dest.id, dest.is_enabled)}
                  >
                    {dest.is_enabled ? 'Disable' : 'Enable'}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteDestination(dest.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Info Card */}
      <Card className="p-4 bg-brand-500/5 border-brand-500/20">
        <div className="flex gap-3">
          <div className="text-2xl">ℹ️</div>
          <div>
            <h3 className="font-semibold text-white mb-1">How Multi-Platform Streaming Works</h3>
            <p className="text-sm text-surface-400">
              When you go live, your stream will automatically be broadcast to all enabled destinations.
              This allows you to reach audiences on YouTube, Facebook, Twitch, and other platforms simultaneously.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
