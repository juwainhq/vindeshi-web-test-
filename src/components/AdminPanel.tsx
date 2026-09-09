import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  FileDown,
  ImagePlus,
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
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  importCatalog,
} from '../lib/useSiteContent';
import type { SiteSettings, Product, Collection, Testimonial } from '../lib/types';
import { ImageUploader } from './ImageUploader';
import { uploadImage } from '../lib/upload';
import { CATALOG } from '../data/products';

type Tab = 'brand' | 'hero' | 'features' | 'shop' | 'story' | 'testimonials' | 'products' | 'collections';

export function AdminPanel({ onClose }: { onClose: () => void }) {
  const { signOut } = useAuth();
  const { content, loading, error, reload } = useSiteContent();
  const [tab, setTab] = useState<Tab>('brand');

  const tabs: { id: Tab; label: string; icon: typeof Sparkles }[] = [
    { id: 'brand', label: 'Brand & Logo', icon: Sparkles },
    { id: 'hero', label: 'Hero Section', icon: Sparkles },
    { id: 'features', label: 'Features', icon: SettingsIcon },
    { id: 'shop', label: 'Shop Section', icon: SettingsIcon },
    { id: 'story', label: 'Story Section', icon: SettingsIcon },
    { id: 'testimonials', label: 'Testimonials', icon: Package },
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
        {tab === 'features' && <FeaturesEditor settings={content.settings} />}
        {tab === 'shop' && <ShopEditor settings={content.settings} />}
        {tab === 'story' && <StoryEditor settings={content.settings} />}
        {tab === 'testimonials' && <TestimonialsEditor testimonials={content.testimonials} settings={content.settings} />}
        {tab === 'products' && <ProductsEditor products={content.products} reload={reload} />}
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

// ── Features editor ────────────────────────────────────────────
function FeaturesEditor({ settings }: { settings: SiteSettings }) {
  const { draft, set, save, saveError, isDirty } = useEditableSettings(settings);

  return (
    <div className="space-y-6">
      <p className="text-sm text-black/50">
        The three feature cards shown directly under the hero. Icons are chosen automatically (delivery, design, durability).
      </p>
      <Field label="Features eyebrow text" value={draft.features_eyebrow} onChange={(v) => set('features_eyebrow', v)} />
      <Field label="Features section title" value={draft.features_title} onChange={(v) => set('features_title', v)} />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wide text-[#a05a39]">Card 1</p>
          <Field label="Title" value={draft.feature1_title} onChange={(v) => set('feature1_title', v)} />
          <Field label="Text" value={draft.feature1_text} onChange={(v) => set('feature1_text', v)} />
        </div>
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wide text-[#a05a39]">Card 2</p>
          <Field label="Title" value={draft.feature2_title} onChange={(v) => set('feature2_title', v)} />
          <Field label="Text" value={draft.feature2_text} onChange={(v) => set('feature2_text', v)} />
        </div>
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wide text-[#a05a39]">Card 3</p>
          <Field label="Title" value={draft.feature3_title} onChange={(v) => set('feature3_title', v)} />
          <Field label="Text" value={draft.feature3_text} onChange={(v) => set('feature3_text', v)} />
        </div>
      </div>
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

// ── Testimonials editor ───────────────────────────────────────
function TestimonialsEditor({
  testimonials,
  settings,
}: {
  testimonials: Testimonial[];
  settings: SiteSettings;
}) {
  const heading = useEditableSettings(settings);
  const [items, setItems] = useState<Testimonial[]>(testimonials);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setItems(testimonials);
  }, [testimonials]);

  const update = (id: string, patch: Partial<Testimonial>) => {
    setItems((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const saveOne = async (t: Testimonial) => {
    setBusy(t.id);
    setError(null);
    try {
      await updateTestimonial(t.id, {
        quote: t.quote,
        name: t.name,
        role: t.role,
        sort_order: t.sort_order,
        is_visible: t.is_visible,
      });
    } catch {
      setError('Could not save testimonial.');
    } finally {
      setBusy(null);
    }
  };

  const remove = async (id: string) => {
    setBusy(id);
    setError(null);
    try {
      await deleteTestimonial(id);
      setItems((prev) => prev.filter((t) => t.id !== id));
    } catch {
      setError('Could not delete testimonial.');
    } finally {
      setBusy(null);
    }
  };

  const addNew = async () => {
    setBusy('new');
    setError(null);
    try {
      const created = await createTestimonial({
        quote: 'Write your review here.',
        name: 'Customer name',
        role: 'Their role, city',
        sort_order: items.length,
        is_visible: true,
      });
      setItems((prev) => [...prev, created]);
    } catch {
      setError('Could not add testimonial.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Field
          label="Testimonials eyebrow text"
          value={heading.draft.testimonials_eyebrow}
          onChange={(v) => heading.set('testimonials_eyebrow', v)}
        />
        <Field
          label="Testimonials section title"
          value={heading.draft.testimonials_title}
          onChange={(v) => heading.set('testimonials_title', v)}
        />
        <SaveButton onSave={heading.save} saved={!heading.isDirty} />
        {heading.saveError && <p className="text-xs text-red-600">{heading.saveError}</p>}
      </div>

      <div className="space-y-4 border-t border-black/10 pt-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-black/50">
            {items.length} testimonial{items.length !== 1 ? 's' : ''}
          </p>
          <button
            onClick={() => void addNew()}
            disabled={busy === 'new'}
            className="inline-flex items-center gap-2 rounded-lg bg-[#171717] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-[#a05a39] disabled:opacity-50"
          >
            <Plus size={14} /> Add testimonial
          </button>
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        {items.map((t) => (
          <div key={t.id} className="rounded-xl border border-black/10 bg-white p-5">
            <div className="space-y-3">
              <Field label="Quote" value={t.quote} onChange={(v) => update(t.id, { quote: v })} textarea />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Name" value={t.name} onChange={(v) => update(t.id, { name: v })} />
                <Field label="Role / city" value={t.role} onChange={(v) => update(t.id, { role: v })} />
              </div>
              <label className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  checked={t.is_visible}
                  onChange={(e) => update(t.id, { is_visible: e.target.checked })}
                  className="h-4 w-4 accent-[#a05a39]"
                />
                <span className="text-xs font-medium">Visible on storefront</span>
              </label>
            </div>
            <div className="mt-4 flex items-center gap-3 border-t border-black/10 pt-4">
              <button
                onClick={() => void saveOne(t)}
                disabled={busy === t.id}
                className="inline-flex items-center gap-2 rounded-lg bg-[#171717] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-[#a05a39] disabled:opacity-50"
              >
                {busy === t.id ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save
              </button>
              <button
                onClick={() => void remove(t.id)}
                disabled={busy === t.id}
                className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-xs font-bold uppercase tracking-wide text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Products editor ────────────────────────────────────────────
// ── Multi-image editor for a product's photo list ──────────────
function ImagesEditor({
  images,
  onChange,
}: {
  images: string[];
  onChange: (images: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setAt = (index: number, url: string) => {
    onChange(images.map((image, i) => (i === index ? url : image)));
  };

  const addImage = (url: string) => {
    onChange([...images, url]);
  };

  const removeAt = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const handleFiles = async (files: FileList) => {
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const url = await uploadImage(file);
        addImage(url);
      }
    } catch {
      setError('Some uploads failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-black/50">
        Photos ({images.length}) — first photo is the cover
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = e.target.files;
          if (files && files.length > 0) void handleFiles(files);
          e.target.value = '';
        }}
      />

      <div className="flex flex-wrap gap-3">
        {images.map((image, i) => (
          <div key={image + i} className="w-32">
            <div className="h-32 w-32 overflow-hidden rounded-lg border border-black/10 bg-[#e9e9e5]">
              <img src={image} alt="" className="h-full w-full object-cover" />
            </div>
            <input
              type="text"
              value={image}
              onChange={(e) => setAt(i, e.target.value)}
              placeholder="Image URL"
              className="mt-1.5 w-32 rounded border border-black/15 px-1.5 py-1 text-[10px] outline-none focus:border-[#a05a39]"
            />
            <div className="mt-1.5 flex items-center justify-between">
              <div className="flex gap-1">
                <button
                  type="button"
                  aria-label="Move photo earlier"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="rounded border border-black/15 px-1.5 py-1 text-black/50 transition hover:text-black disabled:opacity-30"
                >
                  <ChevronLeft size={12} />
                </button>
                <button
                  type="button"
                  aria-label="Move photo later"
                  onClick={() => move(i, 1)}
                  disabled={i === images.length - 1}
                  className="rounded border border-black/15 px-1.5 py-1 text-black/50 transition hover:text-black disabled:opacity-30"
                >
                  <ChevronRight size={12} />
                </button>
              </div>
              <button
                type="button"
                aria-label="Remove photo"
                onClick={() => removeAt(i)}
                className="rounded border border-red-300 px-1.5 py-1 text-red-500 transition hover:bg-red-50"
              >
                <Trash2 size={12} />
              </button>
            </div>
            {i === 0 && (
              <p className="mt-1 text-center text-[9px] font-bold uppercase tracking-wide text-[#a05a39]">Cover</p>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-32 w-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-black/25 text-black/40 transition hover:border-[#a05a39] hover:text-[#a05a39] disabled:opacity-50"
        >
          {uploading ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
          <span className="text-[10px] font-semibold uppercase tracking-wide">
            {uploading ? 'Uploading…' : 'Add photos'}
          </span>
        </button>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ── Products editor ────────────────────────────────────────────
function ProductsEditor({ products, reload }: { products: Product[]; reload: () => Promise<void> }) {
  const [items, setItems] = useState<Product[]>(products);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);

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
        description: product.description,
        images: product.images,
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
        description: '',
        images: ['/images/20260718_160025.jpg'],
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

  const importCatalogFile = async () => {
    setImporting(true);
    setImportMessage(null);
    setError(null);
    try {
      await importCatalog(CATALOG);
      await reload();
      setImportMessage('Catalog imported.');
    } catch {
      setImportMessage('Import failed — please try again.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-black/50">{items.length} product{items.length !== 1 ? 's' : ''}</p>
        <div className="flex gap-2">
          <button
            onClick={() => void importCatalogFile()}
            disabled={importing}
            className="inline-flex items-center gap-2 rounded-lg border border-black/15 px-4 py-2 text-xs font-bold uppercase tracking-wide transition hover:bg-black/5 disabled:opacity-50"
          >
            {importing ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
            Import catalog file
          </button>
          <button
            onClick={() => void addNew()}
            disabled={busy === 'new'}
            className="inline-flex items-center gap-2 rounded-lg bg-[#171717] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-[#a05a39] disabled:opacity-50"
          >
            <Plus size={14} /> Add product
          </button>
        </div>
      </div>

      {importMessage && <p className="text-xs font-semibold text-[#a05a39]">{importMessage}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}

      {items.map((product) => (
        <div key={product.id} className="space-y-4 rounded-xl border border-black/10 bg-white p-5">
          <div className="grid gap-4 sm:grid-cols-2">
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
              <Field label="Description" value={product.description} onChange={(v) => update(product.id, { description: v })} textarea />
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
            <ImagesEditor
              images={product.images}
              onChange={(images) => update(product.id, { images })}
            />
          </div>
          <div className="flex items-center gap-3 border-t border-black/10 pt-4">
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
        image_url: '/images/20260718_160025.jpg',
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
