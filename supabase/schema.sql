-- ============================================================================
-- YOUCAST PLATFORM - COMPLETE DATABASE SCHEMA
-- Production-grade schema for creator streaming platform
-- ============================================================================

-- ============================================================================
-- 1. PROFILES & USER MANAGEMENT
-- ============================================================================

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'viewer' CHECK (role IN ('viewer', 'creator', 'admin', 'master_admin')),
  bio TEXT,
  website TEXT,
  social_links JSONB DEFAULT '{}',
  is_verified BOOLEAN DEFAULT false,
  is_suspended BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'viewer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 2. CHANNELS
-- ============================================================================

CREATE TABLE IF NOT EXISTS channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  handle TEXT UNIQUE NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  banner_url TEXT,
  category TEXT,
  subscriber_count INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Channels are viewable by everyone" ON channels FOR SELECT USING (true);
CREATE POLICY "Creators can manage own channels" ON channels FOR ALL USING (auth.uid() = creator_id);

CREATE INDEX idx_channels_creator ON channels(creator_id);
CREATE INDEX idx_channels_handle ON channels(handle);

-- ============================================================================
-- 3. STREAMS
-- ============================================================================

CREATE TABLE IF NOT EXISTS streams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  status TEXT DEFAULT 'offline' CHECK (status IN ('offline', 'preview', 'live', 'ended')),
  stream_key TEXT UNIQUE,
  webrtc_room_id TEXT,
  viewer_count INTEGER DEFAULT 0,
  peak_viewers INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE streams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Live streams are viewable by everyone" ON streams FOR SELECT USING (status = 'live');
CREATE POLICY "Creators can manage own streams" ON streams FOR ALL USING (
  EXISTS (
    SELECT 1 FROM channels
    WHERE channels.id = streams.channel_id
    AND channels.creator_id = auth.uid()
  )
);

CREATE INDEX idx_streams_channel ON streams(channel_id);
CREATE INDEX idx_streams_status ON streams(status);

-- ============================================================================
-- 4. STREAM SCENES
-- ============================================================================

CREATE TABLE IF NOT EXISTS stream_scenes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id UUID REFERENCES streams(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  layout TEXT DEFAULT 'fullscreen' CHECK (layout IN ('fullscreen', 'pip', 'sidebyside', 'custom')),
  sources JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE stream_scenes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can manage own stream scenes" ON stream_scenes FOR ALL USING (
  EXISTS (
    SELECT 1 FROM streams
    JOIN channels ON channels.id = streams.channel_id
    WHERE streams.id = stream_scenes.stream_id
    AND channels.creator_id = auth.uid()
  )
);

-- ============================================================================
-- 5. MEDIA LIBRARY
-- ============================================================================

CREATE TABLE IF NOT EXISTS media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('video', 'audio', 'live_recording')),
  thumbnail_url TEXT,
  media_url TEXT,
  storage_path TEXT,
  duration INTEGER, -- in seconds
  file_size BIGINT,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'failed')),
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published media is viewable by everyone" ON media FOR SELECT USING (published_at IS NOT NULL);
CREATE POLICY "Creators can manage own media" ON media FOR ALL USING (
  EXISTS (
    SELECT 1 FROM channels
    WHERE channels.id = media.channel_id
    AND channels.creator_id = auth.uid()
  )
);

CREATE INDEX idx_media_channel ON media(channel_id);
CREATE INDEX idx_media_published ON media(published_at);

-- ============================================================================
-- 6. SUBSCRIPTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscriber_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE NOT NULL,
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'basic', 'premium')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(subscriber_id, channel_id)
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = subscriber_id);
CREATE POLICY "Users can create own subscriptions" ON subscriptions FOR INSERT WITH CHECK (auth.uid() = subscriber_id);
CREATE POLICY "Users can update own subscriptions" ON subscriptions FOR UPDATE USING (auth.uid() = subscriber_id);

CREATE INDEX idx_subscriptions_subscriber ON subscriptions(subscriber_id);
CREATE INDEX idx_subscriptions_channel ON subscriptions(channel_id);

-- ============================================================================
-- 7. MONETIZATION - TRANSACTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  channel_id UUID REFERENCES channels(id) ON DELETE SET NULL,
  type TEXT CHECK (type IN ('subscription', 'tip', 'pay_per_view')),
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  stripe_payment_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Creators can view channel transactions" ON transactions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM channels
    WHERE channels.id = transactions.channel_id
    AND channels.creator_id = auth.uid()
  )
);

CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_channel ON transactions(channel_id);

-- ============================================================================
-- 8. ANALYTICS - VIEW EVENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS view_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  media_id UUID REFERENCES media(id) ON DELETE CASCADE,
  stream_id UUID REFERENCES streams(id) ON DELETE CASCADE,
  session_id TEXT,
  duration INTEGER, -- seconds watched
  completed BOOLEAN DEFAULT false,
  device_type TEXT,
  country TEXT,
  city TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE view_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own view events" ON view_events FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX idx_view_events_media ON view_events(media_id);
CREATE INDEX idx_view_events_stream ON view_events(stream_id);
CREATE INDEX idx_view_events_created ON view_events(created_at);

-- ============================================================================
-- 9. ANALYTICS - ENGAGEMENT EVENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS engagement_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  media_id UUID REFERENCES media(id) ON DELETE CASCADE,
  stream_id UUID REFERENCES streams(id) ON DELETE CASCADE,
  event_type TEXT CHECK (event_type IN ('like', 'share', 'comment', 'subscribe', 'tip')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE engagement_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_engagement_events_media ON engagement_events(media_id);
CREATE INDEX idx_engagement_events_stream ON engagement_events(stream_id);
CREATE INDEX idx_engagement_events_type ON engagement_events(event_type);

-- ============================================================================
-- 10. SYSTEM SETTINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS system_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Settings are viewable by everyone" ON system_settings FOR SELECT USING (true);
CREATE POLICY "Only admins can update settings" ON system_settings FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'master_admin')
  )
);

-- Insert default settings
INSERT INTO system_settings (key, value, description) VALUES
  ('user_registration', '{"enabled": true}'::jsonb, 'Enable/disable new user registrations'),
  ('live_streaming', '{"enabled": true}'::jsonb, 'Enable/disable live streaming features'),
  ('monetization', '{"enabled": false}'::jsonb, 'Enable/disable monetization features'),
  ('white_label', '{"enabled": false}'::jsonb, 'Enable/disable white-label network creation')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- 11. FEATURE FLAGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT false,
  description TEXT,
  rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  conditions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Feature flags are viewable by everyone" ON feature_flags FOR SELECT USING (true);
CREATE POLICY "Only admins can manage feature flags" ON feature_flags FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'master_admin')
  )
);

-- Insert default feature flags
INSERT INTO feature_flags (name, enabled, description) VALUES
  ('webrtc_streaming', true, 'Enable WebRTC-based streaming'),
  ('screen_sharing', true, 'Enable screen sharing in stream studio'),
  ('multi_camera', true, 'Enable multiple camera sources'),
  ('scene_switching', true, 'Enable scene management and switching'),
  ('tipping', false, 'Enable viewer tipping'),
  ('subscriptions', false, 'Enable channel subscriptions'),
  ('analytics_realtime', true, 'Enable real-time analytics'),
  ('white_label_networks', false, 'Enable white-label network creation')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 12. ADMIN ACTIONS (AUDIT LOG)
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES profiles(id) NOT NULL,
  action_type TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view admin actions" ON admin_actions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'master_admin')
  )
);

CREATE INDEX idx_admin_actions_admin ON admin_actions(admin_id);
CREATE INDEX idx_admin_actions_created ON admin_actions(created_at);

-- ============================================================================
-- 13. NOTIFICATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('stream_live', 'new_subscriber', 'new_tip', 'new_comment', 'system')),
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read);

-- ============================================================================
-- 14. STREAM HEALTH METRICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS stream_health_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id UUID REFERENCES streams(id) ON DELETE CASCADE NOT NULL,
  bitrate INTEGER,
  fps INTEGER,
  resolution TEXT,
  latency INTEGER, -- milliseconds
  packet_loss DECIMAL(5, 2),
  cpu_usage DECIMAL(5, 2),
  network_quality TEXT CHECK (network_quality IN ('excellent', 'good', 'fair', 'poor')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE stream_health_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can view own stream health" ON stream_health_metrics FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM streams
    JOIN channels ON channels.id = streams.channel_id
    WHERE streams.id = stream_health_metrics.stream_id
    AND channels.creator_id = auth.uid()
  )
);

CREATE INDEX idx_stream_health_stream ON stream_health_metrics(stream_id);
CREATE INDEX idx_stream_health_created ON stream_health_metrics(created_at);

-- ============================================================================
-- 15. REVENUE SPLITS (For future white-label)
-- ============================================================================

CREATE TABLE IF NOT EXISTS revenue_splits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE NOT NULL,
  platform_percentage DECIMAL(5, 2) DEFAULT 10.00,
  creator_percentage DECIMAL(5, 2) DEFAULT 90.00,
  network_id UUID, -- For future white-label networks
  network_percentage DECIMAL(5, 2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE revenue_splits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can view own revenue splits" ON revenue_splits FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM channels
    WHERE channels.id = revenue_splits.channel_id
    AND channels.creator_id = auth.uid()
  )
);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Update channel subscriber count
CREATE OR REPLACE FUNCTION update_channel_subscriber_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE channels
    SET subscriber_count = subscriber_count + 1
    WHERE id = NEW.channel_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE channels
    SET subscriber_count = GREATEST(subscriber_count - 1, 0)
    WHERE id = OLD.channel_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_subscription_change
  AFTER INSERT OR DELETE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_channel_subscriber_count();

-- Update timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER channels_updated_at BEFORE UPDATE ON channels FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER streams_updated_at BEFORE UPDATE ON streams FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER media_updated_at BEFORE UPDATE ON media FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================================
-- STORAGE BUCKETS (Run in Supabase Dashboard > Storage)
-- ============================================================================

-- Create storage buckets:
-- 1. avatars (public, max 2MB, image/*)
-- 2. media (public, max 5GB, video/*, audio/*)
-- 3. thumbnails (public, max 5MB, image/*)
-- 4. channel-banners (public, max 10MB, image/*)

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_media_type ON media(type);
CREATE INDEX IF NOT EXISTS idx_media_status ON media(status);
CREATE INDEX IF NOT EXISTS idx_streams_webrtc_room ON streams(webrtc_room_id);

-- ============================================================================
-- COMPLETED: Production-grade schema ready for millions of users
-- ============================================================================
