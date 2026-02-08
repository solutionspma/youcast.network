import type { Metadata } from 'next';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';

export const metadata: Metadata = { title: 'Watch' };

const categories = ['All', 'Live Now', 'Podcasts', 'Worship', 'Tech', 'Gaming', 'News', 'Education', 'Entertainment'];

const mediaItems = [
  { id: '1', title: 'Sunday Morning Worship — Live from Elevation', channel: 'Elevation Studios', views: '24K watching', duration: 'LIVE', category: 'Worship', isLive: true },
  { id: '2', title: 'Building a SaaS in 48 Hours — Day 1', channel: 'Devstream', views: '89K views', duration: '2:14:30', category: 'Tech', isLive: false },
  { id: '3', title: 'Global Headlines: February 2026', channel: 'The Daily Brief', views: '340K views', duration: '45:12', category: 'News', isLive: false },
  { id: '4', title: 'Guided Morning Meditation — 20 Min', channel: 'MindFlow Podcast', views: '18K views', duration: '20:00', category: 'Health', isLive: false },
  { id: '5', title: 'Tournament Finals — Apex Legends', channel: 'GameVault', views: '12K watching', duration: 'LIVE', category: 'Gaming', isLive: true },
  { id: '6', title: 'Color Grading Masterclass', channel: 'Creator Lab', views: '67K views', duration: '1:32:45', category: 'Education', isLive: false },
  { id: '7', title: 'Indie Music Showcase — February Edition', channel: 'SoundStage', views: '8.5K views', duration: '58:20', category: 'Entertainment', isLive: false },
  { id: '8', title: 'Startup Pitch Night — Live Panel', channel: 'Founder FM', views: '5.2K watching', duration: 'LIVE', category: 'Tech', isLive: true },
  { id: '9', title: 'Deep Dive: AI in 2026', channel: 'Devstream', views: '120K views', duration: '1:05:42', category: 'Tech', isLive: false },
  { id: '10', title: 'Youth Night — Live Worship & Teaching', channel: 'Elevation Studios', views: '9.8K watching', duration: 'LIVE', category: 'Worship', isLive: true },
  { id: '11', title: 'The Psychology of Productivity', channel: 'MindFlow Podcast', views: '45K views', duration: '38:15', category: 'Education', isLive: false },
  { id: '12', title: 'Retro Game Marathon — 12 Hour Stream', channel: 'GameVault', views: '31K views', duration: '12:00:00', category: 'Gaming', isLive: false },
];

function MediaCard({ item }: { item: typeof mediaItems[0] }) {
  return (
    <Card padding="none" hover variant="default" className="overflow-hidden group">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-surface-800 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/40 to-surface-900/60 flex items-center justify-center">
          <svg className="w-12 h-12 text-white/20 group-hover:text-white/40 transition-colors" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
        {/* Duration / Live badge */}
        <div className="absolute bottom-2 right-2">
          {item.isLive ? (
            <Badge variant="live" size="sm" dot>LIVE</Badge>
          ) : (
            <span className="bg-black/80 text-white text-xs font-medium px-1.5 py-0.5 rounded">
              {item.duration}
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex gap-3">
          <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
            {item.channel[0]}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white line-clamp-2 leading-snug mb-1 group-hover:text-brand-400 transition-colors">
              {item.title}
            </h3>
            <p className="text-xs text-surface-400 truncate">{item.channel}</p>
            <p className="text-xs text-surface-500 mt-0.5">{item.views}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function WatchPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Watch</h1>
        <p className="text-surface-400">Discover live streams, videos, and podcasts from the Youcast network.</p>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide">
        {categories.map((cat, i) => (
          <button
            key={cat}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              i === 0
                ? 'bg-brand-600 text-white'
                : 'bg-surface-800 text-surface-400 hover:bg-surface-700 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Live Now Section */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-5">
          <Badge variant="live" size="md" dot>Live Now</Badge>
          <span className="text-sm text-surface-400">
            {mediaItems.filter((m) => m.isLive).length} streams
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {mediaItems.filter((m) => m.isLive).map((item) => (
            <MediaCard key={item.id} item={item} />
          ))}
        </div>
      </div>

      {/* All Content */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-5">Trending</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {mediaItems.filter((m) => !m.isLive).map((item) => (
            <MediaCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
