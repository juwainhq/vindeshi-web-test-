import { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import { getLocalProducts } from './local-store';
import type { SiteContent, SiteSettings, Product, Collection, Testimonial } from './types';

const SETTINGS_KEYS = [
  'id', 'brand_name', 'brand_tagline', 'announcement',
  'hero_eyebrow', 'hero_title_line1', 'hero_title_line2', 'hero_subtitle',
  'hero_image', 'hero_caption',
  'shop_eyebrow', 'shop_title',
  'collections_eyebrow', 'collections_title',
  'story_eyebrow', 'story_title', 'story_title_italic', 'story_body1', 'story_body2', 'story_image',
  'newsletter_eyebrow', 'newsletter_title',
  'footer_copyright',
  'features_eyebrow', 'features_title',
  'feature1_title', 'feature1_text', 'feature2_title', 'feature2_text', 'feature3_title', 'feature3_text',
  'testimonials_eyebrow', 'testimonials_title',
].join(', ');

const PRODUCT_KEYS = 'id, name, category, price, color, badge, description, images, sort_order, is_visible';
const COLLECTION_KEYS = 'id, eyebrow, title, image_url, sort_order';
const TESTIMONIAL_KEYS = 'id, quote, name, role, sort_order, is_visible';

export function useSiteContent() {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [settingsRes, productsRes, collectionsRes, testimonialsRes] = await Promise.all([
        supabase.from('site_settings').select(SETTINGS_KEYS).eq('id', 1).maybeSingle(),
        supabase.from('products').select(PRODUCT_KEYS).order('sort_order', { ascending: true }),
        supabase.from('collections').select(COLLECTION_KEYS).order('sort_order', { ascending: true }),
        supabase.from('testimonials').select(TESTIMONIAL_KEYS).order('sort_order', { ascending: true }),
      ]);

      if (settingsRes.error) throw settingsRes.error;
      if (productsRes.error) throw productsRes.error;
      if (collectionsRes.error) throw collectionsRes.error;
      if (testimonialsRes.error) throw testimonialsRes.error;

      if (!settingsRes.data) {
        setError('Site settings not found.');
        setLoading(false);
        return;
      }

      // The hidden admin's Inventory tab saves products to localStorage —
      // when present, they override the database list everywhere.
      const localProducts = getLocalProducts();

      setContent({
        settings: settingsRes.data as unknown as SiteSettings,
        products: (localProducts ?? productsRes.data ?? []) as unknown as Product[],
        collections: (collectionsRes.data ?? []) as unknown as Collection[],
        testimonials: (testimonialsRes.data ?? []) as unknown as Testimonial[],
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not load site content.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { content, loading, error, reload: load };
}

export async function updateSettings(patch: Partial<SiteSettings>): Promise<void> {
  const { error } = await supabase
    .from('site_settings')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', 1);
  if (error) throw error;
}

export async function createProduct(product: Omit<Product, 'id'>): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select(PRODUCT_KEYS)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Could not create product.');
  return data as unknown as Product;
}

/**
 * Replaces the live store with the catalog from src/data/products.ts.
 * Deletes everything in the products table, then inserts the catalog
 * with fresh database ids.
 */
export async function importCatalog(catalog: Product[]): Promise<void> {
  const { error: deleteError } = await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (deleteError) throw deleteError;

  const rows = catalog.map((p) => ({
    name: p.name,
    category: p.category,
    price: p.price,
    color: p.color,
    badge: p.badge,
    description: p.description,
    images: p.images,
    sort_order: p.sort_order,
    is_visible: p.is_visible,
  }));

  const { error: insertError } = await supabase.from('products').insert(rows);
  if (insertError) throw insertError;
}

export async function updateProduct(id: string, patch: Partial<Product>): Promise<void> {
  const { error } = await supabase.from('products').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

export async function createCollection(collection: Omit<Collection, 'id'>): Promise<Collection> {
  const { data, error } = await supabase
    .from('collections')
    .insert(collection)
    .select(COLLECTION_KEYS)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Could not create collection.');
  return data as unknown as Collection;
}

export async function updateCollection(id: string, patch: Partial<Collection>): Promise<void> {
  const { error } = await supabase.from('collections').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteCollection(id: string): Promise<void> {
  const { error } = await supabase.from('collections').delete().eq('id', id);
  if (error) throw error;
}

export async function createTestimonial(testimonial: Omit<Testimonial, 'id'>): Promise<Testimonial> {
  const { data, error } = await supabase
    .from('testimonials')
    .insert(testimonial)
    .select(TESTIMONIAL_KEYS)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Could not create testimonial.');
  return data as unknown as Testimonial;
}

export async function updateTestimonial(id: string, patch: Partial<Testimonial>): Promise<void> {
  const { error } = await supabase.from('testimonials').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteTestimonial(id: string): Promise<void> {
  const { error } = await supabase.from('testimonials').delete().eq('id', id);
  if (error) throw error;
}
