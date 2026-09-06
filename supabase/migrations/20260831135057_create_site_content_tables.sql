/*
# Create site content tables for Vindeshi admin panel

## Summary
Creates three tables that hold all editable content for the storefront:
site_settings (brand/logo/page text), products (shop grid cards), and
collections (collection showcase cards). Also creates a public storage
bucket for image uploads. The storefront reads everything publicly;
only authenticated admin users can write.

## New Tables

### site_settings (single row, id is always 1)
Holds every piece of editable text and the brand/logo information.
- brand_name: the logo wordmark (e.g. "VINDESHI")
- brand_tagline: the small text under the logo
- announcement: the top announcement bar text
- hero_eyebrow, hero_title_line1, hero_title_line2, hero_subtitle, hero_image, hero_caption
- shop_eyebrow, shop_title
- collections_eyebrow, collections_title
- story_eyebrow, story_title, story_title_italic, story_body1, story_body2, story_image
- newsletter_eyebrow, newsletter_title
- footer_copyright

### products
Editable product cards shown in the shop grid.
- name, category, price, color, badge, image_url, sort_order, is_visible

### collections
Editable collection showcase cards.
- eyebrow, title, image_url, sort_order

## Security
- RLS enabled on all three tables.
- Public SELECT (anon + authenticated) so the storefront works without login.
- INSERT / UPDATE / DELETE restricted to authenticated users only (admin).
- Storage bucket "site-images" is publicly readable; only authenticated can upload.
*/

-- ── site_settings ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS site_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  brand_name text NOT NULL DEFAULT 'VINDESHI',
  brand_tagline text NOT NULL DEFAULT 'Carry your everyday',
  announcement text NOT NULL DEFAULT 'Complimentary delivery on orders over Tk 2,000',
  hero_eyebrow text NOT NULL DEFAULT 'The new everyday',
  hero_title_line1 text NOT NULL DEFAULT 'Made to go',
  hero_title_line2 text NOT NULL DEFAULT 'with you.',
  hero_subtitle text NOT NULL DEFAULT 'Thoughtful bags for the rhythm of real life. Quietly beautiful, endlessly useful.',
  hero_image text NOT NULL DEFAULT '/images/20260718_133617.jpg',
  hero_caption text NOT NULL DEFAULT 'Crafted for the moments in between.',
  shop_eyebrow text NOT NULL DEFAULT 'Curated for you',
  shop_title text NOT NULL DEFAULT 'The essentials',
  collections_eyebrow text NOT NULL DEFAULT 'Find your carry',
  collections_title text NOT NULL DEFAULT 'Made for your world',
  story_eyebrow text NOT NULL DEFAULT 'The Vindeshi way',
  story_title text NOT NULL DEFAULT 'Less noise.',
  story_title_italic text NOT NULL DEFAULT 'More life.',
  story_body1 text NOT NULL DEFAULT 'We believe the right bag should make your day feel lighter. Every Vindeshi piece is designed with clean lines, considered details, and room for the things that matter.',
  story_body2 text NOT NULL DEFAULT 'Because good design should not ask for attention. It should simply keep up.',
  story_image text NOT NULL DEFAULT '/images/20260718_133505.jpg',
  newsletter_eyebrow text NOT NULL DEFAULT 'Stay in the know',
  newsletter_title text NOT NULL DEFAULT 'A little inspiration, delivered.',
  footer_copyright text NOT NULL DEFAULT '© 2026 Vindeshi',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_site_settings" ON site_settings;
CREATE POLICY "public_read_site_settings" ON site_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_update_site_settings" ON site_settings;
CREATE POLICY "admin_update_site_settings" ON site_settings FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- ── products ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Women',
  price text NOT NULL,
  color text NOT NULL,
  badge text,
  image_url text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_products" ON products;
CREATE POLICY "public_read_products" ON products FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_products" ON products;
CREATE POLICY "admin_insert_products" ON products FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_products" ON products;
CREATE POLICY "admin_update_products" ON products FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_products" ON products;
CREATE POLICY "admin_delete_products" ON products FOR DELETE
  TO authenticated USING (true);

-- ── collections ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  eyebrow text NOT NULL,
  title text NOT NULL,
  image_url text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_collections" ON collections;
CREATE POLICY "public_read_collections" ON collections FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_collections" ON collections;
CREATE POLICY "admin_insert_collections" ON collections FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_collections" ON collections;
CREATE POLICY "admin_update_collections" ON collections FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_collections" ON collections;
CREATE POLICY "admin_delete_collections" ON collections FOR DELETE
  TO authenticated USING (true);

-- ── Seed default settings row ──────────────────────────────────
INSERT INTO site_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- ── Seed products (removed one black + one pink duplicate per user request) ──
INSERT INTO products (name, category, price, color, badge, image_url, sort_order) VALUES
  ('Signature Work Tote', 'Women', '1,450', 'Black', 'Bestseller', '/images/20260718_133617.jpg', 0),
  ('Signature Work Tote', 'Travel', '1,450', 'Mauve', NULL, '/images/20260718_133505.jpg', 1)
ON CONFLICT DO NOTHING;

-- ── Seed collections ───────────────────────────────────────────
INSERT INTO collections (eyebrow, title, image_url, sort_order) VALUES
  ('The signature tote', 'Carry your confidence.', '/images/20260718_133535.jpg', 0),
  ('For every day', 'Made for moving.', '/images/20260718_160025.jpg', 1)
ON CONFLICT DO NOTHING;

-- ── Storage bucket for image uploads ───────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-images', 'site-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: public read, authenticated upload/update/delete
DROP POLICY IF EXISTS "public_read_site_images" ON storage.objects;
CREATE POLICY "public_read_site_images" ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'site-images');

DROP POLICY IF EXISTS "admin_upload_site_images" ON storage.objects;
CREATE POLICY "admin_upload_site_images" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'site-images');

DROP POLICY IF EXISTS "admin_update_site_images" ON storage.objects;
CREATE POLICY "admin_update_site_images" ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'site-images');

DROP POLICY IF EXISTS "admin_delete_site_images" ON storage.objects;
CREATE POLICY "admin_delete_site_images" ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'site-images');
