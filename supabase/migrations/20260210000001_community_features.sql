-- ============================================================================
-- COMMUNITY FEATURES
-- Groups, Events, Discussions, and Memberships
-- ============================================================================

-- Community Groups / Spaces
CREATE TABLE IF NOT EXISTS community_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT, -- SVG icon name or path
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'tech', 'industry', 'marketing', 'dev', 'support')),
  member_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE community_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Groups are viewable by everyone" ON community_groups FOR SELECT USING (is_public = true);
CREATE POLICY "Admins can manage groups" ON community_groups FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'master_admin'))
);

CREATE INDEX idx_community_groups_slug ON community_groups(slug);
CREATE INDEX idx_community_groups_featured ON community_groups(is_featured);

-- Group Memberships
CREATE TABLE IF NOT EXISTS group_memberships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES community_groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE group_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Memberships are viewable by everyone" ON group_memberships FOR SELECT USING (true);
CREATE POLICY "Users can join groups" ON group_memberships FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave groups" ON group_memberships FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_group_memberships_group ON group_memberships(group_id);
CREATE INDEX idx_group_memberships_user ON group_memberships(user_id);

-- Update member count trigger
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_groups SET member_count = member_count - 1 WHERE id = OLD.group_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_group_membership_change
  AFTER INSERT OR DELETE ON group_memberships
  FOR EACH ROW
  EXECUTE FUNCTION update_group_member_count();

-- Community Events
CREATE TABLE IF NOT EXISTS community_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT DEFAULT 'webinar' CHECK (event_type IN ('virtual_conference', 'webinar', 'workshop', 'meetup', 'ama')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  location TEXT, -- URL for virtual, address for physical
  max_attendees INTEGER,
  attendee_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  group_id UUID REFERENCES community_groups(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE community_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events are viewable by everyone" ON community_events FOR SELECT USING (is_public = true);
CREATE POLICY "Admins can manage events" ON community_events FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'master_admin'))
);

CREATE INDEX idx_community_events_date ON community_events(start_date);
CREATE INDEX idx_community_events_featured ON community_events(is_featured);

-- Event Registrations
CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES community_events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'cancelled')),
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Registrations viewable by user" ON event_registrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can register for events" ON event_registrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can cancel registration" ON event_registrations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete registration" ON event_registrations FOR DELETE USING (auth.uid() = user_id);

-- Update attendee count trigger
CREATE OR REPLACE FUNCTION update_event_attendee_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_events SET attendee_count = attendee_count + 1 WHERE id = NEW.event_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_events SET attendee_count = attendee_count - 1 WHERE id = OLD.event_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_event_registration_change
  AFTER INSERT OR DELETE ON event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_event_attendee_count();

-- Discussion Posts (for groups)
CREATE TABLE IF NOT EXISTS discussion_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES community_groups(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  like_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE discussion_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posts are viewable by everyone" ON discussion_posts FOR SELECT USING (true);
CREATE POLICY "Members can post" ON discussion_posts FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM group_memberships WHERE group_id = discussion_posts.group_id AND user_id = auth.uid())
);
CREATE POLICY "Authors can edit posts" ON discussion_posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete posts" ON discussion_posts FOR DELETE USING (auth.uid() = author_id);

CREATE INDEX idx_discussion_posts_group ON discussion_posts(group_id);
CREATE INDEX idx_discussion_posts_author ON discussion_posts(author_id);

-- ============================================================================
-- SEED DEFAULT COMMUNITY GROUPS
-- ============================================================================

INSERT INTO community_groups (name, slug, description, category, is_featured, member_count) VALUES
  ('Creator Lounge', 'creator-lounge', 'General discussion for all Youcast creators. Share wins, ask questions, collaborate.', 'general', true, 0),
  ('Stream Tech', 'stream-tech', 'Technical discussions on streaming setups, encoding, and production workflows.', 'tech', true, 0),
  ('Church Media', 'church-media', 'Dedicated space for church media teams sharing best practices for worship broadcasts.', 'industry', true, 0),
  ('Podcast Network', 'podcast-network', 'Audio creators discussing recording, editing, distribution, and audience growth.', 'industry', true, 0),
  ('Growth & Marketing', 'growth-marketing', 'Strategies for audience growth, SEO, social media, and cross-promotion.', 'marketing', true, 0),
  ('Developer Hub', 'developer-hub', 'API discussions, integrations, custom tools, and open-source contributions.', 'dev', true, 0)
ON CONFLICT (slug) DO NOTHING;

-- Seed some upcoming events
INSERT INTO community_events (title, description, event_type, start_date, end_date, is_featured, is_public) VALUES
  ('Creator Summit 2026', 'Three days of workshops, panels, and networking with top creators from around the world.', 'virtual_conference', '2026-03-15 09:00:00+00', '2026-03-17 18:00:00+00', true, true),
  ('Stream Tech Workshop', 'Hands-on session on multi-camera streaming setups and audio optimization for professional broadcasts.', 'workshop', '2026-02-20 14:00:00+00', '2026-02-20 16:00:00+00', true, true),
  ('Monetization Masterclass', 'Learn proven strategies for subscription models, sponsor partnerships, and diversifying revenue streams.', 'webinar', '2026-02-28 18:00:00+00', '2026-02-28 19:30:00+00', true, true),
  ('Church Media Meetup', 'Monthly gathering for church media teams to share setups, workflows, and best practices.', 'meetup', '2026-03-05 19:00:00+00', '2026-03-05 20:30:00+00', false, true)
ON CONFLICT DO NOTHING;
