import { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import type { SiteContent, SiteSettings, Product, Collection } from './types';

const SETTINGS_KEYS = [
  'id', 'brand_name', 'brand_tagline', 'announcement',
  'hero_eyebrow', 'hero_title_line1', 'hero_title_line2', 'hero_subtitle',
  'hero_image', 'hero_caption',
  'shop_eyebrow', 'shop_title',
  'collections_eyebrow', 'collections_title',
  'story_eyebrow', 'story_title', 'story_title_italic', 'story_body1', 'story_body2', 'story_image',
  'newsletter_eyebrow', 'newsletter_title',
  'footer_copyright',
].join(', ');

const PRODUCT_KEYS = 'id, name, category, price, color, badge, image_url, sort_order, is_visible';
const COLLECTION_KEYS = 'id, eyebrow, title, image_url, sort_order';

export function useSiteContent() {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [settingsRes, productsRes, collectionsRes] = await Promise.all([
        supabase.from('site_settings').select(SETTINGS_KEYS).eq('id', 1).maybeSingle(),
        supabase.from('products').select(PRODUCT_KEYS).order('sort_order', { ascending: true }),
        supabase.from('collections').select(COLLECTION_KEYS).order('sort_order', { ascending: true }),
      ]);

      if (settingsRes.error) throw settingsRes.error;
      if (productsRes.error) throw productsRes.error;
      if (collectionsRes.error) throw collectionsRes.error;

      if (!settingsRes.data) {
        setError('Site settings not found.');
        setLoading(false);
        return;
      }

      setContent({
        settings: settingsRes.data as unknown as SiteSettings,
        products: (productsRes.data ?? []) as unknown as Product[],
        collections: (collectionsRes.data ?? []) as unknown as Collection[],
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
