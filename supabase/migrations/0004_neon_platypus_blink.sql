DROP POLICY IF EXISTS "admin_upload_site_images" ON storage.objects;
CREATE POLICY "admin_upload_site_images" ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'site-images')