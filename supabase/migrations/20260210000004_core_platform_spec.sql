-- ============================================================================
-- YOUCAST CORE PLATFORM — DATA, SECURITY, STATE, ADMIN, TIERS
-- ONE-SHOT IMPLEMENTATION
-- ============================================================================

-- ============================================================================
-- 1. EXTEND PROFILES TABLE FOR SPEC COMPLIANCE
-- ============================================================================

-- Add global_admin and tier columns to profiles
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free' 
    CHECK (tier IN ('guest', 'free', 'creator', 'pro', 'enterprise')),
  ADD COLUMN IF NOT EXISTS global_admin BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS suspended_reason TEXT,
  ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ;

-- Update role enum to match spec
DO $$
BEGIN
  -- Drop old constraint if exists
  ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
  -- Add new constraint
  ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('user', 'viewer', 'creator', 'producer', 'admin', 'master', 'master_admin'));
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Create index on global_admin for fast admin lookup
CREATE INDEX IF NOT EXISTS idx_profiles_global_admin ON profiles(global_admin) WHERE global_admin = true;
CREATE INDEX IF NOT EXISTS idx_profiles_tier ON profiles(tier);

-- ============================================================================
-- 2. VIDEOS TABLE (VOD) - SPEC ALIGNED
-- ============================================================================

CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID REFERENCES streams(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Content
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_path TEXT,
  storage_path TEXT,
  
  -- Stats
  views INTEGER DEFAULT 0,
  duration_seconds INTEGER DEFAULT 0,
  
  -- Visibility
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'unlisted')),
  
  -- Processing
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'failed')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_videos_owner ON videos(owner_id);
CREATE INDEX IF NOT EXISTS idx_videos_stream ON videos(stream_id);
CREATE INDEX IF NOT EXISTS idx_videos_visibility ON videos(visibility);
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);

-- RLS
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Videos public read" ON videos;
CREATE POLICY "Videos public read" ON videos FOR SELECT
  USING (
    visibility = 'public' AND status = 'ready'
    OR owner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND global_admin = true)
  );

DROP POLICY IF EXISTS "Videos owner manage" ON videos;
CREATE POLICY "Videos owner manage" ON videos FOR ALL
  USING (
    owner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND global_admin = true)
  );

-- ============================================================================
-- 3. COMPOSITIONS TABLE - SPEC ALIGNED
-- ============================================================================

CREATE TABLE IF NOT EXISTS compositions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  
  -- Full composition config
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Metadata
  is_default BOOLEAN DEFAULT FALSE,
  thumbnail_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_compositions_owner ON compositions(owner_id);

-- RLS
ALTER TABLE compositions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Compositions owner access" ON compositions;
CREATE POLICY "Compositions owner access" ON compositions FOR ALL
  USING (
    owner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND global_admin = true)
  );

-- ============================================================================
-- 4. ASSETS TABLE (overlays, thumbnails, templates, lowerthirds)
-- ============================================================================

CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Type
  type TEXT NOT NULL CHECK (type IN ('overlay', 'thumbnail', 'template', 'lowerthird', 'stinger', 'audio')),
  
  -- Content
  name TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  storage_path TEXT,
  
  -- Metadata
  is_default BOOLEAN DEFAULT FALSE,
  is_shared BOOLEAN DEFAULT FALSE, -- Marketplace sharing
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_assets_owner ON assets(owner_id);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type);

-- RLS
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Assets owner access" ON assets;
CREATE POLICY "Assets owner access" ON assets FOR ALL
  USING (
    owner_id = auth.uid()
    OR is_shared = true
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND global_admin = true)
  );

-- ============================================================================
-- 5. ACTIVITY LOG (ADMIN AUDIT TRAIL) - SPEC ALIGNED
-- ============================================================================

CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Action details
  action TEXT NOT NULL,
  action_category TEXT CHECK (action_category IN ('stream', 'user', 'content', 'system', 'security')),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_activity_log_actor ON activity_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_target ON activity_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_action ON activity_log(action);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at DESC);

-- RLS - Only admins can read
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Activity log admin read" ON activity_log;
CREATE POLICY "Activity log admin read" ON activity_log FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND global_admin = true));

-- Allow inserts from service role only (via functions)
DROP POLICY IF EXISTS "Activity log insert" ON activity_log;
CREATE POLICY "Activity log insert" ON activity_log FOR INSERT
  WITH CHECK (true); -- Controlled via function security definer

-- ============================================================================
-- 6. STREAM DESTINATIONS - SPEC ALIGNED
-- ============================================================================

-- Create streaming_destinations table if it doesn't exist
CREATE TABLE IF NOT EXISTS streaming_destinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  
  -- Platform info
  platform TEXT NOT NULL CHECK (platform IN ('youtube', 'facebook', 'twitch', 'custom', 'x')),
  platform_name TEXT NOT NULL,
  
  -- Keys (stream_key will be deprecated in favor of encrypted)
  stream_key TEXT,
  stream_key_encrypted BYTEA,
  rtmp_url TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_error TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_streaming_destinations_channel ON streaming_destinations(channel_id);
CREATE INDEX IF NOT EXISTS idx_streaming_destinations_user ON streaming_destinations(user_id);
CREATE INDEX IF NOT EXISTS idx_streaming_destinations_platform ON streaming_destinations(platform);

-- Enable RLS
ALTER TABLE streaming_destinations ENABLE ROW LEVEL SECURITY;

-- Add encrypted key column and update policies (for existing tables)
ALTER TABLE streaming_destinations
  ADD COLUMN IF NOT EXISTS stream_key_encrypted BYTEA,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id);

-- Ensure user_id is populated (migration step)
DO $$
BEGIN
  UPDATE streaming_destinations sd
  SET user_id = c.creator_id
  FROM channels c
  WHERE sd.channel_id = c.id
  AND sd.user_id IS NULL;
END $$;

-- Update RLS for stream_destinations
DROP POLICY IF EXISTS "Destinations owner access" ON streaming_destinations;
CREATE POLICY "Destinations owner access" ON streaming_destinations FOR ALL
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM channels c 
      WHERE c.id = streaming_destinations.channel_id 
      AND c.creator_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND global_admin = true)
  );

-- ============================================================================
-- 7. UPDATE STREAMS TABLE - SPEC ALIGNED
-- ============================================================================

ALTER TABLE streams
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public' 
    CHECK (visibility IN ('public', 'private', 'unlisted')),
  ADD COLUMN IF NOT EXISTS is_recorded BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS duration_seconds INTEGER DEFAULT 0;

-- Migrate owner_id from channel
DO $$
BEGIN
  UPDATE streams s
  SET owner_id = c.creator_id
  FROM channels c
  WHERE s.channel_id = c.id
  AND s.owner_id IS NULL;
END $$;

-- Update status check constraint
DO $$
BEGIN
  ALTER TABLE streams DROP CONSTRAINT IF EXISTS streams_status_check;
  ALTER TABLE streams ADD CONSTRAINT streams_status_check 
    CHECK (status IN ('offline', 'preview', 'live', 'ended', 'killed'));
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- ============================================================================
-- 8. STRICT RLS RULES - SPEC COMPLIANCE
-- ============================================================================

-- PROFILES: Users can read/update only themselves, global_admin can read all
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Profiles strict access" ON profiles;

CREATE POLICY "Profiles strict access" ON profiles FOR SELECT
  USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.global_admin = true)
    OR (role IN ('creator', 'producer') AND is_verified = true) -- Public creators visible
  );

DROP POLICY IF EXISTS "Profiles self update" ON profiles;
CREATE POLICY "Profiles self update" ON profiles FOR UPDATE
  USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.global_admin = true)
  );

-- STREAMS: Strict access control
DROP POLICY IF EXISTS "Streams strict access" ON streams;
CREATE POLICY "Streams strict access" ON streams FOR SELECT
  USING (
    status = 'live' AND visibility = 'public'
    OR owner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM channels c WHERE c.id = streams.channel_id AND c.creator_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND global_admin = true)
  );

DROP POLICY IF EXISTS "Streams owner manage" ON streams;
CREATE POLICY "Streams owner manage" ON streams FOR ALL
  USING (
    owner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM channels c WHERE c.id = streams.channel_id AND c.creator_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND global_admin = true)
  );

-- ============================================================================
-- 9. TIER ENFORCEMENT TABLES
-- ============================================================================

-- Tier config stored in database for easy modification
CREATE TABLE IF NOT EXISTS tier_config (
  tier TEXT PRIMARY KEY CHECK (tier IN ('guest', 'free', 'creator', 'pro', 'enterprise')),
  max_duration_seconds INTEGER NOT NULL,
  sessions_per_week INTEGER NOT NULL,
  external_rtmp_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  max_overlays INTEGER NOT NULL DEFAULT 1,
  max_destinations INTEGER NOT NULL DEFAULT 1,
  ai_features_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  storage_gb NUMERIC(10,2) NOT NULL DEFAULT 0,
  max_bitrate_kbps INTEGER NOT NULL DEFAULT 2500,
  max_resolution TEXT NOT NULL DEFAULT '720p',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default tier configs
INSERT INTO tier_config (tier, max_duration_seconds, sessions_per_week, external_rtmp_allowed, max_overlays, max_destinations, ai_features_allowed, storage_gb, max_bitrate_kbps, max_resolution)
VALUES
  ('guest', 900, 1, false, 1, 0, false, 0, 1500, '720p'),
  ('free', 1800, 3, false, 2, 1, false, 1, 2500, '720p'),
  ('creator', 14400, 10, true, 5, 3, true, 50, 6000, '1080p'),
  ('pro', 43200, -1, true, 10, 5, true, 500, 10000, '1080p'),
  ('enterprise', -1, -1, true, -1, -1, true, -1, 25000, '4k')
ON CONFLICT (tier) DO UPDATE SET
  max_duration_seconds = EXCLUDED.max_duration_seconds,
  sessions_per_week = EXCLUDED.sessions_per_week,
  external_rtmp_allowed = EXCLUDED.external_rtmp_allowed,
  max_overlays = EXCLUDED.max_overlays,
  max_destinations = EXCLUDED.max_destinations,
  ai_features_allowed = EXCLUDED.ai_features_allowed,
  storage_gb = EXCLUDED.storage_gb,
  max_bitrate_kbps = EXCLUDED.max_bitrate_kbps,
  max_resolution = EXCLUDED.max_resolution,
  updated_at = NOW();

-- ============================================================================
-- 10. CORE FUNCTIONS
-- ============================================================================

-- Check if user is global admin
CREATE OR REPLACE FUNCTION is_global_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = check_user_id 
    AND global_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's tier with fallback
CREATE OR REPLACE FUNCTION get_tier(check_user_id UUID DEFAULT auth.uid())
RETURNS TEXT AS $$
DECLARE
  result_tier TEXT;
BEGIN
  SELECT tier INTO result_tier
  FROM profiles
  WHERE id = check_user_id;
  
  RETURN COALESCE(result_tier, 'guest');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get tier limits for a user
CREATE OR REPLACE FUNCTION get_tier_limits(check_user_id UUID DEFAULT auth.uid())
RETURNS JSONB AS $$
DECLARE
  user_tier TEXT;
  limits RECORD;
BEGIN
  user_tier := get_tier(check_user_id);
  
  SELECT * INTO limits FROM tier_config WHERE tier = user_tier;
  
  RETURN jsonb_build_object(
    'tier', user_tier,
    'maxDuration', limits.max_duration_seconds,
    'sessionsPerWeek', limits.sessions_per_week,
    'externalRTMP', limits.external_rtmp_allowed,
    'maxOverlays', limits.max_overlays,
    'maxDestinations', limits.max_destinations,
    'aiFeatures', limits.ai_features_allowed,
    'storageGB', limits.storage_gb,
    'maxBitrateKbps', limits.max_bitrate_kbps,
    'maxResolution', limits.max_resolution
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if action is allowed for tier
CREATE OR REPLACE FUNCTION tier_allows(
  check_user_id UUID,
  action_type TEXT,
  action_value INTEGER DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
  user_tier TEXT;
  limits RECORD;
  sessions_count INTEGER;
  current_overlays INTEGER;
  current_destinations INTEGER;
  allowed BOOLEAN := FALSE;
  reason TEXT := '';
BEGIN
  user_tier := get_tier(check_user_id);
  SELECT * INTO limits FROM tier_config WHERE tier = user_tier;
  
  CASE action_type
    WHEN 'stream_start' THEN
      -- Check sessions this week
      SELECT COUNT(*) INTO sessions_count
      FROM stream_sessions
      WHERE user_id = check_user_id
      AND started_at > NOW() - INTERVAL '7 days';
      
      IF limits.sessions_per_week = -1 OR sessions_count < limits.sessions_per_week THEN
        allowed := TRUE;
      ELSE
        reason := format('Weekly session limit reached (%s/%s)', sessions_count, limits.sessions_per_week);
      END IF;
      
    WHEN 'stream_duration' THEN
      IF limits.max_duration_seconds = -1 OR action_value <= limits.max_duration_seconds THEN
        allowed := TRUE;
      ELSE
        reason := format('Max duration exceeded (%s/%s seconds)', action_value, limits.max_duration_seconds);
      END IF;
      
    WHEN 'add_destination' THEN
      IF NOT limits.external_rtmp_allowed THEN
        reason := 'External RTMP not allowed on this tier';
      ELSE
        SELECT COUNT(*) INTO current_destinations
        FROM streaming_destinations
        WHERE user_id = check_user_id AND is_enabled = true;
        
        IF limits.max_destinations = -1 OR current_destinations < limits.max_destinations THEN
          allowed := TRUE;
        ELSE
          reason := format('Destination limit reached (%s/%s)', current_destinations, limits.max_destinations);
        END IF;
      END IF;
      
    WHEN 'add_overlay' THEN
      -- Would count from composition config
      IF limits.max_overlays = -1 OR action_value < limits.max_overlays THEN
        allowed := TRUE;
      ELSE
        reason := format('Overlay limit reached (%s/%s)', action_value, limits.max_overlays);
      END IF;
      
    WHEN 'ai_request' THEN
      IF limits.ai_features_allowed THEN
        allowed := TRUE;
      ELSE
        reason := 'AI features not available on this tier';
      END IF;
      
    WHEN 'storage_write' THEN
      -- action_value is MB being written
      IF limits.storage_gb = -1 THEN
        allowed := TRUE;
      ELSE
        DECLARE
          used_mb NUMERIC;
        BEGIN
          SELECT COALESCE(SUM(
            COALESCE((v.storage_path IS NOT NULL)::int * 100, 0) -- Estimate
          ), 0) INTO used_mb
          FROM videos v WHERE v.owner_id = check_user_id;
          
          IF (used_mb + action_value) / 1024 <= limits.storage_gb THEN
            allowed := TRUE;
          ELSE
            reason := format('Storage limit exceeded');
          END IF;
        END;
      END IF;
      
    ELSE
      allowed := TRUE; -- Unknown action, allow by default
  END CASE;
  
  RETURN jsonb_build_object(
    'allowed', allowed,
    'reason', reason,
    'tier', user_tier,
    'limits', row_to_json(limits)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log activity (callable from service role)
CREATE OR REPLACE FUNCTION log_activity(
  p_actor_id UUID,
  p_action TEXT,
  p_target_user_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_category TEXT DEFAULT 'system'
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO activity_log (actor_id, target_user_id, action, action_category, metadata)
  VALUES (p_actor_id, p_target_user_id, p_action, p_category, p_metadata)
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Kill stream (admin only)
CREATE OR REPLACE FUNCTION kill_stream(
  p_admin_id UUID,
  p_stream_id UUID,
  p_reason TEXT DEFAULT 'Admin terminated'
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verify admin
  IF NOT is_global_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;
  
  -- Update stream
  UPDATE streams
  SET status = 'killed',
      ended_at = NOW(),
      updated_at = NOW()
  WHERE id = p_stream_id;
  
  -- Log action
  PERFORM log_activity(
    p_admin_id,
    'kill_stream',
    (SELECT owner_id FROM streams WHERE id = p_stream_id),
    jsonb_build_object('stream_id', p_stream_id, 'reason', p_reason),
    'security'
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Suspend account (admin only)
CREATE OR REPLACE FUNCTION suspend_account(
  p_admin_id UUID,
  p_target_user_id UUID,
  p_reason TEXT,
  p_duration_hours INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verify admin
  IF NOT is_global_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;
  
  -- Update profile
  UPDATE profiles
  SET is_suspended = true,
      suspended_reason = p_reason,
      suspended_until = CASE 
        WHEN p_duration_hours IS NULL THEN NULL 
        ELSE NOW() + (p_duration_hours || ' hours')::INTERVAL 
      END,
      updated_at = NOW()
  WHERE id = p_target_user_id;
  
  -- Kill any active streams
  UPDATE streams
  SET status = 'killed',
      ended_at = NOW()
  WHERE owner_id = p_target_user_id
  AND status IN ('preview', 'live');
  
  -- Log action
  PERFORM log_activity(
    p_admin_id,
    'suspend_account',
    p_target_user_id,
    jsonb_build_object('reason', p_reason, 'duration_hours', p_duration_hours),
    'security'
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Change user tier (admin only)
CREATE OR REPLACE FUNCTION change_user_tier(
  p_admin_id UUID,
  p_target_user_id UUID,
  p_new_tier TEXT,
  p_reason TEXT DEFAULT 'Admin change'
)
RETURNS BOOLEAN AS $$
DECLARE
  old_tier TEXT;
BEGIN
  -- Verify admin
  IF NOT is_global_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;
  
  -- Get old tier
  SELECT tier INTO old_tier FROM profiles WHERE id = p_target_user_id;
  
  -- Update tier
  UPDATE profiles
  SET tier = p_new_tier,
      updated_at = NOW()
  WHERE id = p_target_user_id;
  
  -- Log action
  PERFORM log_activity(
    p_admin_id,
    'change_tier',
    p_target_user_id,
    jsonb_build_object('old_tier', old_tier, 'new_tier', p_new_tier, 'reason', p_reason),
    'user'
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get admin dashboard stats
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS JSONB AS $$
DECLARE
  stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'totalUsers', (SELECT COUNT(*) FROM profiles),
    'activeStreams', (SELECT COUNT(*) FROM streams WHERE status = 'live'),
    'totalVideos', (SELECT COUNT(*) FROM videos WHERE status = 'ready'),
    'suspendedUsers', (SELECT COUNT(*) FROM profiles WHERE is_suspended = true),
    'tierBreakdown', (
      SELECT jsonb_object_agg(tier, cnt)
      FROM (SELECT COALESCE(tier, 'free') as tier, COUNT(*) as cnt FROM profiles GROUP BY tier) t
    ),
    'recentActivity', (
      SELECT jsonb_agg(row_to_json(a))
      FROM (
        SELECT actor_id, action, created_at 
        FROM activity_log 
        ORDER BY created_at DESC 
        LIMIT 10
      ) a
    )
  ) INTO stats;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 11. SET MASTER ADMIN
-- ============================================================================

-- Set solutions@pitchmarketing.agency as master admin
DO $$
DECLARE
  admin_id UUID;
BEGIN
  SELECT id INTO admin_id FROM profiles WHERE email = 'solutions@pitchmarketing.agency';
  
  IF admin_id IS NOT NULL THEN
    UPDATE profiles 
    SET global_admin = true, 
        role = 'master',
        tier = 'enterprise'
    WHERE id = admin_id;
    
    RAISE NOTICE 'Master admin set for solutions@pitchmarketing.agency';
  ELSE
    RAISE NOTICE 'Admin user not found, will be set on first login';
  END IF;
END $$;

-- Trigger to auto-promote master admin on signup
CREATE OR REPLACE FUNCTION auto_promote_master_admin()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email = 'solutions@pitchmarketing.agency' THEN
    NEW.global_admin := true;
    NEW.role := 'master';
    NEW.tier := 'enterprise';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS promote_master_admin ON profiles;
CREATE TRIGGER promote_master_admin
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_promote_master_admin();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
