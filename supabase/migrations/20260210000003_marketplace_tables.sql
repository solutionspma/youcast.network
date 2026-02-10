-- ============================================================================
-- MARKETPLACE TABLES MIGRATION
-- Tables for preset marketplace, purchases, and reviews
-- ============================================================================

-- Marketplace Items (Presets)
CREATE TABLE IF NOT EXISTS marketplace_items (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Basic info
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'overlay-pack', 'scene-bundle', 'alert-pack', 'sound-pack',
    'transition-pack', 'stinger-collection', 'music-pack',
    'full-streaming-kit', 'niche-starter', 'single-overlay'
  )),
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Full manifest (JSON)
  manifest JSONB NOT NULL,
  
  -- Pricing
  price NUMERIC(10, 2), -- NULL = free
  currency TEXT DEFAULT 'USD',
  
  -- Author info
  author_verified BOOLEAN DEFAULT FALSE,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'rejected', 'archived')),
  rejection_reason TEXT,
  
  -- Stats
  downloads INTEGER DEFAULT 0,
  rating NUMERIC(2, 1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  published_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_marketplace_status ON marketplace_items(status);
CREATE INDEX idx_marketplace_category ON marketplace_items(category);
CREATE INDEX idx_marketplace_downloads ON marketplace_items(downloads DESC);
CREATE INDEX idx_marketplace_rating ON marketplace_items(rating DESC);
CREATE INDEX idx_marketplace_featured ON marketplace_items(featured);
CREATE INDEX idx_marketplace_price ON marketplace_items(price);
CREATE INDEX idx_marketplace_tags ON marketplace_items USING GIN(tags);
CREATE INDEX idx_marketplace_user ON marketplace_items(user_id);

-- User Purchases
CREATE TABLE IF NOT EXISTS user_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  preset_id TEXT REFERENCES marketplace_items(id) ON DELETE SET NULL NOT NULL,
  
  -- Transaction
  price NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_id TEXT, -- Stripe payment ID
  
  -- License
  license_id TEXT NOT NULL DEFAULT uuid_generate_v4()::TEXT,
  
  -- Usage
  download_count INTEGER DEFAULT 0,
  last_downloaded TIMESTAMPTZ,
  
  -- Timestamps
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, preset_id)
);

-- Indexes
CREATE INDEX idx_purchases_user ON user_purchases(user_id);
CREATE INDEX idx_purchases_preset ON user_purchases(preset_id);
CREATE INDEX idx_purchases_status ON user_purchases(payment_status);

-- User Installed Presets
CREATE TABLE IF NOT EXISTS user_installed_presets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  preset_id TEXT REFERENCES marketplace_items(id) ON DELETE CASCADE NOT NULL,
  
  installed_at TIMESTAMPTZ DEFAULT NOW(),
  version TEXT,
  
  UNIQUE(user_id, preset_id)
);

CREATE INDEX idx_installed_user ON user_installed_presets(user_id);

-- User Favorites
CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  preset_id TEXT REFERENCES marketplace_items(id) ON DELETE CASCADE NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, preset_id)
);

CREATE INDEX idx_favorites_user ON user_favorites(user_id);

-- Preset Reviews
CREATE TABLE IF NOT EXISTS preset_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  preset_id TEXT REFERENCES marketplace_items(id) ON DELETE CASCADE NOT NULL,
  
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  
  -- Moderation
  visible BOOLEAN DEFAULT TRUE,
  flagged BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, preset_id)
);

CREATE INDEX idx_reviews_preset ON preset_reviews(preset_id);
CREATE INDEX idx_reviews_rating ON preset_reviews(rating);

-- Creator Earnings (for paid presets)
CREATE TABLE IF NOT EXISTS creator_earnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  preset_id TEXT REFERENCES marketplace_items(id) ON DELETE SET NULL,
  purchase_id UUID REFERENCES user_purchases(id) ON DELETE SET NULL,
  
  -- Amounts
  gross_amount NUMERIC(10, 2) NOT NULL,
  platform_fee NUMERIC(10, 2) NOT NULL,
  net_amount NUMERIC(10, 2) NOT NULL,
  
  -- Payout
  payout_status TEXT DEFAULT 'pending' CHECK (payout_status IN ('pending', 'processing', 'paid', 'failed')),
  payout_id TEXT,
  paid_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_earnings_user ON creator_earnings(user_id);
CREATE INDEX idx_earnings_status ON creator_earnings(payout_status);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE marketplace_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_installed_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE preset_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_earnings ENABLE ROW LEVEL SECURITY;

-- Marketplace items: Anyone can view active items
CREATE POLICY "Active items are public"
  ON marketplace_items FOR SELECT
  USING (status = 'active');

-- Users can view their own submissions
CREATE POLICY "Users can view own submissions"
  ON marketplace_items FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert new items
CREATE POLICY "Users can submit presets"
  ON marketplace_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own items
CREATE POLICY "Users can update own items"
  ON marketplace_items FOR UPDATE
  USING (auth.uid() = user_id);

-- Purchases: Users can view their own
CREATE POLICY "Users can view own purchases"
  ON user_purchases FOR SELECT
  USING (auth.uid() = user_id);

-- Installed: Users manage their own
CREATE POLICY "Users manage own installed"
  ON user_installed_presets FOR ALL
  USING (auth.uid() = user_id);

-- Favorites: Users manage their own
CREATE POLICY "Users manage own favorites"
  ON user_favorites FOR ALL
  USING (auth.uid() = user_id);

-- Reviews: Anyone can read, users manage own
CREATE POLICY "Reviews are public"
  ON preset_reviews FOR SELECT
  USING (visible = true);

CREATE POLICY "Users manage own reviews"
  ON preset_reviews FOR ALL
  USING (auth.uid() = user_id);

-- Earnings: Users view their own
CREATE POLICY "Users view own earnings"
  ON creator_earnings FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to increment download count
CREATE OR REPLACE FUNCTION increment_downloads(preset_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE marketplace_items
  SET downloads = downloads + 1
  WHERE id = preset_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get marketplace stats
CREATE OR REPLACE FUNCTION get_marketplace_stats()
RETURNS TABLE (
  total_items INTEGER,
  total_downloads BIGINT,
  total_creators INTEGER,
  free_items INTEGER,
  paid_items INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER AS total_items,
    SUM(downloads)::BIGINT AS total_downloads,
    COUNT(DISTINCT user_id)::INTEGER AS total_creators,
    COUNT(*) FILTER (WHERE price IS NULL)::INTEGER AS free_items,
    COUNT(*) FILTER (WHERE price IS NOT NULL)::INTEGER AS paid_items
  FROM marketplace_items
  WHERE status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STORAGE BUCKET
-- ============================================================================

-- Create storage bucket for preset files (run this separately if needed)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('marketplace-presets', 'marketplace-presets', false)
-- ON CONFLICT DO NOTHING;
