-- Allow channel owners to delete their own streams
CREATE POLICY "Channel owners can delete their streams"
  ON streams FOR DELETE
  USING (
    channel_id IN (
      SELECT id FROM channels WHERE creator_id = auth.uid()
    )
  );

-- Allow channel owners to update their own streams (for viewer counts, etc)
CREATE POLICY "Channel owners can update their streams"
  ON streams FOR UPDATE
  USING (
    channel_id IN (
      SELECT id FROM channels WHERE creator_id = auth.uid()
    )
  )
  WITH CHECK (
    channel_id IN (
      SELECT id FROM channels WHERE creator_id = auth.uid()
    )
  );
