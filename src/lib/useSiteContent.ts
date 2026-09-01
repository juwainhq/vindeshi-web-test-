import { useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';
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

// Fallback data for preview/development when Supabase is not configured
const fallbackSettings: SiteSettings = {
  id: 1,
  brand_name: 'Vindeshi',
  brand_tagline: 'Handcrafted leather goods',
  announcement: 'Free shipping on orders over $100',
  hero_eyebrow: 'New Collection',
  hero_title_line1: 'Crafted for',
  hero_title_line2: 'the journey',
  hero_subtitle: 'Discover our latest collection of handcrafted leather bags, designed to age beautifully with every adventure.',
  hero_image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80',
  hero_caption: 'The Nomad Tote in Natural',
  shop_eyebrow: 'Shop',
  shop_title: 'Our Collection',
  collections_eyebrow: 'Collections',
  collections_title: 'Curated edits',
  story_eyebrow: 'Our Story',
  story_title: 'Made to',
  story_title_italic: 'last a lifetime',
  story_body1: 'Vindeshi was born from a simple belief: the things we carry should get better with age, not worse. Every bag is handcrafted in our workshop using full-grain leather that develops a rich patina over time.',
  story_body2: 'We source our materials responsibly and work with skilled artisans who share our commitment to quality. No shortcuts, no compromises — just honest goods made to accompany you for years to come.',
  story_image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
  newsletter_eyebrow: 'Join us',
  newsletter_title: 'Get 10% off your first order',
  footer_copyright: '© 2024 Vindeshi. All rights reserved.',
};

const fallbackProducts: Product[] = [
  {
    id: '1',
    name: 'The Nomad Tote',
    category: 'Women',
    price: '285',
    color: 'Natural',
    badge: 'Bestseller',
    image_url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80',
    sort_order: 1,
    is_visible: true,
  },
  {
    id: '2',
    name: 'The Weekender',
    category: 'Travel',
    price: '425',
    color: 'Cognac',
    badge: 'New',
    image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80',
    sort_order: 2,
    is_visible: true,
  },
  {
    id: '3',
    name: 'The Slim Brief',
    category: 'Men',
    price: '320',
    color: 'Black',
    badge: null,
    image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80',
    sort_order: 3,
    is_visible: true,
  },
  {
    id: '4',
    name: 'The Crossbody',
    category: 'Women',
    price: '195',
    color: 'Tan',
    badge: null,
    image_url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80',
    sort_order: 4,
    is_visible: true,
  },
  {
    id: '5',
    name: 'The Card Holder',
    category: 'Men',
    price: '65',
    color: 'Natural',
    badge: null,
    image_url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&q=80',
    sort_order: 5,
    is_visible: true,
  },
  {
    id: '6',
    name: 'The Passport Cover',
    category: 'Travel',
    price: '85',
    color: 'Cognac',
    badge: null,
    image_url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&q=80',
    sort_order: 6,
    is_visible: true,
  },
  {
    id: '7',
    name: 'The Belt Bag',
    category: 'Women',
    price: '165',
    color: 'Black',
    badge: 'Popular',
    image_url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80',
    sort_order: 7,
    is_visible: true,
  },
  {
    id: '8',
    name: 'The Key Fob',
    category: 'Men',
    price: '45',
    color: 'Tan',
    badge: null,
    image_url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&q=80',
    sort_order: 8,
    is_visible: true,
  },
];

const fallbackCollections: Collection[] = [
  {
    id: '1',
    eyebrow: 'Everyday Essentials',
    title: 'The Daily Edit',
    image_url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80',
    sort_order: 1,
  },
  {
    id: '2',
    eyebrow: 'For the Journey',
    title: 'Travel Companions',
    image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
    sort_order: 2,
  },
];

export function useSiteContent() {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    // If Supabase is not configured, use fallback data immediately
    if (!isSupabaseConfigured) {
      setContent({
        settings: fallbackSettings,
        products: fallbackProducts,
        collections: fallbackCollections,
      });
      setLoading(false);
      return;
    }

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
      // On error, fall back to local data so the UI still works
      setContent({
        settings: fallbackSettings,
        products: fallbackProducts,
        collections: fallbackCollections,
      });
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