-- ============================================================================
-- FIX CRM TABLES TO ALIGN WITH FRONTEND
-- ============================================================================

-- 1. Add total_score computed column to crm_user_scores
ALTER TABLE crm_user_scores
ADD COLUMN IF NOT EXISTS loyalty_score INTEGER DEFAULT 0;

ALTER TABLE crm_user_scores
ADD COLUMN IF NOT EXISTS total_score INTEGER GENERATED ALWAYS AS (
  engagement_score + activity_score + COALESCE(loyalty_score, 0)
) STORED;

-- 2. Update get_crm_stats function to return expected fields
CREATE OR REPLACE FUNCTION get_crm_stats()
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_subscribers', (SELECT COUNT(*) FROM crm_subscribers),
    'active_subscribers', (SELECT COUNT(*) FROM crm_subscribers WHERE status = 'active'),
    'new_subscribers_30d', (SELECT COUNT(*) FROM crm_subscribers WHERE subscribed_at > NOW() - INTERVAL '30 days'),
    'total_engagement', (SELECT COUNT(*) FROM crm_engagement),
    'engagement_30d', (SELECT COUNT(*) FROM crm_engagement WHERE created_at > NOW() - INTERVAL '30 days'),
    'avg_score', COALESCE((SELECT AVG(total_score)::numeric(10,1) FROM crm_user_scores), 0)
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create a view that aliases 'type' to 'event_type' for compatibility
CREATE OR REPLACE VIEW crm_engagement_view AS
SELECT 
  id,
  user_id,
  type AS event_type,
  reference_id,
  reference_type,
  metadata,
  created_at
FROM crm_engagement;

-- 4. Grant permissions on the view
GRANT SELECT ON crm_engagement_view TO authenticated;

-- 5. Update RLS policy for master account on crm_subscribers
DROP POLICY IF EXISTS "Master account can view all subscribers" ON crm_subscribers;
CREATE POLICY "Master account can view all subscribers" ON crm_subscribers FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND global_admin = true)
    OR EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email ILIKE 'solutions@pitchmarketing.agency')
  );

DROP POLICY IF EXISTS "Master account can manage subscribers" ON crm_subscribers;  
CREATE POLICY "Master account can manage subscribers" ON crm_subscribers FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND global_admin = true)
    OR EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email ILIKE 'solutions@pitchmarketing.agency')
  );

-- 6. Update RLS policy for master account on crm_engagement
DROP POLICY IF EXISTS "Master account can view all engagement" ON crm_engagement;
CREATE POLICY "Master account can view all engagement" ON crm_engagement FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND global_admin = true)
    OR EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email ILIKE 'solutions@pitchmarketing.agency')
    OR user_id = auth.uid()
  );

-- 7. Update RLS policy for master account on crm_user_scores  
DROP POLICY IF EXISTS "Master account can view all scores" ON crm_user_scores;
CREATE POLICY "Master account can view all scores" ON crm_user_scores FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND global_admin = true)
    OR EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email ILIKE 'solutions@pitchmarketing.agency')
    OR user_id = auth.uid()
  );

-- 8. Update profiles RLS to allow master account to view and edit all profiles
DROP POLICY IF EXISTS "Master account can view all profiles" ON profiles;
CREATE POLICY "Master account can view all profiles" ON profiles FOR SELECT
  USING (
    id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND global_admin = true)
    OR EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email ILIKE 'solutions@pitchmarketing.agency')
  );

DROP POLICY IF EXISTS "Master account can update all profiles" ON profiles;
CREATE POLICY "Master account can update all profiles" ON profiles FOR UPDATE
  USING (
    id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND global_admin = true)
    OR EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email ILIKE 'solutions@pitchmarketing.agency')
  );
