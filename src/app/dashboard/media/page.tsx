'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Tabs from '@/components/ui/Tabs';

const mediaLibrary = [
  { id: '1', title: 'Sunday Morning Service — Week 42', type: 'Live Stream', status: 'published', views: '8.4K', duration: '2:14:30', size: '4.2 GB', date: 'Feb 7, 2026' },
  { id: '2', title: 'Behind the Scenes: Studio Tour 2026', type: 'Video', status: 'published', views: '3.2K', duration: '18:42', size: '1.8 GB', date: 'Feb 6, 2026' },
  { id: '3', title: 'Creator Tips: Multi-Camera Setups', type: 'Video', status: 'published', views: '12.1K', duration: '24:15', size: '2.1 GB', date: 'Feb 4, 2026' },
  { id: '4', title: 'Midweek Devotional — Episode 128', type: 'Audio', status: 'published', views: '1.8K', duration: '32:00', size: '45 MB', date: 'Feb 3, 2026' },
  { id: '5', title: 'Easter Special Promo', type: 'Video', status: 'processing', views: '—', duration: '0:45', size: '800 MB', date: 'Feb 7, 2026' },
  { id: '6', title: 'Interview: Creator Economy in 2026', type: 'Video', status: 'draft', views: '—', duration: '45:20', size: '3.6 GB', date: 'Feb 2, 2026' },
  { id: '7', title: 'Worship Night Highlights', type: 'Video', status: 'published', views: '5.6K', duration: '8:32', size: '1.2 GB', date: 'Jan 31, 2026' },
  { id: '8', title: 'Upcoming: Easter Special', type: 'Live Stream', status: 'scheduled', views: '—', duration: '—', size: '—', date: 'Mar 15, 2026' },
];

const statusColors: Record<string, 'success' | 'warning' | 'info' | 'danger' | 'default'> = {
  published: 'success',
  processing: 'warning',
  draft: 'default',
  scheduled: 'info',
  failed: 'danger',
};

function MediaTable({ items }: { items: typeof mediaLibrary }) {
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
              <td className="px-4 py-3.5 text-sm text-surface-400">{item.type}</td>
              <td className="px-4 py-3.5">
                <Badge variant={statusColors[item.status] ?? 'default'} size="sm">{item.status}</Badge>
              </td>
              <td className="px-4 py-3.5 text-sm text-surface-400">{item.views}</td>
              <td className="px-4 py-3.5 text-sm text-surface-400">{item.duration}</td>
              <td className="px-4 py-3.5 text-sm text-surface-400">{item.size}</td>
              <td className="px-4 py-3.5 text-sm text-surface-500">{item.date}</td>
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
  const [view] = useState<'table' | 'grid'>('table');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Media Library</h1>
          <p className="text-surface-400 text-sm mt-1">{mediaLibrary.length} items &middot; 13.7 GB used</p>
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
                <MediaTable items={mediaLibrary.filter((m) => m.type === 'Video')} />
              </Card>
            ),
          },
          {
            id: 'streams',
            label: 'Live Streams',
            content: (
              <Card variant="default" padding="none">
                <MediaTable items={mediaLibrary.filter((m) => m.type === 'Live Stream')} />
              </Card>
            ),
          },
          {
            id: 'audio',
            label: 'Audio',
            content: (
              <Card variant="default" padding="none">
                <MediaTable items={mediaLibrary.filter((m) => m.type === 'Audio')} />
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
