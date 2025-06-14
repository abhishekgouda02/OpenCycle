/*
  # Create Storage Buckets for File Uploads

  1. Storage Buckets
    - `item-images` - for item photos
    - `avatars` - for user profile pictures

  2. Security
    - Public read access for item images and avatars
    - Authenticated users can upload files
    - Users can only delete their own files

  3. File Policies
    - Limit file sizes and types
    - Organize files by user ID
*/

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('item-images', 'item-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]),
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[])
ON CONFLICT (id) DO NOTHING;

-- Item images policies
CREATE POLICY "Anyone can view item images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'item-images');

CREATE POLICY "Authenticated users can upload item images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'item-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own item images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'item-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own item images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'item-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Avatar policies
CREATE POLICY "Anyone can view avatars"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatars"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatars"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );