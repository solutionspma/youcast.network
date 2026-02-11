-- ============================================================================
-- YOUCAST PLATFORM EXPERIENCE — LOGGED-IN CONTENT, CRM, MESSAGING
-- ============================================================================

-- ============================================================================
-- 1. PLAYBACK HISTORY (Recently Watched, Continue Watching)
-- ============================================================================

CREATE TABLE IF NOT EXISTS playback_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Content reference (one of these is set)
  media_id UUID REFERENCES media(id) ON DELETE CASCADE,
  stream_id UUID REFERENCES streams(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  
  -- Progress tracking
  progress_seconds INTEGER DEFAULT 0,
  duration_seconds INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  watched_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure at least one content reference
  CONSTRAINT content_reference_check CHECK (
    (media_id IS NOT NULL)::int + 
    (stream_id IS NOT NULL)::int + 
    (video_id IS NOT NULL)::int = 1
  )
);

-- Unique constraint per user per content
CREATE UNIQUE INDEX IF NOT EXISTS idx_playback_history_user_media 
  ON playback_history(user_id, media_id) WHERE media_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_playback_history_user_stream 
  ON playback_history(user_id, stream_id) WHERE stream_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_playback_history_user_video 
  ON playback_history(user_id, video_id) WHERE video_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_playback_history_user ON playback_history(user_id);
CREATE INDEX IF NOT EXISTS idx_playback_history_watched ON playback_history(watched_at DESC);

ALTER TABLE playback_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own history" ON playback_history;
CREATE POLICY "Users can view own history" ON playback_history FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own history" ON playback_history;
CREATE POLICY "Users can manage own history" ON playback_history FOR ALL
  USING (user_id = auth.uid());

-- ============================================================================
-- 2. USER FAVORITES
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Content reference (one of these is set)
  media_id UUID REFERENCES media(id) ON DELETE CASCADE,
  stream_id UUID REFERENCES streams(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Timestamps
  favorited_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if table already exists
DO $$
BEGIN
  -- Add media_id if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_favorites' AND column_name = 'media_id') THEN
    ALTER TABLE user_favorites ADD COLUMN media_id UUID REFERENCES media(id) ON DELETE CASCADE;
  END IF;
  
  -- Add stream_id if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_favorites' AND column_name = 'stream_id') THEN
    ALTER TABLE user_favorites ADD COLUMN stream_id UUID REFERENCES streams(id) ON DELETE CASCADE;
  END IF;
  
  -- Add video_id if missing  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_favorites' AND column_name = 'video_id') THEN
    ALTER TABLE user_favorites ADD COLUMN video_id UUID REFERENCES videos(id) ON DELETE CASCADE;
  END IF;
  
  -- Add channel_id if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_favorites' AND column_name = 'channel_id') THEN
    ALTER TABLE user_favorites ADD COLUMN channel_id UUID REFERENCES channels(id) ON DELETE CASCADE;
  END IF;
  
  -- Add creator_id if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_favorites' AND column_name = 'creator_id') THEN
    ALTER TABLE user_favorites ADD COLUMN creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
  
  -- Add favorited_at if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_favorites' AND column_name = 'favorited_at') THEN
    ALTER TABLE user_favorites ADD COLUMN favorited_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Add type computed column if supported (skip if error, generated columns may already exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_favorites' AND column_name = 'type') THEN
    EXECUTE 'ALTER TABLE user_favorites ADD COLUMN type TEXT GENERATED ALWAYS AS (
      CASE 
        WHEN media_id IS NOT NULL THEN ''media''
        WHEN stream_id IS NOT NULL THEN ''stream''
        WHEN video_id IS NOT NULL THEN ''video''
        WHEN channel_id IS NOT NULL THEN ''channel''
        WHEN creator_id IS NOT NULL THEN ''creator''
      END
    ) STORED';
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Skip if generated column fails (may already exist differently)
  NULL;
END $$;

-- Unique indexes (skip if columns don't exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_favorites' AND column_name = 'media_id') THEN
    CREATE UNIQUE INDEX IF NOT EXISTS idx_favorites_user_media ON user_favorites(user_id, media_id) WHERE media_id IS NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_favorites' AND column_name = 'stream_id') THEN
    CREATE UNIQUE INDEX IF NOT EXISTS idx_favorites_user_stream ON user_favorites(user_id, stream_id) WHERE stream_id IS NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_favorites' AND column_name = 'video_id') THEN
    CREATE UNIQUE INDEX IF NOT EXISTS idx_favorites_user_video ON user_favorites(user_id, video_id) WHERE video_id IS NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_favorites' AND column_name = 'channel_id') THEN
    CREATE UNIQUE INDEX IF NOT EXISTS idx_favorites_user_channel ON user_favorites(user_id, channel_id) WHERE channel_id IS NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_favorites' AND column_name = 'creator_id') THEN
    CREATE UNIQUE INDEX IF NOT EXISTS idx_favorites_user_creator ON user_favorites(user_id, creator_id) WHERE creator_id IS NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_favorites_user ON user_favorites(user_id);

-- Skip type index if column doesn't exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_favorites' AND column_name = 'type') THEN
    CREATE INDEX IF NOT EXISTS idx_favorites_type ON user_favorites(type);
  END IF;
END $$;

ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own favorites" ON user_favorites;
CREATE POLICY "Users can view own favorites" ON user_favorites FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own favorites" ON user_favorites;
CREATE POLICY "Users can manage own favorites" ON user_favorites FOR ALL
  USING (user_id = auth.uid());

-- ============================================================================
-- 3. DIRECT MESSAGES (Paid Gating)
-- ============================================================================

CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Conversation participants
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Message content
  content TEXT NOT NULL,
  
  -- Status
  read_at TIMESTAMPTZ,
  deleted_by_sender BOOLEAN DEFAULT FALSE,
  deleted_by_recipient BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent self-messaging
  CONSTRAINT no_self_message CHECK (sender_id != recipient_id)
);

CREATE INDEX IF NOT EXISTS idx_dm_sender ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_dm_recipient ON direct_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_dm_conversation ON direct_messages(
  LEAST(sender_id, recipient_id), 
  GREATEST(sender_id, recipient_id), 
  created_at DESC
);

ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

-- Users can see their own messages
DROP POLICY IF EXISTS "Users can view own messages" ON direct_messages;
CREATE POLICY "Users can view own messages" ON direct_messages FOR SELECT
  USING (
    (sender_id = auth.uid() AND NOT deleted_by_sender)
    OR (recipient_id = auth.uid() AND NOT deleted_by_recipient)
  );

-- Only PAID users can send messages (tier != 'free' AND tier != 'guest')
DROP POLICY IF EXISTS "Paid users can send messages" ON direct_messages;
CREATE POLICY "Paid users can send messages" ON direct_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND tier NOT IN ('free', 'guest')
    )
  );

-- Users can mark their own messages as deleted
DROP POLICY IF EXISTS "Users can soft delete messages" ON direct_messages;
CREATE POLICY "Users can soft delete messages" ON direct_messages FOR UPDATE
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

-- Conversation threads helper view
CREATE OR REPLACE VIEW conversation_threads AS
SELECT DISTINCT ON (conversation_key)
  CASE WHEN sender_id < recipient_id THEN sender_id ELSE recipient_id END AS user_a,
  CASE WHEN sender_id > recipient_id THEN sender_id ELSE recipient_id END AS user_b,
  LEAST(sender_id, recipient_id)::text || ':' || GREATEST(sender_id, recipient_id)::text AS conversation_key,
  id AS last_message_id,
  content AS last_message,
  created_at AS last_message_at,
  sender_id,
  recipient_id
FROM direct_messages
ORDER BY conversation_key, created_at DESC;

-- ============================================================================
-- 4. ENHANCED COMMUNITIES (Posts, Comments, Reactions, Customization)
-- ============================================================================

-- Add customization columns to community_groups
ALTER TABLE community_groups
  ADD COLUMN IF NOT EXISTS cover_image TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS background_color TEXT DEFAULT '#1a1a1a',
  ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT '#f97316',
  ADD COLUMN IF NOT EXISTS timeline_image TEXT,
  ADD COLUMN IF NOT EXISTS rules JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- Post reactions
CREATE TABLE IF NOT EXISTS post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES discussion_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reaction TEXT NOT NULL CHECK (reaction IN ('like', 'love', 'laugh', 'wow', 'sad', 'angry')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_reactions_post ON post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_user ON post_reactions(user_id);

ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view reactions" ON post_reactions;
CREATE POLICY "Anyone can view reactions" ON post_reactions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage own reactions" ON post_reactions;
CREATE POLICY "Users can manage own reactions" ON post_reactions FOR ALL
  USING (user_id = auth.uid());

-- Post comments
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES discussion_posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_author ON post_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_parent ON post_comments(parent_id);

ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view comments" ON post_comments;
CREATE POLICY "Anyone can view comments" ON post_comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Members can comment" ON post_comments;
CREATE POLICY "Members can comment" ON post_comments FOR INSERT
  WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "Authors can edit comments" ON post_comments;
CREATE POLICY "Authors can edit comments" ON post_comments FOR UPDATE
  USING (author_id = auth.uid());

DROP POLICY IF EXISTS "Authors can delete comments" ON post_comments;
CREATE POLICY "Authors can delete comments" ON post_comments FOR DELETE
  USING (author_id = auth.uid());

-- Comment reactions
CREATE TABLE IF NOT EXISTS comment_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reaction TEXT NOT NULL CHECK (reaction IN ('like', 'love', 'laugh', 'wow', 'sad', 'angry')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment ON comment_reactions(comment_id);

ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view comment reactions" ON comment_reactions;
CREATE POLICY "Anyone can view comment reactions" ON comment_reactions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage own comment reactions" ON comment_reactions;
CREATE POLICY "Users can manage own comment reactions" ON comment_reactions FOR ALL
  USING (user_id = auth.uid());

-- Add media support to posts
ALTER TABLE discussion_posts
  ADD COLUMN IF NOT EXISTS media_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS media_type TEXT CHECK (media_type IN ('image', 'video', 'audio', 'link'));

-- ============================================================================
-- 5. EVENTS SYSTEM ENHANCEMENT
-- ============================================================================

-- Add more fields to community_events
ALTER TABLE community_events
  ADD COLUMN IF NOT EXISTS cover_image TEXT,
  ADD COLUMN IF NOT EXISTS stream_url TEXT,
  ADD COLUMN IF NOT EXISTS replay_url TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS host_id UUID REFERENCES profiles(id);

-- Event reminders
CREATE TABLE IF NOT EXISTS event_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES community_events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  remind_at TIMESTAMPTZ NOT NULL,
  sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE event_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own reminders" ON event_reminders;
CREATE POLICY "Users can manage own reminders" ON event_reminders FOR ALL
  USING (user_id = auth.uid());

-- ============================================================================
-- 6. CRM TABLES
-- ============================================================================

-- Subscriber records (for mailing lists, notifications)
CREATE TABLE IF NOT EXISTS crm_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced', 'complained')),
  
  -- Segmentation
  source TEXT DEFAULT 'organic', -- organic, signup, import, event
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Preferences
  email_digest BOOLEAN DEFAULT TRUE,
  email_marketing BOOLEAN DEFAULT TRUE,
  email_events BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  
  UNIQUE(email)
);

CREATE INDEX IF NOT EXISTS idx_crm_subscribers_user ON crm_subscribers(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_subscribers_status ON crm_subscribers(status);
CREATE INDEX IF NOT EXISTS idx_crm_subscribers_tags ON crm_subscribers USING GIN(tags);

ALTER TABLE crm_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all subscribers" ON crm_subscribers;
CREATE POLICY "Admins can view all subscribers" ON crm_subscribers FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND global_admin = true));

DROP POLICY IF EXISTS "Users can view own subscription" ON crm_subscribers;
CREATE POLICY "Users can view own subscription" ON crm_subscribers FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own subscription" ON crm_subscribers;
CREATE POLICY "Users can manage own subscription" ON crm_subscribers FOR UPDATE
  USING (user_id = auth.uid());

-- CRM engagement tracking
CREATE TABLE IF NOT EXISTS crm_engagement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Engagement type
  type TEXT NOT NULL CHECK (type IN (
    'stream_watch', 'video_watch', 'comment', 'post', 
    'reaction', 'share', 'subscribe', 'unsubscribe',
    'event_register', 'event_attend', 'message_sent', 'message_received',
    'community_join', 'community_leave'
  )),
  
  -- Reference
  reference_id UUID,
  reference_type TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_engagement_user ON crm_engagement(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_engagement_type ON crm_engagement(type);
CREATE INDEX IF NOT EXISTS idx_crm_engagement_created ON crm_engagement(created_at DESC);

ALTER TABLE crm_engagement ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all engagement" ON crm_engagement;
CREATE POLICY "Admins can view all engagement" ON crm_engagement FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND global_admin = true));

DROP POLICY IF EXISTS "Users can view own engagement" ON crm_engagement;
CREATE POLICY "Users can view own engagement" ON crm_engagement FOR SELECT
  USING (user_id = auth.uid());

-- Insert engagement is allowed via service role only
DROP POLICY IF EXISTS "System can insert engagement" ON crm_engagement;
CREATE POLICY "System can insert engagement" ON crm_engagement FOR INSERT
  WITH CHECK (true);

-- User engagement scores (computed)
CREATE TABLE IF NOT EXISTS crm_user_scores (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Scores (0-100)
  engagement_score INTEGER DEFAULT 0,
  activity_score INTEGER DEFAULT 0,
  community_score INTEGER DEFAULT 0,
  
  -- Counts
  total_watch_minutes INTEGER DEFAULT 0,
  total_posts INTEGER DEFAULT 0,
  total_comments INTEGER DEFAULT 0,
  total_reactions INTEGER DEFAULT 0,
  events_attended INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  
  -- Last activity
  last_active_at TIMESTAMPTZ,
  
  -- Timestamps
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE crm_user_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all scores" ON crm_user_scores;
CREATE POLICY "Admins can view all scores" ON crm_user_scores FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND global_admin = true));

DROP POLICY IF EXISTS "Users can view own score" ON crm_user_scores;
CREATE POLICY "Users can view own score" ON crm_user_scores FOR SELECT
  USING (user_id = auth.uid());

-- ============================================================================
-- 7. HELPER FUNCTIONS
-- ============================================================================

-- Update playback history
CREATE OR REPLACE FUNCTION update_playback_history(
  p_user_id UUID,
  p_media_id UUID DEFAULT NULL,
  p_stream_id UUID DEFAULT NULL,
  p_video_id UUID DEFAULT NULL,
  p_progress INTEGER DEFAULT 0,
  p_duration INTEGER DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO playback_history (user_id, media_id, stream_id, video_id, progress_seconds, duration_seconds, completed)
  VALUES (
    p_user_id, 
    p_media_id, 
    p_stream_id, 
    p_video_id, 
    p_progress, 
    p_duration,
    CASE WHEN p_duration > 0 AND p_progress >= p_duration * 0.9 THEN TRUE ELSE FALSE END
  )
  ON CONFLICT (user_id, media_id) WHERE media_id IS NOT NULL
  DO UPDATE SET 
    progress_seconds = EXCLUDED.progress_seconds,
    duration_seconds = EXCLUDED.duration_seconds,
    completed = EXCLUDED.completed,
    updated_at = NOW(),
    watched_at = NOW()
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Toggle favorite
CREATE OR REPLACE FUNCTION toggle_favorite(
  p_user_id UUID,
  p_type TEXT,
  p_reference_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  CASE p_type
    WHEN 'media' THEN
      SELECT EXISTS(SELECT 1 FROM user_favorites WHERE user_id = p_user_id AND media_id = p_reference_id) INTO v_exists;
      IF v_exists THEN
        DELETE FROM user_favorites WHERE user_id = p_user_id AND media_id = p_reference_id;
        RETURN FALSE;
      ELSE
        INSERT INTO user_favorites (user_id, media_id) VALUES (p_user_id, p_reference_id);
        RETURN TRUE;
      END IF;
    WHEN 'video' THEN
      SELECT EXISTS(SELECT 1 FROM user_favorites WHERE user_id = p_user_id AND video_id = p_reference_id) INTO v_exists;
      IF v_exists THEN
        DELETE FROM user_favorites WHERE user_id = p_user_id AND video_id = p_reference_id;
        RETURN FALSE;
      ELSE
        INSERT INTO user_favorites (user_id, video_id) VALUES (p_user_id, p_reference_id);
        RETURN TRUE;
      END IF;
    WHEN 'channel' THEN
      SELECT EXISTS(SELECT 1 FROM user_favorites WHERE user_id = p_user_id AND channel_id = p_reference_id) INTO v_exists;
      IF v_exists THEN
        DELETE FROM user_favorites WHERE user_id = p_user_id AND channel_id = p_reference_id;
        RETURN FALSE;
      ELSE
        INSERT INTO user_favorites (user_id, channel_id) VALUES (p_user_id, p_reference_id);
        RETURN TRUE;
      END IF;
    WHEN 'creator' THEN
      SELECT EXISTS(SELECT 1 FROM user_favorites WHERE user_id = p_user_id AND creator_id = p_reference_id) INTO v_exists;
      IF v_exists THEN
        DELETE FROM user_favorites WHERE user_id = p_user_id AND creator_id = p_reference_id;
        RETURN FALSE;
      ELSE
        INSERT INTO user_favorites (user_id, creator_id) VALUES (p_user_id, p_reference_id);
        RETURN TRUE;
      END IF;
    ELSE
      RAISE EXCEPTION 'Invalid favorite type: %', p_type;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Track CRM engagement
CREATE OR REPLACE FUNCTION track_engagement(
  p_user_id UUID,
  p_type TEXT,
  p_reference_id UUID DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO crm_engagement (user_id, type, reference_id, reference_type, metadata)
  VALUES (p_user_id, p_type, p_reference_id, p_reference_type, p_metadata)
  RETURNING id INTO v_id;
  
  -- Update user scores
  INSERT INTO crm_user_scores (user_id, last_active_at)
  VALUES (p_user_id, NOW())
  ON CONFLICT (user_id) DO UPDATE SET last_active_at = NOW();
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get CRM stats for admin
CREATE OR REPLACE FUNCTION get_crm_stats()
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_subscribers', (SELECT COUNT(*) FROM crm_subscribers WHERE status = 'active'),
    'unsubscribed', (SELECT COUNT(*) FROM crm_subscribers WHERE status = 'unsubscribed'),
    'total_engagement', (SELECT COUNT(*) FROM crm_engagement WHERE created_at > NOW() - INTERVAL '30 days'),
    'active_users_7d', (SELECT COUNT(DISTINCT user_id) FROM crm_engagement WHERE created_at > NOW() - INTERVAL '7 days'),
    'active_users_30d', (SELECT COUNT(DISTINCT user_id) FROM crm_engagement WHERE created_at > NOW() - INTERVAL '30 days'),
    'engagement_by_type', (
      SELECT jsonb_object_agg(type, cnt)
      FROM (
        SELECT type, COUNT(*) as cnt 
        FROM crm_engagement 
        WHERE created_at > NOW() - INTERVAL '30 days'
        GROUP BY type
      ) t
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. ADD ADDITIONAL COMMUNITY GROUPS
-- ============================================================================

INSERT INTO community_groups (name, slug, description, category, is_featured, member_count) VALUES
  ('Net Worth', 'net-worth', 'Financial discussions for creators — revenue strategies, investments, and building wealth.', 'general', true, 0)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 9. CREATE OR REPLACE FUNCTIONS FOR REALTIME MESSAGING
-- ============================================================================

-- Check if user can send messages
CREATE OR REPLACE FUNCTION can_send_messages(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = p_user_id 
    AND tier NOT IN ('free', 'guest')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_read(p_user_id UUID, p_sender_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE direct_messages 
  SET read_at = NOW()
  WHERE recipient_id = p_user_id 
    AND sender_id = p_sender_id 
    AND read_at IS NULL;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get unread message count
CREATE OR REPLACE FUNCTION get_unread_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) 
    FROM direct_messages 
    WHERE recipient_id = p_user_id 
      AND read_at IS NULL
      AND NOT deleted_by_recipient
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
