import { useState, type ReactNode } from 'react';
import { Loader2, LogOut, Plus, Save, Trash2 } from 'lucide-react';
import { useAuth } from '../lib/useAuth';
import {
  useSiteContent,
  updateSettings,
  createCollection,
  updateCollection,
  deleteCollection,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
} from '../lib/useSiteContent';
import type { SiteSettings, Collection, Testimonial } from '../lib/types';

/* ── Small building blocks ──────────────────────────────────── */

function Field({
  label,
  value,
  onChange,
  textarea = false,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  textarea?: boolean;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-black/40">
        {label}
      </span>
      {textarea ? (
        <textarea
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm outline-none transition focus:border-[#a05a39]"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm outline-none transition focus:border-[#a05a39]"
        />
      )}
    </label>
  );
}

function Section({
  title,
  dirty,
  saving,
  onSave,
  children,
}: {
  title: string;
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  children: ReactNode;
}) {
  return (
    <div className="space-y-4 rounded-xl border border-black/10 bg-white p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-serif text-lg tracking-tight">{title}</h2>
        {dirty && (
          <button
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-[#a05a39] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.15em] text-white transition hover:bg-[#8d4c2f] disabled:opacity-50"
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

/* ── Supabase sign-in gate ──────────────────────────────────── */

function SignInGate() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed.');
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-sm space-y-4 rounded-2xl border border-black/10 bg-white p-8 text-center"
    >
      <h2 className="font-serif text-2xl tracking-tight">Content editor access</h2>
      <p className="text-xs leading-5 text-black/50">
        Site content is stored in a Supabase database with row-level security. Sign in
        with your Supabase account to edit it.
      </p>
      <div className="space-y-3 text-left">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full rounded-lg border border-black/15 px-3.5 py-3 text-sm outline-none transition focus:border-[#a05a39]"
        />
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full rounded-lg border border-black/15 px-3.5 py-3 text-sm outline-none transition focus:border-[#a05a39]"
        />
      </div>
      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-[#171717] py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-white transition hover:bg-[#a05a39] disabled:opacity-50"
      >
        {busy ? 'Signing in…' : 'Sign in to edit content'}
      </button>
    </form>
  );
}

/* ── Main panel ─────────────────────────────────────────────── */

export function SiteContentPanel() {
  const { session, loading: authLoading, signOut } = useAuth();
  const { content, loading, error, reload } = useSiteContent();

  const [drafts, setDrafts] = useState<Partial<SiteSettings>>({});
  const [collectionDrafts, setCollectionDrafts] = useState<Record<string, Partial<Collection>>>({});
  const [testimonialDrafts, setTestimonialDrafts] = useState<
    Record<string, Partial<Testimonial>>
  >({});
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const settings = content?.settings ?? null;
  const collections = content?.collections ?? [];
  const testimonials = content?.testimonials ?? [];

  const notify = (msg: string) => {
    setFlash(msg);
    setTimeout(() => setFlash(null), 2500);
  };

  const guard = async (fn: () => Promise<unknown>, successMsg: string) => {
    setBusy(true);
    try {
      await fn();
      await reload();
      notify(successMsg);
    } catch (err) {
      notify(err instanceof Error ? `Error: ${err.message}` : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  if (authLoading || (loading && !content)) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-[#a05a39]" size={28} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!session) {
    return <SignInGate />;
  }

  if (!settings) return null;

  /* ── Settings helpers (draft overlay) ── */

  const value = (key: keyof SiteSettings) =>
    (drafts[key] ?? settings[key] ?? '') as string;

  const setDraft = (key: keyof SiteSettings, v: string) =>
    setDrafts((prev) => ({ ...prev, [key]: v }));

  const isDirty = (keys: (keyof SiteSettings)[]) =>
    keys.some((key) => key in drafts && drafts[key] !== settings[key]);

  const saveSection = (keys: (keyof SiteSettings)[]) => {
    const patch: Partial<SiteSettings> = {};
    keys.forEach((key) => {
      if (key in drafts) {
        (patch[key] as string) = drafts[key] as string;
      }
    });
    if (Object.keys(patch).length === 0) return;
    void guard(async () => {
      await updateSettings(patch);
      setDrafts((prev) => {
        const next = { ...prev };
        keys.forEach((key) => delete next[key]);
        return next;
      });
    }, 'Saved to the live site.');
  };

  /* ── Row helpers (collections / testimonials) ── */

  const rowValue = <T extends object>(row: T, id: string, draftsMap: Record<string, Partial<T>>) => ({
    ...row,
    ...(draftsMap[id] ?? {}),
  });

  const saveCollectionRow = (row: Collection) => {
    const draft = collectionDrafts[row.id];
    if (!draft) return;
    void guard(async () => {
      await updateCollection(row.id, draft);
      setCollectionDrafts((prev) => {
        const next = { ...prev };
        delete next[row.id];
        return next;
      });
    }, 'Collection saved.');
  };

  const saveTestimonialRow = (row: Testimonial) => {
    const draft = testimonialDrafts[row.id];
    if (!draft) return;
    void guard(async () => {
      await updateTestimonial(row.id, draft);
      setTestimonialDrafts((prev) => {
        const next = { ...prev };
        delete next[row.id];
        return next;
      });
    }, 'Testimonial saved.');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/10 bg-white p-4">
        <p className="text-xs text-black/55">
          Signed in as <span className="font-semibold">{session.user.email}</span> — changes
          save to the live database.
        </p>
        <button
          onClick={() => void signOut()}
          className="inline-flex items-center gap-2 rounded-lg border border-black/15 px-3.5 py-2 text-xs font-semibold transition hover:bg-black/5"
        >
          <LogOut size={13} /> Sign out
        </button>
      </div>

      {flash && (
        <p className="rounded-lg border border-[#a05a39]/25 bg-[#a05a39]/5 px-4 py-2.5 text-xs font-semibold text-[#a05a39]">
          {flash}
        </p>
      )}

      {/* Brand & announcement */}
      <Section
        title="Brand"
        dirty={isDirty(['brand_name', 'brand_tagline', 'announcement', 'footer_copyright'])}
        saving={busy}
        onSave={() =>
          saveSection(['brand_name', 'brand_tagline', 'announcement', 'footer_copyright'])
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Brand name" value={value('brand_name')} onChange={(v) => setDraft('brand_name', v)} />
          <Field label="Tagline" value={value('brand_tagline')} onChange={(v) => setDraft('brand_tagline', v)} />
        </div>
        <Field label="Announcement bar" value={value('announcement')} onChange={(v) => setDraft('announcement', v)} />
        <Field label="Footer copyright" value={value('footer_copyright')} onChange={(v) => setDraft('footer_copyright', v)} />
      </Section>

      {/* Hero */}
      <Section
        title="Hero"
        dirty={isDirty([
          'hero_eyebrow', 'hero_title_line1', 'hero_title_line2', 'hero_subtitle',
          'hero_image', 'hero_caption',
        ])}
        saving={busy}
        onSave={() =>
          saveSection([
            'hero_eyebrow', 'hero_title_line1', 'hero_title_line2', 'hero_subtitle',
            'hero_image', 'hero_caption',
          ])
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Eyebrow" value={value('hero_eyebrow')} onChange={(v) => setDraft('hero_eyebrow', v)} />
          <Field label="Title line 1" value={value('hero_title_line1')} onChange={(v) => setDraft('hero_title_line1', v)} />
          <Field label="Title line 2" value={value('hero_title_line2')} onChange={(v) => setDraft('hero_title_line2', v)} />
          <Field label="Image URL" value={value('hero_image')} onChange={(v) => setDraft('hero_image', v)} />
        </div>
        <Field label="Subtitle" textarea value={value('hero_subtitle')} onChange={(v) => setDraft('hero_subtitle', v)} />
        <Field label="Image caption" value={value('hero_caption')} onChange={(v) => setDraft('hero_caption', v)} />
      </Section>

      {/* Features */}
      <Section
        title="Features"
        dirty={isDirty([
          'features_eyebrow', 'features_title',
          'feature1_title', 'feature1_text',
          'feature2_title', 'feature2_text',
          'feature3_title', 'feature3_text',
        ])}
        saving={busy}
        onSave={() =>
          saveSection([
            'features_eyebrow', 'features_title',
            'feature1_title', 'feature1_text',
            'feature2_title', 'feature2_text',
            'feature3_title', 'feature3_text',
          ])
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Eyebrow" value={value('features_eyebrow')} onChange={(v) => setDraft('features_eyebrow', v)} />
          <Field label="Title" value={value('features_title')} onChange={(v) => setDraft('features_title', v)} />
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {([1, 2, 3] as const).map((n) => (
            <div key={n} className="space-y-3 rounded-lg border border-black/10 bg-[#fafaf8] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#a05a39]">Feature {n}</p>
              <Field label="Title" value={value(`feature${n}_title` as keyof SiteSettings)} onChange={(v) => setDraft(`feature${n}_title` as keyof SiteSettings, v)} />
              <Field label="Text" textarea rows={2} value={value(`feature${n}_text` as keyof SiteSettings)} onChange={(v) => setDraft(`feature${n}_text` as keyof SiteSettings, v)} />
            </div>
          ))}
        </div>
      </Section>

      {/* Shop */}
      <Section
        title="Shop section"
        dirty={isDirty(['shop_eyebrow', 'shop_title'])}
        saving={busy}
        onSave={() => saveSection(['shop_eyebrow', 'shop_title'])}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Eyebrow" value={value('shop_eyebrow')} onChange={(v) => setDraft('shop_eyebrow', v)} />
          <Field label="Title" value={value('shop_title')} onChange={(v) => setDraft('shop_title', v)} />
        </div>
      </Section>

      {/* Story */}
      <Section
        title="Story section"
        dirty={isDirty([
          'story_eyebrow', 'story_title', 'story_title_italic', 'story_body1',
          'story_body2', 'story_image',
        ])}
        saving={busy}
        onSave={() =>
          saveSection([
            'story_eyebrow', 'story_title', 'story_title_italic', 'story_body1',
            'story_body2', 'story_image',
          ])
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Eyebrow" value={value('story_eyebrow')} onChange={(v) => setDraft('story_eyebrow', v)} />
          <Field label="Title" value={value('story_title')} onChange={(v) => setDraft('story_title', v)} />
          <Field label="Title italic" value={value('story_title_italic')} onChange={(v) => setDraft('story_title_italic', v)} />
          <Field label="Image URL" value={value('story_image')} onChange={(v) => setDraft('story_image', v)} />
        </div>
        <Field label="Body paragraph 1" textarea value={value('story_body1')} onChange={(v) => setDraft('story_body1', v)} />
        <Field label="Body paragraph 2" textarea value={value('story_body2')} onChange={(v) => setDraft('story_body2', v)} />
      </Section>

      {/* Testimonials header */}
      <Section
        title="Testimonials section"
        dirty={isDirty(['testimonials_eyebrow', 'testimonials_title'])}
        saving={busy}
        onSave={() => saveSection(['testimonials_eyebrow', 'testimonials_title'])}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Eyebrow" value={value('testimonials_eyebrow')} onChange={(v) => setDraft('testimonials_eyebrow', v)} />
          <Field label="Title" value={value('testimonials_title')} onChange={(v) => setDraft('testimonials_title', v)} />
        </div>
      </Section>

      {/* Testimonial rows */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg tracking-tight">Testimonials</h2>
          <button
            onClick={() =>
              void guard(
                () =>
                  createTestimonial({
                    quote: 'A new customer testimonial.',
                    name: 'Customer name',
                    role: 'Customer role',
                    sort_order: testimonials.length,
                    is_visible: false,
                  }),
                'Testimonial added.'
              )
            }
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg bg-[#171717] px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-white transition hover:bg-[#a05a39] disabled:opacity-50"
          >
            <Plus size={13} /> Add testimonial
          </button>
        </div>
        {testimonials.map((row) => {
          const view = rowValue(row, row.id, testimonialDrafts);
          const dirty = row.id in testimonialDrafts;
          return (
            <div
              key={row.id}
              className={`space-y-3 rounded-xl border p-5 ${
                dirty ? 'border-[#a05a39]/50 bg-white' : 'border-black/10 bg-white'
              }`}
            >
              <Field
                label="Quote"
                textarea
                rows={2}
                value={view.quote}
                onChange={(v) =>
                  setTestimonialDrafts((prev) => ({ ...prev, [row.id]: { ...prev[row.id], quote: v } }))
                }
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Name"
                  value={view.name}
                  onChange={(v) =>
                    setTestimonialDrafts((prev) => ({ ...prev, [row.id]: { ...prev[row.id], name: v } }))
                  }
                />
                <Field
                  label="Role"
                  value={view.role}
                  onChange={(v) =>
                    setTestimonialDrafts((prev) => ({ ...prev, [row.id]: { ...prev[row.id], role: v } }))
                  }
                />
              </div>
              <div className="flex flex-wrap items-center gap-4 border-t border-black/10 pt-3">
                <label className="flex items-center gap-2 text-xs font-medium">
                  <input
                    type="checkbox"
                    checked={view.is_visible}
                    onChange={(e) =>
                      setTestimonialDrafts((prev) => ({
                        ...prev,
                        [row.id]: { ...prev[row.id], is_visible: e.target.checked },
                      }))
                    }
                    className="h-4 w-4 accent-[#a05a39]"
                  />
                  Visible
                </label>
                <label className="flex items-center gap-2 text-xs font-medium">
                  Order
                  <input
                    type="number"
                    value={view.sort_order}
                    onChange={(e) =>
                      setTestimonialDrafts((prev) => ({
                        ...prev,
                        [row.id]: { ...prev[row.id], sort_order: Number(e.target.value) },
                      }))
                    }
                    className="w-16 rounded-lg border border-black/15 px-2 py-1 text-xs outline-none focus:border-[#a05a39]"
                  />
                </label>
                {dirty && (
                  <button
                    onClick={() => saveTestimonialRow(row)}
                    disabled={busy}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#a05a39] px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white transition hover:bg-[#8d4c2f] disabled:opacity-50"
                  >
                    {busy ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />} Save
                  </button>
                )}
                <button
                  onClick={() => void guard(() => deleteTestimonial(row.id), 'Testimonial deleted.')}
                  disabled={busy}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-red-300 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 size={11} /> Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Collections header */}
      <Section
        title="Collections section"
        dirty={isDirty(['collections_eyebrow', 'collections_title'])}
        saving={busy}
        onSave={() => saveSection(['collections_eyebrow', 'collections_title'])}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Eyebrow" value={value('collections_eyebrow')} onChange={(v) => setDraft('collections_eyebrow', v)} />
          <Field label="Title" value={value('collections_title')} onChange={(v) => setDraft('collections_title', v)} />
        </div>
      </Section>

      {/* Collection rows */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg tracking-tight">Collections</h2>
          <button
            onClick={() =>
              void guard(
                () =>
                  createCollection({
                    eyebrow: 'New',
                    title: 'New Collection',
                    image_url: '',
                    sort_order: collections.length,
                  }),
                'Collection added.'
              )
            }
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg bg-[#171717] px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-white transition hover:bg-[#a05a39] disabled:opacity-50"
          >
            <Plus size={13} /> Add collection
          </button>
        </div>
        {collections.map((row) => {
          const view = rowValue(row, row.id, collectionDrafts);
          const dirty = row.id in collectionDrafts;
          return (
            <div
              key={row.id}
              className={`space-y-3 rounded-xl border p-5 ${
                dirty ? 'border-[#a05a39]/50 bg-white' : 'border-black/10 bg-white'
              }`}
            >
              <div className="grid gap-3 sm:grid-cols-3">
                <Field
                  label="Eyebrow"
                  value={view.eyebrow}
                  onChange={(v) =>
                    setCollectionDrafts((prev) => ({ ...prev, [row.id]: { ...prev[row.id], eyebrow: v } }))
                  }
                />
                <Field
                  label="Title"
                  value={view.title}
                  onChange={(v) =>
                    setCollectionDrafts((prev) => ({ ...prev, [row.id]: { ...prev[row.id], title: v } }))
                  }
                />
                <Field
                  label="Image URL"
                  value={view.image_url}
                  onChange={(v) =>
                    setCollectionDrafts((prev) => ({ ...prev, [row.id]: { ...prev[row.id], image_url: v } }))
                  }
                />
              </div>
              <div className="flex flex-wrap items-center gap-4 border-t border-black/10 pt-3">
                <label className="flex items-center gap-2 text-xs font-medium">
                  Order
                  <input
                    type="number"
                    value={view.sort_order}
                    onChange={(e) =>
                      setCollectionDrafts((prev) => ({
                        ...prev,
                        [row.id]: { ...prev[row.id], sort_order: Number(e.target.value) },
                      }))
                    }
                    className="w-16 rounded-lg border border-black/15 px-2 py-1 text-xs outline-none focus:border-[#a05a39]"
                  />
                </label>
                {view.image_url && (
                  <div className="h-12 w-16 overflow-hidden rounded border border-black/10 bg-[#e9e9e5]">
                    <img src={view.image_url} alt="" className="h-full w-full object-cover" />
                  </div>
                )}
                {dirty && (
                  <button
                    onClick={() => saveCollectionRow(row)}
                    disabled={busy}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#a05a39] px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white transition hover:bg-[#8d4c2f] disabled:opacity-50"
                  >
                    {busy ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />} Save
                  </button>
                )}
                <button
                  onClick={() => void guard(() => deleteCollection(row.id), 'Collection deleted.')}
                  disabled={busy}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-red-300 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 size={11} /> Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
