-- Fix RLS policies for streams table
-- Allow authenticated users to view all streams (not just live ones)
-- This enables better error handling and allows creators to test their streams

-- Drop old restrictive policy
DROP POLICY IF EXISTS "Live streams are viewable by everyone" ON streams;

-- New policies for better access control
CREATE POLICY "Anyone can view live streams" ON streams 
  FOR SELECT 
  USING (status = 'live');

CREATE POLICY "Creators can view their own streams" ON streams 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM channels
      WHERE channels.id = streams.channel_id
      AND channels.creator_id = auth.uid()
    )
  );

-- Allow authenticated users to view any stream
-- This allows viewers to get better error messages and connect to streams
CREATE POLICY "Authenticated users can view any stream" ON streams
  FOR SELECT
  USING (auth.role() = 'authenticated');
