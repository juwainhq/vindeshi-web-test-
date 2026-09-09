import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeftCircle,
  BadgeCheck,
  Banknote,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Lock,
  Package,
  Plus,
  Save,
  Search,
  Settings,
  ShoppingBag,
  Smartphone,
  Trash2,
  Upload,
  X,
  XCircle,
} from 'lucide-react';
import { toCompactDataUrl } from '../lib/image';
import {
  getOrders,
  saveOrders,
  getLocalProducts,
  saveLocalProducts,
  clearLocalProducts,
  setAdminPassword,
  verifyAdminPassword,
  isLockedOut,
  recordFailedAttempt,
  resetRateLimit,
  getLockoutRemainingMs,
  isLoggedIn,
  setLoggedIn,
  resetAdminSession,
  type Order,
  type OrderStatus,
} from '../lib/local-store';
import { useSiteContent } from '../lib/useSiteContent';
import { SiteContentPanel } from '../components/SiteContentPanel';
import type { Product } from '../lib/types';

type Tab = 'orders' | 'inventory' | 'content' | 'settings';

const STATUSES: OrderStatus[] = ['Pending', 'Completed', 'Cancelled'];

const STATUS_STYLES: Record<OrderStatus, string> = {
  Pending: 'bg-amber-100 text-amber-800 border-amber-200',
  Completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Cancelled: 'bg-red-100 text-red-800 border-red-200',
};

const STATUS_ICONS: Record<OrderStatus, typeof Clock> = {
  Pending: Clock,
  Completed: CheckCircle2,
  Cancelled: XCircle,
};

const toNumber = (price: string) => Number(price.replace(/[^0-9.]/g, '')) || 0;
const formatTk = (amount: number) => `Tk ${amount.toLocaleString('en-US')}`;

/* ── Password gate ───────────────────────────────────────────── */

function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [lockRemaining, setLockRemaining] = useState<number>(0);

  const locked = lockRemaining > 0;

  // Live countdown while locked out
  useEffect(() => {
    if (!locked) return;
    setLockRemaining(getLockoutRemainingMs());
    const timer = setInterval(() => {
      const remaining = getLockoutRemainingMs();
      setLockRemaining(remaining);
      if (remaining <= 0) {
        resetRateLimit();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [locked]);

  // Clear the error message once the user starts typing again
  useEffect(() => {
    if (password && error) setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLockedOut()) {
      setLockRemaining(getLockoutRemainingMs());
      return;
    }

    const verified = await verifyAdminPassword(password);
    if (verified) {
      resetRateLimit();
      setLoggedIn(true); // stay logged in on this browser until you log out
      onUnlock();
    } else {
      const { locked: nowLocked } = recordFailedAttempt();
      setError(
        nowLocked
          ? 'Too many failed attempts — you can wait, or use "Reset admin session" below.'
          : 'Incorrect password. Default is "admin123".'
      );
    }
  };

  const handleReset = () => {
    resetAdminSession(); // restores the default password and clears the lockout
    setPassword('');
    setError(null);
    setLockRemaining(0);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#171717] px-5">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-2xl bg-[#f7f7f5] p-8 text-center"
      >
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#a05a39]/10 text-[#a05a39]">
          <Lock size={22} />
        </span>
        <h1 className="font-serif text-2xl tracking-tight text-[#171717]">Admin access</h1>
        <p className="text-xs text-black/50">
          This area is restricted. Enter the admin password to continue.
        </p>
        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(null);
          }}
          placeholder="Password"
          autoFocus
          disabled={locked}
          className={`w-full rounded-lg border px-3.5 py-3 text-sm text-[#171717] outline-none transition ${
            error || locked
              ? 'border-red-400'
              : 'border-black/15 focus:border-[#a05a39]'
          } ${locked ? 'cursor-not-allowed opacity-60' : ''}`}
        />

        {locked ? (
          <p className="text-xs font-semibold text-red-600">
            Too many failed attempts. Try again in{' '}
            {Math.ceil(lockRemaining / 1000)}s — or use the reset button below.
          </p>
        ) : (
          error && <p className="text-xs font-semibold text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={locked}
          className="w-full rounded-lg bg-[#171717] py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-white transition hover:bg-[#a05a39] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Unlock dashboard
        </button>

        {/* Emergency escape hatch — never get stuck on this screen */}
        <button
          type="button"
          onClick={handleReset}
          className="w-full rounded-lg border border-black/15 px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.15em] text-black/55 transition hover:border-[#a05a39] hover:text-[#a05a39]"
        >
          Reset admin session
        </button>
        <p className="text-[10px] leading-4 text-black/40">
          Resetting restores the default password ("admin123") and clears any
          lockout on this browser.
        </p>
      </form>
    </div>
  );
}

/* ── Orders tab ──────────────────────────────────────────────── */

function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>(getOrders());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<'All' | OrderStatus>('All');
  const [search, setSearch] = useState('');

  const updateStatus = (id: string, status: OrderStatus) => {
    const next = orders.map((order) =>
      order.id === id ? { ...order, status } : order
    );
    setOrders(next);
    saveOrders(next);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = filter === 'All' || order.status === filter;
      const matchesSearch =
        !q ||
        order.id.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        order.phone.includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [orders, filter, search]);

  const revenue = orders
    .filter((o) => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-black/10 bg-white p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40">Orders</p>
          <p className="mt-2 font-serif text-3xl">{orders.length}</p>
        </div>
        <div className="rounded-xl border border-black/10 bg-white p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40">Pending</p>
          <p className="mt-2 font-serif text-3xl text-amber-600">
            {orders.filter((o) => o.status === 'Pending').length}
          </p>
        </div>
        <div className="rounded-xl border border-black/10 bg-white p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40">Revenue</p>
          <p className="mt-2 font-serif text-3xl text-emerald-700">{formatTk(revenue)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-black/15 bg-white px-3 py-2">
          <Search size={14} className="text-black/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order, name, phone…"
            className="w-48 text-xs outline-none"
          />
        </div>
        {(['All', ...STATUSES] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`rounded-lg border px-3.5 py-2 text-xs font-bold uppercase tracking-wide transition ${
              filter === status
                ? 'border-[#a05a39] bg-[#a05a39] text-white'
                : 'border-black/15 bg-white text-black/50 hover:border-black/30'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Order list */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-black/15 bg-white/60 px-6 py-14 text-center">
          <ShoppingBag size={26} className="mx-auto text-black/25" />
          <p className="mt-3 font-serif text-xl">No orders yet</p>
          <p className="mt-1 text-xs text-black/45">
            Orders placed at checkout appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => {
            const StatusIcon = STATUS_ICONS[order.status];
            const isOpen = expanded === order.id;
            return (
              <div key={order.id} className="overflow-hidden rounded-xl border border-black/10 bg-white">
                <button
                  onClick={() => setExpanded(isOpen ? null : order.id)}
                  className="flex w-full flex-wrap items-center gap-4 px-5 py-4 text-left transition hover:bg-black/[0.02]"
                >
                  <div className="flex items-center gap-3">
                    <span className={`rounded border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLES[order.status]}`}>
                      <StatusIcon size={11} className="mr-1 inline" />
                      {order.status}
                    </span>
                    <span className="font-mono text-xs font-semibold text-black/60">{order.id}</span>
                  </div>
                  <div className="ml-auto flex flex-wrap items-center gap-6 text-xs">
                    <span className="font-semibold">{order.customerName}</span>
                    <span className="text-black/45">{order.phone}</span>
                    <span className="font-semibold">{formatTk(order.total)}</span>
                    <span className="text-black/40">
                      {new Date(order.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-black/10 bg-[#fafaf8] px-5 py-5">
                    <div className="grid gap-6 sm:grid-cols-2">
                      {/* Customer details */}
                      <div>
                        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-black/40">
                          Customer
                        </p>
                        <dl className="space-y-2 text-xs">
                          <div className="flex gap-2">
                            <dt className="w-20 shrink-0 text-black/45">Name</dt>
                            <dd className="font-semibold">{order.customerName}</dd>
                          </div>
                          <div className="flex gap-2">
                            <dt className="w-20 shrink-0 text-black/45">Phone</dt>
                            <dd className="font-semibold">{order.phone}</dd>
                          </div>
                          <div className="flex gap-2">
                            <dt className="w-20 shrink-0 text-black/45">Email</dt>
                            <dd>{order.email}</dd>
                          </div>
                          <div className="flex gap-2">
                            <dt className="w-20 shrink-0 text-black/45">Address</dt>
                            <dd className="flex-1">{order.address}</dd>
                          </div>
                          <div className="flex gap-2">
                            <dt className="w-20 shrink-0 text-black/45">Payment</dt>
                            <dd className="flex items-center gap-1.5">
                              {order.paymentMethod === 'Cash on Delivery' ? (
                                <Banknote size={12} />
                              ) : (
                                <Smartphone size={12} />
                              )}
                              {order.paymentMethod}
                            </dd>
                          </div>
                        </dl>
                      </div>

                      {/* Items */}
                      <div>
                        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-black/40">
                          Items ({order.items.reduce((sum, item) => sum + item.qty, 0)})
                        </p>
                        <ul className="space-y-3">
                          {order.items.map((item) => (
                            <li key={item.id} className="flex items-center gap-3">
                              <div className="h-12 w-10 shrink-0 overflow-hidden rounded bg-[#e9e9e5]">
                                <img
                                  src={item.image_url}
                                  alt={item.name}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-semibold">{item.name}</p>
                                <p className="text-[10px] text-black/45">
                                  {item.color} · ×{item.qty}
                                </p>
                              </div>
                              <p className="text-xs font-semibold">
                                {formatTk(toNumber(item.price) * item.qty)}
                              </p>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-3 space-y-1 border-t border-black/10 pt-3 text-xs">
                          <div className="flex justify-between text-black/55">
                            <span>Subtotal</span>
                            <span>{formatTk(order.subtotal)}</span>
                          </div>
                          <div className="flex justify-between text-black/55">
                            <span>Delivery</span>
                            <span>{order.deliveryFee === 0 ? 'Free' : formatTk(order.deliveryFee)}</span>
                          </div>
                          <div className="flex justify-between font-semibold">
                            <span>Total</span>
                            <span>{formatTk(order.total)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Status control */}
                    <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-black/10 pt-4">
                      <span className="mr-1 text-[10px] font-bold uppercase tracking-[0.2em] text-black/40">
                        Set status
                      </span>
                      {STATUSES.map((status) => (
                        <button
                          key={status}
                          onClick={() => updateStatus(order.id, status)}
                          className={`rounded-lg border px-3.5 py-2 text-xs font-bold uppercase tracking-wide transition ${
                            order.status === status
                              ? 'border-[#a05a39] bg-[#a05a39] text-white'
                              : 'border-black/15 bg-white text-black/55 hover:border-black/30'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Inventory tab ────────────────────────────────────────────── */

function InventoryTab() {
  const { content } = useSiteContent();
  const dbProducts = content?.products ?? [];

  const [usingLocal, setUsingLocal] = useState(() => getLocalProducts() !== null);
  const [items, setItems] = useState<Product[]>(() => getLocalProducts() ?? []);
  const [savedFlash, setSavedFlash] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [urlEditorId, setUrlEditorId] = useState<string | null>(null);

  // Load DB products into the editor when local list is empty
  useEffect(() => {
    if (!usingLocal && items.length === 0 && dbProducts.length > 0) {
      setItems(dbProducts);
    }
  }, [usingLocal, items.length, dbProducts]);

  const persist = (next: Product[]) => {
    setItems(next);
    saveLocalProducts(next);
    setUsingLocal(true);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  };

  const update = (id: string, patch: Partial<Product>) => {
    persist(items.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  /** Uploads picked files, converts them to compact data URLs, and
   *  appends them to the product's photo list. */
  const handleFiles = async (id: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingId(id);
    try {
      const converted: string[] = [];
      for (const file of Array.from(files)) {
        converted.push(await toCompactDataUrl(file));
      }
      update(id, {
        images: [...(items.find((p) => p.id === id)?.images ?? []), ...converted],
      });
    } finally {
      setUploadingId(null);
    }
  };

  const removeImage = (id: string, index: number) => {
    const product = items.find((p) => p.id === id);
    if (!product) return;
    update(id, { images: product.images.filter((_, i) => i !== index) });
  };

  const addNew = () => {
    const created: Product = {
      id: `local-${Date.now().toString(36)}`,
      name: 'New Product',
      category: 'Women',
      price: '0',
      color: 'Black',
      badge: null,
      description: '',
      images: ['/images/20260718_160025.jpg'],
      sort_order: items.length,
      is_visible: true,
    };
    persist([...items, created]);
  };

  const remove = (id: string) => {
    persist(items.filter((p) => p.id !== id));
  };

  const resetToDb = () => {
    clearLocalProducts();
    setItems(dbProducts);
    setUsingLocal(false);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/10 bg-white p-4">
        <div>
          <p className="text-xs font-semibold">
            {usingLocal ? 'Using your local inventory' : 'Using database products'}
          </p>
          <p className="mt-0.5 text-[10px] text-black/45">
            Changes save to this browser instantly and override the storefront.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={addNew}
            className="inline-flex items-center gap-2 rounded-lg bg-[#171717] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-[#a05a39]"
          >
            <Plus size={14} /> Add product
          </button>
          <button
            onClick={resetToDb}
            className="inline-flex items-center gap-2 rounded-lg border border-black/15 px-4 py-2 text-xs font-bold uppercase tracking-wide transition hover:bg-black/5"
          >
            <ArrowLeftCircle size={14} /> Reset to database
          </button>
        </div>
      </div>

      {savedFlash && (
        <p className="text-xs font-semibold text-emerald-600">Saved to this browser.</p>
      )}

      {items.map((product) => (
        <div key={product.id} className="space-y-3 rounded-xl border border-black/10 bg-white p-5">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Left: details */}
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-black/40">
                  Name
                </label>
                <input
                  value={product.name}
                  onChange={(e) => update(product.id, { name: e.target.value })}
                  className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-[#a05a39]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-black/40">
                    Price
                  </label>
                  <input
                    value={product.price}
                    onChange={(e) => update(product.id, { price: e.target.value })}
                    className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-[#a05a39]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-black/40">
                    Category
                  </label>
                  <select
                    value={product.category}
                    onChange={(e) => update(product.id, { category: e.target.value })}
                    className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-[#a05a39]"
                  >
                    <option>Women</option>
                    <option>Men</option>
                    <option>Travel</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-black/40">
                    Color
                  </label>
                  <input
                    value={product.color}
                    onChange={(e) => update(product.id, { color: e.target.value })}
                    className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-[#a05a39]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-black/40">
                    Badge
                  </label>
                  <input
                    value={product.badge ?? ''}
                    onChange={(e) => update(product.id, { badge: e.target.value || null })}
                    className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-[#a05a39]"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-black/40">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={product.description}
                  onChange={(e) => update(product.id, { description: e.target.value })}
                  className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-[#a05a39]"
                />
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={product.is_visible}
                  onChange={(e) => update(product.id, { is_visible: e.target.checked })}
                  className="h-4 w-4 accent-[#a05a39]"
                />
                <span className="text-xs font-medium">Visible on storefront</span>
              </label>
            </div>

            {/* Right: photos */}
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-black/40">
                Photos (first is the cover)
              </p>

              {/* Thumbnails with delete buttons */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {product.images.length === 0 && (
                  <div className="flex h-16 w-16 items-center justify-center rounded border border-dashed border-black/15 text-[10px] text-black/30">
                    No photos
                  </div>
                )}
                {product.images.map((image, i) => (
                  <div
                    key={image + i}
                    className="group relative h-16 w-16 shrink-0 overflow-hidden rounded border border-black/10 bg-[#e9e9e5]"
                  >
                    <img src={image} alt="" className="h-full w-full object-cover" />
                    {i === 0 && (
                      <span className="absolute bottom-0 left-0 right-0 bg-[#171717]/80 px-1 py-0.5 text-center text-[8px] font-bold uppercase tracking-wide text-white">
                        Cover
                      </span>
                    )}
                    <button
                      type="button"
                      title="Remove photo"
                      onClick={() => removeImage(product.id, i)}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#171717] text-white opacity-0 transition hover:bg-[#a05a39] group-hover:opacity-100"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Upload button */}
              <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-black/20 bg-[#fafaf8] px-4 py-4 text-xs font-bold uppercase tracking-wide text-black/55 transition hover:border-[#a05a39] hover:text-[#a05a39]">
                {uploadingId === product.id ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Processing photos…
                  </>
                ) : (
                  <>
                    <Upload size={15} /> Upload photo(s)
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={async (e) => {
                    const input = e.currentTarget;
                    await handleFiles(product.id, e.target.files);
                    input.value = ''; // allow re-picking the same file
                  }}
                />
              </label>

              {/* Collapsible URL fallback */}
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() =>
                    setUrlEditorId(urlEditorId === product.id ? null : product.id)
                  }
                  className="text-[10px] font-semibold uppercase tracking-wide text-black/40 underline-offset-2 transition hover:text-[#a05a39] hover:underline"
                >
                  {urlEditorId === product.id ? '− Hide' : '+ Paste image URLs manually'}
                </button>
                {urlEditorId === product.id && (
                  <textarea
                    rows={4}
                    value={product.images.join('\n')}
                    onChange={(e) =>
                      update(product.id, {
                        images: e.target.value
                          .split('\n')
                          .filter((line) => line.trim() !== ''),
                      })
                    }
                    placeholder={'/images/photo1.jpg\nhttps://example.com/photo2.jpg'}
                    className="mt-2 w-full rounded-lg border border-black/15 px-3 py-2 font-mono text-xs outline-none focus:border-[#a05a39]"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 border-t border-black/10 pt-3">
            <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">
              <BadgeCheck size={12} className="mr-1 inline" />
              Saved automatically
            </span>
            <button
              onClick={() => remove(product.id)}
              className="ml-auto inline-flex items-center gap-2 rounded-lg border border-red-300 px-3.5 py-2 text-xs font-bold uppercase tracking-wide text-red-600 transition hover:bg-red-50"
            >
              <Trash2 size={13} /> Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Settings tab ─────────────────────────────────────────────── */

function SettingsTab() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      if (password.length < 4) {
        setMessage('Password must be at least 4 characters.');
        return;
      }
      if (password !== confirm) {
        setMessage('Passwords do not match.');
        return;
      }
      await setAdminPassword(password);
      setMessage('Password updated.');
      setPassword('');
      setConfirm('');
    };

  return (
    <div className="max-w-md space-y-5">
      <div className="rounded-xl border border-black/10 bg-white p-6">
        <h2 className="font-serif text-xl tracking-tight">Admin password</h2>
        <p className="mt-1 text-xs text-black/50">
          Stored in this browser's localStorage as a hash. Matching is
          case-insensitive. Default: <span className="font-semibold">admin123</span> —
          reset it anytime from the login screen.
        </p>
        <form className="mt-5 space-y-4" onSubmit={handleSave}>
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-black/40">
              New password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-[#a05a39]"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-black/40">
              Confirm new password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-lg border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-[#a05a39]"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-[#171717] px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-[#a05a39]"
          >
            <Save size={14} /> Update password
          </button>
          {message && <p className="text-xs font-semibold text-[#a05a39]">{message}</p>}
        </form>
      </div>
    </div>
  );
}

/* ── Dashboard shell ──────────────────────────────────────────── */

export function AdminDashboard() {
  // Stay logged in on this browser until you explicitly log out.
  const [unlocked, setUnlocked] = useState(isLoggedIn);
  const [tab, setTab] = useState<Tab>('orders');

  if (!unlocked) {
    return <PasswordGate onUnlock={() => setUnlocked(true)} />;
  }

  const tabs: { id: Tab; label: string; icon: typeof Package }[] = [
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'content', label: 'Site Content', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-[#171717]">
      <header className="sticky top-0 z-10 border-b border-black/10 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <div>
            <h1 className="font-serif text-xl tracking-tight">Admin dashboard</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-black/40">Vindeshi</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setLoggedIn(false); // manual log out — clears the saved flag
                setUnlocked(false);
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-black/15 px-3 py-1.5 text-xs font-semibold transition hover:bg-black/5"
            >
              <Lock size={13} /> Log out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8">
        <div className="mb-6 flex gap-1 overflow-x-auto border-b border-black/10">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide transition ${
                tab === t.id
                  ? 'border-[#a05a39] text-[#a05a39]'
                  : 'border-transparent text-black/45 hover:text-black'
              }`}
            >
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>

        {tab === 'orders' && <OrdersTab />}
        {tab === 'inventory' && <InventoryTab />}
        {tab === 'content' && <SiteContentPanel />}
        {tab === 'settings' && <SettingsTab />}
      </div>
    </div>
  );
}
