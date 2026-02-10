-- ============================================================================
-- VOD Storage, Streaming Limits, and Admin Controls Migration
-- ============================================================================

-- VOD Storage Table
CREATE TABLE IF NOT EXISTS vods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stream_id UUID REFERENCES streams(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  
  -- Content info
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  duration INTEGER NOT NULL DEFAULT 0, -- seconds
  
  -- Status
  status TEXT NOT NULL DEFAULT 'recording' CHECK (status IN ('recording', 'processing', 'ready', 'failed', 'deleted')),
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'unlisted', 'private')),
  
  -- Storage
  storage_url TEXT,
  storage_bucket TEXT DEFAULT 'vods',
  file_size_mb NUMERIC(10, 2) DEFAULT 0,
  format TEXT DEFAULT 'mp4' CHECK (format IN ('mp4', 'webm', 'hls')),
  
  -- Quality variants (JSON array)
  qualities JSONB DEFAULT '[]'::JSONB,
  
  -- Engagement
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  
  -- Timestamps
  recorded_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ, -- Auto-delete based on tier
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- VOD indexes
CREATE INDEX idx_vods_user ON vods(user_id);
CREATE INDEX idx_vods_channel ON vods(channel_id);
CREATE INDEX idx_vods_status ON vods(status);
CREATE INDEX idx_vods_visibility ON vods(visibility);
CREATE INDEX idx_vods_view_count ON vods(view_count DESC);
CREATE INDEX idx_vods_created_at ON vods(created_at DESC);
CREATE INDEX idx_vods_expires_at ON vods(expires_at) WHERE expires_at IS NOT NULL;

-- User Tiers Table
CREATE TABLE IF NOT EXISTS user_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('guest', 'free', 'creator', 'pro', 'enterprise')),
  
  -- Subscription info
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'past_due', 'canceled', 'trialing')),
  
  -- Usage tracking
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  storage_used_mb NUMERIC(10, 2) DEFAULT 0,
  sessions_this_week INTEGER DEFAULT 0,
  
  -- Timestamps
  upgraded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User tiers indexes
CREATE INDEX idx_user_tiers_tier ON user_tiers(tier);
CREATE INDEX idx_user_tiers_subscription ON user_tiers(stripe_subscription_id);

-- Stream Sessions Table (for tier enforcement)
CREATE TABLE IF NOT EXISTS stream_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stream_id UUID REFERENCES streams(id) ON DELETE SET NULL,
  
  -- Session info
  tier TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration INTEGER DEFAULT 0, -- seconds
  
  -- Enforcement
  was_killed BOOLEAN DEFAULT FALSE,
  kill_reason TEXT,
  limits_applied JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stream sessions indexes
CREATE INDEX idx_stream_sessions_user ON stream_sessions(user_id);
CREATE INDEX idx_stream_sessions_started ON stream_sessions(started_at DESC);

-- Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('master', 'admin', 'moderator')),
  permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Status
  active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  
  -- Audit
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin users indexes
CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_role ON admin_users(role);
CREATE INDEX idx_admin_users_active ON admin_users(active);

-- Admin Actions Log (audit trail)
CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  admin_email TEXT NOT NULL,
  
  -- Action details
  action TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('user', 'stream', 'vod', 'destination', 'account')),
  target_id TEXT NOT NULL,
  reason TEXT,
  metadata JSONB,
  
  -- Reversibility
  reversible BOOLEAN DEFAULT FALSE,
  reversed BOOLEAN DEFAULT FALSE,
  reversed_at TIMESTAMPTZ,
  reversed_by UUID REFERENCES admin_users(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin actions indexes
CREATE INDEX idx_admin_actions_admin ON admin_actions(admin_user_id);
CREATE INDEX idx_admin_actions_target ON admin_actions(target_type, target_id);
CREATE INDEX idx_admin_actions_created ON admin_actions(created_at DESC);

-- Account Suspensions Table
CREATE TABLE IF NOT EXISTS account_suspensions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  admin_user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  admin_email TEXT NOT NULL,
  
  -- Suspension details
  reason TEXT NOT NULL,
  duration_hours INTEGER, -- NULL = permanent
  
  -- Status
  active BOOLEAN DEFAULT TRUE,
  suspended_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  lifted_at TIMESTAMPTZ,
  lifted_by UUID REFERENCES admin_users(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suspensions indexes
CREATE INDEX idx_suspensions_user ON account_suspensions(user_id);
CREATE INDEX idx_suspensions_active ON account_suspensions(active);

-- Stream Limit Violations Table
CREATE TABLE IF NOT EXISTS stream_limit_violations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stream_session_id UUID REFERENCES stream_sessions(id) ON DELETE CASCADE,
  
  -- Violation details
  violation_type TEXT NOT NULL CHECK (violation_type IN ('duration', 'sessions', 'bitrate', 'resolution', 'destinations')),
  limit_value NUMERIC NOT NULL,
  actual_value NUMERIC NOT NULL,
  enforced BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Violations indexes
CREATE INDEX idx_violations_user ON stream_limit_violations(user_id);
CREATE INDEX idx_violations_type ON stream_limit_violations(violation_type);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE vods ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_suspensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_limit_violations ENABLE ROW LEVEL SECURITY;

-- VODs policies
CREATE POLICY "Public VODs are viewable by everyone"
  ON vods FOR SELECT
  USING (visibility = 'public' AND status = 'ready');

CREATE POLICY "Users can view their own VODs"
  ON vods FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own VODs"
  ON vods FOR ALL
  USING (auth.uid() = user_id);

-- User tiers policies
CREATE POLICY "Users can view their own tier"
  ON user_tiers FOR SELECT
  USING (auth.uid() = user_id);

-- Stream sessions policies
CREATE POLICY "Users can view their own sessions"
  ON stream_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Admin policies (admin users can bypass RLS via service role)
CREATE POLICY "Admins can view admin_users"
  ON admin_users FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM admin_users WHERE active = true)
  );

CREATE POLICY "Admins can view admin_actions"
  ON admin_actions FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM admin_users WHERE active = true)
  );

CREATE POLICY "Admins can create admin_actions"
  ON admin_actions FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM admin_users WHERE active = true)
  );

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = check_user_id 
    AND active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is master admin
CREATE OR REPLACE FUNCTION is_master_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = check_user_id 
    AND role = 'master'
    AND active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user tier
CREATE OR REPLACE FUNCTION get_user_tier(check_user_id UUID DEFAULT auth.uid())
RETURNS TEXT AS $$
DECLARE
  user_tier TEXT;
BEGIN
  SELECT tier INTO user_tier
  FROM user_tiers
  WHERE user_id = check_user_id;
  
  RETURN COALESCE(user_tier, 'free');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check streaming limits
CREATE OR REPLACE FUNCTION check_stream_limits(check_user_id UUID DEFAULT auth.uid())
RETURNS JSONB AS $$
DECLARE
  user_tier TEXT;
  sessions_count INTEGER;
  limits JSONB;
BEGIN
  -- Get user tier
  user_tier := get_user_tier(check_user_id);
  
  -- Count sessions this week
  SELECT COUNT(*) INTO sessions_count
  FROM stream_sessions
  WHERE user_id = check_user_id
  AND started_at >= NOW() - INTERVAL '7 days';
  
  -- Build limits object based on tier
  limits := CASE user_tier
    WHEN 'guest' THEN jsonb_build_object(
      'maxDuration', 900,
      'maxSessions', 1,
      'sessionsUsed', sessions_count,
      'externalRtmp', false,
      'maxOverlays', 1
    )
    WHEN 'free' THEN jsonb_build_object(
      'maxDuration', 3600,
      'maxSessions', 5,
      'sessionsUsed', sessions_count,
      'externalRtmp', false,
      'maxOverlays', 3
    )
    WHEN 'creator' THEN jsonb_build_object(
      'maxDuration', 14400,
      'maxSessions', -1,
      'sessionsUsed', sessions_count,
      'externalRtmp', true,
      'maxOverlays', 10
    )
    WHEN 'pro' THEN jsonb_build_object(
      'maxDuration', -1,
      'maxSessions', -1,
      'sessionsUsed', sessions_count,
      'externalRtmp', true,
      'maxOverlays', -1
    )
    WHEN 'enterprise' THEN jsonb_build_object(
      'maxDuration', -1,
      'maxSessions', -1,
      'sessionsUsed', sessions_count,
      'externalRtmp', true,
      'maxOverlays', -1
    )
    ELSE jsonb_build_object(
      'maxDuration', 3600,
      'maxSessions', 5,
      'sessionsUsed', sessions_count,
      'externalRtmp', false,
      'maxOverlays', 3
    )
  END;
  
  limits := limits || jsonb_build_object('tier', user_tier);
  
  RETURN limits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get trending content
CREATE OR REPLACE FUNCTION get_trending_content(
  time_window INTERVAL DEFAULT '24 hours',
  content_limit INTEGER DEFAULT 20,
  include_live BOOLEAN DEFAULT true,
  include_vods BOOLEAN DEFAULT true
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  thumbnail_url TEXT,
  creator_id UUID,
  creator_name TEXT,
  view_count INTEGER,
  is_live BOOLEAN,
  duration INTEGER,
  started_at TIMESTAMPTZ,
  trend_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  
  -- Live streams
  SELECT 
    s.id,
    s.title,
    s.thumbnail_url,
    s.user_id AS creator_id,
    u.display_name AS creator_name,
    s.viewer_count AS view_count,
    true AS is_live,
    EXTRACT(EPOCH FROM (NOW() - s.started_at))::INTEGER AS duration,
    s.started_at,
    (s.viewer_count * 2.0 + EXTRACT(EPOCH FROM (NOW() - s.started_at)) / 60.0)::NUMERIC AS trend_score
  FROM streams s
  JOIN profiles u ON s.user_id = u.id
  WHERE s.status = 'live'
  AND include_live = true
  
  UNION ALL
  
  -- VODs
  SELECT 
    v.id,
    v.title,
    v.thumbnail_url,
    v.user_id AS creator_id,
    u.display_name AS creator_name,
    v.view_count,
    false AS is_live,
    v.duration,
    v.recorded_at AS started_at,
    (v.view_count::NUMERIC / GREATEST(1, EXTRACT(EPOCH FROM (NOW() - v.created_at)) / 3600.0))::NUMERIC AS trend_score
  FROM vods v
  JOIN profiles u ON v.user_id = u.id
  WHERE v.status = 'ready'
  AND v.visibility = 'public'
  AND v.created_at >= NOW() - time_window
  AND include_vods = true
  
  ORDER BY trend_score DESC
  LIMIT content_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vods_updated_at
  BEFORE UPDATE ON vods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_tiers_updated_at
  BEFORE UPDATE ON user_tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- SEED MASTER ADMIN
-- ============================================================================

-- Insert master admin (will need to match with actual user ID after signup)
-- This is a placeholder that should be updated with the real user ID
INSERT INTO admin_users (user_id, email, role, permissions, active)
SELECT 
  u.id,
  'solutions@pitchmarketing.agency',
  'master',
  ARRAY[
    'view_all_users',
    'view_all_streams',
    'view_all_activity',
    'impersonate_user',
    'kill_stream',
    'disable_destination',
    'suspend_account',
    'ban_account',
    'edit_tiers',
    'manage_admins',
    'view_revenue',
    'manage_marketplace'
  ]::TEXT[],
  true
FROM auth.users u
WHERE u.email = 'solutions@pitchmarketing.agency'
ON CONFLICT (user_id) DO UPDATE SET
  role = 'master',
  permissions = EXCLUDED.permissions,
  active = true;
