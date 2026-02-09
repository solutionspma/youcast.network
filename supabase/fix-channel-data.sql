-- Clean up mock data and fix channel names
-- Run this in your Supabase SQL editor

-- 1. Find and update the channel for solutions@pitchmarketing.agency
UPDATE channels 
SET 
  name = 'Pitch Marketing Agency',
  handle = 'pitch-marketing-agency',
  description = 'Official Pitch Marketing Agency channel'
WHERE creator_id IN (
  SELECT id FROM auth.users WHERE email = 'solutions@pitchmarketing.agency'
);

-- 2. Remove any mock/test channels that don't belong to real users
-- Be careful with this - only run if you're sure there are fake channels
-- DELETE FROM channels WHERE name LIKE '%Elevation%' OR name LIKE '%Devstream%' OR name LIKE '%Daily Brief%';

-- 3. Verify the channel was updated
SELECT 
  c.id,
  c.name,
  c.handle,
  c.description,
  u.email
FROM channels c
JOIN auth.users u ON c.creator_id = u.id
WHERE u.email = 'solutions@pitchmarketing.agency';
