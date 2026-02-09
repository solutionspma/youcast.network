'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Tabs from '@/components/ui/Tabs';

type MediaItem = {
  id: string;
  title: string;
  type: string;
  status: string;
  views: number;
  duration: number | null;
  file_size: number | null;
  created_at: string;
};

const statusColors: Record<string, 'success' | 'warning' | 'info' | 'danger' | 'default'> = {
  ready: 'success',
  published: 'success',
  processing: 'warning',
  draft: 'default',
  scheduled: 'info',
  failed: 'danger',
};

function MediaTable({ items }: { items: MediaItem[] }) {
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '—';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '—';
    const mb = bytes / (1024 * 1024);
    if (mb < 1000) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (items.length === 0) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-surface-500 text-sm">No media files yet</p>
        <p className="text-surface-600 text-xs mt-1">Upload videos or start streaming to build your library</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-surface-700">
            <th className="text-left text-xs font-medium text-surface-500 uppercase tracking-wider px-4 py-3">Title</th>
            <th className="text-left text-xs font-medium text-surface-500 uppercase tracking-wider px-4 py-3">Type</th>
            <th className="text-left text-xs font-medium text-surface-500 uppercase tracking-wider px-4 py-3">Status</th>
            <th className="text-left text-xs font-medium text-surface-500 uppercase tracking-wider px-4 py-3">Views</th>
            <th className="text-left text-xs font-medium text-surface-500 uppercase tracking-wider px-4 py-3">Duration</th>
            <th className="text-left text-xs font-medium text-surface-500 uppercase tracking-wider px-4 py-3">Size</th>
            <th className="text-left text-xs font-medium text-surface-500 uppercase tracking-wider px-4 py-3">Date</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-700/50">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-surface-800/50 transition-colors">
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-8 rounded bg-surface-700 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-surface-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-white truncate max-w-[240px]">{item.title}</span>
                </div>
              </td>
              <td className="px-4 py-3.5 text-sm text-surface-400 capitalize">{item.type}</td>
              <td className="px-4 py-3.5">
                <Badge variant={statusColors[item.status] ?? 'default'} size="sm">{item.status}</Badge>
              </td>
              <td className="px-4 py-3.5 text-sm text-surface-400">{item.views.toLocaleString()}</td>
              <td className="px-4 py-3.5 text-sm text-surface-400">{formatDuration(item.duration)}</td>
              <td className="px-4 py-3.5 text-sm text-surface-400">{formatFileSize(item.file_size)}</td>
              <td className="px-4 py-3.5 text-sm text-surface-500">{formatDate(item.created_at)}</td>
              <td className="px-4 py-3.5">
                <button className="p-1 rounded hover:bg-surface-700 text-surface-400 hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function MediaLibraryPage() {
  const [mediaLibrary, setMediaLibrary] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSize, setTotalSize] = useState(0);

  useEffect(() => {
    async function fetchMedia() {
      const supabase = createClient();
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // Get user's channel
        const { data: channels } = await supabase
          .from('channels')
          .select('id')
          .eq('creator_id', user.id)
          .limit(1);

        if (!channels || channels.length === 0) {
          setLoading(false);
          return;
        }

        const channelId = channels[0].id;

        // Get media items
        const { data: media } = await supabase
          .from('media')
          .select('id, title, type, status, views, duration, file_size, created_at')
          .eq('channel_id', channelId)
          .order('created_at', { ascending: false });

        if (media) {
          setMediaLibrary(media);
          const totalBytes = media.reduce((sum, item) => sum + (item.file_size || 0), 0);
          setTotalSize(totalBytes);
        }
      } catch (error) {
        console.error('Error fetching media:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchMedia();
  }, []);

  const formatStorageSize = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return gb.toFixed(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-surface-400">Loading media library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Media Library</h1>
          <p className="text-surface-400 text-sm mt-1">
            {mediaLibrary.length} items &middot; {formatStorageSize(totalSize)} GB used
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filter
          </Button>
          <Button size="sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload
          </Button>
        </div>
      </div>

      <Tabs
        tabs={[
          {
            id: 'all',
            label: 'All Media',
            content: (
              <Card variant="default" padding="none">
                <MediaTable items={mediaLibrary} />
              </Card>
            ),
          },
          {
            id: 'videos',
            label: 'Videos',
            content: (
              <Card variant="default" padding="none">
                <MediaTable items={mediaLibrary.filter((m) => m.type === 'video')} />
              </Card>
            ),
          },
          {
            id: 'streams',
            label: 'Live Streams',
            content: (
              <Card variant="default" padding="none">
                <MediaTable items={mediaLibrary.filter((m) => m.type === 'stream')} />
              </Card>
            ),
          },
          {
            id: 'audio',
            label: 'Audio',
            content: (
              <Card variant="default" padding="none">
                <MediaTable items={mediaLibrary.filter((m) => m.type === 'audio')} />
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
