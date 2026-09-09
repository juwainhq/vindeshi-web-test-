/**
 * ─────────────────────────────────────────────────────────────────
 *  YOUR PRODUCT CATALOG
 * ─────────────────────────────────────────────────────────────────
 *  Add, edit, or remove products here — each product can have any
 *  number of photos. After editing, open the Admin panel → Products
 *  and click "Import catalog file" to publish your changes to the
 *  live store (this keeps the storefront and database in sync).
 *
 *  image: any URL works —
 *    • local files:   '/images/my-bag.jpg'     (put files in public/images/)
 *    • web links:    'https://example.com/bag.jpg'
 *
 *  category: 'Women' | 'Men' | 'Travel'
 * ─────────────────────────────────────────────────────────────────
 */
import type { Product } from '../lib/types';

export const CATALOG: Product[] = [
  {
    id: 'tote-signature-black',
    name: 'Signature Work Tote',
    category: 'Women',
    price: '1,450',
    color: 'Black',
    badge: 'Bestseller',
    description:
      'A roomy everyday tote in soft black leather with a structured silhouette. Fits a 15" laptop, water bottle, and daily essentials. Interior zip pocket and magnetic closure.',
    images: [
      'https://zfcsngwhcikbpewreqkx.supabase.co/storage/v1/object/public/site-images/uploads/1788234770748-jym1mh.jpg',
      'https://zfcsngwhcikbpewreqkx.supabase.co/storage/v1/object/public/site-images/uploads/1788234787097-a9jsrr.jpg',
      'https://zfcsngwhcikbpewreqkx.supabase.co/storage/v1/object/public/site-images/uploads/1788234814195-60duh3.jpg',
      'https://zfcsngwhcikbpewreqkx.supabase.co/storage/v1/object/public/site-images/uploads/1788234976481-xbxg9z.png',
      'https://zfcsngwhcikbpewreqkx.supabase.co/storage/v1/object/public/site-images/uploads/1788235025957-gqcg74.jpg',
    ],
    sort_order: 0,
    is_visible: true,
  },
  {
    id: 'tote-signature-mauve',
    name: 'Signature Tote — Mauve',
    category: 'Travel',
    price: '1,450',
    color: 'Mauve',
    badge: null,
    description:
      'The Signature Tote in a soft mauve finish — perfect for weekends away. Lightweight, durable, and designed to pair with everything.',
    images: [
      '/images/20260718_133617.jpg',
      '/images/20260718_160025.jpg',
    ],
    sort_order: 1,
    is_visible: true,
  },
  {
    id: 'everyday-crossbody',
    name: 'Everyday Crossbody',
    category: 'Men',
    price: '980',
    color: 'Charcoal',
    badge: 'New',
    description:
      'A compact crossbody with an adjustable strap and quick-access front pocket. Water-resistant canvas exterior.',
    images: [
      '/images/20260718_160025.jpg',
      '/images/20260718_133617.jpg',
    ],
    sort_order: 2,
    is_visible: true,
  },
];
