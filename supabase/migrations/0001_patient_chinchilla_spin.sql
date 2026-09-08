CREATE TABLE IF NOT EXISTS public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote text NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT '',
  sort_order int NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.testimonials TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.testimonials TO authenticated;

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_testimonials" ON public.testimonials
FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "admin_insert_testimonials" ON public.testimonials
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "admin_update_testimonials" ON public.testimonials
FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "admin_delete_testimonials" ON public.testimonials
FOR DELETE TO authenticated USING (true);

INSERT INTO public.testimonials (quote, name, role, sort_order) VALUES
  ('The tote carries my whole life — laptop, lunch, everything — and still looks elegant.', 'Rifat Ahmed', 'Architect, Dhaka', 0),
  ('Beautifully made. The straps stay comfortable even on my longest days.', 'Nusrat Jahan', 'Designer, Chattogram', 1),
  ('Quiet, confident design. It goes from the office to dinner without missing a beat.', 'Tanvir Hasan', 'Photographer, Sylhet', 2)
ON CONFLICT DO NOTHING