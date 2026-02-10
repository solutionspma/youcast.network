-- Enable storage RLS policies for media bucket

-- Allow authenticated users to upload to media bucket
CREATE POLICY "Authenticated users can upload media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media');

-- Allow anyone to view/download media files (public bucket)
CREATE POLICY "Anyone can read media files"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update their media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'media')
WITH CHECK (bucket_id = 'media');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete their media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'media');
