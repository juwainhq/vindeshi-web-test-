export type SiteSettings = {
  id: number;
  brand_name: string;
  brand_tagline: string;
  announcement: string;
  hero_eyebrow: string;
  hero_title_line1: string;
  hero_title_line2: string;
  hero_subtitle: string;
  hero_image: string;
  hero_caption: string;
  shop_eyebrow: string;
  shop_title: string;
  collections_eyebrow: string;
  collections_title: string;
  story_eyebrow: string;
  story_title: string;
  story_title_italic: string;
  story_body1: string;
  story_body2: string;
  story_image: string;
  newsletter_eyebrow: string;
  newsletter_title: string;
  footer_copyright: string;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  price: string;
  color: string;
  badge: string | null;
  image_url: string;
  sort_order: number;
  is_visible: boolean;
};

export type Collection = {
  id: string;
  eyebrow: string;
  title: string;
  image_url: string;
  sort_order: number;
};

export type CartItem = {
  id: string;
  name: string;
  color: string;
  price: string;
  image_url: string;
  qty: number;
};

export type SiteContent = {
  settings: SiteSettings;
  products: Product[];
  collections: Collection[];
};
