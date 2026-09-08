ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS features_eyebrow text NOT NULL DEFAULT 'Why Vindeshi',
  ADD COLUMN IF NOT EXISTS features_title text NOT NULL DEFAULT 'Designed around your day',
  ADD COLUMN IF NOT EXISTS feature1_title text NOT NULL DEFAULT 'Free delivery',
  ADD COLUMN IF NOT EXISTS feature1_text text NOT NULL DEFAULT 'On all orders over Tk 2,000',
  ADD COLUMN IF NOT EXISTS feature2_title text NOT NULL DEFAULT 'Thoughtful design',
  ADD COLUMN IF NOT EXISTS feature2_text text NOT NULL DEFAULT 'Clean lines, considered details',
  ADD COLUMN IF NOT EXISTS feature3_title text NOT NULL DEFAULT 'Made to last',
  ADD COLUMN IF NOT EXISTS feature3_text text NOT NULL DEFAULT 'Crafted from durable materials',
  ADD COLUMN IF NOT EXISTS testimonials_eyebrow text NOT NULL DEFAULT 'Kind words',
  ADD COLUMN IF NOT EXISTS testimonials_title text NOT NULL DEFAULT 'Loved by everyday carriers'