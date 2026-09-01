import { useEffect, useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  Loader2,
  LogOut,
  Package,
  Plus,
  Save,
  Settings as SettingsIcon,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../lib/useAuth';
import {
  useSiteContent,
  updateSettings,
  createProduct,
  updateProduct,
  deleteProduct,
  createCollection,
  updateCollection,
  deleteCollection,
} from '../lib/useSiteContent';
import type { SiteSettings, Product, Collection } from '../lib/types';
import { ImageUploader } from './ImageUploader';

type Tab = 'brand' | 'hero' | 'shop' | 'story' | 'products' | 'collections';

export function AdminPanel({ onClose }: { onClose: () => void }) {
  const { signOut } = useAuth();
  const { content, loading, error, reload } = useSiteContent();
  const [tab, setTab] = useState<Tab>('brand');

  const tabs: { id: Tab; label: string; icon: typeof Sparkles }[] = [
    { id: 'brand', label: 'Brand & Logo', icon: Sparkles },
    { id: 'hero', label: 'Hero Section', icon: Sparkles },
    { id: 'shop', label: 'Shop Section', icon: SettingsIcon },
    { id: 'story', label: 'Story Section', icon: SettingsIcon },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'collections', label: 'Collections', icon: Package },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f7f5]">
        <Loader2 className="animate-spin text-[#a05a39]" size={32} />
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f7f7f5]">
        <p className="text-sm text-red-600">{error ?? 'Could not load content.'}</p>
        <button onClick={() => void reload()} className="text-xs font-bold uppercase tracking-wide text-[#a05a39]">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-[#171717]">
      <header className="sticky top-0 z-10 border-b border-black/10 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="rounded-lg p-2 transition hover:bg-black/5">
              <ArrowLeft size={18} />
            </button>
            <h1 className="font-serif text-xl tracking-tight">Admin Panel</h1>
          </div>
          <button
            onClick={() => void signOut()}
            className="inline-flex items-center gap-2 rounded-lg border border-black/15 px-3 py-1.5 text-xs font-semibold transition hover:bg-black/5"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-8">
        <div className="mb-6 flex gap-1 overflow-x-auto border-b border-black/10">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide transition ${
                tab === t.id ? 'border-[#a05a39] text-[#a05a39]' : 'border-transparent text-black/45 hover:text-black'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'brand' && <BrandEditor settings={content.settings} />}
        {tab === 'hero' && <HeroEditor settings={content.settings} />}
        {tab === 'shop' && <ShopEditor settings={content.settings} />}
        {tab === 'story' && <StoryEditor settings={content.settings} />}
        {tab === 'products' && <ProductsEditor products={content.products} />}
        {tab === 'collections' && <CollectionsEditor collections={content.collections} />}
      </div>
    </div>
  );
}

// ── Reusable field components ──────────────────────────────────
function Field({
  label,
  value,
  onChange,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-black/50">{label}</span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-[#a05a39]"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-[#a05a39]"
        />
      )}
    </label>
  );
}

function SaveButton({ onSave, saved }: { onSave: () => void; saved: boolean }) {
  const [saving, setSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave();
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    } catch {
      // handled by parent error display
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => void handleSave()}
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-lg bg-[#171717] px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-[#a05a39] disabled:opacity-50"
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        Save changes
      </button>
      {showSaved && <span className="text-xs font-semibold text-green-600">Saved!</span>}
      {saved && <span className="text-xs text-black/40">Up to date</span>}
    </div>
  );
}

function useEditableSettings(initial: SiteSettings) {
  const [draft, setDraft] = useState<SiteSettings>(initial);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(initial);
  }, [initial]);

  const set = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const save = async () => {
    setSaveError(null);
    try {
      await updateSettings(draft);
    } catch {
      setSaveError('Could not save. Please try again.');
      throw new Error('save failed');
    }
  };

  const isDirty = JSON.stringify(draft) !== JSON.stringify(initial);

  return { draft, set, save, saveError, isDirty };
}

// ── Brand & Logo editor ────────────────────────────────────────
function BrandEditor({ settings }: { settings: SiteSettings }) {
  const { draft, set, save, saveError, isDirty } = useEditableSettings(settings);

  return (
    <div className="space-y-6">
      <Field label="Brand name (logo wordmark)" value={draft.brand_name} onChange={(v) => set('brand_name', v)} />
      <Field label="Brand tagline (under logo)" value={draft.brand_tagline} onChange={(v) => set('brand_tagline', v)} />
      <Field label="Announcement bar text" value={draft.announcement} onChange={(v) => set('announcement', v)} />
      <Field label="Footer copyright text" value={draft.footer_copyright} onChange={(v) => set('footer_copyright', v)} />
      <SaveButton onSave={save} saved={!isDirty} />
      {saveError && <p className="text-xs text-red-600">{saveError}</p>}
    </div>
  );
}

// ── Hero editor ────────────────────────────────────────────────
function HeroEditor({ settings }: { settings: SiteSettings }) {
  const { draft, set, save, saveError, isDirty } = useEditableSettings(settings);

  return (
    <div className="space-y-6">
      <Field label="Hero eyebrow text" value={draft.hero_eyebrow} onChange={(v) => set('hero_eyebrow', v)} />
      <Field label="Hero title line 1" value={draft.hero_title_line1} onChange={(v) => set('hero_title_line1', v)} />
      <Field label="Hero title line 2 (italic)" value={draft.hero_title_line2} onChange={(v) => set('hero_title_line2', v)} />
      <Field label="Hero subtitle" value={draft.hero_subtitle} onChange={(v) => set('hero_subtitle', v)} textarea />
      <ImageUploader label="Hero image" value={draft.hero_image} onChange={(v) => set('hero_image', v)} />
      <Field label="Hero caption (small text on image)" value={draft.hero_caption} onChange={(v) => set('hero_caption', v)} />
      <SaveButton onSave={save} saved={!isDirty} />
      {saveError && <p className="text-xs text-red-600">{saveError}</p>}
    </div>
  );
}

// ── Shop section editor ────────────────────────────────────────
function ShopEditor({ settings }: { settings: SiteSettings }) {
  const { draft, set, save, saveError, isDirty } = useEditableSettings(settings);

  return (
    <div className="space-y-6">
      <Field label="Shop eyebrow text" value={draft.shop_eyebrow} onChange={(v) => set('shop_eyebrow', v)} />
      <Field label="Shop section title" value={draft.shop_title} onChange={(v) => set('shop_title', v)} />
      <SaveButton onSave={save} saved={!isDirty} />
      {saveError && <p className="text-xs text-red-600">{saveError}</p>}
    </div>
  );
}

// ── Story section editor ───────────────────────────────────────
function StoryEditor({ settings }: { settings: SiteSettings }) {
  const { draft, set, save, saveError, isDirty } = useEditableSettings(settings);

  return (
    <div className="space-y-6">
      <Field label="Story eyebrow text" value={draft.story_eyebrow} onChange={(v) => set('story_eyebrow', v)} />
      <Field label="Story title (main)" value={draft.story_title} onChange={(v) => set('story_title', v)} />
      <Field label="Story title (italic line)" value={draft.story_title_italic} onChange={(v) => set('story_title_italic', v)} />
      <Field label="Story paragraph 1" value={draft.story_body1} onChange={(v) => set('story_body1', v)} textarea />
      <Field label="Story paragraph 2" value={draft.story_body2} onChange={(v) => set('story_body2', v)} textarea />
      <ImageUploader label="Story image" value={draft.story_image} onChange={(v) => set('story_image', v)} />
      <SaveButton onSave={save} saved={!isDirty} />
      {saveError && <p className="text-xs text-red-600">{saveError}</p>}
    </div>
  );
}

// ── Products editor ────────────────────────────────────────────
function ProductsEditor({ products }: { products: Product[] }) {
  const [items, setItems] = useState<Product[]>(products);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setItems(products);
  }, [products]);

  const update = (id: string, patch: Partial<Product>) => {
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const saveOne = async (product: Product) => {
    setBusy(product.id);
    setError(null);
    try {
      await updateProduct(product.id, {
        name: product.name,
        category: product.category,
        price: product.price,
        color: product.color,
        badge: product.badge,
        image_url: product.image_url,
        sort_order: product.sort_order,
        is_visible: product.is_visible,
      });
    } catch {
      setError('Could not save product.');
    } finally {
      setBusy(null);
    }
  };

  const remove = async (id: string) => {
    setBusy(id);
    setError(null);
    try {
      await deleteProduct(id);
      setItems((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setError('Could not delete product.');
    } finally {
      setBusy(null);
    }
  };

  const addNew = async () => {
    setBusy('new');
    setError(null);
    try {
      const created = await createProduct({
        name: 'New Product',
        category: 'Women',
        price: '0',
        color: 'Black',
        badge: null,
        image_url: '/images/20260718_133617.jpg',
        sort_order: items.length,
        is_visible: true,
      });
      setItems((prev) => [...prev, created]);
    } catch {
      setError('Could not add product.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-black/50">{items.length} product{items.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => void addNew()}
          disabled={busy === 'new'}
          className="inline-flex items-center gap-2 rounded-lg bg-[#171717] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-[#a05a39] disabled:opacity-50"
        >
          <Plus size={14} /> Add product
        </button>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {items.map((product) => (
        <div key={product.id} className="rounded-xl border border-black/10 bg-white p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <ImageUploader label="Product image" value={product.image_url} onChange={(v) => update(product.id, { image_url: v })} />
            <div className="space-y-3">
              <Field label="Name" value={product.name} onChange={(v) => update(product.id, { name: v })} />
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-black/50">Category</span>
                  <select
                    value={product.category}
                    onChange={(e) => update(product.id, { category: e.target.value })}
                    className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-[#a05a39]"
                  >
                    <option>Women</option>
                    <option>Men</option>
                    <option>Travel</option>
                  </select>
                </label>
                <Field label="Price (e.g. 1,450)" value={product.price} onChange={(v) => update(product.id, { price: v })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Color" value={product.color} onChange={(v) => update(product.id, { color: v })} />
                <Field label="Badge (optional)" value={product.badge ?? ''} onChange={(v) => update(product.id, { badge: v || null })} />
              </div>
              <label className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  checked={product.is_visible}
                  onChange={(e) => update(product.id, { is_visible: e.target.checked })}
                  className="h-4 w-4 accent-[#a05a39]"
                />
                <span className="text-xs font-medium">Visible on storefront</span>
              </label>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3 border-t border-black/10 pt-4">
            <button
              onClick={() => void saveOne(product)}
              disabled={busy === product.id}
              className="inline-flex items-center gap-2 rounded-lg bg-[#171717] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-[#a05a39] disabled:opacity-50"
            >
              {busy === product.id ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save
            </button>
            <button
              onClick={() => void remove(product.id)}
              disabled={busy === product.id}
              className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-xs font-bold uppercase tracking-wide text-red-600 transition hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Collections editor ─────────────────────────────────────────
function CollectionsEditor({ collections }: { collections: Collection[] }) {
  const [items, setItems] = useState<Collection[]>(collections);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setItems(collections);
  }, [collections]);

  const update = (id: string, patch: Partial<Collection>) => {
    setItems((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const saveOne = async (collection: Collection) => {
    setBusy(collection.id);
    setError(null);
    try {
      await updateCollection(collection.id, {
        eyebrow: collection.eyebrow,
        title: collection.title,
        image_url: collection.image_url,
        sort_order: collection.sort_order,
      });
    } catch {
      setError('Could not save collection.');
    } finally {
      setBusy(null);
    }
  };

  const remove = async (id: string) => {
    setBusy(id);
    setError(null);
    try {
      await deleteCollection(id);
      setItems((prev) => prev.filter((c) => c.id !== id));
    } catch {
      setError('Could not delete collection.');
    } finally {
      setBusy(null);
    }
  };

  const addNew = async () => {
    setBusy('new');
    setError(null);
    try {
      const created = await createCollection({
        eyebrow: 'New collection',
        title: 'Title here',
        image_url: '/images/20260718_133535.jpg',
        sort_order: items.length,
      });
      setItems((prev) => [...prev, created]);
    } catch {
      setError('Could not add collection.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-black/50">{items.length} collection{items.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => void addNew()}
          disabled={busy === 'new'}
          className="inline-flex items-center gap-2 rounded-lg bg-[#171717] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-[#a05a39] disabled:opacity-50"
        >
          <Plus size={14} /> Add collection
        </button>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {items.map((collection) => (
        <div key={collection.id} className="rounded-xl border border-black/10 bg-white p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <ImageUploader label="Collection image" value={collection.image_url} onChange={(v) => update(collection.id, { image_url: v })} />
            <div className="space-y-3">
              <Field label="Eyebrow text" value={collection.eyebrow} onChange={(v) => update(collection.id, { eyebrow: v })} />
              <Field label="Title" value={collection.title} onChange={(v) => update(collection.id, { title: v })} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3 border-t border-black/10 pt-4">
            <button
              onClick={() => void saveOne(collection)}
              disabled={busy === collection.id}
              className="inline-flex items-center gap-2 rounded-lg bg-[#171717] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-[#a05a39] disabled:opacity-50"
            >
              {busy === collection.id ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save
            </button>
            <button
              onClick={() => void remove(collection.id)}
              disabled={busy === collection.id}
              className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-xs font-bold uppercase tracking-wide text-red-600 transition hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
