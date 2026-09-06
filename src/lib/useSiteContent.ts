import { useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';
import type { SiteContent, SiteSettings, Product, Collection } from './types';

const STORAGE_KEY = 'vindeshi-content-v1';

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

// Default starter data — your actual inventory (3 women's totes + 1 men's laptop bag)
const defaultSettings: SiteSettings = {
  id: 1,
  brand_name: 'Vindeshi',
  brand_tagline: 'Handcrafted leather goods',
  announcement: 'Free shipping on orders over $100',
  hero_eyebrow: 'New collection',
  hero_title_line1: 'Crafted for',
  hero_title_line2: 'the journey',
  hero_subtitle: 'Discover our collection of handcrafted leather bags, designed to age beautifully with every adventure.',
  hero_image: '/images/20260718_160025.jpg',
  hero_caption: 'The Nomad Tote in Pink',
  shop_eyebrow: 'Shop',
  shop_title: 'Our collection',
  collections_eyebrow: 'Collections',
  collections_title: 'Curated edits',
  story_eyebrow: 'Our story',
  story_title: 'Made to',
  story_title_italic: 'last a lifetime',
  story_body1: 'Vindeshi was born from a simple belief: the things we carry should get better with age, not worse. Every bag is handcrafted in our workshop using full-grain leather that develops a rich patina over time.',
  story_body2: 'We source our materials responsibly and work with skilled artisans who share our commitment to quality. No shortcuts, no compromises — just honest goods made to accompany you for years to come.',
  story_image: '/images/20260718_160025.jpg',
  newsletter_eyebrow: 'Join us',
  newsletter_title: 'Get 10% off your first order',
  footer_copyright: '© 2024 Vindeshi. All rights reserved.',
};

const defaultProducts: Product[] = [
  {
    id: '1',
    name: 'Pink Tote',
    category: 'Women',
    price: '1,450',
    color: 'Pink',
    badge: 'Bestseller',
    image_url: '/images/20260718_160025.jpg',
    sort_order: 1,
    is_visible: true,
  },
  {
    id: '2',
    name: 'Mauve Tote',
    category: 'Women',
    price: '1,450',
    color: 'Mauve',
    badge: 'New',
    image_url: '/images/20260718_133617.jpg',
    sort_order: 2,
    is_visible: true,
  },
  {
    id: '3',
    name: 'Black Tote',
    category: 'Women',
    price: '1,450',
    color: 'Black',
    badge: null,
    image_url: '/images/20260718_133535.jpg',
    sort_order: 3,
    is_visible: true,
  },
  {
    id: '4',
    name: 'Black Laptop Briefcase',
    category: 'Men',
    price: '1,850',
    color: 'Black',
    badge: 'Popular',
    image_url: '/images/20260718_133505.jpg',
    sort_order: 4,
    is_visible: true,
  },
];

const defaultCollections: Collection[] = [
  {
    id: '1',
    eyebrow: 'For the office',
    title: 'Office essentials',
    image_url: '/images/20260718_160025.jpg',
    sort_order: 1,
  },
  {
    id: '2',
    eyebrow: 'Everyday carry',
    title: 'Tote collection',
    image_url: '/images/20260718_133535.jpg',
    sort_order: 2,
  },
];

// Read/write local content (used when Supabase is not configured)
function readLocalContent(): SiteContent {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SiteContent;
      if (parsed.settings && parsed.products && parsed.collections) return parsed;
    }
  } catch {
    // ignore — fall through to defaults
  }
  const initial: SiteContent = {
    settings: defaultSettings,
    products: defaultProducts,
    collections: defaultCollections,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  } catch {
    // storage may be unavailable
  }
  return initial;
}

function writeLocalContent(content: SiteContent): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
  } catch {
    // storage may be unavailable
  }
}

export function useSiteContent() {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Local-first mode: skip Supabase entirely
    if (!isSupabaseConfigured) {
      setContent(readLocalContent());
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
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { content, loading, error, reload: load };
}

// ── Mutators: work with both local storage and Supabase ─────────────
async function mutateContent(updater: (current: SiteContent) => SiteContent): Promise<SiteContent> {
  if (!isSupabaseConfigured) {
    const current = readLocalContent();
    const next = updater(current);
    writeLocalContent(next);
    return next;
  }
  // For Supabase, the individual functions below handle persistence.
  // This branch is only hit if the caller uses mutateContent directly with a remote DB.
  const current = readLocalContent();
  const next = updater(current);
  writeLocalContent(next);
  return next;
}

export async function updateSettings(patch: Partial<SiteSettings>): Promise<void> {
  if (!isSupabaseConfigured) {
    const current = readLocalContent();
    writeLocalContent({ ...current, settings: { ...current.settings, ...patch } });
    return;
  }
  const { error } = await supabase
    .from('site_settings')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', 1);
  if (error) throw error;
}

function generateId(): string {
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function createProduct(product: Omit<Product, 'id'>): Promise<Product> {
  if (!isSupabaseConfigured) {
    const created: Product = { ...product, id: generateId() };
    const current = readLocalContent();
    writeLocalContent({ ...current, products: [...current.products, created] });
    return created;
  }
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
  if (!isSupabaseConfigured) {
    const current = readLocalContent();
    const products = current.products.map((p) => (p.id === id ? { ...p, ...patch } : p));
    writeLocalContent({ ...current, products });
    return;
  }
  const { error } = await supabase.from('products').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteProduct(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const current = readLocalContent();
    const products = current.products.filter((p) => p.id !== id);
    writeLocalContent({ ...current, products });
    return;
  }
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

export async function createCollection(collection: Omit<Collection, 'id'>): Promise<Collection> {
  if (!isSupabaseConfigured) {
    const created: Collection = { ...collection, id: generateId() };
    const current = readLocalContent();
    writeLocalContent({ ...current, collections: [...current.collections, created] });
    return created;
  }
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
  if (!isSupabaseConfigured) {
    const current = readLocalContent();
    const collections = current.collections.map((c) => (c.id === id ? { ...c, ...patch } : c));
    writeLocalContent({ ...current, collections });
    return;
  }
  const { error } = await supabase.from('collections').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteCollection(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const current = readLocalContent();
    const collections = current.collections.filter((c) => c.id !== id);
    writeLocalContent({ ...current, collections });
    return;
  }
  const { error } = await supabase.from('collections').delete().eq('id', id);
  if (error) throw error;
}

export async function resetContent(): Promise<void> {
  if (!isSupabaseConfigured) {
    const initial: SiteContent = {
      settings: defaultSettings,
      products: defaultProducts,
      collections: defaultCollections,
    };
    writeLocalContent(initial);
    return;
  }
  // For Supabase mode, this is a no-op (would need to implement per-table reset)
}
