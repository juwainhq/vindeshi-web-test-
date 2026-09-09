import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeftCircle,
  BadgeCheck,
  Banknote,
  CheckCircle2,
  Clock,
  FileText,
  Lock,
  Package,
  Plus,
  Save,
  Search,
  Settings,
  ShoppingBag,
  Smartphone,
  Trash2,
  XCircle,
} from 'lucide-react';
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
  createSession,
  isSessionValid,
  clearSession,
  getSessionRemainingMs,
  migratePlainTextPassword,
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
  const [isLocked, setIsLocked] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    if (isLockedOut()) {
      setIsLocked(true);
    } else {
      setIsLocked(false);
    }
  }, []);

  useEffect(() => {
    if (!isSessionValid()) {
      setSessionExpired(true);
    }
  }, []);

  useEffect(() => {
    if (sessionExpired) {
      const timer = setTimeout(() => {
        clearSession();
        resetRateLimit();
        setSessionExpired(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [sessionExpired]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLocked) {
      const remaining = getLockoutRemainingMs();
      setError(`Too many failed attempts. Try again in ${Math.ceil(remaining / 1000)}s.`);
      return;
    }

    if (!isSessionValid()) {
      setSessionExpired(true);
      setError('Session expired. Please try again.');
      return;
    }

    const verified = await verifyAdminPassword(password);
    if (verified) {
      createSession();
      resetRateLimit();
      onUnlock();
    } else {
      const { locked, remaining } = recordFailedAttempt();
      setError(locked ? `Too many failed attempts. Try again in ${Math.ceil(remaining / 1000)}s.` : 'Incorrect password.');
    }
  };

  useEffect(() => {
    if (password) {
      const timer = setTimeout(() => setError(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [password]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#171717] px-5">
      {isLocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#171717] rounded-2xl p-8 text-center max-w-sm">
            <Lock size={48} className="mx-auto mb-4 text-[#a05a39]" />
            <h2 className="font-serif text-2xl tracking-tight text-[#171717] mb-2">Account locked</h2>
            <p className="text-black/60 mb-6">
              Too many failed attempts. Please wait before trying again.
            </p>
            <p className="text-xs text-black/40">
              Try again in{' '}
              <span className="font-medium text-[#a05a39]" id="lock-remaining">
                --
              </span> seconds.
            </p>
          </div>
        </div>
      )}

      {!isLocked && (
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm space-y-4 rounded-2xl bg-[#f7f7f5] p-8 text-center"
        >
          {sessionExpired && (
            <p className="text-xs text-black/50 mb-4">
              Session expired. Enter password to continue.
            </p>
          )}

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
            className="w-full rounded-lg border border-black/15 px-3.5 py-3 text-sm text-[#171717] outline-none transition focus:border-[#a05a39]"
          />
          {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-lg bg-[#171717] py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-white transition hover:bg-[#a05a39]"
          >
            Unlock dashboard
          </button>
        </form>
      )}
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
                Photo URLs (one per line — first is the cover)
              </p>
              <textarea
                rows={8}
                value={product.images.join('\n')}
                onChange={(e) =>
                  update(product.id, {
                    images: e.target.value.split('\n').filter((line) => line.trim() !== ''),
                  })
                }
                placeholder={'/images/photo1.jpg\nhttps://example.com/photo2.jpg'}
                className="w-full rounded-lg border border-black/15 px-3 py-2 font-mono text-xs outline-none focus:border-[#a05a39]"
              />
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {product.images.map((image, i) => (
                  <div
                    key={image + i}
                    className="h-16 w-16 shrink-0 overflow-hidden rounded border border-black/10 bg-[#e9e9e5]"
                  >
                    <img src={image} alt="" className="h-full w-full object-cover" />
                  </div>
                ))}
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
                  Stored in this browser's localStorage as a secure hash.
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
  const [unlocked, setUnlocked] = useState(false);
  const [tab, setTab] = useState<Tab>('orders');

  // Migrate any existing plain-text password to hashed version
  useEffect(() => {
    migratePlainTextPassword();
  }, []);

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
              onClick={() => setUnlocked(false)}
              className="inline-flex items-center gap-2 rounded-lg border border-black/15 px-3 py-1.5 text-xs font-semibold transition hover:bg-black/5"
            >
              <Lock size={13} /> Lock
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
