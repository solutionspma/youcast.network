'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Toggle from '@/components/ui/Toggle';
import Tabs from '@/components/ui/Tabs';
import Badge from '@/components/ui/Badge';

function GeneralSettings() {
  const [channelPublic, setChannelPublic] = useState(true);
  const [allowComments, setAllowComments] = useState(true);
  const [autoPublish, setAutoPublish] = useState(false);

  return (
    <div className="space-y-6 max-w-3xl">
      <Card variant="default">
        <h3 className="text-lg font-semibold text-white mb-6">Channel Settings</h3>
        <div className="space-y-5">
          <Toggle checked={channelPublic} onChange={setChannelPublic} label="Public Channel" description="Allow anyone to discover and view your channel" />
          <Toggle checked={allowComments} onChange={setAllowComments} label="Allow Comments" description="Enable comments on your videos and streams" />
          <Toggle checked={autoPublish} onChange={setAutoPublish} label="Auto-Publish Recordings" description="Automatically publish stream recordings after going offline" />
        </div>
      </Card>

      <Card variant="default">
        <h3 className="text-lg font-semibold text-white mb-6">Default Upload Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Default Visibility</label>
            <select className="w-full bg-surface-800 border border-surface-600 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500">
              <option>Public</option>
              <option>Unlisted</option>
              <option>Private</option>
              <option>Subscribers Only</option>
            </select>
          </div>
          <Input label="Default Category" placeholder="e.g., Education, Worship, Tech" />
          <Input label="Default Tags" placeholder="Comma-separated tags" />
        </div>
      </Card>
    </div>
  );
}

function StreamSettings() {
  const [lowLatency, setLowLatency] = useState(true);
  const [dvr, setDvr] = useState(true);
  const [record, setRecord] = useState(true);

  return (
    <div className="space-y-6 max-w-3xl">
      <Card variant="default">
        <h3 className="text-lg font-semibold text-white mb-6">Stream Configuration</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Default Resolution</label>
            <select className="w-full bg-surface-800 border border-surface-600 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500">
              <option>1080p (1920x1080)</option>
              <option>720p (1280x720)</option>
              <option>4K (3840x2160)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Framerate</label>
            <select className="w-full bg-surface-800 border border-surface-600 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500">
              <option>30 fps</option>
              <option>60 fps</option>
            </select>
          </div>
          <Input label="Bitrate (kbps)" placeholder="4500" type="number" />
        </div>
      </Card>

      <Card variant="default">
        <h3 className="text-lg font-semibold text-white mb-6">Stream Options</h3>
        <div className="space-y-5">
          <Toggle checked={lowLatency} onChange={setLowLatency} label="Low Latency Mode" description="Reduce stream delay for real-time interaction" />
          <Toggle checked={dvr} onChange={setDvr} label="DVR / Rewind" description="Allow viewers to rewind the live stream" />
          <Toggle checked={record} onChange={setRecord} label="Record Streams" description="Save recordings of all live streams" />
        </div>
      </Card>
    </div>
  );
}

function ApiSettings() {
  const apiKeys = [
    { name: 'Production Key', prefix: 'yc_prod_****', created: 'Jan 15, 2026', lastUsed: '2 hours ago' },
    { name: 'Development Key', prefix: 'yc_dev_****', created: 'Feb 1, 2026', lastUsed: '1 day ago' },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <Card variant="default">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">API Keys</h3>
          <Button size="sm">Generate New Key</Button>
        </div>
        <div className="space-y-3">
          {apiKeys.map((key) => (
            <div key={key.name} className="p-4 rounded-lg bg-surface-800/50 border border-surface-700/50 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{key.name}</span>
                  <code className="text-xs bg-surface-700 text-surface-300 px-2 py-0.5 rounded">{key.prefix}</code>
                </div>
                <span className="text-xs text-surface-500">Created {key.created} &middot; Last used {key.lastUsed}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">Copy</Button>
                <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">Revoke</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card variant="default">
        <h3 className="text-lg font-semibold text-white mb-4">Webhooks</h3>
        <p className="text-sm text-surface-400 mb-4">Configure webhook endpoints to receive real-time event notifications.</p>
        <Button variant="outline" size="sm">Add Webhook Endpoint</Button>
      </Card>

      <Card variant="default">
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-lg font-semibold text-white">API Documentation</h3>
          <Badge variant="info" size="sm">Preview</Badge>
        </div>
        <p className="text-sm text-surface-400 mb-4">
          Access the full Youcast API for programmatic content management, analytics, and automation.
        </p>
        <Button variant="outline" size="sm">View API Docs</Button>
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-surface-400 text-sm mt-1">Configure your channel, streaming, and API access</p>
      </div>

      <Tabs
        tabs={[
          { id: 'general', label: 'General', content: <GeneralSettings /> },
          { id: 'stream', label: 'Streaming', content: <StreamSettings /> },
          { id: 'api', label: 'API & Integrations', content: <ApiSettings /> },
          { id: 'notifications', label: 'Notifications', content: (
            <div className="max-w-3xl">
              <Card variant="default">
                <h3 className="text-lg font-semibold text-white mb-6">Notification Preferences</h3>
                <div className="space-y-5">
                  <Toggle checked={true} onChange={() => {}} label="New Subscriber" description="Get notified when someone subscribes" />
                  <Toggle checked={true} onChange={() => {}} label="New Comments" description="Get notified for comments on your content" />
                  <Toggle checked={false} onChange={() => {}} label="Stream Milestones" description="Alerts for viewer count milestones during streams" />
                  <Toggle checked={true} onChange={() => {}} label="Revenue Updates" description="Weekly revenue summary and payout notifications" />
                  <Toggle checked={false} onChange={() => {}} label="Marketing Emails" description="Product updates and feature announcements" />
                </div>
              </Card>
            </div>
          )},
        ]}
      />
    </div>
  );
}
